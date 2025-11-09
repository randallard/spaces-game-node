/**
 * TutorialNameEntry - Name entry step in tutorial wizard
 * @module components/TutorialNameEntry
 */

import { useState, useCallback, type ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile, CreatureId, Board } from '@/types';
import styles from './TutorialNameEntry.module.css';

export interface TutorialNameEntryProps {
  /** Player's selected creature */
  playerCreature: CreatureId;
  /** Opponent's creature (CPU Sam) */
  opponentCreature: CreatureId;
  /** Player's first board from tutorial */
  firstBoard: Board;
  /** Whether the player won the tutorial round */
  playerWon: boolean;
  /** CPU Sam's name (customizable by player) */
  cpuSamName: string;
  /** Callback when player enters name and clicks Continue */
  onContinue: (user: UserProfile) => void;
}

/**
 * Tutorial name entry component
 * Shows congratulations text and name input
 */
export function TutorialNameEntry({
  playerCreature,
  opponentCreature,
  firstBoard: _firstBoard,
  playerWon,
  cpuSamName,
  onContinue,
}: TutorialNameEntryProps): ReactElement {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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

    const validCharPattern = /^[a-zA-Z0-9\s_-]+$/;
    if (!validCharPattern.test(value)) {
      return 'Only letters, numbers, spaces, dash (-), and underscore (_) allowed';
    }

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

      // Create user profile
      const user: UserProfile = {
        id: uuidv4(),
        name: name.trim(),
        createdAt: Date.now(),
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        preferences: {
          explanationStyle: 'lively',
        },
        playerCreature,
        opponentCreature,
      };

      onContinue(user);
    },
    [name, validateName, onContinue, playerCreature, opponentCreature]
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
      <div className={styles.content}>
        {/* Congratulations Text */}
        <div className={styles.congratsSection}>
          {playerWon ? (
            <>
              <h2 className={styles.title}>Well Played!</h2>
              <p className={styles.text}>
                Go against the tougher CPU or keep showing {cpuSamName} what you're made of!
              </p>
            </>
          ) : (
            <p className={styles.text}>
              Keep showing {cpuSamName} what you're made of and when you're ready give the tougher CPU a try!
            </p>
          )}
          <p className={styles.text}>
            Oh hang on! What should I call you?
          </p>
        </div>

        {/* Name Input Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="player-name" className={styles.label}>
              Your Name
            </label>

            <div className={styles.inputWrapper}>
              <input
                id="player-name"
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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!isValid}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
