import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from 'discord.js';
import { ensureGuild, prisma } from '../../database/prisma.js';
export const data = new SlashCommandBuilder().setName('setup').setDescription('إعداد Watan Guard تلقائياً').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
export async function execute(interaction: ChatInputCommandInteraction){
  await interaction.deferReply({ ephemeral:true });
  const guild=interaction.guild!;
  await ensureGuild(guild.id);
  let logChannel = guild.channels.cache.find(c=> c.name==='watan-logs' && c.isTextBased()) as any;
  if(!logChannel){
    try{ logChannel = await guild.channels.create({ name:'watan-logs', type: ChannelType.GuildText, reason:'Watan Guard setup' }); }catch{}
  }
  if(logChannel) await prisma.guildSettings.update({ where:{ guildId: guild.id }, data:{ logChannelId: logChannel.id }});
  const embed=new EmbedBuilder().setTitle('✅ تم إعداد Watan Guard').setColor(0x2ECC71)
    .setDescription(`AutoMod: ✅\nLog: ${logChannel? `<#${logChannel.id}>` : '—'}\nاستخدم /automod settings لعرض الإعدادات\n/help لعرض الأوامر`);
  await interaction.editReply({ embeds:[embed] });
}
