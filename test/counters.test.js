import test from 'node:test';
import assert from 'node:assert/strict';
import {ChannelType,PermissionFlagsBits as P,PermissionsBitField} from 'discord.js';
import '../src/commands.js';
import {commands,parsePrefix} from '../src/registry.js';
import {Store} from '../src/store.js';
import {readCounts,setupCounter,counterTick} from '../src/counters.js';

test('counter commands use server stats and no moderation counter remains',()=>{
 assert.equal(parsePrefix('>counter setup bots','>','b').args.type,'bots');
 assert(!commands.some(c=>c.group==='mod'&&c.name==='counter'));
 assert(commands.filter(c=>c.group==='counter').every(c=>c.permission==='ManageGuild'));
});
test('human and bot totals use the full fetch; online uses fresh approximate count',async()=>{
 let fetched=0;
 const guild={id:'g',memberCount:999,members:{fetch:async()=>{fetched++;return new Map([['a',{user:{bot:false}}],['b',{user:{bot:true}}]]);}},client:{guilds:{fetch:async options=>{assert.equal(options.force,true);assert.equal(options.withCounts,true);return{approximatePresenceCount:1};}}}};
 assert.deepEqual(await readCounts(guild,['members','humans','bots','online']),{members:2,humans:1,bots:1,online:1});assert.equal(fetched,1);
 guild.client.guilds.fetch=async()=>({});await assert.rejects(()=>readCounts(guild,['online']),/complete counter data/);
});
test('setup creates a read-only voice channel once, persists it, and rejects missing permissions',async()=>{
 const store=new Store(':memory:');try{
  let created=0;const perms=new PermissionsBitField([P.ManageChannels]);
  const ctx={store,args:{type:'members'},member:{permissions:perms},bot:{permissions:perms},guild:{id:'g',memberCount:20,channels:{create:async options=>{created++;assert.equal(options.type,ChannelType.GuildVoice);assert.deepEqual(options.permissionOverwrites[0].deny,[P.Connect]);return{id:'c'};}}},reply:async()=>{}};
  await setupCounter(ctx);assert.equal(store.get('counters:g').channels.members,'c');await assert.rejects(()=>setupCounter(ctx),/already configured/);assert.equal(created,1);
  await assert.rejects(()=>setupCounter({...ctx,member:{permissions:new PermissionsBitField()}}),/Manage Channels/);
 }finally{store.close();}
});
test('refresh throttles updates, skips unchanged names and isolates guilds',async()=>{
 const store=new Store(':memory:');try{
  store.set('counters:g',{channels:{members:'c'},updated:0});let writes=0,reads=0;
  const ch={guild:{id:'g'},type:ChannelType.GuildVoice,name:'Members: 1',setName:async name=>{writes++;ch.name=name;}};
  const client={guilds:{fetch:async id=>{reads++;assert.equal(id,'g');return{memberCount:2,channels:{fetch:async()=>ch}};}}};
  await counterTick(client,store,600000);assert.equal(ch.name,'Members: 2');await counterTick(client,store,600001);assert.equal(reads,1);await counterTick(client,store,1200000);assert.equal(writes,1);
  ch.guild.id='foreign';ch.name='Members: 0';await counterTick(client,store,1800000);assert.equal(writes,1);
 }finally{store.close();}
});
test('failed fetch preserves channel count and backs off; remove leaves channel alone',async()=>{
 const store=new Store(':memory:');try{
  store.set('counters:g',{channels:{bots:'c'},updated:0});let writes=0,reads=0;
  const client={guilds:{fetch:async()=>{reads++;return{members:{fetch:async()=>{throw Error('unavailable');}},channels:{fetch:async()=>{writes++;}}};}}};
  await counterTick(client,store,600000);await counterTick(client,store,600001);assert.equal(writes,0);assert.equal(reads,1);assert.equal(store.get('counters:g').channels.bots,'c');
  await commands.find(c=>c.group==='counter'&&c.name==='remove').execute({store,guild:{id:'g'},args:{type:'bots'},reply:async()=>{}});assert.deepEqual(store.get('counters:g').channels,{});
 }finally{store.close();}
});
