# Future Game Mechanics & Iterations

## Overview
Advanced gameplay mechanics and bot behaviors for future iterations of Spaces Game. These ideas expand the strategic depth and introduce new tactical possibilities.

---

## Advanced Bot Behaviors

### Reactive/Conditional Bots with Vision System
**Concept**: Bots that can wait and observe opponent moves before deciding their own action, combined with a field-of-vision system that limits what they can see.

**Current State**:
- All creatures move simultaneously
- No ability to react to opponent's move
- Decisions made in isolation
- Perfect information (can see everything)

**Future State**:
- **Wait-and-React Ability**: Special creatures or abilities that trigger after seeing opponent's move
- **Conditional Movement**: "If opponent moves to X, then I move to Y"
- **Field of Vision System**: Limited sight range creates fog of war
- **Information Asymmetry**: What you see depends on proximity and vision range

---

### Wait-and-See Mechanic

**Core Concept**: Choose to wait one turn to observe opponent's action before committing your move.

#### How It Works:
```
Turn N:
- Player A: "Wait and see"
- Player B: Commits move (moves to position X)

Turn N reveal:
- Player A sees where Player B moved
- Player A now makes informed decision based on this info

Examples:
1. Enemy diagonal across board → A jets to goal (safe path)
2. Enemy moving toward A → A sets traps in predicted path
3. Enemy camping goal → A takes alternate route
```

#### Strategic Implications:

**When to Wait**:
- ✅ Uncertain about opponent position
- ✅ Multiple viable strategies, need more info
- ✅ Opponent is far away (low immediate threat)
- ✅ Near endgame, need to see if opponent goes for goal

**Cost of Waiting**:
- ❌ Lose a turn (opponent gets ahead)
- ❌ Opponent might also wait (stalemate?)
- ❌ Initiative advantage goes to opponent
- ❌ Might reveal your position while waiting

**Counterplay**:
- Opponent can bait by moving aggressively
- Then trap the "obvious" counter-move
- Fake going for goal, actually setting trap

---

### Field of Vision (FOV) System

**Concept**: Creatures can only see within a certain range. Beyond that range, positions are unknown (fog of war).

#### Vision Range Options:

**Option 1: Fixed Range for All**
- All creatures see X spaces in all directions
- Simple, fair, predictable
- Example: 3-space vision radius

**Option 2: Creature-Type Vision**
- **Scout**: 5 space vision
- **Infantry**: 3 space vision
- **Tank**: 2 space vision (heavy armor = limited visibility)
- Adds strategic variety in unit selection

**Option 3: Diminishing Clarity**
```
Distance 0-1: Perfect information (see creature + traps)
Distance 2-3: See creature only (traps hidden)
Distance 4+:   Fog of war (nothing visible)
```

#### What Can Be Seen at Different Ranges:

**Close Range (1-2 spaces)**:
- ✅ Enemy creature position
- ✅ Enemy traps
- ✅ Enemy movement direction (last known)
- ✅ Clear, actionable intelligence

**Medium Range (3-4 spaces)**:
- ✅ Enemy creature position (fuzzy)
- ❌ Traps hidden
- ⚠️ Movement direction unknown
- ⚠️ "Something is there" but details unclear

**Long Range (5+ spaces)**:
- ❌ Complete fog of war
- ❌ No information
- ⚠️ Must scout or wait-and-see to gather intel

#### Trap Detection Range vs Creature Detection Range

**Asymmetric Vision** adds depth:

```
Creature Detection: 4 spaces
Trap Detection:     2 spaces

Result:
- See enemy at distance 3-4, but not their traps
- Know enemy is "over there" but path to them is risky
- Must decide: advance blindly or wait for more info?
```

**Gameplay Example**:
```
You see enemy 3 spaces away (within creature vision)
But trap vision is only 2 spaces

The space between you might have traps!
- Risk it and move forward?
- Wait to see if enemy moves (revealing trap layout)?
- Take longer route around?
```

#### Vision Modifiers:

