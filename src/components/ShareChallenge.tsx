/**
 * ShareChallenge component for sharing game challenges via URL
 * @module components/ShareChallenge
 */

import { useState, useCallback, useMemo, type ReactElement } from 'react';
import { parseChallengeUrl, type ChallengeData } from '@/utils/challenge-url';
import styles from './ShareChallenge.module.css';

export interface ShareChallengeProps {
  /** The challenge URL to share */
  challengeUrl: string;
  /** Opponent name */
  opponentName: string;
  /** Board size */
  boardSize: number;
  /** Round number */
  round: number;
  /** Callback when user cancels/closes modal */
  onCancel: () => void;
  /** Callback when user clicks "Back to Home" */
  onGoHome?: () => void;
  /** Whether opponent has Discord connected */
  opponentHasDiscord?: boolean;
  /** Whether current user has Discord connected */
  userHasDiscord?: boolean;
  /** Callback when user wants to connect Discord */
  onConnectDiscord?: () => void;
  /** Whether Discord connection is in progress */
  isConnectingDiscord?: boolean;
  /** Timestamp of last Discord notification sent (ISO string) */
  lastDiscordNotificationTime?: string | null;
}

/**
 * Share challenge component.
 *
 * Provides two sharing methods:
 * 1. Clipboard copy (works on all platforms)
 * 2. Native share sheet (mobile devices)
 *
 * @component
 */
