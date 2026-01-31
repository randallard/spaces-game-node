import inquirer from 'inquirer';
import chalk from 'chalk';
import type { Board, BoardMove, Position } from '../../src/types/board.js';
import { createBoardFromSequence, getCurrentPosition } from '../utils/grid-generator.js';
import { renderGrid } from './visualizer.js';
import { validateInteractiveMove, validateBoard, isAdjacentOrthogonal } from '../utils/validation.js';

/**
 * Builder options
 */
export type BuilderOptions = {
  size?: number;
  startCol?: number;
};

/**
 * Builder state
 */
type BuilderState = {
  boardSize: number;
  startingCol: number;
  sequence: BoardMove[];
  currentPosition: Position | null;
  stepCount: number;
  trapPositions: Set<string>;
  visitedCells: Set<string>; // Cells where pieces have been placed
  supermoveActive: boolean; // True if last move was trap at current position
};

/**
 * Parse direction from user input
 */
function parseDirection(dir: string): { row: number; col: number } | null {
  const normalized = dir.toLowerCase().trim();

  switch (normalized) {
    case 'up':
    case 'u':
      return { row: -1, col: 0 };
    case 'down':
    case 'd':
      return { row: 1, col: 0 };
    case 'left':
    case 'l':
      return { row: 0, col: -1 };
    case 'right':
    case 'r':
      return { row: 0, col: 1 };
    default:
      return null;
  }
}

/**
 * Parse coordinate input: "1,1,piece" or "1,1,p"
 */
function parseCoordinates(input: string): { row: number; col: number; type: 'piece' | 'trap' } | null {
  const parts = input.split(',').map(p => p.trim());

  if (parts.length !== 3) {
    return null;
  }

  const row = parseInt(parts[0]);
  const col = parseInt(parts[1]);
  const typeStr = parts[2].toLowerCase();

  if (isNaN(row) || isNaN(col)) {
    return null;
  }

  let type: 'piece' | 'trap';
  if (typeStr === 'piece' || typeStr === 'p') {
    type = 'piece';
  } else if (typeStr === 'trap' || typeStr === 't') {
    type = 'trap';
  } else {
    return null;
  }

  return { row, col, type };
}

/**
 * Parse user command
 */
function parseCommand(input: string): {
  type: 'move' | 'trap' | 'finish' | 'undo' | 'restart' | 'help' | 'coord' | 'supermove' | 'supermove-and-move' | 'invalid';
  direction?: { row: number; col: number };
  position?: { row: number; col: number };
  moveType?: 'piece' | 'trap';
} {
  const trimmed = input.trim().toLowerCase();

  // Check for special commands
  if (trimmed === 'finish' || trimmed === 'f') {
    return { type: 'finish' };
  }
  if (trimmed === 'undo' || trimmed === 'u') {
    return { type: 'undo' };
  }
  if (trimmed === 'restart' || trimmed === 'reset' || trimmed === 'r') {
    return { type: 'restart' };
  }
  if (trimmed === 'help' || trimmed === 'h') {
    return { type: 'help' };
  }

  // Check for coordinate input: "1,1,piece"
  if (trimmed.includes(',')) {
    const coords = parseCoordinates(trimmed);
    if (coords) {
      return {
        type: 'coord',
        position: { row: coords.row, col: coords.col },
        moveType: coords.type,
      };
    }
  }

  // Check for move command: "move left" or "m l"
  const moveParts = trimmed.split(/\s+/);
  if (moveParts.length === 2) {
    const [cmd, dir] = moveParts;

    if (cmd === 'move' || cmd === 'm') {
      const direction = parseDirection(dir);
      if (direction) {
        return { type: 'move', direction };
      }
    }

    if (cmd === 'trap' || cmd === 't') {
      // Check for supermove: "trap here" or "t here"
      if (dir === 'here' || dir === 'h') {
        return { type: 'supermove' };
      }

      const direction = parseDirection(dir);
      if (direction) {
        return { type: 'trap', direction };
      }
    }

    if (cmd === 'supermove' || cmd === 's') {
      // Supermove and move: "s up", "s left", "s right"
      const direction = parseDirection(dir);
      if (direction) {
        return { type: 'supermove-and-move', direction };
      }
    }
  }

  return { type: 'invalid' };
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(chalk.bold('\n📖 Interactive Board Builder Help\n'));

  console.log(chalk.bold('Movement Commands:'));
  console.log('  move <direction>    Move piece (abbreviation: m)');
  console.log('  trap <direction>    Place trap (abbreviation: t)');
  console.log('  trap here           Place trap at current position - supermove! (t h)');
  console.log('  supermove <dir>     Trap here AND move in direction (abbreviation: s)');
  console.log('  Directions: up/down/left/right (u/d/l/r)');
  console.log('  Examples: "move left", "m l", "trap right", "t r"');
  console.log('            "trap here", "t h", "supermove up", "s u", "s l", "s r"');

  console.log(chalk.bold('\nCoordinate Entry:'));
  console.log('  <row>,<col>,<type>  Direct coordinate entry');
  console.log('  Types: piece/trap (p/t)');
  console.log('  Example: "1,2,piece" or "1,2,p"');

  console.log(chalk.bold('\nSpecial Commands:'));
  console.log('  finish (f)          Auto-complete straight path to goal');
  console.log('  undo (u)            Remove last move');
  console.log('  restart (r/reset)   Start over from beginning');
  console.log('  help (h)            Show this help message');

  console.log(chalk.bold('\nGame Rules:'));
  console.log('  • Pieces move orthogonally only (up/down/left/right)');
  console.log('  • Traps must be adjacent to piece or at piece position (supermove)');
  console.log('  • Pieces cannot move into traps');
  console.log('  • After supermove, piece MUST move on next step');
  console.log('  • Goal is reached at row -1 (top edge)');

  console.log(chalk.bold('\nMore Info:'));
  console.log('  🌐 https://spaces-game.vercel.app/rules\n');
}

