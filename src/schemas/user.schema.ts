/**
 * Zod schemas for user validation
 */

import { z } from 'zod';
import { BoardSchema } from './board.schema';
import { OpponentSchema } from './opponent.schema';

export const UserStatsSchema = z.object({
  totalGames: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  ties: z.number().int().min(0),
});

export const UserPreferencesSchema = z.object({
  showCompleteRoundResults: z.boolean().optional(),
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  createdAt: z.number().int().positive(),
  stats: UserStatsSchema,
  preferences: UserPreferencesSchema.optional(),
  greeting: z.string().max(200).optional(),
  savedBoards: z.array(BoardSchema).optional(),
  opponents: z.array(OpponentSchema).optional(),
  playerCreature: z.string().optional(),
  opponentCreature: z.string().optional(),
});

export const OpponentStatsMapSchema = z.record(
  z.string(),
  z.object({
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  })
);
