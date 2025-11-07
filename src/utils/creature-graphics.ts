/**
 * Creature graphics loading utilities
 * Handles loading outcome images for post-apocalyptic wind-up creatures
 */

import type { CreatureId, OutcomeType } from '@/types/creature';

/**
 * Shared event types that have their own graphics
 */
export type SharedEvent = 'collision' | 'double-trap' | 'double-goal';

/**
 * Get the path to a creature's outcome graphic
 * Uses SVG format (can be replaced with PNG/JPG by swapping files)
 */
export function getOutcomeGraphic(creature: CreatureId, outcome: OutcomeType): string {
  // SVG placeholders by default - users can replace with PNG/JPG with same name
  return `${import.meta.env.BASE_URL}creatures/${creature}/${outcome}.svg`;
}

/**
 * Get the path to a shared event graphic
 */
export function getSharedGraphic(event: SharedEvent): string {
  return `${import.meta.env.BASE_URL}creatures/shared/${event}.svg`;
}

/**
 * Get the default/idle graphic for a creature
 */
export function getDefaultGraphic(creature: CreatureId): string {
  return `${import.meta.env.BASE_URL}creatures/${creature}/default.svg`;
}

/**
 * Convert outcome to past-tense verb for alt text
 */
function outcomeToVerb(outcome: OutcomeType): string {
  const verbs: Record<OutcomeType, string> = {
    goal: 'reached the goal',
    trapped: 'was trapped',
    forward: 'moved forward',
    stuck: 'got stuck',
  };
  return verbs[outcome];
}

/**
 * Generate descriptive alt text for round outcome
 */
export function getOutcomeAltText(
  playerCreature: string,
  playerOutcome: OutcomeType,
  opponentCreature: string,
  opponentOutcome: OutcomeType,
  collision: boolean
): string {
  if (collision) {
    return `${playerCreature} and ${opponentCreature} collided!`;
  }

  if (playerOutcome === opponentOutcome) {
    if (playerOutcome === 'goal') {
      return `Both creatures reached the goal!`;
    }
    return `Both creatures ${outcomeToVerb(playerOutcome)}`;
  }

  const playerText = `${playerCreature} ${outcomeToVerb(playerOutcome)}`;
  const opponentText = `${opponentCreature} ${outcomeToVerb(opponentOutcome)}`;

  return `${playerText}, ${opponentText}`;
}

/**
 * Determine if an image path exists (client-side check)
 * Returns a promise that resolves to true if image loads successfully
 */
export function imageExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Get fallback graphic path
 */
export function getFallbackGraphic(): string {
  return `${import.meta.env.BASE_URL}creatures/shared/default.svg`;
}
