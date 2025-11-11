/**
 * Tests for default CPU opponent data
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultCpuOpponent,
  createDefault2x2Boards,
  createDefault3x3Boards,
  createDefault2x2Deck,
  createDefault3x3Deck,
  initializeDefaultCpuData,
  createCpuTougherOpponent,
  createCpuTougher2x2Boards,
  createCpuTougher3x3Boards,
  initializeCpuTougherData,
} from './default-cpu-data';
import {
  CPU_OPPONENT_ID,
  CPU_OPPONENT_NAME,
  CPU_TOUGHER_OPPONENT_ID,
  CPU_TOUGHER_OPPONENT_NAME,
} from '@/constants/game-rules';

describe('createDefaultCpuOpponent', () => {
  it('should create CPU opponent with correct ID and name', () => {
    const opponent = createDefaultCpuOpponent();

    expect(opponent.id).toBe(CPU_OPPONENT_ID);
    expect(opponent.name).toBe(CPU_OPPONENT_NAME);
    expect(opponent.type).toBe('cpu');
    expect(opponent.wins).toBe(0);
    expect(opponent.losses).toBe(0);
  });
});

describe('createDefault2x2Boards', () => {
  it('should create 4 boards', () => {
    const boards = createDefault2x2Boards();
    expect(boards).toHaveLength(4);
  });

  it('should create boards with correct size', () => {
    const boards = createDefault2x2Boards();
    boards.forEach((board) => {
      expect(board.boardSize).toBe(2);
    });
  });

  it('should create boards with correct paths', () => {
    const boards = createDefault2x2Boards();

    // Board 1: Left column (1,0) → (0,0) → goal
    expect(boards[0]?.sequence).toHaveLength(3);
    expect(boards[0]?.sequence[0]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[0]?.sequence[1]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[0]?.sequence[2]?.position).toEqual({ row: -1, col: 0 });

    // Board 2: Right column (1,1) → (0,1) → goal
    expect(boards[1]?.sequence).toHaveLength(3);
    expect(boards[1]?.sequence[0]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[1]?.sequence[1]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[1]?.sequence[2]?.position).toEqual({ row: -1, col: 1 });

    // Board 3: Left-Right (1,0) → (1,1) → (0,1) → goal
    expect(boards[2]?.sequence).toHaveLength(4);
    expect(boards[2]?.sequence[0]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[2]?.sequence[1]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[2]?.sequence[2]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[2]?.sequence[3]?.position).toEqual({ row: -1, col: 1 });

    // Board 4: Right-Left (1,1) → (1,0) → (0,0) → goal
    expect(boards[3]?.sequence).toHaveLength(4);
    expect(boards[3]?.sequence[0]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[3]?.sequence[1]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[3]?.sequence[2]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[3]?.sequence[3]?.position).toEqual({ row: -1, col: 0 });
  });

  it('should create boards with no traps', () => {
    const boards = createDefault2x2Boards();
    boards.forEach((board) => {
      const hasTrap = board.sequence.some((move) => move.type === 'trap');
      expect(hasTrap).toBe(false);
    });
  });

  it('should create boards with valid grids', () => {
    const boards = createDefault2x2Boards();

    // Board 1: pieces at top-left AND bottom-left (full path)
    expect(boards[0]?.grid[0]?.[0]).toBe('piece');
    expect(boards[0]?.grid[0]?.[1]).toBe('empty');
    expect(boards[0]?.grid[1]?.[0]).toBe('piece');
    expect(boards[0]?.grid[1]?.[1]).toBe('empty');

    // Board 2: pieces at top-right AND bottom-right (full path)
    expect(boards[1]?.grid[0]?.[0]).toBe('empty');
    expect(boards[1]?.grid[0]?.[1]).toBe('piece');
    expect(boards[1]?.grid[1]?.[0]).toBe('empty');
    expect(boards[1]?.grid[1]?.[1]).toBe('piece');

    // Board 3: Left-Right path (bottom-left → bottom-right → top-right)
    expect(boards[2]?.grid[0]?.[0]).toBe('empty');
    expect(boards[2]?.grid[0]?.[1]).toBe('piece');
    expect(boards[2]?.grid[1]?.[0]).toBe('piece');
    expect(boards[2]?.grid[1]?.[1]).toBe('piece');

    // Board 4: Right-Left path (bottom-right → bottom-left → top-left)
    expect(boards[3]?.grid[0]?.[0]).toBe('piece');
    expect(boards[3]?.grid[0]?.[1]).toBe('empty');
    expect(boards[3]?.grid[1]?.[0]).toBe('piece');
    expect(boards[3]?.grid[1]?.[1]).toBe('piece');
  });

  it('should have empty thumbnails (generated on-demand)', () => {
    const boards = createDefault2x2Boards();
    boards.forEach((board) => {
      expect(board.thumbnail).toBe('');
    });
  });
});

describe('createDefault3x3Boards', () => {
  it('should create 3 boards', () => {
    const boards = createDefault3x3Boards();
    expect(boards).toHaveLength(3);
  });

  it('should create boards with correct size', () => {
    const boards = createDefault3x3Boards();
    boards.forEach((board) => {
      expect(board.boardSize).toBe(3);
    });
  });

  it('should create boards with straight column paths', () => {
    const boards = createDefault3x3Boards();

    // Board 1: Left column (6 → 3 → 0 → goal)
    expect(boards[0]?.sequence).toHaveLength(4);
    expect(boards[0]?.sequence[0]?.position).toEqual({ row: 2, col: 0 });
    expect(boards[0]?.sequence[1]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[0]?.sequence[2]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[0]?.sequence[3]?.position).toEqual({ row: -1, col: 0 });

    // Board 2: Middle column (7 → 4 → 1 → goal)
    expect(boards[1]?.sequence).toHaveLength(4);
    expect(boards[1]?.sequence[0]?.position).toEqual({ row: 2, col: 1 });
    expect(boards[1]?.sequence[1]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[1]?.sequence[2]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[1]?.sequence[3]?.position).toEqual({ row: -1, col: 1 });

    // Board 3: Right column (8 → 5 → 2 → goal)
    expect(boards[2]?.sequence).toHaveLength(4);
    expect(boards[2]?.sequence[0]?.position).toEqual({ row: 2, col: 2 });
    expect(boards[2]?.sequence[1]?.position).toEqual({ row: 1, col: 2 });
    expect(boards[2]?.sequence[2]?.position).toEqual({ row: 0, col: 2 });
    expect(boards[2]?.sequence[3]?.position).toEqual({ row: -1, col: 2 });
  });

  it('should create boards with no traps', () => {
    const boards = createDefault3x3Boards();
    boards.forEach((board) => {
      const hasTrap = board.sequence.some((move) => move.type === 'trap');
      expect(hasTrap).toBe(false);
    });
  });

  it('should create boards with valid grids', () => {
    const boards = createDefault3x3Boards();

    // Board 1: pieces at ALL positions in left column (full path)
    expect(boards[0]?.grid[0]?.[0]).toBe('piece');
    expect(boards[0]?.grid[0]?.[1]).toBe('empty');
    expect(boards[0]?.grid[0]?.[2]).toBe('empty');
    expect(boards[0]?.grid[1]?.[0]).toBe('piece');
    expect(boards[0]?.grid[2]?.[0]).toBe('piece');

    // Board 2: pieces at ALL positions in middle column (full path)
    expect(boards[1]?.grid[0]?.[0]).toBe('empty');
    expect(boards[1]?.grid[0]?.[1]).toBe('piece');
    expect(boards[1]?.grid[0]?.[2]).toBe('empty');
    expect(boards[1]?.grid[1]?.[1]).toBe('piece');
    expect(boards[1]?.grid[2]?.[1]).toBe('piece');

    // Board 3: pieces at ALL positions in right column (full path)
    expect(boards[2]?.grid[0]?.[0]).toBe('empty');
    expect(boards[2]?.grid[0]?.[1]).toBe('empty');
    expect(boards[2]?.grid[0]?.[2]).toBe('piece');
    expect(boards[2]?.grid[1]?.[2]).toBe('piece');
    expect(boards[2]?.grid[2]?.[2]).toBe('piece');
  });

  it('should have empty thumbnails (generated on-demand)', () => {
    const boards = createDefault3x3Boards();
    boards.forEach((board) => {
      expect(board.thumbnail).toBe('');
    });
  });
});

describe('createDefault2x2Deck', () => {
  it('should create deck with 10 boards', () => {
    const boards = createDefault2x2Boards();
    const deck = createDefault2x2Deck(boards);

    expect(deck.boards).toHaveLength(10);
  });

  it('should alternate between left and right column boards', () => {
    const boards = createDefault2x2Boards();
    const deck = createDefault2x2Deck(boards);

    // Check alternating pattern
    for (let i = 0; i < 10; i++) {
      const expectedBoard = boards[i % 2];
      expect(deck.boards[i]).toBe(expectedBoard);
    }
  });

  it('should have correct deck name', () => {
    const boards = createDefault2x2Boards();
    const deck = createDefault2x2Deck(boards);

    expect(deck.name).toBe('CPU Sam 2×2 Deck');
  });
});

describe('createDefault3x3Deck', () => {
  it('should create deck with 10 boards', () => {
    const boards = createDefault3x3Boards();
    const deck = createDefault3x3Deck(boards);

    expect(deck.boards).toHaveLength(10);
  });

  it('should cycle through all 3 column boards', () => {
    const boards = createDefault3x3Boards();
    const deck = createDefault3x3Deck(boards);

    // Check cycling pattern (left, middle, right, left, middle, right, ...)
    for (let i = 0; i < 10; i++) {
      const expectedBoard = boards[i % 3];
      expect(deck.boards[i]).toBe(expectedBoard);
    }
  });

  it('should have correct deck name', () => {
    const boards = createDefault3x3Boards();
    const deck = createDefault3x3Deck(boards);

    expect(deck.name).toBe('CPU Sam 3×3 Deck');
  });
});

describe('initializeDefaultCpuData', () => {
  it('should create all components', () => {
    const data = initializeDefaultCpuData();

    expect(data.opponent).toBeDefined();
    expect(data.boards2x2).toBeDefined();
    expect(data.boards3x3).toBeDefined();
    expect(data.deck2x2).toBeDefined();
    expect(data.deck3x3).toBeDefined();
  });

  it('should create correct number of boards', () => {
    const data = initializeDefaultCpuData();

    expect(data.boards2x2).toHaveLength(4);
    expect(data.boards3x3).toHaveLength(3);
  });

  it('should create decks with correct boards', () => {
    const data = initializeDefaultCpuData();

    expect(data.deck2x2.boards).toHaveLength(10);
    expect(data.deck3x3.boards).toHaveLength(10);
  });

  it('should create CPU opponent with correct properties', () => {
    const data = initializeDefaultCpuData();

    expect(data.opponent.id).toBe(CPU_OPPONENT_ID);
    expect(data.opponent.name).toBe(CPU_OPPONENT_NAME);
    expect(data.opponent.type).toBe('cpu');
  });
});

describe('createCpuTougherOpponent', () => {
  it('should create CPU Tougher opponent with correct ID and name', () => {
    const opponent = createCpuTougherOpponent();

    expect(opponent.id).toBe(CPU_TOUGHER_OPPONENT_ID);
    expect(opponent.name).toBe(CPU_TOUGHER_OPPONENT_NAME);
    expect(opponent.type).toBe('cpu');
    expect(opponent.wins).toBe(0);
    expect(opponent.losses).toBe(0);
  });
});

describe('createCpuTougher2x2Boards', () => {
  it('should create 4 boards', () => {
    const boards = createCpuTougher2x2Boards();
    expect(boards).toHaveLength(4);
  });

  it('should create boards with correct size', () => {
    const boards = createCpuTougher2x2Boards();
    boards.forEach((board) => {
      expect(board.boardSize).toBe(2);
    });
  });

  it('should create boards with traps on first two boards', () => {
    const boards = createCpuTougher2x2Boards();

    // Board 1 and 2 should have traps
    const board1HasTrap = boards[0]?.sequence.some((move) => move.type === 'trap');
    const board2HasTrap = boards[1]?.sequence.some((move) => move.type === 'trap');
    expect(board1HasTrap).toBe(true);
    expect(board2HasTrap).toBe(true);

    // Board 3 and 4 should not have traps
    const board3HasTrap = boards[2]?.sequence.some((move) => move.type === 'trap');
    const board4HasTrap = boards[3]?.sequence.some((move) => move.type === 'trap');
    expect(board3HasTrap).toBe(false);
    expect(board4HasTrap).toBe(false);
  });

  it('should create board 1 with left column path and trap', () => {
    const boards = createCpuTougher2x2Boards();

    // Board 1: (1,0) → trap(1,1) → (0,0) → goal
    expect(boards[0]?.sequence).toHaveLength(4);
    expect(boards[0]?.sequence[0]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[0]?.sequence[0]?.type).toBe('piece');
    expect(boards[0]?.sequence[1]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[0]?.sequence[1]?.type).toBe('trap');
    expect(boards[0]?.sequence[2]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[0]?.sequence[2]?.type).toBe('piece');
    expect(boards[0]?.sequence[3]?.position).toEqual({ row: -1, col: 0 });
    expect(boards[0]?.sequence[3]?.type).toBe('final');
  });

  it('should create board 2 with right column path and trap', () => {
    const boards = createCpuTougher2x2Boards();

    // Board 2: (1,1) → trap(1,0) → (0,1) → goal
    expect(boards[1]?.sequence).toHaveLength(4);
    expect(boards[1]?.sequence[0]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[1]?.sequence[0]?.type).toBe('piece');
    expect(boards[1]?.sequence[1]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[1]?.sequence[1]?.type).toBe('trap');
    expect(boards[1]?.sequence[2]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[1]?.sequence[2]?.type).toBe('piece');
    expect(boards[1]?.sequence[3]?.position).toEqual({ row: -1, col: 1 });
    expect(boards[1]?.sequence[3]?.type).toBe('final');
  });

  it('should create board 3 with straight left column (no traps)', () => {
    const boards = createCpuTougher2x2Boards();

    // Board 3: (1,0) → (0,0) → goal
    expect(boards[2]?.sequence).toHaveLength(3);
    expect(boards[2]?.sequence[0]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[2]?.sequence[1]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[2]?.sequence[2]?.position).toEqual({ row: -1, col: 0 });
  });

  it('should create board 4 with straight right column (no traps)', () => {
    const boards = createCpuTougher2x2Boards();

    // Board 4: (1,1) → (0,1) → goal
    expect(boards[3]?.sequence).toHaveLength(3);
    expect(boards[3]?.sequence[0]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[3]?.sequence[1]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[3]?.sequence[2]?.position).toEqual({ row: -1, col: 1 });
  });

  it('should create boards with valid grids', () => {
    const boards = createCpuTougher2x2Boards();

    // Board 1: piece at (1,0) and (0,0), trap at (1,1)
    expect(boards[0]?.grid[0]?.[0]).toBe('piece');
    expect(boards[0]?.grid[1]?.[0]).toBe('piece');
    expect(boards[0]?.grid[1]?.[1]).toBe('trap');

    // Board 2: piece at (1,1) and (0,1), trap at (1,0)
    expect(boards[1]?.grid[0]?.[1]).toBe('piece');
    expect(boards[1]?.grid[1]?.[1]).toBe('piece');
    expect(boards[1]?.grid[1]?.[0]).toBe('trap');
  });

  it('should have empty thumbnails (generated on-demand)', () => {
    const boards = createCpuTougher2x2Boards();
    boards.forEach((board) => {
      expect(board.thumbnail).toBe('');
    });
  });
});

describe('createCpuTougher3x3Boards', () => {
  it('should create 4 boards', () => {
    const boards = createCpuTougher3x3Boards();
    expect(boards).toHaveLength(4);
  });

  it('should create boards with correct size', () => {
    const boards = createCpuTougher3x3Boards();
    boards.forEach((board) => {
      expect(board.boardSize).toBe(3);
    });
  });

  it('should create boards with traps on last two boards', () => {
    const boards = createCpuTougher3x3Boards();

    // Board 1 and 2 (indices 0, 1) should not have traps
    const board1HasTrap = boards[0]?.sequence.some((move) => move.type === 'trap');
    const board2HasTrap = boards[1]?.sequence.some((move) => move.type === 'trap');
    expect(board1HasTrap).toBe(false);
    expect(board2HasTrap).toBe(false);

    // Board 3 and 4 (indices 2, 3) should have traps
    const board3HasTrap = boards[2]?.sequence.some((move) => move.type === 'trap');
    const board4HasTrap = boards[3]?.sequence.some((move) => move.type === 'trap');
    expect(board3HasTrap).toBe(true);
    expect(board4HasTrap).toBe(true);
  });

  it('should create board 1 with straight left column (no traps)', () => {
    const boards = createCpuTougher3x3Boards();

    // Board 1: (2,0) → (1,0) → (0,0) → goal
    expect(boards[0]?.sequence).toHaveLength(4);
    expect(boards[0]?.sequence[0]?.position).toEqual({ row: 2, col: 0 });
    expect(boards[0]?.sequence[1]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[0]?.sequence[2]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[0]?.sequence[3]?.position).toEqual({ row: -1, col: 0 });

    const hasTrap = boards[0]?.sequence.some((move) => move.type === 'trap');
    expect(hasTrap).toBe(false);
  });

  it('should create board 2 with straight middle column (no traps)', () => {
    const boards = createCpuTougher3x3Boards();

    // Board 2: (2,1) → (1,1) → (0,1) → goal
    expect(boards[1]?.sequence).toHaveLength(4);
    expect(boards[1]?.sequence[0]?.position).toEqual({ row: 2, col: 1 });
    expect(boards[1]?.sequence[1]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[1]?.sequence[2]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[1]?.sequence[3]?.position).toEqual({ row: -1, col: 1 });

    const hasTrap = boards[1]?.sequence.some((move) => move.type === 'trap');
    expect(hasTrap).toBe(false);
  });

  it('should create board 3 with left column path and trap', () => {
    const boards = createCpuTougher3x3Boards();

    // Board 3: (2,0) → trap(2,1) → (1,0) → (0,0) → goal
    expect(boards[2]?.sequence).toHaveLength(5);
    expect(boards[2]?.sequence[0]?.position).toEqual({ row: 2, col: 0 });
    expect(boards[2]?.sequence[0]?.type).toBe('piece');
    expect(boards[2]?.sequence[1]?.position).toEqual({ row: 2, col: 1 });
    expect(boards[2]?.sequence[1]?.type).toBe('trap');
    expect(boards[2]?.sequence[2]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[2]?.sequence[2]?.type).toBe('piece');
    expect(boards[2]?.sequence[3]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[2]?.sequence[3]?.type).toBe('piece');
    expect(boards[2]?.sequence[4]?.position).toEqual({ row: -1, col: 0 });
    expect(boards[2]?.sequence[4]?.type).toBe('final');
  });

  it('should create board 4 with middle column path and trap', () => {
    const boards = createCpuTougher3x3Boards();

    // Board 4: (2,1) → trap(2,2) → (1,1) → (0,1) → goal
    expect(boards[3]?.sequence).toHaveLength(5);
    expect(boards[3]?.sequence[0]?.position).toEqual({ row: 2, col: 1 });
    expect(boards[3]?.sequence[0]?.type).toBe('piece');
    expect(boards[3]?.sequence[1]?.position).toEqual({ row: 2, col: 2 });
    expect(boards[3]?.sequence[1]?.type).toBe('trap');
    expect(boards[3]?.sequence[2]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[3]?.sequence[2]?.type).toBe('piece');
    expect(boards[3]?.sequence[3]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[3]?.sequence[3]?.type).toBe('piece');
    expect(boards[3]?.sequence[4]?.position).toEqual({ row: -1, col: 1 });
    expect(boards[3]?.sequence[4]?.type).toBe('final');
  });

  it('should create boards with valid grids', () => {
    const boards = createCpuTougher3x3Boards();

    // Board 3: pieces at (2,0), (1,0), (0,0), trap at (2,1)
    expect(boards[2]?.grid[0]?.[0]).toBe('piece');
    expect(boards[2]?.grid[1]?.[0]).toBe('piece');
    expect(boards[2]?.grid[2]?.[0]).toBe('piece');
    expect(boards[2]?.grid[2]?.[1]).toBe('trap');

    // Board 4: pieces at (2,1), (1,1), (0,1), trap at (2,2)
    expect(boards[3]?.grid[0]?.[1]).toBe('piece');
    expect(boards[3]?.grid[1]?.[1]).toBe('piece');
    expect(boards[3]?.grid[2]?.[1]).toBe('piece');
    expect(boards[3]?.grid[2]?.[2]).toBe('trap');
  });

  it('should have empty thumbnails (generated on-demand)', () => {
    const boards = createCpuTougher3x3Boards();
    boards.forEach((board) => {
      expect(board.thumbnail).toBe('');
    });
  });
});

describe('initializeCpuTougherData', () => {
  it('should create all components', () => {
    const data = initializeCpuTougherData();

    expect(data.opponent).toBeDefined();
    expect(data.boards2x2).toBeDefined();
    expect(data.boards3x3).toBeDefined();
    expect(data.deck2x2).toBeDefined();
    expect(data.deck3x3).toBeDefined();
  });

  it('should create CPU Tougher opponent with correct properties', () => {
    const data = initializeCpuTougherData();

    expect(data.opponent.id).toBe(CPU_TOUGHER_OPPONENT_ID);
    expect(data.opponent.name).toBe(CPU_TOUGHER_OPPONENT_NAME);
    expect(data.opponent.type).toBe('cpu');
  });

  it('should create correct number of boards', () => {
    const data = initializeCpuTougherData();

    expect(data.boards2x2).toHaveLength(4);
    expect(data.boards3x3).toHaveLength(4);
  });

  it('should create decks with correct boards', () => {
    const data = initializeCpuTougherData();

    expect(data.deck2x2.boards).toHaveLength(10);
    expect(data.deck3x3.boards).toHaveLength(10);
  });

  it('should create 2x2 deck with mixed trap/no-trap pattern', () => {
    const data = initializeCpuTougherData();

    // Deck pattern: [0,2,1,3,0,2,1,3,0,1] (with trap, no trap, with trap, no trap, ...)
    const expectedIndices = [0, 2, 1, 3, 0, 2, 1, 3, 0, 1];

    expectedIndices.forEach((expectedIndex, i) => {
      expect(data.deck2x2.boards[i]).toBe(data.boards2x2[expectedIndex]);
    });
  });

  it('should create 3x3 deck with mixed boards', () => {
    const data = initializeCpuTougherData();

    // Deck pattern: [0,2,1,3,0,2,1,3,2,3]
    const expectedIndices = [0, 2, 1, 3, 0, 2, 1, 3, 2, 3];

    expectedIndices.forEach((expectedIndex, i) => {
      expect(data.deck3x3.boards[i]).toBe(data.boards3x3[expectedIndex]);
    });
  });

  it('should have correct deck names', () => {
    const data = initializeCpuTougherData();

    expect(data.deck2x2.name).toBe('CPU Tougher 2×2 Deck');
    expect(data.deck3x3.name).toBe('CPU Tougher 3×3 Deck');
  });
});

describe('createDefault2x2Deck error handling', () => {
  it('should throw error when boards array has fewer than 2 boards', () => {
    expect(() => createDefault2x2Deck([])).toThrow(
      'Need at least 2 boards to create alternating deck'
    );
    expect(() => createDefault2x2Deck([createDefault2x2Boards()[0]!])).toThrow(
      'Need at least 2 boards to create alternating deck'
    );
  });
});

describe('createDefault3x3Deck error handling', () => {
  it('should throw error when boards array has fewer than 3 boards', () => {
    expect(() => createDefault3x3Deck([])).toThrow(
      'Need at least 3 boards to create alternating deck'
    );
    expect(() => createDefault3x3Deck([createDefault3x3Boards()[0]!])).toThrow(
      'Need at least 3 boards to create alternating deck'
    );
    expect(() =>
      createDefault3x3Deck([createDefault3x3Boards()[0]!, createDefault3x3Boards()[1]!])
    ).toThrow('Need at least 3 boards to create alternating deck');
  });
});
