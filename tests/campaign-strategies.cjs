#!/usr/bin/env node
// Blackharbor end-to-end campaign strategy comparison.
// Plays seeded real campaign rules and showdown logic via tools/sim.js.
// Results are heuristic-bot outcomes, not human win-rate estimates.
const cp=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const STRATEGIES=['balanced','assault','fortress','mobility','support','specialist','techOnly','magicOnly','innateOnly'];
const ONLY={techOnly:'tech',magicOnly:'magic',innateOnly:'innate'};
const runs=Math.max(1,Number(process.env.RUNS||6));
const seed=Math.max(1,Number(process.env.SEED||77));
const workers=Math.min(4,Math.max(1,Number(process.env.JOBS||3)));
const out=path.resolve(process.env.REPORT_DIR||'campaign-results');
fs.mkdirSync(out,{recursive:true});
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const round=n=>Math.round(n*100)/100;
const report={game:'Blackharbor-preview',seed,runsPerStrategy:runs,strategies:[],method:'Identical seeds per strategy; autonomous heuristic bot; actual campaign state, investigations, crafting, growth, and battle rules. No cheat victories. Each showdown is capped at 40 rounds.'};
let errors=0;
for(const strat of STRATEGIES){
 const file=path.join(out,strat+'.json');
 console.log('RUN '+strat+' seeds '+seed+'-'+(seed+runs-1));
 const p=cp.spawnSync(process.execPath,['tools/sim.js','--runs',String(runs),'--seed',String(seed),'--jobs',String(workers),'--abil','--env','STRATEGY='+strat,'--out',file,'--json'],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:240000,maxBuffer:10*1024*1024});
 if(p.stdout)console.log(p.stdout.slice(-6000));
 if(p.stderr)console.error(p.stderr.slice(-6000));
 if(p.status!==0){report.strategies.push({strategy:strat,error:'Simulator process exited '+p.status+' '+(p.error?.message||p.stderr||'').slice(0,600)});errors++;continue}
 let raw;
 try{raw=JSON.parse(fs.readFileSync(file,'utf8')).A}catch(e){report.strategies.push({strategy:strat,error:'Could not read results: '+String(e)});errors++;continue}
 const failed=raw.filter(r=>r.err),completed=raw.filter(r=>!r.err);
 if(failed.length||completed.length!==runs)errors+=failed.length||1;
 const fights=completed.flatMap(r=>r.rec);
 // Validate actual party composition and rank restrictions in every battle,
 // not just the strategy name or selected bot preferences.
 for(const f of fights){
  assert.equal(f.hs.length,4,strat+': must have four heroes in issue '+f.issue);
  if(strat==='specialist'){
   const roles=f.hs.map(h=>h.role).sort();
   assert.deepEqual(roles,['assault','assault','fortress','support'],strat+': wrong team roles in issue '+f.issue);
  }
  if(ONLY[strat]){
   const t=ONLY[strat];
   for(const h of f.hs){
    assert.equal(h.origin,t,strat+': hero origin outside the discipline');
    assert(h.ranks[t]>=1,strat+': missing required rank');
    for(const other of ['tech','magic','innate'].filter(x=>x!==t))assert.equal(h.ranks[other],0,strat+': mixed discipline rank on '+h.c);
   }
  }
 }
 const arc={};
 for(const a of [1,2,3,'Finale']){
  const rs=fights.filter(f=>a==='Finale'?f.fin:!f.fin&&f.arc===a);
  arc[a]={fights:rs.length,winPct:round(100*avg(rs.map(f=>f.res==='win'?1:0))),avgRounds:round(avg(rs.map(f=>f.rounds))),avgKOs:round(avg(rs.map(f=>f.ko))),avgHpLost:round(avg(rs.map(f=>f.hpLost))),avgAbilityUses:round(avg(rs.map(f=>f.ab))),avgPowers:round(avg(rs.map(f=>f.pw))),avgHeroDice:round(avg(rs.flatMap(f=>f.hs.map(h=>h.dice)))),avgHeroEvasion:round(avg(rs.flatMap(f=>f.hs.map(h=>h.eva))))};
 }
 const gearCount={};for(const f of fights)for(const h of f.hs)for(const k of h.gear)gearCount[k]=(gearCount[k]||0)+1;
 const ranked=Object.entries(gearCount).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,count])=>({name,equippedInFightSnapshots:count}));
 const result={strategy:strat,runs:raw.length,errors:failed.length,firstError:failed[0]?.err,
  profileDefinition:strat==='specialist'?'1 fortress, 2 assault, 1 support':ONLY[strat]?ONLY[strat]+'-discipline origin, ranks, equipment only':'dedicated four-hero '+strat+' build',
  finaleWins:completed.filter(r=>r.res.Fwin).length,finaleReached:completed.filter(r=>r.rec.some(f=>f.fin)).length,
  campaignIssues:round(avg(completed.map(r=>r.issue))),fights:fights.length,
  fightWins:fights.filter(f=>f.res==='win').length,
  fightLosses:fights.filter(f=>f.res==='loss').length,
  fightEscapes:fights.filter(f=>f.res==='escape').length,
  stalls:completed.reduce((s,r)=>s+r.stalls,0),
  avgRounds:round(avg(fights.map(f=>f.rounds))),avgKOs:round(avg(fights.map(f=>f.ko))),
  avgHpLost:round(avg(fights.map(f=>f.hpLost))),
  avgFinaleFacilities:round(avg(completed.map(r=>r.snaps.find(s=>s.label==='Finale')?.facBuilt||0))),
  avgFinaleGearOwned:round(avg(completed.map(r=>r.snaps.find(s=>s.label==='Finale')?.gearOwned||0))),
  arc,topGear:ranked,
  finaleParty:completed.map(r=>({seed:r.seed,heroes:r.rec.find(f=>f.fin)?.hs.map(h=>({class:h.c,role:h.role,origin:h.origin,ranks:h.ranks,gear:h.gear}))||[]})),
  sampledCampaigns:completed.map(r=>({seed:r.seed,issue:r.issue,finaleWin:!!r.res.Fwin,finaleReached:r.rec.some(f=>f.fin),fights:r.rec.length,stalls:r.stalls,record:r.res})),
  failures:failed.map(r=>r.err)
 };
 report.strategies.push(result);
 console.log('RESULT '+strat+': '+result.finaleWins+'/'+completed.length+' finale wins, '+result.fights+' fights, '+result.fightWins+' fight wins, '+result.stalls+' stalls, '+result.errors+' errors');
}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(report,null,2));
console.log('CAMPAIGN SUMMARY');
console.log(JSON.stringify(report.strategies.map(s=>({strategy:s.strategy,runs:s.runs,finaleWins:s.finaleWins,finaleReached:s.finaleReached,fights:s.fights,fightWins:s.fightWins,losses:s.fightLosses,escapes:s.fightEscapes,stalls:s.stalls,avgRounds:s.avgRounds,avgKOs:s.avgKOs,avgHpLost:s.avgHpLost,errors:s.errors,error:s.error||s.firstError})),null,2));
assert(errors===0,'Campaign simulator failures: '+errors);
console.log('PASS: all '+(STRATEGIES.length*runs)+' full-campaign strategy simulations completed; party compositions and single-discipline limits verified.');
