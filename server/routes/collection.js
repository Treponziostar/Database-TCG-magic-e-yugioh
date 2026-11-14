const express = require("express");
const router = express.Router();
const db = require("../db");

const GIOCHI = ["magic", "yugioh"];
const QUANTITA_MASSIMA = 9999;

function valoreDaScrivere(valoreRicevuto, valoreAttuale) {
  if (valoreRicevuto === undefined) {
    return valoreAttuale;
  } else {
    return valoreRicevuto;
  }
}

// --- Validazione del body: il server non si fida mai del client ---
// Ogni funzione restituisce un messaggio d'errore (stringa) se il valore non
// va bene, altrimenti null. `undefined` = campo non mandato: qui si accetta
// sempre, e' la route a decidere se un campo e' obbligatorio.

function validaTesto(valore, nomeCampo, lunghezzaMassima, { nullable = false } = {}) {
  if (valore === undefined) return null;
  if (valore === null) {
    return nullable ? null : `${nomeCampo} non puo' essere null`;
  }
  if (typeof valore !== "string") return `${nomeCampo} deve essere una stringa`;
  if (valore.length > lunghezzaMassima) {
    return `${nomeCampo} troppo lungo (massimo ${lunghezzaMassima} caratteri)`;
  }
  return null;
}

function validaQuantita(valore) {
  if (valore === undefined) return null;
  if (!Number.isInteger(valore) || valore < 1 || valore > QUANTITA_MASSIMA) {
    return `quantity deve essere un intero tra 1 e ${QUANTITA_MASSIMA}`;
  }
  return null;
}

function validaUrlImmagine(valore) {
  if (valore === undefined || valore === null) return null;
  if (typeof valore !== "string" || !valore.startsWith("https://")) {
    return "image_url deve essere un URL https://";
  }
  if (valore.length > 500) return "image_url troppo lungo";
  return null;
}

// Restituisce il primo errore trovato nel body, o null se e' tutto valido.
// `completo: true` (POST) controlla anche game/card_id/name/image_url/type_line;
// `completo: false` (PUT) solo i campi modificabili (quantity, condition, notes).
function validaBody(body, { completo }) {
  const controlli = [];

  if (completo) {
    controlli.push(
      GIOCHI.includes(body.game)
        ? null
        : `game deve essere uno tra: ${GIOCHI.join(", ")}`,
      typeof body.card_id === "string" && body.card_id.length > 0
        ? null
        : "card_id deve essere una stringa non vuota",
      validaTesto(body.card_id, "card_id", 100),
      validaTesto(body.name, "name", 200),
      validaUrlImmagine(body.image_url),
      validaTesto(body.type_line, "type_line", 100, { nullable: true }),
    );
  }

  controlli.push(
    validaQuantita(body.quantity),
    validaTesto(body.condition, "condition", 50, { nullable: true }),
    validaTesto(body.notes, "notes", 1000, { nullable: true }),
  );

  return controlli.find((errore) => errore !== null) ?? null;
}

// L'id nell'URL arriva sempre come stringa: deve essere un intero positivo
function idValido(id) {
  return /^[1-9]\d*$/.test(id);
}

// GET /api/collection - lista delle carte possedute
router.get("/", async (req, res) => {
  const { game } = req.query;

  if (game !== undefined && !GIOCHI.includes(game)) {
    res
      .status(400)
      .json({ error: `game deve essere uno tra: ${GIOCHI.join(", ")}` });
    return;
  }

  try {
    let righe;

    if (game) {
      righe = db
        .prepare("SELECT * FROM collezione_carte WHERE game = ?")
        .all(game);
    } else {
      righe = db.prepare("SELECT * FROM collezione_carte").all();
    }
    res.json(righe);
  } catch (err) {
    res.status(500).json({ error: "Impossibile leggere la collezione" });
  }
});

// POST /api/collection - aggiungi una carta alla collezione
router.post("/", async (req, res) => {
  const {
    game,
    card_id,
    name,
    image_url,
    type_line,
    quantity,
    condition,
    notes,
  } = req.body;

  if (!game || !card_id) {
    res
      .status(400)
      .json({ error: "dati mancanti: game e card_id sono obbligatori" });
    return;
  }

  const erroreBody = validaBody(req.body, { completo: true });
  if (erroreBody) {
    res.status(400).json({ error: erroreBody });
    return;
  }

  try {
    const esistente = db
      .prepare("SELECT * FROM collezione_carte WHERE game = ? AND card_id = ?")
      .get(game, card_id);

    let idRiga;

    if (esistente) {
      db.prepare(
        "UPDATE collezione_carte SET quantity = quantity + ?, type_line = coalesce(?, type_line) WHERE id = ?",
      ).run(quantity ?? 1, type_line ?? null, esistente.id);
      idRiga = esistente.id;
    } else {
      const risultato = db
        .prepare(
          "INSERT INTO collezione_carte (game, card_id, name, image_url, type_line, quantity, condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          game,
          card_id,
          name,
          image_url,
          type_line,
          quantity ?? 1,
          condition,
          notes,
        );
      idRiga = risultato.lastInsertRowid;
    }

    const cartaSalvata = db
      .prepare("SELECT * FROM collezione_carte WHERE id = ?")
      .get(idRiga);
    res.status(201).json(cartaSalvata);
  } catch (err) {
    res.status(500).json({ error: "Impossibile salvare la carta" });
  }
});

// PUT /api/collection/:id - modifica quantita'/condizione
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity, condition, notes } = req.body;

  if (!idValido(id)) {
    res.status(400).json({ error: "id non valido" });
    return;
  }

  const erroreBody = validaBody(req.body, { completo: false });
  if (erroreBody) {
    res.status(400).json({ error: erroreBody });
    return;
  }

  try {
    const cartaEsistente = db
      .prepare("SELECT * FROM collezione_carte WHERE id = ?")
      .get(id);

    if (!cartaEsistente) {
      res.status(404).json({ error: "nessuna carta trovata" });
      return;
    }

    const cardQuantity = valoreDaScrivere(quantity, cartaEsistente.quantity);
    const cardCondition = valoreDaScrivere(condition, cartaEsistente.condition);
    const cardNotes = valoreDaScrivere(notes, cartaEsistente.notes);

    db.prepare(
      "UPDATE collezione_carte SET quantity = ?, condition = ?, notes = ? WHERE id = ?",
    ).run(cardQuantity, cardCondition, cardNotes, id);

    const cartaModificata = db
      .prepare("SELECT * FROM collezione_carte WHERE id = ?")
      .get(id);
    res.status(200).json(cartaModificata);
  } catch (err) {
    res.status(500).json({ error: "Impossibile salvare la carta" });
  }
});

// DELETE /api/collection/:id - rimuovi carta dalla collezione
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!idValido(id)) {
    res.status(400).json({ error: "id non valido" });
    return;
  }

  try {
    const risultato = db
      .prepare("DELETE FROM collezione_carte WHERE id = ?")
      .run(id);

    if (risultato.changes === 0) {
      res.status(404).json({ error: "Carta non trovata" });
      return;
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).json({ error: "Impossibile eliminare carta" });
  }
});

module.exports = router;
