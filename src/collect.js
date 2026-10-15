import { randomInt, randomUUID } from 'node:crypto';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { command as c, str, user } from './registry.js';
import { embed } from './ui.js';
import { animatedCardPayload, cardPayload } from './cards.js';
import { collectibleCardSvg, collectibleFrames } from './collect-art.js';

const item=(id,name,rarity,color,light,tagline,variant)=>({id,name,rarity,color,light,tagline,variant});
export const catalog={
  cat:[
    item('miso','Miso','common','#d6a371','#fff0ca','Sleeps through every raid.',0),
    item('mochi','Mochi','common','#f3d9c4','#fff8ec','Soft paws. Loud opinions.',1),
    item('pixel','Pixel','common','#667b89','#d5e6e9','Chases the cursor at 3 AM.',2),
    item('bean','Bean','common','#ac836e','#ffe0b8','The smallest boss in the room.',3),
    item('luna','Luna','rare','#4d5a82','#d5d9ff','Only appears under moonlight.',4),
    item('neon','Neon','rare','#316877','#b6fff0','Glows after a perfect combo.',5),
    item('aurora','Aurora','epic','#815ca5','#f5ceff','Carries the northern lights.',6),
    item('cosmos','Cosmos','legendary','#314264','#ffe1a3','A galaxy purrs in its chest.',7)
  ],
  anime:[
    item('ren','Ren','common','#273e61','#bbd5f6','The calm strategist.',0),
    item('mei','Mei','common','#7b4c68','#f7d6e8','Always first to help.',1),
    item('sora','Sora','common','#3d7893','#c1f0f3','Never misses the sunrise.',2),
    item('aya','Aya','common','#704b46','#f8d2ab','Builds worlds after school.',3),
    item('hikari','Hikari','rare','#b59a55','#fff0b6','A spark before the storm.',4),
    item('kaito','Kaito','rare','#3b527d','#c7dcff','Maps every hidden route.',5),
    item('nova','Nova','epic','#8053a5','#f0caff','Turns starlight into code.',6),
    item('solstice','Solstice','legendary','#ad6959','#ffe6b4','Guardian of the last horizon.',7)
  ],
  fox:[
    item('ember','Ember','common','#d77944','#ffebca','A spark with four paws.',0),
    item('rust','Rust','common','#a85e42','#f2dbbf','Collects shiny old keys.',1),
    item('fern','Fern','common','#69866a','#e4f0ce','Disappears into the trees.',2),
    item('ash','Ash','common','#68747b','#e5e7e3','Quiet until the chase begins.',3),
    item('frost','Frost','rare','#99b8cb','#f3fbff','Leaves silver tracks.',4),
    item('dusk','Dusk','rare','#705785','#ecdbff','Moves between the shadows.',5),
    item('flare','Flare','epic','#d75453','#ffe0aa','Runs faster than fire.',6),
    item('eclipse','Eclipse','legendary','#343f66','#ffe4a9','The night follows its tail.',7)
  ],
  relic:[
    item('shard','Signal Shard','common','#3a8b9d','#bbf9f5','A fragment of a lost signal.',0),
    item('key','Copper Key','common','#a36a47','#ffe0ac','Opens a door somewhere.',1),
    item('prism','Blue Prism','common','#4c78b8','#cedeff','Bends the lobby light.',2),
    item('rune','Stone Rune','common','#77736b','#e9e3ce','Its glyph shifts at night.',3),
    item('compass','Void Compass','rare','#5a698d','#d8dfff','Points toward a new path.',4),
    item('core','Core Fragment','rare','#448c7b','#d4fff0','Still warm to the touch.',5),
    item('crown','Circuit Crown','epic','#8166b6','#f1d6ff','A prize for the persistent.',6),
    item('star','First Star','legendary','#c19451','#fff1b8','The collection began here.',7)
  ]
};
export const categories=Object.keys(catalog);
export const rarityOdds={common:60,rare:28,epic:10,legendary:2};
const duplicateCoins={common:5,rare:15,epic:40,legendary:100};
const choice=(name,required=true)=>str(name,'Cat, anime, fox, or relic',required,{choices:categories});

