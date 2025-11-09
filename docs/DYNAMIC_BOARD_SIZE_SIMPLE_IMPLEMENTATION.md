# Simple Dynamic Board Size Implementation Plan

## Goal
Allow board sizes from 2x2 to 99x99 with minimal code changes.

## Core Principle
**YAGNI & KISS**: The existing code already handles dynamic sizes. We just need to remove the artificial restrictions.

## Current State
- Type: `BoardSize = 2 | 3` (artificial restriction)
- UI: Hardcoded buttons for 2 and 3
- Everything else: Already works with any size!
  - Grid rendering uses `.length`
  - CSS Grid is dynamic
  - SVG generation is flexible
  - Game simulation is size-agnostic

## Implementation (4-6 hours total)

### Step 1: Update Type (15 minutes)
```typescript
// src/types/board.ts
export type BoardSize = number; // That's it!

// Add simple validation
export const MIN_BOARD_SIZE = 2;
export const MAX_BOARD_SIZE = 99;

export function isValidBoardSize(size: number): boolean {
  return Number.isInteger(size) && size >= MIN_BOARD_SIZE && size <= MAX_BOARD_SIZE;
}
```

### Step 2: Update Board Size Selector (1 hour)
```typescript
// src/components/BoardSizeSelector.tsx

// Keep existing preset buttons for common sizes
// Add a simple number input for custom sizes

export function BoardSizeSelector({ onSizeSelected, onBack }: Props) {
  const [customSize, setCustomSize] = useState<string>('');

  const presetSizes = [2, 3, 4, 5, 8, 10, 15, 20]; // Common sizes

  return (
    <div>
      <h1>Choose Board Size</h1>

      {/* Preset buttons */}
      <div className={styles.presets}>
        {presetSizes.map(size => (
          <button key={size} onClick={() => onSizeSelected(size)}>
            {size}×{size}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className={styles.custom}>
        <input
          type="number"
          min="2"
          max="99"
          placeholder="Custom size (2-99)"
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
        />
        <button
          onClick={() => {
            const size = parseInt(customSize);
            if (isValidBoardSize(size)) {
              onSizeSelected(size);
            }
          }}
        >
          Use Custom Size
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Update Filter Components (30 minutes)
```typescript
// src/components/DeckCreator.tsx & SavedBoards.tsx

// Instead of individual buttons for each size, use ranges
type SizeFilter = 'all' | '2-5' | '6-10' | '11-20' | '21+' | number;

// Filter buttons:
// - All Sizes
// - Small (2-5)
// - Medium (6-10)
// - Large (11-20)
// - Extra Large (21+)
// - Specific size if there are many of one size
```

### Step 4: Update Data Migration (15 minutes)
```typescript
// src/utils/data-migrations.ts

function migrateBoardAddSize(board: any): any {
  if (!board || typeof board !== 'object') return board;

  // Accept any valid number now
  if (typeof board.boardSize === 'number' &&
      board.boardSize >= 2 &&
      board.boardSize <= 99) {
    return board;
  }

  // Infer from grid or default
  const gridSize = Array.isArray(board.grid) ? board.grid.length : 2;
  const validSize = Math.max(2, Math.min(99, gridSize));

  return { ...board, boardSize: validSize };
}
```

### Step 5: Simple CSS Adjustments (30 minutes)
```css
/* src/components/BoardCreator.module.css */

.cell {
  aspect-ratio: 1;
  /* Scale cell size based on grid size */
  min-height: max(20px, min(140px, calc(80vh / var(--grid-size))));

  /* Adjust content for smaller cells */
  font-size: max(8px, min(14px, calc(100% / 3)));
}

/* Simple breakpoints */
.grid[data-size="2"],
.grid[data-size="3"],
.grid[data-size="4"] {
  gap: 0.5rem;
}

.grid[data-size="5"],
.grid[data-size="6"],
.grid[data-size="7"],
.grid[data-size="8"],
.grid[data-size="9"],
.grid[data-size="10"] {
  gap: 0.25rem;
}

/* Anything larger */
.grid {
  gap: 2px;
}
```

### Step 6: Limit CPU Boards (15 minutes)
```typescript
// src/utils/default-cpu-data.ts

// Only generate CPU boards for reasonable sizes
export function generateDefaultBoards() {
  const boards = [];

  // Existing 2x2 and 3x3 boards
  boards.push(...existing2x2Boards());
  boards.push(...existing3x3Boards());

  // Maybe add a few 4x4 and 5x5 boards
  // But don't go crazy - users can make their own

  return boards;
}
```

### Step 7: Basic Testing (2-3 hours)
```typescript
// Test these scenarios:
// 1. Create a 10x10 board
// 2. Create a 50x50 board (check performance)
// 3. Create a 99x99 board (check if it works)
// 4. Save and load various sizes
// 5. Play a game with large boards
// 6. Check mobile experience

// If performance issues arise, address them then (YAGNI)
```

## What We're NOT Doing (YAGNI)

1. **Complex rendering optimizations** - The browser can handle it
2. **Virtual viewports** - Let users scroll/zoom normally
3. **Canvas/WebGL** - SVG and CSS Grid are fine
4. **Compression algorithms** - LocalStorage is big enough
5. **Progressive loading** - Not needed until proven otherwise
6. **Touch gesture controls** - Browser pinch/zoom works
7. **Dynamic CPU board generation** - Manual creation is fine
8. **Size categories** - Just use the number
9. **Performance monitoring** - Add if needed later
10. **Adaptive cell sizing algorithms** - CSS can handle it

## Potential Issues & Simple Solutions

### Issue: Large boards are hard to see
**Solution**: Users can zoom in/out with browser controls

### Issue: Creating 99x99 boards is tedious
**Solution**: That's fine - it's an edge case. Most will use smaller sizes.

### Issue: Performance on 99x99 boards
**Solution**: Test it first. If it's slow, add a warning. Optimize only if needed.

### Issue: Mobile experience with large boards
**Solution**: Let mobile browser handle it with pinch/zoom.

### Issue: Too many board sizes in filters
**Solution**: Use range filters (2-5, 6-10, etc.)

## Implementation Order

1. **Update BoardSize type** (15 min)
2. **Update BoardSizeSelector** (1 hour)
3. **Test with different sizes** (30 min)
4. **Fix any breaking issues** (1 hour)
5. **Update filters if needed** (30 min)
6. **Update migration** (15 min)
7. **Final testing** (1 hour)

**Total: 4-5 hours**

## Success Criteria

- Can create boards from 2x2 to 99x99
- Existing boards still work
- Game plays normally at any size
- No crashes or errors
- Reasonable performance up to 30x30
- It works, even if not perfect for extreme sizes

## Future (Only If Needed)

If users actually use large boards and complain about performance:
1. Add simple optimizations (disable animations for size > 30)
2. Add viewport limiting for size > 50
3. Add performance warnings

But don't build these until we know they're needed!

## Summary

The existing codebase already supports dynamic sizes. We just need to:
1. Remove the type restriction
2. Add a number input UI
3. Test it works

That's it. Keep it simple. Ship it. Optimize later if needed.

---

**Estimated Time**: 4-5 hours
**Complexity**: Low
**Risk**: Minimal