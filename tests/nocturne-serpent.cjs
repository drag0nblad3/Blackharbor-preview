const assert=require('node:assert/strict'),bh=require('../tools/bh');
const g=bh.load({seed:303}),run=s=>g.run(s),get=s=>JSON.parse(JSON.stringify(g.get(s)));
g.ctx.setTimeout=fn=>setImmediate(fn);
run('render=()=>{bossObserve()};fx=()=>{};');
function setup(k){run(`newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['hexen','volt','wisp','bulwark'].map(k=>newHero(k));S.party=S.heroes.map(h=>h.id);S.facilities=[];S.villains=[makeVillain('${k}',2)];S.pool=[];S.inv={v:'${k}',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.haz=[];S.sd.hench=[];S.sd.civs=[];S.sd.term=null;S.sd.bombs=[];S.sd.beams=[];S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8;u.res={tech:30,magic:30};heroOf(u).hp=50;heroOf(u).comp=10});S.sd.sel=0;S.sd.vturn=true;`)}
const card=id=>`buildCard(S.sd.vkey,{id:'${id}',mk:0})`,play=id=>run(`execCard(${card(id)})`);
const logs=re=>get('S.sd.log.map(l=>l.t)').filter(t=>re.test(t)).length;
(async()=>{
 // Fade leaves an untouchable shadow double that mimics her next action, then dissipates.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=4');await play('fade');
 assert.equal(get('S.sd.v.dupes.length'),1);assert(get('S.sd.dupes.some(m=>m.x===4&&m.y===4)'));assert(!get('S.sd.hench.length'));assert(get('blocked(4,4)'));assert.match(get('bossStatusView()'),/shadow double/);
 run('S.sd.units[0].x=4;S.sd.units[0].y=5');
 await run(`(async()=>{const v=S.sd.v,d=takeDupes(v),c=${card('stars')};await execCard(c);await dupeTurn(v,c,d)})()`);
 assert.equal(logs(/mimics Throwing Stars/),1);assert(!get('S.sd.dupes.length'));assert(!get('(S.sd.v.dupes||[]).length'));
 // Doubles cannot be harmed: blasts and auras only reach henchmen.
 await play('fade');await run("gearBlast(S.sd.dupes[0],[2,5],'Test blast')");assert.equal(get('S.sd.dupes.length'),1);run('S.sd.dupes=[];delete S.sd.v.dupes');
 // Doubles copy every page, not only attacks.
 run('S.sd.hench=[]');await play('fade');await run(`(async()=>{const v=S.sd.v,d=takeDupes(v),c=${card('shades')};await execCard(c);await dupeTurn(v,c,d)})()`);assert.equal(logs(/mimics/),2);assert(!get('S.sd.dupes.length'));
 assert.equal(get('S.sd.hench.length'),4);
 // Doubles lock in her planned page and play it even if her own page is torn.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=4;S.sd.units.forEach((u,i)=>{u.x=3+i%2;u.y=6})');await play('fade');
 run(`S.sd.v.planned=${card('stars')};S.sd.vl.forEach(o=>planDupes(o.v))`);assert.equal(get('S.sd.dupes[0].plan.id'),'stars');
 run('S.sd.v.planned=null');await run('(async()=>{const v=S.sd.v,d=takeDupes(v);await dupeTurn(v,null,d)})()');assert.equal(logs(/mimics Throwing Stars/),1);assert(!get('S.sd.dupes.length'));
 // Every jump or teleport leaves a double: slipping away mid-round locks in her planned page; the Stolen Shadow swap leaves one too.
 setup('noct');run(`S.sd.v.x=4;S.sd.v.y=4;S.sd.vturn=false;S.sd.v.planned=${card('garrote')};S.sd.v.x=6;jumpDupe(S.sd.v,{x:4,y:4})`);assert(get('S.sd.dupes.some(d=>d.x===4&&d.y===4&&d.plan.id==="garrote")'));
 run("S.sd.dupes=[];delete S.sd.v.dupes;S.sd.hench=[{id:'sh',owner:'noct',x:2,y:2,hp:1,shadow:true}];S.sd.v.shadowId='sh'");await run('resolveBossSetup(S.sd.v)');
 assert.deepEqual(get('[S.sd.v.x,S.sd.v.y]'),[2,2]);assert(get('S.sd.dupes.some(d=>d.x===6&&d.y===4)'));
 // Fade: +4 evasion until her next action. Vanishing Silhouette data spins her.
 setup('noct');const e0=get("vStat('eva')");await play('fade');assert.equal(get("vStat('eva')"),e0+4);assert.match(get('bossStatusView()'),/\+4 evasion/);
 assert(get("VINTEL.noct.react.find(r=>r.id==='vanishing').spin"));
 // A copied charge adds marks around the hero nearest the double.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=1;S.sd.units.forEach((u,i)=>{u.x=2*i;u.y=8})');await play('fade');run('S.sd.dupes[0].x=8;S.sd.dupes[0].y=7');
 await run(`(async()=>{const v=S.sd.v,d=takeDupes(v),c=${card('deathm')};await execCard(c);await dupeTurn(v,c,d)})()`);assert(get('S.sd.v.charge.zone.includes("6,8")'));
 // Knife in the Dark leaves a double beside a hero at half composure or less.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=5;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=7});S.heroes.forEach(h=>h.comp=1);globalThis.vStat0=vStat;vStat=()=>99');await play('knife');run('vStat=vStat0');assert.equal(get('S.sd.dupes.length'),1);
 // Shadow Double appears beside the least composed hero in range and strikes.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=3;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=6});S.heroes[2].comp=1');await play('double');
 assert(get('S.sd.dupes.some(m=>cheb(m,S.sd.units[2])===1)'));assert.equal(logs(new RegExp('Shadow Double at '+get('S.heroes[2].name'))),1);
 // Mirror Images leaves a double; Stolen Shadow throws a knife and costs composure.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=3;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=6});S.sd.v.wounds=[S.sd.v.deck.pop()]');await play('mirror');assert.equal(get('S.sd.dupes.length'),1);
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=4;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=6})');await play('decoy');assert(get('!!S.sd.v.shadowMark'));
 assert.equal(logs(/Stolen Shadow at/),1);assert.equal(get('S.heroes.filter(h=>h.comp===9).length'),1);
 // Knife in the Dark targets the lowest composure in reach.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=4;S.sd.units.forEach((u,i)=>{u.x=2+i;u.y=6});S.heroes[3].comp=2');
 assert.equal(get('pickTarget(S.sd.vl[0].v&&"lowcomp",9).hid'),get('S.sd.units[3].hid'));
 // Whispers in the Dark: Shaken heroes take 1 damage; unshaken heroes do not.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=4;S.sd.units.forEach((u,i)=>{u.x=3+i%2;u.y=6});S.heroes[0].comp=2');await play('dread');
 assert.equal(get('S.heroes[0].hp'),49);assert.equal(get('S.heroes[1].hp'),50);
 // Total Eclipse does the same to every hero.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=4;S.heroes[1].comp=1');await play('eclipse');assert.equal(get('S.heroes[1].hp'),49);assert.equal(get('S.heroes[0].hp'),50);
 // Death Mark follows its targets.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=2;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=7});S.heroes[0].hp=10;S.heroes[1].hp=20');await play('deathm');
 // Tyler (2026-10-30): no area. It marks only the most injured hero's own hex; Death Mark II marks two heroes.
 assert.deepEqual(get('S.sd.v.charge.track'),get('[S.sd.units[0].hid]'));assert.deepEqual(get('S.sd.v.charge.zone'),['1,7']);
 run('S.sd.units[0].x=8;S.sd.units[0].y=0;bossObserve()');assert.deepEqual(get('S.sd.v.charge.zone'),['8,0']);
 run('S.sd.units[1].x=8;S.sd.units[1].y=1');await run('fireCharge()');assert(get('S.heroes[0].hp<10'));assert.equal(get('S.heroes[1].hp'),20);
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=2;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=7});S.heroes[0].hp=10;S.heroes[1].hp=20');await run("execCard(buildCard('noct',{id:'deathm',mk:1},2))");
 assert.deepEqual(get('S.sd.v.charge.track'),get('[S.sd.units[0].hid,S.sd.units[1].hid]'));assert.deepEqual(get('S.sd.v.charge.zone.slice().sort()'),['1,7','3,7']);
 // Ouroboros: civilians first, then heroes, then the weakest cultist.
 setup('serpent');assert.equal(get('VILLAINS.serpent.eva'),12);
 run(`S.sd.units.forEach((u,i)=>{u.x=2*i;u.y=8});S.sd.civs=[{x:S.sd.v.x,y:Math.min(8,S.sd.v.y+2),f:null}];S.sd.hench=[{id:'c1',owner:'serpent',x:S.sd.v.x+1,y:S.sd.v.y,hp:3},{id:'c2',owner:'serpent',x:S.sd.v.x-1,y:S.sd.v.y,hp:1}]`);
 await play('gulp');assert.equal(get('S.sd.civs.length'),0);assert.equal(get('S.sd.hench.length'),2);
 run('{const v=S.sd.v,p=nbrs({x:v.x,y:v.y}).find(p=>inB(p.x,p.y)&&!blocked(p.x,p.y));S.sd.units[0].x=p.x;S.sd.units[0].y=p.y;S.sd.units.slice(1).forEach(u=>{u.y=0;u.x=8})}');
 await play('gulp');assert.equal(get('S.sd.hench.length'),2);assert.equal(logs(/Swallow Whole at/),1);
 run('S.sd.units.forEach(u=>{u.ko=true});S.sd.hench.forEach(m=>{m.x=S.sd.v.x+(m.id==="c1"?1:-1);m.y=S.sd.v.y})');await play('gulp');
 assert.deepEqual(get('S.sd.hench.map(m=>m.id)'),['c1']);
 // Puppet pages drag their target toward the serpent.
 setup('serpent');run('S.sd.units.forEach((u,i)=>{u.x=2*i;u.y=8});S.heroes[2].comp=1');const d0=get('dV(S.sd.units[2],S.sd.v)');await play('eyes');
 assert.equal(get('dV(S.sd.units[2],S.sd.v)'),d0-2);assert(get('S.sd.units[2].dazed'));
 // Composure loss: +1 at villain level 3, +2 at level 6 (pages, reactions and Closed Circuit).
 assert.equal(get("buildCard('noct',{id:'dread',mk:0},2).amt"),2);assert.equal(get("buildCard('noct',{id:'dread',mk:0},3).amt"),3);assert.equal(get("buildCard('cantor',{id:'nerve',mk:0},6).comp"),5);
 assert.equal(get("buildCard('noct',{id:'knife',mk:0},8).dmg"),get("buildCard('noct',{id:'knife',mk:0},1).dmg"));assert.equal(get('compBonus(8)'),2);
 // Shaken is -3 Strength/accuracy/evasion, and ending a fight at 0 composure no longer leaves Rattled.
 setup('noct');run('S.heroes[0].comp=0');assert.equal(get("stat(S.heroes[0],'acc')+3"),get("(S.heroes[0].comp=1,stat(S.heroes[0],'acc'))"));
 run("S.heroes[0].comp=0;S.sd.result='win';debrief()");assert(!get("S.heroes[0].injuries.includes('rattled')"));
 console.log('PASS: Nocturne shadow doubles, Shadow Double, least-composure knives, Shaken damage, single-target tracking Death Mark; Ouroboros prey order, puppet pull and Evasion 12.');
})().catch(e=>{console.error(e);process.exit(1)});
