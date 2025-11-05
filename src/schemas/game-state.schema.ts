/**
 * Zod schemas for game state validation
 */

import { z } from 'zod';
import { BoardSchema } from './board.schema';
import { OpponentSchema } from './opponent.schema';
import { UserProfileSchema } from './user.schema';

export const RoundResultSchema = z.object({
  round: z.number().int().min(1).max(8),
  winner: z.enum(['player', 'opponent', 'tie']),
  playerBoard: BoardSchema,
  opponentBoard: BoardSchema,
  playerFinalPosition: z.object({
    row: z.number().int().min(0).max(1),
    col: z.number().int().min(0).max(1),
  }),
  opponentFinalPosition: z.object({
    row: z.number().int().min(0).max(1),
    col: z.number().int().min(0).max(1),
  }),
  // Optional fields for backward compatibility
  playerPoints: z.number().int().min(0).optional(),
  opponentPoints: z.number().int().min(0).optional(),
  playerOutcome: z.enum(['won', 'lost', 'tie']).optional(),
  simulationDetails: z.object({
    playerMoves: z.number().int().min(0),
    opponentMoves: z.number().int().min(0),
    playerHitTrap: z.boolean(),
    opponentHitTrap: z.boolean(),
  }).optional(),
});

export const GamePhaseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user-setup') }),
  z.object({ type: z.literal('opponent-selection') }),
  z.object({
    type: z.literal('board-selection'),
    round: z.number().int().min(1).max(8),
  }),
  z.object({
    type: z.literal('waiting-for-opponent'),
    round: z.number().int().min(1).max(8),
  }),
  z.object({
    type: z.literal('round-results'),
    round: z.number().int().min(1).max(8),
    result: RoundResultSchema,
  }),
  z.object({
    type: z.literal('game-over'),
    winner: z.enum(['player', 'opponent', 'tie']),
  }),
]);

export const GameStateSchema = z.object({
  phase: GamePhaseSchema,
  user: UserProfileSchema,
  opponent: OpponentSchema.nullable(),
  currentRound: z.number().int().min(0).max(8),
  playerScore: z.number().int().min(0),
  opponentScore: z.number().int().min(0),
  playerSelectedBoard: BoardSchema.nullable(),
  opponentSelectedBoard: BoardSchema.nullable(),
  roundHistory: z.array(RoundResultSchema),
  checksum: z.string(),
});

/**
 * URL payload schemas for hash fragment communication
 */
export const UrlPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('delta'),
    changes: GameStateSchema.partial(),
  }),
  z.object({
    type: z.literal('full_state'),
    state: GameStateSchema,
  }),
  z.object({
    type: z.literal('resync_request'),
    requestId: z.string(),
  }),
]);
