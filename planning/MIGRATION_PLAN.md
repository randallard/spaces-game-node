# Spaces Game - Node/TypeScript Migration Plan

## Executive Summary

Migrating **Spaces Game** from Rust/Leptos to TypeScript/React/Node, using **kings-cooking** as the architectural reference. This version will be turn-based (removing timed game speeds) with URL hash fragment communication for state sharing.

**Source Codebases:**
- `/home/ryankhetlyr/Development/spaces-game` (Rust/Leptos original)
- `/home/ryankhetlyr/Development/kings-cooking` (TypeScript/React reference)
- `/home/ryankhetlyr/Development/spaces-game-node` (new project)

---

## Key Architectural Changes

### 1. Remove Game Speeds ❌
- **Old:** Lightning (1s), Quick (5s), Relaxed (10s), Chill (unlimited)
- **New:** Pure turn-based gameplay, no time pressure
- Players select boards at their own pace
- Remove speed selection UI entirely

### 2. Add URL Hash Fragment Communication ✅
Following kings-cooking pattern:
- Compress game state into URL hash using `lz-string`
- Three payload types: `delta`, `full_state`, `resync_request`
- Enable easy game sharing via URL
- Debounced URL updates (prevent history spam)
- Use `replaceState` not `pushState`

### 3. Complete Game State Pattern ✅
Following kings-cooking principle:
- **NEVER update partial state**
- Every state change returns complete `GameState` object
- Validate with Zod schema at entry points
- Prevents state inconsistency bugs

### 4. No Dark/Light Mode Toggle 🎨
- Single "middle of the road" color scheme
- Neutral palette: grays, blues, subtle accents
- Accessible contrast ratios
- Professional but not too dark or too light

---

## Tech Stack (Matching kings-cooking)

### Core Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "lz-string": "^1.5.0",
  "zod": "^3.22.0",
  "zod-validation-error": "^4.0.2",
  "uuid": "^13.0.0"
}
```

### Dev Dependencies
```json
{
  "@vitejs/plugin-react": "^5.0.4",
  "vite": "^7.1.7",
  "typescript": "~5.9.3",
  "vitest": "^3.0.0",
  "@vitest/coverage-v8": "^3.0.0",
  "eslint": "^9.36.0",
  "typescript-eslint": "^8.45.0",
  "prettier": "^3.1.1",
  "babel-plugin-react-compiler": "^0.0.0-experimental-c8b3f72-20240517"
}
```

### Build Tools
- **Vite 7.1** - Fast dev server and build
- **TypeScript 5.9** - Strict mode enabled
- **ESLint** - Zero warnings policy
- **Vitest** - Unit/integration tests
- **Playwright** - E2E tests (future)

---

## Project Structure

```
spaces-game-node/
├── planning/
│   ├── MIGRATION_PLAN.md          # This document
│   └── ARCHITECTURE.md             # Detailed technical decisions
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component
│   ├── App.module.css              # Global styles
│   ├── types/                      # TypeScript types
│   │   ├── game-state.ts           # Complete GameState type
│   │   ├── board.ts                # Board data structures
│   │   ├── opponent.ts             # Opponent types
│   │   └── user.ts                 # User profile types
│   ├── schemas/                    # Zod validation schemas
│   │   ├── game-state.schema.ts
│   │   ├── board.schema.ts
│   │   └── url-payload.schema.ts
│   ├── components/                 # React components (vertical slices)
│   │   ├── UserProfile/
│   │   │   ├── UserProfile.tsx
│   │   │   └── UserProfile.module.css
│   │   ├── BoardCreator/
│   │   │   ├── BoardCreator.tsx
│   │   │   ├── BoardGrid.tsx
│   │   │   ├── BoardThumbnail.tsx
│   │   │   └── BoardCreator.module.css
│   │   ├── OpponentManager/
│   │   │   ├── OpponentList.tsx
│   │   │   └── OpponentManager.module.css
│   │   ├── GamePlay/
│   │   │   ├── GamePlay.tsx
│   │   │   ├── BoardSelection.tsx
│   │   │   ├── GameBoard.tsx
│   │   │   ├── RoundResults.tsx
│   │   │   └── GamePlay.module.css
│   │   └── SavedBoards/
│   │       ├── SavedBoardsGrid.tsx
│   │       └── SavedBoards.module.css
│   ├── hooks/                      # Custom React hooks
│   │   ├── useGameState.ts         # Main game state management
│   │   ├── useUrlSync.ts           # URL hash synchronization
│   │   ├── useLocalStorage.ts      # LocalStorage persistence
│   │   └── useOpponents.ts         # Opponent CRUD operations
│   ├── utils/                      # Utility functions
│   │   ├── url-compression.ts      # lz-string helpers
│   │   ├── board-validation.ts     # Board logic validation
│   │   ├── game-simulation.ts      # Game round simulation
│   │   ├── scoring.ts              # Scoring calculations
│   │   └── svg-thumbnail.ts        # SVG board thumbnail generation
│   ├── constants/                  # Constants and config
│   │   ├── game-rules.ts           # Board size, rounds, etc.
│   │   └── colors.ts               # Color palette
│   └── __tests__/                  # Test files (co-located)
├── public/                         # Static assets
├── index.html                      # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc
└── README.md
```

---

## Data Models

### GameState (Complete State Object)
```typescript
type GameState = {
  phase: GamePhase;
  user: UserProfile;
  opponent: Opponent;
  currentRound: number; // 1-8
  playerScore: number;
  opponentScore: number;
  playerSelectedBoard: Board | null;
  opponentSelectedBoard: Board | null;
  roundHistory: RoundResult[];
  checksum: string; // For validation
};

