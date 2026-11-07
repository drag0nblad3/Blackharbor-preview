const assert=require('node:assert/strict'),bh=require('../tools/bh');
const g=bh.load({seed:20261030});
g.ctx.setTimeout=(fn)=>setImmediate(fn);
const run=x=>g.run(x),get=x=>JSON.parse(JSON.stringify(g.get(x)));
run("render=()=>{};fx=()=>{};");
function setup(k='gallows',lv=3){run(`newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['hexen','volt','wisp','bulwark'].map(k=>newHero(k));S.party=S.heroes.map(h=>h.id);S.facilities=[];S.villains=[makeVillain('${k}',${lv})];S.pool=[];S.inv={v:'${k}',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.haz=[];S.sd.hench=[];S.sd.civs=[];S.sd.term=null;S.sd.bombs=[];S.sd.beams=[];S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8;u.res={tech:30,magic:30};heroOf(u).hp=50});S.sd.sel=0;`)}
function plan(id,ids=['lash','snipe','drones','ray','mono','galv']){run(`S.sd.v.planned=buildCard(S.sd.vkey,{id:'${id}',mk:0});S.sd.v.planningDone=true;S.sd.v.deck=${JSON.stringify(ids)}.map(id=>buildCard(S.sd.vkey,{id,mk:0}));S.sd.v.discard=[];S.sd.v.wounds=[];S.sd.v.turnDamage=0;S.sd.v.charge=null;S.sd.result=null;S.sd.v.down=false;`)}
(async()=>{
 setup();assert.equal(get('S.sd.v.deck.length+1'),get('vState("gallows").deck.length'));assert(get('!!S.sd.v.planned'));assert(!get('S.sd.v.deck.some(c=>c.uid===S.sd.v.planned.uid)'));
 plan('field');assert(get("rxLive(S.sd.v,rxOf('gallows','cap'))"));
 assert.match(get('plannedView(S.sd.vl[0])'),/Unrevealed action/);assert(!get('plannedView(S.sd.vl[0])').includes('Overload Field'));
 run("markSeen('gallows','field')");assert.match(get('plannedView(S.sd.vl[0])'),/Overload Field/);assert(get('plannedView(S.sd.vl[0])').includes(get('S.sd.v.planned.txt')));
 await run("woundAnim('first')");await run("woundAnim('second')");assert.deepEqual(get('S.sd.v.wounds.map(c=>c.id)'),['lash','snipe']);assert.equal(get('S.sd.v.planned.id'),'field');
 await run("woundAnim('threshold')");assert.equal(get('S.sd.v.planned'),null);assert.deepEqual(get('S.sd.v.wounds.map(c=>c.id)'),['lash','snipe','field']);assert.equal(get('S.sd.v.deck[0].id'),'drones');assert(!get("rxLive(S.sd.v,rxOf('gallows','cap'))"));
 const left=get('remainingPages(S.sd.v)');await run('villainPhase()');assert.equal(get('remainingPages(S.sd.v)'),left);assert.equal(get('S.sd.v.turnDamage'),0);assert(get('!!S.sd.v.planned'));assert(!get('S.sd.log.some(l=>l.t.includes("plays Overload"))'));
 setup();plan('lash');await run("woundAnim('normal')");assert.equal(get('S.sd.v.planned.id'),'lash');
 // Threshold is per hero round, not lifetime damage; final ordinary page remains defeatable.
 plan('field');run('woundV();woundV();S.sd.v.turnDamage=0;woundV()');assert.equal(get('S.sd.v.planned.id'),'field');
 plan('lash',[]);run('woundV()');assert.equal(get('S.sd.result'),'win');
 // The last page always tears, even a signature in the charging slot (Tyler, 2026-10-30).
 setup();plan('field',[]);run('woundV()');assert.equal(get('S.sd.result'),'win');
 // Area-charge cards remain in the slot through windup, then discard exactly once.
 setup('helios',2);plan('flare',['heat','corona','sprites']);const total=get('remainingPages(S.sd.v)');await run('villainPhase()');assert(get('!!S.sd.v.charge'));assert.equal(get('remainingPages(S.sd.v)'),total);assert.equal(get('S.sd.v.planned.id'),'flare');await run("woundAnim('1');");await run("woundAnim('2');");assert.equal(get('S.sd.v.charge'),null);assert.equal(get('S.sd.v.planned'),null);
 setup('helios',2);plan('flare',['heat','corona','sprites']);await run('villainPhase()');await run('villainPhase()');assert.equal(get('remainingPages(S.sd.v)'),4);assert.equal(get('[...S.sd.v.deck,...S.sd.v.discard,S.sd.v.planned].filter(c=>c&&c.id==="flare").length'),1);
 // Scry and Bury preserve card counts and never duplicate the pending card.
 setup();plan('field');const n=get('remainingPages(S.sd.v)');await run('scry(2,COL.magic,S.sd.units[0])');await run('bury(COL.magic,S.sd.units[0])');assert.equal(get('remainingPages(S.sd.v)'),n);assert.equal(get('new Set([...S.sd.v.deck,...S.sd.v.discard,S.sd.v.planned].filter(Boolean).map(c=>c.uid)).size'),n);
 // Two guaranteed hits: exactly the first reaction is suppressed.
 setup();plan('field');run("S.sd.v.level=8;S.sd.v.repress=true;S.sd.tdk.gallows=[{id:'counter',n:'Counterstrike',txt:'Reaction: 2 damage.'},{id:'counter',n:'Counterstrike',txt:'Reaction: 2 damage.'}];S.sd.units[0].x=4;S.sd.units[0].y=3;S.sd.v.face=5;S.tut={dq:Array(100).fill(20)};");
 await run("heroAttack(S.sd.units[0],'v',0,2)");assert.equal(get('S.heroes[0].hp'),48);assert.equal(get('S.sd.v.repress'),false);
 setup();plan('field');run("S.sd.v.level=8;S.sd.tdk.gallows=[{id:'counter',n:'Counterstrike',txt:'Reaction: 2 damage.'}];S.sd.units[0].x=4;S.sd.units[0].y=3;S.sd.v.face=5;S.tut={dq:Array(100).fill(20)};");await run('abApply(S.sd.units[0],S.heroes[0],GEAR.wardtome,S.sd.units[0])');await run("heroAttack(S.sd.units[0],'v',0,1)");assert.equal(get('S.heroes[0].hp'),50);run('damageHero(S.sd.units[0],2)');assert.equal(get('S.heroes[0].hp'),48);assert.equal(get('S.sd.reactionContext'),false);
 // Hexen uses the real resource-paying activation and cannot stack Repress.
 setup();run('S.sd.units[0].x=4;S.sd.units[0].y=4');const arc=get('S.sd.units[0].res.magic');await run('usePower()');assert.equal(get('S.sd.v.repress'),true);assert.equal(get('S.sd.units[0].res.magic'),arc-2);assert.equal(get('powOk(S.sd.units[0],S.heroes[0])'),false);
 // Repress has no range, and the hero who triggers the repressed reaction restores 2 composure (Tyler, 2026-10-30).
 setup();plan('field');run("S.sd.units[0].x=0;S.sd.units[0].y=8;S.sd.v.level=8;S.sd.tdk.gallows=[{id:'counter',n:'Counterstrike',txt:'Reaction: 2 damage.'}];S.sd.v.face=5;S.tut={dq:Array(100).fill(20)};S.heroes[1].comp=1");await run('usePower()');assert.equal(get('S.sd.v.repress'),true);
 run('S.sd.units[1].x=4;S.sd.units[1].y=3;S.sd.sel=1');await run("heroAttack(S.sd.units[1],'v',0,1)");assert.equal(get('S.heroes[1].comp'),3);assert.equal(get('S.heroes[1].hp'),50);assert.equal(get('!!S.sd.v.repressComp'),false);
 // Actual movement powers Wind Ward; activation snapshots movement, not future moves.
 setup();run("S.sd.mode='move';onCell(0,6)");assert.equal(get('S.sd.units[0].hexesMoved'),2);await run('abApply(S.sd.units[0],S.heroes[0],GEAR.cloak,S.sd.units[0])');assert.equal(get('S.sd.units[0].buffEva'),2);
 run('S.sd.units[0].hexesMoved=4');assert.equal(get('S.sd.units[0].buffEva'),2);
 // Ally push / pull and swap never spend the target's move, and blocked targets cost nothing.
 setup();run('S.sd.units[0].x=2;S.sd.units[0].y=6;S.sd.units[1].x=3;S.sd.units[1].y=6');const before=get('cheb(S.sd.units[0],S.sd.units[1])');await run('abApply(S.sd.units[0],S.heroes[0],GEAR.polar,S.sd.units[1])');assert.equal(get('S.sd.units[1].buffEva'),3);assert.equal(get('cheb(S.sd.units[0],S.sd.units[1])'),before+1);assert.equal(get('!!S.sd.units[1].moved'),false);
 const positions=get('S.sd.units.slice(0,2).map(u=>[u.x,u.y])');await run('abApply(S.sd.units[0],S.heroes[0],GEAR.shadowpaw,S.sd.units[1])');assert.deepEqual(get('S.sd.units.slice(0,2).map(u=>[u.x,u.y])'),positions.reverse());
 run('S.sd.v.blind=true');assert.equal(get("VILLAINS.gallows.acc+vLvB('acc',S.sd.v.level)-vStat('acc')"),3);
 // Targeted AoE hits its footprint, not around its caster.
 setup();run("S.sd.hench=[{id:'a',x:4,y:5,hp:3},{id:'b',x:5,y:5,hp:3},{id:'c',x:0,y:7,hp:3}]");await run("gearBlast({x:4,y:5},GEAR.fusebando.ab.fx.blast,'Cherry Bomb')");assert.deepEqual(get('S.sd.hench.map(m=>m.hp)'),[2,2,3]);
 // Inspect without consuming the next reaction.
 setup();run("S.sd.tdk.gallows=[{id:'counter',n:'Counterstrike',txt:'2 damage'}]");await run('peekReaction()');assert.equal(get('S.sd.tdk.gallows.length'),1);assert.equal(get('S.sd.tdk.gallows[0].id'),'counter');
 // Deck selection preserves exact size / upgrade budget and samples a larger pool.
 for(const k of get('Object.keys(EXTRA_PAGES)')){setup(k,3);const size=get('S.villains[0].deck.length'),budget=get('S.villains[0].deck.reduce((n,c)=>n+c.mk,0)');run(`startInv('${k}')`);const first=get('S.villains[0].deck');assert.equal(first.length,size);assert.equal(first.reduce((n,c)=>n+c.mk,0),budget);assert(get('S.villains[0].deck.every(e=>!!VILLAINS[S.villains[0].key].cards[e.id])'));run(`startInv('${k}')`);assert.notDeepEqual(get('S.villains[0].deck'),first);assert.equal(get(`VINTEL.${k}.react.length`),5);}
 setup();run('S.sd.tdk={};drawTactic()');assert.equal(get('S.sd.tdk.gallows.length'),9);
 for(const kind of ['cover','route','evac','thin']){setup();run("S.sd.obs=['4,4','3,5','1,1'];S.sd.pits=['4,6'];S.sd.haz=[{k:'3,4',dmg:2,ttl:3}];S.sd.hench=[{id:'a',hp:2,x:2,y:2},{id:'e',elite:1,hp:4,x:3,y:2}];S.sd.civs=[{id:1,x:0,y:0},{id:2,x:1,y:0}]");run(`applyBoardPrep('${kind}')`);if(kind==='cover')assert.equal(get('S.sd.walls.length'),2);if(kind==='route'){assert.deepEqual(get('S.sd.obs'),['1,1']);assert.equal(get('S.sd.pits.length+S.sd.haz.length'),0);}if(kind==='evac')assert(get('S.sd.civs.every(c=>c.y>=N-3)'));if(kind==='thin')assert.deepEqual(get('S.sd.hench.map(m=>m.id)'),['e']);}
 // A save roundtrip retains the reserved page and accumulated wound counter.
 setup();plan('field');run('woundV();S=JSON.parse(JSON.stringify(S));S.sd.v=S.sd.vl[0].v;migratePlans()');assert.equal(get('S.sd.v.turnDamage'),1);assert.equal(get('S.sd.v.planned.id'),'field');
 // Every new option executes, and extra reactions cannot create extra Murmur bodies.
 for(const k of get('Object.keys(EXTRA_PAGES)')){setup(k,4);g.get('sdView()');for(const id of get(`Object.keys(EXTRA_PAGES.${k})`))await run(`execCard(buildCard('${k}',{id:'${id}',mk:1},4))`);g.get('sdView()');if(k==='swarm')assert(get('swBodies(S.sd.v).length')<=3);}
 g.get('Object.values(GEAR).filter(g=>g.ab).map(g=>abTxt(g.ab))');
 // Old active-charge saves move the card from discard into the reserved slot once.
 setup('helios',2);plan('flare',['heat','sprites']);run('delete S.sd.planVersion;S.sd.v.last=S.sd.v.planned;S.sd.v.discard=[S.sd.v.planned];S.sd.v.planned=null;S.sd.v.charge={n:"Solar Flare",zone:[],dmg:5};S=JSON.parse(JSON.stringify(S));S.sd.v=S.sd.vl[0].v;migratePlans()');assert.equal(get('S.sd.v.planned.id'),'flare');assert.equal(get('S.sd.v.discard.length'),0);assert.equal(get('remainingPages(S.sd.v)'),3);
 console.log('PASS: charging lifecycle, threshold wounds, visibility, deck conservation, Repress, reaction wards, gear movement, AoE footprints, randomized decks, board leads and save state.');
})().catch(e=>{console.error(e);process.exitCode=1});
