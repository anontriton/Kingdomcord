import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { PointsService } from '../services/points.service';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Show the top Kingdom Points earners in this server');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const users = await PointsService.getLeaderboard(interaction.guild!.id, 10);

  if (users.length === 0) {
    await interaction.editReply(
      'No Kingdom Points earned yet. React to the daily verse to get on the board!',
    );
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const rows = users.map((u, i) => {
    const prefix = medals[i] ?? `${i + 1}.`;
    return `${prefix} **${u.username}** — ${u.kingdomPoints.toLocaleString()} KP`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xf5c518)
    .setTitle('👑 Kingdom Points Leaderboard')
    .setDescription(rows.join('\n'))
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
