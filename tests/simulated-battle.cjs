const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('file://'+process.cwd()+'/index.html');
  await page.evaluate(()=>{
   newCampaign();recruitQuick('volt');recruitQuick('wisp');recruitQuick('bulwark');recruitQuick('lynx');
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
    runic:GEAR.runeblade.ab.fx.str,stun:GEAR.baton.ab.fx.str,trinity:GEAR.crown.ab.fx,
    kinetic:GEAR.bracer.ab.fx,slug:GEAR.shotgun.ab.fx.str,
    overclock:POWERS.overclock.txt,berserk:POWERS.berserk.txt,
    kineticDescription:abTxt(GEAR.bracer.ab)
  }));
  assert.deepEqual({runic:balance.runic,stun:balance.stun,trinity:balance.trinity,kinetic:balance.kinetic,slug:balance.slug},
    {runic:3,stun:3,trinity:{foresee:1,reactionPeek:1},kinetic:{dice:1,str:-1,reactionWard:1},slug:5},'Seven-ability balance numbers');
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
  assert.equal(await page.evaluate(()=>S.sd.mode),'rallySpirit','Rally selection goes straight to board targeting');
  assert.equal(await page.locator('.combat-choice [data-a="combatUse"]').count(),0,'No Use action button for board targets');
  assert.match(await page.locator('.combat-board-prompt').textContent(),/Click the board to activate/);
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

  // Source-level balance values plus live combat calculations (one workflow, no extra suite).
  const gearBalance=await page.evaluate(async()=>{
    newCampaign();recruitQuick('volt');recruitQuick('wisp');recruitQuick('bulwark');recruitQuick('lynx');
    S.guide=null;S.tut={dq:[],skip:true};S.tutDone=true;
    const w=S.heroes.find(h=>h.cls==='wisp'),h=S.heroes.find(h=>h.cls==='volt');
    w.gear={body:'shroud',head:'hood',legs:'moonslip',acc:'sunamulet',acc2:'sunamulet'};
    const stackedEvasion=stat(w,'eva');
    const passives=Object.fromEntries(['suit','cloak','shroud','hood','moonslip','sunamulet','owlpend','charm','nmask','shed','faraday','wings','robes','moonshade']
      .map(k=>[k,GEAR[k].mods.eva||0]));
    const values={groundOut:GEAR.suit.ab.fx.dr,
      aegisText:POWERS.aegis.txt,moonstep:GEAR.moonslip.ab.fx.eva,moonshade:GEAR.moonshade.ab.fx.eva,
      sunstone:GEAR.sunamulet.mods,owl:GEAR.owlpend.mods,circuit:GEAR.charm.mods,
      compeyes:GEAR.compeyes.mods,mutagen:GEAR.mutagen.mods,
      reqs:[GEAR.compeyes.reqs.innate,GEAR.mutagen.reqs.innate],
      tierTwoHas:ARC_UNLOCK[2].some(k=>k==='gear:mutagen'||k==='gear:compeyes'),
      midHas:MID_UNLOCK.includes('gear:mutagen')&&MID_UNLOCK.includes('gear:compeyes')};
    S.inv={v:S.villains[0].key,clues:2};startShowdown();
    S.sd.intro=false;S.sd.busy=false;S.sd.civs=[];S.sd.hench=[];S.sd.bombs=[];S.sd.beams=[];
    const u=S.sd.units.find(q=>q.hid===h.id);
    const take=(level,damage=5,shield=0)=>{
      h.ranks={tech:level,innate:0,magic:0};h.gear={};h.hp=100;u.dr=5;u.absorb=shield;
      damageHero(u,damage);return 100-h.hp;
    };
    const reductions=[1,2,3,4,5].map(lv=>take(lv));
    const absorption=take(1,5,2),minimumDamage=take(5,1);
    h.ranks={tech:3,innate:2,magic:0};
    h.gear={head:'surveyor',body:'buttress',arms:'jackhammer',belt:'rebarbelt'};
    h.hp=100;u.dr=5;u.absorb=0;
    const architect=setOn(h,'architect'),brace=auraOn(u,'brace');
    damageHero(u,7);const combined=100-h.hp;
    h.ranks={tech:1,innate:1,magic:3};h.gear={};
    h.base={...BASE(h),power:'aegis'};
    h.hp=stat(h,'maxHp');u.res.magic=arcMax(h);u.absorb=0;u.acted=false;u.ko=false;u.x=4;u.y=4;
    const ally=S.sd.units.find(q=>q.hid!==h.id);
    ally.x=4;ally.y=5;ally.absorb=0;ally.ko=false;
    S.sd.sel=S.sd.units.indexOf(u);S.sd.mode=null;
    await usePower();
    const aegis={self:u.absorb,ally:ally.absorb};
    h.ranks={tech:0,innate:2,magic:0};h.gear={head:'compeyes',legs:'mutagen'};
    S.issue=7;S.unlocked.push('gear:compeyes','gear:mutagen');S.v133=false;S.armory=[];
    migrateV133();
    const migration={moved:S.armory.slice().sort(),gear:Object.keys(h.gear),
      unlocked:S.unlocked.includes('gear:mutagen')||S.unlocked.includes('gear:compeyes')};
    return {stackedEvasion,passives,values,reductions,absorption,minimumDamage,architect,brace,combined,aegis,migration};
  });
  assert.equal(gearBalance.stackedEvasion,16,'Tier-1 Evasion stacking reduced');
  assert.deepEqual(gearBalance.passives,{
    suit:2,cloak:1,shroud:2,hood:1,moonslip:1,sunamulet:0,owlpend:0,charm:0,
    nmask:2,shed:2,faraday:2,wings:3,robes:3,moonshade:2
  },'All fourteen passive Evasion changes');
  assert.equal(gearBalance.values.groundOut,1);
  assert.match(gearBalance.values.aegisText,/next 2 damage/);
  assert.deepEqual([gearBalance.values.moonstep,gearBalance.values.moonshade],[1,3]);
  assert.deepEqual(gearBalance.values.sunstone,{maxComp:2});
  assert.deepEqual(gearBalance.values.owl,{maxHp:2,maxComp:1});
  assert.deepEqual(gearBalance.values.circuit,{maxComp:2});
  assert.deepEqual(gearBalance.values.compeyes,{acc:4,eva:1,maxComp:2});
  assert.deepEqual(gearBalance.values.mutagen,{move:1,eva:1,maxHp:2});
  assert.deepEqual(gearBalance.values.reqs,[3,3]);
  assert.equal(gearBalance.values.tierTwoHas,false);
  assert.equal(gearBalance.values.midHas,true);
  assert.deepEqual(gearBalance.reductions,[4,4,3,3,2],'Guard cap by total level');
  assert.equal(gearBalance.absorption,2,'Absorption is separate from Guard cap');
  assert.equal(gearBalance.minimumDamage,1,'Guard never drops a hit below 1');
  assert.equal(gearBalance.architect,true);
  assert.equal(gearBalance.brace,true);
  assert.equal(gearBalance.combined,4,'Set, aura, and Guard share one cap');
  assert.deepEqual(gearBalance.aegis,{self:2,ally:2},'Arcane Aegis absorbs 2 for each recipient');
  assert.deepEqual(gearBalance.migration,{moved:['compeyes','mutagen'],gear:[],unlocked:false},'Moved gear returned to armory');
  // Validate the attack-dice rebalance in actual activated gear and paired setups.
  const diceBalance=await page.evaluate(async()=>{
    newCampaign();recruitQuick('volt');recruitQuick('wisp');recruitQuick('bulwark');recruitQuick('lynx');S.guide=null;S.tut={dq:[],skip:true};S.tutDone=true;
    const h=S.heroes.find(x=>x.cls==='volt');
    h.ranks={tech:4,innate:4,magic:4};h.gear={};
    S.inv={v:S.villains[0].key,clues:2};startShowdown();
    const sd=S.sd;sd.intro=false;sd.busy=false;sd.sel=0;
    sd.civs=[];sd.hench=[];sd.bombs=[];sd.beams=[];
    const u=sd.units[0];u.x=4;u.y=4;u.ko=false;
    const used=[];
    for(const id of ['wraps','gaunt','stinger','blades','claws','lance','soulreaver']){
      h.gear={arms:id};if(GEAR[id].two)h.gear.arms2=id;
      u.res.tech=pwrMax(h);u.res.magic=arcMax(h);
      u.abUsed=[];u.innUsed=0;u.capUsed=false;u.abRd=false;
      u.buffDice=0;u.buffStr=0;u.buffAcc=0;u.buffBack=0;u.acted=false;
      const before={power:u.res.tech,arcana:u.res.magic};
      await useAb(id);
      used.push({id,dice:u.buffDice,str:u.buffStr,acc:u.buffAcc,back:u.buffBack,
        spentPower:before.power-u.res.tech,spentArcana:before.arcana-u.res.magic,
        description:abTxt(GEAR[id].ab)});
    }
    h.gear={arms:'gaunt',arms2:'gaunt'};
    const pairedGaunt=pairFx(h,GEAR.gaunt);
    h.gear={arms:'blades',arms2:'blades'};
    const pairedBackstab=pairFx(h,GEAR.blades);
    h.gear={arms:'claws'};
    const soloClawAcc=stat(h,'acc'),soloClawStr=stat(h,'str'),soloClawSpeed=stat(h,'speed');
    h.gear.arms2='claws';
    const pairedClawAcc=stat(h,'acc'),pairedClawStr=stat(h,'str'),pairedClawSpeed=stat(h,'speed');
    const pairedFrenzy=pairFx(h,GEAR.claws);
    return {used,pairedGaunt,pairedBackstab,pairedClawAcc,soloClawAcc,soloClawStr,pairedClawStr,soloClawSpeed,pairedClawSpeed,pairedFrenzy};
  });
  assert.deepEqual(diceBalance.used.map(({id,dice,str,acc,back,spentPower,spentArcana})=>
    ({id,dice,str,acc,back,spentPower,spentArcana})),[
      {id:'wraps',dice:1,str:0,acc:-3,back:0,spentPower:0,spentArcana:0},
      {id:'gaunt',dice:1,str:0,acc:-2,back:0,spentPower:4,spentArcana:0},
      {id:'stinger',dice:1,str:0,acc:-2,back:0,spentPower:3,spentArcana:0},
      {id:'blades',dice:0,str:-2,acc:0,back:1,spentPower:0,spentArcana:0},
      {id:'claws',dice:0,str:0,acc:-3,back:2,spentPower:0,spentArcana:0},
      {id:'lance',dice:1,str:3,acc:-3,back:0,spentPower:4,spentArcana:0},
      {id:'soulreaver',dice:1,str:0,acc:-2,back:0,spentPower:0,spentArcana:5}
    ],'Seven abilities apply dice and penalty effects with unchanged activation costs');
  assert.deepEqual(diceBalance.pairedGaunt,{dice:1,acc:-2},'Pairing Coil Gauntlets does not restore Strength');
  assert.deepEqual(diceBalance.pairedBackstab,{back:2,str:-2},'Paired Umbral Blades retain their original extra flanking die');
  assert.equal(diceBalance.pairedClawAcc,diceBalance.soloClawAcc-1,'Paired Graft Claws lose 1 Accuracy');
  assert.equal(diceBalance.pairedClawStr,diceBalance.soloClawStr+2,'Paired Graft Claws add only the second claw\'s +2 Strength');
  assert.equal(diceBalance.pairedClawSpeed,diceBalance.soloClawSpeed+1,'Paired Graft Claws give +1 attack die');
  assert.deepEqual(diceBalance.pairedFrenzy,{back:2,acc:-3},'Pairing does not add an extra Frenzy flanking die');
  for(const item of diceBalance.used)assert.doesNotMatch(item.description,/\\+−|\\+-/,'Penalty display on '+item.id);
  assert.match(diceBalance.used.find(x=>x.id==='blades').description,/−2 Strength/,'Backstab Strength penalty visible');
  assert.match(diceBalance.used.find(x=>x.id==='lance').description,/−3 accuracy/,'Plasma Burst Accuracy penalty visible');
  assert.deepEqual(errors,[],'No browser errors');
  console.log('Simulated battle passed: mobile and desktop menus, persistent open state, Stun Charge, Avoid Damage and Rally targeting.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
