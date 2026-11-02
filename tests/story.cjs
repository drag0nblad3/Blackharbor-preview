#!/usr/bin/env node
// Campaign storyline (2026-11-02): story pages, the reserved mastermind, teases, Mole Boy evidence and the hidden finale reveal.
const assert=require('node:assert/strict');
const bh=require('../tools/bh');
const J=(g,e)=>JSON.parse(JSON.stringify(g.get(e)));
const starters=['bulwark','volt','lynx','wisp'];
for(let seed=1;seed<=6;seed++){
 const g=bh.load({seed});g.run('newCampaign(); S.tut=null; S.tutDone=true');
 assert.deepEqual(J(g,'S.story.q.map(x=>x.id)'),['assemble'],'New volume opens on the Assemble page');
 assert.match(g.get('bodyMain()'),/Mole Boy cold/,'Opening line recalls beating Mole Boy when the tutorial was skipped');
 g.run('ACT.storynext()');
 starters.forEach(k=>g.run('recruitQuick('+JSON.stringify(k)+')'));
 const mm=g.get('S.mastermind'),vs=J(g,'S.villains.map(v=>v.key)');
 assert(mm&&!vs.includes(mm)&&!g.get('S.pool').includes(mm),'Mastermind reserved and out of the pool');
 assert.deepEqual(J(g,'S.story.q.map(x=>x.id)'),['rumors']);
 assert.equal(g.get('S.story.q[0].lines.length'),3,'One rumor per opening villain');
 g.run('ACT.storynext()');
 // first lair fight of Arc 1 leaves a tunnel
 const k=vs[0];g.run(`var L0=['x'];finishIssue(L0,{hunted:'${k}',headline:'Victory!',vkey:'${k}'})`);
 assert(g.get('L0.some(l=>/fresh tunnel/.test(l))'),'Tunnel evidence after the first lair fight');
 g.run("ACT.next()");
 // jump to the end of Arc 1 and into Arc 2
 g.run(`S.issue=6;S.villains.forEach(v=>v.status='active');var L1=['x'];finishIssue(L1,{hunted:'${k}',headline:'Victory!',vkey:'${k}'});ACT.next()`);
 assert.equal(g.get('S.phase'),'arc');
 assert.equal(g.get('S.story.q[0].id'),'arc2');
 assert(g.get('S.story.q[0].lines.length')>=3,'Every active villain teases the backer in Arc 2');
 assert.match(g.get('bodyMain()'),/Tremors/);
 g.run('ACT.storynext()');assert.match(g.get('bodyMain()'),/Arc 2 begins/);
 // Grit evidence from issue 10
 g.run(`ACT.arcnext&&ACT.arcnext();S.issue=10;var L2=['x'];finishIssue(L2,{hunted:'${k}',headline:'Victory!',vkey:'${k}'})`);
 assert(g.get('L2.some(l=>/Grit/.test(l))'),'Grit evidence from issue 10');
 // finale: mastermind + Mole Boy, both hidden until the reveal pages
 g.run(`ACT.next();S.arcInfo=null;S.issue=18;var L3=['x'];finishIssue(L3,{hunted:'${k}',headline:'Victory!',vkey:'${k}'});ACT.next()`);
 assert.equal(g.get('S.phase'),'event');
 assert.deepEqual(J(g,'S.event.keys'),[mm,'mole'],'Finale is the mastermind and Mole Boy');
 const ev=g.get('bodyMain()');
 assert(!ev.includes(g.get(`VILLAINS['${mm}'].name`))&&!ev.includes('Mole Boy'),'Finale card hides both identities');
 g.run("ACT.finale('rally')");
 assert.deepEqual(J(g,'S.story.q.map(x=>x.id)'),['revealMole','revealMaster']);
 assert.match(g.get('bodyMain()'),/organized EVERYTHING/i);
 g.run('ACT.storynext()');
 assert(g.get('bodyMain()').includes(g.get(`VILLAINS['${mm}'].name`)),'Mastermind revealed on the last page');
 g.run('ACT.storynext()');
 assert.equal(g.get('S.phase'),'sd');assert(g.get('S.sd.finale'));
}
// story off: no pages, no teases, the finale starts straight away
{const g=bh.load({seed:9});g.run('newCampaign(); S.tut=null; S.tutDone=true; S.storyOff=true');
 starters.forEach(k=>g.run('recruitQuick('+JSON.stringify(k)+')'));
 assert(!g.get('storyShowing()'));const k=g.get('S.villains[0].key');
 g.run(`var L=['x'];finishIssue(L,{hunted:'${k}',headline:'Victory!',vkey:'${k}'})`);
 assert(!g.get('L.some(l=>/tunnel/.test(l))'));
 assert(g.get('!!S.mastermind'),'Mastermind is still reserved with story off');}
// old save: storyLoad adds an empty story and reserves a mastermind from the pool
{const g=bh.load({seed:11});g.run('newCampaign(); S.tut=null; S.tutDone=true');starters.forEach(k=>g.run('recruitQuick('+JSON.stringify(k)+')'));
 g.run('S.pool.push(S.mastermind);delete S.mastermind;delete S.story;storyLoad()');
 assert(g.get('!!S.mastermind&&!S.pool.includes(S.mastermind)&&S.story.q.length===0'));}
console.log('PASS: story pages, mastermind reserve, teases, evidence, hidden finale reveal, story toggle and old-save migration.');
