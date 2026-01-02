/**
 * CompletedRoundModal component for when a player tries to replay a round
 * @module components/CompletedRoundModal
 */

import type { ReactElement } from 'react';
import styles from './CompletedRoundModal.module.css';

export interface CompletedRoundModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Opponent name */
  opponentName: string;
  /** Round number that was already completed */
  round: number;
  /** Callback when user clicks "Go Home" */
  onGoHome: () => void;
}

/**
 * Modal shown when a player tries to access a round they've already completed.
 *
 * This prevents replay attacks and helps guide users to the correct game state.
 *
 * @component
 */
export function CompletedRoundModal({
  isOpen,
  opponentName,
  round,
  onGoHome,
}: CompletedRoundModalProps): ReactElement | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onGoHome}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.icon}>✓</div>
          <h2 className={styles.title}>Round Already Completed</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>
            You've already completed round {round} with <strong>{opponentName}</strong>.
          </p>

          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>What happened?</p>
            <p className={styles.infoText}>
              This link is for a round you've already played. You can't replay rounds that have been completed.
            </p>
          </div>

          <div className={styles.suggestion}>
            <p className={styles.suggestionTitle}>Looking for your next move?</p>
            <p className={styles.suggestionText}>
              Check for a more recent link from {opponentName} to continue this game,
              or start a new game from the home screen.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onGoHome} className={styles.homeButton}>
            Go to Home Screen
          </button>
        </div>
      </div>
    </div>
  );
}
