Implementation Plan: Tutorial Wizard for Spaces Game

  I've reviewed the codebase and the requirements. Here's a comprehensive plan to implement the getting-started tutorial
  wizard:

  Overview

  The tutorial wizard will appear before the normal profile creation screen and guide new players through:
  1. Meeting CPU Sam and choosing their creature
  2. Creating their first 2×2 board with guided instructions
  3. Playing their first round against CPU Sam
  4. Entering their name
  5. Being welcomed by CPU Tougher

  Key Changes

  1. Rename CPU to "CPU Sam" (Easy)

  - Update src/constants/game-rules.ts: CPU_OPPONENT_NAME = 'CPU Sam'
  - This will automatically update all references throughout the app

  2. Add Tutorial Phases

  Add new phases to GamePhase type in src/types/game-state.ts:
  | { type: 'tutorial-intro' }  // Step 1: Introduction + creature selection
  | { type: 'tutorial-board-creation'; playerCreature: CreatureId; cpuSamData: { name: string; creature: CreatureId } }
  | { type: 'tutorial-results'; result: RoundResult; playerBoard: Board }
  | { type: 'tutorial-name-entry'; playerCreature: CreatureId; opponentCreature: CreatureId; firstBoard: Board }
  | { type: 'tutorial-complete' }  // Triggers welcome modal

  3. New Components to Create

  A. TutorialIntro.tsx - First screen
  - Displays bug forward image (/creatures/bug/forward.svg)
  - Shows text: "CPU Sam thinks their bot can get to the goal before yours! Let me show you how to take them on!"
  - Skip button (lower right) → jumps to normal user-setup phase
  - Link to open CpuSamCustomizer modal
  - Creature selector for player (reuse from UserProfile)
  - Next button → advances to tutorial-board-creation

  B. CpuSamCustomizer.tsx - Modal component
  - Text input for CPU Sam's name (default: "CPU Sam")
  - Creature selector for CPU Sam (default: bug)
  - Save/Cancel buttons

  C. TutorialBoardCreator.tsx - Board creation with dynamic text
  - Wraps the existing BoardCreator component
  - Dynamic instruction text based on board state:
    - Initial: "first, choose a start square"
    - After start selected: "now you can program your bot to set a trap or move"
    - If piece in row 1: "now choose a move in the top row"
    - When final move enabled: "alright! click the final move button to save the board!"
    - If player traps themselves: "oh no! that will trap your bot! reset to try again"
  - Detects trap usage (important for CPU board selection)

  D. TutorialNameEntry.tsx - Name entry step
  - Shows text: "well played! go against the tougher cpu or keep showing CPU Sam what you're made of! Oh hang on! What's
  should I call you?"
  - Reuses name input from UserProfile component
  - Continue button → creates full user profile and advances to tutorial-complete

  E. WelcomeModal.tsx - CPU Tougher introduction
  - Shows modal over main board-management screen
  - Text: "Nice to meet you [playername]! See you on the boards... I'm CPU Tougher :)"
  - Close/OK button

  4. CPU Board Selection Logic

  When player clicks "Final Move" in tutorial board creation:
  - Check if player placed any traps (scan sequence for type: 'trap')
  - If player set trap: Choose CPU Sam board that gets trapped (e.g., CPU Left Column but player set trap at (0,0))
  - If no trap: Choose CPU Sam board that reaches goal (e.g., CPU Left Column or Right Column)
  - Run simulation with simulateRound()
  - Show RoundResults component (reuse existing)

  5. Different Icons for CPU Sam vs CPU Tougher

  Add visual differentiation:
  - CPU Sam: 🤖 or 👾
  - CPU Tougher: 🤖💪 or 🦾
  - Can be handled in the UI where opponents are displayed

  6. App.tsx Changes

  Update createInitialState():
  const phase: GameState['phase'] = user && user.name
    ? { type: 'board-management' }
    : { type: 'tutorial-intro' };  // Start with tutorial instead of user-setup

  Add new phase handlers in renderPhase():
  - tutorial-intro → render <TutorialIntro />
  - tutorial-board-creation → render <TutorialBoardCreator />
  - tutorial-results → render <RoundResults /> with custom continue text
  - tutorial-name-entry → render <TutorialNameEntry />

  Add state for welcome modal:
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  Show welcome modal when phase transitions to board-management after tutorial completion.

  Reusable Components

  The plan maximizes code reuse:
  - ✅ UserProfile → creature selection + name input
  - ✅ BoardCreator → wrapped by TutorialBoardCreator
  - ✅ RoundResults → tutorial results display
  - ✅ Existing creature graphics system
  - ✅ simulateRound() → tutorial round simulation

  Data Flow

  1. Start: tutorial-intro phase
  2. Player selects creature + Next: → tutorial-board-creation
  3. Player creates board + Final Move:
    - Select CPU Sam board based on trap detection
    - Run simulation
    - → tutorial-results
  4. Player clicks Continue: → tutorial-name-entry
  5. Player enters name + Continue:
    - Create full UserProfile with stats, creatures, first board
    - → board-management + show WelcomeModal
  6. Player closes modal: Normal game begins

  Benefits of This Approach

  ✅ Reuses existing components - minimal new code
  ✅ Type-safe - uses discriminated union phases
  ✅ Maintains game architecture - fits within existing state machine
  ✅ Skip option - advanced users can bypass tutorial
  ✅ Educational - teaches core mechanics step-by-step
  ✅ Personalized - player customizes both their creature and CPU Sam

  ---
  Does this plan look good to you? Should I proceed with the implementation?

  Todos
  ☐ Rename CPU to 'CPU Sam' in constants and default data
  ☐ Add tutorial wizard phases to GamePhase type in game-state.ts
  ☐ Create TutorialIntro component with bug creature, CPU Sam customization, and player creature selection
  ☐ Create TutorialBoardCreator component with dynamic instruction text
  ☐ Create CpuSamCustomizer modal component for customizing CPU Sam name and creature
  ☐ Create TutorialNameEntry component for player name input
  ☐ Create WelcomeModal component introducing CPU Tougher
  ☐ Add logic to select appropriate CPU Sam board based on player trap usage
  ☐ Update App.tsx to start with tutorial wizard and handle all tutorial phases
  ☐ Add different icons/emojis for CPU Sam vs CPU Tougher
  ☐ Test complete tutorial wizard flow end-to-end

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
> 
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ? for shortcuts
