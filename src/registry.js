import { SlashCommandBuilder, PermissionFlagsBits as P, ChannelType } from 'discord.js';

export const commands=[];
export function command(group,name,description,options,execute,extra={}) {
  commands.push({group,name,description,options,execute,...extra});
}
export const str=(name,description,required=true,extra={})=>({type:'String',name,description,required,...extra});
export const user=(name='user',required=true)=>({type:'User',name,description:'Discord member',required});
export const integer=(name,description,min,max,required=true)=>({type:'Integer',name,description,min,max,required});
export const channel=(name='channel',required=true)=>({type:'Channel',name,description:'Text channel',required});
export const role=(name='role',required=true)=>({type:'Role',name,description:'Server role',required});
export function slashData() {
  const groups=new Map();
  for(const cmd of commands) {
    if(cmd.prefixOnly)continue;
    if(!groups.has(cmd.group)) groups.set(cmd.group,new SlashCommandBuilder().setName(cmd.group).setDescription(`CORE ${cmd.group} commands`).setContexts(0));
    groups.get(cmd.group).addSubcommand(sub=>{
      sub.setName(cmd.name).setDescription(cmd.description);
      for(const opt of cmd.options) sub[`add${opt.type}Option`](o=>{
        o.setName(opt.name).setDescription(opt.description).setRequired(opt.required);
        if(opt.type==='String') o.setMaxLength(opt.max??1000);
        if(opt.type==='Channel') o.addChannelTypes(ChannelType.GuildText);
        if(opt.min!==undefined) o.setMinValue(opt.min);
        if(opt.max!==undefined&&opt.type==='Integer') o.setMaxValue(opt.max);
        if(opt.choices) o.addChoices(...opt.choices.map(value=>({name:value,value})));
        return o;
      }); return sub;
    });
  }
  return [...groups.values()].map(g=>g.toJSON());
}
export function tokenize(text) {
  const result=[]; let value='',quote=null,active=false;
  for (const ch of text.trim()) {
    if (quote) { if(ch===quote) quote=null; else value+=ch; active=true; }
    else if((ch==='"'||ch==="'")&&!active) {quote=ch;active=true;}
    else if(/\s/.test(ch)) {if(active){result.push(value);value='';active=false;}}
    else {value+=ch;active=true;}
  }
  if(quote) throw new Error('Close the quote in your command.');
  if(active) result.push(value); return result;
}
export function parsePrefix(content,prefix,botId,customAliases={},extraPrefixes=[],replyLookup=()=>null) {
  const starts=[prefix,...extraPrefixes,`<@${botId}>`,`<@!${botId}>`].filter(Boolean).sort((a,b)=>b.length-a.length);
  const start=starts.find(p=>content.startsWith(p)); if(!start) return null;
  let text=content.slice(start.length).trim(); if(text.startsWith('_ ')) text=text.slice(2).trim();
  const parts=tokenize(text); if(!parts.length) return null;
  let first=parts.shift().toLowerCase();
  if(Object.hasOwn(customAliases,first)){const [group,name]=customAliases[first].split('.');first=group;parts.unshift(name);}
  if(first==='setup'&&parts[0]==='tickets')parts[0]='ticket';
  let cmd=commands.find(c=>c.group===first&&c.name===parts[0]?.toLowerCase());
  if(cmd) parts.shift(); else cmd=commands.find(c=>(c.aliases??[]).includes(first));
  if(!cmd){const reply=replyLookup(first);if(typeof reply==='string')return {cmd:{group:'reply',name:first,options:[],execute:ctx=>ctx.reply({content:reply,allowedMentions:{parse:[],repliedUser:false}})},args:{}};}
  if(!cmd) throw new Error('Unknown command. Use /core help or your prefix + help.');
  const args={};
  for(let i=0;i<cmd.options.length;i++) {
    const o=cmd.options[i]; let value=i===cmd.options.length-1&&o.type==='String'?parts.splice(0).join(' '):parts.shift();
    if(value===undefined||value==='') {if(o.required) throw new Error(`Missing ${o.name}. Usage: ${prefix}${cmd.group} ${cmd.name} ${cmd.options.map(o=>o.required?`<${o.name}>`:`[${o.name}]`).join(' ')}`); continue;}
    if(o.type==='Integer') {if(!/^-?\d+$/.test(value)) throw new Error(`${o.name} must be a whole number.`); value=Number(value); if(!Number.isSafeInteger(value)||value<o.min||value>o.max) throw new Error(`${o.name} must be ${o.min}–${o.max}.`);}
    if(['User','Role','Channel'].includes(o.type)) {value=value.replace(/[<@!&#>]/g,'');if(!/^\d{17,20}$/.test(value)) throw new Error(`Mention a valid ${o.name}, or use its ID.`);}
    if(o.type==='String'&&value.length>(o.max??1000)) throw new Error(`${o.name} is too long.`);
    if(o.choices&&!o.choices.includes(value)) throw new Error(`Choose: ${o.choices.join(', ')}.`);
    args[o.name]=value;
  }
  if(parts.length) throw new Error('Too many arguments. Use quotes around text with spaces.');
  return {cmd,args};
}
export function allowed(cmd,member,bot,channel) {
  if(cmd.permission&&!member.permissions.has(P[cmd.permission])) throw new Error(`You need ${cmd.permission} permission.`);
  for(const permission of cmd.botPermissions??[]) if(!channel.permissionsFor(bot)?.has(P[permission])) throw new Error(`I need ${permission} in this channel.`);
}
export function guardTarget(actor,target,bot,ownerId) {
  if(target.id===actor.id||target.id===bot.id||target.id===ownerId) throw new Error('You cannot moderate yourself, this bot, or the server owner.');
  if(actor.id!==ownerId&&actor.roles.highest.comparePositionTo(target.roles.highest)<=0) throw new Error('Your role must be above the target member.');
  if(bot.roles.highest.comparePositionTo(target.roles.highest)<=0) throw new Error('My role must be above the target member.');
}
