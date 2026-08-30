export class TTLCache<K,V>{
  private map=new Map<K,{v:V;e:number}>();
  constructor(private ttl:number=60000){}
  get(k:K):V|undefined{ const x=this.map.get(k); if(!x) return; if(Date.now()>x.e){ this.map.delete(k); return; } return x.v; }
  set(k:K,v:V){ this.map.set(k,{v,e:Date.now()+this.ttl}); }
  del(k:K){ this.map.delete(k); }
  clear(){ this.map.clear(); }
}
