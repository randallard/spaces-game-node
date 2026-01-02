/**
 * ChallengeReceivedModal component for accepting challenges
 * @module components/ChallengeReceivedModal
 */

import type { ReactElement } from 'react';
import styles from './ChallengeReceivedModal.module.css';

export interface ChallengeReceivedModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Challenger's name */
  challengerName: string;
  /** Board size for the challenge */
  boardSize: number;
  /** Round number */
  round: number;
  /** Whether this is an ongoing game */
  isOngoing: boolean;
  /** Whether challenger has Discord connected */
  challengerHasDiscord: boolean;
  /** Challenger's Discord username */
  challengerDiscordUsername?: string;
  /** Whether current user has Discord connected */
  userHasDiscord: boolean;
  /** Callback when user accepts challenge */
  onAccept: () => void;
  /** Callback when user declines challenge */
  onDecline: () => void;
  /** Callback when user wants to connect Discord */
  onConnectDiscord: () => void;
  /** Whether Discord connection is in progress */
  isConnectingDiscord?: boolean;
}

/**
 * Modal shown when receiving a challenge from another player.
 *
 * Features:
 * - Shows challenger info
 * - Shows if challenger has Discord (will notify you)
 * - Offers Discord connection for current user
 * - Accept/Decline buttons
 *
 * @component
 */
export function ChallengeReceivedModal({
  isOpen,
  challengerName,
  boardSize,
  round,
  isOngoing,
  challengerHasDiscord,
  challengerDiscordUsername,
  userHasDiscord,
  onAccept,
  onDecline: _onDecline,
  onConnectDiscord,
  isConnectingDiscord = false,
}: ChallengeReceivedModalProps): ReactElement | null {
  if (!isOpen) {
    return null;
  }

  const title = isOngoing
    ? `${challengerName} has responded!`
    : `Challenge from ${challengerName}`;

  const description = isOngoing
    ? `Ready for Round ${round}?`
    : `${challengerName} has challenged you to a ${boardSize}×${boardSize} board game!`;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>

        {/* Discord Status Section */}
        <div className={styles.discordSection}>
          {challengerHasDiscord && (
            <div className={styles.discordInfo}>
              <span className={styles.discordIcon}>🔔</span>
              <p className={styles.discordText}>
                {challengerName} is connected to Discord
                {challengerDiscordUsername && ` as ${challengerDiscordUsername}`}
                <br />
                <span className={styles.discordSubtext}>
                  They'll be notified automatically when it's their turn
                </span>
              </p>
            </div>
          )}

          {!userHasDiscord && (
            <div className={styles.connectSection}>
              <p className={styles.connectHint}>
                💡 Want to get notified when {challengerName} plays?
              </p>
              <button
                type="button"
                onClick={onConnectDiscord}
                className={styles.connectButton}
                disabled={isConnectingDiscord}
              >
                {isConnectingDiscord ? 'Connecting to Discord...' : 'Connect Discord'}
              </button>
              <button
                type="button"
                onClick={onAccept}
                className={styles.playWithoutButton}
                disabled={isConnectingDiscord}
              >
                Play without Discord
              </button>
            </div>
          )}

          {userHasDiscord && (
            <div className={styles.userConnected}>
              <span className={styles.checkmark}>✅</span>
              You're connected to Discord - you'll get notifications!
            </div>
          )}
        </div>

        {/* Action Buttons - only show if user already has Discord */}
        {userHasDiscord && (
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onAccept}
              className={styles.acceptButton}
            >
              Accept Challenge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
