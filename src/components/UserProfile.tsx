/**
 * UserProfile component for user setup phase
 * @module components/UserProfile
 */

import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile } from '@/types';
import styles from './UserProfile.module.css';

export interface UserProfileProps {
  /** Callback when user profile is created/updated */
  onUserCreated: (user: UserProfile) => void;
  /** Existing user profile to edit (optional) */
  existingUser?: UserProfile | null;
}

/**
 * User profile creation/editing component.
 *
 * Features:
 * - Name input with validation (1-20 chars)
 * - Auto-generates UUID on creation
 * - Preserves existing user stats when editing
 * - Real-time validation feedback
 *
 * @component
 * @example
 * ```tsx
 * <UserProfile
 *   onUserCreated={(user) => console.log('User created:', user)}
 * />
 * ```
 */
export function UserProfile({
  onUserCreated,
  existingUser = null,
}: UserProfileProps): ReactElement {
  const [name, setName] = useState(existingUser?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load existing user name on mount
  useEffect(() => {
    if (existingUser) {
      setName(existingUser.name);
    }
  }, [existingUser]);

  /**
   * Validate name
   */
  const validateName = useCallback((value: string): string | null => {
    if (value === '') {
      return 'Name is required';
    }

    if (value.length > 20) {
      return 'Name must be 20 characters or less';
    }

    // Character validation (alphanumeric + dash + underscore + spaces)
    const validCharPattern = /^[a-zA-Z0-9\s_-]+$/;
    if (!validCharPattern.test(value)) {
      return 'Only letters, numbers, spaces, dash (-), and underscore (_) allowed';
    }

    // No leading/trailing spaces
    if (value !== value.trim()) {
      return 'Name cannot start or end with spaces';
    }

    return null;
  }, []);

  /**
   * Handle name input change
   */
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

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      const validationError = validateName(name);
      if (validationError) {
        setError(validationError);
        setIsDirty(true);
        return;
      }

      // Create or update user profile
      const user: UserProfile = existingUser
        ? {
            ...existingUser,
            name: name.trim(),
          }
        : {
            id: uuidv4(),
            name: name.trim(),
            createdAt: Date.now(),
            stats: {
              totalGames: 0,
              wins: 0,
              losses: 0,
              ties: 0,
            },
          };

      onUserCreated(user);
    },
    [name, existingUser, validateName, onUserCreated]
  );

  const isValid = validateName(name) === null;
  const inputClasses = [
    styles.input,
    isDirty && isValid && styles.valid,
    isDirty && error && styles.invalid,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {existingUser ? 'Edit Profile' : 'Create Your Profile'}
      </h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="user-name" className={styles.label}>
            Your Name
          </label>

          <div className={styles.inputWrapper}>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              className={inputClasses}
              placeholder="Enter your name"
              aria-label="Your name"
              aria-invalid={isDirty && error !== null}
              aria-describedby={error ? 'name-error' : undefined}
              maxLength={20}
              autoFocus
            />

            {/* Success indicator */}
            {isDirty && isValid && (
              <span className={styles.successIcon} aria-hidden="true">
                ✓
              </span>
            )}

            {/* Error indicator */}
            {isDirty && error && (
              <span className={styles.errorIcon} aria-hidden="true">
                ✗
              </span>
            )}
          </div>

          {/* Error message */}
          {isDirty && error && (
            <div
              id="name-error"
              className={styles.errorMessage}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {/* Helper text */}
          {!isDirty && (
            <div className={styles.helperText}>
              1-20 characters: letters, numbers, spaces, dash, underscore
            </div>
          )}
        </div>

        {/* Stats display (if editing) */}
        {existingUser && (
          <div className={styles.stats}>
            <h3 className={styles.statsTitle}>Your Stats</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Games Played</span>
                <span className={styles.statValue}>
                  {existingUser.stats.totalGames}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Wins</span>
                <span className={styles.statValue}>{existingUser.stats.wins}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Losses</span>
                <span className={styles.statValue}>{existingUser.stats.losses}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Ties</span>
                <span className={styles.statValue}>{existingUser.stats.ties}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isValid}
        >
          {existingUser ? 'Save Changes' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
