/**
 * SavedBoards component for board selection
 * @module components/SavedBoards
 */

import { useState, type ReactElement } from 'react';
import type { Board } from '@/types';
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

type ViewMode = 'list' | 'create';

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

  /**
   * Handle create new board
   */
  const handleCreateNew = (): void => {
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

  // Show board creator
  if (viewMode === 'create') {
    return (
      <BoardCreator
        onBoardSaved={handleBoardSaved}
        onCancel={handleCancel}
        existingBoards={boards}
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
          <div className={styles.boardsGrid}>
            {boards.map((board) => (
              <div key={board.id} className={styles.boardCard}>
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

                <div className={styles.boardActions}>
                  {!isManagementMode && (
                    <button
                      onClick={() => onBoardSelected(board)}
                      className={styles.selectButton}
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(board.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
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
