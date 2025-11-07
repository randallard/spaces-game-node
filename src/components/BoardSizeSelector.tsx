/**
 * BoardSizeSelector component for choosing board size before starting a game
 * @module components/BoardSizeSelector
 */

import type { ReactElement } from 'react';
import styles from './BoardSizeSelector.module.css';

export interface BoardSizeSelectorProps {
  /** Callback when size is selected */
  onSizeSelected: (size: 2 | 3) => void;
  /** Callback to go back */
  onBack?: () => void;
}

/**
 * Board size selection component.
 *
 * Allows the user to choose between 2x2 or 3x3 boards for the game.
 *
 * @component
 */
export function BoardSizeSelector({
  onSizeSelected,
  onBack,
}: BoardSizeSelectorProps): ReactElement {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Board Size</h1>
      <p className={styles.subtitle}>
        Select the board size for this game. All boards used in this game must match this size.
      </p>

      <div className={styles.sizeOptions}>
        <button
          onClick={() => onSizeSelected(2)}
          className={styles.sizeOption}
          aria-label="Select 2x2 board size"
        >
          <div className={styles.sizeOptionLabel}>2×2</div>
          <div className={styles.sizeOptionDescription}>
            Classic size - Quick strategic gameplay
          </div>
          <div className={styles.sizeOptionBadge}>Standard</div>
        </button>

        <button
          onClick={() => onSizeSelected(3)}
          className={styles.sizeOption}
          aria-label="Select 3x3 board size"
        >
          <div className={styles.sizeOptionLabel}>3×3</div>
          <div className={styles.sizeOptionDescription}>
            Larger board - More strategic depth and options
          </div>
          <div className={styles.sizeOptionBadge}>Advanced</div>
        </button>
      </div>

      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          Back
        </button>
      )}
    </div>
  );
}
