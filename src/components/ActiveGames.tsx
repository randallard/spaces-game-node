/**
 * ActiveGames component
 * Displays a list of unfinished games that the player can resume
 */

import React, { useState } from 'react';
import styles from './ActiveGames.module.css';
import { getOpponentIcon } from '@/utils/app-helpers';
import { getPhaseDescription, isWaitingForOpponentBoard, type ActiveGameInfo } from '@/utils/active-games';
import { RemoveGameModal } from './RemoveGameModal';

export type ActiveGamesProps = {
  games: ActiveGameInfo[];
  onResumeGame: (game: ActiveGameInfo) => void;
  onArchiveGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
};

export function ActiveGames({ games, onResumeGame, onArchiveGame, onDeleteGame }: ActiveGamesProps): React.ReactElement | null {
  const [gameToRemove, setGameToRemove] = useState<ActiveGameInfo | null>(null);

  if (games.length === 0) {
    return null;
  }

  const handleArchive = () => {
    if (gameToRemove) {
      onArchiveGame(gameToRemove.gameId);
      setGameToRemove(null);
    }
  };

  const handleDelete = () => {
    if (gameToRemove) {
      onDeleteGame(gameToRemove.gameId);
      setGameToRemove(null);
    }
  };

  return (
    <>
      <div className={styles.activeGamesPanel}>
        <h2 className={styles.panelTitle}>Active Games</h2>
        <div className={styles.gamesList}>
          {games.map((game) => {
            const waitingForOpponentBoard = isWaitingForOpponentBoard(game);
            return (
              <div key={game.gameId} className={styles.gameItem}>
                <div className={styles.gameInfo}>
                  <span className={styles.opponentIcon}>
                    {getOpponentIcon(game.opponent)}
                    {waitingForOpponentBoard && (
                      <span className={styles.notificationBadge} title="Waiting for opponent to choose their board">
                        ⚠️
                      </span>
                    )}
                  </span>
                  <div className={styles.gameDetails}>
                    <div className={styles.opponentName}>{game.opponent.name}</div>
                    <div className={styles.gameStatus}>
                      Round {game.currentRound} of {game.totalRounds} • {getPhaseDescription(game.phase, game)}
                    </div>
                  <div className={styles.gameScore}>
                    Score: {game.playerScore}-{game.opponentScore}
                    {game.boardSize && ` • ${game.boardSize}×${game.boardSize}`}
                  </div>
                  <button
                    onClick={() => setGameToRemove(game)}
                    className={styles.removeLink}
                  >
                    Remove game from Active list
                  </button>
                </div>
              </div>
              <button
                onClick={() => onResumeGame(game)}
                className={styles.resumeButton}
              >
                Resume
              </button>
            </div>
          );
          })}
        </div>
      </div>

      {gameToRemove && (
        <RemoveGameModal
          game={gameToRemove}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onCancel={() => setGameToRemove(null)}
        />
      )}
    </>
  );
}
