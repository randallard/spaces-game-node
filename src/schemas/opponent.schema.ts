/**
 * Zod schemas for opponent validation
 */

import { z } from 'zod';

export const OpponentTypeSchema = z.enum(['human', 'cpu', 'remote-cpu', 'ai-agent']);

export const AiAgentSkillLevelSchema = z.enum([
  'beginner',
  'beginner_plus',
  'intermediate',
  'intermediate_plus',
  'advanced',
  'advanced_plus',
]);

export const OpponentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  type: OpponentTypeSchema,
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  hasCompletedGame: z.boolean().optional(),
  archived: z.boolean().optional(), // If true, hidden from opponents list

  // Discord integration
  discordId: z.string().optional(),
  discordUsername: z.string().max(32).optional(),
  discordAvatar: z.string().optional(),

  // AI Agent
  skillLevel: AiAgentSkillLevelSchema.optional(),
});

export const OpponentStatsSchema = z.object({
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
});
