import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../../services/logging/logService.js';
export const data = new SlashCommandBuilder().setName('unban').setDescription('إلغاء حظر')
  .addStringOption(o=> o.setName('userid').setDescription('ID المستخدم').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const id=interaction.options.getString('userid',true);
  await interaction.guild!.members.unban(id).catch(()=>{ throw new Error('فشل إلغاء الحظر - تأكد من الـ ID'); });
  await addModLog(interaction.guild!.id, interaction.user.id, id, 'UNBAN');
  await interaction.reply({ content:`✅ تم إلغاء حظر ${id}` });
}
