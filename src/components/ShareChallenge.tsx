/**
 * ShareChallenge component for sharing game challenges via URL
 * @module components/ShareChallenge
 */

import { useState, useCallback, type ReactElement } from 'react';
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
  /** Callback when user cancels */
  onCancel: () => void;
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
}: ShareChallengeProps): ReactElement {
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
            <code className={styles.urlCode}>{challengeUrl}</code>
          </div>
        </details>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
