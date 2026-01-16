# Migration Documentation Complete ✅

All documentation is now ready to support the derived state migration.

## Documents Created/Updated

### 1. GAME_PHASES.md (1,747 lines) - **THE SOURCE OF TRUTH**
**Purpose:** Documents exactly what shows when and under what conditions

**Key Sections:**
- **Phase Definitions (1-19):** Complete list of all phases with buttons, navigation, info displayed
- **ActiveGameView Display Rules:** Detailed breakdown of phases 13-15 (most complex)
- **Round History Display Rules:** Complete logic for round history section visibility
- **Visual Element Conditions Reference:** Quick lookup table with line numbers
- **Critical Behaviors to Preserve:** 8 user flows with checkboxes
- **State Validation Checklist:** 8 concrete tests to run
- **State Transition Matrix:** Valid and invalid phase transitions
- **Data Integrity Rules:** 6 invariants that must always hold
- **localStorage Schema:** Complete data structure documentation

**Use Cases:**
- ✅ "What shows when player selects a board?" → ActiveGameView Display Rules
- ✅ "When does the incomplete round card appear?" → Round History Display Rules
- ✅ "What conditions control the re-send link button?" → Visual Element Conditions Reference
- ✅ "What tests should I run?" → State Validation Checklist
- ✅ "Is this state transition valid?" → State Transition Matrix

### 2. MIGRATION_PLAN.md (Updated)
**Purpose:** High-level migration strategy and recent changes log

**New Section Added:**
- **Recent Changes & State Management Improvements**
  - Documents all changes made 2025-01-14
  - Lists potential state issues to address
  - Provides recommended next steps for migration
  - Tracks completed work

**Use Cases:**
- ✅ "What did we change today?" → Recent Changes
- ✅ "What's the migration plan?" → Recommended Next Steps
- ✅ "What's redundant in the state?" → Potential State Issues

### 3. MIGRATION_VALIDATION_CHECKLIST.md (New)
**Purpose:** Step-by-step checklist for safe migration execution

**Sections:**
- **Before Migration:** Document current behavior (screenshots, test data, exports)
- **During Migration:** 5-phase incremental approach with tests after each phase
- **After Migration:** Full regression testing suite
- **Rollback Plan:** Emergency and gradual rollback procedures
- **Sign-Off Checklist:** Criteria for migration completion

**Use Cases:**
- ✅ "What should I do before starting?" → Before Migration section
- ✅ "How do I migrate safely?" → During Migration (5 phases)
- ✅ "How do I verify nothing broke?" → After Migration tests
- ✅ "Something broke, what now?" → Rollback Plan

---

## Migration Approach Summary

### The 5-Phase Plan

**Phase 1: Consolidate Round Tracking** ⏱️ 1-2 hours
- Remove `round` from phase types
- Make `state.currentRound` the single source of truth
- Update all `phase.round` references

**Phase 2: Derive Scores from Round History** ⏱️ 2-3 hours
- Remove `playerScore` and `opponentScore` from state
- Create computed values from `roundHistory`
- Update all score references

**Phase 3: Move Board Selections to Phase State** ⏱️ 2-3 hours
- Move `playerSelectedBoard` and `opponentSelectedBoard` into phase
- Update phase type: `{ type: 'board-selection'; playerBoard?: Board; opponentBoard?: Board }`
- Update all board selection references

**Phase 4: Derive gameState from Phase** ⏱️ 1-2 hours
- Remove `gameState` prop from components
- Compute inside components from phase + selections
- Update conditional rendering logic

**Phase 5: Add State Validation** ⏱️ 1-2 hours
- Update Zod schemas
- Add validation on localStorage load
- Add migration for old state format

**Total Estimated Time:** 7-12 hours (spread over multiple sessions)

---

## Key Principles to Maintain

### 1. Single Source of Truth
**Before:** `currentRound` AND `phase.round` (duplicated)
**After:** Only `currentRound` (derived when needed)

### 2. Derived Values
**Before:** `playerScore` and `opponentScore` stored separately
**After:** Computed from `roundHistory.reduce(...)`

### 3. State in Phase
**Before:** Board selections at top level, phase just has type
**After:** Board selections part of phase state

### 4. Compute Don't Store
**Before:** Pass `gameState` prop down component tree
**After:** Compute `gameState` from phase + board selections

### 5. Validate Everything
**Before:** Trust localStorage and URL data
**After:** Validate with Zod, migrate old formats

---

## Critical Conditions to Preserve

