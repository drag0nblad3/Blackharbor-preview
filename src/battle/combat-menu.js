/* battle/combat-menu.js: Combat menus, target picking, end-round button, ability buttons. */
function abOk(u,h,k){const g=GEAR[k],a=g&&g.ab,sd=S.sd;if(!a||u.ko)return false;const f=a.fx||{};
  if(g.cons){if(!pouchOf(h).includes(k))return false}else if(g.type!=='innate'&&!bridgeOn(h,'paragon')&&(u.abUsed||[]).includes(k))return false;else if(g.type==='innate'){if(potOf(h)<a.min||!innOk(u,h))return false}else if((u.res[g.type]||0)<(g.type==='magic'?arcCost(u,h,a.c):a.c))return false;
  if(a.mode==='ally'&&!live().some(o=>cheb(o,u)<=abV(a.r,potOf(h))&&allyAbilityOK(u,o,a)))return false;
  if(a.act&&u.acted)return false;if(f.move&&!u.moved)return false;if(f.boost&&u.boost)return false;if(f.again&&!u.acted)return false;
  if(f.eclipse&&!sd.vl.some(o=>o.v.charge&&!o.v.down))return false;if(f.mark&&u.markUsed)return false;if(f.repress&&sd.v.repress)return false;if(f.moveEva&&!(u.hexesMoved>0))return false;
  if((f.repress||f.reactionPeek||f.revealFacing||f.tear||f.skip||f.hex||f.curse||f.face||f.foresee||f.mark||f.callout||f.blind||f.scry||f.bury||f.excise||f.scramble||f.vsplash)&&sd.v.down)return false;
  if(f.gain&&(u.res.magic||0)>=arcMax(h))return false;if(f.gainP&&(u.res.tech||0)>=pwrMax(h))return false;
  return true}


/* Combat menus: selecting a choice is informational; only explicit confirmation
   may activate a power, consume resources or start board targeting. */
function combatMenu(kind){
  const sd=S.sd,u=sd&&sd.units[sd.sel];
  if(!u||sd.busy||sd.result||!['abilities','other'].includes(kind))return;
  sd.combatMenuOpen=sd.combatMenuOpen===kind?null:kind;
  /* Updating only the menu avoids replacing the clicked button while the
     browser is still processing the pointer event. Later renders use state. */
  document.querySelectorAll('#app .combat-dropdown').forEach(d=>{
    const which=d.classList.contains('abilities-dropdown')?'abilities':'other',open=sd.combatMenuOpen===which;
    d.querySelector('.combat-menu-toggle').setAttribute('aria-expanded',String(open));
    d.querySelector('.combat-dropdown-menu').hidden=!open;
  });
}
/* End round needs two taps within 4s: the first arms it, the second ends the round. */
let endArmAt=0,endArmT=null;
const endRoundArmed=()=>Date.now()-endArmAt<4000;
function endRoundBtn(){const a=endRoundArmed();return `<button class="btn sm pri endrd ${a?'armed':''}" data-a="endround" aria-label="${a?'Tap again to end the round':'End round (tap twice)'}">${a?'Tap again':'End round'}</button>`}
function endRoundTap(){if(endRoundArmed()){endArmAt=0;clearTimeout(endArmT);return villainPhase()}
  endArmAt=Date.now();clearTimeout(endArmT);endArmT=setTimeout(()=>{endArmAt=0;if(S.sd&&!S.sd.busy)render()},4000);render()}
