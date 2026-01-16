# Game Phases & UI States

**Purpose:** This document is the source of truth for what displays in each game phase and under what conditions. Use this during migration to ensure no behavior is lost.

## Document Structure

1. **Phase Definitions** - Complete list of all game phases with what shows when
2. **ActiveGameView Display Rules** - Detailed conditions for phases 13-15 (the most complex)
3. **Round History Display Rules** - Complete logic for round history section (appears in multiple phases)
4. **Visual Element Conditions Reference** - Quick lookup table for any UI element
5. **Critical Behaviors to Preserve** - User flows and test scenarios
6. **State Validation Checklist** - Concrete tests to run before/after migration
7. **Data Integrity Rules** - Invariants that must always be true

## Quick Reference: Most Critical Sections

**Before changing any UI logic, read:**
- "ActiveGameView Display Rules" (line ~20) - For phases 13-15
- "Round History Display Rules" (line ~150) - For round history section
- "Visual Element Conditions Reference" (line ~200) - For any specific element

**Before changing state structure, read:**
- "Data Integrity Rules" (line ~1100) - Invariants that must hold
- "State Transition Matrix" (line ~1050) - Valid/invalid transitions

**Before testing, read:**
- "Critical Behaviors to Preserve" (line ~850) - User flows to test
- "State Validation Checklist" (line ~980) - Specific validation tests

---

## Phase Definitions

### 1. `user-setup`
**Screen:** User profile creation form
**Info Displayed:**
- Header with no home / no profile button
- Title: Create Your Profile
- intro image with description
- Name input field
- Creature selection (optional)

**Buttons:**
- ✅ "Restore from Backup" (open OS file selection to choose backup file)
- ✅ "Continue" (active when name entered)

**Navigation:**
- No back button (first-time setup)

---

### 2. `tutorial-intro`
**Screen:** Tutorial introduction modal
**Info Displayed:**
- Header with no home / no profile button
- Bug forward image
- Welcome message
- link to customize CPU Sam
- Creature selection UI
- Tutorial explanation text

**Buttons:**
- ✅ "Continue" (start tutorial)
- ✅ "Skip Tutorial" (go to board-management)

**Navigation:**
- Can skip to main game

---

### 2a. `customize-cpu-sam`
**Modal:** Customize CPU Sam
**Input fields:** 
- Name - name to replace CPU Sam with
- Creature - creature to use for CPU Sam

**Buttons:**
- ✅ "Cancel" (close Modal without saving changes )
- ✅ "Save (save changes and close modal )

---

### 3. `tutorial-board-creation`
**Screen:** Tutorial board creator
**Info Displayed:**
- Tutorial Board creation UI (2x2 grid)
- Tutorial instructions/hints

