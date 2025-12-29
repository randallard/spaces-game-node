/**
 * DeckCreator component for building 10-board decks
 * @module components/DeckCreator
 */

import { type ReactElement, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Deck, Board } from '@/types';
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';
import styles from './DeckCreator.module.css';

type SizeFilter = 'all' | number;

/**
 * BoardThumbnail component with on-demand thumbnail generation
 */
interface BoardThumbnailProps {
  board: Board;
}

function BoardThumbnail({ board }: BoardThumbnailProps): ReactElement {
  const thumbnail = useBoardThumbnail(board);

  return (
    <img
      src={thumbnail}
      alt={board.name}
      className={styles.boardThumbnail}
    />
  );
}

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
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>(() => {
    // If editing an existing deck, set filter to the deck's board size
    if (existingDeck && existingDeck.boards.length > 0) {
      return existingDeck.boards[0]?.boardSize ?? 'all';
    }
    return 'all';
  });

  const handleBoardSelect = useCallback((board: Board) => {
    if (selectedBoards.length < 10) {
      setSelectedBoards((prev) => {
        const newBoards = [...prev, board];

        // If this is the first board, auto-filter to this board's size
        if (prev.length === 0) {
          setSizeFilter(board.boardSize);
        }

        return newBoards;
      });
    }
  }, [selectedBoards.length]);

  const handleRemoveBoard = useCallback((index: number) => {
    setSelectedBoards((prev) => {
      const newBoards = prev.filter((_, i) => i !== index);

      // If removing the last board, reset filter to 'all'
      if (newBoards.length === 0) {
        setSizeFilter('all');
      }

      return newBoards;
    });
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

  /**
   * Get the deck size (all boards in a deck must be the same size)
   */
  const deckSize = useMemo(() => {
    if (selectedBoards.length === 0) return null;
    return selectedBoards[0]?.boardSize ?? null;
  }, [selectedBoards]);

  /**
   * Get unique board sizes from available boards
   */
  const uniqueSizes = useMemo(() => {
    const sizes = new Set<number>();
    availableBoards.forEach(board => sizes.add(board.boardSize));
    return Array.from(sizes).sort((a, b) => a - b);
  }, [availableBoards]);

  /**
   * Get count of boards for a specific size
   */
  const getBoardCount = (size: number): number => {
    return availableBoards.filter(board => board.boardSize === size).length;
  };

  /**
   * Filter boards based on selected size and deck constraints
   */
  const filteredBoards = useMemo(() => {
    let boards = availableBoards;

    // If a deck is started, only show boards of the same size
    if (deckSize !== null) {
      boards = boards.filter((board) => board.boardSize === deckSize);
    } else if (sizeFilter !== 'all') {
      // Otherwise apply the specific size filter
      boards = boards.filter((board) => board.boardSize === sizeFilter);
    }

    return boards;
  }, [availableBoards, sizeFilter, deckSize]);

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

          {/* Size Filter */}
          <div className={styles.filterBar}>
            <label htmlFor="board-size-filter" className={styles.filterLabel}>Filter by size:</label>
            {selectedBoards.length > 0 && deckSize !== null ? (
              <select
                id="board-size-filter"
                value={deckSize}
                className={styles.filterSelect}
                disabled={true}
                title="Filter locked to deck size"
              >
                <option value={deckSize}>
                  {deckSize}×{deckSize} ({availableBoards.filter(b => b.boardSize === deckSize).length})
                </option>
              </select>
            ) : (
              <select
                id="board-size-filter"
                value={sizeFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setSizeFilter(value === 'all' ? 'all' : parseInt(value));
                }}
                className={styles.filterSelect}
                title="Select a size filter"
              >
                <option value="all">All ({availableBoards.length})</option>
                {uniqueSizes.map(size => (
                  <option key={size} value={size}>
                    {size}×{size} ({getBoardCount(size)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.boardGrid}>
            {filteredBoards.length === 0 ? (
              <p className={styles.emptyMessage}>
                {availableBoards.length === 0
                  ? 'No boards available. Create some boards first!'
                  : `No ${sizeFilter}x${sizeFilter} boards available.`
                }
              </p>
            ) : (
              filteredBoards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardSelect(board)}
                  disabled={selectedBoards.length >= 10}
                  className={styles.boardCard}
                  title={board.name}
                >
                  <BoardThumbnail board={board} />
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
                <BoardThumbnail board={board} />
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
