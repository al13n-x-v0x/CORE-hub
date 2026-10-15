import { PermissionFlagsBits as P } from 'discord.js';
import { getAi } from './ai.js';
import { command as c, str, channel } from './registry.js';
import { textChannel } from './ui.js';
const state=()=>str('state','Enable or disable',true,{choices:['on','off']});
c('setup','autochat','Enable AI conversation in one channel',[channel(),str('mode','Respond when addressed or to all human messages',true,{choices:['named','all']})],async ctx=>{await textChannel(ctx,ctx.args.channel);ctx.store.configure(ctx.guild.id,{autochat:{channel:ctx.args.channel,mode:ctx.args.mode}});await ctx.reply('Auto-chat enabled. This channel sends matching messages to Gemini/Groq. Bots are ignored; messages are rate-limited.');},{permission:'ManageGuild',private:true});
c('setup','massmentions','Allow explicit authorized ping-everyone requests',[state()],async ctx=>{ctx.store.configure(ctx.guild.id,{allowMassMentions:ctx.args.state==='on'});await ctx.reply('Explicit mass mentions '+ctx.args.state+'. User and bot must both have Mention Everyone permission.');},{permission:'Administrator',private:true});
c('ai','autostop','Disable auto-chat in this server',[],async ctx=>{ctx.store.configure(ctx.guild.id,{autochat:null});await ctx.reply('Auto-chat disabled.');},{permission:'ManageGuild',private:true});
export function addressed(content,botId,botName='') {
  const names=['core',botName].filter(Boolean).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  return new RegExp(`(?:<@!?${botId}>|(?:^|\\s)(?:${names.join('|')})(?=$|[\\s,!?:]))`,'i').test(content);
}
export function explicitEveryone(content,botId,botName='') {
  if(!addressed(content,botId,botName))return false;
  let cleaned=content.replace(new RegExp(`<@!?${botId}>`,'g'),'').trim();
  for(const name of ['core',botName].filter(Boolean)){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');cleaned=cleaned.replace(new RegExp(`^${escaped}[,:!\\s]*|[,:!\\s]+${escaped}$`,'ig'),'').trim();}
  return /^ping\s+@?everyone(?:\s|$)/i.test(cleaned);
}
const cooldowns=new Map(),busy=new Set();
export async function autoChat(message,store,{router=getAi,now=()=>Date.now()}={}) {
  const cfg=store.config(message.guild.id),auto=cfg.autochat;
  if(!auto||auto.channel!==message.channel.id||message.author.bot||message.webhookId)return false;
  const botId=message.client.user.id,name=message.guild.members.me?.displayName??message.client.user.username;
  if(auto.mode!=='all'&&!addressed(message.content,botId,name))return false;
  const key=message.guild.id+':'+message.channel.id;
  if(busy.has(key)||(cooldowns.get(key)??0)>now())return true;
  cooldowns.set(key,now()+15000);busy.add(key);
  for(const [k,time]of cooldowns)if(time<now())cooldowns.delete(k);
  try{
    if(explicitEveryone(message.content,botId,name)){
      const member=await message.guild.members.fetch({user:message.author.id,force:true}),bot=await message.guild.members.fetchMe();
      if(!cfg.allowMassMentions||!message.channel.permissionsFor(member)?.has(P.MentionEveryone)||!message.channel.permissionsFor(bot)?.has(P.MentionEveryone)){
        await message.reply({content:'Mass mentions are disabled here or you lack Mention Everyone permission.',allowedMentions:{parse:[],repliedUser:false}});return true;
      }
      const pingKey=`mass-ping:${message.guild.id}`;if(now()-store.get(pingKey,0)<300000){await message.reply({content:'A mass mention was sent recently. Wait five minutes.',allowedMentions:{parse:[],repliedUser:false}});return true;}
      store.set(pingKey,now());await message.channel.send({content:`@everyone — requested by ${message.author.username.replace(/@/g,'＠').slice(0,80)}.`,allowedMentions:{parse:['everyone'],users:[],roles:[]}});return true;
    }
    const key=`ai-budget:${new Date(now()).toISOString().slice(0,10)}:${message.guild.id}`,used=store.get(key,0),limit=Number(process.env.AI_DAILY_REQUESTS??100);
    if(!Number.isFinite(limit)||used>=limit)return true;
    store.set(key,used+1);
    const result=await router().generate(message.content.slice(0,4000),'chat');
    await message.reply({content:result.text,allowedMentions:{parse:[],users:[],roles:[],repliedUser:false}});
    return true;
  }catch(e){console.error('Auto-chat unavailable:',e.code??e.name);await message.reply({content:'AI is temporarily unavailable. Try again later.',allowedMentions:{parse:[],repliedUser:false}}).catch(()=>{});return true;}finally{busy.delete(key);}
}
