/**
 * RemoveOpponentModal component
 * Confirmation modal for archiving or deleting an opponent from the opponents list
 */

import React from 'react';
import styles from './RemoveOpponentModal.module.css';
import type { Opponent } from '@/types/opponent';

export type RemoveOpponentModalProps = {
  opponent: Opponent;
  onArchive: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export function RemoveOpponentModal({ opponent, onArchive, onDelete, onCancel }: RemoveOpponentModalProps): React.ReactElement {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Remove Opponent from List</h2>

        <div className={styles.opponentInfo}>
          <div className={styles.opponentName}>{opponent.name}</div>
          <div className={styles.opponentStats}>
            Record: {opponent.wins}-{opponent.losses}
          </div>
        </div>

        <div className={styles.options}>
          <div className={styles.option}>
            <h3 className={styles.optionTitle}>Archive</h3>
            <p className={styles.optionDescription}>
              Hide this opponent from the list but keep their record in local storage.
              They'll reappear if you play against them again or receive a challenge from them.
            </p>
            <button onClick={onArchive} className={styles.archiveButton}>
              Archive Opponent
            </button>
          </div>

          <div className={styles.option}>
            <h3 className={styles.optionTitle}>Delete</h3>
            <p className={styles.optionDescription}>
              Completely remove this opponent and their record from local storage.
              Their win/loss stats will be permanently deleted. You can still play against
              them in the future, but they'll start with a fresh record.
            </p>
            <button onClick={onDelete} className={styles.deleteButton}>
              Delete Opponent
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
