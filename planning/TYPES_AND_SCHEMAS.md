# Core Types and Schemas ✅

**Status:** Complete
**Date:** 2025-11-05

---

## Overview

All core TypeScript types and Zod validation schemas have been created following kings-cooking patterns:
- ✅ Discriminated unions for type-safe phases
- ✅ Complete state objects (never partial)
- ✅ Runtime validation at entry points
- ✅ Strict type checking with no errors

---

## Type Files Created

### 1. `src/types/board.ts`
Board data structures for the 2x2 game grid.

```typescript
type CellContent = 'empty' | 'piece' | 'trap';

type Position = {
  row: number;    // 0-1 (2x2 grid)
  col: number;    // 0-1
};

type BoardMove = {
  position: Position;
  type: 'piece' | 'trap';
  order: number;  // Sequence order
};

type Board = {
  id: string;           // UUID
  name: string;         // User-defined name
  grid: CellContent[][]; // 2x2 grid
  sequence: BoardMove[]; // Ordered moves
  thumbnail: string;    // SVG data URI
  createdAt: number;    // Timestamp
};
```

**Key Features:**
- 2x2 grid structure
- Ordered move sequence tracking
- SVG thumbnail for visual preview
- UUID-based identification

---

### 2. `src/types/opponent.ts`
Opponent and statistics types.

```typescript
type OpponentType = 'human' | 'cpu';

type Opponent = {
  id: string;           // Generated from type + name
  name: string;
  type: OpponentType;
  wins: number;
  losses: number;
};

type OpponentStats = {
  wins: number;
  losses: number;
};
```

**Key Features:**
- Support for human and CPU opponents
- Win/loss tracking per opponent
- Simple stats structure

---

### 3. `src/types/user.ts`
User profile and data structures.

```typescript
type UserProfile = {
  name: string;
  greeting: string;
  savedBoards: Board[];
  opponents: Opponent[];
};

type OpponentStatsMap = Record<string, {
  wins: number;
  losses: number;
}>;
```

**Key Features:**
- User identification
- Saved boards collection
- Opponent management
- Per-opponent statistics map

---

### 4. `src/types/game-state.ts`
Complete game state with discriminated union phases.

```typescript
type RoundResult = {
  round: number;               // 1-8
  playerBoard: Board;
  opponentBoard: Board;
  playerPoints: number;
  opponentPoints: number;
  playerOutcome: 'won' | 'lost' | 'tie';
  simulationDetails: {
    playerMoves: number;
    opponentMoves: number;
    playerHitTrap: boolean;
    opponentHitTrap: boolean;
  };
};
```

**Game Phase (Discriminated Union):**
```typescript
type GamePhase =
  | { type: 'user-setup' }
  | { type: 'opponent-selection' }
  | { type: 'board-selection'; round: number }
  | { type: 'waiting-for-opponent'; round: number }
  | { type: 'round-results'; round: number; result: RoundResult }
  | { type: 'game-over'; winner: 'player' | 'opponent' | 'tie' };
```

**Complete Game State:**
```typescript
type GameState = {
  // Current phase
  phase: GamePhase;

  // User and opponent
  user: UserProfile;
  opponent: Opponent | null;

  // Game progress (8 rounds)
  currentRound: number;        // 1-8
  playerScore: number;
  opponentScore: number;

  // Current board selections
  playerSelectedBoard: Board | null;
  opponentSelectedBoard: Board | null;

  // History
  roundHistory: RoundResult[];

  // Validation
  checksum: string;
};
```

**URL Payload (for hash fragment communication):**
```typescript
type UrlPayload =
  | { type: 'delta'; changes: Partial<GameState> }
  | { type: 'full_state'; state: GameState }
  | { type: 'resync_request'; requestId: string };
```

**Key Features:**
- ✅ Discriminated union phases (compiler-enforced type safety)
- ✅ Complete state object (never partial updates)
- ✅ Round tracking (1-8 rounds)
- ✅ Score accumulation
- ✅ Round history for review
- ✅ Checksum for validation
- ✅ URL payload types for sharing

