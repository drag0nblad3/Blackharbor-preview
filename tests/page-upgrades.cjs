const assert=require('node:assert/strict'),bh=require('../tools/bh');
const g=bh.load({seed:404}),run=s=>g.run(s),get=s=>JSON.parse(JSON.stringify(g.get(s)));
g.ctx.setTimeout=fn=>setImmediate(fn);
run('render=()=>{bossObserve()};fx=()=>{};');
function setup(k,lv=2){run(`newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['hexen','volt','wisp','bulwark'].map(k=>newHero(k));S.party=S.heroes.map(h=>h.id);S.facilities=[];S.villains=[makeVillain('${k}',${lv})];S.pool=[];S.inv={v:'${k}',clues:3};startShowdown();S.sd.intro=false;S.sd.obs=[];S.sd.walls=[];S.sd.pits=[];S.sd.haz=[];S.sd.hench=[];S.sd.civs=[];S.sd.term=null;S.sd.bombs=[];S.sd.beams=[];S.sd.units.forEach((u,i)=>{u.x=i*2;u.y=8;u.res={tech:30,magic:30};heroOf(u).hp=50;heroOf(u).comp=10});S.sd.sel=0;S.sd.vturn=true;`)}
const bc=(k,id,mk,lv)=>`buildCard('${k}',{id:'${id}',mk:${mk}},${lv})`;
(async()=>{
 // Tyler (2026-10-30): upgrades never add damage or composure loss; those come from level only.
 for(const k of Object.keys(get('VILLAINS')))for(const id of Object.keys(get(`VILLAINS.${k}.cards`))){
   const b=get(`VILLAINS.${k}.cards.${id}`),c=get(bc(k,id,3,1));
   if(b.dmg!=null)assert.equal(c.dmg,b.dmg,`${k}.${id} damage grows with marks`);
   if(b.amt!=null&&['taunt','fade','puppet'].includes(b.t))assert.equal(c.amt,b.amt,`${k}.${id} composure grows with marks`);
   if(b.comp!=null)assert.equal(c.comp,b.comp,`${k}.${id} composure grows with marks`)}
 // Pages show the level bonus: +1 damage per even level, +1 composure at levels 3 and 6.
 assert.match(get(bc('noct','garrote',0,8)+'.txt'),/for 8\./);assert.match(get(bc('noct','garrote',0,1)+'.txt'),/for 4\./);
 assert.match(get(bc('noct','dread',0,8)+'.txt'),/lose 4 composure/);assert.match(get(bc('helios','flare',0,6)+'.txt'),/: 8 damage/);
 assert.match(get("rxTxt(rxOf('noct','terror'),6)"),/loses 4 Composure/);
 // Upgrade ladders: attack pages get +2 accuracy, then daze, then knockback; the text says so.
 const g3=get(bc('noct','garrote',3,8));assert.equal(g3.accUp,2);assert(g3.daze);assert.equal(g3.knock,1);assert.match(g3.txt,/\+2 accuracy.*can't move next round.*knocked back 1 hex/);
 assert(get(bc('helios','flare',2,1)+'.zr')===1&&get(bc('helios','flare',2,1)+'.daze'));
 assert.equal(get(bc('bomber','lit',1,1)+'.radius'),2);assert.equal(get(bc('serpent','eyes',2,1)+'.tgts'),2);assert(get(bc('cantor','guns',2,1)+'.rush'));
 // In play: an upgraded strike gets +2 accuracy, dazes and knocks back the hero it hits.
 setup('noct');run('S.sd.v.x=4;S.sd.v.y=5;S.sd.units.forEach((u,i)=>{u.x=1+2*i;u.y=7});S.heroes[2].comp=1');
 const t=get('S.sd.units[2]');const accLog=()=>get('S.sd.log.map(l=>l.t)').filter(t=>/Garrote IV at/.test(t));
 run('S.tut={b:0,dq:Array(40).fill(10)}');await run(`execCard(${bc('noct','garrote',3,2)})`);
 assert.match(accLog()[0],/rolled 10\+\d+/);const acc=+accLog()[0].match(/rolled 10\+(\d+)/)[1];assert.equal(acc,get("vStat('acc')")+2);
 assert(get('S.sd.units[2].dazed'));assert.notDeepEqual(get('[S.sd.units[2].x,S.sd.units[2].y]'),[t.x,t.y]);
 // Henchmen attacks after the page don't inherit its riders.
 assert.equal(get('CUR_CARD'),null);
 // An upgraded charge widens its zone and dazes heroes caught.
 setup('helios');run('S.sd.units.forEach((u,i)=>{u.x=2*i;u.y=8})');const z0=get(`(()=>{const c=${bc('helios','flare',0,2)};return chargeZone(c.zone,c).length})()`);
 await run(`execCard(${bc('helios','flare',2,2)})`);assert(get('S.sd.v.charge.zone.length')>z0);await run('fireCharge()');assert(get('S.sd.units.some(u=>u.dazed)'));
 console.log('PASS: upgrades add no damage or composure; level bonuses shown on pages and reactions; accuracy, daze, knockback, wider charges, bigger bombs, extra puppets and rushing henchmen.');
})().catch(e=>{console.error(e);process.exit(1)});
