# Minimal Board Encoding Strategy

## Overview

This document describes the minimal board encoding format for Spaces Game, designed to enable efficient peer-to-peer board sharing via URLs. The encoding reduces board size from ~800 characters to ~10-15 characters, making it ideal for messaging apps and social sharing.

## Motivation

### Current Full Board Format (Verbose)

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // 36 chars - unnecessary for sharing
  name: "My Awesome Board",                     // Variable - unnecessary for sharing
  boardSize: 2,                                 // 1 char - needed ✓
  grid: [['piece','empty'],['trap','empty']],  // ~30 chars - derivable from sequence
  sequence: [                                   // ~50 chars per move - needed ✓
    {position: {row:1, col:0}, type:'piece', order:1},
    {position: {row:0, col:0}, type:'piece', order:2},
    {position: {row:1, col:0}, type:'trap', order:3},
    {position: {row:-1, col:0}, type:'final', order:4}
  ],
  thumbnail: "data:image/svg+xml,<svg>...</svg>", // 500-2000 chars - can regenerate
  createdAt: 1234567890                         // 10 chars - unnecessary for sharing
}
```

**Total size**: ~600-2100 characters per board

**Problems**:
- Bloated URLs
- Inefficient for messaging
- Contains redundant/derivable data

### Peer-to-Peer Sharing Use Case

**Messaging workflow**:
1. Player 1: "Check out this game!" → sends game URL
2. Player 2: "Cool! Try this board" → sends URL with 1 board
3. Player 1: "Ha! Beat it! Here's the results and my counter-board" → sends URL with results + 1 board
4. Continue back and forth...

**What needs to be transmitted**:
- Previous round results (2 boards + scores + positions)
- Challenge board for next round (1 board)
- **Total**: 3 boards maximum per URL

**Current encoding**: ~2.5KB → ~600 chars compressed
**Minimal encoding**: ~50 chars → ~40 chars compressed ✅

## Encoding Format

### Format Specification

```
[size]|[sequence]
```

**Components**:
- `size`: Board size (`2` for 2×2, `3` for 3×3, `10` for 10×10) - 1-2 characters
- `|`: Separator - 1 character
- `sequence`: Ordered list of moves - variable length

### Move Encoding

Each move in the sequence is encoded as: `[position][type]`

**Position encoding with padding**:
- Board size determines position width (prevents ambiguity)
- Positions are **zero-padded** to consistent width:

| Board Size | Max Position | Position Width | Example |
|------------|--------------|----------------|---------|
| 2×2 | 3 | 1 digit | `0`, `1`, `2`, `3` |
| 3×3 | 8 | 1 digit | `0`, `1`, ..., `8` |
| 4×4 to 9×9 | 15-80 | 2 digits | `00`, `01`, ..., `15` |
| 10×10+ | 99+ | 3 digits | `000`, `001`, ..., `099` |

**Position calculation**:
```typescript
position = row * boardSize + col

// Examples for 2×2 (1 digit, no padding):
(0,0) → 0
(0,1) → 1
(1,0) → 2
(1,1) → 3

// Examples for 4×4 (2 digits, padded):
(0,0) → 00
(0,1) → 01
(3,3) → 15

// Examples for 10×10 (3 digits, padded):
(0,0) → 000
(5,7) → 057
(9,9) → 099
```

**Goal position encoding** (always uses `G` prefix):
- Format: `G[col][type]`
- Column is NOT padded (always single digit 0-9)
- Examples: `G0f`, `G5f`, `G9f`

**Type encoding**:
- `p`: piece
- `t`: trap
- `f`: final (goal reached)

### Why Padding?

Without padding, larger boards create ambiguity:

```
4|10p5t...
```

Could mean:
- Position `1`, then `0p`, then `5t`? ❌
- Position `10`, then `5t`? ✅

**Solution**: Board size prefix determines fixed position width, eliminating ambiguity.

## Examples

### Example 1: Simple 2×2 Board

**Board state**:
```
Grid:           Sequence:
[P][ ]          1. (1,0) piece  - Start position
[T][ ]          2. (0,0) piece  - Move forward
                3. (1,0) trap   - Place trap at start
                4. (-1,0) final - Reach goal
