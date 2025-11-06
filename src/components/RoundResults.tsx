/**
 * RoundResults component for displaying round outcomes
 * @module components/RoundResults
 */

import { type ReactElement, useMemo } from 'react';
import type { RoundResult } from '@/types';
import { generateCombinedBoardSvg } from '@/utils/combined-board-svg';
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
}: RoundResultsProps): ReactElement {
  const { winner, playerBoard, opponentBoard, playerFinalPosition, opponentFinalPosition } = result;

  // Generate combined board SVG
  const combinedBoardSvg = useMemo(
    () => generateCombinedBoardSvg(playerBoard, opponentBoard, result),
    [playerBoard, opponentBoard, result]
  );

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

      {/* Combined Board Display */}
      <div className={styles.combinedBoard}>
        <h4 className={styles.boardTitle}>Combined Board View</h4>
        <div className={styles.boardThumbnail}>
          <img
            src={combinedBoardSvg}
            alt="Combined board showing both players"
            className={styles.thumbnailImage}
          />
        </div>
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

      {/* Round Scores Display */}
      <div className={styles.roundScoreSection}>
        <h4 className={styles.roundScoreTitle}>Round Score</h4>
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

      {/* Continue Button */}
      <button onClick={onContinue} className={styles.continueButton}>
        Continue to Next Round
      </button>
    </div>
  );
}