type GamePhase =
  | { type: 'user-setup' }
  | { type: 'board-selection'; round: number }
  | { type: 'round-results'; round: number; result: RoundResult }
  | { type: 'game-over'; winner: 'player' | 'opponent' | 'tie' };
```

### Board
```typescript
type Board = {
  id: string; // UUID
  name: string;
  grid: CellContent[][]; // 2x2 grid
  sequence: BoardMove[]; // Ordered list of moves
  thumbnail: string; // SVG data URI
  createdAt: number; // timestamp
};

type CellContent = 'empty' | 'piece' | 'trap';

type BoardMove = {
  position: { row: number; col: number };
  type: 'piece' | 'trap';
  order: number;
};
```

### Opponent
```typescript
type Opponent = {
  id: string;
  name: string;
  type: 'human' | 'cpu';
  wins: number;
  losses: number;
};
```

### UserProfile
```typescript
type UserProfile = {
  name: string;
  greeting: string;
  savedBoards: Board[];
  opponents: Opponent[];
};
```

### URL Payload Types
```typescript
type UrlPayload =
  | { type: 'delta'; changes: Partial<GameState> }
  | { type: 'full_state'; state: GameState }
  | { type: 'resync_request'; requestId: string };
```

---

## Color Scheme (Middle of the Road)

### Neutral Palette
```css
:root {
  /* Background layers */
  --bg-primary: #f5f5f5;       /* Light gray background */
  --bg-secondary: #ffffff;     /* White cards/panels */
  --bg-tertiary: #e8e8e8;      /* Subtle borders/dividers */

  /* Text */
  --text-primary: #2c2c2c;     /* Dark gray text */
  --text-secondary: #666666;   /* Medium gray */
  --text-muted: #999999;       /* Light gray */

  /* Accents */
  --accent-primary: #4a90e2;   /* Blue (primary actions) */
  --accent-secondary: #5ba3f5; /* Lighter blue (hover) */
  --accent-success: #52c41a;   /* Green (wins) */
  --accent-danger: #f5222d;    /* Red (losses/traps) */
  --accent-warning: #faad14;   /* Orange (warnings) */

  /* Game elements */
  --piece-color: #4a90e2;      /* Player piece (blue) */
  --trap-color: #f5222d;       /* Trap marker (red) */
  --opponent-piece: #722ed1;   /* Opponent piece (purple) */
  --board-grid: #d9d9d9;       /* Grid lines */

  /* Interactive */
  --button-primary: #4a90e2;
  --button-hover: #3a7bc8;
  --button-disabled: #bfbfbf;
}
```

---

## Core Features to Migrate

### Phase 1: Foundation (Week 1)
1. ✅ **Project Setup**
   - Initialize package.json
   - Configure Vite + TypeScript + ESLint
   - Set up folder structure
   - Create base types and schemas

2. ✅ **User Profile**
   - User name and greeting
   - LocalStorage persistence
   - Profile editing UI

3. ✅ **Board Creation**
   - 2x2 grid UI
   - Place piece and traps
   - Sequence tracking
   - SVG thumbnail generation
   - Board validation (at least one valid move)

### Phase 2: Core Gameplay (Week 2)
4. ✅ **Saved Boards Management**
   - Grid display of saved boards
   - Delete boards
   - Select board for game

5. ✅ **Opponent Management**
   - Add human opponents
   - CPU opponent (always available)
   - Win/loss tracking
   - Opponent selection UI

6. ✅ **Game State Machine**
   - Phase transitions using useReducer
   - Complete state updates only
   - Zod validation on state changes

### Phase 3: Game Logic (Week 3)
7. ✅ **Board Selection Phase**
   - Player selects board from saved boards
   - Opponent board selection (random for CPU)
   - Display both boards (with opponent fog of war)

8. ✅ **Game Simulation**
   - 8-round game format
   - Square-by-square movement
   - Trap detection
   - Collision detection
   - Scoring calculation (forward moves)
   - Round results display

9. ✅ **Win/Loss Tracking**
   - Update opponent stats
   - Persist to LocalStorage
   - Display statistics

### Phase 4: URL Sharing (Week 4)
10. ✅ **URL Hash Synchronization**
    - Compress GameState to URL hash
    - Parse hash on page load
    - Debounced updates (500ms)
    - Three payload types support
    - Validation with Zod

11. ✅ **Share Functionality**
    - Copy game URL to clipboard
    - Share button in UI
    - Handle invalid/corrupted URLs gracefully

### Phase 5: Polish (Week 5)
12. ✅ **UI/UX Refinements**
    - Responsive design
    - Loading states
    - Error boundaries
    - Smooth transitions
    - Accessibility (keyboard nav, ARIA labels)

13. ✅ **Testing**
    - Unit tests for game logic
    - Integration tests for state machine
    - E2E tests for critical flows

14. ✅ **Documentation**
    - README with game rules
    - Architecture documentation
    - Deployment instructions

---

## Key Differences from Original

| Feature | Rust/Leptos Version | TypeScript/React Version |
|---------|---------------------|--------------------------|
| Game Speed | 4 speed options | ❌ Removed (turn-based) |
| State Sharing | LocalStorage only | ✅ URL hash + LocalStorage |
| State Updates | Signal-based | ✅ Complete state objects |
| Theme | Dark mode | ✅ Single neutral theme |
| Build Time | ~30s (Rust compile) | ~2s (Vite) |
| Bundle Size | ~120KB (WASM) | ~150KB (React) |
| Dev Experience | Rust learning curve | TypeScript/React (familiar) |

---

## Kings-Cooking Patterns to Adopt

### 1. URL Synchronization Hook
```typescript
// src/hooks/useUrlSync.ts
function useUrlSync(gameState: GameState) {
  const updateUrl = useRef(
    debounce((state: GameState) => {
      const compressed = compressGameState(state);
      window.history.replaceState(null, '', `#${compressed}`);
    }, 500)
  ).current;

  useEffect(() => {
    updateUrl(gameState);
  }, [gameState]); // Empty deps - use ref callback pattern
}
```

### 2. Complete State Reducer
```typescript
// src/hooks/useGameState.ts
function gameStateReducer(
  state: GameState,
  action: GameAction
): GameState {
  // ALWAYS return complete state
  switch (action.type) {
    case 'select-board':
      return {
        ...state, // Spread entire state
        playerSelectedBoard: action.board,
        checksum: generateChecksum({ ...state, playerSelectedBoard: action.board })
      };
    // Never return partial updates!
  }
}
```

### 3. Zod Validation at Entry Points
```typescript
// src/utils/url-compression.ts
function decompressGameState(hash: string): GameState {
  const decompressed = LZString.decompressFromEncodedURIComponent(hash);
  const json = JSON.parse(decompressed);

  // Validate at entry point
  return GameStateSchema.parse(json);
}
```

### 4. Discriminated Union State Machine
```typescript
// src/types/game-state.ts
type GamePhase =
  | { type: 'user-setup' }
  | { type: 'board-selection'; round: number }
  | { type: 'round-results'; round: number; result: RoundResult }
  | { type: 'game-over'; winner: 'player' | 'opponent' | 'tie' };

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

