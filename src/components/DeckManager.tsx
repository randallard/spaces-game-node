/**
 * DeckManager component for viewing and selecting decks
 * @module components/DeckManager
 */

import { type ReactElement } from 'react';
import type { Deck } from '@/types';
import styles from './DeckManager.module.css';

export interface DeckManagerProps {
  /** Available decks */
  decks: Deck[];
  /** Callback when deck is selected for play */
  onDeckSelected: (deck: Deck) => void;
  /** Callback to create new deck */
  onCreateDeck: () => void;
  /** Callback to edit deck */
  onEditDeck: (deck: Deck) => void;
  /** Callback to delete deck */
  onDeleteDeck: (deckId: string) => void;
  /** User's name */
  userName: string;
}

/**
 * Deck manager component.
 *
 * Shows all saved decks with options to:
 * - Play with a deck
 * - Create new deck
 * - Edit existing deck
 * - Delete deck
 *
 * @component
 */
export function DeckManager({
  decks,
  onDeckSelected,
  onCreateDeck,
  onEditDeck,
  onDeleteDeck,
}: DeckManagerProps): ReactElement {
  const handleDelete = (deckId: string, deckName: string) => {
    if (confirm(`Are you sure you want to delete "${deckName}"?`)) {
      onDeleteDeck(deckId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Select a Deck to Play</h2>
        <button onClick={onCreateDeck} className={styles.createButton}>
          + Create New Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>
            You don't have any decks yet. Create one to get started!
          </p>
          <button onClick={onCreateDeck} className={styles.createButton}>
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div className={styles.deckGrid}>
          {decks.map((deck) => (
            <div key={deck.id} className={styles.deckCard}>
              <div className={styles.deckHeader}>
                <h3 className={styles.deckName}>{deck.name}</h3>
                <span className={styles.boardCount}>10 boards</span>
              </div>

              {/* Board thumbnails preview */}
              <div className={styles.boardPreview}>
                {deck.boards.slice(0, 5).map((board, i) => (
                  <img
                    key={`${board.id}-${i}`}
                    src={board.thumbnail}
                    alt={board.name}
                    className={styles.miniThumbnail}
                    title={`Round ${i + 1}: ${board.name}`}
                  />
                ))}
                {deck.boards.length > 5 && (
                  <div className={styles.moreBoards}>+{deck.boards.length - 5}</div>
                )}
              </div>

              {/* Board names */}
              <div className={styles.boardList}>
                {deck.boards.map((board, i) => (
                  <div key={`${board.id}-${i}`} className={styles.boardListItem}>
                    <span className={styles.roundLabel}>R{i + 1}:</span>
                    <span className={styles.boardListName}>{board.name}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  onClick={() => onDeckSelected(deck)}
                  className={`${styles.button} ${styles.playButton}`}
                >
                  Play
                </button>
                <button
                  onClick={() => onEditDeck(deck)}
                  className={`${styles.button} ${styles.editButton}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(deck.id, deck.name)}
                  className={`${styles.button} ${styles.deleteButton}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
