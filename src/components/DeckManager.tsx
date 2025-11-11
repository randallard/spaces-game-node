/**
 * DeckManager component for viewing and selecting decks
 * @module components/DeckManager
 */

import { type ReactElement, useState, useMemo } from 'react';
import type { Deck, Board, Opponent } from '@/types';
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';
import { getOpponentIcon } from '@/utils/app-helpers';
import styles from './DeckManager.module.css';

type SizeFilter = 'all' | 2 | 3;

/**
 * MiniThumbnail component with on-demand thumbnail generation
 */
interface MiniThumbnailProps {
  board: Board;
  index: number;
}

function MiniThumbnail({ board, index }: MiniThumbnailProps): ReactElement {
  const thumbnail = useBoardThumbnail(board);

  return (
    <img
      src={thumbnail}
      alt={board.name}
      className={styles.miniThumbnail}
      title={`Round ${index + 1}: ${board.name}`}
    />
  );
}

export interface DeckManagerProps {
  /** Available decks */
  decks: Deck[];
  /** Available opponents */
  opponents: Opponent[];
  /** Callback when deck and opponent are selected for play */
  onDeckSelected: (deck: Deck, opponent: Opponent) => void;
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
  opponents,
  onDeckSelected,
  onCreateDeck,
  onEditDeck,
  onDeleteDeck,
}: DeckManagerProps): ReactElement {
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [selectedDeckForModal, setSelectedDeckForModal] = useState<Deck | null>(null);

  const handleDelete = (deckId: string, deckName: string) => {
    if (confirm(`Are you sure you want to delete "${deckName}"?`)) {
      onDeleteDeck(deckId);
    }
  };

  const handlePlayClick = (deck: Deck) => {
    setSelectedDeckForModal(deck);
  };

  const handleOpponentSelect = (opponent: Opponent) => {
    if (selectedDeckForModal) {
      onDeckSelected(selectedDeckForModal, opponent);
      setSelectedDeckForModal(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedDeckForModal(null);
  };

  /**
   * Get the board size of a deck (assumes all boards in a deck have the same size)
   */
  const getDeckSize = (deck: Deck): number | null => {
    if (deck.boards.length === 0) return null;
    return deck.boards[0]?.boardSize ?? null;
  };

  /**
   * Filter decks based on selected size
   */
  const filteredDecks = useMemo(() => {
    if (sizeFilter === 'all') {
      return decks;
    }
    return decks.filter((deck) => getDeckSize(deck) === sizeFilter);
  }, [decks, sizeFilter]);

  /**
   * Count decks by size
   */
  const deckCounts = useMemo(() => {
    return {
      all: decks.length,
      size2: decks.filter(d => getDeckSize(d) === 2).length,
      size3: decks.filter(d => getDeckSize(d) === 3).length,
    };
  }, [decks]);

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
        <>
          {/* Size Filter */}
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>Filter by size:</span>
            <div className={styles.filterButtons}>
              <button
                onClick={() => setSizeFilter('all')}
                className={`${styles.filterButton} ${sizeFilter === 'all' ? styles.filterButtonActive : ''}`}
              >
                All ({deckCounts.all})
              </button>
              <button
                onClick={() => setSizeFilter(2)}
                className={`${styles.filterButton} ${sizeFilter === 2 ? styles.filterButtonActive : ''}`}
              >
                2x2 ({deckCounts.size2})
              </button>
              <button
                onClick={() => setSizeFilter(3)}
                className={`${styles.filterButton} ${sizeFilter === 3 ? styles.filterButtonActive : ''}`}
              >
                3x3 ({deckCounts.size3})
              </button>
            </div>
          </div>

          {filteredDecks.length === 0 ? (
            <div className={styles.emptyFilterState}>
              <p className={styles.emptyMessage}>
                No {sizeFilter}x{sizeFilter} decks available.
              </p>
            </div>
          ) : (
            <div className={styles.deckGrid}>
              {filteredDecks.map((deck) => (
            <div key={deck.id} className={styles.deckCard}>
              <div className={styles.deckHeader}>
                <h3 className={styles.deckName}>{deck.name}</h3>
                <span className={styles.boardCount}>10 boards</span>
              </div>

              {/* Board thumbnails preview */}
              <div className={styles.boardPreview}>
                {deck.boards.slice(0, 5).map((board, i) => (
                  <MiniThumbnail
                    key={`${board.id}-${i}`}
                    board={board}
                    index={i}
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
                  onClick={() => handlePlayClick(deck)}
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
        </>
      )}

      {/* Opponent Selection Modal */}
      {selectedDeckForModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Opponent</h3>
              <button
                className={styles.modalCloseButton}
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className={styles.modalSubtitle}>
              Playing with: <strong>{selectedDeckForModal.name}</strong>
            </p>
            <div className={styles.modalOpponentList}>
              {opponents.map((opponent) => (
                <button
                  key={opponent.id}
                  onClick={() => handleOpponentSelect(opponent)}
                  className={styles.modalOpponentButton}
                >
                  <span className={styles.modalOpponentIcon}>
                    {getOpponentIcon(opponent)}
                  </span>
                  <div className={styles.modalOpponentInfo}>
                    <span className={styles.modalOpponentName}>{opponent.name}</span>
                    <span className={styles.modalOpponentRecord}>
                      Record: {opponent.wins}-{opponent.losses}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
