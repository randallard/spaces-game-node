/**
 * Discord Bot Server for Spaces Game Notifications
 *
 * Receives notification requests via HTTP and sends Discord DMs
 */

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3002;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_KEY = process.env.API_KEY || 'dev-api-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Validate environment variables
if (!BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is required');
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

type NotificationData = TurnReadyNotification | GameCompleteNotification | ChallengeSentNotification;

interface NotificationRequest {
  discordId: string;
  eventType: 'turn-ready' | 'game-complete' | 'challenge-sent';
  gameData: NotificationData;
}

// Format notification message based on type
function formatNotificationMessage(data: NotificationData): string {
  switch (data.type) {
    case 'turn-ready':
      return `🎮 **Your turn in Spaces Game!**\n\n` +
        `${data.playerName} has completed Round ${data.round}.\n` +
        `It's your move!\n\n` +
        `${data.gameUrl}`;

    case 'game-complete':
      const resultEmoji = data.result === 'win' ? '🎉' : data.result === 'loss' ? '😔' : '🤝';
      const resultText = data.result === 'win' ? 'You won!' : data.result === 'loss' ? 'You lost' : "It's a tie!";
      return `${resultEmoji} **Game Complete!**\n\n` +
        `${resultText}\n` +
        `Final Score: ${data.playerScore} - ${data.opponentScore}\n\n` +
        `${data.gameUrl}`;

    case 'challenge-sent':
      return `⚔️ **New Challenge!**\n\n` +
        `${data.playerName} has challenged you to a ${data.boardSize}×${data.boardSize} game!\n\n` +
        `${data.gameUrl}`;

    default:
      return 'You have a new notification from Spaces Game!';
  }
}

// Send Discord DM
async function sendDiscordDM(discordId: string, message: string): Promise<boolean> {
  try {
    console.log(`[BOT] Attempting to send DM to user ${discordId}`);

    const user = await client.users.fetch(discordId);
    if (!user) {
      console.error(`[BOT] User ${discordId} not found`);
      return false;
    }

    console.log(`[BOT] Found user: ${user.tag}, attempting to send DM...`);
    await user.send(message);
    console.log(`[BOT] ✅ DM sent successfully to ${user.tag}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[BOT] ❌ Failed to send DM to ${discordId}:`, error.message);
      console.error(`[BOT] Error details:`, error.stack);
    } else {
      console.error(`[BOT] ❌ Failed to send DM to ${discordId}:`, error);
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
    console.warn('[BOT] Unauthorized notification request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { discordId, eventType, gameData } = req.body as NotificationRequest;

  if (!discordId || !eventType || !gameData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`[BOT] Received ${eventType} notification for user ${discordId}`);

  // Check if bot is ready
  if (!client.isReady()) {
    console.error('[BOT] Bot is not ready yet');
    return res.status(503).json({ error: 'Bot is not ready' });
  }

  // Format and send message
  const message = formatNotificationMessage(gameData);
  const success = await sendDiscordDM(discordId, message);

  if (success) {
    res.json({ success: true, message: 'Notification sent' });
  } else {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Discord bot event handlers
client.once('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
  console.log(`🚀 Bot server running on port ${PORT}`);
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

// Start the bot
async function start() {
  try {
    console.log('🔄 Logging in to Discord...');
    await client.login(BOT_TOKEN);

    // Start Express server after bot is ready
    app.listen(PORT, () => {
      console.log(`📡 HTTP server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

start();
