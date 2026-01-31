import { describe, it, expect } from 'vitest';
import { generateGrid, createBoardFromSequence, getCurrentPosition } from '../grid-generator.js';
import type { BoardMove } from '../../../src/types/board.js';

describe('grid-generator', () => {
  describe('generateGrid', () => {
    it('should generate empty grid for empty sequence', () => {
      const grid = generateGrid([], 3);
      expect(grid).toEqual([
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
      ]);
    });

    it('should place piece at correct position', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
      ];
      const grid = generateGrid(sequence, 3);
      expect(grid[1][1]).toBe('piece');
    });

    it('should place trap at correct position', () => {
      const sequence: BoardMove[] = [
        { position: { row: 0, col: 0 }, type: 'trap', order: 1 },
      ];
      const grid = generateGrid(sequence, 3);
      expect(grid[0][0]).toBe('trap');
    });

    it('should place multiple pieces', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
      ];
      const grid = generateGrid(sequence, 2);
      expect(grid[1][1]).toBe('piece');
      expect(grid[1][0]).toBe('piece');
      expect(grid[0][0]).toBe('piece');
    });

    it('should override piece with trap at same position', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
      ];
      const grid = generateGrid(sequence, 3);
      expect(grid[1][1]).toBe('trap'); // Trap takes precedence
    });

    it('should skip final moves (row -1)', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: -1, col: 1 }, type: 'final', order: 2 },
      ];
      const grid = generateGrid(sequence, 3);
      expect(grid[1][1]).toBe('piece');
      // No error from accessing row -1
    });

    it('should handle complex sequence with pieces and traps', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 2, col: 1 }, type: 'trap', order: 3 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 4 },
      ];
      const grid = generateGrid(sequence, 3);
      expect(grid[1][2]).toBe('piece');
      expect(grid[1][1]).toBe('piece');
      expect(grid[2][1]).toBe('trap');
      expect(grid[0][1]).toBe('piece');
    });

    it('should handle supermove (trap at piece position)', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove
        { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
      ];
      const grid = generateGrid(sequence, 3);
      expect(grid[1][1]).toBe('trap'); // Trap overrides piece waypoint
      expect(grid[1][0]).toBe('piece');
    });

    it('should work with 2x2 board', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
      ];
      const grid = generateGrid(sequence, 2);
      expect(grid.length).toBe(2);
      expect(grid[0].length).toBe(2);
      expect(grid[1][0]).toBe('piece');
    });

    it('should work with 5x5 board', () => {
      const sequence: BoardMove[] = [
        { position: { row: 3, col: 2 }, type: 'piece', order: 1 },
      ];
      const grid = generateGrid(sequence, 5);
      expect(grid.length).toBe(5);
      expect(grid[0].length).toBe(5);
      expect(grid[3][2]).toBe('piece');
    });
  });

  describe('createBoardFromSequence', () => {
    it('should create complete board object', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
      ];
      const board = createBoardFromSequence(sequence, 3);

      expect(board.boardSize).toBe(3);
      expect(board.sequence).toEqual(sequence);
      expect(board.grid).toBeDefined();
      expect(board.grid[1][1]).toBe('piece');
      expect(board.grid[0][1]).toBe('piece');
    });

    it('should handle empty sequence', () => {
      const board = createBoardFromSequence([], 2);
      expect(board.boardSize).toBe(2);
      expect(board.sequence).toEqual([]);
      expect(board.grid).toEqual([
        ['empty', 'empty'],
        ['empty', 'empty'],
      ]);
    });
  });

  describe('getCurrentPosition', () => {
    it('should return null for empty sequence', () => {
      const pos = getCurrentPosition([], 1);
      expect(pos).toBeNull();
    });

    it('should return position of first piece', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
      ];
      const pos = getCurrentPosition(sequence, 1);
      expect(pos).toEqual({ row: 1, col: 2 });
    });

    it('should return position of most recent piece move', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
      ];
      const pos = getCurrentPosition(sequence, 3);
      expect(pos).toEqual({ row: 0, col: 1 });
    });

    it('should ignore trap moves when finding current position', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 2 }, type: 'trap', order: 2 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
      ];
      const pos = getCurrentPosition(sequence, 3);
      expect(pos).toEqual({ row: 1, col: 1 }); // Latest piece, not trap
    });

    it('should return correct position at intermediate step', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
      ];
      const pos = getCurrentPosition(sequence, 2);
      expect(pos).toEqual({ row: 1, col: 1 }); // At step 2
    });

    it('should ignore final moves', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 2 }, type: 'piece', order: 2 },
        { position: { row: -1, col: 2 }, type: 'final', order: 3 },
      ];
      const pos = getCurrentPosition(sequence, 3);
      expect(pos).toEqual({ row: 0, col: 2 }); // Last non-final piece
    });

    it('should handle step number beyond sequence length', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
      ];
      const pos = getCurrentPosition(sequence, 10);
      expect(pos).toEqual({ row: 1, col: 2 }); // Still returns last piece
    });

    it('should handle supermove (trap at piece position)', () => {
      const sequence: BoardMove[] = [
        { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 2 }, type: 'trap', order: 2 }, // Supermove
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
      ];
      const pos = getCurrentPosition(sequence, 2);
      expect(pos).toEqual({ row: 1, col: 2 }); // Still at piece position after trap

      const pos2 = getCurrentPosition(sequence, 3);
      expect(pos2).toEqual({ row: 1, col: 1 }); // Moved after supermove
    });
  });
});
