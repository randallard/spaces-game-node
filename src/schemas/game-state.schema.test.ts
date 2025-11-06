/**
 * Tests for game state schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  GamePhaseSchema,
  GameStateSchema,
  RoundResultSchema,
  UrlPayloadSchema,
} from './game-state.schema';
import type { GameState } from '@/types';

describe('GamePhaseSchema', () => {
  it('should accept user-setup phase', () => {
    expect(() =>
      GamePhaseSchema.parse({ type: 'user-setup' })
    ).not.toThrow();
  });

  it('should accept opponent-selection phase', () => {
    expect(() =>
      GamePhaseSchema.parse({ type: 'opponent-selection', gameMode: 'round-by-round' })
    ).not.toThrow();
    expect(() =>
      GamePhaseSchema.parse({ type: 'opponent-selection', gameMode: 'deck' })
    ).not.toThrow();
  });

  it('should accept board-selection phase with round', () => {
    expect(() =>
      GamePhaseSchema.parse({ type: 'board-selection', round: 1 })
    ).not.toThrow();
    expect(() =>
      GamePhaseSchema.parse({ type: 'board-selection', round: 8 })
    ).not.toThrow();
    expect(() =>
      GamePhaseSchema.parse({ type: 'board-selection', round: 10 })
    ).not.toThrow();
  });

  it('should reject board-selection with invalid round', () => {
    expect(() =>
      GamePhaseSchema.parse({ type: 'board-selection', round: 0 })
    ).toThrow();
    expect(() =>
      GamePhaseSchema.parse({ type: 'board-selection', round: 11 })
    ).toThrow();
  });

  it('should accept game-over phase with winner', () => {
    expect(() =>
      GamePhaseSchema.parse({ type: 'game-over', winner: 'player' })
    ).not.toThrow();
    expect(() =>
      GamePhaseSchema.parse({ type: 'game-over', winner: 'opponent' })
    ).not.toThrow();
    expect(() =>
      GamePhaseSchema.parse({ type: 'game-over', winner: 'tie' })
    ).not.toThrow();
  });

  it('should reject invalid phase types', () => {
    expect(() =>
      GamePhaseSchema.parse({ type: 'invalid-phase' })
    ).toThrow();
  });
});

describe('RoundResultSchema', () => {
  const validBoard = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Board',
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [{ position: { row: 0, col: 0 }, type: 'piece' as const, order: 1 }],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  };

  const validResult = {
    round: 1,
    winner: 'player' as const,
    playerBoard: validBoard,
    opponentBoard: validBoard,
    playerFinalPosition: { row: 0, col: 0 },
    opponentFinalPosition: { row: 1, col: 1 },
    playerPoints: 5,
    opponentPoints: 3,
    playerOutcome: 'won' as const,
    simulationDetails: {
      playerMoves: 3,
      opponentMoves: 2,
      playerHitTrap: false,
      opponentHitTrap: true,
    },
  };

  it('should accept valid round result', () => {
    expect(() => RoundResultSchema.parse(validResult)).not.toThrow();
  });

  it('should reject round outside 1-10 range', () => {
    expect(() =>
      RoundResultSchema.parse({ ...validResult, round: 0 })
    ).toThrow();
    expect(() =>
      RoundResultSchema.parse({ ...validResult, round: 11 })
    ).toThrow();
  });

  it('should accept round 10', () => {
    expect(() =>
      RoundResultSchema.parse({ ...validResult, round: 10 })
    ).not.toThrow();
  });

  it('should reject negative points', () => {
    expect(() =>
      RoundResultSchema.parse({ ...validResult, playerPoints: -1 })
    ).toThrow();
  });

  it('should reject invalid outcome', () => {
    expect(() =>
      RoundResultSchema.parse({ ...validResult, playerOutcome: 'invalid' })
    ).toThrow();
  });

  it('should accept all valid outcomes', () => {
    expect(() =>
      RoundResultSchema.parse({ ...validResult, playerOutcome: 'won' })
    ).not.toThrow();
    expect(() =>
      RoundResultSchema.parse({ ...validResult, playerOutcome: 'lost' })
    ).not.toThrow();
    expect(() =>
      RoundResultSchema.parse({ ...validResult, playerOutcome: 'tie' })
    ).not.toThrow();
  });
});

describe('GameStateSchema', () => {
  const validGameState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      createdAt: Date.now(),
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
    },
    opponent: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
  gameMode: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc123',
  };

  it('should accept valid game state', () => {
    expect(() => GameStateSchema.parse(validGameState)).not.toThrow();
  });

  it('should reject invalid round number', () => {
    expect(() =>
      GameStateSchema.parse({ ...validGameState, currentRound: -1 })
    ).toThrow();
    expect(() =>
      GameStateSchema.parse({ ...validGameState, currentRound: 11 })
    ).toThrow();
  });

  it('should accept round 10', () => {
    expect(() =>
      GameStateSchema.parse({ ...validGameState, currentRound: 10 })
    ).not.toThrow();
  });

  it('should reject negative scores', () => {
    expect(() =>
      GameStateSchema.parse({ ...validGameState, playerScore: -1 })
    ).toThrow();
    expect(() =>
      GameStateSchema.parse({ ...validGameState, opponentScore: -1 })
    ).toThrow();
  });

  it('should accept game state with opponent', () => {
    const stateWithOpponent = {
      ...validGameState,
      opponent: {
        id: 'cpu-opponent',
        name: 'CPU',
        type: 'cpu' as const,
        wins: 0,
        losses: 0,
      },
    };
    expect(() => GameStateSchema.parse(stateWithOpponent)).not.toThrow();
  });
});

describe('UrlPayloadSchema', () => {
  const validGameState: GameState = {
    phase: { type: 'user-setup' },
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      createdAt: Date.now(),
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0 },
    },
    opponent: null,
    currentRound: 0,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    roundHistory: [],
  gameMode: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
    checksum: 'abc123',
  };

  it('should accept delta payload', () => {
    const payload = {
      type: 'delta' as const,
      changes: { currentRound: 1 },
    };
    expect(() => UrlPayloadSchema.parse(payload)).not.toThrow();
  });

  it('should accept full_state payload', () => {
    const payload = {
      type: 'full_state' as const,
      state: validGameState,
    };
    expect(() => UrlPayloadSchema.parse(payload)).not.toThrow();
  });

  it('should accept resync_request payload', () => {
    const payload = {
      type: 'resync_request' as const,
      requestId: 'req-123',
    };
    expect(() => UrlPayloadSchema.parse(payload)).not.toThrow();
  });

  it('should reject invalid payload type', () => {
    expect(() =>
      UrlPayloadSchema.parse({ type: 'invalid', data: {} })
    ).toThrow();
  });
});
