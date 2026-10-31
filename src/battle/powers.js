/* battle/powers.js: Powers and gear abilities (usePower, abApply), bridges, scry/bury, choices, lifeline, board prep. */
async function act(fn){const sd=S.sd;if(sd.busy)return;sd.busy=true;const keepSel=sd.sel;sd.mode=null;render();
  try{await fn()}finally{if(S.sd===sd){sd.busy=false;if(!sd.result)sd.units.forEach(civFollow);checkLoss();if(sd.sel==null&&!sd.result)sd.sel=keepSel;if(sd.thenMode&&!sd.result){sd.mode=sd.thenMode}sd.thenMode=null;render()}}}
function usePower(){const sd=S.sd,u=sd.units[sd.sel],h=heroOf(u),pw=BASE(h).power,P=POWERS[pw];if(!powOk(u,h)&&sd.mode!==pw)return;
  const glow=BASE(h).glow;
  if(pw==='overclock')return act(async()=>{payPow(u,h);await A.ring(ctrU(u),glow,2.2,{inward:true,count:2});u.buffDice+=1;u.buffAcc=(u.buffAcc||0)+1;u.buffStr-=1;fxU(u,'OVERCLOCK!','good');log('hero',`${h.name} overclocks: +1 die, +1 accuracy and −1 Strength on the next attack.`)});
  if(pw==='drone')return act(async()=>{payPow(u,h);const hm=sd.hench.filter(m=>cheb(m,u)<=3);await Promise.all(hm.map(m=>A.shot(ctrU(u),ctrU(m),glow)));
    hm.forEach(m=>{m.hp-=2;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'ZAP!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);if(!hm.length)fxU(u,'NO TARGETS','miss');log('hero',`${h.name}'s drone zaps ${hm.length} henchm${hm.length===1?'an':'en'}.`)});
  if(pw==='emp'){if(dV(u,sd.v)>3){fxU(u,'TOO FAR','miss');render();return}
    return act(async()=>{payPow(u,h);await A.ring(ctrV(),glow,3,{count:2});sd.v.hex=true;fxV('EMP!','good');log('hero',`${h.name}'s EMP scrambles ${VILLAINS[sd.vkey].name}: −4 evasion this round.`)})}
  if(pw==='regen')return act(async()=>{payPow(u,h);await A.heal(ctrU(u),COL.heal);const n=Math.max(1,potOf(h));h.hp=Math.min(stat(h,'maxHp'),h.hp+n);fxU(u,`+${n} HP`,'good');log('hero',`${h.name} regenerates ${n} health.`)});
  if(pw==='berserk')return act(async()=>{payPow(u,h);await A.ring(ctrU(u),glow,2.4,{inward:true,count:2});u.buffDice+=1;u.buffStr+=3;u.buffAcc=(u.buffAcc||0)-1;fxU(u,'RAAARGH!','good');log('hero',`${h.name} goes berserk: +1 die, +3 Strength and −1 accuracy on the next attack.`)});
  if(pw==='leap')return act(async()=>{payPow(u,h);await A.smoke(ctrU(u),5);u.boost=(u.boost||0)+2;u.boostJump=true;fxU(u,'BOUND!','good');log('hero',`${h.name} gathers for a leap: +2 to the next move, and it is a jump.`);if(!u.moved)sd.thenMode="move"});
  if(pw==='aegis')return act(async()=>{payPow(u,h);const al=live().filter(o=>o!==u&&cheb(o,u)<=3).sort((a,b)=>(heroOf(a).hp/stat(heroOf(a),'maxHp'))-(heroOf(b).hp/stat(heroOf(b),'maxHp')))[0];
    u.absorb=Math.max(u.absorb||0,2);await A.shield(ctrU(u),COL.magic,true);if(al){al.absorb=Math.max(al.absorb||0,2);await A.shield(ctrU(al),COL.magic,true);fxU(al,'AEGIS!','good')}fxU(u,'AEGIS!','good');log('hero',`${h.name} raises an aegis${al?` over themselves and ${heroOf(al).name}`:''}: the next 2 damage is absorbed.`)});
  if(pw==='drain'){if(dV(u,sd.v)>4){fxU(u,'TOO FAR','miss');render();return}
    return act(async()=>{u.acted=true;payPow(u,h);const w0=sd.woundsBy[h.id]||0;await heroAttack(u,'v',0,0,'bolt');const w=(sd.woundsBy[h.id]||0)-w0;
      if(w&&!u.ko){h.hp=Math.min(stat(h,'maxHp'),h.hp+w);await A.heal(ctrU(u),COL.magic);fxU(u,`+${w} HP`,'good');log('hero',`${h.name} drains ${w} health.`)}})}
  if(pw==='serene')return act(async()=>{payPow(u,h);await A.ring(ctrU(u),COL.cyan,5,{count:2});live().forEach(o=>{const t=heroOf(o);t.comp=Math.min(stat(t,'maxComp'),t.comp+2)});fxU(u,'BREATHE…','say');log('hero',`${h.name} steadies the team: +2 composure each.`)});
  if(pw==='brace')return act(async()=>{u.guard=true;payPow(u,h);await A.shield(ctrU(u),COL.yel,true);fxU(u,'BRACE!','good');log('hero',`${h.name} braces to protect nearby allies.`)});
  if(pw==='blur')return act(async()=>{await A.sparkle(ctrU(u),BASE(h).glow);u.buffEva=(u.buffEva||0)+2;u.freeEvac=true;payPow(u,h);fxU(u,'ZOOM!','good');log('hero',`${h.name} blurs: +2 evasion until the next hero turn.`)});
  if(pw==='mark')return act(async()=>{sd.v.marked=true;u.markUsed=true;payPow(u,h);await A.reticle(ctrV(),BASE(h).glow);fxV('MARKED!','good');log('hero',`${h.name} marks ${VILLAINS[sd.vkey].name}: +1 die on every attack against it from a side or the rear this round.`)});
  if(pw==='omen')return act(async()=>{payPow(u,h);await A.sigil(ctrV(),BASE(h).glow,2);sd.v.foresee=true;if(sd.v.planned)markSeen(sd.vkey,sd.v.planned.id);fxU(u,'I FORESEE…','say');log('hero',`${h.name} reads the omens.${sd.omenSalvage?'':' Win this fight for +1 salvage.'}`);sd.omenSalvage=true});
  if(pw==='quake')return act(async()=>{payPow(u,h);A.lunge('h'+u.hid,ctrU(u));await A.ring(ctrU(u),BASE(h).glow,3.2,{count:2});
    const hm=sd.hench.filter(m=>cheb(m,u)<=1),qd=Math.max(1,potOf(h)),qh=Math.max(1,Math.ceil(qd/2));hm.forEach(m=>{m.hp-=qh;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'THOOM!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);
    const keep=sd.vi;for(let i=0;i<sd.vl.length;i++){if(sd.vl[i].v.down||dV(u,sd.vl[i].v)>1)continue;focusV(i);if(VILLAINS[sd.vkey].rooted){fxV('BOLTED DOWN!','miss');log('hero',`${VILLAINS[sd.vkey].short} is bolted to the floor and can't be shoved.`);continue}const vz=VSIZE[sd.v.shape]||1;if(vz>qd){fxV('UNMOVED!','miss');log('hero',`${VILLAINS[sd.vkey].short} is size ${vz}, too big to shove at Innate rank ${qd}.`);continue}await vMove(()=>vAway(u,1,{strict:true}));fxV('SHOVED!','hit')}focusV(keep);
    log('hero',`${h.name} quakes the ground${hm.length?`, flattening ${hm.length} henchm${hm.length===1?'an':'en'}`:''}.`)});
  if(pw==='curse'){if(sd.v.repress)return;
    return act(async()=>{payPow(u,h);await A.bolt(ctrU(u),ctrV(),BASE(h).glow,true);await A.sigil(ctrV(),BASE(h).glow,2.6);sd.v.repress=true;sd.v.repressComp=true;fxV('REPRESSED!','good');log('hero',`${h.name} represses the next reaction revealed from ${VILLAINS[sd.vkey].name}.`)})}
  sd.mode=sd.mode===pw?null:pw;render()}
/* hybrid bridge perks (BRIDGE in game.js): Technomancer trades, Primal's Blood Price switch */
function bridgeRow(u,h){if(u.ko)return '';const b=[];
  if(bridgeOn(h,'techno')){const toA=!u.convRd&&(u.res.tech||0)>=3&&(u.res.magic||0)<arcMax(h),toP=!u.convRd&&(u.res.magic||0)>=1&&(u.res.tech||0)<pwrMax(h);
    b.push(`<button class="btn sm t-magic" data-a="bridge:toArc" data-tip="kw:bridge" ${toA?'':'disabled'}>3 PWR → 1 ARC</button><button class="btn sm t-tech" data-a="bridge:toPwr" data-tip="kw:bridge" ${toP?'':'disabled'}>1 ARC → 3 PWR</button>`)}
  if(bridgeOn(h,'primal'))b.push(`<button class="btn sm t-magic ${u.bloodPay?'on':''}" data-a="bridge:blood" data-tip="kw:bridge">Blood Price ${u.bloodPay?'on':'off'}</button>`);
  return b.length?`<div class="row">${b.join('')}</div>`:''}
function bridgeAct(k){const sd=S.sd,u=sd&&sd.units[sd.sel],h=u&&heroOf(u);if(!u||u.ko||sd.busy||sd.result)return;
  if(k==='blood'&&bridgeOn(h,'primal')){u.bloodPay=!u.bloodPay;return}
  if(!bridgeOn(h,'techno')||u.convRd)return;
  if(k==='toArc'&&(u.res.tech||0)>=3&&(u.res.magic||0)<arcMax(h)){u.res.tech-=3;u.res.magic+=1;u.convRd=true;fxU(u,'+1 ARC','good');log('hero',`Technomancer: ${h.name} turns 3 Power into 1 Arcana.`)}
  else if(k==='toPwr'&&(u.res.magic||0)>=1&&(u.res.tech||0)<pwrMax(h)){u.res.magic-=1;u.res.tech=Math.min(pwrMax(h),u.res.tech+3);u.convRd=true;fxU(u,'+3 PWR','good');log('hero',`Technomancer: ${h.name} turns 1 Arcana into Power.`)}}
function payAb(u,k){const g=GEAR[k];bossAbility(u,!g.cons&&g.type==='tech'&&g.ab.c>0);u.abRd=true;if(!g.cons&&g.type!=='innate')(u.abUsed=u.abUsed||[]).push(k);if(g.cons){const p=pouchOf(heroOf(u)),i=p.indexOf(k);if(i>=0)p.splice(i,1);return}const h=heroOf(u);if(g.type==='magic'){payArc(u,h,g.ab.c);return}if(g.type==='innate'){if(u.innUsed)u.capUsed=true;u.innUsed=(u.innUsed||0)+1}else u.res[g.type]-=g.ab.c}
function useAb(k){const sd=S.sd,u=sd.units[sd.sel],h=u&&heroOf(u),g=GEAR[k],a=g&&g.ab;if(!u||!a||!abOk(u,h,k))return;
  if(a.mode){const m='ab'+a.mode;sd.mode=sd.mode===m&&sd.abKey===k?null:m;sd.abKey=k;render();return}
  return act(async()=>{payAb(u,k);log('hero',`${h.name} uses ${a.n} (${abCost(g)}).`);await abApply(u,h,g,u)})}
/* resolves an ability's effects; tu is the chosen ally for mode 'ally' (otherwise the user) */
async function abApply(u,h,g,tu){const sd=S.sd,a=g.ab,f=pairFx(h,g),P=potOf(h),v=x=>abV(x,P),col=COL[g.type],th=heroOf(tu);
  if(f.evaNext){const n=v(f.evaNext);await A.shield(ctrU(tu),COL.cyan,true);tu.evaNext=(tu.evaNext||0)+n;fxU(tu,'WHOOSH!','good');log('hero',`Wind wraps ${th.name}: +${n} evasion against the next attack.`)}
  if(f.ward){await A.shield(ctrU(tu),COL.magic,true);tu.ward=true;fxU(tu,'WARD!','good')}
  if(f.heal){const n=v(f.heal);await A.heal(ctrU(tu),COL.heal);th.hp=Math.min(stat(th,'maxHp'),th.hp+n);fxU(tu,`+${n} HP`,'good');log('hero',`${th.name} regains ${n} health.`)}
  if(f.comp){const n=v(f.comp);await A.heal(ctrU(u),COL.cyan);th.comp=Math.min(stat(th,'maxComp'),th.comp+n);fxU(tu,'FOCUS!','good')}
  if(f.absorb){const n=v(f.absorb);tu.absorb=Math.max(tu.absorb||0,n);await A.shield(ctrU(tu),col,true);fxU(tu,'SHELL!','good');log('hero',`${th.name} gains a shield that absorbs ${n} damage.`)}
  if(f.dr){const n=v(f.dr);u.dr=(u.dr||0)+n;await A.shield(ctrU(u),col);fxU(u,'GUARD!','good');log('hero',`${h.name} takes ${n} less damage per hit this round.`)}
  if(f.drAll){const n=v(f.drAll);await A.ring(ctrU(u),col,2.4,{count:2});live().filter(o=>cheb(o,u)<=1).forEach(o=>{o.dr=(o.dr||0)+n;fxU(o,'BRACED!','good')})}
  if(f.eva){u.buffEva=(u.buffEva||0)+v(f.eva);fxU(u,'DODGE!','good')}
  if(f.moveEva){const n=u.hexesMoved||0;u.buffEva=(u.buffEva||0)+n;log('hero',`Wind Ward: ${n} hexes moved, +${n} Evasion until round end.`)}
  if(f.allyEva)tu.buffEva=(tu.buffEva||0)+v(f.allyEva);
  if(f.reactionWard){tu.reactionWard=true;log('hero',`${th.name} is protected from reaction damage until round end.`)}
  if(f.repress){sd.v.repress=true;log('hero',`${VILLAINS[sd.vkey].short}'s next revealed reaction is repressed.`)}
  if(f.revealFacing){sd.v.hide=false;fxV('REVEALED!','good')}
  if(f.reactionPeek)await peekReaction();
  if(f.swapAlly){const from={x:u.x,y:u.y};u.x=tu.x;u.y=tu.y;tu.x=from.x;tu.y=from.y;beamStep(u);beamStep(tu);civFollow(u);civFollow(tu);log('hero',`${h.name} exchanges shadows with ${th.name}.`)}
  if(f.pushAlly||f.pullAlly)await moveAlly(u,tu,f.pushAlly?1:-1,v(f.pushAlly||f.pullAlly));
  if(f.anchor)u.anchor=true;
  if(f.breach){const adj=[];for(const n of nbrs(u)){const k=n.x+','+n.y;if(sd.walls.some(w=>w.k===k)||sd.obs.includes(k))adj.push(k)}
    await Promise.all(adj.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),4)}));sd.walls=sd.walls.filter(w=>!adj.includes(w.k));sd.obs=sd.obs.filter(k=>!adj.includes(k));fxU(u,adj.length?'KRUNCH!':'THUNK.','hit')}
  if(f.shove){const keep=sd.vi;for(let i=0;i<sd.vl.length;i++){if(sd.vl[i].v.down||dV(u,sd.vl[i].v)>1)continue;focusV(i);if(VILLAINS[sd.vkey].rooted){fxV('BOLTED DOWN!','miss');log('hero',`${VILLAINS[sd.vkey].short} is bolted to the floor and can't be shoved.`);continue}const vz=VSIZE[sd.v.shape]||1;if(vz>P){fxV('UNMOVED!','miss');log('hero',`${VILLAINS[sd.vkey].short} is size ${vz}, too big to shove at Innate rank ${P}.`);continue}await vMove(()=>vAway(u,1,{strict:true}));fxV('SHOVED!','hit');log('hero',`${h.name} shoves ${VILLAINS[sd.vkey].short} back.`)}focusV(keep)}
  if(f.dice||f.str||f.acc||f.back){const d=f.dice?v(f.dice):0,st=f.str?v(f.str):0,ac=f.acc?v(f.acc):0,bk=f.back?v(f.back):0;u.buffDice+=d;u.buffStr+=st;u.buffAcc=(u.buffAcc||0)+ac;u.buffBack=(u.buffBack||0)+bk;
    if(!f.move&&a.mode!=='tele'){await A.ring(ctrU(u),col,2.2,{inward:true,count:2});fxU(u,pick(['VRRRM!','RAAAH!','POWER UP!']),'good')}
    log('hero',`${h.name}'s next attack: ${[d&&`+${d} ${d===1?'die':'dice'}`,ac&&`${signedBonus(ac)} accuracy`,st&&`${signedBonus(st)} Strength`,bk&&`+${bk} more on a melee attack from a side or the rear`].filter(Boolean).join(', ')}.`)}
  if(f.reap)u.buffReap=(u.buffReap||0)+v(f.reap);
  if(f.rally){const n=v(f.rally);await A.ring(ctrU(u),COL.cyan,5,{count:2});live().filter(o=>cheb(o,u)<=2).forEach(o=>{const t=heroOf(o);t.comp=Math.min(stat(t,'maxComp'),t.comp+n);fxU(o,'STEADY!','good')})}
  if(f.gain){u.res.magic=Math.min(arcMax(h),(u.res.magic||0)+v(f.gain));await A.sparkle(ctrU(u),COL.magic);fxU(u,'+ARCANA','good')}if(f.gainP){u.res.tech=Math.min(pwrMax(h),(u.res.tech||0)+v(f.gainP));await A.sparkle(ctrU(u),COL.tech);fxU(u,'+POWER','good')}
  if(f.callout){sd.v.callout=(sd.v.callout||0)+v(f.callout);await A.reticle(ctrV(),col);fxV('CALLED OUT!','good')}
  if(f.mark){sd.v.marked=true;u.markUsed=true;await A.reticle(ctrV(),col);fxV('TARGETED!','good')}
  if(f.hex||f.curse){await A.sigil(ctrV(),col,3);if(f.hex)sd.v.hex=Math.max(hexA(sd.v.hex),f.hexAmt||4);if(f.curse)sd.v.cursed=true;fxV(f.hex&&f.curse?'WITHERED!':f.hex?'HEXED!':'CURSED!','good')}
  if(f.face){faceTo(u);render();fxV('LOOK AT ME!','say');log('hero',`${VILLAINS[sd.vkey].short} turns to face ${h.name}.`)}
  if(f.foresee){await A.sigil(ctrV(),col,2);sd.v.foresee=true;if(sd.v.planned)markSeen(sd.vkey,sd.v.planned.id);fxU(u,'I SEE…','say')}
  if(f.eclipse){const ci=sd.vl.findIndex(o=>o.v.charge&&!o.v.down);if(ci>=0){focusV(ci);await A.sigil(ctrV(),col,3);cancelPlan(sd.v);fxV('ECLIPSED!','good');log('hero',`${h.name} snuffs out the charge.`)}}
  if(f.shock){const[r,d]=f.shock,hm=sd.hench.filter(m=>cheb(m,u)<=r);termHit(q=>cheb(q,u)<=r,a.n);await A.ring(ctrU(u),col,r*2+1.4,{count:2});
    hm.forEach(m=>{m.hp-=d;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'ZZAP!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);log('hero',hm.length?`${a.n} hits ${hm.length} henchm${hm.length===1?'an':'en'}.`:`${a.n} hits nobody.`)}
  if(f.stasis){const zs=live().filter(o=>cheb(o,u)<=1);await A.ring(ctrU(u),col,3.4,{count:3});zs.forEach(o=>{o.stasis=true;fxU(o,'FROZEN IN TIME','good')});log('hero',`${h.name} stops time: ${zs.map(o=>heroOf(o).name).join(', ')} can't be hurt until ${h.name}'s next turn.`)}
  if(f.skip){sd.v.skip=true;await A.sigil(ctrV(),col,3);fxV('TIME STOPS!','good');log('hero',`${VILLAINS[sd.vkey].short} will lose its next turn.`)}
  if(f.tear){const tornBefore=sd.v.wounds.length;await A.beam(ctrV(),col);for(let i=0;i<f.tear&&!sd.result&&!sd.v.down;i++)await woundAnim(`${h.name}: ${a.n}.`);if(sd.v.wounds.length>tornBefore)sigBreak(h,sd.v)}
  if(f.boost){const n=v(f.boost);u.boost=(u.boost||0)+n;if(f.jump)u.boostJump=true;await A.smoke(ctrU(u),5);fxU(u,'WHOOSH!','good');log('hero',`${h.name}: +${n} to the next move${f.jump?', and it is a jump':''}.`);if(!u.moved)sd.thenMode='move'}
  if(f.move){u.moved=false;u.mv=null;if(JUMP_AB.includes(g.ab.id))u.jump=true;await A.smoke(ctrU(u),5);fxU(u,'WHOOSH!','good');sd.thenMode='move'}
  if(f.again){u.acted=false;await A.ring(ctrU(u),col,3,{count:2});fxU(u,'UNLEASHED!','good')}
  if(f.blind){await A.sigil(ctrV(),col,2.6);sd.v.blind=true;fxV('BLINDED!','good');log('hero',`${VILLAINS[sd.vkey].short} is blinded: −3 accuracy this round.`)}
  if(f.vsplash)await splashV(v(f.vsplash));
  if(f.reflect){u.reflect=1;await A.shield(ctrU(u),col);fxU(u,'BRACED!','good');log('hero',`${h.name} is ready to turn the next villain hit back on it.`)}
  if(f.riposte){u.ripo=true;await A.shield(ctrU(u),col);fxU(u,'EN GARDE!','good');log('hero',`${h.name} is ready to strike back at the next miss.`)}
  if(f.excise){sd.v.excise=v(f.excise);await A.reticle(ctrV(),col);fxV('FLAW FOUND!','good');log('hero',`${h.name} finds the flaw: the next page torn from ${VILLAINS[sd.vkey].short} this round is one you choose from its next ${sd.v.excise}.`)}
  if(f.scramble){const vv=sd.v;if(!vv.deck.length&&vv.discard.length){vv.deck=vv.discard;vv.discard=[]}vv.deck=shuffle(vv.deck);vv.foresee=false;vv.warn=null;await A.ring(ctrV(),col,3,{count:2});fxV('SCRAMBLED!','good');log('hero',`${VILLAINS[sd.vkey].short}'s playbook is shuffled.`);vWarn()}
  if(f.scry)await scry(v(f.scry),col,u);
  if(f.bury)await bury(col,u);
  if(f.hpCost){const n=Math.min(v(f.hpCost),h.hp-1);if(n>0){h.hp-=n;fxU(u,`−${n} HP`,'vhit');log('hero',`${h.name} pays ${n} health for it.`)}}
  render()}
/* a paired weapon's ability adds its pair bonus */
function pairFx(h,g){const f=g.ab.fx||{},p=pairOf(h)===g.ab.id&&GEAR[g.ab.id].pair.fx;if(!p)return f;const o={...f};
  for(const k in p){const x=o[k];o[k]=x==null?p[k]:Array.isArray(x)?[x[0]+p[k],...x.slice(1)]:x+p[k]}return o}
/* deck tricks: look at the next pages, then choose which comes first (Scry) or send the next one to the bottom (Bury) */
async function scry(n,col,u){const sd=S.sd,v=sd.v,k=sd.vkey;refillPages(v);
  const pending=v.charge?null:v.planned,top=[...(pending?[pending]:[]),...v.deck].slice(0,n);if(!top.length)return;
  top.forEach(c=>markSeen(k,c.id));await A.sigil(ctrV(),col,2);
  const i=top.length>1?await choose(`Scry · ${VILLAINS[k].short}`,'Choose the next action. An already charging area attack cannot be replaced.',top.map(c=>({l:c.n,s:c.txt}))):0,c=top[i];
  if(pending){if(pending!==c)v.deck.unshift(pending);v.deck=v.deck.filter(p=>p!==c);v.planned=c;v.planningDone=true;}else{v.deck=v.deck.filter(p=>p!==c);v.deck.unshift(c);}
  v.foresee=true;v.warn=null;vWarn();log('hero',`Scry: ${c.n} is selected.`);}
async function bury(col,u){const sd=S.sd,v=sd.v,k=sd.vkey;refillPages(v);const c=v.charge?v.deck[0]:v.planned||v.deck[0];if(!c)return;
  markSeen(k,c.id);const i=await choose(`Spot the Tell · ${VILLAINS[k].short}`,`${c.n}. ${c.txt}`,[{l:'Bury it',s:'Send this page to the bottom; replace the planned action when possible.'},{l:'Keep it',s:'Leave this page revealed.'}]);
  if(i===0){if(c===v.planned){v.planned=null;v.deck.push(c);v.planned=v.deck.shift();}else{v.deck.shift();v.deck.push(c);}v.warn=null;vWarn();}v.foresee=true;}

/* a small pick-one overlay; AUTO_CHOOSE answers it in tests */
let AUTO_CHOOSE=null;
function choose(title,sub,opts){if(FAST||AUTO_CHOOSE!=null)return Promise.resolve(Math.min(opts.length-1,AUTO_CHOOSE||0));
  return new Promise(res=>{const L=document.createElement('div');L.id='choose';L.setAttribute('role','dialog');L.setAttribute('aria-label',title);
    L.innerHTML=`<div class="chz"><div class="eyebrow">${esc(title)}</div><div class="small">${esc(sub)}</div>${opts.map((o,i)=>`<button class="btn opt" type="button" data-i="${i}"><span>${esc(o.l)}</span>${o.s?`<small>${esc(o.s)}</small>`:''}</button>`).join('')}</div>`;
    document.body.appendChild(L);setTimeout(()=>{const b=L.querySelector('[data-i]');if(b)b.focus({preventScroll:true})},50);
    L.addEventListener('click',e=>{const b=e.target.closest('[data-i]');e.stopPropagation();if(!b)return;L.remove();res(+b.dataset.i)})})}
/* Riposte: a free 1-die attack when the villain misses, once per round; it keeps the hero's charged bonuses for their own attack */
async function riposte(u){const sd=S.sd,h=heroOf(u);if(sd.result||u.ko||u.ripUsed||!(u.ripo||gearHas(h,'riposte'))||sd.v.down||dV(u,sd.v)>stat(h,'range'))return;
  u.ripUsed=true;const keep=[u.buffDice,u.buffStr,u.buffAcc,u.buffBack,u.buffReap],call=sd.v.callout;u.buffDice=u.buffStr=u.buffAcc=u.buffBack=u.buffReap=0;sd.v.callout=0;u.noRel=true;
  fxU(u,'RIPOSTE!','good');log('hero',`Riposte! ${h.name} strikes back.`);await heroAttack(u,'v',0,1);
  u.noRel=false;[u.buffDice,u.buffStr,u.buffAcc,u.buffBack,u.buffReap]=keep;sd.v.callout=call}
function painGain(u,h){for(const g of new Set(Object.values(h.gear))){const t=GEAR[g]&&GEAR[g].pain;if(!t||!u.res)continue;const mx=resMax(h,t);
  if((u.res[t]||0)<mx){u.res[t]=(u.res[t]||0)+1;log('hero',`${GEAR[g].name}: ${h.name} turns the pain into 1 ${TRACKS[t].res}.`)}}}
function lifeline(u,h){if(pwrMax(h)&&u.res.tech<pwrMax(h)){u.res.tech++;fxU(u,'+POWER','good');log('hero',`Lifeline: ${h.name} regains 1 Power.`)}
  else if(arcMax(h)&&u.res.magic<arcMax(h)){u.res.magic++;fxU(u,'+ARCANA','good');log('hero',`Lifeline: ${h.name} regains 1 Arcana.`)}
  else if(h.hp<stat(h,'maxHp')){h.hp=Math.min(stat(h,'maxHp'),h.hp+2);fxU(u,'+2 HP','good');log('hero',`Lifeline: ${h.name} regains 2 health.`)}}
async function splashV(n){const sd=S.sd,hm=sd.hench.filter(m=>dV(m,sd.v)<=2);if(!hm.length)return;
  await Promise.all(hm.map(m=>A.bolt(ctrV(),ctrU(m),COL.magic,true)));
  hm.forEach(m=>{m.hp-=n;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'ZAP!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);
  log('hero',`The blast catches ${hm.length} henchm${hm.length===1?'an':'en'}.`);render()}
async function gearBlast(center,area,name){const sd=S.sd,[r,d]=area,hm=sd.hench.filter(m=>cheb(m,center)<=r);await A.ring(HC(center.x,center.y),COL.tech,r*2+1.4);hm.forEach(m=>{m.hp-=d;fxP(m.x,m.y,m.hp<=0?'K.O.!':'BLAST!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);termHit(p=>cheb(p,center)<=r,name);log('hero',`${name}: ${d} damage to ${hm.length} henchmen within ${r} of the chosen hex.`);}
async function peekReaction(){const sd=S.sd,k=sd.vkey,c=drawTactic();sd.tdk[k].unshift(c);if(c.sig)markSeenR(k,c.id);await choose('Next hit reaction',`${c.n}. ${c.txt}`,[{l:'Understood',s:'The reaction stays on top of the hit deck.'}]);log('hero',`Next reaction: ${c.n}. ${c.txt}`);}

function applyBoardPrep(kind){const sd=S.sd;sd.boardPrep=kind;
  if(kind==='route'){const mid=Math.floor(N/2),lane=k=>{const[x,y]=k.split(',').map(Number);return (x===mid||x===mid-1)&&y>=3;};sd.obs=sd.obs.filter(k=>!lane(k));sd.walls=sd.walls.filter(w=>!lane(w.k));sd.pits=sd.pits.filter(k=>!lane(k));sd.haz=sd.haz.filter(h=>!lane(h.k));}
  if(kind==='cover'){for(const x of [2,N-3]){const t=freeTiles((a,b)=>b>=N-3&&b<N-1).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];if(t)sd.walls.push({k:t.x+','+t.y,ttl:99,perm:true});}}
  if(kind==='evac'){for(const c of sd.civs){const t=freeTiles((x,y)=>y>=N-3&&!sd.haz.some(z=>z.k===x+','+y)).sort((a,b)=>Math.min(a.x,N-1-a.x)-Math.min(b.x,N-1-b.x))[0];if(t){c.x=t.x;c.y=t.y;}}}
  if(kind==='thin'){const m=sd.hench.find(h=>!h.elite);if(m)sd.hench=sd.hench.filter(h=>h!==m);}
  log('hero',`Battlefield preparation: ${BOARD_PREP_TEXT[kind]}`);
}
