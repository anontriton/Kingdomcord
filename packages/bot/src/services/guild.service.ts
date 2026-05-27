import { prisma } from '@kingdomcord/db';
import type { GuildConfig, Snowflake } from '@kingdomcord/shared';

const DEFAULT_CONFIG: GuildConfig = {
  timezone: 'America/New_York',
  channels: {},
  season: { lengthDays: 90 },
};

export const GuildService = {
  async upsert(guildId: Snowflake, name: string) {
    return prisma.guild.upsert({
      where: { guildId },
      update: { name },
      create: { guildId, name, config: DEFAULT_CONFIG as object },
    });
  },

  async getConfig(guildId: Snowflake): Promise<GuildConfig> {
    const guild = await prisma.guild.findUnique({ where: { guildId } });
    if (!guild) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...(guild.config as Partial<GuildConfig>) };
  },

  async setChannel(
    guildId: Snowflake,
    channelType: keyof GuildConfig['channels'],
    channelId: Snowflake,
  ) {
    const config = await GuildService.getConfig(guildId);
    config.channels[channelType] = channelId;
    await prisma.guild.update({ where: { guildId }, data: { config: config as object } });
  },
};
