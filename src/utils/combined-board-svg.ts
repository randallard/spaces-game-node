/**
 * Combined board SVG generation for round results visualization
 * Shows both player and opponent moves overlaid on the same board
 */

import type { Board, RoundResult, Position } from '@/types';

interface SquareData {
  playerVisits: number[];
  opponentVisits: number[];
  playerTrapStep: number | null;
  opponentTrapStep: number | null;
  collision: boolean;
}

/**
 * Rotate position 180 degrees for opponent's perspective
 */
function rotatePosition(row: number, col: number, size: number): Position {
  return {
    row: size - 1 - row,
    col: size - 1 - col,
  };
}

/**
 * Build grid data from both boards
 */
function buildGridData(
  playerBoard: Board,
  opponentBoard: Board,
  result: RoundResult,
  playerMaxStep?: number,
  opponentMaxStep?: number
): SquareData[][] {
  const size = playerBoard.grid.length;
  const grid: SquareData[][] = [];

  // Initialize grid
  for (let i = 0; i < size; i++) {
    const row: SquareData[] = [];
    for (let j = 0; j < size; j++) {
      row.push({
        playerVisits: [],
        opponentVisits: [],
        playerTrapStep: null,
        opponentTrapStep: null,
        collision: false,
      });
    }
    grid.push(row);
  }

  // Process player sequence (up to playerMaxStep if provided)
  // Note: Traps are always shown (they're part of board design), only pieces are limited by maxStep
  console.log('[buildGridData] Processing player sequence, playerMaxStep:', playerMaxStep);
  playerBoard.sequence.forEach((move, step) => {
    console.log(`[buildGridData] Player step ${step}: type=${move.type}, pos=(${move.position.row},${move.position.col}), playerMaxStep=${playerMaxStep}`);
    if (move.type === 'final') {
      console.log(`[buildGridData] Skipping player step ${step} because it's a final move`);
      return; // Skip final moves
    }

    const { row, col } = move.position;
    if (row >= 0 && row < size && col >= 0 && col < size) {
      const square = grid[row]![col]!;

      if (move.type === 'piece') {
        // Only show pieces up to playerMaxStep
        if (playerMaxStep !== undefined && step > playerMaxStep) {
          console.log(`[buildGridData] Skipping player piece at step ${step} because step > playerMaxStep`);
          return;
        }
        console.log(`[buildGridData] Adding player piece at (${row},${col}), step ${step}`);
        square.playerVisits.push(step);
      } else if (move.type === 'trap') {
        // Always show traps (they're part of board design)
        console.log(`[buildGridData] Adding player trap at (${row},${col}), step ${step}`);
        square.playerTrapStep = step;
      }
    }
  });

  // Process opponent sequence (rotated, up to opponentMaxStep if provided)
  // Note: Opponent traps are only shown if player hit one (we don't reveal unsprung traps)
  // But pieces are limited by opponentMaxStep
  const playerTrapPosition = result.simulationDetails?.playerTrapPosition;
  const playerHitTrap = result.simulationDetails?.playerHitTrap;

  console.log('[buildGridData] Processing opponent sequence, opponentMaxStep:', opponentMaxStep);
  console.log('[buildGridData] playerTrapPosition:', playerTrapPosition);
  console.log('[buildGridData] playerHitTrap:', playerHitTrap);
  console.log('[buildGridData] Opponent board name:', opponentBoard.name);
  console.log('[buildGridData] Full opponent sequence:');
  opponentBoard.sequence.forEach((move, i) => {
    console.log(`  Step ${i}: type=${move.type}, pos=(${move.position.row},${move.position.col})`);
  });
  console.log('[buildGridData] Opponent board grid (ALL cells):');
  opponentBoard.grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const rotated = rotatePosition(r, c, size);
      console.log(`  Grid cell ORIGINAL(${r},${c}) = "${cell}", ROTATED to (${rotated.row},${rotated.col})`);

      // Show traps from the grid if player hit one there
      if (cell === 'trap' && playerTrapPosition &&
          playerTrapPosition.row === rotated.row &&
          playerTrapPosition.col === rotated.col) {
        console.log(`  [MATCH] Grid trap at ROTATED(${rotated.row},${rotated.col}) matches playerTrapPosition!`);
        const square = grid[rotated.row]![rotated.col]!;
        square.opponentTrapStep = -1; // Use -1 to indicate it's a static grid trap
      }
    });
  });
  opponentBoard.sequence.forEach((move, step) => {
    console.log(`[buildGridData] Opponent step ${step}: type=${move.type}, pos=(${move.position.row},${move.position.col}), opponentMaxStep=${opponentMaxStep}`);
    if (move.type === 'final') {
      console.log(`[buildGridData] Skipping opponent step ${step} because it's a final move`);
      return; // Skip final moves
    }

    const rotated = rotatePosition(move.position.row, move.position.col, size);
    const { row, col } = rotated;
    console.log(`[buildGridData] Rotated opponent position: (${row},${col})`);

    if (row >= 0 && row < size && col >= 0 && col < size) {
      const square = grid[row]![col]!;

      if (move.type === 'piece') {
        // Only show pieces up to opponentMaxStep
        if (opponentMaxStep !== undefined && step > opponentMaxStep) {
          console.log(`[buildGridData] Skipping opponent piece at step ${step} because step > opponentMaxStep`);
          return;
        }
        console.log(`[buildGridData] Adding opponent piece at (${row},${col}), step ${step}`);
        square.opponentVisits.push(step);
      } else if (move.type === 'trap') {
        // Show opponent trap if:
        // 1. Player hit it at this exact position, OR
        // 2. Player hit a trap but position wasn't recorded (backward compatibility)
        const showTrap = (playerTrapPosition && playerTrapPosition.row === row && playerTrapPosition.col === col) ||
                        (playerHitTrap && !playerTrapPosition);

        if (showTrap) {
          console.log(`[buildGridData] Adding opponent trap at (${row},${col}), step ${step}`);
          square.opponentTrapStep = step;
        } else {
          console.log(`[buildGridData] Skipping opponent trap at (${row},${col}) - player didn't hit it there`);
        }
      }
    }
  });

  // Mark collision square if both players end at the same position
  const playerFinal = result.playerFinalPosition;
  const opponentFinalRotated = rotatePosition(
    result.opponentFinalPosition.row,
    result.opponentFinalPosition.col,
    size
  );

  if (
    playerFinal.row === opponentFinalRotated.row &&
    playerFinal.col === opponentFinalRotated.col
  ) {
    const { row, col } = playerFinal;
    if (row >= 0 && row < size && col >= 0 && col < size) {
      grid[row]![col]!.collision = true;
    }
  }

  return grid;
}

