#!/usr/bin/env node
// Aggregate nine completed large-sample campaign cohorts. Produces raw-data
// references, descriptive boss/gear/discipline analysis, and a readable report.
// Win-rate contrasts control for strategy and campaign arc, but are NOT causal.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const strategies=['balanced','assault','fortress','mobility','support','specialist','techOnly','magicOnly','innateOnly'];
const dir=path.resolve(process.env.OUTPUT_DIR||'campaign-study-results');
const D=vm.runInNewContext(fs.readFileSync('data.js','utf8')+'\n({GEAR,VILLAINS,SETS})');
const {GEAR,VILLAINS,SETS}=D;
const mean=xs=>xs.length?xs.reduce((s,n)=>s+n,0)/xs.length:0;
const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
const rnd=n=>Math.round(n*10)/10;
const summarize=fs.existsSync(path.join(dir,'summary.json'))?JSON.parse(fs.readFileSync(path.join(dir,'summary.json'))):null;
const data={};
for(const strategy of strategies){
 const file=path.join(dir,strategy+'.json');
 assert(fs.existsSync(file),'Missing cohort '+strategy);
 data[strategy]=JSON.parse(fs.readFileSync(file,'utf8')).A;
 assert(data[strategy].length>0,'Empty cohort '+strategy);
 assert(data[strategy].every(r=>!r.err),'Simulator errors in '+strategy);
}
const all=strategies.flatMap(strategy=>data[strategy].map(r=>({...r,strategy})));
const fights=all.flatMap(r=>r.rec.map(f=>({...f,strategy:r.strategy,seed:r.seed,stage:f.fin?4:f.arc})));
const n=all.length;
const stageName={1:'Arc 1',2:'Arc 2',3:'Arc 3',4:'Finale'};
const stratum=f=>f.strategy+'|'+f.stage;
const strata=new Map();
for(const f of fights){
 const k=stratum(f);if(!strata.has(k))strata.set(k,[]);
 strata.get(k).push(f);
}
const baseRates=Object.fromEntries([...strata.entries()].map(([k,fs])=>[k,mean(fs.map(f=>f.res==='win'?1:0))]));
const finishWins=rs=>rs.filter(r=>r.res.Fwin).length;
const win=f=>f.res==='win'?1:0;
const sum=(xs,key)=>xs.reduce((a,x)=>a+(key?x[key]||0:x),0);
const metrics=fs=>({fights:fs.length,wins:sum(fs.map(win)),winPct:pct(sum(fs.map(win)),fs.length),
 avgRounds:rnd(mean(fs.map(f=>f.rounds))),avgKOs:rnd(mean(fs.map(f=>f.ko))),avgHpLost:rnd(mean(fs.map(f=>f.hpLost))),
 avgAbilities:rnd(mean(fs.map(f=>f.ab||0))),avgPowers:rnd(mean(fs.map(f=>f.pw||0))),
 escapes:fs.filter(f=>f.res==='escape').length,stalls:fs.filter(f=>f.res==='stall'||f.rounds>=40).length});
