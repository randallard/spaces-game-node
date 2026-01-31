# RL Testing CLI - Design Document

## Overview

Interactive CLI tool for testing game boards during RL/ML training development. Provides session-based logging, replay capability, and comprehensive testing features.

**CRITICAL REQUIREMENT:** The CLI must use the **exact same** simulation and validation code that will be used in RL/ML training. This ensures that manual testing results exactly match what the training loop will experience.

### Engine Integration

- **Simulation Engine:** `spaces-game-engine/src/simulation.ts`
  - `simulateRound()` - Main simulation function
  - `isBoardPlayable()` - Board validation
  - Same code used by Python port via API or direct translation

- **Type Definitions:** `spaces-game-engine/src/types/`
  - `Board` type with sequence-only format
  - Grid auto-generated from sequence

- **No Duplication:** CLI is a thin wrapper around the engine, not a reimplementation

---

## Core Features

### 1. Interactive CLI Tool
- Define boards in simple format
- Run simulations interactively
- See results (winner, scores, moves, traps, etc.)
- Optional step-by-step text visualization

### 2. Test Board Library
- Pre-defined scenarios: "trap win", "goal race", "collision", etc.
- Verify engine behavior against known outcomes
- Regression testing suite

### 3. Board Generator + Validator
- Random valid board generator
- Run multiple simulations for outcome distribution
- Validate rejection of invalid boards
- Good for fuzzing/stress testing

### 4. Replay/Debug Tool
- Take exact board data from RL agent
- Step-by-step simulation replay
- Debug unexpected outcomes
- Trace execution path

### 5. Batch Testing
- Mass simulation runs
- Symmetry testing (swap player/opponent)
- Determinism verification
- Performance benchmarking

### 6. Session-Based Logging System
- Auto-logging: Every test automatically recorded during session
- Separate logs: Each session gets its own log file
- Session management: Save or discard at end
- Replay capability: Re-run any saved session

---

## CLI Commands

### Session Management

#### `session start [--name "description"] [--tags tag1,tag2]`
Starts a new testing session.

- Auto-saves incrementally (survives crashes/interruptions)
- Generates filename: `session-<timestamp>.json` or `session-<timestamp>-<name>.json`
- Optional tags/description at start
- Creates new session log file immediately

**Examples:**
```bash
session start
session start --name "trap-mechanics-testing"
session start --name "diagonal-validation" --tags validation,bugs
```

#### `session info`
Shows current session information.

- Current session filename
- Test count in this session
- Tags/description if any
- Session start time

**Example output:**
```
Active Session: session-1738130400-trap-mechanics-testing.json
Tests run: 12
Tags: traps, validation
Started: 2026-01-29 04:33:20
```

#### `session save [--name "description"] [--tags tag1,tag2]`
Ends session and keeps the log.

- Optionally add/update name and tags
- Session file already saved during session (just marks it complete)
- If no save command issued, file remains with default name

**Examples:**
```bash
session save
session save --name "final-trap-testing"
session save --tags regression,passing
```

#### `session discard`
Ends session and deletes the log.

- Deletes the session file
- Use when exploratory testing that doesn't need to be kept

---

### Testing Commands

#### `test [--player <board>] [--opponent <board>] [--interactive] [--expected winner|tie|player|opponent] [--notes "..."]`
Run a simulation test during active session.

**Board Input Formats (auto-detected):**

1. **Sequence-only JSON** (primary format for RL agents)
   ```bash
   test --player '{"boardSize": 2, "sequence": [...]}'
   ```
   - CLI auto-generates grid from sequence
   - If input starts with `{`, treated as JSON
   - What RL agents output for debugging

2. **Load from file**
   ```bash
   test --player ./boards/my-board.json
   test --player boards/trap-test.json
   ```
   - If input doesn't start with `{`, treated as file path
   - For reusable test cases

3. **Board collection with index**
   ```bash
   test --player ./boards/collection.json:0    # Use board at index 0
   test --player ./boards/collection.json:2    # Use board at index 2
   ```
   - File path with `:index` to select specific board from collection

