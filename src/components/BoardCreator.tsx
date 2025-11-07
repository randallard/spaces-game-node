/**
 * BoardCreator component for building game boards
 * @module components/BoardCreator
 */

import { useState, useCallback, type ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Board, CellContent, BoardMove, Position, BoardSize } from '@/types';
import { validateBoard } from '@/utils/board-validation';
import { generateBoardThumbnail } from '@/utils/svg-thumbnail';
import styles from './BoardCreator.module.css';

export interface BoardCreatorProps {
  /** Callback when board is saved */
  onBoardSaved: (board: Board) => void;
  /** Callback to cancel creation */
  onCancel: () => void;
  /** Existing boards (to generate name) */
  existingBoards?: Board[];
  /** Board size (2x2 or 3x3) */
  boardSize?: BoardSize;
}

type CreationPhase = 'choosing-start' | 'building';

/**
 * Board creator component with simplified guided flow.
 *
 * Flow:
 * 1. Click on bottom row to choose starting position
 * 2. Click "Move" on adjacent squares to move piece
 * 3. Click "Trap" on adjacent squares to place traps
 * 4. When piece reaches row 0, click "Final Move" to finish
 * 5. Board is automatically saved
 *
 * @component
 */
export function BoardCreator({
  onBoardSaved,
  onCancel,
  existingBoards = [],
  boardSize = 2,
}: BoardCreatorProps): ReactElement {
  // Create initial empty grid based on board size
  const createEmptyGrid = useCallback((size: number): CellContent[][] => {
    return Array(size).fill(null).map(() => Array(size).fill('empty'));
  }, []);

  const [phase, setPhase] = useState<CreationPhase>('choosing-start');
  const [grid, setGrid] = useState<CellContent[][]>(() => createEmptyGrid(boardSize));
  const [sequence, setSequence] = useState<BoardMove[]>([]);
  const [piecePosition, setPiecePosition] = useState<Position | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

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
  }, [boardSize]);

  /**
   * Handle choosing starting position (bottom row only)
   */
  const handleChooseStart = useCallback((row: number, col: number): void => {
    const bottomRow = boardSize - 1;
    if (row !== bottomRow) return; // Only allow bottom row

    const position: Position = { row, col };

    // Place piece on grid
    const newGrid = createEmptyGrid(boardSize);
    newGrid[row]![col] = 'piece';
    setGrid(newGrid);

    // Add to sequence
    const move: BoardMove = {
      position,
      type: 'piece',
      order: 1,
    };
    setSequence([move]);
    setPiecePosition(position);
    setPhase('building');
    setErrors([]);
  }, [boardSize, createEmptyGrid]);

  /**
   * Handle moving piece to adjacent square
   * NOTE: Grid must have pieces at ALL sequence positions (for validation)
   * Piece visually shows current position with highlight, but leaves "breadcrumbs"
   */
  const handleMove = useCallback((row: number, col: number): void => {
    if (!piecePosition) return;

    const position: Position = { row, col };

    // Update grid - add piece to new position (keep old ones for validation)
    const newGrid = grid.map((r, rIdx) =>
      r.map((cell, cIdx) => {
        // Add piece to new position
        if (rIdx === row && cIdx === col) {
          return 'piece';
        }
        return cell;
      })
    );
    setGrid(newGrid);

    // Add to sequence
    const nextOrder = sequence.length + 1;
    const move: BoardMove = {
      position,
      type: 'piece',
      order: nextOrder,
    };
    setSequence([...sequence, move]);
    setPiecePosition(position);
    setErrors([]);
  }, [piecePosition, grid, sequence]);

  /**
   * Handle placing trap on adjacent square
   * Trap replaces whatever is at that position (could be piece or empty)
   */
  const handleTrap = useCallback((row: number, col: number): void => {
    if (!piecePosition) return;

    const position: Position = { row, col };

    // Update grid - place trap (replaces piece if there was one)
    const newGrid = grid.map((r, rIdx) =>
      r.map((cell, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return 'trap';
        }
        return cell;
      })
    );
    setGrid(newGrid);

    // Add to sequence
    const nextOrder = sequence.length + 1;
    const move: BoardMove = {
      position,
      type: 'trap',
      order: nextOrder,
    };
    setSequence([...sequence, move]);
    setErrors([]);
  }, [piecePosition, grid, sequence]);

  /**
   * Handle final move (when piece is at row 0)
   * ADD a final move at row -1 (off the board, escaped!)
   */
  const handleFinalMove = useCallback((): void => {
    if (!piecePosition || piecePosition.row !== 0) return;

    // ADD a final move at row -1 (off the board)
    const nextOrder = sequence.length + 1;
    const finalMove: BoardMove = {
      position: { row: -1, col: piecePosition.col },
      type: 'final',
      order: nextOrder,
    };
    const finalSequence = [...sequence, finalMove];

    // Grid keeps all pieces at waypoints (no removal)
    const finalGrid = grid;

    // Auto-generate board name
    const boardNumber = existingBoards.length + 1;
    const boardName = `Board ${boardNumber}`;

    // Create board object
    const board: Board = {
      id: uuidv4(),
      name: boardName,
      boardSize,
      grid: finalGrid,
      sequence: finalSequence,
      thumbnail: '', // Will be set after validation
      createdAt: Date.now(),
    };

    // Validate
    const validation = validateBoard(board);
    console.log('[BoardCreator] Validation result:', validation);
    console.log('[BoardCreator] Final grid:', finalGrid);
    console.log('[BoardCreator] Sequence:', finalSequence);

    if (!validation.valid) {
      setErrors(validation.errors.map((e) => e.message));
      return;
    }

    // Generate thumbnail
    board.thumbnail = generateBoardThumbnail(board);

    // Auto-save
    onBoardSaved(board);
  }, [piecePosition, sequence, grid, existingBoards, onBoardSaved]);

  /**
   * Handle restart
   */
  const handleRestart = useCallback((): void => {
    setPhase('choosing-start');
    setGrid(createEmptyGrid(boardSize));
    setSequence([]);
    setPiecePosition(null);
    setErrors([]);
  }, [boardSize, createEmptyGrid]);

  // Get adjacent positions (for Move/Trap buttons)
  // Filter out positions with traps (can't place Move/Trap buttons there)
  const adjacentPositions = piecePosition
    ? getAdjacentPositions(piecePosition).filter((pos) => {
        const cell = grid[pos.row]?.[pos.col];
        return cell !== 'trap'; // Can place buttons on empty or piece squares
      })
    : [];
  const canFinish = piecePosition?.row === 0;

  // Get instruction text
  const getInstruction = (): string => {
    if (phase === 'choosing-start') {
      return 'Choose a starting square';
    }
    return 'Select an adjacent square to move your piece or place a trap.';
  };

  return (
    <div className={styles.container}>
      {/* Final Move Button (shows when piece at row 0) */}
      {canFinish && phase === 'building' && (
        <button
          onClick={handleFinalMove}
          className={styles.finalMoveButton}
          aria-label="Complete board with final move"
        >
          Final Move
        </button>
      )}

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

                {/* Show Start button (bottom row, choosing phase) */}
                {isEmpty && isStartChoice && (
                  <button
                    onClick={() => handleChooseStart(rowIdx, colIdx)}
                    className={styles.startButton}
                  >
                    Start
                  </button>
                )}

                {/* Show Move/Trap buttons (adjacent squares, building phase) */}
                {isAdjacent && phase === 'building' && (
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

      {/* Instruction */}
      <div className={styles.instruction}>{getInstruction()}</div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, idx) => (
            <div key={idx} className={styles.errorItem}>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        {phase === 'building' && (
          <button onClick={handleRestart} className={styles.restartButton}>
            Restart
          </button>
        )}
      </div>
    </div>
  );
}
