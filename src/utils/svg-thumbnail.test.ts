/**
 * Tests for SVG thumbnail generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateBoardThumbnail,
  generateOpponentThumbnail,
  generateBlankThumbnail,
  getCellContentColor,
} from './svg-thumbnail';
import type { Board } from '@/types';

describe('generateBoardThumbnail', () => {
  const mockBoard: Board = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Board',
    grid: [
      ['piece', 'empty'],
      ['trap', 'empty'],
    ],
    sequence: [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    ],
    thumbnail: '',
    createdAt: Date.now(),
  };

  it('should generate valid data URI', () => {
    const thumbnail = generateBoardThumbnail(mockBoard);
    expect(thumbnail).toContain('data:image/svg+xml,');
  });

  it('should contain SVG markup', () => {
    const thumbnail = generateBoardThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('</svg>');
  });

  it('should include grid cells', () => {
    const thumbnail = generateBoardThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    // Should have 4 cells for 2x2 grid
    const cellCount = (decoded.match(/<rect.*?fill="#e8e8e8"/g) || []).length;
    expect(cellCount).toBe(4);
  });

  it('should include piece visualization', () => {
    const thumbnail = generateBoardThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('<circle'); // Piece is a circle
    expect(decoded).toContain('#4a90e2'); // Player piece color
  });

  it('should include trap visualization', () => {
    const thumbnail = generateBoardThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('<path'); // Trap is a path (X)
    expect(decoded).toContain('#f5222d'); // Trap color
  });

  it('should include sequence numbers', () => {
    const thumbnail = generateBoardThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('>1<'); // First move
    expect(decoded).toContain('>2<'); // Second move
  });

  it('should handle empty board', () => {
    const emptyBoard: Board = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Empty',
      grid: [
        ['empty', 'empty'],
        ['empty', 'empty'],
      ],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    };

    const thumbnail = generateBoardThumbnail(emptyBoard);
    expect(thumbnail).toContain('data:image/svg+xml,');
  });
});

describe('generateOpponentThumbnail', () => {
  const mockBoard: Board = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Board',
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [
      { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
    ],
    thumbnail: '',
    createdAt: Date.now(),
  };

  it('should generate valid data URI', () => {
    const thumbnail = generateOpponentThumbnail(mockBoard);
    expect(thumbnail).toContain('data:image/svg+xml,');
  });

  it('should use opponent color for pieces', () => {
    const thumbnail = generateOpponentThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('#722ed1'); // Opponent piece color (purple)
  });

  it('should differ from player thumbnail (rotation)', () => {
    const playerThumbnail = generateBoardThumbnail(mockBoard);
    const opponentThumbnail = generateOpponentThumbnail(mockBoard);

    // They should be different due to rotation
    expect(playerThumbnail).not.toBe(opponentThumbnail);
  });
});

describe('generateBlankThumbnail', () => {
  it('should generate valid data URI', () => {
    const thumbnail = generateBlankThumbnail();
    expect(thumbnail).toContain('data:image/svg+xml,');
  });

  it('should contain only grid cells, no pieces', () => {
    const thumbnail = generateBlankThumbnail();
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('<svg');
    expect(decoded).not.toContain('<circle'); // No pieces
    expect(decoded).not.toContain('<path'); // No traps
  });

  it('should generate 2x2 grid by default', () => {
    const thumbnail = generateBlankThumbnail();
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    const cellCount = (decoded.match(/<rect.*?fill="#e8e8e8"/g) || []).length;
    expect(cellCount).toBe(4);
  });

  it('should generate custom size grid', () => {
    const thumbnail = generateBlankThumbnail(3);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    const cellCount = (decoded.match(/<rect.*?fill="#e8e8e8"/g) || []).length;
    expect(cellCount).toBe(9); // 3x3
  });
});

describe('getCellContentColor', () => {
  it('should return blue for piece', () => {
    expect(getCellContentColor('piece')).toBe('#4a90e2');
  });

  it('should return red for trap', () => {
    expect(getCellContentColor('trap')).toBe('#f5222d');
  });

  it('should return light gray for empty', () => {
    expect(getCellContentColor('empty')).toBe('#e8e8e8');
  });
});
