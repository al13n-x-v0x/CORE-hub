import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class Store {
  constructor(path = './data/core.sqlite') {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS members (guild TEXT, user TEXT, coins INTEGER NOT NULL DEFAULT 0, xp INTEGER NOT NULL DEFAULT 0, daily INTEGER NOT NULL DEFAULT 0, work INTEGER NOT NULL DEFAULT 0, lastxp INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(guild,user));
      CREATE TABLE IF NOT EXISTS warnings (id INTEGER PRIMARY KEY AUTOINCREMENT, guild TEXT, user TEXT, moderator TEXT, reason TEXT, created INTEGER);
      CREATE TABLE IF NOT EXISTS collectibles (guild TEXT NOT NULL, user TEXT NOT NULL, category TEXT NOT NULL, item TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL, PRIMARY KEY(guild,user,category,item));
      CREATE TABLE IF NOT EXISTS collectible_cooldowns (guild TEXT NOT NULL, user TEXT NOT NULL, category TEXT NOT NULL, claimed INTEGER NOT NULL, PRIMARY KEY(guild,user,category));
      CREATE TABLE IF NOT EXISTS collectible_events (id INTEGER PRIMARY KEY AUTOINCREMENT, guild TEXT NOT NULL, user TEXT NOT NULL, category TEXT NOT NULL, item TEXT NOT NULL, claimed INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS collectible_events_guild_time ON collectible_events(guild,claimed);
      CREATE TABLE IF NOT EXISTS collectible_quests (guild TEXT NOT NULL, user TEXT NOT NULL, day INTEGER NOT NULL, streak INTEGER NOT NULL, PRIMARY KEY(guild,user));
      CREATE TABLE IF NOT EXISTS collectible_trades (id TEXT PRIMARY KEY, guild TEXT NOT NULL, sender TEXT NOT NULL, recipient TEXT NOT NULL, offer_category TEXT NOT NULL, offer_item TEXT NOT NULL, want_category TEXT NOT NULL, want_item TEXT NOT NULL, expires INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', message TEXT);
      CREATE TABLE IF NOT EXISTS collectible_hunt_claims (guild TEXT NOT NULL, user TEXT NOT NULL, week INTEGER NOT NULL, PRIMARY KEY(guild,user,week));
      CREATE TABLE IF NOT EXISTS invite_links (guild TEXT NOT NULL, user TEXT NOT NULL, code TEXT NOT NULL, channel TEXT NOT NULL, PRIMARY KEY(guild,user), UNIQUE(guild,code));
      CREATE TABLE IF NOT EXISTS invite_joins (guild TEXT NOT NULL, joined TEXT NOT NULL, inviter TEXT NOT NULL, code TEXT NOT NULL, joined_at INTEGER NOT NULL, coins INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', PRIMARY KEY(guild,joined));
      CREATE INDEX IF NOT EXISTS invite_joins_pending ON invite_joins(status,joined_at);
    `);
  }
  get(key, fallback = null) { const row = this.db.prepare('SELECT value FROM kv WHERE key=?').get(key); return row ? JSON.parse(row.value) : fallback; }
  set(key, value) { this.db.prepare('INSERT INTO kv VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, JSON.stringify(value)); return value; }
  delete(key) { this.db.prepare('DELETE FROM kv WHERE key=?').run(key); }
  list(prefix) { return this.db.prepare('SELECT key,value FROM kv WHERE substr(key,1,?)=?').all(prefix.length,prefix).map(r => ({key:r.key,value:JSON.parse(r.value)})); }
  config(guild) { return this.get(`config:${guild}`, {}); }
  configure(guild, patch) { return this.set(`config:${guild}`, {...this.config(guild), ...patch}); }
  member(guild,user) { this.db.prepare('INSERT OR IGNORE INTO members(guild,user) VALUES (?,?)').run(guild,user); return this.db.prepare('SELECT * FROM members WHERE guild=? AND user=?').get(guild,user); }
  reward(guild,user,kind,now=Date.now()) {
    const rule = {daily:[86400000,250],work:[3600000,50]}[kind];
    if (!rule) throw new Error('Unknown reward.');
    const row = this.member(guild,user);
    if (row[kind] && now-row[kind]<rule[0]) throw new Error(`Try again in ${Math.ceil((rule[0]-(now-row[kind]))/60000)} minutes.`);
    this.db.prepare(`UPDATE members SET coins=coins+?, ${kind}=? WHERE guild=? AND user=?`).run(rule[1],now,guild,user);
    return rule[1];
  }
  transfer(guild,from,to,amount) {
    if (!Number.isSafeInteger(amount)||amount<1||amount>1000000||from===to) throw new Error('Choose another member and 1–1,000,000 coins.');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.member(guild,from); this.member(guild,to);
      const result=this.db.prepare('UPDATE members SET coins=coins-? WHERE guild=? AND user=? AND coins>=?').run(amount,guild,from,amount);
      if (!result.changes) throw new Error('You do not have enough coins.');
      this.db.prepare('UPDATE members SET coins=coins+? WHERE guild=? AND user=?').run(amount,guild,to);
      this.db.exec('COMMIT');
    } catch(e) { this.db.exec('ROLLBACK'); throw e; }
  }
  awardXp(guild,user,now=Date.now()) {
    const row=this.member(guild,user);
    if (now-row.lastxp<60000) return false;
    this.db.prepare('UPDATE members SET xp=xp+15,lastxp=? WHERE guild=? AND user=?').run(now,guild,user);
    return true;
  }
  leaderboard(guild,field='xp') {
    if (!['xp','coins'].includes(field)) throw new Error('Invalid leaderboard.');
    return this.db.prepare(`SELECT user,${field} AS score FROM members WHERE guild=? ORDER BY ${field} DESC LIMIT 10`).all(guild);
  }
  warn(guild,user,moderator,reason) { return this.db.prepare('INSERT INTO warnings(guild,user,moderator,reason,created) VALUES (?,?,?,?,?)').run(guild,user,moderator,reason,Date.now()).lastInsertRowid; }
  warnings(guild,user) { return this.db.prepare('SELECT * FROM warnings WHERE guild=? AND user=? ORDER BY id DESC LIMIT 10').all(guild,user); }
  clearWarnings(guild,user) { return this.db.prepare('DELETE FROM warnings WHERE guild=? AND user=?').run(guild,user).changes; }
  collect(guild,user,category,item,duplicateCoins=0,now=Date.now(),cooldownMs=1800000) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const last=this.db.prepare('SELECT claimed FROM collectible_cooldowns WHERE guild=? AND user=? AND category=?').get(guild,user,category)?.claimed;
      if(last!==undefined&&now-last<cooldownMs)throw new Error(`Try this collection again in ${Math.ceil((cooldownMs-(now-last))/60000)} minutes.`);
      const previous=this.db.prepare('SELECT quantity FROM collectibles WHERE guild=? AND user=? AND category=? AND item=?').get(guild,user,category,item);
      this.db.prepare('INSERT INTO collectible_cooldowns(guild,user,category,claimed) VALUES (?,?,?,?) ON CONFLICT(guild,user,category) DO UPDATE SET claimed=excluded.claimed').run(guild,user,category,now);
      this.db.prepare('INSERT INTO collectibles(guild,user,category,item,quantity,first_seen,last_seen) VALUES (?,?,?,?,1,?,?) ON CONFLICT(guild,user,category,item) DO UPDATE SET quantity=quantity+1,last_seen=excluded.last_seen').run(guild,user,category,item,now,now);
      this.db.prepare('INSERT INTO collectible_events(guild,user,category,item,claimed) VALUES (?,?,?,?,?)').run(guild,user,category,item,now);
      this.db.prepare('DELETE FROM collectible_events WHERE guild=? AND claimed<?').run(guild,now-35*86400000);
      if(previous&&duplicateCoins>0){this.member(guild,user);this.db.prepare('UPDATE members SET coins=coins+? WHERE guild=? AND user=?').run(duplicateCoins,guild,user);}
      this.db.exec('COMMIT');
      return {new:!previous,quantity:(previous?.quantity??0)+1,coins:previous?duplicateCoins:0};
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  collection(guild,user,category=null) {
    return category?this.db.prepare('SELECT * FROM collectibles WHERE guild=? AND user=? AND category=? ORDER BY first_seen,item').all(guild,user,category):this.db.prepare('SELECT * FROM collectibles WHERE guild=? AND user=? ORDER BY category,first_seen,item').all(guild,user);
  }
  collectionLeaders(guild) {
    return this.db.prepare('SELECT user,COUNT(*) AS unique_count,SUM(quantity) AS total FROM collectibles WHERE guild=? GROUP BY user ORDER BY unique_count DESC,total DESC,user LIMIT 10').all(guild);
  }
  collectionWeeklyLeaders(guild,now=Date.now()) {
    return this.db.prepare('SELECT user,COUNT(*) AS pulls,COUNT(DISTINCT category) AS categories FROM collectible_events WHERE guild=? AND claimed>=? GROUP BY user ORDER BY pulls DESC,categories DESC,user LIMIT 10').all(guild,now-7*86400000);
  }
  collectionQuest(guild,user,now=Date.now()) {
    const day=Math.floor(now/86400000),start=day*86400000;
    const pulls=this.db.prepare('SELECT COUNT(*) AS total FROM collectible_events WHERE guild=? AND user=? AND claimed>=?').get(guild,user,start).total;
    const record=this.db.prepare('SELECT day,streak FROM collectible_quests WHERE guild=? AND user=?').get(guild,user);
    return {pulls,target:5,claimed:record?.day===day,streak:record&&record.day>=day-1?record.streak:0,day};
  }
  claimCollectionQuest(guild,user,now=Date.now()) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const progress=this.collectionQuest(guild,user,now);
      if(progress.claimed)throw new Error('Today’s collection quest is already claimed.');
      if(progress.pulls<progress.target)throw new Error(`Collect ${progress.target-progress.pulls} more card${progress.target-progress.pulls===1?'':'s'} today to finish the quest.`);
      const previous=this.db.prepare('SELECT day,streak FROM collectible_quests WHERE guild=? AND user=?').get(guild,user);
      const streak=previous?.day===progress.day-1?previous.streak+1:1;
      const coins=100+20*Math.min(streak,7);
      this.db.prepare('INSERT INTO collectible_quests(guild,user,day,streak) VALUES (?,?,?,?) ON CONFLICT(guild,user) DO UPDATE SET day=excluded.day,streak=excluded.streak').run(guild,user,progress.day,streak);
      this.member(guild,user);
      this.db.prepare('UPDATE members SET coins=coins+? WHERE guild=? AND user=?').run(coins,guild,user);
      this.db.exec('COMMIT');return {coins,streak};
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  giftCollectible(guild,from,to,category,item,now=Date.now()) {
    if(from===to)throw new Error('Choose another member.');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const taken=this.db.prepare('UPDATE collectibles SET quantity=quantity-1,last_seen=? WHERE guild=? AND user=? AND category=? AND item=? AND quantity>=2').run(now,guild,from,category,item);
      if(!taken.changes)throw new Error('You need a spare copy to gift this card.');
      this.db.prepare('INSERT INTO collectibles(guild,user,category,item,quantity,first_seen,last_seen) VALUES (?,?,?,?,1,?,?) ON CONFLICT(guild,user,category,item) DO UPDATE SET quantity=quantity+1,last_seen=excluded.last_seen').run(guild,to,category,item,now,now);
      this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  createCollectionTrade(trade,now=Date.now()) {
    const {id,guild,sender,recipient,offerCategory,offerItem,wantCategory,wantItem}=trade;
    if(sender===recipient)throw new Error('Choose another member.');
    if(offerCategory===wantCategory&&offerItem===wantItem)throw new Error('Choose two different cards.');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM collectible_trades WHERE expires<?').run(now-30*86400000);
      const qty=this.db.prepare('SELECT quantity FROM collectibles WHERE guild=? AND user=? AND category=? AND item=?');
      if(!qty.get(guild,sender,offerCategory,offerItem)?.quantity)throw new Error('You do not own the offered card.');
      if(!qty.get(guild,recipient,wantCategory,wantItem)?.quantity)throw new Error('That member does not own the requested card.');
      this.db.prepare('INSERT INTO collectible_trades(id,guild,sender,recipient,offer_category,offer_item,want_category,want_item,expires) VALUES (?,?,?,?,?,?,?,?,?)').run(id,guild,sender,recipient,offerCategory,offerItem,wantCategory,wantItem,now+10*60000);
      this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  collectionTrade(id,guild){return this.db.prepare('SELECT * FROM collectible_trades WHERE id=? AND guild=?').get(id,guild);}
  bindCollectionTrade(id,guild,message){this.db.prepare('UPDATE collectible_trades SET message=? WHERE id=? AND guild=? AND status=?').run(message,id,guild,'pending');}
  expireCollectionTrade(id,guild,message,now=Date.now()){
    return !!this.db.prepare('UPDATE collectible_trades SET status=? WHERE id=? AND guild=? AND message=? AND status=? AND expires<=?').run('expired',id,guild,message,'pending',now).changes;
  }
  decideCollectionTrade(id,guild,actor,action,message,now=Date.now()) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const trade=this.collectionTrade(id,guild);
      if(!trade||trade.status!=='pending'||trade.message!==message)throw new Error('This trade is no longer available.');
      if(trade.expires<=now)throw new Error('This trade expired.');
      if(action==='accept'&&actor!==trade.recipient)throw new Error('Only the invited member can accept this trade.');
      if(action==='decline'&&actor!==trade.recipient&&actor!==trade.sender)throw new Error('Only the two traders can close this trade.');
      if(!['accept','decline'].includes(action))throw new Error('Invalid trade action.');
      if(action==='accept'){
        const take=this.db.prepare('UPDATE collectibles SET quantity=quantity-1,last_seen=? WHERE guild=? AND user=? AND category=? AND item=? AND quantity>=1');
        if(!take.run(now,guild,trade.sender,trade.offer_category,trade.offer_item).changes)throw new Error('The offered card is no longer owned.');
        if(!take.run(now,guild,trade.recipient,trade.want_category,trade.want_item).changes)throw new Error('The requested card is no longer owned.');
        this.db.prepare('DELETE FROM collectibles WHERE guild=? AND quantity=0').run(guild);
        const give=this.db.prepare('INSERT INTO collectibles(guild,user,category,item,quantity,first_seen,last_seen) VALUES (?,?,?,?,1,?,?) ON CONFLICT(guild,user,category,item) DO UPDATE SET quantity=quantity+1,last_seen=excluded.last_seen');
        give.run(guild,trade.recipient,trade.offer_category,trade.offer_item,now,now);
        give.run(guild,trade.sender,trade.want_category,trade.want_item,now,now);
      }
      this.db.prepare('UPDATE collectible_trades SET status=? WHERE id=?').run(action==='accept'?'accepted':'declined',id);
      this.db.exec('COMMIT');return {...trade,status:action==='accept'?'accepted':'declined'};
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  collectionHunt(guild,user,now=Date.now()) {
    const day=Math.floor(now/86400000),week=(day-((day+3)%7))*86400000;
    const row=this.db.prepare('SELECT COUNT(*) AS pulls,COUNT(DISTINCT user) AS members FROM collectible_events WHERE guild=? AND claimed>=? AND claimed<?').get(guild,week,week+7*86400000);
    const mine=this.db.prepare('SELECT COUNT(*) AS pulls FROM collectible_events WHERE guild=? AND user=? AND claimed>=? AND claimed<?').get(guild,user,week,week+7*86400000).pulls;
    const claimed=!!this.db.prepare('SELECT 1 FROM collectible_hunt_claims WHERE guild=? AND user=? AND week=?').get(guild,user,week);
    return {week,pulls:row.pulls,members:row.members,mine,target:20,minMembers:2,minMine:2,coins:250,claimed};
  }
  claimCollectionHunt(guild,user,now=Date.now()) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const hunt=this.collectionHunt(guild,user,now);
      if(hunt.claimed)throw new Error('You already claimed this week’s hunt reward.');
      if(hunt.pulls<hunt.target||hunt.members<hunt.minMembers||hunt.mine<hunt.minMine)throw new Error('The hunt needs 20 server pulls from at least two members, including two of yours.');
      this.db.prepare('INSERT INTO collectible_hunt_claims(guild,user,week) VALUES (?,?,?)').run(guild,user,hunt.week);
      this.member(guild,user);
      this.db.prepare('UPDATE members SET coins=coins+? WHERE guild=? AND user=?').run(hunt.coins,guild,user);
      this.db.exec('COMMIT');return hunt;
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  inviteLink(guild,user){return this.db.prepare('SELECT * FROM invite_links WHERE guild=? AND user=?').get(guild,user);}
  inviteLinks(guild){return this.db.prepare('SELECT * FROM invite_links WHERE guild=?').all(guild);}
  setInviteLink(guild,user,code,channel){this.db.prepare('INSERT INTO invite_links(guild,user,code,channel) VALUES (?,?,?,?) ON CONFLICT(guild,user) DO UPDATE SET code=excluded.code,channel=excluded.channel').run(guild,user,code,channel);}
  recordInviteJoin(guild,joined,inviter,code,coins,now=Date.now()){
    if(joined===inviter)return false;
    return !!this.db.prepare('INSERT OR IGNORE INTO invite_joins(guild,joined,inviter,code,joined_at,coins) VALUES (?,?,?,?,?,?)').run(guild,joined,inviter,code,now,coins).changes;
  }
  forfeitInviteJoin(guild,joined){this.db.prepare('UPDATE invite_joins SET status=? WHERE guild=? AND joined=? AND status=?').run('left',guild,joined,'pending');}
  pendingInviteJoins(now=Date.now()) {return this.db.prepare('SELECT * FROM invite_joins WHERE status=? AND joined_at<=? LIMIT 100').all('pending',now-86400000);}
  settleInviteJoin(guild,joined,present) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row=this.db.prepare('SELECT * FROM invite_joins WHERE guild=? AND joined=? AND status=?').get(guild,joined,'pending');
      if(!row){this.db.exec('COMMIT');return false;}
      this.db.prepare('UPDATE invite_joins SET status=? WHERE guild=? AND joined=?').run(present?'rewarded':'left',guild,joined);
      if(present){this.member(guild,row.inviter);this.db.prepare('UPDATE members SET coins=coins+? WHERE guild=? AND user=?').run(row.coins,guild,row.inviter);}
      this.db.exec('COMMIT');return true;
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  inviteStats(guild,user){return this.db.prepare('SELECT COUNT(*) AS joined,COALESCE(SUM(CASE WHEN status=? THEN 1 ELSE 0 END),0) AS rewarded,COALESCE(SUM(CASE WHEN status=? THEN 1 ELSE 0 END),0) AS pending FROM invite_joins WHERE guild=? AND inviter=?').get('rewarded','pending',guild,user);}
  inviteLeaders(guild){return this.db.prepare('SELECT inviter AS user,COUNT(*) AS rewarded FROM invite_joins WHERE guild=? AND status=? GROUP BY inviter ORDER BY rewarded DESC,user LIMIT 10').all(guild,'rewarded');}
  close() { this.db.close(); }
}
