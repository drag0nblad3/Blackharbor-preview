#!/usr/bin/env node
// Opening villains and later additions must account for the party's discipline
// ranks and existing boss-specific loot, without breaking normal campaigns.
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const bh=require('../tools/bh');

function game(seed){return bh.load({seed})}
const evalAs=(g,expression)=>JSON.parse(JSON.stringify(g.get(expression)));
const starters=['bulwark','volt','lynx','wisp'];
for(let seed=1;seed<=12;seed++){
 const g=game(seed);g.run('newCampaign(); S.tut=null; S.tutDone=true');
 assert.equal(g.get('S.villains.length'),0,'New campaigns must reveal no bosses before recruitment');
 assert.equal(g.get('S.pool.length'),11,'All eleven non-tutorial bosses remain available');
 assert.match(g.get("hqView('villains')"),/Recruit four heroes/);
 for(let i=0;i<3;i++){
  g.run('recruitQuick('+JSON.stringify(starters[i])+')');
  assert.equal(g.get('S.villains.length'),0,'Opening bosses revealed too early with '+(i+1)+' recruits');
 }
 g.run('recruitQuick('+JSON.stringify(starters[3])+')');
 const selected=evalAs(g,'S.villains.map(x=>x.key)');
 assert.equal(selected.length,3,'Fourth recruit should reveal exactly three villains');
 assert.equal(new Set(selected).size,3,'Duplicate opening boss');
 assert.equal(g.get('S.pool.length'),8);
 assert.equal(g.get("S.villains.filter(v=>v.scheme===1).length"),1,'Exactly one opening boss should start scheming');
 g.run('revealStartingVillains()');
 assert.deepEqual(evalAs(g,'S.villains.map(x=>x.key)'),selected,'Opening bosses should not reroll');

 // Later introductions choose randomly among the top three gear-fit candidates.
 g.run("roster().forEach(h=>{if(h.ranks.tech)h.ranks.tech=3;if(h.ranks.magic)h.ranks.magic=2;if(h.ranks.innate)h.ranks.innate=4})");
 const top=evalAs(g,'bossSelectionScores().sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.key)');
 const next=g.run('introduceVillain(2,[]).key');
 assert(top.includes(next),'New villain must come from the top three fit scores');
 assert(!selected.includes(next),'Introduced boss must be new');
 assert.equal(g.get('S.pool.length'),7);
 while(g.get('S.pool.length')>0)g.run('introduceVillain(3,[])');
 const all=evalAs(g,'S.villains.map(x=>x.key)');
 assert.equal(all.length,11);
 assert.equal(new Set(all).size,11);
}

// Pure discipline teams should favor bosses with matching gear.
const examples=[
 {track:'tech',good:['gallows','lode','bomber'],bad:['cantor','quarry']},
 {track:'magic',good:['cantor','helios','grid'],bad:['gallows','quarry']},
 {track:'innate',good:['quarry','swarm','serpent'],bad:['gallows','cantor']}
];
for(const [i,s] of examples.entries()){
 const g=game(70+i);g.run('newCampaign();S.tut=null');
 g.run('S.heroes=Array.from({length:4},(_,i)=>newHero('+JSON.stringify(s.track==='tech'?'volt':s.track==='magic'?'wisp':'bulwark')+'));S.party=S.heroes.map(h=>h.id)');
 const scores=evalAs(g,'bossSelectionScores()');
 const value=k=>scores.find(s=>s.key===k)?.score||0;
 assert(Math.max(...s.good.map(value))>Math.max(...s.bad.map(value)),s.track+' party should prefer matching loot');
 // The presence of a matching boss should reduce the need for another same-slot offering.
 const chosen=s.good[0],other=s.good[1],before=value(other);
 g.run("S.villains.push(makeVillain("+JSON.stringify(chosen)+",1))");
 const after=evalAs(g,'bossSelectionScores()').find(x=>x.key===other)?.score;
 assert(after<before,'Existing '+chosen+' loot should reduce demand for '+other);
}
console.log('PASS: deferred boss reveal, gear-fit shortlist, complementary loot coverage, unique full boss pool, 12 random seeds, and mono-discipline preference checks.');

if(process.env.CAMPAIGN_SMOKE==='1'){
 for(const strategy of ['balanced','specialist','techOnly','magicOnly','innateOnly']){
  const p=cp.spawnSync(process.execPath,['tools/sim.js','--runs','2','--seed','77','--jobs','2','--abil','--env','STRATEGY='+strategy,'--json'],{encoding:'utf8',timeout:150000,maxBuffer:5*1024*1024});
  assert.equal(p.status,0,'Campaign process failed for '+strategy+': '+p.stderr);
  const summary=JSON.parse(p.stdout.split('\n').find(l=>l.startsWith('{"set":"A"')));
  assert.equal(summary.errs,0,strategy+' campaign errors: '+summary.err);
  assert.equal(summary.runs,2);
  assert(summary.fights>=2,strategy+' campaigns should attempt battles');
  console.log('CAMPAIGN '+strategy+': '+summary.fights+' battles, '+summary.finaleWins+' finale wins, '+summary.errs+' errors');
 }
 console.log('PASS: full-campaign smoke tests completed with dynamic boss selection.');
}
