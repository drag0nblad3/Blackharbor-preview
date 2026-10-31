/* battle/hero-move.js: Hero reach and moves, board taps (onCell), ally moves. */
/* hero movement with lit beams: a lit hex can be entered but not passed through, unless you jump clean over it */
/* beams end a normal move; only a jumping hero (u.jump from Solar Dive, u.boostJump from Mighty Leap, Jet or Piston Leap, or gear with jumps) can clear one lit hex for 2 movement */
const JUMP_AB=['wings'];
function reachH(u,mv){const lm=litMap(),pt=new Set(S.sd.pits||[]),jump=!!(u.jump||u.boostJump||jumpsAll(heroOf(u)));reachH.leaps=new Set();if(!Object.keys(lm).length&&!(jump&&pt.size))return reach(u,mv,u);
  const s=u.x+','+u.y,dist={[s]:0},q=[[u.x,u.y]],lp=reachH.leaps;
  while(q.length){const[x,y]=q.shift(),k0=x+','+y,d=dist[k0];if(d>=mv||(k0!==s&&lm[k0]))continue;
    for(let e=0;e<6;e++){const n=step({x,y},e),k=n.x+','+n.y;
      if(!blocked(n.x,n.y,{self:u})&&!(k in dist&&dist[k]<=d+1)){dist[k]=d+1;lp.delete(k);q.push([n.x,n.y])}
      if(jump&&(lm[k]||pt.has(k))&&d+2<=mv){const n2=step(n,e),k2=n2.x+','+n2.y;if(inB(n2.x,n2.y)&&!lm[k2]&&!blocked(n2.x,n2.y,{self:u})&&!(k2 in dist&&dist[k2]<=d+2)){dist[k2]=d+2;lp.add(k2);q.push([n2.x,n2.y])}}}}
  delete dist[s];return dist}
/* Free repositioning (Tyler, 2026-10-31): after moving, a hero can pick a different end hex anywhere in the
   same move area (measured from where the move started) until they take their action. A hero who acted
   first can keep adjusting until the round ends. Stepping into a beam, being moved by anything else,
   or a second move granted by an ability ends the adjusting. */
function reMoveOk(u){const m=u&&u.mv;return !!(m&&u.moved&&!u.ko&&!m.lock&&m.at===u.x+','+u.y&&(m.acted||!u.acted))}
const mvOk=u=>!!u&&!u.ko&&(!u.moved||reMoveOk(u));
function mvRewind(u){const m=u.mv;u.x=m.x;u.y=m.y;u.hexesMoved=m.hm;u.boost=m.boost;u.jump=m.jump;u.boostJump=m.bj}
function heroReach(u,h){const m=reMoveOk(u)?u.mv:null;if(!m)return reachH(u,stat(h,'move')+(u.boost||0));
  const sv={x:u.x,y:u.y,jump:u.jump,boostJump:u.boostJump};u.x=m.x;u.y=m.y;u.jump=m.jump||u.jump;u.boostJump=m.bj||u.boostJump;
  try{return reachH(u,stat(h,'move')+m.boost+(u.boost||0))}finally{Object.assign(u,sv)}}
