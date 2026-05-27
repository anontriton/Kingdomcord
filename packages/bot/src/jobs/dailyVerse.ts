import { schedule } from 'node-cron';
import { EmbedBuilder, type Client, type TextBasedChannel } from 'discord.js';
import { prisma } from '@kingdomcord/db';
import { BibleService } from '../services/bible.service';
import { GuildService } from '../services/guild.service';
import { logger } from '../logger';

export function startDailyVerseJob(client: Client): void {
  // 8:00 AM every day — timezone-aware scheduling is a Phase 2 concern
  schedule('0 8 * * *', () => {
    postDailyVerseToAllGuilds(client).catch((err: unknown) => {
      logger.error({ err }, 'Daily verse job failed');
    });
  });
  logger.info('Daily verse job scheduled (08:00 daily)');
}

export async function postDailyVerseToAllGuilds(client: Client): Promise<void> {
  const guilds = await prisma.guild.findMany();
  const results = await Promise.allSettled(guilds.map((g) => postDailyVerse(client, g.guildId)));
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      logger.error({ guildId: guilds[i]?.guildId, err: result.reason }, 'Failed to post daily verse to guild');
    }
  });
}

async function postDailyVerse(client: Client, guildId: string): Promise<void> {
  const config = await GuildService.getConfig(guildId);
  const channelId = config.channels.dailyWord;
  if (!channelId) return;

  const channel = (await client.channels.fetch(channelId)) as TextBasedChannel | null;
  if (!channel?.isSendable()) return;

  const verseId = BibleService.getDailyVerseId();
  const verse = await BibleService.getVerse(verseId, config.bibleId);

  const embed = new EmbedBuilder()
    .setColor(0x7b2d8b)
    .setTitle('📖 Daily Word')
    .setDescription(`*"${verse.text}"*`)
    .setFooter({ text: `${verse.reference} · React to earn 5 KP` })
    .setTimestamp();

  const message = await channel.send({ embeds: [embed] });

  await prisma.dailyPost.create({
    data: {
      guildId,
      messageId: message.id,
      verseReference: verse.reference,
      verseText: verse.text,
    },
  });

  logger.info({ guildId, verseRef: verse.reference }, 'Posted daily verse');
}
