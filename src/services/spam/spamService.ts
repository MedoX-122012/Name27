import { SpamState } from '../../types/index.js';
const map = new Map<string, SpamState & {warnedAt?:number}>();
const capsMap = new Map<string, number>();

export function checkSpam(guildId:string, userId:string, content:string): { isSpam:boolean; reason?:string }{
  const key=`${guildId}:${userId}`;
  const now=Date.now();
  let s = map.get(key);
  if(!s) s={ timestamps:[], lastContent:'', repeatCount:0 };
  s.timestamps = s.timestamps.filter(t=> now - t < 5000);
  s.timestamps.push(now);
  if(content === s.lastContent) s.repeatCount++; else s.repeatCount=1;
  s.lastContent=content;
  map.set(key,s);
  if(s.timestamps.length >= 5) return { isSpam:true, reason:'إرسال رسائل كثيرة بسرعة (Flooding)' };
  if(s.repeatCount >= 3) return { isSpam:true, reason:'تكرار نفس الرسالة' };
  const words = content.split(/\s+/);
  const freq = new Map<string,number>();
  for(const w of words) freq.set(w,(freq.get(w)||0)+1);
  for(const [,c] of freq) if(c>=5 && words.length>=5) return { isSpam:true, reason:'تكرار نفس الكلمة' };
  const letters = content.replace(/[^A-Za-z]/g,'');
  if(letters.length>=10){
    const caps = letters.replace(/[^A-Z]/g,'').length;
    if(caps/letters.length > 0.7) return { isSpam:true, reason:'أحرف كبيرة مفرطة (CAPS)' };
  }
  const emojiCount = (content.match(/<a?:\w+:\d+>|\p{Emoji}/gu)||[]).length;
  if(emojiCount >= 8) return { isSpam:true, reason:'إيموجي مفرط' };
  return { isSpam:false };
}
export function shouldWarnSpam(guildId:string,userId:string):boolean{
  const key=`${guildId}:${userId}`;
  const s=map.get(key);
  if(!s) return true;
  if(s.warnedAt && Date.now()-s.warnedAt < 30000) return false;
  s.warnedAt=Date.now();
  return true;
}
setInterval(()=>{ const now=Date.now(); for(const [k,v] of map) if(v.timestamps.length===0 || now - Math.max(...v.timestamps) > 60000) map.delete(k); }, 60000);
