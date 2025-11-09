/**
 * AllRoundsResults component for displaying all 10 round results
 * @module components/AllRoundsResults
 */

import { type ReactElement, useState } from 'react';
import type { RoundResult } from '@/types';
import { RoundResults } from './RoundResults';
import { HelpModal } from './HelpModal';
import { generateOpponentThumbnail } from '@/utils/svg-thumbnail';
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
      // Advance to next round
      setSelectedRound(selectedRound + 1);
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
            continueButtonText={
              selectedRound === results.length
                ? 'Back to All Rounds'
                : `Continue to Round ${selectedRound + 1}`
            }
            showCompleteResultsByDefault={showCompleteResultsByDefault}
            onShowCompleteResultsChange={onShowCompleteResultsChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.emoji}>{getWinnerEmoji()}</div>
        <h2 className={styles.title}>Game Complete!</h2>
        <h3 className={`${styles.winnerText} ${styles[`winner${winner}`]}`}>
          {getWinnerText()}
        </h3>
      </div>

      {/* Final Score */}
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
                        src={result.playerBoard.thumbnail}
                        alt={result.playerBoard.name}
                        className={styles.thumbnail}
                      />
                    </div>
                    <div className={styles.thumbnailWrapper}>
                      <span className={styles.thumbnailLabel}>{opponentName}</span>
                      <img
                        src={generateOpponentThumbnail(
                          result.opponentBoard,
                          result.simulationDetails?.opponentLastStep
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

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={onPlayAgain} className={styles.playAgainButton}>
          Play Again
        </button>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
