#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),bh=require('../tools/bh');
const g=bh.load({seed:501,env:{ABIL:'1'}});
g.run(fs.readFileSync('tools/bot.js','utf8'),'tools/bot.js');
const run=x=>g.run(x),val=x=>JSON.parse(JSON.stringify(g.get(x)));
async function main(){
 run("newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('bomber',6)];S.pool=[];S.inv={v:'bomber',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.civs=[];S.sd.bombs=[];S.sd.hench=[];S.sd.v.x=4;S.sd.v.y=3;S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8})");
 const cards=val('VILLAINS.bomber.cards');
 assert.equal(cards.lit.fuse,1);assert.equal(cards.twin.fuse,1);
 for(const [id,lv,expected] of [['lit',6,1],['over',6,1],['dms',6,1],['twin',3,1],['twin',4,2],['cluster',4,1],['cluster',5,2],['carpet',5,1],['carpet',6,2]]){
   const a=g.get('buildCard("bomber",{id:'+JSON.stringify(id)+',mk:0},'+lv+').radius');
   assert.equal(a,expected,id+' at level '+lv);
 }
 assert.equal(g.get("buildCard('bomber',{id:'dms',mk:0},6).t"),'swapbomb');
 assert.match(g.get("buildCard('bomber',{id:'twin',mk:0},4).txt"),/19 hexes/);
 assert(run('dropBomb(4,4,5,2,1)'));assert.equal(g.get('S.sd.bombs[0].fuse'),1);
 assert.equal(g.get('hexesWithin(bombP(S.sd.bombs[0]),bombRadius(S.sd.bombs[0])).length'),7);
 run('S.sd.bombs[0].fuse=2');await run('bombTick()');assert.equal(g.get('S.sd.bombs.length'),0);
 run("S.sd.units[0].x=3;S.sd.units[0].y=4;S.sd.hench=[{id:'sap',owner:'bomber',x:4,y:4,hp:8},{id:'el',owner:'bomber',x:5,y:4,hp:9,elite:1},{id:'enemy',owner:'gallows',x:4,y:5,hp:8}]");
 const hp=g.get('heroOf(S.sd.units[0]).hp');
 run('dropBomb(4,4,1,2,1)');await run('bombTick()');
 assert.equal(g.get("S.sd.hench.find(m=>m.id==='sap').hp"),8);
 assert.equal(g.get("S.sd.hench.find(m=>m.id==='el').hp"),9);
 assert(g.get("S.sd.hench.find(m=>m.id==='enemy').hp")<8);
 assert(g.get('heroOf(S.sd.units[0]).hp')<hp);
 run("S.sd.bombs=[];S.sd.hench=[{id:'sap',owner:'bomber',x:5,y:4,hp:8}];S.sd.units[0].x=6;S.sd.units[0].y=4;S.sd.units[1].x=7;S.sd.units[1].y=4;S.heroes.forEach(h=>h.hp=stat(h,'maxHp'));S.sd.units.forEach(u=>u.ko=false)");
 const h0=g.get('heroOf(S.sd.units[0]).hp'),h1=g.get('heroOf(S.sd.units[1]).hp');
 run('dropBomb(4,4,1,2,2)');
 assert.equal(g.get('hexesWithin(bombP(S.sd.bombs[0]),bombRadius(S.sd.bombs[0])).length'),19);
 assert(g.get("danger('6,4')")>0);assert.equal(g.get("danger('7,4')"),0);
 await run('bombTick()');
 assert(g.get('heroOf(S.sd.units[0]).hp')<h0);
 assert.equal(g.get('heroOf(S.sd.units[1]).hp'),h1);
 assert.equal(g.get('S.sd.hench[0].hp'),8);
 run("S.sd.v.x=4;S.sd.v.y=3;S.sd.hench=[{id:'sap',owner:'bomber',x:5,y:3,hp:8}];S.sd.bombs=[];S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8})");
 await run("execCard(buildCard('bomber',{id:'dms',mk:0},6))");
 assert.deepEqual(val('({v:[S.sd.v.x,S.sd.v.y],m:[S.sd.hench[0].x,S.sd.hench[0].y]})'),{v:[5,3],m:[4,3]});
 assert.equal(g.get('S.sd.bombs[0].k'),'4,3');
 assert.equal(g.get('S.sd.bombs[0].fuse'),1);assert.equal(g.get('S.sd.bombs[0].radius'),1);
 await run('bombTick()');assert.equal(g.get('S.sd.hench[0].hp'),8);
 run('S.sd.hench=[];S.sd.bombs=[]');const before=val('[S.sd.v.x,S.sd.v.y]');
 await run("execCard(buildCard('bomber',{id:'dms',mk:0},6))");
 assert.deepEqual(val('[S.sd.v.x,S.sd.v.y]'),before);assert.equal(g.get('S.sd.bombs.length'),0);
 console.log('PASS: Payload minion immunity, one-turn bombs, 7/19-hex zones, safe swap and tactical blast avoidance.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
