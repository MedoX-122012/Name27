import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { canPunish } from '../../utils/permissions.js';
import { addModLog, sendLog } from '../../services/logging/logService.js';
import { modLogEmbed } from '../../utils/embed.js';
export const data = new SlashCommandBuilder().setName('timeout').setDescription('إعطاء timeout')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .addIntegerOption(o=> o.setName('duration').setDescription('المدة بالدقائق').setRequired(true).setMinValue(1).setMaxValue(40320))
  .addStringOption(o=> o.setName('reason').setDescription('السبب').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const mins=interaction.options.getInteger('duration',true);
  const reason=interaction.options.getString('reason')||'No reason';
  const guild=interaction.guild!;
  const actor=interaction.member as GuildMember;
  const target=await guild.members.fetch(user.id).catch(()=>null);
  if(!target) return interaction.reply({ content:'❌ غير موجود', ephemeral:true });
  if(!canPunish(actor,target)) return interaction.reply({ content:'❌ لا يمكنك معاقبة هذا العضو', ephemeral:true });
  await target.timeout(mins*60*1000, reason);
  await addModLog(guild.id, interaction.user.id, user.id, 'TIMEOUT', reason);
  await sendLog(interaction.client as any, guild.id, modLogEmbed({ moderator: interaction.user.id, target: user.id, action:'TIMEOUT', reason })).catch(()=>{});
  await interaction.reply({ content:`✅ Timeout لـ <@${user.id}> لمدة ${mins} دقيقة` });
}
