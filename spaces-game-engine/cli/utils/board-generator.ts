import fs from 'fs/promises';
import path from 'path';
import type { Board, BoardMove } from '../../src/types/board.js';
import { validateBoard } from './validation.js';

/**
 * Cache format for generated boards
 */
type BoardCache = {
  size: number;
  limit: number;
  count: number;
  timestamp: string;
  boards: Board[];
};

/**
 * State for board generation with backtracking
 */
type GenerationState = {
  currentRow: number;
  currentCol: number;
  sequence: BoardMove[];
  visitedCells: Set<string>;
  placedTraps: Set<string>;
  lastMoveWasTrap: boolean;
  reachedRowZero: boolean;
};

/**
 * Get cache file path for a given size and limit
 */
function getCacheFilePath(size: number, limit: number): string {
  return `/tmp/spaces-game-boards-size-${size}-limit-${limit}.json`;
}

/**
 * Load boards from cache if available
 */
async function loadFromCache(size: number, limit: number): Promise<Board[] | null> {
  const cachePath = getCacheFilePath(size, limit);

  try {
    const content = await fs.readFile(cachePath, 'utf-8');
    const cache = JSON.parse(content) as BoardCache;

    // Validate cache
    if (cache.size === size && cache.limit === limit && Array.isArray(cache.boards)) {
      return cache.boards;
    }
  } catch (error) {
    // Cache doesn't exist or is invalid
    return null;
  }

  return null;
}

/**
 * Save boards to cache
 */
