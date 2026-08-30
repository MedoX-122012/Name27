import { prisma } from '../../database/prisma.js';
import { Severity, severityPoints, getEscalationTimeout } from '../../types/index.js';
export async function createWarning(p:{ guildId:string; userId:string; moderatorId:string; reason:string; severity?:Severity; points?:number; detectedWord?:string; messageId?:string; channelId?:string }){
  const points = p.points ?? (p.severity ? severityPoints[p.severity] : 1);
  const settings = await prisma.guildSettings.findUnique({ where:{ guildId: p.guildId } });
  const expireDays = settings?.warnExpireDays ?? 30;
  const expiresAt = new Date(Date.now()+ expireDays*24*60*60*1000);
  const w = await prisma.warning.create({ data:{ guildId:p.guildId, userId:p.userId, moderatorId:p.moderatorId, reason:p.reason, severity:p.severity, points, detectedWord:p.detectedWord, messageId:p.messageId, channelId:p.channelId, expiresAt }});
  let user = await prisma.user.findUnique({ where:{ userId_guildId:{ userId:p.userId, guildId:p.guildId }}});
  if(!user) user = await prisma.user.create({ data:{ userId:p.userId, guildId:p.guildId, warns:1, points, lastViolation:new Date() }});
  else user = await prisma.user.update({ where:{ userId_guildId:{ userId:p.userId, guildId:p.guildId }}, data:{ warns:{ increment:1 }, points:{ increment:points }, lastViolation:new Date() }});
  await prisma.modLog.create({ data:{ guildId:p.guildId, moderatorId:p.moderatorId, targetId:p.userId, action:'WARN', reason:p.reason, meta: JSON.stringify({ severity:p.severity, points, word:p.detectedWord }) }});
  return { warning:w, user };
}
export async function getActiveWarnings(guildId:string,userId:string){
  const now=new Date();
  return prisma.warning.findMany({ where:{ guildId, userId, OR:[{ expiresAt:null },{ expiresAt:{ gt: now }}]}, orderBy:{ createdAt:'desc' }});
}
export async function getActivePoints(guildId:string,userId:string){
  const warns = await getActiveWarnings(guildId,userId);
  return warns.reduce((s:number,w:any)=> s+w.points,0);
}
export async function clearOneWarn(guildId:string,userId:string){
  const w = await prisma.warning.findFirst({ where:{ guildId, userId }, orderBy:{ createdAt:'desc' }});
  if(!w) return null;
  await prisma.warning.delete({ where:{ id:w.id }});
  const user = await prisma.user.findUnique({ where:{ userId_guildId:{ userId, guildId }}});
  if(user) await prisma.user.update({ where:{ userId_guildId:{ userId, guildId }}, data:{ warns:{ decrement:1 }, points:{ decrement: w.points }}});
  return w;
}
export async function clearAllWarns(guildId:string,userId:string){
  const warns = await prisma.warning.findMany({ where:{ guildId, userId }});
  const total = warns.reduce((s:number,w:any)=>s+w.points,0);
  await prisma.warning.deleteMany({ where:{ guildId, userId }});
  await prisma.user.updateMany({ where:{ userId, guildId }, data:{ warns:0, points:0 }});
  return { count: warns.length, points: total };
}
export function computeTimeoutForPoints(points:number, severity?:Severity, settings?:{timeoutMild:number;timeoutMedium:number;timeoutSevere:number;timeoutExtreme:number;escalationEnabled:boolean}){
  if(!settings || !settings.escalationEnabled){
    if(!severity || !settings) return getEscalationTimeout(points);
    const map={ MILD: settings.timeoutMild, MEDIUM: settings.timeoutMedium, SEVERE: settings.timeoutSevere, EXTREME: settings.timeoutExtreme } as const;
    return map[severity];
  }
  const sevTimeout = severity ? ({MILD:settings.timeoutMild,MEDIUM:settings.timeoutMedium,SEVERE:settings.timeoutSevere,EXTREME:settings.timeoutExtreme} as const)[severity] : undefined;
  const esc = getEscalationTimeout(points);
  return sevTimeout ? Math.max(sevTimeout, esc) : esc;
}
