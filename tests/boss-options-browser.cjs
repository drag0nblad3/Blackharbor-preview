const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('file://'+process.cwd()+'/index.html');
await page.evaluate(()=>{
 globalThis.bossTestSetup=k=>{newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.tipsOff=true;S.facilities=[];S.heroes=['hexen','volt','wisp','bulwark'].map(k=>newHero(k));S.party=S.heroes.map(h=>h.id);S.villains=[k,...Object.keys(VILLAINS).filter(x=>x!==k&&!VILLAINS[x].intro)].slice(0,3).map(k=>makeVillain(k,2));S.pool=[];S.inv={v:k,clues:3};startShowdown();const sd=S.sd;sd.intro=false;sd.sel=0;sd.mode=null;sd.hench=[];sd.civs=[];sd.obs=[];sd.walls=[];sd.pits=[];sd.haz=[];sd.bombs=[];sd.beams=[];sd.term=null;sd.units.forEach((u,i)=>{u.x=i*2;u.y=8;heroOf(u).hp=stat(heroOf(u),'maxHp')});sd.units[0].x=4;sd.units[0].y=5;Object.keys(A).forEach(k=>{if(typeof A[k]==='function')A[k]=async()=>{}});render()};
});
for(const [key,id,name] of [['quarry','fault','Tectonic Heave'],['architect','foundry','Renovation Notice'],['helios','sunspot','Solar Debt'],['noct','decoy','Stolen Shadow']]){
 await page.evaluate(async({key,id})=>{bossTestSetup(key);await execCard(buildCard(key,{id,mk:0}));render()},{key,id});
 assert.match(await page.locator('.boss-effects').innerText(),new RegExp(name));
 if(['quarry','architect'].includes(key))assert(await page.locator('.cell.tele').count()>=3);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify({key,width,overflow:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>[e.tagName,e.id,e.className,e.getBoundingClientRect().right,e.outerHTML.slice(0,180)]))}));
 const before=await page.evaluate(()=>JSON.stringify(S.sd.v.setup||S.sd.v.solarHeat||S.sd.v.shadowMark));
 await page.evaluate(()=>{save();load();render()});
 assert.equal(await page.evaluate(()=>JSON.stringify(S.sd.v.setup||S.sd.v.solarHeat||S.sd.v.shadowMark)),before);
}
await page.evaluate(async()=>{bossTestSetup('lode');S.sd.units[0].x=S.sd.v.x;S.sd.units[0].y=S.sd.v.y+1;S.sd.v.satellites=2;render()});
await page.locator('.other-actions .combat-menu-toggle').click();await page.locator('[data-a="combatPick:other:satellite"]').click();assert.equal(await page.evaluate(()=>S.sd.v.satellites),2);assert.match(await page.locator('.combat-choice').innerText(),/without a roll/);await page.locator('[data-a="combatUse"]').click();await page.waitForFunction(()=>!S.sd.busy);assert.equal(await page.evaluate(()=>S.sd.v.satellites),1);assert(await page.evaluate(()=>S.sd.units[0].acted));
await page.evaluate(async()=>{bossTestSetup('noct');await execCard(buildCard('noct',{id:'decoy',mk:0}));S.sd.units[0].x--;render()});assert.equal(await page.locator('.hmt[title="Stolen shadow · 1 HP"]').count(),1);
await page.evaluate(async()=>{bossTestSetup('swarm');S.sd.hench=[{id:'a',owner:'swarm',x:0,y:3,hp:1},{id:'b',owner:'swarm',x:8,y:3,hp:1}];await execCard(buildCard('swarm',{id:'needle',mk:0}));render()});assert.equal(await page.locator('.hmt[title="Infested mite · next boss action"]').count(),2);
assert.deepEqual(errors,[]);console.log(`PASS: ${width}px boss status, board markers, save/load, satellite confirmation and special tokens.`);await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
