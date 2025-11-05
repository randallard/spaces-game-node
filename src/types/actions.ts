/**
 * Action types for game state reducer
 * Using discriminated unions for type-safe dispatch
 */

import type { Board, Opponent, RoundResult } from './index';

export type GameAction =
  | { type: 'SET_USER_NAME'; name: string }
  | { type: 'SET_USER_GREETING'; greeting: string }
  | { type: 'ADD_BOARD'; board: Board }
  | { type: 'DELETE_BOARD'; boardId: string }
  | { type: 'ADD_OPPONENT'; opponent: Opponent }
  | { type: 'DELETE_OPPONENT'; opponentId: string }
  | { type: 'SELECT_OPPONENT'; opponent: Opponent }
  | { type: 'SELECT_PLAYER_BOARD'; board: Board }
  | { type: 'SELECT_OPPONENT_BOARD'; board: Board }
  | { type: 'START_ROUND'; round: number }
  | { type: 'COMPLETE_ROUND'; result: RoundResult }
  | { type: 'NEXT_ROUND' }
  | { type: 'END_GAME'; winner: 'player' | 'opponent' | 'tie' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; state: import('./game-state').GameState }
  | { type: 'UPDATE_OPPONENT_STATS'; opponentId: string; won: boolean };
