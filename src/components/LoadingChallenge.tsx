/**
 * LoadingChallenge component - Shows while fetching challenge data from URL
 * Matches ActiveGameView header styling for seamless transition
 * @module components/LoadingChallenge
 */

import { type ReactElement } from 'react';
import styles from './LoadingChallenge.module.css';

export interface LoadingChallengeProps {
  /** User's name */
  userName: string;
}

/**
 * Loading state shown while fetching challenge data from shortened URL.
 * Displays skeleton placeholders that match ActiveGameView header layout.
 */
export function LoadingChallenge({
  userName,
}: LoadingChallengeProps): ReactElement {
  return (
    <div className={styles.container}>
      {/* Header - Matches ActiveGameView.header exactly */}
      <div className={styles.header}>
        <h2 className={styles.roundInfo}>
          Round <span className={styles.skeleton}>-</span> of <span className={styles.skeleton}>-</span>
        </h2>
        <div className={styles.scoreInfo}>
          Score: {userName} <span className={styles.skeleton}>-</span> - <span className={styles.skeleton}>---</span> <span className={styles.skeleton}>-</span>
        </div>
        <div className={styles.boardSizeInfo}>
          Board Size: <span className={styles.skeleton}>-</span>×<span className={styles.skeleton}>-</span>
        </div>
        <div className={styles.matchupInfo}>
          <span className={styles.skeleton}>---</span> vs {userName}
        </div>
      </div>

      {/* Status Message - Matches ActiveGameView.statusMessage */}
      <div className={styles.statusMessage}>
        <div className={styles.loadingIcon}>⏳</div>
        Retrieving information for the round...
      </div>

      {/* Loading Spinner */}
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
}
