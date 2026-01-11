/**
 * ActiveGameView - Unified component for all active game states
 * Replaces: board-selection, share-challenge, waiting-for-opponent phases
 * @module components/ActiveGameView
 */

import { type ReactElement, useState, useCallback, useEffect } from 'react';
import type { Board, UserProfile, RoundResult } from '@/types';
import { SavedBoards } from './SavedBoards';
import { ShareChallenge } from './ShareChallenge';
import styles from './ActiveGameView.module.css';

export interface ActiveGameViewProps {
  /** Current round number */
  currentRound: number;
  /** Total rounds in game */
  totalRounds: number;
  /** Player's current score */
  playerScore: number;
  /** Opponent's current score */
  opponentScore: number;
  /** Player's name */
  playerName: string;
  /** Opponent's name */
  opponentName: string;
  /** Board size */
  boardSize: number;
  /** Challenge URL to share/re-send */
  challengeUrl: string;
  /** Current game state - determines what message to show */
  gameState: 'waiting-for-player' | 'waiting-for-opponent-to-start' | 'waiting-for-opponent-to-continue';
  /** Player's saved boards */
  playerBoards: Board[];
  /** User profile */
  user: UserProfile;
  /** Round history */
  roundHistory: RoundResult[];
  /** Callback when board is selected */
  onBoardSelected: (board: Board) => void;
  /** Callback when board is saved */
  onBoardSaved: (board: Board) => void;
  /** Callback when board is deleted */
  onBoardDeleted: (boardId: string) => void;
  /** Show complete results by default */
  showCompleteResultsByDefault?: boolean;
  /** Callback when show complete results changes */
  onShowCompleteResultsChange?: (value: boolean) => void;
  /** Explanation style */
  explanationStyle?: 'lively' | 'technical';
  /** Callback when explanation style changes */
  onExplanationStyleChange?: (value: 'lively' | 'technical') => void;
  /** Whether opponent has Discord connected */
  opponentHasDiscord?: boolean;
  /** Callback to go home */
  onGoHome?: () => void;
  /** Callback when share modal is closed (to transition from share-challenge to waiting-for-opponent) */
  onShareModalClosed?: () => void;
}

/**
 * Unified active game view component.
 * Shows consistent header with game info, previous rounds, and board selection.
 */
export function ActiveGameView({
  currentRound,
  totalRounds,
  playerScore,
  opponentScore,
  playerName,
  opponentName,
  boardSize,
  challengeUrl,
  gameState,
  playerBoards,
  user,
  roundHistory,
  onBoardSelected,
  onBoardSaved,
  onBoardDeleted,
  showCompleteResultsByDefault = false,
  onShowCompleteResultsChange,
  explanationStyle = 'lively',
  onExplanationStyleChange,
  opponentHasDiscord = false,
  onShareModalClosed,
}: ActiveGameViewProps): ReactElement {
  const [showShareModal, setShowShareModal] = useState(false);

  // Auto-open share modal when in waiting-for-opponent-to-start state
  // (this happens right after selecting a board)
  useEffect(() => {
    if (gameState === 'waiting-for-opponent-to-start') {
      setShowShareModal(true);
    }
  }, [gameState]);

  // Filter boards by size
  const filteredBoards = playerBoards.filter(board => board.boardSize === boardSize);

  // Get status message based on game state
  const getStatusMessage = (): string => {
    switch (gameState) {
      case 'waiting-for-player':
        return `Select your board for Round ${currentRound}`;
      case 'waiting-for-opponent-to-start':
        return `Waiting for ${opponentName} to complete Round ${currentRound}`;
      case 'waiting-for-opponent-to-continue':
        return `Waiting for ${opponentName} to complete Round ${currentRound}`;
      default:
        return '';
    }
  };

  const handleReSendLink = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setShowShareModal(false);
    // Notify parent that share modal was closed (to transition phases if needed)
    if (onShareModalClosed) {
      onShareModalClosed();
    }
  }, [onShareModalClosed]);

  return (
    <div className={styles.container}>
      {/* Header - Always Visible */}
      <div className={styles.header}>
        <h2 className={styles.roundInfo}>
          Round {currentRound} of {totalRounds}
        </h2>
        <div className={styles.scoreInfo}>
          Score: {playerName} {playerScore} - {opponentName} {opponentScore}
        </div>
        <div className={styles.boardSizeInfo}>
          Board Size: {boardSize}×{boardSize}
        </div>
        <div className={styles.matchupInfo}>
          {opponentName} vs {playerName}
          <button
            onClick={handleReSendLink}
            className={styles.reSendLink}
            title="Click to re-send game link"
          >
            (click here to re-send game link)
          </button>
        </div>
      </div>

      {/* Status Message */}
      <div className={styles.statusMessage}>
        {getStatusMessage()}
      </div>

      {/* Board Selection - Always Available (includes Previous Rounds) */}
      <div className={styles.boardSelectionSection}>
        <SavedBoards
          boards={filteredBoards}
          onBoardSelected={onBoardSelected}
          onBoardSaved={onBoardSaved}
          onBoardDeleted={onBoardDeleted}
          currentRound={currentRound}
          userName={playerName}
          opponentName={opponentName}
          user={user}
          initialBoardSize={null}
          onInitialBoardSizeHandled={() => {}}
          roundHistory={roundHistory}
          playerScore={playerScore}
          opponentScore={opponentScore}
          showCompleteResultsByDefault={showCompleteResultsByDefault}
          {...(onShowCompleteResultsChange && { onShowCompleteResultsChange })}
          explanationStyle={explanationStyle}
          {...(onExplanationStyleChange && { onExplanationStyleChange })}
        />
      </div>

      {/* Share Modal - rendered as overlay */}
      {showShareModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <ShareChallenge
            challengeUrl={challengeUrl}
            opponentName={opponentName}
            boardSize={boardSize}
            round={currentRound}
            onCancel={handleCloseShareModal}
            opponentHasDiscord={opponentHasDiscord}
          />
        </div>
      )}
    </div>
  );
}
