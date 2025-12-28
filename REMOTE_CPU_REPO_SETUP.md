# Remote CPU Repository Setup Guide

This document describes how to set up a GitHub Pages repository to host pre-generated boards for the Remote CPU opponent feature.

## Repository Structure

The repository should have the following structure:

```
your-repo-name/
├── boards/
│   ├── 2x2.json
│   ├── 3x3.json
│   ├── 4x4.json
│   ├── 5x5.json
│   ├── 6x6.json
│   ├── 7x7.json
│   ├── 8x8.json
│   ├── 9x9.json
│   └── 10x10.json
├── health.json
├── index.html (optional - for a landing page)
└── README.md
```

## File Formats

### Board JSON Files (`boards/NxN.json`)

Each board size file should contain an array of Board objects. Each Board object must have the following structure:

```json
[
  {
    "id": "unique-board-id-1",
    "name": "Remote Board 1",
    "boardSize": 2,
    "grid": [
      ["empty", "empty"],
      ["piece", "empty"]
    ],
    "sequence": [
      {
        "position": {"row": 1, "col": 0},
        "type": "piece",
        "order": 1
      }
    ],
    "thumbnail": "data:image/svg+xml;base64,...",
    "createdAt": 1640000000000
  },
  {
    "id": "unique-board-id-2",
    "name": "Remote Board 2",
    "boardSize": 2,
    "grid": [
      ["empty", "piece"],
      ["empty", "final"]
    ],
    "sequence": [
      {
        "position": {"row": 0, "col": 1},
        "type": "piece",
        "order": 1
      },
      {
        "position": {"row": 1, "col": 1},
        "type": "final",
        "order": 2
      }
    ],
    "thumbnail": "data:image/svg+xml;base64,...",
    "createdAt": 1640000001000
  }
]
```

#### Board Object Properties

- `id` (string): Unique identifier for the board (max 1000 chars)
- `name` (string): Display name for the board (max 1000 chars, e.g., "Remote Board 1")
- `boardSize` (number): Size of the board (must match filename and be 2-10)
- `grid` (CellContent[][]): 2D array representing the board state
  - Valid cell values: `"empty"`, `"piece"`, `"trap"`, `"final"`
  - Grid must be exactly boardSize × boardSize
- `sequence` (BoardMove[]): Array of moves that solve the board (max 500 moves)
  - Each move has:
    - `position` (object): `{row: number, col: number}` - coordinates on the board
    - `type` (string): `"piece"`, `"trap"`, or `"final"` - type of move
    - `order` (number): Positive integer indicating sequence order (1, 2, 3, ...)
- `thumbnail` (string): Base64-encoded SVG thumbnail of the board (max 100KB)
- `createdAt` (number): Timestamp when the board was created in milliseconds (must be valid)

### Health Check File (`health.json`)

Simple file to verify server connectivity:

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## GitHub Pages Setup

1. **Create a new repository** on GitHub (e.g., `spaces-game-cpu-boards`)

2. **Add your board files** to the `boards/` directory

3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select "Deploy from a branch"
   - Choose `main` branch and `/ (root)` folder
   - Click Save

4. **Update the game code** with your GitHub Pages URL:
   - Edit `src/utils/remote-cpu-boards.ts`
   - Update `REMOTE_CPU_BASE_URL` to your GitHub Pages URL:
     ```typescript
     const REMOTE_CPU_BASE_URL = 'https://USERNAME.github.io/REPO-NAME';
     ```

## Board Generation Recommendations

For each board size (2x2 through 10x10):

- **Minimum boards**: At least 10 boards per size
- **Recommended**: 20-50 boards per size for variety
- **Board quality**: All boards should:
  - Have at least one valid solution
  - Be solvable with the provided sequence
  - Have a valid thumbnail (generated SVG)
  - Use valid cell content types

## Testing Your Setup

1. After enabling GitHub Pages, wait a few minutes for deployment

2. Test the health endpoint:
   ```bash
   curl https://USERNAME.github.io/REPO-NAME/health.json
   ```

3. Test a board file:
   ```bash
   curl https://USERNAME.github.io/REPO-NAME/boards/2x2.json
   ```

4. Verify in the game:
   - Select "Remote CPU" opponent
   - Choose a board size
   - The game should fetch and use boards from your server

## CORS Considerations

GitHub Pages automatically serves files with proper CORS headers, so no additional configuration is needed. The game will be able to fetch JSON files cross-origin.

## Updating Boards

To add or update boards:

1. Edit the appropriate JSON files in your repository
2. Commit and push changes
3. GitHub Pages will automatically redeploy (usually within 1-2 minutes)
4. Players will see new boards on their next fetch

## Optional: Board Generation Script

You can create a script to generate boards programmatically. The script should:

1. Generate valid board layouts
2. Create solving sequences
3. Generate SVG thumbnails
4. Export to JSON format
5. Validate all boards before publishing

Example structure:
```bash
scripts/
├── generate-boards.js
├── validate-boards.js
└── package.json
```

## Security Notes

- All board data is public and read-only
- No authentication is required
- Players cannot upload or modify boards through the game
- Consider rate limiting if usage grows significantly

## Example Repository

See the official example repository for a working implementation:
- Repository: `https://github.com/USERNAME/spaces-game-cpu-boards`
- Live URL: `https://USERNAME.github.io/spaces-game-cpu-boards`
