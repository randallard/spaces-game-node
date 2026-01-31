# CLI Usage Guide

Complete guide for using the Spaces Game CLI testing tool.

## Quick Start

```bash
# Interactive mode - build and test a board
npm run cli -- test --interactive

# Run a test (auto-creates session if needed)
npm run cli -- test --player board.json --opponent random

# Re-run the last test
npm run cli -- test --last

# Replay the session
npm run cli -- session list
npm run cli -- session replay <session-id>
```

**Note:** Tests automatically create and log to a session. You don't need to manually start a session unless you want custom metadata.

## Commands

### Generate Boards Command

Generate all possible legal opponent boards for a given size using systematic generation with backtracking.

#### Basic Usage

```bash
# Generate boards for a specific size
npm run cli -- generate-boards --size 2
npm run cli -- generate-boards --size 3 --limit 1000

# View generated boards visually (paged, 5 at a time)
npm run cli -- generate-boards --size 2 --view

# Save to file
npm run cli -- generate-boards --size 2 --output my-boards.json

# Force regeneration (ignore cache)
npm run cli -- generate-boards --size 3 --force

# Regenerate and view
npm run cli -- generate-boards --size 2 --force --view
```

#### Options

- `--size <n>` (required) - Board size (2-99)
- `--limit <n>` (optional) - Maximum boards to generate (default: 500)
- `--output <file>` (optional) - Save boards to file in current directory
- `--force` (optional) - Regenerate even if cache exists
- `--view` (optional) - Display all generated boards visually (5 per page with pagination)

#### How It Works

The generator creates boards using **depth-first search with backtracking**, following strict rules to create "reasonable" opponent boards:

**Movement Rules:**
1. Pieces move orthogonally only (no diagonals)
2. Pieces can move horizontally (same row) to unused cells
3. Pieces can move forward (decrease row number) to unused cells
4. Pieces NEVER move backward (never increase row)
5. Never revisit a cell that already had a piece
6. When piece reaches row 0, next move MUST go to goal (-1, col)

**Trap Rules:**
1. Traps can be adjacent to current piece position
2. Traps can be at current position (supermove)
3. Traps NEVER placed "behind" piece (row > current row)
4. After supermove, next move MUST be piece movement
5. No traps allowed once piece reaches row 0

#### Caching Strategy

Generated boards are automatically cached to `/tmp/spaces-game-boards-size-{N}-limit-{L}.json`:

- **Automatic**: First generation creates cache
- **Fast**: Subsequent uses load from cache instantly
- **Persistent**: Cache survives between CLI sessions
- **Smart**: Different size/limit combinations have separate caches

#### Generation Strategy

- **Sizes 2-5**: Exhaustive generation (up to limit)
- **Sizes 6+**: Smart sampling (future optimization)
- **Progress**: Shows updates every 50 boards
- **Validation**: All generated boards are validated before inclusion

#### Examples

```bash
# Quick generation for size 2 (very fast, ~16 boards)
npm run cli -- generate-boards --size 2

# View all generated boards visually
npm run cli -- generate-boards --size 2 --view
# Shows 5 boards at a time, prompts to continue for next page

# Larger generation for size 3 (~500-2000 possible boards)
npm run cli -- generate-boards --size 3 --limit 1000

# Generate and save to collection file
npm run cli -- generate-boards --size 2 --output size2-boards.json

# Regenerate cache (useful after engine updates)
npm run cli -- generate-boards --size 3 --force

# Use generated boards in tests
npm run cli -- test --player my-board.json --opponent size2-boards.json:0
```

#### Integration with Test Command

Once boards are generated and cached, the `test` command automatically uses them:

```bash
# First, generate boards for size 3
npm run cli -- generate-boards --size 3

# Now random opponent selection will use cached boards
npm run cli -- test --player my-board.json --opponent random
```

The random opponent generation will prefer cached boards over the legacy random algorithm, ensuring more diverse and systematic testing.

#### Performance

