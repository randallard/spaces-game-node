/**
 * Opponent-related types
 */

export type OpponentType = 'human' | 'cpu' | 'remote-cpu' | 'ai-agent';

export type AiAgentSkillLevel =
  | 'beginner'
  | 'beginner_plus'
  | 'intermediate'
  | 'intermediate_plus'
  | 'advanced'
  | 'advanced_plus'
  | 'test_fail';

export type Opponent = {
  id: string; // Generated from type + name
  name: string;
  type: OpponentType;
  wins: number;
  losses: number;
  hasCompletedGame?: boolean | undefined; // Track if at least one game has been completed (for human opponents)
  archived?: boolean | undefined; // If true, hidden from opponents list

  // Discord integration
  discordId?: string | undefined; // Discord user ID (for sending notifications)
  discordUsername?: string | undefined; // Discord username for display
  discordAvatar?: string | undefined; // Discord avatar hash (for displaying profile picture)

  // AI Agent
  skillLevel?: AiAgentSkillLevel | undefined; // Skill level for AI agent opponents
};

export type OpponentStats = {
  wins: number;
  losses: number;
};