const cohorts=strategies.map(strategy=>{
 const rs=data[strategy],fs=fights.filter(f=>f.strategy===strategy);
 const a={strategy,campaigns:rs.length,finalesReached:rs.filter(r=>r.rec.some(f=>f.fin)).length,
 finaleWins:finishWins(rs),earlyEnd:rs.filter(r=>!r.rec.some(f=>f.fin)).length,
 setsCompleted:sum(rs.map(r=>r.loot?.goalCompleted||0)),
 bossGearCrafts:sum(rs.map(r=>r.loot?.setCrafts||0)),
 majorGearCrafts:sum(rs.map(r=>r.loot?.bigCrafts||0)),
 ...metrics(fs)};
 for(const stage of [1,2,3,4])a['stage'+stage]=metrics(fs.filter(f=>f.stage===stage));
 return a;
});
const stages=[1,2,3,4].map(stage=>({stage:stageName[stage],...metrics(fights.filter(f=>f.stage===stage))}));
const bosses=Object.entries(VILLAINS).filter(([k])=>k!=='mole').map(([key,v])=>{
 const fs=fights.filter(f=>!f.fin&&f.vs.some(x=>x.k===key));
 const actual=sum(fs.map(win));
 const expected=fs.reduce((n,f)=>n+baseRates[stratum(f)],0);
 const level=mean(fs.flatMap(f=>f.vs.filter(x=>x.k===key).map(x=>x.lv)));
 const arc={};for(const a of [1,2,3])arc['arc'+a]=metrics(fs.filter(f=>f.arc===a));
 return {boss:key,name:v.name,avgEnemyLevel:rnd(level),...metrics(fs),
 expectedWins:rnd(expected),adjustedWinGapPp:rnd(pct(actual-expected,fs.length)),...arc};
}).sort((a,b)=>a.adjustedWinGapPp-b.adjustedWinGapPp);
const gearKeys=Object.keys(GEAR).filter(k=>!GEAR[k].cons);
const gear=[];
for(const id of gearKeys){
 const wearing=fights.filter(f=>f.hs.some(h=>h.gear.includes(id))),count=wearing.length;
 if(!count)continue;
 const matches=[];
 for(const [key,fs] of strata){
  const yes=fs.filter(f=>f.hs.some(h=>h.gear.includes(id))),no=fs.filter(f=>!f.hs.some(h=>h.gear.includes(id)));
  if(yes.length>=5&&no.length>=5)matches.push({key,yes:yes.length,no:no.length,delta:mean(yes.map(win))-mean(no.map(win))});
 }
 const comparisonN=sum(matches.map(m=>m.yes));
 const adjustedDelta=comparisonN?rnd(matches.reduce((s,m)=>s+m.delta*m.yes,0)/comparisonN*100):null;
 gear.push({id,name:GEAR[id].name,discipline:GEAR[id].type,rank:GEAR[id].req,boss:GEAR[id].set||null,
 fightsEquipped:count,heroAppearances:sum(wearing.map(f=>f.hs.reduce((n,h)=>n+h.gear.filter(k=>k===id).length,0))),
 winPct:pct(sum(wearing.map(win)),count),avgArc:rnd(mean(wearing.map(f=>f.stage))),
 controlledComparisonFights:comparisonN,comparisonStrata:matches.length,matchedWinDeltaPp:adjustedDelta});
}
gear.sort((a,b)=>b.fightsEquipped-a.fightsEquipped);
const sets=Object.keys(SETS).map(k=>{
 const fs=fights.filter(f=>f.hs.some(h=>h.sets.includes(k)));
 const across=fights.filter(f=>f.hs.some(h=>h.sets.length));
 return {boss:k,name:SETS[k].n,activeHeroFightSnapshots:sum(fs.map(f=>f.hs.filter(h=>h.sets.includes(k)).length)),
 fightAppearances:fs.length,winPct:pct(sum(fs.map(win)),fs.length),avgArc:rnd(mean(fs.map(f=>f.stage)))};
}).sort((a,b)=>b.fightAppearances-a.fightAppearances);
const disciplines=['tech','magic','innate'].map(k=>{
 const heroSnapshots=fights.flatMap(f=>f.hs.map(h=>({f,h})));
 const owned=heroSnapshots.filter(x=>x.h.ranks[k]>0);
 const byStage=[1,2,3,4].map(a=>{
  const hs=heroSnapshots.filter(x=>x.f.stage===a),active=hs.filter(x=>x.h.ranks[k]>0);
  return {stage:stageName[a],shareOfHeroAppearances:pct(active.length,hs.length),avgRankWhenPresent:rnd(mean(active.map(x=>x.h.ranks[k])))};
 });
 return {discipline:k,heroFightAppearances:owned.length,shareOfAllHeroAppearances:pct(owned.length,heroSnapshots.length),
 avgRank:rnd(mean(owned.map(x=>x.h.ranks[k]))),byStage};
});
const tierStats=[1,2,3,4,5].map(rank=>{
 const instances=fights.flatMap(f=>f.hs.flatMap(h=>h.gear.filter(k=>GEAR[k]?.req===rank).map(k=>({f,k}))));
 return {rank,heroGearAppearances:instances.length,distinctItems:new Set(instances.map(x=>x.k)).size};
});
const total={campaigns:n,fights:fights.length,finaleReached:all.filter(r=>r.rec.some(f=>f.fin)).length,
 finaleWins:finishWins(all),earlyEnd:all.filter(r=>!r.rec.some(f=>f.fin)).length,
 wins:sum(fights.map(win)),losses:fights.filter(f=>f.res==='loss').length,escapes:fights.filter(f=>f.res==='escape').length,
 ...metrics(fights),setsCompleted:sum(all.map(r=>r.loot?.goalCompleted||0)),
 setCrafts:sum(all.map(r=>r.loot?.setCrafts||0)),
 majorCrafts:sum(all.map(r=>r.loot?.bigCrafts||0))};
