/**
 * Default CPU opponent data - boards and decks
 * This CPU opponent is created automatically on first load
 */

import { v4 as uuidv4 } from 'uuid';
import type { Opponent, Board, Deck } from '@/types';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME, CPU_TOUGHER_OPPONENT_ID, CPU_TOUGHER_OPPONENT_NAME } from '@/constants/game-rules';
import { generateBoardThumbnail } from '@/utils/svg-thumbnail';

/**
 * Create the default CPU opponent
 */
export function createDefaultCpuOpponent(): Opponent {
  return {
    id: CPU_OPPONENT_ID,
    name: CPU_OPPONENT_NAME,
    type: 'cpu',
    wins: 0,
    losses: 0,
  };
}

/**
 * Create default 2x2 boards - straight up each column (no traps)
 *
 * Position map (2×2):
 * [0][1]
 * [2][3]
 */
export function createDefault2x2Boards(): Board[] {
  const now = Date.now();

  // Board 1: Straight up left column (position 2 → 0 → goal column 0)
  const board1: Board = {
    id: uuidv4(),
    name: 'CPU Left Column',
    boardSize: 2,
    grid: [
      ['piece', 'empty'], // Row 0: piece at final position
      ['piece', 'empty'], // Row 1: piece at start position
    ],
    sequence: [
      { position: { row: 1, col: 0 }, type: 'piece', order: 1 }, // Start at (1,0) - position 2
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Move to (0,0) - position 0
      { position: { row: -1, col: 0 }, type: 'final', order: 3 }, // Goal at column 0
    ],
    thumbnail: '',
    createdAt: now,
  };

  // Board 2: Straight up right column (position 3 → 1 → goal column 1)
  const board2: Board = {
    id: uuidv4(),
    name: 'CPU Right Column',
    boardSize: 2,
    grid: [
      ['empty', 'piece'], // Row 0: piece at final position
      ['empty', 'piece'], // Row 1: piece at start position
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start at (1,1) - position 3
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 }, // Move to (0,1) - position 1
      { position: { row: -1, col: 1 }, type: 'final', order: 3 }, // Goal at column 1
    ],
    thumbnail: '',
    createdAt: now + 1,
  };

  // Generate thumbnails
  board1.thumbnail = generateBoardThumbnail(board1);
  board2.thumbnail = generateBoardThumbnail(board2);

  return [board1, board2];
}

/**
 * Create default 3x3 boards - straight up each column (no traps)
 *
 * Position map (3×3):
 * [0][1][2]
 * [3][4][5]
 * [6][7][8]
 */
export function createDefault3x3Boards(): Board[] {
  const now = Date.now();

  // Board 1: Straight up left column (position 6 → 3 → 0 → goal column 0)
  const board1: Board = {
    id: uuidv4(),
    name: 'CPU Left Column',
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'], // Row 0: piece at final position
      ['piece', 'empty', 'empty'], // Row 1: piece at middle position
      ['piece', 'empty', 'empty'], // Row 2: piece at start position
    ],
    sequence: [
      { position: { row: 2, col: 0 }, type: 'piece', order: 1 }, // Start at (2,0) - position 6
      { position: { row: 1, col: 0 }, type: 'piece', order: 2 }, // Move to (1,0) - position 3
      { position: { row: 0, col: 0 }, type: 'piece', order: 3 }, // Move to (0,0) - position 0
      { position: { row: -1, col: 0 }, type: 'final', order: 4 }, // Goal at column 0
    ],
    thumbnail: '',
    createdAt: now,
  };

  // Board 2: Straight up middle column (position 7 → 4 → 1 → goal column 1)
  const board2: Board = {
    id: uuidv4(),
    name: 'CPU Middle Column',
    boardSize: 3,
    grid: [
      ['empty', 'piece', 'empty'], // Row 0: piece at final position
      ['empty', 'piece', 'empty'], // Row 1: piece at middle position
      ['empty', 'piece', 'empty'], // Row 2: piece at start position
    ],
    sequence: [
      { position: { row: 2, col: 1 }, type: 'piece', order: 1 }, // Start at (2,1) - position 7
      { position: { row: 1, col: 1 }, type: 'piece', order: 2 }, // Move to (1,1) - position 4
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Move to (0,1) - position 1
      { position: { row: -1, col: 1 }, type: 'final', order: 4 }, // Goal at column 1
    ],
    thumbnail: '',
    createdAt: now + 1,
  };

  // Board 3: Straight up right column (position 8 → 5 → 2 → goal column 2)
  const board3: Board = {
    id: uuidv4(),
    name: 'CPU Right Column',
    boardSize: 3,
    grid: [
      ['empty', 'empty', 'piece'], // Row 0: piece at final position
      ['empty', 'empty', 'piece'], // Row 1: piece at middle position
      ['empty', 'empty', 'piece'], // Row 2: piece at start position
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 }, // Start at (2,2) - position 8
      { position: { row: 1, col: 2 }, type: 'piece', order: 2 }, // Move to (1,2) - position 5
      { position: { row: 0, col: 2 }, type: 'piece', order: 3 }, // Move to (0,2) - position 2
      { position: { row: -1, col: 2 }, type: 'final', order: 4 }, // Goal at column 2
    ],
    thumbnail: '',
    createdAt: now + 2,
  };

  // Generate thumbnails
  board1.thumbnail = generateBoardThumbnail(board1);
  board2.thumbnail = generateBoardThumbnail(board2);
  board3.thumbnail = generateBoardThumbnail(board3);

  return [board1, board2, board3];
}

