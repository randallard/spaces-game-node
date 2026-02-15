/**
 * Tests for board scoring utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateBoardScore } from './board-scoring';
import type { Board } from '@/types';

describe('calculateBoardScore', () => {
  it('should score a straight-line 2x2 board as 2 (1 forward + 1 goal)', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
        { position: { row: -1, col: 0 }, type: 'final', order: 3 },
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    expect(calculateBoardScore(board)).toBe(2);
  });

  it('should score a straight-line 3x3 board as 3 (2 forward + 1 goal)', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'empty'],
      ],
      sequence: [
        { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 },
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    expect(calculateBoardScore(board)).toBe(3);
  });

  it('should not count sideways moves as forward progress', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
      grid: [
        ['piece', 'piece'],
        ['piece', 'piece'],
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 1 }, type: 'piece', order: 2 }, // sideways
        { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // forward
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 }, // sideways
        { position: { row: -1, col: 0 }, type: 'final', order: 5 },
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    // 1 forward move (row 1→0) + 1 goal = 2
    expect(calculateBoardScore(board)).toBe(2);
  });

  it('should not count trap moves toward score', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'trap', 'empty'],
        ['piece', 'empty', 'empty'],
      ],
      sequence: [
        { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 1, col: 1 }, type: 'trap', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 },
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    // 2 forward moves + 1 goal = 3
    expect(calculateBoardScore(board)).toBe(3);
  });

  it('should return 0 for a board with no sequence', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 2,
      grid: [
        ['empty', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };

    expect(calculateBoardScore(board)).toBe(0);
  });

  it('should not count backward moves', () => {
    const board: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'empty'],
      ],
      sequence: [
        { position: { row: 2, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 }, // forward
        { position: { row: 2, col: 0 }, type: 'piece', order: 3 }, // backward (no point)
        { position: { row: 1, col: 0 }, type: 'piece', order: 4 }, // forward again
        { position: { row: 0, col: 0 }, type: 'piece', order: 5 }, // forward
        { position: { row: -1, col: 0 }, type: 'final', order: 6 },
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    // 2 new rows reached (row 2→1, row 1→0) + 1 goal = 3 (revisiting row 1 doesn't score again)
    expect(calculateBoardScore(board)).toBe(3);
  });
});