const summary={method:'Current preview, current planned-loot bot, adaptive boss selection; 60 seeded campaigns per build. Descriptive associations, not randomized equipment or boss experiments.',
 seedRanges:strategies.map(s=>({strategy:s,first:data[s][0].seed,last:data[s][data[s].length-1].seed})),
 total,stages,cohorts,bosses,gear,sets,disciplines,tierStats};
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));
function csv(name,rows,keys){
 fs.writeFileSync(path.join(dir,name),[keys.join(','),...rows.map(row=>keys.map(k=>JSON.stringify(row[k]??'')).join(','))].join('\n')+'\n');
}
csv('cohorts.csv',cohorts,['strategy','campaigns','fights','wins','winPct','avgRounds','avgKOs','finalesReached','finaleWins','earlyEnd','setsCompleted','bossGearCrafts','majorGearCrafts']);
csv('bosses.csv',bosses,['name','boss','fights','wins','winPct','avgEnemyLevel','avgRounds','avgKOs','avgHpLost','adjustedWinGapPp']);
csv('gear.csv',gear,['name','id','discipline','rank','boss','fightsEquipped','heroAppearances','winPct','controlledComparisonFights','comparisonStrata','matchedWinDeltaPp']);
csv('sets.csv',sets,['name','boss','activeHeroFightSnapshots','fightAppearances','winPct','avgArc']);
csv('discipline.csv',disciplines,['discipline','heroFightAppearances','shareOfAllHeroAppearances','avgRank']);
const table=(rows,columns)=>'| '+columns.map(c=>c[0]).join(' | ')+' |\n| '+columns.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+columns.map(c=>String(typeof c[1]==='function'?c[1](r):r[c[1]]??'')).join(' | ')+' |').join('\n')+'\n';
const parts=[];
parts.push('# Blackharbor — Large-Cohort Campaign Balance Study','');
parts.push('## Design and limitations','');
parts.push('- **'+total.campaigns+'** full campaign attempts, **'+total.fights+'** battles across nine hero build strategies; all use the current planned-loot bot and adaptive boss selection.');
parts.push('- 60 independently seeded campaigns per strategy, using the same seeds across strategies. The automated tactical player is not an expert human player.');
parts.push('- Boss comparisons are standardized against the same build and campaign arc. They remain **observational** because the choice of boss, loot, and player progression are linked.');
parts.push('- Gear associations compare win rates with and without an item **within build and arc**, using only cells with at least five encounters in both groups. They are **not causal item effects**.');
parts.push('');
parts.push('## Overall difficulty','');
parts.push('Finale victories: **'+total.finaleWins+'/'+total.campaigns+' ('+pct(total.finaleWins,total.campaigns)+'%)**; finale reached: **'+total.finaleReached+'/'+total.campaigns+'**; campaigns ended before the finale: **'+total.earlyEnd+'**.');
parts.push('');
parts.push(table(stages,[['Stage','stage'],['Fights','fights'],['Win %','winPct'],['Avg rounds','avgRounds'],['Avg KOs','avgKOs'],['Avg HP lost','avgHpLost'],['40-round caps','stalls']]));
parts.push('## Build and discipline balance','');
parts.push(table(cohorts,[['Strategy','strategy'],['Battles','fights'],['Win %','winPct'],['Finales won','finaleWins'],['Finales reached','finalesReached'],['Avg KOs','avgKOs'],['Sets completed','setsCompleted'],['Rank 3+ crafts','majorGearCrafts']]));
parts.push('Hero discipline rank exposure by build is available in summary.json; base discipline snapshots:');
parts.push(table(disciplines,[['Discipline','discipline'],['Hero-fight snapshots','heroFightAppearances'],['% with rank','shareOfAllHeroAppearances'],['Avg rank when present','avgRank']]));
parts.push('## Boss difficulty (non-finale)','');
parts.push('Negative adjusted win gaps indicate harder encounters versus the study baseline for the same strategy and arc; positive gaps indicate easier encounters. Villain levels and loot availability may still confound these gaps.');
parts.push('');
parts.push(table(bosses,[['Boss','name'],['N fights','fights'],['Win %','winPct'],['Avg level','avgEnemyLevel'],['Avg rounds','avgRounds'],['Avg KOs','avgKOs'],['Adj. win gap (pp)','adjustedWinGapPp']]));
parts.push('## Gear prevalence and balance signals','');
parts.push('Exposure is measured by fights with the item equipped by at least one party member. Match-adjusted comparisons are signals worth testing in isolation, not evidence an item causes a win or loss.');
parts.push('');
parts.push(table(gear.filter(g=>g.fightsEquipped>=80).slice(0,30),[['Gear','name'],['Discipline','discipline'],['Tier','rank'],['N equipped fights','fightsEquipped'],['Win %','winPct'],['Matched gap (pp)',g=>g.matchedWinDeltaPp??'insufficient control']]));
const candidates=gear.filter(g=>g.fightsEquipped>=100&&g.controlledComparisonFights>=60&&g.comparisonStrata>=3);
parts.push('### Large-sample associations worth targeted testing','');
parts.push('Positive associations:');
parts.push(table([...candidates].sort((a,b)=>b.matchedWinDeltaPp-a.matchedWinDeltaPp).slice(0,12),[['Gear','name'],['N exposed','fightsEquipped'],['Matched N','controlledComparisonFights'],['Gap (pp)','matchedWinDeltaPp']]));
parts.push('Negative associations:');
parts.push(table([...candidates].sort((a,b)=>a.matchedWinDeltaPp-b.matchedWinDeltaPp).slice(0,12),[['Gear','name'],['N exposed','fightsEquipped'],['Matched N','controlledComparisonFights'],['Gap (pp)','matchedWinDeltaPp']]));
parts.push('### Equipment sets and crafting','');
parts.push('Total completed set goals: **'+total.setsCompleted+'**; boss-item crafts: **'+total.setCrafts+'**; rank-3+ item crafts: **'+total.majorCrafts+'**.');
parts.push(table(sets.filter(x=>x.fightAppearances),[['Set','name'],['Fights active','fightAppearances'],['Hero appearances','activeHeroFightSnapshots'],['Win %','winPct']]));
parts.push('By item tier:');
parts.push(table(tierStats,[['Tier','rank'],['Hero-item battle appearances','heroGearAppearances'],['Distinct equipped items','distinctItems']]));
parts.push('## Recommended follow-up','');
parts.push('Inspect high-KO or low-win bosses within their arc and by build, test flagged gear individually under fixed enemy encounters, and run a small matched boss-slate experiment before changing drop rates or boss stats.');
fs.writeFileSync(path.join(dir,'REPORT.md'),parts.join('\n')+'\n');
const emit={
 total,stages,
 cohorts:cohorts.map(c=>({strategy:c.strategy,winPct:c.winPct,fights:c.fights,finaleWins:c.finaleWins,finalesReached:c.finalesReached,avgKOs:c.avgKOs})),
 bosses:bosses.map(b=>({boss:b.boss,n:b.fights,winPct:b.winPct,adjPp:b.adjustedWinGapPp,ko:b.avgKOs,rounds:b.avgRounds,arc1:b.arc1.fights,arc2:b.arc2.fights,arc3:b.arc3.fights})),
 sets:sets.map(s=>({boss:s.boss,active:s.fightAppearances})),
 gearHigh: [...candidates].sort((a,b)=>b.matchedWinDeltaPp-a.matchedWinDeltaPp).slice(0,8).map(g=>({id:g.id,n:g.fightsEquipped,matchedN:g.controlledComparisonFights,gap:g.matchedWinDeltaPp})),
 gearLow: [...candidates].sort((a,b)=>a.matchedWinDeltaPp-b.matchedWinDeltaPp).slice(0,8).map(g=>({id:g.id,n:g.fightsEquipped,matchedN:g.controlledComparisonFights,gap:g.matchedWinDeltaPp})),
 disciplines,tierStats};
console.log('STUDY_SUMMARY '+JSON.stringify(emit));
console.log('PASS: aggregate report, CSV exports, nine complete cohort datasets and all '+total.campaigns+' campaigns.');
