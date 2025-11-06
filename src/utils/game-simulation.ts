/**
 * Game simulation engine for Spaces Game
 * @module utils/game-simulation
 *
 * Rules (matching Rust version):
 * - Players follow their board's sequence step-by-step
 * - +1 point for each forward move (toward goal)
 * - +1 point for reaching goal (Final cell)
 * - -1 point for collision (both players lose 1 point, min 0)
 * - -1 point for hitting opponent's trap (min 0)
 * - Round ends on: collision, goal reached, trap hit, or sequences complete
 */

import type { Board, RoundResult, Position } from '@/types';

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
 * Track trap placements on the board
 */
interface TrapData {
  playerTraps: Map<string, number>; // position key -> step number
  opponentTraps: Map<string, number>;
}

/**
 * Get position key for map lookup
 */
function positionKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Simulate a complete round between player and opponent
 *
 * @param round - Round number (1-8)
 * @param playerBoard - Player's selected board
 * @param opponentBoard - Opponent's selected board
 * @returns Complete round result with winner and details
 *
 * @example
 * ```ts
 * const result = simulateRound(1, playerBoard, opponentBoard);
 * console.log(`Winner: ${result.winner}`);
 * console.log(`Player: ${result.playerPoints} points`);
 * ```
 */
export function simulateRound(
  round: number,
  playerBoard: Board,
  opponentBoard: Board
): RoundResult {
  const size = playerBoard.grid.length;

  // Initialize game state
  let playerScore = 0;
  let opponentScore = 0;
  let playerPosition: Position = { row: size - 1, col: 0 }; // Bottom-left
  let opponentPosition: Position = { row: 0, col: size - 1 }; // Top-right (rotated bottom-left)
  let playerRoundEnded = false;
  let opponentRoundEnded = false;
  let playerGoalReached = false;
  let opponentGoalReached = false;
  let playerHitTrap = false;
  let opponentHitTrap = false;
  let playerMoves = 0;
  let opponentMoves = 0;

  // Track trap placements
  const traps: TrapData = {
    playerTraps: new Map(),
    opponentTraps: new Map(),
  };

  const maxSteps = Math.max(playerBoard.sequence.length, opponentBoard.sequence.length);

  // Step-by-step simulation
  for (let step = 0; step < maxSteps; step++) {
    // Process player's move
    if (!playerRoundEnded && step < playerBoard.sequence.length) {
      const move = playerBoard.sequence[step]!;
      const cellContent = playerBoard.grid[move.position.row]?.[move.position.col];

      if (move.type === 'piece' || cellContent === 'piece') {
        const prevRow = playerPosition.row;
        playerPosition = move.position;
        playerMoves++;

        // Award point for forward movement (moving to lower row number)
        if (prevRow > playerPosition.row) {
          playerScore++;
        }
      } else if (move.type === 'trap' || cellContent === 'trap') {
        traps.playerTraps.set(positionKey(move.position.row, move.position.col), step);
      } else if (move.type === 'final' || cellContent === 'final') {
        playerGoalReached = true;
        playerScore++;
        playerRoundEnded = true;
      }
    }

    // Process opponent's move (with rotation)
    if (!opponentRoundEnded && step < opponentBoard.sequence.length) {
      const move = opponentBoard.sequence[step]!;
      const rotated = rotatePosition(move.position.row, move.position.col, size);
      const cellContent = opponentBoard.grid[move.position.row]?.[move.position.col];

      if (move.type === 'piece' || cellContent === 'piece') {
        const prevRow = opponentPosition.row;
        opponentPosition = rotated;
        opponentMoves++;

        // Award point for forward movement (moving to higher row number for rotated opponent)
        if (prevRow < opponentPosition.row) {
          opponentScore++;
        }
      } else if (move.type === 'trap' || cellContent === 'trap') {
        traps.opponentTraps.set(positionKey(rotated.row, rotated.col), step);
      } else if (move.type === 'final' || cellContent === 'final') {
        opponentGoalReached = true;
        opponentScore++;
        opponentRoundEnded = true;
      }
    }

    // Check for collision
    if (
      playerPosition.row === opponentPosition.row &&
      playerPosition.col === opponentPosition.col
    ) {
      // Both players lose 1 point (minimum 0)
      if (playerScore > 0) playerScore--;
      if (opponentScore > 0) opponentScore--;
      break; // End round immediately
    }

    // Check if player hit opponent's trap
    if (!playerRoundEnded) {
      const trapStep = traps.opponentTraps.get(
        positionKey(playerPosition.row, playerPosition.col)
      );
      if (trapStep !== undefined && trapStep <= step) {
        if (playerScore > 0) playerScore--;
        playerHitTrap = true;
        playerRoundEnded = true;
      }
    }

    // Check if opponent hit player's trap
    if (!opponentRoundEnded) {
      const trapStep = traps.playerTraps.get(
        positionKey(opponentPosition.row, opponentPosition.col)
      );
      if (trapStep !== undefined && trapStep <= step) {
        if (opponentScore > 0) opponentScore--;
        opponentHitTrap = true;
        opponentRoundEnded = true;
      }
    }

    // End round if both players finished or either reached goal
    if ((playerRoundEnded && opponentRoundEnded) || playerGoalReached || opponentGoalReached) {
      break;
    }
  }

  // Determine winner based on final scores
  const winner: 'player' | 'opponent' | 'tie' =
    playerScore > opponentScore ? 'player' : opponentScore > playerScore ? 'opponent' : 'tie';

  const playerOutcome: 'won' | 'lost' | 'tie' =
    winner === 'player' ? 'won' : winner === 'opponent' ? 'lost' : 'tie';

  return {
    round,
    winner,
    playerBoard,
    opponentBoard,
    playerFinalPosition: playerPosition,
    opponentFinalPosition: opponentPosition,
    playerPoints: playerScore,
    opponentPoints: opponentScore,
    playerOutcome,
    simulationDetails: {
      playerMoves,
      opponentMoves,
      playerHitTrap,
      opponentHitTrap,
    },
  };
}

/**
 * Quick validation that a board is playable
 */
export function isBoardPlayable(board: Board): boolean {
  // Must have at least one move in sequence
  if (board.sequence.length === 0) {
    return false;
  }

  // All sequence positions must be valid
  for (const move of board.sequence) {
    const row = move.position.row;
    const col = move.position.col;

    // Skip validation for final moves (they're off the board at row -1)
    if (move.type === 'final') {
      if (row !== -1) {
        return false; // Final moves must be at row -1
      }
      continue; // Don't check grid content for final moves
    }

    // Check bounds (2x2 grid)
    if (row < 0 || row > 1 || col < 0 || col > 1) {
      return false;
    }

    // Check that position has content
    const content = board.grid[row]?.[col];
    if (!content || content === 'empty') {
      return false;
    }
  }

  return true;
}
