/**
 * WaitingForOpponent component - shown when player is waiting for opponent to make their move
 * @module components/WaitingForOpponent
 */

import { useState, useCallback, type ReactElement } from 'react';
import styles from './ShareChallenge.module.css';

export interface WaitingForOpponentProps {
  /** The challenge URL to share/re-share */
  challengeUrl: string;
  /** Opponent name */
  opponentName: string;
  /** Board size */
  boardSize: number;
  /** Round number */
  round: number;
  /** Callback when user wants to go home */
  onGoHome: () => void;
  /** Whether opponent has Discord connected */
  opponentHasDiscord?: boolean;
}

/**
 * Waiting for opponent component.
 * Displays a waiting state with option to re-copy the link.
 *
 * @component
 */
export function WaitingForOpponent({
  challengeUrl,
  opponentName,
  boardSize,
  round,
  onGoHome,
  opponentHasDiscord = false,
}: WaitingForOpponentProps): ReactElement {
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Waiting for {opponentName}</h1>

        <div className={styles.info}>
          <p className={styles.infoText}>
            You've sent your board to <strong>{opponentName}</strong>.
            {opponentHasDiscord
              ? ' They will be notified automatically via Discord.'
              : ' Waiting for them to make their move.'}
          </p>
          <p className={styles.infoSubtext}>
            Round {round} • {boardSize}×{boardSize} Board
          </p>
        </div>

        <div className={styles.instructions}>
          <p>
            {opponentHasDiscord
              ? 'Check back later to see their results, or resend the link below if needed.'
              : 'Need to resend the link? You can copy it again below.'}
          </p>
        </div>

        {/* Success message */}
        {copySuccess && (
          <div className={styles.successMessage}>
            ✓ Link copied!
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
              className={styles.secondaryButton}
            >
              📤 Resend Challenge
            </button>
          )}

          {/* Clipboard copy button */}
          <button
            onClick={handleCopyToClipboard}
            className={styles.secondaryButton}
          >
            📋 Copy Link
          </button>
        </div>

        {/* URL preview (collapsed) */}
        <details className={styles.urlDetails}>
          <summary className={styles.urlSummary}>View link</summary>
          <div className={styles.urlPreview}>
            <code className={styles.urlCode}>{challengeUrl}</code>
          </div>
        </details>

        {/* Home button */}
        <button
          onClick={onGoHome}
          className={styles.cancelButton}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
