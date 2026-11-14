import { useState } from "react";
import { tipoCartaMagic, tipoCartaYugioh } from "../costanti";

function CollectionView({
  collection,
  loading,
  error,
  onChangeQuantity,
  onRemove,
  onOpen,
}) {
  const [game, setGame] = useState("magic");
  const [cardFilter, setFilter] = useState("");

  if (loading) {
    return <p role="status">Caricamento collezione...</p>;
  } else if (collection.length === 0 && !error) {
    return <p role="status">Non hai ancora carte in collezione</p>;
  }

  const listaFiltri = game === "magic" ? tipoCartaMagic : tipoCartaYugioh;
  const collezioneFiltrata = collection.filter((card) => {
    const filtroTipo =
      cardFilter === "" || card.type_line?.includes(cardFilter);
    const filtroGioco = card.game === game;

    return filtroTipo && filtroGioco;
  });
  return (
    <>
      {error && <p role="alert">Errore: {error}</p>}

      <div>
        <label htmlFor="gioco-collezione">Seleziona gioco</label>
        <select
          id="gioco-collezione"
          value={game}
          onChange={(e) => {
            setGame(e.target.value);
            setFilter("");
          }}
        >
          <option value="magic">Magic</option>
          <option value="yugioh">Yugioh</option>
        </select>
      </div>

      <div>
        <label htmlFor="filtro-collezione">Filtra carte</label>
        <select
          id="filtro-collezione"
          value={cardFilter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">nessun filtro attivo</option>
          {listaFiltri.map((filter) => (
            <option key={filter} value={filter}>
              {filter}
            </option>
          ))}
        </select>
      </div>

      {collezioneFiltrata.length === 0 && (
        <p role="status">Nessuna carta corrisponde ai filtri selezionati.</p>
      )}

      <ul className="collection-grid">
        {collezioneFiltrata.map((card) => (
          <li key={`${card.game}-${card.card_id}`} className="card-item">
            <button
              type="button"
              className="card-zoom"
              onClick={() =>
                onOpen({ name: card.name, imageUrl: card.image_url })
              }
              aria-label={`Ingrandisci ${card.name}`}
            >
              <img src={card.image_url} alt={card.name}></img>
            </button>
            <p>{card.name}</p>
            <p>Quantità: {card.quantity}</p>
            {card.condition && <p>Condizione: {card.condition}</p>}
            {card.notes && <p>{card.notes}</p>}
            <button
              onClick={() => onChangeQuantity(card, 1)}
              aria-label={`Aggiungi una copia di ${card.name}`}
            >
              +
            </button>
            <button
              onClick={() => onChangeQuantity(card, -1)}
              aria-label={`Togli una copia di ${card.name}`}
            >
              -
            </button>
            <button
              onClick={() => onRemove(card.id)}
              aria-label={`Rimuovi ${card.name} dalla collezione`}
            >
              Rimuovi carta
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default CollectionView;
