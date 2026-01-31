# Movement Rules - Complete Test Cases

## Complete Rule Set

### Rule 1: Piece Movement - Orthogonal Only
- ✅ Pieces can move UP, DOWN, LEFT, RIGHT (1 square)
- ❌ Pieces CANNOT move diagonally
- ❌ Pieces CANNOT jump (>1 square)

### Rule 2: Trap Placement
- ✅ Traps can be placed ADJACENT to current piece position (orthogonal)
- ✅ Traps can be placed AT current piece position (supermove)
- ❌ Traps CANNOT be placed anywhere else

### Rule 3: Supermove Constraint
- ✅ After placing trap at current position, piece MUST move on next step
- ❌ Piece CANNOT stay in place after supermove trap
- ❌ Piece CANNOT place another trap at same position

### Rule 4: Trap Avoidance
- ❌ Piece CANNOT move into a square that contains a trap
- ✅ Piece can move into empty squares or squares with other pieces (before trap is placed)

### Rule 5: Final Move
- ✅ Final move must be at row -1 (exiting board)
- ✅ Final move doesn't need adjacency check (it's off-board)

---

## Test Cases - Should FAIL ❌

### FAIL 1: Diagonal Move
```typescript
{
  name: "❌ FAIL: Diagonal piece movement",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start (1,1)
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 }  // DIAGONAL to (0,0)
    ]
  },
  shouldPass: false,
  reason: "Piece moved diagonally from (1,1) to (0,0)"
}
```

### FAIL 2: Jump Move (2+ squares)
```typescript
{
  name: "❌ FAIL: Piece jump move",
  board: {
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'],
      ['empty', 'empty', 'empty'],
      ['empty', 'empty', 'piece']
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 }, // Start (2,2)
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 }  // JUMP 2 squares
    ]
  },
  shouldPass: false,
  reason: "Piece jumped 2 squares from (2,2) to (0,0)"
}
```

### FAIL 3: Trap Placed Non-Adjacent
```typescript
{
  name: "❌ FAIL: Trap placed non-adjacent to piece",
  board: {
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'trap'],
      ['empty', 'empty', 'empty'],
      ['empty', 'empty', 'piece']
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 }, // Piece at (2,2)
      { position: { row: 0, col: 2 }, type: 'trap', order: 2 }   // Trap at (0,2) - NOT adjacent!
    ]
  },
  shouldPass: false,
  reason: "Trap at (0,2) is not adjacent to piece at (2,2)"
}
```

### FAIL 4: Trap Placed Diagonally
```typescript
{
  name: "❌ FAIL: Trap placed diagonally from piece",
  board: {
    boardSize: 2,
    grid: [
      ['trap', 'empty'],
      ['empty', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Piece at (1,1)
      { position: { row: 0, col: 0 }, type: 'trap', order: 2 }   // Trap diagonal at (0,0)
    ]
  },
  shouldPass: false,
  reason: "Trap at (0,0) is diagonal from piece at (1,1), not orthogonally adjacent"
}
```

### FAIL 5: Piece Moves Into Own Trap
```typescript
{
  name: "❌ FAIL: Piece moves into square with trap",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start (1,1)
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },  // Place trap at (1,0)
      { position: { row: 1, col: 0 }, type: 'piece', order: 3 }  // MOVE INTO TRAP!
    ]
  },
  shouldPass: false,
  reason: "Piece at (1,1) placed trap at (1,0) then tried to move into it"
}
```

### FAIL 6: Supermove - Piece Doesn't Leave
```typescript
{
  name: "❌ FAIL: Supermove - piece doesn't move on next step",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Piece at (1,1)
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 },  // Supermove: trap at same position
      { position: { row: 1, col: 1 }, type: 'final', order: 3 }  // STAYED IN PLACE!
    ]
  },
  shouldPass: false,
  reason: "After supermove trap at (1,1), piece must move to different position on next step"
}
```

### FAIL 7: Supermove - Another Trap Same Position
```typescript
{
  name: "❌ FAIL: Supermove - place another trap at same position",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Piece at (1,1)
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 },  // Supermove: trap at (1,1)
      { position: { row: 1, col: 1 }, type: 'trap', order: 3 }   // ANOTHER TRAP same spot!
    ]
  },
  shouldPass: false,
  reason: "After supermove, cannot place another action at same position - must move"
}
```

