import {randomInt,randomUUID} from 'node:crypto';
import {ActionRowBuilder,ButtonBuilder,ButtonStyle} from 'discord.js';
import {command as c,str,commands,allowed} from './registry.js';
import {embed} from './ui.js';
const modes=['math','sequence','compare','scramble'];
const words=['planet','dragon','castle','rocket','forest','puzzle','wizard','silver','galaxy','portal','orange','pirate'];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const row=items=>new ActionRowBuilder().addComponents(items.map(([id,label])=>new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Primary)));
export function arcadeMenu(prefix='>') {return {embeds:[embed('ARCADE',`Pick a game below. Fresh puzzles every round!\n\n${prefix}arcade • ${prefix}math • ${prefix}sequence • ${prefix}compare • ${prefix}scramble\nAlso: ${prefix}trivia, ${prefix}game tictactoe, ${prefix}dice, ${prefix}rps rock.\nPuzzle scores: /arcade score. Sessions expire after two minutes.`)],components:[row(modes.map(m=>['arcade:new:'+m,m])),row(['trivia','tictactoe','dice'].map(m=>['arcade:launch:'+m,m]))]};}
export function puzzle(mode){
 let question,answer,choices;
 if(mode==='math'){const a=randomInt(2,50),b=randomInt(2,20);answer=a*b;question=`${a} × ${b} = ?`;}
 else if(mode==='sequence'){const a=randomInt(1,50),step=randomInt(2,15);answer=a+step*4;question=`What comes next? ${[0,1,2,3].map(n=>a+step*n).join(', ')}, ?`;}
 else if(mode==='compare'){const a=randomInt(1,99),b=randomInt(1,99);answer=a>b?'Left':a<b?'Right':'Equal';choices=['Left','Right','Equal'];question=`Which is larger? Left: ${a} | Right: ${b}`;}
 else if(mode==='scramble'){answer=words[randomInt(words.length)];let scrambled=shuffle(answer).join('');if(scrambled===answer)scrambled=answer.slice(1)+answer[0];question=`Unscramble: **${scrambled}**`;choices=shuffle([answer,...shuffle(words.filter(w=>w!==answer)).slice(0,3)]);}
 else throw new Error('Unknown arcade game.');
 if(!choices)choices=shuffle([answer,answer+1,answer+randomInt(2,8),answer-randomInt(1,8)].map(String));
 return {question,answer:String(answer),choices};
}
export async function startRound(ctx,mode){const p=puzzle(mode),id=randomUUID();const key=`arcade-round:${ctx.guild.id}:${ctx.user.id}`;
 ctx.store.set(key,{...p,id,expires:Date.now()+120000});await ctx.reply({embeds:[embed(mode,p.question)],components:[row(p.choices.map((v,i)=>[`arcade:answer:${id}:${i}`,v]))]});}
export async function arcadeComponent(ctx,interaction){
 const [group,action,value,index]=interaction.customId.split(':');if(group!=='arcade')return false;
 if(action==='new'){await startRound(ctx,value);return true;}
 if(action==='launch'){if(!['trivia','tictactoe','dice'].includes(value))throw new Error('Unknown arcade game.');const cmd=commands.find(c=>c.group==='game'&&c.name===value);allowed(cmd,ctx.member,ctx.bot,ctx.channel);await cmd.execute({...ctx,args:value==='dice'?{sides:6}:{}});return true;}
 if(action==='answer'){
  const key=`arcade-round:${ctx.guild.id}:${ctx.user.id}`,p=ctx.store.get(key);
  if(!p||p.id!==value||p.expires<Date.now())throw new Error('This round expired or belongs to another player.');
  if(!/^\d$/.test(index)||!p.choices[Number(index)])throw new Error('Invalid answer.');
  ctx.store.delete(key);const won=p.choices[Number(index)]===p.answer,scoreKey=`arcade-score:${ctx.guild.id}:${ctx.user.id}`,score=ctx.store.get(scoreKey,{played:0,wins:0});score.played++;if(won)score.wins++;ctx.store.set(scoreKey,score);
  await ctx.reply({embeds:[embed(won?'Correct!':'Try the next round',`Answer: ${p.answer}\nWins: ${score.wins} / ${score.played}`)],components:[row(modes.map(m=>['arcade:new:'+m,m]))]});return true;
 }throw new Error('Unknown arcade button.');
}
c('arcade','menu','Open the replayable arcade',[],async ctx=>ctx.reply(arcadeMenu(ctx.store.config(ctx.guild.id).prefix??'>')),{aliases:['arcade','games']});
for(const mode of modes)c('arcade',mode,`Play a fresh ${mode} puzzle`,[],ctx=>startRound(ctx,mode),{aliases:[mode]});
c('arcade','score','See your puzzle wins',[],async ctx=>{const s=ctx.store.get(`arcade-score:${ctx.guild.id}:${ctx.user.id}`,{played:0,wins:0});await ctx.reply(`Arcade wins: ${s.wins} / ${s.played}.`);});
