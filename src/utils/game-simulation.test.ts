/**
 * Tests for game simulation engine
 */

import { describe, it, expect } from 'vitest';
import { simulateRound, simulateAllRounds, isBoardPlayable } from './game-simulation';
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

    // Player: position starts null, moves to (0,0) (sets position) = 0 points
    // Opponent: position starts null, moves to (0,1) rotated (sets position) = 0 points
    // No completion bonus without a final cell, result is tie
    expect(result.winner).toBe('tie');
    expect(result.playerPoints).toBeDefined();
    expect(result.opponentPoints).toBeDefined();
    expect(result.playerPoints!).toBe(0);
    expect(result.opponentPoints!).toBe(0);
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

    // Player: position starts null, moves to (0,0) = just sets position, no forward points
    // Opponent: position starts null, moves to (1,0) rotated = just sets position, no forward points
    // Result is a tie at 0-0
    expect(result.winner).toBe('tie');
    expect(result.playerOutcome).toBe('tie');
    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.opponentFinalPosition).toEqual({ row: 1, col: 0 });
    expect(result.playerPoints).toBe(0);
    expect(result.opponentPoints).toBe(0);
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

    // Player: position starts null, moves to (1,0) (sets position), then to (0,1) (1 forward) = 1 point
    // Opponent: position starts null, moves to (1,1) rotated (sets position) = 0 points
    expect(result.winner).toBe('player'); // Player scored 1, opponent scored 0
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(2);
    expect(result.simulationDetails?.opponentMoves).toBe(1);
    expect(result.playerPoints).toBe(1);
    expect(result.opponentPoints).toBe(0);
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

    // Player: position starts null, moves to (0,0) (sets position) = 0 points
    // Opponent: position starts null, moves to (0,1) (sets position), then to (1,1) (1 forward) = 1 point
    expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
    expect(result.opponentFinalPosition).toEqual({ row: 1, col: 1 });
    expect(result.winner).toBe('opponent');
    expect(result.playerPoints).toBe(0);
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

    // Player: no moves, stays at default position, 0 points
    // Opponent: position starts null, moves to (1,1) rotated (sets position), 0 points
    // Both get 0 points, result is tie
    expect(result.winner).toBe('tie');
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

    // Player: position starts null, moves to (0,0) (sets position), 0 points
    // Opponent: places trap at (0,1) rotated, doesn't set position, 0 points
    // Both get 0 points, result is tie
    expect(result.playerPoints).toBeDefined();
    expect(result.opponentPoints).toBeDefined();
    expect(result.playerPoints!).toBe(0);
    expect(result.opponentPoints!).toBe(0);
    expect(result.winner).toBe('tie');
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

describe('simulateAllRounds', () => {
  it('should simulate 10 rounds and return results array', () => {
    const playerBoards: Board[] = [];
    const opponentBoards: Board[] = [];

    // Create 10 simple boards for each player
    for (let i = 0; i < 10; i++) {
      playerBoards.push(
        createTestBoard(
          `Player Board ${i + 1}`,
          [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 0, type: 'piece' }]
        )
      );

      opponentBoards.push(
        createTestBoard(
          `Opponent Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 1, type: 'piece' }]
        )
      );
    }

    const results = simulateAllRounds(playerBoards, opponentBoards);

    expect(results).toHaveLength(10);
    results.forEach((result, index) => {
      expect(result.round).toBe(index + 1);
      expect(result.winner).toBeOneOf(['player', 'opponent', 'tie']);
      expect(result.playerBoard).toBe(playerBoards[index]);
      expect(result.opponentBoard).toBe(opponentBoards[index]);
    });
  });

  it('should throw error if player deck does not have exactly 10 boards', () => {
    const playerBoards: Board[] = [];
    const opponentBoards: Board[] = [];

    // Only 9 boards for player
    for (let i = 0; i < 9; i++) {
      playerBoards.push(
        createTestBoard(
          `Player Board ${i + 1}`,
          [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 0, type: 'piece' }]
        )
      );
    }

    // 10 boards for opponent
    for (let i = 0; i < 10; i++) {
      opponentBoards.push(
        createTestBoard(
          `Opponent Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 1, type: 'piece' }]
        )
      );
    }

    expect(() => simulateAllRounds(playerBoards, opponentBoards)).toThrow(
      'Both decks must have exactly 10 boards'
    );
  });

  it('should throw error if opponent deck does not have exactly 10 boards', () => {
    const playerBoards: Board[] = [];
    const opponentBoards: Board[] = [];

    // 10 boards for player
    for (let i = 0; i < 10; i++) {
      playerBoards.push(
        createTestBoard(
          `Player Board ${i + 1}`,
          [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 0, type: 'piece' }]
        )
      );
    }

    // Only 11 boards for opponent (too many)
    for (let i = 0; i < 11; i++) {
      opponentBoards.push(
        createTestBoard(
          `Opponent Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 1, type: 'piece' }]
        )
      );
    }

    expect(() => simulateAllRounds(playerBoards, opponentBoards)).toThrow(
      'Both decks must have exactly 10 boards'
    );
  });

  it('should accumulate points across all 10 rounds', () => {
    const playerBoards: Board[] = [];
    const opponentBoards: Board[] = [];

    // Create boards where player always moves forward (scores 1 point each round)
    // Use col 1 for player to avoid collision with opponent
    for (let i = 0; i < 10; i++) {
      playerBoards.push(
        createTestBoard(
          `Player Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'piece'],
          ],
          [
            { row: 1, col: 1, type: 'piece' },
            { row: 0, col: 1, type: 'piece' },
          ]
        )
      );

      opponentBoards.push(
        createTestBoard(
          `Opponent Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 1, type: 'piece' }]
        )
      );
    }

    const results = simulateAllRounds(playerBoards, opponentBoards);

    expect(results).toHaveLength(10);

    // Each round player should score at least 1 point for forward movement
    const totalPlayerPoints = results.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
    expect(totalPlayerPoints).toBeGreaterThanOrEqual(10);
  });

  it('should correctly determine round winners', () => {
    const playerBoards: Board[] = [];
    const opponentBoards: Board[] = [];

    // Create boards where player reaches goal (should win each round)
    // Use col 1 for player to avoid collision with opponent who will be at (1, 0)
    for (let i = 0; i < 10; i++) {
      playerBoards.push(
        createTestBoard(
          `Player Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'piece'],
          ],
          [
            { row: 1, col: 1, type: 'piece' },
            { row: 0, col: 1, type: 'piece' },
            { row: -1, col: 1, type: 'final' },
          ]
        )
      );

      opponentBoards.push(
        createTestBoard(
          `Opponent Board ${i + 1}`,
          [
            ['empty', 'piece'],
            ['empty', 'empty'],
          ],
          [{ row: 0, col: 1, type: 'piece' }]
        )
      );
    }

    const results = simulateAllRounds(playerBoards, opponentBoards);

    expect(results).toHaveLength(10);

    // Player should win all rounds since they reach the goal
    results.forEach((result) => {
      expect(result.winner).toBe('player');
      expect(result.playerPoints).toBeGreaterThan(result.opponentPoints ?? 0);
    });
  });
});
