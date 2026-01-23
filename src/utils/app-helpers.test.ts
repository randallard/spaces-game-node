/**
 * Tests for App helper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getOpponentIcon, createEmptyUser, createInitialState } from './app-helpers';
import { derivePhase, deriveCurrentRound, derivePlayerScore, deriveOpponentScore, derivePlayerSelectedBoard, deriveOpponentSelectedBoard } from './derive-state';
import type { Opponent, UserProfile } from '@/types';
import {
  CPU_OPPONENT_ID,
  CPU_TOUGHER_OPPONENT_ID,
  CPU_OPPONENT_NAME,
  CPU_TOUGHER_OPPONENT_NAME,
} from '@/constants/game-rules';

describe('getOpponentIcon', () => {
  it('should return robot emoji for CPU Sam by ID', () => {
    const opponent: Opponent = {
      id: CPU_OPPONENT_ID,
      name: 'CPU Sam',
      type: 'cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🤖');
  });

  it('should return robot emoji for CPU opponent with different name', () => {
    const opponent: Opponent = {
      id: 'some-cpu-id',
      name: 'CPU Player',
      type: 'cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🤖');
  });

  it('should return strong arm emoji for CPU Tougher by ID', () => {
    const opponent: Opponent = {
      id: CPU_TOUGHER_OPPONENT_ID,
      name: 'Some Name',
      type: 'cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🦾');
  });

  it('should return strong arm emoji for CPU Tougher by name', () => {
    const opponent: Opponent = {
      id: 'different-id',
      name: CPU_TOUGHER_OPPONENT_NAME,
      type: 'cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🦾');
  });

  it('should return strong arm emoji when both ID and name match CPU Tougher', () => {
    const opponent: Opponent = {
      id: CPU_TOUGHER_OPPONENT_ID,
      name: CPU_TOUGHER_OPPONENT_NAME,
      type: 'cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🦾');
  });

  it('should return globe emoji for remote CPU opponent', () => {
    const opponent: Opponent = {
      id: 'remote-cpu-abc123',
      name: 'CPU Remote',
      type: 'remote-cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🌐');
  });

  it('should return person emoji for human opponent', () => {
    const opponent: Opponent = {
      id: 'user-123',
      name: 'Alice',
      type: 'human',
      wins: 5,
      losses: 3,
    };

    expect(getOpponentIcon(opponent)).toBe('👤');
  });

  it('should prioritize ID over name for CPU Tougher detection', () => {
    const opponent: Opponent = {
      id: CPU_TOUGHER_OPPONENT_ID,
      name: 'Different Name',
      type: 'cpu',
      wins: 0,
      losses: 0,
    };

    expect(getOpponentIcon(opponent)).toBe('🦾');
  });

  it('should handle human opponent with CPU-like name', () => {
    const opponent: Opponent = {
      id: 'user-123',
      name: CPU_OPPONENT_NAME,
      type: 'human',
      wins: 0,
      losses: 0,
    };

    // Should return person emoji because type is 'human'
    expect(getOpponentIcon(opponent)).toBe('👤');
  });
});

describe('createEmptyUser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create user with empty id', () => {
    const user = createEmptyUser();
    expect(user.id).toBe('');
  });

  it('should create user with empty name', () => {
    const user = createEmptyUser();
    expect(user.name).toBe('');
  });

  it('should create user with current timestamp', () => {
    const now = 1234567890000;
    vi.setSystemTime(now);

    const user = createEmptyUser();
    expect(user.createdAt).toBe(now);
  });

  it('should create user with zero stats', () => {
    const user = createEmptyUser();

    expect(user.stats).toEqual({
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    });
  });

  it('should create new instance each time', () => {
    const user1 = createEmptyUser();
    const user2 = createEmptyUser();

    // Should be different objects
    expect(user1).not.toBe(user2);
    // But with same structure
    expect(user1.id).toBe(user2.id);
    expect(user1.name).toBe(user2.name);
  });

  it('should have all required UserProfile fields', () => {
    const user = createEmptyUser();

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('stats');
    expect(user.stats).toHaveProperty('totalGames');
    expect(user.stats).toHaveProperty('wins');
    expect(user.stats).toHaveProperty('losses');
    expect(user.stats).toHaveProperty('ties');
  });
});

describe('createInitialState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with null user', () => {
    it('should start in tutorial-intro phase', () => {
      const state = createInitialState(null);
      expect(derivePhase(state).type).toBe('tutorial-intro');
    });

    it('should create empty user', () => {
      const state = createInitialState(null);

      expect(state.user.id).toBe('');
      expect(state.user.name).toBe('');
      expect(state.user.stats.totalGames).toBe(0);
    });

    it('should have null opponent', () => {
      const state = createInitialState(null);
      expect(state.opponent).toBeNull();
    });

    it('should have initial game values', () => {
      const state = createInitialState(null);

      expect(state.gameMode).toBeNull();
      expect(state.boardSize).toBeNull();
      expect(deriveCurrentRound(state)).toBe(1);
      expect(derivePlayerScore(state.roundHistory)).toBe(0);
      expect(deriveOpponentScore(state.roundHistory)).toBe(0);
    });

    it('should have null board selections', () => {
      const state = createInitialState(null);

      expect(derivePlayerSelectedBoard(state)).toBeNull();
      expect(deriveOpponentSelectedBoard(state)).toBeNull();
      expect(state.playerSelectedDeck).toBeNull();
      expect(state.opponentSelectedDeck).toBeNull();
    });

    it('should have empty round history', () => {
      const state = createInitialState(null);
      expect(state.roundHistory).toEqual([]);
    });

    it('should have empty checksum', () => {
      const state = createInitialState(null);
      expect(state.checksum).toBe('');
    });
  });

  describe('with user without name', () => {
    it('should start in tutorial-intro phase', () => {
      const user: UserProfile = {
        id: 'user-123',
        name: '',
        createdAt: Date.now(),
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      };

      const state = createInitialState(user);
      expect(derivePhase(state).type).toBe('tutorial-intro');
    });

    it('should use provided user', () => {
      const user: UserProfile = {
        id: 'user-123',
        name: '',
        createdAt: 1000,
        stats: { totalGames: 5, wins: 2, losses: 3, ties: 0 },
      };

      const state = createInitialState(user);
      expect(state.user).toBe(user);
      expect(state.user.id).toBe('user-123');
      expect(state.user.stats.totalGames).toBe(5);
    });
  });

  describe('with user with name', () => {
    it('should start in board-management phase', () => {
      const user: UserProfile = {
        id: 'user-123',
        name: 'Alice',
        createdAt: Date.now(),
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      };

      const state = createInitialState(user);
      expect(derivePhase(state).type).toBe('board-management');
    });

    it('should use provided user', () => {
      const user: UserProfile = {
        id: 'user-456',
        name: 'Bob',
        createdAt: 2000,
        stats: { totalGames: 10, wins: 5, losses: 3, ties: 2 },
      };

      const state = createInitialState(user);
      expect(state.user).toBe(user);
      expect(state.user.id).toBe('user-456');
      expect(state.user.name).toBe('Bob');
      expect(state.user.stats.wins).toBe(5);
    });

    it('should still have null opponent and game settings', () => {
      const user: UserProfile = {
        id: 'user-123',
        name: 'Alice',
        createdAt: Date.now(),
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      };

      const state = createInitialState(user);
      expect(state.opponent).toBeNull();
      expect(state.gameMode).toBeNull();
      expect(state.boardSize).toBeNull();
    });

    it('should handle user with whitespace-only name as empty', () => {
      const user: UserProfile = {
        id: 'user-123',
        name: '   ',
        createdAt: Date.now(),
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      };

      const state = createInitialState(user);
      // Whitespace-only name is truthy in JavaScript, so goes to board-management
      expect(derivePhase(state).type).toBe('board-management');
    });
  });

  describe('game state structure', () => {
    it('should have all required GameState fields', () => {
      const state = createInitialState(null);

      expect(state).toHaveProperty('phaseOverride');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('opponent');
      expect(state).toHaveProperty('gameMode');
      expect(state).toHaveProperty('boardSize');
      expect(state).toHaveProperty('playerSelectedDeck');
      expect(state).toHaveProperty('opponentSelectedDeck');
      expect(state).toHaveProperty('roundHistory');
      expect(state).toHaveProperty('checksum');
      // These fields are now derived, not stored:
      // phase, currentRound, playerScore, opponentScore, playerSelectedBoard, opponentSelectedBoard
    });

    it('should create clean state with no game in progress', () => {
      const user: UserProfile = {
        id: 'user-123',
        name: 'Alice',
        createdAt: Date.now(),
        stats: { totalGames: 100, wins: 50, losses: 30, ties: 20 },
      };

      const state = createInitialState(user);

      // Even with experienced user, state should be clean
      expect(deriveCurrentRound(state)).toBe(1);
      expect(derivePlayerScore(state.roundHistory)).toBe(0);
      expect(deriveOpponentScore(state.roundHistory)).toBe(0);
      expect(state.roundHistory).toEqual([]);
    });
  });
});
