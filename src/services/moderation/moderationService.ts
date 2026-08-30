import { GuildMember } from 'discord.js';
export async function applyTimeout(member: GuildMember, durationMs:number, reason:string){
  const capped = Math.min(durationMs, 28*24*60*60*1000);
  await member.timeout(capped, reason);
}
export async function removeTimeout(member: GuildMember, reason:string){
  await member.timeout(null, reason);
}
