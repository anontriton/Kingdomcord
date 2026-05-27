import { prisma } from '@kingdomcord/db';
import type { GuildConfig, Snowflake } from '@kingdomcord/shared';

export const DEFAULT_CONFIG: GuildConfig = {
  timezone: 'America/New_York',
  bibleId: '78a9f6124f344018-01', // NIV 2011
  kp: {
    reactionAmount: 5,
    triviaAmount: 10,
    reflectionAmount: 8,
    streakBonusMultiplier: 1.5,
  },
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
    // Deep merge so partial configs stored in DB still get all defaults
    const stored = guild.config as Partial<GuildConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...stored,
      kp: { ...DEFAULT_CONFIG.kp, ...stored.kp },
      channels: { ...DEFAULT_CONFIG.channels, ...stored.channels },
      season: { ...DEFAULT_CONFIG.season, ...stored.season },
    };
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

  async setKp(
    guildId: Snowflake,
    key: keyof GuildConfig['kp'],
    value: number,
  ) {
    const config = await GuildService.getConfig(guildId);
    config.kp[key] = value;
    await prisma.guild.update({ where: { guildId }, data: { config: config as object } });
  },
};
