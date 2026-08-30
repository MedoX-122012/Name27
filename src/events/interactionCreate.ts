import { Interaction } from 'discord.js';
import { isRateLimited } from '../utils/ratelimit.js';
export async function onInteractionCreate(interaction: Interaction){
  if(!interaction.isChatInputCommand()) return;
  const key = `${interaction.user.id}:${interaction.commandName}`;
  if(isRateLimited(key, 3, 5000)){
    return interaction.reply({ content:'⏳ اهدأ قليلاً — انتظر ثواني قبل استخدام الأمر مرة أخرى', ephemeral:true }).catch(()=>{});
  }
  const cmd = (interaction.client as any).commands?.get(interaction.commandName);
  if(!cmd) return;
  try{ await cmd.execute(interaction); }catch(e:any){
    console.error('[command]', e);
    const msg = e?.message || 'حدث خطأ';
    if(interaction.replied || interaction.deferred) await interaction.followUp({ content:`❌ ${msg}`, ephemeral:true }).catch(()=>{});
    else await interaction.reply({ content:`❌ ${msg}`, ephemeral:true }).catch(()=>{});
  }
}
