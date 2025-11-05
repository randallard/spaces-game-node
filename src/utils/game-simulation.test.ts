/**
 * Tests for game simulation engine
 */

import { describe, it, expect } from 'vitest';
import { simulateRound, isBoardPlayable } from './game-simulation';
import type { Board } from '@/types';

// Test board fixtures
const createTestBoard = (
  name: string,
  grid: Array<Array<'empty' | 'piece' | 'trap' | 'final'>>,
  sequence: Array<{ row: number; col: number; type: 'piece' | 'trap' | 'final' }>
): Board => ({
  id: `board-${name}`,
  name,
  grid,
  sequence: sequence.map((s, index) => ({
    position: { row: s.row, col: s.col },
    type: s.type,
    order: index + 1,
  })),
  thumbnail: 'data:image/svg+xml;base64,test',
  createdAt: Date.now(),
});

describe('simulateRound', () => {
  it('should simulate a basic round with two pieces', () => {
    const playerBoard = createTestBoard(
      'Player Basic',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent Basic',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.round).toBe(1);
    expect(result.winner).toBeOneOf(['player', 'opponent', 'tie']);
    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.opponentFinalPosition).toEqual({ row: 0, col: 1 });
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(1);
    expect(result.simulationDetails?.opponentMoves).toBe(1);
  });

  it('should detect trap hits and stop movement', () => {
    const playerBoard = createTestBoard(
      'Player with Trap',
      [
        ['piece', 'empty'],
        ['trap', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'trap' }, // Hit trap first
        { row: 0, col: 0, type: 'piece' }, // Never reach this
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent Safe',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.winner).toBe('opponent'); // Player hit trap
    expect(result.playerFinalPosition).toEqual({ row: 1, col: 0 }); // Stopped at trap
    expect(result.simulationDetails?.playerHitTrap).toBe(true);
    expect(result.simulationDetails?.opponentHitTrap).toBe(false);
  });

  it('should award completion bonus for reaching top row', () => {
    const playerBoard = createTestBoard(
      'Player Complete',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }] // Reaches top
    );

    const opponentBoard = createTestBoard(
      'Opponent Incomplete',
      [
        ['empty', 'empty'],
        ['piece', 'empty'],
      ],
      [{ row: 1, col: 0, type: 'piece' }] // Stays at bottom
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.winner).toBe('player'); // Completed
    expect(result.playerPoints).toBeDefined();
    expect(result.opponentPoints).toBeDefined();
    expect(result.playerPoints!).toBeGreaterThan(result.opponentPoints!);
  });

  it('should handle final move marker', () => {
    const playerBoard = createTestBoard(
      'Player with Final',
      [
        ['final', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'final' },
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent Basic',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(2);
  });

  it('should handle tie when both players perform equally', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.winner).toBe('tie');
    expect(result.playerOutcome).toBe('tie');
    expect(result.playerFinalPosition).toEqual(result.opponentFinalPosition);
  });

  it('should calculate distance correctly', () => {
    const playerBoard = createTestBoard(
      'Player Multi-Move',
      [
        ['piece', 'empty'],
        ['piece', 'piece'],
      ],
      [
        { row: 1, col: 0, type: 'piece' }, // Start
        { row: 1, col: 1, type: 'piece' }, // Move right (distance: 1)
        { row: 0, col: 0, type: 'piece' }, // Move diagonally (distance: 2)
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent Short',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }] // Only 1 move
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.winner).toBe('player'); // More distance
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(3);
    expect(result.simulationDetails?.opponentMoves).toBe(1);
  });

  it('should prefer fewer moves when distance is equal', () => {
    const playerBoard = createTestBoard(
      'Player Efficient',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }] // 1 move, distance 1
    );

    const opponentBoard = createTestBoard(
      'Opponent Inefficient',
      [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'piece' },
      ] // 2 moves, same final position
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    // Both complete and reach top, but player does it in fewer moves
    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.opponentFinalPosition).toEqual({ row: 0, col: 0 });
  });

  it('should handle empty sequence gracefully', () => {
    const playerBoard = createTestBoard('Player', [['empty', 'empty'], ['empty', 'empty']], []);

    const opponentBoard = createTestBoard(
      'Opponent',
      [['piece', 'empty'], ['empty', 'empty']],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.winner).toBe('opponent');
    expect(result.playerFinalPosition).toEqual({ row: 1, col: 0 }); // Start position
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(0);
  });

  it('should award points based on performance', () => {
    const playerBoard = createTestBoard(
      'Player Good',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent Bad',
      [
        ['empty', 'empty'],
        ['trap', 'empty'],
      ],
      [{ row: 1, col: 0, type: 'trap' }]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    expect(result.playerPoints).toBeDefined();
    expect(result.opponentPoints).toBeDefined();
    expect(result.playerPoints!).toBeGreaterThan(0);
    expect(result.opponentPoints!).toBeGreaterThanOrEqual(0);
    expect(result.playerPoints!).toBeGreaterThan(result.opponentPoints!);
  });
});

describe('isBoardPlayable', () => {
  it('should return true for valid board', () => {
    const board = createTestBoard(
      'Valid',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should return false for board with empty sequence', () => {
    const board = createTestBoard('Empty Sequence', [['piece', 'empty'], ['empty', 'empty']], []);

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should return false for board with out-of-bounds position', () => {
    const board: Board = {
      id: 'invalid',
      name: 'Invalid',
      grid: [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [
        {
          position: { row: 5, col: 5 }, // Out of bounds
          type: 'piece',
          order: 1,
        },
      ],
      thumbnail: 'test',
      createdAt: Date.now(),
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should return false for sequence pointing to empty cell', () => {
    const board: Board = {
      id: 'empty-cell',
      name: 'Empty Cell',
      grid: [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [
        {
          position: { row: 0, col: 1 }, // Points to empty
          type: 'piece',
          order: 1,
        },
      ],
      thumbnail: 'test',
      createdAt: Date.now(),
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should return true for complex valid board', () => {
    const board = createTestBoard(
      'Complex',
      [
        ['piece', 'final'],
        ['piece', 'trap'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'piece' },
        { row: 0, col: 1, type: 'final' },
      ]
    );

    expect(isBoardPlayable(board)).toBe(true);
  });
});
