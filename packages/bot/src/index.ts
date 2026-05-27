import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import './types';
import { logger } from './logger';
import type { Command } from './types';
import * as leaderboardCommand from './commands/leaderboard';
import * as adminCommand from './commands/admin';
import * as guildCreateEvent from './events/guildCreate';
import * as interactionCreateEvent from './events/interactionCreate';
import * as messageReactionAddEvent from './events/messageReactionAdd';
import { startDailyVerseJob } from './jobs/dailyVerse';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  // Partials needed to receive reaction events on messages the bot didn't see sent
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection<string, Command>();
for (const cmd of [leaderboardCommand, adminCommand] as Command[]) {
  client.commands.set(cmd.data.name, cmd);
}

client.on(guildCreateEvent.name, guildCreateEvent.execute);
client.on(interactionCreateEvent.name, interactionCreateEvent.execute);
client.on(messageReactionAddEvent.name, messageReactionAddEvent.execute);

client.once('clientReady', (c) => {
  logger.info({ tag: c.user.tag }, 'Bot ready');
  startDailyVerseJob(client);
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
