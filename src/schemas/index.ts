/**
 * Central export for all Zod schemas
 */

// Board schemas
export {
  BoardSchema,
  BoardMoveSchema,
  CellContentSchema,
  PositionSchema,
  validateBoardHasOnePiece,
  validateBoardTrapCount,
} from './board.schema';

// Opponent schemas
export {
  OpponentSchema,
  OpponentTypeSchema,
  OpponentStatsSchema,
} from './opponent.schema';

// User schemas
export {
  UserProfileSchema,
  OpponentStatsMapSchema,
} from './user.schema';

// Game state schemas
export {
  GameStateSchema,
  GamePhaseSchema,
  RoundResultSchema,
  UrlPayloadSchema,
} from './game-state.schema';

// Deck schemas
export { DeckSchema, GameModeSchema } from './deck.schema';
