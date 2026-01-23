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
    boardSize: 2,
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
      boardSize: 2,
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
    boardSize: 2,
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

  it('should use opponent color for pieces and hide sequence numbers', () => {
    const thumbnail = generateOpponentThumbnail(mockBoard);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('#722ed1'); // Opponent piece color (purple)
    // Opponent pieces should not have <text> elements with numbers
    const textCount = (decoded.match(/<text/g) || []).length;
    expect(textCount).toBe(0); // No text elements for opponent
  });

  it('should differ from player thumbnail (rotation)', () => {
    const playerThumbnail = generateBoardThumbnail(mockBoard);
    const opponentThumbnail = generateOpponentThumbnail(mockBoard);

    // They should be different due to rotation
    expect(playerThumbnail).not.toBe(opponentThumbnail);
  });

  it('should show only trap at specified position', () => {
    const boardWithTrap: Board = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Board with Trap',
      boardSize: 2,
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

    // Show trap at rotated position (1,0) -> rotated to (0,1) on 2x2 board
    const thumbnailWithTrap = generateOpponentThumbnail(boardWithTrap, undefined, { row: 0, col: 1 });
    const decodedWithTrap = decodeURIComponent(thumbnailWithTrap.replace('data:image/svg+xml,', ''));
    expect(decodedWithTrap).toContain('rgb(249, 115, 22)'); // Opponent trap color (orange)

    // Don't show trap when no position specified
    const thumbnailNoTraps = generateOpponentThumbnail(boardWithTrap, undefined, undefined);
    const decodedNoTraps = decodeURIComponent(thumbnailNoTraps.replace('data:image/svg+xml,', ''));
    expect(decodedNoTraps).not.toContain('rgb(249, 115, 22)'); // Should not contain trap color
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

describe('Supermove (piece and trap at same position)', () => {
  it('should render both piece and trap when at same position', () => {
    const boardWithSupermove: Board = {
      id: 'supermove-test',
      name: 'Supermove Board',
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['trap', 'empty'], // Grid shows trap (piece was there, then trap placed)
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 }, // Piece at (1,0)
        { position: { row: 1, col: 0 }, type: 'trap', order: 2 },  // Trap at same position (supermove)
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 }, // Piece moved away
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    const thumbnail = generateBoardThumbnail(boardWithSupermove);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));

    // Should contain both trap (X path) and piece (circle) at position (1,0)
    expect(decoded).toContain('<path'); // Trap X
    expect(decoded).toContain('<circle'); // Piece circle

    // Should show order numbers for both
    expect(decoded).toContain('>1<'); // Piece order 1
    expect(decoded).toContain('>2<'); // Trap order 2
    expect(decoded).toContain('>3<'); // Piece order 3 at new position
  });

  it('should render trap before piece (so piece appears on top)', () => {
    const boardWithSupermove: Board = {
      id: 'supermove-test-2',
      name: 'Supermove Board 2',
      boardSize: 2,
      grid: [
        ['empty', 'empty'],
        ['trap', 'empty'],
      ],
      sequence: [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
      ],
      thumbnail: '',
      createdAt: Date.now(),
    };

    const thumbnail = generateBoardThumbnail(boardWithSupermove);
    const decoded = decodeURIComponent(thumbnail.replace('data:image/svg+xml,', ''));

    // Find positions of trap and piece in SVG string
    const trapIndex = decoded.indexOf('<path');
    const pieceIndex = decoded.indexOf('<circle');

    // Trap should come before piece in the SVG (rendered first, so piece is on top)
    expect(trapIndex).toBeLessThan(pieceIndex);
  });
});
