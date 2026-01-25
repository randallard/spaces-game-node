/**
 * CompletedGames component
 * Displays a list of finished games that the player can view results for
 */

import React, { useState } from 'react';
import styles from './ActiveGames.module.css'; // Reuse the same styles
import { getOpponentIcon } from '@/utils/app-helpers';
import { type ActiveGameInfo } from '@/utils/active-games';
import { RemoveGameModal } from './RemoveGameModal';
import { OpponentAvatar } from './OpponentAvatar';

export type CompletedGamesProps = {
  games: ActiveGameInfo[];
  onViewResults: (game: ActiveGameInfo) => void;
  onArchiveGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
};

export function CompletedGames({ games, onViewResults, onArchiveGame, onDeleteGame, isMinimized = false, onToggleMinimize }: CompletedGamesProps): React.ReactElement | null {
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
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Completed Games</h2>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className={styles.minimizeButton}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '▼' : '▲'}
            </button>
          )}
        </div>
        {!isMinimized && (
        <div className={styles.gamesList}>
          {games.map((game) => {
            return (
              <div key={game.gameId} className={styles.gameItem}>
                <div className={styles.gameInfo}>
                  <span className={styles.opponentIcon}>
                    {game.opponent.type === 'human' ? (
                      <OpponentAvatar
                        opponentName={game.opponent.name}
                        discordId={game.opponent.discordId}
                        discordAvatar={game.opponent.discordAvatar}
                        size={48}
                      />
                    ) : (
                      getOpponentIcon(game.opponent)
                    )}
                  </span>
                  <div className={styles.gameDetails}>
                    <div className={styles.opponentName}>{game.opponent.name}</div>
                    <div className={styles.gameStatus}>
                      Round {game.totalRounds} of {game.totalRounds} • Share results
                    </div>
                  <div className={styles.gameScore}>
                    Score: {game.playerScore}-{game.opponentScore}
                    {game.boardSize && ` • ${game.boardSize}×${game.boardSize}`}
                  </div>
                  <div className={styles.gameId}>Game ID: {game.gameId}</div>
                  <button
                    onClick={() => setGameToRemove(game)}
                    className={styles.removeLink}
                  >
                    Remove game from Completed list
                  </button>
                </div>
              </div>
              <button
                onClick={() => onViewResults(game)}
                className={styles.resumeButton}
              >
                View Results
              </button>
            </div>
          );
          })}
        </div>
        )}
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
