/**
 * GameOver component for final game screen
 * @module components/GameOver
 */

import { type ReactElement, useState } from 'react';
import type { RoundResult, UserStats } from '@/types';
import { RoundResults } from './RoundResults';
import { HelpModal } from './HelpModal';
import { generateOpponentThumbnail, generateBoardThumbnail } from '@/utils/svg-thumbnail';
import { getOutcomeGraphic, getSharedGraphic } from '@/utils/creature-graphics';
import { CREATURES } from '@/types/creature';
import styles from './GameOver.module.css';

export interface GameOverProps {
  /** Winner of the game */
  winner: 'player' | 'opponent' | 'tie';
  /** Player's name */
  playerName: string;
  /** Opponent's name */
  opponentName: string;
  /** Final player score */
  playerScore: number;
  /** Final opponent score */
  opponentScore: number;
  /** Round history */
  roundHistory: RoundResult[];
  /** Player's stats (optional) */
  playerStats?: UserStats;
  /** Callback to start new game */
  onNewGame: () => void;
  /** Callback to share game URL (optional) */
  onShare?: () => void;
  /** Optional user preference for showing complete results */
  showCompleteResultsByDefault?: boolean;
  /** Optional callback when the show complete results preference changes */
  onShowCompleteResultsChange?: (value: boolean) => void;
  /** Optional user preference for explanation style */
  explanationStyle?: 'lively' | 'technical';
  /** Optional callback when the explanation style preference changes */
  onExplanationStyleChange?: (value: 'lively' | 'technical') => void;
  /** Mobile explanation mode preference */
  mobileExplanationMode?: 'overlay' | 'below' | 'hidden';
  /** Callback when mobile explanation mode changes */
  onMobileExplanationModeChange?: (value: 'overlay' | 'below' | 'hidden') => void;
}

/**
 * Game over screen component.
 *
 * Shows:
 * - Final winner
 * - Final scores
 * - Round-by-round results
 * - Player statistics
 * - Options to play again or share
 *
 * @component
 */
export function GameOver({
  winner,
  playerName,
  opponentName,
  playerScore,
  opponentScore,
  roundHistory,
  playerStats,
  onNewGame,
  onShare,
  showCompleteResultsByDefault = false,
  onShowCompleteResultsChange,
  explanationStyle = 'lively',
  onExplanationStyleChange,
  mobileExplanationMode = 'overlay',
  onMobileExplanationModeChange,
}: GameOverProps): ReactElement {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'thumbnails' | 'creatures' | 'both'>('both');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Calculate running totals for each round
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

  const getWinnerText = (): string => {
    if (winner === 'player') {
      return `${playerName} Wins the Game!`;
    } else if (winner === 'opponent') {
      return `${opponentName} Wins the Game!`;
    } else {
      return "It's a Tie Game!";
    }
  };

  const getWinnerEmoji = (): string => {
    if (winner === 'player') {
      return '🏆';
    } else if (winner === 'opponent') {
      return '👑';
    } else {
      return '🤝';
    }
  };

  // Handle continuing to next round in modal
  const handleContinueFromRound = () => {
    if (selectedRound !== null && selectedRound < roundHistory.length) {
      // Advance to next round
      setSelectedRound(selectedRound + 1);
    } else {
      // Last round, close modal
      setSelectedRound(null);
    }
  };

  // If a round is selected, show the RoundResults component
  if (selectedRound !== null) {
    const result = roundHistory[selectedRound - 1];
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
            continueButtonText={
              selectedRound === roundHistory.length
                ? 'Back to Summary'
                : `Continue to Round ${selectedRound + 1}`
            }
            showCompleteResultsByDefault={showCompleteResultsByDefault}
            onShowCompleteResultsChange={onShowCompleteResultsChange}
            explanationStyle={explanationStyle}
            onExplanationStyleChange={onExplanationStyleChange}
            mobileExplanationMode={mobileExplanationMode}
            onMobileExplanationModeChange={onMobileExplanationModeChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.trophy}>{getWinnerEmoji()}</div>
        <h1 className={`${styles.winnerText} ${styles[`winner${winner}`]}`}>
          {getWinnerText()}
        </h1>
      </div>

      {/* Final Score */}
      <div className={styles.scoreSection}>
        <h2 className={styles.sectionTitle}>Final Score</h2>
        <div className={styles.finalScore}>
          <div className={styles.finalScoreItem}>
            <span className={styles.finalScoreName}>{playerName}</span>
            <span className={styles.finalScoreValue}>{playerScore}</span>
          </div>
          <span className={styles.finalScoreDivider}>-</span>
          <div className={styles.finalScoreItem}>
            <span className={styles.finalScoreName}>{opponentName}</span>
            <span className={styles.finalScoreValue}>{opponentScore}</span>
          </div>
        </div>
      </div>

      {/* Round History */}
      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Round-by-Round Results (Click to review){' '}
            <button
              className={styles.helpLink}
              onClick={(e) => {
                e.preventDefault();
                setIsHelpModalOpen(true);
              }}
            >
              (shown opponent moves...)
            </button>
          </h2>
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
          {roundHistory.map((result) => {
            const roundWinner = result.winner;
            const roundWinnerClass =
              roundWinner === 'player'
                ? styles.roundWinnerPlayer
                : roundWinner === 'opponent'
                ? styles.roundWinnerOpponent
                : styles.roundWinnerTie;

            return (
              <button
                key={result.round}
                className={`${styles.roundCard} ${roundWinnerClass}`}
                onClick={() => setSelectedRound(result.round)}
              >
                <div className={styles.roundHeader}>
                  <span className={styles.roundNumber}>Round {result.round}</span>
                  <span className={styles.roundWinnerLabel}>
                    {roundWinner === 'player'
                      ? `${playerName} Won`
                      : roundWinner === 'opponent'
                      ? `${opponentName} Won`
                      : 'Tie'}
                  </span>
                </div>

                {/* Board Thumbnails - shown when viewMode is 'thumbnails' or 'both' */}
                {(viewMode === 'thumbnails' || viewMode === 'both') && (
                  <div className={styles.boardThumbnails}>
                    <div className={styles.thumbnailWrapper}>
                      <span className={styles.thumbnailLabel}>{playerName}</span>
                      <img
                        src={generateBoardThumbnail(result.playerBoard)}
                        alt={result.playerBoard.name}
                        className={styles.thumbnail}
                      />
                    </div>
                    <div className={styles.thumbnailWrapper}>
                      <span className={styles.thumbnailLabel}>{opponentName}</span>
                      <img
                        src={generateOpponentThumbnail(
                          result.opponentBoard,
                          result.simulationDetails?.opponentLastStep,
                          result.simulationDetails?.playerTrapPosition // Only show trap at position player hit
                        )}
                        alt={result.opponentBoard.name}
                        className={styles.thumbnail}
                      />
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

      {/* Player Stats */}
      {playerStats && (
        <div className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Your Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{playerStats.totalGames}</span>
              <span className={styles.statLabel}>Games Played</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{playerStats.wins}</span>
              <span className={styles.statLabel}>Wins</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{playerStats.losses}</span>
              <span className={styles.statLabel}>Losses</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{playerStats.ties}</span>
              <span className={styles.statLabel}>Ties</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={onNewGame} className={styles.newGameButton}>
          Play Again
        </button>
        {onShare && (
          <button onClick={onShare} className={styles.shareButton}>
            Share Game
          </button>
        )}
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
