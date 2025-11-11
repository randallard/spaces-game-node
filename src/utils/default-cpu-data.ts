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

/**
 * Generate CPU boards dynamically for any board size
 * Creates 4 playable boards for the specified opponent and size
 *
 * @param opponentName - Name of the opponent (used in board names)
 * @param boardSize - Size of the board (2-99)
 * @param isTougher - Whether this is for CPU Tougher (includes traps)
 * @returns Array of 4 boards for the specified size
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

  // Board 1: Straight up left column
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
    name: `${opponentName} Board 1`,
    boardSize,
    grid: board1Grid,
    sequence: board1Sequence,
    thumbnail: '',
    createdAt: now,
  });

  // Board 2: Straight up right column
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
    name: `${opponentName} Board 2`,
    boardSize,
    grid: board2Grid,
    sequence: board2Sequence,
    thumbnail: '',
    createdAt: now + 1,
  });

  // Board 3: Straight up middle column (or column 1 if size is 2)
  const middleCol = boardSize === 2 ? 1 : Math.floor(boardSize / 2);
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
    name: `${opponentName} Board 3`,
    boardSize,
    grid: board3Grid,
    sequence: board3Sequence,
    thumbnail: '',
    createdAt: now + 2,
  });

  // Board 4: Diagonal or L-shaped path (with optional trap for CPU Tougher)
  const board4Grid = createEmptyGrid();
  const board4Sequence: Board['sequence'] = [];
  let order = 1;

  // Start at bottom-left
  board4Grid[boardSize - 1]![0] = 'piece';
  board4Sequence.push({
    position: { row: boardSize - 1, col: 0 },
    type: 'piece',
    order: order++,
  });

  // If CPU Tougher, add a trap
  if (isTougher && boardSize > 2) {
    const trapCol = Math.floor(boardSize / 2);
    board4Grid[boardSize - 1]![trapCol] = 'trap';
    board4Sequence.push({
      position: { row: boardSize - 1, col: trapCol },
      type: 'trap',
      order: order++,
    });
  }

  // Move to top-right corner in diagonal steps
  let currentRow = boardSize - 1;
  let currentCol = 0;
  const targetCol = boardSize - 1;

  // First move horizontally to target column
  while (currentCol < targetCol) {
    currentCol++;
    board4Grid[currentRow]![currentCol] = 'piece';
    board4Sequence.push({
      position: { row: currentRow, col: currentCol },
      type: 'piece',
      order: order++,
    });
  }

  // Then move vertically to top
  while (currentRow > 0) {
    currentRow--;
    board4Grid[currentRow]![currentCol] = 'piece';
    board4Sequence.push({
      position: { row: currentRow, col: currentCol },
      type: 'piece',
      order: order++,
    });
  }

  // Add final goal
  board4Sequence.push({
    position: { row: -1, col: targetCol },
    type: 'final',
    order: order,
  });

  boards.push({
    id: uuidv4(),
    name: `${opponentName} Board 4`,
    boardSize,
    grid: board4Grid,
    sequence: board4Sequence,
    thumbnail: '',
    createdAt: now + 3,
  });

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
