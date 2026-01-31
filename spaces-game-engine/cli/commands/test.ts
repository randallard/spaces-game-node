import chalk from 'chalk';
import { buildBoard } from '../interactive/builder.js';
import { renderBoardsSideBySide } from '../interactive/visualizer.js';
import { validateBoardOrThrow, validateBoard } from '../utils/validation.js';
import { loadCollection, getBoardByIndex, loadSession, saveTestToSession } from '../utils/file-manager.js';
import { simulateRound } from '../../src/simulation.js';
import { getOrCreateActiveSession, saveLastTest, getLastTest, getSessionOpponentBoards } from './session.js';
import { generateBoardsWithCache, cacheExists } from '../utils/board-generator.js';
import type { Board } from '../../src/types/board.js';
import type { RoundResult } from '../../src/types/game.js';
import fs from 'fs/promises';

/**
 * Parse board input - auto-detect format
 */
async function parseBoardInput(input: string): Promise<Board> {
  // Check for collection with index: "file.json:0"
  if (input.includes(':')) {
    const [filePath, indexStr] = input.split(':');
    const index = parseInt(indexStr);

    if (isNaN(index)) {
      throw new Error(`Invalid collection index: ${indexStr}`);
    }

    const collection = await loadCollection(filePath);
    const board = getBoardByIndex(collection, index);

    if (!board) {
      throw new Error(`Board not found at index ${index} in ${filePath}`);
    }

    return board;
  }

  // Check if it's JSON (starts with '{')
  if (input.trim().startsWith('{')) {
    try {
      const board = JSON.parse(input) as Board;
      validateBoardOrThrow(board);
      return board;
    } catch (error) {
      throw new Error(`Invalid JSON board: ${(error as Error).message}`);
    }
  }

  // Otherwise, treat as file path
  try {
    const content = await fs.readFile(input, 'utf-8');
    const board = JSON.parse(content) as Board;
    validateBoardOrThrow(board);
    return board;
  } catch (error) {
    throw new Error(`Failed to load board from file ${input}: ${(error as Error).message}`);
  }
}

/**
 * Check if two boards are identical (same sequence)
 */
function boardsAreIdentical(board1: Board, board2: Board): boolean {
  if (board1.boardSize !== board2.boardSize) return false;
  if (board1.sequence.length !== board2.sequence.length) return false;

  return board1.sequence.every((move, index) => {
    const otherMove = board2.sequence[index];
    return (
      move.type === otherMove.type &&
      move.position.row === otherMove.position.row &&
      move.position.col === otherMove.position.col &&
      move.order === otherMove.order
    );
  });
}

/**
 * Generate a random valid board that is distinct from previously used boards
 */
async function generateDistinctRandomBoard(
  boardSize: number,
  usedBoards: Board[],
  maxAttempts: number = 100
): Promise<Board | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = await generateRandomBoard(boardSize);

    // Check if this board is distinct from all used boards
    const isDuplicate = usedBoards.some(usedBoard => boardsAreIdentical(candidate, usedBoard));

    if (!isDuplicate) {
      return candidate;
    }
  }

  // Could not find a distinct board after maxAttempts
  return null;
}

/**
 * Generate a random valid board
 * First tries to use cached boards, falls back to old random generation if cache doesn't exist
 */
async function generateRandomBoard(boardSize: number, startCol?: number): Promise<Board> {
  // Check if we have cached boards for this size
  const hasCachedBoards = await cacheExists(boardSize, 500);

  if (!hasCachedBoards) {
    // Generate and cache 500 boards for this size
    console.log(chalk.gray(`Generating 500 opponent boards for size ${boardSize}...`));
  }

  // Load from cache (or generate if needed) and pick a random board
  const boards = await generateBoardsWithCache(boardSize, 500);
  if (boards.length > 0) {
    const randomIndex = Math.floor(Math.random() * boards.length);
    const board = boards[randomIndex];

    // GUARDRAIL: Validate board before returning
    const validation = validateBoard(board);
    if (!validation.valid) {
      console.log(chalk.yellow('⚠️  Generated board failed validation, regenerating...'));
      console.log(chalk.gray(`   Errors: ${validation.errors.join(', ')}`));
      // Try again with a different random board
      if (boards.length > 1) {
        const nextIndex = (randomIndex + 1) % boards.length;
        return boards[nextIndex];
      }
    }

    return board;
  }

  // This should never happen now that we auto-generate caches
  throw new Error(`Failed to generate random board for size ${boardSize}. Cache generation failed.`);
}


