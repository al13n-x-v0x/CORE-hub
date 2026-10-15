import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/commands.js';
import {commands,slashData,parsePrefix,allowed} from '../src/registry.js';
import {commandsBlocked,replyKey,validateReplyName} from '../src/prefix-plus.js';
import {Store} from '../src/store.js';
test('prefix-only commands resolve but are absent from slash payloads',()=>{
 const slash=slashData();for(const cmd of commands.filter(c=>c.prefixOnly))assert(!slash.find(g=>g.name===cmd.group)?.options.some(o=>o.name===cmd.name));
 assert.equal(parsePrefix('>reverse abc','>','b').cmd.prefixOnly,true);
 assert.equal(parsePrefix('!rollmany 3 6','>','b',{},['!']).args.count,3);
});
test('general and its threads block commands; explicit channel rules override defaults',()=>{
 assert(commandsBlocked({id:'g',name:'general'},{}));assert(commandsBlocked({id:'t',parentId:'g',parent:{name:'💬-general'}},{}));
 assert(!commandsBlocked({id:'b',name:'bot-commands'},{}));assert(!commandsBlocked({id:'g',name:'general'},{commandChannels:{g:'allow'}}));
 assert(commandsBlocked({id:'t',parentId:'g',name:'thread'},{commandChannels:{g:'block',t:'allow'}}));
});
test('custom replies are guild scoped, protected on creation, and never override built-ins',async()=>{
 const store=new Store(':memory:');try{
  const cmd=commands.find(c=>c.group==='reply'&&c.name==='set');assert.throws(()=>allowed(cmd,{permissions:{has:()=>false}},{},{}));
  await cmd.execute({store,guild:{id:'a'},args:{name:'rulesinfo',text:'@everyone read the rules'},reply:async()=>{}});
  assert.equal(store.get(replyKey('b','rulesinfo')),null);let payload;
  const parsed=parsePrefix('>rulesinfo','>','b',{},[],name=>store.get(replyKey('a',name)));await parsed.cmd.execute({reply:async p=>payload=p});assert.deepEqual(payload.allowedMentions.parse,[]);
  for(const name of ['ban','mod','__proto__','constructor','prefixmenu'])assert.throws(()=>validateReplyName(name));
  assert.equal(parsePrefix('>ban 123456789012345678','>','b',{},[],()=> 'fake').cmd.permission,'BanMembers');
 }finally{store.close();}
});
test('secret guessing round is isolated, ends on success, and cannot replay',async()=>{
 const store=new Store(':memory:');try{
  const ctx={store,guild:{id:'g'},user:{id:'u'},reply:async()=>{}};
  await commands.find(c=>c.name==='secretstart').execute(ctx);const r=store.get('secretguess:g:u');
  const cmd=commands.find(c=>c.name==='secretguess');assert.throws(()=>cmd.execute({...ctx,user:{id:'other'},args:{number:r.answer}}));
  await cmd.execute({...ctx,args:{number:r.answer}});assert.equal(store.get('secretguess:g:u'),null);assert.throws(()=>cmd.execute({...ctx,args:{number:r.answer}}));
 }finally{store.close();}
});