- **Size 2**: 16 boards (exhaustive), ~3ms
- **Size 3**: 500+ boards (with default limit), ~25ms
- **Size 4**: ~10,000-50,000 boards (estimated), 30-120 seconds
- **Size 5+**: Exponential growth, use --limit to cap

**Note**: Generation is very fast due to efficient backtracking algorithm and caching. Second access is instant (loads from cache).

#### Viewing Boards

Use the `--view` flag to visually inspect generated boards:

```bash
npm run cli -- generate-boards --size 2 --view
```

**View Features:**
- Shows all boards in visual grid format (same as test results)
- Pages 5 boards at a time for easy viewing
- Prompts to continue after each page
- Shows board numbers (e.g., "Board 1/16")
- Color-coded: pieces in blue, traps in red
- Supermoves show both colors: `4●` (blue) `,` (gray) `5X` (red)

**Useful for:**
- Understanding what boards are being generated
- Verifying board variety and coverage
- Finding interesting test cases
- Learning valid board patterns

#### Why Use This?

1. **Comprehensive Testing**: Generate all possible legal boards for thorough testing
2. **Reproducible**: Same boards every time (deterministic generation)
3. **ML/RL Training**: Create diverse training datasets
4. **Edge Cases**: Discover unusual but valid board configurations
5. **Fast Iteration**: Cache enables instant reuse
6. **Visual Inspection**: View all boards with `--view` flag

### Test Command

Run simulations with various board inputs.

#### Interactive Mode

Build boards interactively with natural language commands:

```bash
npm run cli -- test --interactive
npm run cli -- test --interactive --size 3 --start-col 1
```

**Commands during building:**
- `move left` / `m l` - Move piece left
- `move right` / `m r` - Move piece right
- `move up` / `m u` - Move piece up
- `move down` / `m d` - Move piece down
- `trap <direction>` / `t <direction>` - Place trap
- `1,2,piece` / `1,2,p` - Direct coordinate entry
- `finish` / `f` - Auto-complete to goal
- `undo` / `u` - Remove last move
- `restart` / `r` - Start over
- `help` / `h` - Show help

#### File Inputs

Test with boards from files or JSON:

```bash
# File path
npm run cli -- test --player board.json --opponent opponent.json

# Inline JSON
npm run cli -- test --player '{"boardSize":2,...}' --opponent random

# Collection with index
npm run cli -- test --player boards.json:0 --opponent boards.json:1

# Random opponent (default if not specified)
npm run cli -- test --player board.json
npm run cli -- test --player board.json --opponent random
```

#### Re-run Last Test

Quickly re-run the most recent test:

```bash
npm run cli -- test --last
# or shorthand
npm run cli -- test -l
```

This is useful for:
- Testing after making engine changes
- Trying different random opponents with same player board
- Iterative testing workflow

#### Expected Outcomes

Track pass/fail for regression testing:

```bash
npm run cli test --player board.json --expected player
npm run cli test --player board.json --expected opponent
npm run cli test --player board.json --expected tie
```

#### Test Notes

Add notes to logged tests:

```bash
npm run cli test --player board.json --notes "Edge case test"
```

### Session Commands

Manage test sessions for organized logging and replay.

**Auto-Session Creation:**
Tests automatically create a session if none is active. The session is named with the current date/time and tagged `[auto]`. You can always replay these tests later.

To create a session with custom metadata, use `session start` before running tests.

#### Start Session

```bash
# Basic start
npm run cli session start

# With metadata
npm run cli session start --name "Training Set 1"
npm run cli session start --name "Validation Tests" --tags "basic,edge-cases"
```

Session files are created immediately in `test-sessions/` directory with timestamp-based IDs.

#### Session Info

Show active session details:

```bash
npm run cli session info
```

Displays:
- Session ID and file path
- Name and tags
- Start time
- Test count

#### List Sessions

View all saved sessions:

```bash
npm run cli session list
```