**Elevation/Terrain** (future):
- High ground: +1 vision range
- Forest/obstacles: -1 vision range

**Abilities**:
- **Scout ability**: +2 vision range
- **Stealth ability**: Enemy vision -1 when detecting you
- **Flare ability**: Reveal large area for 1 turn

**Items/Powerups**:
- **Binoculars**: Double vision range this turn
- **Smoke**: Reduce enemy vision in area
- **Flashbang**: Blind enemy (vision = 0) for 1 turn

---

### Conditional Action System

**Concept**: When waiting, set multiple conditional responses based on what you observe.

#### Conditional Limit Options:

**Option 1: Single Conditional**
- Simple: "If enemy moves north, I move south"
- Easy to understand
- Limited strategic depth

**Option 2: Multiple Conditionals (3-5 max)**
```
Wait action with conditions:
1. If enemy at position A → Move to B
2. If enemy at position C → Set trap at D
3. If enemy moves toward goal → Block path at E
4. If enemy waits too → Default move to F
```

**Option 3: Tiered Conditionals (Priority System)**
```
Priority 1: If enemy within 2 spaces → Set defensive traps
Priority 2: Else if enemy moving away → Sprint to goal
Priority 3: Else → Move to center position
```

#### Conditional Complexity Tiers:

**Basic Conditionals**:
- "If enemy moves to space X" → Do Y
- Position-based only
- No chaining

**Advanced Conditionals**:
- "If enemy within range R AND moving toward goal" → Block
- Multiple criteria (AND/OR logic)
- Range-based triggers

**Expert Conditionals**:
- "If enemy sets trap at X, then counter-trap at Y, else advance to Z"
- Nested logic
- Action-based triggers (not just position)

#### UI Considerations:

**How to Set Conditionals?**

**Option A: Visual Flowchart**
```
[Wait] → See enemy position
         ↓
    [If enemy at A] → [Move to B]
         ↓
    [If enemy at C] → [Trap at D]
         ↓
    [Otherwise] → [Move to E]
```

**Option B: Decision Tree Interface**
- Drag-and-drop conditions
- Connect nodes for flow
- Visual scripting style

**Option C: Natural Language**
- "If enemy is within 2 spaces, set trap. Otherwise, move to goal."
- Parser converts to conditionals
- Most user-friendly?

---

### Strategic Scenarios with Vision + Wait

#### Scenario 1: The Diagonal Dash
```
Setup:
- You at bottom-left corner
- Goal at top-right corner
- Enemy position unknown (fog of war)

Turn 1: Wait and see
- Enemy reveals position at bottom-right (diagonal)
- Far from your path!

Turn 2: Jet to goal
- Clear path, no interference
- Enemy too far to intercept
- Victory!
```

#### Scenario 2: The Information Trade
```
Setup:
- Both players in fog of war range
- Neither knows other's position

Player A: Waits (to see Player B)
Player B: Moves forward

Result:
- Player A gains info (sees B's position)
- Player B gains ground (closer to goal)
- Trade: Information vs Initiative
```

#### Scenario 3: The Trap Prediction
```
Turn 1:
- Enemy in vision range (3 spaces away)
- Wait to see their move

Enemy moves toward you + sets trap

Turn 2 (your response):
- Now you know trap location (saw them place it)
- Set counter-trap in their likely next position
- Move to flank around their trap
```

#### Scenario 4: The Double Wait Stalemate
```
Both players: Wait and see

Resolution options:
A. Both forced to move simultaneously (back to normal)
B. Tie-breaker: Initiative stat determines who waits successfully
C. Both lose turn, game continues
D. Waiting player closer to goal goes first
```

---

### Vision-Based Abilities & Counters

#### Scout Archetype:
- **High vision range** (5-6 spaces)
- **Low combat power**
- **Fast movement**
- Role: Information gathering, map control

#### Assassin Archetype:
- **Stealth**: Harder to detect (enemy vision -1)
- **Normal vision range** (3 spaces)
- **High damage traps**
- Role: Surprise attacks, ambush

