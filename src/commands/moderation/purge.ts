import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from 'discord.js';
export const data = new SlashCommandBuilder().setName('purge').setDescription('حذف رسائل')
  .addIntegerOption(o=> o.setName('amount').setDescription('العدد 1-100').setRequired(true).setMinValue(1).setMaxValue(100))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
export async function execute(interaction: ChatInputCommandInteraction){
  const n=interaction.options.getInteger('amount',true);
  const ch=interaction.channel as TextChannel;
  await interaction.deferReply({ ephemeral:true });
  const msgs=await ch.bulkDelete(n, true).catch(()=>null);
  if(!msgs) return interaction.editReply('❌ فشل الحذف (رسائل قديمة >14 يوم)');
  await interaction.editReply(`✅ تم حذف ${msgs.size} رسالة`);
}
