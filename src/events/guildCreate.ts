import { Guild } from 'discord.js';
import { ensureGuild } from '../database/prisma.js';
export async function onGuildCreate(guild:Guild){
  await ensureGuild(guild.id);
  console.log(`[Guild] Joined ${guild.name} (${guild.id})`);
}
