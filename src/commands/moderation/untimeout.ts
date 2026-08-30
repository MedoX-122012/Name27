import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../../services/logging/logService.js';
export const data = new SlashCommandBuilder().setName('untimeout').setDescription('إزالة timeout')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const m=await interaction.guild!.members.fetch(user.id).catch(()=>null);
  if(!m) return interaction.reply({ content:'❌ غير موجود', ephemeral:true });
  await m.timeout(null);
  await addModLog(interaction.guild!.id, interaction.user.id, user.id, 'UNTIMEOUT');
  await interaction.reply({ content:`✅ تمت إزالة Timeout لـ <@${user.id}>` });
}
