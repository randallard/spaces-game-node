/**
 * Tests for creature types and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getAllCreatures,
  getCreature,
  CREATURES,
  type CreatureId,
} from './creature';

describe('CREATURES', () => {
  it('should be an object', () => {
    expect(CREATURES).toBeDefined();
    expect(typeof CREATURES).toBe('object');
  });

  it('should contain creature entries', () => {
    const creatures = Object.values(CREATURES);
    expect(creatures.length).toBeGreaterThan(0);
  });

  it('should have creatures with required fields', () => {
    const creatures = Object.values(CREATURES);
    creatures.forEach((creature) => {
      expect(creature).toHaveProperty('id');
      expect(creature).toHaveProperty('name');
      expect(creature).toHaveProperty('description');
      expect(creature).toHaveProperty('ability');
      expect(typeof creature.id).toBe('string');
      expect(typeof creature.name).toBe('string');
      expect(typeof creature.description).toBe('string');
      expect(typeof creature.ability).toBe('string');
    });
  });

  it('should have creature IDs matching their keys', () => {
    Object.entries(CREATURES).forEach(([key, creature]) => {
      expect(creature.id).toBe(key);
    });
  });
});

describe('getAllCreatures', () => {
  it('should return an array', () => {
    const creatures = getAllCreatures();
    expect(Array.isArray(creatures)).toBe(true);
  });

  it('should return all creatures from CREATURES object', () => {
    const creatures = getAllCreatures();
    const expected = Object.values(CREATURES);
    expect(creatures).toEqual(expected);
  });

  it('should return creatures with all required fields', () => {
    const creatures = getAllCreatures();
    creatures.forEach((creature) => {
      expect(creature).toHaveProperty('id');
      expect(creature).toHaveProperty('name');
      expect(creature).toHaveProperty('description');
      expect(creature).toHaveProperty('ability');
    });
  });

  it('should return non-empty array if creatures exist', () => {
    const creatures = getAllCreatures();
    if (Object.keys(CREATURES).length > 0) {
      expect(creatures.length).toBeGreaterThan(0);
    }
  });
});

describe('getCreature', () => {
  it('should return creature by valid ID', () => {
    const allCreatures = getAllCreatures();
    if (allCreatures.length > 0) {
      const firstCreature = allCreatures[0]!;
      const result = getCreature(firstCreature.id);
      expect(result).toBeDefined();
      expect(result).toEqual(firstCreature);
    }
  });

  it('should return undefined for non-existent ID', () => {
    const result = getCreature('non-existent-creature-id-12345');
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const result = getCreature('');
    expect(result).toBeUndefined();
  });

  it('should return correct creature for each ID in CREATURES', () => {
    Object.entries(CREATURES).forEach(([id, expected]) => {
      const result = getCreature(id as CreatureId);
      expect(result).toEqual(expected);
    });
  });

  it('should return creature with matching ID field', () => {
    const allCreatures = getAllCreatures();
    allCreatures.forEach((creature) => {
      const result = getCreature(creature.id);
      expect(result?.id).toBe(creature.id);
    });
  });
});

describe('creature data integrity', () => {
  it('should have unique IDs for all creatures', () => {
    const creatures = getAllCreatures();
    const ids = creatures.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have non-empty names for all creatures', () => {
    const creatures = getAllCreatures();
    creatures.forEach((creature) => {
      expect(creature.name.length).toBeGreaterThan(0);
    });
  });

  it('should have non-empty descriptions for all creatures', () => {
    const creatures = getAllCreatures();
    creatures.forEach((creature) => {
      expect(creature.description.length).toBeGreaterThan(0);
    });
  });

  it('should have non-empty abilities for all creatures', () => {
    const creatures = getAllCreatures();
    creatures.forEach((creature) => {
      expect(creature.ability.length).toBeGreaterThan(0);
    });
  });
});
