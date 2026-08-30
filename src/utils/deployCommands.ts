import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
async function loadCommands(dir:string){
  const cmds:any[]=[];
  for(const f of fs.readdirSync(dir, { recursive:true } as any) as string[]){
    if(!f.endsWith('.ts') && !f.endsWith('.js')) continue;
    const full=path.join(dir,f);
    const mod=await import(pathToFileURL(full).href);
    if(mod.data) cmds.push(mod.data.toJSON());
  }
  return cmds;
}
async function main(){
  const token=process.env.DISCORD_TOKEN!;
  const clientId=process.env.CLIENT_ID!;
  const guildId=process.env.GUILD_ID;
  if(!token||!clientId){ console.error('Missing DISCORD_TOKEN/CLIENT_ID'); process.exit(1); }
  const commands=await loadCommands(path.join(process.cwd(),'src/commands'));
  const rest=new REST({ version:'10' }).setToken(token);
  if(guildId){
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`Deployed ${commands.length} guild commands`);
  }else{
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`Deployed ${commands.length} global commands`);
  }
}
main();
