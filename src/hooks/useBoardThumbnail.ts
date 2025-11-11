/**
 * Hook for on-demand board thumbnail generation
 * @module hooks/useBoardThumbnail
 */

import { useMemo } from 'react';
import type { Board } from '@/types';
import { generateBoardThumbnail } from '@/utils/svg-thumbnail';

/**
 * Generate board thumbnail on-demand with memoization
 *
 * Thumbnails are generated dynamically instead of being stored
 * to reduce localStorage usage. Memoization ensures we only
 * regenerate when the board changes.
 *
 * @param board - Board to generate thumbnail for
 * @returns Data URI string for the thumbnail SVG
 *
 * @example
 * ```tsx
 * const thumbnail = useBoardThumbnail(board);
 * return <img src={thumbnail} alt="Board thumbnail" />;
 * ```
 */
export function useBoardThumbnail(board: Board): string {
  return useMemo(() => {
    // For very large boards (>50x50), we could implement a simplified
    // thumbnail in the future to avoid performance issues
    // For now, generate full thumbnail for all sizes
    return generateBoardThumbnail(board);
  }, [board.id, board.grid, board.sequence, board.boardSize]);
}
