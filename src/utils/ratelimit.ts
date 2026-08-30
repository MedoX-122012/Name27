const buckets = new Map<string, number[]>();
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = buckets.get(key) || [];
  const fresh = arr.filter(t => now - t < windowMs);
  if (fresh.length >= limit) { buckets.set(key, fresh); return true; }
  fresh.push(now);
  buckets.set(key, fresh);
  return false;
}
setInterval(()=>{ const now=Date.now(); for(const [k,v] of buckets) if(v.every(t=> now-t>60000)) buckets.delete(k); }, 60000);
