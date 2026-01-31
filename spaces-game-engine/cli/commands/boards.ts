import chalk from 'chalk';
import inquirer from 'inquirer';
import { buildBoard } from '../interactive/builder.js';
import { renderBoardWithMetadata } from '../interactive/visualizer.js';
import {
  createCollection,
  loadCollection,
  addBoardToCollection,
  findDuplicateBoard,
  getBoardByIndex,
  fileExists,
  type BoardWithMetadata,
} from '../utils/file-manager.js';

/**
 * Create a new board collection
 */
export async function createBoardCollection(filePath: string): Promise<void> {
  // Check if file already exists
  if (await fileExists(filePath)) {
    console.log(chalk.red(`❌ Collection file already exists: ${filePath}`));
    console.log(chalk.gray('Use "boards add" to add to an existing collection'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n📋 Create Board Collection\n'));

  // Prompt for collection metadata
  const metadataAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Collection name (optional):',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Collection description (optional):',
    },
  ]);

  // Create collection file
  await createCollection(filePath, metadataAnswer.name || undefined, metadataAnswer.description || undefined);

  console.log(chalk.green(`✅ Collection created: ${filePath}\n`));

  // Build first board
  console.log(chalk.bold('Build first board:\n'));
  const board = await buildBoard();

  if (!board) {
    console.log(chalk.yellow('Board creation cancelled'));
    return;
  }

  // Prompt for board metadata
  const boardMetadata = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Board name (optional):',
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated, optional):',
    },
  ]);

  const tags = boardMetadata.tags
    ? boardMetadata.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    : undefined;

  // Add board to collection
  await addBoardToCollection(filePath, board, {
    name: boardMetadata.name || undefined,
    tags,
  });

  console.log(chalk.green(`\n✅ Board added to collection at index 0`));
  console.log(chalk.gray(`Collection: ${filePath}`));
}

/**
 * Add a board to an existing collection
 */
export async function addBoardToExistingCollection(filePath: string): Promise<void> {
  // Load existing collection
  let collection;
  try {
    collection = await loadCollection(filePath);
  } catch (error) {
    console.log(chalk.red(`❌ ${(error as Error).message}`));
    console.log(chalk.gray('Use "boards create" to create a new collection'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n➕ Add Board to Collection\n'));
  console.log(chalk.gray(`Collection: ${filePath}`));
  console.log(chalk.gray(`Current boards: ${collection.boards.length}\n`));

  // Build board
  const board = await buildBoard();

  if (!board) {
    console.log(chalk.yellow('Board creation cancelled'));
    return;
  }

  // Check for duplicate
  const duplicateIndex = findDuplicateBoard(collection, board);

  if (duplicateIndex !== -1) {
    console.log(chalk.yellow('\n⚠️  Duplicate board found!'));
    console.log(chalk.yellow(`This board already exists at index ${duplicateIndex}\n`));

    // Show existing board
    const existingBoard = getBoardByIndex(collection, duplicateIndex);
    if (existingBoard) {
      console.log(renderBoardWithMetadata(existingBoard, { showMetadata: true }));
      console.log();
    }

    // Ask if they want to save anyway
    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: 'Save anyway?',
        default: false,
      },
    ]);

    if (!confirmAnswer.save) {
      console.log(chalk.yellow('Board not saved'));
      return;
    }
  }

  // Prompt for board metadata
  const boardMetadata = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Board name (optional):',
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated, optional):',
    },
  ]);

  const tags = boardMetadata.tags
    ? boardMetadata.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    : undefined;

  // Add board to collection
  const updatedCollection = await addBoardToCollection(filePath, board, {
    name: boardMetadata.name || undefined,
    tags,
  });

  const newIndex = updatedCollection.boards.length - 1;

  console.log(chalk.green(`\n✅ Board added to collection at index ${newIndex}`));
  console.log(chalk.gray(`Total boards: ${updatedCollection.boards.length}`));
}

/**
 * List boards in a collection
 */
export async function listBoardCollection(
  filePath: string,
  options: { compact?: boolean; verbose?: boolean } = {}
): Promise<void> {
  // Load collection
  let collection;
  try {
    collection = await loadCollection(filePath);
  } catch (error) {
    console.log(chalk.red(`❌ ${(error as Error).message}`));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n📋 Board Collection\n'));

  // Show collection metadata
  if (collection.name) {
    console.log(chalk.bold(`Name: ${collection.name}`));
  }
  if (collection.description) {
    console.log(chalk.gray(`Description: ${collection.description}`));
  }
  console.log(chalk.gray(`Created: ${new Date(collection.createdAt).toLocaleString()}`));
  console.log(chalk.gray(`Total boards: ${collection.boards.length}`));
  console.log();

  if (collection.boards.length === 0) {
    console.log(chalk.yellow('No boards in collection'));
    return;
  }

  // Display boards
  for (const board of collection.boards) {
    if (options.compact) {
      // Compact format: index, name, tags only
      const name = board.name || chalk.gray('(unnamed)');
      const tags = board.tags && board.tags.length > 0 ? chalk.gray(`[${board.tags.join(', ')}]`) : '';
      console.log(`${chalk.bold(`[${board.index}]`)} ${name} ${tags}`);
    } else {
      // Full visualization
      console.log(chalk.bold(`─── Board ${board.index} ───`));
      console.log();
      console.log(renderBoardWithMetadata(board, {
        showMetadata: true,
        showSequence: options.verbose,
      }));
      console.log();
    }
  }
}