---

### 5. `src/types/actions.ts`
Action types for game state reducer.

```typescript
type GameAction =
  | { type: 'SET_USER_NAME'; name: string }
  | { type: 'SET_USER_GREETING'; greeting: string }
  | { type: 'ADD_BOARD'; board: Board }
  | { type: 'DELETE_BOARD'; boardId: string }
  | { type: 'ADD_OPPONENT'; opponent: Opponent }
  | { type: 'DELETE_OPPONENT'; opponentId: string }
  | { type: 'SELECT_OPPONENT'; opponent: Opponent }
  | { type: 'SELECT_PLAYER_BOARD'; board: Board }
  | { type: 'SELECT_OPPONENT_BOARD'; board: Board }
  | { type: 'START_ROUND'; round: number }
  | { type: 'COMPLETE_ROUND'; result: RoundResult }
  | { type: 'NEXT_ROUND' }
  | { type: 'END_GAME'; winner: 'player' | 'opponent' | 'tie' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'UPDATE_OPPONENT_STATS'; opponentId: string; won: boolean };
```

**Key Features:**
- ✅ Discriminated union actions
- ✅ Type-safe dispatch
- ✅ Compiler catches invalid action props
- ✅ Complete state management coverage

---

### 6. `src/types/index.ts`
Central export for all types (barrel file).

```typescript
export type {
  Board, BoardMove, CellContent, Position, GridSize
} from './board';

export type {
  Opponent, OpponentType, OpponentStats
} from './opponent';

export type {
  UserProfile, OpponentStatsMap
} from './user';

export type {
  GameState, GamePhase, RoundResult, UrlPayload
} from './game-state';
```

---

## Schema Files Created

### 1. `src/schemas/board.schema.ts`
Zod validation schemas for boards.

```typescript
const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  grid: z.array(z.array(CellContentSchema).length(2)).length(2), // 2x2
  sequence: z.array(BoardMoveSchema).min(1),
  thumbnail: z.string(),
  createdAt: z.number().int().positive(),
});
```

**Custom Validators:**
- `validateBoardHasOnePiece()` - Ensures exactly 1 piece
- `validateBoardTrapCount()` - Ensures 0-3 traps

---

### 2. `src/schemas/opponent.schema.ts`
Zod validation for opponents.

```typescript
const OpponentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  type: z.enum(['human', 'cpu']),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
});
```

---

### 3. `src/schemas/user.schema.ts`
Zod validation for user profiles.

```typescript
const UserProfileSchema = z.object({
  name: z.string().min(1).max(50),
  greeting: z.string().max(200),
  savedBoards: z.array(BoardSchema),
  opponents: z.array(OpponentSchema),
});
```

---

### 4. `src/schemas/game-state.schema.ts`
Zod validation for complete game state.

```typescript
const GamePhaseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user-setup') }),
  z.object({ type: z.literal('opponent-selection') }),
  z.object({
    type: z.literal('board-selection'),
    round: z.number().int().min(1).max(8),
  }),
  // ... other phases
]);

const GameStateSchema = z.object({
  phase: GamePhaseSchema,
  user: UserProfileSchema,
  opponent: OpponentSchema.nullable(),
  currentRound: z.number().int().min(0).max(8),
  playerScore: z.number().int().min(0),
  opponentScore: z.number().int().min(0),
  playerSelectedBoard: BoardSchema.nullable(),
  opponentSelectedBoard: BoardSchema.nullable(),
  roundHistory: z.array(RoundResultSchema),
  checksum: z.string(),
});
```

**URL Payload Schema:**
```typescript
const UrlPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), changes: GameStateSchema.partial() }),
  z.object({ type: z.literal('full_state'), state: GameStateSchema }),
  z.object({ type: z.literal('resync_request'), requestId: z.string() }),
]);
```

---

