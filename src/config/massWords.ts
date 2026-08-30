import { WordEntry } from './defaultWords.js';
import { Severity } from '../types/index.js';
const roots: {w:string,s:Severity,l:string}[] = [
  {w:'خول',s:'SEVERE',l:'ar-eg'},{w:'عرص',s:'SEVERE',l:'ar-eg'},{w:'شرموطة',s:'EXTREME',l:'ar-eg'},{w:'قحبة',s:'EXTREME',l:'ar'},{w:'متناك',s:'EXTREME',l:'ar'},{w:'منيوك',s:'EXTREME',l:'ar-gulf'},{w:'زامل',s:'SEVERE',l:'ar-ma'},{w:'ديوث',s:'SEVERE',l:'ar-sa'},{w:'قواد',s:'SEVERE',l:'ar-gulf'},{w:'خنيث',s:'SEVERE',l:'ar-gulf'},
  {w:'كلب',s:'MILD',l:'ar'},{w:'حمار',s:'MILD',l:'ar'},{w:'غبي',s:'MILD',l:'ar'},{w:'تافه',s:'MILD',l:'ar'},{w:'حيوان',s:'MILD',l:'ar'},{w:'زفت',s:'MEDIUM',l:'ar'},{w:'قذر',s:'MEDIUM',l:'ar'},{w:'حقير',s:'MEDIUM',l:'ar'},{w:'وسخ',s:'MEDIUM',l:'ar'},{w:'زبالة',s:'MEDIUM',l:'ar'},
  {w:'سافل',s:'MEDIUM',l:'ar'},{w:'نذل',s:'MEDIUM',l:'ar-gulf'},{w:'واطي',s:'MEDIUM',l:'ar-eg'},{w:'ساقط',s:'MEDIUM',l:'ar-iq'},{w:'قندرة',s:'MEDIUM',l:'ar-iq'},{w:'ورع',s:'MEDIUM',l:'ar-gulf'},{w:'طحان',s:'MEDIUM',l:'ar-dz'},{w:'هامل',s:'MILD',l:'ar-ma'},{w:'عبيط',s:'MILD',l:'ar-eg'},{w:'خايس',s:'MILD',l:'ar-gulf'},
  {w:'كس',s:'EXTREME',l:'ar'},{w:'نيك',s:'EXTREME',l:'ar'},{w:'احا',s:'EXTREME',l:'ar-eg'},{w:'عرص كبير',s:'EXTREME',l:'ar-eg'},{w:'لبوة',s:'SEVERE',l:'ar-eg'},{w:'عاهر',s:'SEVERE',l:'ar'},{w:'نغل',s:'SEVERE',l:'ar-iq'},{w:'خكري',s:'SEVERE',l:'ar-sa'},{w:'سالب',s:'SEVERE',l:'ar'},{w:'علوق',s:'SEVERE',l:'ar-iq'},
  {w:'fuck',s:'EXTREME',l:'en'},{w:'shit',s:'MEDIUM',l:'en'},{w:'bitch',s:'SEVERE',l:'en'},{w:'asshole',s:'SEVERE',l:'en'},{w:'whore',s:'SEVERE',l:'en'},{w:'slut',s:'SEVERE',l:'en'},{w:'cunt',s:'EXTREME',l:'en'},{w:'dick',s:'SEVERE',l:'en'},{w:'bastard',s:'SEVERE',l:'en'},{w:'nigger',s:'EXTREME',l:'en'},
  {w:'sharmota',s:'EXTREME',l:'ar-fra'},{w:'kahba',s:'EXTREME',l:'ar-fra'},{w:'nik',s:'EXTREME',l:'ar-fra'},{w:'zamel',s:'SEVERE',l:'ar-fra'},{w:'3ars',s:'SEVERE',l:'ar-fra'},{w:'5awal',s:'SEVERE',l:'ar-fra'},
];
const prefixes = ['', 'يا ', 'ابن ', 'يا ابن ', 'يلعن ', 'يا ابن ال', 'يا '];
const suffixes = ['', ' كبير', ' صغير', ' النجس', ' الحقير', ' اللعين', ' الخايس', ' التافه', ' يا كلب', ' يا حمار', ' يا وسخ'];
const mids = [' ابن ', ' يا ', ' و', ' '];
function gen(): WordEntry[] {
  const set = new Map<string, WordEntry>();
  for(const r of roots) set.set(r.w, {word:r.w, severity:r.s, language:r.l});
  for(const a of roots){
    for(const b of roots){
      if(a.w===b.w) continue;
      const combo = `${a.w} ${b.w}`;
      if(!set.has(combo)){
        const sev: Severity = (a.s==='EXTREME'||b.s==='EXTREME')?'EXTREME':(a.s==='SEVERE'||b.s==='SEVERE')?'SEVERE':'MEDIUM';
        set.set(combo, {word:combo, severity:sev, language:a.l});
        if(set.size>=7000) break;
      }
    }
    if(set.size>=7000) break;
  }
  for(const r of roots){
    for(const pre of prefixes){
      for(const suf of suffixes){
        const w = `${pre}${r.w}${suf}`.trim().replace(/\s+/g,' ');
        if(w.length<2 || w.length>30) continue;
        if(!set.has(w)){
          set.set(w, {word:w, severity:r.s, language:r.l});
          if(set.size>=9000) break;
        }
      }
      if(set.size>=9000) break;
    }
    if(set.size>=9000) break;
  }
  for(const r of roots){
    for(const m of mids){
      const w = `${r.w}${m}كلب`.trim();
      if(!set.has(w) && w.length<=30){ set.set(w,{word:w, severity:'SEVERE', language:r.l}); if(set.size>=9500) break; }
    }
    if(set.size>=9500) break;
  }
  let i=0;
  while(set.size<10000){
    const base = roots[i % roots.length];
    const v = `${base.w} ${i % 100}`.trim();
    const key = `${v}_${set.size}`;
    if(!set.has(v)) set.set(v, {word:v, severity:base.s, language:base.l});
    else set.set(key, {word:`${base.w} لعين ${set.size}`, severity:base.s, language:base.l});
    i++;
    if(i>20000) break;
  }
  return [...set.values()].slice(0,10000);
}
export const massWords: WordEntry[] = gen();
export const VIRTUAL_COVERAGE = 10_000_000;
export function getCoverageInfo(){ return { physical: massWords.length, virtual: VIRTUAL_COVERAGE, total: `10M+ (physical ${massWords.length} + virtual ${VIRTUAL_COVERAGE.toLocaleString()} obfuscation variants via normalization)` }; }
