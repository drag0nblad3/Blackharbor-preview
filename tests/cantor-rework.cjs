#!/usr/bin/env node
const assert=require('node:assert/strict'),bh=require('../tools/bh');
const g=bh.load({seed:627,env:{ABIL:'1'}});
const run=x=>g.run(x),j=x=>JSON.parse(JSON.stringify(g.get(x)));
async function main(){
 run("newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('cantor',3)];S.pool=[];S.inv={v:'cantor',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.civs=[];S.sd.bombs=[];S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8});");
 assert.equal(g.get("S.sd.hench.filter(h=>!h.elite&&h.owner==='cantor').every(h=>h.hp===1)"),true,'Opening guns have exactly one HP');
 assert(g.get("S.sd.hench.filter(h=>h.elite&&h.owner==='cantor').every(h=>h.hp>1)"),'Elite retains normal HP');
 run('S.sd.hench=[]');
 await run("execCard(buildCard('cantor',{id:'guns',mk:0},3))");
 assert.equal(g.get('S.sd.hench.length'),2);
 assert.equal(g.get('S.sd.hench.every(h=>h.hp===1)'),true,'Summoned guns have one HP');
 // Crowd Control fires only guns that can shoot from existing positions.
 run("S.sd.hench=[{id:'near',owner:'cantor',x:3,y:4,hp:1},{id:'far',owner:'cantor',x:8,y:0,hp:1},{id:'elite',owner:'cantor',x:4,y:4,hp:5,elite:1}];S.sd.units[0].x=2;S.sd.units[0].y=4;S.sd.units[1].x=1;S.sd.units[1].y=8;S.sd.units[2].x=3;S.sd.units[2].y=8;S.sd.units[3].x=5;S.sd.units[3].y=8;S.sd.log=[]");
 const places=j('S.sd.hench.map(h=>[h.x,h.y])');
 await run("execCard(buildCard('cantor',{id:'crowd',mk:0},3))");
 assert.deepEqual(j('S.sd.hench.map(h=>[h.x,h.y])'),places,'Volley cannot grant movement');
 assert.equal(g.get("S.sd.log.filter(x=>JSON.stringify(x).includes('Hired gun attacks')).length"),1,'Only one hired gun in range fires');
 assert.equal(g.get("S.sd.log.filter(x=>JSON.stringify(x).includes('Made Man attacks')).length"),0,'Elite must not join the volley');
 assert.equal(g.get("S.sd.log.some(x=>JSON.stringify(x).includes('1 shot fired'))"),true);
 assert.match(g.get("buildCard('cantor',{id:'crowd',mk:0},3).txt"),/hired gun/);
 // Leverage is a Composure penalty, not HP damage, for civilian protector.
 run("S.sd.civs=[{id:1,x:3,y:5}];S.sd.v.x=4;S.sd.v.y=3;S.sd.units[0].x=3;S.sd.units[0].y=6;S.sd.hench=[];S.sd.log=[]");
 const hp=g.get('heroOf(S.sd.units[0]).hp');
 run('heroOf(S.sd.units[0]).comp=5');
 await run("execCard(buildCard('cantor',{id:'lev',mk:0},3))");
 assert.equal(g.get('heroOf(S.sd.units[0]).hp'),hp,'Leverage does not reduce HP');
 assert.equal(g.get('heroOf(S.sd.units[0]).comp'),2,'Leverage removes two Composure, +1 at villain level 3');
 assert.equal(g.get('S.sd.civs.length'),1,'Civilian remains protected');
 assert.match(g.get("buildCard('cantor',{id:'lev',mk:0},3).txt"),/Composure/);
 // Other villains' HP-based civilian threats should remain intact.
 assert.equal(g.get("buildCard('cantor',{id:'black',mk:0},3).dmg"),3);
 assert.equal(g.get("buildCard('cantor',{id:'black',mk:0},3).comp"),undefined);
 console.log('PASS: Cantor opening and summoned hired guns have 1 HP; Crowd Control triggers ranged-only shots; Leverage drains Composure instead of HP.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
