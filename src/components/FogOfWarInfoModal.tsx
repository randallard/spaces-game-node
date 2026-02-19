/**
 * FogOfWarInfoModal component for explaining fog vs standard model training
 * @module components/FogOfWarInfoModal
 */

import { type ReactElement } from 'react';
import styles from './FogOfWarInfoModal.module.css';

export interface FogOfWarInfoModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Info modal explaining the difference between standard and fog-of-war models.
 *
 * @component
 */
export function FogOfWarInfoModal({ isOpen, onClose }: FogOfWarInfoModalProps): ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className={styles.title}>Standard vs Fog of War Models</h2>

        <div className={styles.content}>
          <p className={styles.paragraph}>
            AI models are trained differently depending on how much information they can see during a game.
          </p>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Standard Mode</h3>
            <ul className={styles.list}>
              <li>The model can see the opponent's full board after each round</li>
              <li>Trained with complete information about opponent strategies</li>
              <li>Can adapt based on seeing all opponent moves</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Fog of War Mode</h3>
            <ul className={styles.list}>
              <li>The model can only see the opponent's moves that were actually executed</li>
              <li>Trained with limited visibility, similar to how human players experience the game</li>
              <li>Must make decisions with incomplete information</li>
            </ul>
          </div>

          <div className={styles.infoBox}>
            <strong>Note:</strong> Standard and fog models are trained separately.
            A standard model may perform differently than a fog model of the same checkpoint,
            even at the same board size.
          </div>
        </div>

        <button className={styles.okButton} onClick={onClose}>
          Got It!
        </button>
      </div>
    </div>
  );
}
