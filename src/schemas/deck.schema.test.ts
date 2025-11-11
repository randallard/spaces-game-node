/**
 * Tests for deck schema validation
 */

import { describe, it, expect } from 'vitest';
import { DeckSchema, GameModeSchema } from './deck.schema';
import type { Board, Deck } from '@/types';

// Helper to create a valid board for testing
function createValidBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Test Board',
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [
      {
        position: { row: 0, col: 0 },
        type: 'piece',
        order: 1,
      },
    ],
    thumbnail: 'data:image/svg+xml;base64,test',
    createdAt: Date.now(),
    ...overrides,
  };
}

// Helper to create a valid deck with 10 boards
function createValidDeck(overrides: Partial<Deck> = {}): Deck {
  // Generate valid UUIDs for each board
  const uuids = [
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c50',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c51',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c52',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c53',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c54',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c55',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c56',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c57',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c58',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c59',
  ];
  const boards = Array.from({ length: 10 }, (_, i) =>
    createValidBoard({
      id: uuids[i]!,
      name: `Board ${i + 1}`,
    })
  );

  return {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Test Deck',
    boards,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('DeckSchema', () => {
  it('should accept valid deck with 10 boards', () => {
    const deck = createValidDeck();
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it('should accept deck with valid UUID', () => {
    const deck = createValidDeck({
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    });
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it('should reject deck with invalid UUID', () => {
    const deck = createValidDeck({
      id: 'not-a-uuid',
    });
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it('should accept deck with name within length limits', () => {
    const deck = createValidDeck({
      name: 'Valid Deck Name',
    });
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it('should reject deck with empty name', () => {
    const deck = createValidDeck({
      name: '',
    });
    expect(() => DeckSchema.parse(deck)).toThrow(/name is required/i);
  });

  it('should reject deck with name too long', () => {
    const deck = createValidDeck({
      name: 'a'.repeat(51), // Max is 50
    });
    expect(() => DeckSchema.parse(deck)).toThrow(/name too long/i);
  });

  it('should accept deck with exactly 10 boards', () => {
    const deck = createValidDeck();
    expect(deck.boards.length).toBe(10);
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it('should reject deck with fewer than 10 boards', () => {
    const deck = createValidDeck();
    deck.boards = deck.boards.slice(0, 9);
    expect(() => DeckSchema.parse(deck)).toThrow(/exactly 10 boards/i);
  });

  it('should reject deck with more than 10 boards', () => {
    const deck = createValidDeck();
    deck.boards.push(createValidBoard({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c60' }));
    expect(() => DeckSchema.parse(deck)).toThrow(/exactly 10 boards/i);
  });

  it('should accept deck with positive createdAt timestamp', () => {
    const deck = createValidDeck({
      createdAt: Date.now(),
    });
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it('should reject deck with zero createdAt', () => {
    const deck = createValidDeck({
      createdAt: 0,
    });
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it('should reject deck with negative createdAt', () => {
    const deck = createValidDeck({
      createdAt: -1,
    });
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it('should reject deck with null in boards array', () => {
    const deck = createValidDeck();
    // @ts-expect-error Testing invalid data
    deck.boards[0] = null;
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it('should reject deck with undefined in boards array', () => {
    const deck = createValidDeck();
    // @ts-expect-error Testing invalid data
    deck.boards[0] = undefined;
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it('should reject deck with invalid board in array', () => {
    const deck = createValidDeck();
    // @ts-expect-error Testing invalid data
    deck.boards[0] = { invalid: 'board' };
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it('should accept deck with all valid board properties', () => {
    const deck = createValidDeck();
    deck.boards.forEach((board) => {
      expect(board.id).toBeDefined();
      expect(board.name).toBeDefined();
      expect(board.boardSize).toBeDefined();
      expect(board.grid).toBeDefined();
      expect(board.sequence).toBeDefined();
      expect(board.thumbnail).toBeDefined();
      expect(board.createdAt).toBeDefined();
    });
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });
});

describe('GameModeSchema', () => {
  it('should accept "round-by-round"', () => {
    expect(GameModeSchema.parse('round-by-round')).toBe('round-by-round');
  });

  it('should accept "deck"', () => {
    expect(GameModeSchema.parse('deck')).toBe('deck');
  });

  it('should reject invalid game mode', () => {
    expect(() => GameModeSchema.parse('invalid')).toThrow();
  });

  it('should reject empty string', () => {
    expect(() => GameModeSchema.parse('')).toThrow();
  });

  it('should reject null', () => {
    expect(() => GameModeSchema.parse(null)).toThrow();
  });

  it('should reject undefined', () => {
    expect(() => GameModeSchema.parse(undefined)).toThrow();
  });

  it('should reject number', () => {
    expect(() => GameModeSchema.parse(123)).toThrow();
  });

  it('should reject object', () => {
    expect(() => GameModeSchema.parse({})).toThrow();
  });
});
