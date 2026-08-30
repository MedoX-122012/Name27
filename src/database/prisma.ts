import { PrismaClient } from '@prisma/client';
import { TTLCache } from '../utils/cache.js';
export const prisma = new PrismaClient();
const guildCache = new TTLCache<string, any>(30_000);
export async function ensureGuild(guildId:string){
  const cached = guildCache.get(guildId);
  if(cached) return cached;
  const g = await prisma.guildSettings.upsert({ where:{ guildId }, update:{}, create:{ guildId }});
  guildCache.set(guildId, g);
  return g;
}
export async function getGuildSettings(guildId:string){
  const c = guildCache.get(guildId);
  if(c) return c;
  const g = await prisma.guildSettings.findUnique({ where:{ guildId }});
  if(g) guildCache.set(guildId,g);
  return g;
}
export function invalidateGuildCache(guildId:string){ guildCache.del(guildId); }
