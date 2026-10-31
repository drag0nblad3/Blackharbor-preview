/* battle/turns.js: Splash, end of fight, villainPhase (the villain round) and debrief. */
async function splash(target){const sd=S.sd;const from=target==='v'?ctrV():ctrU(target);
  const near=sd.hench.filter(h=>h!==target&&(target==='v'?dV(h,sd.v)<=1:cheb(h,target)<=1));if(!near.length)return;
  await Promise.all(near.map(h=>A.bolt(from,ctrU(h),COL.magic,true)));
  near.forEach(h=>{h.hp--;h.hurtAt=Date.now();fxP(h.x,h.y,h.hp<=0?'K.O.!':'ZAP!','hit')});const dead=near.filter(h=>h.hp<=0);sd.hench=sd.hench.filter(h=>h.hp>0);
  log('hero',`Arc Burst jumps to ${near.length} henchm${near.length===1?'an':'en'}${dead.length?`, dropping ${dead.length}`:''}.`);render()}
function endSd(r){S.sd.result=r;S.sd.mode=null;S.sd.sel=null;if(r==='win')fxV('DEFEATED!','hit');
  log('sys',r==='win'?'The villain\'s playbook is empty. Victory!':r==='loss'?'Every hero is down.':'The villain escapes before you can finish it.')}
