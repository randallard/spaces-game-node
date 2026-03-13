/**
 * Tests for pending lot results utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveLotResultToServer,
  getLocalPendingResults,
  clearLocalPendingResult,
  type LotResultPayload,
} from './pending-lot-results';

const mockResult: LotResultPayload = {
  sessionId: 'test-session-1',
  npcId: 'myco',
  boardSize: 5,
  playerScore: 3,
  opponentScore: 2,
  winner: 'player',
  rounds: [
    { round: 1, playerPoints: 2, opponentPoints: 1, winner: 'player' },
    { round: 2, playerPoints: 1, opponentPoints: 2, winner: 'opponent' },
  ],
  completedAt: Date.now(),
};

describe('pending-lot-results', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getLocalPendingResults', () => {
    it('returns empty array when no results stored', () => {
      expect(getLocalPendingResults()).toEqual([]);
    });

    it('returns stored results', () => {
      localStorage.setItem(
        'spaces-game-pending-lot-results',
        JSON.stringify([mockResult]),
      );
      const results = getLocalPendingResults();
      expect(results).toHaveLength(1);
      expect(results[0]!.sessionId).toBe('test-session-1');
    });

    it('handles corrupt data gracefully', () => {
      localStorage.setItem('spaces-game-pending-lot-results', 'not-json');
      expect(getLocalPendingResults()).toEqual([]);
    });
  });

  describe('clearLocalPendingResult', () => {
    it('removes a specific result by sessionId', () => {
      const result2: LotResultPayload = { ...mockResult, sessionId: 'test-session-2' };
      localStorage.setItem(
        'spaces-game-pending-lot-results',
        JSON.stringify([mockResult, result2]),
      );

      clearLocalPendingResult('test-session-1');

      const remaining = getLocalPendingResults();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]!.sessionId).toBe('test-session-2');
    });

    it('does nothing when no results stored', () => {
      clearLocalPendingResult('nonexistent');
      expect(getLocalPendingResults()).toEqual([]);
    });
  });

  describe('saveLotResultToServer', () => {
    it('saves result to localStorage as fallback', async () => {
      // Mock fetch to fail so we only test localStorage fallback
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await saveLotResultToServer(mockResult);

      const stored = getLocalPendingResults();
      expect(stored).toHaveLength(1);
      expect(stored[0]!.sessionId).toBe('test-session-1');
    });

    it('replaces existing result for same session', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await saveLotResultToServer(mockResult);
      const updated = { ...mockResult, playerScore: 4 };
      await saveLotResultToServer(updated);

      const stored = getLocalPendingResults();
      expect(stored).toHaveLength(1);
      expect(stored[0]!.playerScore).toBe(4);
    });

    it('calls API endpoint with POST', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      await saveLotResultToServer(mockResult);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lot-results'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });
});
