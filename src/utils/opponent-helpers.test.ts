/**
 * Tests for opponent helper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateOpponentId,
  createCpuOpponent,
  createHumanOpponent,
  createRemoteCpuOpponent,
  createAiAgentOpponent,
  createModelOpponent,
  isCpuOpponent,
  selectRandomBoard,
  updateOpponentStats,
  calculateWinRate,
  formatOpponentStats,
} from './opponent-helpers';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME, CPU_TOUGHER_OPPONENT_ID } from '@/constants/game-rules';
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

  it('should generate unique IDs for remote-cpu opponents', () => {
    const id1 = generateOpponentId('remote-cpu', 'Remote CPU 1');
    const id2 = generateOpponentId('remote-cpu', 'Remote CPU 2');
    expect(id1).not.toBe(id2);
    expect(id1).toContain('remote-cpu-');
    expect(id2).toContain('remote-cpu-');
  });

  it('should generate unique IDs for ai-agent opponents', () => {
    const id1 = generateOpponentId('ai-agent', 'Pip');
    const id2 = generateOpponentId('ai-agent', 'Pip');
    expect(id1).not.toBe(id2);
    expect(id1).toContain('ai-agent-');
    expect(id2).toContain('ai-agent-');
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

describe('createRemoteCpuOpponent', () => {
  it('should create remote CPU opponent with given name', () => {
    const remoteCpu = createRemoteCpuOpponent('Remote CPU 1');
    expect(remoteCpu.name).toBe('Remote CPU 1');
    expect(remoteCpu.type).toBe('remote-cpu');
    expect(remoteCpu.wins).toBe(0);
    expect(remoteCpu.losses).toBe(0);
  });

  it('should generate unique IDs for different remote CPU opponents', () => {
    const remoteCpu1 = createRemoteCpuOpponent('Remote CPU 1');
    const remoteCpu2 = createRemoteCpuOpponent('Remote CPU 2');
    expect(remoteCpu1.id).not.toBe(remoteCpu2.id);
    expect(remoteCpu1.id).toContain('remote-cpu-');
    expect(remoteCpu2.id).toContain('remote-cpu-');
  });
});

describe('createAiAgentOpponent', () => {
  it('should create AI agent opponent with given name and skill level', () => {
    const agent = createAiAgentOpponent('Pip', 'beginner');
    expect(agent.name).toBe('Pip');
    expect(agent.type).toBe('ai-agent');
    expect(agent.skillLevel).toBe('beginner');
    expect(agent.wins).toBe(0);
    expect(agent.losses).toBe(0);
  });

  it('should generate unique IDs for different AI agent opponents', () => {
    const agent1 = createAiAgentOpponent('Pip', 'beginner');
    const agent2 = createAiAgentOpponent('Ember', 'advanced_plus');
    expect(agent1.id).not.toBe(agent2.id);
    expect(agent1.id).toContain('ai-agent-');
    expect(agent2.id).toContain('ai-agent-');
  });

  it('should support all six skill levels', () => {
    const levels = ['beginner', 'beginner_plus', 'intermediate', 'intermediate_plus', 'advanced', 'advanced_plus'] as const;
    for (const level of levels) {
      const agent = createAiAgentOpponent('Test', level);
      expect(agent.skillLevel).toBe(level);
      expect(agent.type).toBe('ai-agent');
    }
  });
});

describe('createModelOpponent', () => {
  it('should create model-backed AI agent opponent', () => {
    const opponent = createModelOpponent('MyModel', 'abc12345', 3);
    expect(opponent.name).toBe('MyModel');
    expect(opponent.type).toBe('ai-agent');
    expect(opponent.modelId).toBe('abc12345');
    expect(opponent.modelBoardSize).toBe(3);
    expect(opponent.wins).toBe(0);
    expect(opponent.losses).toBe(0);
    expect(opponent.skillLevel).toBeUndefined();
  });

  it('should generate unique IDs for different model opponents', () => {
    const opponent1 = createModelOpponent('Model A', 'abc12345', 3);
    const opponent2 = createModelOpponent('Model B', 'def67890', 5);
    expect(opponent1.id).not.toBe(opponent2.id);
    expect(opponent1.id).toContain('ai-agent-');
    expect(opponent2.id).toContain('ai-agent-');
  });

  it('should be recognized as CPU opponent', () => {
    const opponent = createModelOpponent('MyModel', 'abc12345', 3);
    expect(isCpuOpponent(opponent)).toBe(true);
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

  it('should return true for opponent with CPU_TOUGHER_OPPONENT_ID', () => {
    const opponent: Opponent = {
      id: CPU_TOUGHER_OPPONENT_ID,
      name: 'CPU Tougher',
      type: 'human', // Even if type is wrong
      wins: 0,
      losses: 0,
    };
    expect(isCpuOpponent(opponent)).toBe(true);
  });

  it('should return true for remote-cpu opponent type', () => {
    const remoteCpu = createRemoteCpuOpponent('Remote CPU');
    expect(isCpuOpponent(remoteCpu)).toBe(true);
  });

  it('should return true for ai-agent opponent type', () => {
    const aiAgent = createAiAgentOpponent('Pip', 'beginner');
    expect(isCpuOpponent(aiAgent)).toBe(true);
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
      boardSize: 2,
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
      boardSize: 2,
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
      boardSize: 2,
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

  it('should set hasCompletedGame for human opponents', () => {
    const updated = updateOpponentStats(baseOpponent, true);
    expect(updated.hasCompletedGame).toBe(true);
  });

  it('should not set hasCompletedGame for CPU opponents', () => {
    const cpuOpponent: Opponent = {
      id: CPU_OPPONENT_ID,
      name: 'CPU',
      type: 'cpu',
      wins: 0,
      losses: 0,
    };
    const updated = updateOpponentStats(cpuOpponent, true);
    expect(updated.hasCompletedGame).toBeUndefined();
  });

  it('should not set hasCompletedGame for remote-cpu opponents', () => {
    const remoteCpuOpponent = createRemoteCpuOpponent('Remote CPU');
    const updated = updateOpponentStats(remoteCpuOpponent, false);
    expect(updated.hasCompletedGame).toBeUndefined();
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