4. **Interactive board builder**
   ```bash
   test --interactive
   ```
   - Guided prompts to build board step-by-step
   - Shows grid visualization as you build
   - Real-time validation
   - Similar to UI board creator

**Interactive Mode Example:**
```
Board size? 2
Starting position is (1,0) for player boards.

Grid:
  [  ][  ]
  [1●][  ]  ← You are here

Move 2: Where next? (row,col,type): 1,1,piece

Grid:
  [  ][  ]
  [1●][2●]  ← You are here

Move 3: Where next? (row,col,type): 0,1,piece

Grid:
  [  ][3●]
  [1●][2●]

Move 4: Where next? (row,col,type): 0,0,trap

Grid:
  [4X][3●]
  [1●][2●]

Move 5: Where next? (row,col,type): -1,0,goal

Final board:
  [4X][3●]
  [1●][2●]

Save to collection? (y/n): y
Collection file: ./my-boards.json
Name (optional): trap-test
Tags (optional, comma-separated): trap,validation
✓ Board added at index 3
```

**Supermove Visualization:**
```
Move 1: (1,1) piece
Move 2: (1,1) trap  (supermove!)
Move 3: (1,0) piece
Move 4: (0,0) piece

Grid:
  [    4●][      ]
  [    3●][1●,2X]  ← supermove: wider cell notation
```

**Examples:**
```bash
# JSON input
test --player '{"boardSize": 2, "sequence": [...]}' --opponent '{"boardSize": 2, "sequence": [...]}'

# File input
test --player ./boards/player1.json --opponent ./boards/opponent1.json

# Collection with index
test --player ./boards/collection.json:0 --opponent ./boards/collection.json:1

# Interactive
test --interactive

# With expectations
test --player ./boards/trap.json --opponent ./boards/victim.json --expected player --notes "Testing trap mechanics"

# Random opponent
test --player ./boards/my-board.json --random --expected player
```

**Persistence:** Saves command and result immediately after execution (every command, every result)

---

### Board Collection Management

#### `boards create <file>`
Create a new board collection file.

- Starts interactive board builder
- Creates new collection file with first board
- Name and tags are optional

**Example:**
```bash
boards create ./my-boards.json
# ... interactive board builder ...
Name (optional): basic-trap
Tags (optional, comma-separated): trap,validation
✓ Collection created with board at index 0
```

#### `boards add <file> [--name "name"] [--tags tag1,tag2]`
Add a board to an existing collection.

- Starts interactive board builder
- Checks for duplicate boards (exact sequence match)
- Prompts before saving if duplicate found
- Name and tags are optional

**Example:**
```bash
boards add ./my-boards.json --name "collision-test" --tags collision

# If duplicate detected:
⚠ This board already exists:

[2] trap-test [trap, validation]
    2x2 board, 5 moves
    Grid:
      [4X][3●]
      [1●][2●]
    Sequence:
      1. (1,0) piece
      2. (1,1) piece
      3. (0,1) piece
      4. (0,0) trap
      5. (-1,0) final

Save anyway? (y/n): n
✗ Board not saved
```

#### `boards list <file> [--compact] [--verbose]`
List all boards in a collection.

**Default: Full visualization**
```bash
boards list ./my-boards.json

Collection: my-boards.json (4 boards)

[0] basic-trap-win [trap, win]
    2x2 board, 5 moves
    Grid:
      [4X][3●]
      [1●][2●]

[1] collision-test [collision]
    2x2 board, 3 moves
    Grid:
      [    ][3●]
      [  1●][2●]

[2] supermove-example [supermove, trap]
    2x2 board, 4 moves
    Grid:
      [    4●][      ]
      [    3●][1●,2X]

[3] complex-3x3 [validation, pass]
    3x3 board, 8 moves
    Grid:
      [7●][6X][   ]
      [5●][4●][3X]
      [1●][2●][   ]
```

**Compact mode:**
```bash
boards list --compact ./my-boards.json
  [0] basic-trap-win [trap, win]
  [1] collision-test [collision]
  [2] (unnamed) [validation]
  [3] complex-3x3 [validation, pass]
```