/**
 * Create default 2x2 deck with alternating boards (10 boards total)
 * Alternates between left and right columns
 */
export function createDefault2x2Deck(boards: Board[]): Deck {
  if (boards.length < 2) {
    throw new Error('Need at least 2 boards to create alternating deck');
  }

  const deckBoards: Board[] = [];
  for (let i = 0; i < 10; i++) {
    // Alternate: board1, board2, board1, board2, ...
    deckBoards.push(boards[i % 2]!);
  }

  return {
    id: `cpu-deck-2x2-${Date.now()}`,
    name: 'CPU 2×2 Deck',
    boards: deckBoards,
    createdAt: Date.now(),
  };
}

/**
 * Create default 3x3 deck with alternating boards (10 boards total)
 * Cycles through left, middle, right columns
 */
export function createDefault3x3Deck(boards: Board[]): Deck {
  if (boards.length < 3) {
    throw new Error('Need at least 3 boards to create alternating deck');
  }

  const deckBoards: Board[] = [];
  for (let i = 0; i < 10; i++) {
    // Cycle: board1, board2, board3, board1, board2, board3, ...
    deckBoards.push(boards[i % 3]!);
  }

  return {
    id: `cpu-deck-3x3-${Date.now()}`,
    name: 'CPU 3×3 Deck',
    boards: deckBoards,
    createdAt: Date.now(),
  };
}

/**
 * Initialize all default CPU data (opponent, boards, and decks)
 */
export function initializeDefaultCpuData(): {
  opponent: Opponent;
  boards2x2: Board[];
  boards3x3: Board[];
  deck2x2: Deck;
  deck3x3: Deck;
} {
  const opponent = createDefaultCpuOpponent();
  const boards2x2 = createDefault2x2Boards();
  const boards3x3 = createDefault3x3Boards();
  const deck2x2 = createDefault2x2Deck(boards2x2);
  const deck3x3 = createDefault3x3Deck(boards3x3);

  return {
    opponent,
    boards2x2,
    boards3x3,
    deck2x2,
    deck3x3,
  };
}

/**
 * Create the CPU Tougher opponent
 */
export function createCpuTougherOpponent(): Opponent {
  return {
    id: CPU_TOUGHER_OPPONENT_ID,
    name: CPU_TOUGHER_OPPONENT_NAME,
    type: 'cpu',
    wins: 0,
    losses: 0,
  };
}

/**
 * Create CPU Tougher 2x2 boards with traps - more challenging
 */
export function createCpuTougher2x2Boards(): Board[] {
  const now = Date.now();

  // Board 1: Left column with trap (piece → trap → piece → goal)
  const board1: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 1',
    boardSize: 2,
    grid: [
      ['piece', 'empty'], // Row 0
      ['piece', 'trap'],  // Row 1
    ],
    sequence: [
      { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
      { position: { row: -1, col: 0 }, type: 'final', order: 4 },
    ],
    thumbnail: '',
    createdAt: now,
  };

  // Board 2: Right column with trap (piece → trap → piece → goal)
  const board2: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 2',
    boardSize: 2,
    grid: [
      ['empty', 'piece'], // Row 0
      ['trap', 'piece'],  // Row 1
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
      { position: { row: -1, col: 1 }, type: 'final', order: 4 },
    ],
    thumbnail: '',
    createdAt: now + 1,
  };

  // Board 3: Straight left column (no traps)
  const board3: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 3',
    boardSize: 2,
    grid: [
      ['piece', 'empty'], // Row 0
      ['piece', 'empty'], // Row 1
    ],
    sequence: [
      { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
      { position: { row: -1, col: 0 }, type: 'final', order: 3 },
    ],
    thumbnail: '',
    createdAt: now + 2,
  };

  // Board 4: Straight right column (no traps)
  const board4: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 4',
    boardSize: 2,
    grid: [
      ['empty', 'piece'], // Row 0
      ['empty', 'piece'], // Row 1
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
      { position: { row: -1, col: 1 }, type: 'final', order: 3 },
    ],
    thumbnail: '',
    createdAt: now + 3,
  };

  // Generate thumbnails
  board1.thumbnail = generateBoardThumbnail(board1);
  board2.thumbnail = generateBoardThumbnail(board2);
  board3.thumbnail = generateBoardThumbnail(board3);
  board4.thumbnail = generateBoardThumbnail(board4);

  return [board1, board2, board3, board4];
}

