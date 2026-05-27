import { Events, type Guild } from 'discord.js';
import { GuildService } from '../services/guild.service';
import { logger } from '../logger';

export const name = Events.GuildCreate;

export async function execute(guild: Guild): Promise<void> {
  await GuildService.upsert(guild.id, guild.name);
  logger.info({ guildId: guild.id, name: guild.name }, 'Bot joined new guild');
}
