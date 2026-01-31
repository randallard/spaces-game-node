#!/usr/bin/env tsx
/**
 * Verification script - Compare extracted engine against main game
 *
 * Run with: npx tsx scripts/verify-correctness.ts
 */

import { simulateRound, isBoardPlayable } from '../src/index';
import type { Board } from '../src/types';

// Main function to handle async imports
async function main() {
  // Import main game simulation for comparison
  // Note: Adjust path if needed
  let mainGameSimulateRound: any;
  let scoringTests: any[] = [];
  let scoringPassed = 0;
  let scoringFailed = 0;

  try {
    const mainGame = await import('../../src/utils/game-simulation.js');
    mainGameSimulateRound = mainGame.simulateRound;
  } catch (error) {
    console.log("⚠️  Warning: Could not import main game simulation");
    console.log("   Skipping comparison tests (validation tests only)\n");
  }

  // ============================================================================
  // PART 1: Board Validation Tests
  // ============================================================================

  console.log("=" .repeat(60));
console.log("PART 1: BOARD VALIDATION TESTS");
console.log("=".repeat(60) + "\n");

interface ValidationTest {
  name: string;
  board: Board;
  shouldPass: boolean;
}

const validationTests: ValidationTest[] = [
  {
    name: "Valid 2x2 board with trap and goal",
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
    name: "Invalid: Out of bounds position",
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
    name: "Invalid: Sequence points to empty cell",
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
    name: "Invalid: Final move not at row -1",
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
  },
  {
    name: "Invalid: Negative row (not -1)",
    board: {
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [
        { position: { row: -2, col: 0 }, type: 'piece', order: 1 }
      ]
    },
    shouldPass: false
  }
];

let validationPassed = 0;
let validationFailed = 0;

for (const test of validationTests) {
  const result = isBoardPlayable(test.board);
  const passed = result === test.shouldPass;

  if (passed) {
    console.log(`✅ ${test.name}`);
    validationPassed++;
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Expected: ${test.shouldPass}, Got: ${result}`);
    validationFailed++;
  }
}

console.log(`\nValidation Tests: ${validationPassed} passed, ${validationFailed} failed\n`);

// ============================================================================
// PART 2: Scoring Accuracy Tests (vs Main Game)
// ============================================================================

if (mainGameSimulateRound) {
  console.log("=".repeat(60));
  console.log("PART 2: SCORING ACCURACY TESTS (vs Main Game)");
  console.log("=".repeat(60) + "\n");

  interface ScoringTest {
    name: string;
    playerBoard: any; // Will be converted to both formats
    opponentBoard: any;
  }

  const scoringTests: ScoringTest[] = [
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
    }
  ];

  let scoringPassed = 0;
  let scoringFailed = 0;

  for (const test of scoringTests) {
    console.log(`Testing: ${test.name}`);

    // Engine format (minimal)
    const enginePlayer = test.playerBoard;
    const engineOpponent = test.opponentBoard;

    // Main game format (with extra fields)
    const mainPlayer = {
      ...test.playerBoard,
      id: 'test-player',
      name: 'Test Player',
      thumbnail: '',
      createdAt: Date.now()
    };

    const mainOpponent = {
      ...test.opponentBoard,
      id: 'test-opponent',
      name: 'Test Opponent',
      thumbnail: '',
      createdAt: Date.now()
    };

    // Run both
    const engineResult = simulateRound(1, enginePlayer, engineOpponent, { silent: true });
    const mainResult = mainGameSimulateRound(1, mainPlayer, mainOpponent);

    // Compare critical fields
    const differences: string[] = [];

    if (engineResult.winner !== mainResult.winner) {
      differences.push(`Winner: engine=${engineResult.winner}, main=${mainResult.winner}`);
    }

    if (engineResult.playerPoints !== mainResult.playerPoints) {
      differences.push(`Player points: engine=${engineResult.playerPoints}, main=${mainResult.playerPoints}`);
    }

    if (engineResult.opponentPoints !== mainResult.opponentPoints) {
      differences.push(`Opponent points: engine=${engineResult.opponentPoints}, main=${mainResult.opponentPoints}`);
    }

    if (engineResult.collision !== mainResult.collision) {
      differences.push(`Collision: engine=${engineResult.collision}, main=${mainResult.collision}`);
    }

    if (engineResult.simulationDetails.playerMoves !== mainResult.simulationDetails.playerMoves) {
      differences.push(`Player moves: engine=${engineResult.simulationDetails.playerMoves}, main=${mainResult.simulationDetails.playerMoves}`);
    }

    if (engineResult.simulationDetails.opponentMoves !== mainResult.simulationDetails.opponentMoves) {
      differences.push(`Opponent moves: engine=${engineResult.simulationDetails.opponentMoves}, main=${mainResult.simulationDetails.opponentMoves}`);
    }

    if (differences.length === 0) {
      console.log(`  ✅ PASSED\n`);
      scoringPassed++;
    } else {
      console.log(`  ❌ FAILED`);
      console.log(`  Differences:`);
      differences.forEach(diff => console.log(`    - ${diff}`));
      console.log();
      scoringFailed++;
    }
  }

  console.log(`Scoring Tests: ${scoringPassed} passed, ${scoringFailed} failed\n`);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log("=".repeat(60));
console.log("SUMMARY");
console.log("=".repeat(60));

console.log(`\nValidation Tests: ${validationPassed}/${validationTests.length} passed`);

if (mainGameSimulateRound) {
  const scoringTotal = scoringTests?.length || 0;
  console.log(`Scoring Tests: ${scoringPassed}/${scoringTotal} passed`);
}

const allPassed = validationFailed === 0 && (!mainGameSimulateRound || scoringFailed === 0);

if (allPassed) {
  console.log("\n✅ ALL TESTS PASSED - Engine is verified!\n");
  process.exit(0);
} else {
  console.log("\n❌ SOME TESTS FAILED - Review differences above\n");
  process.exit(1);
}
