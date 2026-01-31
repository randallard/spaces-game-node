# RL Testing CLI - Implementation Roadmap

## Overview

This roadmap breaks down the CLI implementation into phases, with clear deliverables and dependencies.

**Reference:** See `RL_TESTING_CLI_PLAN.md` for complete design specification.

---

## Phase 1: Foundation & Core Infrastructure

### 1.1 Project Setup
- [ ] Create `cli/` directory structure
- [ ] Set up CLI package.json with dependencies
  - [ ] Commander.js for command parsing
  - [ ] Inquirer.js for interactive prompts
  - [ ] chalk for colored output
- [ ] Configure TypeScript for CLI (tsconfig.json)
- [ ] Create CLI entry point (`cli/index.ts`)
- [ ] Add npm scripts for running CLI
  - [ ] `npm run cli` or `npx spaces-cli`

### 1.2 Grid Generator Utility
- [ ] Implement `cli/utils/grid-generator.ts`
  - [ ] `generateGrid(sequence, boardSize)` function
  - [ ] Takes sequence, returns 2D grid array
  - [ ] Handles trap overriding piece waypoints
  - [ ] Unit tests for grid generation

### 1.3 Grid Visualizer
- [ ] Implement `cli/interactive/visualizer.ts`
  - [ ] `renderGrid(grid, currentPosition?)` function
  - [ ] ASCII grid with borders
  - [ ] Step numbers: `[1●]`, `[2●]`, `[3X]`
  - [ ] Supermove formatting: `[1●,2X]` with alignment
  - [ ] Current position indicator: `← You are here`
  - [ ] Color coding (using chalk)

### 1.4 Validation Wrapper
- [ ] Implement `cli/utils/validation.ts`
  - [ ] Import `isBoardPlayable()` from `../src/simulation.ts`
  - [ ] Wrapper function with user-friendly error messages
  - [ ] Convert validation errors to CLI-friendly format

**Deliverable:** Basic utilities that can generate and display grids, validate boards using engine

---

## Phase 2: Board Collections

### 2.1 File Manager Utility
- [ ] Implement `cli/utils/file-manager.ts`
  - [ ] `loadCollection(filePath)` - Load board collection
  - [ ] `saveCollection(filePath, data)` - Save collection
  - [ ] `getBoardByIndex(collection, index)` - Get specific board
  - [ ] `findDuplicateBoard(collection, board)` - Check for exact duplicates
  - [ ] Error handling for missing files

### 2.2 Boards Create Command
- [ ] Implement `cli/commands/boards.ts`
  - [ ] `boards create <file>` command
  - [ ] Start interactive builder
  - [ ] Save first board to new collection file
  - [ ] Prompt for optional name/tags
  - [ ] Handle file already exists error

### 2.3 Boards Add Command
- [ ] Implement `boards add <file>` command
  - [ ] Load existing collection
  - [ ] Start interactive builder
  - [ ] Check for duplicate boards
  - [ ] Show full board visualization if duplicate
  - [ ] Prompt "Save anyway?"
  - [ ] Append to collection with next index

### 2.4 Boards List Command
- [ ] Implement `boards list <file>` command
  - [ ] Default: Full visualization for each board
  - [ ] `--compact` flag: Index, name, tags only
  - [ ] `--verbose` flag: Include full sequence details
  - [ ] Show collection metadata (name, count, created date)

**Deliverable:** Complete board collection management (create, add, list)

---

## Phase 3: Interactive Board Builder

### 3.1 Basic Builder Framework
- [ ] Implement `cli/interactive/builder.ts`
  - [ ] `buildBoard(options)` main function
  - [ ] Handle `--size` and `--start-col` arguments
  - [ ] Prompt for board size if not provided
  - [ ] Prompt for starting column (default 0)
  - [ ] Initialize board state (sequence, current position)
  - [ ] Main command loop

### 3.2 Command Parser
- [ ] Implement command parsing in builder
  - [ ] Parse natural language: `move left`, `trap up`, `m l`, `t u`
  - [ ] Parse coordinates: `1,1,piece`, `1,1,p`
  - [ ] Parse special commands: `finish`, `undo`, `restart`, `help`
  - [ ] Command abbreviations: `m`, `t`, `f`, `u`, `r`, `h`
  - [ ] Direction abbreviations: `u`, `d`, `l`, `r`
  - [ ] Type abbreviations: `p`, `t`, `g`

### 3.3 Movement Commands
- [ ] Implement movement validation
  - [ ] Calculate next position from direction
  - [ ] Validate move is adjacent (orthogonal)
  - [ ] Check not moving into trap
  - [ ] Check not diagonal or jump
  - [ ] Real-time validation using engine
  - [ ] Clear error messages for each violation
- [ ] Implement `move` command
  - [ ] Update current position
  - [ ] Add to sequence
  - [ ] Re-render grid
  - [ ] Show current position indicator

