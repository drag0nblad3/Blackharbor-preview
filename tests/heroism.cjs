#!/usr/bin/env node
/* Heroism (Tyler, 2026-11-06): pool of 2 + level + bonuses, no cap, spend up to level on a close attack, strength or evasion roll,
   per-hero spend settings (Never / Ask / If not Shaken / Always), and the save migration. Headless: Ask spends unless it would leave the hero Shaken. */
const assert=require('node:assert/strict'),bh=require('../tools/bh');
const g=bh.load({seed:1106});
const run=x=>g.run(x),get=x=>g.get(x);
async function main(){
 run("newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.heroes.forEach(h=>{h.ranks={tech:3,innate:0,magic:0}});S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('quarry',3)];S.pool=[];S.inv={v:'quarry',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.civs=[];S.sd.bombs=[];S.sd.hench=[];S.sd.units.forEach((u,i)=>{u.x=2+i;u.y=6});S.sd.v.x=4;S.sd.v.y=4;");
 // pool size
 assert.equal(get("heroStart(S.heroes[0])"),5,'level 3, no gear: 2 + 3');
 assert.equal(get("S.heroes[0].comp"),5,'fight starts at the starting Heroism');
 run("S.heroes[0].gear={body:'padvest'}");assert.equal(get("heroStart(S.heroes[0])"),9,'+4 starting Heroism from Velvet Armor Vest');run("S.heroes[0].gear={}");
 run("gainHero(S.heroes[0],20)");assert.equal(get("S.heroes[0].comp"),25,'no cap');
 // attack roll: falls 2 short, level 3 -> spends 2 and hits
 const atk=(r,extra='')=>run(`{S.sd.units[0].x=4;S.sd.units[0].y=5;S.sd.units[0].acted=false;${extra}const h=S.heroes[0],need=vStat('eva')-stat(h,'acc');S.tut={dq:[need-(${r}),20,20,20,20,20,20]};globalThis.W0=S.sd.v.wounds.length;}`);
 const attack=async()=>{await run("heroAttack(S.sd.units[0],'v',0,1)");run('S.tut=null')};
 run("S.heroes[0].comp=5");atk(2);await attack();
 assert.equal(get("S.heroes[0].comp"),3,'spent 2 on the attack roll');
 assert(get("S.sd.log.some(l=>/spends 2 Heroism/.test(l.t||l))"),'logged');
 // 4 short is more than level 3: no spend, no hit
 run("S.heroes[0].comp=5");atk(4);await attack();assert.equal(get("S.heroes[0].comp"),5,'cannot spend more than level');
 // natural 1 never helped
 run("S.heroes[0].comp=5");run("S.sd.units[0].acted=false;S.tut={dq:[1]}");await attack();assert.equal(get("S.heroes[0].comp"),5,'natural 1 still misses');
 // settings: Never
 run("S.heroes[0].comp=5;S.heroes[0].hpref={acc:0}");atk(1);await attack();assert.equal(get("S.heroes[0].comp"),5,'Never: no spend');
 // If not Shaken: would empty the pool -> no spend; Always -> spends to 0 and Shaken
 run("S.heroes[0].comp=2;S.heroes[0].hpref={acc:2}");atk(2);await attack();assert.equal(get("S.heroes[0].comp"),2,'If not Shaken refuses to empty the pool');
 run("S.heroes[0].comp=2;S.heroes[0].hpref={acc:3}");atk(2);await attack();assert.equal(get("S.heroes[0].comp"),0,'Always spends the last of it');
 assert.equal(get("stat(S.heroes[0],'acc')+3"),get("(S.heroes[0].comp=1,stat(S.heroes[0],'acc'))"),'0 Heroism is Shaken');
 run("S.heroes[0].hpref=null");
 // strength roll: the attack hits on a 20, the wound roll is 1 short after the card -> spends 1
 run("{S.heroes[0].comp=5;S.sd.units[0].acted=false;const h=S.heroes[0];globalThis.dt0=drawTactic;drawTactic=()=>({id:'none',n:'Plain hit',txt:'No effect.'});S.tut={dq:[20,vStat('tough')-stat(h,'str')-1]};globalThis.W0=S.sd.v.wounds.length}");
 await attack();run('drawTactic=dt0');
 assert.equal(get("S.heroes[0].comp"),4,'spent 1 on the strength roll');assert.equal(get("S.sd.v.wounds.length-W0"),1,'and it wounded');
 // evasion: villain roll lands exactly on evasion -> spend 1 to dodge
 run("{S.heroes[1].comp=5;S.heroes[1].hp=50;const u=S.sd.units[1],h=heroOf(u);S.tut={dq:[stat(h,'eva')+avoidEva(u)-vStat('acc')]}}");
 const hit=await run("vHit(S.sd.units[1],3,'Test strike','none')");run('S.tut=null');
 assert.equal(hit,false,'dodged');assert.equal(get("S.heroes[1].comp"),4,'spent 1 on evasion');assert.equal(get("S.heroes[1].hp"),50);
 // a natural 20 can't be dodged
 run("S.tut={dq:[20]}");await run("vHit(S.sd.units[1],3,'Test strike','none')");run('S.tut=null');assert.equal(get("S.heroes[1].comp"),4);assert.equal(get("S.heroes[1].hp"),47);
 // the scripted tutorial never asks
 run("S.heroes[0].comp=5;S.sd.units[0].acted=false");atk(1);run("S.tut.b=3");await attack();assert.equal(get("S.heroes[0].comp"),5,'tutorial skips Heroism');
 // migration: a custom hero stored the old template max of 5 (+2 from an origin pick)
 run("S.heroism=false;S.sd=null;S.heroes[2].base={...HERO_BASE.wisp,maxComp:7};S.heroes[2].comp=1;migrateHeroism()");
 assert.equal(get("S.heroes[2].base.maxComp"),2);assert.equal(get("S.heroes[2].comp"),get("heroStart(S.heroes[2])"));assert.equal(get("S.heroism"),true);
 assert.equal(get("newCampaign(),S.heroism"),true,'new campaigns need no migration');
 console.log('PASS: Heroism pool, no cap, attack/strength/evasion spends up to level, natural 1/20, Never/If not Shaken/Always settings, tutorial skip, migration.');
}
main().catch(e=>{console.error(e);process.exit(1)});
