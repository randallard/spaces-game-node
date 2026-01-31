/**
 * Spaces Game Engine
 *
 * Standalone game simulation package for RL/ML training
 *
 * @example
 * ```typescript
 * import { simulateRound, type Board } from 'spaces-game-engine';
 *
 * const playerBoard: Board = {
 *   boardSize: 2,
 *   grid: [['piece', 'empty'], ['trap', 'piece']],
 *   sequence: [
 *     { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
 *     { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
 *     { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
 *     { position: { row: -1, col: 0 }, type: 'final', order: 4 }
 *   ]
 * };
 *
 * const result = simulateRound(1, playerBoard, opponentBoard);
 * console.log(result.winner, result.playerPoints, result.opponentPoints);
 * ```
 */

// Export all types
export type {
  Board,
  NamedBoard,
  BoardMove,
  BoardSize,
  CellContent,
  Position,
  RoundResult,
  GameResult,
  ObservationMode,
  PerfectObservation,
  FogOfWarObservation,
  Observation,
} from './types';

export {
  isValidBoardSize,
  MIN_BOARD_SIZE,
  MAX_BOARD_SIZE,
} from './types';

// Export simulation functions
export {
  simulateRound,
  simulateMultipleRounds,
  isBoardPlayable,
} from './simulation';
