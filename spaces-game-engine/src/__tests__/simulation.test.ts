/**
 * Tests for game simulation engine
 */

import { describe, it, expect } from 'vitest';
import { simulateRound, simulateMultipleRounds, isBoardPlayable } from '../simulation';
import type { Board } from '../types';

describe('simulateRound', () => {
  it('should simulate a basic round with player winning', () => {
    // Player reaches goal, opponent doesn't
    const playerBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    };

    const opponentBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
      ]
    };

    const result = simulateRound(1, playerBoard, opponentBoard, { silent: true });

    expect(result.round).toBe(1);
    expect(result.winner).toBe('player');
    expect(result.playerPoints).toBeGreaterThan(result.opponentPoints);
    expect(result.simulationDetails.playerHitTrap).toBe(false);
    expect(result.simulationDetails.opponentHitTrap).toBe(false);
  });

  it('should handle trap correctly', () => {
    // Player places trap, opponent hits it
    const playerBoard: Board = {
      boardSize: 2,
      grid: [
        ['trap', 'piece'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 0 }, type: 'trap', order: 4 } // Trap at top-left
      ]
    };

    const opponentBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'piece'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 4 } // Opponent at (1,1) rotates to player's (0,0) - hits trap!
      ]
    };

    const result = simulateRound(1, playerBoard, opponentBoard, { silent: true });

    // Opponent should hit player's trap
    expect(result.simulationDetails.opponentHitTrap).toBe(true);
    expect(result.opponentPoints).toBe(0); // Lost point from trap (had 1 forward move, -1 for trap = 0)
  });

  it('should handle collision correctly', () => {
    // Both players move to same position and collide
    const playerBoard: Board = {
      boardSize: 2,
      grid: [
        ['empty', 'piece'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 } // Player ends at (0,1)
      ]
    };

    const opponentBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 } // Opponent at (1,0) rotates to player's (0,1) - collision!
      ]
    };

    const result = simulateRound(1, playerBoard, opponentBoard, { silent: true });

    expect(result.collision).toBe(true);
    // Both players should lose a point from collision
  });

  it('should award point for reaching goal', () => {
    const playerBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'piece'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    };

    const opponentBoard: Board = {
      boardSize: 2,
      grid: [
        ['empty', 'piece'],
        ['empty', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 2 } // Opponent at (0,1) rotates to (1,0) - no collision
      ]
    };

    const result = simulateRound(1, playerBoard, opponentBoard, { silent: true });

    // Player should get points for forward moves + goal (2 forward moves + 1 goal = 3)
    expect(result.playerPoints).toBeGreaterThanOrEqual(2);
    expect(result.simulationDetails.playerLastStep).toBe(4); // Reached final step
  });

  it('should handle tie correctly', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['empty', 'empty']
      ],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 }
      ]
    };

    const result = simulateRound(1, board, board, { silent: true });

    expect(result.winner).toBe('tie');
    expect(result.playerPoints).toBe(result.opponentPoints);
  });

  it('should award points for forward movement', () => {
    const playerBoard: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 2, col: 0 }, type: 'piece', order: 3 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 4 }, // Forward move (+1)
        { position: { row: 0, col: 0 }, type: 'piece', order: 5 }  // Forward move (+1)
      ]
    };

    const opponentBoard: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'empty'],
        ['piece', 'piece', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 2, col: 0 }, type: 'piece', order: 3 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 4 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 5 }
      ]
    };

    const result = simulateRound(1, playerBoard, opponentBoard, { silent: true });

    // Player should get 2 points for forward movement
    expect(result.playerPoints).toBe(2);
  });
});

describe('simulateMultipleRounds', () => {
  it('should simulate 5 rounds correctly', () => {
    const winningBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    };

    const losingBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
      ]
    };

    const playerBoards: Board[] = Array(5).fill(winningBoard);
    const opponentBoards: Board[] = Array(5).fill(losingBoard);

    const results = simulateMultipleRounds(playerBoards, opponentBoards, { silent: true });

    expect(results).toHaveLength(5);
    expect(results[0]!.round).toBe(1);
    expect(results[4]!.round).toBe(5);

    // All rounds should have player winning
    results.forEach(result => {
      expect(result.winner).toBe('player');
    });
  });

  it('should throw error if board counts mismatch', () => {
    const playerBoards: Board[] = Array(5).fill({
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }]
    });

    const opponentBoards: Board[] = Array(3).fill({
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }]
    });

    expect(() => {
      simulateMultipleRounds(playerBoards, opponentBoards);
    }).toThrow('same number of boards');
  });
});

