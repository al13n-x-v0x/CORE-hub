import { PermissionFlagsBits as P } from 'discord.js';
import { command as c, channel, integer } from './registry.js';
import { button, embed, safeSend, textChannel } from './ui.js';

const snapshots=new Map();
const queues=new Map();
const pendingJoins=new Map();
let lastPayout=0;

export function inviteDifference(before,after,tracked=null){
  if(!before)return null;
  const changes=[];
  for(const [code,uses] of after){
    const previous=before.get(code);
    if(previous===undefined){if(uses>0)changes.push({code,delta:uses,unknown:true});}
    else if(uses>previous)changes.push({code,delta:uses-previous});
  }
  return changes.length===1&&changes[0].delta===1&&!changes[0].unknown&&(!tracked||tracked.has(changes[0].code))?changes[0].code:null;
}

async function snapshot(guild){
  const invites=await guild.invites.fetch({cache:false});
  return {uses:new Map([...invites.values()].map(x=>[x.code,x.uses??0])),inviters:new Map([...invites.values()].map(x=>[x.code,x.inviter?.id??null]))};
}

async function prime(guild){snapshots.set(guild.id,(await snapshot(guild)).uses);}
export async function primeWelcomeInvites(guild){await prime(guild);}

export async function primeInvites(client,store){
  for(const guild of client.guilds.cache.values()){
    const cfg=store.config(guild.id);
    if(!cfg.inviteRewards?.channel&&!cfg.welcome)continue;
    try{await prime(guild);}catch(error){console.error('Invite snapshot:',guild.id,error.code??error.name);}
  }
}

async function personalLink(ctx){
  const cfg=ctx.store.config(ctx.guild.id).inviteRewards;
  if(!cfg?.channel)throw new Error('An admin must run /invite setup first.');
  if(!ctx.bot.permissions.has(P.ManageGuild))throw new Error('I need Manage Server permission to track invite use counts.');
  const ch=await textChannel(ctx,cfg.channel);
  if(!ch.permissionsFor(ctx.bot)?.has(P.CreateInstantInvite))throw new Error('I need Create Invite in the configured channel.');
  if(!snapshots.has(ctx.guild.id))await prime(ctx.guild);
  const existing=ctx.store.inviteLink(ctx.guild.id,ctx.user.id);
  if(existing){
    const current=await ctx.guild.invites.fetch(existing.code).catch(e=>{if(e.code===10006)return null;throw e;});
    if(current)return `https://discord.gg/${current.code}`;
  }
  const invite=await ctx.guild.invites.create(ch,{maxAge:0,maxUses:0,unique:true,reason:`CORE invite rewards: ${ctx.user.id}`});
  ctx.store.setInviteLink(ctx.guild.id,ctx.user.id,invite.code,ch.id);
  const baseline=snapshots.get(ctx.guild.id);
  baseline.set(invite.code,invite.uses??0);
  return `https://discord.gg/${invite.code}`;
}

export async function inviteJoined(member,store){
  const guild=member.guild,previous=queues.get(guild.id)??Promise.resolve();
  pendingJoins.set(guild.id,(pendingJoins.get(guild.id)??0)+1);
  const current=previous.catch(()=>{}).then(async()=>{
    const cfg=store.config(guild.id).inviteRewards;
    if(!cfg?.channel&&!store.config(guild.id).welcome)return null;
    await new Promise(resolve=>setTimeout(resolve,1000));
    const before=snapshots.get(guild.id),after=await snapshot(guild);
    snapshots.set(guild.id,after.uses);
    if(member.user.bot||pendingJoins.get(guild.id)>1)return null;
    const links=store.inviteLinks(guild.id),tracked=new Set(links.map(x=>x.code));
    const code=inviteDifference(before,after.uses);
    if(!code)return null;
    const inviter=tracked.has(code)?links.find(x=>x.code===code)?.user:after.inviters.get(code);
    if(!inviter||inviter===member.id)return null;
    if(cfg?.channel&&tracked.has(code))store.recordInviteJoin(guild.id,member.id,inviter,code,cfg.coins);
    return inviter;
  });
  queues.set(guild.id,current);
  try{return await current;}finally{if(queues.get(guild.id)===current)queues.delete(guild.id);const left=(pendingJoins.get(guild.id)??1)-1;if(left)pendingJoins.set(guild.id,left);else pendingJoins.delete(guild.id);}
}