/**
 * Generate combined board SVG showing both player and opponent moves
 *
 * @param playerBoard - Player's board
 * @param opponentBoard - Opponent's board
 * @param result - Round result data
 * @param playerMaxStep - Optional maximum step to show for player (for replay animation)
 * @param opponentMaxStep - Optional maximum step to show for opponent (for replay animation)
 * @returns Object with both raw SVG string and data URI
 */
export function generateCombinedBoardSvg(
  playerBoard: Board,
  opponentBoard: Board,
  result: RoundResult,
  playerMaxStep?: number,
  opponentMaxStep?: number
): { svg: string; dataUri: string } {
  // Defensive check: ensure boards exist and have valid data
  const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  if (!playerBoard || !playerBoard.grid || !playerBoard.sequence) {
    console.error('[generateCombinedBoardSvg] Invalid playerBoard:', playerBoard);
    return { svg: emptySvg, dataUri: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E' };
  }

  if (!opponentBoard || !opponentBoard.grid || !opponentBoard.sequence) {
    console.error('[generateCombinedBoardSvg] Invalid opponentBoard:', opponentBoard);
    return { svg: emptySvg, dataUri: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E' };
  }

  const size = playerBoard.grid.length;
  const cellSize = 45;
  const viewBoxSize = size * cellSize + 10;

  console.log('[generateCombinedBoardSvg] Board size:', size);
  console.log('[generateCombinedBoardSvg] Player board:', playerBoard.name, 'Sequence length:', playerBoard.sequence.length);
  console.log('[generateCombinedBoardSvg] Opponent board:', opponentBoard.name, 'Sequence length:', opponentBoard.sequence.length);

  const grid = buildGridData(playerBoard, opponentBoard, result, playerMaxStep, opponentMaxStep);

  console.log('[generateCombinedBoardSvg] Grid data built, checking for pieces...');
  let totalPlayerVisits = 0;
  let totalOpponentVisits = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const square = grid[i]![j]!;
      totalPlayerVisits += square.playerVisits.length;
      totalOpponentVisits += square.opponentVisits.length;
    }
  }
  console.log('[generateCombinedBoardSvg] Total player visits:', totalPlayerVisits, 'Total opponent visits:', totalOpponentVisits);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">`;
  svg += `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="rgb(30, 41, 59)"/>`;
  svg += '<g transform="translate(5,5)">';

  // Draw grid background
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = j * cellSize;
      const y = i * cellSize;
      svg += `<rect x="${x}" y="${y}" width="40" height="40" fill="rgb(51, 65, 85)"/>`;
    }
  }

  // Draw pieces
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const square = grid[i]![j]!;
      const x = j * cellSize;
      const y = i * cellSize;
      const centerX = x + 20;
      const centerY = y + 20;

      const hasPlayer = square.playerVisits.length > 0;
      const hasOpponent = square.opponentVisits.length > 0;

      if (hasPlayer && hasOpponent) {
        // Split circle - both players visited this square
        const radius = 15;
        const verticalOffset = -15; // Move up to avoid overlap with traps

        // Blue half circle (left)
        svg += `<path d="M ${centerX - radius},${centerY + verticalOffset} a ${radius},${radius} 0 0 1 ${radius},0 v ${radius * 2} a ${radius},${radius} 0 0 1 -${radius},0" fill="rgb(37, 99, 235)"/>`;

        // Purple half circle (right)
        svg += `<path d="M ${centerX + radius},${centerY + verticalOffset} a ${radius},${radius} 0 0 0 -${radius},0 v ${radius * 2} a ${radius},${radius} 0 0 0 ${radius},0" fill="rgb(147, 51, 234)"/>`;

        // Show both player and opponent numbers
        const playerStep = Math.max(...square.playerVisits);
        const opponentStep = Math.max(...square.opponentVisits);
        svg += `<text x="${centerX - radius / 2}" y="${centerY}" font-size="16" fill="white" text-anchor="middle" dy=".3em">${playerStep + 1}</text>`;
        svg += `<text x="${centerX + radius / 2}" y="${centerY}" font-size="16" fill="white" text-anchor="middle" dy=".3em">${opponentStep + 1}</text>`;
      } else if (hasPlayer) {
        // Only player visited
        const step = Math.max(...square.playerVisits);
        svg += `<circle cx="${centerX}" cy="${centerY}" r="15" fill="rgb(37, 99, 235)"/>`;
        svg += `<text x="${centerX}" y="${centerY}" font-size="16" fill="white" text-anchor="middle" dy=".3em">${step + 1}</text>`;
      } else if (hasOpponent) {
        // Only opponent visited - show number
        const step = Math.max(...square.opponentVisits);
        svg += `<circle cx="${centerX}" cy="${centerY}" r="15" fill="rgb(147, 51, 234)"/>`;
        svg += `<text x="${centerX}" y="${centerY}" font-size="16" fill="white" text-anchor="middle" dy=".3em">${step + 1}</text>`;
      }
    }
  }

  // Draw traps
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const square = grid[i]![j]!;
      const x = j * cellSize;
      const y = i * cellSize;

      const hasPlayerTrap = square.playerTrapStep !== null;
      const hasOpponentTrap = square.opponentTrapStep !== null;

      if (hasPlayerTrap && hasOpponentTrap) {
        // Both traps - slightly rotated
        // Player trap (red, rotated +3 degrees) with number
        svg += `<g transform="translate(${x + 5} ${y + 5}) rotate(3 15 15)">`;
        svg += `<path d="M0 0 l30 30 m0 -30 l-30 30" stroke="rgb(220, 38, 38)" stroke-width="4" opacity="0.6"/>`;
        svg += `</g>`;
        svg += `<text x="${x + 5}" y="${y + 20}" font-size="16" fill="rgb(220, 38, 38)" text-anchor="middle" dy=".3em">${square.playerTrapStep! + 1}</text>`;

        // Opponent trap (orange, rotated -3 degrees) with number (or no number if static grid trap)
        svg += `<g transform="translate(${x + 5} ${y + 5}) rotate(-3 15 15)">`;
        svg += `<path d="M0 0 l30 30 m0 -30 l-30 30" stroke="rgb(249, 115, 22)" stroke-width="4" opacity="0.6"/>`;
        svg += `</g>`;
        // Only show step number if it's a sequence trap (step >= 0), not a static grid trap (step === -1)
        if (square.opponentTrapStep! >= 0) {
          svg += `<text x="${x + 25}" y="${y + 20}" font-size="16" fill="rgb(249, 115, 22)" text-anchor="middle" dy=".3em">${square.opponentTrapStep! + 1}</text>`;
        }
      } else if (hasPlayerTrap) {
        // Only player trap with number
        svg += `<path d="M${x + 5} ${y + 5} l30 30 m0 -30 l-30 30" stroke="rgb(220, 38, 38)" stroke-width="4" opacity="0.6"/>`;
        svg += `<text x="${x + 35}" y="${y + 20}" font-size="16" fill="rgb(220, 38, 38)" text-anchor="middle" dy=".3em">${square.playerTrapStep! + 1}</text>`;
      } else if (hasOpponentTrap) {
        // Only opponent trap with number (or no number if static grid trap)
        svg += `<path d="M${x + 5} ${y + 5} l30 30 m0 -30 l-30 30" stroke="rgb(249, 115, 22)" stroke-width="4" opacity="0.6"/>`;
        // Only show step number if it's a sequence trap (step >= 0), not a static grid trap (step === -1)
        if (square.opponentTrapStep! >= 0) {
          svg += `<text x="${x + 35}" y="${y + 20}" font-size="16" fill="rgb(249, 115, 22)" text-anchor="middle" dy=".3em">${square.opponentTrapStep! + 1}</text>`;
        }
      }
    }
  }

  svg += '</g></svg>';

  console.log('[generateCombinedBoardSvg] SVG generated, length:', svg.length, 'First 200 chars:', svg.substring(0, 200));

  // Create data URI using base64 encoding (better cross-browser compatibility)
  // Use modern TextEncoder API for proper UTF-8 handling
  let dataUri: string;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(svg);
    let binaryString = '';
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]!);
    }
    const base64 = btoa(binaryString);
    dataUri = `data:image/svg+xml;base64,${base64}`;
    console.log('[generateCombinedBoardSvg] Data URI length:', dataUri.length);
  } catch (error) {
    console.error('[generateCombinedBoardSvg] Error encoding SVG:', error);
    // Fallback to simple URL encoding
    const encoded = encodeURIComponent(svg);
    dataUri = `data:image/svg+xml,${encoded}`;
  }

  return { svg, dataUri };
}
