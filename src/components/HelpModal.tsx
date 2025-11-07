/**
 * HelpModal component for explaining opponent move visibility
 * @module components/HelpModal
 */

import { type ReactElement } from 'react';
import styles from './HelpModal.module.css';

export interface HelpModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Help modal explaining why opponent moves are partially shown.
 *
 * @component
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps): ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className={styles.title}>Why Are Some Opponent Moves Hidden?</h2>

        <div className={styles.content}>
          <p className={styles.paragraph}>
            You can only see the moves your opponent <strong>actually made</strong> during the round.
          </p>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Rounds End When:</h3>
            <ul className={styles.list}>
              <li>A player reaches the goal</li>
              <li>A player hits a trap</li>
              <li>Players collide</li>
              <li>Both players complete their sequences</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Example:</h3>
            <p className={styles.example}>
              If your opponent planned 5 moves but you reached the goal after move 2,
              you'll only see their first 2 moves. Their remaining 3 moves stay hidden!
            </p>
          </div>

          <div className={styles.infoBox}>
            <strong>Strategic Note:</strong> This prevents you from gaining information
            about boards your opponent created but didn't fully execute.
          </div>
        </div>

        <button className={styles.okButton} onClick={onClose}>
          Got It!
        </button>
      </div>
    </div>
  );
}
