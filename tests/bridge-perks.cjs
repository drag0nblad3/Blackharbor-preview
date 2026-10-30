const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('file://'+process.cwd()+'/index.html');
    const r=await page.evaluate(async()=>{
      const out=[];const check=(n,c)=>{out.push(n);if(!c)throw new Error('FAIL '+n)};
      newCampaign();Object.keys(HERO_BASE).slice(0,4).forEach(recruitQuick);
      S.tut={dq:[],skip:true};S.tutDone=true;S.inv={v:S.villains[0].key,clues:2};
      startShowdown();const sd=S.sd;sd.intro=false;sd.busy=false;sd.sel=0;sd.mode=null;
      const u=sd.units[0],h=heroOf(u);
      const setR=(t,i,m)=>{h.ranks={tech:t,innate:i,magic:m};u.res={tech:pwrMax(h),magic:arcMax(h)}};
      setR(1,0,1);check('no bridge below rank 2',!bridgesOf(h).length);
      // Technomancer
      h.gear={head:'visor',body:'suit',acc:'earpiece'};
      setR(2,0,2);check('Technomancer needs a big enough pool',pwrMax(h)>=5);check('Technomancer on at 2/2',bridgeOn(h,'techno')&&!bridgeOn(h,'paragon'));
      u.res.tech=pwrMax(h);u.res.magic=0;
      check('trade buttons in the panel',bridgeRow(u,h).includes('bridge:toArc')&&!/toArc"[^>]*disabled/.test(bridgeRow(u,h)));
      bridgeAct('toArc');check('3 Power to 1 Arcana',u.res.tech===pwrMax(h)-3&&u.res.magic===1);
      bridgeAct('toPwr');check('second trade blocked this round',u.res.magic===1&&u.convRd);
      u.convRd=false;bridgeAct('toPwr');check('1 Arcana to 3 Power',u.res.magic===0&&u.res.tech===pwrMax(h));
      // Augmented
      h.gear={head:'visor',body:'suit',acc:'earpiece'};setR(2,2,0);check('Augmented on',bridgeOn(h,'augment'));h.hp=stat(h,'maxHp');u.res.tech=0;u.dr=0;u.absorb=0;u.augRd=false;
      damageHero(u,2);check('gain Power equal to damage',u.res.tech===Math.min(2,pwrMax(h)));
      const t0=u.res.tech;damageHero(u,1);check('once per round',u.res.tech===t0);
      // Primal
      setR(0,2,2);check('Primal on',bridgeOn(h,'primal'));
      const mk=Object.keys(GEAR).find(k=>GEAR[k].type==='magic'&&GEAR[k].ab&&GEAR[k].ab.c>=2&&!GEAR[k].ab.act&&!GEAR[k].ab.mode&&!Object.keys(GEAR[k].ab.fx||{}).some(f=>['eclipse','gain','again','move','boost','mark'].includes(f)));
      h.gear={};h.gear[GEAR[mk].slot==='arms'?'arms':GEAR[mk].slot]=mk;h.comp=3;u.abUsed=[];
      const c=GEAR[mk].ab.c;u.res.magic=c-1;u.bloodPay=false;
      check('without Blood Price it is too costly',!abOk(u,h,mk));
      bridgeAct('blood');check('Blood Price toggles on',u.bloodPay);
      check('with Blood Price it is affordable',abOk(u,h,mk));
      payAb(u,mk);check('pays 1 less Arcana and 1 composure',u.res.magic===0&&h.comp===2);
      // Paragon
      setR(2,2,2);check('Paragon on with all pairs',bridgesOf(h).length===4);
      u.abUsed=[];u.res.magic=20;u.bloodPay=false;payAb(u,mk);check('Paragon allows a second use this round',abOk(u,h,mk));
      setR(2,2,1);u.abUsed=[mk];u.res.magic=20;check('without Paragon the round limit holds',!abOk(u,h,mk));
      // Capstones (no stats)
      h.gear={};h.injuries=[];setR(0,5,0);h.comp=0;
      check('Innate capstone: not Shaken',stat(h,'acc')===stat({...h,comp:1},'acc'));
      check('Innate capstone: no extra HP',stat(h,'maxHp')===stat({...h,ranks:{tech:0,innate:4,magic:0}},'maxHp'));
      h.hp=3;u.ko=false;u.lastSt=false;u.dr=0;u.absorb=0;u.res.tech=0;damageHero(u,9);check('Innate capstone: survives with 1 HP',h.hp===1&&!u.ko);
      damageHero(u,9);check('Innate capstone: only once per fight',u.ko);
      setR(5,0,0);check('Tech capstone: no accuracy',stat(h,'acc')===stat({...h,ranks:{tech:4,innate:0,magic:0}},'acc'));
      setR(0,0,5);const v=sd.v;v.down=false;v.charge={n:'Test Blast',dmg:3,zone:[],w0:v.wounds.length,need:9};sigBreak(h,v);check('Magic capstone: tear staggers a charge at once',!v.charge);
      setR(0,0,4);v.charge={n:'Test Blast',dmg:3,zone:[],w0:v.wounds.length,need:9};sigBreak(h,v);check('below rank 5 the charge holds',!!v.charge);v.charge=null;
      setR(0,0,5);check('Magic capstone: no composure',stat(h,'maxComp')===stat({...h,ranks:{tech:0,innate:0,magic:4}},'maxComp'));
      return out;
    });
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('bridge-perks: '+r.length+' checks passed');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
