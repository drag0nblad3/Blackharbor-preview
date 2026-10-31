#!/usr/bin/env node
/* Fixed-team villain matchup study. Holds hero roster, ranks, gear, issue,
   investigation quality, and enemy level constant; varies only boss identity
   and seeded tactical play. Terrain and boss reactions remain villain-specific.
   This is an independent diagnostic, not a replacement for full campaigns. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const bh=require('../tools/bh');
const BOT=fs.readFileSync(path.join(__dirname,'../tools/bot.js'),'utf8');
const DATA=vm.runInNewContext(require('../tools/bh.js').dataCode()+'\n({VILLAINS,GEAR,VINTEL})');
const bosses=Object.keys(DATA.VILLAINS).filter(k=>k!=='mole');
const groups=['mixed','tech','magic','innate'];
// Stress-test tiers use moderate, capped hero gear and slightly stronger villains;
// deliberately avoid 100% win rates that hide meaningful boss differences.
const scenarios=[{stage:'early',issue:1,rank:1,bossLevel:2,gearCap:3},{stage:'middle',issue:7,rank:3,bossLevel:4,gearCap:4},{stage:'late',issue:13,rank:4,bossLevel:6,gearCap:5}];
const group=process.env.GROUP||'mixed';
const seeds=Number(process.env.SEEDS||12),seedStart=Number(process.env.SEED_START||2300);
assert(groups.includes(group));assert(Number.isInteger(seeds)&&seeds>0&&seeds<=120);
const out=path.resolve(process.env.OUTPUT_DIR||'villain-matchup-results');fs.mkdirSync(out,{recursive:true});
const roster={
 mixed:['volt','bulwark','wisp','lynx'],
 tech:['volt','cipher','rivet','volt'],
 magic:['wisp','sibyl','hexen','wisp'],
 innate:['bulwark','lynx','goliath','bulwark']
}[group];
const CYCLE=['speed','str','acc','hp','eva','move','comp'];
const makeSetup=(k,stage)=>{
 const a=roster.map((cls,i)=>{
   const isCustom=i===3&&group!=='mixed';
   return isCustom?
     `newHero('custom', 'Reserve '+${i}, {...HERO_BASE[${JSON.stringify(cls)}], name:'Reserve '+${i}})`:
     `newHero(${JSON.stringify(cls)})`;
 }).join(',');
 const rank=stage.rank;
 return `newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.issue=${stage.issue};
 S.heroes=[${a}];S.party=S.heroes.map(h=>h.id);
 for(const h of S.heroes){
   const t=BASE(h).track;h.ranks={tech:0,magic:0,innate:0};h.ranks[t]=${rank};
   h.upgrades=${JSON.stringify(CYCLE)}.slice(0,${Math.max(0,rank-1)});
 }
 S.villains=[makeVillain(${JSON.stringify(k)},${stage.bossLevel})];S.pool=[];
 S.facilities=['workshop'];S.armory=STARTER_LOCKER.filter(x=>GEAR[x]&&!GEAR[x].cons);
 if(${rank}>1)S.armory.push(...Object.keys(GEAR).filter(x=>GEAR[x].cost.any&&!GEAR[x].cons&&GEAR[x].req<=${rank}&&GEAR[x].req>=2));
 equipBest(S.heroes);
 // The full generic item catalog makes a benchmark party unrealistically
 // powerful. Retain only the best few pieces at each tier.
 S.heroes.forEach(h=>{const keep=Object.entries(h.gear).sort((a,b)=>gScore(b[1],h)-gScore(a[1],h)).slice(0,${stage.gearCap});h.gear=Object.fromEntries(keep)});
 S.heroes.forEach(h=>{h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});
 S.inv={v:${JSON.stringify(k)},clues:3};startShowdown();S.sd.intro=false;`;
};
const rows=[];
(async()=>{
 for(const stage of scenarios){
  for(const boss of bosses){
   let wins=0,losses=0,other=0,rounds=0,kos=0,hpLost=0,ab=0,pow=0;
   const reps=[];
   for(let s=0;s<seeds;s++){
    const seed=seedStart+s;
    try{
     const g=bh.load({seed,env:{ABIL:'1',STRATEGY:'balanced',LOOT_MODE:'greedy'}});
     g.run(BOT,'tools/bot.js');g.run(makeSetup(boss,stage));
     const res=await g.run('fight()');
     const snap=JSON.parse(JSON.stringify(g.get('REC[REC.length-1]')));
     assert(snap&&snap.vs[0].k===boss&&snap.hs.length===4,'Invalid controlled battle snapshot');
     wins+=snap.res==='win';losses+=snap.res==='loss';other+=snap.res!=='win'&&snap.res!=='loss';
     rounds+=snap.rounds;kos+=snap.ko;hpLost+=snap.hpLost;ab+=snap.ab;pow+=snap.pw;
     reps.push({seed,result:snap.res,rounds:snap.rounds,ko:snap.ko,hpLost:snap.hpLost,heroStats:s===0?snap.hs:undefined});
    }catch(e){throw Error('Matchup '+group+' '+stage.stage+' '+boss+' seed '+seed+': '+String(e.stack||e).slice(0,900))}
   }
   const row={group,stage:stage.stage,rank:stage.rank,level:stage.bossLevel,boss,bossName:DATA.VILLAINS[boss].name,
     fights:seeds,wins,losses,other,winPct:Math.round(1000*wins/seeds)/10,avgRounds:Math.round(10*rounds/seeds)/10,
     avgKOs:Math.round(100*kos/seeds)/100,avgHpLost:Math.round(10*hpLost/seeds)/10,
     avgAbilityUses:Math.round(10*ab/seeds)/10,avgPowerUses:Math.round(10*pow/seeds)/10,reps};
   rows.push(row);
   console.log('MATCHUP '+JSON.stringify({group,stage:stage.stage,boss,wins,losses,other,avgKOs:row.avgKOs,avgRounds:row.avgRounds}));
  }
 }
 fs.writeFileSync(path.join(out,group+'.json'),JSON.stringify({group,seeds,seedStart,scenarios,roster,rows},null,2));
 console.log('MATCHUP_GROUP '+JSON.stringify({group,seeds,fights:rows.reduce((n,r)=>n+r.fights,0),wins:rows.reduce((n,r)=>n+r.wins,0)}));
 console.log('PASS: fixed-team boss matchups for '+group+', '+rows.length*seeds+' fights, no simulator exceptions.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