/**
 * Create CPU Tougher 3x3 boards with traps - more challenging
 */
export function createCpuTougher3x3Boards(): Board[] {
  const now = Date.now();

  // Board 5: Straight left column (no traps)
  const board5: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 5',
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'], // Row 0
      ['piece', 'empty', 'empty'], // Row 1
      ['piece', 'empty', 'empty'], // Row 2
    ],
    sequence: [
      { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
      { position: { row: -1, col: 0 }, type: 'final', order: 4 },
    ],
    thumbnail: '',
    createdAt: now,
  };

  // Board 6: Straight middle column (no traps)
  const board6: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 6',
    boardSize: 3,
    grid: [
      ['empty', 'piece', 'empty'], // Row 0
      ['empty', 'piece', 'empty'], // Row 1
      ['empty', 'piece', 'empty'], // Row 2
    ],
    sequence: [
      { position: { row: 2, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 },
      { position: { row: -1, col: 1 }, type: 'final', order: 4 },
    ],
    thumbnail: '',
    createdAt: now + 1,
  };

  // Board 7: Left column with trap (piece → trap → piece → piece → goal)
  const board7: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 7',
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'], // Row 0
      ['piece', 'empty', 'empty'], // Row 1
      ['piece', 'trap', 'empty'],  // Row 2
    ],
    sequence: [
      { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 2, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
      { position: { row: -1, col: 0 }, type: 'final', order: 5 },
    ],
    thumbnail: '',
    createdAt: now + 2,
  };

  // Board 8: Middle column with trap (piece → trap → piece → piece → goal)
  const board8: Board = {
    id: uuidv4(),
    name: 'CPU Tougher Board 8',
    boardSize: 3,
    grid: [
      ['empty', 'piece', 'empty'], // Row 0
      ['empty', 'piece', 'empty'], // Row 1
      ['empty', 'piece', 'trap'],  // Row 2
    ],
    sequence: [
      { position: { row: 2, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 2, col: 2 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
      { position: { row: 0, col: 1 }, type: 'piece', order: 4 },
      { position: { row: -1, col: 1 }, type: 'final', order: 5 },
    ],
    thumbnail: '',
    createdAt: now + 3,
  };

  // Generate thumbnails
  board5.thumbnail = generateBoardThumbnail(board5);
  board6.thumbnail = generateBoardThumbnail(board6);
  board7.thumbnail = generateBoardThumbnail(board7);
  board8.thumbnail = generateBoardThumbnail(board8);

  return [board5, board6, board7, board8];
}

/**
 * Initialize CPU Tougher data (opponent, boards, and decks)
 */
export function initializeCpuTougherData(): {
  opponent: Opponent;
  boards2x2: Board[];
  boards3x3: Board[];
  deck2x2: Deck;
  deck3x3: Deck;
} {
  const opponent = createCpuTougherOpponent();
  const boards2x2 = createCpuTougher2x2Boards();
  const boards3x3 = createCpuTougher3x3Boards();

  // Create decks with mixed boards (including traps)
  const deck2x2: Deck = {
    id: `cpu-tougher-deck-2x2-${Date.now()}`,
    name: 'CPU Tougher 2×2 Deck',
    boards: [
      boards2x2[0]!, // With trap
      boards2x2[2]!, // No trap
      boards2x2[1]!, // With trap
      boards2x2[3]!, // No trap
      boards2x2[0]!, // With trap
      boards2x2[2]!, // No trap
      boards2x2[1]!, // With trap
      boards2x2[3]!, // No trap
      boards2x2[0]!, // With trap
      boards2x2[1]!, // With trap
    ],
    createdAt: Date.now(),
  };

  const deck3x3: Deck = {
    id: `cpu-tougher-deck-3x3-${Date.now()}`,
    name: 'CPU Tougher 3×3 Deck',
    boards: [
      boards3x3[0]!, // No trap (left)
      boards3x3[2]!, // With trap (left)
      boards3x3[1]!, // No trap (middle)
      boards3x3[3]!, // With trap (middle)
      boards3x3[0]!, // No trap (left)
      boards3x3[2]!, // With trap (left)
      boards3x3[1]!, // No trap (middle)
      boards3x3[3]!, // With trap (middle)
      boards3x3[2]!, // With trap (left)
      boards3x3[3]!, // With trap (middle)
    ],
    createdAt: Date.now(),
  };

  return {
    opponent,
    boards2x2,
    boards3x3,
    deck2x2,
    deck3x3,
  };
}
