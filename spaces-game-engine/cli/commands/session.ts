import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import {
  createSession,
  loadSession,
  updateSessionMetadata,
  deleteSession,
  listSessions,
  type Session,
} from '../utils/file-manager.js';
import { simulateRound } from '../../src/simulation.js';
import { renderBoardsSideBySide } from '../interactive/visualizer.js';

// State file to track active session and last test
const STATE_FILE = path.join(process.cwd(), '.cli-state.json');

type CliState = {
  activeSessionId?: string;
  lastTest?: {
    playerBoard: any;
    opponentBoard: any;
    expected?: string;
    notes?: string;
  };
};

/**
 * Load CLI state
 */
async function loadState(): Promise<CliState> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save CLI state
 */
async function saveState(state: CliState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Get active session ID
 */
export async function getActiveSessionId(): Promise<string | null> {
  const state = await loadState();
  return state.activeSessionId || null;
}

/**
 * Get or create active session
 * If no session is active, creates one with default name
 */
export async function getOrCreateActiveSession(): Promise<string> {
  let activeSessionId = await getActiveSessionId();

  if (!activeSessionId) {
    // Create auto session with reasonable defaults
    const now = new Date();
    const defaultName = `Auto Session ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const session = await createSession(defaultName, ['auto']);

    // Set as active session
    await setActiveSessionId(session.id);

    console.log(chalk.gray(`\n📝 Auto-created session: ${session.id}`));
    console.log(chalk.gray(`   All tests will be logged and can be replayed later.\n`));

    activeSessionId = session.id;
  }

  return activeSessionId;
}

/**
 * Save last test to state for --last flag
 */
export async function saveLastTest(test: {
  playerBoard: any;
  opponentBoard: any;
  expected?: string;
  notes?: string;
}): Promise<void> {
  const state = await loadState();
  state.lastTest = test;
  await saveState(state);
}

/**
 * Get last test from state
 */
export async function getLastTest(): Promise<{
  playerBoard: any;
  opponentBoard: any;
  expected?: string;
  notes?: string;
} | null> {
  const state = await loadState();
  return state.lastTest || null;
}

/**
 * Get all opponent boards used in the current session
 */
export async function getSessionOpponentBoards(): Promise<any[]> {
  const activeSessionId = await getActiveSessionId();
  if (!activeSessionId) {
    return [];
  }

  try {
    const session = await loadSession(activeSessionId);
    return session.tests.map(test => test.opponentBoard);
  } catch {
    return [];
  }
}

/**
 * Set active session ID
 */
async function setActiveSessionId(sessionId: string | null): Promise<void> {
  const state = await loadState();
  if (sessionId) {
    state.activeSessionId = sessionId;
  } else {
    delete state.activeSessionId;
  }
  await saveState(state);
}

/**
 * Start a new test session
 */
export async function startSession(options: { name?: string; tags?: string }): Promise<void> {
  // Check if there's already an active session
  const activeSessionId = await getActiveSessionId();
  if (activeSessionId) {
    try {
      const activeSession = await loadSession(activeSessionId);
      console.log(chalk.yellow('⚠️  Active session already exists:'));
      console.log(chalk.gray(`   ID: ${activeSession.id}`));
      console.log(chalk.gray(`   Tests: ${activeSession.tests.length}`));
      console.log(chalk.yellow('\nPlease save or discard the current session first.'));
      return;
    } catch {
      // Active session file doesn't exist, clear it
      await setActiveSessionId(null);
    }
  }

  // Parse tags
  const tags = options.tags
    ? options.tags.split(',').map(t => t.trim()).filter(t => t)
    : undefined;

  // Create new session
  const session = await createSession(options.name, tags);

  // Set as active session
  await setActiveSessionId(session.id);

  console.log(chalk.green('✅ Session started\n'));
  console.log(chalk.gray(`Session ID: ${session.id}`));
  if (session.name) {
    console.log(chalk.gray(`Name: ${session.name}`));
  }
  if (session.tags && session.tags.length > 0) {
    console.log(chalk.gray(`Tags: ${session.tags.join(', ')}`));
  }
  console.log(chalk.gray(`File: test-sessions/${session.id}.json`));
  console.log(chalk.gray(`\nAll tests will be automatically logged to this session.`));
}

/**
 * Show current session info
 */
export async function showSessionInfo(): Promise<void> {
  const activeSessionId = await getActiveSessionId();

  if (!activeSessionId) {
    console.log(chalk.yellow('⚠️  No active session'));
    console.log(chalk.gray('Use "session start" to begin a new session'));
    return;
  }

  try {
    const session = await loadSession(activeSessionId);

    console.log(chalk.bold.cyan('\n📊 Active Session\n'));
    console.log(chalk.gray(`Session ID: ${session.id}`));
    if (session.name) {
      console.log(chalk.gray(`Name: ${session.name}`));
    }
    if (session.tags && session.tags.length > 0) {
      console.log(chalk.gray(`Tags: ${session.tags.join(', ')}`));
    }
    console.log(chalk.gray(`Started: ${new Date(session.startTime).toLocaleString()}`));
    console.log(chalk.gray(`Tests: ${session.tests.length}`));
    console.log(chalk.gray(`File: test-sessions/${session.id}.json`));
  } catch (error) {
    console.log(chalk.red(`❌ Error loading session: ${(error as Error).message}`));
    await setActiveSessionId(null);
  }
}

/**
 * Save and close current session
 */
export async function saveSession(options: { name?: string; tags?: string }): Promise<void> {
  const activeSessionId = await getActiveSessionId();

  if (!activeSessionId) {
    console.log(chalk.yellow('⚠️  No active session to save'));
    return;
  }

  try {
    const session = await loadSession(activeSessionId);

    // Update metadata if provided
    if (options.name || options.tags) {
      const tags = options.tags
        ? options.tags.split(',').map(t => t.trim()).filter(t => t)
        : undefined;

      await updateSessionMetadata(activeSessionId, {
        name: options.name,
        tags,
      });
    }

    // Clear active session
    await setActiveSessionId(null);

    console.log(chalk.green('✅ Session saved\n'));
    console.log(chalk.gray(`Session ID: ${session.id}`));
    console.log(chalk.gray(`Tests: ${session.tests.length}`));
    console.log(chalk.gray(`File: test-sessions/${session.id}.json`));
  } catch (error) {
    console.log(chalk.red(`❌ Error saving session: ${(error as Error).message}`));
  }
}

/**
 * Discard current session
 */
export async function discardSession(): Promise<void> {
  const activeSessionId = await getActiveSessionId();

  if (!activeSessionId) {
    console.log(chalk.yellow('⚠️  No active session to discard'));
    return;
  }

  try {
    const session = await loadSession(activeSessionId);

    // Delete session file
    await deleteSession(activeSessionId);

    // Clear active session
    await setActiveSessionId(null);

    console.log(chalk.yellow('🗑️  Session discarded\n'));
    console.log(chalk.gray(`Session ID: ${session.id}`));
    console.log(chalk.gray(`Tests discarded: ${session.tests.length}`));
  } catch (error) {
    console.log(chalk.red(`❌ Error discarding session: ${(error as Error).message}`));
  }
}

/**
 * List all sessions
 */
export async function listAllSessions(): Promise<void> {
  const sessions = await listSessions();

  console.log(chalk.bold.cyan('\n📋 Test Sessions\n'));

  if (sessions.length === 0) {
    console.log(chalk.gray('No sessions found'));
    console.log(chalk.gray('Use "session start" to create a new session'));
    return;
  }

  const activeSessionId = await getActiveSessionId();

  for (const session of sessions) {
    const isActive = session.id === activeSessionId;
    const prefix = isActive ? chalk.green('● ') : '  ';
    const name = session.name || chalk.gray('(unnamed)');
    const tags = session.tags && session.tags.length > 0 ? chalk.gray(`[${session.tags.join(', ')}]`) : '';
    const testCount = chalk.gray(`${session.testCount} tests`);
    const date = chalk.gray(new Date(session.startTime).toLocaleString());

    console.log(`${prefix}${chalk.bold(session.id)}`);
    console.log(`  ${name} ${tags}`);
    console.log(`  ${testCount} • ${date}`);
    console.log();
  }

  if (activeSessionId) {
    console.log(chalk.green('● = active session'));
  }
}

/**
 * Replay a session
 */
export async function replaySession(sessionId?: string, options: { verbose?: boolean } = {}): Promise<void> {
  // If no session ID provided, prompt user to select one
  if (!sessionId) {
    const sessions = await listSessions();

    if (sessions.length === 0) {
      console.log(chalk.yellow('⚠️  No sessions found'));
      console.log(chalk.gray('Use "session start" to create a new session'));
      return;
    }

    // Build choices for inquirer
    const choices = sessions.map(session => {
      const name = session.name || chalk.gray('(unnamed)');
      const tags = session.tags && session.tags.length > 0 ? chalk.gray(`[${session.tags.join(', ')}]`) : '';
      const testCount = chalk.gray(`${session.testCount} tests`);
      const date = chalk.gray(new Date(session.startTime).toLocaleDateString());

      return {
        name: `${session.id} - ${name} ${tags} - ${testCount} - ${date}`,
        value: session.id,
      };
    });

    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'sessionId',
      message: 'Select session to replay:',
      choices,
    }]);

    sessionId = answer.sessionId;
  }

  // Load session
  let session: Session;
  try {
    session = await loadSession(sessionId!);
  } catch (error) {
    console.log(chalk.red(`❌ Session not found: ${sessionId}`));
    console.log(chalk.gray('Use "session list" to see available sessions'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🔄 Session Replay\n'));
  console.log(chalk.gray(`Session: ${session.id}`));
  if (session.name) {
    console.log(chalk.gray(`Name: ${session.name}`));
  }
  if (session.tags && session.tags.length > 0) {
    console.log(chalk.gray(`Tags: ${session.tags.join(', ')}`));
  }
  console.log(chalk.gray(`Tests: ${session.tests.length}`));
  console.log();

  if (session.tests.length === 0) {
    console.log(chalk.yellow('⚠️  No tests to replay'));
    return;
  }

  let passCount = 0;
  let failCount = 0;
  let changedCount = 0;

  // Replay each test
  for (const test of session.tests) {
    console.log(chalk.bold(`─── Test ${test.testNumber} ───`));
    console.log(chalk.gray(`Timestamp: ${new Date(test.timestamp).toLocaleString()}`));
    if (test.notes) {
      console.log(chalk.gray(`Notes: ${test.notes}`));
    }
    console.log();

    // Re-run simulation
    const result = simulateRound(1, test.playerBoard, test.opponentBoard, { silent: true });

    // Compare with original
    const originalWinner = test.result.winner;
    const newWinner = result.winner;
    const changed = originalWinner !== newWinner;

    if (changed) {
      changedCount++;
      console.log(chalk.yellow('⚠️  Result changed!'));
      console.log(chalk.gray(`  Original: ${originalWinner}`));
      console.log(chalk.gray(`  Current:  ${newWinner}`));
      console.log();
    }

    // Show boards if verbose or if result changed
    if (options.verbose || changed) {
      console.log(renderBoardsSideBySide(test.playerBoard, test.opponentBoard, ['Player', 'Opponent']));
      console.log();
    }

    // Show result
    const winnerText =
      newWinner === 'player'
        ? chalk.green('🏆 PLAYER WINS')
        : newWinner === 'opponent'
        ? chalk.red('💀 OPPONENT WINS')
        : chalk.yellow('🤝 TIE');

    console.log(winnerText);
    console.log(chalk.gray(`  Player:   ${result.playerPoints} points`));
    console.log(chalk.gray(`  Opponent: ${result.opponentPoints} points`));
    console.log();

    // Check expected outcome
    if (test.expected) {
      const expectedWinner = test.expected.toLowerCase();
      const passed =
        expectedWinner === newWinner ||
        (expectedWinner === 'winner' && newWinner === 'player');

      if (passed) {
        passCount++;
        console.log(chalk.green('✓ Expected outcome: PASS'));
      } else {
        failCount++;
        console.log(chalk.red(`✗ Expected outcome: FAIL (expected ${test.expected}, got ${newWinner})`));
      }
    }

    console.log();
  }

  // Show summary
  console.log(chalk.bold('─── Summary ───'));
  console.log(chalk.gray(`Total tests: ${session.tests.length}`));

  const testsWithExpectations = session.tests.filter(t => t.expected).length;
  if (testsWithExpectations > 0) {
    console.log(chalk.green(`Passed: ${passCount}/${testsWithExpectations}`));
    if (failCount > 0) {
      console.log(chalk.red(`Failed: ${failCount}/${testsWithExpectations}`));
    }
  }

  if (changedCount > 0) {
    console.log(chalk.yellow(`⚠️  ${changedCount} test(s) changed results from original run`));
  } else {
    console.log(chalk.green('✓ All results match original run'));
  }
  console.log();
}
