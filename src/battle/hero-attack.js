/* battle/hero-attack.js: Wounding villains and heroAttack. */
function woundV(){const sd=S.sd,v=sd.v;if(v.down)return true;const c=woundTarget(v);v.turnDamage=(v.turnDamage||0)+1;
  if(c){if(c===v.planned){v.planned=null;v.charge=null;v.warn=null;v.planningDone=true;}else v.deck.shift();v.wounds.push(c);}
  if(!remainingPages(v)){v.down=true;v.charge=null;
    if(sd.vl.every(o=>o.v.down)){endSd('win');return true}
    fxV('DEFEATED!','hit');log('sys',`${VILLAINS[sd.vkey].short} is down! Finish the other one.`);focusV(sd.vl.findIndex(o=>!o.v.down));return true}return false}
async function heroAttack(u,target,bonus=0,fixedDice=0,style){const sd=S.sd,h=heroOf(u),v=sd.v,b=BASE(h),tornBefore=v.wounds.length;
  if(letGo(u,'lets go of the civilians to fight.'))render();
  const aim=sd.aim,body=target==='v'&&v.sw?(aim&&swBodies(v).find(o=>o.x===aim.x&&o.y===aim.y&&cheb(u,o)<=stat(h,'range'))||swNear(v,u)):null;sd.aim=null;
  const side=target==='v'?sideOf(u,v,body):null,blind=side==='rear';if(blind){fxU(u,'BLIND SPOT!','good');log('hero',`${h.name} strikes from the blind spot: +1 die.`)}
  /* Version 113 (Tyler): side/rear bonus dice (Backstab, Frenzy, From the Shadows) only work in melee */
  const melee=target==='v'&&(body?cheb(u,body):dV(u,v))<=1,back=target==='v'&&side!=='front'&&melee?(u.buffBack||0)+(setOn(h,'noct')?1:0):0,call=target==='v'?(v.callout||0):0;if(call){v.callout=0;log('hero',`Callout: +${call} ${call===1?'die':'dice'} on this attack.`)}if(back)log('hero',`${h.name} strikes from the ${ARCN[side]} arc: +${back} more.`);
  const turret=setOn(h,'grid')&&!u.moved?1:0;if(turret)log('hero',`Turret Stance: ${h.name} hasn't moved yet, +1 die.`);
  const rel=target==='v'&&!u.noRel&&gearHas(h,'relent')&&u.relKey===sd.vkey?Math.min(1,u.relN||0):0;if(rel)log('hero',`Relentless: +${rel} ${rel===1?'die':'dice'} for keeping up the pressure.`);if(target==='v'&&!u.noRel)u.relHit=sd.vkey;
  const dice=(fixedDice||stat(h,'speed')+bonus)+(u.buffDice||0)+(target==='v'&&v.marked&&side!=='front'?1:0)+(blind?1:0)+back+call+turret+rel,strB=u.buffStr||0,accB=u.buffAcc||0,reap=target==='v'?(u.buffReap||0):0;u.buffDice=0;u.buffStr=0;u.buffAcc=0;u.buffBack=0;if(target==='v')u.buffReap=0;
  const acc=stat(h,'acc')+accB,rolls=[];let hits=0,wounds=0;
  await strikeAnim(style||b.fx,ctrU(u),target==='v'?(body?HC(body.x,body.y):ctrV()):ctrU(target),b.glow,'h'+u.hid);
  if(target==='v'){const eva=vStat('eva');
    for(let i=0;i<dice;i++){const r=d20();rolls.push(r);if(r===20||(r!==1&&r+acc>=eva))hits++}
    log('hero',`${h.name} attacks: rolled ${rolls.join(', ')} (+${acc}) vs evasion ${eva}. ${hits} hit${hits===1?'':'s'}.`);
    {const gm=hits?sd.hench.find(m=>m.elite&&m.owner===sd.vkey&&m.hp>0&&eliteOf(m.owner).guard&&dV(m,v)<=1):null;
      if(gm){hits--;gm.hp--;gm.hurtAt=Date.now();fxP(gm.x,gm.y,gm.hp<=0?'K.O.!':'BLOCKED!','hit');log('vill',`${eliteOf(gm.owner).name} steps in front of ${VILLAINS[sd.vkey].short} and takes the first hit.${gm.hp<=0?' He goes down.':''}`);if(gm.hp<=0)sd.hench=sd.hench.filter(m=>m!==gm);render()}}
    if(!hits){fxV('WHIFF!','miss');render();return}
    if(v.hide){v.hide=false;fxU(u,'GOTCHA!','good');log('hero',`${h.name} lands a hit and reads her stance. ${VILLAINS[sd.vkey].short}'s facing is revealed.`)}
    const ranged=dV(u,v)>1,close=body&&swBodies(v).some(o=>o.i!==body.i&&cheb(o,body)===1);
    if(body)log('hero',`${h.name} strikes the ${SWN[body.k].toLowerCase()} body from its ${ARCN[side]} arc.${close?' Another body is right beside it: +2 toughness.':''}`);
    let spin=false,powerDrain=0,counter=0,flee=false,drain=0,summon=0,push=0,wall=false,pull=0,hide=false,bombAt=0,fuseTick=false,reflect=0,flash=false;const rows=[],q={splash:[]};
    for(let i=0;i<hits&&!sd.result;i++){let tc=drawTactic();if(tc.sig)tc={...tc,...rxOf(tc.sig,tc.id)};if(v.repress){v.repress=false;log('hero',`${tc.n} is revealed and repressed.`);if(v.repressComp){v.repressComp=false;h.comp=Math.min(stat(h,'maxComp'),h.comp+2);fxU(u,'+2 COMPOSURE','good');log('hero',`${h.name} restores 2 composure.`)}tc={id:'glance',n:tc.n+' (repressed)',txt:'Repressed: this reaction has no effect. Roll to wound normally.'};}const okArc=!tc.arc||tc.arc.includes(side),okRng=!tc.ranged||ranged,okPart=!tc.part||(body&&body.k===tc.part),inArc=okArc&&okRng&&okPart;
      const why=!tc.sig?'':!okPart?`${h.name} hit the ${body?SWN[body.k].toLowerCase():''} body, not the ${SWN[tc.part].toLowerCase()}, so it does nothing.`:!okRng?`${h.name} is adjacent, and it only answers ranged attacks.`:tc.ranged&&okArc?`${h.name} attacked from range: it triggers!`:'';
      const note=why||(tc.arc&&side?`${h.name} struck from the ${ARCN[side]} arc: ${inArc?'it triggers!':'wrong side, it does nothing.'}`:'');
      if(tc.sig&&!inArc){log('hero',why||`${tc.n} only works in the ${arcTxt(tc.arc)}. ${h.name} is in the ${ARCN[side]} arc, so it does nothing.`);fxU(u,!okPart?'WRONG BODY!':!okRng?'TOO CLOSE!':'WRONG SIDE!','good')}
      let tough=vStat('tough')+(close?2:0),auto=false,block=false,blockTxt='A civilian is in the way.';
      if(tc.sig&&inArc){if(tc.auto)auto=true;powerDrain+=tc.drainPower||0;tough+=(tc.tough||0)+(tc.gorge?2*Math.min(3,v.ate||0):0);if(tc.dmg&&(!tc.adj||dV(u,v)<=1))counter+=tc.dmg;drain+=(tc.comp?tc.comp+compBonus(v.level):0)||0;summon+=tc.summon||0;if(tc.escape)flee=true;if(tc.push&&(!tc.adj||dV(u,v)<=1))push=Math.max(push,tc.push);if(tc.pull)pull=Math.max(pull,tc.pull);if(tc.hide)hide=true;if(tc.spin)spin=true;if(tc.wall)wall=true;if(tc.bomb)bombAt=Math.max(bombAt,tc.bomb);if(tc.fuse)fuseTick=true;if(tc.reflect)reflect=Math.max(reflect,tc.reflect);if(tc.flash)flash=true;
        if(tc.guard&&sd.hench.some(hm=>dV(hm,v)<=1)){block=true;blockTxt='A henchman takes the blow.'}}
      else if(!tc.sig){if(tc.id==='weak')auto=true;if(tc.id==='armor')tough+=4;if(tc.id==='over')tough-=4;if(tc.id==='counter')counter+=2;
      if(tc.id==='shield'&&sd.civs.some(c=>dV(c,v)<=2))block=true;if(tc.id==='escape')flee=true}
      const r=d20(),str=stat(h,'str')+strB,ok=!block&&(auto||r===20||(r!==1&&r+str>=tough));
      const rollTxt=block?blockTxt:auto?`${tc.sig?tc.n:'Weak point'}: the wound lands.`:`Wound roll ${r} + ${str} vs toughness ${tough}.`;
      log('hero',`${tc.n}: ${rollTxt} ${ok?'Wound!':block?'':'No wound.'}`);
      const rw={tc,note,off:tc.sig&&!inArc,auto,block,blockTxt,r,str,tough,ok};rows.push(rw);
      if(ok&&v.satellites>0){dropSatellite(v,u);rw.ok=false;rw.block=true;rw.blockTxt='A scrap satellite absorbs the wound.';continue;}
      if(ok){wounds++;sd.woundsBy[h.id]=(sd.woundsBy[h.id]||0)+1;if(tc.id==='mono')h.comp=Math.min(stat(h,'maxComp'),h.comp+1);
        q.page=null;const end=await woundAnim(`${h.name}: ${rollTxt}`,q);rw.page=q.page;if(end)break}}
    await attackPanel({name:h.name,acc,eva,rolls,hits,rows});
    fxV(wounds>=3?'KA-BOOM!':wounds?pick(SFX_HIT):rows.some(o=>o.block)?'NO!':'CLANG!',wounds?'hit':'miss');render();
    await breakStack(q.splash);
    if(wounds&&setOn(h,'bomber')&&!sd.result){const hm=sd.hench.filter(m=>cheb(m,u)<=1);if(hm.length){await A.ring(ctrU(u),COL.yel,2.4);hm.forEach(m=>{m.hp-=1;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'SHRAPNEL!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);log('hero',`Shrapnel: ${hm.length} henchm${hm.length===1?'an':'en'} next to ${h.name} take 1.`);render()}}
    sd.reactionContext=true;try{
    if(powerDrain&&!sd.result){u.res.tech=Math.max(0,(u.res.tech||0)-powerDrain);log('vill',`${h.name} loses ${powerDrain} Power to feedback.`);}
    if(counter&&!sd.result){log('vill',`Reaction! ${h.name} takes ${counter}.`);await strikeAnim('slash',ctrV(),ctrU(u),COL.mag,'v'+S.sd.vi);fxU(u,'OOF!','vhit');damageHero(u,counter);render()}
    if(drain&&!sd.result){h.comp=Math.max(0,h.comp-drain);fxU(u,'RATTLED!','vhit');log('vill',`${h.name} loses ${drain} composure.`);render()}
    if(push&&!u.ko&&u.anchor&&!sd.result){fxU(u,'ANCHORED!','good');log('hero',`${h.name} is anchored and holds firm.`)}
    if(push&&!u.ko&&!u.anchor&&!sd.result){let n=0;for(let i=0;i<push;i++){const t=benchTile(u,v,(a,b)=>dV(b,v)-dV(a,v));if(!t||dV(t,v)<=dV(u,v))break;u.x=t.x;u.y=t.y;n++}if(n){log('vill',n>1?`${h.name} is flung ${n} hexes back.`:`${h.name} is shoved back.`);render();await sleep(260)}else log('vill',`${h.name} is pinned in place and can't be shoved.`)}
    if(pull&&!u.ko&&u.anchor&&!sd.result){fxU(u,'ANCHORED!','good');log('hero',`${h.name} is anchored and holds firm.`)}
    if(pull&&!u.ko&&!u.anchor&&!sd.result){let n=0;for(let i=0;i<pull;i++){const t=benchTile(u,v,(a,b)=>dV(a,v)-dV(b,v));if(!t||dV(t,v)>=dV(u,v))break;u.x=t.x;u.y=t.y;n++}if(n){fxU(u,'YANKED!','vhit');log('vill',`${h.name} is dragged ${n} hex${n>1?'es':''} toward ${VILLAINS[sd.vkey].short}.`);render();await sleep(260)}}
    if(wall&&!sd.result){const t=benchTile(u,v,(a,b)=>dV(a,v)-dV(b,v));if(t){sd.walls.push({k:t.x+','+t.y,ttl:2});await A.smoke(HC(t.x,t.y),2);log('vill','A scaffold wall slams down.');render()}}
    for(let n=0;n<summon&&!sd.result;n++){const t=freeTiles((x,y)=>dV({x,y},v)===1)[0];if(!t)break;sd.hench.push({id:'r'+Date.now()+n,owner:sd.vkey,x:t.x,y:t.y,hp:regularHenchHp(sd.vkey)});fxP(t.x,t.y,'BACKUP!','say');log('vill',`A ${VILLAINS[sd.vkey].hench.name.toLowerCase()} joins the fight.`);render()}
    if(bombAt&&!sd.result&&!u.ko&&dropBomb(u.x,u.y,1,dmgScale(bombAt))){fxU(u,'TSSS!','vhit');log('vill',`${VILLAINS[sd.vkey].short} leaves a lit bomb at ${h.name}'s feet.`);render()}
    if(flee&&!sd.result){const was=JSON.stringify(vCells(v)),from={x:v.x,y:v.y};await vMove(()=>vAway(u,2,{strict:true}));if(JSON.stringify(vCells(v))!==was){fxV('HA HA!','say');log('vill','The villain slips out of reach.');jumpDupe(v,from)}else{fxV('CORNERED!','good');log('vill','The villain tries to slip away, but there is nowhere to go.')}}
    if(wounds&&!u.ko){if(reap){const n=reap*wounds;h.hp=Math.min(stat(h,'maxHp'),h.hp+n);fxU(u,`+${n} HP`,'good');log('hero',`${h.name} reaps ${n} health.`)}
      if(v.wounds.length>tornBefore)sigBreak(h,v);const aw=h.ranks.magic?stat(h,'arcWound'):0;if(aw&&u.res){const was=u.res.magic||0;u.res.magic=Math.min(arcMax(h),was+aw);if(u.res.magic>was)log('hero',`${h.name} draws ${u.res.magic-was} Arcana from the torn page.`)}}
    if(fuseTick&&!sd.result&&sd.bombs&&sd.bombs.length){fxV('FZZT!','say');log('vill','Short Fuse! Every bomb on the board ticks down 1.');await bombTick()}
    if(reflect&&!sd.result&&!u.ko&&!v.down){fxV('PTCHOO!','say');log('vill',`Reflector Visor! The attack bounces back at ${h.name} as a beam.`);await fireBeams([aimLine(v,u)],dmgScale(reflect),'Reflector Visor')}
    if(flash&&!sd.result){const lm=litMap(),on=live().filter(o=>lm[o.x+','+o.y]);fxV('FLASH!','say');
      if(on.length){for(const o of on){fxU(o,'ZZT!','vhit');damageHero(o,optic(1))}log('vill',`Flashback! Every lit beam pulses: ${on.map(o=>heroOf(o).name).join(', ')} take${on.length>1?'':'s'} ${optic(1)}.`);checkLoss()}
      else log('vill','Flashback! The beams pulse, but nobody is standing in one.');render()}
    if(spin&&!sd.result&&!v.down){v.face=rnd(6)-1;noFlip.add('v'+sd.vi);log('vill',`${VILLAINS[sd.vkey].short} whirls to face a new direction.`)}
    if(hide&&!sd.result&&!v.down){v.hide=true;log('vill',`${VILLAINS[sd.vkey].short} melts back into the shadows. Her facing is hidden again.`);render()}
    }finally{sd.reactionContext=false}
  }else{const hm=target,meva=hm.elite?eliteEva(hm):7;for(let i=0;i<dice;i++){const r=d20();rolls.push(r);if(r===20||(r!==1&&r+acc>=meva))hits++}
    if(hits&&hm.elite&&eliteOf(hm.owner||sd.vkey).brute&&hm.shrug!==sd.round){hm.shrug=sd.round;hits--;log('vill',`${hName(hm)} shrugs off the first hit this round.`)}
    hm.hp-=hits;hm.hurtAt=Date.now();log('hero',`${h.name} hits ${hName(hm)}: rolled ${rolls.join(', ')}. ${hits} damage.`);
    fxP(hm.x,hm.y,hm.hp<=0?'K.O.!':hits?pick(SFX_HIT):'WHIFF!',hits?'hit':'miss');
    if(hm.hp<=0){render();await A.smoke(ctrU(hm),4);sd.hench=sd.hench.filter(o=>o!==hm);log('hero','Henchman down.')}render()}}
