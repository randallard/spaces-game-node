/**
 * BoardCreator component for building game boards
 * @module components/BoardCreator
 */

import { useState, useCallback, useEffect, useMemo, type ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Board, CellContent, BoardMove, Position, BoardSize } from '@/types';
import { validateBoard } from '@/utils/board-validation';
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';
import styles from './BoardCreator.module.css';

/**
 * Confirmation modal component to avoid hooks issues
 */
interface ConfirmationModalProps {
  board: Board;
  usedAllTheWay: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({ board, usedAllTheWay, onConfirm, onCancel }: ConfirmationModalProps): ReactElement {
  const thumbnail = useBoardThumbnail(board);

  return (
    <div className={styles.confirmationModal}>
      <div className={styles.confirmationContent}>
        <h2 className={styles.confirmationTitle}>Board Complete!</h2>
        <p className={styles.confirmationSubtitle}>
          {board.name} • {board.sequence.length} moves
        </p>

        <div className={styles.confirmationThumbnail}>
          <img
            src={thumbnail}
            alt={`${board.name} preview`}
            className={styles.thumbnailPreview}
          />
        </div>

        <div className={styles.confirmationActions}>
          <button
            onClick={onCancel}
            className={styles.confirmationCancel}
          >
            {usedAllTheWay ? 'Back to Before "All the Way"' : 'Back to Edit'}
          </button>
          <button
            onClick={onConfirm}
            className={styles.confirmationConfirm}
          >
            Save Board
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Existing boards sidebar component
 */
interface ExistingBoardsSidebarProps {
  boards: Board[];
  currentBoardSize: BoardSize;
}

function ExistingBoardsSidebar({ boards, currentBoardSize }: ExistingBoardsSidebarProps): ReactElement | null {
  // Filter boards by current size
  const relevantBoards = boards.filter(b => b.boardSize === currentBoardSize);

  // Don't show if no relevant boards
  if (relevantBoards.length === 0) {
    return null;
  }

  return (
    <div className={styles.existingBoardsSidebar}>
      <h3 className={styles.sidebarTitle}>
        Your {currentBoardSize}×{currentBoardSize} Boards ({relevantBoards.length})
      </h3>
      <div className={styles.sidebarBoards}>
        {relevantBoards.map(board => (
          <ExistingBoardThumbnail key={board.id} board={board} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual board thumbnail in sidebar
 */
interface ExistingBoardThumbnailProps {
  board: Board;
}

function ExistingBoardThumbnail({ board }: ExistingBoardThumbnailProps): ReactElement {
  const thumbnail = useBoardThumbnail(board);

  return (
    <div className={styles.sidebarBoardItem}>
      <img
        src={thumbnail}
        alt={board.name}
        className={styles.sidebarBoardThumbnail}
      />
      <div className={styles.sidebarBoardInfo}>
        <div className={styles.sidebarBoardName}>{board.name}</div>
        <div className={styles.sidebarBoardMoves}>{board.sequence.length} moves</div>
      </div>
    </div>
  );
}

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

type CreationPhase = 'choosing-start' | 'building' | 'confirming';

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
  const [selectedStartColumn, setSelectedStartColumn] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'full' | 'section'>('full');
  const [completedBoard, setCompletedBoard] = useState<Board | null>(null);
  const [usedAllTheWay, setUsedAllTheWay] = useState<boolean>(false);
  // Save state before finish for potential undo
  const [beforeFinishState, setBeforeFinishState] = useState<{
    grid: CellContent[][];
    sequence: BoardMove[];
    piecePosition: Position | null;
  } | null>(null);

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
   * Handle placing trap on adjacent square OR at current position (supermove)
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

    // If trap placed at current position, piece stays there (supermove - wait action)
    // piecePosition doesn't change, so next move will be from same spot
  }, [piecePosition, grid, sequence]);

  // Check if there's a trap blocking the path upward to finish
  const hasTrapAbove = useMemo(() => {
    if (!piecePosition) return false;
    const col = piecePosition.col;
    // Check all rows above the current position for traps
    for (let row = piecePosition.row - 1; row >= 0; row--) {
      if (grid[row]?.[col] === 'trap') {
        return true;
      }
    }
    return false;
  }, [piecePosition, grid]);

  /**
   * Handle final move (when piece is at row 0)
   * ADD a final move at row -1 (off the board, escaped!)
   */
  /**
   * Handle "all the way to finish" - move straight up to row 0, then finish
   */
  const handleAllTheWayToFinish = useCallback((): void => {
    if (!piecePosition || hasTrapAbove) return;

    // Save state before "All the Way to Finish" for potential undo
    setBeforeFinishState({
      grid: grid.map(row => [...row]),
      sequence: [...sequence],
      piecePosition: { ...piecePosition },
    });

    let currentRow = piecePosition.row;
    const col = piecePosition.col;
    let newSequence = [...sequence];
    const newGrid = grid.map(row => [...row]);

    // Move up to row 0, adding pieces along the way
    while (currentRow > 0) {
      currentRow--;
      const nextOrder = newSequence.length + 1;
      newSequence.push({
        position: { row: currentRow, col },
        type: 'piece',
        order: nextOrder,
      });
      newGrid[currentRow]![col] = 'piece';
    }

    // Add final move
    const finalOrder = newSequence.length + 1;
    newSequence.push({
      position: { row: -1, col },
      type: 'final',
      order: finalOrder,
    });

    setSequence(newSequence);
    setGrid(newGrid);
    setPiecePosition({ row: 0, col });

    // Auto-generate board name
    const boardNumber = existingBoards.length + 1;
    const boardName = `Board ${boardNumber}`;

    // Create board object
    const board: Board = {
      id: uuidv4(),
      name: boardName,
      boardSize,
      grid: newGrid,
      sequence: newSequence,
      thumbnail: '',
      createdAt: Date.now(),
    };

    // Validate
    const validation = validateBoard(board);
    if (!validation.valid) {
      setErrors(validation.errors.map((e) => e.message));
      return;
    }

    // Show confirmation modal
    setCompletedBoard(board);
    setUsedAllTheWay(true);
    setPhase('confirming');
  }, [piecePosition, sequence, grid, boardSize, hasTrapAbove, existingBoards]);

  const handleFinalMove = useCallback((): void => {
    if (!piecePosition || piecePosition.row !== 0) return;

    // Save state before final move for potential undo
    setBeforeFinishState({
      grid: grid.map(row => [...row]),
      sequence: [...sequence],
      piecePosition: { ...piecePosition },
    });

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

    // Thumbnail will be generated on-demand when displayed
    board.thumbnail = '';

    // Show confirmation modal
    setCompletedBoard(board);
    setUsedAllTheWay(false);
    setPhase('confirming');
  }, [piecePosition, sequence, grid, existingBoards, boardSize]);

  /**
   * Handle confirm board from modal
   */
  const handleConfirmBoard = useCallback((): void => {
    if (!completedBoard) return;
    onBoardSaved(completedBoard);
  }, [completedBoard, onBoardSaved]);

  /**
   * Handle cancel from confirmation modal
   */
  const handleCancelConfirmation = useCallback((): void => {
    if (beforeFinishState) {
      // Restore state from before finishing (works for both regular and "All the Way")
      setGrid(beforeFinishState.grid);
      setSequence(beforeFinishState.sequence);
      setPiecePosition(beforeFinishState.piecePosition);
      setBeforeFinishState(null);
    }

    setCompletedBoard(null);
    setUsedAllTheWay(false);
    setPhase('building');
  }, [beforeFinishState]);

  /**
   * Handle restart
   */
  const handleRestart = useCallback((): void => {
    setPhase('choosing-start');
    setGrid(createEmptyGrid(boardSize));
    setSequence([]);
    setPiecePosition(null);
    setErrors([]);
    setSelectedStartColumn(0);
    setCompletedBoard(null);
    setUsedAllTheWay(false);
    setBeforeFinishState(null);
  }, [boardSize, createEmptyGrid]);

  /**
   * Handle undo - remove last move and rebuild grid
   */
  const handleUndo = useCallback((): void => {
    if (sequence.length === 0) return;

    // Remove last move
    const newSequence = sequence.slice(0, -1);
    setSequence(newSequence);

    // If no moves left, reset to choosing phase
    if (newSequence.length === 0) {
      setPhase('choosing-start');
      setGrid(createEmptyGrid(boardSize));
      setPiecePosition(null);
      setErrors([]);
      return;
    }

    // Rebuild grid from sequence
    const newGrid = createEmptyGrid(boardSize);
    let lastPiecePos: Position | null = null;

    newSequence.forEach((move) => {
      if (move.type === 'piece') {
        newGrid[move.position.row]![move.position.col] = 'piece';
        lastPiecePos = move.position;
      } else if (move.type === 'trap') {
        newGrid[move.position.row]![move.position.col] = 'trap';
      }
    });

    setGrid(newGrid);
    setPiecePosition(lastPiecePos);
    setErrors([]);
  }, [sequence, boardSize, createEmptyGrid]);

  /**
   * Handle start column selector
   */
  const handleStartColumnChange = useCallback((col: number): void => {
    setSelectedStartColumn(col);
  }, []);

  /**
   * Handle confirm start position using selector
   */
  const handleConfirmStart = useCallback((): void => {
    const bottomRow = boardSize - 1;
    handleChooseStart(bottomRow, selectedStartColumn);
  }, [boardSize, selectedStartColumn, handleChooseStart]);

  /**
   * Get available directional moves from current position
   */
  const getDirectionalMoves = useCallback((): {
    up: Position | null;
    down: Position | null;
    left: Position | null;
    right: Position | null;
  } => {
    if (!piecePosition) {
      return { up: null, down: null, left: null, right: null };
    }

    const { row, col } = piecePosition;
    const result = {
      up: row > 0 ? { row: row - 1, col } : null,
      down: row < boardSize - 1 ? { row: row + 1, col } : null,
      left: col > 0 ? { row, col: col - 1 } : null,
      right: col < boardSize - 1 ? { row, col: col + 1 } : null,
    };

    // Filter out positions with traps
    if (result.up && grid[result.up.row]?.[result.up.col] === 'trap') result.up = null;
    if (result.down && grid[result.down.row]?.[result.down.col] === 'trap') result.down = null;
    if (result.left && grid[result.left.row]?.[result.left.col] === 'trap') result.left = null;
    if (result.right && grid[result.right.row]?.[result.right.col] === 'trap') result.right = null;

    return result;
  }, [piecePosition, boardSize, grid]);

  // Get adjacent positions (for Move/Trap buttons)
  // Filter out positions with traps (can't place Move/Trap buttons there)
  const adjacentPositions = piecePosition
    ? getAdjacentPositions(piecePosition).filter((pos) => {
        const cell = grid[pos.row]?.[pos.col];
        return cell !== 'trap'; // Can place buttons on empty or piece squares
      })
    : [];
  const canFinish = piecePosition?.row === 0;
  const canFinishAllTheWay = piecePosition && !hasTrapAbove;

  // Get directional moves for control buttons
  const directionalMoves = getDirectionalMoves();

  // Keyboard controls for choosing start (Enter to confirm)
  useEffect(() => {
    if (phase !== 'choosing-start') return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Ignore if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle Enter key to confirm start position
      if (key === 'enter') {
        event.preventDefault();
        handleConfirmStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleConfirmStart]);

  // Keyboard controls (WASD for move, Shift+WASD for trap, Enter for final move)
  useEffect(() => {
    if (phase !== 'building') return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Ignore if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle Enter key for final move
      if (key === 'enter' && canFinish) {
        event.preventDefault();
        handleFinalMove();
        return;
      }

      // Handle Shift+X for "Trap Here" at current position
      if (key === 'x' && event.shiftKey && piecePosition) {
        event.preventDefault();
        handleTrap(piecePosition.row, piecePosition.col);
        return;
      }

      const isTrap = event.shiftKey;
      let targetPosition: Position | null = null;

      switch (key) {
        case 'w':
          targetPosition = directionalMoves.up;
          break;
        case 'a':
          targetPosition = directionalMoves.left;
          break;
        case 's':
          targetPosition = directionalMoves.down;
          break;
        case 'd':
          targetPosition = directionalMoves.right;
          break;
        default:
          return;
      }

      if (targetPosition) {
        event.preventDefault();
        if (isTrap) {
          handleTrap(targetPosition.row, targetPosition.col);
        } else {
          handleMove(targetPosition.row, targetPosition.col);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, directionalMoves, handleMove, handleTrap, canFinish, handleFinalMove, piecePosition]);

  // Get instruction text
  const getInstruction = (): string => {
    if (phase === 'choosing-start') {
      return 'Choose a starting column below or click a Start button in the bottom row';
    }
    return 'Use WASD keys, the controls below, or click buttons on the board to move your piece or place traps (Shift+WASD for traps)';
  };

  // Calculate visible section for section view
  const getSectionBounds = (): { startRow: number; endRow: number; startCol: number; endCol: number } => {
    if (viewMode === 'full' || !piecePosition) {
      return { startRow: 0, endRow: boardSize, startCol: 0, endCol: boardSize };
    }

    // Section view shows 7x7 window centered on piece (or less for smaller boards)
    const windowSize = Math.min(7, boardSize);
    const halfWindow = Math.floor(windowSize / 2);

    let startRow = piecePosition.row - halfWindow;
    let endRow = piecePosition.row + halfWindow + 1;
    let startCol = piecePosition.col - halfWindow;
    let endCol = piecePosition.col + halfWindow + 1;

    // Adjust if out of bounds
    if (startRow < 0) {
      endRow = Math.min(boardSize, endRow + (-startRow));
      startRow = 0;
    }
    if (endRow > boardSize) {
      startRow = Math.max(0, startRow - (endRow - boardSize));
      endRow = boardSize;
    }
    if (startCol < 0) {
      endCol = Math.min(boardSize, endCol + (-startCol));
      startCol = 0;
    }
    if (endCol > boardSize) {
      startCol = Math.max(0, startCol - (endCol - boardSize));
      endCol = boardSize;
    }

    return { startRow, endRow, startCol, endCol };
  };

  const sectionBounds = getSectionBounds();
  const visibleRows = grid.slice(sectionBounds.startRow, sectionBounds.endRow);
  const visibleGrid = visibleRows.map(row => row.slice(sectionBounds.startCol, sectionBounds.endCol));
  const visibleSize = viewMode === 'section' ? Math.max(visibleGrid.length, visibleGrid[0]?.length || 0) : boardSize;

  // Show confirmation modal
  if (phase === 'confirming' && completedBoard) {
    return (
      <ConfirmationModal
        board={completedBoard}
        usedAllTheWay={usedAllTheWay}
        onConfirm={handleConfirmBoard}
        onCancel={handleCancelConfirmation}
      />
    );
  }

  return (
    <div className={styles.creatorLayout}>
      {/* Sidebar with existing boards (only shown on wider screens) */}
      <ExistingBoardsSidebar boards={existingBoards} currentBoardSize={boardSize} />

      <div className={styles.container}>
      {/* Final Move Button (always visible, disabled until piece reaches row 0) */}
      <button
        onClick={handleFinalMove}
        className={styles.finalMoveButton}
        aria-label="Complete board with final move"
        disabled={!canFinish}
        title={!canFinish ? 'Move your piece to the top row first' : 'Complete the board (Enter)'}
      >
        Final Move
      </button>

      {/* View Mode Toggle */}
      {boardSize > 7 && phase === 'building' && (
        <button
          onClick={() => setViewMode(viewMode === 'full' ? 'section' : 'full')}
          className={styles.viewToggleButton}
          title={viewMode === 'full' ? 'Switch to section view' : 'Switch to full view'}
        >
          {viewMode === 'full' ? 'Section View' : 'Full View'}
        </button>
      )}

      {/* Grid Container with Labels */}
      <div className={viewMode === 'section' ? styles.gridWithLabels : ''}>
        {/* Column Labels (top) */}
        {viewMode === 'section' && (
          <div className={styles.columnLabels} style={{ gridTemplateColumns: `auto repeat(${visibleSize}, 1fr)` }}>
            <div className={styles.cornerLabel}></div>
            {Array.from({ length: sectionBounds.endCol - sectionBounds.startCol }).map((_, idx) => (
              <div key={idx} className={styles.columnLabel}>
                {sectionBounds.startCol + idx}
              </div>
            ))}
          </div>
        )}

        {/* Grid with Row Labels */}
        <div className={styles.gridRow}>
          {/* Row Labels (left) */}
          {viewMode === 'section' && (
            <div className={styles.rowLabels}>
              {Array.from({ length: sectionBounds.endRow - sectionBounds.startRow }).map((_, idx) => (
                <div key={idx} className={styles.rowLabel}>
                  {sectionBounds.startRow + idx}
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${visibleSize}, 1fr)` }}
          >
            {visibleGrid.map((row, visibleRowIdx) =>
              row.map((cell, visibleColIdx) => {
                const rowIdx = sectionBounds.startRow + visibleRowIdx;
                const colIdx = sectionBounds.startCol + visibleColIdx;
            const isAdjacent = adjacentPositions.some(
              (p) => p.row === rowIdx && p.col === colIdx
            );
            const bottomRow = boardSize - 1;
            const isStartChoice = phase === 'choosing-start' && rowIdx === bottomRow;
            const isEmpty = cell === 'empty';
            const isSelectedStartColumn = colIdx === selectedStartColumn;
            const useLargeBoard = boardSize > 9;

            // Find moves at this position - separate for pieces and traps
            const pieceAtPosition = sequence.find(
              (m) => m.position.row === rowIdx && m.position.col === colIdx && m.type === 'piece'
            );
            const trapAtPosition = sequence.find(
              (m) => m.position.row === rowIdx && m.position.col === colIdx && m.type === 'trap'
            );
            const isCurrentPiece = piecePosition?.row === rowIdx && piecePosition?.col === colIdx && phase === 'building';

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`${styles.cell} ${
                  isEmpty && isStartChoice && useLargeBoard
                    ? isSelectedStartColumn
                      ? styles.cellStartHighlighted
                      : styles.cellStartClickable
                    : ''
                }`}
                aria-label={`Cell ${rowIdx},${colIdx}`}
                onClick={
                  isEmpty && isStartChoice && useLargeBoard
                    ? () => handleChooseStart(rowIdx, colIdx)
                    : undefined
                }
                style={{
                  cursor: isEmpty && isStartChoice && useLargeBoard ? 'pointer' : undefined,
                }}
              >
                {/* Show trap with number (if present) - rendered UNDER piece */}
                {trapAtPosition && (
                  <div className={styles.cellTrap}>
                    <svg viewBox="0 0 40 40" className={styles.trapIcon}>
                      <path d="M5 5 l30 30 m0 -30 l-30 30" stroke="#f5222d" strokeWidth="4" opacity="0.7" />
                      <text x="35" y="20" fontSize="14" fill="#f5222d" textAnchor="middle" dy=".3em" fontWeight="bold">
                        {trapAtPosition.order}
                      </text>
                    </svg>
                  </div>
                )}

                {/* Show piece with number (rendered ON TOP of trap if both present) */}
                {pieceAtPosition && (
                  <div className={`${styles.cellPiece} ${isCurrentPiece ? styles.cellPieceCurrent : ''}`}>
                    <svg viewBox="0 0 40 40" className={styles.pieceIcon}>
                      <circle cx="20" cy="20" r="15" fill="#4a90e2" />
                      <text x="20" y="20" fontSize="16" fill="white" textAnchor="middle" dy=".3em">
                        {pieceAtPosition.order}
                      </text>
                    </svg>
                  </div>
                )}

                {/* Show Trap Here button on current piece (supermove - small boards only) */}
                {isCurrentPiece && phase === 'building' && !useLargeBoard && !trapAtPosition && (
                  <button
                    onClick={() => handleTrap(rowIdx, colIdx)}
                    className={styles.trapHereButton}
                    title="Place trap at current position (Shift+X)"
                  >
                    Trap Here
                  </button>
                )}

                {/* Show clickable overlay for trap on current piece (large boards only) */}
                {isCurrentPiece && phase === 'building' && useLargeBoard && !trapAtPosition && (
                  <div
                    className={styles.trapHereOverlay}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrap(rowIdx, colIdx);
                    }}
                    title="Click to place trap at current position (Shift+X)"
                  />
                )}

                {/* Show Start button (bottom row, choosing phase, small boards only) */}
                {isEmpty && isStartChoice && !useLargeBoard && (
                  <button
                    onClick={() => handleChooseStart(rowIdx, colIdx)}
                    className={`${styles.startButton} ${isSelectedStartColumn ? styles.startButtonHighlighted : ''}`}
                  >
                    Start
                  </button>
                )}

                {/* Show Move/Trap buttons (adjacent squares, building phase, small boards) */}
                {isAdjacent && phase === 'building' && !useLargeBoard && (
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

                {/* Show split Move/Trap cell (adjacent squares, building phase, large boards) */}
                {isAdjacent && phase === 'building' && useLargeBoard && (
                  <div className={styles.splitCell}>
                    <div
                      className={styles.splitCellMove}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(rowIdx, colIdx);
                      }}
                      title="Move (W/A/S/D)"
                    />
                    <div
                      className={styles.splitCellTrap}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrap(rowIdx, colIdx);
                      }}
                      title="Trap (Shift+W/A/S/D)"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className={styles.controls}>
        {/* Start Column Selector (choosing-start phase) */}
        {phase === 'choosing-start' && (
          <div className={styles.startControls}>
            <label htmlFor="start-column" className={styles.controlLabel}>
              Start in column:
            </label>
            <div className={styles.columnSpinner}>
              <input
                id="start-column"
                type="number"
                min={0}
                max={boardSize - 1}
                value={selectedStartColumn}
                onChange={(e) => handleStartColumnChange(parseInt(e.target.value, 10))}
                className={styles.spinnerInput}
                aria-label="Select start column"
              />
            </div>
            <button
              onClick={handleConfirmStart}
              className={styles.confirmButton}
              title="Confirm start position (Enter)"
            >
              Confirm Start
            </button>
          </div>
        )}

        {/* Directional Controls (building phase) */}
        {phase === 'building' && (
          <div className={styles.directionalControls}>
            <div className={styles.directionalGrid}>
              {/* Top row */}
              <div className={styles.dirControlEmpty}></div>
              <div className={styles.dirControlGroupThree}>
                <button
                  onClick={handleAllTheWayToFinish}
                  disabled={!canFinishAllTheWay}
                  className={`${styles.dirButtonSmall} ${styles.dirButtonFinish}`}
                  title={!canFinishAllTheWay ? 'Cannot finish - trap in the way or not yet started' : 'Move all the way up and finish'}
                >
                  All the Way to Finish
                </button>
                <button
                  onClick={() => directionalMoves.up && handleMove(directionalMoves.up.row, directionalMoves.up.col)}
                  disabled={!directionalMoves.up}
                  className={styles.dirButtonSmall}
                  title="Move Up (W)"
                >
                  Move ↑
                </button>
                <button
                  onClick={() => directionalMoves.up && handleTrap(directionalMoves.up.row, directionalMoves.up.col)}
                  disabled={!directionalMoves.up}
                  className={`${styles.dirButtonSmall} ${styles.dirButtonTrap}`}
                  title="Trap Up (Shift+W)"
                >
                  Trap ↑
                </button>
              </div>
              <div className={styles.dirControlEmpty}></div>

              {/* Middle row */}
              <div className={styles.dirControlGroup}>
                <button
                  onClick={() => directionalMoves.left && handleMove(directionalMoves.left.row, directionalMoves.left.col)}
                  disabled={!directionalMoves.left}
                  className={styles.dirButton}
                  title="Move Left (A)"
                >
                  Move ←
                </button>
                <button
                  onClick={() => directionalMoves.left && handleTrap(directionalMoves.left.row, directionalMoves.left.col)}
                  disabled={!directionalMoves.left}
                  className={`${styles.dirButton} ${styles.dirButtonTrap}`}
                  title="Trap Left (Shift+A)"
                >
                  Trap ←
                </button>
              </div>
              <div className={styles.dirControlCenter}>
                <button
                  onClick={handleFinalMove}
                  disabled={!canFinish}
                  className={styles.dirFinishButton}
                  title={!canFinish ? 'Move your piece to the top row first' : 'Complete the board (Enter)'}
                >
                  Finish
                </button>
              </div>
              <div className={styles.dirControlGroup}>
                <button
                  onClick={() => directionalMoves.right && handleMove(directionalMoves.right.row, directionalMoves.right.col)}
                  disabled={!directionalMoves.right}
                  className={styles.dirButton}
                  title="Move Right (D)"
                >
                  Move →
                </button>
                <button
                  onClick={() => directionalMoves.right && handleTrap(directionalMoves.right.row, directionalMoves.right.col)}
                  disabled={!directionalMoves.right}
                  className={`${styles.dirButton} ${styles.dirButtonTrap}`}
                  title="Trap Right (Shift+D)"
                >
                  Trap →
                </button>
              </div>

              {/* Bottom row */}
              <div className={styles.dirControlEmpty}></div>
              <div className={styles.dirControlGroup}>
                <button
                  onClick={() => directionalMoves.down && handleMove(directionalMoves.down.row, directionalMoves.down.col)}
                  disabled={!directionalMoves.down}
                  className={styles.dirButton}
                  title="Move Down (S)"
                >
                  Move ↓
                </button>
                <button
                  onClick={() => directionalMoves.down && handleTrap(directionalMoves.down.row, directionalMoves.down.col)}
                  disabled={!directionalMoves.down}
                  className={`${styles.dirButton} ${styles.dirButtonTrap}`}
                  title="Trap Down (Shift+S)"
                >
                  Trap ↓
                </button>
              </div>
              <div className={styles.dirControlEmpty}></div>
            </div>
          </div>
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
          <>
            <button
              onClick={handleUndo}
              className={styles.undoButton}
              disabled={sequence.length === 0}
              title={sequence.length === 0 ? 'Nothing to undo' : 'Undo last move'}
            >
              Undo
            </button>
            <button onClick={handleRestart} className={styles.restartButton}>
              Restart
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
