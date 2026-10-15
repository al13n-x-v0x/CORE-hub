import {command as c,str,channel} from './registry.js';
import {embed,textChannel,safeSend} from './ui.js';
import {exclusive} from './features.js';
import {arcadeMenu} from './arcade.js';
const keyFor=(guild,ch)=>`sticky:${guild}:${ch}`;
const lock=key=>'sticky-lock:'+key;
async function removeOld(ch,record,botId){if(!record.message)return;let msg;try{msg=await ch.messages.fetch(record.message);}catch(e){if(e.code===10008)return;throw e;}if(msg.author.id!==botId)throw new Error('Refusing to delete a message not owned by this bot.');await msg.delete();}
export async function replaceSticky(ch,store,key,record,botId,now=Date.now()){
 await removeOld(ch,record,botId);record={...record,message:null,updated:now};store.set(key,record);
 const msg=await safeSend(ch,record.kind==='arcade'?arcadeMenu(store.config(record.guild).prefix??'>'):{embeds:[embed('Sticky message',record.text)]});
 store.set(key,{...record,message:msg.id,dirty:false,updated:now});
}
export async function setSticky(ctx,kind){const ch=await textChannel(ctx,ctx.args.channel);if(!ch.permissionsFor(ctx.bot)?.has('ReadMessageHistory'))throw new Error('I need Read Message History there.');
 const key=keyFor(ctx.guild.id,ch.id);await exclusive(lock(key),async()=>{const old=ctx.store.get(key,{});await replaceSticky(ch,ctx.store,key,{...old,guild:ctx.guild.id,channel:ch.id,kind,text:ctx.args.text??'',dirty:true},ctx.bot.id);});await ctx.reply(`Sticky ${kind==='arcade'?'arcade':'message'} enabled in <#${ch.id}>. Reposts at most every 30 seconds after human activity.`);}
export function stickyMessage(message,store){if(!message.guild||message.author.bot||message.webhookId)return;const key=keyFor(message.guild.id,message.channel.id),r=store.get(key);if(r&&!r.dirty)store.set(key,{...r,dirty:true});}
export async function stickyTick(client,store,now=Date.now()){
 for(const {key,value:r}of store.list('sticky:'))if(r.dirty&&now-(r.updated??0)>=30000){try{await exclusive(lock(key),async()=>{const current=store.get(key);if(!current?.dirty||now-(current.updated??0)<30000)return;store.set(key,{...current,updated:now});const ch=await client.channels.fetch(current.channel);await replaceSticky(ch,store,key,current,client.user.id,now);});}catch(e){console.error('Sticky update:',e.code??e.name);}}
 for(const {key,value:r}of store.list('arcade-round:'))if(r.expires<now)store.delete(key);
}
const admin={permission:'ManageGuild',private:true};
c('sticky','set','Set a sticky message in a channel',[channel(),str('text','Sticky message text',true,{max:1800})],ctx=>setSticky(ctx,'text'),admin);
c('sticky','arcade','Keep the arcade menu near the bottom',[channel()],ctx=>setSticky(ctx,'arcade'),admin);
c('sticky','off','Remove the sticky from a channel',[channel()],async ctx=>{const ch=await textChannel(ctx,ctx.args.channel),key=keyFor(ctx.guild.id,ch.id);await exclusive(lock(key),async()=>{const r=ctx.store.get(key);if(r)await removeOld(ch,r,ctx.bot.id);ctx.store.delete(key);});await ctx.reply('Sticky removed.');},admin);
c('sticky','show','Show current sticky settings',[channel()],async ctx=>{const r=ctx.store.get(keyFor(ctx.guild.id,ctx.args.channel));await ctx.reply(r?`Type: ${r.kind}\n${r.text||'Arcade menu'}\nRepost cooldown: 30 seconds.`:'No sticky configured.');},admin);
c('setup','sticky','Set a sticky message',[channel(),str('text','Sticky message text',true,{max:1800})],ctx=>setSticky(ctx,'text'),admin);
c('setup','arcade','Set a sticky arcade menu',[channel()],ctx=>setSticky(ctx,'arcade'),admin);
c('arcade','sticky','Keep the arcade sticky here or in another channel',[channel('channel',false)],ctx=>setSticky({...ctx,args:{channel:ctx.args.channel??ctx.channel.id}},'arcade'),{...admin,aliases:['stickarcade']});
