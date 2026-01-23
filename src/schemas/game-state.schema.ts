/**
 * Zod schemas for game state validation
 */

import { z } from 'zod';
import { BoardSchema } from './board.schema';
import { OpponentSchema } from './opponent.schema';
import { UserProfileSchema } from './user.schema';
import { DeckSchema, GameModeSchema } from './deck.schema';

export const RoundResultSchema = z.object({
  round: z.number().int().min(1).max(10), // Support up to 10 rounds for deck mode
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
  z.object({ type: z.literal('board-management') }),
  z.object({ type: z.literal('game-mode-selection') }),
  z.object({
    type: z.literal('board-size-selection'),
    gameMode: GameModeSchema,
  }),
  z.object({
    type: z.literal('opponent-selection'),
    gameMode: GameModeSchema,
  }),
  z.object({ type: z.literal('deck-management') }),
  z.object({ type: z.literal('deck-selection') }),
  z.object({
    type: z.literal('board-selection'),
    round: z.number().int().min(1).max(10), // Support 10 rounds for deck mode
  }),
  z.object({
    type: z.literal('waiting-for-opponent'),
    round: z.number().int().min(1).max(10),
  }),
  z.object({
    type: z.literal('round-results'),
    round: z.number().int().min(1).max(10),
    result: RoundResultSchema,
  }),
  z.object({
    type: z.literal('all-rounds-results'),
    results: z.array(RoundResultSchema),
  }),
  z.object({
    type: z.literal('game-over'),
    winner: z.enum(['player', 'opponent', 'tie']),
  }),
]);

export const GameStateSchema = z.object({
  user: UserProfileSchema,
  opponent: OpponentSchema.nullable(),
  gameId: z.string().nullable(),
  gameCreatorId: z.string().nullable(),
  gameMode: GameModeSchema.nullable(),
  boardSize: z.union([z.literal(2), z.literal(3)]).nullable(),
  playerSelectedDeck: DeckSchema.nullable(),
  opponentSelectedDeck: DeckSchema.nullable(),
  roundHistory: z.array(RoundResultSchema),
  phaseOverride: GamePhaseSchema.nullable(), // UI-only phase override (for phases that can't be derived)
  lastDiscordNotificationTime: z.string().nullable(),
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