/**
 * Generate step-by-step technical explanation of the simulation
 */
function generateTechnicalExplanation(
  playerBoard: Board,
  opponentBoard: Board,
  result: RoundResult
): string[] {
  const size = playerBoard.grid.length;
  const explanations: string[] = [];

  // Helper to rotate opponent position (opponent board is rotated 180°)
  const rotatePosition = (row: number, col: number) => ({
    row: size - 1 - row,
    col: size - 1 - col,
  });

  // Helper to check if positions match
  const positionsMatch = (p1: { row: number; col: number }, p2: { row: number; col: number }) =>
    p1.row === p2.row && p1.col === p2.col;

  // Track positions and traps
  let playerPosition: { row: number; col: number } | null = null;
  let opponentPosition: { row: number; col: number } | null = null;
  const playerTraps: Array<{ row: number; col: number }> = [];
  const opponentTraps: Array<{ row: number; col: number }> = [];
  let playerRoundEnded = false;
  let opponentRoundEnded = false;

  // Get actual starting positions from board sequences
  const playerStartPos = playerBoard.sequence.find(m => m.order === 1)?.position;
  const opponentStartPos = opponentBoard.sequence.find(m => m.order === 1)?.position;

  // Starting positions (opponent position shown in rotated coordinates)
  if (playerStartPos) {
    explanations.push(`Player starts with piece at (${playerStartPos.row}, ${playerStartPos.col})`);
  }
  if (opponentStartPos) {
    const rotatedOpponentStart = rotatePosition(opponentStartPos.row, opponentStartPos.col);
    explanations.push(`Opponent starts with piece at (${rotatedOpponentStart.row}, ${rotatedOpponentStart.col})`);
  }
  explanations.push('');

  // Get max steps to simulate
  const playerLastStep = result.simulationDetails.playerLastStep;
  const opponentLastStep = result.simulationDetails.opponentLastStep;
  const maxSteps = Math.max(playerLastStep, opponentLastStep) + 1;

  // Simulate step by step
  for (let step = 0; step < maxSteps; step++) {
    let newPlayerPosition: { row: number; col: number } | null = null;
    let newOpponentPosition: { row: number; col: number } | null = null;

    // Process player action
    if (!playerRoundEnded && step <= playerLastStep && step < playerBoard.sequence.length) {
      const move = playerBoard.sequence[step]!;
      if (move.type === 'piece') {
        explanations.push(`Player moves to (${move.position.row}, ${move.position.col})`);

        // Check for forward movement scoring
        if (playerPosition !== null && move.position.row < playerPosition.row) {
          explanations.push('  Player +1 point (forward movement)');
        }

        newPlayerPosition = move.position;
      } else if (move.type === 'trap') {
        explanations.push(`Player places trap at (${move.position.row}, ${move.position.col})`);
        playerTraps.push(move.position);
      } else if (move.type === 'final') {
        explanations.push('Player reaches the goal!');
        explanations.push('  Player +1 point (goal reached)');
        playerRoundEnded = true;
      }
    }

    // Process opponent action
    if (!opponentRoundEnded && !playerRoundEnded && step <= opponentLastStep && step < opponentBoard.sequence.length) {
      const move = opponentBoard.sequence[step]!;
      const rotated = rotatePosition(move.position.row, move.position.col);
      if (move.type === 'piece') {
        explanations.push(`Opponent moves to (${rotated.row}, ${rotated.col})`);

        // Check for forward movement scoring (opponent's forward is towards higher row)
        if (opponentPosition !== null && rotated.row > opponentPosition.row) {
          explanations.push('  Opponent +1 point (forward movement)');
        }

        newOpponentPosition = rotated;
      } else if (move.type === 'trap') {
        explanations.push(`Opponent places trap at (${rotated.row}, ${rotated.col})`);
        opponentTraps.push(rotated);
      } else if (move.type === 'final') {
        explanations.push('Opponent reaches the goal!');
        explanations.push('  Opponent +1 point (goal reached)');
        opponentRoundEnded = true;
      }
    }

    // Update positions
    if (newPlayerPosition) {
      playerPosition = newPlayerPosition;
    }
    if (newOpponentPosition) {
      opponentPosition = newOpponentPosition;
    }

    // Check for events after both moves
    if (!playerRoundEnded && !opponentRoundEnded) {
      // Check trap hits
      if (newPlayerPosition) {
        const hitTrap = opponentTraps.some(trap => positionsMatch(trap, newPlayerPosition));
        if (hitTrap) {
          explanations.push('  Player -1 point (hit trap!)');
        }
      }

      if (newOpponentPosition) {
        const hitTrap = playerTraps.some(trap => positionsMatch(trap, newOpponentPosition));
        if (hitTrap) {
          explanations.push('  Opponent -1 point (hit trap!)');
        }
      }

      // Check collision
      if (playerPosition && opponentPosition && positionsMatch(playerPosition, opponentPosition)) {
        explanations.push('  Player -1 point (collision!)');
        explanations.push('  Opponent -1 point (collision!)');
        playerRoundEnded = true;
        opponentRoundEnded = true;
      }
    }

    // Check if round ended
    if (playerRoundEnded || opponentRoundEnded) {
      explanations.push('');
      if (playerRoundEnded && result.playerFinalPosition.row === -1) {
        explanations.push('Round ends - Player reached the goal!');
      } else if (opponentRoundEnded && result.opponentFinalPosition.row === size) {
        explanations.push('Round ends - Opponent reached the goal!');
      } else if (result.collision) {
        explanations.push('Round ends - Collision occurred!');
      } else if (result.simulationDetails.playerHitTrap) {
        explanations.push('Round ends - Player hit a trap!');
      } else if (result.simulationDetails.opponentHitTrap) {
        explanations.push('Round ends - Opponent hit a trap!');
      }
      break;
    }
  }

  return explanations;
}

