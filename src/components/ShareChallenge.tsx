/**
 * ShareChallenge component for sharing game challenges via URL
 * @module components/ShareChallenge
 */

import { useState, useCallback, useMemo, type ReactElement } from 'react';
import { parseChallengeUrl, type ChallengeData } from '@/utils/challenge-url';
import { encodeMinimalBoard } from '@/utils/board-encoding';
import { FEATURES } from '@/config/features';
import styles from './ShareChallenge.module.css';

export interface ShareChallengeProps {
  /** The challenge URL to share (shortened or compressed) */
  challengeUrl: string;
  /** The fallback compressed URL (for View Link panel) */
  fallbackUrl?: string;
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
  /** Whether URL is currently being generated */
  isGeneratingUrl?: boolean;
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
  fallbackUrl,
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
  isGeneratingUrl = false,
}: ShareChallengeProps): ReactElement {
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [showData, setShowData] = useState(false);

  // Determine which URL to display in the View Link panel
  // Use fallback if provided, otherwise use challengeUrl
  const urlForDisplay = fallbackUrl || challengeUrl;

  // Determine if we're showing a shortened URL
  const isShortened = challengeUrl.includes('#s=');

  // Parse challenge data from the fallback/compressed URL
  const challengeData = useMemo<ChallengeData | null>(() => {
    return parseChallengeUrl(urlForDisplay);
  }, [urlForDisplay]);

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

    // Format previous round results for display
    const formatPreviousRounds = (rounds: typeof data.previousRoundResults) => {
      if (!rounds || rounds.length === 0) return undefined;

      return rounds.map(r => ({
        round: r.round,
        winner: r.winner,
        playerPoints: r.playerPoints,
        opponentPoints: r.opponentPoints,
        // Boards are already encoded strings (like "2|2p3t0pG0f")
        playerBoard: r.playerBoard || 'N/A',
        opponentBoard: r.opponentBoard || 'N/A',
      }));
    };

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
      ...(data.previousRoundResult && {
        previousRoundResult: {
          round: data.previousRoundResult.round,
          winner: data.previousRoundResult.winner,
          playerPoints: data.previousRoundResult.playerPoints,
          opponentPoints: data.previousRoundResult.opponentPoints,
        }
      }),
      ...(data.previousRoundResults && { previousRoundResults: formatPreviousRounds(data.previousRoundResults) }),
      playerBoard: data.playerBoard || 'N/A',
    }, null, 2);
  }, []);

  // If opponent has Discord AND notifications are enabled, show notification status with manual sharing option
  // If opponent has Discord but notifications are disabled, show manual sharing UI
  if (opponentHasDiscord && FEATURES.DISCORD_NOTIFICATIONS) {
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
                disabled={isGeneratingUrl}
                className={styles.primaryButton}
              >
                {isGeneratingUrl ? '⏳ Generating Link...' : '📤 Share Challenge'}
              </button>
            )}

            {/* Clipboard copy button */}
            <button
              onClick={handleCopyToClipboard}
              disabled={isGeneratingUrl}
              className={(typeof navigator !== 'undefined' && 'share' in navigator) ? styles.secondaryButton : styles.primaryButton}
            >
              {isGeneratingUrl ? '⏳ Generating Link...' : '📋 Copy Link'}
            </button>
          </div>

          {/* URL preview (collapsed) */}
          <details className={styles.urlDetails}>
            <summary className={styles.urlSummary}>View link data</summary>
            <div className={styles.urlPreview}>
              {isShortened && (
                <>
                  <div className={styles.urlLabel}>Shortened URL (shared):</div>
                  <code className={styles.urlCode}>{challengeUrl}</code>
                  <div className={styles.urlLabel}>Fallback URL:</div>
                </>
              )}
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
                {showData ? formatChallengeData(challengeData) : urlForDisplay}
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
              disabled={isGeneratingUrl}
              className={styles.primaryButton}
            >
              {isGeneratingUrl ? '⏳ Generating Link...' : '📤 Share Challenge'}
            </button>
          )}

          {/* Clipboard copy button */}
          <button
            onClick={handleCopyToClipboard}
            disabled={isGeneratingUrl}
            className={(typeof navigator !== 'undefined' && 'share' in navigator) ? styles.secondaryButton : styles.primaryButton}
          >
            {isGeneratingUrl ? '⏳ Generating Link...' : '📋 Copy Link'}
          </button>
        </div>

        {/* URL preview (collapsed) */}
        <details className={styles.urlDetails}>
          <summary className={styles.urlSummary}>View link data</summary>
          <div className={styles.urlPreview}>
            {isShortened && (
              <>
                <div className={styles.urlLabel}>Shortened URL (shared):</div>
                <code className={styles.urlCode}>{challengeUrl}</code>
                <div className={styles.urlLabel}>Fallback URL:</div>
              </>
            )}
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
              {showData ? formatChallengeData(challengeData) : urlForDisplay}
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
