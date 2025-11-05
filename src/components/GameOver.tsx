/**
 * GameOver component for final game screen
 * @module components/GameOver
 */

import { type ReactElement } from 'react';
import type { RoundResult, UserStats } from '@/types';
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
}: GameOverProps): ReactElement {
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
        <h2 className={styles.sectionTitle}>Round-by-Round Results</h2>
        <div className={styles.roundsList}>
          {roundHistory.map((result) => (
            <div key={result.round} className={styles.roundItem}>
              <span className={styles.roundNumber}>Round {result.round}</span>
              <span className={styles.roundWinner}>
                {result.winner === 'player'
                  ? `${playerName} Won`
                  : result.winner === 'opponent'
                    ? `${opponentName} Won`
                    : 'Tie'}
              </span>
            </div>
          ))}
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
    </div>
  );
}
