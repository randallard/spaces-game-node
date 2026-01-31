# Verification Plan - Spaces Game Engine

## Goal
Verify the extracted engine produces **identical results** to the main game implementation.

## Part 1: Board Validation Testing

### Test: Invalid Boards Should Be Rejected

```typescript
import { isBoardPlayable } from 'spaces-game-engine';

// Test 1: Empty sequence (SHOULD FAIL)
const emptySequence = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['empty', 'empty']],
  sequence: []
};
assert(isBoardPlayable(emptySequence) === false, "Empty sequence should be invalid");

// Test 2: Out of bounds position (SHOULD FAIL)
const outOfBounds = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['empty', 'empty']],
  sequence: [
    { position: { row: 5, col: 0 }, type: 'piece', order: 1 }
  ]
};
assert(isBoardPlayable(outOfBounds) === false, "Out of bounds should be invalid");

// Test 3: Sequence points to empty cell (SHOULD FAIL)
const pointsToEmpty = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['empty', 'empty']],
  sequence: [
    { position: { row: 0, col: 1 }, type: 'piece', order: 1 }
  ]
};
assert(isBoardPlayable(pointsToEmpty) === false, "Pointing to empty cell should be invalid");

// Test 4: Final move not at row -1 (SHOULD FAIL)
const invalidFinal = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['empty', 'empty']],
  sequence: [
    { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
    { position: { row: 0, col: 0 }, type: 'final', order: 2 } // Should be row -1
  ]
};
assert(isBoardPlayable(invalidFinal) === false, "Final not at row -1 should be invalid");

// Test 5: Valid board (SHOULD PASS)
const validBoard = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['trap', 'piece']],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
};
assert(isBoardPlayable(validBoard) === true, "Valid board should pass");
```

### Test: Edge Cases

```typescript
// Negative indices (except final at -1)
const negativeRow = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['empty', 'empty']],
  sequence: [
    { position: { row: -2, col: 0 }, type: 'piece', order: 1 }
  ]
};
assert(isBoardPlayable(negativeRow) === false, "Negative row (except -1 for final) invalid");

// Mismatched grid size vs boardSize
const mismatchedSize = {
  boardSize: 3,  // Says 3x3
  grid: [['piece', 'empty'], ['empty', 'empty']],  // Actually 2x2
  sequence: [
    { position: { row: 0, col: 0 }, type: 'piece', order: 1 }
  ]
};
// Should this be validated? Check main game behavior

// Different board sizes
const size3 = {
  boardSize: 3,
  grid: [
    ['piece', 'empty', 'empty'],
    ['empty', 'trap', 'empty'],
    ['empty', 'empty', 'piece']
  ],
  sequence: [
    { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
};
assert(isBoardPlayable(size3) === true, "3x3 board should work");
```

## Part 2: Scoring Accuracy Testing

### Strategy: Compare Against Main Game

Create a test harness that runs the same boards through BOTH engines:

