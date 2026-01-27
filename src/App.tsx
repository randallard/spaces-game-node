import React, { useEffect, useState, useRef } from 'react';
import styles from './App.module.css';
import { useGameState } from '@/hooks/useGameState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { simulateRound, simulateAllRounds, isBoardPlayable } from '@/utils/game-simulation';
import { initializeDefaultCpuData, initializeCpuTougherData, generateCpuBoardsForSize, generateCpuDeckForSize } from '@/utils/default-cpu-data';
import { getOpponentIcon, createInitialState } from '@/utils/app-helpers';
import { updateOpponentStats, createHumanOpponent } from '@/utils/opponent-helpers';
import { getNextUnlock, isDeckModeUnlocked, getFeatureUnlocks } from '@/utils/feature-unlocks';
import { generateChallengeUrl, generateChallengeUrlShortened, generateFinalResultsUrl, getChallengeFromUrl, getChallengeFromUrlAsync, clearChallengeFromUrl, hasChallengeInUrl } from '@/utils/challenge-url';
import { decodeMinimalBoard } from '@/utils/board-encoding';
import { fetchRemoteCpuBoards, fetchRemoteCpuDeck } from '@/utils/remote-cpu-boards';
import { getApiEndpoint } from '@/config/api';
import { markRoundCompleted, markRoundPending, hasCompletedRound, getGameProgress } from '@/utils/game-progress';
import { getActiveGames, saveActiveGame, removeActiveGame, archiveActiveGame, type ActiveGameInfo } from '@/utils/active-games';
import {
  UserProfile,
  OpponentManager,
  OpponentAvatar,
  ActiveGameView,
  SavedBoards,
  BoardSizeSelector,
  RoundResults,
  GameOver,
  ProfileModal,
  DeckCreator,
  DeckManager,
  AllRoundsResults,
  TutorialIntro,
  TutorialBoardCreator,
  TutorialNameEntry,
  WelcomeModal,
  GeneratingModal,
  FeatureUnlockModal,
  ShareChallenge,
  ChallengeReceivedModal,
  CompletedRoundModal,
  ActiveGames,
  RemoveOpponentModal,
} from '@/components';
import { CompletedGames } from '@/components/CompletedGames';
import { LoadingChallenge } from '@/components/LoadingChallenge';
import type { UserProfile as UserProfileType, Board, Opponent, GameState, GamePhase, Deck, GameMode, CreatureId, RoundResult } from '@/types';
import { UserProfileSchema, BoardSchema, OpponentSchema, DeckSchema } from '@/schemas';
import { CPU_OPPONENT_ID, CPU_TOUGHER_OPPONENT_ID, CPU_OPPONENT_NAME } from '@/constants/game-rules';
import { deriveCurrentRound, deriveWhoMovesFirst, isRoundComplete } from '@/utils/derive-state';
import { FEATURES } from '@/config/features';
import { z } from 'zod';

// Type for storing round results with metadata for retrieval
type StoredRoundResult = RoundResult & {
  gameId: string; // Unique game session ID
  opponentId: string;
  opponentName: string;
  boardSize: number;
  timestamp: number;
};

