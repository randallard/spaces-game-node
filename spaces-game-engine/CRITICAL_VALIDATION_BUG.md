# 🚨 CRITICAL: Movement Validation Missing

## Issue Discovered

**Reporter:** User (excellent catch!)
**Date:** 2026-01-28
**Severity:** HIGH

## Problem

Both the **main game** and **extracted engine** are missing validation for diagonal moves.

### Example Invalid Board (Currently Passes Validation!)

```typescript
{
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['trap', 'piece']
  ],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },  // Start at (1,1)
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },  // ❌ DIAGONAL MOVE! (1,1) → (0,0)
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
}
```

**This board should FAIL validation but currently PASSES!**

## Game Rules (from BoardCreator.tsx:170)

> "orthogonal only: up, down, left, right"

**Allowed moves:**
- Up: (row-1, col)
- Down: (row+1, col)
- Left: (row, col-1)
- Right: (row, col+1)

**NOT allowed:**
- Diagonals: (row±1, col±1)
- Jumps: Moving >1 square

## Current Validation Status

### What IS Checked ✅
- Empty sequence
- Out of bounds positions
- Sequence points to empty cells
- Final moves at row -1
- Trap/piece counts match grid

### What is NOT Checked ❌
- **Diagonal moves** (CRITICAL!)
- **Movement distance** (must be adjacent)
- **Movement legality** (orthogonal only)

## Impact

### On Main Game
**Low risk** - The UI (BoardCreator) prevents creating invalid boards, so users can't make diagonal moves.

### On Extracted Engine
**HIGH risk** - RL agents could generate boards with diagonal moves if validation doesn't catch them!

```python
# RL agent might create:
invalid_board = agent.generate_board()  # Contains diagonal moves
engine.simulate_round(1, invalid_board, opponent_board)  # Should reject but doesn't!
```

## Fix Required

Add movement validation to `isBoardPlayable()`:

```typescript
function isAdjacentOrthogonal(from: Position, to: Position): boolean {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  // Must move exactly 1 square in one direction (orthogonal)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function isBoardPlayable(board: Board): boolean {
  // ... existing checks ...

  // NEW: Validate movement sequence
  let currentPosition: Position | null = null;

  for (const move of board.sequence) {
    if (move.type === 'final') {
      // Final moves don't need adjacency check
      continue;
    }

    if (move.type === 'trap' && currentPosition !== null) {
      // Trap at current position (supermove) is OK
      const samePosition =
        move.position.row === currentPosition.row &&
        move.position.col === currentPosition.col;

      if (!samePosition) {
        // Trap at different position - must be adjacent
        if (!isAdjacentOrthogonal(currentPosition, move.position)) {
          return false; // Invalid: trap not adjacent
        }
      }
    }

    if (move.type === 'piece') {
      if (currentPosition !== null) {
        // Check adjacency for piece moves
        if (!isAdjacentOrthogonal(currentPosition, move.position)) {
          return false; // Invalid: diagonal or jump move
        }
      }
      currentPosition = move.position; // Update current position
    }
  }

  return true;
}
```

## Action Items

### Immediate (Before Python Port)
1. ❌ Fix `isBoardPlayable()` in extracted engine
2. ❌ Add test cases for diagonal moves
3. ❌ Re-run verification tests
4. ❌ Update validation documentation

### Recommended (Main Game)
1. ❌ Fix `validateBoard()` in `src/utils/board-validation.ts`
2. ❌ Add test cases for diagonal moves
3. ❌ Run full test suite

## Test Cases to Add

```typescript
// Should FAIL validation
{
  name: "Invalid: Diagonal move",
  board: {
    boardSize: 2,
    grid: [['piece', 'empty'], ['trap', 'piece']],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Diagonal!
    ]
  },
  shouldPass: false
}

// Should FAIL validation
{
  name: "Invalid: Jump move (2+ squares)",
  board: {
    boardSize: 3,
    grid: [['piece', 'empty', 'empty'], ['empty', 'empty', 'piece'], ['empty', 'empty', 'empty']],
    sequence: [
      { position: { row: 1, col: 2 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Jump!
    ]
  },
  shouldPass: false
}

// Should PASS validation (trap at current position - "supermove")
{
  name: "Valid: Trap at current position",
  board: {
    boardSize: 2,
    grid: [['piece', 'empty'], ['trap', 'piece']],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 }, // Supermove OK
      { position: { row: 1, col: 0 }, type: 'piece', order: 3 }, // Adjacent move
    ]
  },
  shouldPass: true
}
```

## Priority

**CRITICAL** - Must fix before:
- Python port
- RL training (agents will exploit this)
- Production deployment of extracted engine

## Status

- [x] Bug discovered
- [x] Fix implemented
- [x] Tests added
- [x] Verification passed
- [x] Documented

## Resolution

**Date Fixed:** 2026-01-28

### Implementation

Fixed `isBoardPlayable()` in `spaces-game-engine/src/simulation.ts` with complete movement validation:

1. **Added `isAdjacentOrthogonal()` helper function**:
   - Validates moves are exactly 1 square in one direction (up/down/left/right)
   - Rejects diagonal and jump moves

2. **Enhanced `isBoardPlayable()` validation**:
   - ✅ Orthogonal movement only (no diagonals)
   - ✅ No jump moves (>1 square)
   - ✅ Traps only adjacent to piece or at current position
   - ✅ Supermove constraint (piece must move immediately after)
   - ✅ Piece cannot move into trap

3. **Added 16 comprehensive test cases**:
   - 8 tests that should FAIL validation ✅ All passing
   - 8 tests that should PASS validation ✅ All passing

### Test Results

All 16 movement validation tests passing in `src/__tests__/simulation.test.ts`:

**FAIL cases (correctly rejected):**
- ✅ Diagonal piece movement
- ✅ Jump move (2+ squares)
- ✅ Trap placed non-adjacent
- ✅ Trap placed diagonally
- ✅ Piece moves into trap
- ✅ Supermove without moving next step
- ✅ Supermove with another action at same position
- ✅ Piece moving into pre-existing trap

**PASS cases (correctly accepted):**
- ✅ Valid orthogonal moves
- ✅ Trap adjacent to piece
- ✅ Supermove with immediate movement
- ✅ Multiple traps adjacent to different positions
- ✅ Trap placement then avoiding it
- ✅ Supermove at start position
- ✅ Multiple supermoves with proper movement
- ✅ Minimal valid board

### Impact

**Before fix:** RL agents could generate boards with diagonal moves, jumps, and invalid trap placements.

**After fix:** All invalid movements are rejected during board validation, preventing exploits in ML training.

---

**Great catch!** This would have caused major issues in RL training where agents could generate invalid boards.
