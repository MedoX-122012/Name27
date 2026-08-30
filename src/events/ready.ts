import { Client } from 'discord.js';
import { defaultWords } from '../config/defaultWords.js';
import { massWords } from '../config/massWords.js';
import { prisma } from '../database/prisma.js';
let synced=false;
export async function onReady(client:Client){
  if(synced) return;
  synced=true;
  console.log(`[Ready] Logged in as ${client.user?.tag}`);
  const all=[...defaultWords, ...massWords];
  try{
    const existing = await prisma.filterWord.findMany({ where:{ guildId:null }, select:{ word:true, severity:true, language:true }});
    const map = new Map(existing.map(e=> [e.word, e]));
    const toCreate: any[] = [];
    const toUpdate: {word:string, sev:string, lang:string}[] = [];
    for(const w of all){
      const e = map.get(w.word);
      if(!e) toCreate.push({ word:w.word, severity:w.severity, language:w.language, guildId:null });
      else if(e.severity!==w.severity || e.language!==w.language) toUpdate.push({word:w.word, sev:w.severity, lang:w.language});
    }
    if(toCreate.length){
      console.log(`[DB] Creating ${toCreate.length} new words...`);
      for(let i=0;i<toCreate.length;i+=500){
        await prisma.filterWord.createMany({ data: toCreate.slice(i,i+500) as any });
        console.log(`[DB] Created ${Math.min(i+500,toCreate.length)}/${toCreate.length}`);
      }
    }
    if(toUpdate.length){
      console.log(`[DB] Updating ${toUpdate.length} words...`);
      for(const u of toUpdate){
        const rec = await prisma.filterWord.findFirst({ where:{ word:u.word, guildId:null }});
        if(rec) await prisma.filterWord.update({ where:{ id:rec.id }, data:{ severity:u.sev, language:u.lang }});
      }
    }
    const total=await prisma.filterWord.count({ where:{ guildId:null }});
    console.log(`[DB] Done. Total global words: ${total}`);
  }catch(e){ console.error('[DB] Sync error', e); }
}
