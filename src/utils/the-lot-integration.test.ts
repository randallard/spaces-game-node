/**
 * Tests for the-lot integration utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import LZString from 'lz-string';
import {
  hasLotLaunchInUrl,
  parseLotLaunch,
  clearLotHash,
  configureLotOpponent,
  returnToLot,
  type LotLaunchData,
  type LotReturnResults,
} from './the-lot-integration';

const validLotData: LotLaunchData = {
  sessionId: 'test-session-123',
  npcId: 'myco',
  npcDisplayName: 'Myco',
  opponentType: 'ai-agent',
  skillLevel: 'scripted_5',
  modelAssignments: {},
  returnUrl: 'https://townage.vercel.app/',
};

function setLotHash(data: unknown) {
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
  Object.defineProperty(window, 'location', {
    value: {
      hash: `#lot=${compressed}`,
      pathname: '/',
      search: '',
      href: `https://spaces-game.vercel.app/#lot=${compressed}`,
    },
    writable: true,
    configurable: true,
  });
}

describe('the-lot-integration', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { hash: '', pathname: '/', search: '', href: 'https://spaces-game.vercel.app/' },
      writable: true,
      configurable: true,
    });
    window.history.replaceState = vi.fn();
  });

  describe('hasLotLaunchInUrl', () => {
    it('returns false when no hash', () => {
      expect(hasLotLaunchInUrl()).toBe(false);
    });

    it('returns false for non-lot hash', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#c=somedata', pathname: '/', search: '' },
        writable: true,
        configurable: true,
      });
      expect(hasLotLaunchInUrl()).toBe(false);
    });

    it('returns true for #lot= hash', () => {
      setLotHash(validLotData);
      expect(hasLotLaunchInUrl()).toBe(true);
    });
  });

  describe('parseLotLaunch', () => {
    it('returns null when no hash', () => {
      expect(parseLotLaunch()).toBeNull();
    });

    it('parses valid compressed launch data', () => {
      setLotHash(validLotData);
      const result = parseLotLaunch();
      expect(result).toEqual(validLotData);
    });

    it('returns null for missing sessionId', () => {
      const { sessionId, ...incomplete } = validLotData;
      setLotHash(incomplete);
      expect(parseLotLaunch()).toBeNull();
    });

    it('returns null for missing npcId', () => {
      const { npcId, ...incomplete } = validLotData;
      setLotHash(incomplete);
      expect(parseLotLaunch()).toBeNull();
    });

    it('returns null for missing skillLevel', () => {
      const { skillLevel, ...incomplete } = validLotData;
      setLotHash(incomplete);
      expect(parseLotLaunch()).toBeNull();
    });

    it('returns null for missing returnUrl', () => {
      const { returnUrl, ...incomplete } = validLotData;
      setLotHash(incomplete);
      expect(parseLotLaunch()).toBeNull();
    });

    it('returns null for corrupted data', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#lot=garbage!!!', pathname: '/', search: '' },
        writable: true,
        configurable: true,
      });
      expect(parseLotLaunch()).toBeNull();
    });

    it('returns null for non-lot hash', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#r=somedata', pathname: '/', search: '' },
        writable: true,
        configurable: true,
      });
      expect(parseLotLaunch()).toBeNull();
    });
  });

  describe('clearLotHash', () => {
    it('clears hash via replaceState', () => {
      setLotHash(validLotData);
      clearLotHash();
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        expect.any(String),
        '/',
      );
    });
  });

  describe('configureLotOpponent', () => {
    it('creates opponent with lot-npc- prefix', () => {
      const opponent = configureLotOpponent(validLotData);
      expect(opponent.id).toBe('lot-npc-myco');
    });

    it('uses display name', () => {
      const opponent = configureLotOpponent(validLotData);
      expect(opponent.name).toBe('Myco');
    });

    it('falls back to capitalized npcId when no displayName', () => {
      const data = { ...validLotData, npcDisplayName: '' };
      const opponent = configureLotOpponent(data);
      expect(opponent.name).toBe('Myco'); // Capitalized from 'myco'
    });

    it('sets type to ai-agent', () => {
      const opponent = configureLotOpponent(validLotData);
      expect(opponent.type).toBe('ai-agent');
    });

    it('maps skill level', () => {
      const opponent = configureLotOpponent(validLotData);
      expect(opponent.skillLevel).toBe('scripted_5');
    });

    it('starts with zero wins/losses', () => {
      const opponent = configureLotOpponent(validLotData);
      expect(opponent.wins).toBe(0);
      expect(opponent.losses).toBe(0);
    });

    it('passes through model assignments', () => {
      const data: LotLaunchData = {
        ...validLotData,
        modelAssignments: {
          '2': { modelId: 'model-a', label: 'Fast' },
          '3': { modelId: 'model-b', label: 'Strong' },
        },
      };
      const opponent = configureLotOpponent(data);
      expect(opponent.modelAssignments).toEqual({
        '2': { modelId: 'model-a', label: 'Fast' },
        '3': { modelId: 'model-b', label: 'Strong' },
      });
    });
  });

  describe('returnToLot', () => {
    it('navigates to returnUrl with #r= hash', () => {
      const results: LotReturnResults = {
        sessionId: 'test-session',
        npcId: 'myco',
        boardSize: 5,
        playerScore: 3,
        opponentScore: 2,
        winner: 'player',
        rounds: [
          { round: 1, playerPoints: 1, opponentPoints: 0, winner: 'player' },
        ],
      };

      // Mock window.location.href setter
      const hrefSetter = vi.fn();
      Object.defineProperty(window, 'location', {
        value: {
          hash: '',
          pathname: '/',
          search: '',
          get href() { return ''; },
          set href(url: string) { hrefSetter(url); },
        },
        writable: true,
        configurable: true,
      });

      returnToLot('https://townage.vercel.app/', results);

      expect(hrefSetter).toHaveBeenCalledTimes(1);
      const url = hrefSetter.mock.calls[0]?.[0] as string;
      expect(url).toBeDefined();
      expect(url).toMatch(/^https:\/\/townage\.vercel\.app\/#r=.+$/);

      // Verify the compressed data round-trips
      const compressed = url.split('#r=')[1]!;
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      const parsed = JSON.parse(json!);
      expect(parsed.sessionId).toBe('test-session');
      expect(parsed.npcId).toBe('myco');
      expect(parsed.winner).toBe('player');
    });
  });
});
