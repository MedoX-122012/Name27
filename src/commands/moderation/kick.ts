import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { canPunish } from '../../utils/permissions.js';
import { addModLog, sendLog } from '../../services/logging/logService.js';
import { modLogEmbed } from '../../utils/embed.js';
export const data = new SlashCommandBuilder().setName('kick').setDescription('طرد عضو')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .addStringOption(o=> o.setName('reason').setDescription('السبب').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const reason=interaction.options.getString('reason')||'No reason';
  const guild=interaction.guild!;
  const actor=interaction.member as GuildMember;
  const target=await guild.members.fetch(user.id).catch(()=>null);
  if(!target) return interaction.reply({ content:'❌ غير موجود', ephemeral:true });
  if(!canPunish(actor,target)) return interaction.reply({ content:'❌ لا يمكنك طرد هذا العضو', ephemeral:true });
  await target.kick(reason);
  await addModLog(guild.id, interaction.user.id, user.id, 'KICK', reason);
  await sendLog(interaction.client as any, guild.id, modLogEmbed({ moderator: interaction.user.id, target:user.id, action:'KICK', reason })).catch(()=>{});
  await interaction.reply({ content:`✅ تم طرد <@${user.id}>` });
}
