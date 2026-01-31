# Verification and Benchmark Scripts

## Quick Start

```bash
# Install tsx if not already installed
npm install -g tsx

# Run verification tests
npx tsx scripts/verify-correctness.ts

# Run performance benchmark
npx tsx scripts/benchmark.ts
```

## Verification Tests

`verify-correctness.ts` runs two test suites:

### Part 1: Board Validation
Tests that invalid boards are properly rejected:
- ✅ Empty sequences rejected
- ✅ Out-of-bounds positions rejected
- ✅ Sequences pointing to empty cells rejected
- ✅ Invalid final moves rejected
- ✅ Valid boards accepted

### Part 2: Scoring Accuracy (vs Main Game)
Compares engine results against main game implementation:
- Simulates identical boards through both engines
- Compares winners, scores, moves, traps, collisions
- Reports any differences found

**Exit codes:**
- `0` = All tests passed
- `1` = Some tests failed

## Benchmark

`benchmark.ts` measures simulation performance:

**Tests:**
1. **2x2 boards** (simple) - 100,000 iterations
2. **3x3 boards** (complex) - 50,000 iterations
3. **5-round games** - 10,000 complete games

**Metrics reported:**
- Games per second
- Microseconds per game
- Complete games per second (for multi-round)

**Target:** 1000+ games/second for RL training

## Expected Results

### Validation Tests
```
PART 1: BOARD VALIDATION TESTS
✅ Valid 2x2 board with trap and goal
✅ Invalid: Empty sequence
✅ Invalid: Out of bounds position
✅ Invalid: Sequence points to empty cell
✅ Invalid: Final move not at row -1
✅ Valid: 3x3 board
✅ Invalid: Negative row (not -1)

Validation Tests: 7/7 passed
```

### Scoring Tests
```
PART 2: SCORING ACCURACY TESTS (vs Main Game)
Testing: Simple forward movement
  ✅ PASSED

Testing: Goal reached
  ✅ PASSED

Testing: Trap interaction
  ✅ PASSED

Scoring Tests: 3/3 passed
```

### Benchmark
```
PERFORMANCE BENCHMARK

Test: 2x2 boards (simple)
Iterations: 100,000
Time: 1250ms
Speed: 80,000 games/sec
Latency: 12.50 μs/game
✅ PASSED (>1000 games/sec)

Test: 3x3 boards (complex)
Iterations: 50,000
Time: 850ms
Speed: 58,824 games/sec
Latency: 17.00 μs/game
✅ PASSED (>1000 games/sec)
```

## Troubleshooting

### "Cannot find module" error

Make sure you've built the package first:
```bash
npm run build
```

### Main game comparison skipped

If verification script can't import main game:
```
⚠️  Warning: Could not import main game simulation
   Skipping comparison tests (validation tests only)
```

This is OK - validation tests will still run. To enable comparison:
1. Ensure main game is built
2. Check import path in `verify-correctness.ts` line 15

### Slow performance

If benchmark shows <1000 games/sec:
1. Run in production mode (not development)
2. Close other applications
3. Try `silent: true` mode (already enabled in benchmark)

## Integration with CI/CD

Add to your package.json scripts:
```json
{
  "scripts": {
    "verify": "tsx scripts/verify-correctness.ts",
    "benchmark": "tsx scripts/benchmark.ts",
    "test:engine": "npm run verify && npm run benchmark"
  }
}
```

Then run:
```bash
npm run test:engine
```