### FAIL 8: Move Into Pre-Existing Trap
```typescript
{
  name: "❌ FAIL: Piece moves into pre-existing trap",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start (1,1)
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },  // Place trap at (1,0)
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Move to (0,1)
      { position: { row: 1, col: 0 }, type: 'piece', order: 4 }  // Try to move into trap!
    ]
  },
  shouldPass: false,
  reason: "Piece cannot move into (1,0) where trap was placed in step 2"
}
```

---

## Test Cases - Should PASS ✅

### PASS 1: Valid Orthogonal Moves
```typescript
{
  name: "✅ PASS: Valid orthogonal movements",
  board: {
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'],
      ['piece', 'empty', 'empty'],
      ['empty', 'empty', 'piece']
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 }, // Start (2,2)
      { position: { row: 2, col: 1 }, type: 'piece', order: 2 }, // LEFT to (2,1)
      { position: { row: 1, col: 1 }, type: 'piece', order: 3 }, // UP to (1,1)
      { position: { row: 1, col: 0 }, type: 'piece', order: 4 }, // LEFT to (1,0)
      { position: { row: 0, col: 0 }, type: 'piece', order: 5 }, // UP to (0,0)
      { position: { row: -1, col: 0 }, type: 'final', order: 6 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "All moves are orthogonal (up/left only)"
}
```

### PASS 2: Trap Adjacent to Piece
```typescript
{
  name: "✅ PASS: Trap placed adjacent to piece",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Piece at (1,1)
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },  // Trap LEFT adjacent (1,0)
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Move UP to (0,1)
      { position: { row: 0, col: 0 }, type: 'piece', order: 4 }, // Move LEFT to (0,0)
      { position: { row: -1, col: 0 }, type: 'final', order: 5 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "Trap at (1,0) is adjacent to piece at (1,1), then piece moves away"
}
```

### PASS 3: Supermove - Trap at Current Position, Then Move
```typescript
{
  name: "✅ PASS: Supermove - trap at current position, piece moves next",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Piece at (1,1)
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 },  // SUPERMOVE: trap at (1,1)
      { position: { row: 1, col: 0 }, type: 'piece', order: 3 }, // MOVE to (1,0) - REQUIRED!
      { position: { row: 0, col: 0 }, type: 'piece', order: 4 }, // Continue to (0,0)
      { position: { row: -1, col: 0 }, type: 'final', order: 5 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "Supermove at (1,1) followed by immediate move to (1,0)"
}
```

### PASS 4: Multiple Traps Adjacent
```typescript
{
  name: "✅ PASS: Multiple traps placed at adjacent positions",
  board: {
    boardSize: 3,
    grid: [
      ['piece', 'trap', 'trap'],
      ['empty', 'empty', 'piece'],
      ['empty', 'empty', 'empty']
    ],
    sequence: [
      { position: { row: 1, col: 2 }, type: 'piece', order: 1 }, // Start (1,2)
      { position: { row: 0, col: 2 }, type: 'trap', order: 2 },  // Trap UP at (0,2)
      { position: { row: 1, col: 1 }, type: 'piece', order: 3 }, // Move LEFT to (1,1)
      { position: { row: 0, col: 1 }, type: 'trap', order: 4 },  // Trap UP at (0,1)
      { position: { row: 1, col: 0 }, type: 'piece', order: 5 }, // Move LEFT to (1,0)
      { position: { row: 0, col: 0 }, type: 'piece', order: 6 }, // Move UP to (0,0)
      { position: { row: -1, col: 0 }, type: 'final', order: 7 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "Each trap placed adjacent to current piece position"
}
```

### PASS 5: Trap Then Move Through Different Path
```typescript
{
  name: "✅ PASS: Trap placed, piece avoids it",
  board: {
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'],
      ['piece', 'trap', 'empty'],
      ['empty', 'empty', 'piece']
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 }, // Start (2,2)
      { position: { row: 2, col: 1 }, type: 'piece', order: 2 }, // Move to (2,1)
      { position: { row: 1, col: 1 }, type: 'trap', order: 3 },  // Trap at (1,1)
      { position: { row: 2, col: 0 }, type: 'piece', order: 4 }, // Move LEFT avoiding trap
      { position: { row: 1, col: 0 }, type: 'piece', order: 5 }, // Move UP to (1,0)
      { position: { row: 0, col: 0 }, type: 'piece', order: 6 }, // Move UP to (0,0)
      { position: { row: -1, col: 0 }, type: 'final', order: 7 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "Piece places trap at (1,1) then avoids it by going around"
}
```

