/**
 * Tests for backup and restore utilities
 * @module utils/backup.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportBackup,
  downloadBackup,
  validateBackup,
  importBackup,
  loadBackupFromFile,
  type BackupData,
} from './backup';
import type { UserProfile, Board, Opponent } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

const mockUser: UserProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'TestUser',
  createdAt: 1234567890,
  stats: {
    totalGames: 5,
    wins: 3,
    losses: 1,
    ties: 1,
  },
};

const mockBoard: Board = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test Board',
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['piece', 'empty'],
  ],
  sequence: [
    { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
    { position: { row: -1, col: 0 }, type: 'final', order: 3 },
  ],
  thumbnail: 'data:image/svg+xml;base64,test',
  createdAt: 1234567890,
};

const mockOpponent: Opponent = {
  type: 'cpu',
  id: 'cpu-opponent-id',
  name: 'CPU',
  wins: 2,
  losses: 3,
};

describe('backup', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportBackup', () => {
    it('should export all localStorage data', () => {
      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));
      localStorage.setItem('spaces-game-boards', JSON.stringify([mockBoard]));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([mockOpponent]));

      const backup = exportBackup();

      expect(backup.version).toBe('1.0.0');
      expect(backup.timestamp).toBeDefined();
      expect(backup.user).toEqual(mockUser);
      expect(backup.boards).toEqual([mockBoard]);
      expect(backup.opponents).toEqual([mockOpponent]);
    });

    it('should handle missing user data', () => {
      localStorage.setItem('spaces-game-boards', JSON.stringify([]));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([]));

      const backup = exportBackup();

      expect(backup.user).toBeNull();
      expect(backup.boards).toEqual([]);
      expect(backup.opponents).toEqual([]);
    });

    it('should handle empty localStorage', () => {
      const backup = exportBackup();

      expect(backup.user).toBeNull();
      expect(backup.boards).toEqual([]);
      expect(backup.opponents).toEqual([]);
    });

    it('should include timestamp and version', () => {
      const backup = exportBackup();

      expect(backup.version).toBe('1.0.0');
      expect(backup.timestamp).toBeGreaterThan(0);
      expect(typeof backup.timestamp).toBe('number');
    });
  });

  describe('downloadBackup', () => {
    it('should create download link with correct attributes', () => {
      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));
      localStorage.setItem('spaces-game-boards', JSON.stringify([mockBoard]));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([mockOpponent]));

      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      downloadBackup();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toMatch(/^spaces-game-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should create and cleanup blob URL', () => {
      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));
      localStorage.setItem('spaces-game-boards', JSON.stringify([]));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([]));

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      downloadBackup();

      // Should create and revoke blob URL
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('validateBackup', () => {
    it('should validate correct backup data', () => {
      const validBackup: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: mockUser,
        boards: [mockBoard],
        opponents: [mockOpponent],
      };

      const result = validateBackup(validBackup);

      expect(result).toEqual(validBackup);
    });

    it('should accept null user', () => {
      const validBackup: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: null,
        boards: [],
        opponents: [],
      };

      const result = validateBackup(validBackup);

      expect(result).toEqual(validBackup);
    });

    it('should reject backup missing version', () => {
      const invalidBackup = {
        timestamp: Date.now(),
        user: mockUser,
        boards: [],
        opponents: [],
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = validateBackup(invalidBackup);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should reject backup missing timestamp', () => {
      const invalidBackup = {
        version: '1.0.0',
        user: mockUser,
        boards: [],
        opponents: [],
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = validateBackup(invalidBackup);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should reject backup with invalid user schema', () => {
      const invalidBackup = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: { id: 'test', name: 123 }, // name should be string
        boards: [],
        opponents: [],
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = validateBackup(invalidBackup);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should reject backup with invalid board schema', () => {
      const invalidBackup = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: null,
        boards: [{ id: 'test', name: 'Test' }], // Missing required fields
        opponents: [],
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = validateBackup(invalidBackup);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should reject backup with invalid opponent schema', () => {
      const invalidBackup = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: null,
        boards: [],
        opponents: [{ id: 'test' }], // Missing required fields
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = validateBackup(invalidBackup);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should reject non-object input', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(validateBackup('string')).toBeNull();
      expect(validateBackup(123)).toBeNull();
      expect(validateBackup(null)).toBeNull();
      expect(validateBackup(undefined)).toBeNull();
      expect(validateBackup([])).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('importBackup', () => {
    it('should import valid backup to localStorage', () => {
      const validBackup: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: mockUser,
        boards: [mockBoard],
        opponents: [mockOpponent],
      };

      const result = importBackup(validBackup);

      expect(result).toBe(true);
      expect(JSON.parse(localStorage.getItem('spaces-game-user')!)).toEqual(mockUser);
      expect(JSON.parse(localStorage.getItem('spaces-game-boards')!)).toEqual([mockBoard]);
      expect(JSON.parse(localStorage.getItem('spaces-game-opponents')!)).toEqual([mockOpponent]);
    });

    it('should remove user from localStorage when backup has null user', () => {
      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));

      const validBackup: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: null,
        boards: [],
        opponents: [],
      };

      const result = importBackup(validBackup);

      expect(result).toBe(true);
      expect(localStorage.getItem('spaces-game-user')).toBeNull();
    });

    it('should reject invalid backup', () => {
      const invalidBackup = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: { invalid: 'data' },
        boards: [],
        opponents: [],
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = importBackup(invalidBackup);

      expect(result).toBe(false);
      expect(localStorage.getItem('spaces-game-user')).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should not partially import on validation failure', () => {
      const invalidBackup = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: mockUser,
        boards: [{ invalid: 'board' }],
        opponents: [],
      };

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = importBackup(invalidBackup);

      expect(result).toBe(false);
      // Should not have imported user since boards failed
      expect(localStorage.getItem('spaces-game-user')).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty arrays', () => {
      const validBackup: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: mockUser,
        boards: [],
        opponents: [],
      };

      const result = importBackup(validBackup);

      expect(result).toBe(true);
      expect(localStorage.getItem('spaces-game-boards')).toBe('[]');
      expect(localStorage.getItem('spaces-game-opponents')).toBe('[]');
    });
  });

  describe('loadBackupFromFile', () => {
    it('should load valid backup from file', async () => {
      const validBackup: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        user: mockUser,
        boards: [],
        opponents: [],
      };

      const file = new File([JSON.stringify(validBackup)], 'backup.json', {
        type: 'application/json',
      });

      const result = await loadBackupFromFile(file);

      expect(result).toEqual(validBackup);
    });

    it('should return null for invalid JSON', async () => {
      const file = new File(['{ invalid json }'], 'backup.json', {
        type: 'application/json',
      });

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await loadBackupFromFile(file);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should return null for invalid backup schema', async () => {
      const invalidBackup = {
        version: '1.0.0',
        // Missing timestamp
        user: null,
        boards: [],
        opponents: [],
      };

      const file = new File([JSON.stringify(invalidBackup)], 'backup.json', {
        type: 'application/json',
      });

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await loadBackupFromFile(file);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty file', async () => {
      const file = new File([''], 'backup.json', {
        type: 'application/json',
      });

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await loadBackupFromFile(file);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle file read errors', async () => {
      const file = new File(['test'], 'backup.json', {
        type: 'application/json',
      });

      // Mock file.text() to throw error
      vi.spyOn(file, 'text').mockRejectedValue(new Error('Read error'));

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await loadBackupFromFile(file);

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration: Full backup and restore flow', () => {
    it('should successfully backup and restore all data', async () => {
      // Setup initial data
      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));
      localStorage.setItem('spaces-game-boards', JSON.stringify([mockBoard]));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([mockOpponent]));

      // Export backup
      const backup = exportBackup();

      // Clear localStorage
      localStorageMock.clear();
      expect(localStorage.getItem('spaces-game-user')).toBeNull();

      // Import backup
      const success = importBackup(backup);
      expect(success).toBe(true);

      // Verify data restored
      expect(JSON.parse(localStorage.getItem('spaces-game-user')!)).toEqual(mockUser);
      expect(JSON.parse(localStorage.getItem('spaces-game-boards')!)).toEqual([mockBoard]);
      expect(JSON.parse(localStorage.getItem('spaces-game-opponents')!)).toEqual([mockOpponent]);
    });

    it('should handle file-based backup and restore', async () => {
      // Setup initial data
      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));
      localStorage.setItem('spaces-game-boards', JSON.stringify([mockBoard]));

      // Export to file-like object
      const backup = exportBackup();
      const file = new File([JSON.stringify(backup)], 'backup.json', {
        type: 'application/json',
      });

      // Clear localStorage
      localStorageMock.clear();

      // Load from file
      const loadedBackup = await loadBackupFromFile(file);
      expect(loadedBackup).not.toBeNull();

      // Import
      const success = importBackup(loadedBackup!);
      expect(success).toBe(true);

      // Verify
      expect(JSON.parse(localStorage.getItem('spaces-game-user')!)).toEqual(mockUser);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large backup data', () => {
      const largeBoards = Array.from({ length: 100 }, (_, i) => ({
        ...mockBoard,
        id: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`,
        name: `Board ${i}`,
      }));

      localStorage.setItem('spaces-game-user', JSON.stringify(mockUser));
      localStorage.setItem('spaces-game-boards', JSON.stringify(largeBoards));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([]));

      const backup = exportBackup();

      expect(backup.boards).toHaveLength(100);
      expect(validateBackup(backup)).not.toBeNull();
    });

    it('should handle special characters in data', () => {
      const userWithSpecialChars: UserProfile = {
        ...mockUser,
        name: 'Test™️ User 日本語 <>&"\'',
      };

      localStorage.setItem('spaces-game-user', JSON.stringify(userWithSpecialChars));
      localStorage.setItem('spaces-game-boards', JSON.stringify([]));
      localStorage.setItem('spaces-game-opponents', JSON.stringify([]));

      const backup = exportBackup();
      const result = importBackup(backup);

      expect(result).toBe(true);
      const restored = JSON.parse(localStorage.getItem('spaces-game-user')!);
      expect(restored.name).toBe('Test™️ User 日本語 <>&"\'');
    });

    it('should throw on corrupted localStorage data', () => {
      localStorage.setItem('spaces-game-user', '{ corrupted json }');
      localStorage.setItem('spaces-game-boards', JSON.stringify([mockBoard]));

      // exportBackup will throw when JSON.parse fails on corrupted data
      expect(() => exportBackup()).toThrow();
    });
  });
});
