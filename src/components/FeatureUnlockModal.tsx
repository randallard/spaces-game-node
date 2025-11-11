/**
 * FeatureUnlockModal - Modal to announce newly unlocked features
 * @module components/FeatureUnlockModal
 */

import type { ReactElement } from 'react';
import styles from './FeatureUnlockModal.module.css';

export interface FeatureUnlockModalProps {
  /** List of newly unlocked board sizes */
  unlockedBoardSizes: number[];
  /** Whether deck mode was just unlocked */
  deckModeUnlocked: boolean;
  /** Callback when user clicks continue */
  onContinue: () => void;
}

/**
 * Modal that displays when new features are unlocked
 */
export function FeatureUnlockModal({
  unlockedBoardSizes,
  deckModeUnlocked,
  onContinue,
}: FeatureUnlockModalProps): ReactElement {
  const hasBoardSizes = unlockedBoardSizes.length > 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Features Unlocked!</h2>
        </div>

        <div className={styles.content}>
          {hasBoardSizes && (
            <div className={styles.unlockSection}>
              <div className={styles.icon}>🎉</div>
              <h3 className={styles.sectionTitle}>New Board Sizes</h3>
              <p className={styles.description}>
                You can now create and play with these board sizes:
              </p>
              <div className={styles.boardSizeList}>
                {unlockedBoardSizes.map((size) => (
                  <div key={size} className={styles.boardSizeItem}>
                    {size}×{size}
                  </div>
                ))}
              </div>
            </div>
          )}

          {deckModeUnlocked && (
            <div className={styles.unlockSection}>
              <div className={styles.icon}>🎮</div>
              <h3 className={styles.sectionTitle}>Deck Mode</h3>
              <p className={styles.description}>
                Battle through 10 rounds at once! Create decks with 10 boards and compete in extended matches.
              </p>
            </div>
          )}

          {!hasBoardSizes && !deckModeUnlocked && (
            <div className={styles.unlockSection}>
              <p className={styles.description}>Keep playing to unlock more features!</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={onContinue} className={styles.continueButton}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
