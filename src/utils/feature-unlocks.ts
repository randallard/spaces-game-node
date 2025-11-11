/**
 * Feature unlock system based on games completed
 */

import type { UserProfile } from '@/types';

export type FeatureUnlocks = {
  /** Available board sizes */
  boardSizes: number[];
  /** Whether deck mode is unlocked */
  deckMode: boolean;
};

/**
 * Calculate which features are unlocked based on games completed
 */
export function getFeatureUnlocks(user: UserProfile | null): FeatureUnlocks {
  const gamesCompleted = user?.stats.totalGames ?? 0;

  // Start with 2x2 and 3x3
  let boardSizes = [2, 3];

  // After 2 games: Add 4x4 and 5x5
  if (gamesCompleted >= 2) {
    boardSizes = [2, 3, 4, 5];
  }

  // After 6 games: Add all remaining sizes (6-10)
  if (gamesCompleted >= 6) {
    boardSizes = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  // After 3 games: Unlock deck mode
  const deckMode = gamesCompleted >= 3;

  return {
    boardSizes,
    deckMode,
  };
}

/**
 * Get the next unlock milestone
 */
export function getNextUnlock(user: UserProfile | null): {
  description: string;
  gamesRemaining: number;
} | null {
  const gamesCompleted = user?.stats.totalGames ?? 0;

  if (gamesCompleted < 2) {
    return {
      description: 'Unlock 4×4 and 5×5 boards',
      gamesRemaining: 2 - gamesCompleted,
    };
  }

  if (gamesCompleted < 3) {
    return {
      description: 'Unlock Deck Mode',
      gamesRemaining: 3 - gamesCompleted,
    };
  }

  if (gamesCompleted < 6) {
    return {
      description: 'Unlock all board sizes (6×6 to 10×10)',
      gamesRemaining: 6 - gamesCompleted,
    };
  }

  // All features unlocked
  return null;
}

/**
 * Check if a specific board size is unlocked
 */
export function isBoardSizeUnlocked(size: number, user: UserProfile | null): boolean {
  const unlocks = getFeatureUnlocks(user);
  return unlocks.boardSizes.includes(size);
}

/**
 * Check if deck mode is unlocked
 */
export function isDeckModeUnlocked(user: UserProfile | null): boolean {
  const unlocks = getFeatureUnlocks(user);
  return unlocks.deckMode;
}
