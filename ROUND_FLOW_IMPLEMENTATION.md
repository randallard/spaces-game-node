# Round Flow Implementation Plan

## Overview
This document outlines the complete flow for round-by-round multiplayer gameplay, including all branches, conditions, and UI states. It identifies two key issues with the current implementation and provides step-by-step fixes.

---

## Current Issues

### Issue 1: Previous Rounds Panel Shows Incorrectly
**Problem:** Player 2 sees "Previous Rounds (1)" before selecting their Round 1 board
**Root Cause:** `roundHistory.length` includes rounds where only the opponent has selected a board
**Expected:** Only show rounds where THIS player has participated (has a `playerBoard`)


### Issue 2: Phase Derivation After Round Completion
**Problem:** May not correctly derive to `round-results` after responding player completes round
**Expected:** Always show `round-results` to player who completed the round (selected second board)

---

## Initial Setup

```
Player 1 (Ryan - Game Creator, userId: A)
Player 2 (Ted - Responder, userId: B)

Turn Order (from CLAUDE.md):
- Round 1: Player 1 first → Player 2 responds
- Round 2: Player 2 first → Player 1 responds
- Round 3: Player 1 first → Player 2 responds
- Round 4: Player 2 first → Player 1 responds
- Round 5: Player 1 first → Player 2 responds

Pattern: Odd rounds (1,3,5) → creator first. Even rounds (2,4) → opponent first.
```

---

## Complete Flow: Round 1

