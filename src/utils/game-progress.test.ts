/**
 * Tests for game progress tracking utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGameProgress,
  markRoundCompleted,
  markRoundPending,
  hasCompletedRound,
  isRoundPending,
  clearGameProgress,
  clearAllProgress,
  type GameProgress,
} from './game-progress';

describe('game-progress', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getGameProgress', () => {
    it('should return null for non-existent game', () => {
      const progress = getGameProgress('non-existent-game');
      expect(progress).toBeNull();
    });

    it('should return progress for existing game', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress).not.toBeNull();
      expect(progress?.gameId).toBe('game-1');
      expect(progress?.opponentId).toBe('opponent-1');
      expect(progress?.opponentName).toBe('Alice');
      expect(progress?.lastCompletedRound).toBe(1);
    });

    it('should return null when localStorage is empty', () => {
      localStorage.clear();
      const progress = getGameProgress('game-1');
      expect(progress).toBeNull();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('spaces-game-progress', 'invalid json');
      const progress = getGameProgress('game-1');
      expect(progress).toBeNull();
    });
  });

  describe('markRoundCompleted', () => {
    it('should create new progress entry for first round', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress).not.toBeNull();
      expect(progress?.gameId).toBe('game-1');
      expect(progress?.opponentId).toBe('opponent-1');
      expect(progress?.opponentName).toBe('Alice');
      expect(progress?.lastCompletedRound).toBe(1);
      expect(progress?.pendingRound).toBeNull();
      expect(progress?.lastUpdated).toBeGreaterThan(0);
    });

    it('should update existing progress when completing higher round', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress?.lastCompletedRound).toBe(2);
    });

    it('should not decrease lastCompletedRound when marking lower round', () => {
      markRoundCompleted('game-1', 3, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress?.lastCompletedRound).toBe(3);
    });

    it('should clear pendingRound when that round is completed', () => {
      markRoundPending('game-1', 2, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress?.pendingRound).toBeNull();
      expect(progress?.lastCompletedRound).toBe(2);
    });

    it('should not clear pendingRound when different round is completed', () => {
      markRoundPending('game-1', 3, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress?.pendingRound).toBe(3);
      expect(progress?.lastCompletedRound).toBe(2);
    });

    it('should update timestamp on completion', () => {
      const before = Date.now();
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');
      const after = Date.now();

      expect(progress?.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(progress?.lastUpdated).toBeLessThanOrEqual(after);
    });

    it('should handle multiple games independently', () => {
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      markRoundCompleted('game-2', 3, 'opponent-2', 'Bob');

      const progress1 = getGameProgress('game-1');
      const progress2 = getGameProgress('game-2');

      expect(progress1?.lastCompletedRound).toBe(2);
      expect(progress1?.opponentName).toBe('Alice');
      expect(progress2?.lastCompletedRound).toBe(3);
      expect(progress2?.opponentName).toBe('Bob');
    });
  });

  describe('markRoundPending', () => {
    it('should create new progress entry with pending round', () => {
      markRoundPending('game-1', 1, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress).not.toBeNull();
      expect(progress?.gameId).toBe('game-1');
      expect(progress?.pendingRound).toBe(1);
      expect(progress?.lastCompletedRound).toBe(0);
    });

    it('should update existing progress with new pending round', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      markRoundPending('game-1', 2, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress?.pendingRound).toBe(2);
      expect(progress?.lastCompletedRound).toBe(1);
    });

    it('should replace previous pending round', () => {
      markRoundPending('game-1', 2, 'opponent-1', 'Alice');
      markRoundPending('game-1', 3, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');

      expect(progress?.pendingRound).toBe(3);
    });

    it('should update timestamp when marking pending', () => {
      const before = Date.now();
      markRoundPending('game-1', 1, 'opponent-1', 'Alice');
      const progress = getGameProgress('game-1');
      const after = Date.now();

      expect(progress?.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(progress?.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('hasCompletedRound', () => {
    it('should return false for non-existent game', () => {
      expect(hasCompletedRound('game-1', 1)).toBe(false);
    });

    it('should return true for completed round', () => {
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      expect(hasCompletedRound('game-1', 2)).toBe(true);
    });

    it('should return true for rounds below completed round', () => {
      markRoundCompleted('game-1', 3, 'opponent-1', 'Alice');
      expect(hasCompletedRound('game-1', 1)).toBe(true);
      expect(hasCompletedRound('game-1', 2)).toBe(true);
      expect(hasCompletedRound('game-1', 3)).toBe(true);
    });

    it('should return false for rounds above completed round', () => {
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      expect(hasCompletedRound('game-1', 3)).toBe(false);
      expect(hasCompletedRound('game-1', 4)).toBe(false);
    });

    it('should return false when no rounds completed', () => {
      markRoundPending('game-1', 1, 'opponent-1', 'Alice');
      expect(hasCompletedRound('game-1', 1)).toBe(false);
    });
  });

  describe('isRoundPending', () => {
    it('should return false for non-existent game', () => {
      expect(isRoundPending('game-1', 1)).toBe(false);
    });

    it('should return true for pending round', () => {
      markRoundPending('game-1', 2, 'opponent-1', 'Alice');
      expect(isRoundPending('game-1', 2)).toBe(true);
    });

    it('should return false for non-pending round', () => {
      markRoundPending('game-1', 2, 'opponent-1', 'Alice');
      expect(isRoundPending('game-1', 1)).toBe(false);
      expect(isRoundPending('game-1', 3)).toBe(false);
    });

    it('should return false after pending round is completed', () => {
      markRoundPending('game-1', 2, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      expect(isRoundPending('game-1', 2)).toBe(false);
    });

    it('should return false when no pending round', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      expect(isRoundPending('game-1', 1)).toBe(false);
    });
  });

  describe('clearGameProgress', () => {
    it('should remove progress for specific game', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      markRoundCompleted('game-2', 2, 'opponent-2', 'Bob');

      clearGameProgress('game-1');

      expect(getGameProgress('game-1')).toBeNull();
      expect(getGameProgress('game-2')).not.toBeNull();
    });

    it('should do nothing if game does not exist', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      clearGameProgress('non-existent');
      expect(getGameProgress('game-1')).not.toBeNull();
    });

    it('should handle clearing from empty storage', () => {
      expect(() => clearGameProgress('game-1')).not.toThrow();
    });
  });

  describe('clearAllProgress', () => {
    it('should remove all progress data', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      markRoundCompleted('game-2', 2, 'opponent-2', 'Bob');
      markRoundCompleted('game-3', 3, 'opponent-3', 'Charlie');

      clearAllProgress();

      expect(getGameProgress('game-1')).toBeNull();
      expect(getGameProgress('game-2')).toBeNull();
      expect(getGameProgress('game-3')).toBeNull();
    });

    it('should handle clearing empty storage', () => {
      expect(() => clearAllProgress()).not.toThrow();
    });

    it('should allow new progress after clearing', () => {
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      clearAllProgress();
      markRoundCompleted('game-2', 2, 'opponent-2', 'Bob');

      expect(getGameProgress('game-1')).toBeNull();
      expect(getGameProgress('game-2')).not.toBeNull();
    });
  });

  describe('Storage limits', () => {
    it('should trim to most recent 100 games', () => {
      // Create 105 games
      for (let i = 1; i <= 105; i++) {
        markRoundCompleted(`game-${i}`, 1, `opponent-${i}`, `Player ${i}`);
      }

      // Get all stored data
      const stored = localStorage.getItem('spaces-game-progress');
      const parsed: GameProgress[] = stored ? JSON.parse(stored) : [];

      // Should only have 100 games
      expect(parsed.length).toBe(100);
    });

    it('should keep most recently updated games when trimming', () => {
      // Create games with controlled timestamps
      for (let i = 1; i <= 105; i++) {
        markRoundCompleted(`game-${i}`, 1, `opponent-${i}`, `Player ${i}`);
      }

      // The most recent games should still exist
      expect(getGameProgress('game-105')).not.toBeNull();
      expect(getGameProgress('game-104')).not.toBeNull();
      expect(getGameProgress('game-100')).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle localStorage errors gracefully when loading', () => {
      // Mock getItem to throw an error
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      const progress = getGameProgress('game-1');
      expect(progress).toBeNull();

      // Restore original
      Storage.prototype.getItem = originalGetItem;
    });

    it('should handle localStorage errors gracefully when saving', () => {
      // Mock setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => markRoundCompleted('game-1', 1, 'opponent-1', 'Alice')).not.toThrow();

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle localStorage errors when clearing', () => {
      // Mock removeItem to throw an error
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      expect(() => clearAllProgress()).not.toThrow();

      // Restore original
      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complete game flow', () => {
      const gameId = 'game-flow-test';
      const opponentId = 'opponent-1';
      const opponentName = 'Alice';

      // Round 1: pending then completed
      markRoundPending(gameId, 1, opponentId, opponentName);
      expect(isRoundPending(gameId, 1)).toBe(true);
      expect(hasCompletedRound(gameId, 1)).toBe(false);

      markRoundCompleted(gameId, 1, opponentId, opponentName);
      expect(isRoundPending(gameId, 1)).toBe(false);
      expect(hasCompletedRound(gameId, 1)).toBe(true);

      // Round 2: pending then completed
      markRoundPending(gameId, 2, opponentId, opponentName);
      expect(isRoundPending(gameId, 2)).toBe(true);
      expect(hasCompletedRound(gameId, 2)).toBe(false);
      expect(hasCompletedRound(gameId, 1)).toBe(true);

      markRoundCompleted(gameId, 2, opponentId, opponentName);
      expect(hasCompletedRound(gameId, 2)).toBe(true);
      expect(hasCompletedRound(gameId, 1)).toBe(true);

      // Final progress check
      const progress = getGameProgress(gameId);
      expect(progress?.lastCompletedRound).toBe(2);
      expect(progress?.pendingRound).toBeNull();
    });

    it('should maintain separate state for different games with same opponent', () => {
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');
      markRoundCompleted('game-2', 3, 'opponent-1', 'Alice');

      expect(hasCompletedRound('game-1', 2)).toBe(true);
      expect(hasCompletedRound('game-1', 3)).toBe(false);
      expect(hasCompletedRound('game-2', 3)).toBe(true);
      expect(hasCompletedRound('game-2', 2)).toBe(true);
    });

    it('should handle out-of-order round completion', () => {
      markRoundCompleted('game-1', 3, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 1, 'opponent-1', 'Alice');
      markRoundCompleted('game-1', 2, 'opponent-1', 'Alice');

      const progress = getGameProgress('game-1');
      expect(progress?.lastCompletedRound).toBe(3);
      expect(hasCompletedRound('game-1', 1)).toBe(true);
      expect(hasCompletedRound('game-1', 2)).toBe(true);
      expect(hasCompletedRound('game-1', 3)).toBe(true);
    });
  });
});
