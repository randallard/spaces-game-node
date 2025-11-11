/**
 * GeneratingModal - Modal shown while generating CPU boards/decks
 * @module components/GeneratingModal
 */

import { type ReactElement } from 'react';
import styles from './GeneratingModal.module.css';

export interface GeneratingModalProps {
  /** Name of the opponent being generated for */
  opponentName: string;
  /** Board size being generated */
  boardSize: number;
}

/**
 * Modal displayed while generating CPU boards and decks
 */
export function GeneratingModal({ opponentName, boardSize }: GeneratingModalProps): ReactElement {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>⚔️</div>
        </div>
        <h2 className={styles.title}>Generating {boardSize}×{boardSize} Boards</h2>
        <p className={styles.message}>
          Creating boards and deck for {opponentName}...
        </p>
      </div>
    </div>
  );
}
