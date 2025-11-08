# Adding Creatures to Spaces Game

This guide explains how to add new creatures with custom graphics to the game.

## Overview

Creatures are wind-up toys that represent players in the game. Each creature has:
- A name and description
- A unique ID (folder name)
- Graphics for different game outcomes
- A default/idle state graphic

## File Structure

```
src/creatures/
└── your-creature-id/
    └── creature.json          # Creature metadata

public/creatures/
├── shared/
│   ├── collision.svg         # Both creatures hit each other
│   ├── double-goal.svg       # Both reached goal
│   ├── double-trap.svg       # Both hit traps
│   └── default.svg           # Fallback graphic
└── your-creature-id/
    ├── default.svg           # Idle/neutral state
    ├── goal.svg              # Reached the goal
    ├── trapped.svg           # Hit a trap
    ├── forward.svg           # Moved forward
    └── stuck.svg             # Got stuck
```

## Step-by-Step Guide

### 1. Choose a Creature ID

Pick a unique ID (lowercase, no spaces). Examples: `bug`, `square`, `circle`, `robot`, `wizard`

### 2. Create Creature Metadata

Create `src/creatures/your-creature-id/creature.json`:

```json
{
  "name": "Display Name",
  "description": "A brief description of the creature",
  "ability": "What makes this creature special"
}
```

**Example** (`src/creatures/bug/creature.json`):
```json
{
  "name": "Bug",
  "description": "A speedy little bug with lots of legs",
  "ability": "Quick movements and nimble dodging"
}
```

### 3. Add Creature Graphics

Create a folder `public/creatures/your-creature-id/` and add these 5 images:

| File | When Shown | Description |
|------|-----------|-------------|
| `default.svg` | Profile, selection | Idle/neutral state |
| `goal.svg` | Round results | Creature reached the goal (winning!) |
| `trapped.svg` | Round results | Creature hit a trap (ouch!) |
| `forward.svg` | Round results | Creature moved forward safely |
| `stuck.svg` | Round results | Creature couldn't move |

**Image Format:**
- **SVG** (recommended) - Scales perfectly, smaller file size
- **PNG/JPG** - Also supported, just use `.png` or `.jpg` extension
- **Size**: No strict requirements, but 200x200px works well
- **Style**: Match the wind-up toy aesthetic of existing creatures

### 4. Test Your Creature

1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Check creature appears:**
   - Go to profile/settings
   - Your creature should appear in the selection list
   - Select it and save

3. **Test all graphics:**
   - Play a game
   - Check that outcome graphics display correctly in round results

## Image Format Tips

### Using SVG (Recommended)

SVG files are vector graphics that scale perfectly:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Your creature artwork here -->
  <circle cx="100" cy="100" r="80" fill="#4a90e2"/>
  <circle cx="80" cy="80" r="10" fill="white"/>
  <circle cx="120" cy="80" r="10" fill="white"/>
</svg>
```

### Using PNG/JPG

If you prefer PNG or JPG:
1. Create images at 200x200px (or larger)
2. Use transparent backgrounds for PNG
3. Name files with correct extension: `goal.png`, `trapped.png`, etc.

### Converting Existing Images

To convert PNG to SVG, you can use:
- [Inkscape](https://inkscape.org/) (free)
- Online tools like [SVGConverter](https://svgconverter.com/)
- AI tools to generate SVG from descriptions

## Example: Complete Creature Setup

Let's add a "Robot" creature:

**1. Create `src/creatures/robot/creature.json`:**
```json
{
  "name": "Robot",
  "description": "A mechanical marvel from the old world",
  "ability": "Precise movements and calculated strategy"
}
```

**2. Add graphics to `public/creatures/robot/`:**
```
public/creatures/robot/
├── default.svg      # Standing robot
├── goal.svg         # Robot celebrating
├── trapped.svg      # Robot short-circuiting
├── forward.svg      # Robot walking
└── stuck.svg        # Robot confused
```

**3. Test:**
- Restart dev server (if creature.json was added)
- Go to profile
- "Robot" should appear in creature selection
- Select and play a game

## How It Works

The game automatically discovers creatures at build time:

1. **Vite scans** `src/creatures/*/creature.json` files
2. **Creates CREATURES map** with metadata
3. **Graphics loaded on-demand** from `public/creatures/`
4. **Fallback graphics** used if specific outcome image is missing

See `src/types/creature.ts` for implementation details.

## Troubleshooting

**Creature doesn't appear in selection:**
- Check `creature.json` is valid JSON
- Ensure folder name matches creature ID
- Restart dev server after adding new creature

**Graphics don't show:**
- Check file names match exactly: `goal.svg`, not `Goal.svg`
- Verify files are in `public/creatures/your-id/`
- Check browser console for 404 errors
- Use correct file extension (`.svg`, `.png`, or `.jpg`)

**Graphics look wrong:**
- Check SVG viewBox attribute
- Ensure aspect ratio is square-ish (1:1)
- Test in isolation by opening SVG directly in browser

## Shared Graphics

Some events use shared graphics (in `public/creatures/shared/`):

- `collision.svg` - When both creatures collide
- `double-goal.svg` - When both reach the goal
- `double-trap.svg` - When both hit traps
- `default.svg` - Fallback if creature graphic missing

You generally don't need to modify these.

## Contributing

When contributing new creatures:
1. Ensure graphics are family-friendly
2. Keep file sizes reasonable (< 50KB per image)
3. Include all 5 required outcome graphics
4. Add creature.json with complete metadata
5. Test all outcomes in actual gameplay

## Example Creatures

Check existing creatures for inspiration:
- **Bug** - Simple, organic design
- **Square** - Geometric, minimalist
- **Circle** - Round, friendly
- **Triangle** - Sharp, angular

## Questions?

- Check `src/types/creature.ts` for type definitions
- See `src/utils/creature-graphics.ts` for loading logic
- Look at existing creatures in `src/creatures/` and `public/creatures/`
