# Quick Reference Card - Critical Display Conditions

Print this out or keep it open while working on the migration.

## Most Critical Boolean Checks

```typescript
// Opponent type checks
isCpuOpponent = opponent?.type === 'cpu' || opponent?.type === 'remote-cpu'
isHumanOpponent = opponent?.type === 'human'

// Board selection status
hasPlayerSelected = playerSelectedBoard !== null
hasOpponentSelected = opponentSelectedBoard !== null
isPlayerTurn = !hasPlayerSelected

// Incomplete round check
hasIncompleteRound = hasPlayerSelected && !hasOpponentSelected && isHumanOpponent

// Game progress
isRound1 = currentRound === 1
completedRounds = roundHistory.length
hasHistory = roundHistory.length > 0
```

## Display Condition Formulas

### Re-send Link Button
```typescript
SHOW: !isCpuOpponent && !(currentRound === 1 && gameState === 'waiting-for-player')
HIDE: isCpuOpponent OR (round 1 AND selecting board)
```

### Board Selection UI
```typescript
SHOW: gameState === 'waiting-for-player'
HIDE: player already selected board
```

### Round History Section
```typescript
SHOW: roundHistory.length > 0 OR hasIncompleteRound
HIDE: no rounds AND no incomplete round
```

### Incomplete Round Card
```typescript
SHOW: playerSelectedBoard !== null
      AND opponentSelectedBoard === null
      AND opponent.type === 'human'
HIDE: CPU opponent OR both selected OR neither selected
```

### Share Modal Auto-Open
```typescript
OPEN: gameState === 'waiting-for-opponent-to-start' AND !isCpuOpponent
SKIP: CPU opponent (goes straight to round-results)
```

### Round History Auto-Expand
```typescript
EXPAND: hasIncompleteRound AND roundHistory.length === 0
REASON: Show incomplete round when it's the only thing in history
```

## GameState Determination

```typescript
if (phase.type === 'board-selection') {
  if (playerSelectedBoard !== null) {
    gameState = 'waiting-for-opponent-to-continue'
  } else {
    gameState = 'waiting-for-player'
  }
} else if (phase.type === 'share-challenge') {
  gameState = 'waiting-for-opponent-to-start'
} else if (phase.type === 'waiting-for-opponent') {
  gameState = 'waiting-for-opponent-to-continue'
}
```

## Score Calculation (Derived)

```typescript
// ALWAYS derive from round history, NEVER store separately
playerScore = roundHistory.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0)
opponentScore = roundHistory.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0)
```

## State Invariants (Must Always Be True)

```typescript
// 1. Scores match history
playerScore === roundHistory.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0)

// 2. Round number matches history
currentRound === roundHistory.length + 1

// 3. Can't show board selection if already selected
!(phase.type === 'board-selection' &&
  gameState === 'waiting-for-player' &&
  playerSelectedBoard !== null)

// 4. Round history is sequential
roundHistory.every((r, i) => r.round === i + 1)

// 5. Active games are incomplete
activeGame.roundHistory.length < activeGame.totalRounds

// 6. CPU games have no incomplete rounds
isCpuOpponent ? hasIncompleteRound === false : true
```

## Component Hierarchy (ActiveGameView)

```
ActiveGameView
  ├─ Header (always shown)
  │   ├─ Round info: "Round X of Y"
  │   ├─ Score: "Player A - Player B"
  │   ├─ Board size: "NxN"
  │   ├─ Matchup: "Player vs Player"
  │   └─ Re-send link (conditional)
  │
  ├─ Status message (always shown)
  │   └─ Text changes based on gameState
  │
  ├─ SavedBoards (always rendered)
  │   ├─ Board selection header (if showBoardSelection)
  │   ├─ Round History Section (if roundHistory OR incomplete)
  │   │   ├─ Score display
  │   │   ├─ Completed round cards
  │   │   └─ Incomplete round card (if hasIncompleteRound)
  │   └─ Board Selection UI (if showBoardSelection)
  │       ├─ Create button
  │       ├─ Size filter
  │       └─ Board grid
  │
  └─ ShareChallenge modal (if showShareModal AND !isCpuOpponent)
      ├─ Challenge URL
      ├─ Copy button
      ├─ Discord button
      └─ Back to Home button
```

## File Locations for Quick Changes

```
ActiveGameView display logic:    src/components/ActiveGameView.tsx:108-195
Round history section:            src/components/SavedBoards.tsx:418-553
Incomplete round card:            src/components/SavedBoards.tsx:506-548
Board selection visibility:       src/components/ActiveGameView.tsx:171
Re-send link button:              src/components/ActiveGameView.tsx:147
Share modal auto-open:            src/components/ActiveGameView.tsx:102-105
GameState determination:          src/App.tsx:2437-2455
Score calculation for Discord:    src/App.tsx:1597-1598
```

## Common Mistakes to Avoid

❌ **DON'T:** Check `phase.round` - it's redundant with `state.currentRound`
✅ **DO:** Always use `state.currentRound`

❌ **DON'T:** Store `playerScore` and `opponentScore` separately
✅ **DO:** Derive from `roundHistory`

❌ **DON'T:** Check `phase.type === 'board-selection'` to show board UI
✅ **DO:** Check `gameState === 'waiting-for-player'`

❌ **DON'T:** Show share modal for CPU opponents
✅ **DO:** Check `!isCpuOpponent` before showing

❌ **DON'T:** Add points only if player won
✅ **DO:** Always add both players' points each round

❌ **DON'T:** Show re-send link when selecting round 1 board
✅ **DO:** Check `!(currentRound === 1 && gameState === 'waiting-for-player')`

## Testing Quick Checks

After any change, verify:
- [ ] Round history shows for completed rounds
- [ ] Incomplete round shows when player selected, opponent hasn't
- [ ] Board selection hides after player selects
- [ ] Re-send link shows at right times
- [ ] Share modal auto-opens for human opponents only
- [ ] CPU games skip waiting states
- [ ] Scores match sum of round history
- [ ] Resume shows correct state

## Emergency Fixes

### "Board selection showing when it shouldn't"
→ Check: `showBoardSelection` prop and `gameState === 'waiting-for-player'`

### "Round history not showing"
→ Check: Condition `roundHistory.length > 0 OR hasIncompleteRound`

### "Incomplete round not showing"
→ Check: `playerSelectedBoard && !opponentSelectedBoard && !isCpuOpponent`

### "Scores wrong in Discord notification"
→ Check: Adding both players' points, not just winner's

### "Share modal showing for CPU"
→ Check: `!isCpuOpponent` condition before showing modal

### "Re-send link showing on round 1 selection"
→ Check: `!(currentRound === 1 && gameState === 'waiting-for-player')`

---

**Keep this open during migration!** When in doubt, check these conditions first.