**Verbose mode:**
```bash
boards list --verbose ./my-boards.json
# Includes full sequence details for each board
```

**Duplicate Detection:**
- All commands (`boards create`, `boards add`, `test --interactive`) check for exact duplicates
- Duplicate = same `boardSize` and same `sequence` (positions, types, order)
- Shows full board visualization when duplicate found
- Prompts user to confirm saving anyway

---

### Session Replay Commands

#### `session list`
Shows all saved sessions.

- Session ID/filename
- Name/description
- Tags
- Test count
- Timestamp

**Example output:**
```
Saved Sessions:
  1. session-1738130400-trap-mechanics.json
     Tests: 15 | Tags: traps,validation | 2026-01-29 04:33:20

  2. session-1738131000.json
     Tests: 8 | Tags: none | 2026-01-29 04:50:00
```

#### `session replay <session-id-or-name>`
Re-runs all tests from a saved session.

- Re-executes every test with same boards
- Shows pass/fail for each (if expected outcome was specified)
- Summary at end
- Good for regression testing after engine changes

**Example:**
```bash
session replay session-1738130400
session replay trap-mechanics
```

---

## File Formats

### Session File Format

Each session is saved as a JSON file with complete information for replay.

```json
{
  "sessionId": "session-1738130400",
  "timestamp": "2026-01-29T04:33:20Z",
  "name": "trap-mechanics-testing",
  "tags": ["traps", "validation"],
  "status": "active|saved|completed",
  "tests": [
    {
      "testNumber": 1,
      "timestamp": "2026-01-29T04:33:45Z",
      "playerBoard": {
        "boardSize": 2,
        "sequence": [
          { "position": { "row": 1, "col": 0 }, "type": "piece", "order": 1 },
          { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 2 },
          { "position": { "row": 0, "col": 1 }, "type": "piece", "order": 3 },
          { "position": { "row": 0, "col": 0 }, "type": "trap", "order": 4 }
        ]
      },
      "opponentBoard": {
        "boardSize": 2,
        "sequence": [
          { "position": { "row": 1, "col": 0 }, "type": "piece", "order": 1 },
          { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 2 },
          { "position": { "row": 0, "col": 1 }, "type": "piece", "order": 3 },
          { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 4 }
        ]
      },
      "opponentGenerated": false,
      "expectedOutcome": "player",
      "notes": "Testing diagonal trap placement",
      "result": {
        "round": 1,
        "winner": "player",
        "playerPoints": 3,
        "opponentPoints": 0,
        "collision": false,
        "playerFinalPosition": { "row": 0, "col": 0 },
        "opponentFinalPosition": { "row": 0, "col": 0 },
        "simulationDetails": {
          "playerMoves": 3,
          "opponentMoves": 4,
          "playerHitTrap": false,
          "opponentHitTrap": true,
          "playerLastStep": 3,
          "opponentLastStep": 3
        }
      },
      "validationPassed": true,
      "testPassed": true
    }
  ]
}
```

**Note:** Boards are stored as sequence-only. Grid is auto-generated by CLI when needed for display.

### Board Collection File Format

Board collections contain multiple indexed boards with metadata.

```json
{
  "collection": "my-test-boards",
  "created": "2026-01-29T04:33:20Z",
  "boards": [
    {
      "index": 0,
      "name": "basic-trap-win",
      "tags": ["trap", "win"],
      "created": "2026-01-29T04:33:20Z",
      "board": {
        "boardSize": 2,
        "sequence": [
          { "position": { "row": 1, "col": 0 }, "type": "piece", "order": 1 },
          { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 2 },
          { "position": { "row": 0, "col": 1 }, "type": "piece", "order": 3 },
          { "position": { "row": 0, "col": 0 }, "type": "trap", "order": 4 },
          { "position": { "row": -1, "col": 0 }, "type": "final", "order": 5 }
        ]
      }
    },
    {
      "index": 1,
      "name": "collision-test",
      "tags": ["collision"],
      "created": "2026-01-29T04:35:12Z",
      "board": {
        "boardSize": 2,
        "sequence": [
          { "position": { "row": 1, "col": 0 }, "type": "piece", "order": 1 },
          { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 2 },
          { "position": { "row": 0, "col": 1 }, "type": "piece", "order": 3 }
        ]
      }
    }
  ]
}
```

