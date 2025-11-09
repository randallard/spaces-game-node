/**
 * User profile types
 */

import type { Board } from './board';
import type { Opponent } from './opponent';
import type { CreatureId } from './creature';

export type UserStats = {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
};

export type UserPreferences = {
  showCompleteRoundResults?: boolean; // Default to false if undefined
};

export type UserProfile = {
  id: string;
  name: string;
  createdAt: number;
  stats: UserStats;
  preferences?: UserPreferences; // Optional preferences
  greeting?: string | undefined; // Optional for legacy compatibility
  savedBoards?: Board[] | undefined; // Optional - stored separately
  opponents?: Opponent[] | undefined; // Optional - stored separately
  playerCreature?: CreatureId | undefined; // Creature for player
  opponentCreature?: CreatureId | undefined; // Creature for opponent
};

/**
 * Per-opponent statistics stored in user profile
 */
export type OpponentStatsMap = Record<string, { wins: number; losses: number }>;