function onCell(x,y){const sd=S.sd;if(sd.busy||sd.result)return;const k=x+','+y;const vAt=sd.vl.findIndex(o=>!o.v.down&&inV(o.v,x,y));
  const u=sd.sel!=null?sd.units[sd.sel]:null,h=u&&heroOf(u);
  const unitIdx=sd.units.findIndex(o=>!o.ko&&o.x===x&&o.y===y);
  if(u){
    if(sd.mode==='move'&&mvOk(u)){const m=reMoveOk(u)?u.mv:null,r=heroReach(u,h);
      if(m&&x===m.x&&y===m.y&&!blocked(x,y,{self:u})){mvRewind(u);u.moved=false;u.mv=null;civFollow(u);log('hero',`${h.name} steps back to where they started.`);render();return}
      if(k in r&&!(x===u.x&&y===u.y)){const lp=reachH.leaps.has(k),sw=sd.civs.find(c=>c.x===x&&c.y===y);if(m){m.boost+=u.boost||0;m.jump=m.jump||u.jump;m.bj=m.bj||u.boostJump;mvRewind(u)}else u.mv={x:u.x,y:u.y,hm:u.hexesMoved||0,boost:u.boost||0,jump:!!u.jump,bj:!!u.boostJump,acted:!!u.acted};
        if(sw){sw.x=u.x;sw.y=u.y}u.hexesMoved=(u.hexesMoved||0)+r[k];u.x=x;u.y=y;u.moved=true;u.jump=false;u.boost=0;u.boostJump=false;u.mv.at=k;if(litMap()[k])u.mv.lock=true;sd.mode=reMoveOk(u)?'move':null;if(lp){fxU(u,'HUP!','good');log('hero',`${h.name} jumps clear over a beam.`)}beamStep(u);if(u.ko)u.mv.lock=true;civFollow(u);render();return}}
    if(sd.mode==='attack'||sd.mode==='arc'){const rng=stat(h,'range');let t=null;
      if(vAt>=0&&dV(u,sd.vl[vAt].v)<=rng&&!shotVB(u,sd.vl[vAt].v)){focusV(vAt);t='v';sd.aim={x,y}}else{const m=sd.hench.find(m=>m.x===x&&m.y===y&&cheb(m,u)<=rng&&!shotBlocked(u,m));if(m)t=m}
      if(t){const arc=sd.mode==='arc';return act(async()=>{u.acted=true;if(arc)payPow(u,h);await heroAttack(u,t,arc?1:0);if(arc&&!sd.result)await splash(t)})}}
    if(sd.mode==='rallySpirit'&&unitIdx>=0&&!u.acted&&!u.ko&&cheb(u,sd.units[unitIdx])<=lvlOf(h)){const tu=sd.units[unitIdx],t=heroOf(tu);return act(async()=>{u.acted=true;if(tu!==u)await A.shot(ctrU(u),ctrU(tu),COL.heal);await A.heal(ctrU(tu),COL.heal);const gained=Math.min(3,Math.max(0,stat(t,'maxComp')-t.comp));t.comp+=gained;fxU(tu,gained?'+'+gained+' SPIRIT':'STEADY!','good');log('hero',`${h.name} rallies ${tu===u?'themselves':t.name}, restoring ${gained} composure.`)})}
    if(sd.mode==='patch'&&unitIdx>=0&&cheb(sd.units[unitIdx],u)<=3){const tu=sd.units[unitIdx],t=heroOf(tu);
      return act(async()=>{payPow(u,h);if(tu!==u)await A.shot(ctrU(u),ctrU(tu),COL.heal);await A.heal(ctrU(tu),COL.heal);
        t.hp=Math.min(stat(t,'maxHp'),t.hp+3);t.comp=Math.min(stat(t,'maxComp'),t.comp+2);fxU(tu,'+3 HP','good');log('hero',`${h.name} patches up ${t.name}.`)})}
    if(sd.mode==='barricade'&&cheb({x,y},u)<=2&&!blocked(x,y))return act(async()=>{payPow(u,h);await A.smoke(HC(x,y),4);sd.walls.push({k,ttl:3});fxU(u,'CLANK!','good');log('hero',`${h.name} bolts up a barricade.`)});
    if(sd.mode==='abally'&&unitIdx>=0){const key=sd.abKey,g=GEAR[key],a=g.ab,tu=sd.units[unitIdx];
      if(abOk(u,h,key)&&cheb(tu,u)<=abV(a.r,potOf(h))&&allyAbilityOK(u,tu,a))return act(async()=>{payAb(u,key);log('hero',`${h.name} uses ${a.n} on ${tu===u?'themselves':heroOf(tu).name} (${abCost(g)}).`);if(tu!==u)await A.shot(ctrU(u),ctrU(tu),COL[g.type]);await abApply(u,h,g,tu)})}
    if(sd.mode==='abtele'&&cheb({x,y},u)<=abV(GEAR[sd.abKey].ab.r,potOf(h))&&!blocked(x,y)){const key=sd.abKey,g=GEAR[key],a=g.ab;
      return act(async()=>{payAb(u,key);await A.sparkle(ctrU(u),COL[g.type]);if(a.leap)u.hexesMoved=(u.hexesMoved||0)+cheb(u,{x,y});u.x=x;u.y=y;noFlip.add('h'+u.hid);beamStep(u);render();await A.sparkle(ctrU(u),COL[g.type]);fxU(u,a.leap?'KA-THOOM!':'BAMF!','good');log('hero',`${h.name} uses ${a.n} (${abCost(g)}).`);await abApply(u,h,g,u)})}
    if(sd.mode==='abblast'){const key=sd.abKey,g=GEAR[key],a=g.ab;if(abOk(u,h,key)&&cheb(u,{x,y})<=a.r&&!shotBlocked(u,{x,y}))return act(async()=>{payAb(u,key);await gearBlast({x,y},a.fx.blast,a.n)})}
    if(sd.mode==='abcover'&&cheb({x,y},u)<=abV(GEAR[sd.abKey].ab.r,potOf(h))&&!blocked(x,y)){const key=sd.abKey,g=GEAR[key],a=g.ab;
      return act(async()=>{payAb(u,key);await A.smoke(HC(x,y),4);sd.walls.push({k,ttl:2});fxU(u,'CLANK!','good');log('hero',`${h.name} uses ${a.n} (${abCost(g)}): a wall goes up.`)})}
    if(sd.mode==='abstrike'&&vAt>=0){const key=sd.abKey,g=GEAR[key],a=g.ab;
      if((!a.rng||dV(u,sd.vl[vAt].v)<=a.rng)&&!shotVB(u,sd.vl[vAt].v)){focusV(vAt);sd.aim={x,y};
        return act(async()=>{payAb(u,key);u.acted=true;log('hero',`${h.name} unleashes ${a.n} (${abCost(g)})!`);if(a.str)u.buffStr+=a.str;await heroAttack(u,'v',a.plus||0,a.dice||0,'beam');if(a.splash&&!sd.result)await splashV(a.splash)})}}}
  if(vAt>=0&&sd.vl.length>1&&unitIdx<0){focusV(vAt);render();return}
  if(unitIdx>=0){if(sd.sel!==unitIdx){sd.combatPick=null;sd.combatMenuOpen=null}sd.sel=unitIdx;const o=sd.units[unitIdx];sd.mode=mvOk(o)?'move':null}
  else{sd.sel=null;sd.mode=null;sd.combatPick=null;sd.combatMenuOpen=null}
  render()}