/**
 * Rotate a board 180 degrees for display
 */
function rotateBoard180(board: Board): Board {
  const size = board.boardSize;

  // Rotate grid
  const rotatedGrid: Board['grid'] = Array(size)
    .fill(null)
    .map(() => Array(size).fill('empty'));

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const newRow = size - 1 - row;
      const newCol = size - 1 - col;
      rotatedGrid[newRow][newCol] = board.grid[row][col];
    }
  }

  // Rotate sequence positions (but keep same order numbers)
  const rotatedSequence = board.sequence.map(move => {
    if (move.position.row < 0) {
      // Goal position stays at -1
      return {
        ...move,
        position: { row: -1, col: size - 1 - move.position.col }
      };
    }
    return {
      ...move,
      position: {
        row: size - 1 - move.position.row,
        col: size - 1 - move.position.col
      }
    };
  });

  return {
    boardSize: size,
    grid: rotatedGrid,
    sequence: rotatedSequence
  };
}

/**
 * Display test results
 */
function displayResults(
  result: RoundResult,
  expected?: string
): void {
  const { playerBoard, opponentBoard } = result;
  console.log(chalk.bold.cyan('\n🎮 Simulation Results\n'));

  // Rotate opponent board 180 degrees for display (matches game UI)
  const rotatedOpponent = rotateBoard180(opponentBoard);

  // Show boards side by side
  console.log(renderBoardsSideBySide(playerBoard, rotatedOpponent, ['Player', 'Opponent']));
  console.log();

  // Show technical explanation
  console.log(chalk.bold.cyan('📋 Technical Explanation\n'));
  const explanation = generateTechnicalExplanation(playerBoard, opponentBoard, result);
  explanation.forEach(line => {
    if (line.startsWith('  ')) {
      // Indent lines are scoring events
      console.log(chalk.gray(line));
    } else if (line === '') {
      console.log();
    } else {
      console.log(line);
    }
  });
  console.log();

  // Show winner
  const winnerText =
    result.winner === 'player'
      ? chalk.green.bold('🏆 PLAYER WINS')
      : result.winner === 'opponent'
      ? chalk.red.bold('💀 OPPONENT WINS')
      : chalk.yellow.bold('🤝 TIE');

  console.log(winnerText);
  console.log();

  // Show scores
  console.log(chalk.bold('Scores:'));
  console.log(`  Player:   ${chalk.blue(result.playerPoints)} points`);
  console.log(`  Opponent: ${chalk.red(result.opponentPoints)} points`);
  console.log();

  // Show final positions
  console.log(chalk.bold('Final Positions:'));
  console.log(`  Player:   row ${result.playerFinalPosition.row}, col ${result.playerFinalPosition.col}`);
  console.log(`  Opponent: row ${result.opponentFinalPosition.row}, col ${result.opponentFinalPosition.col}`);
  console.log();

  // Show status
  console.log(chalk.bold('Status:'));

  // Check if player reached goal
  if (result.playerFinalPosition.row === -1) {
    console.log(chalk.green('  🎯 Player reached the goal'));
  }

  // Check if opponent reached goal
  if (result.opponentFinalPosition.row === playerBoard.grid.length) {
    console.log(chalk.green('  🎯 Opponent reached the goal'));
  }

  // Show collision
  if (result.collision) {
    console.log(chalk.yellow('  💥 Collision occurred'));
  }

  // Show trap hits
  if (result.simulationDetails.playerHitTrap) {
    console.log(chalk.red('  🪤 Player was trapped'));
  }
  if (result.simulationDetails.opponentHitTrap) {
    console.log(chalk.red('  🪤 Opponent was trapped'));
  }

  console.log();

  // Show expected outcome comparison
  if (expected) {
    const expectedWinner = expected.toLowerCase();
    const actualWinner = result.winner;
    const passed =
      expectedWinner === actualWinner ||
      (expectedWinner === 'winner' && actualWinner === 'player');

    if (passed) {
      console.log(chalk.green('✓ Expected outcome: PASS'));
    } else {
      console.log(chalk.red(`✗ Expected outcome: FAIL (expected ${expected}, got ${actualWinner})`));
    }
    console.log();
  }
}

