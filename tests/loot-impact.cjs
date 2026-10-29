#!/usr/bin/env node
// Paired-seed benchmark of legacy greedy crafting vs investment-aware planning.
// Gameplay and boss selection are identical; only LOOT_MODE differs.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const strategies=['balanced','assault','fortress','mobility','support','specialist','techOnly','magicOnly','innateOnly'];
const runs=Math.max(1,+(process.env.RUNS||6)),seed=+(process.env.SEED||77);
const out=path.resolve(process.env.REPORT_DIR||'loot-impact-results');fs.mkdirSync(out,{recursive:true});
const rows=[];let errors=0;
for(const strat of strategies){
 for(const mode of ['greedy','planned']){
  const target=path.join(out,mode+'-'+strat+'.json');
  const p=cp.spawnSync(process.execPath,['tools/sim.js','--runs',String(runs),'--seed',String(seed),'--jobs','3','--abil','--env','STRATEGY='+strat,'--env','LOOT_MODE='+mode,'--out',target,'--json'],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:180000,maxBuffer:10*1024*1024});
  if(p.status!==0){errors++;console.error('ERROR '+strat+' '+mode+' '+String(p.stderr||p.error?.message||'').slice(0,1000));continue}
  let x;try{x=JSON.parse(fs.readFileSync(target,'utf8')).A}catch(e){errors++;console.error(String(e));continue}
  errors+=x.filter(z=>z.err).length;
  const good=x.filter(z=>!z.err),fights=good.flatMap(z=>z.rec);
  const stages={};for(const stage of [1,2,3,4]){
   const subset=fights.filter(f=>(f.fin?4:f.arc)===stage);
   stages[stage]={fights:subset.length,wins:subset.filter(f=>f.res==='win').length};
  }
  const row={strategy:strat,mode,runs:good.length,errors:x.length-good.length,
   finaleWins:good.filter(z=>z.res.Fwin).length,
   finaleReached:good.filter(z=>z.rec.some(f=>f.fin)).length,
   fights:fights.length,wins:fights.filter(f=>f.res==='win').length,
   losses:fights.filter(f=>f.res==='loss').length,
   stalls:good.reduce((a,z)=>a+z.stalls,0),
   completedSets:good.reduce((a,z)=>a+z.loot?.goalCompleted||0,0),
   setCrafts:good.reduce((a,z)=>a+z.loot?.setCrafts||0,0),
   majorCrafts:good.reduce((a,z)=>a+z.loot?.bigCrafts||0,0),
   reserveSkips:good.reduce((a,z)=>a+z.loot?.reserveSkips||0,0),
   heroSetFights:fights.reduce((a,f)=>a+f.hs.filter(h=>h.sets.length).length,0),
   lastArcSalvage:good.map(z=>z.snaps.find(s=>s.label==='Arc 3')?.salv).filter(n=>n!=null),
   stages};
  rows.push(row);
  console.log('RESULT '+JSON.stringify({strategy:strat,mode,finaleWins:row.finaleWins,wins:row.wins,fights:row.fights,completedSets:row.completedSets,setCrafts:row.setCrafts,majorCrafts:row.majorCrafts,heroSetFights:row.heroSetFights,stalls:row.stalls}));
 }
}
const comparisons=strategies.map(strategy=>{
 const greedy=rows.find(x=>x.strategy===strategy&&x.mode==='greedy'),planned=rows.find(x=>x.strategy===strategy&&x.mode==='planned');
 return {strategy,greedy,planned,winRateChange:greedy&&planned?Math.round((planned.wins/planned.fights-greedy.wins/greedy.fights)*1000)/10:null};
});
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({seed,runs,method:'Matched campaign RNG seeds and identical adaptive boss selection; compares opportunistic set investment, major-upgrade savings, and unreserved standalone boss gear against greedy LOOT_MODE.',comparisons},null,2));
console.log('IMPACT SUMMARY');
for(const x of comparisons)console.log('COMPARE '+JSON.stringify({strategy:x.strategy,greedy:x.greedy?.wins+'/'+x.greedy?.fights,planned:x.planned?.wins+'/'+x.planned?.fights,winRateChange:x.winRateChange,setCrafts:x.planned?.setCrafts,setsCompleted:x.planned?.completedSets,majorCrafts:x.planned?.majorCrafts,greedySetFights:x.greedy?.heroSetFights,plannedSetFights:x.planned?.heroSetFights}));
assert.equal(errors,0,'Campaign errors '+errors);
assert.equal(rows.length,strategies.length*2);
assert(rows.filter(x=>x.mode==='planned').reduce((n,x)=>n+x.completedSets,0)>0,'Set planner never completed a set');
assert(rows.filter(x=>x.mode==='planned').reduce((n,x)=>n+x.majorCrafts,0)>0,'Planner never crafted a major upgrade');
console.log('PASS: '+(runs*strategies.length*2)+' matched campaign runs with successful loot investment and no errors.');
