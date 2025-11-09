/**
 * Tests for data migration utilities
 * @module utils/data-migrations.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { migrateUserProfile, migrateGameState, migrateBoards, migrateDecks } from './data-migrations';

describe('migrateUserProfile', () => {
  it('should add boardSize to boards missing the field', () => {
    const oldData = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          grid: [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [],
          thumbnail: '',
          createdAt: 123456,
        },
        {
          id: 'board-2',
          name: 'Board 2',
          grid: [
            ['empty', 'empty', 'empty'],
            ['empty', 'piece', 'empty'],
            ['empty', 'empty', 'empty'],
          ],
          sequence: [],
          thumbnail: '',
          createdAt: 123457,
        },
      ],
    };

    const migrated = migrateUserProfile(oldData);

    expect(migrated.boards[0]).toHaveProperty('boardSize', 2);
    expect(migrated.boards[1]).toHaveProperty('boardSize', 3);
  });

  it('should not modify boards that already have boardSize', () => {
    const newData = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          boardSize: 2,
          grid: [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [],
          thumbnail: '',
          createdAt: 123456,
        },
      ],
    };

    const migrated = migrateUserProfile(newData);

    expect(migrated.boards[0].boardSize).toBe(2);
  });

  it('should handle empty boards array', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: [],
    };

    const migrated = migrateUserProfile(data);

    expect(migrated.boards).toEqual([]);
  });

  it('should handle data without boards field', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
    };

    const migrated = migrateUserProfile(data);

    expect(migrated).toEqual(data);
  });
});

describe('migrateGameState', () => {
  it('should add boardSize to boards in player decks', () => {
    const oldData = {
      playerDecks: [
        {
          id: 'deck-1',
          name: 'Deck 1',
          boards: [
            {
              id: 'board-1',
              name: 'Board 1',
              grid: [
                ['piece', 'empty'],
                ['empty', 'empty'],
              ],
              sequence: [],
              thumbnail: '',
              createdAt: 123456,
            },
          ],
        },
      ],
      opponentDecks: [],
    };

    const migrated = migrateGameState(oldData);

    expect(migrated.playerDecks[0].boards[0]).toHaveProperty('boardSize', 2);
  });

  it('should add boardSize to boards in opponent decks', () => {
    const oldData = {
      playerDecks: [],
      opponentDecks: [
        {
          id: 'deck-1',
          name: 'Deck 1',
          boards: [
            {
              id: 'board-1',
              name: 'Board 1',
              grid: [
                ['empty', 'empty', 'empty'],
                ['empty', 'piece', 'empty'],
                ['empty', 'empty', 'empty'],
              ],
              sequence: [],
              thumbnail: '',
              createdAt: 123456,
            },
          ],
        },
      ],
    };

    const migrated = migrateGameState(oldData);

    expect(migrated.opponentDecks[0].boards[0]).toHaveProperty('boardSize', 3);
  });

  it('should handle empty decks', () => {
    const data = {
      playerDecks: [],
      opponentDecks: [],
    };

    const migrated = migrateGameState(data);

    expect(migrated).toEqual(data);
  });
});

describe('migrateBoards', () => {
  it('should add boardSize to array of boards', () => {
    const oldBoards = [
      {
        id: 'board-1',
        name: 'Board 1',
        grid: [
          ['piece', 'empty'],
          ['empty', 'empty'],
        ],
        sequence: [],
        thumbnail: '',
        createdAt: 123456,
      },
      {
        id: 'board-2',
        name: 'Board 2',
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [],
        thumbnail: '',
        createdAt: 123457,
      },
    ];

    const migrated = migrateBoards(oldBoards);

    expect(migrated[0]).toHaveProperty('boardSize', 2);
    expect(migrated[1]).toHaveProperty('boardSize', 3);
  });

  it('should handle invalid board without grid', () => {
    const oldBoards = [
      {
        id: 'board-1',
        name: 'Board 1',
        // Missing grid
        sequence: [],
        thumbnail: '',
        createdAt: 123456,
      },
    ];

    const migrated = migrateBoards(oldBoards);

    // Should default to 2 when grid is missing
    expect(migrated[0]).toHaveProperty('boardSize', 2);
  });

  it('should handle empty array', () => {
    const migrated = migrateBoards([]);

    expect(migrated).toEqual([]);
  });
});

describe('migrateDecks', () => {
  it('should add boardSize to boards in each deck', () => {
    const oldDecks = [
      {
        id: 'deck-1',
        name: 'Deck 1',
        boards: [
          {
            id: 'board-1',
            name: 'Board 1',
            grid: [
              ['piece', 'empty'],
              ['empty', 'empty'],
            ],
            sequence: [],
            thumbnail: '',
            createdAt: 123456,
          },
        ],
      },
      {
        id: 'deck-2',
        name: 'Deck 2',
        boards: [
          {
            id: 'board-2',
            name: 'Board 2',
            grid: [
              ['empty', 'empty', 'empty'],
              ['empty', 'piece', 'empty'],
              ['empty', 'empty', 'empty'],
            ],
            sequence: [],
            thumbnail: '',
            createdAt: 123457,
          },
        ],
      },
    ];

    const migrated = migrateDecks(oldDecks);

    expect(migrated[0].boards[0]).toHaveProperty('boardSize', 2);
    expect(migrated[1].boards[0]).toHaveProperty('boardSize', 3);
  });

  it('should handle decks with empty boards array', () => {
    const decks = [
      {
        id: 'deck-1',
        name: 'Deck 1',
        boards: [],
      },
    ];

    const migrated = migrateDecks(decks);

    expect(migrated[0].boards).toEqual([]);
  });

  it('should handle empty decks array', () => {
    const migrated = migrateDecks([]);

    expect(migrated).toEqual([]);
  });
});

// Additional comprehensive tests
describe('migrateUserProfile - Edge Cases', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should handle null input', () => {
    const result = migrateUserProfile(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = migrateUserProfile(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle non-object input (string)', () => {
    const result = migrateUserProfile('invalid');
    expect(result).toBe('invalid');
  });

  it('should handle non-object input (number)', () => {
    const result = migrateUserProfile(123);
    expect(result).toBe(123);
  });

  it('should handle boards field that is not an array', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: 'not-an-array',
    };

    const migrated = migrateUserProfile(data);
    expect(migrated).toEqual(data);
  });

  it('should handle mixed boards with and without boardSize', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          boardSize: 3,
          grid: [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [],
          thumbnail: '',
          createdAt: 123456,
        },
        {
          id: 'board-2',
          name: 'Board 2',
          grid: [
            ['empty', 'empty', 'empty'],
            ['empty', 'piece', 'empty'],
            ['empty', 'empty', 'empty'],
          ],
          sequence: [],
          thumbnail: '',
          createdAt: 123457,
        },
      ],
    };

    const migrated = migrateUserProfile(data);

    // First board should keep its existing boardSize (even if wrong)
    expect(migrated.boards[0].boardSize).toBe(3);
    // Second board should get migrated
    expect(migrated.boards[1].boardSize).toBe(3);
  });

  it('should handle boards with invalid grid (empty array)', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          grid: [],
          sequence: [],
          thumbnail: '',
          createdAt: 123456,
        },
      ],
    };

    const migrated = migrateUserProfile(data);
    // Empty grid should default to 2
    expect(migrated.boards[0].boardSize).toBe(2);
  });

  it('should handle boards with non-array grid', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          grid: null,
          sequence: [],
          thumbnail: '',
          createdAt: 123456,
        },
      ],
    };

    const migrated = migrateUserProfile(data);
    // null grid should default to 2
    expect(migrated.boards[0].boardSize).toBe(2);
  });

  it('should handle boards with invalid grid size (4x4)', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          grid: [
            ['empty', 'empty', 'empty', 'empty'],
            ['empty', 'empty', 'empty', 'empty'],
            ['empty', 'empty', 'empty', 'empty'],
            ['empty', 'empty', 'empty', 'empty'],
          ],
          sequence: [],
          thumbnail: '',
          createdAt: 123456,
        },
      ],
    };

    const migrated = migrateUserProfile(data);
    // Size 4 is now valid, so it should be preserved
    expect(migrated.boards[0].boardSize).toBe(4);
  });

  it('should handle non-object items in boards array', () => {
    const data = {
      id: 'user-123',
      name: 'Test User',
      boards: [
        null,
        'invalid',
        123,
      ],
    };

    const migrated = migrateUserProfile(data);
    expect(migrated.boards).toEqual([null, 'invalid', 123]);
  });
});

describe('migrateGameState - Edge Cases', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should handle null input', () => {
    const result = migrateGameState(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = migrateGameState(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle both playerDecks and opponentDecks with boards', () => {
    const data = {
      playerDecks: [
        {
          id: 'deck-1',
          name: 'Player Deck',
          boards: [
            {
              id: 'board-1',
              name: 'Board 1',
              grid: [['piece', 'empty'], ['empty', 'empty']],
              sequence: [],
              thumbnail: '',
              createdAt: 123456,
            },
          ],
        },
      ],
      opponentDecks: [
        {
          id: 'deck-2',
          name: 'Opponent Deck',
          boards: [
            {
              id: 'board-2',
              name: 'Board 2',
              grid: [
                ['empty', 'empty', 'empty'],
                ['empty', 'piece', 'empty'],
                ['empty', 'empty', 'empty'],
              ],
              sequence: [],
              thumbnail: '',
              createdAt: 123457,
            },
          ],
        },
      ],
    };

    const migrated = migrateGameState(data);

    expect(migrated.playerDecks[0].boards[0].boardSize).toBe(2);
    expect(migrated.opponentDecks[0].boards[0].boardSize).toBe(3);
  });

  it('should handle non-array playerDecks', () => {
    const data = {
      playerDecks: 'not-an-array',
      opponentDecks: [],
    };

    const migrated = migrateGameState(data);
    expect(migrated.playerDecks).toBe('not-an-array');
  });

  it('should handle non-array opponentDecks', () => {
    const data = {
      playerDecks: [],
      opponentDecks: null,
    };

    const migrated = migrateGameState(data);
    expect(migrated.opponentDecks).toBeNull();
  });

  it('should handle null/undefined decks in arrays', () => {
    const data = {
      playerDecks: [null, undefined],
      opponentDecks: ['invalid'],
    };

    const migrated = migrateGameState(data);
    expect(migrated.playerDecks).toEqual([null, undefined]);
    expect(migrated.opponentDecks).toEqual(['invalid']);
  });

  it('should handle decks with non-array boards', () => {
    const data = {
      playerDecks: [
        {
          id: 'deck-1',
          name: 'Deck 1',
          boards: null,
        },
      ],
      opponentDecks: [
        {
          id: 'deck-2',
          name: 'Deck 2',
          boards: 'invalid',
        },
      ],
    };

    const migrated = migrateGameState(data);
    expect(migrated.playerDecks[0].boards).toBeNull();
    expect(migrated.opponentDecks[0].boards).toBe('invalid');
  });

  it('should handle missing playerDecks field', () => {
    const data = {
      opponentDecks: [],
    };

    const migrated = migrateGameState(data);
    expect(migrated).toEqual(data);
  });

  it('should handle missing opponentDecks field', () => {
    const data = {
      playerDecks: [],
    };

    const migrated = migrateGameState(data);
    expect(migrated).toEqual(data);
  });

  it('should not mutate original data', () => {
    const data = {
      playerDecks: [
        {
          id: 'deck-1',
          name: 'Deck 1',
          boards: [
            {
              id: 'board-1',
              name: 'Board 1',
              grid: [['piece', 'empty'], ['empty', 'empty']],
              sequence: [],
              thumbnail: '',
              createdAt: 123456,
            },
          ],
        },
      ],
      opponentDecks: [],
    };

    const original = JSON.parse(JSON.stringify(data));
    migrateGameState(data);

    expect(data).toEqual(original);
  });
});

describe('migrateBoards - Edge Cases', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should handle null input', () => {
    const result = migrateBoards(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = migrateBoards(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle object input (not array)', () => {
    const input = { id: 'test' };
    const result = migrateBoards(input);
    expect(result).toEqual(input);
  });

  it('should handle string input', () => {
    const result = migrateBoards('invalid');
    expect(result).toBe('invalid');
  });

  it('should handle mixed boards (some with boardSize)', () => {
    const boards = [
      {
        id: 'board-1',
        name: 'Board 1',
        boardSize: 2,
        grid: [['piece', 'empty'], ['empty', 'empty']],
        sequence: [],
        thumbnail: '',
        createdAt: 123456,
      },
      {
        id: 'board-2',
        name: 'Board 2',
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [],
        thumbnail: '',
        createdAt: 123457,
      },
    ];

    const migrated = migrateBoards(boards);

    expect(migrated[0].boardSize).toBe(2);
    expect(migrated[1].boardSize).toBe(3);
  });

  it('should handle array with non-board objects', () => {
    const boards = [
      null,
      undefined,
      'invalid',
      123,
      { id: 'board-1' },
    ];

    const migrated = migrateBoards(boards);

    expect(migrated[0]).toBeNull();
    expect(migrated[1]).toBeUndefined();
    expect(migrated[2]).toBe('invalid');
    expect(migrated[3]).toBe(123);
    expect(migrated[4]).toHaveProperty('boardSize', 2);
  });

  it('should handle boards with 1x1 grid (invalid)', () => {
    const boards = [
      {
        id: 'board-1',
        name: 'Board 1',
        grid: [['piece']],
        sequence: [],
        thumbnail: '',
        createdAt: 123456,
      },
    ];

    const migrated = migrateBoards(boards);
    // 1x1 is invalid, should default to 2
    expect(migrated[0].boardSize).toBe(2);
  });

  it('should preserve existing valid boardSize', () => {
    const boards = [
      {
        id: 'board-1',
        name: 'Board 1',
        boardSize: 3,
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [],
        thumbnail: '',
        createdAt: 123456,
      },
    ];

    const migrated = migrateBoards(boards);
    expect(migrated[0].boardSize).toBe(3);
  });

  it('should handle boards with incorrect existing boardSize', () => {
    const boards = [
      {
        id: 'board-1',
        name: 'Board 1',
        boardSize: 2, // Wrong size for 3x3 grid
        grid: [
          ['empty', 'empty', 'empty'],
          ['empty', 'piece', 'empty'],
          ['empty', 'empty', 'empty'],
        ],
        sequence: [],
        thumbnail: '',
        createdAt: 123456,
      },
    ];

    const migrated = migrateBoards(boards);
    // Should preserve existing valid boardSize value (2 or 3)
    expect(migrated[0].boardSize).toBe(2);
  });
});

describe('migrateDecks - Edge Cases', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should handle null input', () => {
    const result = migrateDecks(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = migrateDecks(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle object input (not array)', () => {
    const input = { id: 'test' };
    const result = migrateDecks(input);
    expect(result).toEqual(input);
  });

  it('should handle string input', () => {
    const result = migrateDecks('invalid');
    expect(result).toBe('invalid');
  });

  it('should handle decks with multiple boards', () => {
    const decks = [
      {
        id: 'deck-1',
        name: 'Deck 1',
        boards: [
          {
            id: 'board-1',
            name: 'Board 1',
            grid: [['piece', 'empty'], ['empty', 'empty']],
            sequence: [],
            thumbnail: '',
            createdAt: 123456,
          },
          {
            id: 'board-2',
            name: 'Board 2',
            grid: [
              ['empty', 'empty', 'empty'],
              ['empty', 'piece', 'empty'],
              ['empty', 'empty', 'empty'],
            ],
            sequence: [],
            thumbnail: '',
            createdAt: 123457,
          },
          {
            id: 'board-3',
            name: 'Board 3',
            boardSize: 2,
            grid: [['empty', 'piece'], ['empty', 'empty']],
            sequence: [],
            thumbnail: '',
            createdAt: 123458,
          },
        ],
      },
    ];

    const migrated = migrateDecks(decks);

    expect(migrated[0].boards[0].boardSize).toBe(2);
    expect(migrated[0].boards[1].boardSize).toBe(3);
    expect(migrated[0].boards[2].boardSize).toBe(2);
  });

  it('should handle array with non-deck objects', () => {
    const decks = [
      null,
      undefined,
      'invalid',
      123,
      { id: 'deck-1', boards: [] },
    ];

    const migrated = migrateDecks(decks);

    expect(migrated[0]).toBeNull();
    expect(migrated[1]).toBeUndefined();
    expect(migrated[2]).toBe('invalid');
    expect(migrated[3]).toBe(123);
    expect(migrated[4].boards).toEqual([]);
  });

  it('should handle decks with non-array boards', () => {
    const decks = [
      {
        id: 'deck-1',
        name: 'Deck 1',
        boards: null,
      },
      {
        id: 'deck-2',
        name: 'Deck 2',
        boards: 'invalid',
      },
      {
        id: 'deck-3',
        name: 'Deck 3',
        boards: 123,
      },
    ];

    const migrated = migrateDecks(decks);

    expect(migrated[0].boards).toBeNull();
    expect(migrated[1].boards).toBe('invalid');
    expect(migrated[2].boards).toBe(123);
  });

  it('should handle decks without boards field', () => {
    const decks = [
      {
        id: 'deck-1',
        name: 'Deck 1',
      },
    ];

    const migrated = migrateDecks(decks);

    // The migration function will add boards: undefined to the object
    expect(migrated[0].boards).toBeUndefined();
  });

  it('should not mutate original data', () => {
    const decks = [
      {
        id: 'deck-1',
        name: 'Deck 1',
        boards: [
          {
            id: 'board-1',
            name: 'Board 1',
            grid: [['piece', 'empty'], ['empty', 'empty']],
            sequence: [],
            thumbnail: '',
            createdAt: 123456,
          },
        ],
      },
    ];

    const original = JSON.parse(JSON.stringify(decks));
    migrateDecks(decks);

    expect(decks).toEqual(original);
  });
});

describe('Integration Tests', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should handle complete user profile with nested structures', () => {
    const complexProfile = {
      id: 'user-123',
      name: 'Test User',
      stats: {
        totalGames: 10,
        wins: 5,
        losses: 3,
        ties: 2,
      },
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          grid: [['piece', 'empty'], ['empty', 'empty']],
          sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: 123456,
        },
        {
          id: 'board-2',
          name: 'Board 2',
          boardSize: 3,
          grid: [
            ['empty', 'empty', 'empty'],
            ['empty', 'piece', 'empty'],
            ['empty', 'empty', 'empty'],
          ],
          sequence: [{ position: { row: 1, col: 1 }, type: 'piece', order: 1 }],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: 123457,
        },
      ],
      createdAt: 123450,
    };

    const migrated = migrateUserProfile(complexProfile);

    expect(migrated.id).toBe('user-123');
    expect(migrated.stats).toEqual(complexProfile.stats);
    expect(migrated.boards[0]?.boardSize).toBe(2);
    expect(migrated.boards[1]?.boardSize).toBe(3);
    expect(migrated.boards[0]?.sequence).toEqual(complexProfile.boards[0]?.sequence);
  });

  it('should handle complete game state with all fields', () => {
    const complexGameState = {
      phase: { type: 'board-selection', round: 1 },
      user: {
        id: 'user-123',
        name: 'Player',
      },
      opponent: {
        id: 'opp-123',
        name: 'CPU',
      },
      playerDecks: [
        {
          id: 'deck-1',
          name: 'My Deck',
          boards: [
            {
              id: 'board-1',
              name: 'Board 1',
              grid: [['piece', 'empty'], ['empty', 'empty']],
              sequence: [],
              thumbnail: '',
              createdAt: 123456,
            },
          ],
        },
      ],
      opponentDecks: [
        {
          id: 'deck-2',
          name: 'CPU Deck',
          boards: [
            {
              id: 'board-2',
              name: 'Board 2',
              grid: [
                ['empty', 'empty', 'empty'],
                ['empty', 'piece', 'empty'],
                ['empty', 'empty', 'empty'],
              ],
              sequence: [],
              thumbnail: '',
              createdAt: 123457,
            },
          ],
        },
      ],
      currentRound: 1,
      playerScore: 0,
      opponentScore: 0,
    };

    const migrated = migrateGameState(complexGameState);

    expect(migrated.phase).toEqual(complexGameState.phase);
    expect(migrated.user).toEqual(complexGameState.user);
    expect(migrated.playerDecks[0].boards[0].boardSize).toBe(2);
    expect(migrated.opponentDecks[0].boards[0].boardSize).toBe(3);
    expect(migrated.currentRound).toBe(1);
  });
});
