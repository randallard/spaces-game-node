/**
 * Core board types for Spaces Game engine
 * Minimal set needed for game simulation
 */

export type CellContent = 'empty' | 'piece' | 'trap' | 'final';

export type Position = {
  row: number;
  col: number;
};

export type BoardMove = {
  position: Position;
  type: 'piece' | 'trap' | 'final'; // 'final' = goal reached (top row)
  order: number; // Sequence order (1, 2, 3, etc.)
};

export type BoardSize = number;

// Board size constraints
export const MIN_BOARD_SIZE = 2;
export const MAX_BOARD_SIZE = 99;

/**
 * Validate board size
 */
export function isValidBoardSize(size: number): boolean {
  return Number.isInteger(size) && size >= MIN_BOARD_SIZE && size <= MAX_BOARD_SIZE;
}

/**
 * Board definition
 * Note: Removed UI-specific fields (id, name, thumbnail, createdAt)
 * These are not needed for simulation
 */
export type Board = {
  boardSize: BoardSize; // Grid size (2x2, 3x3, etc.)
  grid: CellContent[][]; // NxN grid
  sequence: BoardMove[]; // Ordered list of moves
};

/**
 * Optional: Board with metadata (for human-readable logs)
 */
export type NamedBoard = Board & {
  name?: string;
};
