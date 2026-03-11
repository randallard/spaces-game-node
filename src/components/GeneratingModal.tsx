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
  /** Whether this is an AI agent (shows different text) */
  isAiAgent?: boolean;
}

/**
 * Modal displayed while generating CPU boards and decks
 */
export function GeneratingModal({ opponentName, boardSize, isAiAgent }: GeneratingModalProps): ReactElement {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>⚔️</div>
        </div>
        <h2 className={styles.title}>
          {isAiAgent ? `Setting up ${boardSize}×${boardSize} Game` : `Generating ${boardSize}×${boardSize} Boards`}
        </h2>
        <p className={styles.message}>
          {isAiAgent
            ? `Getting ready to play against ${opponentName}...`
            : `Creating boards and deck for ${opponentName}...`}
        </p>
      </div>
    </div>
  );
}
