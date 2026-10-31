/* battle/civilians.js: Civilians: exits, following, panic, escort, henchman grabs. */
function harmCiv(c,why){const sd=S.sd;sd.civs=sd.civs.filter(o=>o!==c);sd.harmed++;fxP(c.x,c.y,'AAAH!','vhit');log('vill',`A civilian is hurt by ${why}.`)}
/* Civilians are saved on an exit hex (sd.exits). c.f = id of the hero they follow, c.held = id of the henchman dragging them. */
function mkExits(n,fin){const e=[`0,${n-1}`,`${n-1},${n-1}`];if(fin)e.push(`${Math.random()<.5?0:n-1},${Math.floor(n/2)}`);return e}
const isExit=p=>(S.sd.exits||[]).includes(p.x+','+p.y);
const followers=u=>S.sd.civs.filter(c=>c.f===u.hid);
const civHeld=c=>!!c.held&&S.sd.hench.some(m=>m.id===c.held);
const panicky=c=>!c.f&&!civHeld(c)&&!live().some(u=>cheb(u,c)<=1);
function saveCiv(c,u){const sd=S.sd;if(!sd.civs.includes(c))return;sd.civs=sd.civs.filter(o=>o!==c);sd.evac++;fxP(c.x,c.y,'SAVED!','good');
  const h=u&&heroOf(u);log('hero',h?`${h.name} gets a civilian out through the exit.`:'A civilian makes it out through an exit.');if(h&&gearHas(h,'rescue'))lifeline(u,h)}
function civHazard(c){const sd=S.sd,k=c.x+','+c.y;if(sd.haz.some(h=>h.k===k))harmCiv(c,'the molten floor');else if(litMap()[k])harmCiv(c,'a beam')}
function letGo(u,why){const fs=followers(u);fs.forEach(c=>c.f=null);if(fs.length&&why)log('hero',`${heroOf(u).name} ${why}`);return fs.length}
/* after a hero moves, the civilians they lead catch up through free hexes; a hero on an exit sends them all out */
function civFollow(u){const sd=S.sd,fs=followers(u);if(!fs.length)return;
  if(u.ko){letGo(u,'goes down, and the civilians scatter.');return}
  if(isExit(u)){fs.forEach(c=>saveCiv(c,u));return}
  const placed=[u],lim=stat(heroOf(u),'move')+3,near=p=>placed.some(o=>cheb(o,p)<=1);
  for(const c of fs.sort((a,b)=>cheb(a,u)-cheb(b,u))){
    if(near(c)){placed.push(c);continue}
    const r=reach(c,lim,c);let best=null,bd=1e9;for(const k in r){const[x,y]=k.split(',').map(Number);if(r[k]<bd&&near({x,y})){bd=r[k];best={x,y}}}
    if(best){c.x=best.x;c.y=best.y;placed.push(c);civHazard(c);if(isExit(c))saveCiv(c,u)}
    else{c.f=null;fxP(c.x,c.y,'WAIT!','miss');log('hero',`A civilian can't keep up with ${heroOf(u).name} and is left behind.`)}}}
function escort(){const sd=S.sd,u=sd.units[sd.sel];if(!u||u.ko||(u.acted&&!u.freeEvac))return;const h=heroOf(u),cs=sd.civs.filter(c=>c.f!==u.hid&&!civHeld(c)&&cheb(c,u)<=1);if(!cs.length)return;
  return act(async()=>{if(u.freeEvac)u.freeEvac=false;else u.acted=true;A.lunge('h'+u.hid,HC(cs[0].x,cs[0].y));await Promise.all(cs.map(c=>A.sparkle(HC(c.x,c.y),COL.yel)));
    cs.forEach(c=>{c.f=u.hid;fxP(c.x,c.y,'THIS WAY!','good')});log('hero',`${h.name} gathers ${cs.length} civilian${cs.length>1?'s':''}. They follow ${h.name} until they reach an exit.`);
    if(isExit(u))cs.forEach(c=>saveCiv(c,u))})}
/* villain turn: loose civilians with nobody beside them run 1 hex from the nearest threat; they may run into hazards or out an exit */
async function civPanic(){const sd=S.sd,T=[];sd.vl.forEach(o=>{if(!o.v.down)vCells(o.v).forEach(c=>T.push(c))});sd.hench.forEach(m=>T.push(m));(sd.bombs||[]).forEach(b=>T.push(bombP(b)));
  const scared=sd.civs.filter(panicky);if(!T.length||!scared.length)return;const dT=p=>Math.min(...T.map(t=>cheb(t,p)));let ran=0;
  for(const c of scared){if(!sd.civs.includes(c))continue;const d0=dT(c);
    const opts=nbrs(c).filter(n=>!blocked(n.x,n.y)).map(n=>({n,d:dT(n)+Math.random()*.4})).filter(o=>o.d>=d0+1).sort((a,b)=>b.d-a.d);
    fxP(c.x,c.y,pick(['HELP!','AIEE!','RUN!','EEK!']),'panic');c.panic=Date.now();
    if(opts.length){c.x=opts[0].n.x;c.y=opts[0].n.y;ran++}}
  log('vill',ran?`${ran} panicking civilian${ran>1?'s run':' runs'} from the fight.`:'The civilians cower in place.');render();await sleep(FAST?0:650);
  for(const c of scared){if(!sd.civs.includes(c))continue;civHazard(c);if(sd.civs.includes(c)&&isExit(c))saveCiv(c,null)}render()}
/* a henchman next to a loose civilian grabs them and drags them 1 hex toward its villain each turn instead of attacking */
async function henchGrab(hm){const sd=S.sd,o=sd.vl.find(o=>o.key===(hm.owner||sd.vkey)&&!o.v.down)||sd.vl.find(o=>!o.v.down);if(!o)return false;
  const vv=o.v,first=!sd.civs.some(c=>c.held===hm.id),cv=sd.civs.find(c=>c.held===hm.id)||sd.civs.find(c=>!c.f&&!civHeld(c)&&cheb(c,hm)<=1);if(!cv)return false;
  cv.held=hm.id;const dv=p=>dV(p,vv),n=nbrs(cv).filter(p=>!blocked(p.x,p.y)&&dv(p)<dv(cv)).sort((a,b)=>dv(a)-dv(b))[0];
  const hn=VILLAINS[o.key].hench.name;
  if(n){cv.x=n.x;cv.y=n.y;if(cheb(hm,cv)>1){const t=freeTiles((x,y)=>cheb({x,y},cv)===1).sort((a,b)=>cheb(a,hm)-cheb(b,hm))[0];if(t){hm.x=t.x;hm.y=t.y}}
    if(cheb(hm,cv)>1)cv.held=null;else{fxP(cv.x,cv.y,first?'GOTCHA!':'LET GO!','vhit');log('vill',first?`A ${hn.toLowerCase()} grabs a civilian and drags them toward ${VILLAINS[o.key].name}.`:`The ${hn.toLowerCase()} drags the civilian closer to ${VILLAINS[o.key].name}.`)}
    render();await sleep(FAST?0:350);civHazard(cv)}
  else{fxP(cv.x,cv.y,first?'GOTCHA!':'HELP!','vhit');log('vill',`A ${hn.toLowerCase()} holds a civilian hostage.`)}
  return true}
