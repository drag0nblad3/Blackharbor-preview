#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve('villain-matchup-results');
const DATA=vm.runInNewContext(fs.readFileSync('data.js','utf8')+'\n({VILLAINS,VINTEL})');
const bosses=Object.keys(DATA.VILLAINS).filter(k=>k!=='mole');
const groups=['mixed','tech','magic','innate'];
const all=groups.flatMap(g=>{const file=path.join(dir,g+'.json');assert(fs.existsSync(file),'missing '+file);return JSON.parse(fs.readFileSync(file,'utf8')).rows});
const pct=(n,d)=>d?Math.round(1000*n/d)/10:0;
const mean=x=>x.length?x.reduce((s,n)=>s+n,0)/x.length:0;
const rnd=x=>Math.round(x*100)/100;
const bossSummaries=bosses.map(k=>{
 const rs=all.filter(r=>r.boss===k),f=rs.reduce((s,x)=>s+x.fights,0),w=rs.reduce((s,x)=>s+x.wins,0);
 const splits=Object.fromEntries(['early','middle','late'].map(stage=>{
  const z=rs.filter(x=>x.stage===stage);return [stage,{fights:z.reduce((s,x)=>s+x.fights,0),winPct:pct(z.reduce((s,x)=>s+x.wins,0),z.reduce((s,x)=>s+x.fights,0)),avgKOs:rnd(mean(z.map(x=>x.avgKOs)))}]}));
 const teams=Object.fromEntries(groups.map(g=>{const z=rs.filter(x=>x.group===g);return [g,{fights:z.reduce((s,x)=>s+x.fights,0),winPct:pct(z.reduce((s,x)=>s+x.wins,0),z.reduce((s,x)=>s+x.fights,0))}]}));
 return {key:k,name:DATA.VILLAINS[k].name,fights:f,wins:w,winPct:pct(w,f),avgKOs:rnd(mean(rs.map(x=>x.avgKOs))),avgRounds:rnd(mean(rs.map(x=>x.avgRounds))),stages:splits,teams};
}).sort((a,b)=>a.winPct-b.winPct);
function mechanics(k){
 const d=DATA.VILLAINS[k],cards=[...d.base,...d.adv.slice(0,3+(d.deckBonus||0))].map(id=>d.cards[id]);
 const byType=Object.fromEntries([...new Set(cards.map(c=>c.t))].map(t=>[t,cards.filter(c=>c.t===t).length]));
 const react=DATA.VINTEL[k]?.react||[];
 return {key:k,name:d.name,evasion:d.eva,toughness:d.toughness??d.tough,accuracy:d.acc,henchmanRange:d.hench.rng,elite:d.elite?.name||null,
  openingPlaybookCards:cards.length,openingCardTypes:byType,
  summonPages:cards.filter(c=>c.t==='summon').length,
  summonCountPerCycle:cards.filter(c=>c.t==='summon').reduce((s,c)=>s+c.k,0),
  composurePages:cards.filter(c=>c.t==='taunt'||c.t==='puppet').length,
  multiTargetPages:cards.filter(c=>['multi','beam','sweep'].includes(c.t)).length,
  delayedAreaPages:cards.filter(c=>['bomb','charge','leap'].includes(c.t)).length,
  moveOrHidePages:cards.filter(c=>['vanish','fade','leap','scatter','burrow'].includes(c.t)).length,
  reactionWoundDefense:react.some(r=>r.guard||r.tough>0),
  reactionDamage:react.some(r=>r.dmg||r.reflect),
  reactionSpawns:react.some(r=>r.summon),
  reactionEscape:react.some(r=>r.escape),
  reactions:react.map(r=>r.txt),
  hint:DATA.VINTEL[k]?.hints||[]
 };
}
const features=bosses.map(mechanics);
const rows=all;
const total={bosses:bosses.length,groups:groups.length,stages:3,seedTrials:rows[0]?.fights,totalFights:rows.reduce((n,r)=>n+r.fights,0)};
const output={total,bosses:bossSummaries,features,rows:rows.map(({reps,...row})=>row)};
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(output,null,2));
const table=(rows,keys)=>'| '+keys.map(([name])=>name).join(' | ')+' |\n| '+keys.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+keys.map(([_,value])=>typeof value==='function'?value(r):(r[value]??'')).join(' | ')+' |').join('\n')+'\n';
const report=['# Fixed-team boss encounter mechanics study','',`${total.totalFights} matched-scenario battles at three equalized stages, across mixed, tech, magic, and innate hero teams.`,'',
 '## Important limitations','',
 'All runs use the same loadout-generation algorithm and seeded tactical bot, with identical team ranks, gear supply, issue, villain level, and normal investigation quality within a group and tier. Boss identity, terrain, playbook, reactions, and minion properties vary. These are fixed-fixture encounter tests, not full-campaign balance rates. The teams are not guaranteed to represent optimal human play.',
 '',
 '## Combined boss encounter difficulty','',
 table(bossSummaries,[['Boss','name'],['Fights','fights'],['Win %','winPct'],['Avg KOs','avgKOs'],['Avg rounds','avgRounds'],['Early win %',x=>x.stages.early.winPct],['Mid win %',x=>x.stages.middle.winPct],['Late win %',x=>x.stages.late.winPct]]),
 '## Boss-specific build interactions','',
 table(bossSummaries,[['Boss','name'],['Mixed win %',x=>x.teams.mixed.winPct],['Tech win %',x=>x.teams.tech.winPct],['Magic win %',x=>x.teams.magic.winPct],['Innate win %',x=>x.teams.innate.winPct]]),
 '## Mechanic differences','',
 table(features,[['Boss','name'],['Evasion','evasion'],['Toughness','toughness'],['Ranged hench','henchmanRange'],['Summon pages','summonPages'],['Total summons/cycle','summonCountPerCycle'],['Composure pages','composurePages'],['Multi/AoE pages','multiTargetPages'],['Delayed area pages','delayedAreaPages'],['Reaction defense','reactionWoundDefense'],['Reaction escape','reactionEscape']]),
 '## Notes','',
 'Card counts above use the opening-level playbook (base plus initial advances), not every higher-level card. A villain may have additional level-up capabilities. Read summary.json for each boss reaction and its full card feature list. These outputs provide testable explanations, not proof of causation.',
 ''];
fs.writeFileSync(path.join(dir,'REPORT.md'),report.join('\n'));
console.log('MATCHUP_SUMMARY '+JSON.stringify({total,bosses:bossSummaries.map(x=>({key:x.key,n:x.fights,winPct:x.winPct,avgKOs:x.avgKOs,avgRounds:x.avgRounds,
early:x.stages.early.winPct,mid:x.stages.middle.winPct,late:x.stages.late.winPct,team:x.teams})),features:features.map(({key,evasion,toughness,henchmanRange,summonCountPerCycle,composurePages,multiTargetPages,delayedAreaPages,reactionWoundDefense,reactionEscape})=>({key,evasion,toughness,henchmanRange,summonCountPerCycle,composurePages,multiTargetPages,delayedAreaPages,reactionWoundDefense,reactionEscape}))}));
console.log('PASS: '+total.totalFights+' fixed-team battles aggregated across '+total.bosses+' villains');
