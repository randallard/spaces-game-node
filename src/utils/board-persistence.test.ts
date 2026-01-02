/**
 * Integration tests for board persistence to localStorage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BoardSchema } from '@/schemas';
import type { Board } from '@/types';

describe('Board persistence to localStorage', () => {
  const mockBoard: Board = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Board',
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [
      { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
      { position: { row: -1, col: 0 }, type: 'final', order: 3 },
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
    createdAt: Date.now(),
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should save single board to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    const [, setBoards] = result.current;

    // Save board
    act(() => {
      setBoards([mockBoard]);
    });

    // Verify it's in localStorage
    const stored = localStorage.getItem('spaces-game-boards');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(parsed[0].name).toBe('Test Board');
  });

  it('should save multiple boards to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    const [, setBoards] = result.current;

    const board2: Board = {
      ...mockBoard,
      id: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Test Board 2',
    };

    // Save multiple boards
    act(() => {
      setBoards([mockBoard, board2]);
    });

    // Verify they're in localStorage
    const stored = localStorage.getItem('spaces-game-boards');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(parsed[1].id).toBe('223e4567-e89b-12d3-a456-426614174000');
  });

  it('should update existing board in localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    const [, setBoards] = result.current;

    // Save initial board
    act(() => {
      setBoards([mockBoard]);
    });

    // Update board
    const updatedBoard: Board = {
      ...mockBoard,
      name: 'Updated Board Name',
    };

    act(() => {
      setBoards([updatedBoard]);
    });

    // Verify update is in localStorage
    const stored = localStorage.getItem('spaces-game-boards');
    const parsed = JSON.parse(stored!);
    expect(parsed[0].name).toBe('Updated Board Name');
  });

  it('should persist boards across hook re-renders', () => {
    // First render - save board
    const { result: result1 } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    act(() => {
      result1.current[1]([mockBoard]);
    });

    // Second render - should load from localStorage
    const { result: result2 } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    const [boards] = result2.current;
    expect(boards).toHaveLength(1);
    expect(boards).toBeTruthy();
    expect(boards![0]!.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should handle deleting boards from localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    const board2: Board = {
      ...mockBoard,
      id: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Test Board 2',
    };

    // Save multiple boards
    act(() => {
      result.current[1]([mockBoard, board2]);
    });

    // Delete one board
    act(() => {
      result.current[1]([mockBoard]); // Only keep first board
    });

    // Verify deletion in localStorage
    const stored = localStorage.getItem('spaces-game-boards');
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should handle adding new board to existing boards', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    // Save initial board
    act(() => {
      result.current[1]([mockBoard]);
    });

    // Add new board
    const board2: Board = {
      ...mockBoard,
      id: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Test Board 2',
      boardSize: 2,
    };

    act(() => {
      const [currentBoards] = result.current;
      result.current[1]([...(currentBoards || []), board2]);
    });

    // Verify both boards in localStorage
    const stored = localStorage.getItem('spaces-game-boards');
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(2);
  });

  it('should preserve board structure when saving', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    act(() => {
      result.current[1]([mockBoard]);
    });

    const stored = localStorage.getItem('spaces-game-boards');
    const parsed = JSON.parse(stored!);
    const savedBoard = parsed[0];

    // Verify all fields are preserved
    expect(savedBoard.id).toBe(mockBoard.id);
    expect(savedBoard.name).toBe(mockBoard.name);
    expect(savedBoard.grid).toEqual(mockBoard.grid);
    expect(savedBoard.sequence).toEqual(mockBoard.sequence);
    expect(savedBoard.thumbnail).toBe(mockBoard.thumbnail);
    expect(savedBoard.createdAt).toBe(mockBoard.createdAt);
  });

  it('should return empty array when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    const [boards] = result.current;
    expect(boards).toEqual([]);
  });

  it('should handle localStorage key correctly', () => {
    const { result } = renderHook(() =>
      useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
    );

    act(() => {
      result.current[1]([mockBoard]);
    });

    // Verify it uses the correct key
    expect(localStorage.getItem('spaces-game-boards')).toBeTruthy();
    expect(localStorage.getItem('wrong-key')).toBeNull();
  });

  describe('Board save logic (mimicking handleBoardSave)', () => {
    it('should add new board without overwriting existing boards', () => {
      const { result } = renderHook(() =>
        useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
      );

      const [, setBoards] = result.current;

      // Save first board
      act(() => {
        setBoards([mockBoard]);
      });

      // Create and save second board (simulating handleBoardSave logic)
      const board2: Board = {
        ...mockBoard,
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Test Board 2',
      };

      act(() => {
        const [boards] = result.current;
        const currentBoards = boards || [];
        const existingIndex = currentBoards.findIndex((b) => b.id === board2.id);
        if (existingIndex >= 0) {
          const updated = [...currentBoards];
          updated[existingIndex] = board2;
          setBoards(updated);
        } else {
          setBoards([...currentBoards, board2]);
        }
      });

      // Verify both boards exist and first board was NOT overwritten
      const stored = localStorage.getItem('spaces-game-boards');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(parsed[0].name).toBe('Test Board');
      expect(parsed[1].id).toBe('223e4567-e89b-12d3-a456-426614174000');
      expect(parsed[1].name).toBe('Test Board 2');
    });

    it('should update existing board when IDs match', () => {
      const { result } = renderHook(() =>
        useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
      );

      const [, setBoards] = result.current;

      const board2: Board = {
        ...mockBoard,
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Test Board 2',
      };

      // Save two boards
      act(() => {
        setBoards([mockBoard, board2]);
      });

      // Update second board (simulating handleBoardSave logic)
      const updatedBoard2: Board = {
        ...board2,
        name: 'Updated Board 2',
      };

      act(() => {
        const [boards] = result.current;
        const currentBoards = boards || [];
        const existingIndex = currentBoards.findIndex((b) => b.id === updatedBoard2.id);
        if (existingIndex >= 0) {
          const updated = [...currentBoards];
          updated[existingIndex] = updatedBoard2;
          setBoards(updated);
        } else {
          setBoards([...currentBoards, updatedBoard2]);
        }
      });

      // Verify update happened and first board was NOT affected
      const stored = localStorage.getItem('spaces-game-boards');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(parsed[0].name).toBe('Test Board');
      expect(parsed[1].id).toBe('223e4567-e89b-12d3-a456-426614174000');
      expect(parsed[1].name).toBe('Updated Board 2');
    });

    it('should correctly handle saving 3+ boards sequentially', () => {
      const { result } = renderHook(() =>
        useLocalStorage('spaces-game-boards', BoardSchema.array(), [])
      );

      const [, setBoards] = result.current;

      // Helper function mimicking handleBoardSave
      const saveBoard = (board: Board) => {
        const [boards] = result.current;
        const currentBoards = boards || [];
        const existingIndex = currentBoards.findIndex((b) => b.id === board.id);
        if (existingIndex >= 0) {
          const updated = [...currentBoards];
          updated[existingIndex] = board;
          setBoards(updated);
        } else {
          setBoards([...currentBoards, board]);
        }
      };

      // Save first board
      act(() => {
        saveBoard(mockBoard);
      });

      // Save second board
      const board2: Board = {
        ...mockBoard,
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Test Board 2',
      };
      act(() => {
        saveBoard(board2);
      });

      // Save third board
      const board3: Board = {
        ...mockBoard,
        id: '323e4567-e89b-12d3-a456-426614174000',
        name: 'Test Board 3',
      };
      act(() => {
        saveBoard(board3);
      });

      // Verify all three boards exist and none were overwritten
      const stored = localStorage.getItem('spaces-game-boards');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe('Test Board');
      expect(parsed[1].name).toBe('Test Board 2');
      expect(parsed[2].name).toBe('Test Board 3');
    });
  });
});
