import chalk from 'chalk';
import type { Board, BoardMove, CellContent, Position } from '../../src/types/board.js';

/**
 * Cell display information
 */
type CellDisplay = {
  content: string;
  isCurrentPosition: boolean;
};

/**
 * Render a grid with ASCII borders and step numbers
 *
 * Format examples:
 * - Empty: [   ]
 * - Step 1 piece: [1●]
 * - Step 2 trap: [2X]
 * - Supermove (step 4 piece, step 5 trap): [4●,5X]
 *
 * @param board - Board to render
 * @param currentPosition - Optional current piece position to highlight
 * @returns Formatted grid string
 */
export function renderGrid(board: Board, currentPosition?: Position | null): string {
  const { boardSize, grid, sequence } = board;

  // Build a map of position -> moves at that position
  const positionMap = new Map<string, BoardMove[]>();

  for (const move of sequence) {
    // Skip final moves (off-board)
    if (move.type === 'final' || move.position.row < 0) {
      continue;
    }

    const key = `${move.position.row},${move.position.col}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key)!.push(move);
  }

  // Build cell displays
  const cellDisplays: CellDisplay[][] = [];

  for (let row = 0; row < boardSize; row++) {
    const rowDisplays: CellDisplay[] = [];

    for (let col = 0; col < boardSize; col++) {
      const key = `${row},${col}`;
      const movesAtCell = positionMap.get(key) || [];
      const isCurrentPos =
        currentPosition !== null &&
        currentPosition !== undefined &&
        currentPosition.row === row &&
        currentPosition.col === col;

      let content = '   '; // Empty cell (3 spaces)

      if (movesAtCell.length > 0) {
        // Sort by order
        movesAtCell.sort((a, b) => a.order - b.order);

        // Check for supermove (piece and trap at same position)
        const pieceMove = movesAtCell.find(m => m.type === 'piece');
        const trapMove = movesAtCell.find(m => m.type === 'trap');

        if (pieceMove && trapMove) {
          // Supermove: [4●,5X]
          content = `${pieceMove.order}●,${trapMove.order}X`;
        } else if (pieceMove) {
          // Piece only: [1●]
          content = `${pieceMove.order}●`;
        } else if (trapMove) {
          // Trap only: [2X]
          content = `${trapMove.order}X`;
        }
      }

      // Pad content to fixed width for alignment
      // Supermove format can be longer (e.g., "4●,5X" = 5 chars)
      // Regular format is shorter (e.g., "2X" = 2 chars)
      // We'll use dynamic padding based on content length

      rowDisplays.push({
        content,
        isCurrentPosition: isCurrentPos,
      });
    }

    cellDisplays.push(rowDisplays);
  }

  // Calculate max content length for alignment
  let maxContentLength = 3; // Minimum for empty cells
  for (const row of cellDisplays) {
    for (const cell of row) {
      maxContentLength = Math.max(maxContentLength, cell.content.length);
    }
  }

  // Build output
  const lines: string[] = [];

  // Top border
  const horizontalBorder = '─'.repeat(maxContentLength + 2);
  const topBorder = '┌' + Array(boardSize).fill(horizontalBorder).join('┬') + '┐';
  lines.push(topBorder);

  // Grid rows
  for (let row = 0; row < boardSize; row++) {
    const cells = cellDisplays[row];
    const cellStrings = cells.map(cell => {
      const padded = cell.content.padStart(Math.floor((maxContentLength + cell.content.length) / 2))
        .padEnd(maxContentLength);

      // Color coding
      let colored = padded;
      if (padded.includes('●') && padded.includes('X')) {
        // Supermove: color piece blue and trap red
        // Format is like "4●,5X" padded
        colored = padded.replace(/(\d+●)/g, chalk.blue('$1'))
                        .replace(/(,)/g, chalk.gray('$1'))
                        .replace(/(\d+X)/g, chalk.red('$1'));
      } else if (padded.includes('●')) {
        colored = chalk.blue(padded);
      } else if (padded.includes('X')) {
        colored = chalk.red(padded);
      } else {
        colored = chalk.gray(padded);
      }

      return colored;
    });

    const rowString = '│ ' + cellStrings.join(' │ ') + ' │';

    // Add current position indicator
    if (cells.some(c => c.isCurrentPosition)) {
      lines.push(rowString + chalk.yellow(' ← You are here'));
    } else {
      lines.push(rowString);
    }

    // Row separator or bottom border
    if (row < boardSize - 1) {
      const middleBorder = '├' + Array(boardSize).fill(horizontalBorder).join('┼') + '┤';
      lines.push(middleBorder);
    }
  }

  // Bottom border
  const bottomBorder = '└' + Array(boardSize).fill(horizontalBorder).join('┴') + '┘';
  lines.push(bottomBorder);

  return lines.join('\n');
}

/**
 * Render a board with metadata (name, tags, etc.)
 *
 * @param board - Board to render
 * @param options - Display options
 * @returns Formatted board string
 */
export function renderBoardWithMetadata(
  board: Board & { name?: string; tags?: string[] },
  options: {
    showSequence?: boolean;
    showMetadata?: boolean;
  } = {}
): string {
  const lines: string[] = [];

  // Metadata
  if (options.showMetadata !== false) {
    if (board.name) {
      lines.push(chalk.bold(`Name: ${board.name}`));
    }
    if ('tags' in board && board.tags && board.tags.length > 0) {
      lines.push(chalk.gray(`Tags: ${board.tags.join(', ')}`));
    }
    lines.push(chalk.gray(`Board Size: ${board.boardSize}x${board.boardSize}`));
    lines.push('');
  }

  // Grid visualization
  lines.push(renderGrid(board));

  // Sequence details
  if (options.showSequence) {
    lines.push('');
    lines.push(chalk.bold('Sequence:'));
    for (const move of board.sequence) {
      const typeSymbol = move.type === 'piece' ? '●' : move.type === 'trap' ? 'X' : '⚑';
      const typeColor = move.type === 'piece' ? chalk.blue : move.type === 'trap' ? chalk.red : chalk.green;
      const posStr = move.type === 'final'
        ? 'Goal'
        : `(${move.position.row}, ${move.position.col})`;
      lines.push(`  ${move.order}. ${typeColor(typeSymbol)} ${move.type} at ${posStr}`);
    }
  }

  return lines.join('\n');
}

/**
 * Render two boards side by side for comparison
 *
 * @param board1 - First board
 * @param board2 - Second board
 * @param labels - Optional labels for each board
 * @returns Formatted side-by-side string
 */
export function renderBoardsSideBySide(
  board1: Board,
  board2: Board,
  labels?: [string, string]
): string {
  const grid1Lines = renderGrid(board1).split('\n');
  const grid2Lines = renderGrid(board2).split('\n');

  const lines: string[] = [];

  // Headers
  if (labels) {
    const [label1, label2] = labels;
    const spacing = ' '.repeat(10);
    lines.push(chalk.bold(label1) + spacing + chalk.bold(label2));
    lines.push('');
  }

  // Side-by-side grids
  const maxLines = Math.max(grid1Lines.length, grid2Lines.length);
  const grid1Width = grid1Lines[0]?.length || 0;

  for (let i = 0; i < maxLines; i++) {
    const line1 = grid1Lines[i] || ' '.repeat(grid1Width);
    const line2 = grid2Lines[i] || '';
    lines.push(line1 + '    ' + line2);
  }

  return lines.join('\n');
}