describe('isBoardPlayable', () => {
  it('should validate a valid board', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should reject board with empty sequence', () => {
    const board: Board = {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: []
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject board with out-of-bounds position', () => {
    const board: Board = {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 5, col: 0 }, type: 'piece', order: 1 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject board with sequence pointing to empty cell', () => {
    const board: Board = {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 0, col: 1 }, type: 'piece', order: 1 } // Points to empty cell
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should accept board with valid final move', () => {
    const board: Board = {
      boardSize: 2,
      grid: [['piece', 'empty'], ['piece', 'empty']],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
        { position: { row: -1, col: 0 }, type: 'final', order: 3 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should reject board with invalid final move row', () => {
    const board: Board = {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'final', order: 2 } // final must be at row -1
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  // Movement Rule Tests - Should FAIL Validation

  it('should reject diagonal piece movement', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['empty', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 } // DIAGONAL!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject jump move (2+ squares)', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 } // JUMP!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject trap placed non-adjacent to piece', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'trap'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 2 }, type: 'trap', order: 2 } // Not adjacent!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject trap placed diagonally from piece', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['trap', 'empty'],
        ['empty', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'trap', order: 2 } // Diagonal!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject piece moving into trap', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'trap'],
        ['empty', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 4 } // Moving into trap!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject supermove without moving next step', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['trap', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove
        { position: { row: -1, col: 1 }, type: 'final', order: 3 } // Goal without moving!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject supermove with another action at same position', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['trap', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 } // Must move away!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  it('should reject piece moving into pre-existing trap', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'trap', 'empty'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 4 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 5 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 6 } // Moving into trap!
      ]
    };

    expect(isBoardPlayable(board)).toBe(false);
  });

  // Movement Rule Tests - Should PASS Validation

  it('should accept valid orthogonal moves (up, down, left, right)', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'piece', 'empty'],
        ['empty', 'piece', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 1 }, type: 'piece', order: 2 }, // Left
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 }, // Up
        { position: { row: 1, col: 0 }, type: 'piece', order: 4 }, // Left
        { position: { row: 0, col: 0 }, type: 'piece', order: 5 }, // Up
        { position: { row: -1, col: 0 }, type: 'final', order: 6 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept trap adjacent to piece', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'trap'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 2 }, // Adjacent
        { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept supermove with immediate movement', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'trap']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove
        { position: { row: 1, col: 0 }, type: 'piece', order: 3 }, // MUST move!
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept multiple traps adjacent to different piece positions', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'piece', 'empty'],
        ['trap', 'piece', 'trap'],
        ['empty', 'piece', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 1 }, type: 'piece', order: 2 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 1, col: 2 }, type: 'trap', order: 4 }, // Adjacent to (1,1)
        { position: { row: 1, col: 0 }, type: 'trap', order: 5 }, // Adjacent to (1,1)
        { position: { row: 0, col: 1 }, type: 'piece', order: 6 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 7 },
        { position: { row: -1, col: 0 }, type: 'final', order: 8 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept trap placement then avoiding it', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'piece', 'trap'],
        ['empty', 'piece', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 2 }, type: 'trap', order: 2 }, // Place trap
        { position: { row: 2, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 4 }, // Avoid trap
        { position: { row: 1, col: 0 }, type: 'piece', order: 5 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 6 },
        { position: { row: -1, col: 0 }, type: 'final', order: 7 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept supermove at start position', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'piece'],
        ['empty', 'trap']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove at start
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept multiple supermoves with proper movement', () => {
    const board: Board = {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'trap', 'empty'],
        ['empty', 'piece', 'trap']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 2, col: 2 }, type: 'trap', order: 2 }, // Supermove #1
        { position: { row: 2, col: 1 }, type: 'piece', order: 3 }, // Move away
        { position: { row: 1, col: 1 }, type: 'piece', order: 4 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 5 }, // Supermove #2
        { position: { row: 1, col: 0 }, type: 'piece', order: 6 }, // Move away
        { position: { row: 0, col: 0 }, type: 'piece', order: 7 },
        { position: { row: -1, col: 0 }, type: 'final', order: 8 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });

  it('should accept minimal valid board', () => {
    const board: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'piece']
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 }
      ]
    };

    expect(isBoardPlayable(board)).toBe(true);
  });
});