```

**Encoding**: `2|2p0p2tG0f`

**Breakdown**:
- `2` - Board size (2×2)
- `|` - Separator
- `2p` - Step 1: piece at position 2 (row:1, col:0)
- `0p` - Step 2: piece at position 0 (row:0, col:0)
- `2t` - Step 3: trap at position 2 (row:1, col:0)
- `G0f` - Step 4: final at goal column 0

**Size**: 11 characters (vs ~800 in full format)

### Example 2: Complex 2×2 Board

**Board state**:
```
Grid:           Sequence:
[P][ ]          1. (1,1) piece  - Start corner
[T][T]          2. (0,1) piece  - Move up
                3. (1,1) trap   - Place trap below (adjacent)
                4. (0,0) piece  - Move left
                5. (1,0) trap   - Place trap below (adjacent)
                6. (-1,0) final - Reach goal
```

**Encoding**: `2|3p1p3t0p2tG0f`

**Size**: 15 characters

**Note**: Traps at positions 3 and 2 are placed when the piece is at positions 1 and 0 respectively (both adjacent vertically).

### Example 3: 3×3 Board

**Board state**:
```
Grid:           Sequence:
[P][ ][ ]       1. (2,0) piece  - Start bottom-left
[T][ ][ ]       2. (1,0) piece  - Move up
[T][ ][ ]       3. (2,0) trap   - Place trap below (adjacent)
                4. (0,0) piece  - Move up
                5. (1,0) trap   - Place trap below (adjacent)
                6. (-1,0) final - Reach goal
```

**Encoding**: `3|6p3p6t0p3tG0f`

**Size**: 16 characters

**Note**: This demonstrates traps overwriting previous piece positions. Position 6 had a piece (step 1) then a trap (step 3). Position 3 had a piece (step 2) then a trap (step 5). The grid shows the final state after all moves.

### Example 4: 4×4 Board with Padding

**Board state**:
```
Grid:           Sequence:
[P][ ][ ][ ]    1. (3,0) piece   - Start bottom-left (pos 12)
[ ][ ][ ][ ]    2. (2,0) piece   - Move up (pos 8)
[ ][ ][ ][ ]    3. (3,0) trap    - Place trap adjacent at start (pos 12)
[T][ ][ ][ ]    4. (1,0) piece   - Move up (pos 4)
                5. (0,0) piece   - Move up (pos 0)
                6. (-1,0) final  - Reach goal
```

**Encoding**: `4|12p08p12t04p00pG0f`

**Breakdown**:
- `4` - Board size (4×4)
- `|` - Separator
- `12p` - Step 1: piece at position 12 (row 3, col 0) - **2 digits, padded**
- `08p` - Step 2: piece at position 08 (row 2, col 0) - **leading zero**
- `12t` - Step 3: trap at position 12 (adjacent to current pos 8) - **reusing previous position**
- `04p` - Step 4: piece at position 04 (row 1, col 0) - **leading zero**
- `00p` - Step 5: piece at position 00 (row 0, col 0) - **double zero**
- `G0f` - Step 6: final at goal column 0 - **goal never padded**

**Size**: 21 characters

**Note**: Traps must be placed adjacent to the piece's current position, so the trap at position 12 is placed while the piece is at position 8 (adjacent cells).

## Decoding Strategy

### Grid Derivation

The grid is **derived from the sequence** by applying moves in order. The key rule is:

> **Last move at each position determines the grid cell content**

**Algorithm**:
```typescript
function deriveGridFromSequence(sequence: BoardMove[], size: number): CellContent[][] {
  // Initialize empty grid
  const grid = Array(size).fill(null).map(() =>
    Array(size).fill('empty')
  );

  // Apply each move (later moves overwrite earlier ones)
  for (const move of sequence) {
    // Skip goal positions (row -1)
    if (move.position.row === -1) continue;

    const { row, col } = move.position;
    if (move.type === 'piece') {
      grid[row][col] = 'piece';
    } else if (move.type === 'trap') {
      grid[row][col] = 'trap';
    }
  }

  return grid;
}
```

**Example - Trap overwrites piece**:
```typescript
sequence: [
  { position: {row:1,col:0}, type:'piece', order:1 },  // Place piece
  { position: {row:0,col:0}, type:'piece', order:2 },  // Move away
  { position: {row:1,col:0}, type:'trap',  order:3 },  // Place trap (overwrites piece!)
]

// Grid after applying sequence:
grid[1][0] = 'piece'  // After step 1
grid[0][0] = 'piece'  // After step 2
grid[1][0] = 'trap'   // After step 3 - overwrites!

// Final grid:
[['piece', 'empty'],
 ['trap',  'empty']]
