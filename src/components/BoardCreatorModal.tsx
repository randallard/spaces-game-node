/**
 * BoardCreatorModal - Full-screen modal wrapper for BoardCreator
 * @module components/BoardCreatorModal
 */

import { type ReactElement } from 'react';
import { BoardCreator, type BoardCreatorProps } from './BoardCreator';
import styles from './BoardCreatorModal.module.css';

export type BoardCreatorModalProps = BoardCreatorProps;

/**
 * Full-screen modal wrapper for board creation
 */
export function BoardCreatorModal(props: BoardCreatorModalProps): ReactElement {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <BoardCreator {...props} />
      </div>
    </div>
  );
}
