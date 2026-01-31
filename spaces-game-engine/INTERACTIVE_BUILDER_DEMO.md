# Interactive Builder Demo

## Phase 3 Complete! 🎉

The interactive board builder is now fully functional. Here's how to use it:

## Quick Start

```bash
npm run cli test --interactive
```

Or with options:

```bash
# Specify board size and starting column
npm run cli test --interactive --size 3 --start-col 1
```

## Available Commands

### Movement Commands
- `move <direction>` or `m <direction>` - Move piece
  - Directions: `up`, `down`, `left`, `right` (or `u`, `d`, `l`, `r`)
  - Examples: `move left`, `m l`, `move up`, `m u`

- `trap <direction>` or `t <direction>` - Place trap
  - Directions: same as move
  - Examples: `trap right`, `t r`, `trap down`, `t d`

### Coordinate Entry
- `<row>,<col>,<type>` - Direct coordinate entry
  - Types: `piece`/`p` or `trap`/`t`
  - Examples: `1,2,piece`, `0,1,t`

### Special Commands
- `finish` or `f` - Auto-complete straight path to goal
  - Checks for traps in forward path
  - Validates before accepting
  - Shows final board and asks for confirmation

- `undo` or `u` - Remove last move
  - Updates grid display
  - Clears supermove state if needed

- `restart` or `r` or `reset` - Start over
  - Asks for confirmation
  - Re-prompts for board size and starting column

- `help` or `h` - Show help message
  - Lists all commands
  - Shows game rules
  - Links to website: https://spaces-game.vercel.app/rules

## Features Implemented ✅

### Real-time Validation
- ✅ Orthogonal movement only (no diagonals)
- ✅ No jump moves (must be adjacent)
- ✅ Trap placement validation (adjacent or at current position)
- ✅ Supermove detection and constraint enforcement
- ✅ Piece cannot move into trap
- ✅ Clear error messages for each violation

### Visual Feedback
- ✅ ASCII grid with box-drawing characters
- ✅ Step numbers: `[1●]`, `[2X]`, `[3●]`
- ✅ Supermove notation: `[4●,5X]` with proper alignment
- ✅ Current position indicator: `← You are here`
- ✅ Color coding:
  - Blue for pieces (●)
  - Red for traps (X)
  - Gray for empty cells
  - Yellow for current position indicator

### Command Parsing
- ✅ Natural language: `move left`, `trap right`
- ✅ Abbreviations: `m l`, `t r`
- ✅ Direction shortcuts: `u`, `d`, `l`, `r`
- ✅ Coordinate entry: `1,2,piece` or `1,2,p`
- ✅ Command shortcuts: `f`, `u`, `r`, `h`

### Board Completion
- ✅ Finish command with validation
- ✅ Auto-complete straight path to goal
- ✅ Check for traps in forward path
- ✅ Final board validation using engine
- ✅ Confirmation prompt
- ✅ Option to return to building if not confirmed

## Example Session

```bash
$ npm run cli test --interactive

🎮 Interactive Board Builder

? Board size: 3
? Starting column (0 for farthest left): 0

🎮 Starting Board:

┌─────┬─────┬─────┐
│     │     │     │
├─────┼─────┼─────┤
│     │     │ 1●  │ ← You are here
├─────┼─────┼─────┤
│     │     │     │
└─────┴─────┴─────┘

Type "help" for commands, "finish" when done

? Command: m l
┌─────┬─────┬─────┐
│     │     │     │
├─────┼─────┼─────┤
│     │ 2●  │ 1●  │ ← You are here
├─────┼─────┼─────┤
│     │     │     │
└─────┴─────┴─────┘

? Command: t d
┌─────┬─────┬─────┐
│     │     │     │
├─────┼─────┼─────┤
│     │ 2●  │ 1●  │ ← You are here
├─────┼─────┼─────┤
│     │ 3X  │     │
└─────┴─────┴─────┘

? Command: m u
┌─────┬─────┬─────┐
│     │ 4●  │     │ ← You are here
├─────┼─────┼─────┤
│     │ 2●  │ 1●  │
├─────┼─────┼─────┤
│     │ 3X  │     │
└─────┴─────┴─────┘

? Command: finish
✅ Auto-completed path to goal!

┌─────┬─────┬─────┐
│     │ 4●  │     │
├─────┼─────┼─────┤
│     │ 2●  │ 1●  │
├─────┼─────┼─────┤
│     │ 3X  │     │
└─────┴─────┴─────┘

? Confirm board? Yes
✅ Board created successfully!

Board data:
{
  "boardSize": 3,
  "grid": [
    ["empty", "piece", "empty"],
    ["empty", "piece", "piece"],
    ["empty", "trap", "empty"]
  ],
  "sequence": [
    { "position": { "row": 1, "col": 2 }, "type": "piece", "order": 1 },
    { "position": { "row": 1, "col": 1 }, "type": "piece", "order": 2 },
    { "position": { "row": 2, "col": 1 }, "type": "trap", "order": 3 },
    { "position": { "row": 0, "col": 1 }, "type": "piece", "order": 4 },
    { "position": { "row": -1, "col": 1 }, "type": "final", "order": 5 }
  ]
}
```

## Validation Examples

### Diagonal Move (Rejected)
```
? Command: 0,0,piece
❌ Invalid move:
  Piece must move exactly 1 square orthogonally (up/down/left/right)
```

### Supermove Warning
```
? Command: t here
⚠️  SUPERMOVE: Piece must move out of this space on the very next step
```

### Trap in Forward Path
```
? Command: finish
❌ Cannot finish - trap in forward path. Remove the trap or change route.
```

## Testing Coverage

All interactive builder features are complete and ready for testing:

1. ✅ Board size selection (2-5)
2. ✅ Starting column selection
3. ✅ Movement commands (all directions)
4. ✅ Trap commands (all directions)
5. ✅ Coordinate entry
6. ✅ Finish command with validation
7. ✅ Undo functionality
8. ✅ Restart functionality
9. ✅ Help command
10. ✅ Real-time validation
11. ✅ Supermove detection and enforcement
12. ✅ Grid visualization with step numbers
13. ✅ Current position tracking
14. ✅ Final board validation using engine

## Next Steps

With Phase 3 complete, the next priorities are:

**Phase 2: Board Collections** (for saving/loading boards)
- `boards create` - Create new collection with interactive builder
- `boards add` - Add board to existing collection
- `boards list` - View saved boards

**Phase 4: Session Management** (for test logging)
- `session start` - Begin logging tests
- `session info` - View current session
- `session save/discard` - Manage session lifecycle

**Phase 5: Test Command** (full simulation)
- Non-interactive mode with JSON/file input
- Random opponent generation
- Simulation execution using engine
- Result display
- Session logging integration

Ready to continue with Phase 2 or Phase 4?