function combatPick(kind,key){
  const sd=S.sd,u=sd&&sd.units[sd.sel];
  if(!u||sd.busy||sd.result)return;
  const h=heroOf(u),keys=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))];
  if(kind==='ability'&&key!=='power'&&(!keys.includes(key)||!GEAR[key]||!GEAR[key].ab))return;
  if(kind==='other'&&!['escort','hack','avoidDamage','rallySpirit','letgo','satellite'].includes(key))return;
  if(kind!=='ability'&&kind!=='other')return;
  sd.combatPick={hid:u.hid,kind,key};
  sd.combatMenuOpen=null;
  sd.mode=null;
  /* Board-targeted picks skip the confirm button: they arm targeting at once. */
  const tm=combatTargetMode(u,h,sd.combatPick);
  if(tm&&combatPickOk(u,h,sd.combatPick)){
    sd.combatPick.armed=tm;
    if(kind==='other')return rallySpirit();
    if(key==='power')return usePower();
    return useAb(key);
  }
  render();
}
/* The board mode a pick arms, or null when it resolves without a board tap. */
function combatTargetMode(u,h,c){
  if(c.kind==='other')return c.key==='rallySpirit'?'rallySpirit':null;
  if(c.key==='power'){const pw=BASE(h).power;return ['arc','patch','barricade'].includes(pw)?pw:null}
  const a=GEAR[c.key]&&GEAR[c.key].ab;return a&&a.mode?'ab'+a.mode:null;
}
function combatPickOk(u,h,c){
  if(c.kind==='other')return c.key==='rallySpirit'&&!u.acted&&!u.ko;
  return c.key==='power'?powOk(u,h):abOk(u,h,c.key);
}
function combatClear(){
  const sd=S.sd;if(!sd||sd.busy)return;if(sd.combatPick&&sd.combatPick.armed&&sd.mode===sd.combatPick.armed)sd.mode=null;sd.combatPick=null;sd.combatMenuOpen=null;render();
}
/* Icons show what using the action consumes, not what its resource cost is.
   A future move-cost ability can mark itself with moveAct. */
