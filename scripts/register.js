import '../src/commands.js';
import { slashData } from '../src/registry.js';
import { REST, Routes } from 'discord.js';
const {DISCORD_TOKEN,CLIENT_ID,GUILD_ID}=process.env;
if(!DISCORD_TOKEN||!/^\d{17,20}$/.test(CLIENT_ID??''))throw new Error('Set DISCORD_TOKEN and CLIENT_ID in .env.');
if(GUILD_ID&&!/^\d{17,20}$/.test(GUILD_ID))throw new Error('GUILD_ID must be a Discord server ID.');
const data=slashData();
try{await new REST({version:'10'}).setToken(DISCORD_TOKEN).put(GUILD_ID?Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID):Routes.applicationCommands(CLIENT_ID),{body:data});console.log(`Registered ${data.length} command groups ${GUILD_ID?'in the test server':'globally'}. This replaces commands for this application in that scope.`);}catch(e){console.error(`Registration failed (${e.code??e.status??'network error'}). Check credentials and application ID.`);process.exitCode=1;}
