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

import type { Board, RoundResult, Position, CreatureId } from '@/types';
import { getAllCreatures } from '@/types/creature';

/**
 * Get a random creature ID from available creatures
 */
function getRandomCreature(): CreatureId {
  const creatures = getAllCreatures();
  const randomIndex = Math.floor(Math.random() * creatures.length);
  return creatures[randomIndex]!.id;
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
 * @param round - Round number (1-5)
 * @param playerBoard - Player's selected board
 * @param opponentBoard - Opponent's selected board
 * @returns Complete round result with winner and details
 *
 * @example
 * ```ts
 * const result = simulateRound(1, playerBoard, opponentBoard);
 * console.log(`Player: ${result.playerPoints} points`);
 * ```
 */
export function simulateRound(
  round: number,
  playerBoard: Board,
  opponentBoard: Board
): RoundResult {
  const size = playerBoard.grid.length;

  console.log(`[Game Simulation] Round ${round}: ${playerBoard.name} vs ${opponentBoard.name}`);

  // Initialize game state - positions start as null (not set) just like Rust's Option<Position>
  let playerScore = 0;
  let opponentScore = 0;
  let playerPosition: Position | null = null; // Starts unset
  let opponentPosition: Position | null = null; // Starts unset
  let playerRoundEnded = false;
  let opponentRoundEnded = false;
  let playerGoalReached = false;
  let opponentGoalReached = false;
  let playerHitTrap = false;
  let opponentHitTrap = false;
  let playerMoves = 0;
  let opponentMoves = 0;
  let playerLastStep = -1; // Last sequence step executed by player
  let opponentLastStep = -1; // Last sequence step executed by opponent
  let playerTrapPosition: Position | null = null; // Position where player hit trap
  let opponentTrapPosition: Position | null = null; // Position where opponent hit trap

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
        // Check for forward movement before updating position
        if (playerPosition !== null && playerPosition.row > move.position.row) {
          playerScore++;
        }
        playerPosition = move.position;
        playerMoves++;
        playerLastStep = step;
      } else if (move.type === 'trap' || cellContent === 'trap') {
        traps.playerTraps.set(positionKey(move.position.row, move.position.col), step);
        playerLastStep = step;
      } else if (move.type === 'final' || cellContent === 'final') {
        playerGoalReached = true;
        playerPosition = move.position; // Update position to goal (off-board)
        playerScore++;
        playerRoundEnded = true;
        playerLastStep = step;
      }
    }

    // Process opponent's move (with rotation)
    if (!opponentRoundEnded && step < opponentBoard.sequence.length) {
      const move = opponentBoard.sequence[step]!;
      const rotated = rotatePosition(move.position.row, move.position.col, size);
      const cellContent = opponentBoard.grid[move.position.row]?.[move.position.col];

      if (move.type === 'piece' || cellContent === 'piece') {
        // Check for forward movement before updating position
        if (opponentPosition !== null && opponentPosition.row < rotated.row) {
          opponentScore++;
        }
        opponentPosition = rotated;
        opponentMoves++;
        opponentLastStep = step;
      } else if (move.type === 'trap' || cellContent === 'trap') {
        traps.opponentTraps.set(positionKey(rotated.row, rotated.col), step);
        opponentLastStep = step;
      } else if (move.type === 'final' || cellContent === 'final') {
        opponentGoalReached = true;
        opponentPosition = rotated; // Update position to goal (off-board)
        opponentScore++;
        opponentRoundEnded = true;
        opponentLastStep = step;
      }
    }

    // Check for collision (only if both positions are set and neither has left the board)
    if (
      !playerGoalReached &&
      !opponentGoalReached &&
      playerPosition !== null &&
      opponentPosition !== null &&
      playerPosition.row === opponentPosition.row &&
      playerPosition.col === opponentPosition.col
    ) {
      // Both players lose 1 point (minimum 0)
      if (playerScore > 0) {
        playerScore--;
      }
      if (opponentScore > 0) {
        opponentScore--;
      }
      break; // End round immediately
    }

    // Check if player hit opponent's trap (only if player has a position)
    if (!playerRoundEnded && playerPosition !== null) {
      const trapStep = traps.opponentTraps.get(
        positionKey(playerPosition.row, playerPosition.col)
      );
      if (trapStep !== undefined && trapStep <= step) {
        if (playerScore > 0) {
          playerScore--;
        }
        playerHitTrap = true;
        playerTrapPosition = { row: playerPosition.row, col: playerPosition.col };
        playerRoundEnded = true;
      }
    }

    // Check if opponent hit player's trap (only if opponent has a position)
    if (!opponentRoundEnded && opponentPosition !== null) {
      const trapStep = traps.playerTraps.get(
        positionKey(opponentPosition.row, opponentPosition.col)
      );
      if (trapStep !== undefined && trapStep <= step) {
        if (opponentScore > 0) {
          opponentScore--;
        }
        opponentHitTrap = true;
        opponentTrapPosition = { row: opponentPosition.row, col: opponentPosition.col };
        opponentRoundEnded = true;
      }
    }

    // Stop if both players have ended their round
    if (playerRoundEnded && opponentRoundEnded) {
      break;
    }

    // Stop if either player has reached their goal
    if (playerGoalReached || opponentGoalReached) {
      break;
    }
  }

  // Determine winner based on final scores
  const winner: 'player' | 'opponent' | 'tie' =
    playerScore > opponentScore ? 'player' : opponentScore > playerScore ? 'opponent' : 'tie';

  const playerOutcome: 'won' | 'lost' | 'tie' =
    winner === 'player' ? 'won' : winner === 'opponent' ? 'lost' : 'tie';

  // Use default starting positions if never moved
  const finalPlayerPosition = playerPosition || { row: size - 1, col: 0 };
  const finalOpponentPosition = opponentPosition || { row: 0, col: size - 1 };


  // Determine visual outcomes based on what happened
  // Priority: goal > trapped > stuck (if opponent reached goal) > forward > stuck
  const playerVisualOutcome = playerGoalReached
    ? 'goal'
    : playerHitTrap
      ? 'trapped'
      : opponentGoalReached
        ? 'stuck'
        : playerMoves > 0
          ? 'forward'
          : 'stuck';

  const opponentVisualOutcome = opponentGoalReached
    ? 'goal'
    : opponentHitTrap
      ? 'trapped'
      : playerGoalReached
        ? 'stuck'
        : opponentMoves > 0
          ? 'forward'
          : 'stuck';

  // Check for collision (both at same position)
  const collision =
    finalPlayerPosition.row === finalOpponentPosition.row &&
    finalPlayerPosition.col === finalOpponentPosition.col;

  console.log(`[Game Simulation] Result: ${winner} | Player: ${playerScore}pts${playerHitTrap ? ' (trapped)' : playerGoalReached ? ' (goal)' : ''} | Opponent: ${opponentScore}pts${opponentHitTrap ? ' (trapped)' : opponentGoalReached ? ' (goal)' : ''}`);

  return {
    round,
    winner,
    playerBoard,
    opponentBoard,
    playerFinalPosition: finalPlayerPosition,
    opponentFinalPosition: finalOpponentPosition,
    playerPoints: playerScore,
    opponentPoints: opponentScore,
    playerOutcome,
    playerVisualOutcome,
    opponentVisualOutcome,
    collision,
    simulationDetails: {
      playerMoves,
      opponentMoves,
      playerHitTrap,
      opponentHitTrap,
      playerLastStep,
      opponentLastStep,
      ...(playerTrapPosition && { playerTrapPosition }),
      ...(opponentTrapPosition && { opponentTrapPosition }),
    },
  };
}

