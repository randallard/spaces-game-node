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

    // Both players should have pieces at the same location (split circle)
    // Blue half circle (player)
    expect(svg).toContain('fill="rgb(37, 99, 235)"');
    // Purple half circle (opponent)
    expect(svg).toContain('fill="rgb(147, 51, 234)"');
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

  it('should show all four corners when both opponents choose identical boards', () => {
    // Create identical boards for both players
    // Grid layout: piece in top-left (0,0) and bottom-left (1,0)
    const identicalGrid: Array<Array<'empty' | 'piece'>> = [
      ['piece', 'empty'],
      ['piece', 'empty'],
    ];

    const identicalSequence = [
      { row: 0, col: 0, type: 'piece' as const }, // Step 1
      { row: 1, col: 0, type: 'piece' as const }, // Step 2
    ];

    const playerBoard = createTestBoard('Player', identicalGrid, identicalSequence);
    const opponentBoard = createTestBoard('Opponent', identicalGrid, identicalSequence);

    // When opponent's board is rotated 180 degrees:
    // - Opponent's (0,0) becomes (1,1) in player's view
    // - Opponent's (1,0) becomes (0,1) in player's view
    // Player has pieces at (0,0) and (1,0)
    // So there's no overlap in this case

    const result = createTestResult(
      playerBoard,
      opponentBoard,
      { row: 1, col: 0 }, // Player ends at bottom-left
      { row: 1, col: 0 }  // Opponent ends at bottom-left (rotates to 0,1 in player's view)
    );

    const result_obj = generateCombinedBoardSvg(playerBoard, opponentBoard, result);
    const svg = result_obj.svg;

    // Should show both blue and purple pieces
    expect(svg).toContain('rgb(37, 99, 235)'); // Blue (player)
    expect(svg).toContain('rgb(147, 51, 234)'); // Purple (opponent)

    // Player has pieces at (0,0) and (1,0) with steps 1,2
    expect(svg).toContain('>1<');
    expect(svg).toContain('>2<');
  });

  it('should show opponent trap when both players choose identical boards with traps', () => {
    // Both players choose the same board:
    // - Piece at (1,0) step 1 (bottom-left)
    // - Trap at (1,1) step 2 (bottom-right)
    // - Piece at (0,0) step 3 (top-left)
    //
    // IMPORTANT: In real boards, the grid has 'trap' at the trap position
    // We test this WITHOUT the trap in the grid to replicate the bug
    const identicalGrid: Array<Array<'empty' | 'piece' | 'trap'>> = [
      ['piece', 'empty'],
      ['piece', 'empty'], // NO trap in grid - trap only in sequence
    ];

    const identicalSequence = [
      { row: 1, col: 0, type: 'piece' as const }, // Step 1 at (1,0)
      { row: 1, col: 1, type: 'trap' as const },  // Step 2 at (1,1)
      { row: 0, col: 0, type: 'piece' as const }, // Step 3 at (0,0)
    ];

    const ryanBoard = createTestBoard('Ryan', identicalGrid, identicalSequence);
    const tedBoard = createTestBoard('Ted', identicalGrid, identicalSequence);

    // From Ryan's perspective (Ryan = player, Ted = opponent)
    // After 180° rotation:
    // - Ryan's board: piece at (1,0), trap at (1,1), piece at (0,0)
    // - Ted's board rotated:
    //   - (1,0) → (0,1) piece step 1
    //   - (1,1) → (0,0) trap step 2
    //   - (0,0) → (1,1) piece step 3
    //
    // Ryan's piece at step 3 is at (0,0), which is where Ted's trap rotates to
    // So Ryan hits Ted's trap at (0,0)
    const ryanResult = createTestResult(
      ryanBoard,
      tedBoard,
      { row: 0, col: 0 }, // Ryan ends at (0,0)
      { row: 0, col: 0 }  // Ted ends at (0,0), which rotates to (1,1) in Ryan's view
    );

    // Ryan hit Ted's trap at (0,0) in Ryan's view
    // After the fix in App.tsx, playerTrapPosition should be rotated back to (0,0)
    // The original simulation set opponentTrapPosition = (1,1) (Ryan's rotated piece position)
    // App.tsx now rotates it: (1,1) → (0,0) before setting as Ryan's playerTrapPosition
    ryanResult.simulationDetails!.playerHitTrap = true;
    ryanResult.simulationDetails!.playerTrapPosition = { row: 0, col: 0 }; // After rotation fix

    const ryanView = generateCombinedBoardSvg(ryanBoard, tedBoard, ryanResult);

    // Ryan's view should show:
    // (0,0): Blue piece "3" + Orange trap "2" (Ted's trap)
    // (0,1): Purple piece "1" (Ted's piece)
    // (1,0): Blue piece "1" (Ryan's piece)
    // (1,1): Purple piece "3" (Ted's piece) + Red trap "2" (Ryan's trap)

    // Should show Ryan's trap (red)
    expect(ryanView.svg).toContain('rgb(220, 38, 38)'); // Red for player trap

    // Should show Ted's trap (orange) - THIS IS THE BUG
    expect(ryanView.svg).toContain('rgb(249, 115, 22)'); // Orange for opponent trap

    // From Ted's perspective (Ted = player, Ryan = opponent)
    // After 180° rotation:
    // - Ted's board: piece at (1,0), trap at (1,1), piece at (0,0)
    // - Ryan's board rotated:
    //   - (1,0) → (0,1) piece step 1
    //   - (1,1) → (0,0) trap step 2
    //   - (0,0) → (1,1) piece step 3
    const tedResult = createTestResult(
      tedBoard,
      ryanBoard,
      { row: 0, col: 0 }, // Ted ends at (0,0)
      { row: 0, col: 0 }  // Ryan ends at (0,0), which rotates to (1,1) in Ted's view
    );

    // Ted hit Ryan's trap at the rotated position (0,0)
    tedResult.simulationDetails!.playerHitTrap = true;
    tedResult.simulationDetails!.playerTrapPosition = { row: 0, col: 0 };

    const tedView = generateCombinedBoardSvg(tedBoard, ryanBoard, tedResult);

    // Ted's view should show:
    // (0,0): Blue piece "3" + Orange trap "2" (Ryan's trap) - THIS WORKS
    // (0,1): Purple piece "1" (Ryan's piece)
    // (1,0): Blue piece "1" (Ted's piece)
    // (1,1): Purple piece "3" (Ryan's piece) + Red trap "2" (Ted's trap)

    // Should show Ted's trap (red)
    expect(tedView.svg).toContain('rgb(220, 38, 38)'); // Red for player trap

    // Should show Ryan's trap (orange)
    expect(tedView.svg).toContain('rgb(249, 115, 22)'); // Orange for opponent trap
  });
});
