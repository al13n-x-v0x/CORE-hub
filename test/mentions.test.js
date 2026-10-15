import test from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits as P,PermissionsBitField } from 'discord.js';
import { autoChat } from '../src/autochat.js';
import { Store } from '../src/store.js';
for(const scenario of ['authorized','user-denied','bot-denied'])test(`mass mention: ${scenario} checks fresh permissions`,async()=>{
  const s=new Store(':memory:');const guild='mentions-'+scenario;
  s.configure(guild,{autochat:{channel:'c',mode:'named'},allowMassMentions:true});
  let fetched=0,sends=[],replies=[],now=1000000;
  const message={guild:{id:guild,members:{me:{displayName:'CORE'},fetch:async options=>{assert.equal(options.force,true);fetched++;return {type:'user'};},fetchMe:async()=>{fetched++;return {type:'bot'};}}},channel:{id:'c',permissionsFor:who=>new PermissionsBitField(scenario===who.type+'-denied'?[]:[P.MentionEveryone]),send:async p=>sends.push(p)},client:{user:{id:'123456789012345678'}},author:{id:'223456789012345678',username:'Member',bot:false},content:'core ping everyone',reply:async p=>replies.push(p)};
  try {
    await autoChat(message,s,{now:()=>now,router:()=>{throw new Error('Must not call AI');}});
    assert.equal(fetched,2);
    if(scenario==='authorized'){assert.equal(sends.length,1);assert.deepEqual(sends[0].allowedMentions.parse,['everyone']);now+=16000;await autoChat(message,s,{now:()=>now});assert.equal(sends.length,1);assert.match(replies.at(-1).content,/five minutes/);}
    else {assert.equal(sends.length,0);assert.deepEqual(replies[0].allowedMentions.parse,[]);}
  } finally {s.close();}
});