```typescript
// File: verify-against-main.ts
import { simulateRound as engineSimulateRound } from 'spaces-game-engine';
import { simulateRound as mainGameSimulateRound } from '../src/utils/game-simulation';

interface ComparisonResult {
  testName: string;
  passed: boolean;
  engineResult?: any;
  mainGameResult?: any;
  differences?: string[];
}

function compareResults(testName: string, engineResult: any, mainGameResult: any): ComparisonResult {
  const differences: string[] = [];

  // Compare critical fields
  if (engineResult.winner !== mainGameResult.winner) {
    differences.push(`Winner: engine=${engineResult.winner}, main=${mainGameResult.winner}`);
  }

  if (engineResult.playerPoints !== mainGameResult.playerPoints) {
    differences.push(`Player points: engine=${engineResult.playerPoints}, main=${mainGameResult.playerPoints}`);
  }

  if (engineResult.opponentPoints !== mainGameResult.opponentPoints) {
    differences.push(`Opponent points: engine=${engineResult.opponentPoints}, main=${mainGameResult.opponentPoints}`);
  }

  if (engineResult.collision !== mainGameResult.collision) {
    differences.push(`Collision: engine=${engineResult.collision}, main=${mainGameResult.collision}`);
  }

  // Compare simulation details
  const eSim = engineResult.simulationDetails;
  const mSim = mainGameResult.simulationDetails;

  if (eSim.playerMoves !== mSim.playerMoves) {
    differences.push(`Player moves: engine=${eSim.playerMoves}, main=${mSim.playerMoves}`);
  }

  if (eSim.opponentMoves !== mSim.opponentMoves) {
    differences.push(`Opponent moves: engine=${eSim.opponentMoves}, main=${mSim.opponentMoves}`);
  }

  if (eSim.playerHitTrap !== mSim.playerHitTrap) {
    differences.push(`Player hit trap: engine=${eSim.playerHitTrap}, main=${mSim.playerHitTrap}`);
  }

  if (eSim.opponentHitTrap !== mSim.opponentHitTrap) {
    differences.push(`Opponent hit trap: engine=${eSim.opponentHitTrap}, main=${mSim.opponentHitTrap}`);
  }

  return {
    testName,
    passed: differences.length === 0,
    engineResult,
    mainGameResult,
    differences: differences.length > 0 ? differences : undefined
  };
}

// Test cases
const testCases = [
  {
    name: "Simple forward movement",
    playerBoard: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'piece']],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 }
      ]
    },
    opponentBoard: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 }
      ]
    }
  },

  {
    name: "Trap interaction",
    playerBoard: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['trap', 'piece']],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
      ]
    },
    opponentBoard: {
      boardSize: 2,
      grid: [['piece', 'trap'], ['empty', 'piece']],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
      ]
    }
  },

  {
    name: "Goal reached",
    playerBoard: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'piece']],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
        { position: { row: -1, col: 0 }, type: 'final', order: 3 }
      ]
    },
    opponentBoard: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 }
      ]
    }
  },

  {
    name: "Collision",
    playerBoard: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'piece']],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 2 }
      ]
    },
    opponentBoard: {
      boardSize: 2,
      grid: [['empty', 'piece'], ['piece', 'empty']],
      sequence: [
        { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 }
      ]
    }
  },

  {
    name: "3x3 board",
    playerBoard: {
      boardSize: 3,
      grid: [
        ['piece', 'empty', 'empty'],
        ['piece', 'empty', 'trap'],
        ['empty', 'empty', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 1, col: 2 }, type: 'trap', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
        { position: { row: -1, col: 0 }, type: 'final', order: 5 }
      ]
    },
    opponentBoard: {
      boardSize: 3,
      grid: [
        ['piece', 'trap', 'empty'],
        ['empty', 'empty', 'piece'],
        ['empty', 'empty', 'piece']
      ],
      sequence: [
        { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 2 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 3 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 4 }
      ]
    }
  }
];

// Run all tests
console.log("=== VERIFICATION TEST SUITE ===\n");

const results: ComparisonResult[] = [];

for (const testCase of testCases) {
  console.log(`Testing: ${testCase.name}`);

  // Convert main game Board format (with id, name, etc.) to engine format
  const enginePlayerBoard = {
    boardSize: testCase.playerBoard.boardSize,
    grid: testCase.playerBoard.grid,
    sequence: testCase.playerBoard.sequence
  };

  const engineOpponentBoard = {
    boardSize: testCase.opponentBoard.boardSize,
    grid: testCase.opponentBoard.grid,
    sequence: testCase.opponentBoard.sequence
  };

  // Main game boards (add required fields)
  const mainPlayerBoard = {
    ...testCase.playerBoard,
    id: 'test-player',
    name: 'Test Player Board',
    thumbnail: '',
    createdAt: Date.now()
  };

  const mainOpponentBoard = {
    ...testCase.opponentBoard,
    id: 'test-opponent',
    name: 'Test Opponent Board',
    thumbnail: '',
    createdAt: Date.now()
  };

  // Run both simulations
  const engineResult = engineSimulateRound(1, enginePlayerBoard, engineOpponentBoard, { silent: true });
  const mainGameResult = mainGameSimulateRound(1, mainPlayerBoard, mainOpponentBoard);

  // Compare
  const comparison = compareResults(testCase.name, engineResult, mainGameResult);
  results.push(comparison);

  if (comparison.passed) {
    console.log("  ✅ PASSED\n");
  } else {
    console.log("  ❌ FAILED");
    console.log("  Differences:");
    comparison.differences?.forEach(diff => console.log(`    - ${diff}`));
    console.log();
  }
}

// Summary
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log("=== SUMMARY ===");
console.log(`Passed: ${passed}/${results.length}`);
console.log(`Failed: ${failed}/${results.length}`);

if (failed > 0) {
  console.log("\n❌ VERIFICATION FAILED - Engine does not match main game");
  process.exit(1);
} else {
  console.log("\n✅ VERIFICATION PASSED - Engine matches main game exactly");
  process.exit(0);
}
```

## Part 3: Existing Game Test Cases

**Extract real test cases from your main game:**

```bash
# Find existing test cases in main game
cd /home/ryankhetlyr/Development/spaces-game-node
grep -r "simulateRound" src/**/*.test.ts | head -20

# Copy those exact test boards to verify-against-main.ts
```

This will give us **real-world scenarios** that already work in your main game.

## Part 4: Performance Benchmark

```typescript
// File: benchmark.ts
import { simulateRound } from 'spaces-game-engine';

const board1 = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['trap', 'piece']],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
};

const board2 = {
  boardSize: 2,
  grid: [['piece', 'trap'], ['empty', 'piece']],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
  ]
};

console.log("Running benchmark...");

const iterations = 100000;
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  simulateRound(1, board1, board2, { silent: true });
}

const elapsed = Date.now() - start;
const gamesPerSecond = (iterations / elapsed) * 1000;

console.log(`\nResults:`);
console.log(`  Iterations: ${iterations.toLocaleString()}`);
console.log(`  Time: ${elapsed}ms`);
console.log(`  Games/second: ${gamesPerSecond.toLocaleString()} games/sec`);
console.log(`\nTarget: 1,000+ games/sec`);
console.log(gamesPerSecond >= 1000 ? "✅ PASSED" : "❌ FAILED");
```

## Execution Plan

### Step 1: Create verification script
```bash
cd spaces-game-engine
cat > verify.ts << 'EOF'
[paste verification code above]
EOF
```

### Step 2: Run validation tests
```bash
npm run build
npx tsx verify.ts
```

### Step 3: Run benchmark
```bash
npx tsx benchmark.ts
```

### Step 4: Document results
Create `VERIFICATION_RESULTS.md` with:
- ✅/❌ for each test case
- Any differences found
- Performance metrics
- Decision: Ready for Python port? Y/N

## Success Criteria

**Ready to proceed to Phase 2 (Python port) when:**
- ✅ All board validation tests pass
- ✅ All scoring comparison tests pass (100% match with main game)
- ✅ Performance: >1000 games/second
- ✅ No edge cases discovered that break the engine

## Next Steps After Verification

1. **If all tests pass** → Proceed to Python port
2. **If tests fail** → Fix engine, re-verify
3. **If performance is slow** → Optimize, re-benchmark

Would you like me to create the verification script now and run it?
