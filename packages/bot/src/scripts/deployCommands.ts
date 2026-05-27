import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as leaderboardData } from '../commands/leaderboard';
import { data as adminData } from '../commands/admin';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID must be set');

const commands = [leaderboardData, adminData].map((c) => c.toJSON());
const rest = new REST().setToken(token);

async function deploy(): Promise<void> {
  const guildId = process.env.DEPLOY_GUILD_ID;

  if (guildId) {
    console.log(`Deploying ${commands.length} commands to guild ${guildId}…`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('Done — guild commands are available immediately.');
  } else {
    console.log(`Deploying ${commands.length} global commands…`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Done — global commands can take up to 1 hour to propagate.');
  }
}

deploy().catch((err: unknown) => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
