import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { canPunish } from '../../utils/permissions.js';
import { addModLog, sendLog } from '../../services/logging/logService.js';
import { modLogEmbed } from '../../utils/embed.js';
export const data = new SlashCommandBuilder().setName('ban').setDescription('حظر عضو')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .addStringOption(o=> o.setName('reason').setDescription('السبب').setRequired(false))
  .addIntegerOption(o=> o.setName('days').setDescription('حذف رسائل كم يوم').setMinValue(0).setMaxValue(7))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const reason=interaction.options.getString('reason')||'No reason';
  const days=interaction.options.getInteger('days')||0;
  const guild=interaction.guild!;
  const actor=interaction.member as GuildMember;
  const target=await guild.members.fetch(user.id).catch(()=>null);
  if(target && !canPunish(actor,target)) return interaction.reply({ content:'❌ لا يمكنك حظر هذا العضو', ephemeral:true });
  await guild.members.ban(user.id, { reason, deleteMessageDays: days } as any);
  await addModLog(guild.id, interaction.user.id, user.id, 'BAN', reason);
  await sendLog(interaction.client as any, guild.id, modLogEmbed({ moderator: interaction.user.id, target:user.id, action:'BAN', reason })).catch(()=>{});
  await interaction.reply({ content:`✅ تم حظر <@${user.id}>` });
}
