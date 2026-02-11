# Verification Checklist

Changes from commits:
- **Python** `f67f6a6` — Require full-path boards and add retry/forfeit for inference failures
- **Python** `a14a955` — Add difficulty-level training checkpoints and update docs
- **Node** `c9d4c80` — Handle AI agent board construction failures with retry/forfeit

---

## Python — spaces-game-python

### 1. Validation: full-path boards (`spaces_game/validation.py`)

- [ ] `is_board_playable()` rejects board with piece only in row 0 (no bottom-to-top path)
- [ ] `is_board_playable()` rejects board missing a final move
- [ ] `is_board_playable()` rejects size-3 board that only covers 2 of 3 rows
- [ ] `is_board_playable()` accepts valid board with piece in every row + final
- [ ] All existing board pools still pass: `data/boards_size_2.json`, `data/boards_size_3.json`, `boards/size2/*.json`, `boards/size3/*.json`, `new_boards_2.json`, `new_boards_3.json`
- [ ] Run: `python -m pytest tests/test_validation.py -v` — all 42 tests pass

### 2. Inference server: visited positions + attempts (`inference_server/inference.py`)

- [ ] `build_board_for_round()` tracks `piece_visited_positions` during manual construction
- [ ] Action masks during inference now match training (no-revisit masking works)
- [ ] Returns `(Board, attempts_used)` tuple instead of just `Board`
- [ ] `attempts_used` flows through to API response via `ConstructBoardResponse`

### 3. Inference server: API response (`inference_server/main.py`, `models.py`)

- [ ] `/construct-board` response includes `attempts_used` field
- [ ] Valid board returns `attempts_used: 1` (or more if retries were needed)
- [ ] Invalid board (all retries failed) returns `valid: false` with `attempts_used: 5`

### 4. Difficulty checkpoints (`examples/train_simultaneous.py`)

- [ ] `--min-phase-steps` argument works and prints in training header
- [ ] Beginner checkpoint saved after opponent phase 0
- [ ] Intermediate checkpoint saved after opponent phase 2
- [ ] Expert checkpoint saved at training end
- [ ] Checkpoints appear in `models/size{N}/stage3/difficulty/`

### 5. Play script difficulty selection (`examples/play_against_agent.py`)

- [ ] `--difficulty beginner|intermediate|expert` flag resolves to correct model path
- [ ] Interactive difficulty menu appears when difficulty models exist
- [ ] Falls back to model picker when no difficulty models found

### 6. Full test suite

- [ ] Run: `python -m pytest tests/ --ignore=tests/test_inference_server.py -v` — all 141 tests pass

---

## Node — spaces-game-node

### 7. Inference client return type (`src/utils/ai-agent-inference.ts`)

- [ ] `requestAiAgentBoard()` returns `AiAgentBoardResult` with `{ board, failed, attemptsUsed }`
- [ ] Successful response: `failed: false`, `board` populated, `attemptsUsed` from server
- [ ] Server returns invalid board: `failed: true`, `board: null`, `attemptsUsed` from server
- [ ] Network/timeout error: `failed: true`, `board: null`, `attemptsUsed: 0`
- [ ] `ConstructBoardResponse` interface includes `attempts_used` field

### 8. Retry/forfeit flow (`src/App.tsx`)

- [ ] Agent builds valid board on first try: round proceeds normally (no prompt)
- [ ] Agent fails to build valid board: confirm dialog appears with opponent name and attempt count
- [ ] Player clicks OK ("give more time"): second request fires
  - [ ] Second request succeeds: round proceeds with that board
  - [ ] Second request also fails: auto-forfeit, player wins round, alert shown
- [ ] Player clicks Cancel ("forfeit"): player wins round immediately
- [ ] Forfeit round result has `winner: 'player'`, `playerPoints: 1`, `opponentPoints: 0`, `forfeit: true`

### 9. RoundResult type (`src/types/game-state.ts`)

- [ ] `forfeit?: boolean` field added to `RoundResult`
- [ ] Existing rounds without forfeit field still work (optional field)

### 10. Tests (`src/utils/ai-agent-inference.test.ts`)

- [ ] Tests updated to check `result.board`, `result.failed`, `result.attemptsUsed` instead of null checks
- [ ] "invalid board" test verifies `attemptsUsed: 5` from server response
- [ ] Run: `npm test` — all inference tests pass

---

## Integration (both repos together)

### 11. End-to-end with inference server running

- [ ] Start inference server on laptop with size-3 models
- [ ] Pull updated Python code to inference server
- [ ] Play as beginner (Pip): agent produces board with piece in every row, not a 1-step board
- [ ] Play as expert (Ember): if agent fails, retry/forfeit prompt appears instead of dead-end alert
- [ ] Forfeit round scores correctly and game continues to next round
- [ ] Retry succeeds on second attempt (if model is capable)

### 12. Edge cases

- [ ] Agent fails all retries, player forfeits, then plays remaining rounds normally
- [ ] Multiple forfeit rounds in same game don't break state
- [ ] Inference server offline: error handling still works (network error path)

---

## Node — feat/ui-trap-limit

- **Node** `a1aacbf` — Enforce trap limit constraint (boardSize - 1) during board building

### 13. Validation logic (`src/utils/board-validation.ts`, `src/schemas/board.schema.ts`)

- [ ] `validateBoard()` uses `boardSize - 1` as max traps (not `boardSize² - 1`)
- [ ] `hasTooManyTraps()` uses `boardSize - 1`
- [ ] `validateBoardTrapCount()` in schema uses `board.boardSize - 1` (not hardcoded 3)
- [ ] 2x2 board: max 1 trap allowed
- [ ] 3x3 board: max 2 traps allowed
- [ ] Run: `npx vitest run src/utils/board-validation.test.ts src/schemas/board.schema.test.ts` — all pass

### 14. Game engine (`spaces-game-engine/src/simulation.ts`)

- [ ] `isBoardPlayable()` rejects boards exceeding `boardSize - 1` traps
- [ ] Run: `npx vitest run spaces-game-engine/src/__tests__/simulation.test.ts` — all pass

### 15. BoardCreator real-time enforcement (`src/components/BoardCreator.tsx`)

- [ ] "Traps: X/Y" budget indicator visible during board building
- [ ] 2x2 board: after placing 1 trap, all trap controls disappear/disable
  - [ ] Grid "Trap" buttons hidden
  - [ ] "Trap Here" button hidden
  - [ ] Directional "Trap ↑/↓/←/→" buttons disabled with "Trap limit reached" tooltip
  - [ ] Keyboard Shift+WASD and Shift+X no longer place traps
- [ ] 3x3 board: can place 2 traps, controls disabled after 2nd
- [ ] Undo a trap: trap controls re-enable (budget frees up)
- [ ] Restart: trap budget resets
- [ ] Run: `npx vitest run src/components/BoardCreator.test.tsx` — all 67 tests pass

### 16. Existing boards / backwards compatibility

- [ ] Saved boards in localStorage still display correctly
- [ ] Boards built before this change that exceed the new limit still render (just won't re-validate)

### 17. Full test suite

- [ ] Run: `npx vitest run` — all 1850 tests pass
