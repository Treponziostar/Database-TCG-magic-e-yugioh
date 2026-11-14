import { useState } from "react";
import { searchCards } from "../api";
import { tipoCartaMagic, tipoCartaYugioh } from "../costanti";

function SearchView({ onAdd, onOpen }) {
  const [game, setGame] = useState("magic");
  const [query, setQuery] = useState("");
  const [cardFilter, setFilter] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function resetForm() {
    setQuery("");
  }
  async function sendForm(e) {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      const trovate = await searchCards(game, query);
      setResults(trovate);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const listaFiltri = game === "magic" ? tipoCartaMagic : tipoCartaYugioh;
  const risultatiFiltrati = results.filter(
    (card) => cardFilter === "" || card.typeLine?.includes(cardFilter),
  );
  return (
    <>
      <form className="cards-form" onSubmit={sendForm}>
        <div>
          <label htmlFor="gioco-ricerca">Seleziona gioco</label>
          <select
            id="gioco-ricerca"
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
          <label htmlFor="filtro-ricerca">Filtra carte</label>
          <select
            id="filtro-ricerca"
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
        <div>
          <label htmlFor="carta">Cerca carta</label>
          <input
            id="carta"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" onClick={resetForm}>
          Reset
        </button>
        <button type="submit">Invia</button>
      </form>

      <div className="errore-ricerca" role="status">
        {loading && <p>sto cercando...</p>}
        {error && <p>Errore: {error}</p>}
        {!loading && !error && <p>carte trovate: {risultatiFiltrati.length}</p>}
      </div>

      <ul className="results-grid">
        {risultatiFiltrati.map((card) => (
          <li key={`${card.game}-${card.externalId}`} className="card-item">
            <button
              type="button"
              className="card-zoom"
              onClick={() => onOpen({ name: card.name, imageUrl: card.imageUrl })}
              aria-label={`Ingrandisci ${card.name}`}
            >
              <img src={card.imageUrl} alt={card.name}></img>
            </button>
            <p>{card.name}</p>
            <p>{card.setName}</p>
            <button
              onClick={() => onAdd(card)}
              aria-label={`Aggiungi ${card.name} alla collezione`}
            >
              Aggiungi
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default SearchView;
