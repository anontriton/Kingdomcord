import { Events, type MessageReaction, type User } from 'discord.js';
import { prisma } from '@kingdomcord/db';
import { PointsService } from '../services/points.service';
import { GuildService } from '../services/guild.service';
import { logger } from '../logger';

export const name = Events.MessageReactionAdd;

export async function execute(reaction: MessageReaction, user: User): Promise<void> {
  try {
    logger.debug({ userId: user.id, messageId: reaction.message.id }, 'Reaction received');

    if (user.bot) return;
    if (!reaction.message.guild) {
      logger.debug({ messageId: reaction.message.id }, 'Reaction not in guild, skipping');
      return;
    }

    // Fetch partials so we have full data for messages the bot didn't see sent
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const messageId = reaction.message.id;
    const guildId = reaction.message.guild.id;

    // Ensure the User row exists before creating DailyPostReaction (FK requirement).
    // A member reacting for the first time will not have a row yet.
    await prisma.user.upsert({
      where: { userId_guildId: { userId: user.id, guildId } },
      update: { username: user.username },
      create: { userId: user.id, guildId, username: user.username },
    });

    const dailyPost = await prisma.dailyPost.findUnique({ where: { messageId } });
    if (!dailyPost) {
      logger.debug({ messageId }, 'Reaction on non-daily-post message, skipping');
      return;
    }

    // Idempotent: one KP award per user per daily post
    const existing = await prisma.dailyPostReaction.findUnique({
      where: { dailyPostId_userId: { dailyPostId: dailyPost.id, userId: user.id } },
    });
    if (existing) {
      logger.debug({ userId: user.id }, 'User already reacted to this post, skipping');
      return;
    }

    await prisma.$transaction([
      prisma.dailyPostReaction.create({
        data: { dailyPostId: dailyPost.id, userId: user.id, guildId },
      }),
      prisma.dailyPost.update({
        where: { id: dailyPost.id },
        data: { engagementCount: { increment: 1 } },
      }),
    ]);

    const config = await GuildService.getConfig(guildId);
    const kpAmount = config.kp.reactionAmount;
    await PointsService.adjust(guildId, user.id, user.username, kpAmount, 'Daily verse reaction');

    logger.info({ guildId, userId: user.id, kpAmount }, 'Awarded KP for daily verse reaction');
  } catch (error) {
    logger.error({ error, messageId: reaction.message.id, userId: user.id }, 'messageReactionAdd handler failed');
  }
}
