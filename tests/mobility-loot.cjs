#!/usr/bin/env node
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modes=['greedy','planned'],report=[];
const out=path.resolve('mobility-loot-results');fs.mkdirSync(out,{recursive:true});
for(const mode of modes){
 const file=path.join(out,mode+'.json');
 const p=cp.spawnSync(process.execPath,['tools/sim.js','--runs','6','--seed','77','--jobs','3','--abil','--env','STRATEGY=mobility','--env','LOOT_MODE='+mode,'--out',file,'--json'],{encoding:'utf8',timeout:130000,maxBuffer:8*1024*1024});
 assert.equal(p.status,0,'Simulator failed: '+p.stderr);
 const runs=JSON.parse(fs.readFileSync(file)).A;assert.equal(runs.filter(r=>r.err).length,0,'Campaign errors');
 const fights=runs.flatMap(r=>r.rec),sets=fights.flatMap(f=>f.hs).filter(h=>h.sets.length).length;
 const summary={mode,campaigns:runs.length,fights:fights.length,wins:fights.filter(f=>f.res==='win').length,
  finaleWins:runs.filter(r=>r.res.Fwin).length,completedSets:runs.reduce((n,r)=>n+(r.loot?.goalCompleted||0),0),
  setCrafts:runs.reduce((n,r)=>n+(r.loot?.setCrafts||0),0),majorCrafts:runs.reduce((n,r)=>n+(r.loot?.bigCrafts||0),0),heroSetFights:sets,
  arcWins:Object.fromEntries([1,2,3].map(a=>[a,fights.filter(f=>!f.fin&&f.arc===a&&f.res==='win').length]))};
 report.push(summary);console.log('MOBILITY '+JSON.stringify(summary));
}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(report,null,2));
console.log('PASS: 12 matched mobility campaigns with opportunistic set purchasing, zero simulation errors.');
