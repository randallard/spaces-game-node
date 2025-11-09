/**
 * WelcomeModal - Introduces CPU Tougher after tutorial completion
 * @module components/WelcomeModal
 */

import { type ReactElement } from 'react';
import styles from './WelcomeModal.module.css';

export interface WelcomeModalProps {
  /** Player's name */
  playerName: string;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Welcome modal that introduces CPU Tougher
 */
export function WelcomeModal({ playerName, onClose }: WelcomeModalProps): ReactElement {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <div className={styles.icon}>🦾</div>
          <h2 className={styles.title}>
            Nice to meet you, {playerName}!
          </h2>
          <p className={styles.message}>
            See you on the boards...
          </p>
          <p className={styles.signature}>
            I'm <strong>CPU Tougher</strong> 😎
          </p>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          Let's Go!
        </button>
      </div>
    </div>
  );
}
