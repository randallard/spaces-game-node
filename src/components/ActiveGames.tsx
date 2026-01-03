/**
 * ActiveGames component
 * Displays a list of unfinished games that the player can resume
 */

import React from 'react';
import styles from './ActiveGames.module.css';
import { getOpponentIcon } from '@/utils/app-helpers';
import { getPhaseDescription, type ActiveGameInfo } from '@/utils/active-games';

export type ActiveGamesProps = {
  games: ActiveGameInfo[];
  onResumeGame: (game: ActiveGameInfo) => void;
};

export function ActiveGames({ games, onResumeGame }: ActiveGamesProps): React.ReactElement | null {
  if (games.length === 0) {
    return null;
  }

  return (
    <div className={styles.activeGamesPanel}>
      <h2 className={styles.panelTitle}>Active Games</h2>
      <div className={styles.gamesList}>
        {games.map((game) => (
          <div key={game.gameId} className={styles.gameItem}>
            <div className={styles.gameInfo}>
              <span className={styles.opponentIcon}>
                {getOpponentIcon(game.opponent)}
              </span>
              <div className={styles.gameDetails}>
                <div className={styles.opponentName}>{game.opponent.name}</div>
                <div className={styles.gameStatus}>
                  Round {game.currentRound} of {game.totalRounds} • {getPhaseDescription(game.phase)}
                </div>
                <div className={styles.gameScore}>
                  Score: {game.playerScore}-{game.opponentScore}
                  {game.boardSize && ` • ${game.boardSize}×${game.boardSize}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => onResumeGame(game)}
              className={styles.resumeButton}
            >
              Resume
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