```

### Full Decoding Implementation

```typescript
function decodeMinimalBoard(encoded: string): Board {
  const [sizeStr, seqStr] = encoded.split('|');
  const boardSize = parseInt(sizeStr) as BoardSize;

  // Determine position width based on board size
  const maxPos = boardSize * boardSize - 1;
  const posWidth = maxPos < 10 ? 1 : maxPos < 100 ? 2 : 3;

  // Parse sequence
  const sequence: BoardMove[] = [];
  let i = 0;
  let order = 1;

  while (i < seqStr.length) {
    let position: Position;
    let type: 'piece' | 'trap' | 'final';

    // Handle goal position (G0, G1, G2, etc.)
    if (seqStr[i] === 'G') {
      const col = parseInt(seqStr[i + 1]);
      position = { row: -1, col };
      type = seqStr[i + 2] as 'piece' | 'trap' | 'final';
      i += 3;
    } else {
      // Regular grid position: read posWidth digits
      const posStr = seqStr.substring(i, i + posWidth);
      const pos = parseInt(posStr);
      position = {
        row: Math.floor(pos / boardSize),
        col: pos % boardSize
      };
      type = seqStr[i + posWidth] as 'piece' | 'trap' | 'final';
      i += posWidth + 1; // Skip position digits + type char
    }

    sequence.push({ position, type, order: order++ });
  }

  // Derive grid from sequence
  const grid = deriveGridFromSequence(sequence, boardSize);

  // Generate client-side data
  const id = crypto.randomUUID();
  const thumbnail = generateBoardThumbnail({ grid, sequence, boardSize });
  const createdAt = Date.now();

  return {
    id,
    name: 'Shared Board',
    boardSize,
    grid,
    sequence,
    thumbnail,
    createdAt
  };
}
```

### Encoding Implementation

```typescript
function encodeMinimalBoard(board: Board): string {
  const size = board.boardSize;

  // Determine position width based on board size
  const maxPos = size * size - 1;
  const posWidth = maxPos < 10 ? 1 : maxPos < 100 ? 2 : 3;

  const moves = board.sequence.map(move => {
    if (move.position.row === -1) {
      // Goal position: always use G prefix, no padding
      return `G${move.position.col}${move.type[0]}`;
    } else {
      // Regular position: pad to posWidth
      const pos = move.position.row * size + move.position.col;
      const padded = pos.toString().padStart(posWidth, '0');
      return `${padded}${move.type[0]}`;
    }
  }).join('');

  return `${size}|${moves}`;
}
```

## Size Comparison

### Maximum Moves per Board Size

Each n×n board can have at most **2n² moves**:
- **Piece moves**: n² (visit every cell)
- **Trap moves**: (n²)-1 (trap every cell except last)
- **Final move**: 1 (reach goal)

| Board Size | Max Moves | Formula |
|------------|-----------|---------|
| 2×2 | 8 | 2×4 = 8 |
| 3×3 | 18 | 2×9 = 18 |
| 4×4 | 32 | 2×16 = 32 |
| 5×5 | 50 | 2×25 = 50 |
| 10×10 | 200 | 2×100 = 200 |

### Encoding Size by Board Size

**Worst-case scenario** (max moves with padding):

| Board | Max Moves | Chars/Move | Total Chars (Minimal) |
|-------|-----------|------------|-----------------------|
| 2×2 | 8 | 2 (1+1) | ~18 chars |
| 3×3 | 18 | 2 (1+1) | ~38 chars |
| 4×4 | 32 | 3 (2+1) | ~98 chars |
| 5×5 | 50 | 3 (2+1) | ~152 chars |
| 10×10 | 200 | 4 (3+1) | ~802 chars |

### Single Board Comparison

| Format | 2×2 Board | 3×3 Board |
|--------|-----------|-----------|
| Full JSON (uncompressed) | ~800 chars | ~900 chars |
| Full JSON (LZ-String) | ~200 chars | ~220 chars |
| Minimal (uncompressed) | ~18 chars | ~38 chars |
| Minimal (LZ-String) | ~12 chars | ~25 chars |
| **Reduction** | **98.5%** | **97%** |

### Round Result + Next Board (3 boards total)

**Payload**: Previous round (2 boards) + challenge board (1 board) + metadata

| Board Size | Uncompressed | LZ-String Compressed | % of 2KB Limit |
|------------|--------------|---------------------|----------------|
| 2×2 | ~75 chars | ~25 chars | **1.2%** |
| 3×3 | ~135 chars | ~45 chars | **2.2%** |
| 4×4 | ~315 chars | ~105 chars | **5.2%** |
| 5×5 | ~475 chars | ~160 chars | **8%** |
| 10×10 | ~1,850 chars | ~620 chars | **31%** |

### Browser and System Limits (Modern)

**Modern browser URL limits**:
- **Chrome**: 2MB+ (tested up to 260KB+)
- **Firefox**: 1MB+ (officially 65KB+)
- **Safari**: 2MB+ (similar to Chrome)
- **Legacy browsers (IE11/Edge Legacy)**: 2KB ❌ (not supported)

**Clipboard limits** (the real constraint):
- **Android**: ~256KB practical limit (~262,144 characters)
  - Strings exceeding this size fail to copy
  - 1MB theoretical limit on IPC operations
- **iOS**: ~100-500KB estimated (no official documentation)
- **Desktop (Windows/Mac/Linux)**: 2GB+ (not a concern)

**Conclusion**: The **Android clipboard limit (~256KB)** is the practical constraint for peer-to-peer sharing, not browser URL limits.

### Maximum Supported Board Size

With **256KB Android clipboard limit** for deck mode (45 boards):
- **2×2 boards**: < 5KB (2% of limit) ✅
- **3×3 boards**: < 10KB (4% of limit) ✅
- **10×10 boards**: ~30KB (12% of limit) ✅
- **15×15 boards (max moves)**: ~54KB (21% of limit) ✅
- **Maximum practical**: 20×20+ boards with full decks still fit comfortably

### URL Length Comparison

**Full format**:
```
https://spaces-game.com/#N4IghgNgfghgtgUxALhAZwC4gL5QGYCuATgJYD2AhgM4D0AVAMoQDG...
[~250 characters]
```

**Minimal format**:
```
https://spaces-game.com/#2|2p0p2tG0f
[~38 characters]
```

## Use Cases

### 1. Peer-to-Peer Board Sharing

**Player 1 challenges Player 2**:
```
URL: #challenge=2|2p0p2tG0f
Size: ~22 chars
```

### 2. Round Results + Next Challenge

**Player 2 responds with results and counter-challenge**:
```
URL: #result=2|2p0p2tG0f,2|3p1tG1f&next=2|1p0p1tG0f
Components:
- Player's board: 2|2p0p2tG0f
- Opponent's board: 2|3p1tG1f
- Next challenge: 2|1p0p1tG0f
Size: ~45 chars
```

### 3. Multi-Round History

Instead of storing 10 full boards in URL, store:
- Only boards actually played
- Results derived from simulation
- Next challenge board

## URL Sharing Strategy

### The Problem

Even with minimal encoding, large boards and decks can create long URLs that are:
- **Visually intimidating**: 50KB+ URLs look "broken" to users
- **Hard to verify**: Users can't tell if the URL copied correctly
- **Unpleasant UX**: Exposing raw encoded data feels unprofessional

### The Solution: Hide the URL

**Never show the raw URL to users.** Instead, provide clean sharing interfaces:

#### 1. Share Button with Clipboard API

```typescript
async function shareGameUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Game link copied! Send it to your opponent.');
  } catch (error) {
    // Fallback for browsers without clipboard API
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    toast.success('Game link copied!');
  }
}

