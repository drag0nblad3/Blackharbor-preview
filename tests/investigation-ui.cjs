#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bh=require('../tools/bh');
const g=bh.load({seed:214});
const run=x=>g.run(x),view=()=>g.get('invView()');

run("newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('cantor',2)];S.pool=[];startInv('cantor')");
let html=view();
assert.match(html,/class="inv-ui"/,'uses scoped investigation frame');
assert.match(html,/THE CASEBOARD/);
assert.match(html,/The Cantor/);
assert.match(html,/data-a="invgo"/,'intro CTA retained');
assert.match(html,/Read known playbook/,'known playbook remains accessible');
assert.match(html,/Field team/);
assert.match(html,/Unopened/,'unvisited leads stay sealed');
assert.match(html,/Pages known/);
assert.match(html,/Reactions known/);
assert.doesNotMatch(html,/data-a="invopt:0"/,'choices hidden until starting investigation');

run("S.inv.intro=false");
html=view();
assert.match(html,/Lead 1 of 3/);
assert.match(html,/data-a="invopt:0"/,'lead choices retained');
assert.match(html,/inv-choices/,'choices use compact decision cards');
assert.match(html,/Unknown lead/,'future lead titles remain hidden');
assert.match(html,/Showdown outlook/);
assert.match(html,/0–1 Ambush/,'default ethos threshold is accurate');

run("S.inv.res='Rolled 15. A clue was found.';S.inv.clues=2;intelSync()");
html=view();
assert.match(html,/Investigation result/);
assert.match(html,/Rolled 15/);
assert.match(html,/data-a="invnext"/);
assert.doesNotMatch(html,/data-a="invopt:0"/,'resolved leads no longer offer actions');

run("S.inv.step=2;S.inv.res=null");
html=view();
assert.match(html,/Lead 3 of 3/);
assert.match(html,/data-a="invopt:0"/);

run("S.inv.step=3;S.inv.clues=4");
html=view();
assert.match(html,/LAIR LOCATED/);
assert.match(html,/Prepared!/);
assert.match(html,/data-a="lair"/);
assert.match(html,/Gear up before|Adjust gear before/,'prepared investigations allow gear changes');

run("S.inv.clues=0");
html=view();
assert.match(html,/Ambush!/);
assert.doesNotMatch(html,/data-cid="gearup"/,'ambush does not unlock prepared gear swap');
assert.match(html,/data-a="lair"/);

const base=path.resolve(__dirname,'..');
assert.match(fs.readFileSync(path.join(base,'index.html'),'utf8'),/href="css\/investigation.css"/);
const css=fs.readFileSync(path.join(base,'css/investigation.css'),'utf8');
assert.match(css,/\.inv-grid/);
assert.match(css,/@media \(max-width:460px\)/);
assert.match(css,/prefers-reduced-motion/);
console.log('PASS: Investigation intro, live leads, choices, discoveries, prepared/ambush outcomes and responsive stylesheet.');
