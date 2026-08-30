import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { createWarning, getActivePoints, computeTimeoutForPoints } from '../../services/warnings/warningService.js';
import { applyTimeout } from '../../services/moderation/moderationService.js';
import { sendLog, addModLog } from '../../services/logging/logService.js';
import { modLogEmbed } from '../../utils/embed.js';
import { formatDuration } from '../../utils/format.js';
import { canPunish } from '../../utils/permissions.js';
export const data = new SlashCommandBuilder().setName('warn').setDescription('تحذير عضو')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .addStringOption(o=> o.setName('reason').setDescription('السبب').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);
  const guild = interaction.guild!;
  const actor = interaction.member as GuildMember;
  const target = await guild.members.fetch(user.id).catch(()=>null);
  if(!target) return interaction.reply({ content:'❌ المستخدم غير موجود', ephemeral:true });
  if(!canPunish(actor, target)) return interaction.reply({ content:'❌ لا يمكنك معاقبة هذا المستخدم (رتبة أعلى أو مالك السيرفر)', ephemeral:true });
  const { warning } = await createWarning({ guildId: guild.id, userId: user.id, moderatorId: interaction.user.id, reason });
  const points = await getActivePoints(guild.id, user.id);
  const settings = await (await import('../../database/prisma.js')).prisma.guildSettings.findUnique({ where:{ guildId: guild.id }});
  const duration = settings ? computeTimeoutForPoints(points, undefined, settings) : 60000;
  try{ await applyTimeout(target, duration, reason); }catch{}
  await addModLog(guild.id, interaction.user.id, user.id, 'WARN', reason);
  await sendLog(interaction.client as any, guild.id, modLogEmbed({ moderator: interaction.user.id, target: user.id, action:'WARN', reason })).catch(()=>{});
  try{ await user.send(`⚠️ تم تحذيرك في ${guild.name}: ${reason}`); }catch{}
  await interaction.reply({ content:`✅ تم تحذير <@${user.id}> | النقاط النشطة: ${points} | Timeout: ${formatDuration(duration)}\nالسبب: ${reason}` });
}
