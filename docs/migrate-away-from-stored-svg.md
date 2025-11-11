# Migration Plan: Remove Stored SVG Thumbnails

## Overview

Currently, board thumbnails are generated once at creation time and stored in localStorage as data URIs. For large boards (especially with many moves), these thumbnails can consume 70%+ of the storage space per board.

This document outlines a plan to migrate from stored thumbnails to on-demand generation.

## Problem Statement

### Current Storage Usage

| Board Size | Moves | Total Size | Thumbnail Size | % Thumbnail |
|------------|-------|------------|----------------|-------------|
| 2×2 | 5 | ~2 KB | ~1 KB | 50% |
| 6×6 | 7 | ~5.7 KB | ~4.8 KB | 84% |
| 10×10 | 50+ | ~50 KB | ~35 KB | 70% |
| 99×99 | 19,606 | ~8 MB | ~5.5 MB | 69% |

### Issues
- Large boards (>10×10) consume significant localStorage space
- Maximum board (99×99) exceeds localStorage limits (5-10 MB)
- Thumbnail storage scales poorly with board size
- Cannot fit many large boards in localStorage

## Solution: On-Demand Thumbnail Generation

### Benefits
- **70% storage reduction** for typical boards
- **99×99 boards become viable** (~2.5 MB instead of 8 MB)
- Negligible performance impact (thumbnails render in <5ms)
- Already have generation functions (`generateBoardThumbnail`)

### Trade-offs
- Small CPU cost when rendering board lists (1-2ms per thumbnail)
- No visual impact (same SVG output)
- Simplifies data model (one less field to manage)

## Current State Analysis

### Where Thumbnails Are Used

**From localStorage (stored):**
1. `SavedBoards.tsx:295` - Board selection screen
   ```tsx
   <img src={board.thumbnail} alt="..." />
   ```

2. `DeckManager.tsx:147` - Deck management
   ```tsx
   <img src={board.thumbnail} alt="..." />
   ```

3. `DeckCreator.tsx:194` - Deck creation
   ```tsx
   <img src={board.thumbnail} alt="..." />
   ```

**Generated on-the-fly (not stored):**
- `GameOver.tsx` - Uses `generateOpponentThumbnail()` and `generateCombinedBoardSvg()`
- `AllRoundsResults.tsx` - Uses `generateOpponentThumbnail()` and `generateCombinedBoardSvg()`
- `RoundResults.tsx` - Uses `generateCombinedBoardSvg()`

### Where Thumbnails Are Generated

**Creation time (stored to localStorage):**
1. `BoardCreator.tsx:215`
   ```typescript
   board.thumbnail = generateBoardThumbnail(board);
   ```

2. `TutorialBoardCreator.tsx:191`
   ```typescript
   board.thumbnail = generateBoardThumbnail(board);
   ```

3. `default-cpu-data.ts` - CPU opponent default boards

### Available Generation Functions

From `src/utils/svg-thumbnail.ts`:
- `generateBoardThumbnail(board)` - Creates standard thumbnail
- `generateOpponentThumbnail(board, maxStep?)` - Creates rotated thumbnail
- `createBoardSvg(board, rotated, maxStep?)` - Internal SVG generator

## Implementation Plan

### Phase 1: Add On-Demand Generation Hook (1-2 hours)

Create a React hook for on-demand thumbnail generation with memoization.

**File: `src/hooks/useBoardThumbnail.ts`**
```typescript
import { useMemo } from 'react';
import type { Board } from '@/types';
import { generateBoardThumbnail } from '@/utils/svg-thumbnail';

/**
 * Generate board thumbnail on-demand with memoization
 *
 * Thumbnails are generated dynamically instead of being stored
 * to reduce localStorage usage. Memoization ensures we only
 * regenerate when the board changes.
 */
export function useBoardThumbnail(board: Board): string {
  return useMemo(() => {
    // Skip generation for very large boards to avoid performance issues
    if (board.boardSize > 50) {
      // Generate simplified thumbnail or placeholder
      return generateSimplifiedThumbnail(board);
    }

    return generateBoardThumbnail(board);
  }, [board.id, board.grid, board.sequence, board.boardSize]);
}

/**
 * Generate simplified thumbnail for very large boards
 * Shows grid outline only, no move markers
 */
function generateSimplifiedThumbnail(board: Board): string {
  // TODO: Implement simplified version
  // Just show grid cells, skip move numbers
  return generateBoardThumbnail(board);
}
```

### Phase 2: Update Components (2-3 hours)

Update all components that display thumbnails to use the hook.

**2.1. SavedBoards.tsx**
```typescript
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';

// Inside BoardCard component or map function
const BoardCard = ({ board }: { board: Board }) => {
  const thumbnail = useBoardThumbnail(board);

  return (
    <div className={styles.boardCard}>
      <div className={styles.boardThumbnail}>
        <img src={thumbnail} alt={`${board.name} thumbnail`} />
      </div>
      {/* ... rest of card */}
    </div>
  );
};
```