// Usage
<button onClick={() => shareGameUrl(fullUrl)} className="shareButton">
  📋 Share Challenge
</button>
```

**Benefits**:
- Users never see the ugly URL
- One-click copy experience
- Works across all modern browsers
- Friendly success message confirms action

#### 2. Native Share API (Mobile-First)

```typescript
async function shareGame(url: string, title: string) {
  // Check if Web Share API is available (mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: 'Try to beat my board!',
        url: url
      });
    } catch (error) {
      // User cancelled or share failed, fallback to clipboard
      await shareGameUrl(url);
    }
  } else {
    // Desktop fallback: use clipboard
    await shareGameUrl(url);
  }
}

// Usage
<button onClick={() => shareGame(fullUrl, 'Spaces Game Challenge')}>
  🚀 Share Challenge
</button>
```

**Benefits**:
- Native share sheet on mobile (WhatsApp, Messages, etc.)
- Automatic fallback to clipboard on desktop
- Best-in-class UX for each platform
- No typing or copying required

#### 3. QR Code (In-Person Sharing)

```typescript
import QRCode from 'qrcode';

async function generateQrCode(url: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR code generation failed', error);
    throw error;
  }
}

// Usage
const [qrCode, setQrCode] = useState<string | null>(null);

<button onClick={async () => {
  const qr = await generateQrCode(fullUrl);
  setQrCode(qr);
  setShowQrModal(true);
}}>
  📱 Show QR Code
