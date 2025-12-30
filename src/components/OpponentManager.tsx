/**
 * OpponentManager component for opponent selection
 * @module components/OpponentManager
 */

import { useState, useCallback, type ReactElement } from 'react';
import { createCpuOpponent, createHumanOpponent, createRemoteCpuOpponent } from '@/utils/opponent-helpers';
import type { Opponent } from '@/types';
import { DiscordConnectionModal } from './DiscordConnectionModal';
import styles from './OpponentManager.module.css';

export interface OpponentManagerProps {
  /** Callback when opponent is selected */
  onOpponentSelected: (opponent: Opponent) => void;
  /** User's name (for display purposes) */
  userName: string;
}

/**
 * Opponent selection component.
 *
 * Features:
 * - CPU opponent selection (always available)
 * - Human opponent selection (future: enter opponent name)
 * - Visual cards for each option
 * - Keyboard accessible
 *
 * @component
 * @example
 * ```tsx
 * <OpponentManager
 *   userName="Alice"
 *   onOpponentSelected={(opponent) => console.log('Selected:', opponent)}
 * />
 * ```
 */
export function OpponentManager({
  onOpponentSelected,
  userName,
}: OpponentManagerProps): ReactElement {
  const [selectedType, setSelectedType] = useState<'cpu' | 'human' | 'remote-cpu' | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);

  /**
   * Handle CPU opponent selection
   */
  const handleSelectCpu = useCallback((): void => {
    const cpuOpponent = createCpuOpponent();
    onOpponentSelected(cpuOpponent);
  }, [onOpponentSelected]);

  /**
   * Handle human opponent selection
   */
  const handleSelectHuman = useCallback((): void => {
    setSelectedType('human');
  }, []);

  /**
   * Handle remote CPU opponent selection
   */
  const handleSelectRemoteCpu = useCallback((): void => {
    setSelectedType('remote-cpu');
    setOpponentName('CPU Remote'); // Default name
  }, []);

  /**
   * Handle Discord connection
   */
  const handleConnectDiscord = useCallback((): void => {
    // Redirect to Discord OAuth
    const apiUrl = import.meta.env.DEV
      ? 'http://localhost:3001'
      : window.location.origin;
    window.location.href = `${apiUrl}/api/auth/discord/authorize`;
  }, []);

  /**
   * Handle human opponent name submission
   */
  const handleHumanNameSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      if (!opponentName.trim()) {
        return;
      }

      const humanOpponent = createHumanOpponent(opponentName.trim());

      onOpponentSelected(humanOpponent);
    },
    [opponentName, onOpponentSelected]
  );

  /**
   * Handle remote CPU opponent name submission
   */
  const handleRemoteCpuNameSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      if (!opponentName.trim()) {
        return;
      }

      const remoteCpuOpponent = createRemoteCpuOpponent(opponentName.trim());

      onOpponentSelected(remoteCpuOpponent);
    },
    [opponentName, onOpponentSelected]
  );

  // If human opponent type selected, show name input
  if (selectedType === 'human') {
    return (
      <>
        <div className={styles.container}>
          <h2 className={styles.title}>Enter Opponent's Name</h2>

          <form onSubmit={handleHumanNameSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="opponent-name" className={styles.label}>
                Opponent Name
              </label>
              <input
                id="opponent-name"
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className={styles.input}
                placeholder="Enter opponent's name"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className={styles.discordOption}>
              <p className={styles.discordHint}>
                💡 Want notifications when they play their turn?
              </p>
              <button
                type="button"
                onClick={() => setShowDiscordModal(true)}
                className={styles.discordLink}
              >
                Connect Discord (optional)
              </button>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className={styles.backButton}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={!opponentName.trim()}
              >
                Continue
              </button>
            </div>
          </form>
        </div>

        <DiscordConnectionModal
          isOpen={showDiscordModal}
          onClose={() => setShowDiscordModal(false)}
          onConnect={handleConnectDiscord}
        />
      </>
    );
  }

  // If remote CPU opponent type selected, show name input
  if (selectedType === 'remote-cpu') {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Remote CPU Opponent</h2>
        <p className={styles.subtitle}>
          This opponent will use boards from a remote server
        </p>

        <form onSubmit={handleRemoteCpuNameSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="remote-cpu-name" className={styles.label}>
              Opponent Name
            </label>
            <input
              id="remote-cpu-name"
              type="text"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className={styles.input}
              placeholder="CPU Remote"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className={styles.backButton}
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!opponentName.trim()}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Default: show opponent type selection
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Choose Your Opponent</h2>
      <p className={styles.subtitle}>
        Welcome, <strong>{userName}</strong>! Who would you like to play against?
      </p>

      <div className={styles.optionsGrid}>
        {/* CPU Opponent Card */}
        <button
          onClick={handleSelectCpu}
          className={styles.optionCard}
          aria-label="Play against CPU"
        >
          <div className={styles.optionIcon}>🤖</div>
          <h3 className={styles.optionTitle}>CPU Opponent</h3>
          <p className={styles.optionDescription}>
            Play against the computer. Perfect for practice and solo play.
          </p>
          <span className={styles.optionBadge}>Quick Start</span>
        </button>

        {/* Remote CPU Opponent Card */}
        <button
          onClick={handleSelectRemoteCpu}
          className={styles.optionCard}
          aria-label="Play against remote CPU"
        >
          <div className={styles.optionIcon}>🌐</div>
          <h3 className={styles.optionTitle}>Remote CPU</h3>
          <p className={styles.optionDescription}>
            Play against a CPU with boards from a remote server. New challenges every time.
          </p>
          <span className={styles.optionBadge}>Online</span>
        </button>

        {/* Human Opponent Card */}
        <button
          onClick={handleSelectHuman}
          className={styles.optionCard}
          aria-label="Play against human opponent"
        >
          <div className={styles.optionIcon}>👤</div>
          <h3 className={styles.optionTitle}>Human Opponent</h3>
          <p className={styles.optionDescription}>
            Play against another person. Enter their name to get started.
          </p>
          <span className={styles.optionBadge}>Multiplayer</span>
        </button>
      </div>
    </div>
  );
}