Shows:
- Session ID (● indicates active)
- Name and tags
- Test count
- Start time

#### Save Session

Save and close the active session:

```bash
# Basic save
npm run cli session save

# Update metadata on save
npm run cli session save --name "Final Tests"
npm run cli session save --name "Completed" --tags "validated,ready"
```

#### Discard Session

Delete the active session without saving:

```bash
npm run cli session discard
```

Prompts for confirmation before deleting.

#### Replay Session

Re-run all tests from a saved session:

```bash
# Basic replay
npm run cli -- session replay session-2026-01-29T12-00-00-000Z

# Verbose mode (show all boards)
npm run cli -- session replay session-2026-01-29T12-00-00-000Z --verbose
```

**Replay shows:**
- Session metadata
- Each test with timestamp
- Re-executed simulation results
- ⚠️ Warning if results changed from original
- Pass/fail for expected outcomes
- Summary statistics

## Technical Explanation

Every test run includes a **step-by-step technical explanation** showing exactly what happened during the simulation:

```
📋 Technical Explanation

Player starts with piece at (1, 0)
Opponent starts with piece at (0, 1)

Player moves to (1, 0)
Opponent moves to (0, 1)
Player moves to (0, 0)
  Player +1 point (forward movement)
Opponent moves to (1, 1)
  Opponent +1 point (forward movement)
Player reaches the goal!
  Player +1 point (goal reached)

Round ends - Player reached the goal!
```

**Explanation Format:**
- Each move is shown with coordinates: `Player moves to (row, col)`
- Scoring events are indented: `  Player +1 point (forward movement)`
- Trap placements: `Player places trap at (row, col)`
- Collision/trap hits: `  Player -1 point (collision!)`
- Goal reached: `Player reaches the goal!`
- Round end reason: `Round ends - Player reached the goal!`

This matches the "Technical" explanation style from the game UI, making it easy to verify simulation correctness.

### Board Collection Commands

Save and manage reusable test boards.

#### Create Collection

Start a new board collection:

```bash
npm run cli boards create my-boards.json
```

Prompts for:
- Collection name (optional)
- Collection description (optional)
- Then launches interactive builder for first board
- Board name and tags (optional)

#### Add to Collection

Add boards to existing collection:

```bash
npm run cli boards add my-boards.json
```

Features:
- Launches interactive builder
- Checks for exact duplicates
- Shows full board if duplicate found
- Prompts "Save anyway?"
- Auto-increments index

#### List Collection

View boards in a collection:

```bash
# Full visualization (default)
npm run cli boards list my-boards.json

# Compact (index, name, tags only)
npm run cli boards list my-boards.json --compact

# Verbose (includes full sequence details)
npm run cli boards list my-boards.json --verbose
```

## File Formats

### Board JSON

```json
{
  "boardSize": 2,
  "grid": [
    ["piece", "trap"],
    ["piece", "piece"]
  ],
  "sequence": [
    { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 1 },
    { "position": { "row": 0, "col": 1 }, "type": "trap", "order": 2 },
    { "position": { "row": 1, "col": 0 }, "type": "piece", "order": 3 },
    { "position": { "row": 0, "col": 0 }, "type": "piece", "order": 4 },
    { "position": { "row": -1, "col": 0 }, "type": "final", "order": 5 }
  ]
}
```

### Board Collection JSON

```json
{
  "name": "Training Boards",
  "description": "Basic validation tests",
  "createdAt": "2026-01-29T12:00:00.000Z",
  "boards": [
    {
      "index": 0,
      "name": "Simple Win",
      "tags": ["basic", "win"],
      "createdAt": "2026-01-29T12:00:00.000Z",
      "boardSize": 2,
      "grid": [...],
      "sequence": [...]
    },
    {
      "index": 1,
      "name": "Trap Test",
      "tags": ["trap", "collision"],
      "createdAt": "2026-01-29T12:01:00.000Z",
      "boardSize": 2,
      "grid": [...],
      "sequence": [...]
    }
  ]
}
```

