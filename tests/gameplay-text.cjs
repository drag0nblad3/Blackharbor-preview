#!/usr/bin/env node
const assert=require('node:assert/strict');
const bh=require('../tools/bh');
const g=bh.load({seed:17});
const get=e=>g.get(e),run=e=>g.run(e);
const d=JSON.parse(JSON.stringify(get('VINTEL')));
const glossary=JSON.parse(JSON.stringify(get('GLOSS')));
assert.match(glossary.henchman[1],/1 HP/);
assert.match(glossary.henchman[1],/Cantor/);
assert.match(glossary.elite[1],/Bombardier/);
assert.match(glossary.elite[1],/his bodyguard/);
assert.match(glossary.bomb[1],/19 hexes/);
assert.match(glossary.bomb[1],/next villain turn/);
assert.match(glossary.bomb[1],/not Payload/);
assert(d.cantor.hints.some(x=>x.includes('Crowd Control')&&x.includes('1 HP')));
assert(d.cantor.hints.some(x=>x.includes('Leverage')&&x.includes('Composure')));
assert(d.gallows.hints.some(x=>x.includes('2 hexes')));
assert(d.bomber.hints.some(x=>x.includes('Bait and Switch')));
for(const lv of [1,3,4,5,6]){
 for(const id of ['over','lit','twin','carpet','cluster','dms']){
   const c=JSON.parse(JSON.stringify(get("buildCard('bomber',{id:'"+id+"',mk:0},"+lv+")")));
   assert.equal(c.fuse,1,id+' fuse must be 1 at level '+lv);
   assert.match(c.txt,/next villain turn/);
   if(c.radius===2)assert.match(c.txt,/19 hexes/);
   else assert.match(c.txt,/7.hex|7 hexes/);
 }
}
const cantor=JSON.parse(JSON.stringify(get("buildCard('cantor',{id:'crowd',mk:0},3)")));
assert.equal(cantor.t,'henchvolley');
assert.match(cantor.txt,/hired gun/);
assert.match(cantor.txt,/without moving/);
const lev=JSON.parse(JSON.stringify(get("buildCard('cantor',{id:'lev',mk:0},3)")));
assert.match(lev.txt,/Composure/);
assert.doesNotMatch(lev.txt,/2 damage/);
const tips=JSON.parse(JSON.stringify(get('TIPS.map(x=>({id:x.id,t:x.t}))')));
assert(tips.some(t=>t.id==='cantorGuns'));
assert(tips.some(t=>t.id==='bomber'));
run("newCampaign();S.tut=null;S.guide=null;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('bomber',6)];S.pool=[];S.inv={v:'bomber',clues:3};startShowdown();S.sd.intro=false;S.sd.bombs=[]");
run("dropBomb(4,4,1,3,2)");
const clue=get("cellTip(4,4)");
assert.match(JSON.stringify(clue),/19.hex/);
assert.match(JSON.stringify(clue),/next villain turn/);
console.log('PASS: glossary, case-file hints, tutorials, on-board tooltips and playbook cards match revised Cantor/Gallows/Payload mechanics.');
