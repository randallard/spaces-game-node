# Migration Validation Checklist

Use this checklist to verify that the migration to derived state preserves all existing functionality.

## Before Migration: Document Current Behavior

### 1. Visual Documentation
- [ ] Take screenshots of every phase (1-19)
- [ ] Screenshot round history section (expanded and collapsed)
- [ ] Screenshot incomplete round card
- [ ] Screenshot share modal
- [ ] Screenshot active games panel
- [ ] Screenshot round results replay
- [ ] Save screenshots in `planning/screenshots/before/`

### 2. Behavioral Documentation
- [ ] Complete all 8 user flows in GAME_PHASES.md "Critical Behaviors" section
- [ ] Document any unexpected behavior or quirks discovered
- [ ] Note timing of any animations or transitions
- [ ] Test all button clicks and verify responses
- [ ] Test all keyboard interactions
- [ ] Test all modal open/close behaviors

### 3. State Documentation
- [ ] Export localStorage data for active game in progress
- [ ] Export localStorage data for completed game
- [ ] Export localStorage with 5+ saved boards
- [ ] Export localStorage with 3+ opponents
- [ ] Save exports in `planning/test-data/before/`

### 4. Test Data Preparation
- [ ] Create test game: Round 1, before player selects (human opponent)
- [ ] Create test game: Round 1, after player selects, waiting (human opponent)
- [ ] Create test game: Round 2, with history (human opponent)
- [ ] Create test game: Round 3, with incomplete round (human opponent)
- [ ] Create test game: Round 5, last round (human opponent)
- [ ] Create test game: Mid-game (CPU opponent)
- [ ] Save gameIds and URLs for all test games

---

## During Migration: Incremental Verification

### Phase 1: Consolidate Round Tracking
**Goal:** Make `currentRound` single source of truth, remove `phase.round`

- [ ] Update all phase types to remove `round` property
- [ ] Find all `phase.round` references → replace with `state.currentRound`
- [ ] Update phase transition logic
- [ ] Run type checker: `pnpm run check`
- [ ] Test: Start new game, verify round advances correctly
- [ ] Test: Resume game, verify correct round shown
- [ ] Test: Round history shows correct round numbers
- [ ] Commit: "refactor: consolidate round tracking to state.currentRound"

### Phase 2: Derive Scores from Round History
**Goal:** Remove `playerScore` and `opponentScore`, compute from history

- [ ] Create `useDerivedScores()` hook or helper function
- [ ] Replace all `state.playerScore` with computed value
- [ ] Replace all `state.opponentScore` with computed value
- [ ] Update Zod schema to remove score fields
- [ ] Update localStorage loading to not expect scores
- [ ] Run type checker: `pnpm run check`
- [ ] Test: Complete round, verify scores compute correctly
- [ ] Test: Load saved game, verify scores restored correctly
- [ ] Test: Discord notification shows correct scores
- [ ] Test: Game over screen shows correct final scores
- [ ] Commit: "refactor: derive scores from round history"

### Phase 3: Move Board Selections to Phase State
**Goal:** Make board selections part of phase, not top-level state

- [ ] Update phase types to include board selections
- [ ] Update `board-selection` phase type: `{ type: 'board-selection'; playerBoard?: Board; opponentBoard?: Board }`
- [ ] Move `playerSelectedBoard` and `opponentSelectedBoard` into phase
- [ ] Update all references to board selections
- [ ] Update gameState derivation logic
- [ ] Run type checker: `pnpm run check`
- [ ] Test: Select board, verify phase updated correctly
- [ ] Test: Resume game, verify board selections loaded
- [ ] Test: Incomplete round shows correct player board
- [ ] Commit: "refactor: move board selections into phase state"

### Phase 4: Derive gameState from Phase + Selections
**Goal:** Compute `gameState` prop instead of passing from parent

- [ ] Create helper function to derive gameState from phase
- [ ] Remove `gameState` prop from ActiveGameView
- [ ] Compute gameState inside ActiveGameView
- [ ] Update conditional logic to use computed value
- [ ] Run type checker: `pnpm run check`
- [ ] Test: Board selection shows correct UI state
- [ ] Test: After selection, shows waiting state
- [ ] Test: Resume shows correct state
- [ ] Commit: "refactor: derive gameState from phase instead of prop"

### Phase 5: Add State Validation
**Goal:** Ensure state is always valid with Zod schemas

- [ ] Update GameStateSchema to match new structure
- [ ] Add validation on localStorage load
- [ ] Add validation on URL hash parse
- [ ] Add migration function for old state format
- [ ] Test: Load old localStorage format
- [ ] Test: Load invalid localStorage (should reset gracefully)
- [ ] Test: Parse invalid URL hash (should show error)
- [ ] Commit: "feat: add state validation and migration"

---

## After Migration: Full Regression Testing

### Visual Regression
- [ ] Take screenshots of every phase again
- [ ] Compare to "before" screenshots
- [ ] Verify all elements present
- [ ] Verify all styling identical
- [ ] Verify all text content identical
- [ ] Save new screenshots in `planning/screenshots/after/`

### Functional Testing

#### Test 1: First-Time User Flow
- [ ] Clear localStorage
- [ ] Go through tutorial
- [ ] Create first board
- [ ] Play vs CPU
- [ ] Complete 5 rounds
- [ ] Verify winner determined correctly
- [ ] Verify stats updated

