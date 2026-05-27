import { Events, type MessageReaction, type User } from 'discord.js';
import { prisma } from '@kingdomcord/db';
import { PointsService } from '../services/points.service';
import { logger } from '../logger';

export const name = Events.MessageReactionAdd;

export async function execute(reaction: MessageReaction, user: User): Promise<void> {
  if (user.bot) return;
  if (!reaction.message.guild) return;

  // Fetch partials so we have full data for messages the bot didn't see sent
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();

  const messageId = reaction.message.id;
  const guildId = reaction.message.guild.id;

  const dailyPost = await prisma.dailyPost.findUnique({ where: { messageId } });
  if (!dailyPost) return;

  // Idempotent: one KP award per user per daily post
  const existing = await prisma.dailyPostReaction.findUnique({
    where: { dailyPostId_userId: { dailyPostId: dailyPost.id, userId: user.id } },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.dailyPostReaction.create({
      data: { dailyPostId: dailyPost.id, userId: user.id, guildId },
    }),
    prisma.dailyPost.update({
      where: { id: dailyPost.id },
      data: { engagementCount: { increment: 1 } },
    }),
  ]);

  await PointsService.adjust(guildId, user.id, user.username, 5, 'Daily verse reaction');

  logger.info({ guildId, userId: user.id }, 'Awarded 5 KP for daily verse reaction');
}
