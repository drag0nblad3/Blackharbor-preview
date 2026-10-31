/* battle/setup.js: Fight log and fx, units, lairs and terrain, terminals, startShowdown. */
function log(k,t){S.sd.log.push({k,t});if(S.sd.log.length>60)S.sd.log.shift()}
/* comic SFX: positions are in board units (see HC) */
let fxTimer;
function fx(cx,cy,t,k='hit'){const sd=S.sd;if(!sd)return;sd.fx=sd.fx||[];sd.fx.push({cx,cy,t,k,born:Date.now()});
  clearTimeout(fxTimer);fxTimer=setTimeout(()=>{if(S.sd&&S.sd.fx){S.sd.fx=S.sd.fx.filter(f=>Date.now()-f.born<1600);render()}},1700)}
const fxP=(x,y,t,k)=>{const c=HC(x,y);fx(c.cx,c.cy,t,k)};
const fxU=(u,t,k)=>fxP(u.x,u.y,t,k);
const fxV=(t,k)=>{const c=vCtr(S.sd.v);fx(c.cx,c.cy,t,k)};
const SFX_HIT=['BAM!','POW!','WHAM!','KRAK!','THWACK!','BOOM!'],SFX_VHIT=['THOOM!','KRASH!','SMACK!','CRUNCH!'];
function mkUnit(h,x,y){return {hid:h.id,x,y,moved:false,acted:false,ko:false,anchor:setOn(h,'lode'),res:{tech:pwrMax(h),magic:arcMax(h)},innUsed:0,buffDice:0,buffStr:0}}
function freeTiles(f){const out=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!blocked(x,y)&&(!f||f(x,y)))out.push({x,y});return out}

function focusV(i){const sd=S.sd;if(i<0||!sd.vl[i])return;sd.vi=i;sd.v=sd.vl[i].v;sd.vkey=sd.vl[i].key}
/* lair terrain (V76): each lair has its own layout of rubble, fixed walls, pits and hazard hexes; the finale rolls a random mix.
   wall and pit lists are segment lengths, laid in straight hex lines. Pieces never touch a villain or the heroes' start row,
   and a piece that would cut off part of the floor is thrown out and re-rolled. */
const LAIR={
  gallows:{rub:2,wall:[3,2],haz:2,hn:'live wiring'},      // lab benches, sparking cables
  quarry:{rub:6,pit:[2,1,1]},                             // quarry floor: boulders and blasting holes
  cantor:{rub:2,wall:[3,3],pit:[1]},                      // club: bar counters, tables, a trapdoor
  architect:{rub:1,wall:[2,2,2],pit:[1],haz:2,hn:'molten floor'},
  helios:{rub:3,pit:[2],haz:3,hn:'reactor slag'},
  serpent:{rub:3,pit:[3,2]},                              // sewer channels with crossings
  lode:{rub:4,wall:[3,2]},                                // scrapyard: crushed cars, scrap fences
  noct:{rub:2,wall:[1,1,1,1,1]},                          // pillars to hide behind
  swarm:{rub:2,wall:[2],pit:[1,1,1]},                     // hive comb and burrows
  bomber:{rub:2,pit:[3,2]},                               // gaps between rooftops
  grid:{rub:3,wall:[1],pit:[2]}};                         // little cover for a beam fight
function randLair(){const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),seg=(n,lo,hi)=>Array.from({length:n},()=>r(lo,hi));
  return {rub:r(3,6),wall:seg(r(1,3),1,3),pit:seg(r(1,3),1,2),haz:Math.random()<.5?r(1,3):0,hn:'molten floor'}}
function layTerrain(L){const sd=S.sd,taken=k=>sd.obs.includes(k)||sd.walls.some(w=>w.k===k)||sd.pits.includes(k)||sd.haz.some(h=>h.k===k);
  const ok=(x,y)=>inB(x,y)&&y>=2&&y<=N-3&&!taken(x+','+y)&&!sd.vl.some(o=>dV({x,y},o.v)<=1)&&!(sd.exits||[]).includes(x+','+y);
  /* every open hex must still connect to the heroes' start row */
  const open=()=>{const solid=k=>sd.obs.includes(k)||sd.walls.some(w=>w.k===k)||sd.pits.includes(k);const seen=new Set(),q=[];
    for(let x=0;x<N;x++){const k=x+','+(N-1);if(!solid(k)){seen.add(k);q.push({x,y:N-1})}}
    while(q.length){const p=q.shift();for(const n of nbrs(p)){const k=n.x+','+n.y;if(!inB(n.x,n.y)||seen.has(k)||solid(k)||sd.vl.some(o=>inV(o.v,n.x,n.y)))continue;seen.add(k);q.push(n)}}
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=x+','+y;if(!solid(k)&&!sd.vl.some(o=>inV(o.v,x,y))&&!seen.has(k))return false}
    return sd.vl.every(o=>vCells(o.v).some(c=>nbrs(c).some(n=>seen.has(n.x+','+n.y))))};
  const put=(len,add,del)=>{for(let g=0;g<60;g++){const x=rnd(N)-1,y=1+rnd(N-2),d=pick([0,1,5]);const ks=[];let p={x,y};
      for(let i=0;i<len;i++){if(!ok(p.x,p.y))break;ks.push(p.x+','+p.y);p=step(p,d)}
      if(ks.length<len||new Set(ks).size<len)continue;ks.forEach(add);if(open())return;ks.forEach(del)}};
  (L.wall||[]).forEach(n=>put(n,k=>sd.walls.push({k,ttl:1,perm:1}),k=>{sd.walls=sd.walls.filter(w=>w.k!==k)}));
  (L.pit||[]).forEach(n=>put(n,k=>sd.pits.push(k),k=>{sd.pits=sd.pits.filter(e=>e!==k)}));
  for(let i=0;i<(L.rub||0);i++)put(1,k=>sd.obs.push(k),k=>{sd.obs=sd.obs.filter(e=>e!==k)});
  for(let i=0;i<(L.haz||0);i++)put(1,k=>sd.haz.push({k,ttl:1,dmg:2,perm:1,n:L.hn}),k=>{sd.haz=sd.haz.filter(h=>h.k!==k)})}
