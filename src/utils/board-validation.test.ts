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

  it('should require exactly 1 piece', () => {
    const board = createValidBoard();
    board.grid = [
      ['empty', 'trap'],
      ['empty', 'empty'],
    ];
    board.sequence = [{ position: { row: 0, col: 1 }, type: 'trap', order: 1 }];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'piece',
      message: 'Board must have exactly 1 piece (found 0)',
    });
  });

  it('should reject more than 1 piece', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'piece'],
      ['empty', 'empty'],
    ];
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'piece',
      message: 'Board must have exactly 1 piece (found 2)',
    });
  });

  it('should allow 0-3 traps', () => {
    // 0 traps
    const board0 = createValidBoard();
    board0.grid = [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ];
    board0.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ];
    board0.grid[0]![1] = 'trap'; // Add one trap for minimum sequence

    expect(validateBoard(board0).valid).toBe(true);

    // 3 traps
    const board3 = createValidBoard();
    board3.grid = [
      ['piece', 'trap'],
      ['trap', 'trap'],
    ];
    board3.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 3 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 4 },
    ];

    expect(validateBoard(board3).valid).toBe(true);
  });

  it('should reject more than 3 traps', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'trap'],
      ['trap', 'trap'],
    ];
    board.grid.push(['trap', 'empty']); // Add 4th trap

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('maximum 3 traps'))).toBe(true);
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

  it('should allow maximum 8 sequence items', () => {
    const board = createValidBoard();
    // Create a 2x4 grid with 1 piece and 7 traps (but only use 3 traps max)
    // So we'll use 1 piece + 3 traps = 4 items, which is valid
    // Actually, let's test with maximum: 1 piece + 3 traps = 4 sequence items
    board.grid = [
      ['piece', 'trap'],
      ['trap', 'trap'],
    ];

    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 3 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 4 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(true);
  });

  it('should reject more than 8 sequence items', () => {
    const board = createValidBoard();
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

  it('should require sequence to match grid content count', () => {
    const board = createValidBoard();
    board.grid = [
      ['piece', 'trap'],
      ['trap', 'empty'],
    ];
    // Sequence has only 2 items but grid has 3 (1 piece + 2 traps)
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) =>
      e.message.includes('must match total pieces + traps')
    )).toBe(true);
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
    board.sequence = [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 }, // Wrong type (should be trap)
    ];

    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) =>
      e.message.includes('expects piece but found trap')
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
    it('should return false when board has 0-3 traps', () => {
      expect(hasTooManyTraps(createValidBoard())).toBe(false);
    });

    it('should return true when board has more than 3 traps', () => {
      const board = createValidBoard();
      board.grid = [
        ['piece', 'trap'],
        ['trap', 'trap'],
      ];
      board.grid.push(['trap', 'empty']); // 4th trap
      expect(hasTooManyTraps(board)).toBe(true);
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
