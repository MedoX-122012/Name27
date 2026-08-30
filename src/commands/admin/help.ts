import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { isAdmin, isMod } from '../../utils/permissions.js';
export const data = new SlashCommandBuilder().setName('help').setDescription('عرض الأوامر');
export async function execute(interaction: ChatInputCommandInteraction){
  const member:any=interaction.member;
  const mod = member ? isMod(member) : false;
  const admin = member ? isAdmin(member) : false;
  const e=new EmbedBuilder().setTitle('🛡️ Watan Guard - المساعدة').setColor(0x3498DB)
    .addFields(
      { name:'👤 عام', value:`/help - هذه القائمة\n/stats - إحصائيات السيرفر`, inline:false },
      ...(mod? [{ name:'🔨 Moderation', value:`/warn /warns /clearwarn /clearwarns\n/timeout /untimeout /mute /unmute\n/kick /ban /unban /purge`, inline:false } as any] : []),
      ...(admin? [{ name:'⚙️ Admin', value:`/automod enable/disable/settings/set-timeout/addword/removeword/whitelist/blacklist/set-log\n/setup`, inline:false } as any] : []),
    ).setFooter({ text:'Watan Guard Anti-Swear' }).setTimestamp();
  await interaction.reply({ embeds:[e], ephemeral:true });
}
