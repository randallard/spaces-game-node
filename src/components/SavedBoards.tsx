/**
 * SavedBoards component for board selection
 * @module components/SavedBoards
 */

import { useState, useMemo, type ReactElement } from 'react';
import type { Board, BoardSize } from '@/types';
import { BoardCreator } from './BoardCreator';
import styles from './SavedBoards.module.css';

export interface SavedBoardsProps {
  /** List of saved boards */
  boards: Board[];
  /** Callback when board is selected */
  onBoardSelected: (board: Board) => void;
  /** Callback when board is created/updated */
  onBoardSaved: (board: Board) => void;
  /** Callback when board is deleted */
  onBoardDeleted: (boardId: string) => void;
  /** Current round number (for display) */
  currentRound: number;
  /** User's name (for display) */
  userName: string;
  /** Opponent's name (for display) */
  opponentName: string;
}

type ViewMode = 'list' | 'select-size' | 'create';
type SizeFilter = 'all' | 2 | 3;

/**
 * Saved boards component with list and create views.
 *
 * Features:
 * - Display all saved boards as cards with thumbnails
 * - Create new boards
 * - Delete boards
 * - Select board for current round
 *
 * @component
 */
export function SavedBoards({
  boards,
  onBoardSelected,
  onBoardSaved,
  onBoardDeleted,
  currentRound,
  userName,
  opponentName,
}: SavedBoardsProps): ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBoardSize, setSelectedBoardSize] = useState<BoardSize>(2);
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');

  /**
   * Handle create new board
   */
  const handleCreateNew = (): void => {
    setViewMode('select-size');
  };

  /**
   * Handle board size selected
   */
  const handleSizeSelected = (size: BoardSize): void => {
    setSelectedBoardSize(size);
    setViewMode('create');
  };

  /**
   * Handle board saved (from creator)
   */
  const handleBoardSaved = (board: Board): void => {
    onBoardSaved(board);
    setViewMode('list');
  };

  /**
   * Handle cancel creation
   */
  const handleCancel = (): void => {
    setViewMode('list');
  };

  /**
   * Handle delete board
   */
  const handleDelete = (boardId: string): void => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      onBoardDeleted(boardId);
    }
  };

  /**
   * Filter boards based on selected size
   */
  const filteredBoards = useMemo(() => {
    if (sizeFilter === 'all') {
      return boards;
    }
    return boards.filter((board) => board.boardSize === sizeFilter);
  }, [boards, sizeFilter]);

  // Show board size selection
  if (viewMode === 'select-size') {
    return (
      <div className={styles.container}>
        <div className={styles.sizeSelection}>
          <h2 className={styles.sizeSelectionTitle}>Select Board Size</h2>
          <div className={styles.sizeOptions}>
            <button
              onClick={() => handleSizeSelected(2)}
              className={styles.sizeOption}
            >
              <div className={styles.sizeOptionLabel}>2x2</div>
              <div className={styles.sizeOptionDescription}>Classic board size</div>
            </button>
            <button
              onClick={() => handleSizeSelected(3)}
              className={styles.sizeOption}
            >
              <div className={styles.sizeOptionLabel}>3x3</div>
              <div className={styles.sizeOptionDescription}>Larger board with more strategy</div>
            </button>
          </div>
          <button onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show board creator
  if (viewMode === 'create') {
    return (
      <BoardCreator
        onBoardSaved={handleBoardSaved}
        onCancel={handleCancel}
        existingBoards={boards}
        boardSize={selectedBoardSize}
      />
    );
  }

  // Show board list
  // Check if we're in management mode (not in an active round)
  const isManagementMode = currentRound === 0;

  return (
    <div className={styles.container}>
      {!isManagementMode && (
        <div className={styles.header}>
          <h2 className={styles.title}>Select a Board for Round {currentRound}</h2>
          <p className={styles.subtitle}>
            {userName} vs {opponentName}
          </p>
        </div>
      )}

      {boards.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3 className={styles.emptyTitle}>No Boards Yet</h3>
          <p className={styles.emptyText}>
            Create your first board to start playing!
          </p>
          <button onClick={handleCreateNew} className={styles.createButton}>
            Create Your First Board
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
                All ({boards.length})
              </button>
              <button
                onClick={() => setSizeFilter(2)}
                className={`${styles.filterButton} ${sizeFilter === 2 ? styles.filterButtonActive : ''}`}
              >
                2x2 ({boards.filter(b => b.boardSize === 2).length})
              </button>
              <button
                onClick={() => setSizeFilter(3)}
                className={`${styles.filterButton} ${sizeFilter === 3 ? styles.filterButtonActive : ''}`}
              >
                3x3 ({boards.filter(b => b.boardSize === 3).length})
              </button>
            </div>
          </div>

          <div className={styles.boardsGrid}>
            {filteredBoards.map((board) => (
              <div
                key={board.id}
                className={`${styles.boardCard} ${!isManagementMode ? styles.boardCardClickable : ''}`}
                onClick={!isManagementMode ? () => onBoardSelected(board) : undefined}
              >
                <div className={styles.boardThumbnail}>
                  <img
                    src={board.thumbnail}
                    alt={`${board.name} thumbnail`}
                    className={styles.thumbnailImage}
                  />
                </div>

                <div className={styles.boardInfo}>
                  <h3 className={styles.boardName}>{board.name}</h3>
                  <div className={styles.boardMeta}>
                    <span className={styles.metaItem}>
                      {board.sequence.length} moves
                    </span>
                    <span className={styles.metaItem}>
                      Created {new Date(board.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isManagementMode && (
                  <div className={styles.boardActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(board.id);
                      }}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button onClick={handleCreateNew} className={styles.newBoardButton}>
              + Create New Board
            </button>
          </div>
        </>
      )}
    </div>
  );
}
