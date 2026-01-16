/**
 * Discord Bot Server for Spaces Game Notifications
 *
 * Receives notification requests via HTTP and sends Discord DMs
 */

import { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3002;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_KEY = process.env.API_KEY || 'dev-api-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Timestamped logging helper
const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);
const logError = (message: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] ${message}`, ...args);
const logWarn = (message: string) => console.warn(`[${new Date().toISOString()}] ${message}`);

// Validate environment variables
if (!BOT_TOKEN) {
  logError('❌ DISCORD_BOT_TOKEN is required');
  process.exit(1);
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
  ],
});

// Notification request types
interface TurnReadyNotification {
  type: 'turn-ready';
  playerName: string;
  round: number;
  gameUrl: string;
  boardSize?: number;
}

interface GameCompleteNotification {
  type: 'game-complete';
  playerName: string;
  result: 'win' | 'loss' | 'tie';
  gameUrl: string;
  playerScore: number;
  opponentScore: number;
}

interface ChallengeSentNotification {
  type: 'challenge-sent';
  playerName: string;
  gameUrl: string;
  boardSize: number;
}

interface RoundCompleteNotification {
  type: 'round-complete';
  playerName: string;
  round: number;
  gameUrl: string;
  result: 'win' | 'loss' | 'tie';
  playerScore: number;
  opponentScore: number;
  boardSize?: number;
}

type NotificationData = TurnReadyNotification | GameCompleteNotification | ChallengeSentNotification | RoundCompleteNotification;

interface NotificationRequest {
  discordId: string;
  eventType: 'turn-ready' | 'game-complete' | 'challenge-sent' | 'round-complete';
  gameData: NotificationData;
}

// Format notification message based on type
function formatNotificationMessage(data: NotificationData): string {
  switch (data.type) {
    case 'turn-ready':
      return `🎮 **Your turn in Spaces Game!**\n\n` +
        `${data.playerName} has completed Round ${data.round}.\n` +
        `It's your move!`;

    case 'game-complete':
      const resultEmoji = data.result === 'win' ? '🎉' : data.result === 'loss' ? '😔' : '🤝';
      const resultText = data.result === 'win' ? 'You won!' : data.result === 'loss' ? 'You lost' : "It's a tie!";
      return `${resultEmoji} **Game Complete!**\n\n` +
        `${resultText}\n` +
        `Final Score: ${data.playerScore} - ${data.opponentScore}`;

    case 'challenge-sent':
      return `⚔️ **New Challenge!**\n\n` +
        `${data.playerName} has challenged you to a ${data.boardSize}×${data.boardSize} game!`;

    case 'round-complete':
      const roundResultEmoji = data.result === 'win' ? '🎉' : data.result === 'loss' ? '😢' : '🤝';
      const roundResultText = data.result === 'win' ? 'You won!' : data.result === 'loss' ? 'You lost' : "It's a tie!";
      return `${roundResultEmoji} **Round ${data.round} Complete!**\n\n` +
        `${data.playerName} has finished their turn.\n` +
        `${roundResultText}\n` +
        `Current Score: ${data.playerScore} - ${data.opponentScore}\n\n` +
        `Review the round and play your next move:`;

    default:
      return 'You have a new notification from Spaces Game!';
  }
}

// Send Discord DM with embed and button (supports long URLs)
async function sendDiscordDM(discordId: string, message: string, gameUrl?: string): Promise<boolean> {
  try {
    log(`[BOT] Attempting to send DM to user ${discordId}`);

    const user = await client.users.fetch(discordId);
    if (!user) {
      logError(`[BOT] User ${discordId} not found`);
      return false;
    }

    log(`[BOT] Found user: ${user.tag}, attempting to send DM...`);

    // If we have a gameUrl, use an embed with a button (if URL is short enough)
    if (gameUrl) {
      const MAX_BUTTON_URL_LENGTH = 512; // Discord's limit for button URLs

      if (gameUrl.length <= MAX_BUTTON_URL_LENGTH) {
        // URL is short enough for a button
        const embed = new EmbedBuilder()
          .setDescription(message)
          .setColor(0x5865F2); // Discord blurple

        const button = new ButtonBuilder()
          .setLabel('Play Game')
          .setStyle(ButtonStyle.Link)
          .setURL(gameUrl);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await user.send({ embeds: [embed], components: [row] });
      } else {
        // URL is too long for button, include it in the message
        log(`[BOT] URL too long for button (${gameUrl.length} chars), sending as text`);
        const embed = new EmbedBuilder()
          .setDescription(`${message}\n\n**Game Link:**\n${gameUrl}`)
          .setColor(0x5865F2); // Discord blurple

        await user.send({ embeds: [embed] });
      }
    } else {
      // No URL, just send plain message
      await user.send(message);
    }

    log(`[BOT] ✅ DM sent successfully to ${user.tag}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logError(`[BOT] ❌ Failed to send DM to ${discordId}:`, error.message);
      logError(`[BOT] Error details:`, error.stack);
    } else {
      logError(`[BOT] ❌ Failed to send DM to ${discordId}:`, error);
    }
    return false;
  }
}

// Initialize Express server
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const isReady = client.isReady();
  res.json({
    status: isReady ? 'ok' : 'initializing',
    botReady: isReady,
    uptime: process.uptime(),
  });
});

// Notification endpoint
app.post('/notify', async (req, res) => {
  // Verify API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    logWarn('[BOT] Unauthorized notification request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { discordId, eventType, gameData } = req.body as NotificationRequest;

  if (!discordId || !eventType || !gameData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  log(`[BOT] Received ${eventType} notification for user ${discordId}`);

  // Check if bot is ready
  if (!client.isReady()) {
    logError('[BOT] Bot is not ready yet');
    return res.status(503).json({ error: 'Bot is not ready' });
  }

  // Format and send message
  const message = formatNotificationMessage(gameData);
  const success = await sendDiscordDM(discordId, message, gameData.gameUrl);

  if (success) {
    res.json({ success: true, message: 'Notification sent' });
  } else {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Discord bot event handlers
client.once('clientReady', () => {
  log(`✅ Discord bot logged in as ${client.user?.tag}`);
  log(`🚀 Bot server running on port ${PORT}`);
});

client.on('error', (error) => {
  logError('❌ Discord client error:', error);
});

// Start the bot
async function start() {
  try {
    log('🔄 Logging in to Discord...');
    await client.login(BOT_TOKEN);

    // Start Express server after bot is ready
    app.listen(PORT, () => {
      log(`📡 HTTP server listening on port ${PORT}`);
    });
  } catch (error) {
    logError('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

start();