### 5. `src/schemas/index.ts`
Central export for all schemas (barrel file).

---

## Key Patterns from kings-cooking

### 1. Discriminated Unions ✅
```typescript
// Compiler enforces type safety
function renderPhase(phase: GamePhase) {
  switch (phase.type) {
    case 'board-selection':
      return <BoardSelection round={phase.round} />; // TypeScript knows 'round' exists
    case 'round-results':
      return <RoundResults result={phase.result} />; // TypeScript knows 'result' exists
  }
}
```

### 2. Complete State Pattern ✅
```typescript
// NEVER return partial state
function reducer(state: GameState, action: GameAction): GameState {
  return {
    ...state, // Always spread entire state
    playerSelectedBoard: action.board,
    checksum: generateChecksum(state),
  };
}
```

### 3. Runtime Validation ✅
```typescript
// Validate at entry points (URL parse, LocalStorage load)
function parseGameState(json: unknown): GameState {
  return GameStateSchema.parse(json); // Throws on invalid data
}
```

---

## Validation Results

```bash
✅ TypeScript check: PASSED (zero errors)
✅ ESLint: PASSED (zero warnings)
✅ All types compile correctly
✅ All schemas validate correctly
```

---

## File Structure

```
src/
├── types/
│   ├── board.ts           ✅ Board data structures
│   ├── opponent.ts        ✅ Opponent types
│   ├── user.ts            ✅ User profile types
│   ├── game-state.ts      ✅ Complete game state with phases
│   ├── actions.ts         ✅ Reducer action types
│   └── index.ts           ✅ Central export
└── schemas/
    ├── board.schema.ts    ✅ Board validation + custom validators
    ├── opponent.schema.ts ✅ Opponent validation
    ├── user.schema.ts     ✅ User validation
    ├── game-state.schema.ts ✅ Complete state validation
    └── index.ts           ✅ Central export
```

---

## Usage Examples

### Type-Safe Phase Handling
```typescript
function handlePhase(phase: GamePhase): void {
  switch (phase.type) {
    case 'user-setup':
      // No extra props
      break;
    case 'board-selection':
      console.log(`Round ${phase.round}`); // TypeScript knows this exists
      break;
    case 'round-results':
      console.log(phase.result); // TypeScript knows this exists
      break;
  }
}
```

### Runtime Validation
```typescript
// Parse untrusted data (URL hash, LocalStorage)
function loadGameFromUrl(hash: string): GameState {
  const json = JSON.parse(decompressHash(hash));
  return GameStateSchema.parse(json); // Validates structure
}
```

### Custom Board Validation
```typescript
import { validateBoardHasOnePiece, validateBoardTrapCount } from '@/schemas';

function isValidBoard(board: Board): boolean {
  return (
    validateBoardHasOnePiece(board) &&
    validateBoardTrapCount(board)
  );
}
```

---

## Next Steps

With types and schemas complete, we can now:

1. ✅ Build utility functions (game logic, validation, thumbnails)
2. ✅ Create hooks (useGameState, useUrlSync, useLocalStorage)
3. ✅ Build components (UserProfile, BoardCreator, GamePlay)
4. ✅ Implement game simulation engine
5. ✅ Add URL hash synchronization

---

## Design Decisions

### Why Discriminated Unions?
- ✅ Compiler-enforced type safety
- ✅ Exhaustiveness checking in switch statements
- ✅ Autocomplete for phase-specific props
- ✅ Impossible to access non-existent properties

### Why Complete State?
- ✅ Prevents partial update bugs
- ✅ Easy to validate entire state
- ✅ Simplifies debugging (state is always consistent)
- ✅ Makes URL serialization straightforward

### Why Zod?
- ✅ Runtime validation at entry points
- ✅ Automatic type inference from schemas
- ✅ Great error messages
- ✅ Integrates with TypeScript seamlessly

---

**Status:** ✅ COMPLETE
**Verification:** All types compile, all schemas validate
**Next:** Build utility functions for game logic
