/* Isometric presentation only. Distances, facing, collision and saves stay in hex space. */
let isoEnabled=true;
ACT.battleArt=()=>{isoEnabled=!isoEnabled;lastPos={}};
const ISO_KEYS=['bulwark','volt','wisp','cipher','rivet','lynx','goliath','sibyl','hexen','gallows','quarry','cantor','architect','helios','serpent','lode','noct','swarm','bomber','grid','mole','sting','shell','civilian','m-gallows','m-quarry','m-cantor','m-architect','m-helios','m-serpent','m-lode','m-noct','m-swarm','m-bomber','m-grid','civilian2'];
let isoAngle=-15,isoFrameCache=null;
function isoRaw(cx,cy){const a=isoAngle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:c*cx-s*cy,y:.58*(s*cx+c*cy)}}
/* Fit the projected playable perimeter with just enough headroom for upright actors. */
function isoFrame(){
 if(isoFrameCache&&isoFrameCache.angle===isoAngle&&isoFrameCache.n===N)return isoFrameCache;
 const points=[],hex=[];for(let i=0;i<6;i++){const a=(i*60-90)*Math.PI/180;hex.push(isoRaw(Math.cos(a)*HS,Math.sin(a)*HS))}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const h=HC(x,y),p=isoRaw(h.cx,h.cy);hex.forEach(q=>points.push({x:p.x+q.x,y:p.y+q.y}))}
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),left=Math.min(...xs)-.25,top=Math.min(...ys)-1.1;
 return isoFrameCache={angle:isoAngle,n:N,W:Math.max(...xs)+.25-left,H:Math.max(...ys)+.25-top,ox:-left,oy:-top,hexW:Math.max(...hex.map(p=>p.x))*2,hexH:Math.max(...hex.map(p=>p.y))*2};
}
function isoPoint(cx,cy){const p=isoRaw(cx,cy),f=isoFrame();return {x:p.x+f.ox,y:p.y+f.oy}}
ACT.isoRotate=delta=>{const d=Number(delta);if(!Number.isFinite(d))return;isoAngle=Math.max(-60,Math.min(30,isoAngle+d));isoFrameCache=null;lastPos={}};
ACT.isoReset=()=>{isoAngle=-15;isoFrameCache=null;lastPos={}};
function isoControls(){return `<div class="iso-camera" role="group" aria-label="Battlefield camera"><button class="btn sm" data-a="isoRotate:-15" aria-label="Rotate battlefield left" ${isoAngle<=-60?'disabled':''}>↶</button><button class="btn sm" data-a="isoReset" aria-label="Reset battlefield angle">Fit view</button><button class="btn sm" data-a="isoRotate:15" aria-label="Rotate battlefield right" ${isoAngle>=30?'disabled':''}>↷</button></div>`}

