/**
 * Tests for AI Agent inference API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestAiAgentBoard, checkInferenceServerHealth, toStochasticSkillLevel, fetchAvailableModels } from './ai-agent-inference';
import type { Board } from '@/types';

// Mock the api config module
vi.mock('@/config/api', () => ({
  getInferenceApiEndpoint: (path: string) => `http://localhost:8100${path}`,
}));

// Mock uuid to return predictable IDs
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('requestAiAgentBoard', () => {
  const mockBoard: Board = {
    id: 'board-1',
    name: 'Test Board',
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'],
      ['piece', 'trap', 'empty'],
      ['empty', 'empty', 'piece'],
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
      { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
      { position: { row: -1, col: 0 }, type: 'final', order: 5 },
    ],
    thumbnail: '',
    createdAt: 1000000,
  };

  const mockApiResponse = {
    board: {
      sequence: [
        { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 },
      ],
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'trap', 'empty'],
        ['piece', 'empty', 'empty'],
      ],
    },
    valid: true,
    attempts_used: 1,
    model_info: { checkpoint: 'early', deterministic: false },
  };

  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a Board on successful response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');

    expect(result.board).not.toBeNull();
    expect(result.failed).toBe(false);
    expect(result.attemptsUsed).toBe(1);
    expect(result.board!.boardSize).toBe(3);
    expect(result.board!.sequence).toHaveLength(5);
    expect(result.board!.id).toContain('ai-agent-');
    expect(result.board!.name).toContain('beginner');
  });

  it('should flip scores in the API request (agent_score = opponent game score)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 2, 10, 5, [mockBoard], 'intermediate');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    // Player score is 10, AI score is 5 (game perspective)
    // API should receive agent_score=5, opponent_score=10
    expect(body.agent_score).toBe(5);
    expect(body.opponent_score).toBe(10);
  });

  it('should convert board history to API format', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 2, 0, 0, [mockBoard], 'beginner');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.opponent_history).toHaveLength(1);
    expect(body.opponent_history[0].sequence).toHaveLength(5); // 5 moves in mockBoard
    expect(body.opponent_history[0].sequence[0]).toEqual({
      row: 2,
      col: 2,
      type: 'piece',
      order: 1,
    });
  });

  it('should return failed result on HTTP error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
  });

  it('should return failed result with attempts when server returns invalid board', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ board: null, valid: false, attempts_used: 5 }),
    } as Response);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
    expect(result.attemptsUsed).toBe(5);
  });

  it('should return failed result on board size mismatch', async () => {
    const badResponse = {
      ...mockApiResponse,
      board: { ...mockApiResponse.board, boardSize: 2 },
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => badResponse,
    } as Response);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
  });

  it('should return failed result on network error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
  });

  it('should return failed result on timeout', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    vi.mocked(global.fetch).mockRejectedValueOnce(abortError);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
  });

  it('should send correct request body fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 3, 8, 12, [], 'advanced_plus');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.board_size).toBe(3);
    expect(body.round_num).toBe(2); // 0-indexed: round 3 -> 2
    expect(body.skill_level).toBe('advanced_plus');
    expect(body.opponent_history).toEqual([]);
  });

  it('should call the correct endpoint', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8100/construct-board',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should reject board that does not visit all rows (local validation)', async () => {
    const incompletePathResponse = {
      board: {
        sequence: [
          { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
          // Skips row 1 entirely
          { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
          { position: { row: -1, col: 0 }, type: 'final', order: 3 },
        ],
        boardSize: 3,
        grid: [
          ['piece', 'empty', 'empty'],
          ['empty', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
      },
      valid: true, // Server says valid, but local check catches it
      attempts_used: 1,
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => incompletePathResponse,
    } as Response);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
  });

  it('should convert roundHistory to round_scores with flipped perspective', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const minBoard: Board = {
      id: 'min', name: 'Min', boardSize: 3,
      grid: [['piece','empty','empty'],['piece','empty','empty'],['piece','empty','empty']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 2, col: 0 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 },
      ],
      thumbnail: '', createdAt: 1000,
    };
    const roundHistory = [
      { playerPoints: 3, opponentPoints: 5, playerBoard: minBoard, opponentBoard: minBoard },
      { playerPoints: 7, opponentPoints: 2, playerBoard: minBoard, opponentBoard: minBoard },
    ] as import('@/types').RoundResult[];

    await requestAiAgentBoard(3, 3, 10, 7, [], 'beginner', undefined, roundHistory);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    // round_scores should flip: agent = opponent (AI), opponent = player
    expect(body.round_scores).toEqual([
      { agent: 5, opponent: 3 },
      { agent: 2, opponent: 7 },
    ]);
  });

  it('should send round_history with fog boards and flipped perspective', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const playerBoard: Board = {
      id: 'player-board',
      name: 'Player Board',
      boardSize: 2,
      grid: [['piece', 'empty'], ['trap', 'piece']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 },
      ],
      thumbnail: '',
      createdAt: 1000,
    };

    const opponentBoard: Board = {
      id: 'opponent-board',
      name: 'Opponent Board',
      boardSize: 2,
      grid: [['piece', 'trap'], ['piece', 'empty']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 },
      ],
      thumbnail: '',
      createdAt: 1000,
    };

    const roundHistory = [{
      round: 1,
      winner: 'player' as const,
      playerBoard,
      opponentBoard,
      playerFinalPosition: { row: -1, col: 0 },
      opponentFinalPosition: { row: -1, col: 0 },
      playerPoints: 3,
      opponentPoints: 5,
      simulationDetails: {
        playerMoves: 3,
        opponentMoves: 2,
        playerHitTrap: false,
        opponentHitTrap: true,
        playerLastStep: 3,
        opponentLastStep: 1,
        opponentTrapPosition: { row: 1, col: 0 },
      },
      collision: false,
    }] as import('@/types').RoundResult[];

    await requestAiAgentBoard(2, 2, 3, 5, [], 'scripted_5', undefined, roundHistory);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.round_history).toHaveLength(1);
    const rh = body.round_history[0];
    // Scores flipped: agent = opponent (AI), opponent = player
    expect(rh.agent_score).toBe(5);
    expect(rh.opponent_score).toBe(3);
    // Agent board is the opponentBoard encoded
    expect(rh.agent_board).toContain('2|');
    // Fog board should be encoded
    expect(rh.opponent_board_fog).toContain('2|');
    // Simulation details flipped
    expect(rh.agent_last_step).toBe(1);
    expect(rh.opponent_last_step).toBe(3);
    expect(rh.agent_hit_trap).toBe(true);
    expect(rh.opponent_hit_trap).toBe(false);
    expect(rh.collision).toBe(false);
  });

  it('should send empty round_history when no roundHistory provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.round_history).toEqual([]);
  });

  it('should send empty round_scores when no roundHistory provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.round_scores).toEqual([]);
  });

  it('should include model_id in request body when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner', 'abc12345');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.model_id).toBe('abc12345');
    expect(body.skill_level).toBe('beginner');
  });

  it('should treat skill level string as skill_level override, not model_id', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    // "intermediate" is a skill level, not a model hash — should override skill_level
    await requestAiAgentBoard(3, 1, 0, 0, [], 'scripted_1', 'intermediate');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.skill_level).toBe('intermediate');
    expect(body.model_id).toBeUndefined();
  });

  it('should treat scripted level string as skill_level override', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(2, 1, 0, 0, [], 'beginner', 'scripted_5');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.skill_level).toBe('scripted_5');
    expect(body.model_id).toBeUndefined();
  });

  it('should send actual model hash as model_id, not skill_level override', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner', 'abc12345');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.model_id).toBe('abc12345');
    expect(body.skill_level).toBe('beginner');
  });

  it('should not include model_id when not provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]!;
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.model_id).toBeUndefined();
  });

  it('should reject board without a final move (local validation)', async () => {
    const noGoalResponse = {
      board: {
        sequence: [
          { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
          { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
        ],
        boardSize: 3,
        grid: [
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
          ['piece', 'empty', 'empty'],
        ],
      },
      valid: true, // Server says valid, but no goal
      attempts_used: 1,
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => noGoalResponse,
    } as Response);

    const result = await requestAiAgentBoard(3, 1, 0, 0, [], 'beginner');
    expect(result.board).toBeNull();
    expect(result.failed).toBe(true);
  });
});

describe('checkInferenceServerHealth', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when server is healthy', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response);

    const result = await checkInferenceServerHealth();
    expect(result).toBe(true);
  });

  it('should return false when server returns non-ok status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'error' }),
    } as Response);

    const result = await checkInferenceServerHealth();
    expect(result).toBe(false);
  });

  it('should return false when server is unreachable', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Connection refused'));

    const result = await checkInferenceServerHealth();
    expect(result).toBe(false);
  });

  it('should return false on HTTP error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const result = await checkInferenceServerHealth();
    expect(result).toBe(false);
  });

  it('should call the health endpoint', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response);

    await checkInferenceServerHealth();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8100/health',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});

describe('fetchAvailableModels', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return models on success', async () => {
    const mockModels = [
      { index: 0, model_id: 'abc12345', board_size: 3, category: 'difficulty', label: 'model_a', use_fog: true },
      { index: 1, model_id: 'def67890', board_size: 3, category: 'level_advancement', label: 'model_b', use_fog: true },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockModels,
    } as Response);

    const result = await fetchAvailableModels();
    expect(result).toEqual(mockModels);
    expect(result).toHaveLength(2);
  });

  it('should call the /models endpoint', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    await fetchAvailableModels();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8100/models',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('should return empty array on HTTP error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await fetchAvailableModels();
    expect(result).toEqual([]);
  });

  it('should return empty array on network error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchAvailableModels();
    expect(result).toEqual([]);
  });

  it('should return empty array on timeout', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    vi.mocked(global.fetch).mockRejectedValueOnce(abortError);

    const result = await fetchAvailableModels();
    expect(result).toEqual([]);
  });
});

describe('toStochasticSkillLevel', () => {
  it('should strip _plus suffix from beginner_plus', () => {
    expect(toStochasticSkillLevel('beginner_plus')).toBe('beginner');
  });

  it('should strip _plus suffix from intermediate_plus', () => {
    expect(toStochasticSkillLevel('intermediate_plus')).toBe('intermediate');
  });

  it('should strip _plus suffix from advanced_plus', () => {
    expect(toStochasticSkillLevel('advanced_plus')).toBe('advanced');
  });

  it('should return beginner unchanged (already stochastic)', () => {
    expect(toStochasticSkillLevel('beginner')).toBe('beginner');
  });

  it('should return intermediate unchanged (already stochastic)', () => {
    expect(toStochasticSkillLevel('intermediate')).toBe('intermediate');
  });

  it('should return advanced unchanged (already stochastic)', () => {
    expect(toStochasticSkillLevel('advanced')).toBe('advanced');
  });

  it('should return test_fail unchanged (no stochastic variant)', () => {
    expect(toStochasticSkillLevel('test_fail')).toBe('test_fail');
  });
});
