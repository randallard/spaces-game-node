/**
 * Tests for opponent schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  OpponentSchema,
  OpponentTypeSchema,
  OpponentStatsSchema,
  AiAgentSkillLevelSchema,
} from './opponent.schema';

describe('OpponentTypeSchema', () => {
  it('should accept valid opponent types', () => {
    expect(OpponentTypeSchema.parse('human')).toBe('human');
    expect(OpponentTypeSchema.parse('cpu')).toBe('cpu');
    expect(OpponentTypeSchema.parse('ai-agent')).toBe('ai-agent');
  });

  it('should reject invalid opponent types', () => {
    expect(() => OpponentTypeSchema.parse('robot')).toThrow();
    expect(() => OpponentTypeSchema.parse('')).toThrow();
  });
});

describe('OpponentSchema', () => {
  const validOpponent = {
    id: 'human-alice',
    name: 'Alice',
    type: 'human' as const,
    wins: 5,
    losses: 3,
  };

  it('should accept a valid opponent', () => {
    expect(() => OpponentSchema.parse(validOpponent)).not.toThrow();
  });

  it('should reject opponent with empty id', () => {
    expect(() =>
      OpponentSchema.parse({ ...validOpponent, id: '' })
    ).toThrow();
  });

  it('should reject opponent with empty name', () => {
    expect(() =>
      OpponentSchema.parse({ ...validOpponent, name: '' })
    ).toThrow();
  });

  it('should reject opponent with name too long', () => {
    expect(() =>
      OpponentSchema.parse({ ...validOpponent, name: 'a'.repeat(51) })
    ).toThrow();
  });

  it('should reject opponent with invalid type', () => {
    expect(() =>
      OpponentSchema.parse({ ...validOpponent, type: 'invalid' })
    ).toThrow();
  });

  it('should reject opponent with negative wins', () => {
    expect(() =>
      OpponentSchema.parse({ ...validOpponent, wins: -1 })
    ).toThrow();
  });

  it('should reject opponent with negative losses', () => {
    expect(() =>
      OpponentSchema.parse({ ...validOpponent, losses: -1 })
    ).toThrow();
  });

  it('should accept CPU opponent', () => {
    const cpuOpponent = {
      id: 'cpu-opponent',
      name: 'CPU',
      type: 'cpu' as const,
      wins: 0,
      losses: 0,
    };
    expect(() => OpponentSchema.parse(cpuOpponent)).not.toThrow();
  });

  it('should accept AI agent opponent with skill level', () => {
    const aiOpponent = {
      id: 'ai-agent-123',
      name: 'Pip',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      skillLevel: 'beginner' as const,
    };
    expect(() => OpponentSchema.parse(aiOpponent)).not.toThrow();
  });

  it('should accept AI agent opponent without skill level', () => {
    const aiOpponent = {
      id: 'ai-agent-123',
      name: 'Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
    };
    expect(() => OpponentSchema.parse(aiOpponent)).not.toThrow();
  });

  it('should reject AI agent opponent with invalid skill level', () => {
    const aiOpponent = {
      id: 'ai-agent-123',
      name: 'Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      skillLevel: 'super_hard',
    };
    expect(() => OpponentSchema.parse(aiOpponent)).toThrow();
  });

  it('should accept AI agent opponent with modelId and modelBoardSize', () => {
    const modelOpponent = {
      id: 'ai-agent-123',
      name: 'Model Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      modelId: 'abc12345',
      modelBoardSize: 3,
    };
    expect(() => OpponentSchema.parse(modelOpponent)).not.toThrow();
  });

  it('should reject modelId shorter than 6 chars', () => {
    const modelOpponent = {
      id: 'ai-agent-123',
      name: 'Model Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      modelId: 'abc',
    };
    expect(() => OpponentSchema.parse(modelOpponent)).toThrow();
  });

  it('should reject modelId longer than 16 chars', () => {
    const modelOpponent = {
      id: 'ai-agent-123',
      name: 'Model Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      modelId: 'a'.repeat(17),
    };
    expect(() => OpponentSchema.parse(modelOpponent)).toThrow();
  });

  it('should reject modelBoardSize below 2', () => {
    const modelOpponent = {
      id: 'ai-agent-123',
      name: 'Model Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      modelId: 'abc12345',
      modelBoardSize: 1,
    };
    expect(() => OpponentSchema.parse(modelOpponent)).toThrow();
  });

  it('should reject modelBoardSize above 99', () => {
    const modelOpponent = {
      id: 'ai-agent-123',
      name: 'Model Agent',
      type: 'ai-agent' as const,
      wins: 0,
      losses: 0,
      modelId: 'abc12345',
      modelBoardSize: 100,
    };
    expect(() => OpponentSchema.parse(modelOpponent)).toThrow();
  });
});

describe('AiAgentSkillLevelSchema', () => {
  it('should accept all valid skill levels', () => {
    const levels = ['beginner', 'beginner_plus', 'intermediate', 'intermediate_plus', 'advanced', 'advanced_plus', 'test_fail'];
    for (const level of levels) {
      expect(AiAgentSkillLevelSchema.parse(level)).toBe(level);
    }
  });

  it('should reject invalid skill levels', () => {
    expect(() => AiAgentSkillLevelSchema.parse('expert')).toThrow();
    expect(() => AiAgentSkillLevelSchema.parse('')).toThrow();
    expect(() => AiAgentSkillLevelSchema.parse('BEGINNER')).toThrow();
  });
});

describe('OpponentStatsSchema', () => {
  it('should accept valid stats', () => {
    expect(() =>
      OpponentStatsSchema.parse({ wins: 10, losses: 5 })
    ).not.toThrow();
  });

  it('should accept zero stats', () => {
    expect(() =>
      OpponentStatsSchema.parse({ wins: 0, losses: 0 })
    ).not.toThrow();
  });

  it('should reject negative wins', () => {
    expect(() =>
      OpponentStatsSchema.parse({ wins: -1, losses: 0 })
    ).toThrow();
  });

  it('should reject negative losses', () => {
    expect(() =>
      OpponentStatsSchema.parse({ wins: 0, losses: -1 })
    ).toThrow();
  });

  it('should reject non-integer values', () => {
    expect(() =>
      OpponentStatsSchema.parse({ wins: 1.5, losses: 0 })
    ).toThrow();
  });
});
