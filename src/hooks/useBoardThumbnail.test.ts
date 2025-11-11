/**
 * Tests for useBoardThumbnail hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBoardThumbnail } from './useBoardThumbnail';
import type { Board } from '@/types';
import * as svgThumbnail from '@/utils/svg-thumbnail';

// Mock the svg-thumbnail module
vi.mock('@/utils/svg-thumbnail', () => ({
  generateBoardThumbnail: vi.fn(),
}));

// Helper to create a test board
function createTestBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'test-board-1',
    name: 'Test Board',
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [
      {
        position: { row: 0, col: 0 },
        type: 'piece',
        order: 1,
      },
    ],
    thumbnail: 'data:image/svg+xml;base64,test',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('useBoardThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call generateBoardThumbnail with the board', () => {
    const mockThumbnail = 'data:image/svg+xml;base64,mockThumbnail';
    vi.mocked(svgThumbnail.generateBoardThumbnail).mockReturnValue(mockThumbnail);

    const board = createTestBoard();
    renderHook(() => useBoardThumbnail(board));

    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledWith(board);
  });

  it('should return the generated thumbnail', () => {
    const mockThumbnail = 'data:image/svg+xml;base64,mockThumbnail';
    vi.mocked(svgThumbnail.generateBoardThumbnail).mockReturnValue(mockThumbnail);

    const board = createTestBoard();
    const { result } = renderHook(() => useBoardThumbnail(board));

    expect(result.current).toBe(mockThumbnail);
  });

  it('should memoize the result when dependencies do not change', () => {
    const mockThumbnail = 'data:image/svg+xml;base64,mockThumbnail';
    vi.mocked(svgThumbnail.generateBoardThumbnail).mockReturnValue(mockThumbnail);

    const board = createTestBoard();
    const { result, rerender } = renderHook(() => useBoardThumbnail(board));

    const firstResult = result.current;

    // Re-render with same board
    rerender();

    // Should return the same reference (memoized)
    expect(result.current).toBe(firstResult);

    // Should only have been called once
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(1);
  });

  it('should regenerate thumbnail when board ID changes', () => {
    const mockThumbnail1 = 'data:image/svg+xml;base64,thumbnail1';
    const mockThumbnail2 = 'data:image/svg+xml;base64,thumbnail2';

    vi.mocked(svgThumbnail.generateBoardThumbnail)
      .mockReturnValueOnce(mockThumbnail1)
      .mockReturnValueOnce(mockThumbnail2);

    const board1 = createTestBoard({ id: 'board-1' });
    const { result, rerender } = renderHook(
      ({ board }) => useBoardThumbnail(board),
      { initialProps: { board: board1 } }
    );

    expect(result.current).toBe(mockThumbnail1);

    // Change board ID
    const board2 = createTestBoard({ id: 'board-2' });
    rerender({ board: board2 });

    expect(result.current).toBe(mockThumbnail2);
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(2);
  });

  it('should regenerate thumbnail when grid changes', () => {
    const mockThumbnail1 = 'data:image/svg+xml;base64,thumbnail1';
    const mockThumbnail2 = 'data:image/svg+xml;base64,thumbnail2';

    vi.mocked(svgThumbnail.generateBoardThumbnail)
      .mockReturnValueOnce(mockThumbnail1)
      .mockReturnValueOnce(mockThumbnail2);

    const board1 = createTestBoard({
      grid: [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
    });
    const { result, rerender } = renderHook(
      ({ board }) => useBoardThumbnail(board),
      { initialProps: { board: board1 } }
    );

    expect(result.current).toBe(mockThumbnail1);

    // Change grid
    const board2 = createTestBoard({
      grid: [
        ['empty', 'piece'],
        ['trap', 'empty'],
      ],
    });
    rerender({ board: board2 });

    expect(result.current).toBe(mockThumbnail2);
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(2);
  });

  it('should regenerate thumbnail when sequence changes', () => {
    const mockThumbnail1 = 'data:image/svg+xml;base64,thumbnail1';
    const mockThumbnail2 = 'data:image/svg+xml;base64,thumbnail2';

    vi.mocked(svgThumbnail.generateBoardThumbnail)
      .mockReturnValueOnce(mockThumbnail1)
      .mockReturnValueOnce(mockThumbnail2);

    const board1 = createTestBoard({
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      ],
    });
    const { result, rerender } = renderHook(
      ({ board }) => useBoardThumbnail(board),
      { initialProps: { board: board1 } }
    );

    expect(result.current).toBe(mockThumbnail1);

    // Change sequence
    const board2 = createTestBoard({
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
      ],
    });
    rerender({ board: board2 });

    expect(result.current).toBe(mockThumbnail2);
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(2);
  });

  it('should regenerate thumbnail when boardSize changes', () => {
    const mockThumbnail1 = 'data:image/svg+xml;base64,thumbnail1';
    const mockThumbnail2 = 'data:image/svg+xml;base64,thumbnail2';

    vi.mocked(svgThumbnail.generateBoardThumbnail)
      .mockReturnValueOnce(mockThumbnail1)
      .mockReturnValueOnce(mockThumbnail2);

    const board1 = createTestBoard({ boardSize: 2 });
    const { result, rerender } = renderHook(
      ({ board }) => useBoardThumbnail(board),
      { initialProps: { board: board1 } }
    );

    expect(result.current).toBe(mockThumbnail1);

    // Change board size
    const board2 = createTestBoard({ boardSize: 3 });
    rerender({ board: board2 });

    expect(result.current).toBe(mockThumbnail2);
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(2);
  });

  it('should not regenerate when only name changes', () => {
    const mockThumbnail = 'data:image/svg+xml;base64,thumbnail';
    vi.mocked(svgThumbnail.generateBoardThumbnail).mockReturnValue(mockThumbnail);

    const board1 = createTestBoard({ name: 'Board 1' });
    const { result, rerender } = renderHook(
      ({ board }) => useBoardThumbnail(board),
      { initialProps: { board: board1 } }
    );

    expect(result.current).toBe(mockThumbnail);

    // Change only name (not a dependency)
    const board2 = { ...board1, name: 'Board 2' };
    rerender({ board: board2 });

    // Should still be memoized (only called once)
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(1);
  });

  it('should not regenerate when only createdAt changes', () => {
    const mockThumbnail = 'data:image/svg+xml;base64,thumbnail';
    vi.mocked(svgThumbnail.generateBoardThumbnail).mockReturnValue(mockThumbnail);

    const board1 = createTestBoard({ createdAt: 1000 });
    const { result, rerender } = renderHook(
      ({ board }) => useBoardThumbnail(board),
      { initialProps: { board: board1 } }
    );

    expect(result.current).toBe(mockThumbnail);

    // Change only createdAt (not a dependency)
    const board2 = { ...board1, createdAt: 2000 };
    rerender({ board: board2 });

    // Should still be memoized (only called once)
    expect(svgThumbnail.generateBoardThumbnail).toHaveBeenCalledTimes(1);
  });
});