#### Tank Archetype:
- **Low vision range** (2 spaces)
- **Survives traps**
- **Slow movement**
- Role: Area denial, holding positions

#### Support Archetype:
- **Shares vision** with ally (team mode)
- **Reveals traps** in area
- **Buff allies**
- Role: Enabler, support

---

### Fog of War Visual Design

**UI Representations**:

**Full Fog**:
- Gray/dark overlay
- No information visible
- "?" symbol

**Partial Vision** (sensed but not seen):
- Faded silhouette
- "Something detected in this area"
- No trap visibility

**Clear Vision**:
- Full color, all details
- Creature type visible
- Trap indicators shown
- Movement history shown (last 1-2 turns)

**Explored but Currently Unseen**:
- Desaturated colors
- Last known information
- Timestamp: "Enemy seen here 2 turns ago"

---

### Balance Considerations

**Waiting Penalty**:
- Lose 1 turn of movement
- Opponent gets ahead
- Only viable if information > tempo loss

**Vision Range Balance**:
- Too high: No fog of war benefit
- Too low: Frustrating, blind gameplay
- Sweet spot: ~40% of board visible?

**Conditional Limit**:
- Too few: Not enough strategic options
- Too many: Analysis paralysis, complexity overload
- Sweet spot: 3-5 conditionals?

**Wait Frequency Limit**:
- Can wait every turn? (Stalling tactic)
- Maximum X waits per game?
- Cooldown between waits?

---

### Implementation Complexity

**Phase 1: Basic Wait-and-See**
- Simple: Wait 1 turn, see opponent move, then go
- No conditionals yet
- Test if mechanic is fun

**Phase 2: Vision System**
- Add fog of war
- Fixed vision range for all creatures
- See creatures but not traps beyond range

**Phase 3: Basic Conditionals**
- Add 1-2 simple conditionals per wait
- Position-based only
- Limited UI (dropdown menus)

**Phase 4: Advanced Vision**
- Asymmetric vision (creature vs trap range)
- Creature-specific vision ranges
- Stealth mechanics

**Phase 5: Complex Conditionals**
- Multiple conditionals (3-5)
- AND/OR logic
- Visual scripting UI

**Phase 6: Vision-Based Abilities**
- Scouts, assassins, tanks
- Active abilities (flares, smoke)
- Team vision sharing

---

### Testing Questions

1. **Is waiting fun or frustrating?**
   - Does it feel strategic or just slow?
   - Playtest extensively

2. **Does fog of war add tension or confusion?**
   - Is it clear what you can/can't see?
   - Are indicators helpful?

3. **Are conditionals intuitive?**
   - Can players set them easily?
   - Do they behave as expected?

4. **What's the optimal vision range?**
   - Run simulations with different ranges
   - Find balance between info and mystery

5. **How often do players wait?**
   - Every turn? (Too much)
   - Never? (Mechanic unused)
   - Sometimes? (Perfect)

---

### Integration with Other Mechanics

**Wait + Diagonal Movement**:
- Wait to see diagonal approach
- Respond with diagonal escape
- More complex pathing decisions

**Wait + Move-Trap Combo**:
- See enemy move
- Respond with move + trap combo
- Counter their predicted path

**Wait + Abilities**:
- Wait to see enemy ability usage
- Respond with counter-ability
- Rock-paper-scissors depth

**FOV + Traps**:
- Hidden traps outside vision
- Must risk stepping or wait-and-see
- Tension and uncertainty

---

### Advanced: Probability-Based Vision

**Concept**: Instead of binary "see/don't see", use probability.

```
Distance 1: 100% detection chance
Distance 2: 80% detection chance
Distance 3: 50% detection chance
Distance 4: 20% detection chance
Distance 5+: 0% detection chance

Each turn, roll for detection at each range
Creates uncertainty even within "vision range"
```