/**
 * Simulate all 10 rounds for deck-based gameplay
 *
 * @param playerBoards - Player's deck of 10 boards
 * @param opponentBoards - Opponent's deck of 10 boards
 * @returns Array of 10 round results
 *
 * @example
 * ```ts
 * const results = simulateAllRounds(playerDeck.boards, opponentDeck.boards);
 * results.forEach(result => {
 *   console.log(`Round ${result.round}: ${result.winner} wins`);
 * });
 * ```
 */
export function simulateAllRounds(
  playerBoards: Board[],
  opponentBoards: Board[],
  playerCreature?: CreatureId,
  opponentCreature?: CreatureId
): RoundResult[] {
  if (playerBoards.length !== 10 || opponentBoards.length !== 10) {
    throw new Error('Both decks must have exactly 10 boards');
  }

  console.log('[Game Simulation] Deck mode: 10 rounds');

  // Use provided creatures or select random ones
  const finalPlayerCreature = playerCreature || getRandomCreature();
  const finalOpponentCreature = opponentCreature || getRandomCreature();

  const results: RoundResult[] = [];

  for (let round = 1; round <= 10; round++) {
    const playerBoard = playerBoards[round - 1]!;
    const opponentBoard = opponentBoards[round - 1]!;

    const result = simulateRound(round, playerBoard, opponentBoard);

    // Assign creatures to the result
    result.playerCreature = finalPlayerCreature;
    result.opponentCreature = finalOpponentCreature;

    results.push(result);
  }

  const totalPlayerScore = results.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
  const totalOpponentScore = results.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0);
  console.log(`[Game Simulation] Deck complete: Player ${totalPlayerScore} - Opponent ${totalOpponentScore}`);

  return results;
}

/**
 * Quick validation that a board is playable
 */
export function isBoardPlayable(board: Board): boolean {
  // Must have at least one move in sequence
  if (board.sequence.length === 0) {
    return false;
  }

  const size = board.grid.length;
  const maxIndex = size - 1;

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

    // Check bounds (dynamic grid size)
    if (row < 0 || row > maxIndex || col < 0 || col > maxIndex) {
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
