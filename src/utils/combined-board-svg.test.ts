/**
 * Tests for combined board SVG generation
 */

import { describe, it, expect } from 'vitest';
import { generateCombinedBoardSvg } from './combined-board-svg';
import type { Board, RoundResult } from '@/types';

// Helper to create test board
const createTestBoard = (
  name: string,
  grid: Array<Array<'empty' | 'piece' | 'trap' | 'final'>>,
  sequence: Array<{ row: number; col: number; type: 'piece' | 'trap' | 'final' }>
): Board => ({
  id: `board-${name}`,
  name,
  boardSize: 2,
  grid,
  sequence: sequence.map((s, index) => ({
    position: { row: s.row, col: s.col },
    type: s.type,
    order: index + 1,
  })),
  thumbnail: 'data:image/svg+xml;base64,test',
  createdAt: Date.now(),
});

// Helper to create basic round result
const createTestResult = (
  playerBoard: Board,
  opponentBoard: Board,
  playerFinalPosition: { row: number; col: number },
  opponentFinalPosition: { row: number; col: number }
): RoundResult => ({
  round: 1,
  winner: 'tie',
  playerBoard,
  opponentBoard,
  playerFinalPosition,
  opponentFinalPosition,
  playerPoints: 0,
  opponentPoints: 0,
  playerOutcome: 'tie',
  simulationDetails: {
    playerMoves: playerBoard.sequence.filter((m) => m.type === 'piece').length,
    opponentMoves: opponentBoard.sequence.filter((m) => m.type === 'piece').length,
    playerHitTrap: false,
    opponentHitTrap: false,
    playerLastStep: playerBoard.sequence.length - 1,
    opponentLastStep: opponentBoard.sequence.length - 1,
  },
});

