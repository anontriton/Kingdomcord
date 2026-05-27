import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import pino from 'pino';

export const logger = pino({
  name: 'kingdomcord',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('clientReady', (c) => {
  logger.info({ tag: c.user.tag }, 'Bot ready');
});

client.on('error', (error) => {
  logger.error({ error }, 'Discord client error');
});

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error('DISCORD_TOKEN is not set');

client.login(token).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error({ message }, 'Failed to login');
  process.exit(1);
});