function checkLoss(){if(!S.sd.result&&!live().length)endSd('loss')}
async function villainPhase(){const sd=S.sd;if(!sd||sd.result||sd.busy)return;sd.busy=true;sd.vturn=true;sd.mode=null;sd.sel=null;render();await sleep(250);
  beamTick();await hazardTick();checkLoss();await bombTick();checkLoss();
  for(let i=0;i<sd.vl.length&&!sd.result;i++){if(sd.vl[i].v.down)continue;focusV(i);const v=sd.v,vn=VILLAINS[sd.vkey].name;
    await resolveBossSetup(v);if(sd.result||v.down)continue;
    delete v.fadeEva;const finishBorrow=beginBorrowedAction(v),dup=takeDupes(v);let acted=null;try{
    if(v.skip){v.skip=false;cancelPlan(v);log('hero',`${vn} loses its planned action.`);}
    else if(v.charge){await fireCharge();if(v.planned){v.discard.push(v.planned);v.planned=null;}checkLoss();}
    else if(v.planned){const c=v.planned;await reveal(villainCardView(c));markSeen(sd.vkey,c.id);
      v.last=c;v.foresee=false;log('vill',`${vn} plays ${c.n}.`);fxV(c.n.toUpperCase()+'!','say');render();await sleep(300);
      await execCard(c);acted=c;if(!v.charge){v.planned=null;v.discard.push(c);}
      if(v.sw){const r=swSync(v);r.grew.forEach(k=>log('vill',`The ${SWN[k].toLowerCase()} body re-forms.`));}}
    else log('hero',`${vn}'s planned action was torn out.`);
    await dupeTurn(v,acted,dup);
    }finally{finishBorrow()}
    checkLoss();render();await sleep(300)}
  for(const hm of sd.hench.slice()){if(sd.result)break;if(!sd.hench.includes(hm))continue;await henchAct(hm);checkLoss();render();await sleep(120)}
  if(!sd.result){sd.units.forEach(civFollow);await civPanic()}
  sd.units.forEach(u=>u.guard=false);sd.vl.forEach(o=>{o.v.hex=false;o.v.marked=false;o.v.cursed=false;o.v.callout=0;o.v.blind=false;o.v.excise=0});sd.walls.forEach(w=>{if(!w.perm)w.ttl--});{const fall=sd.walls.filter(w=>w.girder&&w.ttl<=0);sd.walls=sd.walls.filter(w=>w.ttl>0);
    for(const w of fall){const[x,y]=w.k.split(',').map(Number),t=live().filter(u=>cheb(u,{x,y})===1).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];await A.smoke(HC(x,y),4);
      if(t){fxU(t,'CRASH!','vhit');log('vill',`A girder topples onto ${heroOf(t).name} for ${w.dmg}.`);damageHero(t,w.dmg)}else log('vill','A girder topples over and hits nobody.');render()}checkLoss()}
  sd.vl.forEach(o=>{o.v.turnDamage=0;o.v.planningDone=false});focusV(sd.vl.findIndex(o=>!o.v.down));vWarn();
  if(!sd.result){sd.round++;
    {sd.units.forEach(u=>{u.stasis=false;u.reactionWard=false;u.hexesMoved=0;u.moved=!!u.dazed;u.dazed=false;u.acted=false;u.freeEvac=false;u.buffDice=0;u.buffStr=0;u.buffAcc=0;u.buffBack=0;u.buffReap=0;u.buffEva=0;u.avoidDamage=false;u.dr=0;u.anchor=false;if(u.capUsed&&!u.abRd)u.capUsed=false;u.abRd=false;u.innUsed=0;u.abUsed=[];u.augRd=false;u.convRd=false;u.jump=false;u.ripo=false;u.ripUsed=false;u.reflect=0;
        if(u.relHit){u.relN=u.relHit===u.relKey?(u.relN||0)+1:1;u.relKey=u.relHit}else{u.relN=0;u.relKey=null}u.relHit=null;
        const h=heroOf(u);u.anchor=setOn(h,'lode');if(!u.ko){if(setOn(h,'cantor'))h.comp=Math.min(stat(h,'maxComp'),h.comp+1);if(setOn(h,'serpent'))h.hp=Math.min(stat(h,'maxHp'),h.hp+1)}u.lowP=(u.res.tech||0)<=1;u.res.tech=Math.min(pwrMax(h),(u.res.tech||0)+pwrRegen(h));u.res.magic=Math.min(arcMax(h),u.res.magic||0);if(S.facilities.includes('sanctum')&&!u.ko)h.comp=Math.min(stat(h,'maxComp'),h.comp+1)});
      roster().forEach(h=>{if(h.cd>0)h.cd--});
      sd.units.forEach(u=>{const h=heroOf(u);if(u.ko||!setOn(h,'helios'))return;const hm=sd.hench.filter(m=>cheb(m,u)<=1);if(!hm.length)return;hm.forEach(m=>{m.hp-=1;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'SIZZLE!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);log('hero',`Corona: ${h.name} scorches ${hm.length} henchm${hm.length===1?'an':'en'}.`)});
      {const got={mend:[],calm:[],charge:[]};sd.units.forEach(u=>{if(u.ko)return;const h=heroOf(u);
        if(auraOn(u,'mend')&&h.hp*2<=stat(h,'maxHp')){h.hp++;got.mend.push(h.name)}
        if(auraOn(u,'calm')&&h.comp*2<=stat(h,'maxComp')){h.comp++;got.calm.push(h.name)}
        if(auraOn(u,'charge')&&pwrMax(h)&&u.lowP&&(u.res.tech||0)<pwrMax(h)){u.res.tech++;got.charge.push(h.name)}});
        for(const id in got)if(got[id].length)log('hero',`${AURA_FX[id].n}: ${got[id].join(', ')} ${id==='mend'?'regain 1 health':id==='calm'?'regain 1 composure':'recharge 1 more Power'}.`)}
      log('sys',`Round ${sd.round}. Your move.`)}}
  sd.busy=false;sd.vturn=false;render()}

function debrief(){const sd=S.sd,vs=vState(sd.vkey),def=VILLAINS[sd.vkey],L=[],res=sd.result;
  const evT=S.ethos.b==='secret'?Math.min(1,sd.evac):sd.evac,per=S.ethos.a==='force'?2:1;
  if(sd.termGot)L.push(`Evidence terminal hacked: +${sd.termGot} intel.`);
  S.trust+=evT-sd.harmed*per;L.push(`${sd.evac} civilian${sd.evac===1?'':'s'} evacuated (+${evT} trust), ${sd.harmed} harmed (−${sd.harmed*per} trust).`);
  eliteSalvage(L);
  let headline;
  if(res==='win'){const sal=Math.max(1,3+diffOf().sal+(sd.quality==='prepared'?1:0)+fieldCount('salvage')+(S.facilities.includes('magnet')?1:0));S.salvage[sd.vkey]+=sal;S.tech++;L.push(`Salvaged ${sal} ${def.salvage} and 1 tech from the lair.`);
    {let n=0;for(const {h} of fieldGear('strip'))n+=Math.floor((sd.woundsBy[h.id]||0)/3);if(n){S.salvage[sd.vkey]+=n;L.push(`Scrapper's Hooks: +${n} ${def.salvage} stripped from the pages torn out.`)}}
    vs.beaten=(vs.beaten||0)+1;
    if(S.ethos.a==='restraint'){S.salvage[sd.vkey]++;L.push(`Restraint: +1 ${def.salvage}.`)}
    if(sd.omenSalvage){S.salvage[sd.vkey]++;L.push(`Omen: +1 ${def.salvage}.`)}
    {const un=unlock(DEFEAT_UNLOCK[sd.vkey]);if(un.length)L.push(`Seized blueprints: ${un.join(', ')}.`)}
    {const was=vs.level;levelUpVillain(vs);vs.scheme=0;headline='Victory!';L.push(`${def.name} escapes in the chaos${vs.level>was?` and returns at level ${vs.level}`:''}.`)}}
  else if(res==='loss'){S.trust-=2;const was=vs.level,add=levelUpVillain(vs);vs.scheme=0;headline='Defeat';L.push(`The team is carried out of the lair. −2 trust.${vs.level>was?` ${def.name} grows bolder (level ${vs.level}).`:''}`)}
  else{S.trust--;S.salvage[sd.vkey]++;vs.scheme=0;headline='Slipped away';L.push(`${def.name} gets away. You recover 1 ${def.salvage}. −1 trust.`)}
  if(S.facilities.includes('lab')){S.tech++;L.push('The lab reverse-engineers scraps: +1 tech.')}
  const med=S.facilities.includes('medbay'),train=S.facilities.includes('training'),xpAt=L.length,xpL=[];
  for(const u of sd.units){const h=heroOf(u);let xp=1+(train?1:0)+((sd.woundsBy[h.id]||0)>=2?1:0)+(Object.values(h.gear).some(g=>GEAR[g].field&&GEAR[g].field.id==='xp')?1:0);h.xp+=xp;xpL.push(`${h.name} +${xp}`);
    while(h.xp>=xpNeed(h)){h.xp-=xpNeed(h);h.pendingUp++;L.push(`${h.name} reaches level ${lvlOf(h)+h.pendingUp}. Choose a discipline and an upgrade in the roster. Next level needs ${xpNeed(h)} XP.`)}
    /* Version 130 (Tyler): no injury roll, careers never end, and a knocked-out hero is ready for the next issue */
    if(u.ko)h.hp=Math.ceil(stat(h,'maxHp')/2);
    else h.hp=Math.max(h.hp,Math.ceil(stat(h,'maxHp')*.6));
    /* Med Bay: half of the health still missing after normal recovery */
    if(med)h.hp+=Math.ceil((stat(h,'maxHp')-h.hp)/2);
    h.comp=stat(h,'maxComp');h.cd=0;clampHero(h)}
  if(xpL.length)L.splice(xpAt,0,`XP earned: ${xpL.join(', ')}.`);
  const mk=fieldCount('medkit');if(mk){party().forEach(h=>{h.hp=Math.min(stat(h,'maxHp'),h.hp+3*mk)});L.push(`Field Medic Kit: the party recovers ${3*mk} extra health.`)}
  finishIssue(L,{hunted:sd.vkey,headline,vkey:sd.vkey})}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.debrief=()=>{if(tutOn()){tutFinish();return;}S.sd.finale?finaleDebrief():debrief()};
