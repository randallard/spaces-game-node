/**
 * SavedBoards component for board selection
 * @module components/SavedBoards
 */

import { useState, useMemo, useEffect, type ReactElement } from 'react';
import type { Board, BoardSize, UserProfile, RoundResult } from '@/types';
import { isValidBoardSize } from '@/types';
import { BoardCreatorModal } from './BoardCreatorModal';
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';
import { getFeatureUnlocks } from '@/utils/feature-unlocks';
import { RoundResults } from './RoundResults';
import { generateBoardThumbnail, generateOpponentThumbnail } from '@/utils/svg-thumbnail';
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
  /** Callback when create deck button is clicked */
  onCreateDeck?: () => void;
  /** Initial board size to create (if set, opens creator immediately) */
  initialBoardSize?: number | null;
  /** Callback when initial board creation is handled */
  onInitialBoardSizeHandled?: () => void;
  /** Round history for the current game (optional) */
  roundHistory?: RoundResult[];
  /** Current player score (optional, for round history display) */
  playerScore?: number;
  /** Current opponent score (optional, for round history display) */
  opponentScore?: number;
  /** Optional user preference for showing complete results */
  showCompleteResultsByDefault?: boolean;
  /** Optional callback when the show complete results preference changes */
  onShowCompleteResultsChange?: (value: boolean) => void;
  /** Optional user preference for explanation style */
  explanationStyle?: 'lively' | 'technical';
  /** Optional callback when the explanation style preference changes */
  onExplanationStyleChange?: (value: 'lively' | 'technical') => void;
  /** Player's selected board for current incomplete round (if waiting for opponent) */
  playerSelectedBoard?: Board | null;
  /** Opponent's selected board for current incomplete round */
  opponentSelectedBoard?: Board | null;
  /** Whether to show board selection UI (default: true) */
  showBoardSelection?: boolean;
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
  onCreateDeck,
  initialBoardSize = null,
  onInitialBoardSizeHandled,
  roundHistory = [],
  playerScore = 0,
  opponentScore = 0,
  showCompleteResultsByDefault = false,
  onShowCompleteResultsChange,
  explanationStyle = 'lively',
  onExplanationStyleChange,
  playerSelectedBoard = null,
  opponentSelectedBoard = null,
  showBoardSelection = true,
}: SavedBoardsProps): ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBoardSize, setSelectedBoardSize] = useState<BoardSize>(2);
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [customSize, setCustomSize] = useState<string>('');
  const [customError, setCustomError] = useState<string>('');
  const [selectedHistoryRound, setSelectedHistoryRound] = useState<number | null>(null);
  const [showRotationHelp, setShowRotationHelp] = useState<boolean>(false);
  const [showRoundHistory, setShowRoundHistory] = useState<boolean>(false);

  // Auto-expand round history if there's an incomplete round and no completed rounds yet
  const hasIncompleteRound = !!(playerSelectedBoard && !opponentSelectedBoard);

  // Auto-expand round history when there's an incomplete round and no completed rounds
  useEffect(() => {
    if (hasIncompleteRound && roundHistory.length === 0 && !showRoundHistory) {
      setShowRoundHistory(true);
    }
  }, [hasIncompleteRound, roundHistory.length, showRoundHistory]);

  // Handle initial board size if provided (use useEffect to avoid setState during render)
  useEffect(() => {
    if (initialBoardSize !== null && viewMode === 'list') {
      setSelectedBoardSize(initialBoardSize as BoardSize);
      setViewMode('create');
      if (onInitialBoardSizeHandled) {
        onInitialBoardSizeHandled();
      }
    }
  }, [initialBoardSize, viewMode, onInitialBoardSizeHandled]);

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

  // Calculate running totals for round history
  const runningTotals = roundHistory.reduce(
    (acc, result) => {
      const lastTotal = acc[acc.length - 1] || { player: 0, opponent: 0 };
      acc.push({
        player: lastTotal.player + (result.playerPoints ?? 0),
        opponent: lastTotal.opponent + (result.opponentPoints ?? 0),
      });
      return acc;
    },
    [] as Array<{ player: number; opponent: number }>
  );

  // If viewing a specific round from history
  if (selectedHistoryRound !== null) {
    const result = roundHistory[selectedHistoryRound - 1];
    if (!result) return <div>Invalid round selected</div>;

    const runningTotal = runningTotals[selectedHistoryRound - 1];
    if (!runningTotal) return <div>Invalid running total</div>;

    return (
      <div className={styles.modalOverlay} onClick={() => setSelectedHistoryRound(null)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.closeButton}
            onClick={() => setSelectedHistoryRound(null)}
            aria-label="Close"
          >
            ×
          </button>
          <RoundResults
            result={result}
            playerName={userName}
            opponentName={opponentName}
            playerScore={runningTotal.player}
            opponentScore={runningTotal.opponent}
            onContinue={() => setSelectedHistoryRound(null)}
            continueButtonText="Close"
            showCompleteResultsByDefault={showCompleteResultsByDefault}
            onShowCompleteResultsChange={onShowCompleteResultsChange}
            explanationStyle={explanationStyle}
            onExplanationStyleChange={onExplanationStyleChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!isManagementMode && showBoardSelection && (
        <div className={styles.header}>
          <h2 className={styles.title}>Select a Board for Round {currentRound}</h2>
          <p className={styles.subtitle}>
            {userName} vs {opponentName}
          </p>
        </div>
      )}

      {/* Round History Section */}
      {!isManagementMode && (roundHistory.length > 0 || (playerSelectedBoard && !opponentSelectedBoard)) && (
        <div className={styles.roundHistorySection}>
          <div className={styles.roundHistoryHeader}>
            <div className={styles.roundHistoryTitleGroup}>
              <h3 className={styles.roundHistoryTitle}>
                {hasIncompleteRound && roundHistory.length === 0
                  ? 'Current Round'
                  : hasIncompleteRound
                    ? `Round History (${roundHistory.length} complete)`
                    : `Previous Rounds (${roundHistory.length})`}
              </h3>
              <button
                className={styles.helpIconButton}
                onClick={(e) => {
                  e.preventDefault();
                  setShowRotationHelp(true);
                }}
                title="About opponent board displays"
              >
                ?
              </button>
            </div>
            <button
              className={styles.toggleHistoryButton}
              onClick={() => setShowRoundHistory(!showRoundHistory)}
            >
              {showRoundHistory ? 'Hide' : 'Show'} {hasIncompleteRound && roundHistory.length === 0 ? 'Current Round' : 'Round History'}
            </button>
          </div>

          {showRoundHistory && (
            <>
              <div className={styles.currentScore}>
                <span className={styles.scoreItem}>
                  {userName}: {playerScore}
                </span>
                <span className={styles.scoreDivider}>-</span>
                <span className={styles.scoreItem}>
                  {opponentName}: {opponentScore}
                </span>
              </div>

              <div className={styles.roundHistoryGrid}>
                {roundHistory.map((result) => {
                  // Skip rounds with incomplete board data
                  if (!result.playerBoard || !result.opponentBoard) {
                    return null;
                  }

                  const roundWinner = result.winner;
                  const roundWinnerClass =
                    roundWinner === 'player'
                      ? styles.historyCardPlayer
                      : roundWinner === 'opponent'
                      ? styles.historyCardOpponent
                      : styles.historyCardTie;

                  const playerThumb = generateBoardThumbnail(result.playerBoard);
                  const opponentThumb = generateOpponentThumbnail(
                    result.opponentBoard,
                    result.simulationDetails?.opponentLastStep,
                    result.simulationDetails?.playerTrapPosition // Only show trap at position player hit
                  );

                  return (
                    <button
                      key={result.round}
                      className={`${styles.historyCard} ${roundWinnerClass}`}
                      onClick={() => setSelectedHistoryRound(result.round)}
                    >
                      <div className={styles.historyCardHeader}>
                        <span className={styles.historyRoundNumber}>Round {result.round}</span>
                        <span className={styles.historyWinner}>
                          {roundWinner === 'player'
                            ? `${userName} Won`
                            : roundWinner === 'opponent'
                            ? `${opponentName} Won`
                            : 'Tie'}
                        </span>
                      </div>

                      <div className={styles.historyThumbnails}>
                        <div className={styles.historyThumbWrapper}>
                          <span className={styles.historyThumbLabel}>{userName}</span>
                          <img
                            src={playerThumb}
                            alt={`${userName}'s board`}
                            className={styles.historyThumb}
                          />
                        </div>
                        <div className={styles.historyThumbWrapper}>
                          <span className={styles.historyThumbLabel}>{opponentName}</span>
                          <img
                            src={opponentThumb}
                            alt={`${opponentName}'s board`}
                            className={styles.historyThumb}
                          />
                        </div>
                      </div>

                      <div className={styles.historyPoints}>
                        {result.playerPoints ?? 0} - {result.opponentPoints ?? 0}
                      </div>
                    </button>
                  );
                })}

                {/* Show incomplete round if player has selected but opponent hasn't */}
                {playerSelectedBoard && !opponentSelectedBoard && (
                  <div
                    className={`${styles.historyCard} ${styles.historyCardIncomplete}`}
                    title="Waiting for opponent to select their board"
                  >
                    <div className={styles.historyCardHeader}>
                      <span className={styles.historyRoundNumber}>Round {currentRound}</span>
                      <span className={styles.historyWinner} style={{ color: '#94a3b8' }}>
                        In Progress...
                      </span>
                    </div>

                    <div className={styles.historyThumbnails}>
                      <div className={styles.historyThumbWrapper}>
                        <span className={styles.historyThumbLabel}>{userName}</span>
                        <img
                          src={generateBoardThumbnail(playerSelectedBoard)}
                          alt={`${userName}'s board`}
                          className={styles.historyThumb}
                        />
                      </div>
                      <div className={styles.historyThumbWrapper}>
                        <span className={styles.historyThumbLabel}>{opponentName}</span>
                        <div className={styles.historyThumb} style={{
                          backgroundColor: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          opacity: 0.5
                        }}>
                          ?
                        </div>
                      </div>
                    </div>

                    <div className={styles.historyPoints} style={{ color: '#94a3b8' }}>
                      - - -
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Help Modal */}
      {showRotationHelp && (
        <div className={styles.modalOverlay} onClick={() => setShowRotationHelp(false)}>
          <div className={styles.helpModalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setShowRotationHelp(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className={styles.helpModalTitle}>Why Are Some Opponent Moves Hidden?</h2>
            <div className={styles.helpModalBody}>
              <p className={styles.helpModalParagraph}>
                You can only see the moves your opponent <strong>actually made</strong> during the round.
              </p>

              <div className={styles.helpModalSection}>
                <h3 className={styles.helpModalSectionTitle}>Rounds End When:</h3>
                <ul className={styles.helpModalList}>
                  <li>A player reaches the goal</li>
                  <li>A player hits a trap</li>
                  <li>Players collide</li>
                  <li>Both players complete their sequences</li>
                </ul>
              </div>

              <div className={styles.helpModalSection}>
                <h3 className={styles.helpModalSectionTitle}>Example:</h3>
                <p className={styles.helpModalExample}>
                  If your opponent planned 5 moves but you reached the goal after move 2,
                  you'll only see their first 2 moves. Their remaining 3 moves stay hidden!
                </p>
              </div>

              <div className={styles.helpModalInfoBox}>
                <strong>Strategic Note:</strong> This prevents you from gaining information
                about boards your opponent created but didn't fully execute.
              </div>
            </div>
            <button
              className={styles.helpModalButton}
              onClick={() => setShowRotationHelp(false)}
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Board Selection UI - Only show when player needs to select a board */}
      {showBoardSelection && (
      <>
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
          {/* Create New Board and Deck Buttons */}
          <div className={styles.topActions}>
            <button onClick={handleCreateNew} className={styles.newBoardButton}>
              + Create New Board
            </button>
            {onCreateDeck && (
              <button onClick={onCreateDeck} className={styles.newDeckButton}>
                + Create New Deck
              </button>
            )}
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
      </>
      )}
    </div>
  );
}
