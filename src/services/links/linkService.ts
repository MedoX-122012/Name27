const urlRegex = /(https?:\/\/[^\s]+|discord\.gg\/\S+|discord\.com\/invite\/\S+)/gi;
export function extractLinks(content:string): string[]{
  return content.match(urlRegex) || [];
}
export function getDomain(url:string): string | null {
  try{
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./,'').toLowerCase();
  }catch{ return null; }
}
export function checkLinks(content:string, allowed:string[], blocked:string[]): { blocked:boolean; domain?:string; reason?:string }{
  const links = extractLinks(content);
  if(links.length===0) return { blocked:false };
  for(const link of links){
    const d = getDomain(link);
    if(!d) continue;
    if(blocked.some(b=> d===b || d.endsWith('.'+b))) return { blocked:true, domain:d, reason:`نطاق محظور: ${d}` };
    if(allowed.length>0){
      const isAllowed = allowed.some(a=> d===a || d.endsWith('.'+a));
      if(!isAllowed) return { blocked:true, domain:d, reason:`رابط غير مسموح: ${d}` };
    }
  }
  return { blocked:false };
}
