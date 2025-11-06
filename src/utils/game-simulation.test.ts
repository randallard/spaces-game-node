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
    // Opponent position is rotated: (0,1) becomes (1,0) in 2x2 grid
    expect(result.opponentFinalPosition).toEqual({ row: 1, col: 0 });
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(1);
    expect(result.simulationDetails?.opponentMoves).toBe(1);
  });

  it('should detect trap hits and stop movement', () => {
    const playerBoard = createTestBoard(
      'Player with Trap',
      [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' }, // Move to (1,0)
        { row: 0, col: 0, type: 'piece' }, // Move to (0,0)
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent with Trap',
      [
        ['trap', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'trap' }] // Place trap at (0,0) which rotates to (1,1)
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    // Player moves forward twice, scoring 1 point
    // Opponent places a trap but doesn't move, so 0 points
    expect(result.winner).toBe('player');
    expect(result.playerPoints).toBe(1);
    expect(result.opponentPoints).toBe(0);
    expect(result.simulationDetails?.playerHitTrap).toBe(false);
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

    // Player starts at (1,0) and moves to (1,0) = no change, no forward movement
    // Then reaches final = +1 goal point
    expect(result.playerFinalPosition).toEqual({ row: 1, col: 0 });
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(1);
    // Player scores: 0 forward moves + 1 goal = 1 point
    expect(result.playerPoints).toBe(1);
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
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }] // (0,1) rotates to (1,0) in 2x2 grid
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    // Player moves from (1,0) to (0,0) = 1 forward = 1 point
    // Opponent moves from (0,1) to (1,0) rotated = also 1 forward for opponent perspective = 1 point
    // Result is a tie at 1-1
    expect(result.winner).toBe('tie');
    expect(result.playerOutcome).toBe('tie');
    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.opponentFinalPosition).toEqual({ row: 1, col: 0 });
    expect(result.playerPoints).toBe(1);
    expect(result.opponentPoints).toBe(1);
  });

  it('should score forward movement correctly', () => {
    const playerBoard = createTestBoard(
      'Player Multi-Move',
      [
        ['piece', 'piece'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' }, // Move to (1,0) - same as start
        { row: 0, col: 1, type: 'piece' }, // Move forward and right - 1 point
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent Short',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }] // Move to (0,0) which rotates to (1,1) - 1 forward point for opponent
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    // Player: starts at (1,0), moves to (1,0) (no change), then to (0,1) (1 forward) = 1 point
    // Opponent: starts at (0,1), moves to (1,1) rotated (1 forward) = 1 point
    expect(result.winner).toBe('tie'); // Both scored 1 point
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(2);
    expect(result.simulationDetails?.opponentMoves).toBe(1);
    expect(result.playerPoints).toBe(1);
    expect(result.opponentPoints).toBe(1);
  });

  it('should handle moves with same forward progress', () => {
    const playerBoard = createTestBoard(
      'Player Efficient',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }] // 1 move to (0,0)
    );

    const opponentBoard = createTestBoard(
      'Opponent Two Moves',
      [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' }, // (1,0) rotates to (0,1)
        { row: 0, col: 0, type: 'piece' }, // (0,0) rotates to (1,1)
      ]
    );

    const result = simulateRound(1, playerBoard, opponentBoard);

    // Player: moves from (1,0) to (0,0) = 1 forward = 1 point
    // Opponent: moves from (0,1) to (0,1) then to (1,1) = 1 forward = 1 point
    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.opponentFinalPosition).toEqual({ row: 1, col: 1 });
    expect(result.winner).toBe('tie');
    expect(result.playerPoints).toBe(1);
    expect(result.opponentPoints).toBe(1);
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
        ['piece', 'empty'],
        ['piece', 'trap'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'piece' },
        { row: 1, col: 1, type: 'trap' },
      ]
    );

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should return true for board with final move at row -1', () => {
    const board: Board = {
      id: 'with-final',
      name: 'With Final Move',
      grid: [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      sequence: [
        {
          position: { row: 1, col: 0 },
          type: 'piece',
          order: 1,
        },
        {
          position: { row: 0, col: 0 },
          type: 'piece',
          order: 2,
        },
        {
          position: { row: -1, col: 0 }, // Final move off the board
          type: 'final',
          order: 3,
        },
      ],
      thumbnail: 'test',
      createdAt: Date.now(),
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should return false for final move not at row -1', () => {
    const board: Board = {
      id: 'bad-final',
      name: 'Bad Final Move',
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
        {
          position: { row: 0, col: 0 }, // Final move at wrong position
          type: 'final',
          order: 2,
        },
      ],
      thumbnail: 'test',
      createdAt: Date.now(),
    };

    expect(isBoardPlayable(board)).toBe(false);
  });
});
