#!/usr/bin/env node
const assert=require('node:assert/strict');
const bh=require('../tools/bh');
const game=bh.load({seed:19});
const v=k=>game.get('VILLAINS['+JSON.stringify(k)+']');
const j=x=>JSON.parse(JSON.stringify(x));
const B=Object.keys(j(game.get('VILLAINS'))).filter(k=>k!=='mole');
const beforeMax=18;
const tough=B.map(k=>v(k).tough);
assert.equal(v('quarry').tough,17,'Quarry toughness reduced from 18');
assert.equal(v('grid').tough,17,'Gridlock toughness reduced from 18');
assert.equal(v('grid').eva,9,'Gridlock evasion increased from 8');
assert.equal(Math.max(...tough),17,'No bosses should retain old max toughness 18');
assert.equal(v('cantor').eva,13);
assert.equal(v('gallows').eva,10);
assert.equal(v('cantor').hench.rng,2);
assert.equal(v('gallows').hench.rng,2);
const startSum=k=>{
 const b=v(k);return [...b.base,...b.adv.slice(0,3+(b.deckBonus||0))].reduce((n,id)=>n+(b.cards[id].t==='summon'?b.cards[id].k:0),0);
};
assert.equal(startSum('gallows'),4,'Gallows opening deck summon count');
assert.equal(startSum('cantor'),6,'Cantor opening deck summon count');
assert.equal(v('bomber').elite.name,'The Bombardier');
assert.equal(v('bomber').elite.rng,3);
assert.equal(v('bomber').elite.bombardier,1);

(async()=>{
 game.run("newCampaign(); S.tut=null;S.tutDone=true;S.guide=null;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('bomber',3)];S.pool=[];S.inv={v:'bomber',clues:3};startShowdown();S.sd.intro=false");
 assert.equal(game.get("S.sd.hench.filter(m=>m.elite&&m.owner==='bomber').length"),1,'Elite appears in level 3+ showdowns');
 game.run("S.sd.round=2;S.sd.bombs=[];{const hm=S.sd.hench.find(m=>m.elite),u=S.sd.units[0];hm.x=u.x;hm.y=u.y-1;}");
 const countBefore=game.get('S.sd.bombs.length');
 await game.run("henchAct(S.sd.hench.find(m=>m.elite))");
 assert.equal(game.get('S.sd.bombs.length'),countBefore+1,'Bombardier tosses a bomb during even-numbered turns');
 assert.equal(game.get('S.sd.bombs[0].fuse'),1,'Bombardier bomb is telegraphed for one turn');
 assert(game.get("S.sd.log.some(x=>JSON.stringify(x).includes('lobs a short-fuse bomb'))"),'Bomb throw should be described in combat log');
 game.run('S.sd.round=3;S.sd.bombs=[];');
 await game.run("henchAct(S.sd.hench.find(m=>m.elite))");
 assert.equal(game.get('S.sd.bombs.length'),0,'Bombardier does not toss a bomb on odd turns');
 game.run("S.villains=[makeVillain('bomber',2)];S.inv={v:'bomber',clues:3};startShowdown();S.sd.intro=false");
 assert.equal(game.get("S.sd.hench.filter(m=>m.elite&&m.owner==='bomber').length"),0,'Elite is absent below level 3');
 console.log('PASS: all requested boss stats, opening summon totals, ranged minions, Bombardier spawn/shot/fuse-toss behaviors.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
