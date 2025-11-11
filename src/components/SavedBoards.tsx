/**
 * SavedBoards component for board selection
 * @module components/SavedBoards
 */

import { useState, useMemo, type ReactElement } from 'react';
import type { Board, BoardSize } from '@/types';
import { isValidBoardSize } from '@/types';
import { BoardCreatorModal } from './BoardCreatorModal';
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';
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
type SizeFilter = 'all' | '2-5' | '6-10' | '11-20' | '21+' | number;

/**
 * BoardCard component with on-demand thumbnail generation
 */
interface BoardCardProps {
  board: Board;
  isManagementMode: boolean;
  onBoardSelected: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

function BoardCard({ board, isManagementMode, onBoardSelected, onDelete }: BoardCardProps): ReactElement {
  const thumbnail = useBoardThumbnail(board);

  return (
    <div
      className={`${styles.boardCard} ${!isManagementMode ? styles.boardCardClickable : ''}`}
      onClick={!isManagementMode ? () => onBoardSelected(board) : undefined}
    >
      <div className={styles.boardThumbnail}>
        <img
          src={thumbnail}
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
              onDelete(board.id);
            }}
            className={styles.deleteButton}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [customSize, setCustomSize] = useState<string>('');
  const [customError, setCustomError] = useState<string>('');

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

    // Handle range filters
    if (typeof sizeFilter === 'string') {
      switch (sizeFilter) {
        case '2-5':
          return boards.filter((board) => board.boardSize >= 2 && board.boardSize <= 5);
        case '6-10':
          return boards.filter((board) => board.boardSize >= 6 && board.boardSize <= 10);
        case '11-20':
          return boards.filter((board) => board.boardSize >= 11 && board.boardSize <= 20);
        case '21+':
          return boards.filter((board) => board.boardSize >= 21);
        default:
          return boards;
      }
    }

    // Handle specific size filter
    return boards.filter((board) => board.boardSize === sizeFilter);
  }, [boards, sizeFilter]);

  // Show board size selection
  if (viewMode === 'select-size') {
    // Common preset sizes
    const presetSizes = [
      { size: 2, description: 'Quick strategic gameplay' },
      { size: 3, description: 'Balanced complexity' },
      { size: 4, description: 'More strategic depth' },
      { size: 5, description: 'Complex gameplay' },
      { size: 8, description: 'Extended matches' },
      { size: 10, description: 'Epic battles' },
    ];

    const handleCustomSize = () => {
      const size = parseInt(customSize);
      if (isValidBoardSize(size)) {
        handleSizeSelected(size);
      } else {
        setCustomError('Please enter a number between 2 and 99');
      }
    };

    return (
      <div className={styles.container}>
        <div className={styles.sizeSelection}>
          <h2 className={styles.sizeSelectionTitle}>Select Board Size</h2>
          <p className={styles.sizeSelectionSubtitle}>
            Choose from preset sizes or enter a custom size (2-99)
          </p>

          {/* Preset sizes */}
          <div className={styles.sizeOptions}>
            {presetSizes.map(({ size, description }) => (
              <button
                key={size}
                onClick={() => handleSizeSelected(size)}
                className={styles.sizeOption}
              >
                <div className={styles.sizeOptionLabel}>{size}×{size}</div>
                <div className={styles.sizeOptionDescription}>{description}</div>
              </button>
            ))}
          </div>

          {/* Custom size input */}
          <div className={styles.customSection}>
            <h3 className={styles.customTitle}>Or use a custom size:</h3>
            <div className={styles.customInput}>
              <input
                type="number"
                min="2"
                max="99"
                placeholder="Enter size (2-99)"
                value={customSize}
                onChange={(e) => {
                  setCustomSize(e.target.value);
                  setCustomError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSize();
                  }
                }}
                className={styles.inputField}
              />
              <button
                onClick={handleCustomSize}
                className={styles.customButton}
                disabled={!customSize}
              >
                Use {customSize ? `${customSize}×${customSize}` : 'Custom'}
              </button>
            </div>
            {customError && <p className={styles.errorMessage}>{customError}</p>}
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
      <BoardCreatorModal
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
          {/* Create New Board Button */}
          <div className={styles.topActions}>
            <button onClick={handleCreateNew} className={styles.newBoardButton}>
              + Create New Board
            </button>
          </div>

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
                onClick={() => setSizeFilter('2-5')}
                className={`${styles.filterButton} ${sizeFilter === '2-5' ? styles.filterButtonActive : ''}`}
              >
                2-5 ({boards.filter(b => b.boardSize >= 2 && b.boardSize <= 5).length})
              </button>
              <button
                onClick={() => setSizeFilter('6-10')}
                className={`${styles.filterButton} ${sizeFilter === '6-10' ? styles.filterButtonActive : ''}`}
              >
                6-10 ({boards.filter(b => b.boardSize >= 6 && b.boardSize <= 10).length})
              </button>
              <button
                onClick={() => setSizeFilter('11-20')}
                className={`${styles.filterButton} ${sizeFilter === '11-20' ? styles.filterButtonActive : ''}`}
              >
                11-20 ({boards.filter(b => b.boardSize >= 11 && b.boardSize <= 20).length})
              </button>
              <button
                onClick={() => setSizeFilter('21+')}
                className={`${styles.filterButton} ${sizeFilter === '21+' ? styles.filterButtonActive : ''}`}
              >
                21+ ({boards.filter(b => b.boardSize >= 21).length})
              </button>
            </div>
          </div>

          <div className={styles.boardsGrid}>
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                isManagementMode={isManagementMode}
                onBoardSelected={onBoardSelected}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
