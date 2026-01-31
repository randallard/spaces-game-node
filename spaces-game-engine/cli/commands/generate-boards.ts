import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  generateBoardsWithCache,
  estimateSearchSpace,
  getCacheInfo,
} from '../utils/board-generator.js';
import { saveCollection } from '../utils/file-manager.js';
import { renderGrid } from '../interactive/visualizer.js';
import type { BoardCollection, BoardWithMetadata } from '../utils/file-manager.js';
import type { Board } from '../../src/types/board.js';

/**
 * Generate boards command
 */
export async function generateBoards(options: {
  size: string;
  limit?: string;
  output?: string;
  force?: boolean;
  view?: boolean;
}): Promise<void> {
  // Parse options
  const size = parseInt(options.size);
  const limit = options.limit ? parseInt(options.limit) : 500;
  const force = options.force || false;

  // Validate size
  if (isNaN(size) || size < 2 || size > 99) {
    console.log(chalk.red('❌ Invalid board size. Must be between 2 and 99.'));
    process.exit(1);
  }

  // Validate limit
  if (isNaN(limit) || limit < 1) {
    console.log(chalk.red('❌ Invalid limit. Must be at least 1.'));
    process.exit(1);
  }

  // Check if cache already exists
  if (!force) {
    const cacheInfo = await getCacheInfo(size, limit);
    if (cacheInfo) {
      console.log(chalk.cyan('ℹ️  Cache already exists for size ' + size + ' with limit ' + limit));
      console.log(chalk.gray('   Cached: ' + cacheInfo.timestamp));
      console.log(chalk.gray('   Count: ' + cacheInfo.count + ' boards'));
      console.log();
      console.log(chalk.yellow('Use --force to regenerate'));

      // If output is specified, still save to file
      if (options.output) {
        console.log(chalk.cyan('\n📦 Saving to output file...'));
        await saveToOutputFile(cacheInfo.boards, options.output, size);
      }

      // View boards if requested
      if (options.view) {
        console.log(chalk.cyan(`\n👁️  Viewing ${cacheInfo.boards.length} boards:\n`));
        await viewBoardsPaged(cacheInfo.boards as Board[], 5);
      }

      console.log();
      return;
    }
  }

  // Show estimate
  const estimate = estimateSearchSpace(size);
  if (estimate > limit) {
    console.log(chalk.yellow(`⚠️  Estimated search space: ~${estimate.toLocaleString()} boards`));
    console.log(chalk.yellow(`   Generating up to ${limit.toLocaleString()} boards (limited by --limit)`));
  } else {
    console.log(chalk.cyan(`ℹ️  Estimated search space: ~${estimate.toLocaleString()} boards`));
  }

  console.log();
  console.log(chalk.cyan(`🔄 Generating boards for size ${size}...`));

  // Progress callback
  let lastProgress = 0;
  const progressCallback = (count: number) => {
    if (count - lastProgress >= 50 || count === limit) {
      process.stdout.write(chalk.gray(`   Generated ${count}/${limit} boards...\r`));
      lastProgress = count;
    }
  };

  // Generate boards
  const startTime = Date.now();
  const boards = await generateBoardsWithCache(size, limit, force, progressCallback);
  const elapsed = Date.now() - startTime;

  console.log(); // New line after progress
  console.log(chalk.green(`✓ Generated ${boards.length} boards in ${elapsed}ms`));
  console.log(chalk.gray(`   Cached to: /tmp/spaces-game-boards-size-${size}-limit-${limit}.json`));

  // Save to output file if specified
  if (options.output) {
    console.log(chalk.cyan('\n📦 Saving to output file...'));
    await saveToOutputFile(boards, options.output, size);
  }

  // View boards if requested
  if (options.view) {
    console.log(chalk.cyan(`\n👁️  Viewing ${boards.length} boards:\n`));
    await viewBoardsPaged(boards as Board[], 5);
  }

  console.log();
}

/**
 * View boards in visual format with paging
 */
async function viewBoardsPaged(boards: Board[], pageSize: number = 5): Promise<void> {
  let currentIndex = 0;

  while (currentIndex < boards.length) {
    // Show current page
    const endIndex = Math.min(currentIndex + pageSize, boards.length);

    for (let i = currentIndex; i < endIndex; i++) {
      const board = boards[i];
      console.log(chalk.bold(`Board ${i + 1}/${boards.length}:`));
      console.log(renderGrid(board, null));
      console.log();
    }

    // If we've shown all boards, we're done
    if (endIndex >= boards.length) {
      console.log(chalk.green('✓ Viewed all boards'));
      break;
    }

    // Ask if user wants to continue
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message: `View next ${Math.min(pageSize, boards.length - endIndex)} boards?`,
      default: true,
    }]);

    if (!answer.continue) {
      console.log(chalk.yellow(`Stopped at board ${endIndex}/${boards.length}`));
      break;
    }

    currentIndex = endIndex;
  }
}

/**
 * Save boards to output file as a collection
 */
async function saveToOutputFile(
  boards: Array<{ boardSize: number; grid: any; sequence: any }>,
  outputPath: string,
  size: number
): Promise<void> {
  // Convert boards to collection format
  const boardsWithMetadata: BoardWithMetadata[] = boards.map((board, index) => ({
    ...board,
    index,
    createdAt: new Date().toISOString(),
  }));

  const collection: BoardCollection = {
    name: `Generated Boards (Size ${size})`,
    description: `All possible legal opponent boards for size ${size}`,
    createdAt: new Date().toISOString(),
    boards: boardsWithMetadata,
  };

  await saveCollection(outputPath, collection);

  console.log(chalk.green(`✓ Saved ${boards.length} boards to ${outputPath}`));
}
