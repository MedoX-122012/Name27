import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { clearOneWarn } from '../../services/warnings/warningService.js';
import { addModLog } from '../../services/logging/logService.js';
export const data = new SlashCommandBuilder().setName('clearwarn').setDescription('حذف آخر تحذير لعضو')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const w=await clearOneWarn(interaction.guild!.id, user.id);
  if(!w) return interaction.reply({ content:'❌ لا يوجد تحذيرات', ephemeral:true });
  await addModLog(interaction.guild!.id, interaction.user.id, user.id, 'CLEARWARN', w.reason);
  await interaction.reply({ content:`✅ تم حذف تحذير <@${user.id}> : ${w.reason}` });
}