### Session JSON

```json
{
  "id": "session-2026-01-29T12-00-00-000Z",
  "name": "Training Set 1",
  "tags": ["validation", "basic"],
  "startTime": "2026-01-29T12:00:00.000Z",
  "tests": [
    {
      "testNumber": 1,
      "timestamp": "2026-01-29T12:00:05.000Z",
      "playerBoard": {...},
      "opponentBoard": {...},
      "result": {
        "winner": "player",
        "playerScore": 5,
        "opponentScore": 0,
        "playerFinalPosition": { "row": -1, "col": 0 },
        "opponentFinalPosition": { "row": 1, "col": 1 },
        "collision": false
      },
      "expected": "player",
      "passed": true,
      "notes": "Basic win scenario"
    }
  ]
}
```

## Workflows

### Testing Workflow

1. **Start a session**
   ```bash
   npm run cli session start --name "Validation Tests"
   ```

2. **Run tests** (auto-logged to session)
   ```bash
   npm run cli test --player test1.json --opponent random --expected player
   npm run cli test --player test2.json --opponent random --expected tie
   ```

3. **Check session**
   ```bash
   npm run cli session info
   ```

4. **Save or discard**
   ```bash
   npm run cli session save
   # or
   npm run cli session discard
   ```

5. **Replay for regression testing**
   ```bash
   npm run cli -- session replay <session-id>
   ```

### Board Library Workflow

1. **Create collection**
   ```bash
   npm run cli boards create training-boards.json
   ```

2. **Add more boards**
   ```bash
   npm run cli boards add training-boards.json
   ```

3. **Use in tests**
   ```bash
   npm run cli test --player training-boards.json:0 --opponent training-boards.json:1
   ```

4. **Review collection**
   ```bash
   npm run cli boards list training-boards.json
   ```

## Tips

### Interactive Builder

- **Supermove**: Place trap at current position (`trap here` or coordinate entry)
  - After supermove, piece MUST move on next step
- **Finish command**: Auto-completes straight path to goal
  - Checks for traps in forward path
  - Errors if blocked
- **Undo**: Removes last move and updates state
- **Restart**: Starts over with confirmation

### Session Management

- Sessions auto-save every command and result
- Safe to close terminal - session persists
- Use meaningful names and tags for organization
- Replay detects if simulation results changed

### Testing Strategy

1. Build board library first
2. Create sessions for test categories
3. Use expected outcomes for regression tracking
4. Replay sessions after engine changes
5. Review changed results carefully

### Performance

- Random generation is fast (~1ms per board)
- Simulation is fast (~0.1ms per round)
- Can run hundreds of tests in seconds
- Sessions are incrementally saved (no data loss)

## Troubleshooting

### "Session already active"

```bash
# Check current session
npm run cli session info

# Save or discard it
npm run cli session save
# or
npm run cli session discard
```

### "Board validation failed"

Check for:
- Diagonal moves (only orthogonal allowed)
- Jump moves (must be adjacent)
- Piece moving into trap
- Trap not adjacent to piece
- Supermove without immediate movement

### "Collection file already exists"

Use `boards add` instead of `boards create`:
```bash
npm run cli boards add existing-collection.json
```

### Replay command parsing

Use `--` before session replay:
```bash
npm run cli -- session replay <session-id>
```

## Links

- **Full Design**: [RL_TESTING_CLI_PLAN.md](./RL_TESTING_CLI_PLAN.md)
- **Implementation Roadmap**: [RL_TESTING_CLI_ROADMAP.md](./RL_TESTING_CLI_ROADMAP.md)
- **Progress Tracking**: [CLI_IMPLEMENTATION_PROGRESS.md](./CLI_IMPLEMENTATION_PROGRESS.md)
- **Test Coverage**: [CLI_TEST_COVERAGE.md](./CLI_TEST_COVERAGE.md)
- **Game Rules**: https://spaces-game.vercel.app/rules