describe('generateCombinedBoardSvg', () => {
  it('should generate valid SVG data URI', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);

    // Check that dataUri is a valid data URI (now using base64)
    expect(result_obj.dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
    // Check that svg contains raw SVG
    expect(result_obj.svg).toContain('<svg');
    expect(result_obj.svg).toContain('</svg>');
  });

  it('should include player piece (blue)', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Player piece is blue (rgb(37, 99, 235))
    expect(svg).toContain('rgb(37, 99, 235)');
  });

  it('should include opponent piece (purple)', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Opponent piece is purple (rgb(147, 51, 234))
    expect(svg).toContain('rgb(147, 51, 234)');
  });

  it('should show player trap (red)', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['trap', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'trap' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Player trap is red (rgb(220, 38, 38))
    expect(svg).toContain('rgb(220, 38, 38)');
  });

  it('should show opponent trap (orange)', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'trap'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'trap' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    // Set playerTrapPosition so opponent trap at (1,0) becomes visible (rotated from opponent's 0,1)
    result.simulationDetails!.playerHitTrap = true;
    result.simulationDetails!.playerLastStep = 0;
    result.simulationDetails!.playerTrapPosition = { row: 1, col: 0 }; // Rotated position where player hit trap

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Opponent trap is orange (rgb(249, 115, 22))
    expect(svg).toContain('rgb(249, 115, 22)');
  });

  it('should mark collision when both players end at same position', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 1, col: 1, type: 'piece' }] // Rotates to (0, 0)
    );

    // Both end at (0, 0)
    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 1, col: 1 } // Rotates to (0, 0)
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Collision markers are asterisks in red/orange
    expect(svg).toContain('*');
  });

  it('should show split circle when both players visit same square', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'piece' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 1, col: 1, type: 'piece' }] // Rotates to (0, 0)
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 1, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Split circle uses path elements
    expect(svg).toContain('<path');
    // Should contain both colors for split circle
    expect(svg).toContain('rgb(37, 99, 235)'); // Blue
    expect(svg).toContain('rgb(147, 51, 234)'); // Purple
  });

  it('should respect maxStep parameter for replay', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'piece' },
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    // Show only first step
    const result1 = generateCombinedBoardSvg(playerBoard, opponentBoard, result, 0);
    const svg1 = result1.svg;

    // Should show step 1 but not step 2
    expect(svg1).toContain('>1<'); // Step 1 text
    expect(svg1).not.toContain('>2<'); // Step 2 shouldn't appear

    // Show both steps
    const result2 = generateCombinedBoardSvg(playerBoard, opponentBoard, result, 1);
    const svg2 = result2.svg;

    // Should show both steps
    expect(svg2).toContain('>1<');
    expect(svg2).toContain('>2<');
  });

  it('should skip final moves when rendering', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' },
        { row: 0, col: 0, type: 'piece' },
        { row: -1, col: 0, type: 'final' },
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Should only show steps 1 and 2 (not the final move which is step 3)
    expect(svg).toContain('>1<');
    expect(svg).toContain('>2<');
    expect(svg).not.toContain('>3<');
  });

  it('should handle both traps at same position', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['trap', 'empty'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 0, type: 'trap' }]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'trap'],
        ['empty', 'empty'],
      ],
      [{ row: 1, col: 1, type: 'trap' }] // Rotates to (0, 0)
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    // Set playerTrapPosition so opponent trap at (0,0) becomes visible
    result.simulationDetails!.playerHitTrap = true;
    result.simulationDetails!.playerLastStep = 0;
    result.simulationDetails!.playerTrapPosition = { row: 0, col: 0 }; // Position where player hit trap

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Should show both trap colors
    expect(svg).toContain('rgb(220, 38, 38)'); // Red
    expect(svg).toContain('rgb(249, 115, 22)'); // Orange
    // Both traps should be rotated slightly
    expect(svg).toContain('rotate(3');
    expect(svg).toContain('rotate(-3');
  });

  it('should generate correct viewBox size for different grid sizes', () => {
    const createBoardWithSize = (size: number): Board => {
      const grid: Array<Array<'empty' | 'piece'>> = [];
      for (let i = 0; i < size; i++) {
        const row: Array<'empty' | 'piece'> = [];
        for (let j = 0; j < size; j++) {
          row.push('empty');
        }
        grid.push(row);
      }
      grid[0]![0] = 'piece';

      return {
        id: 'test',
        name: 'Test',
        boardSize: size as 2 | 3,
        grid,
        sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
        thumbnail: 'test',
        createdAt: Date.now(),
      };
    };

    // Test with 2x2 grid
    const board2 = createBoardWithSize(2);
    const result2 = createTestResult(board2, board2, { row: 0, col: 0 }, { row: 1, col: 1 });
    const result_obj2 = generateCombinedBoardSvg(board2, board2, result2);
    const svg2 = result_obj2.svg;

    // 2 * 45 + 10 = 100
    expect(svg2).toContain('viewBox="0 0 100 100"');

    // Test with 3x3 grid
    const board3 = createBoardWithSize(3);
    const result3 = createTestResult(board3, board3, { row: 0, col: 0 }, { row: 2, col: 2 });
    const result_obj3 = generateCombinedBoardSvg(board3, board3, result3);
    const svg3 = result_obj3.svg;

    // 3 * 45 + 10 = 145
    expect(svg3).toContain('viewBox="0 0 145 145"');
  });

  it('should display step numbers starting from 1', () => {
    const playerBoard = createTestBoard(
      'Player',
      [
        ['piece', 'empty'],
        ['piece', 'empty'],
      ],
      [
        { row: 1, col: 0, type: 'piece' }, // Step 0 in array, displays as 1
        { row: 0, col: 0, type: 'piece' }, // Step 1 in array, displays as 2
      ]
    );

    const opponentBoard = createTestBoard(
      'Opponent',
      [
        ['empty', 'piece'],
        ['empty', 'empty'],
      ],
      [{ row: 0, col: 1, type: 'piece' }]
    );

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Steps should be displayed as 1, 2 (not 0, 1)
    expect(svg).toContain('>1<');
    expect(svg).toContain('>2<');
  });
});
