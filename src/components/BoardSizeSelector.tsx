/**
 * BoardSizeSelector component for choosing board size before starting a game
 * @module components/BoardSizeSelector
 */

import type { ReactElement } from 'react';
import { useState } from 'react';
import { isValidBoardSize } from '@/types';
import type { Board, Opponent, Deck, UserProfile } from '@/types';
import { getFeatureUnlocks, getNextUnlock } from '@/utils/feature-unlocks';
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
  onGenerateCpuBoards?: (size: number, opponentName?: string) => Promise<Deck | undefined>;
  /** User profile for feature unlock checks */
  user?: UserProfile | null;
  /** Callback to navigate to board creation */
  onCreateBoards?: (size: number) => void;
  /** Game mode being played */
  gameMode?: 'round-by-round' | 'deck' | null;
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
  user,
  onCreateBoards,
  gameMode,
}: BoardSizeSelectorProps): ReactElement {
  const [customSize, setCustomSize] = useState<string>('');
  const [customError, setCustomError] = useState<string>('');
  const [generatingSize, setGeneratingSize] = useState<number | null>(null);

  // Get unlocked board sizes
  const { boardSizes: unlockedSizes } = getFeatureUnlocks(user ?? null);
  const nextUnlock = getNextUnlock(user ?? null);

  // Check if playing against human opponent who hasn't completed a game yet
  const isFirstTimeHumanOpponent = opponent?.type === 'human' && !opponent?.hasCompletedGame;

  // Debug logging
  if (opponent?.type === 'human') {
    console.log('[BoardSizeSelector] Human opponent check:', {
      opponentName: opponent.name,
      hasCompletedGame: opponent.hasCompletedGame,
      wins: opponent.wins,
      losses: opponent.losses,
      isFirstTimeHumanOpponent,
    });
  }

  // All preset sizes
  const allPresetSizes = [
    { size: 2, label: 'Classic', description: 'Quick strategic gameplay' },
    { size: 3, label: 'Standard', description: 'Balanced complexity' },
    { size: 4, label: 'Advanced', description: 'More strategic depth' },
    { size: 5, label: 'Large', description: 'Complex gameplay' },
    { size: 6, label: 'Large+', description: 'Extra depth' },
    { size: 7, label: 'Extra Large', description: 'Extended matches' },
    { size: 8, label: 'Very Large', description: 'Complex battles' },
    { size: 9, label: 'Massive', description: 'Long games' },
    { size: 10, label: 'Huge', description: 'Epic battles' },
  ];

  // Filter to only show unlocked sizes
  // For first-time human opponents, restrict to 2x2 and 3x3 only
  const allowedSizes = isFirstTimeHumanOpponent
    ? unlockedSizes.filter(size => size === 2 || size === 3)
    : unlockedSizes;
  const presetSizes = allPresetSizes.filter(preset => allowedSizes.includes(preset.size));

  // Check board availability for a given size
  const getBoardAvailability = (size: number) => {
    const playerHasBoards = playerBoards.some((b) => b.boardSize === size);

    // For human opponents, only player needs boards (opponent will share theirs via URL)
    if (opponent?.type === 'human') {
      return {
        playerHasBoards,
        cpuHasBoards: true, // Not needed for human opponents
        bothHaveBoards: playerHasBoards,
      };
    }

    // For remote CPU, boards are fetched automatically when size is selected
    // So we always consider them "ready" (they'll be fetched on selection)
    if (opponent?.type === 'remote-cpu') {
      return {
        playerHasBoards,
        cpuHasBoards: true, // Will be fetched automatically
        bothHaveBoards: playerHasBoards,
      };
    }

    // Local CPU needs at least 3 boards for the size to be considered "ready"
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
    if (!isValidBoardSize(size)) {
      setCustomError(`Please enter a number between 2 and 99`);
      return;
    }
    if (isFirstTimeHumanOpponent && size !== 2 && size !== 3) {
      setCustomError(`For your first game with ${opponent?.name}, only 2×2 and 3×3 boards are available.`);
      return;
    }
    if (!unlockedSizes.includes(size)) {
      setCustomError(`Board size ${size}×${size} is not unlocked yet. Complete more games to unlock!`);
      return;
    }
    onSizeSelected(size);
  };

  // Format game mode display
  const gameModeDisplay = gameMode === 'round-by-round' ? 'Round by Round' : gameMode === 'deck' ? 'Deck Mode' : '';

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Board Size</h1>
      {opponent && (
        <p className={styles.subtitle} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {gameModeDisplay && `${gameModeDisplay} • `}{opponent.name}
        </p>
      )}
      <p className={styles.subtitle}>
        Select the board size for this game. All boards used in this game must match this size.
      </p>

      {/* First-time human opponent notification */}
      {isFirstTimeHumanOpponent && (
        <div style={{ textAlign: 'center', margin: '1rem 0', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          👥 First game with {opponent?.name}! Only 2×2 and 3×3 boards are available. Larger boards will unlock after your first game together.
        </div>
      )}

      {/* Next unlock notification */}
      {nextUnlock && !isFirstTimeHumanOpponent && (
        <div style={{ textAlign: 'center', margin: '1rem 0', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          🎯 Next unlock: <strong>{nextUnlock.description}</strong> ({nextUnlock.gamesRemaining} {nextUnlock.gamesRemaining === 1 ? 'game' : 'games'} remaining)
        </div>
      )}

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

          // Player doesn't have boards - show create button
          if (!playerHasBoards) {
            return (
              <div key={size} className={`${styles.sizeOption} ${styles.sizeOptionGenerate}`}>
                <div className={styles.sizeOptionLabel}>{size}×{size}</div>
                <div className={styles.sizeOptionDescription}>{description}</div>
                <div className={styles.sizeOptionBadge}>{label}</div>
                <button
                  onClick={() => {
                    if (onCreateBoards) {
                      onCreateBoards(size);
                    }
                  }}
                  className={styles.generateButton}
                >
                  Create {size}×{size} boards
                </button>
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
