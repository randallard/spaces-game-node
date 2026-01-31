#!/usr/bin/env node

import { Command } from 'commander';
import { buildBoard } from './interactive/builder.js';
import { createBoardCollection, addBoardToExistingCollection, listBoardCollection } from './commands/boards.js';
import { startSession, showSessionInfo, saveSession, discardSession, listAllSessions, replaySession } from './commands/session.js';
import { runTest } from './commands/test.js';
import { generateBoards } from './commands/generate-boards.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('spaces-cli')
  .description('CLI testing tool for Spaces Game RL/ML training')
  .version('1.0.0');

// Session commands
const session = program
  .command('session')
  .description('Manage test sessions');

session
  .command('start')
  .description('Start a new test session')
  .option('--name <name>', 'Session name')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    await startSession(options);
  });

session
  .command('info')
  .description('Show current session info')
  .action(async () => {
    await showSessionInfo();
  });

session
  .command('save')
  .description('Save and close current session')
  .option('--name <name>', 'Session name')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    await saveSession(options);
  });

session
  .command('discard')
  .description('Discard current session')
  .action(async () => {
    await discardSession();
  });

session
  .command('list')
  .description('List all sessions')
  .action(async () => {
    await listAllSessions();
  });

session
  .command('replay <id>')
  .description('Replay a saved session')
  .option('-v, --verbose', 'Show all boards during replay')
  .action(async (id, options) => {
    await replaySession(id, options);
  });

// Boards commands
const boards = program
  .command('boards')
  .description('Manage board collections');

boards
  .command('create <file>')
  .description('Create a new board collection')
  .argument('<file>', 'Collection file path')
  .action(async (file) => {
    await createBoardCollection(file);
  });

boards
  .command('add <file>')
  .description('Add board to existing collection')
  .argument('<file>', 'Collection file path')
  .action(async (file) => {
    await addBoardToExistingCollection(file);
  });

boards
  .command('list <file>')
  .description('List boards in a collection')
  .argument('<file>', 'Collection file path')
  .option('--compact', 'Show compact list (index, name, tags only)')
  .option('--verbose', 'Show verbose output with full sequence details')
  .action(async (file, options) => {
    await listBoardCollection(file, options);
  });

// Test command
program
  .command('test')
  .description('Run a simulation test')
  .option('-i, --interactive', 'Interactive board builder mode')
  .option('-l, --last', 'Re-run the last test')
  .option('-n, --new-opponent', 'Re-run last player board with new distinct random opponent')
  .option('--player <board>', 'Player board (JSON, file path, or collection:index)')
  .option('--opponent <board>', 'Opponent board (JSON, file path, collection:index, or "random")')
  .option('--size <size>', 'Board size (2-5) for interactive mode')
  .option('--start-col <col>', 'Starting column (0-4) for interactive mode')
  .option('--expected <outcome>', 'Expected outcome (player/opponent/tie/winner)')
  .option('--notes <notes>', 'Test notes')
  .action(async (options) => {
    await runTest(options);
  });

// Generate boards command
program
  .command('generate-boards')
  .description('Generate all possible legal opponent boards for a given size')
  .requiredOption('--size <n>', 'Board size (2-99)')
  .option('--limit <n>', 'Maximum number of boards to generate (default: 500)', '500')
  .option('--output <file>', 'Save boards to file (in current directory)')
  .option('--force', 'Regenerate even if cache exists')
  .option('--view', 'Display all generated boards visually (5 per page)')
  .action(async (options) => {
    await generateBoards(options);
  });

program.parse();
