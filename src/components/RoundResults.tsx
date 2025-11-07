/**
 * RoundResults component for displaying round outcomes
 * @module components/RoundResults
 */

import { type ReactElement, useMemo, useState, useCallback } from 'react';
import type { RoundResult } from '@/types';
import { generateCombinedBoardSvg } from '@/utils/combined-board-svg';
import { getOutcomeGraphic, getSharedGraphic } from '@/utils/creature-graphics';
import { CREATURES } from '@/types/creature';
import { HelpModal } from './HelpModal';
import styles from './RoundResults.module.css';

export interface RoundResultsProps {
  /** Round result data */
  result: RoundResult;
  /** Player's name */
  playerName: string;
  /** Opponent's name */
  opponentName: string;
  /** Current player score */
  playerScore: number;
  /** Current opponent score */
  opponentScore: number;
  /** Callback to continue to next round */
  onContinue: () => void;
  /** Optional custom text for continue button */
  continueButtonText?: string;
}

/**
 * Round results display component.
 *
 * Shows:
 * - Round winner
 * - Board thumbnails for both players
 * - Final positions
 * - Current scores
 *
 * @component
 */
export function RoundResults({
  result,
  playerName,
  opponentName,
  playerScore,
  opponentScore,
  onContinue,
  continueButtonText = 'Continue to Next Round',
}: RoundResultsProps): ReactElement {
  const { winner, playerBoard, opponentBoard, playerFinalPosition, opponentFinalPosition } = result;

  // Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [explanations, setExplanations] = useState<string[]>([]);

  // Help modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Calculate the last step index executed for each player
  const getLastExecutedStepIndex = useCallback((
    sequence: typeof playerBoard.sequence,
    moveCount: number,
    hitTrap: boolean
  ): number => {
    if (sequence.length === 0) return -1;

    if (hitTrap) {
      // Find the index of the Nth piece move (where N = moveCount)
      let pieceCount = 0;
      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i]!.type === 'piece') {
          pieceCount++;
          if (pieceCount === moveCount) {
            return i;
          }
        }
      }
    }

    // If they didn't hit a trap, they executed all steps in their sequence
    return sequence.length - 1;
  }, []);

  // Get last executed step from simulation details (if available) or calculate it
  const playerLastStep = result.simulationDetails?.playerLastStep !== undefined
    ? result.simulationDetails.playerLastStep
    : result.simulationDetails
    ? getLastExecutedStepIndex(
        playerBoard.sequence,
        result.simulationDetails.playerMoves,
        result.simulationDetails.playerHitTrap
      )
    : playerBoard.sequence.length - 1;

  const opponentLastStep = result.simulationDetails?.opponentLastStep !== undefined
    ? result.simulationDetails.opponentLastStep
    : result.simulationDetails
    ? getLastExecutedStepIndex(
        opponentBoard.sequence,
        result.simulationDetails.opponentMoves,
        result.simulationDetails.opponentHitTrap
      )
    : opponentBoard.sequence.length - 1;

  const maxSteps = Math.max(playerLastStep, opponentLastStep) + 1;

  // Generate combined board SVG (either full or up to current step during replay)
  const combinedBoardSvgData = useMemo(
    () => {
      console.log('[RoundResults] Generating combined board SVG...', {
        isReplaying,
        playerBoard: playerBoard?.name,
        opponentBoard: opponentBoard?.name,
      });

      if (isReplaying) {
        // During replay, show only up to current step for both players
        const playerReplayMax = Math.min(currentStep - 1, playerLastStep);
        const opponentReplayMax = Math.min(currentStep - 1, opponentLastStep);
        const data = generateCombinedBoardSvg(playerBoard, opponentBoard, result, playerReplayMax, opponentReplayMax);
        console.log('[RoundResults] Generated SVG (replay):', data.svg.substring(0, 100));
        return data;
      }
      // Normal view, show only executed moves (hide opponent moves that weren't executed)
      const data = generateCombinedBoardSvg(playerBoard, opponentBoard, result, playerLastStep, opponentLastStep);
      console.log('[RoundResults] Generated SVG (normal):', data.svg.substring(0, 100));
      return data;
    },
    [playerBoard, opponentBoard, result, currentStep, isReplaying, playerLastStep, opponentLastStep]
  );

  // Generate explanation text for a step (with scoring)
  const getStepExplanation = useCallback((step: number): string[] => {
    const size = playerBoard.grid.length;
    const explanations: string[] = [];

    // Helper to rotate position
    const rotatePosition = (row: number, col: number) => ({
      row: size - 1 - row,
      col: size - 1 - col,
    });

    // Helper to check if position matches
    const positionsMatch = (p1: { row: number; col: number }, p2: { row: number; col: number }) =>
      p1.row === p2.row && p1.col === p2.col;

    // Reconstruct positions and traps up to this step
    let playerPosition: { row: number; col: number } | null = null;
    let opponentPosition: { row: number; col: number } | null = null;
    const playerTraps: Array<{ row: number; col: number }> = [];
    const opponentTraps: Array<{ row: number; col: number }> = [];
    let playerRoundEnded = false;
    let opponentRoundEnded = false;

    // Replay all previous steps to get current state and check if round ended
    for (let i = 0; i < step; i++) {
      if (!playerRoundEnded && i <= playerLastStep && i < playerBoard.sequence.length) {
        const move = playerBoard.sequence[i]!;
        if (move.type === 'piece') {
          playerPosition = move.position;
        } else if (move.type === 'trap') {
          playerTraps.push(move.position);
        } else if (move.type === 'final') {
          playerRoundEnded = true;
        }
      }

      if (!opponentRoundEnded && i <= opponentLastStep && i < opponentBoard.sequence.length) {
        const move = opponentBoard.sequence[i]!;
        const rotated = rotatePosition(move.position.row, move.position.col);
        if (move.type === 'piece') {
          opponentPosition = rotated;
        } else if (move.type === 'trap') {
          opponentTraps.push(rotated);
        } else if (move.type === 'final') {
          opponentRoundEnded = true;
        }
      }

      // Check if either player reached goal - round ends immediately
      if (playerRoundEnded || opponentRoundEnded) {
        break;
      }
    }

    // Track new positions and actions for this step
    let newPlayerPosition: { row: number; col: number } | null = null;
    let newOpponentPosition: { row: number; col: number } | null = null;

    // Process player action (only if they haven't ended yet and round hasn't ended)
    if (!playerRoundEnded && !opponentRoundEnded && step <= playerLastStep && step < playerBoard.sequence.length) {
      const move = playerBoard.sequence[step]!;
      if (move.type === 'piece') {
        explanations.push(`Player moves to (${move.position.row}, ${move.position.col})`);

        // Check for forward movement scoring
        if (playerPosition !== null && move.position.row < playerPosition.row) {
          explanations.push('  +1 point (forward movement)');
        }

        newPlayerPosition = move.position;
      } else if (move.type === 'trap') {
        explanations.push(`Player places trap at (${move.position.row}, ${move.position.col})`);
        playerTraps.push(move.position);
      } else if (move.type === 'final') {
        explanations.push('Player reaches the goal!');
        explanations.push('  +1 point (goal reached)');
        playerRoundEnded = true;
      }
    }

    // Process opponent action (only if they haven't ended yet and round hasn't ended)
    if (!opponentRoundEnded && !playerRoundEnded && step <= opponentLastStep && step < opponentBoard.sequence.length) {
      const move = opponentBoard.sequence[step]!;
      const rotated = rotatePosition(move.position.row, move.position.col);
      if (move.type === 'piece') {
        explanations.push(`Opponent moves to (${rotated.row}, ${rotated.col})`);

        // Check for forward movement scoring (opponent's forward is towards higher row)
        if (opponentPosition !== null && rotated.row > opponentPosition.row) {
          explanations.push('  +1 point (forward movement)');
        }

        newOpponentPosition = rotated;
      } else if (move.type === 'trap') {
        explanations.push(`Opponent places trap at (${rotated.row}, ${rotated.col})`);
        opponentTraps.push(rotated);
      } else if (move.type === 'final') {
        explanations.push('Opponent reaches the goal!');
        explanations.push('  +1 point (goal reached)');
        opponentRoundEnded = true;
      }
    }

    // After both actions are processed, check for trap hits and collisions (only if round hasn't ended)
    if (!playerRoundEnded && !opponentRoundEnded) {
      if (newPlayerPosition) {
        // Check if player hit opponent's trap (including traps placed this turn)
        const hitTrap = opponentTraps.some(trap => positionsMatch(trap, newPlayerPosition!));
        if (hitTrap) {
          explanations.push('  -1 point (hit trap!)');
        }
      }

      if (newOpponentPosition) {
        // Check if opponent hit player's trap (including traps placed this turn)
        const hitTrap = playerTraps.some(trap => positionsMatch(trap, newOpponentPosition!));
        if (hitTrap) {
          explanations.push('  -1 point (hit trap!)');
        }
      }

      // Check for collision if both players moved to a position
      if (newPlayerPosition && newOpponentPosition && positionsMatch(newPlayerPosition, newOpponentPosition)) {
        explanations.push('  -1 point (collision!)');
      }
    }

    // Add round end message if appropriate
    if (playerRoundEnded || opponentRoundEnded) {
      if (playerRoundEnded) {
        explanations.push('');
        explanations.push('Round ends - Player reached the goal!');
      } else if (opponentRoundEnded) {
        explanations.push('');
        explanations.push('Round ends - Opponent reached the goal!');
      }
    }

    return explanations;
  }, [playerBoard, opponentBoard, playerLastStep, opponentLastStep]);

  // Start replay
  const handleReplay = useCallback(() => {
    const size = playerBoard.grid.length;
    const initialExplanations = [
      `Player starts with piece at (${size - 1}, 0)`,
      `Opponent starts with piece at (0, ${size - 1})`,
    ];
    setExplanations(initialExplanations);
    setCurrentStep(1); // Start at 1 so currentStep - 1 = 0, showing first pieces
    setIsReplaying(true);
  }, [playerBoard]);

  // Next step
  const handleNext = useCallback(() => {
    const newExplanations = getStepExplanation(currentStep);
    const allExplanations = [...newExplanations];

    // Check if either player ended at this step
    if (result.simulationDetails) {
      // Player hit trap at this step
      if (currentStep === playerLastStep && result.simulationDetails.playerHitTrap) {
        allExplanations.push('Player hit a trap and stopped!');
      }

      // Opponent hit trap at this step
      if (currentStep === opponentLastStep && result.simulationDetails.opponentHitTrap) {
        allExplanations.push('Opponent hit a trap and stopped!');
      }
    }

    setExplanations(prev => [...prev, ...allExplanations]);
    setCurrentStep(prev => prev + 1);
  }, [currentStep, getStepExplanation, playerLastStep, opponentLastStep, result.simulationDetails]);

  // Stop replay
  const handleStopReplay = useCallback(() => {
    setIsReplaying(false);
    setCurrentStep(0);
    setExplanations([]);
  }, []);

  const getWinnerText = (): string => {
    if (winner === 'player') {
      return `${playerName} Wins!`;
    } else if (winner === 'opponent') {
      return `${opponentName} Wins!`;
    } else {
      return "It's a Tie!";
    }
  };

  const getWinnerEmoji = (): string => {
    if (winner === 'player') {
      return '🎉';
    } else if (winner === 'opponent') {
      return '😔';
    } else {
      return '🤝';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.emoji}>{getWinnerEmoji()}</div>
        <h2 className={styles.title}>Round {result.round} Complete</h2>
        <h3 className={`${styles.winnerText} ${styles[`winner${winner}`]}`}>
          {getWinnerText()}
        </h3>
      </div>

      {/* Creature Outcome Graphics */}
      {result.playerCreature && result.opponentCreature && (() => {
        const playerCreature = CREATURES[result.playerCreature];
        const opponentCreature = CREATURES[result.opponentCreature];

        if (!playerCreature || !opponentCreature) return null;

        return (
          <div className={styles.creatureOutcomeSection}>
            {result.collision ? (
              // Show single collision graphic
              <div className={styles.outcomeGraphicSingle}>
                <img
                  src={getSharedGraphic('collision')}
                  alt="Collision! Both creatures crashed into each other"
                  className={styles.outcomeImage}
                />
                <p className={styles.outcomeCaption}>Collision!</p>
              </div>
            ) : (
              // Show split player/opponent graphics
              <div className={styles.outcomeGraphicSplit}>
                <div className={styles.outcomeGraphicItem}>
                  <img
                    src={getOutcomeGraphic(result.playerCreature, result.playerVisualOutcome ?? 'forward')}
                    alt={`${playerCreature.name}: ${result.playerVisualOutcome ?? 'forward'}`}
                    className={styles.outcomeImage}
                  />
                  <p className={styles.outcomeCaption}>
                    {playerName} - {playerCreature.name}
                  </p>
                </div>
                <div className={styles.outcomeGraphicItem}>
                  <img
                    src={getOutcomeGraphic(result.opponentCreature, result.opponentVisualOutcome ?? 'forward')}
                    alt={`${opponentCreature.name}: ${result.opponentVisualOutcome ?? 'forward'}`}
                    className={styles.outcomeImage}
                  />
                  <p className={styles.outcomeCaption}>
                    {opponentName} - {opponentCreature.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Round Scores Display */}
      <div className={styles.roundScoreSection}>
        <div className={styles.roundScoreHeader}>
          <h4 className={styles.roundScoreTitle}>Round Score</h4>
          {!isReplaying ? (
            <button onClick={handleReplay} className={styles.replayButton}>
              ▶ Replay
            </button>
          ) : (
            <button onClick={handleStopReplay} className={styles.replayButton}>
              ⏹ Stop
            </button>
          )}
        </div>
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreItem}>
            <span className={styles.scoreName}>{playerName}</span>
            <span className={styles.scoreValue}>{result.playerPoints ?? 0}</span>
          </div>
          <span className={styles.scoreDivider}>-</span>
          <div className={styles.scoreItem}>
            <span className={styles.scoreName}>{opponentName}</span>
            <span className={styles.scoreValue}>{result.opponentPoints ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Combined Board Display */}
      <div className={styles.combinedBoard}>
        <h4 className={styles.boardTitle}>
          Combined Board View{' '}
          <button
            className={styles.helpIcon}
            onClick={(e) => {
              e.preventDefault();
              setIsHelpModalOpen(true);
            }}
            title="Why are some opponent moves hidden?"
          >
            (?)
          </button>
        </h4>
        <div className={styles.boardContainer}>
          {isReplaying && currentStep < maxSteps && (
            <button onClick={handleNext} className={styles.nextButton}>
              Next
            </button>
          )}
          <div
            className={styles.boardThumbnail}
            dangerouslySetInnerHTML={{ __html: combinedBoardSvgData.svg }}
          />
        </div>
        {isReplaying && (
          <div className={styles.explanations}>
            {explanations.map((text, index) => (
              <div key={index} className={styles.explanationLine}>
                {text}
              </div>
            ))}
          </div>
        )}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendCircle} style={{ backgroundColor: 'rgb(37, 99, 235)' }}></div>
            <span>{playerName}</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendCircle} style={{ backgroundColor: 'rgb(147, 51, 234)' }}></div>
            <span>{opponentName}</span>
          </div>
        </div>
      </div>

      {/* Board Details */}
      <div className={styles.boardDetails}>
        <div className={styles.detailSection}>
          <h5>{playerName}</h5>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Board:</span>
            <span className={styles.detailValue}>{playerBoard.name}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Final Position:</span>
            <span className={styles.detailValue}>
              ({playerFinalPosition.row}, {playerFinalPosition.col})
            </span>
          </div>
        </div>
        <div className={styles.detailSection}>
          <h5>{opponentName}</h5>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Board:</span>
            <span className={styles.detailValue}>{opponentBoard.name}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Final Position:</span>
            <span className={styles.detailValue}>
              ({opponentFinalPosition.row}, {opponentFinalPosition.col})
            </span>
          </div>
        </div>
      </div>

      {/* Total Score Display */}
      <div className={styles.totalScoreSection}>
        <h4 className={styles.totalScoreTitle}>Total Score</h4>
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreItem}>
            <span className={styles.scoreName}>{playerName}</span>
            <span className={styles.scoreValue}>{playerScore}</span>
          </div>
          <span className={styles.scoreDivider}>-</span>
          <div className={styles.scoreItem}>
            <span className={styles.scoreName}>{opponentName}</span>
            <span className={styles.scoreValue}>{opponentScore}</span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button onClick={onContinue} className={styles.continueButton}>
        {continueButtonText}
      </button>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
