import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '../../database/prisma.js';
export const data = new SlashCommandBuilder().setName('warns').setDescription('عرض تحذيرات عضو')
  .addUserOption(o=> o.setName('user').setDescription('المستخدم').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(interaction: ChatInputCommandInteraction){
  const user=interaction.options.getUser('user',true);
  const warns=await prisma.warning.findMany({ where:{ guildId: interaction.guild!.id, userId: user.id }, orderBy:{ createdAt:'desc' }, take:10 });
  if(warns.length===0) return interaction.reply({ content:`✅ <@${user.id}> لا يوجد لديه تحذيرات`, ephemeral:true });
  const embed=new EmbedBuilder().setTitle(`تحذيرات ${user.tag}`).setColor(0xE67E22)
    .setDescription(warns.map((w:any,i:number)=> `**#${i+1}** ${w.reason} | ${w.severity||'—'} | ${w.points}pts | <t:${Math.floor(w.createdAt.getTime()/1000)}:R> ${w.expiresAt? `| ينتهي <t:${Math.floor((w.expiresAt as Date).getTime()/1000)}:R>` : ''}`).join('\n'));
  await interaction.reply({ embeds:[embed], ephemeral:true });
}
