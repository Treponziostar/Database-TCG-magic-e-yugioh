# DB Carte Magic e Yu-Gi-Oh!

Web app full-stack per catalogare la propria collezione di carte collezionabili
**Magic: The Gathering** e **Yu-Gi-Oh!**: si cerca una carta per nome, si
sceglie la stampa o l'illustrazione giusta e la si aggiunge alla collezione,
tenendo traccia delle quantità.

> Progetto personale realizzato per imparare lo sviluppo full-stack con React,
> Node.js ed Express. È ancora in sviluppo: la parte grafica è in lavorazione.

## Funzionalità

- **Ricerca unificata** su due fonti esterne: [Scryfall](https://scryfall.com/docs/api)
  per Magic e [YGOPRODeck](https://ygoprodeck.com/api-guide/) per Yu-Gi-Oh!.
  Il backend converte le due risposte in un unico formato comune.
- **Tutte le versioni di una carta**: ogni stampa di Magic e ogni illustrazione
  di Yu-Gi-Oh! compare come risultato separato.
- **Gestione della collezione** (CRUD): aggiunta (se la carta è già presente ne
  aumenta la quantità), pulsanti +/−, rimozione, filtro per gioco e per tipo di carta.
- **Ingrandimento della carta** in una finestra modale (`<dialog>` nativo),
  che si chiude con Esc, con il pulsante o cliccando sullo sfondo.
- **Accessibilità**: progettata seguendo le WCAG 2.2 AA (etichette ARIA, ruoli
  per i messaggi di stato, navigazione da tastiera, lint con `jsx-a11y`).

## Stack

| Livello  | Tecnologie |
|----------|------------|
| Frontend | React 19, Vite, oxlint |
| Backend  | Node.js, Express 5 |
| Database | SQLite (better-sqlite3) |
| Sicurezza | helmet, CORS limitato, express-rate-limit, validazione degli input |

## Sicurezza

L'API non si fida mai dei dati ricevuti dal client:

- validazione di ogni campo del body (gioco ammesso solo da una lista chiusa,
  quantità intera tra 1 e 9999, lunghezza massima dei testi, URL delle immagini
  solo `https://`) e dell'`id` presente nell'URL;
- query SQL sempre parametrizzate (prepared statement);
- CORS limitato all'origine del client e header di sicurezza tramite `helmet`;
- limite alle richieste di ricerca (60 al minuto), per rispettare i limiti delle API esterne;
- body JSON limitato a 10 KB;
- il server ascolta solo su `127.0.0.1`: l'API non ha autenticazione, quindi
  non è esposta alla rete locale.

## API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET    | `/api/search?game=magic\|yugioh&q=NOME` | Cerca carte sulle API esterne |
| GET    | `/api/collection?game=...` | Elenco delle carte possedute (filtro per gioco facoltativo) |
| POST   | `/api/collection` | Aggiunge una carta, o ne aumenta la quantità se è già presente |
| PUT    | `/api/collection/:id` | Aggiornamento parziale di quantità, condizione e note |
| DELETE | `/api/collection/:id` | Rimuove una carta |

## Avvio in locale

Requisiti: Node.js 20 o superiore.

```bash
# 1. Backend (http://127.0.0.1:3001)
cd server
npm install
npm run dev

# 2. Frontend (http://localhost:5173), in un secondo terminale
cd client
npm install
npm run dev
```

Il database SQLite (`server/db/collection.db`) viene creato in automatico al
primo avvio. Il client inoltra le chiamate `/api` al backend tramite il proxy di Vite.

Variabili d'ambiente facoltative in `server/.env`:

```env
PORT=3001
HOST=127.0.0.1
CLIENT_ORIGIN=http://localhost:5173
```

## Struttura

```
client/          frontend React + Vite
  src/api.js         chiamate al backend
  src/components/    SearchView, CollectionView
server/          backend Express
  routes/            search.js (API esterne), collection.js (CRUD)
  db/index.js        connessione SQLite e schema
```

## Prossimi passi

- Completare la parte grafica (pulsanti, form, messaggi di stato)
- Distinguere "nessun risultato" da "errore di rete" nella ricerca
- Mostrare nei risultati di ricerca quante copie si possiedono già

---

Dati delle carte forniti da Scryfall e YGOPRODeck. Magic: The Gathering è un
marchio di Wizards of the Coast; Yu-Gi-Oh! è un marchio di Konami. Progetto
non ufficiale e senza scopo di lucro.
