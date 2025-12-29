/**
 * Zod schemas for deck validation
 */

import { z } from 'zod';
import { BoardSchema } from './board.schema';

/**
 * Deck schema - validates 10-board decks
 */
export const DeckSchema = z.object({
  id: z.string().uuid('Deck ID must be a valid UUID'),
  name: z.string().min(1, 'Deck name is required').max(50, 'Deck name too long'),
  boards: z
    .array(BoardSchema)
    .length(10, 'Deck must contain exactly 10 boards')
    .refine((boards) => boards.every((board) => board !== null), {
      message: 'All 10 boards must be valid',
    }),
  createdAt: z.number().positive(),
});

/**
 * Game mode schema
 */
export const GameModeSchema = z.enum(['round-by-round', 'deck']);
