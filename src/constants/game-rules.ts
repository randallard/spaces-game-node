/**
 * Core game rules and constants
 */

export const GAME_RULES = {
  BOARD_SIZE: 2, // 2x2 grid
  TOTAL_ROUNDS: 8,
  MIN_BOARDS_TO_START: 1, // Minimum saved boards to start a game
} as const;

export const CELL_CONTENT = {
  EMPTY: 'empty',
  PIECE: 'piece',
  TRAP: 'trap',
  FINAL: 'final', // Goal reached marker (in sequence, not in grid)
} as const;

export const OPPONENT_TYPE = {
  HUMAN: 'human',
  CPU: 'cpu',
} as const;

export const CPU_OPPONENT_ID = 'cpu-opponent';
export const CPU_OPPONENT_NAME = 'CPU';