</button>

{showQrModal && (
  <div className="qrModal">
    <h3>Scan to Play</h3>
    <img src={qrCode} alt="QR Code" />
    <p>Scan with your phone's camera</p>
  </div>
)}
```

**Benefits**:
- Perfect for in-person challenges
- No typing or copying needed
- Works with URLs up to ~2KB (sufficient for most boards)
- Great for tournament/event settings

#### 4. Progressive Enhancement

Combine all approaches with feature detection:

```typescript
function ShareButton({ url, title }: { url: string; title: string }) {
  const [showQr, setShowQr] = useState(false);

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // User cancelled, continue to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (e) {
      // Last resort: show modal with selectable URL
      setShowQr(true);
    }
  };

  return (
    <div className="shareActions">
      <button onClick={handleShare} className="primary">
        📤 Share Challenge
      </button>
      <button onClick={() => setShowQr(!showQr)} className="secondary">
        📱 QR Code
      </button>
      {showQr && <QrCodeModal url={url} onClose={() => setShowQr(false)} />}
    </div>
  );
}
```

### User Experience Flow

**Traditional (bad UX)**:
1. ❌ User sees: `https://spaces-game.com/#KLUv/QBYA...300 chars...ZXRwZA==`
2. ❌ User thinks: "Is this broken? Did it work?"
3. ❌ User manually copies URL (error-prone)

**Modern sharing (good UX)**:
1. ✅ User clicks: "Share Challenge" button
2. ✅ System shows: "Link copied! Send to your opponent 🎮"
3. ✅ User pastes directly into messaging app
4. ✅ Opponent clicks link → game loads instantly

### Implementation Recommendations

1. **Default to clipboard copy** - Works everywhere, simple UX
2. **Add Web Share API** - Native mobile experience (progressive enhancement)
3. **Optional QR code** - Nice-to-have for in-person play
4. **Never expose raw URLs** - Only show in debug/developer modes

### Size Considerations

With hidden URLs, size becomes less of a psychological issue:
- **50KB URL**: Looks scary ❌ → Copies instantly ✅
- **100KB URL**: Looks broken ❌ → Works perfectly ✅
- **256KB limit**: Real constraint, but plenty of headroom for 15-card decks

Users never see the URL length, so it doesn't matter if it's 100 or 100,000 characters (as long as it fits in clipboard/browser limits).

## Implementation Checklist

- [ ] Create `encodeMinimalBoard(board: Board): string`
  - [ ] Implement position width determination
  - [ ] Implement zero-padding for positions
  - [ ] Handle goal positions (G prefix)
- [ ] Create `decodeMinimalBoard(encoded: string): Board`
  - [ ] Determine position width from board size
  - [ ] Parse padded positions correctly
  - [ ] Handle goal positions
- [ ] Create `deriveGridFromSequence(sequence: BoardMove[], size: number): CellContent[][]`
- [ ] Update URL compression to support minimal board format
- [ ] Add migration for legacy full-format URLs
- [ ] Update peer-to-peer sharing to use minimal format
- [ ] Add unit tests for encoding/decoding
  - [ ] Test 2×2 boards (1-digit positions)
  - [ ] Test 3×3 boards (1-digit positions)
  - [ ] Test 4×4+ boards (2-digit padded positions)
  - [ ] Test 10×10+ boards (3-digit padded positions)
  - [ ] Test goal position encoding
  - [ ] Test round-trip encoding/decoding
- [ ] Add validation for minimal format
  - [ ] Validate position width matches board size
  - [ ] Validate maximum moves (2n²)
  - [ ] Validate position values (0 to n²-1)
- [ ] Implement URL sharing UI
  - [ ] Create share button with Clipboard API
  - [ ] Add Web Share API integration (mobile)
  - [ ] Add QR code generation option
  - [ ] Progressive enhancement with fallbacks
  - [ ] Never expose raw URLs in UI (only in debug mode)

## Migration Strategy

### Backward Compatibility

Support both formats during transition:

```typescript
function decodeBoardFromUrl(encoded: string): Board {
  // Detect format
  if (encoded.includes('|')) {
    // New minimal format
    return decodeMinimalBoard(encoded);
  } else {
    // Legacy full format (LZ-String compressed JSON)
    return decompressGameState(encoded);
  }
}
```

