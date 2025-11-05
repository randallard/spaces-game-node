/**
 * BoardCreator component for building game boards
 * @module components/BoardCreator
 */

import { useState, useCallback, type ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Board, CellContent, BoardMove, Position } from '@/types';
import { validateBoard } from '@/utils/board-validation';
import { generateBoardThumbnail } from '@/utils/svg-thumbnail';
import styles from './BoardCreator.module.css';

export interface BoardCreatorProps {
  /** Callback when board is saved */
  onBoardSaved: (board: Board) => void;
  /** Callback to cancel creation */
  onCancel: () => void;
  /** Existing board to edit (optional) */
  existingBoard?: Board | null;
}

type ToolMode = 'piece' | 'trap' | 'final' | 'erase';

/**
 * Board creator component with 2x2 grid editor.
 *
 * Features:
 * - 2x2 grid with clickable cells
 * - Place pieces, traps, and final move marker
 * - Sequence ordering (1, 2, 3, ...)
 * - Real-time validation
 * - SVG thumbnail generation
 * - Edit existing boards
 *
 * Rules:
 * - Exactly 1 piece (or 0 if final move exists)
 * - 0-3 traps
 * - 2-8 total sequence items
 * - Final move must be at row 0 (top row)
 *
 * @component
 */
export function BoardCreator({
  onBoardSaved,
  onCancel,
  existingBoard = null,
}: BoardCreatorProps): ReactElement {
  const [name, setName] = useState(existingBoard?.name || '');
  const [grid, setGrid] = useState<CellContent[][]>(
    existingBoard?.grid || [
      ['empty', 'empty'],
      ['empty', 'empty'],
    ]
  );
  const [sequence, setSequence] = useState<BoardMove[]>(
    existingBoard?.sequence || []
  );
  const [selectedTool, setSelectedTool] = useState<ToolMode>('piece');
  const [errors, setErrors] = useState<string[]>([]);

  /**
   * Handle cell click - place or remove content
   */
  const handleCellClick = useCallback(
    (row: number, col: number): void => {
      const position: Position = { row, col };

      // Check if cell already has content
      const currentContent = grid[row]?.[col];
      if (!currentContent) return;

      // If erasing
      if (selectedTool === 'erase') {
        if (currentContent !== 'empty') {
          // Remove from grid
          const newGrid = grid.map((r, rIdx) =>
            r.map((cell, cIdx) =>
              rIdx === row && cIdx === col ? 'empty' : cell
            )
          );
          setGrid(newGrid);

          // Remove from sequence
          const newSequence = sequence
            .filter((move) => !(move.position.row === row && move.position.col === col))
            .map((move, idx) => ({ ...move, order: idx + 1 })); // Reorder
          setSequence(newSequence);
        }
        return;
      }

      // Can't place on top of existing content (must erase first)
      if (currentContent !== 'empty') {
        return;
      }

      // Place new content
      let newContent: CellContent;
      let moveType: 'piece' | 'trap' | 'final';

      if (selectedTool === 'piece') {
        newContent = 'piece';
        moveType = 'piece';
      } else if (selectedTool === 'trap') {
        newContent = 'trap';
        moveType = 'trap';
      } else if (selectedTool === 'final') {
        // Final move must be at row 0
        if (row !== 0) {
          setErrors(['Final move must be placed at the top row (row 0)']);
          return;
        }
        newContent = 'empty'; // Final moves are not rendered in grid
        moveType = 'final';
      } else {
        return;
      }

      // Update grid (except for final moves)
      if (moveType !== 'final') {
        const newGrid = grid.map((r, rIdx) =>
          r.map((cell, cIdx) =>
            rIdx === row && cIdx === col ? newContent : cell
          )
        );
        setGrid(newGrid);
      }

      // Add to sequence
      const nextOrder = sequence.length + 1;
      const newMove: BoardMove = {
        position,
        type: moveType,
        order: nextOrder,
      };
      setSequence([...sequence, newMove]);
      setErrors([]);
    },
    [grid, sequence, selectedTool]
  );

  /**
   * Get sequence order for a cell
   */
  const getCellOrder = useCallback(
    (row: number, col: number): number | null => {
      const move = sequence.find(
        (m) => m.position.row === row && m.position.col === col
      );
      return move ? move.order : null;
    },
    [sequence]
  );

  /**
   * Handle save
   */
  const handleSave = useCallback((): void => {
    if (!name.trim()) {
      setErrors(['Board name is required']);
      return;
    }

    // Create board object
    const board: Board = {
      id: existingBoard?.id || uuidv4(),
      name: name.trim(),
      grid,
      sequence,
      thumbnail: '', // Will be set after validation
      createdAt: existingBoard?.createdAt || Date.now(),
    };

    // Validate
    const validation = validateBoard(board);
    if (!validation.valid) {
      setErrors(validation.errors.map((e) => e.message));
      return;
    }

    // Generate thumbnail
    board.thumbnail = generateBoardThumbnail(board);

    onBoardSaved(board);
  }, [name, grid, sequence, existingBoard, onBoardSaved]);

  /**
   * Handle clear
   */
  const handleClear = useCallback((): void => {
    setGrid([
      ['empty', 'empty'],
      ['empty', 'empty'],
    ]);
    setSequence([]);
    setErrors([]);
  }, []);

  // Count pieces and traps
  const pieceCount = grid.flat().filter((c) => c === 'piece').length;
  const trapCount = grid.flat().filter((c) => c === 'trap').length;
  const finalMoveCount = sequence.filter((m) => m.type === 'final').length;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {existingBoard ? 'Edit Board' : 'Create New Board'}
      </h2>

      {/* Board Name */}
      <div className={styles.section}>
        <label htmlFor="board-name" className={styles.label}>
          Board Name
        </label>
        <input
          id="board-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Enter board name"
          maxLength={50}
        />
      </div>

      {/* Tool Selection */}
      <div className={styles.section}>
        <div className={styles.toolLabel}>Select Tool</div>
        <div className={styles.toolGrid}>
          <button
            onClick={() => setSelectedTool('piece')}
            className={`${styles.toolButton} ${selectedTool === 'piece' ? styles.toolButtonActive : ''}`}
            aria-label="Place piece"
          >
            <span className={styles.toolIcon}>⚫</span>
            <span className={styles.toolName}>Piece</span>
          </button>
          <button
            onClick={() => setSelectedTool('trap')}
            className={`${styles.toolButton} ${selectedTool === 'trap' ? styles.toolButtonActive : ''}`}
            aria-label="Place trap"
          >
            <span className={styles.toolIcon}>✖</span>
            <span className={styles.toolName}>Trap</span>
          </button>
          <button
            onClick={() => setSelectedTool('final')}
            className={`${styles.toolButton} ${selectedTool === 'final' ? styles.toolButtonActive : ''}`}
            aria-label="Place final move"
          >
            <span className={styles.toolIcon}>🎯</span>
            <span className={styles.toolName}>Final</span>
          </button>
          <button
            onClick={() => setSelectedTool('erase')}
            className={`${styles.toolButton} ${selectedTool === 'erase' ? styles.toolButtonActive : ''}`}
            aria-label="Erase"
          >
            <span className={styles.toolIcon}>🗑️</span>
            <span className={styles.toolName}>Erase</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.section}>
        <div className={styles.gridLabel}>Board Grid (2x2)</div>
        <div className={styles.grid}>
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const order = getCellOrder(rowIdx, colIdx);
              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  className={styles.cell}
                  aria-label={`Cell ${rowIdx},${colIdx}`}
                >
                  {cell === 'piece' && (
                    <div className={styles.cellPiece}>
                      <span className={styles.cellIcon}>⚫</span>
                      {order && <span className={styles.cellOrder}>{order}</span>}
                    </div>
                  )}
                  {cell === 'trap' && (
                    <div className={styles.cellTrap}>
                      <span className={styles.cellIcon}>✖</span>
                      {order && <span className={styles.cellOrder}>{order}</span>}
                    </div>
                  )}
                  {cell === 'empty' && (
                    <div className={styles.cellEmpty}>
                      {order && (
                        <div className={styles.cellFinal}>
                          <span className={styles.cellIcon}>🎯</span>
                          <span className={styles.cellOrder}>{order}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className={styles.gridHint}>
          Row 0 (top) is where pieces can reach the goal
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Pieces:</span>
          <span className={styles.statValue}>
            {pieceCount} / 1
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Traps:</span>
          <span className={styles.statValue}>
            {trapCount} / 3
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Sequence:</span>
          <span className={styles.statValue}>
            {sequence.length} (2-8)
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Final Moves:</span>
          <span className={styles.statValue}>{finalMoveCount}</span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className={styles.errors}>
          <div className={styles.errorTitle}>Validation Errors:</div>
          <ul className={styles.errorList}>
            {errors.map((error, idx) => (
              <li key={idx} className={styles.errorItem}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button onClick={handleClear} className={styles.clearButton}>
          Clear Board
        </button>
        <button onClick={handleSave} className={styles.saveButton}>
          {existingBoard ? 'Save Changes' : 'Save Board'}
        </button>
      </div>
    </div>
  );
}
