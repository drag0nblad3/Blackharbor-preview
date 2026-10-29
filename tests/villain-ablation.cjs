#!/usr/bin/env node
// Controlled, temporary mechanic ablations: no production balance changes.
// These compare the same boss, gear fixtures, seeded tactical bot, and level
// before/after removing ONE villain capability. Removing a card's behavior
// leaves its turn slot intact, so the test measures its incremental pressure.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const bh=require('../tools/bh');
const BOT=fs.readFileSync(path.join(__dirname,'../tools/bot.js'),'utf8');
const boss=process.env.BOSS||'cantor',seeds=Number(process.env.SEEDS||12),start=Number(process.env.SEED_START||2500);
assert(['cantor','gallows'].includes(boss));assert(Number.isInteger(seeds)&&seeds>=1&&seeds<=50);
const groups=['tech','magic','innate'],stages=[{name:'middle',issue:7,rank:3,level:4,cap:4},{name:'late',issue:13,rank:4,level:6,cap:5}];
const variants=boss==='cantor'?['baseline','singleSummon','noSummons','noComposure','noGuard','lowerEvasion']:['baseline','singleSummon','noSummons'];
const classes={tech:['volt','cipher','rivet','volt'],magic:['wisp','sibyl','hexen','wisp'],innate:['bulwark','lynx','goliath','bulwark']};
function setup(k,group,stage,variant){
 const heroes=classes[group].map((cls,i)=>i===3?
  `newHero('custom','Reserve '+${i},{...HERO_BASE[${JSON.stringify(cls)}],name:'Reserve '+${i}})`:
  `newHero(${JSON.stringify(cls)})`).join(',');
 let adjustment='';
 if(variant==='noSummons')adjustment=`for(const c of Object.values(VILLAINS.${k}.cards))if(c.t==='summon'){c.t='taunt';c.amt=0;c.r=0}`;
 if(variant==='singleSummon')adjustment=`for(const c of Object.values(VILLAINS.${k}.cards))if(c.t==='summon')c.k=1`;
 if(variant==='noComposure')adjustment=`for(const c of Object.values(VILLAINS.${k}.cards))if(c.t==='taunt'||c.t==='puppet'){c.t='taunt';c.amt=0;c.r=0};VINTEL.${k}.react.forEach(r=>{r.comp=0})`;
 if(variant==='noGuard')adjustment=`VILLAINS.${k}.elite=null;VINTEL.${k}.react.forEach(r=>{r.guard=0})`;
 if(variant==='lowerEvasion')adjustment=`VILLAINS.${k}.eva=11`;
 return `newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.issue=${stage.issue};
 ${adjustment};
 S.heroes=[${heroes}];S.party=S.heroes.map(h=>h.id);
 for(const h of S.heroes){const t=BASE(h).track;h.ranks={tech:0,magic:0,innate:0};h.ranks[t]=${stage.rank};h.upgrades=['speed','str','acc','hp','eva'].slice(0,${stage.rank-1});}
 S.villains=[makeVillain(${JSON.stringify(k)},${stage.level})];S.pool=[];S.facilities=['workshop'];
 S.armory=STARTER_LOCKER.filter(x=>GEAR[x]&&!GEAR[x].cons);
 S.armory.push(...Object.keys(GEAR).filter(x=>GEAR[x].cost.any&&!GEAR[x].cons&&GEAR[x].req<=${stage.rank}&&GEAR[x].req>=2));
 equipBest(S.heroes);
 S.heroes.forEach(h=>{const keep=Object.entries(h.gear).sort((a,b)=>gScore(b[1],h)-gScore(a[1],h)).slice(0,${stage.cap});h.gear=Object.fromEntries(keep);h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});
 S.inv={v:${JSON.stringify(k)},clues:3};startShowdown();S.sd.intro=false;`;
}
const results=[];
(async()=>{
 for(const group of groups)for(const stage of stages)for(const variant of variants){
  let wins=0,losses=0,other=0,ko=0,rounds=0;
  for(let i=0;i<seeds;i++){
   const seed=start+i;
   try{
    const g=bh.load({seed,env:{ABIL:'1',STRATEGY:'balanced',LOOT_MODE:'greedy'}});
    g.run(BOT,'tools/bot.js');g.run(setup(boss,group,stage,variant));
    await g.run('fight()');
    const v=JSON.parse(JSON.stringify(g.get('REC[REC.length-1]')));
    assert(v.hs.length===4&&v.vs[0].k===boss);
    wins+=v.res==='win';losses+=v.res==='loss';other+=v.res!=='win'&&v.res!=='loss';ko+=v.ko;rounds+=v.rounds;
   }catch(e){throw Error('Ablation '+boss+' '+group+' '+stage.name+' '+variant+' seed '+seed+': '+String(e.stack||e).slice(0,1000))}
  }
  const row={boss,group,stage:stage.name,variant,fights:seeds,wins,losses,other,avgKOs:Math.round(100*ko/seeds)/100,avgRounds:Math.round(10*rounds/seeds)/10};
  results.push(row);console.log('ABLATION '+JSON.stringify(row));
 }
 const overall=variants.map(variant=>{
  const v=results.filter(r=>r.variant===variant);
  return {variant,fights:v.reduce((n,r)=>n+r.fights,0),wins:v.reduce((n,r)=>n+r.wins,0),
   winPct:Math.round(1000*v.reduce((n,r)=>n+r.wins,0)/v.reduce((n,r)=>n+r.fights,0))/10,
   avgKOs:Math.round(100*v.reduce((n,r)=>n+r.avgKOs,0)/v.length)/100};
 });
 const dir=path.resolve('villain-ablation-results');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,boss+'.json'),JSON.stringify({boss,seeds,start,results,overall},null,2));
 console.log('ABLATION_SUMMARY '+JSON.stringify({boss,overall}));
 console.log('PASS: '+results.length*seeds+' matched fixture battles testing '+boss+' mechanics.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
