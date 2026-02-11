/**
 * Tests for AI Agent inference API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestAiAgentBoard, checkInferenceServerHealth } from './ai-agent-inference';
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
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 2 }, type: 'final', order: 4 },
      ],
      boardSize: 3,
      grid: [
        ['piece', 'trap', 'empty'],
        ['empty', 'piece', 'empty'],
        ['empty', 'empty', 'empty'],
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
    expect(result.board!.sequence).toHaveLength(4);
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
    expect(body.opponent_history[0]).toHaveLength(5); // 5 moves in mockBoard
    expect(body.opponent_history[0][0]).toEqual({
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
    expect(body.round_num).toBe(3);
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