/**
 * Run a test simulation
 */
export async function runTest(options: {
  interactive?: boolean;
  last?: boolean;
  newOpponent?: boolean;
  player?: string;
  opponent?: string;
  size?: string;
  startCol?: string;
  expected?: string;
  notes?: string;
}): Promise<void> {
  let playerBoard: Board;
  let opponentBoard: Board | undefined;

  // Handle --last flag
  if (options.last) {
    const lastTest = await getLastTest();
    if (!lastTest) {
      console.log(chalk.yellow('⚠️  No previous test found. Run a test first.'));
      return;
    }

    console.log(chalk.cyan('🔄 Re-running last test...\n'));

    playerBoard = lastTest.playerBoard;
    opponentBoard = lastTest.opponentBoard;
    options.expected = lastTest.expected;
    options.notes = lastTest.notes;

    // Skip to simulation (boards already loaded)
  } else if (options.newOpponent) {
    // Handle --new-opponent flag (re-use last player board, generate new distinct opponent)
    const lastTest = await getLastTest();
    if (!lastTest) {
      console.log(chalk.yellow('⚠️  No previous test found. Run a test first.'));
      return;
    }

    console.log(chalk.cyan('🔄 Re-running with new opponent board...\n'));

    playerBoard = lastTest.playerBoard;

    // Get all opponent boards used in current session
    const usedOpponentBoards = await getSessionOpponentBoards();

    console.log(chalk.gray(`Generating new opponent board (avoiding ${usedOpponentBoards.length} previously used)...`));

    // Generate a distinct opponent board
    const distinctBoard = await generateDistinctRandomBoard(playerBoard.boardSize, usedOpponentBoards);

    if (!distinctBoard) {
      console.log(chalk.yellow('⚠️  Could not generate a distinct opponent board after 100 attempts.'));
      console.log(chalk.yellow('   The search space may be exhausted. Using a random board anyway.'));
      opponentBoard = await generateRandomBoard(playerBoard.boardSize);
    } else {
      opponentBoard = distinctBoard;
    }

    // Preserve other metadata
    options.expected = lastTest.expected;
    options.notes = lastTest.notes;

    // Skip to simulation (boards already loaded)
  } else if (options.interactive) {
    // Get player board
    console.log(chalk.bold.cyan('\n🎮 Build Player Board\n'));

    const builderOptions: { size?: number; startCol?: number } = {};

    if (options.size) {
      builderOptions.size = parseInt(options.size);
      if (isNaN(builderOptions.size) || builderOptions.size < 2 || builderOptions.size > 5) {
        console.log(chalk.red('❌ Invalid board size. Must be 2-5'));
        process.exit(1);
      }
    }

    if (options.startCol !== undefined) {
      builderOptions.startCol = parseInt(options.startCol);
      if (isNaN(builderOptions.startCol)) {
        console.log(chalk.red('❌ Invalid starting column'));
        process.exit(1);
      }
    }

    const board = await buildBoard(builderOptions);

    if (!board) {
      console.log(chalk.yellow('Board creation cancelled'));
      return;
    }

    playerBoard = board;
  } else if (options.player) {
    try {
      playerBoard = await parseBoardInput(options.player);
    } catch (error) {
      console.log(chalk.red(`❌ Failed to load player board: ${(error as Error).message}`));
      process.exit(1);
    }
  } else {
    console.log(chalk.red('❌ Player board required (use --interactive or --player)'));
    process.exit(1);
  }

  // Get opponent board (only if not using --last or --new-opponent, which already loaded boards)
  if (!options.last && !options.newOpponent) {
    if (options.opponent === 'random') {
      console.log(chalk.gray('Generating random opponent board...'));
      opponentBoard = await generateRandomBoard(playerBoard.boardSize);
    } else if (options.opponent) {
      try {
        opponentBoard = await parseBoardInput(options.opponent);
      } catch (error) {
        console.log(chalk.red(`❌ Failed to load opponent board: ${(error as Error).message}`));
        process.exit(1);
      }
    } else {
      console.log(chalk.gray('Generating random opponent board...'));
      opponentBoard = await generateRandomBoard(playerBoard.boardSize);
    }
  }

  // Ensure opponent board is defined
  if (!opponentBoard) {
    console.log(chalk.red('❌ No opponent board specified'));
    process.exit(1);
  }

  // Validate boards
  try {
    validateBoardOrThrow(playerBoard);
    validateBoardOrThrow(opponentBoard);
  } catch (error) {
    console.log(chalk.red(`❌ Board validation failed: ${(error as Error).message}`));
    process.exit(1);
  }

  // Run simulation
  console.log(chalk.gray('\nRunning simulation...\n'));

  const result = simulateRound(1, playerBoard, opponentBoard, { silent: true });

  // Display results
  displayResults(result, options.expected);

  // Auto-create session if needed and log test
  try {
    const activeSessionId = await getOrCreateActiveSession();
    const session = await loadSession(activeSessionId);
    const testNumber = session.tests.length + 1;

    await saveTestToSession(activeSessionId, {
      testNumber,
      timestamp: new Date().toISOString(),
      playerBoard,
      opponentBoard,
      result: {
        winner: result.winner,
        playerScore: result.playerPoints,
        opponentScore: result.opponentPoints,
        playerFinalPosition: result.playerFinalPosition,
        opponentFinalPosition: result.opponentFinalPosition,
        collision: result.collision,
      },
      expected: options.expected,
      passed: options.expected
        ? options.expected.toLowerCase() === result.winner ||
          (options.expected.toLowerCase() === 'winner' && result.winner === 'player')
        : undefined,
      notes: options.notes,
    });

    console.log(chalk.green(`✓ Test #${testNumber} logged to session ${activeSessionId}`));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Failed to log test: ${(error as Error).message}`));
  }

  // Save test for --last flag (unless it was already a --last re-run without --new-opponent)
  // If --new-opponent was used, we DO want to save the new opponent board for next time
  if (!options.last || options.newOpponent) {
    await saveLastTest({
      playerBoard,
      opponentBoard,
      expected: options.expected,
      notes: options.notes,
    });
  }
}