### 3.4 Trap Commands
- [ ] Implement trap placement validation
  - [ ] Check trap is adjacent to current position OR at current position
  - [ ] Handle supermove (trap at current position)
  - [ ] Detect supermove and show warning
  - [ ] Track supermove state (must move next)
  - [ ] Validate next move after supermove
- [ ] Implement `trap` command
  - [ ] Add trap to sequence
  - [ ] Update grid visualization
  - [ ] Re-render with supermove notation if needed

### 3.5 Special Commands
- [ ] Implement `finish` command
  - [ ] Calculate straight path to goal: current column, row decreasing to -1
  - [ ] Check for traps in forward path
  - [ ] If trap found: error and re-prompt
  - [ ] If clear: add moves to sequence
  - [ ] Show final board
  - [ ] Prompt for confirmation
- [ ] Implement `undo` command
  - [ ] Remove last move from sequence
  - [ ] Update current position to previous
  - [ ] Clear supermove state if undoing supermove
  - [ ] Re-render grid
  - [ ] Show "Last move undone" message
- [ ] Implement `restart` command
  - [ ] Prompt for confirmation
  - [ ] Clear sequence
  - [ ] Re-prompt for board size and starting column
  - [ ] Reset to initial state
- [ ] Implement `help` command
  - [ ] Show command list
  - [ ] Show abbreviations
  - [ ] Show link to website: https://spaces-game.vercel.app/rules
  - [ ] Show current position

### 3.6 Board Completion
- [ ] Implement board finalization
  - [ ] Validate board has goal (finish or manual goal entry)
  - [ ] Show final board visualization
  - [ ] Show move count
  - [ ] Prompt "Confirm? (y/n)"
  - [ ] If no: return to building
  - [ ] If yes: prompt to save to collection

**Deliverable:** Fully functional interactive board builder with all commands

---

## Phase 4: Session Management

### 4.1 Session File Manager
- [ ] Implement session file operations in `cli/utils/file-manager.ts`
  - [ ] `createSession(name?, tags?)` - Create new session file
  - [ ] `loadSession(sessionId)` - Load existing session
  - [ ] `saveTest(sessionId, test)` - Append test to session (incremental save)
  - [ ] `updateSessionMetadata(sessionId, metadata)` - Update name/tags
  - [ ] `deleteSession(sessionId)` - Delete session file
  - [ ] `listSessions()` - Get all session files

### 4.2 Session Start Command
- [ ] Implement `cli/commands/session.ts`
  - [ ] `session start` command
  - [ ] Parse `--name` and `--tags` options
  - [ ] Generate timestamp-based session ID
  - [ ] Create session file immediately
  - [ ] Store session ID in CLI state
  - [ ] Show session info (filename, ID)

### 4.3 Session Info Command
- [ ] Implement `session info` command
  - [ ] Check if session is active
  - [ ] Load current session file
  - [ ] Display: filename, test count, tags, start time
  - [ ] Error if no active session

### 4.4 Session Save Command
- [ ] Implement `session save` command
  - [ ] Parse optional `--name` and `--tags`
  - [ ] Update session metadata in file
  - [ ] Mark session status as "saved"
  - [ ] Clear active session state
  - [ ] Show confirmation message

### 4.5 Session Discard Command
- [ ] Implement `session discard` command
  - [ ] Prompt for confirmation
  - [ ] Delete session file
  - [ ] Clear active session state
  - [ ] Show confirmation message

**Deliverable:** Session lifecycle management (start, info, save, discard)

---

## Phase 5: Test Command

### 5.1 Board Input Handling
- [ ] Implement `cli/commands/test.ts`
  - [ ] Auto-detect input format (JSON vs file path)
  - [ ] Parse JSON boards (check starts with `{`)
  - [ ] Load from file path
  - [ ] Handle collection with index (`:0`, `:1`)
  - [ ] Validate board using engine
  - [ ] Generate grid for display

### 5.2 Interactive Mode Integration
- [ ] Implement `test --interactive`
  - [ ] Call interactive builder for player board
  - [ ] Prompt for opponent board type: interactive/file/json/random
  - [ ] Handle each opponent input type
  - [ ] Validate both boards

### 5.3 Random Opponent Generation
- [ ] Implement random board generator
  - [ ] Match player board size
  - [ ] Generate random valid sequence
  - [ ] Ensure orthogonal moves only
  - [ ] Random trap placement (adjacent only)
  - [ ] Random goal position
  - [ ] Validate generated board

### 5.4 Simulation Execution
- [ ] Run simulation using engine
  - [ ] Import `simulateRound()` from `../src/simulation.ts`
  - [ ] Call with player and opponent boards
  - [ ] Use `{ silent: true }` option
  - [ ] Capture full result

### 5.5 Result Display
- [ ] Format and display results
  - [ ] Winner
  - [ ] Scores (player, opponent)
  - [ ] Final positions
  - [ ] Collision status
  - [ ] Trap hits
  - [ ] Move counts
  - [ ] Show both board visualizations side-by-side

### 5.6 Session Logging
- [ ] Log test to active session
  - [ ] Check if session is active
  - [ ] Create test entry with all data
  - [ ] Include expected outcome if provided
  - [ ] Mark if test passed (if expectation provided)
  - [ ] Save immediately to session file
  - [ ] Increment test counter