/**
 * Build a board interactively
 */
export async function buildBoard(options: BuilderOptions = {}): Promise<Board | null> {
  let state: BuilderState;

  // Prompt for board size if not provided
  let boardSize = options.size;
  if (!boardSize) {
    const sizeAnswer = await inquirer.prompt([{
      type: 'input',
      name: 'size',
      message: 'Board size (2-5 for standard, or enter custom size up to 100):',
      default: '3',
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 2) {
          return 'Please enter a number 2 or greater';
        }
        if (num > 100) {
          return 'Please enter a number no greater than 100';
        }
        return true;
      },
    }]);
    boardSize = parseInt(sizeAnswer.size);
  }

  // Prompt for starting column if not provided
  let startingCol = options.startCol;
  if (startingCol === undefined) {
    const colAnswer = await inquirer.prompt([{
      type: 'input',
      name: 'col',
      message: `Starting column (0 for farthest left):`,
      default: '0',
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 0 || num >= boardSize!) {
          return `Please enter a number between 0 and ${boardSize! - 1}`;
        }
        return true;
      },
    }]);
    startingCol = parseInt(colAnswer.col);
  }

  // Initialize state
  const initState = (): BuilderState => ({
    boardSize: boardSize!,
    startingCol: startingCol!,
    sequence: [
      {
        position: { row: boardSize! - 1, col: startingCol! },
        type: 'piece',
        order: 1,
      },
    ],
    currentPosition: { row: boardSize! - 1, col: startingCol! },
    stepCount: 1,
    trapPositions: new Set<string>(),
    visitedCells: new Set([`${boardSize! - 1},${startingCol!}`]),
    supermoveActive: false,
  });

  state = initState();

  // Show initial board
  console.log(chalk.bold('\n🎮 Starting Board:\n'));
  const initialBoard = createBoardFromSequence(state.sequence, state.boardSize);
  console.log(renderGrid(initialBoard, state.currentPosition));
  console.log(chalk.gray('\nType "help" for commands, "finish" when done\n'));

  // Main command loop
  while (true) {
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'command',
      message: 'Command:',
    }]);

    const command = parseCommand(answer.command);

    if (command.type === 'invalid') {
      console.log(chalk.red('❌ Invalid command. Type "help" for available commands.\n'));
      continue;
    }

    if (command.type === 'help') {
      showHelp();
      continue;
    }

    if (command.type === 'restart') {
      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you sure you want to restart?',
        default: false,
      }]);

      if (confirm.confirmed) {
        state = initState();
        console.log(chalk.yellow('\n🔄 Restarting...\n'));
        const board = createBoardFromSequence(state.sequence, state.boardSize);
        console.log(renderGrid(board, state.currentPosition));
        console.log();
      }
      continue;
    }

    if (command.type === 'undo') {
      if (state.sequence.length <= 1) {
        console.log(chalk.yellow('⚠️  Cannot undo - already at starting position\n'));
        continue;
      }

      // Remove last move
      state.sequence.pop();
      state.stepCount--;

      // Update current position
      state.currentPosition = getCurrentPosition(state.sequence, state.stepCount);

      // Rebuild trap positions
      state.trapPositions.clear();
      for (const move of state.sequence) {
        if (move.type === 'trap') {
          state.trapPositions.add(`${move.position.row},${move.position.col}`);
        }
      }

      // Clear supermove state
      state.supermoveActive = false;

      console.log(chalk.yellow('↩️  Last move undone\n'));
      const board = createBoardFromSequence(state.sequence, state.boardSize);
      console.log(renderGrid(board, state.currentPosition));
      console.log();
      continue;
    }

    if (command.type === 'finish') {
      // Auto-complete straight path to goal
      if (!state.currentPosition) {
        console.log(chalk.red('❌ No current position\n'));
        continue;
      }

      if (state.supermoveActive) {
        console.log(chalk.red('❌ Cannot finish - must move piece after supermove\n'));
        continue;
      }

      const { row, col } = state.currentPosition;

      // Check for traps in forward path (same column, decreasing row)
      let trapInPath = false;
      for (let r = row - 1; r >= 0; r--) {
        if (state.trapPositions.has(`${r},${col}`)) {
          trapInPath = true;
          break;
        }
      }

      if (trapInPath) {
        console.log(chalk.red('❌ Cannot finish - trap in forward path. Remove the trap or change route.\n'));
        continue;
      }

      // Add moves to goal
      for (let r = row - 1; r >= 0; r--) {
        state.stepCount++;
        state.sequence.push({
          position: { row: r, col },
          type: 'piece',
          order: state.stepCount,
        });
      }

      // Add final move
      state.stepCount++;
      state.sequence.push({
        position: { row: -1, col },
        type: 'final',
        order: state.stepCount,
      });

      state.currentPosition = { row: -1, col };

      console.log(chalk.green('✅ Auto-completed path to goal!\n'));
      const board = createBoardFromSequence(state.sequence, state.boardSize);
      console.log(renderGrid(board, null)); // No current position for final board
      console.log();

      // Validate and confirm
      const validation = validateBoard(board);
      if (!validation.valid) {
        console.log(chalk.red('❌ Board validation failed:'));
        validation.errors.forEach(err => console.log(chalk.red(err)));
        console.log();
        continue;
      }

      const confirmAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmed',
        message: 'Confirm board?',
        default: true,
      }]);

      if (confirmAnswer.confirmed) {
        return board;
      } else {
        // Return to building - undo the finish moves
        console.log(chalk.yellow('\n↩️  Returning to building...\n'));
        // Find first final move and remove everything after
        const finalIndex = state.sequence.findIndex(m => m.type === 'final');
        if (finalIndex !== -1) {
          state.sequence = state.sequence.slice(0, finalIndex);
          state.stepCount = state.sequence.length;
          state.currentPosition = getCurrentPosition(state.sequence, state.stepCount);
        }
        const undoBoard = createBoardFromSequence(state.sequence, state.boardSize);
        console.log(renderGrid(undoBoard, state.currentPosition));
        console.log();
      }
      continue;
    }

    // Handle supermove-and-move command (s u, s l, s r)
    if (command.type === 'supermove-and-move' && command.direction) {
      if (!state.currentPosition) {
        console.log(chalk.red('❌ No current position\n'));
        continue;
      }

      // Calculate the final piece position after the move
      const finalPosition = {
        row: state.currentPosition.row + command.direction.row,
        col: state.currentPosition.col + command.direction.col,
      };

      // Validate the piece move is valid
      if (finalPosition.row < 0 || finalPosition.row >= state.boardSize ||
          finalPosition.col < 0 || finalPosition.col >= state.boardSize) {
        console.log(chalk.red(`❌ Cannot supermove ${command.direction.row === -1 ? 'up' : command.direction.col === -1 ? 'left' : 'right'} - would move off the board\n`));
        continue;
      }

      const cellKey = `${finalPosition.row},${finalPosition.col}`;
      if (state.visitedCells.has(cellKey)) {
        console.log(chalk.red('❌ Cannot move to a previously visited cell\n'));
        continue;
      }

      if (state.trapPositions.has(cellKey)) {
        console.log(chalk.red('❌ Cannot move into a trap\n'));
        continue;
      }

      // First, place trap at current position
      state.stepCount++;
      state.sequence.push({
        position: state.currentPosition,
        type: 'trap',
        order: state.stepCount,
      });
      state.trapPositions.add(`${state.currentPosition.row},${state.currentPosition.col}`);

      // Then, move piece
      state.stepCount++;
      state.sequence.push({
        position: finalPosition,
        type: 'piece',
        order: state.stepCount,
      });
      state.currentPosition = finalPosition;
      state.visitedCells.add(cellKey);
      state.supermoveActive = false;

      // Render updated board
      const board = createBoardFromSequence(state.sequence, state.boardSize);
      console.log(renderGrid(board, state.currentPosition));
      console.log();

      continue;
    }

    // Handle move and trap commands
    let nextPosition: Position | null = null;
    let moveType: 'piece' | 'trap' | null = null;

    if (command.type === 'move' && command.direction) {
      if (!state.currentPosition) {
        console.log(chalk.red('❌ No current position\n'));
        continue;
      }

      nextPosition = {
        row: state.currentPosition.row + command.direction.row,
        col: state.currentPosition.col + command.direction.col,
      };
      moveType = 'piece';
    } else if (command.type === 'supermove') {
      if (!state.currentPosition) {
        console.log(chalk.red('❌ No current position\n'));
        continue;
      }

      // Supermove: trap at current position
      nextPosition = state.currentPosition;
      moveType = 'trap';
    } else if (command.type === 'trap' && command.direction) {
      if (!state.currentPosition) {
        console.log(chalk.red('❌ No current position\n'));
        continue;
      }

      nextPosition = {
        row: state.currentPosition.row + command.direction.row,
        col: state.currentPosition.col + command.direction.col,
      };
      moveType = 'trap';
    } else if (command.type === 'coord' && command.position && command.moveType) {
      nextPosition = command.position;
      moveType = command.moveType;
    }

    if (nextPosition && moveType) {
      // Validate move
      const validation = validateInteractiveMove(
        state.currentPosition,
        nextPosition,
        moveType,
        state.boardSize,
        state.trapPositions
      );

      // Check for supermove constraint
      if (state.supermoveActive && moveType !== 'piece') {
        console.log(chalk.red('❌ Must move piece after supermove\n'));
        continue;
      }

      // Show errors (including warnings)
      if (validation.errors.length > 0) {
        const hasRealErrors = validation.errors.some(e => !e.startsWith('⚠️'));
        if (hasRealErrors) {
          console.log(chalk.red('❌ Invalid move:'));
          validation.errors.forEach(err => {
            if (err.startsWith('⚠️')) {
              console.log(chalk.yellow(err));
            } else {
              console.log(chalk.red('  ' + err));
            }
          });
          console.log();
          continue;
        } else {
          // Only warnings - show them but allow move
          validation.errors.forEach(err => console.log(chalk.yellow(err)));
        }
      }

      // Add move to sequence
      state.stepCount++;
      state.sequence.push({
        position: nextPosition,
        type: moveType,
        order: state.stepCount,
      });

      // Update state
      if (moveType === 'piece') {
        state.currentPosition = nextPosition;
        state.visitedCells.add(`${nextPosition.row},${nextPosition.col}`);
        state.supermoveActive = false;
      } else if (moveType === 'trap') {
        state.trapPositions.add(`${nextPosition.row},${nextPosition.col}`);

        // Check if supermove (trap at current position)
        if (
          state.currentPosition &&
          nextPosition.row === state.currentPosition.row &&
          nextPosition.col === state.currentPosition.col
        ) {
          state.supermoveActive = true;
        }
      }

      // Render updated board
      const board = createBoardFromSequence(state.sequence, state.boardSize);
      console.log(renderGrid(board, state.currentPosition));
      console.log();
    }
  }
}