const combatCostIcon=kind=>kind==='action'?UI('atk'):kind==='move'?UI('move'):'⚡';
function combatInfo(u,h){
  const sd=S.sd,c=sd.combatPick;
  if(!c||c.hid!==u.hid)return '';
  if(c.armed&&sd.mode!==c.armed)return '';
  const targeted=!!combatTargetMode(u,h,c);
  let name='',description='',cost='',ok=false,tip='';
  if(c.kind==='ability'){
    if(c.key==='power'){
      const pw=BASE(h).power,p=POWERS[pw];if(!p)return '';
      name=p.name;description=p.txt;cost=powCost(pw);ok=powOk(u,h);
      tip=['arc','patch','barricade'].includes(pw)?'Targets the board.':'Confirm to activate.';
    }else{
      const keys=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))];
      if(!keys.includes(c.key)||!GEAR[c.key]||!GEAR[c.key].ab)return '';
      const g=GEAR[c.key],a=g.ab;
      name=a.n;cost=abCost(g);description='From '+g.name+'. '+abTxt(a,g.type==='innate'?potOf(h):null);
      ok=abOk(u,h,c.key);
      tip=a.mode?'Targets the board.':'Confirm to activate.';
    }
  }else{
    switch(c.key){
      case 'escort':
        name='Escort';description='Gather adjacent civilians to follow this hero to an exit. Uses an action unless you have a free Escort.';
        ok=(!u.acted||u.freeEvac)&&sd.civs.some(v=>v.f!==u.hid&&!civHeld(v)&&cheb(v,u)<=1);
        tip='Requires an adjacent civilian.';break;
      case 'hack':
        name='Hack';description='Download evidence from an adjacent terminal, gaining '+TERM_INTEL+' intel. Uses your action.';
        ok=canHack(u);tip='Requires an intact terminal within 1 hex.';break;
      case 'satellite':
        name='Pull Down Satellite';description='Spend your action to pull down one scrap satellite from an adjacent boss, without a roll.';ok=!!satelliteTarget(u)&&!u.acted&&!u.ko;tip='Requires adjacency and a remaining satellite.';break;
      case 'avoidDamage':
        name='Avoid Damage';description='Spend an action for +3 Evasion until your next turn (+5 if adjacent to safe walls, rubble, heroes, civilians or terminals). On a miss, a suitable cover tile in the attack path can be hit instead.';
        ok=!u.acted&&!u.ko&&!u.avoidDamage;
        tip='Current cover provides +'+(avoidCover(u).length?5:3)+' Evasion.';break;
      case 'rallySpirit':
        name='Rally Spirit';description='Spend an action to restore up to 3 Composure to yourself or a conscious ally within '+lvlOf(h)+' hexes.';
        ok=!u.acted&&!u.ko;tip='Targets yourself or an ally on the board.';break;
      case 'letgo':
        name='Let Go';description='Release the civilians currently following this hero. Does not use an action.';
        ok=followers(u).length>0;tip=followers(u).length+' civilians currently following.';break;
      default:return '';
    }
  }
  return `<section class="combat-choice${c.armed?' armed':''}" aria-label="Selected combat action">
    <div class="eyebrow">${c.kind==='ability'?'Ability details':'Action details'}</div>
    <div class="row between"><strong>${esc(name)}</strong>${cost?`<span class="small mono">${esc(cost)}</span>`:''}</div>
    <p class="small" style="margin:0">${esc(description)}</p>
    ${c.armed?'':`<p class="small muted combat-tip" style="margin:0">${esc(tip)}</p>`}
    <div class="row combat-choice-actions">${c.armed?`<p class="combat-board-prompt" style="margin:0"><b>Click the board to activate.</b> ${esc(combatTargetHelp(u,h).replace(/^[^:]*: /,''))}</p>`:''}
      ${targeted?'':`<button class="btn pri combat-confirm" type="button" data-a="combatUse" ${ok?'':'disabled'}>${c.kind==='ability'?'Activate ability':'Use action'}</button>`}
      <button class="btn sm" type="button" data-a="combatClear">Cancel</button>
    </div>
    ${ok?'':'<span class="small muted">Unavailable right now.</span>'}
  </section>`;
}
function combatUse(){
  const sd=S.sd,u=sd&&sd.units[sd.sel],c=sd&&sd.combatPick;
  if(!u||!c||c.hid!==u.hid||sd.busy||sd.result)return;
  const h=heroOf(u),key=c.key;
  if(c.kind==='ability'){
    if(key==='power'){
      if(!powOk(u,h))return;
      sd.combatPick=null;return usePower();
    }
    const keys=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))];
    if(!keys.includes(key)||!GEAR[key]||!GEAR[key].ab||!abOk(u,h,key))return;
    sd.combatPick=null;return useAb(key);
  }
  if(c.kind!=='other')return;
  switch(key){
    case 'escort':
      if((!u.acted||u.freeEvac)&&sd.civs.some(v=>v.f!==u.hid&&!civHeld(v)&&cheb(v,u)<=1)){sd.combatPick=null;return escort()}break;
    case 'hack':
      if(canHack(u)){sd.combatPick=null;return hack()}break;
    case 'satellite':
      if(!u.acted&&!u.ko&&satelliteTarget(u)){sd.combatPick=null;return act(async()=>{u.acted=true;dropSatellite(satelliteTarget(u),u)})}break;
    case 'avoidDamage':
      if(!u.acted&&!u.ko&&!u.avoidDamage){sd.combatPick=null;return avoidDamage()}break;
    case 'rallySpirit':
      if(!u.acted&&!u.ko){sd.combatPick=null;return rallySpirit()}break;
    case 'letgo':
      if(followers(u).length){letGo(u,'lets the civilians go.');sd.combatPick=null;render()}break;
  }
}
function combatMenus(u,h){
  const sd=S.sd,pw=BASE(h).power,p=POWERS[pw],gear=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))].filter(k=>GEAR[k]&&GEAR[k].ab);
  const choice=(kind,key,label,detail,costKind)=>`<button type="button" class="btn sm combat-option ${sd.combatPick&&sd.combatPick.hid===u.hid&&sd.combatPick.kind===kind&&sd.combatPick.key===key?'on':''}" data-a="combatPick:${kind}:${key}"><span class="combat-cost-icon" aria-label="${costKind==='action'?'Uses action':costKind==='move'?'Uses move':'Free action'}" title="${costKind==='action'?'Uses action':costKind==='move'?'Uses move':'Free action'}">${combatCostIcon(costKind)}</span>${kind==='ability'&&GEAR[key]?equipmentIcon(key,28):''}<span class="combat-option-text">${esc(label)}${detail?`<small>${esc(detail)}</small>`:''}</span></button>`;
  const abilities=`<div class="combat-dropdown abilities-dropdown"><button type="button" class="btn sm combat-menu-toggle" data-a="combatMenu:abilities" aria-expanded="${sd.combatMenuOpen==='abilities'}" aria-controls="combat-abilities-menu">Abilities ▾</button>
    <div id="combat-abilities-menu" class="combat-dropdown-menu abilities-menu" ${sd.combatMenuOpen==='abilities'?'':'hidden'}>
      ${choice('ability','power',p.name,'Primary · '+powCost(pw,true),p.free?'free':'action')}
      ${gear.map(k=>{const g=GEAR[k],a=g.ab;return choice('ability',k,a.n,g.name+' · '+abCost(g,true),a.act?'action':a.moveAct?'move':'free')}).join('')}
    </div></div>`;
  const nFol=followers(u).length;
  const others=`<div class="combat-dropdown other-actions"><button type="button" class="btn sm combat-menu-toggle" data-a="combatMenu:other" aria-expanded="${sd.combatMenuOpen==='other'}" aria-controls="combat-other-menu">Other Actions ▾</button>
    <div id="combat-other-menu" class="combat-dropdown-menu other-actions-menu" ${sd.combatMenuOpen==='other'?'':'hidden'}>
      ${choice('other','escort','Escort','Gather civilians',u.freeEvac?'free':'action')}
      ${sd.term?choice('other','hack','Hack','Evidence terminal','action'):''}
      ${satelliteTarget(u)?choice('other','satellite','Pull Down Satellite','Adjacent boss · no roll','action'):''}
      ${choice('other','avoidDamage','Avoid Damage','+3 Evasion · +5 by cover','action')}
      ${choice('other','rallySpirit','Rally Spirit','Range '+lvlOf(h)+' · +3 Composure','action')}
      ${nFol?choice('other','letgo','Let Go','Following '+nFol,'free'):''}
    </div></div>`;
  return abilities+others;
}
function combatTargetHelp(u,h){
  const sd=S.sd,m=sd.mode;
  if(m==='rallySpirit')return 'Rally Spirit: tap yourself or an ally within '+lvlOf(h)+' hexes.';
  if(m==='patch')return 'Patch Up: tap yourself or an ally within 3 hexes.';
  if(m==='barricade')return 'Barricade: tap an empty tile within 2 hexes.';
  if(m==='arc')return 'Arc Burst: tap an enemy within attack range.';
  if(m&&m.startsWith('ab')&&sd.abKey&&GEAR[sd.abKey]&&GEAR[sd.abKey].ab){
    const a=GEAR[sd.abKey].ab;
    return a.n+': '+(a.mode==='ally'?'tap yourself or a nearby ally.':a.mode==='strike'?'tap a villain in range.':'tap an empty tile in range.');
  }
  return '';
}
function abButtons(u,h){const ks=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))].filter(g=>GEAR[g].ab);if(!ks.length)return '';const P=potOf(h);
  return `<div class="row">${ks.map(k=>{const g=GEAR[k],a=g.ab,ok=abOk(u,h,k),low=g.type==='innate'&&P<a.min,on=S.sd.abKey===k&&S.sd.mode&&S.sd.mode.startsWith('ab');
    return `<button class="btn sm abtn t-${g.type} ${on?'on':''}" data-a="ab:${k}" data-tip="gear:${k}" ${ok?'':'disabled'} title="${esc(low?`Requires Innate rank ${a.min}. ${abTxt(a)}`:abTxt(a,g.type==='innate'?P:null))}">${a.n}<small>${abCost(g,true)}</small></button>`}).join('')}</div>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.combatMenu=(p1)=>{combatMenu(p1);return NO_RENDER;};
ACT.combatPick=(p1,p2)=>{combatPick(p1,p2);return NO_RENDER;};
ACT.combatClear=()=>{combatClear();return NO_RENDER;};
ACT.combatUse=()=>{combatUse();return NO_RENDER;};
ACT.ab=(p1)=>{useAb(p1)};
ACT.bridge=(p1)=>{bridgeAct(p1)};
ACT.mode=(p1)=>{S.sd.mode=S.sd.mode===p1?null:p1;S.sd.combatPick=null};
ACT.power=()=>{usePower()};
ACT.avoidDamage=()=>{avoidDamage();return NO_RENDER;};
ACT.rallySpirit=()=>{rallySpirit();return NO_RENDER;};
ACT.escort=()=>{escort();return NO_RENDER;};
ACT.hack=()=>{hack();return NO_RENDER;};
ACT.letgo=()=>{const u=S.sd&&S.sd.units[S.sd.sel];if(u)letGo(u,'lets the civilians go.')};
ACT.endround=()=>{endRoundTap();return NO_RENDER;};
ACT.sdgo=()=>{const sd=S.sd;if(!sd||!sd.intro)return;sd.intro=false;if(sd.quality==='ambush'&&sd.round===0&&!sd.busy){render();setTimeout(villainPhase,500);return NO_RENDER;}};
ACT.sdlook=()=>{if(S.sd)S.sd.outro=true};
ACT.focus=(p1)=>{focusV(+p1)};
ACT.hush=(p1)=>{const o=S.sd&&S.sd.vl[+p1];if(o)o.v.hush=o.v.warn};
