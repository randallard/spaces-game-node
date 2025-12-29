/**
 * Tests for remote CPU board fetching utilities
 * @module utils/remote-cpu-boards.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRemoteCpuBoards, checkRemoteCpuAvailability } from './remote-cpu-boards';
import type { Board } from '@/types';

describe('fetchRemoteCpuBoards', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createValidBoard = (id: string, boardSize: number): Board => ({
    id,
    name: `Test Board ${id}`,
    boardSize,
    grid: Array(boardSize).fill(null).map(() => Array(boardSize).fill('empty')),
    sequence: [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
    ],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  });

  describe('successful fetches', () => {
    it('should fetch and validate boards for valid size', async () => {
      const validBoard = createValidBoard('board-1', 2);
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '1000' }),
        json: async () => [validBoard],
      });

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'board-1',
        boardSize: 2,
      });
    });

    it('should filter out invalid boards', async () => {
      const validBoard = createValidBoard('valid', 3);
      const invalidBoard = { id: 'invalid', name: 'Missing fields' };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [validBoard, invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(3);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('valid');

      consoleWarnSpy.mockRestore();
    });

    it('should limit boards to MAX_BOARDS_PER_SIZE', async () => {
      const boards = Array(150).fill(null).map((_, i) => createValidBoard(`board-${i}`, 2));

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => boards,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result.length).toBeLessThanOrEqual(100);

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty response array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [],
      });

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
    });
  });

  describe('validation - invalid board size', () => {
    it('should reject board size < 2', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(1);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid board size'));
      expect(mockFetch).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should reject board size > 10', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(11);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid board size'));
      expect(mockFetch).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should reject non-integer board size', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2.5 as any);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid board size'));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('validation - board structure', () => {
    it('should reject board with string too long', async () => {
      const invalidBoard = createValidBoard('a'.repeat(1001), 2);

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('string too long'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with thumbnail too large', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.thumbnail = 'a'.repeat(101 * 1024); // > 100KB

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('thumbnail too large'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with mismatched size', async () => {
      const invalidBoard = createValidBoard('board-1', 3);

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2); // Requesting size 2, but board is size 3

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('size mismatch'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid grid dimensions', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.grid = [['empty']]; // Wrong dimensions

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid cell type', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.grid[0]![0] = 'invalid' as any;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid cell type'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with sequence too long', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.sequence = Array(501).fill(null).map((_, i) => ({
        position: { row: 0, col: 0 },
        type: 'piece' as const,
        order: i + 1,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('sequence too long'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid move coordinates', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.sequence = [
        { position: { row: 5, col: 5 }, type: 'piece', order: 1 }, // Out of bounds
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('out of bounds'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid move type', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.sequence = [
        { position: { row: 0, col: 0 }, type: 'invalid' as any, order: 1 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid move type'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid order (negative)', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.sequence = [
        { position: { row: 0, col: 0 }, type: 'piece', order: -1 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid order'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid order (zero)', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.sequence = [
        { position: { row: 0, col: 0 }, type: 'piece', order: 0 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with invalid timestamp (negative)', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.createdAt = -1;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid timestamp'));

      consoleWarnSpy.mockRestore();
    });

    it('should reject board with timestamp too far in future', async () => {
      const invalidBoard = createValidBoard('board-1', 2);
      invalidBoard.createdAt = Date.now() + (400 * 24 * 60 * 60 * 1000); // > 1 year in future

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [invalidBoard],
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid timestamp'));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should return empty array on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch'));

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when response is too large', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '20000000' }), // 20MB
        json: async () => [],
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Response too large'));

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when response is not an array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => ({ boards: [] }), // Object, not array
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not an array'));

      consoleErrorSpy.mockRestore();
    });

    it('should handle timeout with AbortError', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 100);
        });
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const resultPromise = fetchRemoteCpuBoards(2);

      // Fast-forward time to trigger timeout
      await vi.advanceTimersByTimeAsync(31000);

      const result = await resultPromise;

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Fetch timeout'));

      consoleErrorSpy.mockRestore();
    });

    it('should handle general fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fetchRemoteCpuBoards] Error fetching remote CPU boards'),
        expect.stringContaining('Network error'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('board size ranges', () => {
    it('should accept board size 2 (minimum)', async () => {
      const validBoard = createValidBoard('board-1', 2);
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [validBoard],
      });

      const result = await fetchRemoteCpuBoards(2);

      expect(result).toHaveLength(1);
    });

    it('should accept board size 10 (maximum)', async () => {
      const validBoard = createValidBoard('board-1', 10);
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [validBoard],
      });

      const result = await fetchRemoteCpuBoards(10);

      expect(result).toHaveLength(1);
    });
  });
});

describe('checkRemoteCpuAvailability', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when server is reachable', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const result = await checkRemoteCpuAvailability();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/health.json'),
      { method: 'HEAD' }
    );
  });

  it('should return false when server returns error', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await checkRemoteCpuAvailability();

    expect(result).toBe(false);
  });

  it('should return false on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await checkRemoteCpuAvailability();

    expect(result).toBe(false);
  });

  it('should use HEAD method for efficiency', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await checkRemoteCpuAvailability();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'HEAD' })
    );
  });
});