### PASS 6: Supermove at Start Position
```typescript
{
  name: "✅ PASS: Supermove at starting position",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start
      { position: { row: 1, col: 1 }, type: 'trap', order: 2 },  // Supermove immediately
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Move UP
      { position: { row: 0, col: 0 }, type: 'piece', order: 4 }, // Move LEFT
      { position: { row: -1, col: 0 }, type: 'final', order: 5 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "Supermove allowed at starting position, piece moves immediately after"
}
```

### PASS 7: Complex Path with Multiple Supermoves
```typescript
{
  name: "✅ PASS: Multiple supermoves with proper movement",
  board: {
    boardSize: 3,
    grid: [
      ['piece', 'empty', 'empty'],
      ['trap', 'trap', 'empty'],
      ['empty', 'empty', 'piece']
    ],
    sequence: [
      { position: { row: 2, col: 2 }, type: 'piece', order: 1 }, // Start (2,2)
      { position: { row: 2, col: 2 }, type: 'trap', order: 2 },  // Supermove #1
      { position: { row: 2, col: 1 }, type: 'piece', order: 3 }, // Move LEFT
      { position: { row: 1, col: 1 }, type: 'trap', order: 4 },  // Trap adjacent
      { position: { row: 2, col: 0 }, type: 'piece', order: 5 }, // Move LEFT
      { position: { row: 1, col: 0 }, type: 'trap', order: 6 },  // Trap adjacent
      { position: { row: 0, col: 0 }, type: 'piece', order: 7 }, // Move UP
      { position: { row: -1, col: 0 }, type: 'final', order: 8 } // GOAL
    ]
  },
  shouldPass: true,
  reason: "Supermove followed by move, then normal traps placed adjacent"
}
```

### PASS 8: Minimal Valid Board
```typescript
{
  name: "✅ PASS: Minimal valid board (2 moves)",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start
      { position: { row: -1, col: 0 }, type: 'final', order: 2 } // GOAL (adjacency not required)
    ]
  },
  shouldPass: true,
  reason: "Minimum valid sequence: piece placement then goal"
}
```

---

## Edge Cases

### EDGE 1: Final Move Doesn't Require Adjacency
```typescript
{
  name: "✅ EDGE: Final move doesn't need to be adjacent",
  board: {
    boardSize: 2,
    grid: [
      ['empty', 'empty'],
      ['empty', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // At (1,1)
      { position: { row: -1, col: 0 }, type: 'final', order: 2 } // Goal at (-1, 0) - OK!
    ]
  },
  shouldPass: true,
  reason: "Final move at row -1 doesn't need adjacency check (it's off-board)"
}
```

### EDGE 2: Can Place Trap Before Moving Piece
```typescript
{
  name: "✅ EDGE: Trap can be placed before piece moves",
  board: {
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['trap', 'piece']
    ],
    sequence: [
      { position: { row: 1, col: 1 }, type: 'piece', order: 1 }, // Start
      { position: { row: 1, col: 0 }, type: 'trap', order: 2 },  // Trap adjacent (before moving)
      { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Then move
      { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
      { position: { row: -1, col: 0 }, type: 'final', order: 5 }
    ]
  },
  shouldPass: true,
  reason: "Trap placement doesn't require moving first"
}
```

---

## Summary

**Total Test Cases:** 16
- **Should FAIL:** 8 test cases
- **Should PASS:** 8 test cases

**Rules Validated:**
1. ✅ No diagonal moves
2. ✅ No jump moves
3. ✅ Traps only adjacent or at current position
4. ✅ Supermove requires immediate movement
5. ✅ Piece cannot move into trap
6. ✅ Final move exception (row -1, no adjacency check)

**Implementation Priority:** CRITICAL - Must fix before RL training
