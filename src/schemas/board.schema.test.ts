/**
 * Tests for board schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  BoardSchema,
  CellContentSchema,
  PositionSchema,
  BoardMoveSchema,
  validateBoardHasOnePiece,
  validateBoardTrapCount,
} from './board.schema';
import type { Board } from '@/types';

describe('CellContentSchema', () => {
  it('should accept valid cell content types', () => {
    expect(CellContentSchema.parse('empty')).toBe('empty');
    expect(CellContentSchema.parse('piece')).toBe('piece');
    expect(CellContentSchema.parse('trap')).toBe('trap');
  });

  it('should reject invalid cell content', () => {
    expect(() => CellContentSchema.parse('invalid')).toThrow();
    expect(() => CellContentSchema.parse('')).toThrow();
    expect(() => CellContentSchema.parse(null)).toThrow();
  });
});

describe('PositionSchema', () => {
  it('should accept valid positions in 2x2 grid', () => {
    expect(PositionSchema.parse({ row: 0, col: 0 })).toEqual({
      row: 0,
      col: 0,
    });
    expect(PositionSchema.parse({ row: 1, col: 1 })).toEqual({
      row: 1,
      col: 1,
    });
  });

  it('should reject out of bounds positions', () => {
    expect(() => PositionSchema.parse({ row: -1, col: 0 })).toThrow();
    expect(() => PositionSchema.parse({ row: 0, col: 2 })).toThrow();
    expect(() => PositionSchema.parse({ row: 2, col: 0 })).toThrow();
  });

  it('should reject non-integer positions', () => {
    expect(() => PositionSchema.parse({ row: 0.5, col: 0 })).toThrow();
    expect(() => PositionSchema.parse({ row: 0, col: 1.5 })).toThrow();
  });
});

describe('BoardMoveSchema', () => {
  it('should accept valid board moves', () => {
    const move = {
      position: { row: 0, col: 0 },
      type: 'piece' as const,
      order: 1,
    };
    expect(BoardMoveSchema.parse(move)).toEqual(move);
  });

  it('should reject invalid move types', () => {
    expect(() =>
      BoardMoveSchema.parse({
        position: { row: 0, col: 0 },
        type: 'invalid',
        order: 1,
      })
    ).toThrow();
  });

  it('should reject non-positive order numbers', () => {
    expect(() =>
      BoardMoveSchema.parse({
        position: { row: 0, col: 0 },
        type: 'piece',
        order: 0,
      })
    ).toThrow();
    expect(() =>
      BoardMoveSchema.parse({
        position: { row: 0, col: 0 },
        type: 'piece',
        order: -1,
      })
    ).toThrow();
  });
});

describe('BoardSchema', () => {
  const validBoard: Board = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Board',
    grid: [
      ['piece', 'empty'],
      ['trap', 'empty'],
    ],
    sequence: [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    ],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  };

  it('should accept a valid board', () => {
    expect(() => BoardSchema.parse(validBoard)).not.toThrow();
  });

  it('should reject board with invalid UUID', () => {
    expect(() =>
      BoardSchema.parse({ ...validBoard, id: 'not-a-uuid' })
    ).toThrow();
  });

  it('should reject board with empty name', () => {
    expect(() => BoardSchema.parse({ ...validBoard, name: '' })).toThrow();
  });

  it('should reject board with name too long', () => {
    expect(() =>
      BoardSchema.parse({ ...validBoard, name: 'a'.repeat(51) })
    ).toThrow();
  });

  it('should reject board with invalid grid size', () => {
    expect(() =>
      BoardSchema.parse({
        ...validBoard,
        grid: [['empty', 'empty', 'empty']], // 1x3 instead of 2x2
      })
    ).toThrow();
  });

  it('should reject board with empty sequence', () => {
    expect(() =>
      BoardSchema.parse({ ...validBoard, sequence: [] })
    ).toThrow();
  });

  it('should reject board with negative timestamp', () => {
    expect(() =>
      BoardSchema.parse({ ...validBoard, createdAt: -1 })
    ).toThrow();
  });
});

describe('validateBoardHasOnePiece', () => {
  it('should return true for board with exactly one piece', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      grid: [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardHasOnePiece(board)).toBe(true);
  });

  it('should return false for board with no pieces', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      grid: [
        ['empty', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardHasOnePiece(board)).toBe(false);
  });

  it('should return false for board with multiple pieces', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      grid: [
        ['piece', 'piece'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardHasOnePiece(board)).toBe(false);
  });
});

describe('validateBoardTrapCount', () => {
  it('should return true for board with 0-3 traps', () => {
    const baseBoard: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      grid: [
        ['empty', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };

    // 0 traps
    expect(validateBoardTrapCount(baseBoard)).toBe(true);

    // 1 trap
    expect(
      validateBoardTrapCount({
        ...baseBoard,
        grid: [
          ['trap', 'empty'],
          ['empty', 'empty'],
        ],
      })
    ).toBe(true);

    // 3 traps
    expect(
      validateBoardTrapCount({
        ...baseBoard,
        grid: [
          ['trap', 'trap'],
          ['trap', 'empty'],
        ],
      })
    ).toBe(true);
  });

  it('should return false for board with more than 3 traps', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      grid: [
        ['trap', 'trap'],
        ['trap', 'trap'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardTrapCount(board)).toBe(false);
  });
});