### Gradual Rollout

1. **Phase 1**: Implement minimal encoding, keep generating full format
2. **Phase 2**: Start generating minimal format for new shares
3. **Phase 3**: Continue supporting both formats for decoding
4. **Phase 4** (optional): Eventually deprecate full format for shares

## Security Considerations

### Input Validation

Always validate decoded boards:

```typescript
function decodeMinimalBoard(encoded: string): Board {
  const board = parseMinimalFormat(encoded);

  // Validate board
  const validation = validateBoard(board);
  if (!validation.valid) {
    throw new Error(`Invalid board: ${validation.errors.join(', ')}`);
  }

  return board;
}
```

### Size Limits

Even with minimal encoding, enforce reasonable limits:

```typescript
const MAX_SEQUENCE_LENGTH = 8; // Game rule: max 8 moves
const MAX_ENCODED_LENGTH = 50; // Reasonable upper bound

if (seqStr.length > MAX_ENCODED_LENGTH) {
  throw new Error('Encoded board exceeds size limit');
}
```

## Benefits

1. **Compact URLs**: 95%+ size reduction enables clean sharing
2. **Fast transmission**: Minimal data transfer for peer-to-peer play
3. **Messaging-friendly**: Short URLs work in any chat app
4. **Client-side generation**: No server needed for thumbnails/IDs
5. **Cacheable**: Deterministic decoding enables client-side caching
6. **Privacy-preserving**: Only game data transmitted, no metadata
7. **Unambiguous parsing**: Position padding eliminates multi-digit ambiguity
8. **Scalable**: Supports boards up to 31×31 (3-digit positions) without format changes

## Limitations

1. **Name not preserved**: Board names lost (acceptable for challenges)
2. **ID regenerated**: New UUID on each decode (fine for ephemeral shares)
3. **Timestamp regenerated**: CreatedAt reflects decode time, not original
4. **Slightly less human-readable**: Can't eyeball the board from URL

These limitations are acceptable trade-offs for the massive size reduction, especially since the primary use case is peer-to-peer challenges where metadata isn't important.

## Future Enhancements

### Optional Name Encoding

Add optional board name if needed:

```
2|2p0p2tG0f:MyBoard
```

### Checksum for Validation

Add optional checksum for tamper detection:

```
2|2p0p2tG0f#a3f9
```

### Creature Selection

If players can select creatures per board:

```
2|2p0p2tG0f@square
```

## Key Design Decisions

### Position Padding Strategy

The position padding system is a critical design choice that solves the multi-digit ambiguity problem:

**Problem**: Without padding, `4|10p5t` is ambiguous
- Could be: positions 1, 0, 5 (wrong!)
- Could be: positions 10, 5 (correct!)

**Solution**: Board size determines position width
- 2×2 and 3×3: 1 digit (positions 0-8)
- 4×4 to 9×9: 2 digits with zero-padding (positions 00-80)
- 10×10 to 31×31: 3 digits with zero-padding (positions 000-960)

**Trade-offs**:
- ✅ **Eliminates ambiguity**: Parser always knows where position ends
- ✅ **Deterministic**: Board size prefix makes parsing straightforward
- ✅ **Minimal overhead**: Only affects boards 4×4 and larger
- ⚠️ **Slight size increase**: Adds ~50% to position chars for 4×4+ boards
  - But still 95%+ reduction vs full format!

### Why Not Use Delimiters?

Alternative: Use delimiters between moves (e.g., `4|10p-5t-G0f`)
- ❌ Adds 1 character per move (significant overhead)
- ❌ Reduces compression efficiency
- ✅ Padding is more compact and compresses better

### Why Goal Uses 'G' Prefix?

Goals are always at row -1, so column is all we need:
- `G0f`, `G5f`, `G9f` is unambiguous
- No padding needed (single digit column)
- Shorter than encoding (-1, col) as position

## Conclusion

The minimal board encoding strategy reduces board size by ~98%, enabling efficient peer-to-peer board sharing via URLs. By encoding only essential data (size + sequence) and deriving everything else client-side, we create compact, shareable URLs perfect for messaging workflows.

**Key insights**:
1. **The sequence is the source of truth** - Everything else (grid, thumbnail, metadata) can be deterministically regenerated from the sequence + board size
2. **Position padding prevents ambiguity** - Board size determines fixed position width for unambiguous parsing
3. **Maximum moves formula (2n²)** - Each cell can have at most one piece visit and one trap placement
