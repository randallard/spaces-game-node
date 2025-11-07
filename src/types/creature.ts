/**
 * Creature types - dynamically loaded from /src/creatures/
 * Images are served from /public/creatures/
 */

/**
 * Creature ID is derived from directory name
 */
export type CreatureId = string;

/**
 * Possible round outcomes for creatures
 */
export type OutcomeType = 'goal' | 'trapped' | 'forward' | 'stuck';

/**
 * Creature definition from creature.json
 */
export interface Creature {
  id: CreatureId;
  name: string;
  description: string;
  ability: string;
}

/**
 * Dynamically import all creature.json files
 * Vite will discover these at build time
 */
const creatureModules = import.meta.glob<{ default: Omit<Creature, 'id'> }>(
  '/src/creatures/*/creature.json',
  { eager: true }
);

/**
 * Parse creature ID from file path
 * /src/creatures/square/creature.json -> square
 */
function extractCreatureId(path: string): string | null {
  const match = path.match(/\/creatures\/([^/]+)\/creature\.json$/);
  return match ? match[1]! : null;
}

/**
 * Available creatures loaded from filesystem
 */
export const CREATURES: Record<CreatureId, Creature> = {};

// Build CREATURES map from imported modules
for (const [path, module] of Object.entries(creatureModules)) {
  const id = extractCreatureId(path);
  if (id && module.default) {
    CREATURES[id] = {
      id,
      ...module.default,
    };
  }
}

/**
 * Get all available creatures as an array
 */
export function getAllCreatures(): Creature[] {
  return Object.values(CREATURES);
}

/**
 * Get creature by ID
 */
export function getCreature(id: CreatureId): Creature | undefined {
  return CREATURES[id];
}