export function drawItem(category,rng=randomInt) {
  const items=catalog[category];if(!items)throw new Error('Unknown collection.');
  const roll=rng(100),rarity=roll<60?'common':roll<88?'rare':roll<98?'epic':'legendary';
  const candidates=items.filter(x=>x.rarity===rarity);
  return candidates[rng(candidates.length)];
}

async function sendAnimated(ctx,category,found,quantity,content) {
  const details={category,item:found,owner:ctx.member.displayName,quantity};
  const name=`core-${category}-${found.id}.gif`;
  let media;
  try{media=await animatedCardPayload(collectibleFrames(details),name,`${found.rarity} ${category}: ${found.name}`);}
  catch(error){
    console.error('Collectible GIF:',error.code??error.name);
    try{media=await cardPayload(collectibleCardSvg(details),name.replace(/\.gif$/,'.png'));content+='\nAnimated card unavailable; here is the still card.';}
    catch(fallbackError){console.error('Collectible card:',fallbackError.code??fallbackError.name);media={};content+='\nCard image is temporarily unavailable; the find is saved in your album.';}
  }
  await ctx.reply({content,...media});
}

async function claim(ctx,category) {
  const found=drawItem(category),result=ctx.store.collect(ctx.guild.id,ctx.user.id,category,found.id,duplicateCoins[found.rarity]);
  const line=result.new?'New find!':`Copy #${result.quantity} · +${result.coins} coins`;
  await sendAnimated(ctx,category,found,result.quantity,`**${found.name}** · ${found.rarity.toUpperCase()} ${category}\n${line}`);
}

for(const category of categories)c('collect',category,`Find an original ${category} collectible`,[],ctx=>claim(ctx,category),{aliases:[`collect${category}`],botPermissions:['AttachFiles']});

c('collect','album','Browse collected cards',[choice('category',false),user('user',false)],async ctx=>{
  const id=ctx.args.user??ctx.user.id,rows=ctx.store.collection(ctx.guild.id,id,ctx.args.category??null);
  const owner=id===ctx.user.id?ctx.member.displayName:(await ctx.guild.members.fetch(id).catch(()=>null))?.displayName??'Member';
  if(ctx.args.category){
    const series=catalog[ctx.args.category];
    const lines=series.map(x=>{const owned=rows.find(r=>r.item===x.id);return owned?`**${x.name}** · ${x.rarity} · x${owned.quantity} · ID: \`${x.id}\``:'◌ Undiscovered';});
    await ctx.reply({embeds:[embed(`${owner}'s ${ctx.args.category} album`,`${rows.length}/${series.length} found\n\n${lines.join('\n')}`)]});return;
  }
  const lines=categories.map(category=>`${category.toUpperCase()}: **${rows.filter(r=>r.category===category).length}/${catalog[category].length}**`);
  await ctx.reply({embeds:[embed(`${owner}'s collection`,`${rows.length}/${categories.reduce((n,c)=>n+catalog[c].length,0)} unique cards\n\n${lines.join('\n')}\n\nUse /collect album with a category to see its cards.`)]});
},{aliases:['album']});

c('collect','show','Replay an owned collectible GIF',[choice('category'),str('item','Item ID from your album',true,{max:24})],async ctx=>{
  const category=ctx.args.category,id=ctx.args.item.toLowerCase(),found=catalog[category].find(x=>x.id===id);
  if(!found)throw new Error('Unknown item ID. Open /collect album to find it.');
  const owned=ctx.store.collection(ctx.guild.id,ctx.user.id,category).find(r=>r.item===id);
  if(!owned)throw new Error('You have not found this card yet.');
  await sendAnimated(ctx,category,found,owned.quantity,`**${found.name}** · ${found.rarity.toUpperCase()} ${category} · x${owned.quantity}`);
},{aliases:['collectshow'],botPermissions:['AttachFiles']});

