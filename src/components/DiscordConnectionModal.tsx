/**
 * DiscordConnectionModal component for explaining and connecting Discord
 * @module components/DiscordConnectionModal
 */

import type { ReactElement } from 'react';
import styles from './DiscordConnectionModal.module.css';

export interface DiscordConnectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user clicks "Connect Discord" */
  onConnect: () => void;
  /** Whether user is currently connected to Discord */
  isConnected?: boolean | undefined;
  /** Discord username if connected */
  discordUsername?: string | undefined;
  /** Whether Discord connection is in progress */
  isConnecting?: boolean;
}

/**
 * Modal explaining Discord integration benefits and providing connection option.
 *
 * Features:
 * - Explains notification benefits
 * - Shows connection status
 * - Provides "Connect with Discord" button
 * - Explains it's optional
 *
 * @component
 */
export function DiscordConnectionModal({
  isOpen,
  onClose,
  onConnect,
  isConnected = false,
  discordUsername,
  isConnecting = false,
}: DiscordConnectionModalProps): ReactElement | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isConnected ? '✅ Discord Connected' : '🔔 Get Turn Notifications'}
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {isConnected ? (
            <>
              <p className={styles.connectedMessage}>
                You're connected as <strong>{discordUsername}</strong>
              </p>
              <div className={styles.benefitsList}>
                <p className={styles.benefit}>
                  ✅ Get notified on Discord when your opponent plays their turn
                </p>
                <p className={styles.benefit}>
                  ✅ Receive game completion notifications
                </p>
                <p className={styles.benefit}>
                  ✅ Never miss a move in your correspondence games
                </p>
              </div>
            </>
          ) : (
            <>
              <p className={styles.description}>
                Connect your Discord account to receive notifications when:
              </p>

              <div className={styles.benefitsList}>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>🔔</span>
                  <div>
                    <strong>Your opponent plays their turn</strong>
                    <p className={styles.benefitDetail}>
                      Get a DM on Discord so you know when it's your move
                    </p>
                  </div>
                </div>

                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>🎮</span>
                  <div>
                    <strong>A game completes</strong>
                    <p className={styles.benefitDetail}>
                      See final results and stats right in Discord
                    </p>
                  </div>
                </div>

                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>⚡</span>
                  <div>
                    <strong>Challenges are sent</strong>
                    <p className={styles.benefitDetail}>
                      Know immediately when someone wants to play
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.note}>
                <p>
                  <strong>Note:</strong> Discord connection is completely optional.
                  You can still share game links manually if you prefer.
                </p>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          {isConnected ? (
            <button onClick={onClose} className={styles.doneButton}>
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose} className={styles.skipButton} disabled={isConnecting}>
                Skip for Now
              </button>
              <button onClick={onConnect} className={styles.connectButton} disabled={isConnecting}>
                {isConnecting ? 'Connecting to Discord...' : 'Connect with Discord'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
