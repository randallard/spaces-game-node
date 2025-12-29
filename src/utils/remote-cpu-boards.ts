/**
 * Remote CPU board fetching utilities
 * @module utils/remote-cpu-boards
 */

import type { Board, BoardSize, CellContent, BoardMove } from '@/types';

/**
 * Base URL for remote CPU boards (GitHub Pages)
 */
const REMOTE_CPU_BASE_URL = 'https://randallard.github.io/spaces-game-cpu-boards';

/**
 * Security limits for remote board fetching
 */
const LIMITS = {
  MAX_RESPONSE_SIZE: 10 * 1024 * 1024, // 10MB max response size
  MAX_BOARDS_PER_SIZE: 100, // Max 100 boards per size
  MAX_SEQUENCE_LENGTH: 500, // Max 500 moves per board
  MAX_THUMBNAIL_SIZE: 100 * 1024, // 100KB max thumbnail
  MAX_STRING_LENGTH: 1000, // Max length for name/id strings
  MIN_BOARD_SIZE: 2,
  MAX_BOARD_SIZE: 10,
} as const;

/**
 * Valid cell content types
 */
const VALID_CELL_TYPES: readonly CellContent[] = [
  'empty',
  'piece',
  'trap',
  'final',
] as const;

/**
 * Valid move types
 */
const VALID_MOVE_TYPES: readonly ('piece' | 'trap' | 'final')[] = [
  'piece',
  'trap',
  'final',
] as const;

/**
 * Validate a single board object for security and correctness
 */
function validateBoard(board: unknown, expectedSize: number): board is Board {
  if (typeof board !== 'object' || board === null) {
    return false;
  }

  const b = board as Partial<Board>;

  // Validate basic properties
  if (
    typeof b.id !== 'string' ||
    typeof b.name !== 'string' ||
    typeof b.boardSize !== 'number' ||
    typeof b.thumbnail !== 'string' ||
    typeof b.createdAt !== 'number' ||
    !Array.isArray(b.grid) ||
    !Array.isArray(b.sequence)
  ) {
    return false;
  }

  // Validate string lengths to prevent memory attacks
  if (b.id.length > LIMITS.MAX_STRING_LENGTH || b.name.length > LIMITS.MAX_STRING_LENGTH) {
    console.warn(`Board ${b.id} rejected: string too long`);
    return false;
  }

  // Validate thumbnail size
  if (b.thumbnail.length > LIMITS.MAX_THUMBNAIL_SIZE) {
    console.warn(`Board ${b.id} rejected: thumbnail too large (${b.thumbnail.length} bytes)`);
    return false;
  }

  // Validate board size matches expected size
  if (b.boardSize !== expectedSize) {
    console.warn(`Board ${b.id} rejected: size mismatch (expected ${expectedSize}, got ${b.boardSize})`);
    return false;
  }

  // Validate board size is within allowed range
  if (b.boardSize < LIMITS.MIN_BOARD_SIZE || b.boardSize > LIMITS.MAX_BOARD_SIZE) {
    console.warn(`Board ${b.id} rejected: size out of range (${b.boardSize})`);
    return false;
  }

  // Validate grid dimensions
  if (b.grid.length !== b.boardSize) {
    console.warn(`Board ${b.id} rejected: grid height mismatch`);
    return false;
  }

  // Validate each row and cell
  for (let i = 0; i < b.grid.length; i++) {
    const row = b.grid[i];
    if (!Array.isArray(row) || row.length !== b.boardSize) {
      console.warn(`Board ${b.id} rejected: grid row ${i} length mismatch`);
      return false;
    }

    // Validate cell contents
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (!VALID_CELL_TYPES.includes(cell as CellContent)) {
        console.warn(`Board ${b.id} rejected: invalid cell type at [${i}][${j}]: ${cell}`);
        return false;
      }
    }
  }

  // Validate sequence length
  if (b.sequence.length > LIMITS.MAX_SEQUENCE_LENGTH) {
    console.warn(`Board ${b.id} rejected: sequence too long (${b.sequence.length})`);
    return false;
  }

  // Validate each move in sequence
  for (let i = 0; i < b.sequence.length; i++) {
    const move = b.sequence[i] as Partial<BoardMove>;

    if (
      typeof move !== 'object' ||
      move === null ||
      typeof move.position !== 'object' ||
      move.position === null ||
      typeof move.position.row !== 'number' ||
      typeof move.position.col !== 'number' ||
      typeof move.type !== 'string' ||
      typeof move.order !== 'number'
    ) {
      console.warn(`Board ${b.id} rejected: invalid move at index ${i}`);
      return false;
    }

    // Validate move coordinates
    // For "final" moves, row can be -1 (exit position)
    // For other moves, coordinates must be within board bounds
    if (move.type === 'final') {
      // Final move should be at row -1, col within board bounds
      if (move.position.row !== -1 || move.position.col < 0 || move.position.col >= b.boardSize) {
        console.warn(`Board ${b.id} rejected: final move must be at row -1 with valid column at index ${i}`);
        return false;
      }
    } else {
      // Regular moves (piece/trap) must be within board bounds
      if (
        move.position.row < 0 ||
        move.position.row >= b.boardSize ||
        move.position.col < 0 ||
        move.position.col >= b.boardSize
      ) {
        console.warn(`Board ${b.id} rejected: move coordinates out of bounds at index ${i}`);
        return false;
      }
    }

    // Validate move type
    if (!VALID_MOVE_TYPES.includes(move.type as typeof VALID_MOVE_TYPES[number])) {
      console.warn(`Board ${b.id} rejected: invalid move type at index ${i}: ${move.type}`);
      return false;
    }

    // Validate order is a positive integer
    if (!Number.isInteger(move.order) || move.order < 1) {
      console.warn(`Board ${b.id} rejected: invalid order at index ${i}: ${move.order}`);
      return false;
    }
  }

  // Validate timestamp is reasonable (not negative, not too far in future)
  const now = Date.now();
  const oneYearInFuture = now + 365 * 24 * 60 * 60 * 1000;
  if (b.createdAt < 0 || b.createdAt > oneYearInFuture) {
    console.warn(`Board ${b.id} rejected: invalid timestamp ${b.createdAt}`);
    return false;
  }

  return true;
}