c('collect','leaderboard','Rank collectors in this server',[],async ctx=>{
  const rows=ctx.store.collectionLeaders(ctx.guild.id);
  await ctx.reply({embeds:[embed('Collector leaderboard',rows.map((r,i)=>`${i+1}. <@${r.user}> — **${r.unique_count}** unique · ${r.total} pulls`).join('\n')||'No cards found yet. Start with /collect cat.') ]});
},{aliases:['collecttop']});

c('collect','odds','See pull odds and cooldowns',[],async ctx=>ctx.reply({embeds:[embed('Collection odds',`Each category has 8 original cards. One pull per category every 30 minutes.\n\n${Object.entries(rarityOdds).map(([rarity,odds])=>`${rarity.toUpperCase()}: **${odds}%**`).join('\n')}\n\nDuplicates stay in your album and earn 5 / 15 / 40 / 100 coins by rarity. Collections are saved per server.`)]}),{aliases:['collectodds']});

c('collect','quest','Complete the daily five-pull quest',[],async ctx=>{
  const progress=ctx.store.collectionQuest(ctx.guild.id,ctx.user.id);
  if(progress.pulls>=progress.target&&!progress.claimed){
    const reward=ctx.store.claimCollectionQuest(ctx.guild.id,ctx.user.id);
    await ctx.reply({embeds:[embed('Daily collection quest',`Completed **${progress.target}/${progress.target}** pulls!\n+${reward.coins} coins earned · **${reward.streak}-day streak**.\n\nCome back after the next UTC reset to keep the streak going.`)]});return;
  }
  await ctx.reply({embeds:[embed('Daily collection quest',`${Math.min(progress.pulls,progress.target)}/${progress.target} pulls today · ${progress.claimed?'Reward claimed':'Pull cards in any category to earn coins.'}\nCurrent streak: **${progress.streak}** day${progress.streak===1?'':'s'}\n\nThe quest resets at 00:00 UTC. Each category can be pulled once every 30 minutes.`)]});
},{aliases:['collectquest']});

c('collect','weekly','See the most active collectors this week',[],async ctx=>{
  const rows=ctx.store.collectionWeeklyLeaders(ctx.guild.id);
  await ctx.reply({embeds:[embed('Collectors · last 7 days',rows.map((r,i)=>`${i+1}. <@${r.user}> — **${r.pulls}** pulls · ${r.categories} series`).join('\n')||'No pulls yet this week. Start with /collect cat.') ]});
},{aliases:['collectweekly']});

c('collect','gift','Give a spare card to a server member',[user(),choice('category'),str('item','Item ID from your album',true,{max:24})],async ctx=>{
  const recipient=await ctx.guild.members.fetch(ctx.args.user);
  if(recipient.user.bot)throw new Error('Choose a human member.');
  const id=ctx.args.item.toLowerCase(),category=ctx.args.category,found=catalog[category].find(x=>x.id===id);
  if(!found)throw new Error('Unknown item ID. Open /collect album to find it.');
  ctx.store.giftCollectible(ctx.guild.id,ctx.user.id,recipient.id,category,id);
  await ctx.reply(`**${ctx.member.displayName}** gifted **${found.name}** (${found.rarity} ${category}) to <@${recipient.id}>. A spare copy left your album.`);
},{aliases:['collectgift'],cooldown:30000});

