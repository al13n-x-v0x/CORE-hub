import {jsonFetch} from '../src/net.js';
import {mkdir,writeFile} from 'node:fs/promises';
const checks=[['GamerPower','https://www.gamerpower.com/api/giveaways',d=>Array.isArray(d)&&d.length>0],['FreeToGame','https://www.freetogame.com/api/games',d=>Array.isArray(d)&&d.length>0],['nekos.best','https://nekos.best/api/v2/hug',d=>typeof d.results?.[0]?.url==='string'],['Minecraft status','https://api.mcsrvstat.us/3/play.cubecraft.net',d=>typeof d.online==='boolean']];
const results=await Promise.all(checks.map(async([service,url,validate])=>{try{const data=await jsonFetch(url);return {service,ok:validate(data),detail:'Read-only JSON/schema check; no bot messages sent'};}catch(e){return {service,ok:false,detail:e.message};}}));
await mkdir('reports',{recursive:true});await writeFile('reports/public-apis.json',JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.ok))process.exitCode=1;
