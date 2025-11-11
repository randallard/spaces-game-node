/**
 * SVG thumbnail generation for board visualization
 */

import type { Board, CellContent } from '@/types';

/**
 * Generate SVG thumbnail for a board (player perspective)
 */
export function generateBoardThumbnail(board: Board): string {
  const svg = createBoardSvg(board, false);
  return createDataUri(svg);
}

/**
 * Generate SVG thumbnail for opponent's board (180-degree rotated)
 * @param board - The opponent's board
 * @param maxStep - Maximum step to render (for replay animation)
 * @param trapPositionToShow - If provided, only show trap at this rotated position (in global coordinates)
 */
export function generateOpponentThumbnail(
  board: Board,
  maxStep?: number,
  trapPositionToShow?: { row: number; col: number }
): string {
  const svg = createBoardSvg(board, true, maxStep, trapPositionToShow);
  return createDataUri(svg);
}

/**
 * Create SVG string for board
 * @param board - The board to render
 * @param rotated - Whether to rotate 180 degrees (for opponent view)
 * @param maxStep - Maximum step to render (for replay animation)
 * @param trapPositionToShow - If provided (for opponent boards), only show trap at this rotated position
 */
function createBoardSvg(
  board: Board,
  rotated: boolean,
  maxStep?: number,
  trapPositionToShow?: { row: number; col: number }
): string {
  const size = board.grid.length;
  const cellSize = 45;
  const viewBoxSize = size * cellSize + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">`;
  svg += `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#f5f5f5"/>`;
  svg += '<g transform="translate(5,5)">';

  // Draw grid cells
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = j * cellSize;
      const y = i * cellSize;
      svg += `<rect x="${x}" y="${y}" width="40" height="40" fill="#e8e8e8" stroke="#d9d9d9" stroke-width="1"/>`;
    }
  }

  // Build map of position -> last move (so traps override pieces)
  // NOTE: Skip 'final' moves - they're goal markers, not rendered on grid
  const positionMap = new Map<string, { move: typeof board.sequence[0]; order: number }>();

  board.sequence.forEach((move, index) => {
    // Skip moves beyond maxStep if specified
    if (maxStep !== undefined && index > maxStep) {
      return;
    }

    // Skip final moves (goal reached marker)
    if (move.type === 'final') {
      return;
    }

    // For opponent boards, only show traps at the specified position (after rotation)
    if (rotated && move.type === 'trap') {
      if (!trapPositionToShow) {
        return; // Skip all traps if no position specified
      }
      const size = board.grid.length;
      const rotatedRow = size - 1 - move.position.row;
      const rotatedCol = size - 1 - move.position.col;
      if (rotatedRow !== trapPositionToShow.row || rotatedCol !== trapPositionToShow.col) {
        return; // Skip this trap, it's not at the position to show
      }
    }

    const key = `${move.position.row},${move.position.col}`;
    positionMap.set(key, { move, order: move.order });
  });

  // Draw pieces and traps (only the last entry for each position)
  positionMap.forEach(({ move, order }) => {
    let row = move.position.row;
    let col = move.position.col;

    // Rotate 180 degrees if opponent view
    if (rotated) {
      row = size - 1 - row;
      col = size - 1 - col;
    }

    const x = col * cellSize;
    const y = row * cellSize;

    const content = board.grid[move.position.row]?.[move.position.col];
    if (!content) return;

    if (content === 'piece') {
      svg += drawPiece(x, y, order, rotated);
    } else if (content === 'trap') {
      svg += drawTrap(x, y, order, rotated);
    }
  });

  svg += '</g></svg>';
  return svg;
}

/**
 * Draw piece (circle with number)
 */
function drawPiece(x: number, y: number, order: number, isOpponent: boolean): string {
  const centerX = x + 20;
  const centerY = y + 20;
  const color = isOpponent ? '#722ed1' : '#4a90e2'; // Purple for opponent, blue for player

  // Don't show numbers for opponent pieces
  if (isOpponent) {
    return `<circle cx="${centerX}" cy="${centerY}" r="15" fill="${color}"/>`;
  }

  return `
    <circle cx="${centerX}" cy="${centerY}" r="15" fill="${color}"/>
    <text x="${centerX}" y="${centerY}" font-size="16" fill="white" text-anchor="middle" dy=".3em">${order}</text>
  `;
}

/**
 * Draw trap (X with number)
 */
function drawTrap(x: number, y: number, order: number, isOpponent: boolean): string {
  const startX = x + 5;
  const startY = y + 5;
  const color = isOpponent ? 'rgb(249, 115, 22)' : '#f5222d'; // Orange for opponent, red for player

  // Don't show numbers for opponent traps
  if (isOpponent) {
    return `<path d="M${startX} ${startY} l30 30 m0 -30 l-30 30" stroke="${color}" stroke-width="4" opacity="0.7"/>`;
  }

  return `
    <path d="M${startX} ${startY} l30 30 m0 -30 l-30 30" stroke="${color}" stroke-width="4" opacity="0.7"/>
    <text x="${x + 35}" y="${y + 20}" font-size="14" fill="${color}" text-anchor="middle" dy=".3em" font-weight="bold">${order}</text>
  `;
}

/**
 * Create data URI from SVG string
 */
function createDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Create a blank board thumbnail (for new boards)
 */
export function generateBlankThumbnail(gridSize: number = 2): string {
  const cellSize = 45;
  const viewBoxSize = gridSize * cellSize + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">`;
  svg += `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#f5f5f5"/>`;
  svg += '<g transform="translate(5,5)">';

  // Draw empty grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = j * cellSize;
      const y = i * cellSize;
      svg += `<rect x="${x}" y="${y}" width="40" height="40" fill="#e8e8e8" stroke="#d9d9d9" stroke-width="1"/>`;
    }
  }

  svg += '</g></svg>';
  return createDataUri(svg);
}

/**
 * Get cell content color for display
 */
export function getCellContentColor(content: CellContent): string {
  switch (content) {
    case 'piece':
      return '#4a90e2'; // Blue
    case 'trap':
      return '#f5222d'; // Red
    case 'final':
      return '#52c41a'; // Green (goal reached)
    case 'empty':
      return '#e8e8e8'; // Light gray
  }
}
