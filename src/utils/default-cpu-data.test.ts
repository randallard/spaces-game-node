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
} from './default-cpu-data';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME } from '@/constants/game-rules';

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
  it('should create 2 boards', () => {
    const boards = createDefault2x2Boards();
    expect(boards).toHaveLength(2);
  });

  it('should create boards with correct size', () => {
    const boards = createDefault2x2Boards();
    boards.forEach((board) => {
      expect(board.boardSize).toBe(2);
    });
  });

  it('should create boards with straight column paths', () => {
    const boards = createDefault2x2Boards();

    // Board 1: Left column (2 → 0 → goal)
    expect(boards[0]?.sequence).toHaveLength(3);
    expect(boards[0]?.sequence[0]?.position).toEqual({ row: 1, col: 0 });
    expect(boards[0]?.sequence[1]?.position).toEqual({ row: 0, col: 0 });
    expect(boards[0]?.sequence[2]?.position).toEqual({ row: -1, col: 0 });

    // Board 2: Right column (3 → 1 → goal)
    expect(boards[1]?.sequence).toHaveLength(3);
    expect(boards[1]?.sequence[0]?.position).toEqual({ row: 1, col: 1 });
    expect(boards[1]?.sequence[1]?.position).toEqual({ row: 0, col: 1 });
    expect(boards[1]?.sequence[2]?.position).toEqual({ row: -1, col: 1 });
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
  });

  it('should generate thumbnails', () => {
    const boards = createDefault2x2Boards();
    boards.forEach((board) => {
      expect(board.thumbnail).toBeTruthy();
      expect(board.thumbnail.length).toBeGreaterThan(0);
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

  it('should generate thumbnails', () => {
    const boards = createDefault3x3Boards();
    boards.forEach((board) => {
      expect(board.thumbnail).toBeTruthy();
      expect(board.thumbnail.length).toBeGreaterThan(0);
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

    expect(deck.name).toBe('CPU 2×2 Deck');
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

    expect(deck.name).toBe('CPU 3×3 Deck');
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

    expect(data.boards2x2).toHaveLength(2);
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
