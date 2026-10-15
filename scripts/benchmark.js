import '../src/commands.js';
import { createClient } from '../src/runtime.js';
import { Store } from '../src/store.js';
import { rankSvg,quoteSvg,png } from '../src/cards.js';
import { mkdir,writeFile } from 'node:fs/promises';
const client=createClient(),store=new Store(':memory:');
const mib=()=>Math.round(process.memoryUsage().rss/1048576*10)/10;
const initial=mib();let peak=initial;const start=performance.now();
const sampler=setInterval(()=>peak=Math.max(peak,mib()),5);
try {
  for(let i=0;i<40;i++){await png(i%2?quoteSvg({text:'Build something worth sharing.',author:'CORE'}):rankSvg({name:'LoadTest',xp:i*100,coins:500}));peak=Math.max(peak,mib());}
  const result={date:new Date().toISOString(),node:process.version,platform:process.platform,scenario:'Disconnected Discord client, in-memory SQLite, 40 sequential PNG renders; no live guilds or AI calls',initialRssMiB:initial,peakRssMiB:peak,finalRssMiB:mib(),elapsedMs:Math.round(performance.now()-start)};
  await mkdir('reports',{recursive:true});await writeFile('reports/memory.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
} finally {clearInterval(sampler);client.destroy();store.close();}
