import {ChannelType, PermissionFlagsBits as P} from 'discord.js';
import {command as c,str} from './registry.js';
import {exclusive} from './features.js';

export const COUNTER_INTERVAL=600000;
const labels={members:'Members',humans:'Humans',bots:'Bots',online:'Online ~'};
const keyFor=id=>`counters:${id}`;
const lock=id=>`counter-lock:${id}`;
const option=()=>str('type','Statistic to display',true,{choices:Object.keys(labels)});
const admin={permission:'ManageGuild',private:true};

export async function readCounts(guild,types){
 const result={members:guild.memberCount};
 if(types.some(t=>t==='humans'||t==='bots')){
  // A complete chunk result, never the deliberately bounded member cache.
  const members=await guild.members.fetch({time:60000});
  result.members=members.size;
  result.bots=[...members.values()].filter(m=>m.user.bot).length;
  result.humans=members.size-result.bots;
 }
 if(types.includes('online')){
  const fresh=await guild.client.guilds.fetch({guild:guild.id,force:true,withCounts:true});
  result.online=fresh.approximatePresenceCount;
 }
 for(const type of types)if(!Number.isSafeInteger(result[type])||result[type]<0)throw new Error('Discord did not return complete counter data. Try again later.');
 return result;
}
const nameFor=(type,value)=>`${labels[type]}: ${value.toLocaleString('en-US')}`;

export async function setupCounter(ctx){
 const type=ctx.args.type;
 if(!Object.hasOwn(labels,type))throw new Error('Unknown counter type.');
 if(!ctx.member.permissions.has(P.ManageChannels)||!ctx.bot.permissions.has(P.ManageChannels))throw new Error('You and the bot need Manage Channels to create counters.');
 await exclusive(lock(ctx.guild.id),async()=>{
  const key=keyFor(ctx.guild.id),record=ctx.store.get(key,{channels:{},updated:0});
  if(record.channels[type])throw new Error('This counter is already configured. Remove its tracking first to replace it.');
  const counts=await readCounts(ctx.guild,[type]);
  const ch=await ctx.guild.channels.create({name:nameFor(type,counts[type]),type:ChannelType.GuildVoice,permissionOverwrites:[{id:ctx.guild.id,allow:[P.ViewChannel],deny:[P.Connect]}],reason:'CORE server statistics counter'});
  ctx.store.set(key,{...record,channels:{...record.channels,[type]:ch.id}});
 });
 await ctx.reply(`${labels[type]} counter created. Updates every 10 minutes. Online is Discord's approximate online count, including bots.`);
}

export async function counterTick(client,store,now=Date.now()){
 for(const {key} of store.list('counters:')){
  const id=key.slice('counters:'.length);
  try{await exclusive(lock(id),async()=>{
   const record=store.get(key);
   if(!record||!Object.keys(record.channels).length||now-record.updated<COUNTER_INTERVAL)return;
   // Persist the attempt time so failures and restarts cannot hammer Discord.
   store.set(key,{...record,updated:now});
   const guild=await client.guilds.fetch(id),counts=await readCounts(guild,Object.keys(record.channels));
   for(const [type,channelId]of Object.entries(record.channels)){
    try{
     const ch=await guild.channels.fetch(channelId);
     if(!ch||ch.guild.id!==id||ch.type!==ChannelType.GuildVoice)continue;
     const name=nameFor(type,counts[type]);
     if(ch.name!==name)await ch.setName(name,'CORE statistics refresh');
    }catch(e){console.error('Counter channel update:',e.code??e.name);}
   }
  });}catch(e){console.error('Counter update:',e.code??e.name);}
 }
}

c('counter','setup','Create an auto-updating server statistics channel',[option()],setupCounter,admin);
c('counter','remove','Stop tracking a counter; leave its channel intact',[option()],async ctx=>{
 await exclusive(lock(ctx.guild.id),async()=>{const key=keyFor(ctx.guild.id),r=ctx.store.get(key);if(r){delete r.channels[ctx.args.type];ctx.store.set(key,r);}});
 await ctx.reply('Counter tracking removed. Its voice channel is kept; you can delete it manually.');
},{permission:'ManageGuild',private:true});
c('counter','list','Show configured server statistics counters',[],async ctx=>{
 const r=ctx.store.get(keyFor(ctx.guild.id),{channels:{}});
 await ctx.reply(Object.entries(r.channels).map(([type,id])=>`${labels[type]}: <#${id}>`).join('\n')||'No counters yet. Use /counter setup.');
},{permission:'ManageGuild',private:true});
