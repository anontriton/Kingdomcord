import { Events, type Interaction } from 'discord.js';
import { GuildService } from '../services/guild.service';
import { logger } from '../logger';
import '../types';

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.guild) {
    await interaction.reply({ content: 'Commands must be used inside a server.', ephemeral: true });
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    return;
  }

  await GuildService.upsert(interaction.guild.id, interaction.guild.name);

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(
      { error, command: interaction.commandName, guildId: interaction.guild.id },
      'Command failed',
    );
    const reply = { content: 'Something went wrong. Please try again.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
