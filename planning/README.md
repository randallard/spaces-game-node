# Planning Documentation Index

All migration documentation organized in one place.

## 📋 Start Here

**New to this project?** Read in this order:
1. **MIGRATION_READY.md** - Overview of what we're doing and why
2. **QUICK_REFERENCE.md** - Print this out and keep it nearby
3. **GAME_PHASES.md** - The source of truth (reference as needed)

**Ready to migrate?** Follow this path:
1. **MIGRATION_VALIDATION_CHECKLIST.md** - Step-by-step process
2. **MIGRATION_PLAN.md** - High-level strategy and recent changes
3. **GAME_PHASES.md** - Reference for "what should this do?"

---

## 📚 Document Descriptions

### MIGRATION_READY.md
**What it is:** Entry point and overview document
**When to use:** Starting the migration, need motivation/context
**Key content:**
- Summary of all documents
- 5-phase migration approach
- Success criteria
- How to use these documents

### QUICK_REFERENCE.md
**What it is:** One-page cheat sheet of critical conditions
**When to use:** During coding, need quick lookup
**Key content:**
- Boolean check formulas
- Display condition rules
- Component hierarchy
- File locations
- Common mistakes

### GAME_PHASES.md (1,747 lines)
**What it is:** THE SOURCE OF TRUTH for UI behavior
**When to use:** "What should this phase show?" or "When does this element appear?"
**Key sections:**
- Phase Definitions (lines 1-587)
- ActiveGameView Display Rules (lines 20-200)
- Round History Display Rules (lines 150-300)
- Visual Element Conditions Reference (lines 200-350)
- Critical Behaviors to Preserve (lines 850-995)
- State Validation Checklist (lines 980-1050)
- Data Integrity Rules (lines 1100-1200)

### MIGRATION_VALIDATION_CHECKLIST.md
**What it is:** Step-by-step execution checklist
**When to use:** Doing the actual migration work
**Key sections:**
- Before Migration (document current state)
- During Migration (5 phases with tests)
- After Migration (regression testing)
- Rollback Plan (if things go wrong)
- Sign-Off Checklist (completion criteria)

### MIGRATION_PLAN.md
**What it is:** Strategic overview and changelog
**When to use:** Understanding the big picture, what changed
**Key sections:**
- Recent Changes (what we did 2025-01-14)
- Potential State Issues (what needs fixing)
- Recommended Next Steps (5-phase plan)
- Full migration context

---

## 🎯 Common Questions → Which Document?

### Planning Questions

**"What's the migration about?"**
→ MIGRATION_READY.md → Why This Matters section

**"How long will this take?"**
→ MIGRATION_READY.md → The 5-Phase Plan (7-12 hours)

**"What's the overall strategy?"**
→ MIGRATION_PLAN.md → Recommended Next Steps

### Implementation Questions

**"What shows in this phase?"**
→ GAME_PHASES.md → Phase Definitions → Find your phase number

**"What controls this element's visibility?"**
→ QUICK_REFERENCE.md → Display Condition Formulas
→ GAME_PHASES.md → Visual Element Conditions Reference

**"When does the round history show?"**
→ QUICK_REFERENCE.md → Display Condition Formulas → Round History Section
→ GAME_PHASES.md → Round History Display Rules (line ~150)

**"What's the logic for the re-send link button?"**
→ QUICK_REFERENCE.md → Display Condition Formulas → Re-send Link Button
→ GAME_PHASES.md → ActiveGameView Display Rules (line ~40)

### Testing Questions

**"What should I test?"**
→ MIGRATION_VALIDATION_CHECKLIST.md → After Migration → Functional Testing
→ GAME_PHASES.md → Critical Behaviors to Preserve

**"How do I verify this works correctly?"**
→ GAME_PHASES.md → State Validation Checklist (line ~980)
→ MIGRATION_VALIDATION_CHECKLIST.md → State Validation Tests

**"What invariants must be true?"**
→ GAME_PHASES.md → Data Integrity Rules (line ~1100)
→ QUICK_REFERENCE.md → State Invariants

### Debugging Questions

**"Why is this element not showing?"**
→ QUICK_REFERENCE.md → Display Condition Formulas
→ GAME_PHASES.md → Visual Element Conditions Reference → Find element → Check line number

**"What state controls this behavior?"**
→ QUICK_REFERENCE.md → Most Critical Boolean Checks
→ GAME_PHASES.md → Phase State Properties & Derived Values (line ~600)

**"Something broke, what now?"**
→ MIGRATION_VALIDATION_CHECKLIST.md → Rollback Plan
→ QUICK_REFERENCE.md → Emergency Fixes

---

## 🔧 Migration Workflow

### Before You Start (1-2 hours)

1. Read **MIGRATION_READY.md** completely
2. Print **QUICK_REFERENCE.md** or keep it open
3. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → Before Migration:
   - Take screenshots of all phases
   - Export localStorage test data
   - Create test games in various states
   - Document current behavior

### Phase 1: Consolidate Round Tracking (1-2 hours)

