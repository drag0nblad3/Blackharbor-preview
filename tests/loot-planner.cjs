#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const bh=require('../tools/bh');
const bot=fs.readFileSync(path.join(__dirname,'../tools/bot.js'),'utf8');
const make=(seed,mode='planned')=>{const g=bh.load({seed,env:{LOOT_MODE:mode,ABIL:'1'}});g.run(bot,'tools/bot.js');g.run('newCampaign();S.guide=null;S.tut=null;S.tutDone=true;');return g};
const asJson=(g,s)=>JSON.parse(JSON.stringify(g.get(s)));
const chosen=['bulwark','lynx','goliath','volt'];
for(const seed of [1,19,57]){
 const g=make(seed);
 g.run(chosen.map(x=>'recruitQuick('+JSON.stringify(x)+');').join(''));
 g.run("S.villains=[makeVillain('quarry',1)];S.pool=S.pool.filter(k=>k!=='quarry');S.issue=7;S.heroes.find(h=>h.cls==='bulwark').ranks.innate=3;S.unlocked.push(...Object.keys(GEAR).filter(k=>GEAR[k].set==='quarry').map(k=>'gear:'+k));");
 g.run('planSetGoals(party())');
 const goals=asJson(g,'ST.setGoals');
 assert(goals.some(p=>p.boss==='quarry'), 'Planner should target a viable Quarry set, seed '+seed);
 const goal=goals.find(p=>p.boss==='quarry');
 assert.equal(goal.items.length,4);
 assert.equal(new Set(goal.items.map(k=>g.get('GEAR['+JSON.stringify(k)+'].slot'))).size,4);
 g.run('S.salvage.quarry=2');
 const protectedAmount=g.get("setReserves().quarry");
 assert(protectedAmount>=2,'Set salvage should be earmarked');
 assert.equal(g.get("allocateAny(2,setReserves())"),null,'Do not spend reserved Quarry resources on generic gear');
 g.run('S.salvage.gallows=3');
 const spend=asJson(g,'allocateAny(2,setReserves())');
 assert.deepEqual(spend,{gallows:2},'Generic costs should use unreserved boss salvage');
 g.run('S.salvage.quarry=20; plannedSpend(party(),()=>true)');
 const completed=g.get("party().some(h=>setOn(h,'quarry'))");
 assert(completed,'Bot should craft and equip a complete Quarry set, seed '+seed);
 assert(g.get('ST.setCrafts')>=3,'Bot should craft the missing set pieces');
 assert(g.get('ST.goalCompleted')>=1,'A complete set should be recorded');
}
{
 const g=make(12);
 g.run(chosen.map(x=>'recruitQuick('+JSON.stringify(x)+');').join(''));
 g.run("S.villains=[makeVillain('gallows',1)];S.issue=12;S.heroes.find(h=>h.cls==='volt').ranks.tech=3;unlock(['gear:bandolier']);S.unlocked.push('gear:grimoire');S.salvage.gallows=2");
 const v=g.get('availableAny(setReserves())');
 assert(v>=2);
 // The choice of a high-tier future upgrade must be available to the planner.
 g.run("S.heroes.find(h=>h.cls==='volt').ranks.tech=4;unlock(['gear:lance','gear:fusion','gear:gravboots'])");
 const target=asJson(g,'chooseBigGoal(party(),()=>true)');
 assert(target&&g.get('GEAR['+JSON.stringify(target.k)+'].req')>=3,'Big item goal should be selected');
}
{
 const g=make(48);
 g.run(chosen.map(x=>'recruitQuick('+JSON.stringify(x)+');').join(''));
 g.run("S.villains=[];S.issue=13;S.heroes.find(h=>h.cls==='volt').ranks.tech=4;S.unlocked=['gear:lance'];S.salvage.gallows=6");
 assert.equal(g.get("chooseBigGoal(party(),()=>true)?.k"),'lance','Bot should save for a major two-handed weapon');
 g.run("plannedSpend(party(),()=>true)");
 assert.equal(g.get("S.salvage.gallows"),6,'Insufficient salvage is preserved for the lance');
 g.run("S.salvage.gallows=11;plannedSpend(party(),()=>true)");
 assert.equal(g.get("S.heroes.find(h=>h.cls==='volt').gear.arms"),'lance','Large weapon is equipped when affordable');
 assert(g.get('ST.bigCrafts')>=1);
}
{
 const g=make(81);
 g.run(chosen.map(x=>'recruitQuick('+JSON.stringify(x)+');').join(''));
 g.run("S.villains=[makeVillain('quarry',1)];S.salvage.quarry=5;S.issue=1;S.unlocked=['gear:graft','gear:wraps']");
 g.run('plannedSpend(party(),()=>true)');
 assert(g.get('ST.setCrafts')>0,'The bot must still buy valuable standalone boss gear in early arcs');
 assert(g.get('S.salvage.quarry')<5,'Standalone boss gear should use salvage not earmarked for a set');
}
console.log('PASS: planned four-piece set completion, protected boss salvage, targeted spending, and major-upgrade evaluation.');

if(process.env.CAMPAIGN_SMOKE==='1'){
 const scenarios=['balanced','assault','specialist','techOnly','innateOnly'];
 for(const strategy of scenarios){
  const file=path.join('/tmp','loot-'+strategy+'.json');
  const p=cp.spawnSync(process.execPath,['tools/sim.js','--runs','3','--seed','91','--jobs','3','--abil','--env','STRATEGY='+strategy,'--env','LOOT_MODE=planned','--out',file,'--json'],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:140000,maxBuffer:8*1024*1024});
  assert.equal(p.status,0,'Simulator process failed '+strategy+': '+p.stderr);
  const raw=JSON.parse(fs.readFileSync(file,'utf8')).A,broken=raw.filter(x=>x.err);
  assert.equal(broken.length,0,JSON.stringify(broken.map(x=>x.err)));
  const summary={strategy,fights:raw.reduce((n,r)=>n+r.rec.length,0),finales:raw.filter(r=>r.res.Fwin).length,crafts:raw.reduce((n,r)=>n+r.loot?.setCrafts||0,0),highTier:raw.reduce((n,r)=>n+r.loot?.bigCrafts||0,0),sets:raw.reduce((n,r)=>n+r.loot?.goalCompleted||0,0)};
  console.log('CAMPAIGN '+JSON.stringify(summary));
 }
 console.log('PASS: loot planning smoke tests across 15 campaigns.');
}
