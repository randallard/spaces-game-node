/**
 * DeckCreator component for building 10-board decks
 * @module components/DeckCreator
 */

import { type ReactElement, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Deck, Board } from '@/types';
import styles from './DeckCreator.module.css';

export interface DeckCreatorProps {
  /** Available boards to choose from */
  availableBoards: Board[];
  /** Callback when deck is saved */
  onDeckSaved: (deck: Deck) => void;
  /** Callback to cancel */
  onCancel: () => void;
  /** Optional existing deck to edit */
  existingDeck?: Deck | undefined;
}

/**
 * Deck creator component.
 *
 * Allows users to:
 * - Name their deck
 * - Select 10 boards (reuse allowed)
 * - Reorder boards by drag-and-drop
 * - Save the deck
 *
 * @component
 */
export function DeckCreator({
  availableBoards,
  onDeckSaved,
  onCancel,
  existingDeck,
}: DeckCreatorProps): ReactElement {
  const [deckName, setDeckName] = useState(existingDeck?.name || '');
  const [selectedBoards, setSelectedBoards] = useState<Board[]>(
    existingDeck?.boards || []
  );

  const handleBoardSelect = useCallback((board: Board) => {
    if (selectedBoards.length < 10) {
      setSelectedBoards((prev) => [...prev, board]);
    }
  }, [selectedBoards.length]);

  const handleRemoveBoard = useCallback((index: number) => {
    setSelectedBoards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    if (deckName.trim() === '') {
      alert('Please enter a deck name');
      return;
    }

    if (selectedBoards.length !== 10) {
      alert('Deck must have exactly 10 boards');
      return;
    }

    const deck: Deck = {
      id: existingDeck?.id || uuidv4(),
      name: deckName.trim(),
      boards: selectedBoards,
      createdAt: existingDeck?.createdAt || Date.now(),
    };

    onDeckSaved(deck);
  }, [deckName, selectedBoards, existingDeck, onDeckSaved]);

  const isComplete = deckName.trim() !== '' && selectedBoards.length === 10;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{existingDeck ? 'Edit Deck' : 'Create New Deck'}</h2>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>

      <div className={styles.deckNameSection}>
        <label htmlFor="deck-name" className={styles.label}>
          Deck Name:
        </label>
        <input
          id="deck-name"
          type="text"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="Enter deck name..."
          className={styles.input}
          maxLength={50}
        />
      </div>

      <div className={styles.content}>
        {/* Available Boards */}
        <div className={styles.availableSection}>
          <h3 className={styles.sectionTitle}>
            Available Boards ({availableBoards.length})
          </h3>
          <div className={styles.boardGrid}>
            {availableBoards.length === 0 ? (
              <p className={styles.emptyMessage}>
                No boards available. Create some boards first!
              </p>
            ) : (
              availableBoards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardSelect(board)}
                  disabled={selectedBoards.length >= 10}
                  className={styles.boardCard}
                  title={board.name}
                >
                  <img
                    src={board.thumbnail}
                    alt={board.name}
                    className={styles.boardThumbnail}
                  />
                  <span className={styles.boardName}>{board.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Boards */}
        <div className={styles.selectedSection}>
          <h3 className={styles.sectionTitle}>
            Selected Boards ({selectedBoards.length}/10)
          </h3>
          <div className={styles.selectedGrid}>
            {selectedBoards.map((board, index) => (
              <div key={`${board.id}-${index}`} className={styles.selectedCard}>
                <div className={styles.selectedHeader}>
                  <span className={styles.roundNumber}>Round {index + 1}</span>
                  <button
                    onClick={() => handleRemoveBoard(index)}
                    className={styles.removeButton}
                    title="Remove board"
                  >
                    ×
                  </button>
                </div>
                <img
                  src={board.thumbnail}
                  alt={board.name}
                  className={styles.boardThumbnail}
                />
                <span className={styles.boardName}>{board.name}</span>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 10 - selectedBoards.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className={`${styles.selectedCard} ${styles.emptySlot}`}
              >
                <span className={styles.emptyText}>
                  Round {selectedBoards.length + i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          onClick={handleSave}
          disabled={!isComplete}
          className={styles.saveButton}
        >
          {existingDeck ? 'Update Deck' : 'Create Deck'}
        </button>
      </div>
    </div>
  );
}
