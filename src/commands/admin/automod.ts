import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma, ensureGuild } from '../../database/prisma.js';
import { addWord, removeWord } from '../../services/automod/filterService.js';
import { addModLog } from '../../services/logging/logService.js';
export const data = new SlashCommandBuilder().setName('automod').setDescription('إعدادات AutoMod')
  .addSubcommand(s=> s.setName('enable').setDescription('تفعيل'))
  .addSubcommand(s=> s.setName('disable').setDescription('تعطيل'))
  .addSubcommand(s=> s.setName('settings').setDescription('عرض الإعدادات'))
  .addSubcommand(s=> s.setName('set-timeout').setDescription('تغيير مدة timeout').addStringOption(o=> o.setName('level').setDescription('MILD/MEDIUM/SEVERE/EXTREME').setRequired(true).addChoices({name:'MILD',value:'MILD'},{name:'MEDIUM',value:'MEDIUM'},{name:'SEVERE',value:'SEVERE'},{name:'EXTREME',value:'EXTREME'})).addIntegerOption(o=> o.setName('duration').setDescription('دقائق').setRequired(true).setMinValue(1)))
  .addSubcommand(s=> s.setName('addword').setDescription('إضافة كلمة').addStringOption(o=> o.setName('word').setDescription('الكلمة').setRequired(true)).addStringOption(o=> o.setName('level').setDescription('الخطورة').setRequired(true).addChoices({name:'MILD',value:'MILD'},{name:'MEDIUM',value:'MEDIUM'},{name:'SEVERE',value:'SEVERE'},{name:'EXTREME',value:'EXTREME'})))
  .addSubcommand(s=> s.setName('removeword').setDescription('حذف كلمة').addStringOption(o=> o.setName('word').setDescription('الكلمة').setRequired(true)))
  .addSubcommand(s=> s.setName('whitelist').setDescription('إضافة whitelist').addStringOption(o=> o.setName('word').setDescription('الكلمة').setRequired(true)))
  .addSubcommand(s=> s.setName('blacklist').setDescription('حذف whitelist').addStringOption(o=> o.setName('word').setDescription('الكلمة').setRequired(true)))
  .addSubcommand(s=> s.setName('set-log').setDescription('تحديد قناة اللوج').addChannelOption(o=> o.setName('channel').setDescription('القناة').setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
export async function execute(interaction: ChatInputCommandInteraction){
  const sub=interaction.options.getSubcommand();
  const guildId=interaction.guild!.id;
  await ensureGuild(guildId);
  if(sub==='enable'){ await prisma.guildSettings.update({ where:{ guildId }, data:{ automodEnabled:true }}); await addModLog(guildId, interaction.user.id, null, 'AUTOMOD_ENABLE'); return interaction.reply({ content:'✅ تم تفعيل AutoMod', ephemeral:true }); }
  if(sub==='disable'){ await prisma.guildSettings.update({ where:{ guildId }, data:{ automodEnabled:false }}); await addModLog(guildId, interaction.user.id, null, 'AUTOMOD_DISABLE'); return interaction.reply({ content:'⛔ تم تعطيل AutoMod', ephemeral:true }); }
  if(sub==='settings'){
    const s=await prisma.guildSettings.findUnique({ where:{ guildId }});
    const e=new EmbedBuilder().setTitle('⚙️ إعدادات Watan Guard').setColor(0x3498DB)
      .addFields(
        { name:'AutoMod', value: s?.automodEnabled?'✅':'⛔', inline:true },
        { name:'Log Channel', value: s?.logChannelId?`<#${s.logChannelId}>`:'—', inline:true },
        { name:'Timeouts', value:`MILD ${Math.round((s?.timeoutMild||60000)/60000)}m | MED ${Math.round((s?.timeoutMedium||300000)/60000)}m | SEV ${Math.round((s?.timeoutSevere||1800000)/60000)}m | EXT ${Math.round((s?.timeoutExtreme||7200000)/60000)}m`, inline:false },
        { name:'Warn Expire', value:`${s?.warnExpireDays} يوم`, inline:true },
        { name:'Max Mentions', value:String(s?.maxMentions), inline:true },
        { name:'Spam/Link/Mention/Caps', value:`${s?.spamEnabled?'✅':'⛔'} / ${s?.linkEnabled?'✅':'⛔'} / ${s?.mentionEnabled?'✅':'⛔'} / ${s?.capsEnabled?'✅':'⛔'}`, inline:false },
      );
    return interaction.reply({ embeds:[e], ephemeral:true });
  }
  if(sub==='set-timeout'){
    const level=interaction.options.getString('level',true) as string; const dur=interaction.options.getInteger('duration',true)*60*1000;
    const fieldMap:Record<string,string>={ MILD:'timeoutMild', MEDIUM:'timeoutMedium', SEVERE:'timeoutSevere', EXTREME:'timeoutExtreme'};
    const field=fieldMap[level];
    await prisma.guildSettings.update({ where:{ guildId }, data:{ [field]: dur } as any });
    await addModLog(guildId, interaction.user.id, null, 'SET_TIMEOUT', `${level} ${dur}`);
    return interaction.reply({ content:`✅ تم تحديث ${level} إلى ${dur/60000} دقيقة`, ephemeral:true });
  }
  if(sub==='addword'){
    const word=interaction.options.getString('word',true); const level=interaction.options.getString('level',true) as any;
    await addWord(guildId, word, level);
    await addModLog(guildId, interaction.user.id, null, 'ADD_WORD', `${word} ${level}`);
    return interaction.reply({ content:`✅ أضيفت \`${word}\` (${level})`, ephemeral:true });
  }
  if(sub==='removeword'){
    const word=interaction.options.getString('word',true);
    await removeWord(guildId, word); await removeWord(null, word);
    await addModLog(guildId, interaction.user.id, null, 'REMOVE_WORD', word);
    return interaction.reply({ content:`✅ حذفت \`${word}\``, ephemeral:true });
  }
  if(sub==='whitelist'){
    const word=interaction.options.getString('word',true);
    await prisma.whitelistWord.upsert({ where:{ word_guildId:{ word, guildId } as any }, update:{}, create:{ word, guildId }});
    const { invalidateCache } = await import('../../services/automod/filterService.js'); invalidateCache(guildId);
    return interaction.reply({ content:`✅ أضيفت للـ whitelist: \`${word}\``, ephemeral:true });
  }
  if(sub==='blacklist'){
    const word=interaction.options.getString('word',true);
    await prisma.whitelistWord.deleteMany({ where:{ word, guildId }});
    const { invalidateCache } = await import('../../services/automod/filterService.js'); invalidateCache(guildId);
    return interaction.reply({ content:`✅ حذفت من whitelist: \`${word}\``, ephemeral:true });
  }
  if(sub==='set-log'){
    const ch=interaction.options.getChannel('channel',true);
    await prisma.guildSettings.update({ where:{ guildId }, data:{ logChannelId: ch.id }});
    return interaction.reply({ content:`✅ تم تحديد قناة اللوج <#${ch.id}>`, ephemeral:true });
  }
}
