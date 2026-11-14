const express = require("express");
const router = express.Router();

function normalizzaCartaMagic(carta) {
  return {
    game: "magic",
    externalId: carta.id,
    name: carta.name,
    imageUrl:
      carta.image_uris?.normal ?? carta.card_faces?.[0]?.image_uris?.normal,
    setName: carta.set_name,
    typeLine: carta.type_line ?? carta.card_faces?.[0]?.type_line,
    sourceUrl: carta.scryfall_uri,
  };
}
function normalizzaCartaYugioh(carta) {
  return (carta.card_images ?? []).map((immagine) => {
    return {
      game: "yugioh",
      externalId: String(immagine.id),
      name: carta.name,
      imageUrl: immagine.image_url,
      setName: carta.card_sets?.[0]?.set_name ?? null,
      typeLine: carta.type,
      sourceUrl: carta.ygoprodeck_url,
    };
  });
}

// GET /api/search?game=magic|yugioh&q=NOME_CARTA
router.get("/", async (req, res) => {
  const { game, q } = req.query;

  if (!q) {
    res.status(400).json({ error: "parametro 'q' mancante" });
    return;
  }

  if (game === "magic") {
    try {
      const apiRes = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints`,
        {
          headers: {
            "User-Agent": "DBCarteMagicYugioh/1.0",
            Accept: "application/json",
          },
        },
      );
      if (!apiRes.ok) throw new Error(`Errore Scryfall: ${apiRes.status}`);
      const dati = await apiRes.json();

     const magicNormalizzata = dati.data.map(normalizzaCartaMagic);

      res.json(magicNormalizzata);
    } catch (err) {
      console.error(err)
      res.status(502).json({ error: "impossibile contattare scryfall" });
    }
    return;
  } else if (game === "yugioh") {
    try {
      const apiRes = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(q)}`,
      );
      if (!apiRes.ok) throw new Error(`Errore YGOPRODeck: ${apiRes.status}`);
      const dati = await apiRes.json();

     const yugiohNormalizzata = dati.data.flatMap(normalizzaCartaYugioh);

      res.json(yugiohNormalizzata);
    } catch (err) {
      res.status(502).json({ error: "Impossibile contattare YGOPRODeck" });
    }
    return;
  } else {
    res.status(400).json({ error: "gioco errato" });
    return;
  }
});

module.exports = router;
