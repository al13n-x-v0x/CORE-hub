import { ChannelType, PermissionFlagsBits as P, AttachmentBuilder } from 'discord.js';
import { randomInt } from 'node:crypto';
import { embed, button, safeSend, ensureAssignable, audit } from './ui.js';
import { bannerSvg,cardPayload,animatedCardPayload } from './cards.js';
import { welcomeFrames,welcomeSvg } from './welcome.js';

const locks=new Set();
export async function exclusive(key,fn) {
  if(locks.has(key))throw new Error('That operation is already in progress. Try again shortly.');
  locks.add(key);try{return await fn();}finally{locks.delete(key);}
}
export function canManageTicket(ctx,record) {
  return ctx.member.permissions.has(P.ManageChannels)||ctx.member.roles.cache.has(ctx.store.config(ctx.guild.id).ticketStaff)||record.owner===ctx.user.id;
}
export async function openTicket(ctx) {
  return exclusive(`ticket-open:${ctx.guild.id}:${ctx.user.id}`,async()=>{
    const config=ctx.store.config(ctx.guild.id);
    if(!config.ticketStaff) throw new Error('An admin must run /setup ticket first.');
    const staff=await ctx.guild.roles.fetch(config.ticketStaff);
    if(!staff||staff.id===ctx.guild.id)throw new Error('The ticket staff role no longer exists. Ask an admin to configure tickets.');
    const index=`ticket-owner:${ctx.guild.id}:${ctx.user.id}`;
    const existing=ctx.store.get(index);
    if(existing&&await ctx.guild.channels.fetch(existing).catch(()=>null))return existing;
    if(!ctx.bot.permissions.has(P.ManageChannels))throw new Error('I need Manage Channels to open tickets.');
    const ch=await ctx.guild.channels.create({name:`ticket-${ctx.user.username.replace(/[^a-z0-9-]/gi,'').toLowerCase().slice(0,25)||'member'}`,type:ChannelType.GuildText,topic:`CORE ticket | owner ${ctx.user.id}`,permissionOverwrites:[
      {id:ctx.guild.id,deny:[P.ViewChannel]},
      {id:ctx.user.id,allow:[P.ViewChannel,P.SendMessages,P.ReadMessageHistory,P.AttachFiles]},
      {id:staff.id,allow:[P.ViewChannel,P.SendMessages,P.ReadMessageHistory]},
      {id:ctx.bot.id,allow:[P.ViewChannel,P.SendMessages,P.ReadMessageHistory,P.ManageChannels,P.ManageRoles,P.EmbedLinks,P.AttachFiles]}
    ]});
    ctx.store.set(`ticket:${ctx.guild.id}:${ch.id}`,{owner:ctx.user.id,created:Date.now(),closed:false,added:[]});ctx.store.set(index,ch.id);
    await safeSend(ch,{embeds:[embed('Support ticket',`Welcome <@${ctx.user.id}>. Explain what you need help with.\nStaff: <@&${staff.id}>\nClosing archives the conversation; it does not delete the channel.`)],components:[button('ticket:close','Close ticket')]});
    return ch.id;
  });
}
export async function transcript(ctx) {
  const record=ctx.store.get(`ticket:${ctx.guild.id}:${ctx.channel.id}`);
  if(!record||!canManageTicket(ctx,record))throw new Error('Only the ticket owner or staff can export this ticket.');
  const messages=[];let before;
  for(let i=0;i<10;i++){
    const page=await ctx.channel.messages.fetch({limit:100,...(before?{before}:{})});if(!page.size)break;
    messages.push(...page.values());before=page.last().id;if(page.size<100)break;
  }
  messages.sort((a,b)=>a.createdTimestamp-b.createdTimestamp);
  const body=`CORE ticket ${ctx.channel.id}\nOwner: ${record.owner}\nExport: ${new Date().toISOString()}\nUp to the latest 1000 messages; attachments are links and can expire.\n\n`+messages.map(m=>`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag} (${m.author.id})\n${m.content}\n${[...m.attachments.values()].map(a=>a.url).join('\n')}`).join('\n\n');
  return new AttachmentBuilder(Buffer.from(body,'utf8'),{name:`ticket-${ctx.channel.id}.txt`});
}
export async function closeTicket(ctx) {
  return exclusive(`ticket-close:${ctx.channel.id}`,async()=>{
    const key=`ticket:${ctx.guild.id}:${ctx.channel.id}`,record=ctx.store.get(key);
    if(!record||!canManageTicket(ctx,record))throw new Error('Only the ticket owner or staff can close this ticket.');
    if(record.closed)throw new Error('Ticket already closed.');
    const file=await transcript(ctx);
    await safeSend(ctx.channel,{embeds:[embed('Ticket closed',`Closed by <@${ctx.user.id}>. Transcript attached. Staff can delete this channel when no longer needed.`)],files:[file]});
    for(const id of [record.owner,...(record.added??[])])await ctx.channel.permissionOverwrites.edit(id,{SendMessages:false,AttachFiles:false});
    record.closed=true;ctx.store.set(key,record);ctx.store.delete(`ticket-owner:${ctx.guild.id}:${record.owner}`);
    await ctx.channel.setName(`closed-${ctx.channel.name.replace(/^ticket-/,'')}`.slice(0,100)).catch(()=>{});
    await audit(ctx,'Ticket closed',ctx.channel.id);
  });
}
export async function createGiveaway(ctx) {
  const msg=await safeSend(ctx.channel,{embeds:[embed('🎉 Giveaway',`**${ctx.args.prize}**\nWinners: ${ctx.args.winners}\nEnds <t:${Math.floor((Date.now()+ctx.args.minutes*60000)/1000)}:R>\nPress Enter to join. Press again to leave.`)],components:[button('giveaway:enter','Enter / leave')]});
  ctx.store.set(`giveaway:${ctx.guild.id}:${msg.id}`,{guild:ctx.guild.id,channel:ctx.channel.id,message:msg.id,prize:ctx.args.prize,winners:ctx.args.winners,ends:Date.now()+ctx.args.minutes*60000,entries:[],ended:false});
}
export function draw(entries,count,previous=[]) {
  let pool=[...new Set(entries)].filter(id=>!previous.includes(id));const winners=[];
  while(pool.length&&winners.length<count)winners.push(pool.splice(randomInt(pool.length),1)[0]);return winners;
}
export async function endGiveaway(client,store,guild,id,reroll=false) {
  return exclusive(`giveaway:${guild}:${id}`,async()=>{
    const key=`giveaway:${guild}:${id}`,data=store.get(key);
    if(!data)throw new Error('Giveaway not found in this server.');
    if(reroll&&!data.ended)throw new Error('End the giveaway before rerolling.');
    if(data.ended&&!reroll&&!data.pending)return;
    const ch=await client.channels.fetch(data.channel);const msg=await ch.messages.fetch(id);
    const winners=data.pending?data.selected:draw(data.entries,data.winners,reroll?(data.selected??[]):[]);
    data.selected=winners;data.pending=true;data.ended=true;store.set(key,data);
    await msg.edit({embeds:[embed(reroll?'🎉 Winners rerolled':'🎉 Giveaway ended',`**${data.prize}**\n${winners.length?`Winners: ${winners.map(id=>`<@${id}>`).join(', ')}`:'No eligible entrants.'}\nEntries: ${data.entries.length}`)],components:[],allowedMentions:{parse:[]}});
    data.pending=false;store.set(key,data);
  });
}
export async function component(ctx,interaction) {
  const id=interaction.customId;
  if(id==='ticket:open'){await ctx.reply(`Your ticket: <#${await openTicket(ctx)}>`);return;}
  if(id==='ticket:close'){await closeTicket(ctx);await ctx.reply('Ticket closed.');return;}
  if(id.startsWith('role:')||id.startsWith('verify:')){
    const roleId=id.split(':')[1];if(ctx.store.get(`rolemenu:${ctx.guild.id}:${interaction.message.id}`)!==roleId)throw new Error('This role menu is not registered.');
    const role=await ctx.guild.roles.fetch(roleId);if(!role||role.managed||ctx.bot.roles.highest.comparePositionTo(role)<=0)throw new Error('This role is no longer assignable.');ensureAssignable(role);
    if(!ctx.bot.permissions.has(P.ManageRoles))throw new Error('I need Manage Roles.');
    await exclusive(`role:${ctx.guild.id}:${ctx.user.id}`,async()=>{const fresh=await ctx.guild.members.fetch({user:ctx.user.id,force:true});const has=fresh.roles.cache.has(role.id);if(id.startsWith('verify:')&&has){await ctx.reply('You are already verified.');return;}await fresh.roles[has?'remove':'add'](role);await ctx.reply(`${role.name} ${has?'removed':'added'}.`);});return;
  }
  if(id==='giveaway:enter'){
    const key=`giveaway:${ctx.guild.id}:${interaction.message.id}`,data=ctx.store.get(key);
    if(!data||data.ended||data.ends<=Date.now())throw new Error('This giveaway has ended.');
    const joined=data.entries.includes(ctx.user.id);
    if(!joined&&data.entries.length>=10000)throw new Error('This giveaway has reached its entry limit.');
    data.entries=joined?data.entries.filter(x=>x!==ctx.user.id):[...data.entries,ctx.user.id];ctx.store.set(key,data);await ctx.reply(joined?'You left the giveaway.':'You entered the giveaway.');return;
  }
  if(id.startsWith('trivia:')){
    const [,key,answer]=id.split(':');const record=ctx.store.get(`trivia:${key}`);
    if(!record||record.guild!==ctx.guild.id||record.user!==ctx.user.id||record.expires<Date.now())throw new Error('This question expired or belongs to another player.');
    ctx.store.delete(`trivia:${key}`);await interaction.message.edit({components:[]});await ctx.reply(Number(answer)===record.correct?'Correct! 🎉':'Not quite. Try another question.');return;
  }
  throw new Error('Unknown button.');
}
export async function tick(client,store) {
  for(const {key,value} of store.list('giveaway:'))if((!value.ended&&value.ends<=Date.now())||value.pending){
    try{await endGiveaway(client,store,value.guild,value.message);}catch(e){console.error('Giveaway update failed:',e.code??e.name);}
  }
  for(const {key,value} of store.list('trivia:'))if(value.expires<Date.now())store.delete(key);
}
export async function memberJoined(member,store,inviterId=null) {
  const cfg=store.config(member.guild.id);
  if(cfg.autorole){try{const r=await member.guild.roles.fetch(cfg.autorole);if(r){ensureAssignable(r);await member.roles.add(r,'CORE auto role');}}catch(e){console.error('Auto role failed:',e.code??e.name);}}
  if(cfg.welcome){const ch=await member.guild.channels.fetch(cfg.welcome).catch(()=>null);if(ch?.isTextBased()){
    const template=!cfg.welcomeMessage||cfg.welcomeMessage==='Welcome {user} to {server}!'
      ?'Hey {user}, welcome to **{server}**! Glad you made it. Say hi, check the server channels, and use `/core help` to see what CORE can do.'
      :cfg.welcomeMessage;
    const description=template.replaceAll('{user}',`<@${member.id}>`).replaceAll('{server}',member.guild.name).replaceAll('{inviter}',inviterId?`<@${inviterId}>`:'unavailable');
    const panel=embed('Welcome aboard',description).setThumbnail(member.user.displayAvatarURL({size:128}));
    if(inviterId)panel.addFields({name:'Was invited by',value:`<@${inviterId}>`,inline:true});
    panel.addFields({name:'Start here',value:'Introduce yourself · `/collect cat` · `/core help`',inline:!!inviterId});
    const payload={embeds:[panel]};
    if(cfg.welcomeCards!==false){
      const inviter=inviterId?await member.guild.members.fetch(inviterId).catch(()=>null):null;
      const details={name:member.displayName,server:member.guild.name,count:member.guild.memberCount,inviter:inviter?.displayName??null};
      try{Object.assign(payload,await animatedCardPayload(welcomeFrames(details),'welcome.gif','Animated welcome to CORE'));panel.setImage('attachment://welcome.gif');}
      catch(e){
        console.error('Animated welcome card:',e.code??e.name);
        try{Object.assign(payload,await cardPayload(welcomeSvg(details),'welcome.png'));panel.setImage('attachment://welcome.png');}
        catch(fallbackError){console.error('Welcome card:',fallbackError.code??fallbackError.name);}
      }
    }
    await safeSend(ch,payload).catch(e=>console.error('Welcome failed:',e.code??e.name));
  }}
}
export async function moderateMessage(message,store) {
  const cfg=store.config(message.guild.id);
  if(message.member?.permissions.has(P.ManageMessages))return false;
  const invite=cfg.blockInvites&&/(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i.test(message.content);
  const mentions=cfg.mentionLimit>0&&(message.mentions.users.size+message.mentions.roles.size+(message.mentions.everyone?1:0)>=cfg.mentionLimit);
  if(!invite&&!mentions)return false;
  await message.delete();
  const log=cfg.logs?await message.guild.channels.fetch(cfg.logs).catch(()=>null):null;
  if(log?.isTextBased())await safeSend(log,{embeds:[embed('Auto moderation',`Removed a message by <@${message.author.id}> in <#${message.channel.id}>: ${invite?'invite link':'mention limit'}.`)]}).catch(()=>{});
  return true;
}
