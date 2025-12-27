/**
 * Tests for useUrlSync hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUrlSync } from './useUrlSync';
import type { GameState } from '@/types';
import * as urlCompression from '@/utils/url-compression';

// Mock url-compression module
vi.mock('@/utils/url-compression', () => ({
  compressGameState: vi.fn(),
  decompressGameState: vi.fn(),
}));

// Test fixture
const mockGameState: GameState = {
  phase: { type: 'board-selection', round: 1 },
  user: {
    id: 'user-1',
    name: 'Alice',
    createdAt: Date.now(),
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    },
  },
  opponent: {
    type: 'cpu',
    id: 'cpu-1',
    name: 'CPU',
    wins: 0,
    losses: 0,
  },
  gameId: null,
  gameMode: 'round-by-round',
  boardSize: 3,
  currentRound: 1,
  playerScore: 0,
  opponentScore: 0,
  playerSelectedBoard: null,
  opponentSelectedBoard: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
  roundHistory: [],
  checksum: '',
};

describe('useUrlSync', () => {
  beforeEach(() => {
    // Reset window.location
    delete (window as { location?: Location }).location;
    (window as { location?: Location }).location = {
      href: 'http://localhost/',
      hash: '',
    } as Location;

    // Mock history API
    window.history.replaceState = vi.fn();

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial mount', () => {
    it('should start with null gameState when no hash', () => {
      window.location.hash = '';

      const { result } = renderHook(() => useUrlSync());

      expect(result.current.gameState).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should parse hash on mount', () => {
      const compressed = 'compressed-data';
      window.location.hash = `#${compressed}`;
      vi.mocked(urlCompression.decompressGameState).mockReturnValue(mockGameState);

      const { result } = renderHook(() => useUrlSync());

      expect(urlCompression.decompressGameState).toHaveBeenCalledWith(compressed);
      expect(result.current.gameState).toEqual(mockGameState);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set error when hash parsing fails', () => {
      window.location.hash = '#invalid-hash';
      vi.mocked(urlCompression.decompressGameState).mockReturnValue(null);

      const { result } = renderHook(() => useUrlSync());

      expect(result.current.gameState).toBeNull();
      expect(result.current.error).toContain('Failed to load game from URL');
      expect(result.current.isLoading).toBe(false);
    });

    it('should call onGameStateReceived when hash is parsed successfully', () => {
      const onGameStateReceived = vi.fn();
      const compressed = 'compressed-data';
      window.location.hash = `#${compressed}`;
      vi.mocked(urlCompression.decompressGameState).mockReturnValue(mockGameState);

      renderHook(() => useUrlSync({ onGameStateReceived }));

      expect(onGameStateReceived).toHaveBeenCalledWith(mockGameState);
    });

    it('should call onError when hash parsing fails', () => {
      const onError = vi.fn();
      window.location.hash = '#invalid-hash';
      vi.mocked(urlCompression.decompressGameState).mockReturnValue(null);

      renderHook(() => useUrlSync({ onError }));

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load game from URL')
      );
    });
  });

  describe('updateUrl', () => {
    it('should update URL with debouncing', async () => {
      vi.useFakeTimers();

      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result } = renderHook(() => useUrlSync({ debounceMs: 300 }));

      act(() => {
        result.current.updateUrl(mockGameState);
      });

      // Should not update immediately
      expect(window.history.replaceState).not.toHaveBeenCalled();

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(urlCompression.compressGameState).toHaveBeenCalledWith(mockGameState);
      expect(window.history.replaceState).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should update hash in URL', async () => {
      vi.useFakeTimers();

      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result } = renderHook(() => useUrlSync({ debounceMs: 100 }));

      act(() => {
        result.current.updateUrl(mockGameState);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        expect.stringContaining(`#${compressed}`)
      );

      vi.useRealTimers();
    });

    it('should call onUrlUpdated after successful update', async () => {
      vi.useFakeTimers();

      const onUrlUpdated = vi.fn();
      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result } = renderHook(() => useUrlSync({ onUrlUpdated, debounceMs: 100 }));

      act(() => {
        result.current.updateUrl(mockGameState);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onUrlUpdated).toHaveBeenCalledWith(expect.stringContaining(compressed));

      vi.useRealTimers();
    });

    it('should set error when compression fails', async () => {
      vi.useFakeTimers();

      vi.mocked(urlCompression.compressGameState).mockReturnValue('');

      const { result } = renderHook(() => useUrlSync({ debounceMs: 100 }));

      act(() => {
        result.current.updateUrl(mockGameState);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.error).toContain('Failed to encode game state');

      vi.useRealTimers();
    });

    it('should cancel previous debounced update', async () => {
      vi.useFakeTimers();

      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result } = renderHook(() => useUrlSync({ debounceMs: 300 }));

      // First update
      act(() => {
        result.current.updateUrl(mockGameState);
      });

      // Fast-forward partway
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      // Second update (should cancel first)
      act(() => {
        result.current.updateUrl(mockGameState);
      });

      // Fast-forward to complete second debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should only have been called once (second update)
      expect(urlCompression.compressGameState).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('updateUrlImmediate', () => {
    it('should update URL without debouncing', () => {
      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result } = renderHook(() => useUrlSync());

      act(() => {
        result.current.updateUrlImmediate(mockGameState);
      });

      expect(urlCompression.compressGameState).toHaveBeenCalledWith(mockGameState);
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should cancel pending debounced update', async () => {
      vi.useFakeTimers();

      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result } = renderHook(() => useUrlSync({ debounceMs: 300 }));

      // Start debounced update
      act(() => {
        result.current.updateUrl(mockGameState);
      });

      // Immediately update (should cancel debounced)
      act(() => {
        result.current.updateUrlImmediate(mockGameState);
      });

      // Fast-forward past debounce time
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Should only have been called once (immediate update)
      expect(urlCompression.compressGameState).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('hashchange listener', () => {
    it('should listen for hash changes', async () => {
      const compressed = 'new-compressed-state';
      const newGameState = { ...mockGameState, currentRound: 2 };

      vi.mocked(urlCompression.decompressGameState).mockReturnValue(newGameState);

      const { result } = renderHook(() => useUrlSync());

      // Simulate hash change
      await act(async () => {
        window.location.hash = `#${compressed}`;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.gameState).toEqual(newGameState);
      });
    });

    it('should reset state when hash is removed', async () => {
      window.location.hash = '#initial-hash';
      vi.mocked(urlCompression.decompressGameState).mockReturnValue(mockGameState);

      const { result } = renderHook(() => useUrlSync());

      // Remove hash
      await act(async () => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.gameState).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    it('should set error on invalid hash change', async () => {
      vi.mocked(urlCompression.decompressGameState).mockReturnValue(null);

      const { result } = renderHook(() => useUrlSync());

      await act(async () => {
        window.location.hash = '#invalid';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load game from URL');
      });
    });
  });

  describe('getShareUrl', () => {
    it('should return current URL', () => {
      window.location.href = 'http://localhost/#game-state';

      const { result } = renderHook(() => useUrlSync());

      expect(result.current.getShareUrl()).toBe('http://localhost/#game-state');
    });
  });

  describe('copyShareUrl', () => {
    it('should copy URL to clipboard', async () => {
      window.location.href = 'http://localhost/#game-state';

      const { result } = renderHook(() => useUrlSync());

      const success = await result.current.copyShareUrl();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost/#game-state'
      );
      expect(success).toBe(true);
    });

    it('should return false on clipboard error', async () => {
      // Mock console.error to suppress expected error logging
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
        new Error('Clipboard error')
      );

      const { result } = renderHook(() => useUrlSync());

      const success = await result.current.copyShareUrl();

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy URL:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should clean up timer on unmount', async () => {
      vi.useFakeTimers();

      const compressed = 'compressed-state';
      vi.mocked(urlCompression.compressGameState).mockReturnValue(compressed);

      const { result, unmount } = renderHook(() => useUrlSync({ debounceMs: 300 }));

      act(() => {
        result.current.updateUrl(mockGameState);
      });

      // Unmount before timer fires
      unmount();

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Should not have updated (timer was cleaned up)
      expect(urlCompression.compressGameState).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
