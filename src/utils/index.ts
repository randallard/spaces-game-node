/**
 * Central export for all utility functions
 */

// Board validation
export {
  validateBoard,
  isValidBoard,
  hasExactlyOnePiece,
  hasTooManyTraps,
  hasValidSequenceCount,
  hasConsecutiveSequence,
  type ValidationError,
  type ValidationResult,
} from './board-validation';

// LocalStorage
export {
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage,
  clearAllLocalStorage,
  isLocalStorageAvailable,
  STORAGE_KEYS,
} from './local-storage';

// Opponent helpers
export {
  generateOpponentId,
  createCpuOpponent,
  createHumanOpponent,
  isCpuOpponent,
  selectRandomBoard,
  updateOpponentStats,
  calculateWinRate,
  formatOpponentStats,
} from './opponent-helpers';

// SVG thumbnails
export {
  generateBoardThumbnail,
  generateOpponentThumbnail,
  generateBlankThumbnail,
  getCellContentColor,
} from './svg-thumbnail';

// URL compression
export {
  compressGameState,
  decompressGameState,
  compressPayload,
  decompressPayload,
  getGameStateFromHash,
  setGameStateToHash,
  clearHash,
  getCompressionRatio,
} from './url-compression';

// Game simulation
export {
  simulateRound,
  isBoardPlayable,
} from './game-simulation';

// Backup & Restore
export {
  exportBackup,
  downloadBackup,
  validateBackup,
  importBackup,
  loadBackupFromFile,
  type BackupData,
} from './backup';

// App helpers
export {
  getOpponentIcon,
  createEmptyUser,
  createInitialState,
} from './app-helpers';

// CPU data generation
export {
  generateCpuBoardsForSize,
  generateCpuDeckForSize,
  createDefaultCpuOpponent,
  createCpuTougherOpponent,
  initializeDefaultCpuData,
  initializeCpuTougherData,
} from './default-cpu-data';
