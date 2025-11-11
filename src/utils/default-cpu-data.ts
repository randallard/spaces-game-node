/**
 * Default CPU opponent data - boards and decks
 * This CPU opponent is created automatically on first load
 */

import { v4 as uuidv4 } from 'uuid';
import type { Opponent, Board, Deck } from '@/types';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME, CPU_TOUGHER_OPPONENT_ID, CPU_TOUGHER_OPPONENT_NAME } from '@/constants/game-rules';

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
    name: 'CPU Sam Left Column',
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
    name: 'CPU Sam Right Column',
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

  // Board 3: Left to right horizontal, then up right column (hits trap at 1,1)
  const board3: Board = {
    id: uuidv4(),
    name: 'CPU Sam Left-Right',
    boardSize: 2,
    grid: [
      ['empty', 'piece'], // Row 0: piece at final position
      ['piece', 'piece'], // Row 1: piece at start and middle positions
    ],
    sequence: [
      { position: { row: 1, col: 0 }, type: 'piece', order: 1 }, // Start at (1,0)
      { position: { row: 1, col: 1 }, type: 'piece', order: 2 }, // Move right to (1,1)
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Move up to (0,1)
      { position: { row: -1, col: 1 }, type: 'final', order: 4 }, // Goal at column 1
    ],
    thumbnail: '',
    createdAt: now + 2,
  };

  // Board 4: Right to left horizontal, then up left column (hits trap at 1,0)
  const board4: Board = {
    id: uuidv4(),
    name: 'CPU Sam Right-Left',
    boardSize: 2,
    grid: [
      ['piece', 'empty'], // Row 0: piece at final position
      ['piece', 'piece'], // Row 1: piece at start and middle positions
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start at (1,1)
      { position: { row: 1, col: 0 }, type: 'piece', order: 2 }, // Move left to (1,0)
      { position: { row: 0, col: 0 }, type: 'piece', order: 3 }, // Move up to (0,0)
      { position: { row: -1, col: 0 }, type: 'final', order: 4 }, // Goal at column 0
    ],
    thumbnail: '',
    createdAt: now + 3,
  };

  // Thumbnails will be generated on-demand when displayed
  // No need to pre-generate them here

  return [board1, board2, board3, board4];
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
    name: 'CPU Sam Left Column',
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
    name: 'CPU Sam Middle Column',
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
    name: 'CPU Sam Right Column',
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

  // Thumbnails will be generated on-demand when displayed
  // No need to pre-generate them here

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
    name: 'CPU Sam 2×2 Deck',
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
    name: 'CPU Sam 3×3 Deck',
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
  // Use the dynamic generation function for consistency
  const boards2x2 = generateCpuBoardsForSize(CPU_OPPONENT_NAME, 2, false);
  const boards3x3 = generateCpuBoardsForSize(CPU_OPPONENT_NAME, 3, false);
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

  // Thumbnails will be generated on-demand when displayed
  // No need to pre-generate them here

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

  // Thumbnails will be generated on-demand when displayed
  // No need to pre-generate them here

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
  // Use the dynamic generation function for consistency (with isTougher = true for traps)
  const boards2x2 = generateCpuBoardsForSize(CPU_TOUGHER_OPPONENT_NAME, 2, true);
  const boards3x3 = generateCpuBoardsForSize(CPU_TOUGHER_OPPONENT_NAME, 3, true);

  // Create decks cycling through the 3 boards
  const deck2x2: Deck = {
    id: `cpu-tougher-deck-2x2-${Date.now()}`,
    name: 'CPU Tougher 2×2 Deck',
    boards: [
      boards2x2[0]!,
      boards2x2[1]!,
      boards2x2[2]!,
      boards2x2[0]!,
      boards2x2[1]!,
      boards2x2[2]!,
      boards2x2[0]!,
      boards2x2[1]!,
      boards2x2[2]!,
      boards2x2[0]!,
    ],
    createdAt: Date.now(),
  };

  const deck3x3: Deck = {
    id: `cpu-tougher-deck-3x3-${Date.now()}`,
    name: 'CPU Tougher 3×3 Deck',
    boards: [
      boards3x3[0]!,
      boards3x3[1]!,
      boards3x3[2]!,
      boards3x3[0]!,
      boards3x3[1]!,
      boards3x3[2]!,
      boards3x3[0]!,
      boards3x3[1]!,
      boards3x3[2]!,
      boards3x3[0]!,
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

/**
 * Generate CPU boards dynamically for any board size
 * Creates 3 simple boards for CPU Sam (straight columns) or 3 boards for CPU Tougher (with traps)
 *
 * @param opponentName - Name of the opponent (used in board names)
 * @param boardSize - Size of the board (2-99)
 * @param isTougher - Whether this is for CPU Tougher (includes traps)
 * @returns Array of 3 boards for the specified size
 */
export function generateCpuBoardsForSize(
  opponentName: string,
  boardSize: number,
  isTougher: boolean = false
): Board[] {
  const now = Date.now();
  const boards: Board[] = [];

  // Helper to create an empty grid
  const createEmptyGrid = (): ('empty' | 'piece' | 'trap')[][] => {
    return Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => 'empty' as 'empty' | 'piece' | 'trap')
    );
  };

  if (!isTougher) {
    // CPU Sam: Simple straight-down columns
    // Board 1: Left column (column 0)
    const board1Grid = createEmptyGrid();
    const board1Sequence: Board['sequence'] = [];
    for (let row = boardSize - 1; row >= 0; row--) {
      board1Grid[row]![0] = 'piece';
      board1Sequence.push({
        position: { row, col: 0 },
        type: 'piece',
        order: boardSize - row,
      });
    }
    board1Sequence.push({
      position: { row: -1, col: 0 },
      type: 'final',
      order: boardSize + 1,
    });

    boards.push({
      id: uuidv4(),
      name: `${opponentName} Left Column`,
      boardSize,
      grid: board1Grid,
      sequence: board1Sequence,
      thumbnail: '',
      createdAt: now,
    });

    // Board 2: Right column (last column)
    const board2Grid = createEmptyGrid();
    const board2Sequence: Board['sequence'] = [];
    const rightCol = boardSize - 1;
    for (let row = boardSize - 1; row >= 0; row--) {
      board2Grid[row]![rightCol] = 'piece';
      board2Sequence.push({
        position: { row, col: rightCol },
        type: 'piece',
        order: boardSize - row,
      });
    }
    board2Sequence.push({
      position: { row: -1, col: rightCol },
      type: 'final',
      order: boardSize + 1,
    });

    boards.push({
      id: uuidv4(),
      name: `${opponentName} Right Column`,
      boardSize,
      grid: board2Grid,
      sequence: board2Sequence,
      thumbnail: '',
      createdAt: now + 1,
    });

    // Board 3: Middle-ish column
    // For small boards (2-5): use true middle
    // For medium boards (6-10): use column around 1/3
    // For large boards (>10): use a column around 1/4
    let middleCol: number;
    if (boardSize <= 5) {
      middleCol = Math.floor(boardSize / 2);
    } else if (boardSize <= 10) {
      middleCol = Math.floor(boardSize / 3);
    } else {
      middleCol = Math.floor(boardSize / 4);
    }

    const board3Grid = createEmptyGrid();
    const board3Sequence: Board['sequence'] = [];
    for (let row = boardSize - 1; row >= 0; row--) {
      board3Grid[row]![middleCol] = 'piece';
      board3Sequence.push({
        position: { row, col: middleCol },
        type: 'piece',
        order: boardSize - row,
      });
    }
    board3Sequence.push({
      position: { row: -1, col: middleCol },
      type: 'final',
      order: boardSize + 1,
    });

    boards.push({
      id: uuidv4(),
      name: `${opponentName} Middle Column`,
      boardSize,
      grid: board3Grid,
      sequence: board3Sequence,
      thumbnail: '',
      createdAt: now + 2,
    });
  } else {
    // CPU Tougher: Off-edge columns with traps
    // Strategy: Use columns that are not on edges (0 or last) and not exact center

    // Board 1: Near-right column with traps at bottom on both sides
    const col1 = boardSize === 2 ? 1 : Math.max(1, boardSize - 2); // Second from right
    const board1Grid = createEmptyGrid();
    const board1Sequence: Board['sequence'] = [];
    let order1 = 1;

    // Start at bottom of chosen column
    board1Grid[boardSize - 1]![col1] = 'piece';
    board1Sequence.push({
      position: { row: boardSize - 1, col: col1 },
      type: 'piece',
      order: order1++,
    });

    // Add traps on both sides at bottom
    if (col1 > 0) {
      board1Grid[boardSize - 1]![col1 - 1] = 'trap';
      board1Sequence.push({
        position: { row: boardSize - 1, col: col1 - 1 },
        type: 'trap',
        order: order1++,
      });
    }
    if (col1 < boardSize - 1) {
      board1Grid[boardSize - 1]![col1 + 1] = 'trap';
      board1Sequence.push({
        position: { row: boardSize - 1, col: col1 + 1 },
        type: 'trap',
        order: order1++,
      });
    }

    // Go straight up
    for (let row = boardSize - 2; row >= 0; row--) {
      board1Grid[row]![col1] = 'piece';
      board1Sequence.push({
        position: { row, col: col1 },
        type: 'piece',
        order: order1++,
      });
    }

    board1Sequence.push({
      position: { row: -1, col: col1 },
      type: 'final',
      order: order1,
    });

    boards.push({
      id: uuidv4(),
      name: `${opponentName} Board 1`,
      boardSize,
      grid: board1Grid,
      sequence: board1Sequence,
      thumbnail: '',
      createdAt: now,
    });

    // Board 2: Near-left column with traps at bottom on both sides
    const col2 = boardSize === 2 ? 0 : 1; // Second from left (or left edge for 2x2)
    const board2Grid = createEmptyGrid();
    const board2Sequence: Board['sequence'] = [];
    let order2 = 1;

    // Start at bottom of chosen column
    board2Grid[boardSize - 1]![col2] = 'piece';
    board2Sequence.push({
      position: { row: boardSize - 1, col: col2 },
      type: 'piece',
      order: order2++,
    });

    // Add traps on both sides at bottom (if not on edge)
    if (col2 > 0) {
      board2Grid[boardSize - 1]![col2 - 1] = 'trap';
      board2Sequence.push({
        position: { row: boardSize - 1, col: col2 - 1 },
        type: 'trap',
        order: order2++,
      });
    }
    if (col2 < boardSize - 1) {
      board2Grid[boardSize - 1]![col2 + 1] = 'trap';
      board2Sequence.push({
        position: { row: boardSize - 1, col: col2 + 1 },
        type: 'trap',
        order: order2++,
      });
    }

    // Go straight up
    for (let row = boardSize - 2; row >= 0; row--) {
      board2Grid[row]![col2] = 'piece';
      board2Sequence.push({
        position: { row, col: col2 },
        type: 'piece',
        order: order2++,
      });
    }

    board2Sequence.push({
      position: { row: -1, col: col2 },
      type: 'final',
      order: order2,
    });

    boards.push({
      id: uuidv4(),
      name: `${opponentName} Board 2`,
      boardSize,
      grid: board2Grid,
      sequence: board2Sequence,
      thumbnail: '',
      createdAt: now + 1,
    });

    // Board 3: Off-center column with traps in the middle of the path
    const col3 = boardSize === 2 ? 1 : Math.floor(boardSize / 2) + (boardSize > 4 ? 1 : 0); // Slightly off-center
    const board3Grid = createEmptyGrid();
    const board3Sequence: Board['sequence'] = [];
    let order3 = 1;

    // Start at bottom
    board3Grid[boardSize - 1]![col3] = 'piece';
    board3Sequence.push({
      position: { row: boardSize - 1, col: col3 },
      type: 'piece',
      order: order3++,
    });

    // Go up to middle
    const trapRow = Math.floor(boardSize / 2);
    for (let row = boardSize - 2; row > trapRow; row--) {
      board3Grid[row]![col3] = 'piece';
      board3Sequence.push({
        position: { row, col: col3 },
        type: 'piece',
        order: order3++,
      });
    }

    // Place piece at trap row
    board3Grid[trapRow]![col3] = 'piece';
    board3Sequence.push({
      position: { row: trapRow, col: col3 },
      type: 'piece',
      order: order3++,
    });

    // Add traps on both sides at trap row
    if (col3 > 0) {
      board3Grid[trapRow]![col3 - 1] = 'trap';
      board3Sequence.push({
        position: { row: trapRow, col: col3 - 1 },
        type: 'trap',
        order: order3++,
      });
    }
    if (col3 < boardSize - 1) {
      board3Grid[trapRow]![col3 + 1] = 'trap';
      board3Sequence.push({
        position: { row: trapRow, col: col3 + 1 },
        type: 'trap',
        order: order3++,
      });
    }

    // Continue to top
    for (let row = trapRow - 1; row >= 0; row--) {
      board3Grid[row]![col3] = 'piece';
      board3Sequence.push({
        position: { row, col: col3 },
        type: 'piece',
        order: order3++,
      });
    }

    board3Sequence.push({
      position: { row: -1, col: col3 },
      type: 'final',
      order: order3,
    });

    boards.push({
      id: uuidv4(),
      name: `${opponentName} Board 3`,
      boardSize,
      grid: board3Grid,
      sequence: board3Sequence,
      thumbnail: '',
      createdAt: now + 2,
    });
  }

  return boards;
}

/**
 * Generate CPU deck for any board size
 * Creates a 10-board deck cycling through the provided boards
 *
 * @param opponentName - Name of the opponent
 * @param boardSize - Size of the boards
 * @param boards - Array of boards to cycle through
 * @returns Deck with 10 boards
 */
export function generateCpuDeckForSize(
  opponentName: string,
  boardSize: number,
  boards: Board[]
): Deck {
  if (boards.length === 0) {
    throw new Error('Need at least 1 board to create deck');
  }

  const deckBoards: Board[] = [];
  for (let i = 0; i < 10; i++) {
    deckBoards.push(boards[i % boards.length]!);
  }

  return {
    id: `cpu-deck-${boardSize}x${boardSize}-${Date.now()}`,
    name: `${opponentName} ${boardSize}×${boardSize} Deck`,
    boards: deckBoards,
    createdAt: Date.now(),
  };
}
