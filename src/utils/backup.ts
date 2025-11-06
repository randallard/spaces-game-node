/**
 * Backup and restore utilities for localStorage data
 * @module utils/backup
 */

import { UserProfileSchema, BoardSchema, OpponentSchema } from '@/schemas';
import type { UserProfile, Board, Opponent } from '@/types';
import { z } from 'zod';

/**
 * Backup data structure
 */
export interface BackupData {
  version: string;
  timestamp: number;
  user: UserProfile | null;
  boards: Board[];
  opponents: Opponent[];
}

/**
 * Backup data schema for validation
 */
const BackupDataSchema = z.object({
  version: z.string(),
  timestamp: z.number(),
  user: UserProfileSchema.nullable(),
  boards: z.array(BoardSchema),
  opponents: z.array(OpponentSchema),
});

/**
 * Export localStorage data as JSON backup
 */
export function exportBackup(): BackupData {
  const userJson = localStorage.getItem('spaces-game-user');
  const boardsJson = localStorage.getItem('spaces-game-boards');
  const opponentsJson = localStorage.getItem('spaces-game-opponents');

  const user = userJson ? JSON.parse(userJson) : null;
  const boards = boardsJson ? JSON.parse(boardsJson) : [];
  const opponents = opponentsJson ? JSON.parse(opponentsJson) : [];

  return {
    version: '1.0.0',
    timestamp: Date.now(),
    user,
    boards,
    opponents,
  };
}

/**
 * Download backup data as JSON file
 */
export function downloadBackup(): void {
  const backup = exportBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date(backup.timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `spaces-game-backup-${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Validate and parse backup data
 */
export function validateBackup(data: unknown): BackupData | null {
  try {
    return BackupDataSchema.parse(data);
  } catch (error) {
    console.error('Invalid backup data:', error);
    return null;
  }
}

/**
 * Import backup data and restore to localStorage
 * @returns true if successful, false if validation failed
 */
export function importBackup(data: unknown): boolean {
  console.log('[BACKUP] Starting import...');
  const backup = validateBackup(data);
  if (!backup) {
    console.error('[BACKUP] Validation failed');
    return false;
  }

  console.log('[BACKUP] Backup validated:', {
    userName: backup.user?.name,
    boardCount: backup.boards.length,
    opponentCount: backup.opponents.length,
  });

  try {
    // Validate each piece of data before importing
    if (backup.user) {
      const validUser = UserProfileSchema.parse(backup.user);
      console.log('[BACKUP] Saving user to localStorage:', validUser.name);
      localStorage.setItem('spaces-game-user', JSON.stringify(validUser));
      console.log('[BACKUP] Verify saved:', JSON.parse(localStorage.getItem('spaces-game-user')!).name);
    } else {
      console.log('[BACKUP] Removing user from localStorage');
      localStorage.removeItem('spaces-game-user');
    }

    const validBoards = z.array(BoardSchema).parse(backup.boards);
    localStorage.setItem('spaces-game-boards', JSON.stringify(validBoards));

    const validOpponents = z.array(OpponentSchema).parse(backup.opponents);
    localStorage.setItem('spaces-game-opponents', JSON.stringify(validOpponents));

    console.log('[BACKUP] Import complete, ready to reload');
    return true;
  } catch (error) {
    console.error('[BACKUP] Failed to import backup:', error);
    return false;
  }
}

/**
 * Load backup from file
 */
export async function loadBackupFromFile(file: File): Promise<BackupData | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return validateBackup(data);
  } catch (error) {
    console.error('Failed to read backup file:', error);
    return null;
  }
}
