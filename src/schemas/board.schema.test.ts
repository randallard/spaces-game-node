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

  it('should accept valid positions in 3x3 grid', () => {
    expect(PositionSchema.parse({ row: 0, col: 0 })).toEqual({
      row: 0,
      col: 0,
    });
    expect(PositionSchema.parse({ row: 2, col: 2 })).toEqual({
      row: 2,
      col: 2,
    });
    expect(PositionSchema.parse({ row: 1, col: 2 })).toEqual({
      row: 1,
      col: 2,
    });
  });

  it('should reject out of bounds positions', () => {
    // row -1 is valid (for final moves off the board)
    // Max valid position is row/col 98 (for 99x99 boards), so test with 99+
    expect(() => PositionSchema.parse({ row: -2, col: 0 })).toThrow();
    expect(() => PositionSchema.parse({ row: 0, col: 99 })).toThrow();
    expect(() => PositionSchema.parse({ row: 99, col: 0 })).toThrow();
  });

  it('should accept row -1 for final moves', () => {
    expect(PositionSchema.parse({ row: -1, col: 0 })).toEqual({
      row: -1,
      col: 0,
    });
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
    boardSize: 2,
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

  const valid3x3Board: Board = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    name: 'Test 3x3 Board',
    boardSize: 3,
    grid: [
      ['empty', 'trap', 'empty'],
      ['empty', 'piece', 'trap'],
      ['trap', 'empty', 'empty'],
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 2 }, type: 'trap', order: 3 },
      { position: { row: 2, col: 0 }, type: 'trap', order: 4 },
    ],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  };

  it('should accept a valid 2x2 board', () => {
    expect(() => BoardSchema.parse(validBoard)).not.toThrow();
  });

  it('should accept a valid 3x3 board', () => {
    expect(() => BoardSchema.parse(valid3x3Board)).not.toThrow();
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

  it('should reject 2x2 board with invalid grid size', () => {
    expect(() =>
      BoardSchema.parse({
        ...validBoard,
        grid: [['empty', 'empty', 'empty']], // 1x3 instead of 2x2
      })
    ).toThrow();
  });

  it('should reject 3x3 board with invalid grid size', () => {
    expect(() =>
      BoardSchema.parse({
        ...valid3x3Board,
        grid: [
          ['empty', 'empty'], // 2x2 instead of 3x3
          ['empty', 'empty'],
        ],
      })
    ).toThrow();
  });

  it('should reject 3x3 board with positions out of bounds', () => {
    expect(() =>
      BoardSchema.parse({
        ...valid3x3Board,
        sequence: [
          { position: { row: 3, col: 1 }, type: 'piece', order: 1 }, // row 3 is out of bounds for 3x3
        ],
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
  it('should return true for 2x2 board with exactly one piece', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
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

  it('should return true for 3x3 board with exactly one piece', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 3,
      grid: [
        ['empty', 'empty', 'empty'],
        ['empty', 'piece', 'empty'],
        ['empty', 'empty', 'empty'],
      ],
      sequence: [{ position: { row: 1, col: 1 }, type: 'piece', order: 1 }],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardHasOnePiece(board)).toBe(true);
  });

  it('should return false for board with no pieces', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
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
      boardSize: 2,
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
  it('should return true for 2x2 board with 0-(n-1) traps', () => {
    const baseBoard: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
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

    // 1 trap (max for 2x2: 2-1 = 1)
    expect(
      validateBoardTrapCount({
        ...baseBoard,
        grid: [
          ['trap', 'empty'],
          ['empty', 'empty'],
        ],
      })
    ).toBe(true);
  });

  it('should return true for 3x3 board with 0-(n-1) traps', () => {
    const base3x3Board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 3,
      grid: [
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };

    // 0 traps
    expect(validateBoardTrapCount(base3x3Board)).toBe(true);

    // 1 trap
    expect(
      validateBoardTrapCount({
        ...base3x3Board,
        grid: [
          ['trap', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
      })
    ).toBe(true);

    // 2 traps (max for 3x3: 3-1 = 2)
    expect(
      validateBoardTrapCount({
        ...base3x3Board,
        grid: [
          ['trap', 'trap', 'empty'],
          ['empty', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
      })
    ).toBe(true);
  });

  it('should return false for board exceeding trap limit', () => {
    // 2x2 board with 2 traps (exceeds max of 1)
    const board2x2: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
      grid: [
        ['trap', 'trap'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardTrapCount(board2x2)).toBe(false);

    // 3x3 board with 3 traps (exceeds max of 2)
    const board3x3: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 3,
      grid: [
        ['trap', 'trap', 'trap'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };
    expect(validateBoardTrapCount(board3x3)).toBe(false);
  });
});
