/**
 * Game simulation engine for Spaces Game
 * @module simulation
 *
 * Rules:
 * - Players follow their board's sequence step-by-step
 * - +1 point for each forward move (toward goal)
 * - +1 point for reaching goal (Final cell)
 * - -1 point for collision (both players lose 1 point, min 0)
 * - -1 point for hitting opponent's trap (min 0)
 * - Round ends on: collision, goal reached, trap hit, or sequences complete
 */

import type { Board, RoundResult, Position } from './types';

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
 * Check if two positions are adjacent orthogonally (up, down, left, right)
 * Not diagonally - only one direction, exactly 1 square away
 */
function isAdjacentOrthogonal(from: Position, to: Position): boolean {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  // Must move exactly 1 square in one direction (orthogonal)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Simulate a complete round between player and opponent
 *
 * @param round - Round number (1-5 for round-by-round, 1-10 for deck mode)
 * @param playerBoard - Player's selected board
 * @param opponentBoard - Opponent's selected board
 * @param options - Optional configuration (enable/disable logging)
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
  opponentBoard: Board,
  options: { silent?: boolean } = {}
): RoundResult {
  const size = playerBoard.grid.length;
  const silent = options.silent ?? false;

  if (!silent) {
    console.log(`[Game Simulation] Round ${round}`);
  }

  // Initialize game state - positions start as null (not set)
  let playerScore = 0;
  let opponentScore = 0;
  let playerPosition: Position | null = null;
  let opponentPosition: Position | null = null;
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
  let playerTrapPosition: Position | null = null;
  let opponentTrapPosition: Position | null = null;

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

  // Use default starting positions if never moved
  const finalPlayerPosition = playerPosition || { row: size - 1, col: 0 };
  const finalOpponentPosition = opponentPosition || { row: 0, col: size - 1 };

  // Check for collision (both at same position)
  const collision =
    finalPlayerPosition.row === finalOpponentPosition.row &&
    finalPlayerPosition.col === finalOpponentPosition.col;

  if (!silent) {
    console.log(`[Game Simulation] Result: ${winner} | Player: ${playerScore}pts${playerHitTrap ? ' (trapped)' : playerGoalReached ? ' (goal)' : ''} | Opponent: ${opponentScore}pts${opponentHitTrap ? ' (trapped)' : opponentGoalReached ? ' (goal)' : ''}`);
  }

  return {
    round,
    winner,
    playerBoard,
    opponentBoard,
    playerFinalPosition: finalPlayerPosition,
    opponentFinalPosition: finalOpponentPosition,
    playerPoints: playerScore,
    opponentPoints: opponentScore,
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
 * Simulate multiple rounds in sequence
 *
 * @param playerBoards - Player's boards for each round
 * @param opponentBoards - Opponent's boards for each round
 * @param options - Optional configuration
 * @returns Array of round results
 *
 * @example
 * ```ts
 * // 5 rounds for round-by-round mode
 * const results = simulateMultipleRounds(playerBoards, opponentBoards);
 *
 * // 10 rounds for deck mode
 * const deckResults = simulateMultipleRounds(playerDeck, opponentDeck);
 * ```
 */
export function simulateMultipleRounds(
  playerBoards: Board[],
  opponentBoards: Board[],
  options: { silent?: boolean } = {}
): RoundResult[] {
  if (playerBoards.length !== opponentBoards.length) {
    throw new Error('Player and opponent must have same number of boards');
  }

  const numRounds = playerBoards.length;
  const silent = options.silent ?? false;

  if (!silent) {
    console.log(`[Game Simulation] Starting ${numRounds} rounds`);
  }

  const results: RoundResult[] = [];

  for (let round = 1; round <= numRounds; round++) {
    const playerBoard = playerBoards[round - 1]!;
    const opponentBoard = opponentBoards[round - 1]!;

    const result = simulateRound(round, playerBoard, opponentBoard, { silent });
    results.push(result);
  }

  const totalPlayerScore = results.reduce((sum, r) => sum + r.playerPoints, 0);
  const totalOpponentScore = results.reduce((sum, r) => sum + r.opponentPoints, 0);

  if (!silent) {
    console.log(`[Game Simulation] Complete: Player ${totalPlayerScore} - Opponent ${totalOpponentScore}`);
  }

  return results;
}

/**
 * Quick validation that a board is playable
 *
 * Validates:
 * - Non-empty sequence
 * - Valid positions (bounds, non-empty cells)
 * - Movement rules (orthogonal only, no diagonals, no jumps)
 * - Trap placement (only adjacent to piece or at current position)
 * - Trap limit (max boardSize - 1 traps)
 * - Supermove constraint (piece must move immediately after trap at current position)
 * - Piece cannot move into trap
 * - Sequence must contain a final move (piece must reach the goal)
 * - Piece must visit every row (0 through boardSize-1)
 *
 * @param board - Board to validate
 * @returns true if board can be used in simulation
 */
export function isBoardPlayable(board: Board): boolean {
  // Must have at least one move in sequence
  if (board.sequence.length === 0) {
    return false;
  }

  const size = board.grid.length;
  const maxIndex = size - 1;

  // Track current piece position and trap locations
  let currentPosition: Position | null = null;
  const trapPositions = new Set<string>();
  let supermovePosition: Position | null = null; // Track if last move was supermove
  const rowsWithPiece = new Set<number>(); // Track rows visited by piece moves
  let hasFinal = false;

  // Validate each move in sequence
  for (let i = 0; i < board.sequence.length; i++) {
    const move = board.sequence[i]!;
    const row = move.position.row;
    const col = move.position.col;

    // Skip validation for final moves (they're off the board at row -1)
    if (move.type === 'final') {
      if (row !== -1) {
        return false; // Final moves must be at row -1
      }
      // Supermove constraint: piece must move before reaching goal
      if (supermovePosition !== null) {
        return false; // Cannot reach goal right after supermove without moving
      }
      hasFinal = true;
      continue; // Don't check grid content for final moves
    }

    // Check bounds (dynamic grid size)
    if (row < 0 || row > maxIndex || col < 0 || col > maxIndex) {
      return false;
    }

    // Process piece moves
    if (move.type === 'piece') {
      // Piece position must have 'piece' or 'trap' in grid (trap overrides piece waypoint)
      const content = board.grid[row]?.[col];
      if (content !== 'piece' && content !== 'trap') {
        return false; // Piece move must correspond to piece or trap in grid
      }
      // Check supermove constraint: piece MUST move after placing trap at current position
      if (supermovePosition !== null) {
        // Piece must move to a different position
        if (move.position.row === supermovePosition.row && move.position.col === supermovePosition.col) {
          return false; // Piece must move away from supermove position
        }
        supermovePosition = null; // Supermove constraint satisfied
      }

      if (currentPosition !== null) {
        // Check adjacency for piece moves (orthogonal only)
        if (!isAdjacentOrthogonal(currentPosition, move.position)) {
          return false; // Invalid: diagonal or jump move
        }

        // Check that piece is not moving into a trap
        const targetKey = positionKey(move.position.row, move.position.col);
        if (trapPositions.has(targetKey)) {
          return false; // Invalid: piece cannot move into trap
        }
      }

      // Update current position and track row
      currentPosition = move.position;
      rowsWithPiece.add(row);
    }

    // Process trap moves
    if (move.type === 'trap') {
      // Check that grid has trap at this position
      const content = board.grid[row]?.[col];
      if (content !== 'trap') {
        return false; // Trap in sequence must match grid
      }

      if (currentPosition === null) {
        return false; // Cannot place trap before piece is on board
      }

      // Check if trap is at current position (supermove)
      const samePosition =
        move.position.row === currentPosition.row &&
        move.position.col === currentPosition.col;

      if (samePosition) {
        // Supermove: trap at current position
        // Mark that piece must move on next step
        supermovePosition = move.position;
      } else {
        // Trap at different position - must be adjacent to current piece position
        if (!isAdjacentOrthogonal(currentPosition, move.position)) {
          return false; // Invalid: trap not adjacent to piece
        }

        // Supermove constraint: cannot place adjacent trap right after supermove
        if (supermovePosition !== null) {
          return false; // Must move piece first before placing another trap
        }
      }

      // Track trap position
      trapPositions.add(positionKey(move.position.row, move.position.col));
    }
  }

  // Check trap limit: max traps = boardSize - 1
  if (trapPositions.size > board.boardSize - 1) {
    return false; // Too many traps
  }

  // Final check: if sequence ends with supermove without moving, that's invalid
  // (unless goal is reached, but that's already handled above)
  if (supermovePosition !== null) {
    return false; // Sequence cannot end with supermove without piece moving
  }

  // Must reach the goal (sequence must contain a final move)
  if (!hasFinal) {
    return false;
  }

  // Piece must visit every row (path from bottom to top)
  for (let r = 0; r < size; r++) {
    if (!rowsWithPiece.has(r)) {
      return false;
    }
  }

  return true;
}