**Buttons:**
- ✅ "Continue" (when valid board created)
- ❌ "Back" (hidden - can't go back in tutorial)

**Navigation:**
- Forward only through tutorial

---

### 4. `tutorial-results`
**Screen:** Tutorial round results
**Info Displayed:**
- Instructions / hints
- Round  walkthrough viewer
- Outcome viewer

**Buttons:**
- ✅ round walkthrough Controls 

**Navigation:**
- Forward only (Walkthrough continue button) goes to tutorial-name-entry

---

### 5. `tutorial-name-entry`
**Screen:** Name entry form (after tutorial)
**Info Displayed:**
- Tutorial game response
- "Choose your name" prompt
- Name input field

**Buttons:**
- ✅ "Continue" (when name entered) - goes to cpu-tougher-intro

**Navigation:**
- Must enter name to proceed

---

### 5a. `cpu-tougher-intro`
**Screen:** Modal
**Info Displayed:**
- CPU Tougher text

**Buttons:**
- ✅ "Let's Go!" - goes to home

---

### 6. `home`

**Info Displayed:**
- Header with no home / yes profile button
- Active Games panel (active-games) - if any games in progress
- Opponent panel (opponent-management)
- Board panel (board-management)

**Buttons:**
- ✅ "View Profile"

**Navigation:**
- This is the "home" screen
- Header shows user name and stats

**Implementation Notes:**
- Active Games panel appears at top when `activeGames.length > 0`
- Active games are loaded from localStorage and filtered for incomplete games
- Panel is hidden when no games are in progress

___

### 6a. `active-games`
**Screen:** Active games panel (shown on home screen)

**Conditions:**
- **ONLY shown if there are games in progress** (`activeGames.length > 0`)
- Games are considered "in progress" if not all rounds are complete
- Includes both human and CPU opponent games

**Info Displayed:**
- Title: "Active Games" with count badge
- List of active games showing:
  - Opponent avatar (Discord avatar if connected, creature avatar otherwise)
  - Opponent name
  - Game progress: "Round X of Y"
  - Current score: "You X - Opponent Y"
  - Board size: "Z×Z"
  - Status indicator:
    - "Your turn" (green) if player needs to select board
    - "Waiting for {opponent.name}" (yellow) if opponent's turn (human opponents only)

**Buttons:**
- ✅ "Resume" (per game) - loads game and goes to appropriate phase
- ✅ "Remove game from Active list" (per game) - shows confirmation modal with archive/delete options

**Implementation Notes:**
- `ActiveGames` component at top of home screen
- Games loaded from localStorage via `getActiveGames()`
- Each game links to opponent by `opponentId`
- Opponent avatars loaded via `OpponentAvatar` component for human opponents, creature icons for CPU
- "Your turn" determined by: `!game.playerSelectedBoard && game.currentRound <= game.totalRounds`
- Resume button calls `handleResumeGame(gameId)`
- CPU games: `gameId` is auto-generated in format `cpu-{opponentId}-{boardSize}-{gameMode}-{timestamp}`
- CPU games reuse existing gameId if same opponent/boardSize/gameMode found
- Human games: `gameId` is generated when challenge URL is created

---

### 6b. `opponent-management`
**Screen:** Opponent selection panel
**Info Displayed:**
- Title: "Opponents"
- List of saved opponents
- CPU opponents always available
- Human opponents with Discord icon
- Wins and losses (per opponent)

**Buttons:**
- ✅ "Play" (per opponent) - goes to `game-mode-selection`
- ✅ "+ Add Opponent" - goes to opponent type selection
- ✅ "Remove Opponent" (per opponent) - goes to Remove opponent from list modal

---

### 6c. `board-management`
**Screen:** Main board management panel 
**Info Displayed:**
- List of saved boards
- Board thumbnails
- Board names

**Buttons:**
- ✅ "+ Create New Board"
- ✅ "+ Create New Deck" goes to `deck-management`
- ✅ "Delete Board" (per board)

---

### 7. `add-opponent`
**Screen:** Add opponent form/modal
**Info Displayed:**
- "Add New Opponent"
- Opponent type selection (Human/CPU)
- Name input for human opponents
- Discord connection option

**Buttons:**
- ✅ "Add Opponent"
- ✅ "Cancel" (back to board-management)
- ✅ "Connect Discord" (if not connected)

**Navigation:**
- Back to board-management on cancel

---

### 8. `game-mode-selection`
**Screen:** Game mode selection screen
**Info Displayed:**
- Opponent name: "Playing against: {opponent.name}"
- Game mode options:
  - Round by Round (5 rounds)
  - Deck Mode (10 rounds) - may be locked
- Unlock progress if deck mode locked

**Buttons:**
- ✅ "Round by Round" (always available)
- ⚠️ "Deck Mode" (locked/unlocked based on progress)
- ✅ "Back" - to `home`

**Navigation:**
- Back goes to opponent selection or board-management

---

### 9. `board-size-selection`
**Screen:** Board size selection screen
**Info Displayed:**
- header with home and profile buttons
- "Choose Board Size"
- Game mode: {gameMode} and {opponent.name}
- Size options: 2x2, 3x3, etc.

**Buttons:**
- ✅ "2×2"
- ✅ "3×3" (if unlocked)
- ✅ Other sizes when unlocked
- ✅ custom size selector 
- ✅ "Back" (to game mode selection)

**Navigation:**
- Back to game-mode-selection

---

### 10. `opponent-selection`
- moved to 6a.

---

### 11. `deck-management`
**Screen:** Deck manager
**Info Displayed:**
- List of saved decks
- Deck names and board counts
- "Create New Deck" option

**Buttons:**
- ✅ "Create New Deck"
- ✅ "Edit Deck" (per deck)
- ✅ "Delete Deck" (per deck)
- ✅ "Back" (to board-management)

**Navigation:**
- Back to board-management

---

### 12. `deck-selection`
**Screen:** Deck selection screen
**Info Displayed:**
- "Select Your Deck"
- List of available decks
- Deck preview (board count, size)

**Buttons:**
- ✅ "Select Deck" (per deck)
- ✅ "Back" (to opponent selection)

**Navigation:**
- Back to opponent-selection

---

## ActiveGameView Display Rules (Phases 13-15)

The `ActiveGameView` component handles phases: `board-selection`, `share-challenge`, and `waiting-for-opponent`. This section documents exactly what shows when.

### Always Visible Elements

#### 1. Header Section
**Always shown** (regardless of gameState):

```
┌──────────────────────────────────────────┐
│ Round 2 of 5                             │ ← currentRound / totalRounds
│ Score: Ryan 4 - Ted 3                    │ ← playerScore - opponentScore
│ Board Size: 2×2                          │ ← boardSize
│ Ted vs Ryan                              │ ← opponentName vs playerName
│ (click here to re-send game link) ←────┐│ ← Only if conditions met (see below)
└──────────────────────────────────────────┘
```

**Re-send Link Button Conditions:**
```typescript
!isCpuOpponent && !(currentRound === 1 && gameState === 'waiting-for-player')
```

Shows when:
- ✅ Opponent is human (`opponent.type === 'human'`)
- ✅ NOT (selecting round 1 board) - because challenge URL doesn't exist yet

Hidden when:
- ❌ Opponent is CPU (`opponent.type === 'cpu' || opponent.type === 'remote-cpu'`)
- ❌ Currently selecting the first board (round 1 and gameState is 'waiting-for-player')

**Button behavior:**
- Opens `ShareChallenge` modal with current challenge URL
- Same modal as auto-opened after board selection

#### 2. Status Message
**Always shown** (text changes based on gameState):

```typescript
switch (gameState) {
  case 'waiting-for-player':
    return `Select your board for Round ${currentRound}`;
  case 'waiting-for-opponent-to-start':
    return `Waiting for ${opponentName} to complete Round ${currentRound}`;
  case 'waiting-for-opponent-to-continue':
    return `Waiting for ${opponentName} to complete Round ${currentRound}`;
}
```

### Conditionally Visible Elements

#### 3. Board Selection UI
**Condition:** `showBoardSelection === true`

```typescript
showBoardSelection = (gameState === 'waiting-for-player')
```

**Shows when:**
- ✅ Player has NOT selected their board yet
- ✅ gameState is 'waiting-for-player'
- ✅ playerSelectedBoard === null

**Hidden when:**
- ❌ Player has already selected their board
- ❌ gameState is 'waiting-for-opponent-to-start' or 'waiting-for-opponent-to-continue'
- ❌ playerSelectedBoard !== null

**What's included in Board Selection UI:**
- "Select a Board for Round X" header
- "{userName} vs {opponentName}" subtitle
- "+ Create New Board" button
- Size filter dropdown
- Board grid (filtered by size)
- Each board card shows:
  - Board thumbnail
  - Board name
  - Move count
  - Created date
  - Click to select

#### 4. Round History Section
**Condition:** `roundHistory.length > 0 OR hasIncompleteRound`

See "Round History Display Rules" section below for full details.

**Shows when:**
- ✅ At least one round completed (`roundHistory.length > 0`), OR
- ✅ Player selected board but opponent hasn't (`hasIncompleteRound`)

**Hidden when:**
- ❌ No completed rounds AND no incomplete round (only possible in round 1 before player selects)

#### 5. ShareChallenge Modal
**Condition:** `showShareModal === true` (controlled by component state)

**Auto-opens when:**
```typescript
useEffect(() => {
  if (gameState === 'waiting-for-opponent-to-start' && !isCpuOpponent) {
    setShowShareModal(true);
  }
}, [gameState, isCpuOpponent]);
```

- ✅ gameState is 'waiting-for-opponent-to-start' (just selected board)
- ✅ Opponent is human (not CPU)

**Can be manually opened when:**
- User clicks "Re-send Link" button in header

**Never shows when:**
- ❌ Opponent is CPU (CPU games skip share phase entirely)

**Modal content:**
- "Round {round} of 5" title
- "Share this link with {opponent.name}"
- Challenge URL (copyable text)
- "Copy Link" button
- "Send Discord Notification" button (if opponent has Discord connected)
- "Back to Home" button
- "×" close button

**Modal behavior:**
- Fixed overlay (z-index: 1000)
- Clicking "×" or "Cancel" → closes modal, stays in game (waiting-for-opponent state)
- Clicking "Back to Home" → closes modal, goes to home screen
- Modal dismissal calls `onShareModalClosed()` which transitions phase from 'share-challenge' to 'waiting-for-opponent'

### GameState Determination Logic

```typescript
// In App.tsx when rendering ActiveGameView
let gameState: 'waiting-for-player' | 'waiting-for-opponent-to-start' | 'waiting-for-opponent-to-continue';

if (state.phase.type === 'board-selection') {
  if (state.playerSelectedBoard) {
    gameState = 'waiting-for-opponent-to-continue'; // Already selected, waiting
  } else {
    gameState = 'waiting-for-player'; // Need to select
  }
} else if (state.phase.type === 'share-challenge') {
  gameState = 'waiting-for-opponent-to-start'; // Just selected, sharing
} else if (state.phase.type === 'waiting-for-opponent') {
  gameState = 'waiting-for-opponent-to-continue'; // Explicitly waiting
}
```

### Visual State Summary

| Condition | Header | Status Msg | Board Selection UI | Round History | Share Modal |
|-----------|--------|------------|-------------------|---------------|-------------|
| Round 1, before select | ✅ (no re-send) | "Select..." | ✅ Shown | ❌ Hidden | ❌ Hidden |
| Round 1, after select (human) | ✅ (with re-send) | "Waiting..." | ❌ Hidden | ✅ Shown (incomplete) | ✅ Auto-open |
| Round 1, after select (CPU) | ✅ (no re-send) | N/A | N/A | N/A | ❌ Hidden (goes straight to results) |
| Round 2+, before select | ✅ (with re-send) | "Select..." | ✅ Shown | ✅ Shown (history) | ❌ Hidden |
| Round 2+, after select (human) | ✅ (with re-send) | "Waiting..." | ❌ Hidden | ✅ Shown (history + incomplete) | ✅ Auto-open |
| Round 2+, after select (CPU) | ✅ (no re-send) | N/A | N/A | N/A | ❌ Hidden (goes straight to results) |
| Resume while waiting | ✅ (with re-send) | "Waiting..." | ❌ Hidden | ✅ Shown (history + incomplete) | ❌ Hidden |

---

## Round History Display Rules (Critical for All Active Game Phases)

### When Round History Section Shows

**Condition:** `!isManagementMode && (roundHistory.length > 0 OR hasIncompleteRound)`

Where:
- `isManagementMode` = false during active games (true only in standalone board management)
- `hasIncompleteRound` = `playerSelectedBoard !== null && opponentSelectedBoard === null && !isCpuOpponent`

**Phases where this appears:**
- `board-selection` (when selecting or waiting)
- `waiting-for-opponent`
- Any phase handled by `ActiveGameView` component

### Section Title Logic

```typescript
if (hasIncompleteRound && roundHistory.length === 0) {
  title = "Current Round";
  toggleButtonText = "Show Current Round" / "Hide Current Round";
} else if (hasIncompleteRound && roundHistory.length > 0) {
  title = `Round History (${roundHistory.length} complete)`;
  toggleButtonText = "Show Round History" / "Hide Round History";
} else {
  title = `Previous Rounds (${roundHistory.length})`;
  toggleButtonText = "Show Previous Rounds" / "Hide Previous Rounds";
}
```

### What Shows in Round History Section

**When `showRoundHistory === true`** (collapsed by default, except when only incomplete round exists):

1. **Current Score Display**
   ```
   Ryan: 4 - Ted: 3
   ```
   - Always shown when section is expanded
   - Uses `playerScore` and `opponentScore` props

2. **Completed Round Cards** (for each `roundHistory` entry)
   ```
   ┌─────────────────────────────────────┐
   │ Round 1                    Ryan Won │ ← Green border if player won
   ├─────────────────────────────────────┤
   │ [Player Board]  [Opponent Board]    │ ← Thumbnails (opponent rotated 180°)
   │      Ryan              Ted           │
   ├─────────────────────────────────────┤
   │           Ryan 2 - Ted 1            │ ← Round points
   └─────────────────────────────────────┘
   ```

   **Styling by outcome:**
   - Player won: Green border (`#86efac`), light green background (`#f0fdf4`)
   - Opponent won: Red border (`#fca5a5`), light red background (`#fef2f2`)
   - Tie: Yellow border (`#fcd34d`), light yellow background (`#fefce8`)

   **Click behavior:**
   - Opens `RoundResults` modal showing full replay of that round
   - Modal shows combined board with both players' moves
   - Shows creature outcomes
   - Shows detailed explanation
   - "Close" button returns to game view

3. **Incomplete Round Card** (if `hasIncompleteRound === true`)
   ```
   ┌─────────────────────────────────────┐
   │ Round 2                In Progress... │ ← Gray header
   ├─────────────────────────────────────┤
   │ [Player Board Thumbnail]  [   ?   ] │ ← Player's board + ? placeholder
   │      Ryan                    Ted    │
   ├─────────────────────────────────────┤
   │            - - -                    │ ← No points yet
   └─────────────────────────────────────┘
   ```

   **Styling:**
   - Gray border (`#cbd5e1`)
   - Light gray background (`#f8fafc`)
   - Opacity 0.7
   - Non-clickable (no pointer cursor, no hover effect)
   - Tooltip: "Waiting for opponent to select their board"

   **Opponent placeholder:**
   - Gray box (`#475569`) with "?" in 2rem font
   - Opacity 0.5
   - Shows ONLY for human opponents (CPU games don't have incomplete rounds)

   **Position:** Always appears AFTER completed rounds in the grid

### Auto-Expansion Logic

```typescript
useEffect(() => {
  if (hasIncompleteRound && roundHistory.length === 0 && !showRoundHistory) {
    setShowRoundHistory(true); // Auto-expand when only incomplete round exists
  }
}, [hasIncompleteRound, roundHistory.length, showRoundHistory]);
```

**Rationale:** If there are no completed rounds yet but player has selected a board, auto-expand to show the "Current Round" card so they know their selection was saved.

### Opponent Board Display (180° Rotation)

**Critical:** Opponent boards in round history are always rotated 180° to reflect that they play from the opposite side.

**Implementation:**
- Thumbnail generated with `generateOpponentThumbnail(opponentBoard, opponentLastStep, playerTrapPosition)`
- Shows only moves opponent actually made (up to `opponentLastStep`)
- Only shows opponent traps if player hit one at `playerTrapPosition`
- Rotation handled in thumbnail generation, not in display

**Why rotation matters:**
- Opponent's goal is at opposite corner
- Opponent's starting position is opposite corner
- This makes reviewing rounds intuitive (both players move "up" toward their goal)

### Help Modal ("?" Button)

**Location:** Next to "Round History" title

**Content:** Explains why opponent moves are sometimes hidden:
- "You can only see the moves your opponent actually made during the round"
- Rounds end when: goal reached, trap hit, collision, sequences complete
- Example: If you reached goal after move 2, opponent's remaining moves stay hidden
- Strategic note: Prevents learning about opponent boards they didn't fully execute

---

### 13. `board-selection` (round: number)
**Screen:** Board selection for current round

**Conditions:**
- **If `playerSelectedBoard === null`**: Show board selection UI
- **If `playerSelectedBoard !== null`**: Show waiting state (should transition to share-challenge or waiting-for-opponent)

**Info Displayed (when selecting):**
- Header: "Round {round} of 5" (or 10 for deck mode)
- Current score: "Ted 2 - Ryan 2"
- Board size: "2×2"
- Opponent name: "{opponent.name} vs {player.name}"
- List of available boards to choose from
- "Previous Rounds (X)" button if roundHistory.length > 0

**Buttons (when selecting):**
- ✅ "Select Board" (per board)
- ✅ "Create New Board"
- ✅ "Show Previous Rounds" (if rounds exist)
- ⚠️ "Re-send Link" (shown for human opponents, EXCEPT when selecting round 1 board)
- ✅ "Back to Home"

**Info Displayed (after selected):**
- Header with game info (round, score, board size, matchup)
- Status message: "Waiting for {opponent.name} to complete Round {round}"
- "Re-send Link" button (if human opponent)
- **Board selection UI is HIDDEN** after player selects board
- Previous rounds accessible but board list not shown

**State Transition:**
- After player selects board, gameState changes:
  - `waiting-for-player` → `waiting-for-opponent-to-start` (or `waiting-for-opponent-to-continue`)
- This automatically:
  - Hides board selection UI
  - Shows waiting message
  - Opens share-challenge modal (for human opponents)

**Navigation:**
- Back to Home returns to board-management (saves progress)

**Implementation Notes:**
- `ActiveGameView` component handles both board selection and waiting states
- Board selection UI (`SavedBoards`) only rendered when `gameState === 'waiting-for-player'`
- When `gameState !== 'waiting-for-player'`:
  - Board selection UI is completely hidden
  - Only header and status message shown
  - "Re-send Link" button visible (for human opponents)
- "Re-send Link" button shown when: `!isCpuOpponent && !(currentRound === 1 && gameState === 'waiting-for-player')`
  - Hidden ONLY when selecting round 1 board (no challenge URL exists yet)
  - Shown in all other cases for human opponents (round 1 waiting, round 2+ selecting/waiting)
  - Opens share-challenge modal when clicked
- `isCpuOpponent = (opponent.type === 'cpu' || opponent.type === 'remote-cpu')`
- When `gameState === 'waiting-for-opponent-to-start'`:
  - Human opponents: auto-open share modal
  - CPU opponents: skip share modal (handled by `useEffect` dependency on `isCpuOpponent`)

---

### 14. `share-challenge` (round: number)
**Screen/Modal:** Share challenge modal overlay

**Conditions:**
- **ONLY shown if opponent.type === 'human'**
- **CPU opponents skip this phase** - game proceeds directly to round-results

**Info Displayed:**

**When opponent has NO Discord:**
- "Share Your Challenge" title
- "Send this challenge to {opponent.name}"
- "Round {round} of 5"
- Challenge URL (copyable text input)
- Instructions text

**When opponent HAS Discord:**
- "Turn Complete!" title
- "🔔 Discord notification sent to {opponent.name}"
- **Notification timestamp** (if available): "at Wed, 15 Jan 2025 13:45:23 GMT"
- **UTC help link** (?): Links to https://dateful.com/convert/utc
- "Round {round} of 5"
- "Want to share the link manually?" section
- Challenge URL (copyable text input)
- Instructions for manual sharing

**Buttons:**

**When opponent has NO Discord:**
- ✅ "Copy Link" - copies URL to clipboard
- ✅ "Share" (mobile only) - opens native share sheet
- ✅ "Back to Home" (returns to home/board-management screen)

**When opponent HAS Discord:**
- ✅ "Copy Link" - copies URL to clipboard
- ✅ "Share" (mobile only) - opens native share sheet
- ⚠️ "Connect to Discord" hint (only if user doesn't have Discord)
- ✅ "Back to Home" (returns to home/board-management screen)

**Modal Behavior:**
- Overlay on top of game view
- Can be dismissed
- On close, transition to waiting-for-opponent phase
- When Discord notification sent, timestamp is captured and stored in `state.lastDiscordNotificationTime`
- Timestamp displayed in UTC format with help link to timezone converter

**Navigation:**
- Back to Home → home/board-management screen
- Modal close (X button) → waiting-for-opponent phase (stays on active game view)

**Implementation Notes:**
- `ShareChallenge` component rendered as fixed overlay in `ActiveGameView`
- Modal display controlled by `showShareModal` state
- `lastDiscordNotificationTime` prop passed from game state (ISO timestamp string)
- When opponent has Discord, shows notification status + manual sharing option (doesn't send duplicate notification)
- UTC timestamp formatted using `.toUTCString()` for consistent display
- Help link (?) is styled as small blue circular button, opens in new tab
- `useEffect` auto-opens modal when `gameState === 'waiting-for-opponent-to-start' && !isCpuOpponent`
- Two callbacks:
  - `onCancel`: Closes modal, stays on active game view (waiting-for-opponent state)
  - `onGoHome`: Goes to home/board-management screen
- "Back to Home" button uses `onGoHome` if provided, otherwise falls back to `onCancel`
- CPU opponents (`type === 'cpu' || type === 'remote-cpu'`) completely bypass this phase

---

### 15. `waiting-for-opponent` (round: number)
**Screen:** Waiting state view

**Info Displayed:**
- Header: "Round {round} of 5"
- Current score: "Ted 2 - Ryan 2"
- "Waiting for {opponent.name} to complete Round {round}"
- Selected board thumbnail (small preview)
- "Previous Rounds (X)" button if roundHistory.length > 0

**Buttons:**
- ✅ "Show Previous Rounds" (if rounds exist)
- ✅ "Re-send Link" (if human opponent)
- ✅ "Back to Home"
- ❌ Board selection UI (HIDDEN - already selected)

**Navigation:**
- Back to Home returns to board-management (game progress saved)
- Can view previous rounds without losing state

---

### 16. `round-review` (round: number)
**Screen:** Previous round review before selecting next board

**Info Displayed:**
- "Round {round} of 5"
- Current score after previous round
- Previous rounds history (clickable list)
- "Select a Board for Round {round}" section below
- **Discord connection section** (ONLY for human opponents):
  - Opponent's Discord connection status (if connected)
  - "Connect to Discord" button (if user not connected)
  - User's connection status (if connected)

**Buttons:**
- ✅ "View Round X" (per previous round)
- ✅ Board selection UI (for current round)
- ⚠️ "Connect to Discord" (ONLY if opponent.type === 'human' && !userHasDiscord)
- ✅ "Back to Home"

**Navigation:**
- After selecting board for current round → share-challenge or round-results (depending on opponent type)

**Implementation Notes:**
- `AllRoundsResults` component with `isReview={true}`
- Discord section hidden when `isCpuOpponent={true}`
- Discord section only shown when `isReview && !isCpuOpponent && (opponentHasDiscord || onConnectDiscord)`

---

### 17. `round-results` (round: number, result: RoundResult)
**Screen:** Single round result display

**Info Displayed:**
- Round winner announcement
- Combined board replay
- Score update
- Round explanations
- Creature graphics

**Buttons:**
- ✅ "▶ Step" (during replay)
- ✅ "↻ Restart" (after replay complete)
- ✅ "Continue to Next Round" (if more rounds remaining)
- ✅ "View Final Results" (if round 5/10 complete)

**Navigation:**
- Continue → next round (board-selection or round-review)
- Final Results → game-over or all-rounds-results

---

### 18. `all-rounds-results` (results: RoundResult[])
**Screen:** All rounds results grid (deck mode)

**Info Displayed:**
- Final score
- Overall winner
- Grid of all 10 rounds
- Clickable round cards with thumbnails
- View toggle: Boards / Creatures / Both

**Buttons:**
- ✅ "View Round X" (per round - opens modal)
- ✅ "Toggle View" (Boards/Creatures/Both)
- ✅ "Play Again"
- ✅ "Back to Home"

**Modal (when round clicked):**
- Shows full round-results for that round
- ✅ "Close" button to return to grid

**Navigation:**
- Play Again → new game setup
- Back to Home → board-management

---

### 19. `game-over` (winner: 'player' | 'opponent' | 'tie')
**Screen:** Game over screen (round-by-round mode)

**Info Displayed:**
- Winner announcement
- Final scores
- Game summary
- All 5 rounds results (similar to all-rounds-results but for 5 rounds)

**Buttons:**
- ✅ "View Round X" (per round)
- ✅ "Play Again" (rematch with same opponent)
- ✅ "Share Results" (if human opponent)
- ✅ "Back to Home"

**Navigation:**
- Play Again → game-mode-selection with same opponent
- Back to Home → board-management

---

### 20. `share-final-results`
**Screen/Modal:** Share final results modal

**Info Displayed:**
- Final score
- Winner announcement
- Share URL
- Results summary

**Buttons:**
- ✅ "Copy Link"
- ✅ "Send Discord Notification" (if opponent has Discord)
- ✅ "Done" (close modal)

**Navigation:**
- Done → game-over phase

---

## Phase State Properties & Derived Values

### Current State Structure

```typescript
type GameState = {
  // Phase tracking
  phase: GamePhase;
  currentRound: number; // 1-5 (round-by-round) or 1-10 (deck mode)

  // User & opponent
  user: UserProfile;
  opponent: Opponent | null;

  // Game progress
  gameId: string | null; // Generated when game starts (human opponents)
  gameMode: 'round-by-round' | 'deck' | null;
  gameCreatorId: string | null; // User ID of whoever sent round 1 challenge
  boardSize: number | null; // Selected board size (2-100)

  // Current round board selections
  playerSelectedBoard: Board | null;
  opponentSelectedBoard: Board | null;

  // Scoring (❌ REDUNDANT - should be derived from roundHistory)
  playerScore: number;
  opponentScore: number;

  // History
  roundHistory: RoundResult[];

  // UI state
  isSimulatingRound: boolean;
};
```

### Phase Discriminated Union

```typescript
type GamePhase =
  | { type: 'user-setup' }
  | { type: 'tutorial-intro' }
  | { type: 'tutorial-board-creation' }
  | { type: 'tutorial-results' }
  | { type: 'tutorial-name-entry' }
  | { type: 'cpu-tougher-intro' }
  | { type: 'home' }
  | { type: 'add-opponent' }
  | { type: 'game-mode-selection' }
  | { type: 'board-size-selection' }
  | { type: 'deck-management' }
  | { type: 'deck-selection' }
  | { type: 'board-selection'; round: number } // ❌ round duplicates state.currentRound
  | { type: 'share-challenge'; round: number } // ❌ round duplicates state.currentRound
  | { type: 'waiting-for-opponent'; round: number } // ❌ round duplicates state.currentRound
  | { type: 'round-review'; round: number } // ❌ round duplicates state.currentRound
  | { type: 'round-results'; round: number } // ❌ round duplicates state.currentRound
  | { type: 'all-rounds-results' }
  | { type: 'game-over' };
```

### Derived Values (Computed Props)

These values should be **computed** from the state, not stored:

```typescript
// ✅ Derive from roundHistory
const playerScore = roundHistory.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
const opponentScore = roundHistory.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0);

// ✅ Derive game state for ActiveGameView
const gameState: 'waiting-for-player' | 'waiting-for-opponent-to-start' | 'waiting-for-opponent-to-continue' =
  playerSelectedBoard
    ? (phase.type === 'share-challenge'
        ? 'waiting-for-opponent-to-start'
        : 'waiting-for-opponent-to-continue')
    : 'waiting-for-player';

// ✅ Derive opponent type checks
const isCpuOpponent = opponent?.type === 'cpu' || opponent?.type === 'remote-cpu';
const isHumanOpponent = opponent?.type === 'human';

// ✅ Derive game progress
const completedRounds = roundHistory.length;
const totalRounds = gameMode === 'deck' ? 10 : 5;
const isGameComplete = completedRounds >= totalRounds;

// ✅ Derive "your turn" status
const isPlayerTurn = !playerSelectedBoard && currentRound <= totalRounds;
const isWaitingForOpponent = playerSelectedBoard && !opponentSelectedBoard;

// ✅ Derive incomplete round display
const hasIncompleteRound = playerSelectedBoard && !opponentSelectedBoard;
const shouldShowIncompleteRound = hasIncompleteRound && !isCpuOpponent;
```

### Round History Structure

```typescript
type RoundResult = {
  round: number;
  winner: 'player' | 'opponent' | 'tie';
  playerBoard: Board;
  opponentBoard: Board;
  playerFinalPosition: Position;
  opponentFinalPosition: Position;
  playerPoints: number; // Points earned this round
  opponentPoints: number; // Points earned this round
  playerOutcome: 'won' | 'lost' | 'tie';
  playerVisualOutcome: 'goal' | 'trapped' | 'stuck' | 'forward';
  opponentVisualOutcome: 'goal' | 'trapped' | 'stuck' | 'forward';
  collision: boolean;
  playerCreature?: CreatureId;
  opponentCreature?: CreatureId;
  simulationDetails: {
    playerMoves: number;
    opponentMoves: number;
    playerHitTrap: boolean;
    opponentHitTrap: boolean;
    playerLastStep: number; // Last sequence step executed
    opponentLastStep: number;
    playerTrapPosition?: Position; // Where player hit trap
    opponentTrapPosition?: Position;
  };
};
```

---

## Incomplete Round Display (Current Round in History)

### When to Show

**Condition:** `playerSelectedBoard && !opponentSelectedBoard && !isCpuOpponent`

This means:
- Player has selected their board
- Opponent hasn't selected yet (or we haven't received their selection)
- Opponent is human (CPU games auto-complete immediately)

### Where to Show

**Location:** In the "Previous Rounds" section of `SavedBoards` component

The section title changes based on content:
- **No completed rounds + incomplete round:** "Current Round"
- **Has completed rounds + incomplete round:** "Round History (X complete)"
- **Only completed rounds:** "Previous Rounds (X)"

### What to Display

```
┌─────────────────────────────────────┐
│ Round 2                In Progress... │ ← Gray header
├─────────────────────────────────────┤
│ [Player Board Thumbnail]  [   ?   ] │ ← Player's board + ? placeholder
│      Ryan                    Ted    │
├─────────────────────────────────────┤
│            - - -                    │ ← No points yet
└─────────────────────────────────────┘
```

**Styling:**
- Gray border (`#cbd5e1`)
- Light background (`#f8fafc`)
- Reduced opacity (0.7)
- Non-clickable (cursor: default)
- No hover effect
- "?" displayed as 2rem font on gray background (#475569)

### Auto-Expansion

When the incomplete round card appears and there are no completed rounds yet, the "Previous Rounds" section auto-expands using `useEffect`:

```typescript
useEffect(() => {
  if (hasIncompleteRound && roundHistory.length === 0 && !showRoundHistory) {
    setShowRoundHistory(true);
  }
}, [hasIncompleteRound, roundHistory.length, showRoundHistory]);
```

### Implementation Files

- **SavedBoards.tsx:418** - Conditional render for round history section
- **SavedBoards.tsx:506-548** - Incomplete round card JSX
- **SavedBoards.module.css:600-609** - `.historyCardIncomplete` styles
- **ActiveGameView.tsx:191-192** - Props passed to SavedBoards
- **App.tsx:2512-2513** - Props passed from game state

---

## Active Game View State Machine

### GameState Determination (App.tsx:2437-2455)

```typescript
let gameState: 'waiting-for-player' | 'waiting-for-opponent-to-start' | 'waiting-for-opponent-to-continue';

if (state.phase.type === 'board-selection') {
  if (state.playerSelectedBoard) {
    // Player already selected, now waiting for opponent
    gameState = 'waiting-for-opponent-to-continue';
  } else {
    // Player still needs to select a board
    gameState = 'waiting-for-player';
  }
} else if (state.phase.type === 'share-challenge') {
  // Just selected board, waiting for opponent to start
  gameState = 'waiting-for-opponent-to-start';
} else {
  // waiting-for-opponent phase
  gameState = 'waiting-for-opponent-to-continue';
}
```

### UI State Based on GameState

**`waiting-for-player`:**
- ✅ Show board selection UI (SavedBoards with board grid)
- ✅ Show "Select a Board for Round X" header
- ✅ Show previous rounds (if any)
- ✅ Show incomplete round (if player selected previously, but this shouldn't happen in waiting-for-player)
- ❌ Hide "Re-send Link" button for round 1 only

**`waiting-for-opponent-to-start`:**
- ❌ Hide board selection UI
- ✅ Show "Waiting for {opponent.name} to complete Round X"
- ✅ Show previous rounds section (history + incomplete round)
- ✅ Show "Re-send Link" button
- ✅ Auto-open share-challenge modal (for human opponents)

**`waiting-for-opponent-to-continue`:**
- ❌ Hide board selection UI
- ✅ Show "Waiting for {opponent.name} to complete Round X"
- ✅ Show previous rounds section (history + incomplete round)
- ✅ Show "Re-send Link" button
- ❌ Don't auto-open share modal

### Component Hierarchy

```
App.tsx
  └─ ActiveGameView (when phase = board-selection | share-challenge | waiting-for-opponent)
       ├─ Header (round info, score, board size, matchup)
       ├─ Status Message ("Select..." or "Waiting...")
       ├─ SavedBoards (conditionally rendered based on showBoardSelection prop)
       │    ├─ Board Selection Header (only if showBoardSelection)
       │    ├─ Round History Section (if roundHistory.length > 0 OR hasIncompleteRound)
       │    │    ├─ Completed Round Cards (clickable)
       │    │    └─ Incomplete Round Card (non-clickable, shown if hasIncompleteRound)
       │    └─ Board Selection UI (only if showBoardSelection)
       │         ├─ Create New Board button
       │         ├─ Size Filter
       │         └─ Board Grid
       └─ ShareChallenge Modal (overlay, controlled by showShareModal state)
            ├─ Challenge URL
            ├─ Copy Link button
            ├─ Discord notification button (if opponent has Discord)
            └─ Back to Home button
```

---

## Recent Changes (2025-01-14)

### 1. Incomplete Round Display Feature

**Problem:** When player selects a board and is waiting for opponent, there's no visual indication of the current round status in the round history.

**Solution:** Added incomplete round card display in `SavedBoards` component that shows:
- Player's selected board thumbnail
- "?" placeholder for opponent's board
- "In Progress..." status
- Auto-expands when it's the only round

**Files Changed:**
- `SavedBoards.tsx` - Added incomplete round card logic and rendering
- `SavedBoards.module.css` - Added `.historyCardIncomplete` styles
- `ActiveGameView.tsx` - Added `playerSelectedBoard` and `opponentSelectedBoard` props
- `App.tsx` - Passed board selection state to ActiveGameView

### 2. Board Selection UI Visibility Fix

**Problem:** After selecting a board, the board selection UI was still visible instead of showing the waiting state.

**Solution:** Added `showBoardSelection` prop to SavedBoards that's controlled by gameState:
- `showBoardSelection={gameState === 'waiting-for-player'}`
- When false, hides board selection header and board grid
- Round history remains visible

**Files Changed:**
- `ActiveGameView.tsx:180` - Removed conditional wrapper, added `showBoardSelection` prop
- `SavedBoards.tsx:58, 150, 400, 609-670` - Added prop and conditional rendering

### 3. Round History Visibility When Waiting

**Problem:** Round history panel wasn't showing when resuming a game in waiting-for-opponent state.

**Solution:** Changed round history section condition from:
- `roundHistory.length > 0`
- To: `roundHistory.length > 0 || (playerSelectedBoard && !opponentSelectedBoard)`

Now shows round history section even with 0 completed rounds if there's an incomplete round.

**Files Changed:**
- `SavedBoards.tsx:418` - Updated conditional for round history section

### 4. Discord Notification Score Bug

**Problem:** Discord notifications showed incorrect scores (e.g., "2-0" instead of "2-1")

**Root Cause:** Only adding points to the score if that player won the round:
```typescript
// ❌ WRONG
playerScore: state.opponentScore + (result.winner === 'opponent' ? points : 0)
```

**Solution:** Always add both players' points regardless of winner:
```typescript
// ✅ CORRECT
playerScore: state.opponentScore + (result.opponentPoints ?? 0)
opponentScore: state.playerScore + (result.playerPoints ?? 0)
```

**Files Changed:**
- `App.tsx:1597-1598` - Fixed score calculation in Discord notification

### 5. Re-send Link Button Logic

**Problem:** Button was showing at wrong times (e.g., when selecting round 1 board before challenge URL exists)

**Solution:** Updated visibility condition:
```typescript
!isCpuOpponent && !(currentRound === 1 && gameState === 'waiting-for-player')
```

Shows for human opponents in all cases EXCEPT when selecting round 1 board.

**Files Changed:**
- `ActiveGameView.tsx:147` - Updated conditional logic

---

## Critical Behaviors to Preserve During Migration

### User Flows That Must Work

#### Flow 1: First-Time User (Tutorial)
```
user-setup → tutorial-intro → tutorial-board-creation → tutorial-results →
tutorial-name-entry → cpu-tougher-intro → home
```
**Critical checks:**
- [ ] User name saved to localStorage
- [ ] Tutorial board saved to user's boards
- [ ] CPU Sam appears in opponents list
- [ ] Home screen shows opponent panel and board panel

#### Flow 2: Returning User (Skip Tutorial)
```
(load from localStorage) → home
```
**Critical checks:**
- [ ] User profile loaded correctly
- [ ] Saved boards loaded
- [ ] Opponents list loaded
- [ ] Active games loaded (if any)

#### Flow 3: Start Game vs CPU (Round by Round)
```
home → (click Play on CPU opponent) → game-mode-selection →
board-size-selection → board-selection (round 1) → round-results →
board-selection (round 2) → ... → game-over
```
**Critical checks:**
- [ ] CPU opponent selected correctly
- [ ] Board size persisted through game
- [ ] Boards filtered by selected size
- [ ] CPU auto-selects board (no share-challenge phase)
- [ ] Scores increment correctly each round
- [ ] Round history accumulates correctly
- [ ] Game ends after 5 rounds
- [ ] Winner determined correctly
- [ ] Stats updated (CPU opponent wins/losses)

#### Flow 4: Start Game vs Human (Round by Round, Player 1)
```
home → (click Play on human opponent) → game-mode-selection →
board-size-selection → board-selection (round 1) → share-challenge →
waiting-for-opponent → (opponent responds) → round-results →
board-selection (round 2) → share-challenge → ...
```
**Critical checks:**
- [ ] Challenge URL generated correctly
- [ ] gameId created and persisted
- [ ] Challenge URL includes all necessary state
- [ ] Share modal shows for human opponents only
- [ ] Can copy challenge URL
- [ ] Can re-send link
- [ ] Discord notification sent (if opponent has Discord)
- [ ] "Waiting for opponent" state persists across page refresh
- [ ] Active game appears in Active Games panel
- [ ] Can resume from Active Games
- [ ] Round history shows incomplete round when waiting

#### Flow 5: Join Game via URL (Player 2)
```
(click challenge URL) → user-setup (if new user) or home (if existing) →
challenge-received modal → (accept challenge) → board-selection (round 1) →
share-challenge → waiting-for-opponent → (player 1 responds) → round-results → ...
```
**Critical checks:**
- [ ] URL hash parsed correctly
- [ ] Game state reconstructed from URL
- [ ] Opponent info loaded from URL
- [ ] Board size enforced
- [ ] Player 2 can select their board
- [ ] Player 2's challenge URL sent back to Player 1
- [ ] gameId preserved across both players
- [ ] Round results visible to both players
- [ ] Scores stay in sync

#### Flow 6: Resume Game from Active Games Panel
```
home → (click Resume on active game) → board-selection or waiting-for-opponent
(depending on player's turn)
```
**Critical checks:**
- [ ] Game state loaded from localStorage
- [ ] Current round correct
- [ ] Scores correct
- [ ] Round history loaded
- [ ] Opponent info loaded
- [ ] If player selected board: show waiting state, NOT board selection UI
- [ ] If player hasn't selected: show board selection UI
- [ ] Previous rounds accessible
- [ ] Incomplete round shown (if waiting for opponent)

#### Flow 7: Back to Home and Resume
```
(during active game) → Back to Home → home → (click Resume) →
returns to exact same state
```
**Critical checks:**
- [ ] Game progress saved when going home
- [ ] Active game appears in Active Games panel
- [ ] Resume loads exact same state (round, scores, selections)
- [ ] No data loss

#### Flow 8: Review Previous Rounds During Game
```
board-selection → (click "Show Previous Rounds") → (click round card) →
round-results modal → (close modal) → back to board-selection
```
**Critical checks:**
- [ ] Previous rounds accessible from board selection
- [ ] Round results modal shows correct data
- [ ] Can view any completed round
- [ ] Closing modal returns to board selection
- [ ] No state lost when reviewing rounds
- [ ] Incomplete round visible (if player waiting for opponent)

---

## State Validation Checklist

### Before Migration
Document the current behavior by running these tests:

#### Test 1: Score Calculation
```typescript
// Start a 5-round game, complete all rounds
// Verify: playerScore === sum of all roundHistory[].playerPoints
// Verify: opponentScore === sum of all roundHistory[].opponentPoints
```
**Expected:** Scores match sum of round points exactly

#### Test 2: Round History Persistence
```typescript
// Complete 3 rounds, refresh page
// Verify: roundHistory.length === 3
// Verify: All round data intact (boards, scores, simulation details)
```
**Expected:** Round history survives page refresh

#### Test 3: Active Game Resume
```typescript
// Start game, select round 2 board, go home, resume
// Verify: currentRound === 2
// Verify: playerSelectedBoard !== null
// Verify: UI shows waiting state, NOT board selection
```
**Expected:** Resume shows exact state when left

#### Test 4: Incomplete Round Display
```typescript
// Select board for round 2, before opponent selects
// Verify: Round history shows incomplete round card
// Verify: Player's board thumbnail visible
// Verify: "?" shown for opponent
// Verify: "In Progress..." status
```
**Expected:** Incomplete round visible in history

#### Test 5: Challenge URL Roundtrip
```typescript
// Player 1: Select board, generate URL
// Player 2: Load URL in new browser
// Verify: Player 2 sees opponent name
// Verify: Player 2 can select board
// Verify: Board size enforced
// Verify: gameId matches
```
**Expected:** State fully reconstructed from URL

#### Test 6: Discord Notification Scores
```typescript
// Complete round 1 where player scores 2, opponent scores 1
// Verify: Discord notification shows "2-1"
// Verify: Browser shows "2-1"
```
**Expected:** Scores match in notification and browser

#### Test 7: CPU Game (No Share Phase)
```typescript
// Start game vs CPU, select board
// Verify: share-challenge phase skipped
// Verify: Immediately goes to round-results
// Verify: No "Waiting for opponent" state
```
**Expected:** CPU games proceed immediately

#### Test 8: Re-send Link Visibility
```typescript
// Round 1, before selecting board: ❌ Hidden
// Round 1, after selecting board: ✅ Visible
// Round 2+, any state: ✅ Visible
```
**Expected:** Button shows correctly based on round/state

---

## State Transition Matrix

### Valid Transitions

| From Phase | To Phase | Trigger | State Changes |
|------------|----------|---------|---------------|
| `home` | `game-mode-selection` | Click Play on opponent | Set `opponent` |
| `game-mode-selection` | `board-size-selection` | Select game mode | Set `gameMode` |
| `board-size-selection` | `board-selection` | Select board size | Set `boardSize`, `currentRound=1`, create `gameId` |
| `board-selection` | `share-challenge` | Player selects board (human opponent) | Set `playerSelectedBoard` |
| `board-selection` | `round-results` | Player selects board (CPU opponent) | Set `playerSelectedBoard`, `opponentSelectedBoard`, simulate round |
| `share-challenge` | `waiting-for-opponent` | Close share modal | No state change |
| `waiting-for-opponent` | `round-results` | Opponent selects board | Set `opponentSelectedBoard`, simulate round |
| `round-results` | `board-selection` | Click "Continue" (more rounds) | Increment `currentRound`, clear board selections, add round to history |
| `round-results` | `game-over` | Click "View Results" (last round) | Add round to history |
| `board-selection` | `home` | Click "Back to Home" | Save active game to localStorage |
| `waiting-for-opponent` | `home` | Click "Back to Home" | Save active game to localStorage |
| `home` | `board-selection` | Click "Resume" on active game | Load game state from localStorage |

### Invalid Transitions (Should Never Happen)

| From Phase | To Phase | Why Invalid |
|------------|----------|-------------|
| `board-selection` (after player selected) | `board-selection` (show board UI) | Should show waiting state instead |
| `share-challenge` (CPU opponent) | ANY | CPU opponents skip share phase entirely |
| `waiting-for-opponent` | `board-selection` | Can't go back to selection after selecting |
| `round-results` | `board-selection` (same round) | Must advance to next round |

---

## Data Integrity Rules

### Rule 1: Scores Match Round History
```typescript
// ALWAYS TRUE after each round
playerScore === roundHistory.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0)
opponentScore === roundHistory.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0)
```
**If violated:** Scores out of sync, likely missing round or incorrect calculation

### Rule 2: Round Number Consistency
```typescript
// ALWAYS TRUE
currentRound === roundHistory.length + 1
// OR
currentRound <= totalRounds
```
**If violated:** Round tracking broken, may skip or duplicate rounds

### Rule 3: Board Selection Mutual Exclusion
```typescript
// NEVER TRUE SIMULTANEOUSLY
(phase.type === 'board-selection' && gameState === 'waiting-for-player') &&
(playerSelectedBoard !== null)
```
**If violated:** Shows board selection UI when player already selected

### Rule 4: Game ID Consistency
```typescript
// For human opponents, ALWAYS TRUE after round 1 challenge sent
gameId !== null && gameId === opponent.gameId
```
**If violated:** Players in different games, state won't sync

### Rule 5: Round History Order
```typescript
// ALWAYS TRUE
roundHistory.every((r, i) => r.round === i + 1)
```
**If violated:** Rounds missing or duplicated

### Rule 6: Active Game Completeness
```typescript
// For games in Active Games panel, ALWAYS TRUE
activeGame.currentRound <= activeGame.totalRounds &&
activeGame.roundHistory.length < activeGame.totalRounds
```
**If violated:** Completed game shown as active

---

## localStorage Schema

### Keys Used
```typescript
'spaces-game-user'           // UserProfile
'spaces-game-boards'         // Board[]
'spaces-game-opponents'      // Opponent[]
'spaces-game-active-games'   // ActiveGameInfo[]
'spaces-game-state'          // GameState (current game)
'spaces-game-cpu-boards'     // Board[] (for CPU opponent)
'spaces-game-remote-cpu-boards' // Board[] (for remote CPU)
```

### UserProfile Structure
```typescript
{
  id: string;              // UUID
  name: string;            // Display name
  createdAt: number;       // Timestamp
  preferences?: {
    showCompleteRoundResults?: boolean;
    explanationStyle?: 'lively' | 'technical';
  };
  discordId?: string;      // Discord user ID
  discordUsername?: string;
  discordAvatar?: string;  // Discord avatar hash
  creature?: CreatureId;   // Selected creature
}
```

### Board Structure
```typescript
{
  id: string;              // UUID
  name: string;
  boardSize: number;       // 2-100
  grid: CellContent[][];   // 2D array
  sequence: Move[];        // Move order
  createdAt: number;
  updatedAt?: number;
}
```

### Opponent Structure
```typescript
{
  id: string;              // UUID
  name: string;
  type: 'human' | 'cpu' | 'remote-cpu';
  wins: number;
  losses: number;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  creature?: CreatureId;
  createdAt: number;
}
```

### ActiveGameInfo Structure
```typescript
{
  gameId: string;          // Unique game ID
  opponentId: string;      // Opponent UUID
  opponentName: string;
  currentRound: number;
  totalRounds: number;
  playerScore: number;
  opponentScore: number;
  boardSize: number;
  gameMode: 'round-by-round' | 'deck';
  playerSelectedBoard?: Board;
  opponentSelectedBoard?: Board;
  roundHistory: RoundResult[];
  timestamp: number;       // Last updated
}
```

---

## Migration Safety Checklist

### Before Starting Migration

- [ ] Run all test flows above and document results
- [ ] Take screenshots of each phase
- [ ] Export localStorage data as backup
- [ ] Document any quirks or edge cases discovered
- [ ] Create test save files for different game states

### During Migration

- [ ] Test each phase after converting to derived state
- [ ] Verify localStorage still loads correctly
- [ ] Check that all transitions still work
- [ ] Verify scores still calculate correctly
- [ ] Test URL hash parsing/generation
- [ ] Ensure active games panel still works

### After Migration

- [ ] Re-run all test flows
- [ ] Compare behavior to "before" documentation
- [ ] Verify no data loss on page refresh
- [ ] Test backward compatibility with old localStorage data
- [ ] Ensure Discord notifications still work

---

## State Bugs to Fix

Based on the phases above, here are the known bugs:

### Bug 1: `board-selection` with `playerSelectedBoard` set
**Issue:** Player 1 clicks "Back to Home" from share-challenge modal, returns to board-selection with board already selected, sees board selection UI again.

**Expected:** Should show waiting-for-opponent state, not board selection UI.

**Fix:** Derive phase from state - if playerSelectedBoard exists and opponentSelectedBoard is null, show waiting state regardless of phase.

---

### Bug 2: Round 1 missing from player 2's history
**Issue:** Player 2 (Ted) doesn't see round 1 in the "Previous Rounds" list.

**Expected:** All completed rounds should appear in history for both players.

**Fix:** Investigate round result saving/loading for player 2.

---

### Bug 3: Resume from `board-selection` shows board selection UI even after selection
**Issue:** Player selects board, goes home, resumes - sees board selection UI again even though they already selected.

**Expected:** Should show waiting-for-opponent state.

**Fix:** Already fixed in current branch by checking playerSelectedBoard in gameState determination.

---

## Visual Element Conditions Reference

Quick reference for what controls each UI element's visibility:

### State Properties Used

```typescript
// From GameState
currentRound: number;           // Which round (1-5 or 1-10)
roundHistory: RoundResult[];    // Completed rounds
playerSelectedBoard: Board | null;    // Player's selection for current round
opponentSelectedBoard: Board | null;  // Opponent's selection for current round
opponent: Opponent | null;      // Opponent info
phase: GamePhase;               // Current phase

// Derived values
isCpuOpponent = opponent?.type === 'cpu' || opponent?.type === 'remote-cpu';
hasIncompleteRound = playerSelectedBoard !== null && opponentSelectedBoard === null && !isCpuOpponent;
isPlayerTurn = playerSelectedBoard === null;
```

### UI Element Conditions Matrix

| Element | Show When | Hide When | Implementation |
|---------|-----------|-----------|----------------|
| **Header (round/score/size)** | Always in ActiveGameView | Never | `ActiveGameView.tsx:134-157` |
| **Re-send Link button** | `!isCpuOpponent && !(currentRound === 1 && gameState === 'waiting-for-player')` | CPU opponent OR (round 1 AND selecting) | `ActiveGameView.tsx:147` |
| **Status message** | Always in ActiveGameView | Never | `ActiveGameView.tsx:166-167` |
| **Board selection header** | `showBoardSelection` | `!showBoardSelection` | `SavedBoards.tsx:400` |
| **Board selection UI** | `showBoardSelection` (gameState === 'waiting-for-player') | Player already selected | `ActiveGameView.tsx:171` |
| **Round history section** | `roundHistory.length > 0 OR hasIncompleteRound` | No rounds AND no incomplete | `SavedBoards.tsx:418` |
| **Round history toggle** | Round history section visible | Round history section hidden | `SavedBoards.tsx:428` |
| **Completed round cards** | `roundHistory.length > 0` | No completed rounds | `SavedBoards.tsx:449-503` |
| **Incomplete round card** | `hasIncompleteRound` | No incomplete round OR CPU opponent | `SavedBoards.tsx:506-548` |
| **Share modal** | `showShareModal && !isCpuOpponent` | CPU opponent OR modal closed | `ActiveGameView.tsx:198` |
| **Share modal auto-open** | `gameState === 'waiting-for-opponent-to-start' && !isCpuOpponent` | Any other state OR CPU | `ActiveGameView.tsx:102-105` |
| **"Create New Board" button** | `showBoardSelection` | Not selecting board | `SavedBoards.tsx:621` |
| **Size filter** | `showBoardSelection` | Not selecting board | `SavedBoards.tsx:632` |
| **Board grid** | `showBoardSelection` | Not selecting board | `SavedBoards.tsx:655` |

### Cascading Display Logic

Some elements control the visibility of child elements:

```
ActiveGameView
  ├─ Always: Header, Status Message
  ├─ If gameState === 'waiting-for-player': Board Selection UI
  │   ├─ Board selection header
  │   ├─ Create New Board button
  │   ├─ Size filter
  │   └─ Board grid
  └─ If roundHistory OR hasIncompleteRound: Round History Section
      ├─ If showRoundHistory: (content visible)
      │   ├─ Current score
      │   ├─ Completed round cards (if roundHistory.length > 0)
      │   └─ Incomplete round card (if hasIncompleteRound)
      └─ Else: (content collapsed)
```

### Critical Boolean Flags

```typescript
// These booleans determine major UI changes
showBoardSelection: boolean = (gameState === 'waiting-for-player')
  // Controls entire board selection UI visibility

showShareModal: boolean = (manually controlled state)
  // Auto-set true when: gameState === 'waiting-for-opponent-to-start' && !isCpuOpponent
  // Controls ShareChallenge modal overlay

showRoundHistory: boolean = (manually controlled state)
  // Auto-set true when: hasIncompleteRound && roundHistory.length === 0
  // Controls expansion of round history section

hasIncompleteRound: boolean = (playerSelectedBoard && !opponentSelectedBoard && !isCpuOpponent)
  // Determines if incomplete round card should exist

isCpuOpponent: boolean = (opponent.type === 'cpu' || opponent.type === 'remote-cpu')
  // CPU games skip share modal, have no incomplete rounds
```

### State-to-UI Decision Tree

```
Is player in active game? (phases 13-15)
├─ YES → Render ActiveGameView
│   │
│   ├─ Has player selected board?
│   │   ├─ NO → gameState = 'waiting-for-player'
│   │   │   └─ Show: Header (no re-send if round 1), Status, Board Selection UI, Round History (if rounds exist)
│   │   │
│   │   └─ YES → gameState = 'waiting-for-opponent-to-start' OR 'waiting-for-opponent-to-continue'
│   │       ├─ Is opponent human?
│   │       │   ├─ YES → Show: Header (with re-send), Status, Round History (with incomplete), Auto-open Share Modal
│   │       │   └─ NO → Proceed immediately to round-results (no waiting state)
│   │       │
│   │       └─ Show: Header, Status ("Waiting..."), Round History (with incomplete), No Board Selection UI
│   │
│   └─ Are there completed rounds OR incomplete round?
│       ├─ YES → Show Round History Section
│       └─ NO → Hide Round History Section
│
└─ NO → Render appropriate phase component
```

---

## Implementation Notes

When implementing derived state:
1. **Phase should be derived from game state properties**, not stored directly
2. **Key properties to check:**
   - `playerSelectedBoard` - has player selected?
   - `opponentSelectedBoard` - has opponent selected?
   - `currentRound` - which round are we on?
   - `roundHistory.length` - how many rounds completed?
   - `opponent.type` - human or CPU?

3. **Derive UI state from these properties:**
   ```typescript
   if (playerSelectedBoard && !opponentSelectedBoard) {
     // Show waiting state, NOT board selection
     return 'waiting-for-opponent';
   }
   ```

4. **Benefits:**
   - State and UI always in sync
   - No phase/state mismatch bugs
   - Easier to reason about what should be displayed
