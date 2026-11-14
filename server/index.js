require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const searchRoutes = require('./routes/search');
const collectionRoutes = require('./routes/collection');

const app = express();

// Header di sicurezza standard (X-Content-Type-Options, ecc.)
app.use(helmet());

// CORS solo per il client Vite: nessun altro sito puo' chiamare l'API dal
// browser. Con il proxy di Vite il client non ne ha nemmeno bisogno, ma
// serve se si chiama http://localhost:3001 direttamente.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_ORIGIN }));

// Body JSON al massimo di 10 KB: una carta e' molto meno
app.use(express.json({ limit: '10kb' }));

// La ricerca inoltra richieste a Scryfall/YGOPRODeck a nome nostro: si limita
// per non farsi bloccare da loro (Scryfall chiede al massimo 10 req/s)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe ricerche, riprova tra un minuto' },
});

app.use('/api/search', searchLimiter, searchRoutes);
app.use('/api/collection', collectionRoutes);

const PORT = process.env.PORT || 3001;
// Solo 127.0.0.1: il server risponde soltanto a questo computer, non a chi
// e' sulla stessa rete (l'API non ha autenticazione)
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`Server in ascolto su http://${HOST}:${PORT}`);
});