### Player 1 (Initiator) - Selects Round 1 Board

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1.1: Player 1 Selects Round 1 Board                           │
├─────────────────────────────────────────────────────────────────────┤
│ Trigger: Click board in board-selection UI                         │
│                                                                       │
│ Code Path:                                                           │
│   handleBoardSelect(board)                                          │
│   └─ selectPlayerBoardAction(board)                                │
│      └─ Updates state.roundHistory[0]:                             │
│         {                                                            │
│           round: 1,                                                  │
│           playerBoard: <Player1Board>,  ✓                           │
│           opponentBoard: null,          ✗                           │
│           winner: undefined             ⏸                           │
│         }                                                            │
│                                                                       │
│ State After:                                                         │
│   roundHistory.length = 1                                           │
│   roundHistory[0].playerBoard = ✓                                  │
│   roundHistory[0].opponentBoard = null                             │
│   currentRound = 1 (from deriveCurrentRound - first incomplete)    │
│   playerScore = 0                                                    │
│   opponentScore = 0                                                  │
│                                                                       │
│ Phase Derivation:                                                    │
│   derivePhase() checks Round 1:                                     │
│   - playerBoard ✓ && opponentBoard ✗ && opponent.type='human'      │
│   → Returns: { type: 'share-challenge', round: 1 }                 │
│                                                                       │
│ UI Shows:                                                            │
│   ┌──────────────────────────────────────────┐                     │
│   │ ActiveGameView                           │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Round 1 of 5                             │                     │
│   │ Score: Ryan 0 - Ted 0                    │                     │
│   │                                           │                     │
│   │ ┌─ Round History (1) ──────────────┐    │                     │
│   │ │ Round 1          In Progress      │    │                     │
│   │ │ [Ryan's Board]  [?]               │    │                     │
│   │ │ (dashed border, not clickable)    │    │                     │
│   │ └───────────────────────────────────┘    │                     │
│   │                                           │                     │
│   │ [Re-send Link] button visible            │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│   ShareChallenge Modal (auto-opens):                                │
│   ┌──────────────────────────────────────────┐                     │
│   │ Turn Complete!                           │                     │
│   │ 🔔 Discord notification sent to Ted      │                     │
│   │                                           │                     │
│   │ Challenge URL: [shortened URL]           │                     │
│   │ [Copy Link] [Share]                      │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│ Discord Notification Sent to Player 2:                              │
│   Type: 'turn-ready'                                                │
│   Message: "It's your turn for Round 1 vs Ryan!"                   │
│   URL: Contains Player 1's board (encoded)                          │
│                                                                       │
│ Player 1 Waits... (stays in share-challenge/waiting state)         │
└─────────────────────────────────────────────────────────────────────┘
```

### Player 2 (Responder) - Receives Challenge

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1.2: Player 2 Receives Challenge, Before Selection            │
├─────────────────────────────────────────────────────────────────────┤
│ Trigger: Clicks challenge URL from Discord                         │
│                                                                       │
│ Code Path:                                                           │
│   handleIncomingChallenge(challengeData)                           │
│   └─ Loads roundHistory from localStorage (empty)                  │
│   └─ Creates roundHistory[0]:                                      │
│      {                                                               │
│        round: 1,                                                     │
│        playerBoard: null,               ✗ (Player 2 hasn't chosen) │
│        opponentBoard: <Player1Board>,   ✓ (from URL)               │
│        winner: undefined                ⏸                           │
│      }                                                               │
│   └─ loadState with phaseOverride: 'board-selection'               │
│                                                                       │
│ State After:                                                         │
│   roundHistory.length = 1                                           │
│   roundHistory[0].playerBoard = null                               │
│   roundHistory[0].opponentBoard = ✓                                │
│   currentRound = 1                                                   │
│   playerScore = 0                                                    │
│   opponentScore = 0                                                  │
│                                                                       │
│ Phase: 'board-selection' (override)                                │
│                                                                       │
│ ❌ CURRENT UI (WRONG):                                              │
│   ┌──────────────────────────────────────────┐                     │
│   │ ActiveGameView                           │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Round 1 of 5                             │                     │
│   │ Select your board for Round 1            │                     │
│   │                                           │                     │
│   │ ┌─ Round History (1) ──────────────┐    │ ← ISSUE!            │
│   │ │ Round 1      In Progress          │                           │
│   │ │ [?]  [Ryan's Board]               │                           │
│   │ └───────────────────────────────────┘    │                     │
│   │                                           │                     │
│   │ Board Selection UI:                      │                     │
│   │ [Create New] [Board Grid...]             │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│ ✅ EXPECTED UI (CORRECT):                                           │
│   ┌──────────────────────────────────────────┐                     │
│   │ ActiveGameView                           │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Round 1 of 5                             │                     │
│   │ Select your board for Round 1            │                     │
│   │                                           │                     │
│   │ ❌ NO Round History Panel                │ ← FIX: Filter out   │
│   │    (player hasn't participated yet)      │    opponent-only    │
│   │                                           │    rounds           │
│   │ Board Selection UI:                      │                     │
│   │ [Create New] [Board Grid...]             │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│ Filter Logic Needed:                                                │
│   Only show rounds where r.playerBoard !== null                    │
│   roundHistory.filter(r => r.playerBoard !== null).length === 0    │
│   → No previous rounds panel shown                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Player 2 (Responder) - Selects Round 1 Board

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1.3: Player 2 Selects Round 1 Board                           │
├─────────────────────────────────────────────────────────────────────┤
│ Trigger: Click board in board-selection UI                         │
│                                                                       │
│ Code Path:                                                           │
│   handleBoardSelect(board)                                          │
│   └─ selectPlayerBoardAction(board)                                │
│      └─ Updates roundHistory[0]:                                    │
│         {                                                            │
│           round: 1,                                                  │
│           playerBoard: <Player2Board>,  ✓                           │
│           opponentBoard: <Player1Board>, ✓                          │
│           winner: undefined             ⏸ (not simulated yet)      │
│         }                                                            │
│   └─ Checks: opponentSelectedBoard exists? YES                     │
│   └─ setTimeout(() => {                                            │
│        result = simulateRound(1, player2Board, player1Board)       │
│        completeRound(result)                                        │
│        └─ Updates roundHistory[0]:                                 │
│           {                                                          │
│             round: 1,                                                │
│             playerBoard: ✓,                                         │
│             opponentBoard: ✓,                                       │
│             winner: 'player'/'opponent'/'tie', ✓                    │
│             playerPoints: X,                                         │
│             opponentPoints: Y,                                       │
│             playerFinalPosition: {...},                              │
│             opponentFinalPosition: {...}                             │
│           }                                                          │
│        saveRoundResult(...)                                         │
│                                                                       │
│      }, 500)                                                        │
│                                                                       │
│ State After:                                                         │
│   roundHistory.length = 1                                           │
│   roundHistory[0] = COMPLETE (both boards, winner set)             │
│   currentRound = 2 (derived: first incomplete round)               │
│   playerScore = X                                                    │
│   opponentScore = Y                                                  │
│                                                                       │
│ Phase Derivation:                                                    │
│   derivePhase() checks Round 1:                                     │
│   - isRoundComplete(roundHistory[0])? YES                          │
│   - nextRound = 2                                                    │
│   - roundHistory[1] exists? NO                                     │
│   → Returns: { type: 'round-results', round: 1, result: ... }     │
│                                                                       │
│ UI Shows:                                                            │
│   ┌──────────────────────────────────────────┐                     │
│   │ RoundResults Component                   │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ 🎉 Ted Won! / 😞 Ryan Won / 🤝 Tie!      │                     │
│   │                                           │                     │
│   │ [Combined Board Replay Animation]        │                     │
│   │ [▶ Step] [↻ Restart]                    │                     │
│   │                                           │                     │
│   │ Score: Ted X - Ryan Y                    │                     │
│   │                                           │                     │
│   │ [Explanation Panel...]                   │                     │
│   │                                           │                     │
│   │ [Continue to Next Round] ←─────┐        │                     │
│   └──────────────────────────────────────────┘                     │
│                                        │                              │
│ Player 2 Watches Replay, Clicks Continue ──┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Player 2 - Clicks Continue (Advances to Round 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1.4: Player 2 Clicks "Continue"                               │
├─────────────────────────────────────────────────────────────────────┤
│ Trigger: Click "Continue to Next Round" button                     │
│                                                                       │
│ Code Path:                                                           │
│   handleContinue()                                                  │
│   └─ Check: currentRound === 5? NO (it's 2 now)                   │
│                                                                      |
│                                                                       │
│ State After (no changes, just phase re-derivation):                │
│   roundHistory.length = 1 (Round 1 complete)                       │
│   currentRound = 2 (derived)                                        │
│                                                                       │
│ Phase Derivation:                                                    │
│   derivePhase() checks Round 2:                                     │
│   - playerBoard? NO                                                 │
│   - opponentBoard? NO                                               │
│   - roundHistory has complete rounds? YES (Round 1)                │
│   → Returns: { type: 'round-review', round: 2 }                    │
│                                                                       │
│ UI Shows:                                                            │
│   ┌──────────────────────────────────────────┐                     │
│   │ AllRoundsResults (isReview=true)        │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Game Info Header:                        │                     │
│   │ Round 2 of 5                             │                     │
│   │ Score: Ted X - Ryan Y                    │                     │
│   │ Board Size: 3×3                          │                     │
│   │ Ryan vs Ted (click to re-send)           │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Previous Rounds                          │                     │
│   │ Review the game so far...                │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ ┌─ Round 1 ─────────────┐               │                     │
│   │ │ Round 1    Ted Won     │ (green)       │                     │
│   │ │ [Ted Board] [Ryan Brd] │               │                     │
│   │ │ Ted X - Ryan Y         │               │                     │
│   │ └────────────────────────┘               │                     │
│   │ (clickable to view details)              │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Select a Board for Round 2               │                     │
│   │ [SavedBoards component embedded]         │                     │
│   │ [Create New] [Board Grid...]             │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│ Player 2 Now at Round 2 Board Selection                            │
│ (Player 2 goes first in Round 2 - turn alternates)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Player 1 - Receives Round 1 Complete Notification

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1.5: Player 1 Gets Notification & Views Results               │
├─────────────────────────────────────────────────────────────────────┤
│ Trigger: Discord notification "Round 1 complete!"                  │
│                                                                       │
│ Player 1 clicks notification URL                                    │
│                                                                       │
│ Code Path:                                                           │
│   handleIncomingChallenge(challengeData)                           │
│   └─ challengeData.isRoundComplete = true                          │
│   └─ challengeData.previousRoundResult = Round 1 result            │
│   └─ Syncs Round 1 result to localStorage                          │
│   └─ loadState with phaseOverride: 'round-review', round: 2        │
│                                                                       │
│ State After:                                                         │
│   roundHistory.length = 1 (Round 1 complete - synced)              │
│   roundHistory[0] = COMPLETE                                        │
│   currentRound = 2                                                   │
│                                                                       │
│ Phase: 'round-review' (override)                                   │
│                                                                       │
│ UI Shows:                                                            │
│   ┌──────────────────────────────────────────┐                     │
│   │ AllRoundsResults (isReview=true)        │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Round 2 of 5                             │                     │
│   │ Score: Ryan Y - Ted X                    │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ Previous Rounds (1)                      │                     │
│   │ ┌─ Round 1 ─────────────┐               │                     │
│   │ │ Round 1    Ryan Lost   │ (red)         │                     │
│   │ │ [Ryan Brd] [Ted Board] │               │                     │
│   │ │ Ryan Y - Ted X         │               │                     │
│   │ └────────────────────────┘               │                     │
│   ├──────────────────────────────────────────┤                     │
│   │ ⏳ Next Up: Round 2                      │                     │
│   │ Ted still needs to select their board    │                     │
│   │ for Round 2...                           │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│ Player 1 Waits for Player 2's Round 2 Board                        │
│ (Player 2 goes first in Round 2)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Round 2 Flow (Turn Alternates)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2.1: Player 2 Selects Round 2 Board (Goes First)             │
├─────────────────────────────────────────────────────────────────────┤
│ (Player 2 is in round-review from Step 1.4)                        │
│                                                                       │
│ Trigger: Selects board from embedded SavedBoards                   │
│                                                                       │
│ Code Path:                                                           │
│   handleBoardSelect(board)                                          │
│   └─ selectPlayerBoardAction(board)                                │
│      └─ Creates roundHistory[1]:                                    │
│         {                                                            │
│           round: 2,                                                  │
│           playerBoard: <Player2Board>, ✓                            │
│           opponentBoard: null,         ✗                            │
│           winner: undefined                                          │
│         }                                                            │
│   └─ Checks: opponentSelectedBoard? NO                             │
│   └─ opponent.type === 'human'? YES                                │
│   └─ shouldShowShareModal = true                                   │
│                                                                       │
│ State After:                                                         │
│   roundHistory.length = 2                                           │
│   roundHistory[0] = COMPLETE (Round 1)                             │
│   roundHistory[1].playerBoard = ✓, opponentBoard = null            │
│   currentRound = 2                                                   │
│                                                                       │
│ Phase Derivation:                                                    │
│   derivePhase() checks Round 2:                                     │
│   - playerBoard ✓ && opponentBoard ✗ && opponent.type='human'      │
│   → Returns: { type: 'share-challenge', round: 2 }                 │
│                                                                       │
│ UI Shows:                                                            │
│   ShareChallenge Modal (auto-opens):                                │
│   ┌──────────────────────────────────────────┐                     │
│   │ Turn Complete!                           │                     │
│   │ 🔔 Discord notification sent to Ryan     │                     │
│   │                                           │                     │
│   │ Challenge URL: [shortened URL for R2]    │                     │
│   └──────────────────────────────────────────┘                     │
│                                                                       │
│ Discord Notification Sent to Player 1:                              │
│   Type: 'turn-ready'                                                │
│   Message: "It's your turn for Round 2 vs Ted!"                    │
│   URL: Contains Player 2's Round 2 board                            │
│                                                                       │
│ Player 2 Waits...                                                   │
└─────────────────────────────────────────────────────────────────────┘

(Then Player 1 receives challenge, selects board, sees results,
 sends round-complete notification, etc. - same pattern as Round 1)
```

---

## Key Conditions & Decision Points

### Condition 1: Should Previous Rounds Panel Show?

```javascript
// Filter to only show rounds where player has participated
const roundsWithPlayerParticipation = roundHistory.filter(
  r => r.playerBoard !== null
);

// Show panel when player has participated in at least one round
showPreviousRounds = roundsWithPlayerParticipation.length > 0;
```

**Examples:**
- Player 1 after Round 1 select: `YES` (roundHistory[0].playerBoard exists)
- Player 2 before Round 1 select: `NO` (roundHistory[0].playerBoard is null)
- Player 2 after Round 1 complete, at Round 2: `YES` (Round 1 has playerBoard)

### Condition 2: Which Phase After Board Select?

```javascript
if (opponentSelectedBoard exists) {
  // Responding to challenge - round will complete
  simulateRound();
  completeRound();
  // Phase derives to 'round-results'
} else if (opponent.type === 'human') {
  // Initiating challenge - waiting for opponent
  // Phase derives to 'share-challenge'
} else {
  // CPU opponent
  // Phase derives to 'waiting-for-opponent' (CPU will respond)
}
```

### Condition 3: When to Send Discord Notifications?

```javascript
// Type 1: "It's your turn" (Challenge notification)
// When: Player selects board FIRST (initiating challenge)
// Where: After selectPlayerBoard, in share-challenge phase
// Current: ✅ Working (sent in handleBoardSelect for human opponents)

// Type 2: "Round complete" (Result notification)
// When: Player clicks Continue after viewing round-results
// Where: In handleContinue, before advancing to next round
// Current: ❌ Sent too early (in handleBoardSelect after completeRound)
// Fix: Move to handleContinue
```

### Condition 4: Turn Order (Who Goes First Each Round)?

```javascript
const playerWentFirstRound1 = state.gameCreatorId === state.user.id;
const isOddRound = round % 2 === 1;
const isPlayerTurnToGoFirst = isOddRound === playerWentFirstRound1;

// Results:
// Round 1: Creator first
// Round 2: Non-creator first
// Round 3: Creator first
// Round 4: Non-creator first
// Round 5: Creator first
```

---

## Three Main Fixes Required

### Fix 1: Filter Display - Only Show Rounds Where Player Participated

**File:** `src/App.tsx`
**Location:** round-review case (around line 2917)

**Current:**
```typescript
return (
  <AllRoundsResults
    results={state.roundHistory}
    ...
  />
);
```

**Change To:**
```typescript
// Only show rounds where player has selected a board
const roundsWithPlayerParticipation = state.roundHistory.filter(
  r => r.playerBoard !== null
);

return (
  <AllRoundsResults
    results={roundsWithPlayerParticipation}
    ...
  />
);
```

**Also Apply To:**
- `board-selection` phase in ActiveGameView (if it shows round history)
- Any other location where `roundHistory` is passed for display

**Test:**
- Player 2 loads Round 1 challenge → Should see NO previous rounds panel
- Player 2 after Round 1 complete, at Round 2 → Should see Round 1 in previous rounds

---

### Fix 2: Move Discord "Round Complete" Notification to handleContinue

**File:** `src/App.tsx`

#### Part A: Remove from handleBoardSelect

**Location:** Lines 1770-1820 (approximately)

**Current:**
```typescript
// In handleBoardSelect, after completeRound()
if (state.opponent?.type === 'human' && savedUser?.name && state.gameId) {
  // Send Discord notification to opponent that round is complete
  const roundResultUrl = await generateChallengeUrlShortened(...);
  sendDiscordNotification(opponent, 'round-complete', {...});
}
```

**Change To:**
```typescript
// Remove this entire block
// Notification will be sent in handleContinue instead
```

#### Part B: Add to handleContinue

**Location:** Around line 2019 (in handleContinue function)

**Add After the Round 5 Check:**
```typescript
const handleContinue = async () => {
  // ... existing code ...

  // Check if this was the final round (round 5)
  if (currentRound === 5) {
    const winner = playerScore > opponentScore ? 'player' : opponentScore > playerScore ? 'opponent' : 'tie';
    endGame(winner);
    return;
  }

  // ✅ ADD THIS: Send "round complete" notification after viewing results
  if (state.opponent?.type === 'human' && savedUser?.name && state.gameId) {
    const previousRound = currentRound - 1; // Just completed round
    const completedRound = state.roundHistory[previousRound - 1];

    if (completedRound && completedRound.winner !== undefined) {
      // Generate URL with round result for opponent to view
      const roundResultUrl = await generateChallengeUrlShortened(
        completedRound.playerBoard,
        previousRound,
        state.gameMode || 'round-by-round',
        state.gameId,
        savedUser.id,
        savedUser.name,
        opponentScore, // From opponent's perspective
        playerScore,   // From opponent's perspective
        savedUser.discordId,
        savedUser.discordUsername,
        savedUser.discordAvatar,
        completedRound, // Include the round result
        true, // isRoundComplete
        state.gameCreatorId || undefined,
        state.roundHistory
      ) || generateChallengeUrl(
        completedRound.playerBoard,
        previousRound,
        state.gameMode || 'round-by-round',
        state.gameId,
        savedUser.id,
        savedUser.name,
        opponentScore,
        playerScore,
        savedUser.discordId,
        savedUser.discordUsername,
        savedUser.discordAvatar,
        completedRound,
        true,
        state.gameCreatorId || undefined,
        state.roundHistory
      );

      // Determine result from opponent's perspective
      const opponentResult: 'win' | 'loss' | 'tie' =
        completedRound.winner === 'opponent' ? 'win' :
        completedRound.winner === 'player' ? 'loss' : 'tie';

      sendDiscordNotification(state.opponent, 'round-complete', {
        playerName: savedUser.name,
        round: previousRound,
        gameUrl: roundResultUrl,
        result: opponentResult,
        ...(state.boardSize !== null && { boardSize: state.boardSize }),
      });
    }
  }

  // Not final round yet - need to transition to next round
  // ... rest of existing code ...
};
```

**Test:**
1. Player 2 completes Round 1 → sees round-results
2. Player 2 clicks Continue → Discord notification sent to Player 1
3. Player 1 receives "Round 1 complete" notification
4. Timing: Notification only sent AFTER player viewed results

---

### Fix 3: Verify Phase Derivation After Round Completion

**File:** `src/utils/derive-state.ts`
**Location:** Lines 236-254

**Current Logic:**
```typescript
if (isRoundComplete(result)) {
  const nextRound = round + 1;
  if (nextRound <= GAME_RULES.TOTAL_ROUNDS) {
    const nextResult = state.roundHistory[nextRound - 1];
    if (!nextResult) {
      return { type: 'round-results', round, result: result! };
    }
    continue;
  } else {
    return { type: 'game-over', winner: deriveWinner(state) };
  }
}
```

**Verify:**
- After `completeRound()` is called in `handleBoardSelect`
- Round is marked complete with winner
- Next round entry doesn't exist yet
- Should return `{ type: 'round-results' }`

**Test:**
- Player 2 selects Round 1 board (responding to challenge)
- After simulation completes → should derive to `round-results`
- Player 2 should see RoundResults component with replay
- If it goes to `share-challenge` instead, there's a bug in derive logic

**Potential Issue:**
If `selectPlayerBoard` is creating a next round entry prematurely, it would skip round-results.

**Check:**
- `useGameState.ts` lines 150-184 (selectPlayerBoard)
- Should only update current round, not create next round entry

---

## Implementation Steps (Do in Order)

### Step 1: Fix Display Filter ✅
**Priority:** High - Most visible issue
**Risk:** Low - Simple filter, doesn't affect logic

1. Apply filter in `App.tsx` round-review case
2. Test: Player 2 loads Round 1 challenge → No previous rounds shown
3. Test: Player 2 after Round 1 complete → Round 1 shown in previous rounds
4. Verify: Round cards still clickable and display correctly

### Step 2: Verify Phase Derivation ✅
**Priority:** High - Core flow must work
**Risk:** Medium - Could affect phase transitions

1. Test: Player 2 selects Round 1 board
2. Verify: Goes to `round-results` (not `share-challenge`)
3. Add logging if needed to trace phase derivation
4. Check: No premature round entry creation

### Step 3: Move Discord Notification ✅
**Priority:** Medium - Timing issue
**Risk:** Medium - Discord integration, async code

1. Remove notification block from `handleBoardSelect`
2. Add notification logic to `handleContinue`
3. Test: Player 2 completes round → sees results → clicks Continue → notification sent
4. Test: Player 1 receives notification with correct timing
5. Verify: Notification includes correct round result and URL

### Step 4: Full Integration Test ✅
**Priority:** High - Verify complete flow
**Risk:** High - End-to-end test

1. Start fresh game: Player 1 creates, selects Round 1 board
2. Player 2 receives, selects Round 1 board
3. Verify: Player 2 sees round-results
4. Player 2 clicks Continue
5. Verify: Player 1 receives "Round 1 complete" notification
6. Verify: Player 2 sees round-review with Round 1 card + Round 2 board selection
7. Player 2 selects Round 2 board
8. Verify: Player 1 receives "Your turn for Round 2" notification
9. Continue through all 5 rounds
10. Verify: Game-over screen shown correctly

---

## Testing Checklist

### Display Filter Tests
- [ ] Player 2 loads Round 1 challenge → No previous rounds panel
- [ ] Player 1 after Round 1 select → Shows Round 1 partial card
- [ ] Player 2 after Round 1 complete, at Round 2 → Shows Round 1 complete card
- [ ] Player 1 at Round 2 (responding) → Shows Round 1 complete, not Round 2 partial
- [ ] Round cards display correct data (boards, scores, winner)
- [ ] Partial rounds show "In Progress" label
- [ ] Complete rounds show correct winner label

### Phase Derivation Tests
- [ ] Player 1 selects Round 1 → goes to share-challenge
- [ ] Player 2 selects Round 1 (responding) → goes to round-results
- [ ] Player 2 selects Round 2 (initiating) → goes to share-challenge
- [ ] Player 1 selects Round 2 (responding) → goes to round-results
- [ ] After round-results Continue → goes to round-review
- [ ] After Round 5 complete → goes to game-over

### Discord Notification Tests
- [ ] Player 1 selects Round 1 → "Your turn" sent to Player 2 immediately
- [ ] Player 2 completes Round 1, views results → No notification yet
- [ ] Player 2 clicks Continue → "Round complete" sent to Player 1
- [ ] Player 1 receives notification with Round 1 results URL
- [ ] Player 2 selects Round 2 → "Your turn" sent to Player 1
- [ ] Notification messages are correct (win/loss/tie)
- [ ] Notification URLs load correctly

### Edge Cases
- [ ] Resume game mid-round → Correct display of previous rounds
- [ ] Resume after network disconnect → Round history syncs correctly
- [ ] Multiple rapid board selections → Doesn't send duplicate notifications
- [ ] CPU opponent → No Discord notifications sent
- [ ] Game creator vs non-creator → Turn order correct for all rounds

---

## Next Steps for Implementation

To continue this work in a new chat session, provide this prompt:

```
I'm working on fixing the round flow in a multiplayer turn-based game.

Current issues:
1. Previous rounds panel shows rounds where only opponent selected (should filter to player participation only)
2. Discord "round complete" notification sent too early (before player views results)
3. Need to verify phase derivation works correctly after round completion

The complete flow diagram and implementation plan is in ROUND_FLOW_IMPLEMENTATION.md

Please implement Fix 1 (Display Filter) first:
- In App.tsx round-review case (line ~2917), filter roundHistory to only show rounds where r.playerBoard !== null
- Apply the same filter to any other locations where roundHistory is displayed
- Test that Player 2 loading a Round 1 challenge sees NO previous rounds panel
- Test that after Round 1 is complete, the player sees it in previous rounds

After Fix 1 is working, we'll move to Fix 2 (Discord notification timing).

The goal is to have a smooth flow where:
- Player 1 selects Round 1 board → Player 2 gets "your turn" notification
- Player 2 selects Round 1 board → sees round-results replay
- Player 2 clicks Continue → Player 1 gets "round complete" notification
- Player 2 sees round-review with Round 1 card + Round 2 board selection
- Pattern continues for all 5 rounds with alternating turn order
```