**Gameplay**:
- "I think I saw something at position X, but not sure"
- Adds risk/reward to acting on partial info
- More realistic (vision isn't perfect)

**Cons**:
- RNG in strategy game (controversial)
- Could feel unfair if unlucky
- More complex to explain

---

### Success Metrics for Vision System

**Good Vision System**:
- ✅ Creates interesting decisions
- ✅ Rewards scouting and exploration
- ✅ Adds tension (what's in the fog?)
- ✅ Enables ambush/surprise tactics
- ✅ Doesn't feel unfair or frustrating

**Bad Vision System**:
- ❌ Too limiting (can't see anything)
- ❌ Too revealing (no fog benefit)
- ❌ Confusing (unclear what I can see)
- ❌ Slows down gameplay too much
- ❌ Removes skill, adds only luck

---

## Diagonal Movement

### Diagonal Movement
**Concept**: Allow creatures to move diagonally, not just orthogonally (up/down/left/right).

**Current State**:
- Movement restricted to 4 directions (N, S, E, W)
- Grid-aligned movement only

**Future Options**:

#### Option 1: All Creatures Can Move Diagonally
- **Pros**:
  - More movement options (8 directions instead of 4)
  - Faster board traversal
  - More complex positioning
- **Cons**:
  - Might make board feel smaller
  - Could reduce strategic bottlenecks
  - Harder to trap opponents

#### Option 2: Specific Creatures Have Diagonal Movement
- **Knight/Cavalry**: Can move diagonally
- **Infantry/Basic**: Only orthogonal
- **Adds variety**: Different creature types have different movement

#### Option 3: Diagonal Movement Costs More
- **Orthogonal Move**: 1 movement point
- **Diagonal Move**: 2 movement points (or 1.5?)
- **Encourages mixed strategies**

**Gameplay Implications**:
- Escape routes become more numerous
- Trapping becomes harder (or different tactics needed)
- Board control dynamics change
- Corner positioning gains/loses value

**Visual Considerations**:
- How to show diagonal movement paths clearly?
- Arrow indicators for 8 directions
- Path highlighting on hover

---

## Diagonal Trapping

### Diagonal Trap Placement
**Concept**: Traps can be placed diagonally adjacent, not just orthogonally.

**Current State**:
- Traps placed in 4 cardinal directions
- Must be adjacent to creature

**Future Possibilities**:

#### Option 1: Diagonal Trap Placement
- Place traps in any of 8 surrounding spaces
- Increases trap coverage area
- Makes defense easier

#### Option 2: Diagonal Trap Activation
- Traps trigger when enemy moves diagonally past
- Creates "zone of control" concept
- Moving diagonally through threatened space = risky

#### Option 3: Diagonal Trap Chains
- Multiple traps in diagonal line
- Bonus effect if enemy triggers multiple?
- "Minefield" strategy

**Gameplay Implications**:
- More defensive options
- Harder to navigate safely
- Rewards planning trap networks
- Could slow down aggressive play

---

## Combo Moves: Move + Trap Same Turn

### Move-and-Trap Mechanic
**Concept**: Execute movement and trap placement in the same action.

**Current State** (assumed):
- Creatures move OR trap (separate actions)
- One action per turn

**Future Mechanic**: **Simultaneous Move + Trap**

#### Basic Implementation
```
Creature at position A:
1. Moves to position B
2. Simultaneously places trap at position A (the space they just left)
```

**Use Cases**:

1. **Retreat & Cover**:
   - Enemy chasing you
   - Move away + leave trap behind
   - Punish aggressive pursuit

2. **Bait & Switch**:
   - Creature in front of you (position B)
   - You're at position A
   - Move to B (forcing enemy to A via swap)
   - Trap your old position (A)
   - Enemy swaps into your trap!

3. **Safe Advance**:
   - Move forward into contested space
   - Trap your rear for protection
   - Create safe retreat path

#### Advanced: Predict Opponent Swap
**The Mind Game**:
```
Setup:
- You at A
- Opponent at B (directly adjacent)

Your Move:
- Announce move from A to B
- Place trap at A
- Bet that opponent will also move (causing swap)

Outcomes:
- If opponent moves: Swap occurs, they end up at A (your trap!)
- If opponent stays: You moved to B, trap at A is "wasted" but not harmful
- High risk, high reward play
```

**Counterplay**:
- Opponent realizes the trap setup
- Chooses NOT to move
- Your trap placement was a bluff
- Creates psychological warfare element

#### UI Considerations
- How to show move + trap in one action?
- Animation sequence: move THEN trap appears?
- Or trap appears simultaneously?
- Indicator that trap is "conditional" on movement?

#### Balance Considerations
- Is this too powerful?
- Should it cost extra (energy/action points)?
- Limit to certain creature types?
- Once per game?

---

## Additional Advanced Mechanics (Brainstorming)

### 1. **Multi-Step Moves**
- Plan a sequence of moves (A → B → C)
- Opponent sees first move, not the full sequence
- Adds feinting/misdirection

### 2. **Trap Upgrades**
- **Sticky Trap**: Immobilizes for 1 turn
- **Damage Trap**: Removes creature from game
- **Alarm Trap**: Reveals enemy position but no damage
- **Chain Trap**: Triggers adjacent traps

### 3. **Creature Abilities**
- **Scout**: Can see 2 spaces ahead (fog of war)
- **Tank**: Survives one trap
- **Assassin**: Can move 3 spaces instead of 2
- **Engineer**: Can place 2 traps instead of 1
- **Ghost**: Ignores one trap per turn

### 4. **Board Hazards**
- **Lava**: Certain spaces damage any creature
- **Walls**: Impassable terrain
- **Teleporters**: Move to another space instantly
- **Conveyor**: Forces movement in direction

### 5. **Team Mechanics**
- **2v2 or 3v3**: Multiple creatures per side
- **Coordinated Traps**: Team members combine trap effects
- **Cover**: Creatures can protect each other

### 6. **Resource System**
- **Energy Points**: Spend on moves, traps, abilities
- **Regenerating**: Gain energy per turn
- **Strategic Choices**: Big move now vs. save for later

### 7. **Turn Timer Options**
- **Blitz Mode**: 10 seconds per turn
- **Standard**: 60 seconds per turn
- **Correspondence**: 24 hours per turn
- **Adds time pressure element**

---

## Implementation Priority

### Tier 1: Near-Term (Next 3-6 months)
1. **Diagonal Movement** - Relatively simple to implement
2. **Move + Trap Combo** - Adds immediate depth
3. **Diagonal Trapping** - Natural extension of diagonal movement

### Tier 2: Mid-Term (6-12 months)
4. **Reactive/Conditional Bots** - More complex, needs turn order system
5. **Basic Creature Abilities** - Start with 2-3 simple abilities
6. **Trap Upgrades** - Add variety to defensive play

### Tier 3: Long-Term (12+ months)
7. **Multi-Step Moves** - Requires significant UI/UX work
8. **Team Mechanics** - Major gameplay shift
9. **Board Hazards** - Needs board generator updates
10. **Resource System** - Complete game redesign

---

## Prototyping Strategy

### For Each New Mechanic:

1. **Paper Prototype**
   - Test with physical pieces
   - Validate fun factor before coding
   - Iterate quickly on rules

2. **Isolated Testing**
   - Build mini-version with just new mechanic
   - Separate from main game initially
   - Get feedback from playtesters

3. **Balance Testing**
   - Run simulations (bot vs bot)
   - Track win rates with/without mechanic
   - Adjust parameters

4. **Integration**
   - Add to main game as optional mode
   - "Classic Mode" vs "Advanced Mode"
   - Let players choose

5. **Community Feedback**
   - Discord poll: "Should this become standard?"
   - Analyze usage statistics
   - Iterate based on data

---

## Design Philosophy Questions

### To Consider Before Implementing:

1. **Complexity vs Accessibility**
   - Will new mechanic confuse new players?
   - Can we tutorial it effectively?
   - Is there a learning curve?

2. **Game Length Impact**
   - Does this make games longer or shorter?
   - Is that desirable?
   - Sweet spot: 5-10 minute games?

3. **Strategic Depth**
   - Does this add meaningful decisions?
   - Or just complexity for complexity's sake?
   - "Easy to learn, hard to master"

4. **Balance**
   - Does this favor aggressive or defensive play?
   - Can it be countered?
   - Is there a dominant strategy?

5. **Fun Factor**
   - Is this mechanic fun to use?
   - Fun to play against?
   - Does it create memorable moments?

---

## Community Input

### Ideas to Crowdsource:
- Discord polls for favorite mechanics
- Playtest sessions for new features
- "Mechanic of the Month" voting
- Community-designed creatures/abilities

### Feedback Loop:
1. Share concept doc in Discord
2. Create prototype
3. Beta test with volunteers
4. Iterate based on feedback
5. Official release
6. Monitor metrics
7. Adjust as needed

---

## Technical Considerations

### Architecture Changes Needed:

**For Reactive Bots**:
- Turn order system
- State machine for "waiting" vs "committed"
- Replay/history system
- Network protocol for sequential moves

**For Diagonal Movement**:
- Update pathfinding algorithms
- New movement validation logic
- UI updates for 8-direction indicators
- Board generation considers diagonal paths

**For Move + Trap Combo**:
- Action bundling system
- Transaction-like move execution (atomic)
- Rollback if move fails
- Animation choreography

**For Abilities/Upgrades**:
- Creature type system
- Ability registry/plugin system
- Extensible for future additions
- Balance configuration files

---

## Success Metrics

### How to Measure if New Mechanic Works:

1. **Engagement**
   - % of games using the mechanic
   - Repeat usage rate
   - Time spent in games with mechanic

2. **Balance**
   - Win rate: mechanic users vs non-users
   - Should be ~50/50
   - No dominant strategy

3. **Satisfaction**
   - Post-game surveys
   - Discord sentiment
   - Retention rate

4. **Complexity**
   - Tutorial completion rate
   - Error rate (invalid moves)
   - Time to first successful use

---

## Next Steps

1. **Prioritize**: Which mechanic to prototype first?
2. **Paper Prototype**: Test offline before coding
3. **Gather Feedback**: Share with early adopters
4. **Build Minimum Viable Version**: Just enough to test
5. **Iterate**: Based on playtesting data
6. **Polish**: Once validated, make it shine
7. **Release**: Ship to production
8. **Monitor**: Watch the metrics
9. **Adjust**: Fine-tune based on real usage

---

## Notes & Random Ideas

- **Fog of War**: Can't see enemy creatures until adjacent?
- **Decoy**: Fake creature that doesn't move
- **Swap**: Force swap positions with enemy
- **Teleport**: Jump to any space (once per game)
- **Shield**: Block one trap
- **Double Move**: Move twice in one turn (cooldown)
- **Trap Detector**: Reveal nearby traps
- **Trap Disarm**: Remove enemy trap
- **Clone**: Create duplicate of creature
- **Sacrifice**: Remove your creature to trigger effect
- **Resurrect**: Bring back trapped creature
- **Board Flip**: Rotate/mirror board mid-game
- **Wild Card**: Random effect each game

---

## Reference Games

**Games with Similar Mechanics**:
- **Chess**: Conditional moves (castling), diagonal movement
- **Stratego**: Hidden information, reactive play
- **Advance Wars**: Terrain, unit abilities, resource management
- **Fire Emblem**: Turn order, weapon triangle, support
- **Laser Chess**: Path prediction, combo moves
- **Onitama**: Card-based movement patterns

**Lessons to Learn**:
- Keep core rules simple
- Add complexity through combinations
- Always allow counterplay
- Visual clarity is paramount
- Test, test, test!

---

## Conclusion

These mechanics represent exciting possibilities for deepening Spaces Game's strategic elements. The key is to introduce them gradually, test thoroughly, and always prioritize fun over complexity.

**Remember**: The best games are easy to learn but impossible to master. Each new mechanic should serve that goal.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-29
**Status**: Brainstorming / Planning
**Next Review**: After Phase 1 of email integration complete
