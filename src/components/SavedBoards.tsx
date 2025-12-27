/**
 * SavedBoards component for board selection
 * @module components/SavedBoards
 */

import { useState, useMemo, type ReactElement } from 'react';
import type { Board, BoardSize, UserProfile } from '@/types';
import { isValidBoardSize } from '@/types';
import { BoardCreatorModal } from './BoardCreatorModal';
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';
import { getFeatureUnlocks } from '@/utils/feature-unlocks';
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
  /** User profile for feature unlock checks */
  user?: UserProfile | null;
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
  user,
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
   * Get unique board sizes from all boards
   */
  const uniqueSizes = useMemo(() => {
    const sizes = new Set<number>();
    boards.forEach(board => sizes.add(board.boardSize));
    return Array.from(sizes).sort((a, b) => a - b);
  }, [boards]);

  /**
   * Get count of boards for a specific size
   */
  const getBoardCount = (size: number): number => {
    return boards.filter(board => board.boardSize === size).length;
  };

  /**
   * Filter boards based on selected size
   */
  const filteredBoards = useMemo(() => {
    if (sizeFilter === 'all') {
      return boards;
    }

    // Handle specific size filter
    return boards.filter((board) => board.boardSize === sizeFilter);
  }, [boards, sizeFilter]);

  // Show board size selection
  if (viewMode === 'select-size') {
    // Get unlocked board sizes
    const { boardSizes: unlockedSizes } = getFeatureUnlocks(user ?? null);

    // Common preset sizes
    const allPresetSizes = [
      { size: 2, description: 'Quick strategic gameplay' },
      { size: 3, description: 'Balanced complexity' },
      { size: 4, description: 'More strategic depth' },
      { size: 5, description: 'Complex gameplay' },
      { size: 8, description: 'Extended matches' },
      { size: 10, description: 'Epic battles' },
    ];

    // Filter to only show unlocked sizes
    const presetSizes = allPresetSizes.filter(preset => unlockedSizes.includes(preset.size));

    const handleCustomSize = () => {
      const size = parseInt(customSize);
      if (!isValidBoardSize(size)) {
        setCustomError('Please enter a number between 2 and 99');
        return;
      }
      if (!unlockedSizes.includes(size)) {
        setCustomError(`Board size ${size}×${size} is not unlocked yet. Complete more games to unlock!`);
        return;
      }
      handleSizeSelected(size);
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
            <label htmlFor="size-filter" className={styles.filterLabel}>Filter by size:</label>
            <select
              id="size-filter"
              value={sizeFilter}
              onChange={(e) => {
                const value = e.target.value;
                setSizeFilter(value === 'all' ? 'all' : parseInt(value));
              }}
              className={styles.filterSelect}
            >
              <option value="all">All ({boards.length})</option>
              {uniqueSizes.map(size => (
                <option key={size} value={size}>
                  {size}×{size} ({getBoardCount(size)})
                </option>
              ))}
            </select>
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
