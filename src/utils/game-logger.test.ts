/**
 * Tests for game-logger utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logRoundData } from './game-logger';
import type { RoundResult } from '@/types';

vi.mock('@/config/api', () => ({
  getApiEndpoint: (path: string) => `http://localhost:3000${path}`,
}));

vi.mock('./board-encoding', () => ({
  encodeMinimalBoard: (board: unknown) => `encoded:${JSON.stringify(board).slice(0, 10)}`,
  buildFogBoard: (board: unknown) => ({ ...board as object, fog: true }),
}));

const makeBoard = (size = 3) => ({
  id: 'board-1',
  name: 'Test',
  boardSize: size,
  grid: Array(size).fill(Array(size).fill('empty')),
  sequence: [],
  thumbnail: '',
  createdAt: 0,
});

const baseCtx = {
  gameId: 'game-abc',
  roundNum: 1,
  opponentType: 'cpu' as const,
  boardSize: 3,
  playerScoreBefore: 0,
  opponentScoreBefore: 0,
};

const baseResult: RoundResult = {
  round: 1,
  winner: 'player',
  playerBoard: makeBoard() as RoundResult['playerBoard'],
  opponentBoard: makeBoard() as RoundResult['opponentBoard'],
  playerFinalPosition: { row: -1, col: 0 },
  opponentFinalPosition: { row: -1, col: 0 },
  playerPoints: 5,
  opponentPoints: 3,
  collision: false,
};

describe('logRoundData', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should POST board_construction with correct fields', async () => {
    logRoundData(baseResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const boardConstructionCall = calls.find(([, init]) => {
      const body = JSON.parse(init!.body as string);
      return body.type === 'board_construction';
    });
    expect(boardConstructionCall).toBeDefined();

    const body = JSON.parse(boardConstructionCall![1]!.body as string);
    expect(body.game_id).toBe('game-abc');
    expect(body.round_num).toBe(1);
    expect(body.board_size).toBe(3);
    expect(body.opponent_type).toBe('cpu');
    expect(body.player_score).toBe(0);
    expect(body.opponent_score).toBe(0);
    expect(body.player_board).toBeDefined();
    expect(body.opponent_board).toBeDefined();
    expect(body.valid).toBe(true);
  });

  it('should POST round_outcome with correct fields', async () => {
    logRoundData(baseResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const outcomeCall = calls.find(([, init]) => {
      const body = JSON.parse(init!.body as string);
      return body.type === 'round_outcome';
    });
    expect(outcomeCall).toBeDefined();

    const body = JSON.parse(outcomeCall![1]!.body as string);
    expect(body.game_id).toBe('game-abc');
    expect(body.round_num).toBe(1);
    expect(body.winner).toBe('player');
    expect(body.player_points).toBe(5);
    expect(body.opponent_points).toBe(3);
    expect(body.collision).toBe(false);
    expect(body.player_fog).toBeDefined();
    expect(body.opponent_fog).toBeDefined();
    expect(body.opponent_type).toBe('cpu');
  });

  it('should use correct seq numbering for round 1', async () => {
    logRoundData(baseResult, { ...baseCtx, roundNum: 1 });
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));

    const boardBody = bodies.find(b => b.type === 'board_construction');
    const outcomeBody = bodies.find(b => b.type === 'round_outcome');
    expect(boardBody!.seq).toBe(1);   // (1-1)*2+1 = 1
    expect(outcomeBody!.seq).toBe(2); // (1-1)*2+2 = 2
  });

  it('should use correct seq numbering for round 3', async () => {
    logRoundData({ ...baseResult, round: 3 }, { ...baseCtx, roundNum: 3 });
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));

    const boardBody = bodies.find(b => b.type === 'board_construction');
    const outcomeBody = bodies.find(b => b.type === 'round_outcome');
    expect(boardBody!.seq).toBe(5);  // (3-1)*2+1 = 5
    expect(outcomeBody!.seq).toBe(6); // (3-1)*2+2 = 6
  });

  it('should skip posting when playerBoard is missing', async () => {
    logRoundData({ ...baseResult, playerBoard: undefined } as unknown as RoundResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should skip posting when opponentBoard is missing', async () => {
    logRoundData({ ...baseResult, opponentBoard: undefined } as unknown as RoundResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should never throw on fetch failure', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    expect(() => logRoundData(baseResult, baseCtx)).not.toThrow();
    await new Promise(r => setTimeout(r, 10));
  });

  it('should include optional playerId and lotSessionId when provided', async () => {
    logRoundData(baseResult, {
      ...baseCtx,
      playerId: 'player-uuid',
      lotSessionId: 'lot-session-123',
    });
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const boardBody = JSON.parse(calls[0]![1]!.body as string);
    expect(boardBody.player_id).toBe('player-uuid');
    expect(boardBody.lot_session_id).toBe('lot-session-123');
  });

  it('should include skillLevel and modelId in board_construction when provided', async () => {
    logRoundData(baseResult, {
      ...baseCtx,
      opponentType: 'ai-agent',
      skillLevel: 'advanced',
      modelId: 'abc12345',
    });
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));
    const boardBody = bodies.find(b => b.type === 'board_construction');
    expect(boardBody!.skill_level).toBe('advanced');
    expect(boardBody!.model_id).toBe('abc12345');
  });

  it('should use null for missing skill_level and model_id', async () => {
    logRoundData(baseResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));
    const boardBody = bodies.find(b => b.type === 'board_construction');
    expect(boardBody!.skill_level).toBeNull();
    expect(boardBody!.model_id).toBeNull();
  });

  it('should include simulation details in round_outcome when available', async () => {
    const resultWithSim: RoundResult = {
      ...baseResult,
      simulationDetails: {
        playerMoves: 3,
        opponentMoves: 2,
        playerHitTrap: true,
        opponentHitTrap: false,
        playerLastStep: 2,
        opponentLastStep: 3,
      },
    };

    logRoundData(resultWithSim, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));
    const outcomeBody = bodies.find(b => b.type === 'round_outcome');
    expect(outcomeBody!.player_hit_trap).toBe(true);
    expect(outcomeBody!.opponent_hit_trap).toBe(false);
    expect(outcomeBody!.player_last_step).toBe(2);
    expect(outcomeBody!.opponent_last_step).toBe(3);
  });

  it('should use defaults when simulationDetails is missing', async () => {
    const resultNoSim: RoundResult = { ...baseResult, simulationDetails: undefined };

    logRoundData(resultNoSim, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));
    const outcomeBody = bodies.find(b => b.type === 'round_outcome');
    expect(outcomeBody!.player_hit_trap).toBe(false);
    expect(outcomeBody!.opponent_hit_trap).toBe(false);
    expect(outcomeBody!.player_last_step).toBe(-1);
    expect(outcomeBody!.opponent_last_step).toBe(-1);
  });

  it('should mark valid=false when winner is undefined', async () => {
    logRoundData({ ...baseResult, winner: undefined } as unknown as RoundResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const calls = vi.mocked(global.fetch).mock.calls;
    const bodies = calls.map(([, init]) => JSON.parse(init!.body as string));
    const boardBody = bodies.find(b => b.type === 'board_construction');
    expect(boardBody!.valid).toBe(false);
  });

  it('should POST to the /api/game-log endpoint', async () => {
    logRoundData(baseResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    const urls = vi.mocked(global.fetch).mock.calls.map(([url]) => url);
    expect(urls.every(url => url === 'http://localhost:3000/api/game-log')).toBe(true);
  });

  it('should send exactly two POST requests per round', async () => {
    logRoundData(baseResult, baseCtx);
    await new Promise(r => setTimeout(r, 0));

    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
  });
});
