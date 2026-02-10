/**
 * Core game rules and constants
 */

export const GAME_RULES = {
  BOARD_SIZE: 2, // 2x2 grid
  TOTAL_ROUNDS: 5,
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
export const CPU_OPPONENT_NAME = 'CPU Sam';

export const CPU_TOUGHER_OPPONENT_ID = 'cpu-tougher-opponent';
export const CPU_TOUGHER_OPPONENT_NAME = 'CPU Tougher';

/**
 * AI Agent skill level definitions
 */
export const AI_AGENT_SKILL_LEVELS = {
  beginner: {
    emoji: '🐣',
    defaultName: 'Pip',
    color: '#8FBC8F',
    label: 'Beginner',
  },
  beginner_plus: {
    emoji: '🐤',
    defaultName: 'Pebble',
    color: '#5F9EA0',
    label: 'Beginner+',
  },
  intermediate: {
    emoji: '🦊',
    defaultName: 'Scout',
    color: '#9B8EC4',
    label: 'Intermediate',
  },
  intermediate_plus: {
    emoji: '🦉',
    defaultName: 'Sage',
    color: '#6B8DAD',
    label: 'Intermediate+',
  },
  advanced: {
    emoji: '🐺',
    defaultName: 'Fang',
    color: '#C4A35A',
    label: 'Advanced',
  },
  advanced_plus: {
    emoji: '🐉',
    defaultName: 'Ember',
    color: '#8B7355',
    label: 'Advanced+',
  },
} as const;
