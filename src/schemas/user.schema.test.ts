/**
 * Tests for user schema validation
 */

import { describe, it, expect } from 'vitest';
import { UserProfileSchema, OpponentStatsMapSchema } from './user.schema';

describe('UserProfileSchema', () => {
  const validProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John',
    createdAt: Date.now(),
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    },
    greeting: 'Hello!',
    savedBoards: [],
    opponents: [],
  };

  it('should accept a valid user profile', () => {
    expect(() => UserProfileSchema.parse(validProfile)).not.toThrow();
  });

  it('should reject profile with empty name', () => {
    expect(() =>
      UserProfileSchema.parse({ ...validProfile, name: '' })
    ).toThrow();
  });

  it('should reject profile with name too long', () => {
    expect(() =>
      UserProfileSchema.parse({ ...validProfile, name: 'a'.repeat(51) })
    ).toThrow();
  });

  it('should reject profile with greeting too long', () => {
    expect(() =>
      UserProfileSchema.parse({ ...validProfile, greeting: 'a'.repeat(201) })
    ).toThrow();
  });

  it('should accept profile with boards and opponents', () => {
    const profile = {
      id: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Jane',
      createdAt: Date.now(),
      stats: {
        totalGames: 5,
        wins: 3,
        losses: 2,
        ties: 0,
      },
      greeting: 'Hi there!',
      savedBoards: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Board 1',
          grid: [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 0 }, type: 'piece' as const, order: 1 },
          ],
          thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          createdAt: Date.now(),
        },
      ],
      opponents: [
        {
          id: 'cpu-opponent',
          name: 'CPU',
          type: 'cpu' as const,
          wins: 0,
          losses: 0,
        },
      ],
    };
    expect(() => UserProfileSchema.parse(profile)).not.toThrow();
  });
});

describe('OpponentStatsMapSchema', () => {
  it('should accept valid stats map', () => {
    const statsMap = {
      'opponent-1': { wins: 5, losses: 3 },
      'opponent-2': { wins: 2, losses: 8 },
    };
    expect(() => OpponentStatsMapSchema.parse(statsMap)).not.toThrow();
  });

  it('should accept empty stats map', () => {
    expect(() => OpponentStatsMapSchema.parse({})).not.toThrow();
  });

  it('should reject stats with negative values', () => {
    expect(() =>
      OpponentStatsMapSchema.parse({
        'opponent-1': { wins: -1, losses: 0 },
      })
    ).toThrow();
  });

  it('should reject invalid stat structure', () => {
    expect(() =>
      OpponentStatsMapSchema.parse({
        'opponent-1': { wins: 5 }, // missing losses
      })
    ).toThrow();
  });
});
