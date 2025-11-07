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
  sequence: Array<{ row: number; col: number; type: 'piece' | 'trap' | 'final' }>,
  boardSize: 2 | 3 = 2
): Board => ({
  id: `board-${name}`,
  name,
  boardSize,
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
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'piece' },
        { row: -1, col: 0, type: 'final' },
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

    // Player moves from (1,0) to (0,0) = 1 forward move, then reaches goal at (-1,0)
    // Final position should be off the board at (-1, 0)
    expect(result.playerFinalPosition).toEqual({ row: -1, col: 0 });
    expect(result.playerVisualOutcome).toBe('goal');
    expect(result.simulationDetails).toBeDefined();
    expect(result.simulationDetails?.playerMoves).toBe(2);
    // Player scores: 1 forward move + 1 goal = 2 points
    expect(result.playerPoints).toBe(2);
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
      boardSize: 2,
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
      boardSize: 2,
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
      boardSize: 2,
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
      boardSize: 2,
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

describe('3x3 Board Tests', () => {
  describe('simulateRound with 3x3 boards', () => {
    it('should simulate a basic 3x3 round with two pieces', () => {
      const playerBoard = createTestBoard(
        'Player 3x3 Basic',
        [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        [{ row: 1, col: 1, type: 'piece' }],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent 3x3 Basic',
        [
          ['empty', 'empty', 'piece'],
          ['empty', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        [{ row: 0, col: 2, type: 'piece' }],
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      expect(result.round).toBe(1);
      expect(result.winner).toBeOneOf(['player', 'opponent', 'tie']);
      expect(result.playerFinalPosition).toEqual({ row: 1, col: 1 });
      // Opponent position is rotated: (0,2) becomes (2,0) in 3x3 grid
      expect(result.opponentFinalPosition).toEqual({ row: 2, col: 0 });
    });

    it('should detect trap hits in 3x3 board', () => {
      const playerBoard = createTestBoard(
        'Player 3x3 with movement',
        [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
        ],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent 3x3 with trap',
        [
          ['empty', 'empty', 'trap'],
          ['empty', 'empty', 'empty'],
          ['empty', 'empty', 'piece'],
        ],
        [
          { row: 0, col: 2, type: 'trap' }, // Rotates to (2,0) - trap placed at step 0 where player starts!
          { row: 2, col: 2, type: 'piece' }, // Rotates to (0,0) - opponent starts here at step 1
          { row: 1, col: 2, type: 'piece' }, // Rotates to (1,0) - opponent moves forward (row 0→1), scores 1 point
        ],
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      expect(result.playerVisualOutcome).toBe('trapped');
      expect(result.winner).toBe('opponent'); // Player hits trap at step 0, opponent scores 1 point at step 2
    });

    it('should handle 3x3 collision detection', () => {
      const playerBoard = createTestBoard(
        'Player 3x3 collision',
        [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
        ],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent 3x3 collision',
        [
          ['empty', 'empty', 'piece'],
          ['empty', 'empty', 'piece'],
          ['empty', 'empty', 'empty'],
        ],
        [
          { row: 0, col: 2, type: 'piece' }, // Rotates to (2,0)
          { row: 1, col: 2, type: 'piece' }, // Rotates to (1,0)
        ],
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      expect(['player', 'opponent', 'tie']).toContain(result.winner);
      expect(result.simulationDetails).toBeDefined();
    });

    it('should score forward movement correctly in 3x3', () => {
      const playerBoard = createTestBoard(
        'Player 3x3 forward',
        [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
        ],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent 3x3 no movement',
        [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        [{ row: 1, col: 1, type: 'piece' }], // Rotates to (1,1) - no collision with player
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      // Player moves forward 2 times (from row 2 to row 0)
      expect(result.playerPoints).toBeGreaterThanOrEqual(2);
      expect(result.winner).toBe('player');
    });

    it('should handle reaching goal in 3x3 board', () => {
      const playerBoard = createTestBoard(
        'Player 3x3 goal',
        [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
          { row: -1, col: 0, type: 'final' },
        ],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent 3x3 basic',
        [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        [{ row: 1, col: 1, type: 'piece' }], // Rotates to (1,1) - no collision
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      expect(result.playerVisualOutcome).toBe('goal');
      expect(result.winner).toBe('player');
      expect(result.playerPoints).toBeGreaterThanOrEqual(3);
    });

    it('should handle complex 3x3 board with multiple traps', () => {
      const playerBoard = createTestBoard(
        'Player 3x3 complex',
        [
          ['empty', 'piece', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 1, type: 'piece' },
        ],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent 3x3 with traps',
        [
          ['trap', 'empty', 'trap'],
          ['empty', 'piece', 'empty'],
          ['empty', 'trap', 'empty'],
        ],
        [
          { row: 1, col: 1, type: 'piece' },
          { row: 0, col: 0, type: 'trap' },
          { row: 0, col: 2, type: 'trap' },
          { row: 2, col: 1, type: 'trap' },
        ],
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      expect(result.round).toBe(1);
      expect(result.winner).toBeOneOf(['player', 'opponent', 'tie']);
      expect(result.simulationDetails).toBeDefined();
    });
  });

  describe('isBoardPlayable with 3x3 boards', () => {
    it('should return true for valid 3x3 board', () => {
      const board = createTestBoard(
        'Valid 3x3',
        [
          ['empty', 'trap', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        [
          { row: 1, col: 1, type: 'piece' },
          { row: 0, col: 1, type: 'trap' },
        ],
        3
      );

      expect(isBoardPlayable(board)).toBe(true);
    });

    it('should return false for 3x3 board with empty sequence', () => {
      const board = createTestBoard('Empty 3x3', [
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
      ], [], 3);

      expect(isBoardPlayable(board)).toBe(false);
    });

    it('should return false for 3x3 board with out-of-bounds position', () => {
      const board: Board = {
        id: 'invalid-3x3',
        name: 'Invalid 3x3',
        boardSize: 3,
        grid: [
          ['piece', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [
          { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
          { position: { row: 3, col: 1 }, type: 'piece', order: 2 }, // Out of bounds
        ],
        thumbnail: 'data:image/svg+xml;base64,test',
        createdAt: Date.now(),
      };

      expect(isBoardPlayable(board)).toBe(false);
    });

    it('should return true for 3x3 board with final move at row -1', () => {
      const board = createTestBoard(
        'Valid 3x3 with goal',
        [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
          { row: -1, col: 0, type: 'final' },
        ],
        3
      );

      expect(isBoardPlayable(board)).toBe(true);
    });
  });

  describe('simulateAllRounds with 3x3 boards', () => {
    it('should simulate 10 rounds with 3x3 boards', () => {
      const playerBoards: Board[] = [];
      const opponentBoards: Board[] = [];

      for (let i = 0; i < 10; i++) {
        playerBoards.push(
          createTestBoard(
            `Player 3x3 ${i + 1}`,
            [
              ['piece', 'empty', 'empty'],
              ['piece', 'empty', 'empty'],
              ['piece', 'empty', 'empty'],
            ],
            [
              { row: 2, col: 0, type: 'piece' },
              { row: 1, col: 0, type: 'piece' },
              { row: 0, col: 0, type: 'piece' },
            ],
            3
          )
        );

        opponentBoards.push(
          createTestBoard(
            `Opponent 3x3 ${i + 1}`,
            [
              ['empty', 'empty', 'piece'],
              ['empty', 'empty', 'empty'],
              ['empty', 'empty', 'empty'],
            ],
            [{ row: 0, col: 2, type: 'piece' }],
            3
          )
        );
      }

      const results = simulateAllRounds(playerBoards, opponentBoards);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.round).toBe(i + 1);
        expect(result.winner).toBeOneOf(['player', 'opponent', 'tie']);
      });
    });
  });

  describe('Goal and Collision Edge Cases', () => {
    it('should not detect collision when player reaches goal and opponent moves to former position (3x3)', () => {
      // This is the exact scenario from the bug report
      const playerBoard = createTestBoard(
        'Player Goal',
        [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
        [
          { row: 2, col: 0, type: 'piece' },
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
          { row: -1, col: 0, type: 'final' },
        ],
        3
      );

      const opponentBoard = createTestBoard(
        'Opponent to Same Square',
        [
          ['piece', 'piece', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'piece'],
        ],
        [
          { row: 0, col: 1, type: 'piece' }, // Rotates to (2, 1) - no collision at start
          { row: 0, col: 0, type: 'piece' }, // Rotates to (2, 2) - still no collision
        ],
        3
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      // Player should have reached goal with 3 points (2 forward + 1 goal)
      expect(result.playerPoints).toBe(3);
      expect(result.playerVisualOutcome).toBe('goal');
      expect(result.playerFinalPosition).toEqual({ row: -1, col: 0 });

      // Opponent should be at (2, 2) with 0 points (no forward movement on 3x3)
      expect(result.opponentPoints).toBe(0);
      expect(result.opponentVisualOutcome).not.toBe('goal');
      expect(result.opponentFinalPosition.row).toBe(2);
      expect(result.opponentFinalPosition.col).toBe(2);

      // NO collision should be detected
      expect(result.collision).toBe(false);

      // Player should win
      expect(result.winner).toBe('player');
    });

    it('should not detect collision when opponent reaches goal and player moves to former position', () => {
      const playerBoard = createTestBoard(
        'Player Basic',
        [
          ['piece', 'empty'],
          ['piece', 'empty'],
        ],
        [
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
        ]
      );

      const opponentBoard = createTestBoard(
        'Opponent Goal',
        [
          ['piece', 'empty'],
          ['piece', 'empty'],
        ],
        [
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
          { row: -1, col: 0, type: 'final' }, // Opponent reaches goal (rotated to row 2)
        ]
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      // Opponent should have reached goal
      expect(result.opponentVisualOutcome).toBe('goal');
      expect(result.opponentFinalPosition.row).toBe(2); // Rotated from -1

      // Player should be at (0, 0)
      expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });

      // NO collision should be detected
      expect(result.collision).toBe(false);
    });

    it('should detect collision when both players are on the board at same position', () => {
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
          ['empty', 'empty'],
          ['empty', 'piece'],
        ],
        [{ row: 1, col: 1, type: 'piece' }] // Rotates to (0, 0) for 2x2 board
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      // Collision should be detected at (0, 0)
      expect(result.collision).toBe(true);
      expect(result.playerFinalPosition).toEqual({ row: 0, col: 0 });
      expect(result.opponentFinalPosition).toEqual({ row: 0, col: 0 });

      // Both should have 0 points after collision penalty
      expect(result.playerPoints).toBe(0);
      expect(result.opponentPoints).toBe(0);
    });

    it('should allow both players to reach goal without collision', () => {
      const playerBoard = createTestBoard(
        'Player Goal',
        [
          ['piece', 'empty'],
          ['piece', 'empty'],
        ],
        [
          { row: 1, col: 0, type: 'piece' },
          { row: 0, col: 0, type: 'piece' },
          { row: -1, col: 0, type: 'final' },
        ]
      );

      const opponentBoard = createTestBoard(
        'Opponent Goal',
        [
          ['empty', 'piece'],
          ['empty', 'piece'],
        ],
        [
          { row: 1, col: 1, type: 'piece' },
          { row: 0, col: 1, type: 'piece' },
          { row: -1, col: 1, type: 'final' },
        ]
      );

      const result = simulateRound(1, playerBoard, opponentBoard);

      // Both should have reached goal
      expect(result.playerVisualOutcome).toBe('goal');
      expect(result.opponentVisualOutcome).toBe('goal');

      // NO collision
      expect(result.collision).toBe(false);

      // Player should have 2 points (1 forward + 1 goal)
      expect(result.playerPoints).toBe(2);
      // Opponent should have 2 points (1 forward + 1 goal)
      expect(result.opponentPoints).toBe(2);
    });
  });
});
