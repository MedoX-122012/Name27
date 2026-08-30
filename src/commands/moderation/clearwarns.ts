import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { clearAllWarns } from '../../services/warnings/warningService.js';
import { addModLog } from '../../services/logging/logService.js';
export const data = new SlashCommandBuilder().setName('clearwarns').setDescription('حذف كل تحذيرات عضو')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const r=await clearAllWarns(interaction.guild!.id, user.id);
  await addModLog(interaction.guild!.id, interaction.user.id, user.id, 'CLEARWARNS', `cleared ${r.count}`);
  await interaction.reply({ content:`✅ تم حذف ${r.count} تحذير لـ <@${user.id}>` });
}