**2.2. DeckManager.tsx**
```typescript
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';

// Update mini thumbnail rendering
const MiniThumbnail = ({ board }: { board: Board }) => {
  const thumbnail = useBoardThumbnail(board);
  return <img src={thumbnail} alt={board.name} />;
};
```

**2.3. DeckCreator.tsx**
```typescript
import { useBoardThumbnail } from '@/hooks/useBoardThumbnail';

// Update available boards rendering
{availableBoards.map(board => {
  const thumbnail = useBoardThumbnail(board);
  return (
    <div key={board.id}>
      <img src={thumbnail} alt={board.name} />
    </div>
  );
})}
```

### Phase 3: Remove Thumbnail Generation at Creation (1 hour)

Stop generating and storing thumbnails when boards are created.

**3.1. BoardCreator.tsx**
```typescript
// REMOVE these lines:
// import { generateBoardThumbnail } from '@/utils/svg-thumbnail';
// board.thumbnail = generateBoardThumbnail(board);

const board: Board = {
  id: uuidv4(),
  name: boardName,
  boardSize,
  grid: finalGrid,
  sequence: finalSequence,
  thumbnail: '', // Keep field for backward compatibility, but always empty
  createdAt: Date.now(),
};
```

**3.2. TutorialBoardCreator.tsx**
```typescript
// REMOVE:
// import { generateBoardThumbnail } from '@/utils/svg-thumbnail';
// board.thumbnail = generateBoardThumbnail(board);

const board: Board = {
  id: uuidv4(),
  name: 'My First Board',
  boardSize,
  grid,
  sequence: finalSequence,
  thumbnail: '', // Empty, generated on-demand
  createdAt: Date.now(),
};
```

**3.3. default-cpu-data.ts**
```typescript
// Update createDefault2x2Boards and createDefault3x3Boards
const board: Board = {
  id: uuidv4(),
  name: `...`,
  boardSize: 2,
  grid: [...],
  sequence: [...],
  thumbnail: '', // No longer pre-generated
  createdAt: Date.now(),
};
```

### Phase 4: Data Migration (1-2 hours)

Add migration to clear thumbnails from existing boards in localStorage.

**File: `src/utils/data-migrations.ts`**
```typescript
/**
 * Migration: Remove stored thumbnails from boards
 * Thumbnails are now generated on-demand to save storage space
 */
export function migrateClearThumbnails(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  const obj = data as Record<string, unknown>;

  // Migrate user profile boards
  if ('boards' in obj && Array.isArray(obj.boards)) {
    obj.boards = obj.boards.map(board => ({
      ...board,
      thumbnail: '', // Clear stored thumbnail
    }));
  }

  // Migrate decks
  if ('decks' in obj && Array.isArray(obj.decks)) {
    obj.decks = obj.decks.map(deck => {
      if (deck && typeof deck === 'object' && 'boards' in deck) {
        return {
          ...deck,
          boards: (deck.boards as Board[]).map(board => ({
            ...board,
            thumbnail: '',
          })),
        };
      }
      return deck;
    });
  }

  // Migrate game state
  if ('playerSelectedDeck' in obj && obj.playerSelectedDeck) {
    const deck = obj.playerSelectedDeck as Deck;
    if (deck.boards) {
      deck.boards = deck.boards.map(board => ({
        ...board,
        thumbnail: '',
      }));
    }
  }

  if ('opponentSelectedDeck' in obj && obj.opponentSelectedDeck) {
    const deck = obj.opponentSelectedDeck as Deck;
    if (deck.boards) {
      deck.boards = deck.boards.map(board => ({
        ...board,
        thumbnail: '',
      }));
    }
  }

  console.log('[Migration] Cleared thumbnails from boards');
  return obj;
}
```

**Update migration runner:**
```typescript
export function runMigrations(data: unknown): unknown {
  let migrated = data;

  // Existing migrations...
  migrated = migrateBoardSize(migrated);

  // New migration
  migrated = migrateClearThumbnails(migrated);

  return migrated;
}
```

### Phase 5: Schema Updates (30 minutes)

Update TypeScript types and schemas to reflect that thumbnail is optional/empty.

**5.1. Update Board type documentation**
```typescript
// src/types/board.ts
export type Board = {
  id: string;
  name: string;
  boardSize: number;
  grid: CellContent[][];
  sequence: BoardMove[];
  thumbnail: string; // Deprecated: Always empty, generated on-demand via useBoardThumbnail()
  createdAt: number;
};
```

