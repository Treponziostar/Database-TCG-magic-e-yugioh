const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "collection.db"));

db.exec(`
    CREATE TABLE IF NOT EXISTS collezione_carte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT NOT NULL,
    card_id TEXT NOT NULL, -- externalId
    name TEXT,
    image_url TEXT,
    type_line TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition TEXT,
    notes TEXT,
    UNIQUE(game, card_id))
    `);

// Migrazione: aggiunge type_line ai database creati prima di questa colonna
// (CREATE TABLE IF NOT EXISTS non modifica una tabella gia' esistente).
const colonne = db.prepare("PRAGMA table_info(collezione_carte)").all();
const haTypeLine = colonne.some((colonna) => colonna.name === "type_line");
if (!haTypeLine) {
  db.exec("ALTER TABLE collezione_carte ADD COLUMN type_line TEXT");
}

module.exports = db;
