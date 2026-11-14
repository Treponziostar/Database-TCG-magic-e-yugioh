import "./App.css";
import {
  getCollection,
  addToCollection,
  updateCollectionItem,
  removeFromCollection,
  IS_DEMO,
} from "./api";
import SearchView from "./components/SearchView";
import CollectionView from "./components/CollectionView";
import { useState, useEffect, useRef } from "react";

function App() {
  const [view, setView] = useState("search");
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openedCard, setOpenedCard] = useState(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const dati = await getCollection();

        setCollection(dati);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Sincronizza il <dialog> con lo stato: showModal()/close() sono metodi
  // del nodo DOM, non prop React, quindi vanno chiamati in un effetto, dopo
  // il render. Guardia su .open: showModal() su un dialog già aperto lancia.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (openedCard) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [openedCard]);

  async function handleAdd(card) {
    const cardPerCollection = {
      game: card.game,
      card_id: card.externalId,
      image_url: card.imageUrl,
      name: card.name,
      type_line: card.typeLine,
    };
    try {
      setError(null);
      await addToCollection(cardPerCollection);
      const dati = await getCollection();

      setCollection(dati);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleChangeQuantity(card, n) {
    const cardInCollection = {
      quantity: card.quantity + n,
    };
    try {
      setError(null);
      if (card.quantity + n <= 0) {
        await removeFromCollection(card.id);
        const datiRimossi = await getCollection();
        setCollection(datiRimossi);
      } else {
        await updateCollectionItem(card.id, cardInCollection);
        const datiAggiornati = await getCollection();
        setCollection(datiAggiornati);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleRemove(id) {
    try {
      setError(null);
      await removeFromCollection(id);
      const dati = await getCollection();

      setCollection(dati);
    } catch (error) {
      setError(error.message);
    }
  }

  // Ingrandimento: puramente locale, niente backend. L'oggetto arriva già
  // tradotto dalle viste nella forma { name, imageUrl }.
  function openCard(card) {
    setOpenedCard(card);
  }

  function closeCard() {
    setOpenedCard(null);
  }

  // Click sullo sfondo: con padding 0 il dialog "nudo" coincide col
  // backdrop, quindi e.target è il dialog stesso solo se non si è cliccato
  // l'immagine o il bottone dentro.
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) closeCard();
  }

  return (
    <>
      {/* onClose: il browser chiude da solo con Esc, e lo stato deve seguirlo.
          onClick sul backdrop è solo una comodità per il mouse: da tastiera
          ci sono Esc e il bottone Chiudi, quindi il lint qui è un falso positivo. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        className="card-dialog"
        aria-label={openedCard ? openedCard.name : "Carta ingrandita"}
        onClose={closeCard}
        onClick={handleBackdropClick}
      >
        <button
          type="button"
          className="card-dialog-close"
          onClick={closeCard}
          aria-label="Chiudi"
        >
          ×
        </button>
        {openedCard && <img src={openedCard.imageUrl} alt={openedCard.name} />}
      </dialog>
      {IS_DEMO && (
        <p className="demo-banner" role="note">
          Versione demo: la collezione viene salvata solo in questo browser.
        </p>
      )}
      <nav aria-label="Sezioni">
        <button
          onClick={() => setView("search")}
          className={view === "search" ? "tab active" : "tab"}
          aria-pressed={view === "search"}
        >
          Cerca
        </button>
        <button
          onClick={() => setView("collection")}
          className={view === "collection" ? "tab active" : "tab"}
          aria-pressed={view === "collection"}
        >
          Collezione
        </button>
      </nav>

      <main>
        {view === "collection" && (
          <CollectionView
            collection={collection}
            loading={loading}
            error={error}
            onChangeQuantity={handleChangeQuantity}
            onRemove={handleRemove}
            onOpen={openCard}
          />
        )}
        {view === "search" && <SearchView onAdd={handleAdd} onOpen={openCard} />}
      </main>
    </>
  );
}

export default App;
