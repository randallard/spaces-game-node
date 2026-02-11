/**
 * Tests for board validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateBoard,
  isValidBoard,
  hasExactlyOnePiece,
  hasTooManyTraps,
  hasValidSequenceCount,
  hasConsecutiveSequence,
} from './board-validation';
import type { Board } from '@/types';

describe('validateBoard', () => {
  const createValidBoard = (): Board => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Valid Board',
    boardSize: 2,
    grid: [
      ['piece', 'trap'],
      ['empty', 'empty'],
    ],
    sequence: [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ],
    thumbnail: '',
    createdAt: Date.now(),
  });

  it('should validate a correct board', () => {
    const board = createValidBoard();
    const result = validateBoard(board);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject grid pieces without corresponding piece moves', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'trap'],
      ['empty', 'empty'],
    ];
    board.sequence = [
      { position: { row: 0, col: 1 }, type: 'trap', order: 1 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    // Grid has 1 piece but sequence has 0 piece moves
    expect(result.errors).toContainEqual({
      field: 'piece',
      message: 'Grid has 1 pieces but sequence only has 0 piece moves',
    });
  });

  it('should reject more pieces in grid than piece moves in sequence', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'piece'],
      ['piece', 'empty'],
    ];
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    // Grid has 3 pieces but sequence only has 2 piece moves
    expect(result.errors).toContainEqual({
      field: 'piece',
      message: 'Grid has 3 pieces but sequence only has 2 piece moves',
    });
  });

  it('should allow 0-(n-1) traps', () => {
    // 0 traps
    const board0 = createValidBoard();
    board0.grid = [
      ['piece', 'piece'],
      ['empty', 'empty'],
    ];
    board0.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
    ];

    expect(validateBoard(board0).valid).toBe(true);

    // 1 trap (max for 2x2 board: 2-1 = 1)
    const board1 = createValidBoard();
    board1.grid = [
      ['piece', 'trap'],
      ['empty', 'empty'],
    ];
    board1.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ];

    expect(validateBoard(board1).valid).toBe(true);

    // 2 traps on 3x3 board (max for 3x3 board: 3-1 = 2)
    const board2 = createValidBoard();
    board2.boardSize = 3;
    board2.grid = [
      ['piece', 'trap', 'empty'],
      ['empty', 'trap', 'empty'],
      ['empty', 'empty', 'empty'],
    ];
    board2.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 3 },
    ];

    expect(validateBoard(board2).valid).toBe(true);
  });

  it('should reject more than (n-1) traps', () => {
    // 2x2 board with 2 traps (exceeds max of 1)
    const board = createValidBoard();
    board.grid = [
      ['piece', 'trap'],
      ['trap', 'empty'],
    ];
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 3 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('maximum 1 traps'))).toBe(true);

    // 3x3 board with 3 traps (exceeds max of 2)
    const board3x3 = createValidBoard();
    board3x3.boardSize = 3;
    board3x3.grid = [
      ['piece', 'trap', 'empty'],
      ['trap', 'trap', 'empty'],
      ['empty', 'empty', 'empty'],
    ];
    board3x3.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 3 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 4 },
    ];

    const result3x3 = validateBoard(board3x3);
    expect(result3x3.valid).toBe(false);
    expect(result3x3.errors.some((e) => e.message.includes('maximum 2 traps'))).toBe(true);
  });

  it('should require minimum 2 sequence items', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ];
    board.sequence = [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'sequence',
      message: 'Board must have at least 2 sequence items (found 1)',
    });
  });

  it('should allow maximum 2(boardSize²) sequence items', () => {
    const board = createValidBoard();
    // For a 2x2 board, max is 2(2²) = 8 sequence items
    // Create board with multiple piece moves (1 piece + 1 trap = 2 items, well under the limit)
    board.grid = [
      ['piece', 'trap'],
      ['empty', 'empty'],
    ];

    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(true);
  });

  it('should reject more than 2(boardSize²) sequence items', () => {
    const board = createValidBoard();
    // For a 2x2 board, max is 2(2²) = 8 sequence items, so 9 should fail
    board.sequence = Array.from({ length: 9 }, (_, i) => ({
      position: { row: 0, col: 0 },
      type: 'piece',
      order: i + 1,
    }));

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'sequence',
      message: 'Board can have maximum 8 sequence items (found 9)',
    });
  });

  it('should require trap count in grid to match trap moves in sequence', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'trap'],
      ['trap', 'empty'],
    ];
    // Grid has 2 traps but sequence only has 1 trap move
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'trap',
      message: 'Grid has 2 traps but sequence has 1 trap moves',
    });
  });

  it('should require consecutive sequence numbers starting from 1', () => {
    const board = createValidBoard();
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 3 }, // Skip 2
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) =>
      e.message.includes('consecutive')
    )).toBe(true);
  });

  it('should reject duplicate sequence numbers', () => {
    const board = createValidBoard();
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 1 }, // Duplicate
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'sequence',
      message: 'Sequence order numbers must be unique (no duplicates)',
    });
  });

  it('should validate sequence positions match grid', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'empty'], // Empty at (0,1)
      ['empty', 'empty'],
    ];
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 }, // Expects piece or trap, but found empty
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) =>
      e.message.includes('expects piece or trap but found empty')
    )).toBe(true);
  });

  it('should reject out of bounds sequence positions', () => {
    const board = createValidBoard();
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 5, col: 5 }, type: 'trap', order: 2 }, // Out of bounds
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) =>
      e.message.includes('invalid')
    )).toBe(true);
  });
});

describe('Quick validation helpers', () => {
  const createValidBoard = (): Board => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Valid Board',
    boardSize: 2,
    grid: [
      ['piece', 'trap'],
      ['empty', 'empty'],
    ],
    sequence: [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ],
    thumbnail: '',
    createdAt: Date.now(),
  });

  describe('isValidBoard', () => {
    it('should return true for valid board', () => {
      expect(isValidBoard(createValidBoard())).toBe(true);
    });

    it('should return false for invalid board', () => {
      const board = createValidBoard();
      board.sequence = []; // Invalid
      expect(isValidBoard(board)).toBe(false);
    });
  });

  describe('hasExactlyOnePiece', () => {
    it('should return true when board has exactly one piece', () => {
      expect(hasExactlyOnePiece(createValidBoard())).toBe(true);
    });

    it('should return false when board has no pieces', () => {
      const board = createValidBoard();
      board.grid[0]![0] = 'empty';
      expect(hasExactlyOnePiece(board)).toBe(false);
    });

    it('should return false when board has multiple pieces', () => {
      const board = createValidBoard();
      board.grid[1]![0] = 'piece';
      expect(hasExactlyOnePiece(board)).toBe(false);
    });
  });

  describe('hasTooManyTraps', () => {
    it('should return false when board has 0-(n-1) traps', () => {
      // 2x2 board with 1 trap (at max of 1)
      expect(hasTooManyTraps(createValidBoard())).toBe(false);

      // 2x2 board with 0 traps
      const board0 = createValidBoard();
      board0.grid = [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ];
      expect(hasTooManyTraps(board0)).toBe(false);

      // 3x3 board with 2 traps (at max of 2)
      const board3x3 = createValidBoard();
      board3x3.boardSize = 3;
      board3x3.grid = [
        ['piece', 'trap', 'empty'],
        ['empty', 'trap', 'empty'],
        ['empty', 'empty', 'empty'],
      ];
      expect(hasTooManyTraps(board3x3)).toBe(false);
    });

    it('should return true when board has more than (n-1) traps', () => {
      // 2x2 board with 2 traps (exceeds max of 1)
      const board = createValidBoard();
      board.grid = [
        ['piece', 'trap'],
        ['trap', 'empty'],
      ];
      expect(hasTooManyTraps(board)).toBe(true);

      // 3x3 board with 3 traps (exceeds max of 2)
      const board3x3 = createValidBoard();
      board3x3.boardSize = 3;
      board3x3.grid = [
        ['piece', 'trap', 'trap'],
        ['trap', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
      ];
      expect(hasTooManyTraps(board3x3)).toBe(true);
    });
  });

  describe('hasValidSequenceCount', () => {
    it('should return true for 2-8 sequence items', () => {
      const board = createValidBoard();
      expect(hasValidSequenceCount(board)).toBe(true);
    });

    it('should return false for less than 2 items', () => {
      const board = createValidBoard();
      board.sequence = [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }];
      expect(hasValidSequenceCount(board)).toBe(false);
    });

    it('should return false for more than 8 items', () => {
      const board = createValidBoard();
      board.sequence = Array.from({ length: 9 }, (_, i) => ({
        position: { row: 0, col: 0 },
        type: 'piece' as const,
        order: i + 1,
      }));
      expect(hasValidSequenceCount(board)).toBe(false);
    });
  });

  describe('hasConsecutiveSequence', () => {
    it('should return true for consecutive sequence', () => {
      expect(hasConsecutiveSequence(createValidBoard())).toBe(true);
    });

    it('should return false for non-consecutive sequence', () => {
      const board = createValidBoard();
      board.sequence[1]!.order = 3; // Skip 2
      expect(hasConsecutiveSequence(board)).toBe(false);
    });

    it('should return false for duplicate sequence numbers', () => {
      const board = createValidBoard();
      board.sequence[1]!.order = 1; // Duplicate
      expect(hasConsecutiveSequence(board)).toBe(false);
    });
  });
});
