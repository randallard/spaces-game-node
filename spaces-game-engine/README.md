# Spaces Game Engine

Standalone TypeScript game simulation engine for Spaces Game, optimized for Reinforcement Learning and Machine Learning training.

## Features

- ✅ **Zero UI dependencies** - Pure game logic only
- ✅ **Fully typed** - Complete TypeScript type definitions
- ✅ **Fast** - Optimized for high-throughput training (1000+ games/second target)
- ✅ **Tested** - Comprehensive test coverage
- ✅ **RL-ready** - Observation modes for perfect and partial information
- ✅ **Portable** - Can be used in Node.js or ported to Python

## Installation

```bash
npm install spaces-game-engine
```

## Quick Start

```typescript
import { simulateRound, type Board } from 'spaces-game-engine';

// Define a simple 2x2 board
const playerBoard: Board = {
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['trap', 'piece']
  ],
  sequence: [
    { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
};

const opponentBoard: Board = {
  boardSize: 2,
  grid: [
    ['piece', 'trap'],
    ['empty', 'piece']
  ],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
    { position: { row: -1, col: 0 }, type: 'final', order: 4 }
  ]
};

// Simulate a round
const result = simulateRound(1, playerBoard, opponentBoard);

console.log(`Winner: ${result.winner}`);
console.log(`Player: ${result.playerPoints} points`);
console.log(`Opponent: ${result.opponentPoints} points`);
```

## Game Rules

- **Movement**: Players follow their board's sequence step-by-step
- **Scoring**:
  - +1 point for each forward move (toward goal row)
  - +1 point for reaching the goal
  - -1 point for collision (both players lose 1 point, minimum 0)
  - -1 point for hitting opponent's trap (minimum 0)
- **Round End**: Round ends when collision occurs, goal is reached, trap is hit, or all sequences complete

## API Reference

### `simulateRound(round, playerBoard, opponentBoard, options?)`

Simulates a single round between two boards.

**Parameters:**
- `round: number` - Round number (1-5 for standard, 1-10 for deck mode)
- `playerBoard: Board` - Player's board
- `opponentBoard: Board` - Opponent's board
- `options?: { silent?: boolean }` - Optional configuration

**Returns:** `RoundResult` - Complete result with winner, scores, and simulation details

### `simulateMultipleRounds(playerBoards, opponentBoards, options?)`

Simulates multiple rounds in sequence.

**Parameters:**
- `playerBoards: Board[]` - Array of player boards
- `opponentBoards: Board[]` - Array of opponent boards (same length)
- `options?: { silent?: boolean }` - Optional configuration

**Returns:** `RoundResult[]` - Array of results for each round

### `isBoardPlayable(board)`

Validates that a board can be used in simulation.

**Parameters:**
- `board: Board` - Board to validate

**Returns:** `boolean` - true if board is valid

## Types

### `Board`

```typescript
type Board = {
  boardSize: number;        // Grid size (2, 3, etc.)
  grid: CellContent[][];    // NxN grid of cells
  sequence: BoardMove[];    // Ordered list of moves
};

type CellContent = 'empty' | 'piece' | 'trap' | 'final';
```

### `RoundResult`

```typescript
type RoundResult = {
  round: number;
  winner: 'player' | 'opponent' | 'tie';
  playerBoard: Board;
  opponentBoard: Board;
  playerFinalPosition: Position;
  opponentFinalPosition: Position;
  playerPoints: number;
  opponentPoints: number;
  collision: boolean;
  simulationDetails: {
    playerMoves: number;
    opponentMoves: number;
    playerHitTrap: boolean;
    opponentHitTrap: boolean;
    playerLastStep: number;
    opponentLastStep: number;
    playerTrapPosition?: Position;
    opponentTrapPosition?: Position;
  };
};
```

## CLI Testing Tool

A comprehensive CLI tool for testing and validating boards before RL/ML training.

### Quick Start

```bash
# Interactive board builder
npm run cli -- test --interactive

# Test with file inputs (auto-creates session)
npm run cli -- test --player board.json --opponent random

# Re-run last test
npm run cli -- test --last

# Replay session for regression testing
npm run cli -- session list
npm run cli -- session replay <session-id>
```

### CLI Features

- **Interactive Board Builder** - Build boards with natural language commands (`move left`, `trap right`, `finish`)
- **Auto-Session Logging** - Every test is automatically saved and can be replayed later
- **Re-run Last Test** - Quickly repeat the most recent test with `--last` flag
- **Board Collections** - Save and manage reusable test boards
- **Session Management** - Organize tests with custom metadata, save/discard sessions
- **Multiple Input Formats** - JSON, files, collections with indices, random generation
- **Session Replay** - Re-run saved sessions to detect regressions
- **Visual Results** - Side-by-side board visualization with scores and outcomes
- **Technical Explanation** - Step-by-step breakdown of every move, score, and event during simulation

See [CLI Documentation](./RL_TESTING_CLI_PLAN.md) for complete command reference.

## RL/ML Training

This package is designed for reinforcement learning agents. Two observation modes are supported:

### Perfect Information (Start Here)
Agent sees full opponent board after each round. Simpler learning problem, good baseline.

### Fog of War (Advanced)
Agent only sees opponent's visited cells and trap placement events (not locations). Creates a POMDP (Partially Observable Markov Decision Process).

See `src/types/game.ts` for observation type definitions.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Test with coverage
npm run test:coverage
```

## License

MIT

## Related

- Main game repository: [spaces-game-node](https://github.com/randallard/spaces-game-node)
- Python port (coming soon): `py-spaces-game`
- Gymnasium environment (coming soon): `gym-spaces-game`
