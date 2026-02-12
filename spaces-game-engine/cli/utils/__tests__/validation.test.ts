import { describe, it, expect } from 'vitest';
import {
  validateBoard,
  validateBoardOrThrow,
  isAdjacentOrthogonal,
  isPositionInBounds,
  validateInteractiveMove,
} from '../validation.js';
import type { Board } from '../../../src/types/board.js';

describe('validation', () => {
  describe('validateBoard', () => {
    it('should validate a simple valid board', () => {
      const board: Board = {
        boardSize: 3,
        grid: [
          ['piece', 'empty', 'empty'],
          ['piece', 'piece', 'empty'],
          ['empty', 'piece', 'piece'],
        ],
        sequence: [
          { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
          { position: { row: 2, col: 1 }, type: 'piece', order: 2 },
          { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
          { position: { row: 1, col: 0 }, type: 'piece', order: 4 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 5 },
          { position: { row: -1, col: 0 }, type: 'final', order: 6 },
        ],
      };
      const result = validateBoard(board);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid board with diagonal move', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['piece', 'empty'],
          ['trap', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Diagonal!
          { position: { row: -1, col: 0 }, type: 'final', order: 3 },
        ],
      };
      const result = validateBoard(board);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept board with orthogonal moves only', () => {
      const board: Board = {
        boardSize: 3,
        grid: [
          ['empty', 'piece', 'empty'],
          ['empty', 'piece', 'piece'],
          ['empty', 'trap', 'piece'],
        ],
        sequence: [
          { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
          { position: { row: 1, col: 2 }, type: 'piece', order: 2 },
          { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
          { position: { row: 2, col: 1 }, type: 'trap', order: 4 },
          { position: { row: 0, col: 1 }, type: 'piece', order: 5 },
          { position: { row: -1, col: 1 }, type: 'final', order: 6 },
        ],
      };
      const result = validateBoard(board);
      expect(result.valid).toBe(true);
    });

    it('should reject board with piece moving into trap', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['trap', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
          { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Moving into trap!
        ],
      };
      const result = validateBoard(board);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBoardOrThrow', () => {
    it('should not throw for valid board', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['piece', 'trap'],
          ['piece', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
          { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
          { position: { row: -1, col: 0 }, type: 'final', order: 5 },
        ],
      };
      expect(() => validateBoardOrThrow(board)).not.toThrow();
    });

    it('should throw for invalid board', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['piece', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Diagonal
        ],
      };
      expect(() => validateBoardOrThrow(board)).toThrow();
    });
  });

  describe('isAdjacentOrthogonal', () => {
    it('should return true for move up', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 0, col: 1 })).toBe(true);
    });

    it('should return true for move down', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 2, col: 1 })).toBe(true);
    });

    it('should return true for move left', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 1, col: 0 })).toBe(true);
    });

    it('should return true for move right', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 1, col: 2 })).toBe(true);
    });

    it('should return false for diagonal move', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 0, col: 0 })).toBe(false);
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 0, col: 2 })).toBe(false);
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 2, col: 0 })).toBe(false);
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 2, col: 2 })).toBe(false);
    });

    it('should return false for jump move (>1 square)', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 3, col: 1 })).toBe(false);
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 1, col: 3 })).toBe(false);
    });

    it('should return false for same position', () => {
      expect(isAdjacentOrthogonal({ row: 1, col: 1 }, { row: 1, col: 1 })).toBe(false);
    });
  });

  describe('isPositionInBounds', () => {
    it('should return true for position within bounds', () => {
      expect(isPositionInBounds({ row: 0, col: 0 }, 3)).toBe(true);
      expect(isPositionInBounds({ row: 1, col: 1 }, 3)).toBe(true);
      expect(isPositionInBounds({ row: 2, col: 2 }, 3)).toBe(true);
    });

    it('should return true for row -1 (goal position)', () => {
      expect(isPositionInBounds({ row: -1, col: 0 }, 3)).toBe(true);
      expect(isPositionInBounds({ row: -1, col: 2 }, 3)).toBe(true);
    });

    it('should return false for row < -1', () => {
      expect(isPositionInBounds({ row: -2, col: 0 }, 3)).toBe(false);
    });

    it('should return false for row >= boardSize', () => {
      expect(isPositionInBounds({ row: 3, col: 0 }, 3)).toBe(false);
      expect(isPositionInBounds({ row: 5, col: 0 }, 3)).toBe(false);
    });

    it('should return false for col < 0', () => {
      expect(isPositionInBounds({ row: 0, col: -1 }, 3)).toBe(false);
    });

    it('should return false for col >= boardSize', () => {
      expect(isPositionInBounds({ row: 0, col: 3 }, 3)).toBe(false);
      expect(isPositionInBounds({ row: 0, col: 5 }, 3)).toBe(false);
    });

    it('should work with different board sizes', () => {
      expect(isPositionInBounds({ row: 1, col: 1 }, 2)).toBe(true);
      expect(isPositionInBounds({ row: 2, col: 2 }, 2)).toBe(false);
      expect(isPositionInBounds({ row: 4, col: 4 }, 5)).toBe(true);
      expect(isPositionInBounds({ row: 5, col: 5 }, 5)).toBe(false);
    });
  });

  describe('validateInteractiveMove', () => {
    it('should validate piece move to adjacent orthogonal position', () => {
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        'piece',
        3,
        new Set()
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject piece move out of bounds', () => {
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 5, col: 5 },
        'piece',
        3,
        new Set()
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Position is out of bounds');
    });

    it('should reject diagonal piece move', () => {
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 0, col: 0 },
        'piece',
        3,
        new Set()
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('orthogonally'))).toBe(true);
    });

    it('should reject piece moving into trap', () => {
      const traps = new Set(['0,1']);
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 0, col: 1 },
        'piece',
        3,
        traps
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('trap'))).toBe(true);
    });

    it('should validate trap placement adjacent to piece', () => {
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        'trap',
        3,
        new Set()
      );
      expect(result.valid).toBe(true);
    });

    it('should validate supermove (trap at current position)', () => {
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 1, col: 1 },
        'trap',
        3,
        new Set()
      );
      // Valid but with warning
      expect(result.valid).toBe(true);
      expect(result.errors.some(e => e.includes('SUPERMOVE'))).toBe(true);
    });

    it('should reject trap not adjacent to piece', () => {
      const result = validateInteractiveMove(
        { row: 1, col: 1 },
        { row: 0, col: 0 },
        'trap',
        3,
        new Set()
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('adjacent'))).toBe(true);
    });

    it('should handle null current position for first move', () => {
      const result = validateInteractiveMove(
        null,
        { row: 1, col: 1 },
        'piece',
        3,
        new Set()
      );
      expect(result.valid).toBe(true);
    });

    it('should reject out of bounds even with null current position', () => {
      const result = validateInteractiveMove(
        null,
        { row: 5, col: 5 },
        'piece',
        3,
        new Set()
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Position is out of bounds');
    });
  });
});
