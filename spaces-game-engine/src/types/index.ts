/**
 * Central export for all game engine types
 */

// Board types
export type {
  Board,
  NamedBoard,
  BoardMove,
  BoardSize,
  CellContent,
  Position,
} from './board';

export {
  isValidBoardSize,
  MIN_BOARD_SIZE,
  MAX_BOARD_SIZE,
} from './board';

// Game result types
export type {
  RoundResult,
  GameResult,
  ObservationMode,
  PerfectObservation,
  FogOfWarObservation,
  Observation,
} from './game';
