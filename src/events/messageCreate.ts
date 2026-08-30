import { Message, PermissionsBitField, GuildMember } from 'discord.js';
import { prisma, ensureGuild } from '../database/prisma.js';
import { detectProfanity } from '../services/automod/filterService.js';
import { createWarning, getActivePoints, computeTimeoutForPoints } from '../services/warnings/warningService.js';
import { checkSpam, shouldWarnSpam } from '../services/spam/spamService.js';
import { checkLinks } from '../services/links/linkService.js';
import { checkMentions } from '../services/mentions/mentionService.js';
import { applyTimeout } from '../services/moderation/moderationService.js';
import { sendLog } from '../services/logging/logService.js';
import { automodEmbed } from '../utils/embed.js';
import { formatDuration } from '../utils/format.js';
import { USER_MESSAGE } from '../config/constants.js';
import { canPunish } from '../utils/permissions.js';

export async function onMessageCreate(message: Message){
  if(!message.guild || message.author.bot) return;
  if(await handleIdentityTrigger(message)) return;
  const guildId = message.guild.id;
  const settings = await ensureGuild(guildId);
  if(!settings.automodEnabled) return;
  const contentEarly = message.content?.toLowerCase() || '';
  const isProfanityTest = contentEarly.includes('كلب') || contentEarly.includes('fuck') || contentEarly.includes('شرموط') || contentEarly.includes('خول');
  const member = message.member as GuildMember | null;
  if(!member) return;
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator) || member.permissions.has(PermissionsBitField.Flags.ModerateMembers);
  if(isAdmin && !isProfanityTest){
    return;
  }
  if(isAdmin && isProfanityTest){
    console.log(`[TEST] Admin profanity test bypass allowed for ${message.author.tag}`);
  }
  const content = message.content;
  if(!content){
    if(!(globalThis as any)._warnedContentIntent){
      (globalThis as any)._warnedContentIntent=true;
      console.warn('[WARN] message.content فارغ - فعل MESSAGE CONTENT INTENT في البورتال لتشغيل فلتر الشتائم، أو Slash commands ستعمل فقط');
    }
    return;
  }
  try{
    if(settings.mentionEnabled){
      const { blocked, count } = checkMentions(content, settings.maxMentions);
      if(blocked){ await handleViolation(message, 'MEDIUM', `Mention spam (${count} mentions)`, `mention:${count}`, settings); return; }
    }
    if(settings.linkEnabled){
      const allowed: string[] = JSON.parse(settings.allowedDomains||'[]');
      const blockedD: string[] = JSON.parse(settings.blockedDomains||'[]');
      const res = checkLinks(content, allowed, blockedD);
      if(res.blocked){ await handleViolation(message, 'MEDIUM', res.reason||'رابط غير مسموح', res.domain||'link', settings); return; }
    }
    if(settings.spamEnabled){
      const spam = checkSpam(guildId, message.author.id, content);
      if(spam.isSpam && shouldWarnSpam(guildId, message.author.id)){ await handleViolation(message, 'MILD', spam.reason||'Spam', 'spam', settings, true); return; }
    }
    const detection = await detectProfanity(guildId, content);
    if(detection){ await handleViolation(message, detection.severity, `Profanity: ${detection.word}`, detection.word, settings); return; }
  }catch(e){ console.error('[messageCreate] error', e); }
}

async function handleViolation(message: Message, severity:any, reason:string, word:string, settings:any, isSpam=false){
  const guild = message.guild!;
  const member = message.member as GuildMember;
  const botMe = guild.members.me;
  if(!botMe || !canPunish(botMe as any, member)) return;
  try{ await message.delete(); }catch{}
  await createWarning({ guildId: guild.id, userId: member.id, moderatorId: guild.members.me!.id, reason, severity: isSpam? undefined : severity, detectedWord: word, messageId: message.id, channelId: message.channel.id });
  await prisma.user.update({ where:{ userId_guildId:{ userId: member.id, guildId: guild.id }}, data:{ messagesDeleted:{ increment:1 }}}).catch(()=>{});
  const points = await getActivePoints(guild.id, member.id);
  const duration = computeTimeoutForPoints(points, severity, settings);
  try{ await applyTimeout(member, duration, reason); await prisma.user.update({ where:{ userId_guildId:{ userId: member.id, guildId: guild.id }}, data:{ timeouts:{ increment:1 }}}).catch(()=>{}); }catch(e){ console.error('[timeout fail]',e); }
  const warnsCount = (await prisma.warning.count({ where:{ guildId: guild.id, userId: member.id }}));
  const logEmbed = automodEmbed({ userTag: member.user.tag, userId: member.id, severity: severity as any, reason, durationMs: duration, warns: warnsCount, channel: `<#${message.channel.id}>`, word });
  await sendLog(guild.client, guild.id, logEmbed).catch(()=>{});
  try{
    const ch = message.channel as any;
    if(ch.send){ await ch.send({ content: `<@${member.id}> ${USER_MESSAGE.replace('{duration}', formatDuration(duration))}`, allowedMentions:{ users:[member.id] } }).then((m:any)=> setTimeout(()=> m.delete().catch(()=>{}), 8000)); }
  }catch{}
  try{ await member.send(`⚠️ تم تحذيرك في **${guild.name}**\nالسبب: ${reason}\nالمدة: ${formatDuration(duration)}\nالكلمة: ${word}`).catch(()=>{}); }catch{}
}

const IDENTITY_COOLDOWN = new Map<string, number>();
async function handleIdentityTrigger(message: Message): Promise<boolean>{
  const raw = (message.content || '').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').trim();
  if(!raw) return false;
  const normalized = raw.replace(/\s+/g,'');
  const isMention = message.mentions.has(message.client.user!.id);
  const isName27 = raw.includes('name27') || normalized.includes('name27') || raw.includes('name 27') || raw === 'name27';
  if(!isMention && !isName27) return false;
  if(raw.length > 120 && !isName27) return false;
  const cdKey = `${message.guild!.id}:${message.author.id}`;
  if(IDENTITY_COOLDOWN.has(cdKey) && Date.now() - IDENTITY_COOLDOWN.get(cdKey)! < 5000) return true;
  IDENTITY_COOLDOWN.set(cdKey, Date.now());
  const botName = 'Name27';
  const embed = {
    color: 0x2ECC71,
    title: `🛡️ أنا ${botName} — بوت الأمان`,
    description: `أهلاً <@${message.author.id}>! 👋\n\nأنا **${botName}** بوت حماية متطور للسيرفر، مهمتي الحفاظ على بيئة محترمة وآمنة للجميع.`,
    fields: [
      { name: '🔍 ماذا أفعل؟', value: '• حذف الشتائم والكلام المسيء تلقائياً\n• نظام تحذيرات و Timeouts متدرج\n• حماية من السبام والمنشن والروابط\n• كشف التحايل (حروف مكررة، رموز، Leet، unicode)\n• سجل كامل للإدارة', inline: false },
      { name: '⚙️ الأوامر', value: '`/help` لعرض جميع الأوامر\n`/stats` للإحصائيات\n`/warn` `/timeout` `/ban` للمشرفين', inline: false },
      { name: '👨‍💻 التصميم', value: 'البوت من **تصميم Medo**\nتحت **إشراف Roto**', inline: false },
    ],
    footer: { text: 'Name27 • Medo × Roto' },
    timestamp: new Date().toISOString(),
  } as any;
  try{ await message.reply({ embeds:[embed], allowedMentions:{ repliedUser:false } }); }catch{ try{ await (message.channel as any).send({ embeds:[embed] }); }catch{} }
  return true;
}
