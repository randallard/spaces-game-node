/**
 * Zod schemas for board validation
 */

import { z } from 'zod';

export const CellContentSchema = z.enum(['empty', 'piece', 'trap', 'final']);

export const PositionSchema = z.object({
  row: z.number().int().min(-1).max(1), // 2x2 grid (0-1), -1 for final moves (off the board)
  col: z.number().int().min(0).max(1),
});

export const BoardMoveSchema = z.object({
  position: PositionSchema,
  type: z.enum(['piece', 'trap', 'final']),
  order: z.number().int().positive(),
});

export const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  grid: z.array(z.array(CellContentSchema).length(2)).length(2), // 2x2 grid
  sequence: z.array(BoardMoveSchema).min(1), // At least one move
  thumbnail: z.string(), // SVG data URI
  createdAt: z.number().int().positive(),
});

/**
 * Validates board has exactly one piece
 */
export function validateBoardHasOnePiece(board: z.infer<typeof BoardSchema>): boolean {
  let pieceCount = 0;
  for (const row of board.grid) {
    for (const cell of row) {
      if (cell === 'piece') pieceCount++;
    }
  }
  return pieceCount === 1;
}

/**
 * Validates board has 0-3 traps
 */
export function validateBoardTrapCount(board: z.infer<typeof BoardSchema>): boolean {
  let trapCount = 0;
  for (const row of board.grid) {
    for (const cell of row) {
      if (cell === 'trap') trapCount++;
    }
  }
  return trapCount >= 0 && trapCount <= 3;
}