function safeAllyHex(p,self){const sd=S.sd,k=p.x+','+p.y;return !blocked(p.x,p.y,{self})&&!sd.haz.some(z=>z.k===k)&&!litMap()[k]&&!(sd.bombs||[]).some(b=>cheb(p,bombP(b))<=bombRadius(b));}
function allySteps(u,tu,sign){return nbrs(tu).filter(p=>safeAllyHex(p,tu)&&sign*(cheb(p,u)-cheb(tu,u))>0);}
function allyAbilityOK(u,tu,a){const f=a.fx||{};if(tu.ko)return false;if(f.swapAlly)return tu!==u;if(f.pushAlly||f.pullAlly)return tu!==u&&allySteps(u,tu,f.pushAlly?1:-1).length>0;return true;}
async function moveAlly(u,tu,sign,n){for(let j=0;j<n;j++){const tiles=allySteps(u,tu,sign);if(!tiles.length)break;const i=tiles.length===1?0:await choose(sign>0?'Push ally':'Pull ally','Choose a safe adjacent landing hex.',tiles.map(p=>({l:`Hex ${p.x+1}, ${p.y+1}`,s:'Reposition without spending their move.'})));Object.assign(tu,tiles[i]);civFollow(tu);}log('hero',`${heroOf(tu).name} is ${sign>0?'pushed':'pulled'} to safety.`);}
