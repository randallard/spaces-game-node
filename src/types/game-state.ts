/**
 * Game state types - uses discriminated unions for type-safe phases
 */

import type { Board } from './board';
import type { Opponent } from './opponent';
import type { UserProfile } from './user';
import type { Deck, GameMode } from './deck';
import type { CreatureId, OutcomeType } from './creature';

/**
 * Round result after simulation
 */
export type RoundResult = {
  round: number;
  winner: 'player' | 'opponent' | 'tie';
  playerBoard: Board;
  opponentBoard: Board;
  playerFinalPosition: { row: number; col: number };
  opponentFinalPosition: { row: number; col: number };
  playerPoints?: number; // Optional for backward compatibility
  opponentPoints?: number; // Optional for backward compatibility
  playerOutcome?: 'won' | 'lost' | 'tie'; // Optional for backward compatibility
  simulationDetails?: {
    playerMoves: number;
    opponentMoves: number;
    playerHitTrap: boolean;
    opponentHitTrap: boolean;
    playerLastStep: number; // Last sequence step executed by player (-1 if none)
    opponentLastStep: number; // Last sequence step executed by opponent (-1 if none)
    playerTrapPosition?: { row: number; col: number }; // Position where player hit trap (if playerHitTrap is true)
    opponentTrapPosition?: { row: number; col: number }; // Position where opponent hit trap (if opponentHitTrap is true)
  };
  // Creature graphics info (optional for backward compatibility)
  playerCreature?: CreatureId;
  opponentCreature?: CreatureId;
  playerVisualOutcome?: OutcomeType;
  opponentVisualOutcome?: OutcomeType;
  collision?: boolean;
  forfeit?: boolean;
};

/**
 * Game phases using discriminated unions for type safety
 * Compiler enforces correct props for each phase
 */
export type GamePhase =
  | { type: 'user-setup' }
  | { type: 'tutorial-intro' } // Tutorial: Introduction + creature selection
  | { type: 'tutorial-board-creation'; playerCreature: CreatureId; cpuSamData: { name: string; creature: CreatureId } }
  | { type: 'tutorial-results'; result: RoundResult; playerBoard: Board }
  | { type: 'tutorial-name-entry'; playerCreature: CreatureId; opponentCreature: CreatureId; firstBoard: Board; playerWon: boolean; cpuSamName: string }
  | { type: 'board-management' }
  | { type: 'add-opponent' } // Add a new opponent to the list (doesn't start a game)
  | { type: 'game-mode-selection' } // Choose round-by-round or deck mode
  | { type: 'board-size-selection'; gameMode: GameMode } // Choose 2x2 or 3x3
  | { type: 'opponent-selection'; gameMode: GameMode } // Pass game mode
  | { type: 'deck-management' } // Create/manage decks
  | { type: 'deck-selection' } // Select deck to play
  | { type: 'loading-challenge' } // Loading challenge data from URL
  | { type: 'board-selection'; round: number } // Round-by-round mode
  | { type: 'share-challenge'; round: number } // Share challenge URL with human opponent
  | { type: 'share-final-results' } // Share final results URL after round 5
  | { type: 'waiting-for-opponent'; round: number }
  | { type: 'round-review'; round: number } // Review previous rounds before selecting board (human vs human)
  | { type: 'round-results'; round: number; result: RoundResult } // Single round result
  | { type: 'all-rounds-results'; results: RoundResult[] } // All 10 rounds at once
  | { type: 'game-over'; winner: 'player' | 'opponent' | 'tie' };

/**
 * Complete game state - NEVER use partial updates
 * Always return the entire state object
 *
 * IMPORTANT: This state contains only the SOURCE OF TRUTH.
 * Derived values (phase, currentRound, scores, board selections) are computed
 * from roundHistory by the useGameState hook to prevent synchronization bugs.
 */
export type GameState = {
  // User and opponent
  user: UserProfile;
  opponent: Opponent | null;

  // Game session
  gameId: string | null; // null until game starts
  gameCreatorId: string | null; // determines who goes first in odd rounds

  // Game configuration
  gameMode: GameMode | null; // null until selected
  boardSize: number | null; // null until selected (2-99)

  // Deck mode selections (only used in deck mode)
  playerSelectedDeck: Deck | null;
  opponentSelectedDeck: Deck | null;

  // SOURCE OF TRUTH - All game progress derived from this
  // Contains complete/partial round results with both boards
  roundHistory: RoundResult[];

  // UI-only phase override (for phases that can't be derived)
  // When null, phase is derived from state. When set, overrides derived phase.
  // Used for: board-management, add-opponent, deck-management, tutorial-*, share-final-results
  phaseOverride: GamePhase | null;

  // Metadata
  lastDiscordNotificationTime: string | null; // ISO timestamp of last successful notification
  checksum: string; // For state integrity validation
};

/**
 * URL payload types for hash fragment communication
 */
export type UrlPayload =
  | { type: 'delta'; changes: Partial<GameState> }
  | { type: 'full_state'; state: GameState }
  | { type: 'resync_request'; requestId: string };
