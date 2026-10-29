#!/usr/bin/env node
// High-sample campaign dataset (one build per matrix job).
// Uses unmodified combat/campaign rules and the current planned-loot bot.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const strategies=['balanced','assault','fortress','mobility','support','specialist','techOnly','magicOnly','innateOnly'];
const strategy=process.env.STRATEGY||'balanced';
const runs=+(process.env.RUNS||60);
const seed=+(process.env.SEED||1700);
const jobs=+(process.env.JOBS||4);
assert(strategies.includes(strategy),'Unknown build strategy');
assert(Number.isInteger(runs)&&runs>=1&&runs<=250,'RUNS must be 1-250');
const dir=path.resolve(process.env.OUTPUT_DIR||'campaign-study-results');
fs.mkdirSync(dir,{recursive:true});
const outfile=path.join(dir,strategy+'.json');
const args=['tools/sim.js','--runs',String(runs),'--seed',String(seed),'--jobs',String(jobs),
 '--abil','--force','--env','STRATEGY='+strategy,'--env','LOOT_MODE=planned','--out',outfile,'--json'];
const proc=cp.spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:15*1024*1024,timeout:480000});
if(proc.stdout)console.log(proc.stdout.slice(-12000));
if(proc.stderr)console.error(proc.stderr.slice(-5000));
assert.equal(proc.status,0,'Simulation failed: '+(proc.error?.message||proc.stderr||''));
const raw=JSON.parse(fs.readFileSync(outfile,'utf8')).A;
assert.equal(raw.length,runs,'Missing campaign runs');
const failures=raw.filter(r=>r.err);
assert.equal(failures.length,0,'Campaign errors: '+failures.slice(0,2).map(x=>x.err));
const fights=raw.flatMap(r=>r.rec);
const overview={
 strategy,runs,seedStart:seed,seedEnd:seed+runs-1,
 fights:fights.length,battleWins:fights.filter(f=>f.res==='win').length,
 battleLosses:fights.filter(f=>f.res==='loss').length,
 escapes:fights.filter(f=>f.res==='escape').length,
 finalesReached:raw.filter(r=>r.rec.some(f=>f.fin)).length,
 finaleWins:raw.filter(r=>r.res.Fwin).length,
 setsCompleted:raw.reduce((n,r)=>n+(r.loot?.goalCompleted||0),0),
 setCrafts:raw.reduce((n,r)=>n+(r.loot?.setCrafts||0),0),
 majorCrafts:raw.reduce((n,r)=>n+(r.loot?.bigCrafts||0),0),
 stalls:raw.reduce((n,r)=>n+(r.stalls||0),0)
};
fs.writeFileSync(path.join(dir,strategy+'-overview.json'),JSON.stringify(overview,null,2));
console.log('COHORT '+JSON.stringify(overview));
console.log('PASS: '+runs+' complete campaign attempts for '+strategy+' with '+fights.length+' battles and no simulator errors');
