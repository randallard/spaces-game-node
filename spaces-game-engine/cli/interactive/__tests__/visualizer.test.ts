import { describe, it, expect } from 'vitest';
import { renderGrid, renderBoardWithMetadata, renderBoardsSideBySide } from '../visualizer.js';
import type { Board } from '../../../src/types/board.js';

describe('visualizer', () => {
  describe('renderGrid', () => {
    it('should render empty board', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'empty'],
        ],
        sequence: [],
      };

      const output = renderGrid(board);

      expect(output).toContain('┌');
      expect(output).toContain('┐');
      expect(output).toContain('└');
      expect(output).toContain('┘');
      expect(output).toContain('│');
      expect(output).toContain('─');
    });

    it('should render board with single piece', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const output = renderGrid(board);

      expect(output).toContain('1●');
    });

    it('should render board with trap', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['trap', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 0 }, type: 'trap', order: 2 },
        ],
      };

      const output = renderGrid(board);

      expect(output).toContain('1●');
      expect(output).toContain('2X');
    });

    it('should render supermove notation', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['trap', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove
          { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
        ],
      };

      const output = renderGrid(board);

      expect(output).toContain('1●,2X'); // Supermove notation
      expect(output).toContain('3●');
    });

    it('should show current position indicator', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const output = renderGrid(board, { row: 1, col: 1 });

      expect(output).toContain('You are here');
    });

    it('should handle 3x3 board', () => {
      const board: Board = {
        boardSize: 3,
        grid: [
          ['empty', 'piece', 'empty'],
          ['empty', 'piece', 'piece'],
          ['empty', 'trap', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
          { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
          { position: { row: 2, col: 1 }, type: 'trap', order: 3 },
          { position: { row: 0, col: 1 }, type: 'piece', order: 4 },
        ],
      };

      const output = renderGrid(board);

      expect(output).toContain('1●');
      expect(output).toContain('2●');
      expect(output).toContain('3X');
      expect(output).toContain('4●');
    });

    it('should skip final moves in visualization', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['piece', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
          { position: { row: -1, col: 1 }, type: 'final', order: 3 },
        ],
      };

      const output = renderGrid(board);

      expect(output).toContain('1●');
      expect(output).toContain('2●');
      expect(output).not.toContain('3'); // Final move not shown on grid
    });

    it('should handle multiple moves at different positions', () => {
      const board: Board = {
        boardSize: 3,
        grid: [
          ['piece', 'empty', 'empty'],
          ['trap', 'piece', 'piece'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
          { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
          { position: { row: 1, col: 0 }, type: 'trap', order: 3 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        ],
      };

      const output = renderGrid(board);

      // Check all step numbers present
      expect(output).toContain('1●');
      expect(output).toContain('2●');
      expect(output).toContain('3X');
      expect(output).toContain('4●');
    });
  });

  describe('renderBoardWithMetadata', () => {
    it('should render board with name', () => {
      const board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ] as const,
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece' as const, order: 1 },
        ],
        name: 'Test Board',
      };

      const output = renderBoardWithMetadata(board);

      expect(output).toContain('Test Board');
      expect(output).toContain('1●');
    });

    it('should render board with tags', () => {
      const board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ] as const,
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece' as const, order: 1 },
        ],
        tags: ['tag1', 'tag2'],
      };

      const output = renderBoardWithMetadata(board);

      expect(output).toContain('tag1');
      expect(output).toContain('tag2');
    });

    it('should show sequence details when showSequence is true', () => {
      const board: Board = {
        boardSize: 2,
        grid: [
          ['piece', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
        ],
      };

      const output = renderBoardWithMetadata(board, { showSequence: true });

      expect(output).toContain('Sequence:');
      expect(output).toContain('piece');
      expect(output).toContain('(1, 1)');
      expect(output).toContain('(0, 1)');
    });

    it('should hide metadata when showMetadata is false', () => {
      const board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ] as const,
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece' as const, order: 1 },
        ],
        name: 'Test Board',
      };

      const output = renderBoardWithMetadata(board, { showMetadata: false });

      expect(output).not.toContain('Name:');
      expect(output).toContain('1●'); // Grid still shown
    });

    it('should show board size in metadata', () => {
      const board: Board = {
        boardSize: 3,
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const output = renderBoardWithMetadata(board);

      expect(output).toContain('3x3');
    });
  });

  describe('renderBoardsSideBySide', () => {
    it('should render two boards side by side', () => {
      const board1: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const board2: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['piece', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        ],
      };

      const output = renderBoardsSideBySide(board1, board2);

      // Should contain elements from both boards
      expect(output).toContain('1●');
      // Check that boards are on same lines (side by side)
      const lines = output.split('\n');
      expect(lines.some(line => line.includes('┌') && line.split('┌').length > 2)).toBe(true);
    });

    it('should show labels when provided', () => {
      const board1: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['empty', 'piece'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const board2: Board = {
        boardSize: 2,
        grid: [
          ['empty', 'empty'],
          ['piece', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        ],
      };

      const output = renderBoardsSideBySide(board1, board2, ['Player', 'Opponent']);

      expect(output).toContain('Player');
      expect(output).toContain('Opponent');
    });

    it('should handle boards of same size', () => {
      const board1: Board = {
        boardSize: 3,
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const board2: Board = {
        boardSize: 3,
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
        ],
        sequence: [
          { position: { row: 2, col: 1 }, type: 'piece', order: 1 },
        ],
      };

      const output = renderBoardsSideBySide(board1, board2);

      // Should render without errors
      expect(output).toContain('1●');
      expect(output.length).toBeGreaterThan(0);
    });
  });
});
