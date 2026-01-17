- make sure coverage is kept high for any new code that is added
- make sure all new code has good test coverage
- do not push until I've verified locally
- never hardcode endpoints - always set up to be configurable in environment or config files
- always let me know if I need to restart the dev server or need to start with fresh local storage or just need to start with a fresh game
- at the end of your explanation - tell me if anything needs to be restarted or what I need to do in order to see the changes

## Game Rules - Turn Order

**Board selection order alternates each round:**
- **Round 1**: Game creator (Player 1) selects first → Player 2 responds
- **Round 2**: Player 2 selects first → Player 1 responds
- **Round 3**: Player 1 selects first → Player 2 responds
- **Round 4**: Player 2 selects first → Player 1 responds
- **Round 5**: Player 1 selects first → Player 2 responds

**Pattern**: Odd rounds (1, 3, 5) → game creator goes first. Even rounds (2, 4) → opponent goes first.

**Challenge URLs**: Only contain the sender's board for the current round (not future rounds).