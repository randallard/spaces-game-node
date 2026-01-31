#!/usr/bin/env tsx
/**
 * Performance benchmark for game engine
 *
 * Target: 1000+ games/second for RL training
 *
 * Run with: npx tsx scripts/benchmark.ts
 */

import { simulateRound } from '../src/index';
import type { Board } from '../src/types';

// Test boards
const board1: Board = {
  boardSize: 2,
  grid: [['piece', 'empty'], ['trap', 'piece']],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
};

const board2: Board = {
  boardSize: 2,
  grid: [['piece', 'trap'], ['empty', 'piece']],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 }
  ]
};

const board3: Board = {
  boardSize: 3,
  grid: [
    ['piece', 'empty', 'empty'],
    ['piece', 'trap', 'empty'],
    ['empty', 'empty', 'piece']
  ],
  sequence: [
    { position: { row: 2, col: 2 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 0 }, type: 'piece', order: 2 },
    { position: { row: 1, col: 1 }, type: 'trap', order: 3 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 4 },
    { position: { row: -1, col: 0 }, type: 'final', order: 5 }
  ]
};

const board4: Board = {
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
};

console.log("=".repeat(60));
console.log("PERFORMANCE BENCHMARK");
console.log("=".repeat(60));
console.log();

// Benchmark configurations
const benchmarks = [
  { name: "2x2 boards (simple)", board1, board2, iterations: 100000 },
  { name: "3x3 boards (complex)", board1: board3, board2: board4, iterations: 50000 },
];

for (const benchmark of benchmarks) {
  console.log(`Test: ${benchmark.name}`);
  console.log(`Iterations: ${benchmark.iterations.toLocaleString()}`);

  // Warmup
  for (let i = 0; i < 100; i++) {
    simulateRound(1, benchmark.board1, benchmark.board2, { silent: true });
  }

  // Benchmark
  const start = Date.now();

  for (let i = 0; i < benchmark.iterations; i++) {
    simulateRound(1, benchmark.board1, benchmark.board2, { silent: true });
  }

  const elapsed = Date.now() - start;
  const gamesPerSecond = (benchmark.iterations / elapsed) * 1000;
  const microsPerGame = (elapsed * 1000) / benchmark.iterations;

  console.log(`Time: ${elapsed}ms`);
  console.log(`Speed: ${gamesPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })} games/sec`);
  console.log(`Latency: ${microsPerGame.toFixed(2)} μs/game`);

  if (gamesPerSecond >= 1000) {
    console.log("✅ PASSED (>1000 games/sec)\n");
  } else {
    console.log("⚠️  BELOW TARGET (<1000 games/sec)\n");
  }
}

// Multi-round benchmark
console.log("Test: 5-round game (round-by-round mode)");
const iterations5Round = 10000;

const start5 = Date.now();

for (let i = 0; i < iterations5Round; i++) {
  for (let round = 1; round <= 5; round++) {
    simulateRound(round, board1, board2, { silent: true });
  }
}

const elapsed5 = Date.now() - start5;
const gamesPerSecond5 = (iterations5Round / elapsed5) * 1000;

console.log(`Iterations: ${iterations5Round.toLocaleString()} complete games (5 rounds each)`);
console.log(`Time: ${elapsed5}ms`);
console.log(`Speed: ${gamesPerSecond5.toLocaleString(undefined, { maximumFractionDigits: 0 })} complete games/sec`);
console.log(`Rounds/sec: ${(gamesPerSecond5 * 5).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log();
console.log("=".repeat(60));
console.log("BENCHMARK COMPLETE");
console.log("=".repeat(60));
console.log();
console.log("Target for RL training: 1000+ games/second");
console.log("This allows 100K training episodes in ~100 seconds");
