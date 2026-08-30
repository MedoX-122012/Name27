import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { prisma } from '../../database/prisma.js';
export async function sendLog(client:Client, guildId:string, embed: EmbedBuilder){
  const settings = await prisma.guildSettings.findUnique({ where:{ guildId } });
  if(!settings?.logChannelId) return;
  try{
    const ch = await client.channels.fetch(settings.logChannelId) as TextChannel | null;
    if(!ch || !ch.isTextBased()) return;
    await ch.send({ embeds:[embed] });
  }catch{}
}
export async function addModLog(guildId:string, moderatorId:string, targetId:string|null, action:string, reason?:string, meta?:string){
  await prisma.modLog.create({ data:{ guildId, moderatorId, targetId: targetId ?? undefined, action, reason, meta }});
}
