/**
 * Tests for challenge URL generation and parsing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LZString from 'lz-string';
import {
  generateChallengeUrl,
  generateFinalResultsUrl,
  parseChallengeUrl,
  hasChallengeInUrl,
  getChallengeFromUrl,
  clearChallengeFromUrl,
  type ChallengeData,
} from './challenge-url';
import type { Board } from '../types/board';

// Mock board for testing
const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['empty', 'trap'],
  ],
  sequence: [
    { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
    { position: { row: -1, col: 0 }, type: 'final', order: 3 },
  ],
  thumbnail: '',
  createdAt: Date.now(),
};

describe('generateChallengeUrl', () => {
  beforeEach(() => {
    // Mock window.location
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        hash: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate a challenge URL with all required fields', () => {
    const url = generateChallengeUrl(
      mockBoard,
      1,
      'round-by-round',
      'game-123',
      'player-456',
      'Alice'
    );

    expect(url).toContain('http://localhost:3000/game#c=');
    expect(url.length).toBeGreaterThan(50); // Should be compressed
  });

  it('should include optional scores when provided', () => {
    const url = generateChallengeUrl(
      mockBoard,
      2,
      'deck',
      'game-789',
      'player-101',
      'Bob',
      3,
      1
    );

    expect(url).toContain('#c=');
    // Parse it back to verify scores are included
    const parsed = parseChallengeUrl(url);
    expect(parsed?.playerScore).toBe(3);
    expect(parsed?.opponentScore).toBe(1);
  });

  it('should handle different game modes', () => {
    const roundByRoundUrl = generateChallengeUrl(
      mockBoard,
      1,
      'round-by-round',
      'game-1',
      'player-1',
      'Alice'
    );

    const deckUrl = generateChallengeUrl(
      mockBoard,
      1,
      'deck',
      'game-2',
      'player-2',
      'Bob'
    );

    expect(roundByRoundUrl).toBeDefined();
    expect(deckUrl).toBeDefined();

    const parsed1 = parseChallengeUrl(roundByRoundUrl);
    const parsed2 = parseChallengeUrl(deckUrl);

    expect(parsed1?.gameMode).toBe('round-by-round');
    expect(parsed2?.gameMode).toBe('deck');
  });

  it('should preserve board data in URL', () => {
    const url = generateChallengeUrl(
      mockBoard,
      1,
      'round-by-round',
      'game-123',
      'player-456',
      'Alice'
    );

    const parsed = parseChallengeUrl(url);
    expect(parsed?.boardSize).toBe(2);
    expect(parsed?.playerBoard).toBe('2|0p3tG0f'); // Encoded board
  });
});

describe('generateFinalResultsUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        hash: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate a final results URL', () => {
    const url = generateFinalResultsUrl(
      3,
      5,
      2,
      'round-by-round',
      'game-999',
      'player-888',
      'Charlie'
    );

    expect(url).toContain('#c=');

    const parsed = parseChallengeUrl(url);
    expect(parsed?.isFinalResults).toBe(true);
    expect(parsed?.playerScore).toBe(5);
    expect(parsed?.opponentScore).toBe(2);
    expect(parsed?.round).toBe(5);
    expect(parsed?.boardSize).toBe(3);
  });

  it('should set round to 5 for final results', () => {
    const url = generateFinalResultsUrl(
      2,
      3,
      2,
      'deck',
      'game-final',
      'player-final',
      'Dave'
    );

    const parsed = parseChallengeUrl(url);
    expect(parsed?.round).toBe(5);
  });

  it('should not include board data for final results', () => {
    const url = generateFinalResultsUrl(
      2,
      4,
      1,
      'round-by-round',
      'game-end',
      'player-end',
      'Eve'
    );

    const parsed = parseChallengeUrl(url);
    expect(parsed?.playerBoard).toBe('');
  });
});

describe('parseChallengeUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        hash: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should parse a valid challenge URL', () => {
    const url = generateChallengeUrl(
      mockBoard,
      2,
      'round-by-round',
      'game-parse',
      'player-parse',
      'Parser'
    );

    const parsed = parseChallengeUrl(url);

    expect(parsed).toBeDefined();
    expect(parsed?.round).toBe(2);
    expect(parsed?.gameMode).toBe('round-by-round');
    expect(parsed?.gameId).toBe('game-parse');
    expect(parsed?.playerId).toBe('player-parse');
    expect(parsed?.playerName).toBe('Parser');
  });

  it('should parse hash fragment without full URL', () => {
    const fullUrl = generateChallengeUrl(
      mockBoard,
      1,
      'deck',
      'game-hash',
      'player-hash',
      'Hasher'
    );

    const hashIndex = fullUrl.indexOf('#');
    const hashFragment = fullUrl.substring(hashIndex);

    const parsed = parseChallengeUrl(hashFragment);
    expect(parsed?.gameId).toBe('game-hash');
  });

  it('should return null for invalid compressed data', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const parsed = parseChallengeUrl('#c=invalid-compressed-data');

    expect(parsed).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to decompress challenge data'
    );

    consoleErrorSpy.mockRestore();
  });

  it('should return null for missing required fields', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create invalid challenge data manually
    const invalidData = {
      playerBoard: '2|0p',
      boardSize: 2,
      // Missing: round, gameMode, gameId, playerId, playerName
    };

    const jsonStr = JSON.stringify(invalidData);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const url = `#c=${compressed}`;

    const parsed = parseChallengeUrl(url);
    expect(parsed).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should return null for non-final results with missing board', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invalidData: ChallengeData = {
      playerBoard: '', // Empty board but not marked as final results
      boardSize: 2,
      round: 1,
      gameMode: 'round-by-round',
      gameId: 'game-invalid',
      playerId: 'player-invalid',
      playerName: 'Invalid',
      isFinalResults: false,
    };

    const jsonStr = JSON.stringify(invalidData);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const url = `#c=${compressed}`;

    const parsed = parseChallengeUrl(url);
    expect(parsed).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should return null for invalid board encoding', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invalidData: ChallengeData = {
      playerBoard: 'invalid-board-format',
      boardSize: 2,
      round: 1,
      gameMode: 'round-by-round',
      gameId: 'game-bad-board',
      playerId: 'player-bad-board',
      playerName: 'BadBoard',
    };

    const jsonStr = JSON.stringify(invalidData);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const url = `#c=${compressed}`;

    const parsed = parseChallengeUrl(url);
    expect(parsed).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should handle old URL format gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Old format used different parameters
    const oldUrl = '#challenge=some-old-data';

    const parsed = parseChallengeUrl(oldUrl);
    expect(parsed).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Old challenge URL format detected - please generate a new challenge URL'
    );

    consoleErrorSpy.mockRestore();
  });

  it('should return null on JSON parse error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Compress invalid JSON
    const compressed = LZString.compressToEncodedURIComponent('not valid json{');
    const url = `#c=${compressed}`;

    const parsed = parseChallengeUrl(url);
    expect(parsed).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse challenge URL:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('hasChallengeInUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        hash: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return true when URL has compressed challenge', () => {
    window.location.hash = '#c=some-compressed-data';
    expect(hasChallengeInUrl()).toBe(true);
  });

  it('should return true when URL has old challenge format', () => {
    window.location.hash = '#challenge=old-data';
    expect(hasChallengeInUrl()).toBe(true);
  });

  it('should return false when URL has no hash', () => {
    window.location.hash = '';
    expect(hasChallengeInUrl()).toBe(false);
  });

  it('should return false when URL has different hash params', () => {
    window.location.hash = '#other=param';
    expect(hasChallengeInUrl()).toBe(false);
  });
});

describe('getChallengeFromUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        hash: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return challenge data from current URL', () => {
    const url = generateChallengeUrl(
      mockBoard,
      3,
      'round-by-round',
      'game-current',
      'player-current',
      'Current'
    );

    // Extract hash and set it
    const hashIndex = url.indexOf('#');
    window.location.hash = url.substring(hashIndex);

    const challenge = getChallengeFromUrl();
    expect(challenge).toBeDefined();
    expect(challenge?.gameId).toBe('game-current');
  });

  it('should return null when no hash in URL', () => {
    window.location.hash = '';
    const challenge = getChallengeFromUrl();
    expect(challenge).toBeNull();
  });

  it('should return null for invalid hash', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    window.location.hash = '#c=invalid-data';
    const challenge = getChallengeFromUrl();
    expect(challenge).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

describe('clearChallengeFromUrl', () => {
  it('should clear hash using replaceState when available', () => {
    const mockReplaceState = vi.fn();
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        search: '?foo=bar',
        hash: '#c=data',
      },
      history: {
        replaceState: mockReplaceState,
      },
    });

    clearChallengeFromUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(
      {},
      expect.any(String),
      '/game?foo=bar'
    );

    vi.unstubAllGlobals();
  });

  it('should clear hash directly when replaceState unavailable', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        search: '',
        hash: '#c=data',
      },
      history: {},
    });

    clearChallengeFromUrl();

    expect(window.location.hash).toBe('');

    vi.unstubAllGlobals();
  });
});

describe('round-trip challenge URL', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/game',
        hash: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should preserve all data through generate/parse cycle', () => {
    const url = generateChallengeUrl(
      mockBoard,
      4,
      'deck',
      'game-roundtrip',
      'player-roundtrip',
      'RoundTrip',
      4,
      2
    );

    const parsed = parseChallengeUrl(url);

    expect(parsed).toBeDefined();
    expect(parsed?.round).toBe(4);
    expect(parsed?.gameMode).toBe('deck');
    expect(parsed?.gameId).toBe('game-roundtrip');
    expect(parsed?.playerId).toBe('player-roundtrip');
    expect(parsed?.playerName).toBe('RoundTrip');
    expect(parsed?.playerScore).toBe(4);
    expect(parsed?.opponentScore).toBe(2);
    expect(parsed?.boardSize).toBe(2);
    expect(parsed?.playerBoard).toBe('2|0p3tG0f');
  });

  it('should handle final results round-trip', () => {
    const url = generateFinalResultsUrl(
      5,
      5,
      0,
      'round-by-round',
      'game-final-rt',
      'player-final-rt',
      'FinalRT'
    );

    const parsed = parseChallengeUrl(url);

    expect(parsed).toBeDefined();
    expect(parsed?.isFinalResults).toBe(true);
    expect(parsed?.round).toBe(5);
    expect(parsed?.playerScore).toBe(5);
    expect(parsed?.opponentScore).toBe(0);
    expect(parsed?.gameMode).toBe('round-by-round');
  });
});
