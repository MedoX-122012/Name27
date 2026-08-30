export function formatDuration(ms:number): string {
  const m = Math.round(ms/60000);
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m/60); const rm=m%60;
  if (h < 24) return rm? `${h} ساعة و ${rm} دقيقة` : `${h} ساعة`;
  const d=Math.floor(h/24); const rh=h%24;
  return rh? `${d} يوم و ${rh} ساعة` : `${d} يوم`;
}
export function escapeRegex(s:string){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
