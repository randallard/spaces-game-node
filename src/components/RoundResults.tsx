/**
 * RoundResults component for displaying round outcomes
 * @module components/RoundResults
 */

import { type ReactElement } from 'react';
import type { RoundResult } from '@/types';
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

      <div className={styles.boardsComparison}>
        {/* Player Board */}
        <div className={styles.boardSection}>
          <h4 className={styles.boardTitle}>{playerName}</h4>
          <div className={styles.boardThumbnail}>
            <img
              src={playerBoard.thumbnail}
              alt={`${playerName}'s board`}
              className={styles.thumbnailImage}
            />
          </div>
          <div className={styles.boardDetails}>
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
        </div>

        {/* VS Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerText}>VS</span>
        </div>

        {/* Opponent Board */}
        <div className={styles.boardSection}>
          <h4 className={styles.boardTitle}>{opponentName}</h4>
          <div className={styles.boardThumbnail}>
            <img
              src={opponentBoard.thumbnail}
              alt={`${opponentName}'s board`}
              className={styles.thumbnailImage}
            />
          </div>
          <div className={styles.boardDetails}>
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
      </div>

      {/* Score Display */}
      <div className={styles.scoreSection}>
        <h4 className={styles.scoreTitle}>Current Score</h4>
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