---

## Game Rules (Preserved from Original)

### Board Rules
- **Grid Size:** 2x2 cells
- **Piece Placement:** Exactly 1 piece (player's position)
- **Trap Placement:** 0-3 traps (opponent hits these and loses)
- **Sequence:** Each placement is numbered in order
- **Validation:** Must have at least one valid move sequence

### Game Rules
- **Format:** 8 rounds per game
- **Board Selection:** Each round, both players select a saved board
- **Simulation:** Boards are simulated simultaneously
  - Players move forward on opponent's board
  - Hit a trap → lose the round
  - Hit opponent's piece → lose the round
  - Safe moves → score points for forward progress
- **Scoring:** Points awarded for each safe forward move
- **Winner:** Most points after 8 rounds

### CPU Opponent
- Randomly selects from player's saved boards
- No intelligent strategy (for now)

---

## Migration Strategy

### Step 1: Scaffold (Day 1)
- ✅ Initialize npm project
- ✅ Copy package.json structure from kings-cooking
- ✅ Set up Vite, TypeScript, ESLint config
- ✅ Create folder structure
- ✅ Create base types and schemas

### Step 2: Static UI (Days 2-3)
- Build components without state
- CSS modules for styling
- Neutral color scheme
- Responsive layouts

### Step 3: State Management (Days 4-5)
- Implement useGameState reducer
- Complete state pattern
- Zod validation
- LocalStorage persistence

### Step 4: Game Logic (Days 6-8)
- Board creation logic
- Game simulation engine
- Scoring calculations
- Round progression

### Step 5: URL Sync (Days 9-10)
- Implement useUrlSync hook
- Compression/decompression
- Hash parsing on load
- Share functionality

### Step 6: Testing & Polish (Days 11-14)
- Unit tests for critical logic
- Integration tests for state machine
- E2E tests for user flows
- UI refinements
- Documentation

---

## Success Criteria

- ✅ All original features working (minus game speeds)
- ✅ URL hash sharing functional
- ✅ Complete state pattern enforced
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ 80%+ test coverage
- ✅ Responsive on mobile/desktop
- ✅ Accessible (keyboard nav, screen readers)
- ✅ Fast build times (<5s)
- ✅ Fast dev server (<1s cold start)

---

## Future Enhancements (Post-MVP)

1. **Multiplayer**
   - Real-time sync via WebSocket
   - PostgreSQL backend
   - GitHub OAuth login

2. **Larger Boards**
   - 3x3, 4x4 grid options
   - More complex strategies

3. **AI Opponent**
   - Intelligent board selection
   - Strategy evaluation

4. **Analytics**
   - Board win rates
   - Strategy effectiveness
   - Opponent statistics

5. **Social Features**
   - Board sharing
   - Leaderboards
   - Friend challenges

---

## Questions / Decisions Needed

- [ ] Should we preserve existing user data from LocalStorage? (Migration path?)
- [ ] Max number of saved boards per user?
- [ ] Max number of opponents per user?
- [ ] Default board names? (e.g., "Board 1", "Board 2")
- [ ] Animation timing for round results?
- [ ] Sound effects? (optional)

---

## References

- **Original Codebase:** `/home/ryankhetlyr/Development/spaces-game`
- **Architecture Reference:** `/home/ryankhetlyr/Development/kings-cooking`
- **New Project:** `/home/ryankhetlyr/Development/spaces-game-node`

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Initialize project (package.json, configs)
3. ⏳ Create base types and schemas
4. ⏳ Build User Profile component
5. ⏳ Build Board Creator component
6. ⏳ Implement game state machine
7. ⏳ Add URL synchronization
8. ⏳ Testing and polish

---

**Document Status:** Draft v1.0
**Last Updated:** 2025-11-05
**Author:** Migration Plan (AI-Generated)
