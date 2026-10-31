#!/usr/bin/env node
// Controlled headless experiment: change only the three starting bosses,
// preserve seeded campaign RNG and remaining villain pool ordering.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm');
const STRATEGIES=['balanced','specialist','techOnly','magicOnly','innateOnly'];
const SLATES={
 tech:'gallows,lode,bomber',
 magic:'cantor,helios,grid',
 innate:'quarry,swarm,serpent',
 mixed:'gallows,quarry,cantor'
};
const runs=Math.max(1,Number(process.env.RUNS||6)),seed=+(process.env.SEED||77);
const out=path.resolve('boss-slate-results');fs.mkdirSync(out,{recursive:true});
const GEAR=vm.runInNewContext(require('../tools/bh.js').dataCode()+'\nGEAR');
const avg=v=>v.length?v.reduce((s,n)=>s+n,0)/v.length:0;
const pct=v=>Math.round(v*1000)/10;
const results=[];let errors=0;
for(const [slate,bosses] of Object.entries(SLATES)){
 for(const strategy of STRATEGIES){
  const file=path.join(out,slate+'-'+strategy+'.json');
  console.log('RUN '+slate+' '+strategy);
  const p=cp.spawnSync(process.execPath,['tools/sim.js','--runs',String(runs),'--seed',String(seed),'--jobs','3','--abil','--patch','tests/boss-slate.patch.js','--env','BOSS_START='+bosses,'--env','STRATEGY='+strategy,'--out',file,'--json'],{encoding:'utf8',timeout:240000,maxBuffer:12*1024*1024});
  if(p.status!==0){errors++;console.error('SIM FAIL '+slate+' '+strategy+' '+String(p.stderr||p.error?.message||'').slice(0,1100));continue}
  const raw=JSON.parse(fs.readFileSync(file,'utf8')).A;const failed=raw.filter(r=>r.err);
  if(failed.length){errors+=failed.length;console.error('CAMPAIGN ERR '+slate+' '+strategy+' '+failed[0].err)}
  const ok=raw.filter(r=>!r.err),fights=ok.flatMap(r=>r.rec||[]);
  const arc={};for(const n of [1,2,3,'Finale']){
   const x=fights.filter(f=>n==='Finale'?f.fin:!f.fin&&f.arc===n);
   arc[n]={total:x.length,wins:x.filter(f=>f.res==='win').length};
  }
  const sets={};
  const wornCounts={};
  for(const f of fights)for(const h of f.hs){
   for(const k of h.gear||[]){const b=GEAR[k]?.set;if(!b)continue;wornCounts[b]=(wornCounts[b]||0)+1}
  }
  for(const r of ok)for(const c of r.CR||[]){const boss=GEAR[c.k]?.set;if(boss)sets[boss]=(sets[boss]||0)+1}
  const o={slate,strategy,bosses,bossFights:fights.length,completed:ok.length,errors:failed.length,
   finaleReached:ok.filter(r=>r.rec?.some(f=>f.fin)).length,finaleWins:ok.filter(r=>r.res?.Fwin).length,
   battleWins:fights.filter(f=>f.res==='win').length,fights:fights.length,
   winRate:pct(avg(fights.map(f=>f.res==='win'?1:0))),
   meanKOs:+avg(fights.map(f=>f.ko)).toFixed(2),meanRounds:+avg(fights.map(f=>f.rounds)).toFixed(2),
   bossGearCrafted:Object.values(sets).reduce((s,n)=>s+n,0),bossGearEquippedInHeroFightSnapshots:Object.values(wornCounts).reduce((s,n)=>s+n,0),
   craftedByBoss:sets,wornByBoss:wornCounts,arc,
   runLevel:ok.map(r=>({seed:r.seed,win:!!r.res?.Fwin,reachable:!!r.rec?.some(f=>f.fin),fights:r.rec.length,winCount:r.rec.filter(f=>f.res==='win').length,
      bossSetCrafts:r.CR.filter(c=>GEAR[c.k]?.set).length}))};
  results.push(o);
  console.log('RESULT '+slate+' '+strategy+' wins '+o.battleWins+'/'+o.fights+' finale '+o.finaleWins+'/'+o.finaleReached+' boss crafts '+o.bossGearCrafted+' KOs '+o.meanKOs);
 }
}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({runs,seed,strategies:STRATEGIES,slates:SLATES,results},null,2));
console.log('EXPERIMENT SUMMARY');
for(const x of results)console.log('DATA '+JSON.stringify({slate:x.slate,strategy:x.strategy,wins:x.battleWins,total:x.fights,winRate:x.winRate,finaleWins:x.finaleWins,finaleReached:x.finaleReached,bossGearCrafted:x.bossGearCrafted,bossGearEquipped:x.bossGearEquippedInHeroFightSnapshots,arc:x.arc,meanKOs:x.meanKOs,meanRounds:x.meanRounds}));
if(errors)throw Error('Experiment had '+errors+' failures');
if(results.length!==STRATEGIES.length*Object.keys(SLATES).length)throw Error('Missing results');
console.log('PASS: '+results.length+' matched build/slate scenarios across '+(runs*results.length)+' complete campaign attempts.');
