import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
export const embed=(title,description)=>new EmbedBuilder().setColor(0x20d9c2).setTitle(`>_ CORE | ${title}`).setDescription(description).setFooter({text:'Gaming / Chatting / Coding'}).setTimestamp();
export const button=(id,label,style=ButtonStyle.Primary)=>new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style));
export const safeSend=(channel,payload)=>channel.send({...payload,allowedMentions:{parse:[]}});
export async function audit(ctx,title,description) {
  const id=ctx.store.config(ctx.guild.id).logs;
  if(!id) return;
  const ch=await ctx.guild.channels.fetch(id).catch(()=>null);
  if(ch?.isTextBased()) await safeSend(ch,{embeds:[embed(title,`${description}\nBy <@${ctx.user.id}>`)]}).catch(()=>{});
}
export async function textChannel(ctx,id) {
  const ch=await ctx.guild.channels.fetch(id).catch(()=>null);
  if(!ch?.isTextBased()||ch.isThread()) throw new Error('Choose an accessible server text channel.');
  if(!ch.permissionsFor(ctx.bot)?.has(['ViewChannel','SendMessages','EmbedLinks'])) throw new Error('I need View Channel, Send Messages and Embed Links there.');
  return ch;
}
export async function safeRole(ctx,id) {
  const r=await ctx.guild.roles.fetch(id);
  if(!r||r.id===ctx.guild.id||r.managed) throw new Error('Choose a regular server role.');
  if(ctx.bot.roles.highest.comparePositionTo(r)<=0) throw new Error('That role must be below my highest role.');
  if(ctx.member.id!==ctx.guild.ownerId&&ctx.member.roles.highest.comparePositionTo(r)<=0) throw new Error('That role must be below your highest role.');
  return r;
}
export function ensureAssignable(r) {
  const risky=['Administrator','ManageGuild','ManageRoles','ManageChannels','ManageWebhooks','BanMembers','KickMembers','ModerateMembers','ManageMessages','MentionEveryone','ManageThreads'];
  if(r.permissions.any(risky)) throw new Error('Self-assign and auto roles cannot grant moderation or administrative permissions.');
}
