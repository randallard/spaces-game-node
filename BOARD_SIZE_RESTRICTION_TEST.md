# Board Size Restriction Test Plan

## Feature
In round-by-round mode, all rounds (2-5) must use the same board size as Round 1.

## Test Scenarios

### Scenario 1: Round 1 uses 2×2 board
**Setup:**
1. Start a new round-by-round game
2. Select a 2×2 board for Round 1
3. Complete Round 1

**Expected Behavior:**
- Rounds 2-5 should only show 2×2 boards for selection
- 3×3, 4×4, and other size boards should not be available

### Scenario 2: Round 1 uses 3×3 board
**Setup:**
1. Start a new round-by-round game
2. Select a 3×3 board for Round 1
3. Complete Round 1

**Expected Behavior:**
- Rounds 2-5 should only show 3×3 boards for selection
- 2×2, 4×4, and other size boards should not be available

### Scenario 3: Multi-player game with opponent going first
**Setup:**
1. Receive a challenge from opponent who selected a 2×2 board for Round 1
2. Respond to challenge (select your 2×2 board for Round 1)
3. Start Round 2

**Expected Behavior:**
- Both players can only select 2×2 boards for all remaining rounds (2-5)

## Implementation Details

### Changes Made
1. **App.tsx (board-selection/share-challenge/waiting-for-opponent phases):**
   - Added `effectiveBoardSize` calculation that uses Round 1 board size for rounds 2-5
   - Falls back to `state.boardSize` for Round 1

2. **App.tsx (round-review phase):**
   - Added same `effectiveBoardSize` logic for consistency

3. **AllRoundsResults.tsx:**
   - Filter boards by `boardSize` prop before passing to SavedBoards component

### Code Logic
```typescript
// For rounds 2-5, use the board size from Round 1
const effectiveBoardSize = currentRound > 1 &&
                          state.roundHistory.length > 0 &&
                          state.roundHistory[0]?.playerBoard
  ? state.roundHistory[0].playerBoard.boardSize
  : state.boardSize;
```

## Manual Testing Steps

1. **Create boards of different sizes:**
   - Create at least 2 boards of size 2×2
   - Create at least 2 boards of size 3×3

2. **Start a round-by-round game:**
   - Go to Board Management → Opponents → Select opponent → Play
   - Choose "Round by Round" mode
   - Choose a board size (e.g., 2×2)
   - Select a 2×2 board for Round 1
   - Wait for CPU to play / share link with opponent

3. **Verify Round 2 restriction:**
   - After Round 1 completes, you should only see 2×2 boards
   - The board list should NOT include 3×3 boards
   - The size filter in SavedBoards should reflect only 2×2

4. **Verify through all 5 rounds:**
   - Complete rounds 2, 3, 4, and 5
   - Each round should consistently show only 2×2 boards

## Edge Cases

- **No Round 1 history:** Should fall back to `state.boardSize`
- **Round 1 incomplete:** Should use `state.boardSize` until Round 1 completes
- **Deck mode:** This restriction does NOT apply (deck mode locks size at deck creation)
