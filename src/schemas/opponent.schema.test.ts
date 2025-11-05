/**
 * Tests for opponent schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  OpponentSchema,
  OpponentTypeSchema,
  OpponentStatsSchema,
} from './opponent.schema';

describe('OpponentTypeSchema', () => {
  it('should accept valid opponent types', () => {
    expect(OpponentTypeSchema.parse('human')).toBe('human');
    expect(OpponentTypeSchema.parse('cpu')).toBe('cpu');
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
