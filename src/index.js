import './commands.js';
import { start } from './runtime.js';
start().catch(error=>{console.error(error.message);process.exitCode=1;});
