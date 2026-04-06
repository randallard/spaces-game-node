# Privacy & Data Sharing

## What we collect

When you play Spaces Game, some information about your games may be sent to our server. This is used exclusively for academic research into how artificial intelligence learns to play strategy games.

**We never collect:**
- Your name, email, or any account information
- Your IP address
- Cookies or browser fingerprints
- Any information that could identify you as a real person

**We may collect (depending on your choice):**
- The board layouts constructed during each round
- Round outcomes (who won, by how much, whether a trap was hit)
- An anonymous player ID — a random identifier generated on your device, stored only in your browser's local storage, with no connection to any personal identity

## How data is used

Collected game data is used to:
- Train and evaluate reinforcement learning (RL) AI models that learn to play Spaces Game
- Study how human players develop strategies over time
- Publish academic research findings (always in aggregate, never per-player)

No data is sold, shared with third parties, or used for advertising.

## Your choices

You control how much data is shared. You can change this at any time in your **Profile** settings.

### Full anonymous data
Board and outcome data is collected and linked by an anonymous player ID. This lets us study how individual players improve over time — purely by game patterns, never by identity. This is the most useful for research.

### Minimal data — AI research only
Board and outcome data is collected with no player ID. Each game is treated as independent. Useful for training models but cannot be used to study learning patterns across sessions.

### No data — offline only
Nothing is sent to our servers for research purposes. Your game data stays entirely on your device.

Note: regardless of your data sharing choice, **multiplayer still works**. The server coordinates turn-taking between friends via game links. With "No data" selected, the board data in those links is processed to run your game but is not stored in our research database.

## The anonymous player ID

Your player ID is a randomly generated UUID created the first time you play. It is:
- Stored in your browser's local storage only
- Never linked to your name, email, or any account
- Not sent to the server at all if you choose "Minimal" or "No data"
- Deleted if you clear your browser data or use the "Download Backup / Restore" feature to start fresh

If you play on multiple devices, your player IDs are different on each device with no way to connect them.

## Server backup (coming soon)

We are working on an optional server backup feature that will let you save your game history and boards to the cloud so you can restore them on a new device. This will be free initially. This feature is strictly opt-in and separate from research data collection.

## Contact

If you have questions about privacy or want to request deletion of data associated with your anonymous player ID, open an issue in the project repository.
