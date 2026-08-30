import { GuildMember, PermissionFlagsBits } from 'discord.js';
export function isMod(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.ModerateMembers) || member.permissions.has(PermissionFlagsBits.ManageMessages) || member.permissions.has(PermissionFlagsBits.Administrator);
}
export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild);
}
export function canPunish(actor: GuildMember, target: GuildMember): boolean {
  if (target.id === actor.guild.ownerId) return false;
  if (target.id === actor.id) return false;
  if (target.roles.highest.position >= actor.roles.highest.position) return false;
  const bot = actor.guild.members.me;
  if (!bot) return false;
  if (target.roles.highest.position >= bot.roles.highest.position) return false;
  return true;
}
