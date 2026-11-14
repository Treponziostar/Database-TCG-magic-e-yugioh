// Punto unico da cui i componenti importano le chiamate.
// - Modalita' normale: usa il backend Express (api-server.js).
// - Modalita' demo (`npm run dev:demo` / `npm run build:demo`): niente
//   server, ricerca diretta sulle API pubbliche e collezione nel
//   localStorage del browser (api-demo.js). Le funzioni hanno la stessa
//   firma, quindi i componenti non cambiano.
import * as server from './api-server'
import * as demo from './api-demo'

export const IS_DEMO = import.meta.env.VITE_DEMO === 'true'

const api = IS_DEMO ? demo : server

export const {
  searchCards,
  getCollection,
  addToCollection,
  updateCollectionItem,
  removeFromCollection,
} = api
