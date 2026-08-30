import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { prisma } from './database/prisma.js';
import { onReady } from './events/ready.js';
import { onMessageCreate } from './events/messageCreate.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { onGuildCreate } from './events/guildCreate.js';
import { env } from './config/env.js';
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
}) as any;
client.commands = new Collection();
async function loadCommands(){
  const base=path.join(process.cwd(),'src/commands');
  for(const entry of fs.readdirSync(base, { recursive:true } as any) as string[]){
    const full=path.join(base, entry);
    if(fs.statSync(full).isDirectory()) continue;
    if(!full.endsWith('.ts') && !full.endsWith('.js')) continue;
    const mod=await import(pathToFileURL(full).href);
    if(mod.data && mod.execute) client.commands.set(mod.data.name, mod);
  }
  console.log(`[Loader] ${client.commands.size} commands loaded`);
}
client.once('clientReady', ()=> onReady(client));
client.on('messageCreate', onMessageCreate);
client.on('interactionCreate', onInteractionCreate);
client.on('guildCreate', onGuildCreate);
let warnedContentIntent=false;
client.on('error', (e:any)=> console.error('[client error]', e));
client.on('shardError', (e:any)=> console.error('[shardError]', e));
process.on('unhandledRejection', (e:any)=> console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e:any)=> console.error('[uncaughtException]', e));
async function gracefulShutdown(signal:string){
  console.log(`[${signal}] shutting down...`);
  try{ await prisma.$disconnect(); }catch{}
  try{ client.destroy(); }catch{}
  process.exit(0);
}
process.on('SIGINT', ()=> gracefulShutdown('SIGINT'));
process.on('SIGTERM', ()=> gracefulShutdown('SIGTERM'));
function startWebServer(){
  const app = express();
  app.get('/', (_req:any, res:any) => res.send('Name27 يعمل بنجاح! - Medo x Roto'));
  app.get('/health', (_req:any, res:any) => res.json({ status:'ok', bot: client.user?.tag || 'starting', uptime: process.uptime() }));
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(port, () => console.log(`[Web] خادم الويب جاهز على PORT ${port}`));
}
async function main(){
  startWebServer();
  await loadCommands();
  if(!env.token){ console.error('DISCORD_TOKEN missing in .env'); process.exit(1); }
  await client.login(env.token);
  setInterval(async ()=>{
    try{
      const now=new Date();
      const expired=await prisma.warning.findMany({ where:{ expiresAt:{ lte: now }}});
      if(expired.length>0){
        await prisma.$transaction(expired.map(w=> prisma.warning.delete({ where:{ id:w.id }})));
        for(const w of expired){
          await prisma.user.updateMany({ where:{ userId:w.userId, guildId:w.guildId }, data:{ warns:{ decrement:1 }, points:{ decrement: w.points }}}).catch(()=>{});
        }
        console.log(`[Expire] Cleaned ${expired.length} warns`);
      }
    }catch(e){ console.error('[expire]', e); }
  }, 60*60*1000);
}
main();
