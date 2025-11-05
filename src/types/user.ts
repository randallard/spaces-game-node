/**
 * User profile types
 */

import type { Board } from './board';
import type { Opponent } from './opponent';

export type UserStats = {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
};

export type UserProfile = {
  id: string;
  name: string;
  createdAt: number;
  stats: UserStats;
  greeting?: string | undefined; // Optional for legacy compatibility
  savedBoards?: Board[] | undefined; // Optional - stored separately
  opponents?: Opponent[] | undefined; // Optional - stored separately
};

/**
 * Per-opponent statistics stored in user profile
 */
export type OpponentStatsMap = Record<string, { wins: number; losses: number }>;
