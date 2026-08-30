import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { canPunish } from '../../utils/permissions.js';
export const data = new SlashCommandBuilder().setName('mute').setDescription('كتم (timeout)')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .addIntegerOption(o=> o.setName('duration').setDescription('دقائق').setRequired(true).setMinValue(1))
  .addStringOption(o=> o.setName('reason').setDescription('السبب'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(i: ChatInputCommandInteraction){
  const u=i.options.getUser('user',true); const d=i.options.getInteger('duration',true); const r=i.options.getString('reason')||'No reason';
  const m=await i.guild!.members.fetch(u.id).catch(()=>null); if(!m) return i.reply({ content:'❌ غير موجود', ephemeral:true });
  if(!canPunish(i.member as GuildMember,m)) return i.reply({ content:'❌ لا يمكنك كتمه', ephemeral:true });
  await m.timeout(d*60*1000, r); await i.reply({ content:`🔇 تم كتم <@${u.id}> ${d} دقيقة` });
}
