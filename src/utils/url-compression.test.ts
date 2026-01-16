/**
 * Tests for URL compression utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  compressGameState,
  decompressGameState,
  compressPayload,
  decompressPayload,
  getGameStateFromHash,
  setGameStateToHash,
  clearHash,
  getCompressionRatio,
} from './url-compression';
import type { GameState, UrlPayload } from '@/types';

describe('compressGameState', () => {
  const validState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      createdAt: Date.now(),
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      },
    },
    opponent: null,
  gameId: null,
      gameCreatorId: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
      lastDiscordNotificationTime: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc123',
  };

  it('should compress game state to URL-safe string', () => {
    const compressed = compressGameState(validState);
    expect(compressed).toBeTruthy();
    expect(typeof compressed).toBe('string');
  });

  it('should produce reasonable compression for larger states', () => {
    // Small states may not compress well due to overhead
    // Add more data to test actual compression
    const largerState = {
      ...validState,
      user: {
        ...validState.user,
        savedBoards: Array(5).fill({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Board',
          grid: [['piece', 'empty'], ['trap', 'empty']],
          sequence: [
            { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
          ],
          thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          createdAt: Date.now(),
        }),
      },
    };
    const compressed = compressGameState(largerState);
    const json = JSON.stringify(largerState);
    // Larger states should compress better
    expect(compressed.length).toBeLessThan(json.length);
  });

  it('should produce valid encoded URI component', () => {
    const compressed = compressGameState(validState);
    // Should be a valid URI component (can contain more than just A-Za-z0-9_-)
    expect(() => decodeURIComponent(compressed)).not.toThrow();
  });

  it('should return empty string when compression fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a circular reference to cause JSON.stringify to fail
    const circularState: any = { ...validState };
    circularState.self = circularState;

    const result = compressGameState(circularState);

    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to compress game state'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('decompressGameState', () => {
  const validState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      createdAt: Date.now(),
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
    },
    opponent: null,
  gameId: null,
      gameCreatorId: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
      lastDiscordNotificationTime: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc123',
  };

  it('should decompress valid compressed state', () => {
    const compressed = compressGameState(validState);
    const decompressed = decompressGameState(compressed);
    expect(decompressed).toEqual(validState);
  });

  it('should return null for invalid compressed string', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = decompressGameState('invalid-string');
    expect(result).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should return null for empty string', () => {
    const result = decompressGameState('');
    expect(result).toBeNull();
  });

  it('should validate decompressed data with schema', () => {
    // Create invalid state (missing required fields)
    const invalidState = { phase: { type: 'user-setup' } };
    // Manually compress invalid state
    const compressed = compressGameState(invalidState as GameState);

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // This compressed data is invalid, so decompression should fail validation
    const result = decompressGameState(compressed);
    expect(result).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

describe('compressPayload and decompressPayload', () => {
  it('should return empty string when compression fails', () => {
    // Mock LZString to throw an error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a circular reference to cause JSON.stringify to fail
    const circularPayload: any = { type: 'delta' };
    circularPayload.self = circularPayload;

    const result = compressPayload(circularPayload);

    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to compress payload'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should return null when decompression returns empty string', () => {
    // Directly test empty decompression result
    const result = decompressPayload('invalid-compressed-data');

    expect(result).toBeNull();
  });

  it('should return null when payload validation fails', () => {
    // Create a payload that compresses but doesn't validate
    const invalidPayload = { type: 'unknown_type' };
    const compressed = compressPayload(invalidPayload as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = decompressPayload(compressed);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('URL payload validation failed'),
      expect.anything()
    );

    consoleErrorSpy.mockRestore();
  });

  it('should return null when decompression throws error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Pass malformed data that will cause JSON.parse to fail
    const result = decompressPayload('LZString-but-not-valid-json');

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to decompress payload'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should compress and decompress delta payload', () => {
    const payload: UrlPayload = {
      type: 'delta',
      changes: { currentRound: 1 },
    };

    const compressed = compressPayload(payload);
    const decompressed = decompressPayload(compressed);

    expect(decompressed).toEqual(payload);
  });

  it('should compress and decompress full_state payload', () => {
    const state: GameState = {
      phase: { type: 'user-setup' },
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        createdAt: Date.now(),
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: null,
  gameId: null,
      gameCreatorId: null,
      currentRound: 0,
      playerScore: 0,
      opponentScore: 0,
      playerSelectedBoard: null,
      opponentSelectedBoard: null,
      roundHistory: [],
      lastDiscordNotificationTime: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
      checksum: 'abc',
    };

    const payload: UrlPayload = {
      type: 'full_state',
      state,
    };

    const compressed = compressPayload(payload);
    const decompressed = decompressPayload(compressed);

    expect(decompressed).toEqual(payload);
  });

  it('should compress and decompress resync_request payload', () => {
    const payload: UrlPayload = {
      type: 'resync_request',
      requestId: 'req-123',
    };

    const compressed = compressPayload(payload);
    const decompressed = decompressPayload(compressed);

    expect(decompressed).toEqual(payload);
  });

  it('should return null for invalid payload', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = decompressPayload('invalid');
    expect(result).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

describe('getGameStateFromHash', () => {
  const validState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      createdAt: Date.now(),
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
    },
    opponent: null,
  gameId: null,
      gameCreatorId: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
      lastDiscordNotificationTime: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc',
  };

  beforeEach(() => {
    // Clear hash before each test
    window.location.hash = '';
  });

  it('should return null when hash is empty', () => {
    const result = getGameStateFromHash();
    expect(result).toBeNull();
  });

  it('should get state from hash', () => {
    const compressed = compressGameState(validState);
    window.location.hash = `#${compressed}`;

    const result = getGameStateFromHash();
    expect(result).toEqual(validState);
  });

  it('should return null for invalid hash', () => {
    window.location.hash = '#invalid-hash';

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = getGameStateFromHash();
    expect(result).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

describe('setGameStateToHash', () => {
  const validState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      createdAt: Date.now(),
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
    },
    opponent: null,
  gameId: null,
      gameCreatorId: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
      lastDiscordNotificationTime: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc',
  };

  beforeEach(() => {
    window.location.hash = '';
  });

  it('should set state to URL hash', () => {
    setGameStateToHash(validState);
    expect(window.location.hash).toBeTruthy();
    expect(window.location.hash).toContain('#');
  });

  it('should allow retrieval of set state', () => {
    setGameStateToHash(validState);
    const retrieved = getGameStateFromHash();
    expect(retrieved).toEqual(validState);
  });
});

describe('clearHash', () => {
  beforeEach(() => {
    window.location.hash = '#some-hash';
  });

  it('should clear URL hash', () => {
    expect(window.location.hash).toBeTruthy();
    clearHash();
    expect(window.location.hash).toBe('');
  });
});

describe('getCompressionRatio', () => {
  const validState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      createdAt: Date.now(),
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
    },
    opponent: null,
  gameId: null,
      gameCreatorId: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
      lastDiscordNotificationTime: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc123',
  };

  it('should return positive compression ratio', () => {
    // Small states may have ratio > 1 due to compression overhead
    const ratio = getCompressionRatio(validState);
    expect(ratio).toBeGreaterThan(0);
  });

  it('should calculate ratio as compressed/original', () => {
    const json = JSON.stringify(validState);
    const compressed = compressGameState(validState);
    const expectedRatio = compressed.length / json.length;

    expect(getCompressionRatio(validState)).toBe(expectedRatio);
  });
});
