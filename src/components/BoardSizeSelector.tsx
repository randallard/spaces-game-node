/**
 * BoardSizeSelector component for choosing board size before starting a game
 * @module components/BoardSizeSelector
 */

import type { ReactElement } from 'react';
import { useState } from 'react';
import { isValidBoardSize } from '@/types';
import type { Board, Opponent } from '@/types';
import styles from './BoardSizeSelector.module.css';

export interface BoardSizeSelectorProps {
  /** Callback when size is selected */
  onSizeSelected: (size: number) => void;
  /** Callback to go back */
  onBack?: () => void;
  /** Player's boards (to check availability) */
  playerBoards?: Board[];
  /** CPU opponent's boards (to check availability) */
  cpuBoards?: Board[];
  /** Current opponent (to identify which CPU) */
  opponent?: Opponent | null;
  /** Callback to generate CPU boards for a given size */
  onGenerateCpuBoards?: (size: number) => Promise<void>;
}

/**
 * Board size selection component.
 *
 * Allows the user to choose from preset sizes or enter a custom size (2-99).
 *
 * @component
 */
export function BoardSizeSelector({
  onSizeSelected,
  onBack,
  playerBoards = [],
  cpuBoards = [],
  opponent,
  onGenerateCpuBoards,
}: BoardSizeSelectorProps): ReactElement {
  const [customSize, setCustomSize] = useState<string>('');
  const [customError, setCustomError] = useState<string>('');
  const [generatingSize, setGeneratingSize] = useState<number | null>(null);

  // Common preset sizes
  const presetSizes = [
    { size: 2, label: 'Classic', description: 'Quick strategic gameplay' },
    { size: 3, label: 'Standard', description: 'Balanced complexity' },
    { size: 4, label: 'Advanced', description: 'More strategic depth' },
    { size: 5, label: 'Large', description: 'Complex gameplay' },
    { size: 8, label: 'Extra Large', description: 'Extended matches' },
    { size: 10, label: 'Huge', description: 'Epic battles' },
  ];

  // Check board availability for a given size
  const getBoardAvailability = (size: number) => {
    const playerHasBoards = playerBoards.some((b) => b.boardSize === size);

    // CPU needs at least 3 boards for the size to be considered "ready"
    // This matches the check in App.tsx cpuHasBoardsForSize function
    let cpuHasBoards = false;
    if (opponent) {
      const cpuBoardsForSize = cpuBoards.filter(
        (b) => b.boardSize === size && b.name.startsWith(opponent.name)
      );
      cpuHasBoards = cpuBoardsForSize.length >= 3;
    }

    return {
      playerHasBoards,
      cpuHasBoards,
      bothHaveBoards: playerHasBoards && cpuHasBoards,
    };
  };

  // Handle generating CPU boards
  const handleGenerateCpuBoards = async (size: number) => {
    if (!onGenerateCpuBoards) return;

    setGeneratingSize(size);
    try {
      await onGenerateCpuBoards(size);
    } finally {
      setGeneratingSize(null);
    }
  };

  const handleCustomSize = () => {
    const size = parseInt(customSize);
    if (isValidBoardSize(size)) {
      onSizeSelected(size);
    } else {
      setCustomError(`Please enter a number between 2 and 99`);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Board Size</h1>
      <p className={styles.subtitle}>
        Select the board size for this game. All boards used in this game must match this size.
      </p>

      {/* Preset sizes */}
      <div className={styles.sizeOptions}>
        {presetSizes.map(({ size, label, description }) => {
          const { playerHasBoards, cpuHasBoards, bothHaveBoards } = getBoardAvailability(size);
          const isGenerating = generatingSize === size;

          // Both have boards - normal selectable button
          if (bothHaveBoards) {
            return (
              <button
                key={size}
                onClick={() => onSizeSelected(size)}
                className={styles.sizeOption}
                aria-label={`Select ${size}x${size} board size`}
              >
                <div className={styles.sizeOptionLabel}>{size}×{size}</div>
                <div className={styles.sizeOptionDescription}>{description}</div>
                <div className={styles.sizeOptionBadge}>{label}</div>
              </button>
            );
          }

          // Player doesn't have boards - disabled with message
          if (!playerHasBoards) {
            return (
              <div key={size} className={`${styles.sizeOption} ${styles.sizeOptionDisabled}`}>
                <div className={styles.sizeOptionLabel}>{size}×{size}</div>
                <div className={styles.sizeOptionDescription}>{description}</div>
                <div className={styles.sizeOptionBadge}>{label}</div>
                <div className={styles.sizeOptionMessage}>You need to create {size}×{size} boards</div>
              </div>
            );
          }

          // CPU doesn't have boards - show generate button
          if (!cpuHasBoards && opponent) {
            return (
              <div key={size} className={`${styles.sizeOption} ${styles.sizeOptionGenerate}`}>
                <div className={styles.sizeOptionLabel}>{size}×{size}</div>
                <div className={styles.sizeOptionDescription}>{description}</div>
                <div className={styles.sizeOptionBadge}>{label}</div>
                <button
                  onClick={() => handleGenerateCpuBoards(size)}
                  className={styles.generateButton}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : `Generate ${opponent.name} boards`}
                </button>
              </div>
            );
          }

          // Fallback - shouldn't reach here
          return null;
        })}
      </div>

      {/* Custom size input */}
      <div className={styles.customSection}>
        <h3 className={styles.customTitle}>Or use a custom size:</h3>
        <div className={styles.customInput}>
          <input
            type="number"
            min="2"
            max="99"
            placeholder="Enter size (2-99)"
            value={customSize}
            onChange={(e) => {
              setCustomSize(e.target.value);
              setCustomError('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomSize();
              }
            }}
            className={styles.inputField}
          />
          <button
            onClick={handleCustomSize}
            className={styles.customButton}
            disabled={!customSize}
          >
            Use {customSize ? `${customSize}×${customSize}` : 'Custom'}
          </button>
        </div>
        {customError && <p className={styles.errorMessage}>{customError}</p>}
      </div>

      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          Back
        </button>
      )}
    </div>
  );
}