/* Version 78 (Tyler): half the lairs have an evidence terminal on the villain's back edge (row 0). A hero on it or beside it can hack it
   with their action for TERM_INTEL intel. Area damage (charged attacks, bombs, shockwaves) on its hex destroys it. */
const TERM_INTEL=2;
const termP=()=>{const[x,y]=S.sd.term.k.split(',').map(Number);return {x,y}};
/* Version 92 (Tyler): the terminal appears in every fight without a special henchman, instead of half of all fights */
function placeTerm(){const sd=S.sd;sd.term=null;if(sd.vl.some(o=>eliteOf(o.key)&&o.v.level>=3))return;
  const ks=[];for(let x=0;x<N;x++){const k=x+',0';if(sd.obs.includes(k)||sd.walls.some(w=>w.k===k)||sd.pits.includes(k)||sd.haz.some(h=>h.k===k)||(sd.exits||[]).includes(k)||sd.vl.some(o=>inV(o.v,x,0)))continue;ks.push(k)}
  if(ks.length)sd.term={k:pick(ks)}}
function termHit(inZ,src){const sd=S.sd;if(!sd.term||!inZ(termP()))return;const p=termP();sd.term=null;fxP(p.x,p.y,'CRUNCH!','vhit');log('vill',`${src} wrecks the evidence terminal.`)}
const canHack=u=>!!(S.sd.term&&!u.acted&&!u.ko&&cheb(u,termP())<=1);
function hack(){const sd=S.sd,u=sd.units[sd.sel];if(!u||!canHack(u))return;const h=heroOf(u);
  return act(async()=>{u.acted=true;const p=termP();A.lunge('h'+u.hid,HC(p.x,p.y));await A.sparkle(HC(p.x,p.y),COL.cyan);sd.term=null;sd.termGot=(sd.termGot||0)+TERM_INTEL;S.intel+=TERM_INTEL;
    fxP(p.x,p.y,'DOWNLOADED!','good');log('hero',`${h.name} hacks the evidence terminal. +${TERM_INTEL} intel.`)})}
