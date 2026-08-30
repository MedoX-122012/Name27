import { prisma } from '../../database/prisma.js';
import { Severity, DetectionResult } from '../../types/index.js';
import { fullNormalize, mapLeet, normalizedVariants } from '../../utils/normalization.js';
import { TTLCache } from '../../utils/cache.js';
import { escapeRegex } from '../../utils/format.js';

const wordCache = new TTLCache<string, { words:{word:string;severity:Severity;norm:string;isPhrase:boolean}[]; whitelist:Set<string> }>(60000);

async function loadGuildWords(guildId:string){
  const cached = wordCache.get(guildId);
  if(cached) return cached;
  const [words, whitelist, globalWords, globalWhitelist] = await Promise.all([
    prisma.filterWord.findMany({ where:{ guildId, enabled:true }}),
    prisma.whitelistWord.findMany({ where:{ guildId }}),
    prisma.filterWord.findMany({ where:{ guildId:null, enabled:true }}),
    prisma.whitelistWord.findMany({ where:{ guildId:null }}),
  ]);
  const all = [...globalWords, ...words];
  const mapped = all.map(w=>{
    const norm = fullNormalize(w.word);
    return { word:w.word, severity:w.severity as Severity, norm, isPhrase: norm.includes(' ') };
  });
  mapped.sort((a,b)=> b.norm.length - a.norm.length);
  const wl = new Set([...globalWhitelist,...whitelist].map(x=> fullNormalize(x.word)));
  const data={ words:mapped, whitelist:wl };
  wordCache.set(guildId,data);
  return data;
}
export function invalidateCache(guildId:string){ wordCache.del(guildId); }

function buildRegexForWord(norm:string, isPhrase:boolean): RegExp {
  if(norm.length <= 2){
    return new RegExp(`(^|[^a-zA-Z0-9\u0600-\u06FF])${escapeRegex(norm)}([^a-zA-Z0-9\u0600-\u06FF]|$)`, 'i');
  }
  if(isPhrase){
    const parts = norm.split(/\s+/).map(escapeRegex).join('\\s+');
    return new RegExp(`(^|[^a-zA-Z0-9\u0600-\u06FF])${parts}([^a-zA-Z0-9\u0600-\u06FF]|$)`, 'i');
  }
  return new RegExp(`(^|[^a-zA-Z0-9\u0600-\u06FF])${escapeRegex(norm)}([^a-zA-Z0-9\u0600-\u06FF]|$)`, 'i');
}
function buildObfuscationRegex(norm:string): RegExp {
  const chars = [...norm].map(c=> escapeRegex(c));
  const pattern = chars.join('[\\s\\W_\\.\\-~\\u200B-\\u200D\\uFEFF]{0,3}');
  return new RegExp(pattern, 'i');
}
const VIRTUAL_ROOTS = ['خول','عرص','شرموط','قحبة','متناك','كس','نيك','زامل','ديوث','قواد','fuck','shit','bitch','sharmota','kahba','nik','zamel','3ars','5awal'];
const VIRTUAL_REGEXES = VIRTUAL_ROOTS.map(r=> ({ root:r, norm: fullNormalize(r), re: buildObfuscationRegex(fullNormalize(r)), sev: 'SEVERE' as Severity }));

export async function detectProfanity(guildId:string, content:string): Promise<DetectionResult|null>{
  if(!content || content.trim().length===0) return null;
  const { words, whitelist } = await loadGuildWords(guildId);
  if(words.length===0) return null;
  const variants = normalizedVariants(content);
  const normalizedPrimary = variants[0];
  const tokens = normalizedPrimary.split(/\s+/);
  const tokenSet = new Set(tokens);
  for(const w of whitelist){
    if(tokenSet.has(w)) {
      // if whitelist word equals exactly a filter word, skip that filter word later
    }
  }
  for(const w of words){
    if(whitelist.has(w.norm)) continue;
    const regex = buildRegexForWord(w.norm, w.isPhrase);
    for(const v of variants){
      if(regex.test(v)){
        if(w.norm.length <=3){
          if(!tokenSet.has(w.norm) && !v.includes(` ${w.norm} `) && !v.startsWith(w.norm+' ') && !v.endsWith(' '+w.norm) && v!==w.norm) continue;
        }
        return { word:w.word, severity:w.severity, matched:w.norm };
      }
    }
    const noSpaceVariant = variants.find(x=> !x.includes(' '));
    if(noSpaceVariant && !w.isPhrase && noSpaceVariant.includes(w.norm)){
      if(whitelist.has(w.norm)) continue;
      if(w.norm.length<=3){
        const exact = tokenSet.has(w.norm);
        if(!exact) continue;
      } else {
        if(w.norm.length < 4) continue;
      }
      const primaryNoSpace = normalizedPrimary.replace(/\s+/g,'');
      if(primaryNoSpace.includes(w.norm)){
        return { word:w.word, severity:w.severity, matched:w.norm };
      }
    }
  }
  const rawLower = content.toLowerCase();
  for(const v of VIRTUAL_REGEXES){
    if(whitelist.has(v.norm)) continue;
    if(v.re.test(rawLower) || v.re.test(normalizedPrimary)){
      if(v.norm.length<=3 && !tokenSet.has(v.norm)) continue;
      return { word:v.root, severity:v.sev, matched:v.norm };
    }
  }
  return null;
}
export async function addWord(guildId:string|null, word:string, severity:Severity, language='mixed'){
  if(guildId===null){
    const exist=await prisma.filterWord.findFirst({ where:{ word, guildId:null }});
    const r= exist ? await prisma.filterWord.update({ where:{ id:exist.id }, data:{ severity, language, enabled:true }}) : await prisma.filterWord.create({ data:{ word, guildId:null, severity, language }});
    wordCache.clear(); return r;
  }
  const r= await prisma.filterWord.upsert({ where:{ word_guildId:{ word, guildId } as any }, update:{ severity, language, enabled:true }, create:{ word, guildId, severity, language }});
  invalidateCache(guildId); return r;
}
export async function removeWord(guildId:string|null, word:string){
  const r= await prisma.filterWord.deleteMany({ where:{ word, guildId }});
  if(guildId) invalidateCache(guildId); else wordCache.clear();
  return r;
}