export function ShareChallenge({
  challengeUrl,
  opponentName,
  boardSize,
  round,
  onCancel,
  onGoHome,
  opponentHasDiscord = false,
  userHasDiscord = false,
  onConnectDiscord,
  isConnectingDiscord = false,
  lastDiscordNotificationTime,
}: ShareChallengeProps): ReactElement {
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [showData, setShowData] = useState(false);

  // Parse challenge data from URL
  const challengeData = useMemo<ChallengeData | null>(() => {
    return parseChallengeUrl(challengeUrl);
  }, [challengeUrl]);

  /**
   * Copy URL to clipboard
   */
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopySuccess(true);
      setShareError(null);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);

      // Fallback for browsers without clipboard API
      try {
        const input = document.createElement('input');
        input.value = challengeUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);

        setCopySuccess(true);
        setShareError(null);
        setTimeout(() => {
          setCopySuccess(false);
        }, 3000);
      } catch (fallbackError) {
        setShareError('Failed to copy link. Please copy manually.');
      }
    }
  }, [challengeUrl]);

  /**
   * Use native share API (mobile)
   */
  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      // Fall back to clipboard if native share not available
      handleCopyToClipboard();
      return;
    }

    try {
      await navigator.share({
        title: `Spaces Game Challenge - Round ${round}`,
        text: `${opponentName}, I challenge you to beat my ${boardSize}×${boardSize} board!`,
        url: challengeUrl,
      });

      setCopySuccess(true);
      setShareError(null);
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (error: any) {
      // User cancelled or share failed
      if (error.name === 'AbortError') {
        // User cancelled - don't show error
        return;
      }

      console.error('Failed to share:', error);

      // Fallback to clipboard
      handleCopyToClipboard();
    }
  }, [challengeUrl, opponentName, boardSize, round, handleCopyToClipboard]);

  /**
   * Format challenge data for display
   */
  const formatChallengeData = useCallback((data: ChallengeData | null): string => {
    if (!data) return 'Unable to parse challenge data';

    return JSON.stringify({
      gameId: data.gameId,
      round: data.round,
      gameMode: data.gameMode,
      boardSize: data.boardSize,
      playerName: data.playerName,
      playerId: data.playerId,
      ...(data.gameCreatorId && { gameCreatorId: data.gameCreatorId }),
      ...(data.playerScore !== undefined && { playerScore: data.playerScore }),
      ...(data.opponentScore !== undefined && { opponentScore: data.opponentScore }),
      ...(data.isFinalResults && { isFinalResults: data.isFinalResults }),
      ...(data.isRoundComplete && { isRoundComplete: data.isRoundComplete }),
      ...(data.playerDiscordId && { playerDiscordId: data.playerDiscordId }),
      ...(data.playerDiscordUsername && { playerDiscordUsername: data.playerDiscordUsername }),
      ...(data.playerDiscordAvatar && { playerDiscordAvatar: data.playerDiscordAvatar }),
      ...(data.previousRoundResult && { previousRoundResult: 'RoundResult data included' }),
      ...(data.previousRoundResults && { previousRoundResults: `${data.previousRoundResults.length} rounds included` }),
      playerBoard: data.playerBoard || 'N/A',
    }, null, 2);
  }, []);

  // If opponent has Discord, show notification status with manual sharing option
  if (opponentHasDiscord) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Turn Complete!</h1>

          <div className={styles.notificationStatus}>
            <div className={styles.notificationIcon}>🔔</div>
            <p className={styles.notificationText}>
              Discord notification sent to <strong>{opponentName}</strong>
              {lastDiscordNotificationTime && (
                <>
                  {' '}at{' '}
                  <span className={styles.timestamp}>
                    {new Date(lastDiscordNotificationTime).toUTCString()}
                  </span>
                  {' '}
                  <a
                    href="https://dateful.com/convert/utc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.utcHelp}
                    title="What time is this in my timezone?"
                  >
                    ?
                  </a>
                </>
              )}
            </p>
          </div>

          <div className={styles.info}>
            <p className={styles.infoSubtext}>
              Round {round} • {boardSize}×{boardSize} Board
            </p>
          </div>

          {/* Manual sharing option (backup) */}
          <div className={styles.instructions}>
            <p>Want to share the link manually?</p>
          </div>

          {/* Success message */}
          {copySuccess && (
            <div className={styles.successMessage}>
              ✓ Link copied to clipboard!
            </div>
          )}

          {/* Error message */}
          {shareError && (
            <div className={styles.errorMessage}>
              {shareError}
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            {/* Native share button (preferred on mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className={styles.primaryButton}
              >
                📤 Share Challenge
              </button>
            )}

            {/* Clipboard copy button */}
            <button
              onClick={handleCopyToClipboard}
              className={(typeof navigator !== 'undefined' && 'share' in navigator) ? styles.secondaryButton : styles.primaryButton}
            >
              📋 Copy Link
            </button>
          </div>

          {/* URL preview (collapsed) */}
          <details className={styles.urlDetails}>
            <summary className={styles.urlSummary}>View link</summary>
            <div className={styles.urlPreview}>
              <div className={styles.urlToggle}>
                <button
                  onClick={() => setShowData(false)}
                  className={!showData ? styles.urlToggleActive : styles.urlToggleInactive}
                >
                  URL
                </button>
                <button
                  onClick={() => setShowData(true)}
                  className={showData ? styles.urlToggleActive : styles.urlToggleInactive}
                >
                  Data
                </button>
              </div>
              <code className={styles.urlCode}>
                {showData ? formatChallengeData(challengeData) : challengeUrl}
              </code>
            </div>
          </details>

          {/* Discord connection hint for user */}
          {!userHasDiscord && onConnectDiscord && (
            <div className={styles.discordHint}>
              <button
                onClick={onConnectDiscord}
                className={styles.discordHintLink}
                disabled={isConnectingDiscord}
              >
                {isConnectingDiscord ? 'Connecting to Discord...' : 'Connect to Discord if you want to receive notifications automatically'}
              </button>
            </div>
          )}

          {/* Cancel button */}
          <button
            onClick={() => {
              if (onGoHome) {
                onCancel(); // Close modal first
                onGoHome(); // Then go home
              } else {
                onCancel(); // Just close modal
              }
            }}
            className={styles.cancelButton}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Default sharing UI when opponent doesn't have Discord
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Share Your Challenge</h1>

        <div className={styles.info}>
          <p className={styles.infoText}>
            Send this challenge to <strong>{opponentName}</strong>!
          </p>
          <p className={styles.infoSubtext}>
            Round {round} • {boardSize}×{boardSize} Board
          </p>
        </div>

        <div className={styles.instructions}>
          <p>Your board is ready to share. Send the link to {opponentName} so they can try to beat it!</p>
        </div>

        {/* Success message */}
        {copySuccess && (
          <div className={styles.successMessage}>
            ✓ Link copied! Send it to {opponentName}
          </div>
        )}

        {/* Error message */}
        {shareError && (
          <div className={styles.errorMessage}>
            {shareError}
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          {/* Native share button (preferred on mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className={styles.primaryButton}
            >
              📤 Share Challenge
            </button>
          )}

          {/* Clipboard copy button */}
          <button
            onClick={handleCopyToClipboard}
            className={(typeof navigator !== 'undefined' && 'share' in navigator) ? styles.secondaryButton : styles.primaryButton}
          >
            📋 Copy Link
          </button>
        </div>

        {/* URL preview (collapsed) */}
        <details className={styles.urlDetails}>
          <summary className={styles.urlSummary}>View link</summary>
          <div className={styles.urlPreview}>
            <div className={styles.urlToggle}>
              <button
                onClick={() => setShowData(false)}
                className={!showData ? styles.urlToggleActive : styles.urlToggleInactive}
              >
                URL
              </button>
              <button
                onClick={() => setShowData(true)}
                className={showData ? styles.urlToggleActive : styles.urlToggleInactive}
              >
                Data
              </button>
            </div>
            <code className={styles.urlCode}>
              {showData ? formatChallengeData(challengeData) : challengeUrl}
            </code>
          </div>
        </details>

        {/* Discord connection hint for user */}
        {!userHasDiscord && onConnectDiscord && (
          <div className={styles.discordHint}>
            <button
              onClick={onConnectDiscord}
              className={styles.discordHintLink}
              disabled={isConnectingDiscord}
            >
              {isConnectingDiscord ? 'Connecting to Discord...' : 'Connect to Discord to receive notifications automatically'}
            </button>
          </div>
        )}

        {/* Cancel button */}
        <button
          onClick={() => {
            if (onGoHome) {
              onCancel(); // Close modal first
              onGoHome(); // Then go home
            } else {
              onCancel(); // Just close modal
            }
          }}
          className={styles.cancelButton}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
