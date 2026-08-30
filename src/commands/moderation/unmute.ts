import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
export const data = new SlashCommandBuilder().setName('unmute').setDescription('إلغاء كتم')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(i: ChatInputCommandInteraction){
  const u=i.options.getUser('user',true);
  const m=await i.guild!.members.fetch(u.id).catch(()=>null); if(!m) return i.reply({ content:'❌ غير موجود', ephemeral:true });
  await m.timeout(null); await i.reply({ content:`🔊 تم إلغاء كتم <@${u.id}>` });
}
