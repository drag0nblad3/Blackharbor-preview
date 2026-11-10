#!/usr/bin/env node
/* Tyler, 2026-11-10: sharper threats for the softest Arc 3 villains, plus elites from ELITE_LV and finale levels. */
const assert=require('node:assert/strict'),bh=require('../tools/bh');
const g=bh.load({seed:404}),run=s=>g.run(s),get=s=>JSON.parse(JSON.stringify(g.get(s)));
g.ctx.setTimeout=fn=>setImmediate(fn);
run('render=()=>{bossObserve()};fx=()=>{};');
function setup(k,lv=2){run(`newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['hexen','volt','wisp','bulwark'].map(k=>newHero(k));S.party=S.heroes.map(h=>h.id);S.facilities=[];S.villains=[makeVillain('${k}',${lv})];S.pool=[];S.inv={v:'${k}',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.haz=[];S.sd.hench=[];S.sd.civs=[];S.sd.term=null;S.sd.bombs=[];S.sd.beams=[];S.sd.exits=[];S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8;heroOf(u).hp=50;heroOf(u).comp=10});S.sd.vturn=true;`)}
const card=id=>`buildCard(S.sd.vkey,{id:'${id}',mk:0})`,play=id=>run(`execCard(${card(id)})`);
const hp=i=>get(`heroOf(S.sd.units[${i}]).hp`);
(async()=>{
 // Quarry: accuracy 5; her slams also hit heroes beside rubble anywhere on the board.
 assert.equal(get('VILLAINS.quarry.acc'),5);assert.equal(get('VILLAINS.helios.acc'),5);assert.equal(get('VILLAINS.noct.acc'),7);
 // Quake Roar, Blinding Light and Whispers in the Dark end with a weak attack on the nearest hero in range (1 + level/4).
 for(const [k,id,r] of [['quarry','roar',2],['helios','blind',4],['noct','dread',3]]){
  setup(k,4);run(`S.sd.v.x=4;S.sd.v.y=4;S.sd.units.forEach((u,i)=>{u.x=i;u.y=0});S.sd.units[2].x=4;S.sd.units[2].y=4+${r};vHit=async(u,d)=>{u._jab=(u._jab||0)+d}`);
  assert(get(`buildCard('${k}',{id:'${id}',mk:0},4).txt`).includes(`nearest hero within ${r} for 2 damage`),id+' text');
  await play(id);assert.equal(get('S.sd.units[2]._jab'),2,id+' jab');assert.equal(get('S.sd.units.filter(u=>u._jab).length'),1,id+' one target');
  setup(k,1);run("S.sd.v.x=4;S.sd.v.y=7;S.sd.units.forEach((u,i)=>{u.x=i;u.y=0});vHit=async(u,d)=>{u._jab=1}");await play(id);assert.equal(get('S.sd.units.filter(u=>u._jab).length'),0,id+' nobody in range');
 }
 setup('quarry');run("S.sd.v.x=1;S.sd.v.y=1;S.sd.units[3].x=7;S.sd.units[3].y=7;S.sd.obs=['7,6'];vHit=async(u,d)=>{u._hit=(u._hit||0)+d}");
 await play('slam');assert(get('S.sd.units[3]._hit>0'),'hero beside rubble far away is hit');assert(!get('!!S.sd.units[0]._hit'),'hero away from rubble and Quarry is safe');
 // Architect: expiring temporary walls hit adjacent heroes for 2; permanent walls do not.
 setup('architect');run("S.sd.units[0].x=4;S.sd.units[0].y=4;S.sd.walls=[{k:'5,4',ttl:0},{k:'0,0',ttl:0}]");const a0=hp(0);run('wallsCollapse()');assert.equal(hp(0),a0-2);
 setup('architect');run("S.sd.units[0].x=4;S.sd.units[0].y=4;S.sd.walls=[{k:'5,4',ttl:0,perm:1}]");const a1=hp(0);run('wallsCollapse()');assert.equal(hp(0),a1);
 // Helios: a fired charge leaves its hexes burning until the next villain turn.
 setup('helios');run("S.sd.units.forEach((u,i)=>{u.x=i;u.y=8});S.sd.v.charge={n:'Solar Flare',dmg:5,zone:['3,3','3,4']}");await run('fireCharge()');
 assert.deepEqual(get("S.sd.haz.filter(h=>h.n==='afterglow').map(h=>h.k).sort()"),['3,3','3,4']);
 run("S.sd.units[0].x=3;S.sd.units[0].y=3");const h0=hp(0);await run('hazardTick()');assert.equal(hp(0),h0-2);assert(!get("S.sd.haz.some(h=>h.n==='afterglow')"),'afterglow lasts one round');
 // Nocturne: strikes deal +2 to a hero with no ally within 2 hexes.
 setup('noct');run("S.sd.v.x=4;S.sd.v.y=2;S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8});S.sd.units[1].x=4;S.sd.units[1].y=4;let got=[];vHit=async(u,d)=>{got.push(d)};globalThis._got=got");
 await play('stars');const lone=get('_got[0]');
 run("S.sd.units[2].x=5;S.sd.units[2].y=4;_got.length=0");await play('stars');const together=get('_got[0]');assert.equal(lone,together+2);
 // Elites from level 2.
 setup('architect',2);assert.equal(get('ELITE_LV'),2);run("S.villains=[makeVillain('architect',2)];S.inv={v:'architect',clues:3};startShowdown();S.sd.intro=false");assert.equal(get("S.sd.hench.filter(m=>m.elite).length"),1);
 // Finale: mastermind at the highest villain level met, Mole Boy two below.
 run("newCampaign();S.tut=null;S.tutDone=true;S.storyOff=true;S.mastermind=null;S.villains=[makeVillain('gallows',6),makeVillain('cantor',5)];S.villains.forEach(v=>v.status='active');S.pool=['helios'];setupEvent()");
 assert.equal(get("vState(S.event.keys[0]).level"),6);assert.equal(get("vState('mole').level"),5);
 // Quarry: toughness 18 and one extra playbook page.
 assert.equal(get('VILLAINS.quarry.tough'),18);assert.equal(get('VILLAINS.quarry.deckBonus'),1);
 // Helios: Corona Burst and the Corona Flare reaction light an aura that burns heroes beside him when a round ends and when the next starts.
 setup('helios',4);run("S.sd.v.x=4;S.sd.v.y=4;S.sd.units.forEach((u,i)=>{u.x=i;u.y=0});vHit=async()=>false");
 assert(get(`buildCard('helios',{id:'corona',mk:0},4).txt`).includes('take 3 damage'));
 await play('corona');assert.equal(get('S.sd.v.aura.dmg'),3);
 run("S.sd.units[0].x=4;S.sd.units[0].y=5;heroOf(S.sd.units[0]).hp=50");run("auraTick('starts')");assert.equal(hp(0),47);assert.equal(hp(1),50);
 run("auraTick('ends')");assert.equal(hp(0),44);assert(!get('!!S.sd.v.aura'),'aura burns out after a round');run("auraTick('starts')");assert.equal(hp(0),44);
 assert.equal(get("rxOf('helios','corona').aura"),2);
 setup('helios',4);run("auraSet(S.sd.v,rxOf('helios','corona').aura)");assert.equal(get('S.sd.v.aura.ticks'),2);
 // Ouroboros: Mesmerizing Sway costs no Heroism and bites a hero dragged beside it; Shed Skin is a reaction and rides on Serpent Eyes, 1 page each.
 assert(!get("VILLAINS.serpent.adv.includes('shedp')"));assert.equal(get("rxOf('serpent','shed').shed"),1);assert(get(`buildCard('serpent',{id:'hiss',mk:0},1).txt`).includes('sheds its skin'));
  setup('serpent',5);run("S.sd.v.wounds=S.sd.v.deck.splice(0,3);S.sd.units.forEach((u,i)=>{u.x=2*i;u.y=8})");const d0=get('S.sd.v.deck.length');
 await play('eyes');assert.equal(get('S.sd.v.deck.length'),d0+1,'Serpent Eyes sheds 1 page');assert.equal(get('S.sd.v.wounds.length'),2);
 setup('serpent',4);run("S.sd.units.forEach((u,i)=>{u.x=2*i;u.y=8});S.heroes.forEach(h=>h.comp=5);S.heroes[1].comp=1;vHit=async(u,d)=>{u._bit=d}");
 run("const t=S.sd.units[1],v=S.sd.v;const c=freeTiles((x,y)=>dV({x,y},v)===2)[0];t.x=c.x;t.y=c.y");
 await play('mesmer');assert.equal(get('S.heroes[1].comp'),1,'no Heroism loss');assert.equal(get('S.sd.units[1]._bit'),2,'bites the dragged hero');
 setup('serpent',5);run("S.sd.v.wounds=S.sd.v.deck.splice(0,2);shedPages(S.sd.v,'Shed Skin')");assert.equal(get('S.sd.v.wounds.length'),1,'sheds 1 page at any level');
 console.log('PASS: Quarry rubble quake, accuracy, toughness and pages, Helios corona aura, Ouroboros sway and shed skin, Architect wall collapse, Helios afterglow, Nocturne isolated prey, elites from level 2, finale levels.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
