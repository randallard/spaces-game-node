/**
 * TutorialBoardCreator - Board creator with dynamic tutorial instructions
 * @module components/TutorialBoardCreator
 */

import { useState, useCallback, type ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Board, CellContent, BoardMove, Position, CreatureId } from '@/types';
import { validateBoard } from '@/utils/board-validation';
import { generateBoardThumbnail } from '@/utils/svg-thumbnail';
import styles from './BoardCreator.module.css'; // Reuse existing styles
import tutorialStyles from './TutorialBoardCreator.module.css';

export interface TutorialBoardCreatorProps {
  /** CPU Sam's data (name and creature) */
  cpuSamData: { name: string; creature: CreatureId };
  /** Callback when board is created and final move is clicked */
  onBoardComplete: (board: Board, hasTraps: boolean) => void;
}

type CreationPhase = 'choosing-start' | 'building';

/**
 * Tutorial version of BoardCreator with dynamic instruction text
 */
export function TutorialBoardCreator({ cpuSamData, onBoardComplete }: TutorialBoardCreatorProps): ReactElement {
  const boardSize = 2; // Tutorial always uses 2x2

  const createEmptyGrid = useCallback((): CellContent[][] => {
    return Array(boardSize).fill(null).map(() => Array(boardSize).fill('empty'));
  }, []);

  const [phase, setPhase] = useState<CreationPhase>('choosing-start');
  const [grid, setGrid] = useState<CellContent[][]>(() => createEmptyGrid());
  const [sequence, setSequence] = useState<BoardMove[]>([]);
  const [piecePosition, setPiecePosition] = useState<Position | null>(null);
  const [hasSetTrap, setHasSetTrap] = useState(false);
  const [isTrapped, setIsTrapped] = useState(false);

  /**
   * Get adjacent positions (orthogonal only: up, down, left, right)
   */
  const getAdjacentPositions = useCallback((pos: Position): Position[] => {
    const adjacent: Position[] = [];
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 },  // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 },  // right
    ];

    for (const dir of directions) {
      const newRow = pos.row + dir.row;
      const newCol = pos.col + dir.col;
      if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }

    return adjacent;
  }, []);

  /**
   * Check if player would trap themselves
   */
  const wouldTrapSelf = useCallback((_currentPos: Position, nextPos: Position): boolean => {
    // Check if the next move would hit a trap
    const cell = grid[nextPos.row]?.[nextPos.col];
    return cell === 'trap';
  }, [grid]);

  /**
   * Handle choosing starting position (bottom row only)
   */
  const handleChooseStart = useCallback((row: number, col: number): void => {
    const bottomRow = boardSize - 1;
    if (row !== bottomRow) return;

    const position: Position = { row, col };

    const newGrid = createEmptyGrid();
    newGrid[row]![col] = 'piece';
    setGrid(newGrid);

    const move: BoardMove = {
      position,
      type: 'piece',
      order: 1,
    };
    setSequence([move]);
    setPiecePosition(position);
    setPhase('building');
    setIsTrapped(false);
  }, [createEmptyGrid]);

  /**
   * Handle moving piece to adjacent square
   */
  const handleMove = useCallback((row: number, col: number): void => {
    if (!piecePosition) return;

    const position: Position = { row, col };

    // Check if this move would trap the player
    if (wouldTrapSelf(piecePosition, position)) {
      setIsTrapped(true);
      return;
    }

    const newGrid = grid.map((r, rIdx) =>
      r.map((cell, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return 'piece';
        }
        return cell;
      })
    );
    setGrid(newGrid);

    const nextOrder = sequence.length + 1;
    const move: BoardMove = {
      position,
      type: 'piece',
      order: nextOrder,
    };
    setSequence([...sequence, move]);
    setPiecePosition(position);
    setIsTrapped(false);
  }, [piecePosition, grid, sequence, wouldTrapSelf]);

  /**
   * Handle placing trap on adjacent square
   */
  const handleTrap = useCallback((row: number, col: number): void => {
    if (!piecePosition) return;

    const position: Position = { row, col };

    const newGrid = grid.map((r, rIdx) =>
      r.map((cell, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return 'trap';
        }
        return cell;
      })
    );
    setGrid(newGrid);

    const nextOrder = sequence.length + 1;
    const move: BoardMove = {
      position,
      type: 'trap',
      order: nextOrder,
    };
    setSequence([...sequence, move]);
    setHasSetTrap(true);
    setIsTrapped(false);
  }, [piecePosition, grid, sequence]);

  /**
   * Handle final move
   */
  const handleFinalMove = useCallback((): void => {
    if (!piecePosition || piecePosition.row !== 0) return;

    const nextOrder = sequence.length + 1;
    const finalMove: BoardMove = {
      position: { row: -1, col: piecePosition.col },
      type: 'final',
      order: nextOrder,
    };
    const finalSequence = [...sequence, finalMove];

    const board: Board = {
      id: uuidv4(),
      name: 'My First Board',
      boardSize,
      grid,
      sequence: finalSequence,
      thumbnail: '',
      createdAt: Date.now(),
    };

    const validation = validateBoard(board);
    if (!validation.valid) {
      console.error('[TutorialBoardCreator] Invalid board:', validation.errors);
      return;
    }

    board.thumbnail = generateBoardThumbnail(board);
    onBoardComplete(board, hasSetTrap);
  }, [piecePosition, sequence, grid, hasSetTrap, onBoardComplete]);

  /**
   * Handle restart
   */
  const handleRestart = useCallback((): void => {
    setPhase('choosing-start');
    setGrid(createEmptyGrid());
    setSequence([]);
    setPiecePosition(null);
    setHasSetTrap(false);
    setIsTrapped(false);
  }, [createEmptyGrid]);

  // Get adjacent positions for Move/Trap buttons
  const adjacentPositions = piecePosition
    ? getAdjacentPositions(piecePosition).filter((pos) => {
        const cell = grid[pos.row]?.[pos.col];
        return cell !== 'trap';
      })
    : [];
  const canFinish = piecePosition?.row === 0;

  /**
   * Get dynamic tutorial instruction text
   */
  const getInstruction = (): string => {
    if (phase === 'choosing-start') {
      return 'first, choose a start square';
    }

    if (isTrapped) {
      return 'oh no! that will trap your bot! reset to try again';
    }

    if (canFinish) {
      return 'alright! click the final move button to save the board!';
    }

    // Just placed the start square (sequence has only 1 move)
    if (sequence.length === 1) {
      return `now you can set a trap for ${cpuSamData.name}'s bot!`;
    }

    // Player has made moves and is in the bottom row - prompt to move to top
    if (piecePosition?.row === 1) {
      return 'now choose a move in the top row';
    }

    return 'now you can program your bot to set a trap or move';
  };

  return (
    <div className={styles.container}>
      {/* Tutorial Instruction Text */}
      <div className={tutorialStyles.instructionBanner}>
        {getInstruction()}
      </div>

      {/* Final Move Button */}
      <button
        onClick={handleFinalMove}
        className={styles.finalMoveButton}
        aria-label="Complete board with final move"
        disabled={!canFinish}
        title={!canFinish ? 'Move your piece to the top row first' : 'Complete the board'}
      >
        Final Move
      </button>

      {/* Grid */}
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}
      >
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isAdjacent = adjacentPositions.some(
              (p) => p.row === rowIdx && p.col === colIdx
            );
            const bottomRow = boardSize - 1;
            const isStartChoice = phase === 'choosing-start' && rowIdx === bottomRow;
            const isEmpty = cell === 'empty';

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={styles.cell}
                aria-label={`Cell ${rowIdx},${colIdx}`}
              >
                {/* Show piece only at CURRENT position */}
                {piecePosition?.row === rowIdx && piecePosition?.col === colIdx && phase === 'building' && (
                  <div className={styles.cellPiece}>
                    <span className={styles.pieceIcon}>⚫</span>
                  </div>
                )}

                {/* Show trap */}
                {cell === 'trap' && (
                  <div className={styles.cellTrap}>
                    <span className={styles.trapIcon}>✖</span>
                  </div>
                )}

                {/* Show Start button */}
                {isEmpty && isStartChoice && (
                  <button
                    onClick={() => handleChooseStart(rowIdx, colIdx)}
                    className={styles.startButton}
                  >
                    Start
                  </button>
                )}

                {/* Show Move/Trap buttons */}
                {isAdjacent && phase === 'building' && !isTrapped && (
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleMove(rowIdx, colIdx)}
                      className={styles.moveButton}
                    >
                      Move
                    </button>
                    <button
                      onClick={() => handleTrap(rowIdx, colIdx)}
                      className={styles.trapButton}
                    >
                      Trap
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      {phase === 'building' && (
        <div className={styles.actions}>
          <button onClick={handleRestart} className={styles.restartButton}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