function App(): React.ReactElement {
  // LocalStorage for persistence
  const [savedUser, setSavedUser] = useLocalStorage<UserProfileType | null>(
    'spaces-game-user',
    UserProfileSchema.nullable(),
    null
  );

  // Debug: log initial user
  useEffect(() => {
    console.log('[APP] savedUser changed:', savedUser?.name || 'null');
  }, [savedUser]);

  // Handle Discord OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordId = params.get('discord_id');
    const discordUsername = params.get('discord_username');
    const discordAvatar = params.get('discord_avatar');

    if (discordId && discordUsername && savedUser) {
      console.log('[APP] Discord OAuth callback detected, updating user profile:', {
        discordId,
        discordUsername,
        discordAvatar,
      });

      // Update user profile with Discord info
      const updatedUser: UserProfileType = {
        ...savedUser,
        discordId,
        discordUsername,
        discordAvatar: discordAvatar || undefined,
      };

      setSavedUser(updatedUser);

      // Clean URL by removing Discord params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('discord_id');
      newUrl.searchParams.delete('discord_username');
      newUrl.searchParams.delete('discord_avatar');
      window.history.replaceState({}, '', newUrl.toString());

      // Check where user was before OAuth
      const returnTo = sessionStorage.getItem('discord-oauth-return');
      const savedStateJson = sessionStorage.getItem('discord-oauth-saved-state');
      sessionStorage.removeItem('discord-oauth-return');
      sessionStorage.removeItem('discord-oauth-saved-state');

      console.log('[APP] Discord connection successful! User updated.', { returnTo });

      // Restore game state if we were in share-challenge or round-review flow
      if ((returnTo === 'share-challenge' || returnTo === 'round-review') && savedStateJson) {
        try {
          const savedState = JSON.parse(savedStateJson);
          // Update the saved state with the new user info
          savedState.user = updatedUser;
          loadState(savedState);
          console.log('[APP] Restored game state after Discord OAuth to', returnTo);
        } catch (error) {
          console.error('[APP] Failed to restore game state:', error);
        }
      }

      // If we were creating an opponent, navigate back to add-opponent phase
      if (returnTo === 'opponent-creation') {
        loadState({
          ...state,
          user: updatedUser, // Update user with new Discord info
          phaseOverride: { type: 'add-opponent' },
        });
        console.log('[APP] Returned to opponent creation after Discord OAuth');
      }

      // Don't reload - the user state is already updated
      // The React state will update automatically via useEffect dependencies
    }
  }, [savedUser, setSavedUser]);

  const [savedBoards, setSavedBoards] = useLocalStorage<Board[] | null>(
    'spaces-game-boards',
    BoardSchema.array(),
    []
  );

  const [savedOpponents, setSavedOpponents] = useLocalStorage<Opponent[] | null>(
    'spaces-game-opponents',
    OpponentSchema.array(),
    []
  );

  const [savedDecks, setSavedDecks] = useLocalStorage<Deck[] | null>(
    'spaces-game-decks',
    DeckSchema.array(),
    []
  );

  // Separate storage for CPU boards and decks (hidden from player)
  const [cpuBoards, setCpuBoards] = useLocalStorage<Board[] | null>(
    'spaces-game-cpu-boards',
    BoardSchema.array(),
    []
  );

  // Storage for remote CPU boards (fetched from GitHub Pages)
  const [remoteCpuBoards, setRemoteCpuBoards] = useLocalStorage<Board[] | null>(
    'spaces-game-remote-cpu-boards',
    BoardSchema.array(),
    []
  );

  // LocalStorage for round results (keep last 100 rounds across all games)
  const [savedRoundResults, setSavedRoundResults] = useLocalStorage<StoredRoundResult[]>(
    'spaces-game-round-results',
    z.any().array(), // Use any for now since we don't have a StoredRoundResult schema
    []
  );

  const [cpuDecks, setCpuDecks] = useLocalStorage<Deck[] | null>(
    'spaces-game-cpu-decks',
    DeckSchema.array(),
    []
  );

  // State for shortened challenge URL and fallback compressed URL (for ActiveGameView)
  const [shortenedChallengeUrl, setShortenedChallengeUrl] = useState<string | null>(null);
  const [fallbackCompressedUrl, setFallbackCompressedUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [lastNotificationTimestamp, setLastNotificationTimestamp] = useState<string | null>(null);

  // Initialize default CPU data on first load
  useEffect(() => {
    // Check if CPU opponents already exist
    const cpuExists = savedOpponents?.some(o => o.id === CPU_OPPONENT_ID);
    const cpuTougherExists = savedOpponents?.some(o => o.id === CPU_TOUGHER_OPPONENT_ID);

    // Check if CPU boards exist (at least 3 for each size)
    const cpuBoards2x2 = (cpuBoards || []).filter(b => b.boardSize === 2 && b.name.startsWith(CPU_OPPONENT_NAME));
    const cpuBoards3x3 = (cpuBoards || []).filter(b => b.boardSize === 3 && b.name.startsWith(CPU_OPPONENT_NAME));
    const cpuTougherBoards2x2 = (cpuBoards || []).filter(b => b.boardSize === 2 && b.name.startsWith('CPU Tougher'));
    const cpuTougherBoards3x3 = (cpuBoards || []).filter(b => b.boardSize === 3 && b.name.startsWith('CPU Tougher'));

    // Check if CPU decks exist with proper names
    const cpuDeck2x2Exists = cpuDecks?.some(d => d.name === 'CPU Sam 2×2 Deck');
    const cpuDeck3x3Exists = cpuDecks?.some(d => d.name === 'CPU Sam 3×3 Deck');
    const cpuTougherDeck2x2Exists = cpuDecks?.some(d => d.name === 'CPU Tougher 2×2 Deck');
    const cpuTougherDeck3x3Exists = cpuDecks?.some(d => d.name === 'CPU Tougher 3×3 Deck');

    const newOpponents: Opponent[] = [];
    const newCpuBoards: Board[] = [];
    let updatedCpuDecks = cpuDecks || [];

    // Initialize regular CPU opponent if it doesn't exist OR if boards/decks are missing
    if (!cpuExists || cpuBoards2x2.length < 3 || cpuBoards3x3.length < 3 || !cpuDeck2x2Exists || !cpuDeck3x3Exists) {
      console.log('[APP] Initializing default CPU opponent, boards, and decks');
      const defaultData = initializeDefaultCpuData();

      if (!cpuExists) {
        newOpponents.push(defaultData.opponent);
      }

      // Only add boards if they don't exist (at least 3)
      if (cpuBoards2x2.length < 3) {
        newCpuBoards.push(...defaultData.boards2x2);
      }
      if (cpuBoards3x3.length < 3) {
        newCpuBoards.push(...defaultData.boards3x3);
      }

      // Remove old CPU decks and add new ones
      if (!cpuDeck2x2Exists || !cpuDeck3x3Exists) {
        console.log('[APP] Adding CPU decks:', defaultData.deck2x2.name, defaultData.deck3x3.name);
        updatedCpuDecks = updatedCpuDecks.filter(
          d => d.name !== 'CPU Sam 2×2 Deck' && d.name !== 'CPU 3×3 Deck' && d.name !== 'CPU 2×2 Deck'
        );
        updatedCpuDecks.push(defaultData.deck2x2, defaultData.deck3x3);
      }
    }

    // Initialize CPU Tougher opponent if it doesn't exist OR if boards/decks are missing
    if (!cpuTougherExists || cpuTougherBoards2x2.length < 3 || cpuTougherBoards3x3.length < 3 || !cpuTougherDeck2x2Exists || !cpuTougherDeck3x3Exists) {
      console.log('[APP] Initializing CPU Tougher opponent, boards, and decks');
      const tougherData = initializeCpuTougherData();

      if (!cpuTougherExists) {
        newOpponents.push(tougherData.opponent);
      }

      // Only add boards if they don't exist (at least 3)
      if (cpuTougherBoards2x2.length < 3) {
        console.log('[APP] Adding CPU Tougher 2x2 boards:', tougherData.boards2x2.map(b => b.name));
        newCpuBoards.push(...tougherData.boards2x2);
      }
      if (cpuTougherBoards3x3.length < 3) {
        console.log('[APP] Adding CPU Tougher 3x3 boards:', tougherData.boards3x3.map(b => b.name));
        newCpuBoards.push(...tougherData.boards3x3);
      }

      // Remove old CPU Tougher decks and add new ones
      if (!cpuTougherDeck2x2Exists || !cpuTougherDeck3x3Exists) {
        console.log('[APP] Adding CPU Tougher decks:', tougherData.deck2x2.name, tougherData.deck3x3.name);
        updatedCpuDecks = updatedCpuDecks.filter(
          d => d.name !== 'CPU Tougher 2×2 Deck' && d.name !== 'CPU Tougher 3×3 Deck'
        );
        updatedCpuDecks.push(tougherData.deck2x2, tougherData.deck3x3);
      }
    }

    // Add any new opponents
    if (newOpponents.length > 0) {
      setSavedOpponents([...(savedOpponents || []), ...newOpponents]);
    }

    // Add any new CPU boards (but don't re-add if they already exist)
    if (newCpuBoards.length > 0) {
      const existingBoardIds = new Set((cpuBoards || []).map(b => b.id));
      const uniqueNewBoards = newCpuBoards.filter(b => !existingBoardIds.has(b.id));
      if (uniqueNewBoards.length > 0) {
        setCpuBoards([...(cpuBoards || []), ...uniqueNewBoards]);
      }
    }

    // Update CPU decks if any were added
    if (updatedCpuDecks.length !== (cpuDecks || []).length) {
      console.log('[APP] Updating CPU decks storage with', updatedCpuDecks.length, 'decks');
      setCpuDecks(updatedCpuDecks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - we intentionally don't include savedOpponents/cpuBoards/cpuDecks

  // Initialize game state with saved user or null
  const [initialState] = useState<GameState>(() =>
    createInitialState(savedUser)
  );

  // Initialize game state hook
  const {
    state,
    // Derived values (computed from state.roundHistory)
    phase,
    currentRound,
    playerScore,
    opponentScore,
    playerSelectedBoard,
    opponentSelectedBoard,
    // Actions
    setPhase,
    clearPhaseOverride,
    setGameMode,
    setBoardSize,
    selectPlayerBoard: selectPlayerBoardAction,
    selectOpponentBoard: selectOpponentBoardAction,
    selectPlayerDeck,
    selectOpponentDeck,
    completeRound,
    completeAllRounds,
    endGame,
    resetGame,
    loadState,
  } = useGameState(initialState);

  // Generate shortened challenge URL and fallback compressed URL when player selects board
  useEffect(() => {
    const generateShortenedUrl = async () => {
      // Skip if URLs are already being generated or already set
      if (playerSelectedBoard && state.gameId && state.opponent?.type === 'human' && !isGeneratingUrl && !shortenedChallengeUrl) {
        setIsGeneratingUrl(true);

        // Filter to only include COMPLETE rounds for previousRoundResults
        // A round is complete if it has both boards AND a winner (not undefined or null)
        const completeRounds = state.roundHistory.filter(r => {
          const hasBoards = r.playerBoard && r.opponentBoard;
          const hasWinner = r.winner !== undefined && r.winner !== null;
          const isComplete = hasBoards && hasWinner;
          console.log(`[generateUrl] Round ${r.round}: hasBoards=${hasBoards}, hasWinner=${hasWinner}, winner=${r.winner}, isComplete=${isComplete}`);
          return isComplete;
        });

        console.log('[generateUrl] Total rounds in history:', state.roundHistory.length);
        console.log('[generateUrl] Complete rounds:', completeRounds.length, completeRounds.map(r => `R${r.round}:${r.winner}`));

        // Always generate the compressed URL as fallback
        const compressedUrl = generateChallengeUrl(
          playerSelectedBoard,
          currentRound,
          state.gameMode || 'round-by-round',
          state.gameId,
          state.user.id,
          state.user.name,
          playerScore,
          opponentScore,
          savedUser?.discordId,
          savedUser?.discordUsername,
          savedUser?.discordAvatar,
          undefined, // previousRoundResult - removed, using only previousRoundResults
          undefined,
          state.gameCreatorId || undefined,
          completeRounds // Only include complete rounds
        );

        setFallbackCompressedUrl(compressedUrl);

        // Try shortened URL first
        const shortenedUrl = await generateChallengeUrlShortened(
          playerSelectedBoard,
          currentRound,
          state.gameMode || 'round-by-round',
          state.gameId,
          state.user.id,
          state.user.name,
          playerScore,
          opponentScore,
          savedUser?.discordId,
          savedUser?.discordUsername,
          savedUser?.discordAvatar,
          undefined, // previousRoundResult - removed, using only previousRoundResults
          undefined,
          state.gameCreatorId || undefined,
          completeRounds // Only include complete rounds
        );

        // Use shortened if available, otherwise use compressed
        setShortenedChallengeUrl(shortenedUrl || compressedUrl);
        setIsGeneratingUrl(false);
      } else if (!playerSelectedBoard || !state.gameId || state.opponent?.type !== 'human') {
        // Reset URLs when conditions aren't met
        setShortenedChallengeUrl(null);
        setFallbackCompressedUrl(null);
        setIsGeneratingUrl(false);
      }
    };

    generateShortenedUrl();
  }, [playerSelectedBoard, state.gameId, state.opponent?.type]);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Deck creator state
  const [showDeckCreator, setShowDeckCreator] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Welcome modal state (CPU Tougher introduction)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Board selection loading state
  const [isSimulatingRound, setIsSimulatingRound] = useState(false);

  // CPU generation state
  const [isGeneratingCpuBoards, setIsGeneratingCpuBoards] = useState(false);
  const [generatingSize, setGeneratingSize] = useState<number>(2);

  // Feature unlock modal state
  const [showFeatureUnlockModal, setShowFeatureUnlockModal] = useState(false);
  const [unlockedBoardSizes, setUnlockedBoardSizes] = useState<number[]>([]);
  const [deckModeJustUnlocked, setDeckModeJustUnlocked] = useState(false);

  // Track which game counts we've already shown unlock notifications for
  const shownUnlocksRef = useRef<Set<number>>(new Set());

  // Incoming challenge state (preserved through tutorial if user is new)
  const [incomingChallenge, setIncomingChallenge] = useState<ReturnType<typeof getChallengeFromUrl>>(null);

  // Show challenge received modal
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Share challenge modal state (for round-review re-send link)
  const [showShareModal, setShowShareModal] = useState(false);

  // Active games state
  const [activeGames, setActiveGames] = useState<ActiveGameInfo[]>(() => getActiveGames());

  // Discord connection loading state
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);

  // Completed round modal state
  const [showCompletedRoundModal, setShowCompletedRoundModal] = useState(false);
  const [completedRoundInfo, setCompletedRoundInfo] = useState<{ opponentName: string; round: number } | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Panel minimize state
  const [isOpponentsMinimized, setIsOpponentsMinimized] = useState(false);
  const [isBoardsMinimized, setIsBoardsMinimized] = useState(false);
  const [isCompletedGamesMinimized, setIsCompletedGamesMinimized] = useState(false);

  // Remove opponent modal state
  const [opponentToRemove, setOpponentToRemove] = useState<Opponent | null>(null);

  // Board creation state - size to create when navigating to board management
  const [boardSizeToCreate, setBoardSizeToCreate] = useState<number | null>(null);
  // Track if we're creating a board mid-game (to return to board-selection after)
  const [isCreatingBoardMidGame, setIsCreatingBoardMidGame] = useState(false);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (state.user.name) {
      // Only save if user has actually changed (deep equality check)
      const userChanged = JSON.stringify(savedUser) !== JSON.stringify(state.user);
      if (userChanged) {
        console.log('[APP] Saving user to localStorage:', state.user.name);
        setSavedUser(state.user);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  // Save active game state when it changes
  useEffect(() => {
    saveActiveGame(state);
    setActiveGames(getActiveGames());

    // Note: We no longer auto-remove games when they reach game-over
    // Instead, completed games (Round 6 marker) appear in the Completed Games panel
    // Users can manually archive/delete them from there
  }, [state]);

  // Detect feature unlocks when totalGames changes
  useEffect(() => {
    const currentGames = state.user.stats.totalGames;

    // Only check for unlocks if we're in game-over or all-rounds-results phase
    // This ensures we show the modal right after a game completes
    if (currentGames === 0 || (phase.type !== 'game-over' && phase.type !== 'all-rounds-results')) {
      return;
    }

    // Skip if we've already shown unlocks for this game count
    if (shownUnlocksRef.current.has(currentGames)) {
      return;
    }

    const previousGames = currentGames - 1;

    // Get unlocks before and after
    const previousUnlocks = getFeatureUnlocks({ ...state.user, stats: { ...state.user.stats, totalGames: previousGames } });
    const currentUnlocks = getFeatureUnlocks(state.user);

    // Find newly unlocked board sizes
    const newBoardSizes = currentUnlocks.boardSizes.filter(
      size => !previousUnlocks.boardSizes.includes(size)
    );

    // Check if deck mode was just unlocked
    const newDeckMode = currentUnlocks.deckMode && !previousUnlocks.deckMode;

    // Show modal if anything was unlocked
    if (newBoardSizes.length > 0 || newDeckMode) {
      setUnlockedBoardSizes(newBoardSizes);
      setDeckModeJustUnlocked(newDeckMode);
      setShowFeatureUnlockModal(true);
      // Mark this game count as shown
      shownUnlocksRef.current.add(currentGames);
    }
  }, [state.user.stats.totalGames, state.user, phase.type]);

  // Helper function to save a round result to localStorage
  const saveRoundResult = (result: RoundResult, gameId: string | null, opponent: Opponent | null, boardSize: number) => {
    if (!opponent || !gameId) {
      console.warn('[saveRoundResult] Missing opponent or gameId, not saving');
      return;
    }

    const storedResult: StoredRoundResult = {
      ...result,
      gameId,
      opponentId: opponent.id,
      opponentName: opponent.name,
      boardSize,
      timestamp: Date.now(),
    };

    console.log('[saveRoundResult] Saving round', result.round, 'for gameId:', gameId);

    // Remove any existing result for this game and round, then add the new one
    const existingResults = savedRoundResults || [];
    const filteredResults = existingResults.filter(r => !(r.gameId === gameId && r.round === result.round));
    const updatedResults = [storedResult, ...filteredResults].slice(0, 100);
    setSavedRoundResults(updatedResults);

    console.log('[saveRoundResult] Total saved results now:', updatedResults.filter(r => r.gameId === gameId).length, 'for this game');
  };

  // Helper function to swap player/opponent perspectives in a round result
  const swapRoundResultPerspective = (result: RoundResult): RoundResult => {
    const swapped: RoundResult = {
      round: result.round,
      winner: result.winner === 'player' ? 'opponent' : result.winner === 'opponent' ? 'player' : 'tie',
      playerBoard: result.opponentBoard,
      opponentBoard: result.playerBoard,
      playerFinalPosition: result.opponentFinalPosition,
      opponentFinalPosition: result.playerFinalPosition,
    };

    // Add optional fields only if they exist
    if (result.opponentPoints !== undefined) swapped.playerPoints = result.opponentPoints;
    if (result.playerPoints !== undefined) swapped.opponentPoints = result.playerPoints;
    if (result.playerOutcome) swapped.playerOutcome = result.playerOutcome === 'won' ? 'lost' : result.playerOutcome === 'lost' ? 'won' : result.playerOutcome;
    if (result.opponentVisualOutcome) swapped.playerVisualOutcome = result.opponentVisualOutcome;
    if (result.playerVisualOutcome) swapped.opponentVisualOutcome = result.playerVisualOutcome;
    if (result.opponentCreature) swapped.playerCreature = result.opponentCreature;
    if (result.playerCreature) swapped.opponentCreature = result.playerCreature;
    if (result.collision !== undefined) swapped.collision = result.collision;

    if (result.simulationDetails) {
      // Helper to rotate position 180 degrees
      const rotatePosition = (row: number, col: number, size: number) => ({
        row: size - 1 - row,
        col: size - 1 - col,
      });

      const boardSize = result.playerBoard.boardSize;

      swapped.simulationDetails = {
        playerMoves: result.simulationDetails.opponentMoves,
        opponentMoves: result.simulationDetails.playerMoves,
        playerHitTrap: result.simulationDetails.opponentHitTrap,
        opponentHitTrap: result.simulationDetails.playerHitTrap,
        playerLastStep: result.simulationDetails.opponentLastStep,
        opponentLastStep: result.simulationDetails.playerLastStep,
        ...(result.simulationDetails.opponentTrapPosition && {
          // Rotate opponent's trap position back for player 2's view
          playerTrapPosition: rotatePosition(
            result.simulationDetails.opponentTrapPosition.row,
            result.simulationDetails.opponentTrapPosition.col,
            boardSize
          ),
        }),
        ...(result.simulationDetails.playerTrapPosition && {
          // Rotate player's trap position back for player 2's view
          opponentTrapPosition: rotatePosition(
            result.simulationDetails.playerTrapPosition.row,
            result.simulationDetails.playerTrapPosition.col,
            boardSize
          ),
        }),
      };
    }

    return swapped;
  };

  // Helper function to load round results for a specific game session
  const loadRoundResults = (gameId: string | null): RoundResult[] => {
    if (!gameId || !savedRoundResults) return [];

    // Filter results for this game session, sorted by round
    return savedRoundResults
      .filter(r => r.gameId === gameId)
      .sort((a, b) => a.round - b.round)
      .map(({ gameId, opponentId, opponentName, boardSize, timestamp, ...roundResult }) => roundResult);
  };

  // Sync round results from active game state to localStorage
  // This fixes cases where round results exist in state but weren't saved to localStorage
  const syncRoundResultsFromState = (gameId: string, stateRoundHistory: RoundResult[], opponent: Opponent, boardSize: number) => {
    if (!gameId || !opponent || !stateRoundHistory || stateRoundHistory.length === 0) return;

    console.log('[syncRoundResultsFromState] Checking for missing rounds in localStorage');

    // Get what's currently in localStorage
    const savedRounds = loadRoundResults(gameId);
    const savedRoundNumbers = new Set(savedRounds.map(r => r.round));

    // Find rounds that are in state but not in localStorage
    const missingRounds = stateRoundHistory.filter(r => !savedRoundNumbers.has(r.round));

    if (missingRounds.length > 0) {
      console.log('[syncRoundResultsFromState] Found', missingRounds.length, 'missing rounds, syncing to localStorage:', missingRounds.map(r => r.round));

      // Save each missing round to localStorage
      missingRounds.forEach(roundResult => {
        saveRoundResult(roundResult, gameId, opponent, boardSize);
      });
    } else {
      console.log('[syncRoundResultsFromState] All rounds already in localStorage');
    }
  };

  // Send Discord notification to opponent
  const sendDiscordNotification = async (
    opponent: Opponent,
    eventType: 'turn-ready' | 'game-complete' | 'challenge-sent' | 'round-complete',
    gameData: {
      round?: number;
      playerName: string;
      gameUrl: string;
      boardSize?: number;
      result?: 'win' | 'loss' | 'tie';
      playerScore?: number;
      opponentScore?: number;
    }
  ): Promise<string | null> => {
    // Check if Discord notifications are enabled
    if (!FEATURES.DISCORD_NOTIFICATIONS) {
      console.log('[Discord] Notifications disabled in config, skipping');
      return null;
    }

    // Only send if opponent has Discord connected
    if (!opponent.discordId) {
      console.log('[Discord] Opponent has no Discord ID, skipping notification');
      return null;
    }

    try {
      console.log(`[Discord] Sending ${eventType} notification to ${opponent.name} (${opponent.discordId})`);

      const response = await fetch(getApiEndpoint('/api/discord/notify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordId: opponent.discordId,
          eventType,
          gameData,
        }),
      });

      if (!response.ok) {
        console.error('[Discord] Failed to send notification:', await response.text());
        return null;
      } else {
        const timestamp = new Date().toISOString();
        console.log('[Discord] ✅ Notification sent successfully at', timestamp);
        return timestamp;
      }
    } catch (error) {
      console.error('[Discord] Error sending notification:', error);
      return null;
    }
  };

  // Handle accepting a challenge
  const handleAcceptChallenge = () => {
    if (!incomingChallenge) return;

    try {
      // Check if player has already completed this round
      // BUT: If the challenge includes round results (isRoundComplete, previousRoundResult, or isFinalResults),
      // it means both players have completed and we should show round review or final results, not block
      const playerCompletedRound = hasCompletedRound(incomingChallenge.gameId, incomingChallenge.round);
      const hasBothPlayersCompletedData = incomingChallenge.isRoundComplete || incomingChallenge.previousRoundResult || incomingChallenge.isFinalResults;

      if (playerCompletedRound && !hasBothPlayersCompletedData) {
        console.log('[handleAcceptChallenge] Round already completed (no opponent data), showing modal');
        setCompletedRoundInfo({
          opponentName: incomingChallenge.playerName,
          round: incomingChallenge.round,
        });
        setShowCompletedRoundModal(true);
        setShowChallengeModal(false);
        setIncomingChallenge(null);
        clearChallengeFromUrl();
        return;
      }

      // Check if player has a pending round (selected board but didn't share yet)
      const progress = getGameProgress(incomingChallenge.gameId);
      if (progress && progress.pendingRound && progress.pendingRound < incomingChallenge.round) {
        // Player skipped sharing a previous round - should handle that first
        console.log('[handleAcceptChallenge] Player has pending round', progress.pendingRound);
        // For now, we'll allow them to continue with the new round
        // In the future, we might want to show a warning or redirect them
      }

      // Load round history from localStorage using gameId
      let roundHistory = loadRoundResults(incomingChallenge.gameId);
      console.log('[handleAcceptChallenge] Loaded roundHistory from localStorage:', roundHistory.length, 'rounds');

      // Find opponent first (needed for sync)
      const opponentForSync = (savedOpponents || []).find(o => o.id === incomingChallenge.playerId);

      // Check if we have a saved active game with more complete history
      const savedActiveGame = getActiveGames(true).find(g => g.gameId === incomingChallenge.gameId);
      if (savedActiveGame && opponentForSync && savedActiveGame.fullState.roundHistory.length > roundHistory.length) {
        console.log('[handleAcceptChallenge] Found saved active game with more complete history:', savedActiveGame.fullState.roundHistory.length, 'rounds vs', roundHistory.length);
        // Sync the missing rounds from active game to localStorage
        syncRoundResultsFromState(
          incomingChallenge.gameId,
          savedActiveGame.fullState.roundHistory,
          opponentForSync,
          incomingChallenge.boardSize
        );
        // Reload round history after sync
        roundHistory = loadRoundResults(incomingChallenge.gameId);
        console.log('[handleAcceptChallenge] After sync, roundHistory now has:', roundHistory.length, 'rounds');
      }

      // If challenge includes ALL previous round results, sync them (new format)
      if (incomingChallenge.previousRoundResults && incomingChallenge.previousRoundResults.length > 0) {
        console.log('[handleAcceptChallenge] Challenge includes', incomingChallenge.previousRoundResults.length, 'previous rounds');
        const existingRoundNumbers = new Set(roundHistory.map(r => r.round));
        const missingRounds = incomingChallenge.previousRoundResults.filter(r => !existingRoundNumbers.has(r.round));

        if (missingRounds.length > 0 && opponentForSync) {
          console.log('[handleAcceptChallenge] Syncing', missingRounds.length, 'missing rounds from challenge:', missingRounds.map(r => r.round));
          missingRounds.forEach(result => {
            // Swap perspective since results are from opponent's point of view
            const swappedResult = swapRoundResultPerspective(result);
            saveRoundResult(
              swappedResult,
              incomingChallenge.gameId,
              opponentForSync,
              incomingChallenge.boardSize
            );
          });
          // Reload round history after syncing all missing rounds
          roundHistory = loadRoundResults(incomingChallenge.gameId);
          console.log('[handleAcceptChallenge] After syncing all rounds, roundHistory now has:', roundHistory.length, 'rounds');
        }
      }
      // Fallback: If challenge includes a single previous round result (old format), save it
      else if (incomingChallenge.previousRoundResult) {
        const previousRoundNumber = incomingChallenge.previousRoundResult.round;
        const hasThisRound = roundHistory.some(r => r.round === previousRoundNumber);

        if (!hasThisRound) {
          console.log('[handleAcceptChallenge] Saving missing round result from challenge:', previousRoundNumber);
          // Find opponent to save result
          const opponent = (savedOpponents || []).find(o => o.id === incomingChallenge.playerId);
          if (opponent) {
            // Swap perspective since result is from opponent's point of view
            const swappedResult = swapRoundResultPerspective(incomingChallenge.previousRoundResult);
            saveRoundResult(
              swappedResult,
              incomingChallenge.gameId,
              opponent,
              incomingChallenge.boardSize
            );
            // Add the round result to history immediately (don't wait for state update)
            roundHistory = [...roundHistory, swappedResult].sort((a, b) => a.round - b.round);
          }
        }
      }

      // Find opponent
      const opponent = (savedOpponents || []).find(o => o.id === incomingChallenge.playerId);
      if (!opponent) {
        console.error('[handleAcceptChallenge] Opponent not found!');
        return;
      }

      // Decode the board (kept for potential future validation)
      void decodeMinimalBoard(incomingChallenge.playerBoard);

      // Check if ongoing game
      const isOngoingGame = state.gameId === incomingChallenge.gameId;

      // Scores are now derived from roundHistory, not explicitly set
      void (isOngoingGame ? playerScore : 0); // placeholder for future use
      void (isOngoingGame ? opponentScore : 0); // placeholder for future use

      // If this is an ongoing game with history, show round review screen
      if (roundHistory.length > 0) {
        loadState({
          ...state,
          opponent,
          gameId: incomingChallenge.gameId,
          gameCreatorId: incomingChallenge.gameCreatorId || null,
          boardSize: incomingChallenge.boardSize,
          gameMode: incomingChallenge.gameMode,
          roundHistory,
          phaseOverride: { type: 'round-review', round: incomingChallenge.round },
        });
      } else {
        // First round - go directly to board selection
        loadState({
          ...state,
          opponent,
          gameId: incomingChallenge.gameId,
          gameCreatorId: incomingChallenge.gameCreatorId || null,
          boardSize: incomingChallenge.boardSize,
          gameMode: incomingChallenge.gameMode,
          roundHistory,
          phaseOverride: { type: 'board-selection', round: incomingChallenge.round },
        });
      }

      // Close modal and clear challenge
      setShowChallengeModal(false);
      setIncomingChallenge(null);
    } catch (error) {
      console.error('[handleAcceptChallenge] Error:', error);
    }
  };

  // Handle declining a challenge
  const handleDeclineChallenge = () => {
    setShowChallengeModal(false);
    setIncomingChallenge(null);
  };

  // Handle connecting Discord from challenge modal
  const handleConnectDiscordFromChallenge = () => {
    // Set loading state
    setIsConnectingDiscord(true);

    // Save that we're in challenge flow
    sessionStorage.setItem('discord-oauth-return', 'challenge-acceptance');

    // Redirect to Discord OAuth
    window.location.href = getApiEndpoint('/api/auth/discord/authorize');
  };

  // Function to handle incoming challenges
  const handleIncomingChallenge = (challengeData: ReturnType<typeof getChallengeFromUrl>) => {
    if (!challengeData) return;

    // Check if player has already completed this round
    // BUT: If the challenge includes round results (isRoundComplete, previousRoundResult, or isFinalResults),
    // it means both players have completed and we should show round review or final results, not block
    const playerCompletedRound = hasCompletedRound(challengeData.gameId, challengeData.round);
    const hasBothPlayersCompletedData = challengeData.isRoundComplete || challengeData.previousRoundResult || challengeData.isFinalResults;

    if (playerCompletedRound && !hasBothPlayersCompletedData) {
      console.log('[handleIncomingChallenge] Round already completed (no opponent data), showing modal');
      setCompletedRoundInfo({
        opponentName: challengeData.playerName,
        round: challengeData.round,
      });
      setShowCompletedRoundModal(true);
      clearChallengeFromUrl();
      return;
    }

    // Check if player has a pending round (selected board but hasn't shared yet)
    const progress = getGameProgress(challengeData.gameId);
    if (progress && progress.pendingRound && progress.pendingRound === challengeData.round) {
      // This is the pending round they need to finish - allow them to proceed
      console.log('[handleIncomingChallenge] This is the pending round', progress.pendingRound, 'allowing to proceed');
      // Continue with normal flow - they'll select their board again
    } else if (progress && progress.pendingRound && progress.pendingRound < challengeData.round) {
      // They have an older pending round - they should finish that first
      console.log('[handleIncomingChallenge] Player has older pending round', progress.pendingRound);
      // For now, we'll allow them to proceed with the new round
      // In a more robust implementation, we might want to show a warning
      // or force them to complete the older round first
    }

    // Store the challenge data
    setIncomingChallenge(challengeData);

    // If user already exists, show them the challenge immediately
    if (state.user.name) {
      try {
        console.log('[APP] Received challenge:', challengeData);

        // Clear URL
        clearChallengeFromUrl();

        // Decode the opponent's board (skip for final results where playerBoard is "N/A")
        const decodedOpponentBoard = challengeData.isFinalResults
          ? null
          : decodeMinimalBoard(challengeData.playerBoard);

        // Find or create opponent
        // First, try to find by playerId (their canonical ID)
        let opponent = (savedOpponents || []).find(o => o.id === challengeData.playerId);

        // If not found by ID, check if we have an opponent with the same name
        // This handles the case where user manually created an opponent before receiving a challenge
        let existingOpponentByName: Opponent | undefined;
        if (!opponent) {
          existingOpponentByName = (savedOpponents || []).find(
            o => o.type === 'human' && o.name === challengeData.playerName
          );
        }

        if (!opponent && !existingOpponentByName) {
          // Create new opponent from challenge data
          // Note: Use the playerId from the challenge as the ID to maintain consistency
          opponent = {
            ...createHumanOpponent(challengeData.playerName),
            id: challengeData.playerId, // Override with the ID from challenge to ensure consistency
            discordId: challengeData.playerDiscordId, // Save Discord ID for notifications
            discordUsername: challengeData.playerDiscordUsername, // Save Discord username
            discordAvatar: challengeData.playerDiscordAvatar, // Save Discord avatar hash
          };
          // Save to localStorage
          setSavedOpponents([...(savedOpponents || []), opponent]);
        } else if (existingOpponentByName && !opponent) {
          // We found a manually created opponent with the same name
          // Update it to use the canonical ID from the challenge and add Discord info
          opponent = {
            ...existingOpponentByName,
            id: challengeData.playerId, // Update to use canonical ID
            discordId: challengeData.playerDiscordId,
            discordUsername: challengeData.playerDiscordUsername,
            discordAvatar: challengeData.playerDiscordAvatar,
          };
          // Replace the old opponent with updated one
          const updatedOpponents = (savedOpponents || []).map(o =>
            o.id === existingOpponentByName!.id ? opponent! : o
          );
          setSavedOpponents(updatedOpponents);
        } else if (opponent && (challengeData.playerDiscordId && opponent.discordId !== challengeData.playerDiscordId)) {
          // Update existing opponent's Discord info if it changed
          opponent = {
            ...opponent,
            discordId: challengeData.playerDiscordId,
            discordUsername: challengeData.playerDiscordUsername,
            discordAvatar: challengeData.playerDiscordAvatar,
          };
          // Update in localStorage
          const existingIndex = (savedOpponents || []).findIndex(o => o.id === opponent!.id);
          if (existingIndex >= 0) {
            const updated = [...(savedOpponents || [])];
            updated[existingIndex] = opponent;
            setSavedOpponents(updated);
          }
        }

        // Safety check - opponent should always exist at this point
        if (!opponent) {
          console.error('[handleIncomingChallenge] Failed to create or find opponent');
          clearChallengeFromUrl();
          setIncomingChallenge(null);
          return;
        }

        // Check if we're continuing an ongoing game (same gameId)
        const isOngoingGame = state.gameId === challengeData.gameId;

        // Scores are now derived from roundHistory, not explicitly set
        void (isOngoingGame ? playerScore : 0); // placeholder for future use
        void (isOngoingGame ? opponentScore : 0); // placeholder for future use

        console.log('[handleIncomingChallenge] Ongoing game?', isOngoingGame);
        console.log('[handleIncomingChallenge] Current roundHistory length:', state.roundHistory.length);
        console.log('[handleIncomingChallenge] Loading from localStorage for gameId:', challengeData.gameId);

        // Debug: Check all saved round results
        console.log('[handleIncomingChallenge] All saved round results:', savedRoundResults);
        console.log('[handleIncomingChallenge] Filtered for this game:', savedRoundResults?.filter(r => r.gameId === challengeData.gameId));

        // Load round history from localStorage
        let roundHistory = loadRoundResults(challengeData.gameId);
        console.log('[handleIncomingChallenge] Loaded roundHistory from localStorage:', roundHistory.length, 'rounds');
        if (roundHistory.length > 0) {
          console.log('[handleIncomingChallenge] Round history details:', roundHistory);
        }

        // Check if we have a saved active game with more complete history
        const savedActiveGame = getActiveGames(true).find(g => g.gameId === challengeData.gameId);
        if (savedActiveGame && savedActiveGame.fullState.roundHistory.length > roundHistory.length) {
          console.log('[handleIncomingChallenge] Found saved active game with more complete history:', savedActiveGame.fullState.roundHistory.length, 'rounds vs', roundHistory.length);
          // Sync the missing rounds from active game to localStorage
          syncRoundResultsFromState(
            challengeData.gameId,
            savedActiveGame.fullState.roundHistory,
            opponent,
            challengeData.boardSize
          );
          // Reload round history after sync
          roundHistory = loadRoundResults(challengeData.gameId);
          console.log('[handleIncomingChallenge] After sync, roundHistory now has:', roundHistory.length, 'rounds');
        }

        // If challenge includes ALL previous round results, sync them (new format)
        if (challengeData.previousRoundResults && challengeData.previousRoundResults.length > 0) {
          console.log('[handleIncomingChallenge] Challenge includes', challengeData.previousRoundResults.length, 'previous rounds');
          // Find rounds that are either missing OR incomplete (no boards)
          const missingOrIncompleteRounds = challengeData.previousRoundResults.filter(r => {
            const existing = roundHistory.find(rh => rh.round === r.round);
            // Include if: doesn't exist OR exists but incomplete (missing boards)
            return !existing || !existing.playerBoard || !existing.opponentBoard;
          });

          if (missingOrIncompleteRounds.length > 0) {
            console.log('[handleIncomingChallenge] Syncing', missingOrIncompleteRounds.length, 'missing/incomplete rounds from challenge:', missingOrIncompleteRounds.map(r => r.round));
            const simulatedResults: RoundResult[] = [];
            const roundsToRemove = new Set(missingOrIncompleteRounds.map(r => r.round));
            // Remove incomplete rounds from history before adding simulated ones
            roundHistory = roundHistory.filter(r => !roundsToRemove.has(r.round));

            missingOrIncompleteRounds.forEach(result => {
              // Decode boards from encoded strings
              const opponentBoard = typeof result.playerBoard === 'string' ? decodeMinimalBoard(result.playerBoard) : result.playerBoard;
              const playerBoard = typeof result.opponentBoard === 'string' ? decodeMinimalBoard(result.opponentBoard) : result.opponentBoard;

              console.log(`[handleIncomingChallenge] Re-simulating round ${result.round} from boards`);

              // Re-simulate the round to get complete data (final positions, simulation details)
              // Note: Boards are already swapped from opponent's perspective
              const simulatedResult = simulateRound(result.round, playerBoard, opponentBoard);

              console.log(`[handleIncomingChallenge] Simulation complete for round ${result.round}:`, {
                winner: simulatedResult.winner,
                playerPoints: simulatedResult.playerPoints,
                opponentPoints: simulatedResult.opponentPoints,
                hasFinalPositions: !!(simulatedResult.playerFinalPosition && simulatedResult.opponentFinalPosition)
              });

              simulatedResults.push(simulatedResult);
              saveRoundResult(
                simulatedResult,
                challengeData.gameId,
                opponent,
                challengeData.boardSize
              );
            });
            // Add simulated results to roundHistory (state update is async, so we can't rely on loadRoundResults here)
            roundHistory = [...roundHistory, ...simulatedResults].sort((a, b) => a.round - b.round);
            console.log('[handleIncomingChallenge] After syncing all rounds, roundHistory now has:', roundHistory.length, 'rounds');
          }
        }

        // Check if this is a final results link (game over)
        if (challengeData.isFinalResults) {
          console.log('[handleIncomingChallenge] Final results link detected - loading all rounds');
          console.log('[handleIncomingChallenge] Round history has', roundHistory.length, 'complete rounds');

          // Load state with all rounds - let phase derive naturally
          // This will show Round 5 results first, then game-over after Continue
          loadState({
            ...state,
            opponent,
            gameId: challengeData.gameId,
            gameCreatorId: challengeData.gameCreatorId || null,
            boardSize: challengeData.boardSize,
            gameMode: challengeData.gameMode,
            roundHistory,
            phaseOverride: null, // Clear override - let phase derive from roundHistory
          });

          setIncomingChallenge(null);
          return;
        }

        // Determine the correct phase based on context
        // Check if the current round (the one in the challenge) is complete
        const currentRoundComplete = roundHistory.some(r => r.round === challengeData.round && r.playerBoard && r.opponentBoard);

        // Check if there are any newly completed rounds that player hasn't seen yet
        // Find the most recent completed round that's BEFORE the challenge round
        const completedRoundsBeforeCurrent = roundHistory
          .filter(r => r.round < challengeData.round && r.playerBoard && r.opponentBoard)
          .sort((a, b) => b.round - a.round);
        const mostRecentCompletedRound = completedRoundsBeforeCurrent[0];

        // If isRoundComplete is true, the opponent has already played this round - go to review
        // If this specific round is already COMPLETE in the history, go to review
        // If there's a completed round before current and player hasn't selected for next round, show those results
        const shouldReview = challengeData.isRoundComplete || currentRoundComplete || !!mostRecentCompletedRound;

        // IMPORTANT: Add opponent's board to round entry (always, even when showing review)
        // This ensures opponent's board is available when player finishes viewing results
        const roundIndex = challengeData.round - 1;
        const existingRound = roundHistory[roundIndex];

        if (existingRound && !isRoundComplete(existingRound) && decodedOpponentBoard) {
          // Update existing partial round with opponent's board
          roundHistory[roundIndex] = {
            ...existingRound,
            opponentBoard: decodedOpponentBoard, // Opponent's decoded board from challenge
          };
        } else if (!existingRound && decodedOpponentBoard) {
          // Create new partial round entry with opponent's board
          // Using 'as unknown as RoundResult' because this is a partial round that will be completed later
          roundHistory[roundIndex] = {
            round: challengeData.round,
            winner: undefined,
            playerBoard: null,
            opponentBoard: decodedOpponentBoard, // Opponent's decoded board from challenge
            playerFinalPosition: { row: 0, col: 0 },
            opponentFinalPosition: { row: 0, col: 0 },
          } as unknown as RoundResult;
        }
        // If round is already complete, don't overwrite it

        if (shouldReview) {
          // Determine which round's results to show
          let phaseToUse: GamePhase;

          if (currentRoundComplete) {
            // Current round is complete - show review and advance to next round
            const nextRound = challengeData.round + 1;
            phaseToUse = { type: 'round-review', round: nextRound };
          } else if (mostRecentCompletedRound) {
            // There's a completed round before current - show its results
            const completedRoundResult = roundHistory.find(r => r.round === mostRecentCompletedRound.round);
            if (completedRoundResult) {
              phaseToUse = { type: 'round-results', round: mostRecentCompletedRound.round, result: completedRoundResult };
            } else {
              // Fallback to board selection if we can't find the result
              phaseToUse = { type: 'board-selection', round: challengeData.round };
            }
          } else {
            // Fallback (shouldn't reach here, but just in case)
            const nextRound = challengeData.round + 1;
            phaseToUse = { type: 'round-review', round: nextRound };
          }

          loadState({
            ...state,
            opponent,
            gameId: challengeData.gameId,
            gameCreatorId: challengeData.gameCreatorId || null,
            boardSize: challengeData.boardSize,
            gameMode: challengeData.gameMode,
            roundHistory,
            phaseOverride: phaseToUse,
          });
        } else {
          // First round, initial challenge - go directly to board selection
          loadState({
            ...state,
            opponent,
            gameId: challengeData.gameId,
            gameCreatorId: challengeData.gameCreatorId || null,
            boardSize: challengeData.boardSize,
            gameMode: challengeData.gameMode,
            roundHistory,
            phaseOverride: { type: 'board-selection', round: challengeData.round },
          });
        }

        // Clear incoming challenge
        setIncomingChallenge(null);
      } catch (error) {
        console.error('[APP] Failed to parse challenge:', error);
        clearChallengeFromUrl();
        setIncomingChallenge(null);
      }
    }
    // If user doesn't exist yet, they'll go through tutorial first
    // The challenge will be preserved in state and handled after tutorial
  };

  // Check for incoming challenge in URL on mount and when hash changes
  useEffect(() => {
    const handleHashChange = async () => {
      // Check if there's a challenge in the URL
      if (hasChallengeInUrl()) {
        // Show loading state immediately before fetching
        setPhase({ type: 'loading-challenge' });

        // Use async version to support shortened URLs
        const challengeData = await getChallengeFromUrlAsync();
        if (challengeData) {
          handleIncomingChallenge(challengeData);
        } else {
          // Failed to load challenge - go back to board management
          console.error('[APP] Failed to load challenge data');
          setPhase({ type: 'board-management' });
        }
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes (when user pastes new URL or navigates)
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user.name]); // Re-run when user changes (in case they complete tutorial)

  // Update opponent record when game ends
  useEffect(() => {
    if (!state.opponent) return;

    // Check if we're in an end-game phase
    if (phase.type === 'game-over' || phase.type === 'all-rounds-results') {
      // Determine if opponent won (ties don't count as wins or losses)
      const opponentWon = opponentScore > playerScore;
      const isTie = opponentScore === playerScore;

      // Only update opponent stats if there was a winner (not a tie)
      if (isTie) {
        return; // Don't update stats for ties
      }

      // Update opponent stats
      const updatedOpponent = updateOpponentStats(state.opponent, opponentWon);

      // Only update if the record actually changed (to avoid infinite loops)
      if (updatedOpponent.wins !== state.opponent.wins || updatedOpponent.losses !== state.opponent.losses) {
        // Save updated opponent to localStorage
        const existingIndex = (savedOpponents || []).findIndex((o) => o.id === updatedOpponent.id);
        if (existingIndex >= 0) {
          const updated = [...(savedOpponents || [])];
          updated[existingIndex] = updatedOpponent;
          setSavedOpponents(updated);
          console.log('[APP] Updated opponent record:', updatedOpponent.name, `(${updatedOpponent.wins}-${updatedOpponent.losses})`);
        }

        // Update opponent in game state
        loadState({
          ...state,
          opponent: updatedOpponent,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type, state.opponent?.id, playerScore, opponentScore]);

  // Send Discord notification when game ends (for human opponents)
  useEffect(() => {
    if (!state.opponent || state.opponent.type !== 'human') return;
    if (!savedUser?.name || !state.gameId || !state.boardSize) return;

    // Only send notification when game is over
    if (phase.type === 'game-over' || phase.type === 'all-rounds-results') {
      // Determine opponent's result (from their perspective)
      let opponentResult: 'win' | 'loss' | 'tie';
      if (opponentScore > playerScore) {
        opponentResult = 'win';
      } else if (playerScore > opponentScore) {
        opponentResult = 'loss';
      } else {
        opponentResult = 'tie';
      }

      // Generate game URL with final results
      const gameUrl = generateFinalResultsUrl(
        state.boardSize,
        playerScore,
        opponentScore,
        state.gameMode || 'round-by-round',
        state.gameId,
        savedUser.id,
        savedUser.name
      );

      // Send notification
      sendDiscordNotification(state.opponent, 'game-complete', {
        playerName: savedUser.name,
        gameUrl,
        result: opponentResult,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.type, state.gameId]); // Only run when phase or gameId changes

  // Sync round results from game state to localStorage (fixes missing rounds)
  useEffect(() => {
    if (!state.gameId || !state.opponent || !state.boardSize) return;
    if (state.roundHistory.length === 0) return;

    // Sync any missing rounds from state to localStorage
    syncRoundResultsFromState(
      state.gameId,
      state.roundHistory,
      state.opponent,
      state.boardSize
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameId, state.roundHistory.length]); // Run when gameId or history length changes

  // Handle user creation
  const handleUserCreate = (newUser: UserProfileType) => {
    // Save user to localStorage
    setSavedUser(newUser);

    // Check if there's an incoming challenge
    if (incomingChallenge) {
      console.log('[handleUserCreate] Processing incoming challenge:', incomingChallenge);

      // Find or create opponent
      let opponent = (savedOpponents || []).find(o => o.id === incomingChallenge.playerId);

      if (!opponent) {
        // Create new opponent from challenge data
        opponent = {
          ...createHumanOpponent(incomingChallenge.playerName),
          id: incomingChallenge.playerId,
          discordId: incomingChallenge.playerDiscordId,
          discordUsername: incomingChallenge.playerDiscordUsername,
          discordAvatar: incomingChallenge.playerDiscordAvatar,
        };
        setSavedOpponents([...(savedOpponents || []), opponent]);
      }

      // Update state with user
      loadState({
        ...state,
        user: newUser,
        opponent,
        phaseOverride: { type: 'board-management' }, // Temporarily set to board-management
      });

      // Show the challenge received modal
      setShowChallengeModal(true);
      return;
    }

    // No incoming challenge - normal flow
    loadState({
      ...state,
      user: newUser,
      phaseOverride: { type: 'board-management' },
    });
  };

  // Handle game mode selection
  const handleGameModeSelect = (mode: GameMode) => {
    // After selecting game mode, go to board size selection
    setGameMode(mode);
    setPhase({ type: 'board-size-selection', gameMode: mode });
  };

  // Check if CPU has boards/decks for a given size
  const cpuHasBoardsForSize = (opponentName: string, size: number): boolean => {
    if (!state.opponent || state.opponent.type !== 'cpu') return true;

    // Check if CPU has boards for this size (minimum 3 boards required)
    const cpuBoardsForSize = (cpuBoards || []).filter(
      b => b.boardSize === size && b.name.startsWith(opponentName)
    );

    // Check if CPU has deck for this size
    const expectedDeckName = `${opponentName} ${size}×${size} Deck`;
    const cpuDeckForSize = (cpuDecks || []).find(d => d.name === expectedDeckName);

    return cpuBoardsForSize.length >= 3 && cpuDeckForSize !== undefined;
  };

  // Handle board size selection
  const handleBoardSizeSelect = async (size: number) => {
    setBoardSize(size);
    // After selecting board size, check if opponent is already selected
    if (phase.type === 'board-size-selection') {
      const gameMode = phase.gameMode;

      // If opponent already selected, check if we need to generate CPU boards
      if (state.opponent && state.opponent.type === 'cpu') {
        // Check if CPU has boards/decks for this size
        if (!cpuHasBoardsForSize(state.opponent.name, size)) {
          // Show generating modal
          setGeneratingSize(size);
          setIsGeneratingCpuBoards(true);

          // Generate CPU boards/decks
          await handleGenerateCpuBoards(size);

          // Hide generating modal after a brief delay
          setTimeout(() => {
            setIsGeneratingCpuBoards(false);
            // Proceed to next phase
            setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
          }, 500);
        } else {
          // CPU already has boards, proceed to next phase
          setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
        }
      } else if (state.opponent && state.opponent.type === 'remote-cpu') {
        // Fetch boards from remote server for remote CPU
        // Show generating modal
        setGeneratingSize(size);
        setIsGeneratingCpuBoards(true);

        try {
          // Fetch boards for this size
          const boards = await fetchRemoteCpuBoards(size);

          if (boards.length > 0) {
            // Filter out boards already in storage to avoid duplicates
            const existingBoardIds = new Set((remoteCpuBoards || []).map(b => b.id));
            const newBoards = boards.filter(b => !existingBoardIds.has(b.id));

            if (newBoards.length > 0) {
              setRemoteCpuBoards([...(remoteCpuBoards || []), ...newBoards]);
            }

            console.log(`[handleBoardSizeSelect] Fetched ${boards.length} remote CPU boards for ${size}×${size}`);
          } else {
            console.warn(`[handleBoardSizeSelect] No remote CPU boards fetched for ${size}×${size}`);
            alert(`Could not fetch boards from remote server. Please check your connection and try again.`);
            setIsGeneratingCpuBoards(false);
            return;
          }
        } catch (error) {
          console.error('[handleBoardSizeSelect] Error fetching remote CPU boards:', error);
          alert(`Failed to fetch boards from remote server. Please try again.`);
          setIsGeneratingCpuBoards(false);
          return;
        }

        // Hide generating modal after a brief delay
        setTimeout(() => {
          setIsGeneratingCpuBoards(false);
          // Proceed to next phase based on game mode
          setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
        }, 500);
      } else if (state.opponent) {
        // Non-CPU opponent, skip opponent selection and go to next phase
        setPhase(gameMode === 'deck' ? { type: 'deck-selection' } : { type: 'board-selection', round: 1 });
      } else {
        // No opponent selected yet, go to opponent selection
        setPhase({ type: 'opponent-selection', gameMode });
      }
    }
  };

  // Handle generating CPU boards for a specific size
  const handleGenerateCpuBoards = async (size: number, opponentName?: string): Promise<Deck | undefined> => {
    const opponent = state.opponent;
    if (!opponent && !opponentName) return undefined;

    const name = opponentName || opponent?.name;
    if (!name) return undefined;

    // Check if boards already exist for this size (defensive check)
    if (opponent && cpuHasBoardsForSize(name, size)) {
      console.log(`[handleGenerateCpuBoards] Boards already exist for ${name} ${size}x${size}, skipping generation`);

      // Return existing deck
      const expectedDeckName = `${name} ${size}×${size} Deck`;
      const existingDeck = (cpuDecks || []).find(d => d.name === expectedDeckName && d.boards.length === 10);
      return existingDeck;
    }

    console.log(`[handleGenerateCpuBoards] Generating ${size}x${size} boards for ${name}`);

    // Determine if this is CPU Tougher (includes traps)
    const isTougher = opponent?.id === 'cpu-tougher-opponent' || name.includes('Tougher');

    // Generate boards for this size
    const newBoards = generateCpuBoardsForSize(name, size, isTougher);

    // Generate deck for this size
    const newDeck = generateCpuDeckForSize(name, size, newBoards);

    // Add boards to CPU boards (check for duplicates first)
    const existingBoardIds = new Set((cpuBoards || []).map((b) => b.id));
    const uniqueNewBoards = newBoards.filter((b) => !existingBoardIds.has(b.id));

    if (uniqueNewBoards.length > 0) {
      setCpuBoards([...(cpuBoards || []), ...uniqueNewBoards]);
    }

    // Add deck to CPU decks (check for duplicates first)
    const existingDeckIds = new Set((cpuDecks || []).map((d) => d.id));
    if (!existingDeckIds.has(newDeck.id)) {
      setCpuDecks([...(cpuDecks || []), newDeck]);
    }

    console.log(`[handleGenerateCpuBoards] Added ${uniqueNewBoards.length} boards and 1 deck`);

    // Return the newly generated deck
    return newDeck;
  };

  // Handle opponent selection (for play button)
  const handleOpponentSelect = (opponent: Opponent, gameMode: GameMode) => {
    // Save opponent to localStorage if not already saved
    const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
    if (existingIndex >= 0) {
      const updated = [...(savedOpponents || [])];
      updated[existingIndex] = opponent;
      setSavedOpponents(updated);
    } else {
      setSavedOpponents([...(savedOpponents || []), opponent]);
    }

    // Generate game ID for human opponents (for tracking across challenges)
    const gameId = opponent.type === 'human' ? `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

    // Get user ID for game creator tracking
    const userId = state.user.id;
    console.log('[APP] Starting new game - userId:', userId, 'opponent:', opponent.name, 'gameId:', gameId);

    // Select opponent with game mode and reset game state for new game
    loadState({
      ...state,
      opponent,
      gameId,
      gameCreatorId: opponent.type === 'human' ? userId : null, // Track who created the game
      gameMode,
      // boardSize should already be set at this point
      phaseOverride: null, // Phase will be derived from state
      roundHistory: [],
      playerSelectedDeck: null,
      opponentSelectedDeck: null,
    });
  };

  // Handle resuming an active game
  const handleResumeGame = (game: ActiveGameInfo) => {
    console.log('[APP] Resuming game:', game.gameId, 'Phase:', game.phase.type);

    // Restore the full game state from the saved game
    // Note: Old saved games might have 'phase' and 'currentRound' fields
    // These will be ignored in the new state model
    let restoredState = game.fullState;

    // Migration: Add gameCreatorId if missing (for old games)
    if (!restoredState.gameCreatorId && restoredState.gameId && restoredState.opponent?.type === 'human') {
      console.log('[APP] Migrating old game - setting gameCreatorId to current user');
      restoredState = {
        ...restoredState,
        gameCreatorId: restoredState.user.id,
      };
    }

    // Determine the correct phase override to resume to
    // Most phases should derive naturally from roundHistory
    let resumePhaseOverride: GamePhase | null = null;

    if (game.phase.type === 'share-challenge' || game.phase.type === 'waiting-for-opponent') {
      // When resuming, show waiting-for-opponent instead of share-challenge
      // This keeps the round history visible and shows the orange waiting panel
      const currentRoundDerived = deriveCurrentRound(restoredState);
      resumePhaseOverride = { type: 'waiting-for-opponent', round: currentRoundDerived };
    } else if (game.phase.type === 'round-results') {
      // Let phase derive naturally - will show round-results
      resumePhaseOverride = null;
    } else if (game.phase.type === 'board-selection') {
      // Let phase derive naturally - will show board-selection or round-review
      resumePhaseOverride = null;
    } else if (game.phase.type === 'share-final-results') {
      // If we were sharing final results, show the game over screen
      const playerWins = restoredState.roundHistory.filter(r => r.winner === 'player').length;
      const opponentWins = restoredState.roundHistory.filter(r => r.winner === 'opponent').length;
      const winner = playerWins > opponentWins ? 'player' : opponentWins > playerWins ? 'opponent' : 'tie';
      resumePhaseOverride = { type: 'game-over', winner };
    } else {
      // For UI-only phases (round-review, deck-selection, etc.)
      // Keep the phase as-is - these are valid places to resume
      resumePhaseOverride = game.phase;
    }

    // Sync round results from state to localStorage (fixes missing rounds)
    if (restoredState.opponent && restoredState.gameId && restoredState.boardSize) {
      syncRoundResultsFromState(
        restoredState.gameId,
        restoredState.roundHistory,
        restoredState.opponent,
        restoredState.boardSize
      );
    }

    loadState({
      ...restoredState,
      phaseOverride: resumePhaseOverride,
    });
  };

  const handleArchiveGame = (gameId: string) => {
    console.log('[APP] Archiving game:', gameId);
    archiveActiveGame(gameId);
    setActiveGames(getActiveGames());
  };

  const handleDeleteGame = (gameId: string) => {
    console.log('[APP] Deleting game:', gameId);
    removeActiveGame(gameId);
    setActiveGames(getActiveGames());
  };

  const handleArchiveOpponent = (opponentId: string) => {
    console.log('[APP] Archiving opponent:', opponentId);
    const updated = (savedOpponents || []).map(o =>
      o.id === opponentId ? { ...o, archived: true } : o
    );
    setSavedOpponents(updated);
    setOpponentToRemove(null);
  };

  const handleDeleteOpponent = (opponentId: string) => {
    console.log('[APP] Deleting opponent:', opponentId);
    const updated = (savedOpponents || []).filter(o => o.id !== opponentId);
    setSavedOpponents(updated);
    setOpponentToRemove(null);
  };

  // Handle board CRUD operations
  const handleBoardSave = (board: Board) => {
    const boards = savedBoards || [];
    const existingIndex = boards.findIndex((b) => b.id === board.id);
    if (existingIndex >= 0) {
      const updated = [...boards];
      updated[existingIndex] = board;
      setSavedBoards(updated);
    } else {
      setSavedBoards([...boards, board]);
    }

    // If we were creating a board mid-game, return to board-selection
    if (isCreatingBoardMidGame) {
      setIsCreatingBoardMidGame(false);
      setBoardSizeToCreate(null);
      // Return to board-selection with the current round
      setPhase({ type: 'board-selection', round: currentRound });
    }
  };

  const handleBoardDelete = (boardId: string) => {
    setSavedBoards((savedBoards || []).filter((b) => b.id !== boardId));
  };

  // Handle deck CRUD operations
  const handleDeckSave = (deck: Deck) => {
    const decks = savedDecks || [];
    const existingIndex = decks.findIndex((d) => d.id === deck.id);
    if (existingIndex >= 0) {
      const updated = [...decks];
      updated[existingIndex] = deck;
      setSavedDecks(updated);
    } else {
      setSavedDecks([...decks, deck]);
    }
    setShowDeckCreator(false);
    setEditingDeck(null);
  };

  const handleDeckDelete = (deckId: string) => {
    setSavedDecks((savedDecks || []).filter((d) => d.id !== deckId));
  };

  const handleDeckEdit = (deck: Deck) => {
    setEditingDeck(deck);
    setShowDeckCreator(true);
  };

  // Handle deck selection for gameplay
  const handleDeckSelect = async (deck: Deck, opponent?: Opponent) => {
    // If opponent is provided, update it in game state
    const selectedOpponent = opponent || state.opponent;

    if (opponent) {
      // Save opponent to localStorage if not already saved
      const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
      if (existingIndex >= 0) {
        const updated = [...(savedOpponents || [])];
        updated[existingIndex] = opponent;
        setSavedOpponents(updated);
      } else {
        setSavedOpponents([...(savedOpponents || []), opponent]);
      }

      // Update state with the selected opponent
      loadState({
        ...state,
        opponent,
        gameMode: 'deck',
        boardSize: deck.boards.length > 0 ? deck.boards[0]?.boardSize ?? 2 : 2,
        phaseOverride: { type: 'all-rounds-results', results: [] }, // Will be overwritten below
      });
    }

    // Determine board size from the deck
    const deckSize = deck.boards.length > 0 ? deck.boards[0]?.boardSize : state.boardSize;

    selectPlayerDeck(deck);

    // Opponent selects a deck
    let opponentDeck: Deck;

    if (selectedOpponent?.type === 'cpu') {
      // Match deck to specific CPU opponent by name
      // Deck names are like "CPU 2×2 Deck" or "CPU Tougher 2×2 Deck"
      const expectedDeckName = `${selectedOpponent.name} ${deckSize}×${deckSize} Deck`;

      console.log(`[handleDeckSelect] Looking for deck: "${expectedDeckName}"`);

      // First try to find existing deck
      let cpuDefaultDeck = (cpuDecks || []).find(
        d => d.name === expectedDeckName && d.boards.length === 10
      );

      // If not found, generate it
      if (!cpuDefaultDeck) {
        console.log(`[handleDeckSelect] CPU deck not found for ${selectedOpponent.name} ${deckSize}×${deckSize}, generating...`);

        // Show generating modal
        setGeneratingSize(deckSize ?? 2);
        setIsGeneratingCpuBoards(true);

        // Generate CPU boards/decks and get the new deck
        cpuDefaultDeck = await handleGenerateCpuBoards(deckSize ?? 2, selectedOpponent.name);

        // Hide generating modal after a brief delay
        setTimeout(() => {
          setIsGeneratingCpuBoards(false);
        }, 500);
      }

      if (cpuDefaultDeck) {
        // Use the opponent-specific CPU deck (from hidden storage or just generated)
        console.log(`[handleDeckSelect] Using ${selectedOpponent.name} deck with ${cpuDefaultDeck.boards.length} boards`);
        opponentDeck = cpuDefaultDeck;
      } else {
        // Fallback: log error and use player's deck
        console.error(`[handleDeckSelect] ${selectedOpponent.name} deck not found or could not be generated for size ${deckSize}×${deckSize}`);
        opponentDeck = deck;
      }
    } else if (selectedOpponent?.type === 'remote-cpu') {
      // Remote CPU - fetch pre-made deck from remote server
      console.log(`[handleDeckSelect] Fetching Remote CPU deck from server`);

      // Show generating modal
      setGeneratingSize(deckSize ?? 2);
      setIsGeneratingCpuBoards(true);

      try {
        const remoteDeck = await fetchRemoteCpuDeck(deckSize ?? 2);

        if (remoteDeck) {
          opponentDeck = remoteDeck;
          console.log(`[handleDeckSelect] Fetched Remote CPU deck with ${opponentDeck.boards.length} boards`);
        } else {
          console.error(`[handleDeckSelect] Failed to fetch Remote CPU deck for ${deckSize}×${deckSize}`);
          alert('Failed to fetch Remote CPU deck from server. Please try again.');
          setIsGeneratingCpuBoards(false);
          return;
        }
      } catch (error) {
        console.error('[handleDeckSelect] Error fetching Remote CPU deck:', error);
        alert('Failed to fetch Remote CPU deck from server. Please try again.');
        setIsGeneratingCpuBoards(false);
        return;
      } finally {
        // Hide generating modal
        setTimeout(() => {
          setIsGeneratingCpuBoards(false);
        }, 500);
      }
    } else {
      // Human opponent - would normally choose via URL sharing
      // For now, create random deck from available player boards of same size
      const boards = (savedBoards || []).filter(b => b.boardSize === deckSize);
      const opponentBoards: Board[] = [];

      if (boards.length === 0) {
        opponentDeck = deck;
      } else {
        for (let i = 0; i < 10; i++) {
          const randomBoard = boards[Math.floor(Math.random() * boards.length)]!;
          opponentBoards.push(randomBoard);
        }

        opponentDeck = {
          id: `opponent-deck-${Date.now()}`,
          name: `${selectedOpponent?.name || 'Opponent'}'s Deck`,
          boards: opponentBoards,
          createdAt: Date.now(),
        };
      }
    }

    selectOpponentDeck(opponentDeck);

    // Run all 10 rounds at once
    setTimeout(() => {
      const results = simulateAllRounds(
        deck.boards,
        opponentDeck.boards,
        savedUser?.playerCreature,
        savedUser?.opponentCreature
      );
      completeAllRounds(results);
    }, 500);
  };

  // Handle board selection for round
  const handleBoardSelect = async (board: Board) => {
    // Validate player's board is playable
    if (!isBoardPlayable(board)) {
      alert('Invalid board! Board must have at least one move in sequence.');
      return;
    }

    // Reset notification timestamp for this new round
    setLastNotificationTimestamp(null);

    // Create/update round entry in roundHistory
    // We do this manually here instead of using selectPlayerBoardAction
    // to ensure the state update is synchronous for URL generation and saving
    const updatedRoundHistory = [...state.roundHistory];
    const existingRound = updatedRoundHistory[currentRound - 1];

    if (existingRound) {
      // Update existing round entry
      updatedRoundHistory[currentRound - 1] = {
        ...existingRound,
        playerBoard: board,
      };
    } else {
      // Create new partial round entry
      updatedRoundHistory[currentRound - 1] = {
        round: currentRound,
        winner: undefined as any,
        playerBoard: board,
        opponentBoard: null as any,
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 0 },
      };
    }

    // Update state with the new round history
    // This ensures the board is available for URL generation and active game saving
    const updatedState = {
      ...state,
      roundHistory: updatedRoundHistory,
      phaseOverride: null, // Clear override to allow natural phase derivation
      checksum: '',
    };

    console.log('[handleBoardSelect] Updating state with board - gameId:', state.gameId, 'gameCreatorId:', state.gameCreatorId, 'roundHistory length:', updatedRoundHistory.length);

    loadState(updatedState);

    // Don't manually call saveActiveGame here - let the useEffect handle it
    // The useEffect will fire after the state update completes

    // Mark this round as pending for human opponents (selected but not yet shared)
    if (state.opponent?.type === 'human' && state.gameId) {
      markRoundPending(state.gameId, currentRound, state.opponent.id, state.opponent.name);
    }

    // Check if we're responding to a challenge (opponent board already selected)
    if (opponentSelectedBoard) {
      // Responding to challenge - simulate immediately with the received board
      setIsSimulatingRound(true);

      // Capture opponent board in closure before setTimeout
      const opponentBoardForSimulation = opponentSelectedBoard;

      setTimeout(async () => {
        try {
          console.log('[handleBoardSelect] Starting simulation for round', currentRound);
          console.log('[handleBoardSelect] Player board:', board?.name, 'Opponent board:', opponentBoardForSimulation?.name);
          const result = simulateRound(currentRound, board, opponentBoardForSimulation);
          console.log('[handleBoardSelect] Simulation complete, result:', result);

          // Add creature data to result if available
          if (savedUser?.playerCreature) {
            result.playerCreature = savedUser.playerCreature;
          }
          if (savedUser?.opponentCreature) {
            result.opponentCreature = savedUser.opponentCreature;
          }

          console.log('[handleBoardSelect] Calling completeRound with result');
          completeRound(result);
          console.log('[handleBoardSelect] Saving round result');
          saveRoundResult(result, state.gameId, state.opponent, state.boardSize!);
          console.log('[handleBoardSelect] Setting isSimulatingRound to false');
          setIsSimulatingRound(false);
          console.log('[handleBoardSelect] Round completion flow finished');

          // Send Discord "round-complete" notification immediately after round completes
          if (state.opponent?.type === 'human' && savedUser?.name && state.gameId) {
            console.log('[handleBoardSelect] Sending round-complete notification to opponent');

            // Filter to only include complete rounds (including the one we just completed)
            const completeRounds = state.roundHistory
              .map(r => r.round === currentRound ? result : r) // Use fresh result for current round
              .filter(r => {
                const hasBoards = r.playerBoard && r.opponentBoard;
                const hasWinner = r.winner !== undefined && r.winner !== null;
                return hasBoards && hasWinner;
              });

            // Generate URL with the completed round result
            const roundResultUrl = await generateChallengeUrlShortened(
              result.playerBoard, // Our board (responder)
              currentRound,
              state.gameMode || 'round-by-round',
              state.gameId,
              savedUser.id,
              savedUser.name,
              opponentScore, // From opponent's perspective
              playerScore, // From opponent's perspective
              savedUser.discordId,
              savedUser.discordUsername,
              savedUser.discordAvatar,
              undefined, // previousRoundResult - removed, using only previousRoundResults
              true, // isRoundComplete
              state.gameCreatorId || undefined,
              completeRounds // Only include complete rounds
            ) || generateChallengeUrl(
              result.playerBoard,
              currentRound,
              state.gameMode || 'round-by-round',
              state.gameId,
              savedUser.id,
              savedUser.name,
              opponentScore,
              playerScore,
              savedUser.discordId,
              savedUser.discordUsername,
              savedUser.discordAvatar,
              undefined, // previousRoundResult - removed, using only previousRoundResults
              true,
              state.gameCreatorId || undefined,
              completeRounds // Only include complete rounds
            );

            // Determine result from opponent's perspective
            const opponentResult: 'win' | 'loss' | 'tie' =
              result.winner === 'opponent' ? 'win' :
              result.winner === 'player' ? 'loss' : 'tie';

            const notificationSent = await sendDiscordNotification(state.opponent, 'round-complete', {
              playerName: savedUser.name,
              round: currentRound,
              gameUrl: roundResultUrl,
              result: opponentResult,
              playerScore: opponentScore, // From opponent's perspective (Ted's score)
              opponentScore: playerScore, // From opponent's perspective (Ryan's score)
              ...(state.boardSize !== null && { boardSize: state.boardSize }),
            });

            // Show toast if Discord notification was sent
            if (notificationSent && state.opponent.discordId) {
              console.log(`[handleBoardSelect] Round complete notification sent to ${state.opponent.name}`);
              setToastMessage(`Round complete notification sent to ${state.opponent.name}`);
              // Clear toast after 3 seconds
              setTimeout(() => setToastMessage(null), 3000);
            }
          }
        } catch (error) {
          console.error('[handleBoardSelect] Error during simulation:', error);
          setIsSimulatingRound(false);
        }

        // Phase will automatically derive to 'round-results' to show the results
      }, 500);
      return;
    }

    // Check if opponent is human OR if we don't have an opponent (challenge response round 2+)
    if (state.opponent?.type === 'human' || !state.opponent) {
      // Determine if we should show share modal based on:
      // 1. If opponent hasn't selected yet for THIS round → Always show share modal (waiting for their response)
      // 2. If opponent already selected THIS round (we're responding) → Check turn order for NEXT round

      let shouldShowShareModal = false;

      // Check if opponent has already selected a board for the current round
      const opponentAlreadySelected = opponentSelectedBoard !== null;

      if (!opponentAlreadySelected) {
        // Opponent hasn't selected yet for this round - we selected first
        // Always show share modal to send them the challenge
        shouldShowShareModal = true;
      } else {
        // We're responding to opponent's selection
        // Only show share modal if opponent goes first in the NEXT round
        const nextRound = currentRound + 1;
        shouldShowShareModal = nextRound > 5 ||
          deriveWhoMovesFirst(nextRound, savedUser?.id || '', state.gameCreatorId) === 'opponent';
      }

      // Don't manually set phase - let it derive naturally from state
      // Phase will derive to:
      // - 'share-challenge' if shouldShowShareModal (player selected, opponent hasn't, opponent goes first in next round)
      // - 'board-selection' if player goes first in next round (after empty round entry created by handleContinue)
      //
      // The share modal visibility is controlled by the `showShareModal` state in ActiveGameView,
      // which auto-opens when gameState === 'waiting-for-opponent-to-start'

      // Send Discord notification to opponent that it's their turn (only if showing share modal)
      if (shouldShowShareModal && state.opponent?.type === 'human' && savedUser?.name && state.gameId) {
        setIsGeneratingUrl(true);

        // Filter to only include complete rounds
        const completeRounds = state.roundHistory.filter(r => {
          const hasBoards = r.playerBoard && r.opponentBoard;
          const hasWinner = r.winner !== undefined && r.winner !== null;
          return hasBoards && hasWinner;
        });

        // Generate compressed URL as fallback
        const compressedUrl = generateChallengeUrl(
          board,
          currentRound,
          state.gameMode || 'round-by-round',
          state.gameId,
          savedUser.id,
          savedUser.name,
          playerScore,
          opponentScore,
          savedUser.discordId,
          savedUser.discordUsername,
          savedUser.discordAvatar,
          undefined, // previousRoundResult - removed, using only previousRoundResults
          undefined,
          state.gameCreatorId || undefined,
          completeRounds // Only include complete rounds
        );

        setFallbackCompressedUrl(compressedUrl);

        // Use shortened URL for Discord notifications (to stay under 512 char button limit)
        const gameUrl = await generateChallengeUrlShortened(
          board,
          currentRound,
          state.gameMode || 'round-by-round',
          state.gameId,
          savedUser.id,
          savedUser.name,
          playerScore,
          opponentScore,
          savedUser.discordId,
          savedUser.discordUsername,
          savedUser.discordAvatar,
          undefined, // previousRoundResult - removed, using only previousRoundResults
          undefined, // isRoundComplete
          state.gameCreatorId || undefined,
          completeRounds // Only include complete rounds
        );

        // Use shortened if available, otherwise use compressed
        const finalGameUrl = gameUrl || compressedUrl;

        // Store URLs for share modal (so useEffect doesn't regenerate them)
        setShortenedChallengeUrl(finalGameUrl);
        setIsGeneratingUrl(false);

        const notificationTimestamp = await sendDiscordNotification(state.opponent, 'turn-ready', {
          playerName: savedUser.name,
          round: currentRound,
          gameUrl: finalGameUrl,
          ...(state.boardSize !== null && { boardSize: state.boardSize }),
        });

        // Store notification timestamp if successful
        // Use separate React state to avoid overwriting phaseOverride if user navigated away
        if (notificationTimestamp) {
          setLastNotificationTimestamp(notificationTimestamp);
          console.log('[Discord] Notification timestamp stored:', notificationTimestamp);
        }
      }
      return;
    }

    // CPU opponent flow - proceed with automatic simulation
    // Show loading state immediately
    setIsSimulatingRound(true);

    // Opponent selects a board (CPU chooses random)
    let opponentBoard: Board = board; // Fallback to same board

    // Determine which board pool to use based on opponent type
    const isRemoteCpu = state.opponent.type === 'remote-cpu';
    const boardPool = isRemoteCpu ? (remoteCpuBoards || []) : (cpuBoards || []);

    // Filter boards by opponent name and size
    // For remote CPU, just filter by size (boards are generic)
    // For local CPU, filter by name prefix (e.g., "CPU Left Column" or "CPU Tougher Board 1")
    const opponentBoardsForSize = isRemoteCpu
      ? boardPool.filter(b => b.boardSize === state.boardSize)
      : boardPool.filter(b => b.boardSize === state.boardSize && b.name.startsWith(state.opponent!.name));

    console.log(`[handleBoardSelect] Opponent: ${state.opponent!.name}, Type: ${state.opponent!.type}, Board size: ${state.boardSize}x${state.boardSize}`);
    console.log(`[handleBoardSelect] Found ${opponentBoardsForSize.length} boards for ${state.opponent!.name}:`, opponentBoardsForSize.map(b => b.name));

    // CPU selects random board from its own boards
    if (opponentBoardsForSize.length > 0) {
      const randomIndex = Math.floor(Math.random() * opponentBoardsForSize.length);
      opponentBoard = opponentBoardsForSize[randomIndex] || board;
      console.log(`[handleBoardSelect] Selected board #${randomIndex + 1}: ${opponentBoard.name}`);
    } else {
      // Fallback: log error and use player's board
      console.error(`[handleBoardSelect] ${state.opponent?.name ?? 'CPU'} boards not found for size ${state.boardSize}×${state.boardSize}`);
      console.error(`[handleBoardSelect] All boards in pool:`, boardPool.map(b => `${b.name} (${b.boardSize}x${b.boardSize})`));
      opponentBoard = board;
    }

    // Ensure opponent board is playable
    if (!isBoardPlayable(opponentBoard)) {
      // Try to find another playable board from this opponent
      const playableBoard = opponentBoardsForSize.find(b => isBoardPlayable(b));
      opponentBoard = playableBoard || board;
    }

    selectOpponentBoardAction(opponentBoard);

    // Run actual game simulation
    setTimeout(() => {
      const result = simulateRound(currentRound, board, opponentBoard);

      // Add creature data to result if available
      if (savedUser?.playerCreature) {
        result.playerCreature = savedUser.playerCreature;
      }
      if (savedUser?.opponentCreature) {
        result.opponentCreature = savedUser.opponentCreature;
      }

      completeRound(result);
      saveRoundResult(result, state.gameId, state.opponent, state.boardSize!);
      setIsSimulatingRound(false);
    }, 500); // Shorter delay for better UX
  };

  // Handle continuing to next round
  const handleContinue = async () => {
    console.log('[handleContinue] Phase:', phase);
    console.log('[handleContinue] Current round (derived):', currentRound);
    console.log('[handleContinue] Round history length:', state.roundHistory.length);
    console.log('[handleContinue] Round history:', state.roundHistory.map(r => `R${r.round}: ${r.winner}`));

    // Determine which round we just completed by checking the phase
    // If phase is round-results, use that round number
    // Otherwise find the last complete round
    let justCompletedRound: number;
    if (phase.type === 'round-results' && phase.result) {
      justCompletedRound = phase.result.round;
    } else {
      // Find the last completed round in history
      const lastComplete = state.roundHistory.filter(r => r.winner !== undefined).sort((a, b) => b.round - a.round)[0];
      justCompletedRound = lastComplete?.round || 1;
    }

    console.log('[handleContinue] Just completed round:', justCompletedRound);

    // Check if we're responding to a challenge and need to add opponent
    // Note: With the new ID system, opponent should already be created when accepting challenge
    // This is just a fallback for edge cases
    if (!state.opponent && justCompletedRound === 1) {
      console.warn('[APP] Missing opponent after round 1 - this should not happen with ID system');
      // Phase will auto-advance to next round for board selection
      return;
    }

    // NOTE: Discord "round-complete" notification is now sent immediately after round simulation
    // in handleBoardSelect, not here in handleContinue

    // Create a minimal round entry for the next round so phase derivation knows we've moved on
    // The derivePhase logic checks if nextResult exists to determine if user has viewed results
    // For Round 5, we create Round 6 as a marker (even though it won't be played)
    const nextRound = justCompletedRound + 1;
    console.log('[handleContinue] Creating empty entry for next round:', nextRound);

    // Check if next round entry already exists
    const nextRoundExists = state.roundHistory.some(r => r.round === nextRound);

    if (!nextRoundExists) {
      const emptyRoundEntry = {
        round: nextRound,
      } as RoundResult; // Type assertion - runtime handles partial objects

      // Add the empty round to history to signal we've moved past round results
      loadState({
        ...state,
        roundHistory: [...state.roundHistory, emptyRoundEntry],
        phaseOverride: null, // Clear override to let phase derive
      });
    } else {
      console.log('[handleContinue] Next round entry already exists, just clearing phase override');
      // Just clear phase override to let it derive naturally
      loadState({
        ...state,
        phaseOverride: null,
      });
    }

    // If this was the final round (round 5), update stats now that player has viewed results
    if (justCompletedRound === 5) {
      const winner = playerScore > opponentScore ? 'player' : opponentScore > playerScore ? 'opponent' : 'tie';
      endGame(winner);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    resetGame();
    setPhase({ type: 'board-management' });
  };

  // Handle home navigation - resets game if coming from game-over
  const handleGoHome = () => {
    console.log('[handleGoHome] Called from phase:', phase.type, 'gameId:', state.gameId, 'roundHistory length:', state.roundHistory.length);

    // If leaving share-challenge, mark round as completed
    if (phase.type === 'share-challenge' && state.gameId && state.opponent) {
      markRoundCompleted(state.gameId, phase.round, state.opponent.id, state.opponent.name);
    }

    // If in game-over or all-rounds-results, reset the game
    if (phase.type === 'game-over' || phase.type === 'all-rounds-results') {
      console.log('[handleGoHome] Resetting game because phase is:', phase.type);
      resetGame();
    }
    setPhase({ type: 'board-management' });
  };

  // Handle profile update
  const handleProfileUpdate = (updatedUser: UserProfileType) => {
    // Save to localStorage
    setSavedUser(updatedUser);

    // Update game state
    loadState({
      ...state,
      user: updatedUser,
    });
  };

  // Handle show complete results preference change
  const handleShowCompleteResultsChange = (value: boolean) => {
    const updatedUser: UserProfileType = {
      ...state.user,
      preferences: {
        ...state.user.preferences,
        showCompleteRoundResults: value,
      },
    };
    handleProfileUpdate(updatedUser);
  };

  // Handle explanation style preference change
  const handleExplanationStyleChange = (value: 'lively' | 'technical') => {
    const updatedUser: UserProfileType = {
      ...state.user,
      preferences: {
        ...state.user.preferences,
        explanationStyle: value,
      },
    };
    handleProfileUpdate(updatedUser);
  };

  // Tutorial Handlers

  // Handle tutorial intro - player selected creature and clicked Next
  const handleTutorialIntroNext = (playerCreature: CreatureId, cpuSamData: { name: string; creature: CreatureId }) => {
    setPhase({
      type: 'tutorial-board-creation',
      playerCreature,
      cpuSamData,
    });
  };

  // Handle tutorial intro skip - go to normal user setup
  const handleTutorialSkip = () => {
    setPhase({ type: 'user-setup' });
  };

  // Handle tutorial board completion
  const handleTutorialBoardComplete = (playerBoard: Board, hasTraps: boolean) => {
    // Get CPU Sam's boards (2x2 only for tutorial)
    const cpuSam2x2Boards = (cpuBoards || []).filter(
      b => b.boardSize === 2 && b.name.startsWith(CPU_OPPONENT_NAME)
    );

    if (cpuSam2x2Boards.length === 0) {
      console.error('[Tutorial] No CPU Sam 2x2 boards found!');
      return;
    }

    // Select appropriate CPU Sam board based on trap usage
    let selectedCpuBoard: Board;

    if (hasTraps) {
      // Player set traps - try to find a CPU board that would hit them
      // IMPORTANT: Opponent's board is rotated 180 degrees during simulation!
      // Position mapping after rotation (2x2 board):
      //   Player trap at (0,0) → Opponent needs (1,1) in unrotated board
      //   Player trap at (0,1) → Opponent needs (1,0) in unrotated board
      //   Player trap at (1,0) → Opponent needs (0,1) in unrotated board
      //   Player trap at (1,1) → Opponent needs (0,0) in unrotated board

      const hasTrapAt_0_0 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 0 && move.position.col === 0
      );
      const hasTrapAt_0_1 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 0 && move.position.col === 1
      );
      const hasTrapAt_1_0 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 1 && move.position.col === 0
      );
      const hasTrapAt_1_1 = playerBoard.sequence.some(
        move => move.type === 'trap' && move.position.row === 1 && move.position.col === 1
      );

      // Select CPU board based on rotated positions:
      // Unrotated boards:
      //   - "Left Column": (1,0) → (0,0) → goal
      //   - "Right Column": (1,1) → (0,1) → goal
      //   - "Left-Right": (1,0) → (1,1) → (0,1) → goal
      //   - "Right-Left": (1,1) → (1,0) → (0,0) → goal

      if (hasTrapAt_0_0) {
        // Trap at (0,0) → Need (1,1) after rotation → "Left-Right" has (1,1) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name.includes('Left-Right')) || cpuSam2x2Boards[0]!;
      } else if (hasTrapAt_0_1) {
        // Trap at (0,1) → Need (1,0) after rotation → "Right-Left" has (1,0) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name.includes('Right-Left')) || cpuSam2x2Boards[0]!;
      } else if (hasTrapAt_1_0) {
        // Trap at (1,0) → Need (0,1) after rotation → "Right Column" has (0,1) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name === 'CPU Sam Right Column') || cpuSam2x2Boards[0]!;
      } else if (hasTrapAt_1_1) {
        // Trap at (1,1) → Need (0,0) after rotation → "Left Column" has (0,0) on step 2
        selectedCpuBoard = cpuSam2x2Boards.find(b => b.name === 'CPU Sam Left Column') || cpuSam2x2Boards[0]!;
      } else {
        // Trap elsewhere, just pick first one
        selectedCpuBoard = cpuSam2x2Boards[0]!;
      }
    } else {
      // No traps - pick any board (they all reach goal)
      selectedCpuBoard = cpuSam2x2Boards[0]!;
    }

    // Get creatures from current phase
    const phaseData = phase.type === 'tutorial-board-creation' ? phase : null;
    if (!phaseData) return;

    const playerCreature = phaseData.playerCreature;
    const opponentCreature = phaseData.cpuSamData.creature;

    // Simulate the round
    const result = simulateRound(1, playerBoard, selectedCpuBoard);
    result.playerCreature = playerCreature;
    result.opponentCreature = opponentCreature;

    // Save the board to player's boards
    handleBoardSave(playerBoard);

    // Transition to tutorial results
    setPhase({
      type: 'tutorial-results',
      result,
      playerBoard,
    });
  };

  // Handle tutorial results continue
  const handleTutorialResultsContinue = () => {
    const phaseData = phase.type === 'tutorial-results' ? phase : null;
    if (!phaseData) return;

    // Get creature data from the result
    const playerCreature = phaseData.result.playerCreature;
    const opponentCreature = phaseData.result.opponentCreature;
    const firstBoard = phaseData.playerBoard;
    const playerWon = phaseData.result.winner === 'player';

    if (!playerCreature || !opponentCreature) return;

    // Get CPU Sam name from the opponent board name (e.g., "CPU Sam Left Column" -> "CPU Sam")
    const cpuSamName = phaseData.result.opponentBoard.name.split(' ').slice(0, 2).join(' ');

    setPhase({
      type: 'tutorial-name-entry',
      playerCreature,
      opponentCreature,
      firstBoard,
      playerWon,
      cpuSamName,
    });
  };

  // Handle tutorial name entry continue
  const handleTutorialNameContinue = (newUser: UserProfileType) => {
    // Merge preferences from current user (set during tutorial) into new user
    const userWithPreferences: UserProfileType = {
      ...newUser,
      preferences: {
        ...newUser.preferences,
        ...state.user.preferences,
      },
    };

    // Save user to localStorage
    setSavedUser(userWithPreferences);

    // Update game state and transition to board management
    loadState({
      ...state,
      user: userWithPreferences,
      phaseOverride: { type: 'board-management' },
    });

    // Check if there was an incoming challenge
    if (incomingChallenge) {
      try {
        // Decode the opponent's board (kept for potential future validation)
        void decodeMinimalBoard(incomingChallenge.playerBoard);

        console.log('[APP] Processing challenge after tutorial:', incomingChallenge);

        // Clear URL
        clearChallengeFromUrl();

        // Show alert for now (will be replaced with proper UI)
        if (window.confirm(`Welcome! You've received a challenge for a ${incomingChallenge.boardSize}×${incomingChallenge.boardSize} board! Would you like to respond?`)) {
          // Find or create opponent using playerId from challenge
          let opponent = (savedOpponents || []).find(o => o.id === incomingChallenge.playerId);

          if (!opponent) {
            // Create new opponent from challenge data
            // Note: Use the playerId from the challenge as the ID to maintain consistency
            opponent = {
              ...createHumanOpponent(incomingChallenge.playerName),
              id: incomingChallenge.playerId, // Override with the ID from challenge to ensure consistency
            };
            // Save to localStorage
            setSavedOpponents([...(savedOpponents || []), opponent]);
          }

          // Set up game state to respond to challenge
          loadState({
            ...state,
            user: newUser,
            opponent,
            gameId: incomingChallenge.gameId,
            gameCreatorId: incomingChallenge.gameCreatorId || null,
            boardSize: incomingChallenge.boardSize,
            gameMode: incomingChallenge.gameMode,
            roundHistory: [],
            phaseOverride: { type: 'board-selection', round: incomingChallenge.round },
          });
        } else {
          // User declined, show welcome modal
          setShowWelcomeModal(true);
        }

        // Clear the challenge from state
        setIncomingChallenge(null);
      } catch (error) {
        console.error('[APP] Failed to parse challenge after tutorial:', error);
        setIncomingChallenge(null);
        // Show welcome modal on error
        setShowWelcomeModal(true);
      }
    } else {
      // No challenge, show welcome modal as usual
      setShowWelcomeModal(true);
    }
  };

  // Render phase-specific content
  const renderPhase = () => {
    switch (phase.type) {
      case 'tutorial-intro':
        return (
          <TutorialIntro
            onNext={handleTutorialIntroNext}
            onSkip={handleTutorialSkip}
            hasIncomingChallenge={!!incomingChallenge}
          />
        );

      case 'tutorial-board-creation':
        return (
          <TutorialBoardCreator
            cpuSamData={phase.cpuSamData}
            onBoardComplete={handleTutorialBoardComplete}
            onSkip={handleTutorialSkip}
          />
        );

      case 'tutorial-results':
        if (!phase.result) return null;
        return (
          <RoundResults
            result={phase.result}
            playerName="You"
            opponentName={phase.result.opponentBoard?.name.split(' ')[0] + ' ' + phase.result.opponentBoard?.name.split(' ')[1] || 'CPU Sam'}
            playerScore={phase.result.playerPoints || 0}
            opponentScore={phase.result.opponentPoints || 0}
            onContinue={handleTutorialResultsContinue}
            continueButtonText="Continue"
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
            isTutorial={true}
          />
        );

      case 'tutorial-name-entry':
        return (
          <TutorialNameEntry
            playerCreature={phase.playerCreature}
            opponentCreature={phase.opponentCreature}
            firstBoard={phase.firstBoard}
            playerWon={phase.playerWon}
            cpuSamName={phase.cpuSamName}
            onContinue={handleTutorialNameContinue}
            onSkip={handleTutorialSkip}
          />
        );

      case 'user-setup':
        return (
          <UserProfile
            onUserCreated={handleUserCreate}
            existingUser={savedUser}
          />
        );

      case 'loading-challenge':
        return <LoadingChallenge userName={state.user.name || 'Player'} />;

      case 'board-management':
        if (showDeckCreator) {
          return (
            <DeckCreator
              availableBoards={savedBoards || []}
              onDeckSaved={handleDeckSave}
              onCancel={() => {
                setShowDeckCreator(false);
                setEditingDeck(null);
              }}
              existingDeck={editingDeck ?? undefined}
            />
          );
        }
        return (
          <div className={styles.boardManagement}>
            <div className={styles.managementHeader}>
              <h1>Hello, {state.user.name}!</h1>
              <button
                className={styles.editProfileLink}
                onClick={() => setIsProfileModalOpen(true)}
              >
                Edit Profile
              </button>
            </div>

            {/* Active Games Panel - Shows above opponents if there are any */}
            <ActiveGames
              games={activeGames.filter(g => g.currentRound <= g.totalRounds)}
              onResumeGame={handleResumeGame}
              onArchiveGame={handleArchiveGame}
              onDeleteGame={handleDeleteGame}
            />

            <div className={styles.managementGrid}>
              {/* Left Panel - Opponents */}
              <div className={styles.opponentsPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Opponents</h2>
                  <button
                    onClick={() => setIsOpponentsMinimized(!isOpponentsMinimized)}
                    className={styles.minimizeButton}
                    aria-label={isOpponentsMinimized ? 'Expand' : 'Minimize'}
                  >
                    {isOpponentsMinimized ? '▼' : '▲'}
                  </button>
                </div>
                {!isOpponentsMinimized && (
                  <div className={styles.opponentsList}>
                  {savedOpponents && savedOpponents.filter(o => !o.archived).length > 0 ? (
                    savedOpponents.filter(o => !o.archived).map((opponent) => (
                      <div key={opponent.id} className={styles.opponentItem}>
                        <div className={styles.opponentInfo}>
                          {opponent.type === 'human' ? (
                            <OpponentAvatar
                              opponentName={opponent.name}
                              discordId={opponent.discordId}
                              discordAvatar={opponent.discordAvatar}
                              size={48}
                            />
                          ) : (
                            <span className={styles.opponentIcon}>
                              {getOpponentIcon(opponent)}
                            </span>
                          )}
                          <div className={styles.opponentDetails}>
                            <span className={styles.opponentName}>{opponent.name}</span>
                            <span className={styles.opponentRecord}>
                              ({opponent.wins}-{opponent.losses})
                            </span>
                            <button
                              onClick={() => setOpponentToRemove(opponent)}
                              className={styles.removeLink}
                            >
                              Remove opponent from list
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Generate game ID for human opponents (for tracking across challenges)
                            const gameId = opponent.type === 'human' ? `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;
                            const userId = state.user.id;

                            console.log('[APP] Play button clicked - userId:', userId, 'opponent:', opponent.name, 'gameId:', gameId);

                            // Reset game state and save the selected opponent
                            loadState({
                              ...state,
                              opponent,
                              gameId,
                              gameCreatorId: opponent.type === 'human' ? userId : null, // Track who created the game
                              phaseOverride: { type: 'game-mode-selection' },
                              roundHistory: [],
                              playerSelectedDeck: null,
                              opponentSelectedDeck: null,
                            });
                          }}
                          className={styles.playButton}
                        >
                          Play
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyOpponents}>
                      <p>No opponents yet</p>
                      <button
                        onClick={() => {
                          // Go to add-opponent phase to add a new opponent to the list
                          loadState({
                            ...state,
                            phaseOverride: { type: 'add-opponent' },
                          });
                        }}
                        className={styles.addOpponentButton}
                      >
                        + Add Opponent
                      </button>
                    </div>
                  )}
                  {savedOpponents && savedOpponents.length > 0 && (
                    <button
                      onClick={() => {
                        // Go to add-opponent phase to add a new opponent to the list
                        loadState({
                          ...state,
                          phaseOverride: { type: 'add-opponent' },
                        });
                      }}
                      className={styles.addOpponentButton}
                    >
                      + Add Opponent
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* Right Panel - Boards */}
              <div className={styles.boardsPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Boards</h2>
                  <button
                    onClick={() => setIsBoardsMinimized(!isBoardsMinimized)}
                    className={styles.minimizeButton}
                    aria-label={isBoardsMinimized ? 'Expand' : 'Minimize'}
                  >
                    {isBoardsMinimized ? '▼' : '▲'}
                  </button>
                </div>
                {!isBoardsMinimized && (
                  <div className={styles.boardsContent}>
                  <SavedBoards
                    boards={savedBoards || []}
                    onBoardSelected={() => { }} // No selection in management mode
                    onBoardSaved={handleBoardSave}
                    onBoardDeleted={handleBoardDelete}
                    currentRound={0} // Not in a round
                    userName={state.user.name}
                    opponentName=""
                    user={savedUser}
                    onCreateDeck={() => setShowDeckCreator(true)}
                    initialBoardSize={boardSizeToCreate}
                    onInitialBoardSizeHandled={() => setBoardSizeToCreate(null)}
                  />
                </div>
                )}
              </div>
            </div>

            {/* Completed Games Panel - Shows below board management */}
            <CompletedGames
              isMinimized={isCompletedGamesMinimized}
              onToggleMinimize={() => setIsCompletedGamesMinimized(!isCompletedGamesMinimized)}
              games={activeGames.filter(g => g.currentRound > g.totalRounds)}
              onViewResults={handleResumeGame}
              onArchiveGame={handleArchiveGame}
              onDeleteGame={handleDeleteGame}
            />
          </div>
        );

      case 'add-opponent':
        return (
          <OpponentManager
            userName={state.user.name}
            discordId={state.user.discordId}
            discordUsername={state.user.discordUsername}
            onOpponentSelected={(opponent) => {
              // Save opponent to localStorage
              const existingIndex = (savedOpponents || []).findIndex((o) => o.id === opponent.id);
              if (existingIndex >= 0) {
                const updated = [...(savedOpponents || [])];
                updated[existingIndex] = opponent;
                setSavedOpponents(updated);
              } else {
                setSavedOpponents([...(savedOpponents || []), opponent]);
              }

              // Return to board management screen
              loadState({
                ...state,
                phaseOverride: { type: 'board-management' },
              });
            }}
          />
        );

      case 'game-mode-selection': {
        const deckModeUnlocked = isDeckModeUnlocked(savedUser);
        const nextUnlock = getNextUnlock(savedUser);

        // Check if playing against human opponent who hasn't completed a game yet
        const isFirstTimeHumanOpponent = state.opponent?.type === 'human' && !state.opponent?.hasCompletedGame;
        const deckModeAllowed = deckModeUnlocked && !isFirstTimeHumanOpponent;

        return (
          <div className={styles.gameModeSelection}>
            {state.opponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
                Playing against: <strong>{state.opponent.name}</strong>
              </div>
            )}
            <h2>Choose Game Mode</h2>
            {isFirstTimeHumanOpponent && state.opponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                👥 First game with {state.opponent.name}! Only Round by Round mode is available. Deck mode will unlock after your first game together.
              </div>
            )}
            {nextUnlock && !isFirstTimeHumanOpponent && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                🎯 Next unlock: <strong>{nextUnlock.description}</strong> ({nextUnlock.gamesRemaining} {nextUnlock.gamesRemaining === 1 ? 'game' : 'games'} remaining)
              </div>
            )}
            <div className={styles.modeGrid}>
              <button
                onClick={() => handleGameModeSelect('round-by-round')}
                className={styles.modeCard}
              >
                <h3>Round by Round</h3>
                <p>Classic mode - Select a board each round (5 rounds)</p>
              </button>
              <button
                onClick={deckModeAllowed ? () => handleGameModeSelect('deck') : undefined}
                className={`${styles.modeCard} ${!deckModeAllowed ? styles.lockedCard : ''}`}
                disabled={!deckModeAllowed}
              >
                <h3>Deck Mode {!deckModeAllowed && '🔒'}</h3>
                <p>Fast mode - Create a deck of 10 boards and play all at once</p>
                {!deckModeUnlocked && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Complete {3 - (savedUser?.stats.totalGames ?? 0)} more {3 - (savedUser?.stats.totalGames ?? 0) === 1 ? 'game' : 'games'} to unlock
                  </p>
                )}
                {deckModeUnlocked && isFirstTimeHumanOpponent && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Complete your first game with {state.opponent?.name} to unlock
                  </p>
                )}
              </button>
            </div>
            <button
              onClick={() => setPhase({ type: 'board-management' })}
              className={styles.backButton}
            >
              Back
            </button>
          </div>
        );
      }

      case 'board-size-selection':
        return (
          <BoardSizeSelector
            onSizeSelected={handleBoardSizeSelect}
            onBack={() => setPhase({ type: 'game-mode-selection' })}
            playerBoards={savedBoards || []}
            cpuBoards={cpuBoards || []}
            opponent={state.opponent}
            onGenerateCpuBoards={handleGenerateCpuBoards}
            user={savedUser}
            gameMode={phase.type === 'board-size-selection' ? phase.gameMode : state.gameMode}
            onCreateBoards={(size) => {
              // Set the board size in game state
              setBoardSize(size);
              // Set the board size to create
              setBoardSizeToCreate(size);
              // Mark that we're creating mid-game
              setIsCreatingBoardMidGame(true);
              // Navigate to board management
              setPhase({ type: 'board-management' });
            }}
          />
        );

      case 'opponent-selection':
        return (
          <OpponentManager
            userName={state.user.name}
            discordId={state.user.discordId}
            discordUsername={state.user.discordUsername}
            onOpponentSelected={(opponent) =>
              handleOpponentSelect(opponent, phase.type === 'opponent-selection' ? phase.gameMode : 'round-by-round')
            }
          />
        );

      case 'deck-management':
        if (showDeckCreator) {
          return (
            <DeckCreator
              availableBoards={savedBoards || []}
              onDeckSaved={handleDeckSave}
              onCancel={() => {
                setShowDeckCreator(false);
                setEditingDeck(null);
              }}
              existingDeck={editingDeck ?? undefined}
            />
          );
        }
        return (
          <DeckManager
            decks={savedDecks || []}
            opponents={savedOpponents || []}
            onDeckSelected={handleDeckSelect}
            onCreateDeck={() => setShowDeckCreator(true)}
            onEditDeck={handleDeckEdit}
            onDeleteDeck={handleDeckDelete}
            userName={state.user.name}
          />
        );

      case 'deck-selection': {
        // Filter boards and decks by selected board size
        const filteredBoards = state.boardSize
          ? (savedBoards || []).filter(board => board.boardSize === state.boardSize)
          : (savedBoards || []);

        const filteredDecks = state.boardSize
          ? (savedDecks || []).filter(deck =>
            deck.boards.length > 0 && deck.boards[0]?.boardSize === state.boardSize
          )
          : (savedDecks || []);

        if (showDeckCreator) {
          return (
            <DeckCreator
              availableBoards={filteredBoards}
              onDeckSaved={handleDeckSave}
              onCancel={() => {
                setShowDeckCreator(false);
                setEditingDeck(null);
              }}
              existingDeck={editingDeck ?? undefined}
            />
          );
        }
        return (
          <DeckManager
            decks={filteredDecks}
            opponents={savedOpponents || []}
            onDeckSelected={handleDeckSelect}
            onCreateDeck={() => setShowDeckCreator(true)}
            onEditDeck={handleDeckEdit}
            onDeleteDeck={handleDeckDelete}
            userName={state.user.name}
            selectedOpponent={state.opponent}
          />
        );
      }

      case 'board-selection':
      case 'share-challenge':
      case 'waiting-for-opponent': {
        // Unified active game view for all these states
        if (!state.boardSize) {
          console.error('[active-game] Missing required state: boardSize');
          return null;
        }
        // gameId is only required for human opponents
        if (state.opponent?.type === 'human' && !state.gameId) {
          console.error('[active-game] Missing required state: gameId for human opponent');
          return null;
        }

        // Determine game state for ActiveGameView
        let gameState: 'waiting-for-player' | 'waiting-for-opponent-to-start' | 'waiting-for-opponent-to-continue';

        if (phase.type === 'board-selection') {
          // Check if player has already selected their board
          if (playerSelectedBoard) {
            // Player already selected, now waiting for opponent
            gameState = 'waiting-for-opponent-to-continue';
          } else {
            // Player still needs to select a board
            gameState = 'waiting-for-player';
          }
        } else if (phase.type === 'share-challenge') {
          // Just selected board, waiting for opponent to start
          gameState = 'waiting-for-opponent-to-start';
        } else {
          // waiting-for-opponent phase
          gameState = 'waiting-for-opponent-to-continue';
        }

        // Use shortened challenge URL (generated in useEffect above)
        const challengeUrl = shortenedChallengeUrl || '#';

        // Determine if player is responding to a challenge (opponent selected board but player hasn't)
        const isRespondingToChallenge = !playerSelectedBoard && !!opponentSelectedBoard;

        // Filter round history to only show rounds where player has participated (selected a board)
        // This prevents showing partial rounds where only opponent has selected
        const roundsWithPlayerParticipation = state.roundHistory.filter(r => r.playerBoard !== null);

        // For rounds 2-5, use the board size from Round 1 to enforce consistency
        // In round-by-round mode, all rounds must use the same board size as Round 1
        const effectiveBoardSize = currentRound > 1 && state.roundHistory.length > 0 && state.roundHistory[0]?.playerBoard
          ? state.roundHistory[0].playerBoard.boardSize
          : state.boardSize;

        return (
          <div style={{ position: 'relative' }}>
            <ActiveGameView
              currentRound={currentRound}
              totalRounds={5}
              playerScore={playerScore}
              opponentScore={opponentScore}
              playerName={state.user.name}
              opponentName={state.opponent?.name || 'Opponent'}
              boardSize={effectiveBoardSize}
              challengeUrl={challengeUrl}
              {...(fallbackCompressedUrl && { fallbackUrl: fallbackCompressedUrl })}
              gameState={gameState}
              playerBoards={savedBoards || []}
              user={savedUser!}
              roundHistory={roundsWithPlayerParticipation}
              onBoardSelected={handleBoardSelect}
              onBoardSaved={handleBoardSave}
              onBoardDeleted={handleBoardDelete}
              showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
              onShowCompleteResultsChange={handleShowCompleteResultsChange}
              explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
              onExplanationStyleChange={handleExplanationStyleChange}
              opponentHasDiscord={!!(state.opponent?.discordId)}
              isCpuOpponent={state.opponent?.type === 'cpu' || state.opponent?.type === 'remote-cpu'}
              onGoHome={handleGoHome}
              onShareModalClosed={() => {
                // When share modal closes, phase stays as 'share-challenge' (derived from state)
                // The modal visibility is controlled by showShareModal state in ActiveGameView
                // No need to manually transition phase - it derives from playerBoard/opponentBoard state
              }}
              playerSelectedBoard={playerSelectedBoard}
              opponentSelectedBoard={opponentSelectedBoard}
              lastDiscordNotificationTime={lastNotificationTimestamp}
              isGeneratingUrl={isGeneratingUrl}
              isRespondingToChallenge={isRespondingToChallenge}
            />

            {/* Loading overlay */}
            {isSimulatingRound && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '2rem 3rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '3rem',
                      marginBottom: '1rem',
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    ⚔️
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a1a' }}>
                    Simulating Round...
                  </h3>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'share-final-results': {
        // Generate final results URL after round 5
        if (!state.boardSize || !state.gameId) {
          return null;
        }

        // Filter to only include complete rounds (exclude Round 6 marker)
        const completeRounds = state.roundHistory.filter(r => r.playerBoard && r.opponentBoard);

        const finalResultsUrl = generateFinalResultsUrl(
          state.boardSize,
          playerScore,
          opponentScore,
          state.gameMode || 'round-by-round',
          state.gameId,
          state.user.id,
          state.user.name,
          completeRounds
        );

        return (
          <ShareChallenge
            challengeUrl={finalResultsUrl}
            opponentName={state.opponent?.name || 'Your Friend'}
            boardSize={state.boardSize}
            round={5}
            onCancel={() => {
              // Clear phase override to return to derived phase (game-over)
              clearPhaseOverride();
            }}
            onGoHome={handleGoHome}
          />
        );
      }

      case 'round-review': {
        // Show previous rounds before selecting board for current round
        if (state.roundHistory.length === 0) {
          // No history, go directly to board selection
          setPhase({ type: 'board-selection', round: phase.round });
          return null;
        }

        // Determine who should go first in the current round (alternating pattern)
        // The pattern alternates each round based on who went first in round 1
        // If player went first in round 1: Odd rounds = player first, Even rounds = opponent first
        // If opponent went first in round 1: Odd rounds = opponent first, Even rounds = player first

        // Determine who went first in round 1 by checking the game creator
        // The game creator (the one who sent the first challenge) goes first in round 1
        const playerWentFirstRound1 = state.gameCreatorId === state.user.id;

        // Calculate if it's player's turn to go first this round
        const isOddRound = currentRound % 2 === 1;
        const isPlayerTurnToGoFirst = isOddRound === playerWentFirstRound1;

        // If it's opponent's turn to go first and they haven't selected their board yet, show waiting message
        const waitingForOpponent = state.opponent?.type === 'human' && !isPlayerTurnToGoFirst && !opponentSelectedBoard;

        console.log('[ROUND-REVIEW] Waiting check:', {
          gameCreatorId: state.gameCreatorId,
          userId: state.user.id,
          playerWentFirstRound1,
          isOddRound,
          isPlayerTurnToGoFirst,
          opponentType: state.opponent?.type,
          waitingForOpponent,
        });

        // Use AllRoundsResults in review mode with board selection capability
        // Shows game info header, round history, and conditionally embeds SavedBoards for board selection

        // Filter round history to only show rounds where player has participated (selected a board)
        // This prevents showing partial rounds where only opponent has selected
        const roundsWithPlayerParticipation = state.roundHistory.filter(r => r.playerBoard !== null);

        // For rounds 2-5, use the board size from Round 1 to enforce consistency
        // In round-by-round mode, all rounds must use the same board size as Round 1
        const effectiveBoardSize = currentRound > 1 && state.roundHistory.length > 0 && state.roundHistory[0]?.playerBoard
          ? state.roundHistory[0].playerBoard.boardSize
          : state.boardSize ?? 0;

        const winner = playerScore > opponentScore ? 'player' : opponentScore > playerScore ? 'opponent' : 'tie';

        return (
          <AllRoundsResults
            results={roundsWithPlayerParticipation}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={playerScore}
            opponentScore={opponentScore}
            winner={winner}
            isCpuOpponent={state.opponent?.type === 'cpu'}
            onPlayAgain={handleContinue}
            isReview={true}
            currentRound={currentRound}
            nextRound={currentRound}
            totalRounds={5}
            boardSize={effectiveBoardSize}
            onResendLink={() => setShowShareModal(true)}
            boards={savedBoards || []}
            onBoardSelected={handleBoardSelect}
            onBoardSaved={handleBoardSave}
            onBoardDeleted={handleBoardDelete}
            showBoardSelection={!waitingForOpponent}
            playerSelectedBoard={playerSelectedBoard ?? null}
            opponentSelectedBoard={opponentSelectedBoard ?? null}
            user={savedUser}
            waitingForOpponentBoard={waitingForOpponent}
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
          />
        );
      }

      case 'round-results':
        if (!phase.result) return null;
        // Check if we initiated this round (we selected board first)
        // If we selected first for THIS COMPLETED round, opponent needs to respond before we continue
        // We can tell by checking who went first in this round
        const completedRound = phase.result.round;
        const playerWentFirst = deriveWhoMovesFirst(completedRound, savedUser?.id || '', state.gameCreatorId) === 'player';
        // Only show waiting message if player went first AND the next round isn't ready yet
        // (meaning opponent hasn't responded to our challenge yet)
        // BUT: Never show waiting on Round 5 (final round) - game is over
        const nextRoundIndex = completedRound; // Next round is current + 1, but zero-indexed so it's just current
        const nextRoundExists = state.roundHistory[nextRoundIndex] !== undefined;
        const isFinalRound = completedRound === 5;
        const waitingForOpponent = state.opponent?.type === 'human' && playerWentFirst && !nextRoundExists && !isFinalRound;
        return (
          <RoundResults
            result={phase.result}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={playerScore}
            opponentScore={opponentScore}
            onContinue={handleContinue}
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
            waitingForOpponentResponse={waitingForOpponent}
            opponentDiscordId={state.opponent?.discordId}
            opponentDiscordAvatar={state.opponent?.discordAvatar}
          />
        );

      case 'all-rounds-results':
        if (!phase.results || phase.results.length === 0) return null;

        // Calculate winner
        let winner: 'player' | 'opponent' | 'tie';
        if (playerScore > opponentScore) {
          winner = 'player';
        } else if (opponentScore > playerScore) {
          winner = 'opponent';
        } else {
          winner = 'tie';
        }

        return (
          <AllRoundsResults
            results={phase.results}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={playerScore}
            opponentScore={opponentScore}
            winner={winner}
            onPlayAgain={handlePlayAgain}
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
            isCpuOpponent={state.opponent?.type === 'cpu' || state.opponent?.type === 'remote-cpu'}
          />
        );

      case 'game-over': {
        // Check if player should share final results with opponent
        // In multiplayer games, players can share final results
        const shouldShareResults = state.opponent?.type === 'human' && state.gameId && state.boardSize;

        // Filter round history to only include complete rounds (exclude Round 6 marker)
        const completeRounds = state.roundHistory.filter(r => r.playerBoard && r.opponentBoard);

        return (
          <GameOver
            winner={phase.winner}
            playerName={state.user.name}
            opponentName={state.opponent?.name || 'Opponent'}
            playerScore={playerScore}
            opponentScore={opponentScore}
            roundHistory={completeRounds}
            playerStats={state.user.stats}
            onNewGame={handlePlayAgain}
            {...(shouldShareResults && { onShare: () => setPhase({ type: 'share-final-results' }) })}
            showCompleteResultsByDefault={state.user.preferences?.showCompleteRoundResults ?? false}
            onShowCompleteResultsChange={handleShowCompleteResultsChange}
            explanationStyle={state.user.preferences?.explanationStyle ?? 'lively'}
            onExplanationStyleChange={handleExplanationStyleChange}
          />
        );
      }

      default:
        return <p>Unknown phase</p>;
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1>Spaces Game</h1>
          <p>A turn-based strategy board game</p>
        </div>
        {state.user.name && (
          <div className={styles.headerActions}>
            {/* Home button - show when not on board-management or tutorial */}
            {phase.type !== 'board-management' &&
              phase.type !== 'user-setup' &&
              !phase.type.startsWith('tutorial') && (
                <button
                  className={styles.homeButton}
                  onClick={handleGoHome}
                  aria-label="Go to home"
                >
                  🏠 Home
                </button>
              )}
            <button
              className={styles.profileButton}
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="Open profile"
            >
              <span className={styles.profileIcon}>👤</span>
              <span className={styles.profileName}>{state.user.name}</span>
            </button>
          </div>
        )}
      </header>
      <main className={styles.main}>{renderPhase()}</main>

      {/* Profile Modal */}
      {isProfileModalOpen && state.user.name && (
        <ProfileModal
          user={state.user}
          onUpdate={handleProfileUpdate}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Challenge Received Modal */}
      {showChallengeModal && incomingChallenge && (
        <ChallengeReceivedModal
          isOpen={showChallengeModal}
          challengerName={incomingChallenge.playerName}
          boardSize={incomingChallenge.boardSize}
          round={incomingChallenge.round}
          isOngoing={state.gameId === incomingChallenge.gameId}
          challengerHasDiscord={!!incomingChallenge.playerDiscordId}
          {...(incomingChallenge.playerDiscordUsername && { challengerDiscordUsername: incomingChallenge.playerDiscordUsername })}
          userHasDiscord={!!(savedUser?.discordId && savedUser?.discordUsername)}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
          onConnectDiscord={handleConnectDiscordFromChallenge}
          isConnectingDiscord={isConnectingDiscord}
        />
      )}

      {/* Completed Round Modal */}
      {showCompletedRoundModal && completedRoundInfo && (
        <CompletedRoundModal
          isOpen={showCompletedRoundModal}
          opponentName={completedRoundInfo.opponentName}
          round={completedRoundInfo.round}
          onGoHome={() => {
            setShowCompletedRoundModal(false);
            setCompletedRoundInfo(null);
            handleGoHome();
          }}
        />
      )}

      {/* Remove Opponent Modal */}
      {opponentToRemove && (
        <RemoveOpponentModal
          opponent={opponentToRemove}
          onArchive={() => handleArchiveOpponent(opponentToRemove.id)}
          onDelete={() => handleDeleteOpponent(opponentToRemove.id)}
          onCancel={() => setOpponentToRemove(null)}
        />
      )}

      {/* Welcome Modal (CPU Tougher introduction) */}
      {showWelcomeModal && state.user.name && (
        <WelcomeModal
          playerName={state.user.name}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}

      {/* Share Challenge Modal (for round-review re-send link) */}
      {showShareModal && phase.type === 'round-review' && state.boardSize && state.opponent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <ShareChallenge
            challengeUrl={shortenedChallengeUrl || '#'}
            {...(fallbackCompressedUrl && { fallbackUrl: fallbackCompressedUrl })}
            opponentName={state.opponent.name}
            boardSize={state.boardSize}
            round={currentRound}
            onCancel={() => setShowShareModal(false)}
            opponentHasDiscord={!!state.opponent.discordId}
            userHasDiscord={!!savedUser?.discordId}
            onConnectDiscord={() => setIsProfileModalOpen(true)}
            isConnectingDiscord={isConnectingDiscord}
            lastDiscordNotificationTime={lastNotificationTimestamp}
            isGeneratingUrl={isGeneratingUrl}
          />
        </div>
      )}

      {/* Generating Modal (CPU boards/decks generation) */}
      {isGeneratingCpuBoards && state.opponent && (
        <GeneratingModal
          opponentName={state.opponent.name}
          boardSize={generatingSize}
        />
      )}

      {/* Feature Unlock Modal */}
      {showFeatureUnlockModal && (
        <FeatureUnlockModal
          unlockedBoardSizes={unlockedBoardSizes}
          deckModeUnlocked={deckModeJustUnlocked}
          onContinue={() => setShowFeatureUnlockModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
