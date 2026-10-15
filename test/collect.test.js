import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.js';
import { catalog, categories, drawItem, rarityOdds } from '../src/collect.js';
import { collectibleCardSvg, collectibleFrames } from '../src/collect-art.js';

test('all collection series have distinct original cards and rarity pools',()=>{
  const ids=new Set(),art=new Set();
  assert.equal(Object.values(rarityOdds).reduce((a,b)=>a+b,0),100);
  for(const category of categories){
    assert.equal(catalog[category].length,8);
    for(const item of catalog[category]){
      assert(!ids.has(`${category}:${item.id}`));ids.add(`${category}:${item.id}`);
      const svg=collectibleCardSvg({category,item,owner:'Player'});
      assert(!art.has(svg));art.add(svg);
      assert.match(svg,/<svg/);
      assert.equal(collectibleFrames({category,item}).length,16);
    }
  }
  assert.equal(drawItem('cat',()=>0).rarity,'common');
  const rolls=[99,0];assert.equal(drawItem('anime',()=>rolls.shift()).rarity,'legendary');
});

test('pulls, duplicate coins, gifts, and leaderboards stay server scoped',()=>{
  const store=new Store(':memory:'),start=100*86400000;
  try{
    assert.equal(store.collect('g','alice','cat','miso',5,start).new,true);
    assert.throws(()=>store.collect('g','alice','cat','miso',5,start+1000),/again/);
    assert.equal(store.collect('g','alice','cat','miso',5,start+1800000).quantity,2);
    assert.equal(store.member('g','alice').coins,5);
    store.giftCollectible('g','alice','bob','cat','miso',start+1800001);
    assert.equal(store.collection('g','alice','cat')[0].quantity,1);
    assert.equal(store.collection('g','bob','cat')[0].quantity,1);
    assert.throws(()=>store.giftCollectible('g','alice','bob','cat','miso'),/spare/);
    assert.equal(store.collection('other','alice').length,0);
    assert.equal(store.collectionLeaders('g').length,2);
    assert.equal(store.collectionWeeklyLeaders('g',start+1800000)[0].pulls,2);
    assert.equal(store.collectionWeeklyLeaders('g',start+9*86400000).length,0);
  }finally{store.close();}
});

test('daily collection quest requires five pulls and awards once per UTC day',()=>{
  const store=new Store(':memory:'),day=200*86400000;
  try{
    for(const category of categories)store.collect('g','alice',category,catalog[category][0].id,5,day+1000);
    assert.equal(store.collectionQuest('g','alice',day+2000).pulls,4);
    assert.throws(()=>store.claimCollectionQuest('g','alice',day+2000),/1 more/);
    store.collect('g','alice','cat','miso',5,day+1801000);
    assert.deepEqual(store.claimCollectionQuest('g','alice',day+1802000),{coins:120,streak:1});
    assert.throws(()=>store.claimCollectionQuest('g','alice',day+1803000),/already/);
    assert.equal(store.member('g','alice').coins,125);
    for(const category of categories)store.collect('g','alice',category,catalog[category][1].id,5,day+86400000+1000);
    store.collect('g','alice','cat','miso',5,day+86400000+1801000);
    assert.deepEqual(store.claimCollectionQuest('g','alice',day+86400000+1802000),{coins:140,streak:2});
    assert.equal(store.collectionQuest('g','alice',day+4*86400000).streak,0);
  }finally{store.close();}
});
