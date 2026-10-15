import '../src/commands.js';
import {commands} from '../src/registry.js';
import {writeFile} from 'node:fs/promises';
const groups=[...new Set(commands.map(c=>c.group))];
let text='# Command reference\n\nGenerated from the actual registry. Use `/core help` in Discord. Prefix examples use `>`; mentions and configured extra prefixes work too. Quote multiword arguments when another argument follows.\n\n';
for(const group of groups){text+=`## /${group}\n\n`;for(const c of commands){if(c.group!==group)continue;text+=`- **${c.prefixOnly?'>':'/'}${group} ${c.name}** ${c.options.map(o=>o.required?`<${o.name}>`:`[${o.name}]`).join(' ')} — ${c.description}. ${c.permission?`Requires ${c.permission}. `:''}${c.aliases?.length?`Shortcuts: ${c.aliases.map(a=>'`>'+a+'`').join(', ')}. `:''}\n`;for(const o of c.options)if(o.choices)text+=`  - ${o.name}: ${o.choices.join(', ')}.\n`;}text+='\n';}
text+='\nOwner and hosting controls have additional checks inside their handlers. Prefix shortcuts use exactly the same command handlers and permissions as slash commands.\n';
await writeFile('COMMANDS.md',text);console.log(`Documented ${commands.length} subcommands.`);