1. Review **MIGRATION_PLAN.md** → Recommended Next Steps → Step 1
2. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → Phase 1 checklist
3. Reference **GAME_PHASES.md** as needed for "what should this do?"
4. Use **QUICK_REFERENCE.md** for condition lookups
5. Test thoroughly before moving on

### Phase 2: Derive Scores (2-3 hours)

1. Review **MIGRATION_PLAN.md** → Recommended Next Steps → Step 2
2. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → Phase 2 checklist
3. Reference **QUICK_REFERENCE.md** → Score Calculation
4. Verify with **GAME_PHASES.md** → Data Integrity Rules → Rule 1
5. Test Discord notifications especially

### Phase 3: Move Board Selections (2-3 hours)

1. Review **MIGRATION_PLAN.md** → Recommended Next Steps → Step 3
2. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → Phase 3 checklist
3. Test incomplete round display thoroughly
4. Verify resume game scenarios

### Phase 4: Derive gameState (1-2 hours)

1. Review **MIGRATION_PLAN.md** → Recommended Next Steps → Step 4
2. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → Phase 4 checklist
3. Use **QUICK_REFERENCE.md** → GameState Determination
4. Test all board selection visibility scenarios

### Phase 5: Add Validation (1-2 hours)

1. Review **MIGRATION_PLAN.md** → Recommended Next Steps → Step 5
2. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → Phase 5 checklist
3. Test with old localStorage formats
4. Test with invalid data

### After All Phases (2-3 hours)

1. Follow **MIGRATION_VALIDATION_CHECKLIST.md** → After Migration:
   - Visual regression testing
   - All 8 functional tests
   - All 8 state validation tests
   - All 6 data integrity rules
2. Get sign-off from team
3. Deploy to staging
4. Monitor for issues

---

## 📁 File Organization

```
planning/
├── README.md                              ← You are here
├── MIGRATION_READY.md                     ← Start here
├── QUICK_REFERENCE.md                     ← Print this
├── GAME_PHASES.md                         ← Source of truth
├── MIGRATION_VALIDATION_CHECKLIST.md      ← Execution guide
├── MIGRATION_PLAN.md                      ← Strategy & changelog
├── ARCHITECTURE.md                        ← Technical decisions
├── TYPES_AND_SCHEMAS.md                   ← Type definitions
│
├── screenshots/
│   ├── before/                            ← Take these first
│   └── after/                             ← Take these after
│
└── test-data/
    ├── before/                            ← Export localStorage
    └── after/                             ← Verify compatibility
```

---

## ✅ Pre-Migration Checklist

Before starting any code changes:

- [ ] Read MIGRATION_READY.md completely
- [ ] Print QUICK_REFERENCE.md (or bookmark it)
- [ ] Skim GAME_PHASES.md to understand structure
- [ ] Follow "Before Migration" in MIGRATION_VALIDATION_CHECKLIST.md
- [ ] Take screenshots of all 19 phases
- [ ] Export localStorage for multiple game states
- [ ] Create test games (round 1, mid-game, near-end, completed)
- [ ] Document any quirks or unexpected behavior
- [ ] Set up test environment
- [ ] Have rollback plan ready

---

## 🚨 When Things Go Wrong

### "I don't know where to look"
→ This README → Common Questions section → Find your question

### "I don't know what this should do"
→ GAME_PHASES.md → Phase Definitions → Your phase

### "I don't know what condition controls this"
→ QUICK_REFERENCE.md → Display Condition Formulas → Your element

### "Tests are failing"
→ GAME_PHASES.md → State Validation Checklist → Run tests
→ GAME_PHASES.md → Data Integrity Rules → Check invariants

### "Visual regression detected"
→ GAME_PHASES.md → Visual Element Conditions Reference → Check conditions
→ QUICK_REFERENCE.md → Emergency Fixes

### "Need to rollback"
→ MIGRATION_VALIDATION_CHECKLIST.md → Rollback Plan

### "Don't understand the big picture"
→ MIGRATION_READY.md → Why This Matters
→ MIGRATION_PLAN.md → Recent Changes

---

## 💡 Tips for Success

1. **Take it slow** - This is 7-12 hours of work, not a race
2. **Test after each phase** - Don't combine phases
3. **Commit frequently** - Small, focused commits
4. **Use the docs** - They're here to help, reference them liberally
5. **Document issues** - If you find bugs or quirks, note them
6. **Take breaks** - Fresh eyes catch more bugs
7. **Get reviews** - Have someone else test your work
8. **Trust the process** - The checklist will guide you through

---

## 📞 Need Help?

If you're stuck and the documents don't answer your question:

1. Check **QUICK_REFERENCE.md** first (fastest)
2. Search **GAME_PHASES.md** for keywords
3. Review the specific phase in **GAME_PHASES.md**
4. Check **MIGRATION_VALIDATION_CHECKLIST.md** for test ideas
5. Look at **MIGRATION_PLAN.md** for context

Still stuck? Review:
- Component hierarchy in QUICK_REFERENCE.md
- File locations in QUICK_REFERENCE.md
- Implementation notes in GAME_PHASES.md phase definitions

---

**Good luck with the migration! Remember: Preserving functionality is more important than speed.** 🚀
