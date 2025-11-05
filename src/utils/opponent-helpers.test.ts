/**
 * Tests for opponent helper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateOpponentId,
  createCpuOpponent,
  createHumanOpponent,
  isCpuOpponent,
  selectRandomBoard,
  updateOpponentStats,
  calculateWinRate,
  formatOpponentStats,
} from './opponent-helpers';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME } from '@/constants/game-rules';
import type { Board, Opponent } from '@/types';

describe('generateOpponentId', () => {
  it('should return CPU_OPPONENT_ID for cpu type', () => {
    const id = generateOpponentId('cpu', 'CPU');
    expect(id).toBe(CPU_OPPONENT_ID);
  });

  it('should generate unique IDs for human opponents', () => {
    const id1 = generateOpponentId('human', 'Alice');
    const id2 = generateOpponentId('human', 'Alice');
    expect(id1).not.toBe(id2);
    expect(id1).toContain('human-');
    expect(id2).toContain('human-');
  });
});

describe('createCpuOpponent', () => {
  it('should create CPU opponent with correct properties', () => {
    const cpu = createCpuOpponent();
    expect(cpu).toEqual({
      id: CPU_OPPONENT_ID,
      name: CPU_OPPONENT_NAME,
      type: 'cpu',
      wins: 0,
      losses: 0,
    });
  });

  it('should create new instance each time', () => {
    const cpu1 = createCpuOpponent();
    const cpu2 = createCpuOpponent();
    expect(cpu1).not.toBe(cpu2);
    expect(cpu1).toEqual(cpu2);
  });
});

describe('createHumanOpponent', () => {
  it('should create human opponent with given name', () => {
    const human = createHumanOpponent('Alice');
    expect(human.name).toBe('Alice');
    expect(human.type).toBe('human');
    expect(human.wins).toBe(0);
    expect(human.losses).toBe(0);
  });

  it('should generate unique IDs for different human opponents', () => {
    const human1 = createHumanOpponent('Alice');
    const human2 = createHumanOpponent('Bob');
    expect(human1.id).not.toBe(human2.id);
  });
});

describe('isCpuOpponent', () => {
  it('should return true for CPU opponent', () => {
    const cpu = createCpuOpponent();
    expect(isCpuOpponent(cpu)).toBe(true);
  });

  it('should return true for opponent with CPU ID', () => {
    const opponent: Opponent = {
      id: CPU_OPPONENT_ID,
      name: 'CPU',
      type: 'human', // Even if type is wrong
      wins: 0,
      losses: 0,
    };
    expect(isCpuOpponent(opponent)).toBe(true);
  });

  it('should return false for human opponent', () => {
    const human = createHumanOpponent('Alice');
    expect(isCpuOpponent(human)).toBe(false);
  });
});

describe('selectRandomBoard', () => {
  const mockBoards: Board[] = [
    {
      id: '1',
      name: 'Board 1',
      grid: [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '2',
      name: 'Board 2',
      grid: [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '3',
      name: 'Board 3',
      grid: [
        ['empty', 'empty'],
        ['piece', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null for empty board array', () => {
    const result = selectRandomBoard([]);
    expect(result).toBeNull();
  });

  it('should return the only board when array has one board', () => {
    const result = selectRandomBoard([mockBoards[0]!]);
    expect(result).toEqual(mockBoards[0]);
  });

  it('should return a board from the array', () => {
    const result = selectRandomBoard(mockBoards);
    expect(result).toBeTruthy();
    expect(mockBoards).toContainEqual(result);
  });

  it('should select first board when random is 0', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const result = selectRandomBoard(mockBoards);
    expect(result).toEqual(mockBoards[0]);
  });

  it('should select last board when random is close to 1', () => {
    vi.mocked(Math.random).mockReturnValue(0.99);
    const result = selectRandomBoard(mockBoards);
    expect(result).toEqual(mockBoards[2]);
  });
});

describe('updateOpponentStats', () => {
  const baseOpponent: Opponent = {
    id: 'test-id',
    name: 'Test',
    type: 'human',
    wins: 5,
    losses: 3,
  };

  it('should increment wins when opponent won', () => {
    const updated = updateOpponentStats(baseOpponent, true);
    expect(updated.wins).toBe(6);
    expect(updated.losses).toBe(3);
  });

  it('should increment losses when opponent lost', () => {
    const updated = updateOpponentStats(baseOpponent, false);
    expect(updated.wins).toBe(5);
    expect(updated.losses).toBe(4);
  });

  it('should not mutate original opponent', () => {
    const original = { ...baseOpponent };
    updateOpponentStats(baseOpponent, true);
    expect(baseOpponent).toEqual(original);
  });
});

describe('calculateWinRate', () => {
  it('should return 0 for opponent with no games', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 0,
      losses: 0,
    };
    expect(calculateWinRate(opponent)).toBe(0);
  });

  it('should return 100 for opponent with only wins', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 5,
      losses: 0,
    };
    expect(calculateWinRate(opponent)).toBe(100);
  });

  it('should return 0 for opponent with only losses', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 0,
      losses: 5,
    };
    expect(calculateWinRate(opponent)).toBe(0);
  });

  it('should calculate correct win rate', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 7,
      losses: 3,
    };
    expect(calculateWinRate(opponent)).toBe(70);
  });

  it('should handle decimal win rates', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 2,
      losses: 3,
    };
    expect(calculateWinRate(opponent)).toBeCloseTo(40, 1);
  });
});

describe('formatOpponentStats', () => {
  it('should return "No games played" for new opponent', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 0,
      losses: 0,
    };
    expect(formatOpponentStats(opponent)).toBe('No games played');
  });

  it('should format stats with wins, losses, and percentage', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 7,
      losses: 3,
    };
    expect(formatOpponentStats(opponent)).toBe('7W - 3L (70.0%)');
  });

  it('should format stats with decimal percentage', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 2,
      losses: 3,
    };
    expect(formatOpponentStats(opponent)).toBe('2W - 3L (40.0%)');
  });

  it('should handle 100% win rate', () => {
    const opponent: Opponent = {
      id: 'test',
      name: 'Test',
      type: 'human',
      wins: 5,
      losses: 0,
    };
    expect(formatOpponentStats(opponent)).toBe('5W - 0L (100.0%)');
  });
});