const ISO_CAST_GROUPS=[['cipher','rivet','goliath','sibyl','hexen','civilian','civilian2','sting','shell'],['m-gallows','m-quarry','m-cantor','m-architect','m-helios','m-serpent'],['m-lode','m-noct','m-swarm','m-bomber','m-grid','m-mole']];
const ISO_HERO_SPRITES=['bulwark','volt','wisp','lynx'];
const ISO_COVER_GROUPS=[['gallows','quarry','cantor','architect'],['helios','serpent','lode','noct'],['swarm','bomber','grid','mole']];
const ISO_VILLAIN_VARIANTS={architect:'architect-left',grid:'gridlock-left'};
function isoSprite(key,label,scale=1){
 const canonical=key==='hive'?'swarm':key,i=Math.max(0,ISO_KEYS.indexOf(canonical));
 const group=ISO_COVER_GROUPS.findIndex(a=>a.includes(canonical)),slot=group<0?0:ISO_COVER_GROUPS[group].indexOf(canonical);
 let art=group<0?'':`background-image:url(assets/isometric/cover-${group+1}.webp);background-size:200% 200%;background-position:${slot%2*100}% ${Math.floor(slot/2)*100}%;`;
 const heroSlot=ISO_HERO_SPRITES.indexOf(key);
 if(heroSlot>=0)art=`background-image:url(assets/isometric/heroes-superhero.webp);background-size:200% 200%;background-position:${heroSlot%2*100}% ${Math.floor(heroSlot/2)*100}%;`;
 const castGroup=ISO_CAST_GROUPS.findIndex(a=>a.includes(canonical));
 if(castGroup>=0){const castSlot=ISO_CAST_GROUPS[castGroup].indexOf(canonical),rows=castGroup===0?3:2;art=`background-image:url(assets/isometric/cast-${castGroup+1}.webp);background-size:300% ${rows*100}%;background-position:${castSlot%3*50}% ${Math.floor(castSlot/3)/(rows-1)*100}%;`}
 const variant=ISO_VILLAIN_VARIANTS[canonical];
 if(variant)art=`background-image:url(assets/isometric/${variant}.webp);background-size:100% 100%;background-position:center;`;
 return `<span class="iso-figure" data-sprite="${esc(canonical)}" style="${art}--face:1;--sx:${i%6*20}%;--sy:${Math.floor(i/6)*20}%;--size:${scale}" aria-hidden="true"></span><span class="iso-name">${esc(label)}</span>`;
}
function isoProp(kind,p,pos,badge=''){
 const slot={wall:0,rubble:1,terminal:2,bomb:3}[kind];
 return `<span class="iso-prop-art iso-prop-${kind}" style="${pos(p)};--px:${slot%2*100}%;--py:${Math.floor(slot/2)*100}%" aria-hidden="true"><i></i>${badge?`<b>${esc(badge)}</b>`:''}</span>`;
}
/* Smooth body joins through actual occupied hex centers. The final span tapers to a tail. */
function isoSerpentPath(v){
 const points=[{x:v.x,y:v.y},...(v.body||[])].map(c=>{const h=HC(c.x,c.y);return isoPoint(h.cx,h.cy)});
 if(points.length<2)return {d:'',points};
 let d=`M${points[0].x} ${points[0].y}`;
 for(let j=1;j<points.length-1;j++){const a=points[j],b=points[j+1];d+=` Q${a.x} ${a.y} ${(a.x+b.x)/2} ${(a.y+b.y)/2}`}
 const last=points[points.length-1];d+=` L${last.x} ${last.y}`;return {d,points};
}
function isoSerpent(v,i){const {d,points}=isoSerpentPath(v);if(!d)return '';
 const end=points[points.length-1],prev=points[points.length-2],angle=Math.atan2(end.y-prev.y,end.x-prev.x)*180/Math.PI;
 return `<g class="iso-serpent-body" data-serpent="${i}"><path class="iso-serpent-shadow" d="${d}"/><path class="iso-serpent-outline" d="${d}"/><path class="iso-serpent-scales" d="${d}"/><path class="iso-serpent-shine" d="${d}"/>${points.slice(1,-1).map((p,j)=>`<ellipse class="iso-segment-ring" data-segment="${j}" cx="${p.x}" cy="${p.y}" rx=".20" ry=".095"/>`).join('')}<g transform="translate(${end.x} ${end.y}) rotate(${angle})"><image class="iso-serpent-tail" href="assets/isometric/serpent-tail.webp" x="-.48" y="-.27" width="1.05" height=".54"/></g></g>`;
}
function isoFloorDetail(h,x,y,kind){
 const p=isoPoint(h.cx,h.cy),n=(x*17+y*31)%7;
 if(kind==='pit')return `<ellipse class="iso-pit-rim" cx="${p.x}" cy="${p.y}" rx=".40" ry=".19"/><ellipse class="iso-pit-depth" cx="${p.x}" cy="${p.y+.035}" rx=".30" ry=".12"/>`;
 if(kind==='molten')return `<path class="iso-lava-seam" d="M${p.x-.3} ${p.y+.05}l.2 -.11 .13 .14 .2 -.06"/>`;
 return n<3?`<path class="iso-floor-crack" d="M${p.x-.28} ${p.y-.03}l.15 .04 .10 -.07 .14 .08m-.14 -.08l.02 -.09"/>`:n===4?`<ellipse class="iso-puddle" cx="${p.x+.05}" cy="${p.y}" rx=".28" ry=".07"/>`:'';
}
function isoBoard(sd,reachM,tg,al){
 const {W,H,hexW,hexH}=isoFrame(),lit=litMap(),blast=new Set(),later=new Set();(sd.bombs||[]).forEach(b=>hexesWithin(bombP(b),bombRadius(b)).forEach(p=>(b.fuse<=1?blast:later).add(p.x+','+p.y)));
 const point=(x,y)=>{const h=HC(x,y);return isoPoint(h.cx,h.cy)},pos=p=>`left:${p.x/W*100}%;top:${p.y/H*100}%`,poly=(cx,cy,r=1)=>Array.from({length:6},(_,i)=>{const a=(i*60-90)*Math.PI/180,p=isoPoint(cx+Math.cos(a)*HS*r,cy+Math.sin(a)*HS*r);return `${p.x},${p.y}`}).join(' ');
 let tiles='',buttons='',objects=[];const material=['gallows','architect','helios','lode','grid'].includes(sd.vkey)?'steel':['cantor','noct'].includes(sd.vkey)?'wood':['serpent','swarm'].includes(sd.vkey)?'sewer':'street';
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=x+','+y,h=HC(x,y),p=point(x,y),wall=(sd.walls||[]).some(w=>w.k===k),rubble=sd.obs.includes(k),pit=(sd.pits||[]).includes(k),haz=(sd.haz||[]).some(o=>o.k===k),exit=(sd.exits||[]).includes(k),danger=blast.has(k)||(sd.firing||[]).includes(k),tele=bossMarked(k)||sd.vl.some(o=>o.v.charge&&o.v.charge.zone.includes(k));
 const facing=sd.vl.filter(o=>!o.v.down&&!o.v.hide&&!inV(o.v,x,y)&&dV({x,y},o.v)<=2).map(o=>sideOf({x,y},o.v));
 const cls=[facing.includes('rear')?'rear':facing.includes('front')?'front':'',wall?'wall':'',rubble?'rubble':'',pit?'pit':'',haz?'molten':'',exit?'exit':'',danger?'danger':'',tele||later.has(k)?'warning':'',lit[k]?'lit':'',k in reachM?'reachable':'',tg.has(k)?'target':'',al.has(k)?'allied':''].join(' ');
 tiles+=`<polygon class="iso-tile ${cls}" points="${poly(h.cx,h.cy,.96)}"/><polygon class="iso-overlay ${cls}" points="${poly(h.cx,h.cy,.91)}"/>${isoFloorDetail(h,x,y,pit?'pit':haz?'molten':'normal')}${exit?`<path class="iso-exit-arrow" d="M${p.x-.16} ${p.y+.02}l.18 -.09 -.04 .12m.04 -.12l-.2 .01"/>`:''}`;
 buttons+=`<button class="iso-cell ${cls}" data-cell="${k}" data-tip="cell:${x}:${y}" style="${pos(p)};width:${hexW/W*100}%;height:${hexH/H*100}%;clip-path:polygon(${Array.from({length:6},(_,i)=>{const a=(i*60-90)*Math.PI/180,q=isoPoint(h.cx+Math.cos(a)*HS,h.cy+Math.sin(a)*HS);return `${50+(q.x-p.x)/hexW*100}% ${50+(q.y-p.y)/hexH*100}%`}).join(',')})" aria-label="Hex ${x+1},${y+1}${wall?', wall':rubble?', rubble':pit?', pit':haz?', hazard':''}${exit?', exit':''}${danger?', blast danger':''}"></button>`;
 if(wall||rubble)objects.push({d:p.y,html:isoProp(wall?'wall':'rubble',p,pos)});
 }
 const token=(p,key,label,tid,cls='',scale=1,badge='',title=label)=>{objects.push({d:p.y,html:`<div class="iso-unit ${cls}" title="${esc(title)}" data-tid="${tid}" data-cx="${p.x}" data-cy="${p.y}" style="${pos(p)};--depth:${Math.round(p.y*100)}">${isoSprite(key,label,scale)}${badge?`<b class="iso-badge">${esc(badge)}</b>`:''}</div>`})};
 sd.units.forEach((u,i)=>{const h=heroOf(u);token(point(u.x,u.y),h.cls,h.name,'h'+u.hid,`hero ${sd.sel===i?'selected':''} ${u.ko?'ko':''} ${u.moved&&u.acted?'spent':''}`,1,u.guard?'◆':'')});
 sd.hench.forEach(m=>{
  const name=hName(m);
  const title=m.shadow?'Stolen shadow · 1 HP':m.infested?'Infested mite · next boss action':name;
  token(point(m.x,m.y),'m-'+m.owner,name,'m'+m.id,`enemy ${m.elite?'elite':m.infested?'infested':m.shadow?'shadow':''}`,m.elite?1.1:.9,String(m.hp),title);
 });
 (sd.dupes||[]).forEach(m=>token(point(m.x,m.y),'m-'+m.owner,'Shadow double','d'+m.id,'double',.9,'∞'));
 sd.civs.forEach(c=>token(point(c.x,c.y),eyeHash(c.id)%2?'civilian':'civilian2','Civilian','c'+c.id,'civilian',.86,c.f?'↗':''));
 let footprints='',serpents='';sd.vl.forEach((o,i)=>{const v=o.v;if(v.down)return;vCells(v).forEach(c=>{const h=HC(c.x,c.y);footprints+=`<polygon class="iso-footprint" points="${poly(h.cx,h.cy,.82)}"/>`});
 if(v.sw){swBodies(v).forEach(b=>token(point(b.x,b.y),b.k,VILLAINS[o.key].short,'v'+i+(b.i?'s'+b.i:''),'boss',1.15,'L'+v.level));return}
 const h=vCtr(v),p=isoPoint(h.cx,h.cy);token(p,o.key,VILLAINS[o.key].short,'v'+i,`boss ${v.hide?'hidden':''} ${v.charge?'charging':''}`,vCells(v).length>1&&!v.body?1.65:1.2,v.hide?'?':'L'+v.level);
 if(v.body)serpents+=isoSerpent(v,i);
 const f=FACE_DEG[v.face??5]*Math.PI/180,q=isoPoint(h.cx+Math.cos(f)*.8,h.cy+Math.sin(f)*.8);footprints+=`<line class="iso-facing" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" marker-end="url(#iso-arrow)"/>`;
 });
 if(sd.term){const t=termP(),p=point(t.x,t.y);objects.push({d:p.y,html:isoProp('terminal',p,pos)})}
 (sd.bombs||[]).forEach(b=>{const t=bombP(b),p=point(t.x,t.y);objects.push({d:p.y,html:isoProp('bomb',p,pos,String(b.fuse))})});
 let beams='';(sd.beams||[]).forEach(b=>{const a=b.k0.split(',').map(Number),z=b.ks[b.ks.length-1].split(',').map(Number),p=point(...a),q=point(...z);beams+=`<line class="iso-beam" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`});
 const now=Date.now();let fxhtml='';(sd.fx||[]).forEach(f=>{const age=now-f.born;if(age>1600)return;const p=isoPoint(f.cx,f.cy);fxhtml+=`<div class="fx k-${f.k}" style="${pos(p)};animation-delay:-${age}ms" aria-hidden="true"><div class="b"><span>${esc(f.t)}</span></div></div>`});
 return `<div class="board iso-board iso-material-${material}" data-iso-angle="${isoAngle}" style="aspect-ratio:${W}/${H}"><svg class="iso-floor" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><pattern id="iso-street" width="3" height="3" patternUnits="userSpaceOnUse"><image href="assets/isometric/street.webp" width="3" height="3"/></pattern><pattern id="iso-steel" width="1.2" height=".65" patternUnits="userSpaceOnUse"><rect width="1.2" height=".65" fill="#283c47"/><image href="assets/isometric/street.webp" width="1.2" height=".65" opacity=".45"/><path d="M0 .02H1.2M.02 0V.65M.6 0V.65" stroke="#839494" stroke-opacity=".4" stroke-width=".018"/><circle cx=".09" cy=".09" r=".025" fill="#b6b7a0"/></pattern><pattern id="iso-wood" width=".9" height=".65" patternUnits="userSpaceOnUse"><rect width=".9" height=".65" fill="#483a34"/><image href="assets/isometric/street.webp" width=".9" height=".65" opacity=".25"/><path d="M0 .03H.9M0 .33H.9M.25 0V.33M.7 .33V.65" stroke="#130e15" stroke-width=".026"/><path d="M.06 .14L.6 .12M.2 .46L.85 .51" stroke="#ba9970" stroke-opacity=".2" stroke-width=".014"/></pattern><pattern id="iso-sewer" width="1" height=".6" patternUnits="userSpaceOnUse"><rect width="1" height=".6" fill="#1b3937"/><image href="assets/isometric/street.webp" width="1" height=".6" opacity=".55"/><path d="M0 0H1M0 .3H1M.5 0V.3M.22 .3V.6" stroke="#71977b" stroke-opacity=".3" stroke-width=".025"/></pattern><pattern id="iso-scales" width=".7" height=".7" patternUnits="userSpaceOnUse"><image href="assets/isometric/serpent-scales.webp" width=".7" height=".7"/></pattern><pattern id="iso-danger-stripes" width=".24" height=".24" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width=".24" height=".24" fill="#b6234566"/><rect width=".1" height=".24" fill="#ff678255"/></pattern><radialGradient id="iso-pit"><stop stop-color="#000"/><stop offset=".7" stop-color="#050d14"/><stop offset="1" stop-color="#58696a"/></radialGradient><marker id="iso-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ffd27a"/></marker></defs>${tiles}${footprints}${beams}${serpents}</svg>${buttons}${objects.sort((a,b)=>a.d-b.d).map(o=>o.html).join('')}${fxhtml}</div>`;
}
/* Light and rising motes accompany every successfully paid power and gear ability. */
function isoAbility(u,col){if(FAST||RM||!document.querySelector('.iso-board'))return;const p=bpos(ctrU(u));if(!p)return;
 const e=mk(`<div class="iso-ability" style="left:${p.x}px;top:${p.y}px;--light:${col};--diameter:${p.c*2}px"></div>`);
 e.animate([{transform:'translate(-50%,-50%) scale(.15)',opacity:0},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.3},{transform:'translate(-50%,-50%) scale(1.5)',opacity:0}],{duration:750,easing:'ease-out'});gone(e,750);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,m=mk(`<div class="a-spark" style="position:fixed;left:${p.x}px;top:${p.y}px;width:4px;height:4px;background:${col};box-shadow:0 0 9px ${col}"></div>`);m.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(${Math.cos(a)*p.c}px,${Math.sin(a)*p.c*.45-p.c}px)`,opacity:0}],{duration:550+i*25});gone(m,750)}
}
const isoPayPower=payPow;payPow=function(u,h){isoPayPower(u,h);isoAbility(u,BASE(h).glow)};
const isoPayGear=payAb;payAb=function(u,k){isoPayGear(u,k);isoAbility(u,COL[GEAR[k].type]||COL.cyan)};
