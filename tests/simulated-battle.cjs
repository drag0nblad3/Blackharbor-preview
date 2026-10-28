const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('file://'+process.cwd()+'/index.html');
  await page.evaluate(()=>{
   newCampaign();recruitQuick('volt');recruitQuick('wisp');
   S.guide=null;S.tut={dq:[],skip:true};S.tutDone=true;
   const volt=S.heroes.find(h=>h.cls==='volt');
   volt.gear.arms='baton';volt.gear.acc='uplink';
   S.inv={v:S.villains[0].key,clues:2};startShowdown();
   const sd=S.sd;sd.intro=false;sd.busy=false;sd.sel=0;sd.mode=null;
   sd.civs=[];sd.hench=[];sd.bombs=[];sd.beams=[];
   // Isolate Avoid Damage from randomly generated battlefield cover.
   sd.obs=[];sd.walls=[];sd.pits=[];sd.haz=[];sd.term=null;
   sd.units[0].x=4;sd.units[0].y=4;
   render();
  });
  const balance=await page.evaluate(()=>({
    runic:GEAR.runeblade.ab.fx.str,stun:GEAR.baton.ab.fx.str,trinity:GEAR.crown.ab.fx.str,
    kinetic:GEAR.bracer.ab.fx,slug:GEAR.shotgun.ab.fx.str,
    overclock:POWERS.overclock.txt,berserk:POWERS.berserk.txt,
    kineticDescription:abTxt(GEAR.bracer.ab)
  }));
  assert.deepEqual({runic:balance.runic,stun:balance.stun,trinity:balance.trinity,kinetic:balance.kinetic,slug:balance.slug},
    {runic:3,stun:3,trinity:5,kinetic:{dice:1,str:-1},slug:5},'Seven-ability balance numbers');
  assert.match(balance.overclock,/\+1 accuracy and −1 Strength/);
  assert.match(balance.berserk,/\+3 Strength and −1 accuracy/);
  assert.match(balance.kineticDescription,/−1 Strength/);
  assert.doesNotMatch(balance.kineticDescription,/\+−|\+-/);
  const abilities=page.locator('.abilities-dropdown .combat-menu-toggle');
  assert.equal(await abilities.getAttribute('aria-expanded'),'false');
  await abilities.click();
  assert.equal(await abilities.getAttribute('aria-expanded'),'true');
  await page.evaluate(()=>render());
  assert.equal(await abilities.getAttribute('aria-expanded'),'true','Abilities stays open across battle redraw');
  await page.locator('.abilities-menu [data-a="combatPick:ability:baton"]').click();
  assert.match(await page.locator('.combat-choice').textContent(),/Stun Charge/);
  assert.equal(await page.evaluate(()=>S.sd.units[0].acted),false,'Selection is not execution');
  const before=await page.evaluate(()=>({tech:S.sd.units[0].res.tech,buff:S.sd.units[0].buffStr}));
  await page.locator('[data-a="combatUse"]').click();
  await page.waitForFunction(()=>!S.sd.busy,{timeout:10000});
  const after=await page.evaluate(()=>({tech:S.sd.units[0].res.tech,buff:S.sd.units[0].buffStr,acted:S.sd.units[0].acted}));
  assert.equal(after.tech,before.tech-2,'Stun Charge costs 2 tech');
  assert.equal(after.buff,before.buff+3,'Stun Charge buffs strength');
  assert.equal(after.acted,false,'Stun Charge is free');
  await page.locator('.other-actions .combat-menu-toggle').click();
  await page.locator('.other-actions-menu [data-a="combatPick:other:avoidDamage"]').click();
  assert.match(await page.locator('.combat-choice').textContent(),/Evasion/);
  assert.equal(await page.evaluate(()=>!!S.sd.units[0].avoidDamage),false);
  await page.locator('[data-a="combatUse"]').click();
  await page.waitForFunction(()=>!S.sd.busy);
  assert.deepEqual(await page.evaluate(()=>({acted:S.sd.units[0].acted,avoid:!!S.sd.units[0].avoidDamage,bonus:avoidEva(S.sd.units[0])})),{acted:true,avoid:true,bonus:3});
  await page.evaluate(()=>{S.sd.obs=['5,4'];render()});
  assert.equal(await page.evaluate(()=>avoidEva(S.sd.units[0])),5,'Adjacent debris boosts evasion');
  await page.setViewportSize({width:1280,height:800});
  await page.evaluate(()=>{S.sd.sel=1;S.sd.combatMenuOpen=null;render()});
  await page.locator('.other-actions .combat-menu-toggle').click();
  await page.locator('.other-actions-menu [data-a="combatPick:other:rallySpirit"]').click();
  assert.match(await page.locator('.combat-choice').textContent(),/Rally Spirit/);
  assert.equal(await page.evaluate(()=>S.sd.mode),null,'Rally selection does not target');
  await page.locator('[data-a="combatUse"]').click();
  assert.equal(await page.evaluate(()=>S.sd.mode),'rallySpirit');
  const activation=await page.evaluate(async()=>{
    const sd=S.sd,u=sd.units[0],h=heroOf(u);
    h.ranks.innate=1;h.gear.arms2='bracer';sd.sel=0;sd.mode=null;sd.combatPick=null;
    u.acted=false;u.abUsed=[];u.buffStr=0;u.buffAcc=0;u.buffDice=0;u.res.tech=pwrMax(h);
    const initial=u.res.tech;
    await useAb('bracer');
    const kinetic={powerUsed:initial-u.res.tech,dice:u.buffDice,str:u.buffStr,
      showsPenalty:document.querySelector('.brest')?.textContent.includes('−1 Strength next attack')};
    h.base={...BASE(h),power:'overclock'};
    u.buffStr=0;u.buffAcc=0;u.buffDice=0;u.abUsed=[];u.res.tech=pwrMax(h);
    await usePower();
    const overclock={dice:u.buffDice,acc:u.buffAcc,str:u.buffStr};
    h.base.power='berserk';u.buffStr=0;u.buffAcc=0;u.buffDice=0;u.innUsed=0;u.capUsed=false;
    await usePower();
    const berserk={dice:u.buffDice,acc:u.buffAcc,str:u.buffStr,
      showsAccuracyPenalty:document.querySelector('.brest')?.textContent.includes('−1 accuracy next attack')};
    return {kinetic,overclock,berserk};
  });
  assert.deepEqual(activation,{
    kinetic:{powerUsed:3,dice:1,str:-1,showsPenalty:true},
    overclock:{dice:1,acc:1,str:-1},
    berserk:{dice:1,acc:-1,str:3,showsAccuracyPenalty:true}
  },'Abilities apply reduced bonuses, penalties and correct in-combat labels');
  assert.deepEqual(errors,[],'No browser errors');
  console.log('Simulated battle passed: mobile and desktop menus, persistent open state, Stun Charge, Avoid Damage and Rally targeting.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