### 5.7 Test Command Options
- [ ] Implement `--expected` option
  - [ ] Parse expected outcome: player/opponent/tie/winner
  - [ ] Compare with actual result
  - [ ] Show ✓ or ✗ for pass/fail
- [ ] Implement `--notes` option
  - [ ] Store notes in session log

**Deliverable:** Complete test command with all input formats and session logging

---

## Phase 6: Session Replay

### 6.1 Session List Command
- [ ] Implement `session list` command
  - [ ] Scan test-sessions directory
  - [ ] Load metadata from each session file
  - [ ] Display: session ID, name, tags, test count, timestamp
  - [ ] Sort by timestamp (newest first)

### 6.2 Session Replay Command
- [ ] Implement `session replay <id>` command
  - [ ] Load session file by ID or name
  - [ ] Iterate through all tests
  - [ ] For each test:
    - [ ] Show test number
    - [ ] Re-run simulation with saved boards
    - [ ] Compare result with original
    - [ ] If expected outcome exists: show pass/fail
    - [ ] Show summary (boards, result)
  - [ ] Show final summary: X/Y passed
  - [ ] Highlight any differences from original run

**Deliverable:** Session replay for regression testing

---

## Phase 7: Polish & Documentation

### 7.1 Error Handling
- [ ] Consistent error messages across all commands
- [ ] Graceful handling of invalid inputs
- [ ] File I/O error handling
- [ ] Validation error formatting
- [ ] Help text for all errors

### 7.2 Output Formatting
- [ ] Color coding with chalk
  - [ ] Green for success
  - [ ] Red for errors
  - [ ] Yellow for warnings
  - [ ] Blue for info
  - [ ] Gray for secondary text
- [ ] Consistent spacing and alignment
- [ ] Progress indicators for long operations
- [ ] Clear visual separators

### 7.3 CLI Help
- [ ] Global help command
- [ ] Help for each command
- [ ] Usage examples
- [ ] Link to full documentation

### 7.4 Testing
- [ ] Unit tests for utilities
  - [ ] Grid generator
  - [ ] File manager
  - [ ] Validation wrapper
- [ ] Integration tests
  - [ ] Board creation flow
  - [ ] Test execution flow
  - [ ] Session management
- [ ] Manual testing checklist

### 7.5 Documentation
- [ ] Update README with CLI usage
- [ ] Command reference guide
- [ ] Interactive mode guide
- [ ] Session workflow examples
- [ ] Board collection examples
- [ ] Troubleshooting guide

**Deliverable:** Production-ready CLI with complete documentation

---

## Phase 8: Advanced Features (Future)

### 8.1 Batch Testing
- [ ] Run multiple tests from file
- [ ] Parallel execution
- [ ] Summary statistics

### 8.2 Comparison Tools
- [ ] Compare two sessions
- [ ] Diff board collections
- [ ] Win rate analysis

### 8.3 Export/Import
- [ ] Export session to test suite
- [ ] Import boards from various formats
- [ ] Export results to CSV/JSON

### 8.4 Visualization Enhancements
- [ ] Color-coded move paths
- [ ] Animation of board execution
- [ ] Side-by-side board comparison

---

## Implementation Order

**Recommended sequence:**

1. **Phase 1** (Foundation) - Required for everything else
2. **Phase 3** (Interactive Builder) - Core functionality, test early
3. **Phase 2** (Board Collections) - Depends on builder
4. **Phase 4** (Session Management) - Can start in parallel with Phase 3
5. **Phase 5** (Test Command) - Brings everything together
6. **Phase 6** (Replay) - Builds on sessions
7. **Phase 7** (Polish) - Final touches
8. **Phase 8** (Advanced) - Optional future enhancements

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] Interactive board builder works
- [ ] Can run simulation with two boards
- [ ] Results display correctly
- [ ] Session logging works
- [ ] Can replay sessions

### Complete Implementation
- [ ] All Phase 1-7 items checked
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No critical bugs

### Production Ready
- [ ] Used successfully for RL testing
- [ ] Verified results match training exactly
- [ ] Performance acceptable (< 1s per test)
- [ ] User feedback incorporated

---

## Dependencies & Blockers

### External Dependencies
- Commander.js - Command parsing
- Inquirer.js - Interactive prompts
- Chalk - Terminal colors
- Node.js fs/path - File operations

### Internal Dependencies
- `src/simulation.ts` - Must be stable and tested
- `src/types/` - Type definitions must be finalized
- Grid generation logic - Must match engine exactly

### Potential Blockers
- Engine bugs discovered during CLI testing
- Performance issues with large sessions
- File I/O cross-platform compatibility
- Terminal compatibility (colors, unicode)

---

## Next Steps

1. Review this roadmap
2. Confirm Phase 1 approach
3. Start implementation with Phase 1.1 (Project Setup)
4. Build incrementally, testing each phase
5. Iterate based on real usage feedback
