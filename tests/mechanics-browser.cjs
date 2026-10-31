const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+process.cwd()+'/index.html');
  await page.evaluate(()=>{
   newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.tipsOff=true;S.facilities=[];
   S.heroes=['hexen','volt','wisp','bulwark'].map(k=>newHero(k));S.party=S.heroes.map(h=>h.id);
   S.heroes[0].ranks={tech:3,magic:3,innate:2};S.heroes[0].gear={body:'cloak',legs:'shadowpaw',off:'wardtome',acc:'crown',arms:'fusebando'};
   S.villains=Object.keys(VILLAINS).filter(k=>!VILLAINS[k].intro).map(k=>makeVillain(k,3));S.pool=[];S.inv={v:'gallows',clues:3};startShowdown();
   const sd=S.sd;sd.intro=false;sd.sel=0;sd.mode=null;sd.hench=[];sd.civs=[];sd.obs=[];sd.walls=[];sd.pits=[];sd.haz=[];sd.bombs=[];sd.beams=[];sd.term=null;
   sd.units[0].x=2;sd.units[0].y=6;sd.units[1].x=3;sd.units[1].y=6;sd.units[0].res={tech:30,magic:30};sd.units[0].hexesMoved=3;
   sd.v.planned=buildCard('gallows',{id:'field',mk:0});sd.v.planningDone=true;sd.v.turnDamage=1;sd.v.deck=['lash','drones','snipe'].map(id=>buildCard('gallows',{id,mk:0}));sd.v.discard=[];sd.v.wounds=[];
   Object.keys(A).forEach(k=>{if(typeof A[k]==='function')A[k]=async()=>{}});
   render();
  });
  assert.match(await page.locator('[data-planned="gallows"]').innerText(),/Unrevealed action/);
  await page.evaluate(()=>{markSeen('gallows','field');render()});assert.match(await page.locator('[data-planned="gallows"]').innerText(),/Overload Field/);
  await page.locator('.abilities-dropdown .combat-menu-toggle').click();
  await page.locator('[data-a="combatPick:ability:cloak"]').click();assert.match(await page.locator('.combat-choice').innerText(),/each hex/);
  assert.equal(await page.evaluate(()=>S.sd.units[0].res.magic),30);
  await page.locator('[data-a="combatUse"]').click();await page.waitForFunction(()=>!S.sd.busy);assert.equal(await page.evaluate(()=>S.sd.units[0].buffEva),3);assert.equal(await page.evaluate(()=>S.sd.units[0].res.magic),29);
  await page.evaluate(()=>{combatPick('ability','shadowpaw')});assert.equal(await page.locator('.combat-choice [data-a="combatUse"]').count(),0,'Board-targeted gear has no activate button');
  assert.equal(await page.evaluate(()=>S.sd.mode),'abally');
  await page.locator('[data-cell="3,6"]').click();await page.waitForFunction(()=>!S.sd.busy);
  assert.deepEqual(await page.evaluate(()=>S.sd.units.slice(0,2).map(u=>[u.x,u.y])),[[3,6],[2,6]]);
  // Full save export/import retains the reserved card exactly once and its round damage.
  await page.evaluate(async()=>{const out=await bhSaveEncode(S),decoded=await bhSaveDecode(out);localStorage.setItem(KEY,JSON.stringify(decoded.state));});
  await page.reload();await page.waitForFunction(()=>S.sd&&S.sd.v===S.sd.vl[S.sd.vi].v);
  assert.equal(await page.evaluate(()=>S.sd.v.planned.id),'field');assert.equal(await page.evaluate(()=>S.sd.v.turnDamage),1);
  assert.equal(await page.evaluate(()=>[...S.sd.v.deck,...S.sd.v.discard,S.sd.v.planned].filter(c=>c?.id==='field').length),1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
  // Playbook includes the pending page, and no array omits it from remaining health.
  const counts=await page.evaluate(()=>{openPlaybook('gallows');return {shown:PB.remainN,actual:remainingPages(S.sd.v)}});assert.equal(counts.shown,counts.actual);
  await page.evaluate(()=>closePlaybook());
  // Third-lead choice is clickable and its effect reaches the actual showdown setup.
  await page.evaluate(()=>{S.sd=null;startInv('gallows');S.inv.intro=false;S.inv.step=2;S.inv.events[2]='gallows_board';render()});
  assert.match(await page.locator('.inv-choices').innerText(),/barricades/);await page.locator('[data-a="invopt:0"]').click();await page.locator('[data-a="invnext"]').click();
  assert.match(await page.locator('.inv-finale').innerText(),/Battlefield preparation/);await page.locator('[data-a="lair"]').click();
  assert.equal(await page.evaluate(()=>S.sd.boardPrep),'cover');assert.equal(await page.evaluate(()=>S.sd.walls.filter(w=>w.perm&&w.ttl===99).length),2);
  assert.deepEqual(errors,[]);console.log('PASS: '+width+'px charging display, select/confirm gear, ally exchange, save/reload, playbook and board lead.');await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
