/**
 * OpponentManager component for opponent selection
 * @module components/OpponentManager
 */

import { useState, useCallback, useEffect, type ReactElement } from 'react';
import { createCpuOpponent, createHumanOpponent, createRemoteCpuOpponent, createAiAgentOpponent } from '@/utils/opponent-helpers';
import type { Opponent, AiAgentSkillLevel } from '@/types';
import { DiscordConnectionModal } from './DiscordConnectionModal';
import { getApiEndpoint } from '@/config/api';
import { FEATURES } from '@/config/features';
import { AI_AGENT_SKILL_LEVELS } from '@/constants/game-rules';
import styles from './OpponentManager.module.css';

export interface OpponentManagerProps {
  /** Callback when opponent is selected */
  onOpponentSelected: (opponent: Opponent) => void;
  /** User's name (for display purposes) */
  userName: string;
  /** Discord connection info */
  discordUsername?: string | undefined;
  discordId?: string | undefined;
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
  discordUsername,
  discordId,
}: OpponentManagerProps): ReactElement {
  const [selectedType, setSelectedType] = useState<'cpu' | 'human' | 'remote-cpu' | 'ai-agent' | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<AiAgentSkillLevel | null>(null);

  const isDiscordConnected = !!(discordId && discordUsername);

  // Restore form state after Discord OAuth redirect
  useEffect(() => {
    const savedFormJson = sessionStorage.getItem('discord-oauth-opponent-form');
    if (savedFormJson) {
      try {
        const savedForm = JSON.parse(savedFormJson);
        setSelectedType(savedForm.selectedType);
        setOpponentName(savedForm.opponentName);
        // Clear the saved form state
        sessionStorage.removeItem('discord-oauth-opponent-form');
      } catch (error) {
        console.error('[OpponentManager] Failed to restore form state:', error);
      }
    }
  }, []);

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
   * Handle AI Agent opponent selection
   */
  const handleSelectAiAgent = useCallback((): void => {
    setSelectedType('ai-agent');
    setSelectedSkillLevel(null);
  }, []);

  /**
   * Handle skill level selection
   */
  const handleSkillLevelSelect = useCallback((level: AiAgentSkillLevel): void => {
    setSelectedSkillLevel(level);
    setOpponentName(AI_AGENT_SKILL_LEVELS[level].defaultName);
  }, []);

  /**
   * Handle AI Agent name submission
   */
  const handleAiAgentNameSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      if (!opponentName.trim() || !selectedSkillLevel) {
        return;
      }

      const aiOpponent = createAiAgentOpponent(opponentName.trim(), selectedSkillLevel);
      onOpponentSelected(aiOpponent);
    },
    [opponentName, selectedSkillLevel, onOpponentSelected]
  );

  /**
   * Handle Discord connection
   */
  const handleConnectDiscord = useCallback((): void => {
    // Set loading state
    setIsConnectingDiscord(true);

    // Save that we're in opponent creation flow
    sessionStorage.setItem('discord-oauth-return', 'opponent-creation');

    // Save the current form state so we can restore it after OAuth
    sessionStorage.setItem('discord-oauth-opponent-form', JSON.stringify({
      selectedType,
      opponentName,
    }));

    // Redirect to Discord OAuth
    window.location.href = getApiEndpoint('/api/auth/discord/authorize');
  }, [selectedType, opponentName]);

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
              {isDiscordConnected ? (
                <p className={styles.discordConnectedHint}>
                  ✅ Discord connected • You'll be notified when they play
                </p>
              ) : (
                <>
                  <p className={styles.discordHint}>
                    💡 Want notifications when they play their turn?
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDiscordModal(true)}
                    className={styles.discordLink}
                    disabled={isConnectingDiscord}
                  >
                    {isConnectingDiscord ? 'Connecting to Discord...' : 'Connect Discord (optional)'}
                  </button>
                </>
              )}
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
          isConnected={isDiscordConnected}
          discordUsername={discordUsername}
          isConnecting={isConnectingDiscord}
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

  // If AI agent selected but no skill level yet, show skill picker
  if (selectedType === 'ai-agent' && !selectedSkillLevel) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Choose AI Skill Level</h2>
        <p className={styles.subtitle}>
          Select the difficulty of your AI opponent
        </p>

        <div className={styles.skillGrid}>
          {(Object.entries(AI_AGENT_SKILL_LEVELS) as Array<[AiAgentSkillLevel, typeof AI_AGENT_SKILL_LEVELS[AiAgentSkillLevel]]>).map(([level, config]) => (
            <button
              key={level}
              onClick={() => handleSkillLevelSelect(level)}
              className={styles.skillCard}
              style={{ borderColor: config.color }}
              aria-label={`Select ${config.label} difficulty`}
            >
              <div className={styles.skillIcon}>{config.emoji}</div>
              <div className={styles.skillLabel} style={{ color: config.color }}>
                {config.label}
              </div>
              <div className={styles.skillName}>{config.defaultName}</div>
            </button>
          ))}
        </div>

        <div className={styles.buttonGroup} style={{ maxWidth: '400px', margin: '2rem auto 0' }}>
          <button
            type="button"
            onClick={() => setSelectedType(null)}
            className={styles.backButton}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // If AI agent selected with skill level, show name form
  if (selectedType === 'ai-agent' && selectedSkillLevel) {
    const skillConfig = AI_AGENT_SKILL_LEVELS[selectedSkillLevel];
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>AI Agent Opponent</h2>
        <div className={styles.skillPreview}>
          <span>{skillConfig.emoji}</span>
          <span style={{ color: skillConfig.color, fontWeight: 600 }}>{skillConfig.label}</span>
        </div>

        <form onSubmit={handleAiAgentNameSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="ai-agent-name" className={styles.label}>
              Opponent Name
            </label>
            <input
              id="ai-agent-name"
              type="text"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className={styles.input}
              placeholder={skillConfig.defaultName}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => setSelectedSkillLevel(null)}
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
            Play against a CPU with boards from a remote server.
          </p>
          <span className={styles.optionBadge}>Online</span>
        </button>

        {/* AI Agent Opponent Card */}
        <button
          onClick={FEATURES.AI_AGENT ? handleSelectAiAgent : undefined}
          className={`${styles.optionCard} ${!FEATURES.AI_AGENT ? styles.lockedCard : ''}`}
          aria-label="Play against AI agent"
          disabled={!FEATURES.AI_AGENT}
        >
          <div className={styles.optionIcon}>🔮</div>
          <h3 className={styles.optionTitle}>AI Agent {!FEATURES.AI_AGENT && '🔒'}</h3>
          <p className={styles.optionDescription}>
            Play against a trained RL agent that builds boards dynamically each round.
          </p>
          {FEATURES.AI_AGENT ? (
            <span className={styles.optionBadge}>AI Powered</span>
          ) : (
            <span className={styles.optionBadge} style={{ color: '#9ca3af', backgroundColor: '#f3f4f6' }}>Temporarily disabled</span>
          )}
        </button>

        {/* Human Opponent Card */}
        <button
          onClick={handleSelectHuman}
          className={styles.optionCard}
          aria-label="Play against human opponent"
        >
          <div className={styles.optionIcon}>🤝</div>
          <h3 className={styles.optionTitle}>Human Opponent</h3>
          <p className={styles.optionDescription}>
            Invite a friend to play. Enter their name to get started.
          </p>
          <span className={styles.optionBadge}>Multiplayer</span>
        </button>
      </div>
    </div>
  );
}
