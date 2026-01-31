/**
 * Game result types for Spaces Game engine
 */

import type { Board, Position } from './board';

/**
 * Round result after simulation
 */
export type RoundResult = {
  round: number;
  winner: 'player' | 'opponent' | 'tie';
  playerBoard: Board;
  opponentBoard: Board;
  playerFinalPosition: Position;
  opponentFinalPosition: Position;
  playerPoints: number;
  opponentPoints: number;
  collision: boolean;
  simulationDetails: {
    playerMoves: number;
    opponentMoves: number;
    playerHitTrap: boolean;
    opponentHitTrap: boolean;
    playerLastStep: number; // Last sequence step executed (-1 if none)
    opponentLastStep: number; // Last sequence step executed (-1 if none)
    playerTrapPosition?: Position; // Position where player hit trap
    opponentTrapPosition?: Position; // Position where opponent hit trap
  };
};

/**
 * Complete game result (5 rounds for round-by-round, 10 for deck mode)
 */
export type GameResult = {
  rounds: RoundResult[];
  finalPlayerScore: number;
  finalOpponentScore: number;
  winner: 'player' | 'opponent' | 'tie';
};

/**
 * Observation modes for RL training
 */
export type ObservationMode = 'perfect' | 'fog_of_war';

/**
 * Observation for RL agent (perfect information mode)
 */
export type PerfectObservation = {
  mode: 'perfect';
  round: number;
  myLastBoard?: Board;
  opponentLastBoard?: Board;
  lastResult?: RoundResult;
  myTotalScore: number;
  opponentTotalScore: number;
  roundHistory: RoundResult[];
};

/**
 * Observation for RL agent (fog of war mode)
 * Agent doesn't see full opponent board, only partial info
 */
export type FogOfWarObservation = {
  mode: 'fog_of_war';
  round: number;
  myLastBoard?: Board;
  lastResult?: {
    winner: 'player' | 'opponent' | 'tie';
    myPoints: number;
    opponentPoints: number;
    myFinalPosition: Position;
    opponentFinalPosition: Position;
    opponentVisitedCells: Position[]; // Cells opponent passed through
    opponentTrapEvents: number[]; // Steps where opponent placed traps (locations hidden)
    iHitOpponentTrap: boolean;
    opponentHitMyTrap: boolean;
    collision: boolean;
  };
  myTotalScore: number;
  opponentTotalScore: number;
  roundHistory: FogOfWarObservation['lastResult'][];
};

/**
 * Union type for all observation modes
 */
export type Observation = PerfectObservation | FogOfWarObservation;
