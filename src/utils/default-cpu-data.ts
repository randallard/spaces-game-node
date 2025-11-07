/**
 * Default CPU opponent data - boards and decks
 * This CPU opponent is created automatically on first load
 */

import { v4 as uuidv4 } from 'uuid';
import type { Opponent, Board, Deck } from '@/types';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME } from '@/constants/game-rules';
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