### File Naming Convention

- Default: `session-<unix-timestamp>.json`
- With name: `session-<unix-timestamp>-<slugified-name>.json`
- Example: `session-1738130400-trap-mechanics-testing.json`

### Storage Location

- Default: `./test-sessions/`
- Configurable via environment variable or config file

---

## Resolved Design Decisions

### Question 1: Board Input Format ✅

**RESOLVED:** Multi-format with auto-detection

Boards can be provided in multiple ways:
1. **Sequence-only JSON** - Primary format, grid auto-generated from sequence
2. **File path** - Auto-detected (doesn't start with `{`)
3. **Board collection with index** - File path with `:index` notation
4. **Interactive mode** - `--interactive` flag triggers guided builder with natural language commands

**Key decisions:**
- Grid is ALWAYS auto-generated from sequence (never manually specified)
- CLI auto-detects JSON vs file path (JSON starts with `{`)
- Interactive mode provides step-by-step visualization with move numbers
- Supermove cells shown as `[1●,2X]` with wider formatting
- All inputs validate before running simulation

---

## Interactive Mode Detailed Specification

### Command Structure
```bash
test --interactive [--size 2|3|4|5] [--start-col 0|1|2|3|4]
```

**Arguments:**
- `--size`: Board size (default: 2)
- `--start-col`: Starting column, 0 = farthest left (default: 0)

### Interactive Commands

**Movement Commands:**
- `move <direction>` or `m <direction>` - Move piece in direction
- `trap <direction>` or `t <direction>` - Place trap in direction
- `[row,col,type]` - Direct coordinate entry (e.g., `1,1,piece` or `1,1,p`)

**Special Commands:**
- `finish` or `f` - Auto-complete straight path to goal
- `undo` or `u` - Remove last move
- `restart` or `reset` or `r` - Start over from beginning
- `help` or `h` - Show command help

**Directions:** `up`, `down`, `left`, `right` (or `u`, `d`, `l`, `r`)

**Types:** `piece`/`p`, `trap`/`t`, `goal`/`g`

### Help Command Output

```
> help

Movement Commands:
  move <dir>, m <dir>   Move piece (up/down/left/right or u/d/l/r)
  trap <dir>, t <dir>   Place trap (up/down/left/right or u/d/l/r)
  [row,col,type]        Direct entry (e.g., 1,1,piece or 1,1,p)

Special Commands:
  finish, f             Auto-complete straight path to goal
  undo, u               Remove last move
  restart, reset, r     Start over from beginning
  help, h               Show this help

Game Rules & Documentation:
  https://spaces-game.vercel.app/rules

Current position: (1,0)
```

### Complete Interactive Flow

```bash
test --interactive --size 3 --start-col 1

Starting position: (2,1)

Grid:
  [  ][  ][  ]
  [  ][  ][  ]
  [  ][1●][  ]  ← You are here

> m right

Grid:
  [  ][  ][  ]
  [  ][  ][  ]
  [  ][1●][2●]  ← You are here

> t left

Grid:
  [  ][  ][  ]
  [  ][  ][  ]
  [  ][3X][2●]

> m up

Grid:
  [  ][  ][  ]
  [  ][  ][4●]
  [  ][3X][2●]  ← You are here

> m up

Grid:
  [  ][  ][5●]
  [  ][  ][4●]
  [  ][3X][2●]  ← You are here

> f

Auto-completing straight path to goal...
✓ Path verified (no traps in forward column)

Grid:
  [  ][  ][5●]
  [  ][  ][4●]
  [  ][3X][2●]

Final position: (-1,2)

Final board:
  [  ][  ][5●]
  [  ][  ][4●]
  [  ][3X][2●]

6 moves total. Confirm? (y/n): y

Save to collection? (y/n): n

Opponent board [interactive/file/json/random]: random

✓ Random opponent board generated (3x3)

Running simulation...
```

### Finish Command Behavior

**Success case:**
```
Grid:
  [  ][3●]
  [1●][2●]  ← You are here (1,1)

> f

Auto-completing straight path to goal...
✓ Path verified (no traps in forward column)

Grid:
  [4●][3●]
  [1●][2●]

Final position: (-1,1)
```

**Error case (trap in path):**
```
Grid:
  [4X][3●]
  [1●][2●]  ← You are here (0,1)

> f

Auto-completing straight path to goal...
❌ Error: Cannot finish - trap at (0,1) blocks direct path to goal
   Remove trap or continue manually

>
```

### Undo/Restart Flow

**Undo:**
```
Grid:
  [  ][3●]
  [4X][2●]

> u

Grid:
  [  ][3●]
  [1●][2●]  ← You are here (1,1)

Last move undone.

>
```

**Restart:**
```
Grid:
  [4X][3●]
  [1●][2●]

> r

Restart board? This will clear all moves. (y/n): y

Board size [default: 3]: 2
Starting column (0 for farthest left) [default: 0]:

Grid:
  [  ][  ]
  [1●][  ]  ← You are here (1,0)

>
```

### Real-time Validation

**Invalid move (diagonal):**
```
Grid:
  [  ][  ]
  [1●][2●]  ← You are here (1,1)

> 0,0,p

❌ Error: Invalid move - diagonal movement not allowed
   From (1,1) to (0,0) is diagonal

>
```

**Invalid move (into trap):**
```
Grid:
  [  ][  ]
  [3X][2●]  ← You are here (1,1)

> m left

❌ Error: Cannot move into trap at (1,0)

>
```

**Invalid move (jump):**
```
Grid:
  [  ][  ]
  [1●][2●]  ← You are here (1,1)

> 0,1,p

❌ Error: Invalid move - must move to adjacent square
   Distance from (1,1) to (0,1) requires 1 step up first

>
```

**Supermove constraint:**
```
Grid:
  [      ][      ]
  [      ][1●,2X]  ← Supermove: must move on next step

> 1,1,t

❌ Error: After supermove, piece must move to different position
   Cannot place another trap at (1,1)

> m left

Grid:
  [      ][      ]
  [    3●][1●,2X]  ← Valid

>
```

### Opponent Board Entry

After player board is complete:

```
Opponent board [interactive/file/json/random]:

Options:
  interactive  - Build opponent board step-by-step
  file         - Load from file path
  json         - Paste JSON board
  random       - Generate random valid board

> interactive
# ... starts interactive flow for opponent board ...

> file
File path: ./boards/opponent1.json
✓ Loaded opponent board from ./boards/opponent1.json

> json
Paste JSON (Ctrl+D when done):
{
  "boardSize": 2,
  "sequence": [...]
}
✓ Opponent board validated

> random
Generate random board:
  Size [match player: 2]:
  Min traps [0]: 1
✓ Random opponent board generated (2x2, 1 trap)
```

### Validation Rules

All moves are validated in real-time:
1. ✅ Must be adjacent (orthogonal only)
2. ✅ Cannot move diagonally
3. ✅ Cannot jump (>1 square)
4. ✅ Cannot move into trap
5. ✅ Traps only adjacent to piece or at current position
6. ✅ After supermove, must move piece on next step
7. ✅ Board must end with goal (finish command or manual goal entry)

---

### Question 2: Random Opponent Generation

When using `test --random`, how should the opponent board be generated?

**Considerations:**

1. **Board Size**
   - Match player's board size?
   - Allow specification: `--random-size 3`?
   - Random size within range (2-5)?

2. **Validity Constraints**
   - Must be playable (pass validation)?
   - Must have at least one trap?
   - Must reach goal or end somewhere specific?
   - Any minimum/maximum sequence length?

3. **Difficulty/Strategy**
   - Completely random valid moves?
   - Attempt to counter player's strategy?
   - Generate "interesting" boards (avoid trivial ones)?
   - Different difficulty levels: `--random easy|medium|hard`?

4. **Reproducibility**
   - Save random seed with test for exact replay?
   - Or just save the generated board (already in log)?

5. **Configuration**
   - Allow constraints: `--random --min-traps 1 --max-sequence 10`?
   - Or keep it simple: just generate any valid board?

**Examples of what this might look like:**
```bash
# Simple random
test --random

# Random with constraints
test --random --size 3 --min-traps 2

# Random with difficulty
test --random --difficulty hard

# Reproducible random
test --random --seed 12345
```

**Recommendation needed from user**

---

### Question 3: Auto-save Timing

**RESOLVED:** Save every command and every result as they are entered and computed.

- Command saved immediately when entered
- Result saved immediately when computed
- Ensures no data loss if process crashes
- Session file is always up-to-date

---

## Implementation Notes

### Technology Stack
- **Language:** TypeScript (matches existing engine)
- **CLI Framework:** TBD (Commander.js for commands, Inquirer.js for prompts?)
- **File I/O:** Node.js fs module with JSON
- **Location:** `spaces-game-engine/cli/` directory
- **Engine Import:** Direct imports from `../src/simulation.ts` and `../src/types/`

### Architecture

```
spaces-game-engine/
├── src/
│   ├── simulation.ts          ← Core engine (already exists)
│   ├── types/                 ← Type definitions (already exists)
│   └── index.ts               ← Public API
├── cli/
│   ├── index.ts               ← CLI entry point
│   ├── commands/
│   │   ├── session.ts         ← Session management
│   │   ├── test.ts            ← Test command
│   │   ├── boards.ts          ← Board collection management
│   │   └── replay.ts          ← Session replay
│   ├── interactive/
│   │   ├── builder.ts         ← Interactive board builder
│   │   └── visualizer.ts      ← Grid visualization
│   └── utils/
│       ├── grid-generator.ts  ← Generate grid from sequence
│       ├── validation.ts      ← Thin wrapper around isBoardPlayable
│       └── file-manager.ts    ← Session/collection file I/O
└── test-sessions/             ← Session storage directory
```

**Key Principle:** CLI code only handles:
- User interaction (prompts, output formatting)
- File I/O (sessions, collections)
- Visualization (ASCII grid rendering)

All game logic delegated to `src/simulation.ts` - **no reimplementation**

### Session Storage
- Directory: `./test-sessions/` (configurable)
- Format: JSON (human-readable, easy to replay)
- Backup: Consider auto-backup before replay overwrites

### Validation
- All boards validated using `isBoardPlayable()` from `src/simulation.ts`
- **Exactly the same validation** that RL training will use
- Validation errors logged in session
- Option to save even failed validations for debugging
- Interactive mode validates moves in real-time (also using engine validation)

### Error Handling
- Graceful handling of invalid boards
- Clear error messages
- Don't crash session on single test failure

---

## Future Enhancements

### Phase 2 Features (after initial implementation)
- Export session to test suite format
- Compare sessions (diff two test runs)
- Merge sessions
- Filter/search sessions by tags
- Statistics dashboard (win rates, average scores, etc.)
- Visualization of board states (ASCII art)
- Integration with CI/CD for regression testing

### Phase 3 Features (advanced)
- Real-time session sharing (multiple users)
- Cloud storage for sessions
- Board generator presets/templates
- ML agent integration (test against actual trained agents)
- Performance profiling per test

---

## Next Steps

1. **Resolve Open Questions:**
   - Board input format (Question 1)
   - Random opponent generation (Question 2)

2. **Create Implementation Plan:**
   - CLI command structure
   - Session manager module
   - Board input handlers
   - Replay engine

3. **Build MVP:**
   - Basic session start/save/discard
   - Simple board input (choose one format to start)
   - Run simulation and log results
   - Basic replay functionality

4. **Iterate:**
   - Add remaining input formats
   - Enhance random generation
   - Add visualization/reporting
   - Build test board library