/**
 * Fetch boards for a specific size from remote CPU server
 * @param boardSize - The size of boards to fetch (2-10)
 * @returns Promise resolving to array of boards, or empty array on error
 */
export async function fetchRemoteCpuBoards(boardSize: BoardSize): Promise<Board[]> {
  try {
    // Validate boardSize parameter to prevent path traversal
    if (
      !Number.isInteger(boardSize) ||
      boardSize < LIMITS.MIN_BOARD_SIZE ||
      boardSize > LIMITS.MAX_BOARD_SIZE
    ) {
      console.error(`[fetchRemoteCpuBoards] Invalid board size requested: ${boardSize}`);
      return [];
    }

    const url = `${REMOTE_CPU_BASE_URL}/boards/${boardSize}x${boardSize}.json`;
    console.log(`[fetchRemoteCpuBoards] Fetching from: ${url}`);

    // Fetch with timeout and size limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    console.log(`[fetchRemoteCpuBoards] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Failed to fetch remote CPU boards: ${response.status} ${response.statusText}`);
      return [];
    }

    // Check content length before parsing
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > LIMITS.MAX_RESPONSE_SIZE) {
      console.error(`Response too large: ${contentLength} bytes`);
      return [];
    }

    const data = await response.json();

    // Validate the response is an array
    if (!Array.isArray(data)) {
      console.error('Remote CPU boards response is not an array');
      return [];
    }

    // Enforce maximum number of boards
    if (data.length > LIMITS.MAX_BOARDS_PER_SIZE) {
      console.warn(`Response contains ${data.length} boards, limiting to ${LIMITS.MAX_BOARDS_PER_SIZE}`);
      data.length = LIMITS.MAX_BOARDS_PER_SIZE;
    }

    // Validate each board with comprehensive security checks
    const validBoards = data.filter((board: unknown): board is Board =>
      validateBoard(board, boardSize)
    );

    console.log(`[fetchRemoteCpuBoards] Validated ${validBoards.length}/${data.length} boards for ${boardSize}×${boardSize}`);

    return validBoards;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[fetchRemoteCpuBoards] Fetch timeout: Request took too long');
    } else if (error instanceof Error) {
      console.error('[fetchRemoteCpuBoards] Error fetching remote CPU boards:', error.message, error);
    } else {
      console.error('[fetchRemoteCpuBoards] Unknown error:', error);
    }
    return [];
  }
}

/**
 * Check if remote CPU boards are available (can connect to server)
 * @returns Promise resolving to true if server is reachable
 */
export async function checkRemoteCpuAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${REMOTE_CPU_BASE_URL}/health.json`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}