function startShowdown(opt={}){
  const fin=!!opt.finale;N=fin?11:9;
  const keys=fin?opt.keys:[S.inv.v],q=fin?(opt.quality||'normal'):invQuality(S.inv.clues);
  const sd=S.sd={N,finale:fin,vkey:keys[0],quality:q,round:q==='ambush'?0:1,obs:[],units:[],hench:[],civs:[],vl:[],vi:0,
    tdk:{},walls:[],pits:[],haz:[],bombs:[],beams:[],sel:null,mode:null,busy:false,log:[],evac:0,harmed:0,woundsBy:{},result:null,fx:[],intro:!FAST};
  sd.hexv=1;const spots=fin?[[2,1],[7,1]]:[[4,1]];
  keys.forEach((k,i)=>{const vs=vState(k);if(fin&&vs.encounterIssue!==S.issue)selectEncounterDeck(vs);const sh=VILLAINS[k].shape,big=sh==='big',ser=sh==='serpent';sd.vl.push({key:k,v:{x:spots[i][0]+(big?1:0),y:spots[i][1]+(big||ser?1:0)+(k==='grid'?2:0),shape:sh,face:5,level:vs.level,deck:shuffle(vs.deck.map(e=>buildCard(k,e,vs.level))),discard:[],wounds:[],last:null}});
    if(ser){const v=sd.vl[sd.vl.length-1].v;v.body=[0,1,2,3].map(j=>({x:Math.min(N-1,spots[i][0]+j),y:spots[i][1]}));v.ate=0;v.grow=0}
    if(sh==='swarm'){const v=sd.vl[sd.vl.length-1].v;const sx=spots[i][0],taken=(x,y)=>sd.vl.slice(0,-1).some(o=>inV(o.v,x,y));v.sw=[[-2,1],[2,1],[-1,2],[1,2],[-3,2],[3,2]].map(([dx,y])=>({x:sx+dx,y:y+spots[i][1],f:5})).filter(p=>inB(p.x,p.y)&&!taken(p.x,p.y)).slice(0,2);v.pk=['hive','sting','shell'].slice(0,v.sw.length+1)}
    if(k==='noct')sd.vl[sd.vl.length-1].v.hide=q!=='prepared'});
  focusV(0);
  sd.exits=mkExits(N,fin);layTerrain(fin?randLair():LAIR[keys[0]]||LAIR.gallows);placeTerm();
  const hs=party();
  if(q==='ambush'&&!S.facilities.includes('hangar')){hs.forEach(h=>{const t=pick(freeTiles((x,y)=>y>=3&&y<=N-2));sd.units.push(mkUnit(h,t.x,t.y))})}
  else{const cols=fin?[2,4,6,8]:[1,3,5,7];hs.forEach((h,i)=>{let x=cols[i%cols.length],y=N-1;if(blocked(x,y)){const t=pick(freeTiles((a,b)=>b>=N-2));x=t.x;y=t.y}sd.units.push(mkUnit(h,x,y))})}
  hs.forEach(h=>{h.comp=stat(h,'maxComp');h.cd=0});
  lastPos={};
  sd.vl.forEach((o,vi)=>{const n=Math.min(4,fin?Math.ceil(o.v.level/2):o.v.level)+(q==='ambush'?1:0);
    for(let i=0;i<n;i++){const t=pick(freeTiles((x,y)=>y>=1&&y<=4&&Math.abs(x-(o.v.x+.5))<=3))||pick(freeTiles((x,y)=>y<=5));if(t)sd.hench.push({id:'h'+vi+'_'+i,owner:o.key,x:t.x,y:t.y,hp:regularHenchHp(o.key)})}
    if(eliteOf(o.key)&&o.v.level>=3){const t=freeTiles((x,y)=>dV({x,y},o.v)===1)[0]||pick(freeTiles((x,y)=>y<=4));if(t){sd.hench.push(mkElite(o,t));sd.elites=(sd.elites||[]).concat(o.key)}}});
  if(S.facilities.includes('dojo'))sd.units.forEach(u=>u.evaNext=6);
  /* about a third of civilians start deep in the lair, behind or beside the villain */
  const nc=opt.civs||3;for(let i=0;i<nc;i++){const dry=(x,y)=>!sd.haz.some(h=>h.k===x+','+y),t=(Math.random()<.35&&pick(freeTiles((x,y)=>y<=1&&dry(x,y))))||pick(freeTiles((x,y)=>y>=2&&y<=N-3&&dry(x,y)));if(t)sd.civs.push({id:i,x:t.x,y:t.y})}
  if(!fin&&S.inv.boardPrep)applyBoardPrep(S.inv.boardPrep);
  if(q==='prepared')sd.vl.forEach(o=>o.v.wounds.push(o.v.deck.shift()));
  /* Easy difficulty: each villain starts with 1 page torn per level (at least 2 pages stay) */
  if(diffOf().torn)sd.vl.forEach(o=>{const n=Math.min(o.v.level*diffOf().torn,o.v.deck.length-2);for(let i=0;i<n;i++)o.v.wounds.push(o.v.deck.shift());
    if(n>0)log('sys',`Easy: ${VILLAINS[o.key].name} starts with ${n} page${n===1?'':'s'} torn out.`)});
  sd.vl.forEach(o=>{if(o.v.sw)swSync(o.v)});
  sd.vl.forEach((o,i)=>{focusV(i);const t=live().slice().sort((a,b)=>dV(a,o.v)-dV(b,o.v))[0];if(t)faceTo(t)});focusV(0);
  sd.planVersion=1;S.phase='sd';S.view='mission';vWarn();
  log('sys',fin?`Event comic: ${keys.map(k=>VILLAINS[k].name).join(' and ')} strike together!`:`Issue #${S.issue}: the lair of ${VILLAINS[keys[0]].name}. ${QUAL[q].n}.`);
  if(q==='ambush'){log('sys','Ambush! The villain moves first.');if(!sd.intro){render();setTimeout(villainPhase,500)}}
  else log('sys',fin?'Round 1. Tap a villain to target it, and a hero to act.':'Round 1. Tap a hero to act.');

  fightSnap();
}
/* Restart Fight (game menu): the whole campaign as it stood when this fight was set up, kept beside the autosave */
function fightSnap(){if(FAST)return;S.sd.fid=Date.now();try{localStorage.setItem(KEY+'-fight-start',JSON.stringify(S))}catch(e){}}
