/**
 * RemoveGameModal component
 * Confirmation modal for archiving or deleting a game from the active games list
 */

import React from 'react';
import styles from './RemoveGameModal.module.css';
import type { ActiveGameInfo } from '@/utils/active-games';

export type RemoveGameModalProps = {
  game: ActiveGameInfo;
  onArchive: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export function RemoveGameModal({ game, onArchive, onDelete, onCancel }: RemoveGameModalProps): React.ReactElement {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Remove Game from Active List</h2>

        <div className={styles.gameInfo}>
          <div className={styles.opponentName}>{game.opponent.name}</div>
          <div className={styles.gameStatus}>
            Round {game.currentRound} of {game.totalRounds} • Score: {game.playerScore}-{game.opponentScore}
          </div>
        </div>

        <div className={styles.options}>
          <div className={styles.option}>
            <h3 className={styles.optionTitle}>Archive</h3>
            <p className={styles.optionDescription}>
              Keep the game in local storage but hide it from the active games list.
              The game will reappear if your opponent makes another move.
            </p>
            <button onClick={onArchive} className={styles.archiveButton}>
              Archive Game
            </button>
          </div>

          <div className={styles.option}>
            <h3 className={styles.optionTitle}>Delete</h3>
            <p className={styles.optionDescription}>
              Completely remove this game from local storage. Your opponent can still
              restart the game with a link, but we'll be counting on their game data
              to be uncorrupted and won't have ours to compare.
            </p>
            <button onClick={onDelete} className={styles.deleteButton}>
              Delete Game
            </button>
          </div>
        </div>

        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}