export async function inviteTick(client,store,now=Date.now()){
  if(now-lastPayout<60000)return;
  lastPayout=now;
  for(const row of store.pendingInviteJoins(now)){
    try{
      const guild=client.guilds.cache.get(row.guild);
      if(!guild)continue;
      let member;
      try{member=await guild.members.fetch({user:row.joined,force:true});}
      catch(error){if(error.code!==10007)throw error;}
      store.settleInviteJoin(row.guild,row.joined,!!member&&member.joinedTimestamp<=row.joined_at+10000);
    }catch(error){console.error('Invite reward:',row.guild,error.code??error.name);}
  }
}

c('invite','setup','Set a tracked invite channel and reward',[channel(),integer('coins','Coins per verified recruit',25,1000)],async ctx=>{
  if(!ctx.bot.permissions.has(P.ManageGuild))throw new Error('I need Manage Server permission to track invite use counts.');
  const ch=await textChannel(ctx,ctx.args.channel);
  if(!ch.permissionsFor(ctx.bot)?.has(P.CreateInstantInvite))throw new Error('I need Create Invite in that channel.');
  await prime(ctx.guild);
  ctx.store.configure(ctx.guild.id,{inviteRewards:{channel:ch.id,coins:ctx.args.coins}});
  await ctx.reply(`Invite rewards enabled: **${ctx.args.coins} coins** per verified recruit who stays 24 hours. Personal links point to <#${ch.id}>.`);
},{permission:'ManageGuild',private:true});

c('invite','disable','Stop new invite rewards',[],async ctx=>{
  ctx.store.configure(ctx.guild.id,{inviteRewards:null});
  snapshots.delete(ctx.guild.id);
  await ctx.reply('Invite rewards disabled. Rewards already pending from verified joins will still settle after 24 hours.');
},{permission:'ManageGuild',private:true});

c('invite','link','Get your tracked personal invite link',[],async ctx=>{
  const url=await personalLink(ctx);
  const text=`Your personal invite: ${url}\nRewards require an unambiguous tracked join and a 24-hour stay. Rejoins do not earn another reward.`;
  if(ctx.isInteraction)await ctx.reply(text);
  else {
    try{await ctx.user.send({content:text,allowedMentions:{parse:[]}});await ctx.reply('I sent your invite link by DM.');}
    catch{await ctx.reply('I could not DM your link. Use /invite link for a private reply.');}
  }
},{private:true,cooldown:5000});

c('invite','stats','See your invite rewards',[],async ctx=>{
  const row=ctx.store.inviteStats(ctx.guild.id,ctx.user.id),cfg=ctx.store.config(ctx.guild.id).inviteRewards;
  await ctx.reply({embeds:[embed('Your invites',`**${row.rewarded}** rewarded · **${row.pending}** awaiting 24 hours · **${row.joined}** tracked joins\n${cfg?.channel?`${cfg.coins} coins per qualified recruit. Use /invite link for your personal link.`:'Invite rewards are not enabled in this server.'}`)]});
},{private:true});

c('invite','leaderboard','See verified invite leaders',[],async ctx=>{
  const rows=ctx.store.inviteLeaders(ctx.guild.id);
  await ctx.reply({embeds:[embed('Invite leaderboard',rows.map((x,i)=>`${i+1}. <@${x.user}> — **${x.rewarded}** verified recruits`).join('\n')||'No verified invites yet.')]});
},{aliases:['invitetop']});

c('embed','invite','Publish an invite rewards panel',[channel()],async ctx=>{
  const cfg=ctx.store.config(ctx.guild.id).inviteRewards;
  if(!cfg?.channel)throw new Error('Run /invite setup first.');
  const ch=await textChannel(ctx,ctx.args.channel);
  await safeSend(ch,{embeds:[embed('Invite rewards',`Bring real people into **${ctx.guild.name}** with your personal CORE link.\n\n**${cfg.coins} coins** for each new member who joins through your tracked link and stays 24 hours.\n\nPress below for your private link. Rejoins, bots and joins the bot cannot attribute clearly do not earn coins. See /invite stats and /invite leaderboard for progress.`)],components:[button('invite:link','Get my invite link')]});
  await ctx.reply(`Invite rewards panel posted in <#${ch.id}>.`);
},{permission:'ManageGuild',private:true});

export async function inviteComponent(ctx,interaction){
  if(interaction.customId!=='invite:link')return false;
  await ctx.reply(`Your personal invite: ${await personalLink(ctx)}\nA verified new member must stay 24 hours before coins are paid.`);
  return true;
}
