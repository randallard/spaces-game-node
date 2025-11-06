/**
 * ProfileModal component for viewing/editing user profile
 * @module components/ProfileModal
 */

import { useState, useCallback, useRef, type ReactElement } from 'react';
import type { UserProfile } from '@/types';
import { downloadBackup, loadBackupFromFile, importBackup } from '@/utils/backup';
import styles from './ProfileModal.module.css';

export interface ProfileModalProps {
  /** Current user profile */
  user: UserProfile;
  /** Callback when profile is updated */
  onUpdate: (user: UserProfile) => void;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * Profile modal for editing user information.
 *
 * Features:
 * - View user stats (games, wins, losses, ties)
 * - Edit name
 * - Cancel to close without saving
 * - Validation for name changes
 *
 * @component
 */
export function ProfileModal({
  user,
  onUpdate,
  onClose,
}: ProfileModalProps): ReactElement {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateName = useCallback((value: string): string | null => {
    if (value === '') {
      return 'Name is required';
    }

    if (value.length > 20) {
      return 'Name must be 20 characters or less';
    }

    const validCharPattern = /^[a-zA-Z0-9\s_-]+$/;
    if (!validCharPattern.test(value)) {
      return 'Only letters, numbers, spaces, dash (-), and underscore (_) allowed';
    }

    if (value !== value.trim()) {
      return 'Name cannot start or end with spaces';
    }

    return null;
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = e.target.value;
      setName(newValue);
      setIsDirty(true);

      const validationError = validateName(newValue);
      setError(validationError);
    },
    [validateName]
  );

  const handleSave = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      const validationError = validateName(name);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Update user with new name
      onUpdate({
        ...user,
        name: name.trim(),
      });

      onClose();
    },
    [name, user, validateName, onUpdate, onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDownloadBackup = useCallback((): void => {
    try {
      downloadBackup();
      setBackupMessage('Backup downloaded successfully!');
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (error) {
      setBackupMessage('Failed to download backup');
      setTimeout(() => setBackupMessage(null), 3000);
    }
  }, []);

  const handleImportClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        console.log('[MODAL] Loading backup from file...');
        const backup = await loadBackupFromFile(file);
        if (!backup) {
          console.error('[MODAL] Invalid backup file');
          setBackupMessage('Invalid backup file');
          setTimeout(() => setBackupMessage(null), 3000);
          return;
        }

        console.log('[MODAL] Backup loaded, showing confirmation...');
        const confirmed = window.confirm(
          'This will replace all your current data (profile, boards, opponents). Continue?'
        );

        if (confirmed) {
          console.log('[MODAL] User confirmed, importing backup...');
          const success = importBackup(backup);
          if (success) {
            console.log('[MODAL] Import successful, reloading...');
            // Reload immediately to prevent React state from overwriting restored data
            window.location.reload();
          } else {
            console.error('[MODAL] Import failed');
            setBackupMessage('Failed to restore backup');
            setTimeout(() => setBackupMessage(null), 3000);
          }
        } else {
          console.log('[MODAL] User cancelled restore');
        }
      } catch (error) {
        console.error('[MODAL] Error during restore:', error);
        setBackupMessage('Error reading backup file');
        setTimeout(() => setBackupMessage(null), 3000);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    []
  );

  const isValid = validateName(name) === null;
  const hasChanges = name.trim() !== user.name;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Profile</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          {/* Name Input */}
          <div className={styles.field}>
            <label htmlFor="profile-name" className={styles.label}>
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              className={`${styles.input} ${
                isDirty && isValid ? styles.valid : ''
              } ${error ? styles.invalid : ''}`}
              placeholder="Enter your name"
              maxLength={20}
              autoComplete="off"
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          {/* Stats Display */}
          <div className={styles.stats}>
            <h3 className={styles.statsTitle}>Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Games</span>
                <span className={styles.statValue}>{user.stats.totalGames}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Wins</span>
                <span className={styles.statValue}>{user.stats.wins}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Losses</span>
                <span className={styles.statValue}>{user.stats.losses}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Ties</span>
                <span className={styles.statValue}>{user.stats.ties}</span>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className={styles.backup}>
            <h3 className={styles.backupTitle}>Data Backup</h3>
            <p className={styles.backupDescription}>
              Download your data as JSON or restore from a backup file
            </p>
            <div className={styles.backupActions}>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className={styles.backupButton}
              >
                📥 Download Backup
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                className={styles.backupButton}
              >
                📤 Restore Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Upload backup file"
              />
            </div>
            {backupMessage && (
              <div className={styles.backupMessage}>{backupMessage}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!isValid || !hasChanges}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
