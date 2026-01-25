/**
 * Tests for state derivation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getBoardForRound,
  isRoundComplete,
  isRoundPartial,
  deriveCurrentRound,
  derivePlayerScore,
  deriveOpponentScore,
  deriveWinner,
  deriveWhoMovesFirst,
  derivePhase,
  derivePlayerSelectedBoard,
  deriveOpponentSelectedBoard,
} from './derive-state';
import type { GameState, RoundResult, Board } from '@/types';
import { GAME_RULES } from '@/constants/game-rules';

// Test board fixtures
const createTestBoard = (
  name: string,
  grid: Array<Array<'empty' | 'piece' | 'trap' | 'final'>>,
  sequence: Array<{ row: number; col: number; type: 'piece' | 'trap' | 'final' }>,
  boardSize: 2 | 3 = 2
): Board => ({
  id: `board-${name}`,
  name,
  boardSize,
  grid,
  sequence: sequence.map((s, index) => ({
    position: { row: s.row, col: s.col },
    type: s.type,
    order: index + 1,
  })),
  thumbnail: 'data:image/svg+xml;base64,test',
  createdAt: Date.now(),
});

const playerBoard1 = createTestBoard(
  'Player Board 1',
  [
    ['piece', 'empty'],
    ['empty', 'empty'],
  ],
  [{ row: 0, col: 0, type: 'piece' }]
);

const opponentBoard1 = createTestBoard(
  'Opponent Board 1',
  [
    ['empty', 'piece'],
    ['empty', 'empty'],
  ],
  [{ row: 0, col: 1, type: 'piece' }]
);

// Removed unused playerBoard2

// Create a complete round result
const createCompleteRoundResult = (round: number, playerBoard: Board, opponentBoard: Board): RoundResult => ({
  round,
  winner: 'player',
  playerBoard,
  opponentBoard,
  playerFinalPosition: { row: 0, col: 0 },
  opponentFinalPosition: { row: 0, col: 1 },
  playerPoints: 10,
  opponentPoints: 5,
  playerOutcome: 'won',
  simulationDetails: {
    playerMoves: 3,
    opponentMoves: 2,
    playerHitTrap: false,
    opponentHitTrap: false,
    playerLastStep: 0,
    opponentLastStep: 0,
  },
});

// Create a partial round result (only one board selected)
const createPartialRoundResult = (round: number, playerBoard: Board | null): RoundResult => ({
  round,
  winner: undefined as any,
  playerBoard: playerBoard as any,
  opponentBoard: null as any,
  playerFinalPosition: { row: 0, col: 0 },
  opponentFinalPosition: { row: 0, col: 0 },
  // Don't set playerPoints/opponentPoints - leave them undefined (optional)
});

// Create minimal game state for testing
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  phaseOverride: { type: 'user-setup' },
  user: {
    id: 'user-123',
    name: 'Test User',
    createdAt: Date.now(),
    playerCreature: 'square',
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    },
  },
  opponent: null,
  gameId: null,
  gameCreatorId: null,
  gameMode: null,
  boardSize: 2,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
  roundHistory: [],
  lastDiscordNotificationTime: null,
  checksum: '',
  ...overrides,
});

describe('getBoardForRound', () => {
  it('should return null for non-existent round', () => {
    const result = getBoardForRound([], 1, 'player');
    expect(result).toBeNull();
  });

  it('should return player board for round 1', () => {
    const history = [createCompleteRoundResult(1, playerBoard1, opponentBoard1)];
    const result = getBoardForRound(history, 1, 'player');
    expect(result).toEqual(playerBoard1);
  });

  it('should return opponent board for round 1', () => {
    const history = [createCompleteRoundResult(1, playerBoard1, opponentBoard1)];
    const result = getBoardForRound(history, 1, 'opponent');
    expect(result).toEqual(opponentBoard1);
  });

  it('should return null when player board not selected', () => {
    const history = [createPartialRoundResult(1, null)];
    const result = getBoardForRound(history, 1, 'player');
    expect(result).toBeNull();
  });
});

describe('isRoundComplete', () => {
  it('should return false for undefined result', () => {
    expect(isRoundComplete(undefined)).toBe(false);
  });

  it('should return true for complete round', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    expect(isRoundComplete(result)).toBe(true);
  });

  it('should return false for partial round (one board missing)', () => {
    const result = createPartialRoundResult(1, playerBoard1);
    expect(isRoundComplete(result)).toBe(false);
  });

  it('should return false when simulation not done (no winner)', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    result.winner = undefined as any;
    expect(isRoundComplete(result)).toBe(false);
  });
});

describe('isRoundPartial', () => {
  it('should return false for undefined result', () => {
    expect(isRoundPartial(undefined)).toBe(false);
  });

  it('should return true when only player board selected', () => {
    const result = createPartialRoundResult(1, playerBoard1);
    expect(isRoundPartial(result)).toBe(true);
  });

  it('should return false for complete round', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    expect(isRoundPartial(result)).toBe(false);
  });

  it('should return false when no boards selected', () => {
    const result = createPartialRoundResult(1, null);
    result.playerBoard = null as any;
    expect(isRoundPartial(result)).toBe(false);
  });
});

describe('deriveCurrentRound', () => {
  it('should return 1 for empty history', () => {
    const state = createTestGameState();
    expect(deriveCurrentRound(state)).toBe(1);
  });

  it('should return 2 after completing round 1', () => {
    const state = createTestGameState({
      roundHistory: [createCompleteRoundResult(1, playerBoard1, opponentBoard1)],
    });
    expect(deriveCurrentRound(state)).toBe(2);
  });

  it('should return 1 when round 1 is partial', () => {
    const state = createTestGameState({
      roundHistory: [createPartialRoundResult(1, playerBoard1)],
    });
    expect(deriveCurrentRound(state)).toBe(1);
  });

  it('should return TOTAL_ROUNDS + 1 when all rounds complete', () => {
    const history = Array.from({ length: GAME_RULES.TOTAL_ROUNDS }, (_, i) =>
      createCompleteRoundResult(i + 1, playerBoard1, opponentBoard1)
    );
    const state = createTestGameState({ roundHistory: history });
    expect(deriveCurrentRound(state)).toBe(GAME_RULES.TOTAL_ROUNDS + 1);
  });
});

describe('derivePlayerScore', () => {
  it('should return 0 for empty history', () => {
    expect(derivePlayerScore([])).toBe(0);
  });

  it('should sum player points from all rounds', () => {
    const result1 = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    const result2 = createCompleteRoundResult(2, playerBoard1, opponentBoard1);
    const history = [
      { ...result1, playerPoints: 10 },
      { ...result2, playerPoints: 15 },
    ];
    expect(derivePlayerScore(history)).toBe(25);
  });

  it('should handle undefined points as 0', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    // Create a result without playerPoints to test optional handling
    const { playerPoints, opponentPoints, ...resultWithoutPoints } = result;
    const history = [resultWithoutPoints as RoundResult];
    expect(derivePlayerScore(history)).toBe(0);
  });
});

describe('deriveOpponentScore', () => {
  it('should return 0 for empty history', () => {
    expect(deriveOpponentScore([])).toBe(0);
  });

  it('should sum opponent points from all rounds', () => {
    const result1 = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    const result2 = createCompleteRoundResult(2, playerBoard1, opponentBoard1);
    const history = [
      { ...result1, opponentPoints: 8 },
      { ...result2, opponentPoints: 12 },
    ];
    expect(deriveOpponentScore(history)).toBe(20);
  });
});

describe('deriveWinner', () => {
  it('should return "player" when player has more points', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    const history = [{
      ...result,
      playerPoints: 20,
      opponentPoints: 10,
    }];
    const state = createTestGameState({ roundHistory: history });
    expect(deriveWinner(state)).toBe('player');
  });

  it('should return "opponent" when opponent has more points', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    const history = [{
      ...result,
      playerPoints: 10,
      opponentPoints: 20,
    }];
    const state = createTestGameState({ roundHistory: history });
    expect(deriveWinner(state)).toBe('opponent');
  });

  it('should return "tie" when scores are equal', () => {
    const result = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    const history = [{
      ...result,
      playerPoints: 15,
      opponentPoints: 15,
    }];
    const state = createTestGameState({ roundHistory: history });
    expect(deriveWinner(state)).toBe('tie');
  });
});

describe('deriveWhoMovesFirst', () => {
  it('should return "player" when no game creator set', () => {
    expect(deriveWhoMovesFirst(1, 'user-123', null)).toBe('player');
  });

  it('should return "player" on odd rounds when user is creator', () => {
    expect(deriveWhoMovesFirst(1, 'user-123', 'user-123')).toBe('player');
    expect(deriveWhoMovesFirst(3, 'user-123', 'user-123')).toBe('player');
    expect(deriveWhoMovesFirst(5, 'user-123', 'user-123')).toBe('player');
  });

  it('should return "opponent" on even rounds when user is creator', () => {
    expect(deriveWhoMovesFirst(2, 'user-123', 'user-123')).toBe('opponent');
    expect(deriveWhoMovesFirst(4, 'user-123', 'user-123')).toBe('opponent');
  });

  it('should return "opponent" on odd rounds when user is NOT creator', () => {
    expect(deriveWhoMovesFirst(1, 'user-123', 'other-user')).toBe('opponent');
    expect(deriveWhoMovesFirst(3, 'user-123', 'other-user')).toBe('opponent');
    expect(deriveWhoMovesFirst(5, 'user-123', 'other-user')).toBe('opponent');
  });

  it('should return "player" on even rounds when user is NOT creator', () => {
    expect(deriveWhoMovesFirst(2, 'user-123', 'other-user')).toBe('player');
    expect(deriveWhoMovesFirst(4, 'user-123', 'other-user')).toBe('player');
  });
});

describe('derivePhase', () => {
  it('should return user-setup when user name not set', () => {
    const state = createTestGameState();
    state.user.name = '';
    const phase = derivePhase(state);
    expect(phase.type).toBe('user-setup');
  });

  it('should return game-mode-selection when no game mode', () => {
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: null,
      gameMode: null,
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('game-mode-selection');
  });

  it('should return opponent-selection when game mode set but no opponent', () => {
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: null,
      gameMode: 'round-by-round' as const,
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('opponent-selection');
    if (phase.type === 'opponent-selection') {
      expect(phase.gameMode).toBe('round-by-round');
    }
  });

  it('should return board-selection for first round with no selections', () => {
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: [],
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('board-selection');
    if (phase.type === 'board-selection') {
      expect(phase.round).toBe(1);
    }
  });

  it('should return share-challenge when player selected and opponent is human', () => {
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'human', id: 'human-123', name: 'Human Player', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: [createPartialRoundResult(1, playerBoard1)],
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('share-challenge');
    if (phase.type === 'share-challenge') {
      expect(phase.round).toBe(1);
    }
  });

  it('should return waiting-for-opponent when player selected and opponent is CPU', () => {
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: [createPartialRoundResult(1, playerBoard1)],
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('waiting-for-opponent');
    if (phase.type === 'waiting-for-opponent') {
      expect(phase.round).toBe(1);
    }
  });

  it('should return round-results when round is complete', () => {
    const completeRound = createCompleteRoundResult(1, playerBoard1, opponentBoard1);
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: [completeRound],
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('round-results');
    if (phase.type === 'round-results') {
      expect(phase.round).toBe(1);
      expect(phase.result).toEqual(completeRound);
    }
  });

  it('should return game-over when all rounds complete', () => {
    const history = Array.from({ length: GAME_RULES.TOTAL_ROUNDS }, (_, i) =>
      createCompleteRoundResult(i + 1, playerBoard1, opponentBoard1)
    );
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: history,
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('game-over');
  });

  it('should return round-results when round 1 complete and round 2 not started', () => {
    const history = [createCompleteRoundResult(1, playerBoard1, opponentBoard1)];
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: history,
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('round-results');
    if (phase.type === 'round-results') {
      expect(phase.round).toBe(1);
    }
  });

  it('should return round-review when round 1 complete and starting to select for round 2', () => {
    const history = [
      createCompleteRoundResult(1, playerBoard1, opponentBoard1),
      createPartialRoundResult(2, null), // Round 2 entry exists but no boards yet
    ];
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'round-by-round' as const,
      roundHistory: history,
    });
    const phase = derivePhase(state);
    // When round 2 entry exists but no boards selected, show round-review
    // (user has acknowledged round 1 results and is ready to select for round 2)
    expect(phase.type).toBe('round-review');
    if (phase.type === 'round-review') {
      expect(phase.round).toBe(2);
    }
  });

  it('should return deck-selection when in deck mode without decks', () => {
    const state = createTestGameState({
      phaseOverride: null, // Allow phase to be derived
      user: {
        id: 'user-123',
        name: 'Test User',
        createdAt: Date.now(),
        playerCreature: 'square',
        stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
      },
      opponent: { type: 'cpu', id: 'cpu-opponent', name: 'CPU Sam', wins: 0, losses: 0 },
      gameMode: 'deck',
      playerSelectedDeck: null,
      opponentSelectedDeck: null,
    });
    const phase = derivePhase(state);
    expect(phase.type).toBe('deck-selection');
  });
});

describe('derivePlayerSelectedBoard', () => {
  it('should return null when no boards selected', () => {
    const state = createTestGameState();
    expect(derivePlayerSelectedBoard(state)).toBeNull();
  });

  it('should return player board for current round', () => {
    const state = createTestGameState({
      roundHistory: [createPartialRoundResult(1, playerBoard1)],
    });
    expect(derivePlayerSelectedBoard(state)).toEqual(playerBoard1);
  });

  it('should return null when only opponent selected', () => {
    const partial = createPartialRoundResult(1, null);
    partial.opponentBoard = opponentBoard1;
    const state = createTestGameState({
      roundHistory: [partial],
    });
    expect(derivePlayerSelectedBoard(state)).toBeNull();
  });
});

describe('deriveOpponentSelectedBoard', () => {
  it('should return null when no boards selected', () => {
    const state = createTestGameState();
    expect(deriveOpponentSelectedBoard(state)).toBeNull();
  });

  it('should return opponent board for current round', () => {
    const partial = createPartialRoundResult(1, null);
    partial.opponentBoard = opponentBoard1;
    const state = createTestGameState({
      roundHistory: [partial],
    });
    expect(deriveOpponentSelectedBoard(state)).toEqual(opponentBoard1);
  });

  it('should return null when only player selected', () => {
    const state = createTestGameState({
      roundHistory: [createPartialRoundResult(1, playerBoard1)],
    });
    expect(deriveOpponentSelectedBoard(state)).toBeNull();
  });
});
