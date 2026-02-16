/**
 * RoundResults component for displaying round outcomes
 * @module components/RoundResults
 */

import { type ReactElement, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { RoundResult } from '@/types';
import { generateCombinedBoardSvg } from '@/utils/combined-board-svg';
import { generateBlankThumbnail } from '@/utils/svg-thumbnail';
import { getOutcomeGraphic, getDefaultGraphic } from '@/utils/creature-graphics';
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
  /** Optional user preference for showing complete results */
  showCompleteResultsByDefault?: boolean;
  /** Optional callback when the show complete results preference changes */
  onShowCompleteResultsChange?: ((value: boolean) => void) | undefined;
  /** Optional user preference for explanation style */
  explanationStyle?: 'lively' | 'technical';
  /** Optional callback when the explanation style preference changes */
  onExplanationStyleChange?: ((value: 'lively' | 'technical') => void) | undefined;
  /** Optional flag to enable tutorial mode with instructions */
  isTutorial?: boolean;
  /** Optional flag indicating if waiting for opponent to respond */
  waitingForOpponentResponse?: boolean;
  /** Opponent's Discord ID (optional) */
  opponentDiscordId?: string | undefined;
  /** Opponent's Discord avatar hash (optional) */
  opponentDiscordAvatar?: string | undefined;
  /** Mobile explanation mode preference */
  mobileExplanationMode?: 'overlay' | 'below' | 'hidden';
  /** Callback when mobile explanation mode changes */
  onMobileExplanationModeChange?: ((value: 'overlay' | 'below' | 'hidden') => void) | undefined;
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
  showCompleteResultsByDefault = false,
  onShowCompleteResultsChange,
  explanationStyle = 'lively',
  onExplanationStyleChange,
  isTutorial = false,
  waitingForOpponentResponse = false,
  mobileExplanationMode = 'overlay',
  onMobileExplanationModeChange,
}: RoundResultsProps): ReactElement {
  const { winner, playerBoard, opponentBoard } = result;

  // Explanation entry: text with optional score deltas for the columns
  interface ExplanationEntry {
    text: string;
    playerDelta?: number;
    opponentDelta?: number;
  }

  // Replay state
  const [isReplaying, setIsReplaying] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [explanations, setExplanations] = useState<ExplanationEntry[]>([]);
  const [showCompleteResults, setShowCompleteResults] = useState(showCompleteResultsByDefault);

  // Ref for auto-scrolling explanations panel
  const explanationsRef = useRef<HTMLDivElement>(null);

  // Explanation style preference (from user profile)
  const useLivelyStyle = explanationStyle === 'lively';

  // Help modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Detect mobile viewport for conditional rendering
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Mobile overlay state
  const [mobileOverlayVisible, setMobileOverlayVisible] = useState(mobileExplanationMode === 'overlay' || mobileExplanationMode === undefined);
  const [mobileExplanationPosition, setMobileExplanationPosition] = useState<'overlay' | 'below' | 'hidden'>(mobileExplanationMode ?? 'overlay');
  const [overlayHelpModalOpen, setOverlayHelpModalOpen] = useState(false);

  // Ref for auto-scrolling overlay explanations
  const overlayExplanationsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll overlay explanations when new content is added
  useEffect(() => {
    if (overlayExplanationsRef.current) {
      overlayExplanationsRef.current.scrollTop = overlayExplanationsRef.current.scrollHeight;
    }
  }, [explanations]);

  // Toggle explanation style and update user profile
  const toggleExplanationStyle = () => {
    const newStyle = useLivelyStyle ? 'technical' : 'lively';
    onExplanationStyleChange?.(newStyle);
  };

  // Auto-scroll explanations panel to bottom when new content is added
  useEffect(() => {
    if (explanationsRef.current) {
      explanationsRef.current.scrollTop = explanationsRef.current.scrollHeight;
    }
  }, [explanations]);

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
      if (isReplaying) {
        // During replay, show only up to current step for both players
        const playerReplayMax = Math.min(currentStep - 1, playerLastStep);
        const opponentReplayMax = Math.min(currentStep - 1, opponentLastStep);
        return generateCombinedBoardSvg(playerBoard, opponentBoard, result, playerReplayMax, opponentReplayMax);
      }
      // Normal view, show only executed moves (hide opponent moves that weren't executed)
      return generateCombinedBoardSvg(playerBoard, opponentBoard, result, playerLastStep, opponentLastStep);
    },
    [playerBoard, opponentBoard, result, currentStep, isReplaying, playerLastStep, opponentLastStep]
  );

  // Generate explanation entries for a step (with score deltas in columns, not inline text)
  const getStepExplanation = useCallback((step: number, lively: boolean = useLivelyStyle): ExplanationEntry[] => {
    const size = playerBoard.grid.length;
    const entries: ExplanationEntry[] = [];

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
    let playerBestRow = Infinity; // Track closest row to goal (lowest index)
    let opponentBestRow = -Infinity; // Track closest row to goal (highest index)

    // Helper: use second-person verbs when name is "You"
    const isPlayerYou = playerName === 'You';
    const isOpponentYou = opponentName === 'You';

    // Replay all previous steps to get current state and check if round ended
    for (let i = 0; i < step; i++) {
      if (!playerRoundEnded && i <= playerLastStep && i < playerBoard.sequence.length) {
        const move = playerBoard.sequence[i]!;
        if (move.type === 'piece') {
          if (move.position.row < playerBestRow) {
            playerBestRow = move.position.row;
          }
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
          if (rotated.row > opponentBestRow) {
            opponentBestRow = rotated.row;
          }
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
        const isNewBestRow = playerPosition !== null && move.position.row < playerBestRow;
        entries.push({
          text: lively
            ? (isPlayerYou ? 'You move!' : `${playerName} moves!`)
            : `Player moves to (${move.position.row}, ${move.position.col})`,
          ...(isNewBestRow && { playerDelta: 1 }),
        });
        if (move.position.row < playerBestRow) {
          playerBestRow = move.position.row;
        }
        newPlayerPosition = move.position;
      } else if (move.type === 'trap') {
        entries.push({
          text: lively
            ? (isPlayerYou ? 'You set a trap!' : `${playerName} sets a trap!`)
            : `Player places trap at (${move.position.row}, ${move.position.col})`,
        });
        playerTraps.push(move.position);
      } else if (move.type === 'final') {
        entries.push({
          text: lively
            ? (isPlayerYou ? 'You make it to the goal!' : `${playerName} makes it to the goal!`)
            : 'Player reaches the goal!',
          playerDelta: 1,
        });
        playerRoundEnded = true;
      }
    }

    // Process opponent action (only if they haven't ended yet)
    // Note: do NOT check playerRoundEnded here — both players can reach the goal on the same step
    // This matches simulateRound() which only checks !opponentRoundEnded
    if (!opponentRoundEnded && step <= opponentLastStep && step < opponentBoard.sequence.length) {
      const move = opponentBoard.sequence[step]!;
      const rotated = rotatePosition(move.position.row, move.position.col);
      if (move.type === 'piece') {
        const isNewBestRow = opponentPosition !== null && rotated.row > opponentBestRow;
        entries.push({
          text: lively
            ? (isOpponentYou ? 'You move!' : `${opponentName} moves!`)
            : `Opponent moves to (${rotated.row}, ${rotated.col})`,
          ...(isNewBestRow && { opponentDelta: 1 }),
        });
        if (rotated.row > opponentBestRow) {
          opponentBestRow = rotated.row;
        }
        newOpponentPosition = rotated;
      } else if (move.type === 'trap') {
        entries.push({
          text: lively
            ? (isOpponentYou ? 'You set a trap!' : `${opponentName} sets a trap!`)
            : `Opponent places trap at (${rotated.row}, ${rotated.col})`,
        });
        opponentTraps.push(rotated);
      } else if (move.type === 'final') {
        entries.push({
          text: lively
            ? (isOpponentYou ? 'You make it to the goal!' : `${opponentName} makes it to the goal!`)
            : 'Opponent reaches the goal!',
          opponentDelta: 1,
        });
        opponentRoundEnded = true;
      }
    }

    // Update cumulative positions with new positions
    if (newPlayerPosition) {
      playerPosition = newPlayerPosition;
    }
    if (newOpponentPosition) {
      opponentPosition = newOpponentPosition;
    }

    // After both actions are processed, check for trap hits and collisions (only if round hasn't ended)
    if (!playerRoundEnded && !opponentRoundEnded) {
      if (newPlayerPosition) {
        const hitTrap = opponentTraps.some(trap => positionsMatch(trap, newPlayerPosition));
        if (hitTrap) {
          entries.push({
            text: lively
              ? (isPlayerYou ? '  You step right in the trap!' : `  ${playerName} steps right in the trap!`)
              : '  Player hit a trap!',
            playerDelta: -1,
          });
        }
      }

      if (newOpponentPosition) {
        const hitTrap = playerTraps.some(trap => positionsMatch(trap, newOpponentPosition));
        if (hitTrap) {
          entries.push({
            text: lively
              ? (isOpponentYou ? '  You step right in the trap!' : `  ${opponentName} steps right in the trap!`)
              : '  Opponent hit a trap!',
            opponentDelta: -1,
          });
        }
      }

      // Check for collision - both players at same position (regardless of when they arrived)
      if (playerPosition && opponentPosition && positionsMatch(playerPosition, opponentPosition)) {
        entries.push({
          text: lively
            ? '  Crash! They collide!'
            : '  Collision!',
          playerDelta: -1,
          opponentDelta: -1,
        });
      }
    }

    // Add round end message if appropriate
    if (playerRoundEnded || opponentRoundEnded) {
      entries.push({ text: '' });
      if (lively) {
        if (winner === 'player') {
          entries.push({ text: isPlayerYou ? 'Game over - You win!' : `Game over - ${playerName} wins!` });
        } else if (winner === 'opponent') {
          entries.push({ text: isOpponentYou ? 'Game over - You win!' : `Game over - ${opponentName} wins!` });
        } else {
          entries.push({ text: "Game over - it's a tie!" });
        }
      } else {
        if (playerRoundEnded && opponentRoundEnded) {
          entries.push({ text: 'Round ends - Both players reached the goal!' });
        } else if (playerRoundEnded) {
          entries.push({ text: 'Round ends - Player reached the goal!' });
        } else {
          entries.push({ text: 'Round ends - Opponent reached the goal!' });
        }
      }
    }

    return entries;
  }, [playerBoard, opponentBoard, playerLastStep, opponentLastStep, playerName, opponentName, explanationStyle, winner]);

  // Derive running score totals from explanation entries
  const runningScores = useMemo((): [number, number] => {
    let p = 0;
    let o = 0;
    for (const entry of explanations) {
      if (entry.playerDelta) p += entry.playerDelta;
      if (entry.opponentDelta) o += entry.opponentDelta;
    }
    return [Math.max(0, p), Math.max(0, o)];
  }, [explanations]);

  // Build initial explanation entries (pieces placed)
  const buildInitialEntries = useCallback((): ExplanationEntry[] => {
    const size = playerBoard.grid.length;
    return useLivelyStyle
      ? [{ text: 'Pieces placed!' }]
      : [
        { text: `Player starts with piece at (${size - 1}, 0)` },
        { text: `Opponent starts with piece at (0, ${size - 1})` },
      ];
  }, [playerBoard, explanationStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start replay
  const handleReplay = useCallback(() => {
    setExplanations(buildInitialEntries());
    setCurrentStep(1); // Start at 1 so currentStep - 1 = 0, showing first pieces
    setIsReplaying(true);
  }, [buildInitialEntries]);

  // Next step
  const handleNext = useCallback(() => {
    const newEntries = getStepExplanation(currentStep);
    const allEntries: ExplanationEntry[] = [...newEntries];

    // Check if either player ended at this step
    if (result.simulationDetails) {
      if (currentStep === playerLastStep && result.simulationDetails.playerHitTrap) {
        allEntries.push({
          text: useLivelyStyle ? (playerName === 'You' ? 'You are stopped!' : `${playerName} is stopped!`) : 'Player hit a trap and stopped!',
        });
      }
      if (currentStep === opponentLastStep && result.simulationDetails.opponentHitTrap) {
        allEntries.push({
          text: useLivelyStyle ? (opponentName === 'You' ? 'You are stopped!' : `${opponentName} is stopped!`) : 'Opponent hit a trap and stopped!',
        });
      }
    }

    setExplanations(prev => [...prev, ...allEntries]);
    setCurrentStep(prev => prev + 1);
  }, [currentStep, getStepExplanation, playerLastStep, opponentLastStep, result.simulationDetails, explanationStyle, playerName, opponentName]);

  // Build all entries from start to end
  const buildAllEntries = useCallback((): ExplanationEntry[] => {
    const allEntries = [...buildInitialEntries()];
    for (let step = 1; step < maxSteps; step++) {
      allEntries.push(...getStepExplanation(step));
    }
    return allEntries;
  }, [buildInitialEntries, maxSteps, getStepExplanation]);

  // Finish button - skip to end and show all results (without affecting preference)
  const handleFinish = useCallback(() => {
    setCurrentStep(maxSteps);
    if (currentStep < maxSteps) {
      setExplanations(buildAllEntries());
    }
  }, [maxSteps, currentStep, buildAllEntries]);

  // Automatically start replay when component mounts
  useEffect(() => {
    handleReplay();
    // If user prefers complete results, skip to the end
    if (showCompleteResultsByDefault) {
      setTimeout(() => {
        setShowCompleteResults(true);
        setCurrentStep(maxSteps);
        setExplanations(buildAllEntries());
      }, 0);
    }
  }, [handleReplay, showCompleteResultsByDefault, maxSteps, buildAllEntries]);

  // Regenerate explanations when style changes
  useEffect(() => {
    if (currentStep > 0) {
      const allEntries = [...buildInitialEntries()];
      const stepsToReplay = Math.min(currentStep, maxSteps);
      for (let step = 1; step < stepsToReplay; step++) {
        allEntries.push(...getStepExplanation(step));
      }
      setExplanations(allEntries);
    }
  }, [explanationStyle, buildInitialEntries, currentStep, maxSteps, getStepExplanation]);

  const getWinnerText = (): string => {
    if (winner === 'player') {
      return playerName === 'You' ? 'You Win!' : `${playerName} Wins!`;
    } else if (winner === 'opponent') {
      return opponentName === 'You' ? 'You Win!' : `${opponentName} Wins!`;
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

  /**
   * Get dynamic tutorial instruction text
   */
  const getTutorialInstruction = (): string => {
    // Show complete results is checked - no need for instructions
    if (showCompleteResults) {
      return 'watch the replay to see what happened!';
    }

    // User hasn't started stepping through
    if (currentStep === 1) {
      return 'click the step button to see each move!';
    }

    // User is stepping through but hasn't finished
    if (currentStep < maxSteps) {
      return 'keep clicking step to see what happens next!';
    }

    // User has finished the replay
    return 'great! now click continue to finish the tutorial!';
  };

  // Forfeit round: simplified display with blank opponent board
  if (result.forfeit) {
    const boardSize = result.playerBoard?.grid?.length ?? 2;
    const blankThumbnail = generateBlankThumbnail(boardSize);

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Round {result.round}</h2>
        </div>

        {/* Blank opponent board */}
        <div className={styles.combinedBoard}>
          <h4 className={styles.boardTitle}>Opponent Board</h4>
          <div className={styles.boardColumn}>
            <div
              className={styles.boardThumbnail}
              dangerouslySetInnerHTML={{ __html: `<img src="${blankThumbnail}" alt="No opponent board" style="width:100%;height:100%;object-fit:contain;" />` }}
            />
          </div>
        </div>

        {/* Winner Display */}
        <div className={styles.winnerSection}>
          <div className={styles.emoji}>🏆</div>
          <h3 className={`${styles.winnerText} ${styles.winnerplayer}`}>
            Won by forfeit!
          </h3>
        </div>

        {/* Round Scores Display */}
        <div className={styles.roundScoreSection}>
          <div className={styles.roundScoreHeader}>
            <h4 className={styles.roundScoreTitle}>Round Score</h4>
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

        <div className={styles.buttonGroup}>
          <button onClick={onContinue} className={styles.continueButton}>
            {continueButtonText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tutorial Instruction Banner */}
      {isTutorial && (
        <div className={styles.tutorialInstructionBanner}>
          {getTutorialInstruction()}
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>Round {result.round}</h2>
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
          <div className={styles.controlsSection}>
            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showCompleteResults}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowCompleteResults(checked);
                    // Save preference to user profile
                    onShowCompleteResultsChange?.(checked);
                    if (checked) {
                      // Skip directly to the end
                      setCurrentStep(maxSteps);
                      setExplanations(buildAllEntries());
                    } else {
                      // Reset to step 1
                      setCurrentStep(1);
                      setExplanations(buildInitialEntries());
                    }
                  }}
                  className={styles.checkbox}
                />
                <span>Show complete results</span>
              </label>
              <button
                onClick={toggleExplanationStyle}
                className={styles.styleToggle}
                title={useLivelyStyle ? 'Switch to technical explanations' : 'Switch to lively explanations'}
              >
                {useLivelyStyle ? '📖 Technical' : '🎉 Lively'}
              </button>
            </div>
            <div className={styles.explanationsWrapper}>
              <div className={styles.scoreColumnHeaders}>
                <div className={styles.scoreColumnHeaderSpacer} />
                <div className={styles.scoreColumnHeader}>{playerName}</div>
                <div className={styles.scoreColumnHeader}>{opponentName}</div>
              </div>
              <div className={styles.explanations} ref={explanationsRef}>
                {explanations.map((entry, index) => (
                  <div key={index} className={styles.explanationLine}>
                    <span className={styles.explanationText}>{entry.text}</span>
                    <span className={`${styles.deltaCell} ${entry.playerDelta ? (entry.playerDelta > 0 ? styles.deltaPositive : styles.deltaNegative) : ''}`}>
                      {entry.playerDelta ? (entry.playerDelta > 0 ? `+${entry.playerDelta}` : entry.playerDelta) : ''}
                    </span>
                    <span className={`${styles.deltaCell} ${entry.opponentDelta ? (entry.opponentDelta > 0 ? styles.deltaPositive : styles.deltaNegative) : ''}`}>
                      {entry.opponentDelta ? (entry.opponentDelta > 0 ? `+${entry.opponentDelta}` : entry.opponentDelta) : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.scoreTotalsRow}>
                <div className={styles.scoreTotalLabel}>Total</div>
                <div className={styles.scoreTotalValue}>{runningScores[0]}</div>
                <div className={styles.scoreTotalValue}>{runningScores[1]}</div>
              </div>
            </div>
          </div>
          <div className={styles.boardColumn}>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <div className={styles.legendCircle} style={{ backgroundColor: 'rgb(37, 99, 235)' }}></div>
                <span>{playerName}</span>
              </div>
              <div className={styles.legendItem}>
                {/* In replay view, show purple circle. Discord avatar shown in active games/opponents/history */}
                <div className={styles.legendCircle} style={{ backgroundColor: 'rgb(147, 51, 234)' }}></div>
                <span>{opponentName}</span>
              </div>
            </div>
            <div className={styles.boardColumnWrapper}>
              <div
                className={styles.boardThumbnail}
                dangerouslySetInnerHTML={{ __html: combinedBoardSvgData.svg }}
              />
              {/* Mobile overlay - shown on mobile when mode is 'overlay' */}
              {isMobile && mobileOverlayVisible && mobileExplanationPosition === 'overlay' && (
                <div className={styles.mobileOverlay}>
                  <div className={styles.overlayHeader}>
                    <button
                      className={styles.overlayHelpButton}
                      onClick={() => setOverlayHelpModalOpen(true)}
                      title="Settings"
                    >
                      &#9881;
                    </button>
                    <button
                      className={styles.overlayCloseButton}
                      onClick={() => {
                        setMobileOverlayVisible(false);
                        setMobileExplanationPosition('hidden');
                        onMobileExplanationModeChange?.('hidden');
                      }}
                      title="Close overlay"
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.overlayScoreHeaders}>
                    <div className={styles.scoreColumnHeaderSpacer} />
                    <div className={styles.scoreColumnHeader}>{playerName}</div>
                    <div className={styles.scoreColumnHeader}>{opponentName}</div>
                  </div>
                  <div className={styles.overlayExplanations} ref={overlayExplanationsRef}>
                    {explanations.map((entry, index) => (
                      <div key={index} className={styles.explanationLine}>
                        <span className={styles.explanationText}>{entry.text}</span>
                        <span className={`${styles.deltaCell} ${entry.playerDelta ? (entry.playerDelta > 0 ? styles.deltaPositive : styles.deltaNegative) : ''}`}>
                          {entry.playerDelta ? (entry.playerDelta > 0 ? `+${entry.playerDelta}` : entry.playerDelta) : ''}
                        </span>
                        <span className={`${styles.deltaCell} ${entry.opponentDelta ? (entry.opponentDelta > 0 ? styles.deltaPositive : styles.deltaNegative) : ''}`}>
                          {entry.opponentDelta ? (entry.opponentDelta > 0 ? `+${entry.opponentDelta}` : entry.opponentDelta) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.overlayScoreTotals}>
                    <div className={styles.scoreTotalLabel}>Total</div>
                    <div className={styles.scoreTotalValue}>{runningScores[0]}</div>
                    <div className={styles.scoreTotalValue}>{runningScores[1]}</div>
                  </div>
                </div>
              )}
            </div>
            {/* Mobile: Show Overlay button when overlay is hidden */}
            {isMobile && mobileExplanationPosition === 'hidden' && (
              <button
                className={styles.showOverlayButton}
                onClick={() => {
                  setMobileOverlayVisible(true);
                  setMobileExplanationPosition('overlay');
                  onMobileExplanationModeChange?.('overlay');
                }}
              >
                Show Overlay
              </button>
            )}
            {/* Mobile: Controls below board when mode is 'below' */}
            {isMobile && mobileExplanationPosition === 'below' && (
              <div className={styles.mobileControlsBelow}>
                <div className={styles.belowHeader}>
                  <button
                    className={styles.belowHelpButton}
                    onClick={() => setOverlayHelpModalOpen(true)}
                    title="Settings"
                  >
                    &#9881;
                  </button>
                  <button
                    className={styles.belowCloseButton}
                    onClick={() => {
                      setMobileExplanationPosition('hidden');
                      onMobileExplanationModeChange?.('hidden');
                    }}
                    title="Hide explanations"
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.explanationsWrapper}>
                  <div className={styles.scoreColumnHeaders}>
                    <div className={styles.scoreColumnHeaderSpacer} />
                    <div className={styles.scoreColumnHeader}>{playerName}</div>
                    <div className={styles.scoreColumnHeader}>{opponentName}</div>
                  </div>
                  <div className={styles.explanations}>
                    {explanations.map((entry, index) => (
                      <div key={index} className={styles.explanationLine}>
                        <span className={styles.explanationText}>{entry.text}</span>
                        <span className={`${styles.deltaCell} ${entry.playerDelta ? (entry.playerDelta > 0 ? styles.deltaPositive : styles.deltaNegative) : ''}`}>
                          {entry.playerDelta ? (entry.playerDelta > 0 ? `+${entry.playerDelta}` : entry.playerDelta) : ''}
                        </span>
                        <span className={`${styles.deltaCell} ${entry.opponentDelta ? (entry.opponentDelta > 0 ? styles.deltaPositive : styles.deltaNegative) : ''}`}>
                          {entry.opponentDelta ? (entry.opponentDelta > 0 ? `+${entry.opponentDelta}` : entry.opponentDelta) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.scoreTotalsRow}>
                    <div className={styles.scoreTotalLabel}>Total</div>
                    <div className={styles.scoreTotalValue}>{runningScores[0]}</div>
                    <div className={styles.scoreTotalValue}>{runningScores[1]}</div>
                  </div>
                </div>
              </div>
            )}
            <div className={styles.buttonGroup}>
              {currentStep < maxSteps ? (
                <button onClick={handleNext} className={styles.nextButton}>
                  ▶ Step
                </button>
              ) : (
                <button onClick={handleReplay} className={styles.nextButton}>
                  ↻ Restart Replay
                </button>
              )}
              <button onClick={handleFinish} className={styles.replayButton}>
                ⏹ Skip to End
              </button>
              <button onClick={onContinue} className={styles.continueButton}>
                {continueButtonText}
              </button>
            </div>
            {waitingForOpponentResponse && (
              <div className={styles.waitingMessage}>
                <p className={styles.waitingText}>
                  <strong>Waiting for {opponentName}</strong>
                </p>
                <p className={styles.waitingSubtext}>
                  The next round will be sent to you once {opponentName} completes this round.
                  You'll receive a notification when it's your turn!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {currentStep >= maxSteps && (
        <div className={styles.winnerSection}>
          <div className={styles.emoji}>{getWinnerEmoji()}</div>
          <h3 className={`${styles.winnerText} ${styles[`winner${winner}`]}`}>
            {getWinnerText()}
          </h3>
        </div>
      )}

      {/* Creature Outcome Graphics */}
      {currentStep >= maxSteps && result.playerCreature && result.opponentCreature && (() => {
        const playerCreature = CREATURES[result.playerCreature];
        const opponentCreature = CREATURES[result.opponentCreature];

        if (!playerCreature || !opponentCreature) return null;

        return (
          <div className={styles.creatureOutcomeSection}>
            {result.collision ? (
              // Show both creatures crashing into each other
              <div className={styles.outcomeGraphicSingle}>
                <div className={styles.collisionScene}>
                  <img
                    src={getDefaultGraphic(result.playerCreature)}
                    alt={playerCreature.name}
                    className={`${styles.outcomeImage} ${styles.collisionLeft}`}
                  />
                  <span className={styles.collisionBurst}>💥</span>
                  <img
                    src={getDefaultGraphic(result.opponentCreature)}
                    alt={opponentCreature.name}
                    className={`${styles.outcomeImage} ${styles.collisionRight}`}
                  />
                </div>
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
        </div>
        {currentStep >= maxSteps && (
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
        )}
      </div>

      {/* Total Score Display */}
      {currentStep >= maxSteps && (
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
      )}

      {/* Bottom Continue Button (visible after replay finishes, for easy access after scrolling) */}
      {currentStep >= maxSteps && (
        <div className={styles.buttonGroup}>
          <button onClick={onContinue} className={styles.continueButton}>
            {continueButtonText}
          </button>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* Mobile Overlay Options Modal */}
      {overlayHelpModalOpen && (
        <div className={styles.overlayOptionsBackdrop} onClick={() => setOverlayHelpModalOpen(false)}>
          <div className={styles.overlayOptionsModal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.overlayOptionsTitle}>Settings</p>
            <div className={styles.settingsSection}>
              <label className={styles.settingsCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={showCompleteResults}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowCompleteResults(checked);
                    onShowCompleteResultsChange?.(checked);
                    if (checked) {
                      setCurrentStep(maxSteps);
                      setExplanations(buildAllEntries());
                    } else {
                      setCurrentStep(1);
                      setExplanations(buildInitialEntries());
                    }
                  }}
                  className={styles.checkbox}
                />
                <span>Show complete results</span>
              </label>
              <button
                onClick={toggleExplanationStyle}
                className={styles.settingsStyleToggle}
              >
                {useLivelyStyle ? 'Switch to Technical' : 'Switch to Lively'}
              </button>
            </div>
            <div className={styles.settingsDivider} />
            {mobileExplanationPosition === 'overlay' ? (
              <>
                <button
                  className={styles.overlayOptionButton}
                  onClick={() => {
                    setMobileOverlayVisible(false);
                    setMobileExplanationPosition('hidden');
                    onMobileExplanationModeChange?.('hidden');
                    setOverlayHelpModalOpen(false);
                  }}
                >
                  Hide explanations
                </button>
                <button
                  className={styles.overlayOptionButton}
                  onClick={() => {
                    setMobileOverlayVisible(false);
                    setMobileExplanationPosition('below');
                    onMobileExplanationModeChange?.('below');
                    setOverlayHelpModalOpen(false);
                  }}
                >
                  Show below board
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.overlayOptionButton}
                  onClick={() => {
                    setMobileExplanationPosition('hidden');
                    onMobileExplanationModeChange?.('hidden');
                    setOverlayHelpModalOpen(false);
                  }}
                >
                  Hide explanations
                </button>
                <button
                  className={styles.overlayOptionButton}
                  onClick={() => {
                    setMobileOverlayVisible(true);
                    setMobileExplanationPosition('overlay');
                    onMobileExplanationModeChange?.('overlay');
                    setOverlayHelpModalOpen(false);
                  }}
                >
                  Show as overlay
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
