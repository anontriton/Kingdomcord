import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client,
} from 'discord.js';
import { GuildService } from '../services/guild.service';
import { postDailyVerseToAllGuilds } from '../jobs/dailyVerse';
import type { GuildConfig } from '@kingdomcord/shared';

type ChannelChoice = 'daily-word' | 'store' | 'leaderboard' | 'bible-study-notes';
type KpChoice = 'reaction' | 'trivia' | 'reflection' | 'streak-multiplier';

const CHANNEL_KEY_MAP: Record<ChannelChoice, keyof GuildConfig['channels']> = {
  'daily-word': 'dailyWord',
  'store': 'store',
  'leaderboard': 'leaderboard',
  'bible-study-notes': 'bibleStudyNotes',
};

const KP_KEY_MAP: Record<KpChoice, keyof GuildConfig['kp']> = {
  'reaction': 'reactionAmount',
  'trivia': 'triviaAmount',
  'reflection': 'reflectionAmount',
  'streak-multiplier': 'streakBonusMultiplier',
};

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Kingdomcord admin commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub.setName('post-now').setDescription("Post today's daily verse immediately (for testing)"),
  )
  .addSubcommandGroup((group) =>
    group
      .setName('channel')
      .setDescription('Configure channels')
      .addSubcommand((sub) =>
        sub
          .setName('set')
          .setDescription('Assign a channel for a Kingdomcord feature')
          .addStringOption((opt) =>
            opt
              .setName('type')
              .setDescription('Which feature channel to set')
              .setRequired(true)
              .addChoices(
                { name: 'Daily Word', value: 'daily-word' },
                { name: 'Kingdom Store', value: 'store' },
                { name: 'Leaderboard', value: 'leaderboard' },
                { name: 'Bible Study Notes', value: 'bible-study-notes' },
              ),
          )
          .addChannelOption((opt) =>
            opt
              .setName('channel')
              .setDescription('The text channel to use')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true),
          ),
      ),
  )
  .addSubcommandGroup((group) =>
    group
      .setName('config')
      .setDescription('Tune server-wide settings')
      .addSubcommand((sub) =>
        sub
          .setName('kp')
          .setDescription('Set how many Kingdom Points a specific action awards')
          .addStringOption((opt) =>
            opt
              .setName('action')
              .setDescription('Which action to configure')
              .setRequired(true)
              .addChoices(
                { name: 'Daily verse reaction', value: 'reaction' },
                { name: 'Correct trivia answer', value: 'trivia' },
                { name: 'Reflection response', value: 'reflection' },
                { name: 'Streak bonus multiplier', value: 'streak-multiplier' },
              ),
          )
          .addNumberOption((opt) =>
            opt
              .setName('amount')
              .setDescription('New value (KP amount, or multiplier for streak)')
              .setRequired(true)
              .setMinValue(0)
              .setMaxValue(1000),
          ),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const group = interaction.options.getSubcommandGroup();
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;

  if (sub === 'post-now') {
    await interaction.deferReply({ ephemeral: true });
    await postDailyVerseToAllGuilds(interaction.client as Client);
    await interaction.editReply('✅ Daily verse posted.');
    return;
  }

  if (group === 'channel' && sub === 'set') {
    const type = interaction.options.getString('type', true) as ChannelChoice;
    const channel = interaction.options.getChannel('channel', true);
    await GuildService.setChannel(guildId, CHANNEL_KEY_MAP[type], channel.id);
    await interaction.reply({
      content: `✅ **${type.replace(/-/g, ' ')}** channel set to <#${channel.id}>`,
      ephemeral: true,
    });
    return;
  }

  if (group === 'config' && sub === 'kp') {
    const action = interaction.options.getString('action', true) as KpChoice;
    const amount = interaction.options.getNumber('amount', true);
    await GuildService.setKp(guildId, KP_KEY_MAP[action], amount);
    await interaction.reply({
      content: `✅ **${action.replace(/-/g, ' ')}** KP set to **${amount}**`,
      ephemeral: true,
    });
    return;
  }
}
