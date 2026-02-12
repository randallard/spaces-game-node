/**
 * AllRoundsResults component for displaying all 10 round results
 * @module components/AllRoundsResults
 */

import { type ReactElement, useState } from 'react';
import type { RoundResult, Board, UserProfile } from '@/types';
import { RoundResults } from './RoundResults';
import { HelpModal } from './HelpModal';
import { SavedBoards } from './SavedBoards';
import { generateOpponentThumbnail, generateBoardThumbnail, generateBlankThumbnail } from '@/utils/svg-thumbnail';
import { getOutcomeGraphic, getSharedGraphic } from '@/utils/creature-graphics';
import { CREATURES } from '@/types/creature';
import styles from './AllRoundsResults.module.css';

export interface AllRoundsResultsProps {
  /** All round results */
  results: RoundResult[];
  /** Player's name */
  playerName: string;
  /** Opponent's name */
  opponentName: string;
  /** Final player score */
  playerScore: number;
  /** Final opponent score */
  opponentScore: number;
  /** Overall winner */
  winner: 'player' | 'opponent' | 'tie';
  /** Callback to play again */
  onPlayAgain: () => void;
  /** Optional user preference for showing complete results */
  showCompleteResultsByDefault?: boolean;
  /** Optional callback when the show complete results preference changes */
  onShowCompleteResultsChange?: (value: boolean) => void;
  /** Optional user preference for explanation style */
  explanationStyle?: 'lively' | 'technical';
  /** Optional callback when the explanation style preference changes */
  onExplanationStyleChange?: (value: 'lively' | 'technical') => void;
  /** Optional custom button text */
  continueButtonText?: string;
  /** Optional: hide the header if this is mid-game review */
  isReview?: boolean;
  /** Whether opponent has Discord connected */
  opponentHasDiscord?: boolean;
  /** Opponent's Discord username */
  opponentDiscordUsername?: string;
  /** Whether current user has Discord connected */
  userHasDiscord?: boolean;
  /** Callback when user wants to connect Discord */
  onConnectDiscord?: () => void;
  /** Whether Discord connection is in progress */
  isConnectingDiscord?: boolean;
  /** Whether we're waiting for opponent to select their next board */
  waitingForOpponentBoard?: boolean;
  /** The round number we're waiting for */
  nextRound?: number;
  /** Whether opponent is CPU (to hide Discord connection UI) */
  isCpuOpponent?: boolean;
  /** Game info header props (when isReview={true}) */
  currentRound?: number;
  totalRounds?: number;
  boardSize?: number;
  onResendLink?: () => void;
  /** Board selection props (optional, for review mode) */
  boards?: Board[];
  onBoardSelected?: (board: Board) => void;
  onBoardSaved?: (board: Board) => void;
  onBoardDeleted?: (boardId: string) => void;
  showBoardSelection?: boolean;
  playerSelectedBoard?: Board | null;
  opponentSelectedBoard?: Board | null;
  user?: UserProfile | null;
}

/**
 * All rounds results component for deck mode.
 *
 * Shows:
 * - Overview of all 10 rounds
 * - Points scored per round
 * - Board thumbnails
 * - Click any round to see detailed replay
 *
 * @component
 */
