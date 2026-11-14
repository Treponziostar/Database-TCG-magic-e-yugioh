const BASE_URL = '/api'

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Errore ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

// GET /api/search?game=magic|yugioh&q=NOME -> array di carte normalizzate
// (game, externalId, name, imageUrl, setName, typeLine, sourceUrl)
export function searchCards(game, query) {
  return request(`/search?game=${game}&q=${encodeURIComponent(query)}`)
}

// GET /api/collection?game=... (game opzionale) -> array carte possedute
export function getCollection(game) {
  const qs = game ? `?game=${encodeURIComponent(game)}` : ''
  return request(`/collection${qs}`)
}

// POST /api/collection -> aggiunge una carta, o incrementa la quantita' se
// esiste gia' (game + card_id). Body: { game, card_id, name, image_url, quantity }
export function addToCollection(card) {
  return request('/collection', {
    method: 'POST',
    body: JSON.stringify(card),
  })
}

// PUT /api/collection/:id -> aggiorna quantity/condition/notes.
// Update parziale (dal 2026-09-05): manda solo i campi che vuoi cambiare,
// quelli assenti restano invariati. Passa null per svuotare un campo.
export function updateCollectionItem(id, data) {
  return request(`/collection/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// DELETE /api/collection/:id
export function removeFromCollection(id) {
  return request(`/collection/${id}`, { method: 'DELETE' })
}
