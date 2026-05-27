import { prisma } from '@kingdomcord/db';
import type { Snowflake } from '@kingdomcord/shared';

export const PointsService = {
  async adjust(
    guildId: Snowflake,
    userId: Snowflake,
    username: string,
    delta: number,
    reason: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { userId_guildId: { userId, guildId } },
        update: {
          username,
          kingdomPoints: { increment: delta },
          ...(delta > 0 && { lifetimePoints: { increment: delta } }),
          lastActive: new Date(),
        },
        create: {
          userId,
          guildId,
          username,
          kingdomPoints: Math.max(0, delta),
          lifetimePoints: delta > 0 ? delta : 0,
          lastActive: new Date(),
        },
      });

      await tx.pointsLedger.create({ data: { userId, guildId, delta, reason } });

      return user;
    });
  },

  async getLeaderboard(guildId: Snowflake, limit = 10) {
    return prisma.user.findMany({
      where: { guildId },
      orderBy: { kingdomPoints: 'desc' },
      take: limit,
    });
  },
};