export function AllRoundsResults({
  results,
  playerName,
  opponentName,
  playerScore,
  opponentScore,
  winner,
  onPlayAgain,
  showCompleteResultsByDefault = false,
  onShowCompleteResultsChange,
  explanationStyle = 'lively',
  onExplanationStyleChange,
  continueButtonText,
  isReview = false,
  opponentHasDiscord = false,
  opponentDiscordUsername,
  userHasDiscord = false,
  onConnectDiscord,
  isConnectingDiscord = false,
  waitingForOpponentBoard = false,
  nextRound,
  isCpuOpponent = false,
  currentRound,
  totalRounds,
  boardSize,
  onResendLink,
  boards,
  onBoardSelected,
  onBoardSaved,
  onBoardDeleted,
  showBoardSelection = false,
  playerSelectedBoard,
  opponentSelectedBoard,
  user,
}: AllRoundsResultsProps): ReactElement {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'thumbnails' | 'creatures' | 'both'>('both');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Calculate running totals for each round
  const runningTotals = results.reduce(
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

  const getWinnerEmoji = (): string => {
    if (winner === 'player') return '🎉';
    if (winner === 'opponent') return '😔';
    return '🤝';
  };

  const getWinnerText = (): string => {
    if (winner === 'player') return `${playerName} Wins!`;
    if (winner === 'opponent') return `${opponentName} Wins!`;
    return "It's a Tie!";
  };

  // Handle continuing to next round in modal
  const handleContinueFromRound = () => {
    if (selectedRound !== null && selectedRound < results.length) {
      // Check if next round exists and has valid data
      const nextRound = selectedRound + 1;
      const nextResult = results[nextRound - 1];

      // Only advance if next round has both boards (is complete)
      if (nextResult && nextResult.playerBoard && nextResult.opponentBoard) {
        setSelectedRound(nextRound);
      } else {
        // Next round is incomplete, close modal
        setSelectedRound(null);
      }
    } else {
      // Last round, close modal
      setSelectedRound(null);
    }
  };

  // If a round is selected, show the RoundResults component
  if (selectedRound !== null) {
    const result = results[selectedRound - 1];
    if (!result) return <div>Invalid round selected</div>;

    const runningTotal = runningTotals[selectedRound - 1];
    if (!runningTotal) return <div>Invalid running total</div>;

    return (
      <div className={styles.modalOverlay} onClick={() => setSelectedRound(null)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.closeButton}
            onClick={() => setSelectedRound(null)}
            aria-label="Close"
          >
            ×
          </button>
          <RoundResults
            result={result}
            playerName={playerName}
            opponentName={opponentName}
            playerScore={runningTotal.player}
            opponentScore={runningTotal.opponent}
            onContinue={handleContinueFromRound}
            continueButtonText={(() => {
              // Check if this is the last complete round
              if (selectedRound === results.length) {
                return 'Back to All Rounds';
              }

              // Check if next round exists and is complete
              const nextRound = selectedRound + 1;
              const nextResult = results[nextRound - 1];
              if (!nextResult || !nextResult.playerBoard || !nextResult.opponentBoard) {
                return 'Back to All Rounds';
              }

              return `Continue to Round ${nextRound}`;
            })()}
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
      {/* Header - only show if not in review mode */}
      {!isReview && (
        <div className={styles.header}>
          <div className={styles.emoji}>{getWinnerEmoji()}</div>
          <h2 className={styles.title}>Game Complete!</h2>
          <h3 className={`${styles.winnerText} ${styles[`winner${winner}`]}`}>
            {getWinnerText()}
          </h3>
        </div>
      )}

      {/* Game Info Header - shown when review mode with game context */}
      {isReview && currentRound && totalRounds && boardSize && (
        <div className={styles.gameInfoHeader}>
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
            {/* Re-send link for human opponents */}
            {onResendLink && !isCpuOpponent && (
              <button
                onClick={onResendLink}
                className={styles.reSendLink}
                title="Click to re-send game link"
              >
                (click here to re-send game link)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review Section Header */}
      {isReview && (
        <div className={styles.reviewSection}>
          <h2 className={styles.reviewTitle}>Previous Rounds</h2>
          <p className={styles.reviewSubtitle}>Review the game so far before selecting your next board</p>
        </div>
      )}

      {/* Final Score - only for non-review mode */}
      {!isReview && (
        <div className={styles.finalScore}>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>{playerName}</span>
            <span className={styles.scoreValue}>{playerScore}</span>
          </div>
          <span className={styles.scoreDivider}>-</span>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>{opponentName}</span>
            <span className={styles.scoreValue}>{opponentScore}</span>
          </div>
        </div>
      )}

      {/* Rounds Grid */}
      <div className={styles.roundsSection}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>
            All Rounds (Click to view details){' '}
            <button
              className={styles.helpLink}
              onClick={(e) => {
                e.preventDefault();
                setIsHelpModalOpen(true);
              }}
            >
              (shown opponent moves...)
            </button>
          </h4>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${viewMode === 'thumbnails' ? styles.toggleButtonActive : ''}`}
              onClick={() => setViewMode('thumbnails')}
              title="Show board thumbnails"
            >
              Boards
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'creatures' ? styles.toggleButtonActive : ''}`}
              onClick={() => setViewMode('creatures')}
              title="Show creature outcome graphics"
            >
              Creatures
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'both' ? styles.toggleButtonActive : ''}`}
              onClick={() => setViewMode('both')}
              title="Show both boards and creatures"
            >
              Both
            </button>
          </div>
        </div>
        <div className={styles.roundsGrid}>
          {results.map((result) => {
            const roundWinner = result.winner;
            const isIncomplete = roundWinner === undefined;
            const roundWinnerClass = isIncomplete
              ? styles.roundIncomplete
              : roundWinner === 'player'
              ? styles.roundWinnerPlayer
              : roundWinner === 'opponent'
              ? styles.roundWinnerOpponent
              : styles.roundWinnerTie;

            return (
              <button
                key={result.round}
                className={`${styles.roundCard} ${roundWinnerClass}`}
                onClick={() => !isIncomplete && setSelectedRound(result.round)}
                disabled={isIncomplete}
              >
                <div className={styles.roundHeader}>
                  <span className={styles.roundNumber}>Round {result.round}</span>
                  {roundWinner !== undefined && (
                    <span className={styles.roundWinnerLabel}>
                      {roundWinner === 'player'
                        ? `${playerName} Won`
                        : roundWinner === 'opponent'
                        ? `${opponentName} Won`
                        : 'Tie'}
                    </span>
                  )}
                  {roundWinner === undefined && (
                    <span className={styles.roundWinnerLabel} style={{ color: '#999', fontStyle: 'italic' }}>
                      In Progress
                    </span>
                  )}
                </div>

                {/* Board Thumbnails - shown when viewMode is 'thumbnails' or 'both' */}
                {(viewMode === 'thumbnails' || viewMode === 'both') && (
                  <div className={styles.boardThumbnails}>
                    <div className={styles.thumbnailWrapper}>
                      <span className={styles.thumbnailLabel}>{playerName}</span>
                      {result.playerBoard ? (
                        <img
                          src={generateBoardThumbnail(result.playerBoard)}
                          alt={result.playerBoard.name}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.thumbnailPlaceholder}>
                          ?
                        </div>
                      )}
                    </div>
                    <div className={styles.thumbnailWrapper}>
                      <span className={styles.thumbnailLabel}>
                        {opponentName}{result.forfeit ? ' (Forfeit)' : ''}
                      </span>
                      {result.forfeit ? (
                        <img
                          src={generateBlankThumbnail(result.playerBoard?.boardSize ?? 2)}
                          alt="Forfeited"
                          className={styles.thumbnail}
                        />
                      ) : result.opponentBoard ? (
                        <img
                          src={generateOpponentThumbnail(
                            result.opponentBoard,
                            result.simulationDetails?.opponentLastStep,
                            result.simulationDetails?.playerTrapPosition // Only show trap at position player hit
                          )}
                          alt={result.opponentBoard.name}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.thumbnailPlaceholder}>
                          ?
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Creature Graphics - shown when viewMode is 'creatures' or 'both' */}
                {(viewMode === 'creatures' || viewMode === 'both') && result.playerCreature && result.opponentCreature && (() => {
                  const playerCreature = CREATURES[result.playerCreature];
                  const opponentCreature = CREATURES[result.opponentCreature];

                  if (!playerCreature || !opponentCreature) return null;

                  return (
                    <div className={styles.creatureGraphics}>
                      {result.collision ? (
                        <div className={styles.creatureWrapper}>
                          <img
                            src={getSharedGraphic('collision')}
                            alt="Collision!"
                            className={styles.creatureImage}
                          />
                        </div>
                      ) : (
                        <>
                          <div className={styles.creatureWrapper}>
                            <span className={styles.creatureLabel}>{playerName}</span>
                            <img
                              src={getOutcomeGraphic(result.playerCreature, result.playerVisualOutcome ?? 'forward')}
                              alt={`${playerCreature.name}: ${result.playerVisualOutcome ?? 'forward'}`}
                              className={styles.creatureImage}
                            />
                          </div>
                          <div className={styles.creatureWrapper}>
                            <span className={styles.creatureLabel}>{opponentName}</span>
                            <img
                              src={getOutcomeGraphic(result.opponentCreature, result.opponentVisualOutcome ?? 'forward')}
                              alt={`${opponentCreature.name}: ${result.opponentVisualOutcome ?? 'forward'}`}
                              className={styles.creatureImage}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Points */}
                <div className={styles.roundPoints}>
                  <div className={styles.pointsItem}>
                    <span className={styles.pointsValue}>{result.playerPoints ?? 0}</span>
                    <span className={styles.pointsLabel}>pts</span>
                  </div>
                  <span className={styles.pointsDivider}>-</span>
                  <div className={styles.pointsItem}>
                    <span className={styles.pointsValue}>{result.opponentPoints ?? 0}</span>
                    <span className={styles.pointsLabel}>pts</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discord Status Section (only show in review mode for human opponents) */}
      {isReview && !isCpuOpponent && (opponentHasDiscord || onConnectDiscord) && (
        <div className={styles.discordSection}>
          {/* Show opponent's Discord status */}
          {opponentHasDiscord && (
            <div className={styles.discordStatus}>
              <div className={styles.discordIcon}>🔔</div>
              <div className={styles.discordInfo}>
                <strong>{opponentName}</strong> is connected to Discord
                {opponentDiscordUsername && (
                  <span className={styles.discordUsername}> (@{opponentDiscordUsername})</span>
                )}
                <p className={styles.discordHint}>
                  They'll be notified automatically when you make your move!
                </p>
              </div>
            </div>
          )}

          {/* Show user's Discord connection option */}
          {!userHasDiscord && onConnectDiscord && (
            <div className={styles.discordConnect}>
              <button
                onClick={onConnectDiscord}
                className={styles.discordConnectButton}
                disabled={isConnectingDiscord}
              >
                {isConnectingDiscord ? (
                  <>
                    <span className={styles.spinner}>⏳</span> Connecting to Discord...
                  </>
                ) : (
                  <>
                    <span className={styles.discordLogo}>💬</span> Connect to Discord
                  </>
                )}
              </button>
              <p className={styles.discordConnectHint}>
                Get notified when {opponentName} makes their move
              </p>
            </div>
          )}

          {/* Show user's connected status */}
          {userHasDiscord && (
            <div className={styles.discordConnected}>
              <div className={styles.discordIcon}>✅</div>
              <p>You're connected to Discord and will receive notifications!</p>
            </div>
          )}
        </div>
      )}

      {/* Waiting for Opponent Message */}
      {waitingForOpponentBoard && nextRound && (
        <div className={styles.waitingMessage}>
          <div className={styles.waitingIcon}>⏳</div>
          <h3 className={styles.waitingTitle}>Next Up: Round {nextRound}</h3>
          <p className={styles.waitingText}>
            {opponentName} still needs to select their board for round {nextRound}.
            {opponentHasDiscord && opponentDiscordUsername ? (
              <> You'll receive a Discord notification (<strong>{opponentDiscordUsername}</strong>) after they select their board.</>
            ) : (
              <> After they select their board, they'll share the game link with you!</>
            )}
          </p>
        </div>
      )}

      {/* Board Selection Section - shown when player needs to select */}
      {isReview && showBoardSelection && boards && onBoardSelected && nextRound && (
        <div className={styles.boardSelectionSection}>
          <h3 className={styles.boardSelectionTitle}>Select a Board for Round {nextRound}</h3>
          <SavedBoards
            boards={boardSize ? boards.filter(board => board.boardSize === boardSize) : boards}
            onBoardSelected={onBoardSelected}
            onBoardSaved={onBoardSaved!}
            onBoardDeleted={onBoardDeleted!}
            currentRound={nextRound}
            userName={playerName}
            opponentName={opponentName}
            user={user}
            initialBoardSize={null}
            onInitialBoardSizeHandled={() => {}}
            roundHistory={[]} // Don't show round history here (already shown above)
            showBoardSelection={true}
            playerSelectedBoard={playerSelectedBoard}
            opponentSelectedBoard={opponentSelectedBoard}
          />
        </div>
      )}

      {/* Actions */}
      {!waitingForOpponentBoard && !showBoardSelection && (
        <div className={styles.actions}>
          <button onClick={onPlayAgain} className={styles.playAgainButton}>
            {continueButtonText || 'Play Again'}
          </button>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
