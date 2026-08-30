import { EmbedBuilder } from 'discord.js';
import { Severity, severityColor, severityArabic } from '../types/index.js';
export function automodEmbed(p:{userTag:string; userId:string; severity:Severity; reason:string; durationMs:number; warns:number; channel:string; word?:string}){
  const mins = Math.round(p.durationMs/60000);
  return new EmbedBuilder()
    .setTitle('🛡️ AutoMod Action')
    .setColor(severityColor[p.severity])
    .addFields(
      { name:'المستخدم', value:`<@${p.userId}> (${p.userTag})`, inline:false },
      { name:'الإجراء', value:'TIMEOUT', inline:true },
      { name:'السبب', value:p.reason, inline:true },
      { name:'الخطورة', value:`${p.severity} (${severityArabic[p.severity]})`, inline:true },
      { name:'الكلمة المكتشفة', value: p.word ? `\`${p.word}\`` : '—', inline:true },
      { name:'المدة', value:`${mins} دقيقة`, inline:true },
      { name:'Warn', value:`#${p.warns}`, inline:true },
      { name:'القناة', value:p.channel, inline:true },
      { name:'الوقت', value:`<t:${Math.floor(Date.now()/1000)}:t>`, inline:true },
    ).setTimestamp();
}
export function modLogEmbed(p:{moderator:string; target:string; action:string; reason:string}){
  return new EmbedBuilder().setColor(0x3498DB).setTitle(`🔨 ${p.action}`)
    .addFields(
      { name:'Moderator', value:`<@${p.moderator}>`, inline:true },
      { name:'Target', value:`<@${p.target}>`, inline:true },
      { name:'Reason', value:p.reason || '—', inline:false },
    ).setTimestamp();
}