#### Test 2: Human Opponent Game (Player 1)
- [ ] Start game vs human opponent
- [ ] Select round 1 board
- [ ] Verify challenge URL generated
- [ ] Verify share modal opens
- [ ] Copy challenge URL
- [ ] Go to home
- [ ] Verify active game shows
- [ ] Resume game
- [ ] Verify waiting state shows
- [ ] Verify incomplete round shows in history

#### Test 3: Human Opponent Game (Player 2)
- [ ] Load Player 1's challenge URL
- [ ] Create user or use existing
- [ ] Accept challenge
- [ ] Select round 1 board
- [ ] Verify round results appear
- [ ] Continue to round 2
- [ ] Verify round history shows round 1
- [ ] Complete all 5 rounds
- [ ] Verify final scores correct

#### Test 4: Resume Game Scenarios
- [ ] Resume game before player selects → shows board selection
- [ ] Resume game after player selects → shows waiting state
- [ ] Resume game on round 2+ → shows round history
- [ ] Resume game near end → verify scores correct

#### Test 5: Round History Interactions
- [ ] Complete 3 rounds
- [ ] Click "Show Previous Rounds"
- [ ] Verify all 3 rounds shown
- [ ] Click on round 1 card
- [ ] Verify modal shows round 1 results
- [ ] Close modal
- [ ] Verify returns to game correctly
- [ ] Select board for round 4
- [ ] Verify incomplete round shows in history

#### Test 6: Discord Integration
- [ ] Connect Discord for player
- [ ] Add opponent with Discord
- [ ] Complete round 1
- [ ] Verify Discord notification sent
- [ ] Verify notification shows correct scores
- [ ] Verify notification URL works

#### Test 7: CPU Game
- [ ] Start game vs CPU Sam
- [ ] Select board
- [ ] Verify NO share modal
- [ ] Verify immediate round results
- [ ] Verify NO waiting state
- [ ] Complete 5 rounds
- [ ] Verify stats updated

#### Test 8: Edge Cases
- [ ] Start game, go home immediately
- [ ] Resume → verify state preserved
- [ ] Complete round, refresh page
- [ ] Verify round history persists
- [ ] Try to resume completed game
- [ ] Verify not in active games
- [ ] Load invalid challenge URL
- [ ] Verify error handling

### State Validation Tests

Run all 8 tests from "State Validation Checklist" in GAME_PHASES.md:
- [ ] Test 1: Score Calculation
- [ ] Test 2: Round History Persistence
- [ ] Test 3: Active Game Resume
- [ ] Test 4: Incomplete Round Display
- [ ] Test 5: Challenge URL Roundtrip
- [ ] Test 6: Discord Notification Scores
- [ ] Test 7: CPU Game (No Share Phase)
- [ ] Test 8: Re-send Link Visibility

### Data Integrity Checks

Verify all 6 rules from "Data Integrity Rules" in GAME_PHASES.md:
- [ ] Rule 1: Scores Match Round History
- [ ] Rule 2: Round Number Consistency
- [ ] Rule 3: Board Selection Mutual Exclusion
- [ ] Rule 4: Game ID Consistency
- [ ] Rule 5: Round History Order
- [ ] Rule 6: Active Game Completeness

### Performance Testing
- [ ] Measure localStorage read time (should be <10ms)
- [ ] Measure localStorage write time (should be <50ms)
- [ ] Measure URL hash generation time (should be <100ms)
- [ ] Measure component render time (should be <16ms for 60fps)
- [ ] Test with 50+ saved boards (should not lag)
- [ ] Test with 10+ active games (should not lag)

---

## Rollback Plan

If migration introduces bugs that can't be quickly fixed:

### Emergency Rollback Steps
1. [ ] `git stash` any uncommitted changes
2. [ ] `git log --oneline` to find last good commit
3. [ ] `git revert <commit-hash>` for each migration commit (in reverse order)
4. [ ] `pnpm run check` to verify types
5. [ ] `pnpm run build` to verify build
6. [ ] Test critical flows to verify rollback successful
7. [ ] Document what went wrong for next attempt

### Gradual Rollback (if only one phase broken)
1. [ ] Identify which phase is broken
2. [ ] `git revert <commit-hash>` for that phase only
3. [ ] Fix the issue
4. [ ] Re-apply the migration for that phase
5. [ ] Continue with remaining phases

---

## Sign-Off Checklist

Migration is complete when:
- [ ] All visual regression checks passed
- [ ] All functional tests passed
- [ ] All state validation tests passed
- [ ] All data integrity rules verified
- [ ] Performance tests passed
- [ ] No TypeScript errors (`pnpm run check`)
- [ ] No ESLint warnings (`pnpm run lint`)
- [ ] All tests passing (`pnpm run test`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Deployed to staging and tested live
- [ ] At least 2 people have tested the migration
- [ ] Documentation updated to reflect new structure
- [ ] Migration commit messages are clear
- [ ] Old localStorage format migration tested

## Migration Completion

**Date Started:** _________________
**Date Completed:** _________________
**Tested By:** _________________
**Issues Found:** _________________
**Issues Resolved:** _________________
**Final Sign-Off:** _________________

---

**Notes:**
- Take your time with each phase
- Test thoroughly before moving to next phase
- Keep commits small and focused
- Document any issues discovered
- Don't rush - preserving functionality is more important than speed
