/**
 * Tests for creature-graphics utilities
 * @module utils/creature-graphics.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOutcomeGraphic,
  getSharedGraphic,
  getDefaultGraphic,
  getOutcomeAltText,
  imageExists,
  getFallbackGraphic,
  type SharedEvent,
} from './creature-graphics';
import type { CreatureId, OutcomeType } from '@/types/creature';

describe('creature-graphics', () => {
  describe('getOutcomeGraphic', () => {
    it('should return correct path for creature goal outcome', () => {
      const result = getOutcomeGraphic('square', 'goal');
      expect(result).toBe('/creatures/square/goal.svg');
    });

    it('should return correct path for creature trapped outcome', () => {
      const result = getOutcomeGraphic('circle', 'trapped');
      expect(result).toBe('/creatures/circle/trapped.svg');
    });

    it('should return correct path for creature forward outcome', () => {
      const result = getOutcomeGraphic('triangle', 'forward');
      expect(result).toBe('/creatures/triangle/forward.svg');
    });

    it('should return correct path for creature stuck outcome', () => {
      const result = getOutcomeGraphic('bug', 'stuck');
      expect(result).toBe('/creatures/bug/stuck.svg');
    });

    it('should handle custom creature IDs', () => {
      const result = getOutcomeGraphic('custom-racer' as CreatureId, 'goal');
      expect(result).toBe('/creatures/custom-racer/goal.svg');
    });

    it('should always use svg extension', () => {
      const outcomes: OutcomeType[] = ['goal', 'trapped', 'forward', 'stuck'];
      outcomes.forEach((outcome) => {
        const result = getOutcomeGraphic('square', outcome);
        expect(result).toMatch(/\.svg$/);
      });
    });
  });

  describe('getSharedGraphic', () => {
    it('should return correct path for collision event', () => {
      const result = getSharedGraphic('collision');
      expect(result).toBe('/creatures/shared/collision.svg');
    });

    it('should return correct path for double-trap event', () => {
      const result = getSharedGraphic('double-trap');
      expect(result).toBe('/creatures/shared/double-trap.svg');
    });

    it('should return correct path for double-goal event', () => {
      const result = getSharedGraphic('double-goal');
      expect(result).toBe('/creatures/shared/double-goal.svg');
    });

    it('should always place shared graphics in shared directory', () => {
      const events: SharedEvent[] = ['collision', 'double-trap', 'double-goal'];
      events.forEach((event) => {
        const result = getSharedGraphic(event);
        expect(result).toMatch(/^\/creatures\/shared\//);
      });
    });
  });

  describe('getDefaultGraphic', () => {
    it('should return correct path for creature default graphic', () => {
      const result = getDefaultGraphic('square');
      expect(result).toBe('/creatures/square/default.svg');
    });

    it('should return correct path for different creatures', () => {
      const creatures: CreatureId[] = ['square', 'circle', 'triangle', 'bug'];
      creatures.forEach((creature) => {
        const result = getDefaultGraphic(creature);
        expect(result).toBe(`/creatures/${creature}/default.svg`);
      });
    });

    it('should handle custom creature IDs', () => {
      const result = getDefaultGraphic('robot-walker' as CreatureId);
      expect(result).toBe('/creatures/robot-walker/default.svg');
    });
  });

  describe('getOutcomeAltText', () => {
    describe('collision scenarios', () => {
      it('should describe collision between two creatures', () => {
        const result = getOutcomeAltText('Square', 'goal', 'Circle', 'trapped', true);
        expect(result).toBe('Square and Circle collided!');
      });

      it('should prioritize collision over outcomes', () => {
        const result = getOutcomeAltText('Triangle', 'forward', 'Bug', 'stuck', true);
        expect(result).toBe('Triangle and Bug collided!');
      });
    });

    describe('matching outcomes', () => {
      it('should describe both reaching goal', () => {
        const result = getOutcomeAltText('Square', 'goal', 'Circle', 'goal', false);
        expect(result).toBe('Both creatures reached the goal!');
      });

      it('should describe both being trapped', () => {
        const result = getOutcomeAltText('Triangle', 'trapped', 'Bug', 'trapped', false);
        expect(result).toBe('Both creatures was trapped');
      });

      it('should describe both moving forward', () => {
        const result = getOutcomeAltText('Square', 'forward', 'Circle', 'forward', false);
        expect(result).toBe('Both creatures moved forward');
      });

      it('should describe both getting stuck', () => {
        const result = getOutcomeAltText('Triangle', 'stuck', 'Bug', 'stuck', false);
        expect(result).toBe('Both creatures got stuck');
      });
    });

    describe('different outcomes', () => {
      it('should describe player goal and opponent trapped', () => {
        const result = getOutcomeAltText('Square', 'goal', 'Circle', 'trapped', false);
        expect(result).toBe('Square reached the goal, Circle was trapped');
      });

      it('should describe player trapped and opponent goal', () => {
        const result = getOutcomeAltText('Triangle', 'trapped', 'Bug', 'goal', false);
        expect(result).toBe('Triangle was trapped, Bug reached the goal');
      });

      it('should describe player forward and opponent stuck', () => {
        const result = getOutcomeAltText('Square', 'forward', 'Circle', 'stuck', false);
        expect(result).toBe('Square moved forward, Circle got stuck');
      });

      it('should describe mixed outcomes', () => {
        const result = getOutcomeAltText('Triangle', 'stuck', 'Bug', 'forward', false);
        expect(result).toBe('Triangle got stuck, Bug moved forward');
      });

      it('should handle complex creature names', () => {
        const result = getOutcomeAltText(
          'Wind-Up Spider',
          'goal',
          'Clockwork Tank',
          'trapped',
          false
        );
        expect(result).toBe('Wind-Up Spider reached the goal, Clockwork Tank was trapped');
      });
    });

    describe('outcome verbs', () => {
      it('should use correct verb for goal outcome', () => {
        const result = getOutcomeAltText('Square', 'goal', 'Circle', 'trapped', false);
        expect(result).toContain('reached the goal');
      });

      it('should use correct verb for trapped outcome', () => {
        const result = getOutcomeAltText('Square', 'goal', 'Circle', 'trapped', false);
        expect(result).toContain('was trapped');
      });

      it('should use correct verb for forward outcome', () => {
        const result = getOutcomeAltText('Square', 'forward', 'Circle', 'trapped', false);
        expect(result).toContain('moved forward');
      });

      it('should use correct verb for stuck outcome', () => {
        const result = getOutcomeAltText('Square', 'goal', 'Circle', 'stuck', false);
        expect(result).toContain('got stuck');
      });
    });
  });

  describe('imageExists', () => {
    beforeEach(() => {
      // Clear any previous Image constructor mocks
      vi.restoreAllMocks();
    });

    it('should resolve to true when image loads successfully', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        src: '',
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      const promise = imageExists('/creatures/square/goal.png');

      // Trigger onload
      if (mockImage.onload) {
        mockImage.onload(new Event('load'));
      }

      const result = await promise;
      expect(result).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should resolve to false when image fails to load', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        src: '',
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      const promise = imageExists('/creatures/nonexistent/goal.png');

      // Trigger onerror
      if (mockImage.onerror) {
        mockImage.onerror(new Event('error'));
      }

      const result = await promise;
      expect(result).toBe(false);

      vi.unstubAllGlobals();
    });

    it('should set src attribute on image', async () => {
      const mockImage = {
        onload: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        src: '',
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      const testSrc = '/creatures/circle/trapped.png';
      const promise = imageExists(testSrc);

      expect(mockImage.src).toBe(testSrc);

      // Trigger onload to resolve promise
      if (mockImage.onload) {
        mockImage.onload(new Event('load'));
      }

      await promise;

      vi.unstubAllGlobals();
    });

    it('should handle multiple simultaneous checks', async () => {
      const results: boolean[] = [];

      for (let i = 0; i < 3; i++) {
        const mockImage = {
          onload: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
          src: '',
        };

        vi.stubGlobal('Image', vi.fn(() => mockImage));

        const promise = imageExists(`/creatures/test${i}/goal.png`);

        // Alternate between success and failure
        if (i % 2 === 0 && mockImage.onload) {
          mockImage.onload(new Event('load'));
        } else if (mockImage.onerror) {
          mockImage.onerror(new Event('error'));
        }

        results.push(await promise);
        vi.unstubAllGlobals();
      }

      expect(results).toEqual([true, false, true]);
    });
  });

  describe('getFallbackGraphic', () => {
    it('should return shared default graphic path', () => {
      const result = getFallbackGraphic();
      expect(result).toBe('/creatures/shared/default.svg');
    });

    it('should always return the same fallback path', () => {
      const result1 = getFallbackGraphic();
      const result2 = getFallbackGraphic();
      expect(result1).toBe(result2);
    });

    it('should return path in shared directory', () => {
      const result = getFallbackGraphic();
      expect(result).toMatch(/^\/creatures\/shared\//);
    });
  });

  describe('path format consistency', () => {
    it('should use forward slashes in all paths', () => {
      const paths = [
        getOutcomeGraphic('square', 'goal'),
        getSharedGraphic('collision'),
        getDefaultGraphic('circle'),
        getFallbackGraphic(),
      ];

      paths.forEach((path) => {
        expect(path).not.toContain('\\');
        expect(path).toMatch(/\//);
      });
    });

    it('should start all paths with /creatures/', () => {
      const paths = [
        getOutcomeGraphic('square', 'goal'),
        getSharedGraphic('collision'),
        getDefaultGraphic('circle'),
        getFallbackGraphic(),
      ];

      paths.forEach((path) => {
        expect(path).toMatch(/^\/creatures\//);
      });
    });

    it('should use svg extension for all graphics', () => {
      const paths = [
        getOutcomeGraphic('square', 'goal'),
        getSharedGraphic('collision'),
        getDefaultGraphic('circle'),
        getFallbackGraphic(),
      ];

      paths.forEach((path) => {
        expect(path).toMatch(/\.svg$/);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should generate correct paths for a complete round outcome', () => {
      const playerCreature = 'square';
      const opponentCreature = 'circle';
      const playerOutcome: OutcomeType = 'goal';
      const opponentOutcome: OutcomeType = 'trapped';

      const playerGraphic = getOutcomeGraphic(playerCreature, playerOutcome);
      const opponentGraphic = getOutcomeGraphic(opponentCreature, opponentOutcome);
      const altText = getOutcomeAltText('Square', playerOutcome, 'Circle', opponentOutcome, false);

      expect(playerGraphic).toBe('/creatures/square/goal.svg');
      expect(opponentGraphic).toBe('/creatures/circle/trapped.svg');
      expect(altText).toBe('Square reached the goal, Circle was trapped');
    });

    it('should handle collision scenario with correct paths', () => {
      const collisionGraphic = getSharedGraphic('collision');
      const altText = getOutcomeAltText('Triangle', 'goal', 'Bug', 'goal', true);

      expect(collisionGraphic).toBe('/creatures/shared/collision.svg');
      expect(altText).toBe('Triangle and Bug collided!');
    });

    it('should provide fallback for missing graphics', () => {
      const fallback = getFallbackGraphic();
      const defaultGraphic = getDefaultGraphic('unknown-creature' as CreatureId);

      expect(fallback).toBe('/creatures/shared/default.svg');
      expect(defaultGraphic).toBe('/creatures/unknown-creature/default.svg');
    });
  });
});
