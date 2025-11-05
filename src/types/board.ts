/**
 * Board-related types
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

export type Board = {
  id: string; // UUID
  name: string;
  grid: CellContent[][]; // 2x2 grid
  sequence: BoardMove[]; // Ordered list of moves
  thumbnail: string; // SVG data URI
  createdAt: number; // timestamp
};

/**
 * Grid utilities
 */
export type GridSize = {
  rows: number;
  cols: number;
};
