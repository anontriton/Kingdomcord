import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { GuildService } from '../services/guild.service';
import type { GuildConfig } from '@kingdomcord/shared';

type ChannelChoice = 'daily-word' | 'store' | 'leaderboard' | 'bible-study-notes';

const CHANNEL_KEY_MAP: Record<ChannelChoice, keyof GuildConfig['channels']> = {
  'daily-word': 'dailyWord',
  'store': 'store',
  'leaderboard': 'leaderboard',
  'bible-study-notes': 'bibleStudyNotes',
};

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Kingdomcord admin commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const group = interaction.options.getSubcommandGroup();
  const sub = interaction.options.getSubcommand();

  if (group === 'channel' && sub === 'set') {
    const type = interaction.options.getString('type', true) as ChannelChoice;
    const channel = interaction.options.getChannel('channel', true);

    await GuildService.setChannel(interaction.guild!.id, CHANNEL_KEY_MAP[type], channel.id);

    await interaction.reply({
      content: `✅ **${type.replace(/-/g, ' ')}** channel set to <#${channel.id}>`,
      ephemeral: true,
    });
  }
}
