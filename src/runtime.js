import { Client, GatewayIntentBits as I, Options, Events, MessageFlags } from 'discord.js';
import { createServer } from 'node:http';
import { commands, parsePrefix, allowed } from './registry.js';
import { Store } from './store.js';
import { component, tick, memberJoined, moderateMessage } from './features.js';
import { extraComponent, extraMessage, extraTick, syncLevels, applyPresence, guardEvent } from './extras.js';
import { autoChat } from './autochat.js';
import {stickyMessage,stickyTick} from './sticky.js';
import {commandsBlocked,replyKey} from './prefix-plus.js';
import {counterTick} from './counters.js';
import {arcadeComponent} from './arcade.js';
import {collectComponent} from './collect.js';
import {inviteComponent,inviteJoined,inviteTick,primeInvites} from './invites.js';

export class Cooldowns {
  constructor(){this.items=new Map();}
  take(key,duration=2000,now=Date.now()) {const until=this.items.get(key)??0;if(until>now)throw new Error(`Wait ${Math.ceil((until-now)/1000)} seconds.`);this.items.set(key,now+duration);}
  sweep(now=Date.now()){for(const [key,until]of this.items)if(until<=now)this.items.delete(key);}
}
export function createClient() {
  return new Client({intents:[I.Guilds,I.GuildMessages,I.MessageContent,I.GuildMembers],allowedMentions:{parse:[],repliedUser:false},
    makeCache:Options.cacheWithLimits({...Options.DefaultMakeCacheSettings,MessageManager:25,ReactionManager:0,PresenceManager:0,GuildMemberManager:{maxSize:100,keepOverLimit:member=>member.id===member.client.user?.id},UserManager:{maxSize:200,keepOverLimit:user=>user.id===user.client.user?.id}}),
    sweepers:{...Options.DefaultSweeperSettings,messages:{interval:300,lifetime:600}}});
}
export function safeError(error) {
  if(error.code===50013)return 'Missing permissions. Check my role position and channel permissions.';
  if(error.code===50001)return 'I cannot access that channel or resource.';
  if(error.code===10007)return 'That member is not in this server.';
  if(error.code===10026)return 'That user is not banned.';
  if(error.code)return `Discord rejected this action (code ${error.code}).`;
  return error.message?.slice(0,1500)??'The command failed. Try again.';
}
export async function makeContext(client,store,source,args={},isInteraction=false) {
  const guild=source.guild;if(!guild)throw new Error('Use commands inside a server.');
  const user=isInteraction?source.user:source.author;
  const [member,bot]=await Promise.all([guild.members.fetch({user:user.id,force:true}),guild.members.fetchMe()]);
  return {client,store,guild,user,member,bot,channel:source.channel,args,isInteraction,
    async reply(payload){const normalized=typeof payload==='string'?{content:payload}:payload;const body={...normalized,allowedMentions:{parse:[],repliedUser:false}};if(isInteraction)return source.editReply(body);return source.channel.send(body);}
  };
}
export function healthServer(client,port) {
  const server=createServer((req,res)=>{if(req.url!=='/health'){res.writeHead(404);res.end();return;}
    const ready=client.isReady();res.writeHead(ready?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ready,uptimeSeconds:Math.floor(process.uptime()),rssMiB:Math.round(process.memoryUsage().rss/1048576)}));
  });server.listen(port,'0.0.0.0');return server;
}
export async function start() {
  const token=process.env.DISCORD_TOKEN;if(!token)throw new Error('Set DISCORD_TOKEN in your private .env file before starting.');
  const client=createClient(),store=new Store(`${process.env.DATA_DIR??'./data'}/core.sqlite`),cooldowns=new Cooldowns();
  const intervals=[];let health;
  client.once(Events.ClientReady,()=>{console.log(`CORE online as ${client.user.tag}; ${commands.length} subcommands loaded.`);applyPresence(client,store);primeInvites(client,store).catch(e=>console.error('Invite setup:',e.code??e.name));});
  client.on(Events.Error,e=>console.error('Discord client error:',e.code??e.name));
  client.on(Events.GuildMemberAdd,async m=>{
    let inviterId=null;
    try{inviterId=await inviteJoined(m,store);}catch(e){console.error('Invite attribution:',e.code??e.name);}
    await Promise.all([memberJoined(m,store,inviterId),guardEvent(m.guild,'joins',store)]).catch(e=>console.error('Member event:',e.code??e.name));
  });
  client.on(Events.GuildMemberRemove,m=>store.forfeitInviteJoin(m.guild.id,m.id));
  client.on(Events.ChannelDelete,ch=>{if(ch.guild)guardEvent(ch.guild,'channel deletions',store).catch(e=>console.error('Guard:',e.code??e.name));});
  client.on(Events.InteractionCreate,async interaction=>{
    if(!interaction.isChatInputCommand()&&!interaction.isButton())return;
    try{
      if(!interaction.inGuild()){await interaction.reply({content:'Use this in a server.',flags:MessageFlags.Ephemeral});return;}
      const cmd=interaction.isChatInputCommand()?commands.find(c=>c.group===interaction.commandName&&c.name===interaction.options.getSubcommand()):null;
      if(interaction.isChatInputCommand()&&!cmd){await interaction.reply({content:'Command is out of date. Ask an admin to register commands again.',flags:MessageFlags.Ephemeral});return;}
      if(interaction.isChatInputCommand()&&commandsBlocked(interaction.channel,store.config(interaction.guild.id))&&!(cmd?.group==='setup'&&cmd?.name==='commandchannels')){await interaction.reply({content:'Commands are disabled here. Please use a bot-command channel.',flags:MessageFlags.Ephemeral});return;}
      await interaction.deferReply({...(cmd?.private!==false&&(cmd?.private||interaction.isButton())?{flags:MessageFlags.Ephemeral}:{})});
      const args={};if(cmd)for(const o of cmd.options){const value=interaction.options.get(o.name)?.value;if(value!==undefined)args[o.name]=value;}
      const ctx=await makeContext(client,store,interaction,args,true);
      cooldowns.take(`${ctx.guild.id}:${ctx.user.id}:${cmd?cmd.group+'.'+cmd.name:'button'}`,cmd?.cooldown??2000);
      if(cmd){allowed(cmd,ctx.member,ctx.bot,ctx.channel);await cmd.execute(ctx);}else if(!await collectComponent(ctx,interaction)&&!await inviteComponent(ctx,interaction)&&!await arcadeComponent(ctx,interaction)&&!await extraComponent(ctx,interaction))await component(ctx,interaction);
    }catch(e){console.error('Interaction failed:',e.code??e.name);const payload={content:safeError(e),allowedMentions:{parse:[]}};if(interaction.deferred||interaction.replied)await interaction.editReply(payload).catch(()=>{});else await interaction.reply({...payload,flags:MessageFlags.Ephemeral}).catch(()=>{});}
  });
  client.on(Events.MessageCreate,async message=>{
    if(!message.guild||message.author.bot||message.webhookId)return;
    try{
      if(await extraMessage(message,store)||await moderateMessage(message,store))return;
      stickyMessage(message,store);
      const cfg=store.config(message.guild.id);
      if(commandsBlocked(message.channel,cfg)){
        const starts=[cfg.prefix??process.env.PREFIX??'>',...(cfg.prefixes??[]),`<@${client.user.id}>`,`<@!${client.user.id}>`];
        if(!starts.some(p=>p&&message.content.startsWith(p))){
          if(cfg.levels&&message.content.trim().length>=5&&store.awardXp(message.guild.id,message.author.id))await syncLevels(message.member,store);
          await autoChat(message,store);
        }
        return;
      }
      let parsed;
      try{parsed=parsePrefix(message.content,cfg.prefix??process.env.PREFIX??'>',client.user.id,cfg.aliases??{},cfg.prefixes??[],name=>store.get(replyKey(message.guild.id,name)));}catch(e){if(await autoChat(message,store))return;throw e;}
      if(!parsed){if(cfg.levels&&message.content.trim().length>=5&&store.awardXp(message.guild.id,message.author.id))await syncLevels(message.member,store);await autoChat(message,store);return;}
      const ctx=await makeContext(client,store,message,parsed.args);
      cooldowns.take(`${ctx.guild.id}:${ctx.user.id}:${parsed.cmd.group}.${parsed.cmd.name}`,parsed.cmd.cooldown??2000);
      allowed(parsed.cmd,ctx.member,ctx.bot,ctx.channel);await parsed.cmd.execute(ctx);
    }catch(e){console.error('Message command failed:',e.code??e.name);await message.channel.send({content:safeError(e),allowedMentions:{parse:[]}}).catch(()=>{});}
  });
  let ticking=false;
  intervals.push(setInterval(async()=>{if(!client.isReady()||ticking)return;ticking=true;try{await tick(client,store);await extraTick(client,store);await stickyTick(client,store);await inviteTick(client,store);}catch(e){console.error('Background task:',e.code??e.name);}finally{ticking=false;}},15000));
  let counting=false;
  intervals.push(setInterval(async()=>{if(!client.isReady()||counting)return;counting=true;try{await counterTick(client,store);}finally{counting=false;}},30000));
  intervals.push(setInterval(()=>cooldowns.sweep(),60000));
  let stopped=false;
  const stop=()=>{if(stopped)return;stopped=true;for(const timer of intervals)clearInterval(timer);health?.close();client.destroy();store.close();};
  if(process.env.PORT){const port=Number(process.env.PORT);if(!Number.isInteger(port)||port<1||port>65535){stop();throw new Error('PORT must be 1–65535.');}health=healthServer(client,port);health.on('error',e=>{console.error('Health server failed:',e.code);stop();process.exitCode=1;});}
  process.once('SIGINT',()=>{stop();process.exit(0);});process.once('SIGTERM',()=>{stop();process.exit(0);});
  try{await client.login(token);}catch{stop();throw new Error('Discord login failed. Check the bot token and enabled gateway intents.');}
  return {client,store,stop};
}
