#!/usr/bin/env tsx
/**
 * Simple verification - board validation only
 */

import { isBoardPlayable } from '../src/index';
import type { Board } from '../src/types';

console.log("=".repeat(60));
console.log("BOARD VALIDATION TESTS");
console.log("=".repeat(60) + "\n");

interface ValidationTest {
  name: string;
  board: Board;
  shouldPass: boolean;
}

const tests: ValidationTest[] = [
  {
    name: "Valid 2x2 board",
    board: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['trap', 'piece']],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 }
      ]
    },
    shouldPass: true
  },
  {
    name: "Invalid: Empty sequence",
    board: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: []
    },
    shouldPass: false
  },
  {
    name: "Invalid: Out of bounds",
    board: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 5, col: 0 }, type: 'piece', order: 1 }
      ]
    },
    shouldPass: false
  },
  {
    name: "Invalid: Points to empty cell",
    board: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 0, col: 1 }, type: 'piece', order: 1 }
      ]
    },
    shouldPass: false
  },
  {
    name: "Invalid: Final not at row -1",
    board: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'final', order: 2 }
      ]
    },
    shouldPass: false
  },
  {
    name: "Valid: 3x3 board",
    board: {
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
    },
    shouldPass: true
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = isBoardPlayable(test.board);
  const ok = result === test.shouldPass;

  if (ok) {
    console.log(`✅ ${test.name}`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Expected: ${test.shouldPass}, Got: ${result}`);
    failed++;
  }
}

console.log(`\nResults: ${passed}/${tests.length} passed`);

if (failed === 0) {
  console.log("\n✅ ALL VALIDATION TESTS PASSED\n");
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} TESTS FAILED\n`);
  process.exit(1);
}
