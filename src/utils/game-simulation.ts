/**
 * Game simulation engine for Spaces Game
 * @module utils/game-simulation
 *
 * Rules:
 * - Players follow their board's sequence in order
 * - Movement stops if player hits a trap
 * - If a piece reaches row 0 (top), player gets "final move" bonus
 * - Winner is determined by: completion > distance > moves made
 */

import type { Board, RoundResult, Position } from '@/types';

/**
 * Simulation result details for a single player
 */
interface PlayerSimulationResult {
  finalPosition: Position;
  moves: number;
  hitTrap: boolean;
  completed: boolean; // Reached top row with piece
  distance: number; // Total cells moved
}

/**
 * Calculate Manhattan distance between two positions
 */
function calculateDistance(from: Position, to: Position): number {
  return Math.abs(to.row - from.row) + Math.abs(to.col - from.col);
}

/**
 * Simulate a player's movement through their board
 */
function simulatePlayer(board: Board): PlayerSimulationResult {
  let currentPosition: Position = { row: 1, col: 0 }; // Start at bottom-left
  let moves = 0;
  let hitTrap = false;
  let completed = false;
  let totalDistance = 0;

  // Follow the sequence in order
  for (const move of board.sequence) {
    const targetPosition = move.position;

    // Calculate distance for this move
    totalDistance += calculateDistance(currentPosition, targetPosition);

    // Check what's at the target position
    const cellContent = board.grid[targetPosition.row]?.[targetPosition.col];

    // Move to target
    currentPosition = targetPosition;
    moves++;

    // Check for trap
    if (cellContent === 'trap') {
      hitTrap = true;
      break; // Stop movement
    }

    // Check for completion (reached top row with piece)
    if (cellContent === 'piece' && targetPosition.row === 0) {
      completed = true;
      // Continue with final move if available
      // (in simple version, we just mark as completed)
    }

    // Check for final move marker
    if (cellContent === 'final') {
      // Final move reached - bonus completion
      completed = true;
      break;
    }
  }

  return {
    finalPosition: currentPosition,
    moves,
    hitTrap,
    completed,
    distance: totalDistance,
  };
}

/**
 * Determine winner based on simulation results
 * Priority: completion > distance > fewer moves
 */
function determineWinner(
  player: PlayerSimulationResult,
  opponent: PlayerSimulationResult
): 'player' | 'opponent' | 'tie' {
  // Both completed or both didn't complete
  if (player.completed === opponent.completed) {
    // Compare distance
    if (player.distance > opponent.distance) {
      return 'player';
    } else if (opponent.distance > player.distance) {
      return 'opponent';
    } else {
      // Same distance - fewer moves wins
      if (player.moves < opponent.moves) {
        return 'player';
      } else if (opponent.moves < player.moves) {
        return 'opponent';
      } else {
        return 'tie';
      }
    }
  }

  // One completed, other didn't
  return player.completed ? 'player' : 'opponent';
}

/**
 * Calculate points for a player based on their result
 */
function calculatePoints(result: PlayerSimulationResult): number {
  let points = 0;

  // Base points for distance
  points += result.distance;

  // Bonus for completion
  if (result.completed) {
    points += 10;
  }

  // Penalty for hitting trap
  if (result.hitTrap) {
    points = Math.max(0, points - 5);
  }

  return points;
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
  // Simulate both players
  const playerResult = simulatePlayer(playerBoard);
  const opponentResult = simulatePlayer(opponentBoard);

  // Determine winner
  const winner = determineWinner(playerResult, opponentResult);

  // Calculate points
  const playerPoints = calculatePoints(playerResult);
  const opponentPoints = calculatePoints(opponentResult);

  // Determine outcome
  const playerOutcome: 'won' | 'lost' | 'tie' =
    winner === 'player' ? 'won' : winner === 'opponent' ? 'lost' : 'tie';

  return {
    round,
    winner,
    playerBoard,
    opponentBoard,
    playerFinalPosition: playerResult.finalPosition,
    opponentFinalPosition: opponentResult.finalPosition,
    playerPoints,
    opponentPoints,
    playerOutcome,
    simulationDetails: {
      playerMoves: playerResult.moves,
      opponentMoves: opponentResult.moves,
      playerHitTrap: playerResult.hitTrap,
      opponentHitTrap: opponentResult.hitTrap,
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
