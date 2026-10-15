import { command as c,str } from './registry.js';
import { jsonFetch,publicLink } from './net.js';
import { embed } from './ui.js';
const categories=['hug','slap','pat','wave','dance','happy','cry','laugh','smile','thumbsup'];
c('media','gif','Get a reaction GIF',[str('category','Reaction category',true,{choices:categories})],async ctx=>{
  const data=await jsonFetch(`https://nekos.best/api/v2/${ctx.args.category}`);const item=data.results?.[0],url=publicLink(item?.url,['nekos.best']);
  if(!url)throw new Error('The GIF provider returned no usable image.');
  await ctx.reply({embeds:[embed(ctx.args.category,`[Source: nekos.best](https://nekos.best/)${item.anime_name?` · ${String(item.anime_name).slice(0,150)}`:''}`).setImage(url)]});
},{aliases:['gif','gifs'],cooldown:10000});
