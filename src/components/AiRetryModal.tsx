import React from 'react';
import styles from './AiRetryModal.module.css';

export type AiRetryModalProps = {
  opponentName: string;
  failureDetail: string;
  isRetryResult?: boolean;
  onRetry: () => void;
  onForfeit: () => void;
};

export function AiRetryModal({
  opponentName,
  failureDetail,
  isRetryResult = false,
  onRetry,
  onForfeit,
}: AiRetryModalProps): React.ReactElement {
  if (isRetryResult) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2 className={styles.title}>{opponentName} still couldn&apos;t decide</h2>
          <p className={styles.message}>
            Still couldn&apos;t build a valid board after retry.
          </p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={onForfeit}>
              Win by forfeit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{opponentName} is having trouble</h2>
        <p className={styles.message}>
          Couldn&apos;t decide on a board ({failureDetail}).
        </p>
        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={onRetry}>
            Give them more time
          </button>
          <button className={styles.secondaryButton} onClick={onForfeit}>
            They forfeit this round
          </button>
        </div>
      </div>
    </div>
  );
}
