import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '../../database/prisma.js';
export const data = new SlashCommandBuilder().setName('stats').setDescription('إحصائيات Watan Guard');
export async function execute(interaction: ChatInputCommandInteraction){
  const gid=interaction.guild!.id;
  const [warns, users, top, recent] = await Promise.all([
    prisma.warning.count({ where:{ guildId: gid }}),
    prisma.user.count({ where:{ guildId: gid }}),
    prisma.user.findMany({ where:{ guildId: gid }, orderBy:{ points:'desc' }, take:5 }),
    prisma.warning.groupBy({ by:['severity'], _count:true, where:{ guildId: gid }})
  ]);
  const totalDeleted = (await prisma.user.aggregate({ _sum:{ messagesDeleted:true }, where:{ guildId: gid }}))._sum.messagesDeleted||0;
  const e=new EmbedBuilder().setTitle('📊 إحصائيات Watan Guard').setColor(0x9B59B6)
    .addFields(
      { name:'Total Warns', value:String(warns), inline:true },
      { name:'Users', value:String(users), inline:true },
      { name:'Deleted Messages', value:String(totalDeleted), inline:true },
      { name:'Top Violators', value: top.length? top.map((u:any)=> `<@${u.userId}>: ${u.points}pts`).join('\n') : '—', inline:false },
      { name:'By Severity', value: recent.map((r:any)=> `${r.severity||'SPAM'}: ${r._count}`).join(' | ') || '—', inline:false },
    ).setTimestamp();
  await interaction.reply({ embeds:[e], ephemeral:true });
}
