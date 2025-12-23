/**
 * Tests for feature unlock system
 * @module utils/feature-unlocks.test
 */

import { describe, it, expect } from 'vitest';
import {
  getFeatureUnlocks,
  getNextUnlock,
  isBoardSizeUnlocked,
  isDeckModeUnlocked,
} from './feature-unlocks';
import type { UserProfile } from '@/types';

describe('feature-unlocks', () => {
  // Helper to create a user with specific game count
  const createUser = (totalGames: number): UserProfile => ({
    id: 'test-user',
    name: 'Test User',
    createdAt: Date.now(),
    stats: {
      totalGames,
      wins: 0,
      losses: 0,
    },
  });

  describe('getFeatureUnlocks', () => {
    it('should return initial unlocks (2x2, 3x3) for null user', () => {
      const unlocks = getFeatureUnlocks(null);

      expect(unlocks.boardSizes).toEqual([2, 3]);
      expect(unlocks.deckMode).toBe(false);
    });

    it('should return initial unlocks (2x2, 3x3) for 0 games', () => {
      const user = createUser(0);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3]);
      expect(unlocks.deckMode).toBe(false);
    });

    it('should return initial unlocks (2x2, 3x3) for 1 game', () => {
      const user = createUser(1);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3]);
      expect(unlocks.deckMode).toBe(false);
    });

    it('should unlock 4x4 and 5x5 after 2 games', () => {
      const user = createUser(2);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3, 4, 5]);
      expect(unlocks.deckMode).toBe(false);
    });

    it('should have 4x4 and 5x5 unlocked but not deck mode at 2 games', () => {
      const user = createUser(2);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toContain(4);
      expect(unlocks.boardSizes).toContain(5);
      expect(unlocks.deckMode).toBe(false);
    });

    it('should unlock deck mode after 3 games', () => {
      const user = createUser(3);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3, 4, 5]);
      expect(unlocks.deckMode).toBe(true);
    });

    it('should maintain deck mode unlock at 4 games', () => {
      const user = createUser(4);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.deckMode).toBe(true);
    });

    it('should maintain deck mode unlock at 5 games', () => {
      const user = createUser(5);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.deckMode).toBe(true);
    });

    it('should unlock all board sizes after 6 games', () => {
      const user = createUser(6);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(unlocks.deckMode).toBe(true);
    });

    it('should have all features unlocked after 10 games', () => {
      const user = createUser(10);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(unlocks.deckMode).toBe(true);
    });

    it('should have all features unlocked after 100 games', () => {
      const user = createUser(100);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(unlocks.deckMode).toBe(true);
    });
  });

  describe('getNextUnlock', () => {
    it('should show 4x4/5x5 unlock for null user', () => {
      const next = getNextUnlock(null);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock 4×4 and 5×5 boards');
      expect(next?.gamesRemaining).toBe(2);
    });

    it('should show 4x4/5x5 unlock for 0 games', () => {
      const user = createUser(0);
      const next = getNextUnlock(user);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock 4×4 and 5×5 boards');
      expect(next?.gamesRemaining).toBe(2);
    });

    it('should show 4x4/5x5 unlock with 1 game remaining', () => {
      const user = createUser(1);
      const next = getNextUnlock(user);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock 4×4 and 5×5 boards');
      expect(next?.gamesRemaining).toBe(1);
    });

    it('should show deck mode unlock after 2 games', () => {
      const user = createUser(2);
      const next = getNextUnlock(user);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock Deck Mode');
      expect(next?.gamesRemaining).toBe(1);
    });

    it('should show all board sizes unlock after 3 games', () => {
      const user = createUser(3);
      const next = getNextUnlock(user);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock all board sizes (6×6 to 10×10)');
      expect(next?.gamesRemaining).toBe(3);
    });

    it('should show all board sizes unlock with 2 games remaining', () => {
      const user = createUser(4);
      const next = getNextUnlock(user);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock all board sizes (6×6 to 10×10)');
      expect(next?.gamesRemaining).toBe(2);
    });

    it('should show all board sizes unlock with 1 game remaining', () => {
      const user = createUser(5);
      const next = getNextUnlock(user);

      expect(next).not.toBeNull();
      expect(next?.description).toBe('Unlock all board sizes (6×6 to 10×10)');
      expect(next?.gamesRemaining).toBe(1);
    });

    it('should return null when all features unlocked at 6 games', () => {
      const user = createUser(6);
      const next = getNextUnlock(user);

      expect(next).toBeNull();
    });

    it('should return null when all features unlocked at 10 games', () => {
      const user = createUser(10);
      const next = getNextUnlock(user);

      expect(next).toBeNull();
    });

    it('should return null when all features unlocked at 100 games', () => {
      const user = createUser(100);
      const next = getNextUnlock(user);

      expect(next).toBeNull();
    });
  });

  describe('isBoardSizeUnlocked', () => {
    it('should return true for size 2 with null user', () => {
      expect(isBoardSizeUnlocked(2, null)).toBe(true);
    });

    it('should return true for size 3 with null user', () => {
      expect(isBoardSizeUnlocked(3, null)).toBe(true);
    });

    it('should return false for size 4 with null user', () => {
      expect(isBoardSizeUnlocked(4, null)).toBe(false);
    });

    it('should return false for size 5 with 0 games', () => {
      const user = createUser(0);
      expect(isBoardSizeUnlocked(5, user)).toBe(false);
    });

    it('should return false for size 6 with 0 games', () => {
      const user = createUser(0);
      expect(isBoardSizeUnlocked(6, user)).toBe(false);
    });

    it('should return true for size 4 with 2 games', () => {
      const user = createUser(2);
      expect(isBoardSizeUnlocked(4, user)).toBe(true);
    });

    it('should return true for size 5 with 2 games', () => {
      const user = createUser(2);
      expect(isBoardSizeUnlocked(5, user)).toBe(true);
    });

    it('should return false for size 6 with 5 games', () => {
      const user = createUser(5);
      expect(isBoardSizeUnlocked(6, user)).toBe(false);
    });

    it('should return true for size 6 with 6 games', () => {
      const user = createUser(6);
      expect(isBoardSizeUnlocked(6, user)).toBe(true);
    });

    it('should return true for size 7 with 6 games', () => {
      const user = createUser(6);
      expect(isBoardSizeUnlocked(7, user)).toBe(true);
    });

    it('should return true for size 8 with 6 games', () => {
      const user = createUser(6);
      expect(isBoardSizeUnlocked(8, user)).toBe(true);
    });

    it('should return true for size 9 with 6 games', () => {
      const user = createUser(6);
      expect(isBoardSizeUnlocked(9, user)).toBe(true);
    });

    it('should return true for size 10 with 6 games', () => {
      const user = createUser(6);
      expect(isBoardSizeUnlocked(10, user)).toBe(true);
    });

    it('should return false for size 11 (non-existent)', () => {
      const user = createUser(100);
      expect(isBoardSizeUnlocked(11, user)).toBe(false);
    });

    it('should return false for size 1 (non-existent)', () => {
      const user = createUser(100);
      expect(isBoardSizeUnlocked(1, user)).toBe(false);
    });
  });

  describe('isDeckModeUnlocked', () => {
    it('should return false for null user', () => {
      expect(isDeckModeUnlocked(null)).toBe(false);
    });

    it('should return false for 0 games', () => {
      const user = createUser(0);
      expect(isDeckModeUnlocked(user)).toBe(false);
    });

    it('should return false for 1 game', () => {
      const user = createUser(1);
      expect(isDeckModeUnlocked(user)).toBe(false);
    });

    it('should return false for 2 games', () => {
      const user = createUser(2);
      expect(isDeckModeUnlocked(user)).toBe(false);
    });

    it('should return true for 3 games', () => {
      const user = createUser(3);
      expect(isDeckModeUnlocked(user)).toBe(true);
    });

    it('should return true for 4 games', () => {
      const user = createUser(4);
      expect(isDeckModeUnlocked(user)).toBe(true);
    });

    it('should return true for 10 games', () => {
      const user = createUser(10);
      expect(isDeckModeUnlocked(user)).toBe(true);
    });

    it('should return true for 100 games', () => {
      const user = createUser(100);
      expect(isDeckModeUnlocked(user)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle negative games (treat as 0)', () => {
      const user = createUser(-5);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3]);
      expect(unlocks.deckMode).toBe(false);
    });

    it('should provide correct progression through all milestones', () => {
      // Game 0-1: 2x2, 3x3 only
      expect(getFeatureUnlocks(createUser(0)).boardSizes).toHaveLength(2);
      expect(getFeatureUnlocks(createUser(1)).boardSizes).toHaveLength(2);

      // Game 2: Add 4x4, 5x5
      expect(getFeatureUnlocks(createUser(2)).boardSizes).toHaveLength(4);

      // Game 3: Unlock deck mode
      expect(getFeatureUnlocks(createUser(3)).deckMode).toBe(true);

      // Game 6: All board sizes
      expect(getFeatureUnlocks(createUser(6)).boardSizes).toHaveLength(9);
    });

    it('should handle very large game counts', () => {
      const user = createUser(1000000);
      const unlocks = getFeatureUnlocks(user);

      expect(unlocks.boardSizes).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(unlocks.deckMode).toBe(true);
    });

    it('should return null for next unlock when everything is unlocked', () => {
      const user = createUser(1000);
      const next = getNextUnlock(user);

      expect(next).toBeNull();
    });
  });
});
