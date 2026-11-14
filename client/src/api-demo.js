// Versione demo delle API: stesse funzioni e stessi dati di api-server.js,
// ma senza backend. La ricerca chiama direttamente Scryfall e YGOPRODeck
// (entrambe permettono chiamate dal browser), la collezione vive nel
// localStorage di chi visita la pagina: ognuno ha la sua, nessuno vede o
// modifica quella degli altri.

const GIOCHI = ['magic', 'yugioh']
const QUANTITA_MASSIMA = 9999
const CHIAVE_STORAGE = 'demo-collezione-carte'

// --- Ricerca (stessa normalizzazione di server/routes/search.js) ---

function normalizzaCartaMagic(carta) {
  return {
    game: 'magic',
    externalId: carta.id,
    name: carta.name,
    imageUrl:
      carta.image_uris?.normal ?? carta.card_faces?.[0]?.image_uris?.normal,
    setName: carta.set_name,
    typeLine: carta.type_line ?? carta.card_faces?.[0]?.type_line,
    sourceUrl: carta.scryfall_uri,
  }
}

function normalizzaCartaYugioh(carta) {
  return (carta.card_images ?? []).map((immagine) => ({
    game: 'yugioh',
    externalId: String(immagine.id),
    name: carta.name,
    imageUrl: immagine.image_url,
    setName: carta.card_sets?.[0]?.set_name ?? null,
    typeLine: carta.type,
    sourceUrl: carta.ygoprodeck_url,
  }))
}

export async function searchCards(game, query) {
  if (!query) throw new Error("parametro 'q' mancante")

  let url
  if (game === 'magic') {
    url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`
  } else if (game === 'yugioh') {
    url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(query)}`
  } else {
    throw new Error('gioco errato')
  }

  let res
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    throw new Error('Impossibile contattare il servizio di ricerca')
  }

  // Scryfall risponde 404 e YGOPRODeck 400 quando nessuna carta corrisponde:
  // non e' un errore, e' una ricerca vuota.
  const nessunRisultato = game === 'magic' ? 404 : 400
  if (res.status === nessunRisultato) return []
  if (!res.ok) throw new Error(`Errore del servizio di ricerca (${res.status})`)

  const dati = await res.json()
  const carte =
    game === 'magic'
      ? dati.data.map(normalizzaCartaMagic)
      : dati.data.flatMap(normalizzaCartaYugioh)

  // Solo immagini https: un URL strano non finisce mai in un <img>
  return carte.filter((carta) => urlHttps(carta.imageUrl))
}

// --- Collezione nel localStorage ---

function urlHttps(valore) {
  return typeof valore === 'string' && valore.startsWith('https://') && valore.length <= 500
}

function testoValido(valore, lunghezzaMassima) {
  return valore === null || valore === undefined ||
    (typeof valore === 'string' && valore.length <= lunghezzaMassima)
}

// Il localStorage e' modificabile a mano da chiunque (DevTools): si tratta
// come un input non fidato, esattamente come il body sul server.
function rigaValida(riga) {
  return (
    riga !== null &&
    typeof riga === 'object' &&
    Number.isInteger(riga.id) && riga.id > 0 &&
    GIOCHI.includes(riga.game) &&
    typeof riga.card_id === 'string' && riga.card_id.length > 0 && riga.card_id.length <= 100 &&
    testoValido(riga.name, 200) &&
    urlHttps(riga.image_url) &&
    testoValido(riga.type_line, 100) &&
    Number.isInteger(riga.quantity) && riga.quantity >= 1 && riga.quantity <= QUANTITA_MASSIMA &&
    testoValido(riga.condition, 50) &&
    testoValido(riga.notes, 1000)
  )
}

// Legge la collezione; se lo storage e' vuoto, corrotto o bloccato
// (navigazione privata) riparte da una collezione vuota invece di rompersi.
function leggi() {
  try {
    const dati = JSON.parse(localStorage.getItem(CHIAVE_STORAGE) ?? '[]')
    return Array.isArray(dati) ? dati.filter(rigaValida) : []
  } catch {
    return []
  }
}

function scrivi(collezione) {
  try {
    localStorage.setItem(CHIAVE_STORAGE, JSON.stringify(collezione))
  } catch {
    throw new Error('Impossibile salvare: il browser blocca il salvataggio locale')
  }
}

export async function getCollection(game) {
  const collezione = leggi()
  return game ? collezione.filter((riga) => riga.game === game) : collezione
}

// Come POST /api/collection: se la carta c'e' gia' ne aumenta la quantita'
export async function addToCollection(card) {
  const nuova = {
    game: card.game,
    card_id: card.card_id,
    name: card.name ?? null,
    image_url: card.image_url,
    type_line: card.type_line ?? null,
    quantity: card.quantity ?? 1,
    condition: card.condition ?? null,
    notes: card.notes ?? null,
  }

  const collezione = leggi()
  const esistente = collezione.find(
    (riga) => riga.game === nuova.game && riga.card_id === nuova.card_id,
  )

  let salvata
  if (esistente) {
    salvata = { ...esistente, quantity: esistente.quantity + nuova.quantity }
  } else {
    const idMassimo = collezione.reduce((max, riga) => Math.max(max, riga.id), 0)
    salvata = { id: idMassimo + 1, ...nuova }
  }

  if (!rigaValida(salvata)) throw new Error('Dati della carta non validi')

  scrivi(
    esistente
      ? collezione.map((riga) => (riga.id === salvata.id ? salvata : riga))
      : [...collezione, salvata],
  )
  return salvata
}

// Come PUT /api/collection/:id: update parziale, i campi assenti restano
export async function updateCollectionItem(id, data) {
  const collezione = leggi()
  const esistente = collezione.find((riga) => riga.id === id)
  if (!esistente) throw new Error('nessuna carta trovata')

  const modificata = { ...esistente }
  for (const campo of ['quantity', 'condition', 'notes']) {
    if (data[campo] !== undefined) modificata[campo] = data[campo]
  }

  if (!rigaValida(modificata)) throw new Error('Dati della carta non validi')

  scrivi(collezione.map((riga) => (riga.id === id ? modificata : riga)))
  return modificata
}

export async function removeFromCollection(id) {
  const collezione = leggi()
  if (!collezione.some((riga) => riga.id === id)) {
    throw new Error('Carta non trovata')
  }
  scrivi(collezione.filter((riga) => riga.id !== id))
  return null
}