async function saveToCache(size: number, limit: number, boards: Board[]): Promise<void> {
  const cachePath = getCacheFilePath(size, limit);

  const cache: BoardCache = {
    size,
    limit,
    count: boards.length,
    timestamp: new Date().toISOString(),
    boards,
  };

  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Convert sequence to grid representation
 */
function sequenceToGrid(sequence: BoardMove[], size: number): Board['grid'] {
  const grid: Board['grid'] = Array(size)
    .fill(null)
    .map(() => Array(size).fill('empty'));

  // First, mark all trap positions
  const trapPositions = new Set<string>();
  for (const move of sequence) {
    if (move.type === 'trap' && move.position.row >= 0 && move.position.row < size) {
      trapPositions.add(`${move.position.row},${move.position.col}`);
    }
  }

  // Then place pieces and traps
  for (const move of sequence) {
    if (move.position.row < 0 || move.position.row >= size) continue;

    const { row, col } = move.position;
    const key = `${row},${col}`;

    if (trapPositions.has(key)) {
      grid[row][col] = 'trap';
    } else if (move.type === 'piece' && grid[row][col] === 'empty') {
      grid[row][col] = 'piece';
    }
  }

  return grid;
}

/**
 * Create a complete board from sequence
 */
function createBoard(sequence: BoardMove[], size: number): Board {
  return {
    boardSize: size,
    grid: sequenceToGrid(sequence, size),
    sequence,
  };
}

/**
 * Generate all possible boards using depth-first search with backtracking
 */
function generateAllBoardsRecursive(
  state: GenerationState,
  size: number,
  startCol: number,
  boards: Board[],
  limit: number,
  progressCallback?: (count: number) => void
): void {
  // Check if we've reached the limit
  if (boards.length >= limit) {
    return;
  }

  const { currentRow, currentCol, sequence, visitedCells, placedTraps, lastMoveWasTrap, reachedRowZero } = state;

  // Base case: reached goal (row -1)
  if (currentRow === -1) {
    // Add final move and create board
    const finalSequence: BoardMove[] = [
      ...sequence,
      {
        position: { row: -1, col: currentCol },
        type: 'final',
        order: sequence.length + 1,
      },
    ];

    const board = createBoard(finalSequence, size);

    // Validate the board
    const validation = validateBoard(board);
    if (validation.valid) {
      boards.push(board);

      if (progressCallback && boards.length % 50 === 0) {
        progressCallback(boards.length);
      }
    }

    return;
  }

  // If we reached row 0, we must move to goal next
  if (reachedRowZero) {
    generateAllBoardsRecursive(
      {
        currentRow: -1,
        currentCol,
        sequence,
        visitedCells,
        placedTraps,
        lastMoveWasTrap: false,
        reachedRowZero: true,
      },
      size,
      startCol,
      boards,
      limit,
      progressCallback
    );
    return;
  }

  // After a supermove, we must move the piece
  if (lastMoveWasTrap) {
    // Try all valid piece moves
    const moves = [
      { row: currentRow - 1, col: currentCol, name: 'up' }, // forward
      { row: currentRow, col: currentCol - 1, name: 'left' }, // horizontal
      { row: currentRow, col: currentCol + 1, name: 'right' }, // horizontal
    ];

    for (const move of moves) {
      if (boards.length >= limit) break;

      // Check if move is valid
      if (move.row < 0 || move.row >= size || move.col < 0 || move.col >= size) {
        continue;
      }

      const cellKey = `${move.row},${move.col}`;
      if (visitedCells.has(cellKey)) {
        continue;
      }

      // Create new state
      const newVisitedCells = new Set(visitedCells);
      newVisitedCells.add(cellKey);

      const newSequence: BoardMove[] = [
        ...sequence,
        {
          position: { row: move.row, col: move.col },
          type: 'piece',
          order: sequence.length + 1,
        },
      ];

      generateAllBoardsRecursive(
        {
          currentRow: move.row,
          currentCol: move.col,
          sequence: newSequence,
          visitedCells: newVisitedCells,
          placedTraps,
          lastMoveWasTrap: false,
          reachedRowZero: move.row === 0,
        },
        size,
        startCol,
        boards,
        limit,
        progressCallback
      );
    }

    return;
  }

  // Regular move: try piece moves and trap placements

  // 1. Try piece moves (forward and horizontal)
  const pieceMoves = [
    { row: currentRow - 1, col: currentCol, name: 'up' }, // forward
    { row: currentRow, col: currentCol - 1, name: 'left' }, // horizontal
    { row: currentRow, col: currentCol + 1, name: 'right' }, // horizontal
  ];

  for (const move of pieceMoves) {
    if (boards.length >= limit) break;

    // Check if move is valid
    if (move.row < -1 || move.col < 0 || move.col >= size) {
      continue;
    }

    // If moving to row -1, that's the goal
    if (move.row === -1) {
      generateAllBoardsRecursive(
        {
          currentRow: -1,
          currentCol: move.col,
          sequence,
          visitedCells,
          placedTraps,
          lastMoveWasTrap: false,
          reachedRowZero: true,
        },
        size,
        startCol,
        boards,
        limit,
        progressCallback
      );
      continue;
    }

    if (move.row >= size) {
      continue;
    }

    const cellKey = `${move.row},${move.col}`;
    if (visitedCells.has(cellKey)) {
      continue;
    }

    // Create new state
    const newVisitedCells = new Set(visitedCells);
    newVisitedCells.add(cellKey);

    const newSequence: BoardMove[] = [
      ...sequence,
      {
        position: { row: move.row, col: move.col },
        type: 'piece',
        order: sequence.length + 1,
      },
    ];

    generateAllBoardsRecursive(
      {
        currentRow: move.row,
        currentCol: move.col,
        sequence: newSequence,
        visitedCells: newVisitedCells,
        placedTraps,
        lastMoveWasTrap: false,
        reachedRowZero: move.row === 0,
      },
      size,
      startCol,
      boards,
      limit,
      progressCallback
    );
  }

  // 2. Try trap placements (adjacent and supermove, but not behind)
  // No traps allowed at row 0
  if (currentRow > 0) {
    const trapMoves = [
      { row: currentRow - 1, col: currentCol, name: 'up' }, // forward
      { row: currentRow, col: currentCol - 1, name: 'left' }, // adjacent
      { row: currentRow, col: currentCol + 1, name: 'right' }, // adjacent
      { row: currentRow, col: currentCol, name: 'supermove' }, // supermove
    ];

    for (const move of trapMoves) {
      if (boards.length >= limit) break;

      // Check if position is valid
      if (move.row < 0 || move.row >= size || move.col < 0 || move.col >= size) {
        continue;
      }

      // No traps allowed at row 0
      if (move.row === 0) {
        continue;
      }

      // Check if trap already placed at this position
      const trapKey = `${move.row},${move.col}`;
      if (placedTraps.has(trapKey)) {
        continue;
      }

      // Create new state with trap
      const newPlacedTraps = new Set(placedTraps);
      newPlacedTraps.add(trapKey);

      const newSequence: BoardMove[] = [
        ...sequence,
        {
          position: { row: move.row, col: move.col },
          type: 'trap',
          order: sequence.length + 1,
        },
      ];

      generateAllBoardsRecursive(
        {
          currentRow,
          currentCol,
          sequence: newSequence,
          visitedCells,
          placedTraps: newPlacedTraps,
          lastMoveWasTrap: true, // Next move must be piece movement
          reachedRowZero: false,
        },
        size,
        startCol,
        boards,
        limit,
        progressCallback
      );
    }
  }
}

/**
 * Estimate the search space size for a given board size
 * This is a rough approximation
 */
export function estimateSearchSpace(size: number): number {
  // Very rough estimate based on empirical observations:
  // - Size 2: ~10-50 boards
  // - Size 3: ~500-2000 boards
  // - Size 4: ~10,000-50,000 boards
  // - Size 5: ~500,000+ boards

  // Exponential growth with base around 10-20
  const base = 15;
  return Math.floor(Math.pow(base, size - 1));
}

/**
 * Generate all possible legal opponent boards for a given size
 * Uses exhaustive depth-first search with backtracking
 *
 * @param size - Board size
 * @param limit - Maximum number of boards to generate (default 500)
 * @param progressCallback - Optional callback for progress updates
 * @returns Array of valid boards
 */
export function generateAllBoards(
  size: number,
  limit: number = 500,
  progressCallback?: (count: number) => void
): Board[] {
  const boards: Board[] = [];

  // Distribute limit across starting columns to ensure variety
  const limitPerColumn = Math.ceil(limit / size);

  // Generate boards for each starting column
  for (let startCol = 0; startCol < size; startCol++) {
    const columnBoards: Board[] = [];

    // Starting position (bottom row)
    const startRow = size - 1;
    const initialState: GenerationState = {
      currentRow: startRow,
      currentCol: startCol,
      sequence: [
        {
          position: { row: startRow, col: startCol },
          type: 'piece',
          order: 1,
        },
      ],
      visitedCells: new Set([`${startRow},${startCol}`]),
      placedTraps: new Set(),
      lastMoveWasTrap: false,
      reachedRowZero: false,
    };

    generateAllBoardsRecursive(initialState, size, startCol, columnBoards, limitPerColumn, progressCallback);

    // Add boards from this column to total
    boards.push(...columnBoards);

    // Stop if we've exceeded the total limit
    if (boards.length >= limit) {
      break;
    }
  }

  // Trim to exact limit if we went over
  if (boards.length > limit) {
    return boards.slice(0, limit);
  }

  return boards;
}

/**
 * Generate boards using smart sampling for large sizes
 * For sizes where exhaustive generation is impractical
 *
 * @param size - Board size
 * @param limit - Number of boards to generate
 * @param progressCallback - Optional callback for progress updates
 * @returns Array of valid boards
 */
export function generateBoardsWithSampling(
  size: number,
  limit: number,
  progressCallback?: (count: number) => void
): Board[] {
  // For now, use the same exhaustive generation but with a hard limit
  // In the future, this could be optimized with smarter sampling strategies
  return generateAllBoards(size, limit, progressCallback);
}

/**
 * Generate boards with caching
 * Checks cache first, generates if needed
 *
 * @param size - Board size
 * @param limit - Maximum number of boards to generate
 * @param force - Force regeneration even if cache exists
 * @param progressCallback - Optional callback for progress updates
 * @returns Array of valid boards
 */
export async function generateBoardsWithCache(
  size: number,
  limit: number = 500,
  force: boolean = false,
  progressCallback?: (count: number) => void
): Promise<Board[]> {
  // Check cache first
  if (!force) {
    const cachedBoards = await loadFromCache(size, limit);
    if (cachedBoards) {
      return cachedBoards;
    }
  }

  // Generate boards
  const boards = size <= 5 ? generateAllBoards(size, limit, progressCallback) : generateBoardsWithSampling(size, limit, progressCallback);

  // Save to cache
  await saveToCache(size, limit, boards);

  return boards;
}

/**
 * Check if cache exists for given size and limit
 */
export async function cacheExists(size: number, limit: number): Promise<boolean> {
  const cachePath = getCacheFilePath(size, limit);
  try {
    await fs.access(cachePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cache info
 */
export async function getCacheInfo(size: number, limit: number): Promise<BoardCache | null> {
  const cachePath = getCacheFilePath(size, limit);

  try {
    const content = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(content) as BoardCache;
  } catch {
    return null;
  }
}
