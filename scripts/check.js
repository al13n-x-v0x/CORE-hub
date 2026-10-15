import '../src/commands.js';
import { commands,slashData } from '../src/registry.js';
import assert from 'node:assert/strict';
const data=slashData(),keys=new Set(),aliases=new Set();
for(const c of commands){const key=`${c.group}.${c.name}`;assert(!keys.has(key),`Duplicate ${key}`);keys.add(key);for(const a of c.aliases??[]){assert(!aliases.has(a),`Duplicate alias ${a}`);aliases.add(a);}assert.equal(typeof c.execute,'function');}
for(const g of data){assert(g.options.length<=25,`${g.name} exceeds subcommand limit`);}
console.log(`${commands.length} subcommands in ${data.length} groups; ${aliases.size} unique prefix shortcuts. Slash payloads validated.`);