const card=(category,id)=>catalog[category]?.find(x=>x.id===id.toLowerCase());
c('collect','trade','Offer a card swap that the other member must accept',[user(),choice('offer_category'),str('offer_item','Your card ID',true,{max:24}),choice('want_category'),str('want_item','Their card ID',true,{max:24})],async ctx=>{
  const recipient=await ctx.guild.members.fetch(ctx.args.user).catch(()=>null);
  if(!recipient||recipient.user.bot||recipient.id===ctx.user.id)throw new Error('Choose another human member in this server.');
  const offer=card(ctx.args.offer_category,ctx.args.offer_item),want=card(ctx.args.want_category,ctx.args.want_item);
  if(!offer||!want)throw new Error('Unknown card ID. Check /collect album for both members.');
  const id=randomUUID();
  ctx.store.createCollectionTrade({id,guild:ctx.guild.id,sender:ctx.user.id,recipient:recipient.id,offerCategory:ctx.args.offer_category,offerItem:offer.id,wantCategory:ctx.args.want_category,wantItem:want.id});
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`collecttrade:accept:${id}`).setLabel('Accept trade').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`collecttrade:decline:${id}`).setLabel('Decline').setStyle(ButtonStyle.Secondary));
  const panel=embed('Card trade',`<@${ctx.user.id}> offers **${offer.name}** (${ctx.args.offer_category}) to <@${recipient.id}> for **${want.name}** (${ctx.args.want_category}).\n\nOnly the invited member can accept. Either trader can decline. Expires in 10 minutes; both cards are checked again before the swap.`);
  const files=[];
  for(const [category,item,owner,name] of [[ctx.args.offer_category,offer,ctx.member.displayName,'core-trade-offer.gif'],[ctx.args.want_category,want,recipient.displayName,'core-trade-request.gif']]){
    try{files.push(...(await animatedCardPayload(collectibleFrames({category,item,owner,quantity:1}),name,`${item.name} trade card`)).files);}
    catch(error){console.error('Trade GIF:',error.code??error.name);}
  }
  if(files.some(x=>x.name==='core-trade-offer.gif'))panel.setImage('attachment://core-trade-offer.gif');
  const message=await ctx.reply({embeds:[panel],components:[row],...(files.length?{files}:{})});
  ctx.store.bindCollectionTrade(id,ctx.guild.id,message.id);
},{aliases:['collecttrade'],private:false,cooldown:5000});

c('collect','hunt','Join this server’s cooperative weekly hunt',[],async ctx=>{
  let hunt=ctx.store.collectionHunt(ctx.guild.id,ctx.user.id),reward='';
  if(!hunt.claimed&&hunt.pulls>=hunt.target&&hunt.members>=hunt.minMembers&&hunt.mine>=hunt.minMine){
    const won=ctx.store.claimCollectionHunt(ctx.guild.id,ctx.user.id);reward=`\n\n**+${won.coins} coins claimed!**`;hunt=ctx.store.collectionHunt(ctx.guild.id,ctx.user.id);
  }
  const reset=Math.floor((hunt.week+7*86400000)/1000);
  await ctx.reply({embeds:[embed('Weekly server hunt',`**${Math.min(hunt.pulls,hunt.target)}/${hunt.target}** shared pulls · **${hunt.members}/${hunt.minMembers}** collectors\nYour contribution: **${hunt.mine}/${hunt.minMine}** pulls\n\nEveryone who makes at least two pulls can claim **${hunt.coins} coins** once the server reaches the goal. ${hunt.claimed?'Your reward is claimed.':'Pull a card and return here to claim.'}${reward}\nResets <t:${reset}:R> (Monday 00:00 UTC).`)]});
},{aliases:['collecthunt']});

export async function collectComponent(ctx,interaction){
  if(!interaction.customId.startsWith('collecttrade:'))return false;
  const [,action,id]=interaction.customId.split(':');
  if(ctx.store.expireCollectionTrade(id,ctx.guild.id,interaction.message.id)){
    await interaction.message.edit({components:[],embeds:[embed('Card trade','This offer expired after 10 minutes. No cards changed hands.')],allowedMentions:{parse:[]}}).catch(()=>{});
    await ctx.reply('This trade expired.');return true;
  }
  const trade=ctx.store.decideCollectionTrade(id,ctx.guild.id,ctx.user.id,action,interaction.message.id);
  await interaction.message.edit({components:[],embeds:[embed('Card trade',trade.status==='accepted'?`Accepted by <@${ctx.user.id}>. <@${trade.sender}> and <@${trade.recipient}> exchanged their cards.`:`Declined by <@${ctx.user.id}>. No cards changed hands.`)],allowedMentions:{parse:[]}}).catch(()=>{});
  await ctx.reply(trade.status==='accepted'?'Trade accepted. Both albums are updated.':'Trade declined.');
  return true;
}