### When Round History Shows
```typescript
(!isManagementMode && (roundHistory.length > 0 OR hasIncompleteRound))
```

### When Board Selection UI Shows
```typescript
(gameState === 'waiting-for-player')
```

### When Incomplete Round Card Shows
```typescript
(playerSelectedBoard !== null && opponentSelectedBoard === null && !isCpuOpponent)
```

### When Re-send Link Shows
```typescript
(!isCpuOpponent && !(currentRound === 1 && gameState === 'waiting-for-player'))
```

### When Share Modal Auto-Opens
```typescript
(gameState === 'waiting-for-opponent-to-start' && !isCpuOpponent)
```

### When CPU Games Skip Waiting
```typescript
(opponent.type === 'cpu' || opponent.type === 'remote-cpu')
```

---

## How to Use These Documents

### Starting the Migration

1. **Read GAME_PHASES.md "Critical Behaviors to Preserve"**
   - Understand the 8 user flows
   - Run through each flow manually
   - Take notes on current behavior

2. **Follow MIGRATION_VALIDATION_CHECKLIST.md "Before Migration"**
   - Take screenshots of every phase
   - Export localStorage test data
   - Create test games in various states
   - Document any quirks

3. **Read MIGRATION_PLAN.md "Recommended Next Steps"**
   - Understand the 5-phase approach
   - Note which files will change
   - Plan your work sessions

### During Each Phase

1. **Work on one phase at a time** (don't combine phases)
2. **Follow MIGRATION_VALIDATION_CHECKLIST.md for that phase**
3. **Run type checker after every change:** `pnpm run check`
4. **Test critical flows after phase complete**
5. **Commit with clear message** (e.g., "refactor: consolidate round tracking")

### When Something Breaks

1. **Check GAME_PHASES.md for the broken element**
   - Find it in "Visual Element Conditions Reference"
   - Check what condition controls it
   - Verify condition logic is correct

2. **Check "Data Integrity Rules"**
   - Run the 6 invariant checks
   - See which rule is violated
   - Trace back to what caused violation

3. **If stuck, rollback**
   - Follow "Rollback Plan" in MIGRATION_VALIDATION_CHECKLIST.md
   - Get back to working state
   - Analyze what went wrong
   - Try again with better understanding

### After Migration Complete

1. **Follow MIGRATION_VALIDATION_CHECKLIST.md "After Migration"**
2. **Run all 8 user flows**
3. **Run all 8 state validation tests**
4. **Verify all 6 data integrity rules**
5. **Take "after" screenshots and compare**
6. **Get sign-off from at least 2 people**

---

## Success Criteria

Migration is successful when:

✅ All 8 user flows work identically to before
✅ All 8 state validation tests pass
✅ All 6 data integrity rules hold
✅ Visual comparison shows no differences
✅ No TypeScript errors
✅ No ESLint warnings
✅ All tests passing
✅ Old localStorage format loads correctly
✅ Performance same or better than before
✅ At least 2 people have tested and signed off

---

## Why This Matters

**Problem:** Current state has redundant values that can get out of sync
- `currentRound` vs `phase.round`
- `playerScore` vs sum of `roundHistory[].playerPoints`
- `gameState` passed as prop vs derived from phase

**Risk:** These can become inconsistent, causing bugs like:
- Round number mismatch between header and phase
- Scores not matching round history
- Wrong UI state shown after resume

**Solution:** Derive values from single source of truth
- Only store `currentRound` once
- Compute scores from `roundHistory`
- Derive `gameState` from phase + board selections

**Benefit:** Impossible to have inconsistent state because derived values always match their source

---

## Questions?

If you're unsure about anything:

1. **"What shows in this phase?"** → GAME_PHASES.md → Phase Definitions
2. **"What controls this element?"** → GAME_PHASES.md → Visual Element Conditions Reference
3. **"Is this behavior correct?"** → GAME_PHASES.md → Critical Behaviors to Preserve
4. **"What should I test?"** → MIGRATION_VALIDATION_CHECKLIST.md
5. **"What's the plan?"** → MIGRATION_PLAN.md → Recommended Next Steps

---

**Ready to start?** Begin with MIGRATION_VALIDATION_CHECKLIST.md "Before Migration" section.

**Not sure where something is documented?** Check GAME_PHASES.md Quick Reference at the top.

**Want to understand the big picture?** Read MIGRATION_PLAN.md Recent Changes section.

**Good luck! Take it slow, test thoroughly, and commit frequently.** 🚀