**5.2. Update schema**
```typescript
// src/schemas/board.schema.ts
export const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  boardSize: BoardSizeSchema,
  grid: GridSchema,
  sequence: z.array(BoardMoveSchema).min(2),
  thumbnail: z.string(), // Allow empty string, not validated
  createdAt: z.number(),
});
```

### Phase 6: Testing (2-3 hours)

**6.1. Unit Tests**

Update existing tests:
- `BoardCreator.test.tsx` - Remove thumbnail generation expectations
- `TutorialBoardCreator.test.tsx` - Remove thumbnail generation expectations
- `default-cpu-data.test.ts` - Remove thumbnail validation
- Add `useBoardThumbnail.test.ts` - Test the new hook

**6.2. Integration Tests**

Test scenarios:
1. Create new board → thumbnail displays correctly in SavedBoards
2. Load existing boards with stored thumbnails → migration clears them
3. Load boards in DeckManager → thumbnails generate correctly
4. Create deck with 10 boards → all thumbnails render
5. Large board (20×20) → thumbnail renders without lag
6. Very large board (99×99) → simplified thumbnail renders

**6.3. Performance Testing**

Measure:
- Time to render 50 boards in SavedBoards (should be <100ms)
- localStorage size before/after migration (should see 70% reduction)
- Memory usage with many boards displayed

### Phase 7: Documentation Updates (30 minutes)

**7.1. Update README or architecture docs**
- Explain thumbnail generation strategy
- Note storage savings
- Document useBoardThumbnail hook

**7.2. Update CHANGELOG**
```markdown
## [Version] - YYYY-MM-DD

### Changed
- **Storage Optimization**: Board thumbnails are now generated on-demand instead of being stored in localStorage
  - Reduces storage usage by ~70% for typical boards
  - Makes large boards (up to 99×99) viable within storage limits
  - Thumbnails are memoized for performance

### Migration
- Existing boards will have their stored thumbnails cleared on first load
- No user action required
```

## Testing Strategy

### Pre-Migration Testing
1. Export backup of current data
2. Verify all boards display correctly
3. Note current localStorage usage

### Post-Migration Testing
1. Verify migration runs successfully
2. Confirm thumbnails still display correctly
3. Verify localStorage reduction (should see 50-70% decrease)
4. Test creating new boards
5. Test performance with many boards
6. Test very large boards (20×20, 50×50)

### Performance Benchmarks

Target performance:
- Single thumbnail generation: <5ms
- 50 boards rendered: <100ms total
- No visual lag when scrolling through boards

## Rollback Plan

If issues arise:

1. **Immediate rollback**: Revert code changes
2. **Data recovery**: Thumbnails regenerate automatically on next board save
3. **No data loss**: Board data (grid, sequence) is unchanged

Migration is safe because:
- Only removes redundant data (thumbnails)
- Can be regenerated from board data
- Doesn't affect game functionality

## Implementation Timeline

| Phase | Time | Dependencies |
|-------|------|--------------|
| 1. Create hook | 1-2 hours | None |
| 2. Update components | 2-3 hours | Phase 1 |
| 3. Remove generation | 1 hour | Phase 2 |
| 4. Data migration | 1-2 hours | Phase 3 |
| 5. Schema updates | 30 min | Phase 4 |
| 6. Testing | 2-3 hours | All phases |
| 7. Documentation | 30 min | Phase 6 |
| **Total** | **8-12 hours** | |

## Future Optimizations

### Simplified Thumbnails for Large Boards
For boards >50×50, generate simplified thumbnails:
- Show grid outline only
- Omit individual move numbers
- Show start/end positions only
- Further reduces generation time

### Thumbnail Caching
Consider adding a component-level cache:
```typescript
const thumbnailCache = new Map<string, string>();

export function useBoardThumbnail(board: Board): string {
  const cacheKey = `${board.id}-${board.sequence.length}`;

  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  const thumbnail = generateBoardThumbnail(board);
  thumbnailCache.set(cacheKey, thumbnail);

  return thumbnail;
}
```

### Progressive Loading
For lists with many boards:
- Use Intersection Observer
- Generate thumbnails only when visible
- Lazy load off-screen thumbnails

## Success Criteria

✅ All existing functionality works identically
✅ Storage usage reduced by 50-70%
✅ 99×99 boards fit in localStorage
✅ No visible performance degradation
✅ All tests pass
✅ Migration runs successfully on existing data

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance degradation | Medium | Low | Memoization + benchmarking |
| Migration fails | High | Low | Extensive testing + rollback plan |
| Users lose data | High | Very Low | Only removes redundant data |
| Large boards still too slow | Medium | Low | Simplified thumbnail fallback |

## Notes

- Keep `thumbnail` field in Board type for now (backward compatibility)
- Field will always be empty string for new boards
- Migration clears field for existing boards
- Future: Could remove field entirely in major version bump
