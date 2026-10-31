/* battle/villain-cards.js: Villain card execution (execCard0): hits, targeting, moves. */
/* the page being played, so vHit can apply its upgrade riders (accUp, daze, knock); null outside execCard */
let CUR_CARD=null;
function dazeU(u,why){if(u.ko||u.dazed)return;u.dazed=true;fxU(u,'DAZED!','vhit');log('vill',`${why?why+': ':''}${heroOf(u).name} can't move next round.`)}
async function knockU(u,n){const sd=S.sd,v=sd.v,h=heroOf(u);if(u.anchor){fxU(u,'ANCHORED!','good');log('hero',`${h.name} is anchored and holds firm.`);return}
  let k=0;for(let i=0;i<n;i++){const t=freeTiles((x,y)=>cheb({x,y},u)===1).sort((a,b)=>dV(b,v)-dV(a,v))[0];if(!t||dV(t,v)<=dV(u,v))break;u.x=t.x;u.y=t.y;k++}
  if(k){log('vill',`${h.name} is knocked back ${k} hex${k>1?'es':''}.`);render();await sleep(FAST?0:200)}}
async function upRiders(u,up){if(up.daze)dazeU(u,up.n);if(up.knock)await knockU(u,up.knock)}
async function vHit(u,dmg,label,style){const h=heroOf(u);if(S.sd.v.cursed&&dmg>0)dmg=Math.max(1,dmg-2);faceTo(u);render();await strikeAnim(style,ctrV(),ctrU(u),COL.mag,'v'+S.sd.vi);
  let r=d20();/* Version 115 (Tyler): Lucky Coin no longer affects villain attacks */const up=CUR_CARD||{},acc=vStat('acc')+(up.accUp||0),eva=stat(h,'eva')+(u.buffEva||0)+(u.evaNext||0)+avoidEva(u);if(u.evaNext){log('hero',`Wind Ward: +${u.evaNext} evasion for ${h.name}.`);u.evaNext=0};const hit=r===20||(r!==1&&r+acc>=eva);
  log('vill',`${label} at ${h.name}: rolled ${r}+${acc} vs evasion ${eva}. ${hit?`Hit for ${dmg}.`:'Miss.'}`);
  if(hit&&await wardBlocks(u))return false;
  if(hit&&u.reflect&&!S.sd.v.down){u.reflect=0;log('hero',`${h.name} turns the blow back: ${VILLAINS[S.sd.vkey].short} tears a page.`);await woundAnim(`${h.name}: reflected.`)}
  fxU(u,hit?pick(SFX_VHIT):'SWISH!',hit?'vhit':'miss');if(hit)damageHero(u,dmg);if(hit&&!u.ko)await upRiders(u,up);render();if(!hit){if(style!=='none')await avoidRedirect(u,S.sd.v,dmg,label);await riposte(u)}return hit}
/* Version 117 (Tyler): a conditional target (weakest, farthest) is picked only among heroes the villain can reach this turn
   (within move + range, by hex distance). If nobody is in reach it goes for the nearest hero. */
function pickTarget(mode,reach){const sd=S.sd;let L=live();if(!L.length)return null;
  if(reach!=null&&mode!=='nearest'){const inR=L.filter(u=>dV(u,sd.v)<=reach);if(inR.length)L=inR;else mode='nearest'}
  if(mode==='weakest')return L.slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];
  if(mode==='lowcomp')return L.slice().sort((a,b)=>heroOf(a).comp-heroOf(b).comp||heroOf(a).hp-heroOf(b).hp)[0];
  const byD=L.slice().sort((a,b)=>dV(a,sd.v)-dV(b,sd.v));return mode==='farthest'?byD[byD.length-1]:byD[0]}
function dmgScale(d){const n=d+Math.floor(S.sd.v.level/2),dd=diffOf().dmg;return dd&&n>0?Math.max(1,n+dd):n} /* Version 83 (Tyler): +1 damage at every even level */
function vStyle(c){if(c.fx)return c.fx;return (c.rng||0)>1||c.t==='endanger'?VILLAINS[S.sd.vkey].rstyle:'slash'}
async function vMove(fn,crush=0,label=''){const sd=S.sd,v=sd.v,ox=v.x,oy=v.y,osw=JSON.stringify(v.sw||0);const sh=fn()||[];const path=v.path;delete v.path;
  if(path&&path.length){const fin={x:v.x,y:v.y,body:v.body};for(const p of path){v.x=p.x;v.y=p.y;v.body=p.body;noFlip.add('v'+sd.vi);render();await sleep(FAST?0:RM?60:150)}v.x=fin.x;v.y=fin.y;v.body=fin.body}
  else if(v.x!==ox||v.y!==oy||JSON.stringify(v.sw||0)!==osw){render();await sleep(Math.min(520,180+90*Math.hypot(v.x-ox,v.y-oy)))}
  for(const o of sh){if(sd.units.includes(o)){if(o.ko)continue;if(crush){fxU(o,'CRUNCH!','vhit');damageHero(o,crush);log('vill',`${label||'The charge'} shoves ${heroOf(o).name} aside for ${crush} damage.`)}else{fxU(o,'SHOVED!','miss');log('vill',`${heroOf(o).name} is shoved aside.`)}}
    else if(sd.civs.includes(o)){if(crush)harmCiv(o,label||'the stampede');else fxP(o.x,o.y,'EEK!','miss')}}
  if(v.smashed&&v.smashed.length){const ks=v.smashed;delete v.smashed;await Promise.all(ks.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),3)}));fxV('KRASH!','vhit');log('vill',`${VILLAINS[sd.vkey].name} smashes straight through ${ks.length>1?ks.length+' hexes of walls and rubble':'a wall'}.`);render()}
  if(sh.length)render()}
async function execCard(c){const was=CUR_CARD;CUR_CARD=c;try{await execCard0(c)}finally{CUR_CARD=was}}
async function execCard0(c){const sd=S.sd,v=sd.v,vn=VILLAINS[sd.vkey].name;
  if(await specialBossCard(c))return;
  switch(c.t){
    case 'strike':{let t=pickTarget(c.tgt,(VILLAINS[sd.vkey].rooted?0:c.mv||0)+(c.rng||1));if(!t)break;await vMove(()=>vToward(t,c.mv,c.rng),c.crush||0,c.n);
      if(dV(t,v)>c.rng){log('vill',`${vn} can't reach ${heroOf(t).name}.`);fxV('GRR!','say');break}
      if(shotVB(t,v)){log('vill',`A girder is in the way: ${vn}'s ${c.n} can't reach ${heroOf(t).name}.`);fxV('GRR!','say');break}
      let dmg=dmgScale(c.dmg);const g=live().find(o=>o.guard&&o!==t&&cheb(o,t)<=1);
      if(g){log('hero',`${heroOf(g).name} braces and takes the blow.`);A.lunge('h'+g.hid,ctrU(t));await A.shield(ctrU(g),COL.yel,true);t=g;if(dmg>0)dmg=Math.max(1,dmg-1)}
      {const hit=await vHit(t,dmg,c.n,vStyle(c));if(hit&&c.comp&&!t.ko){const th=heroOf(t);th.comp=Math.max(0,th.comp-c.comp);fxU(t,'RATTLED!','vhit');log('vill',`${th.name} loses ${c.comp} composure.`);render()}
        if(hit&&c.dupeLow&&!t.ko&&!sd.mimic){const th=heroOf(t);if(th.comp*2<=stat(th,'maxComp')){const p=freeTiles((x,y)=>cheb({x,y},t)===1).sort((a,b)=>cheb(a,v)-cheb(b,v))[0];if(p)leaveDupe(v,p)}}}
      if(c.col)sd.civs.filter(cv=>cheb(cv,t)<=1).forEach(cv=>harmCiv(cv,'flying wreckage'));break}
    case 'sweep':await sweep(c.r,dmgScale(c.dmg),c.n);break;
    /* Version 133: Mole Boy digs under the floor and bursts up beside the farthest hero, leaving rubble where he went down */
    case 'burrow':{const t=pickTarget('farthest');if(!t)break;const from={x:v.x,y:v.y},sp=nbrs(t).filter(p=>inB(p.x,p.y)&&!(p.x===v.x&&p.y===v.y)&&vFits(p.x,p.y,true)).sort((a,b)=>cheb(a,from)-cheb(b,from))[0];
      if(!sp){log('vill',`${vn} can't find soft ground near ${heroOf(t).name}.`);fxV('GRR!','say');break}
      await A.smoke(ctrV(),3);vPut(v,sp.x,sp.y);noFlip.add('v'+sd.vi);const k0=from.x+','+from.y;if(!sd.obs.includes(k0))sd.obs.push(k0);render();await A.smoke(ctrV(),3);fxV('SHUNK!','say');
      log('vill',`${vn} dives underground and bursts up next to ${heroOf(t).name}, leaving rubble where he went down.`);await vHit(t,dmgScale(c.dmg),c.n,'slash');break}
    case 'rampage':{const t=pickTarget('nearest');if(t)await vMove(()=>vToward(t,c.mv,1),c.crush||0,c.n);await sweep(1,dmgScale(c.dmg),c.n);break}
    case 'summon':{const added=[];for(let i=0;i<c.k;i++){const t=freeTiles().sort((a,b)=>dV(a,v)-dV(b,v))[0];if(t){const m={id:'s'+Date.now()+i,owner:sd.vkey,x:t.x,y:t.y,hp:regularHenchHp(sd.vkey)};sd.hench.push(m);added.push(m)}}
      fxV('GET THEM!','say');render();await Promise.all(added.map(m=>A.smoke(ctrU(m))));log('vill',`${added.length} ${VILLAINS[sd.vkey].hench.name.toLowerCase()}s arrive.`);
      if(c.rush&&added.length){log('vill','They attack as soon as they arrive.');const was=CUR_CARD;CUR_CARD=null;try{for(const m of added){if(sd.result)break;if(sd.hench.includes(m))await henchAct(m)}}finally{CUR_CARD=was}}break}
    case 'endanger':{const cv=sd.civs.slice().sort((a,b)=>dV(a,v)-dV(b,v))[0];if(cv)faceTo(cv);
      const undermine=u=>{const h=heroOf(u);h.comp=Math.max(0,h.comp-c.comp);fxU(u,'RATTLED!','vhit');
        log('vill',`${c.n}: ${h.name} loses ${c.comp} Composure.`);render()};
      if(!cv){const t=pickTarget('nearest');if(t){await vMove(()=>vToward(t,c.emv||2,1));
        if(dV(t,v)<=1){if(c.comp)undermine(t);else await vHit(t,dmgScale(2),c.n,'slash')}}break}
      await vMove(()=>vToward(cv,c.emv||2,1));const prot=live().find(u=>cheb(u,cv)<=1);
      if(prot){A.lunge('h'+prot.hid,ctrU(cv));await strikeAnim(vStyle(c),ctrV(),ctrU(prot),COL.mag,'v'+S.sd.vi);
        if(c.comp){log('hero',`${heroOf(prot).name} shields a civilian but is rattled by ${vn}'s leverage.`);undermine(prot)}
        else{log('hero',`${heroOf(prot).name} shields a civilian and takes ${dmgScale(c.dmg||2)}.`);
          if(!await wardBlocks(prot)){await A.shield(ctrU(prot),COL.yel);fxU(prot,'OOF!','vhit');damageHero(prot,dmgScale(c.dmg||2));if(c.daze)dazeU(prot,c.n)}}}
      else if(dV(cv,v)<=(c.ereach||3)){await strikeAnim(vStyle(c),ctrV(),ctrU(cv),COL.mag,'v'+S.sd.vi);harmCiv(cv,c.n)}
      else{log('vill',`${c.n} falls short. The civilian runs.`);fxP(cv.x,cv.y,'EEK!','miss')}break}
    case 'henchvolley':{
      let fired=0;
      for(const hm of [...sd.hench]){
        if(sd.result)break;
        if(hm.owner!=='cantor'||hm.elite||!sd.hench.includes(hm))continue;
        if(await henchShoot(hm,VILLAINS.cantor.hench,live()))fired++;
      }
      log('vill',`${vn} orders every hired gun to fire! ${fired} shot${fired===1?'':'s'} fired.`);
      break}
    case 'taunt':{await A.ring(ctrV(),COL.yel,c.r*2+2,{dashed:true,fill:false,count:3});
      const hit=live().filter(u=>dV(u,v)<=c.r);const lm=litMap(),ex=u=>(c.bombx&&(sd.bombs||[]).some(b=>cheb(bombP(b),u)<=1)?1:0)+(c.litx&&lm[u.x+','+u.y]?1:0);hit.forEach(u=>{const h=heroOf(u);h.comp=Math.max(0,h.comp-c.amt-ex(u));fxU(u,'GRR!','miss')});
      log('vill',hit.length?`${c.n}: ${hit.map(u=>heroOf(u).name).join(', ')} lose ${c.amt} composure.`:`${c.n}: nobody is close enough to hear.`);shakenSting(c,hit);
      if(c.shakeDaze)hit.filter(u=>!u.ko&&heroOf(u).comp<=0&&!rankMod(heroOf(u),'innate','unshake')).forEach(u=>dazeU(u,c.n));break}
    case 'vanish':{let best=null,bs=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!vFits(x,y,true))continue;const s=Math.min(...live().map(u=>dV(u,{x,y})))+Math.random();if(s>bs){bs=s;best=[x,y]}}
      await A.smoke(ctrV(),9);if(best){v.x=best[0];v.y=best[1]}noFlip.add('v'+sd.vi);render();await A.smoke(ctrV(),9);fxV('POOF!','miss');{const t=pickTarget('nearest');if(t)faceTo(t)}log('vill',`${vn} vanishes and reappears across the room.`);break}
    case 'multi':{const ts=live().filter(u=>dV(u,v)<=c.rng).sort((a,b)=>dV(a,v)-dV(b,v)).slice(0,c.cnt);
      if(!ts.length){log('vill',`${c.n} has no one in range.`);fxV('GRR!','say');break}
      for(const t of ts)await vHit(t,dmgScale(c.dmg),c.n,vStyle(c));break}
    case 'walls':{if(c.retreat){const n=live().slice().sort((a,b)=>dV(a,v)-dV(b,v))[0];if(n){const was=JSON.stringify(vCells(v));await vMove(()=>vAway(n,c.retreat),0,c.n);if(JSON.stringify(vCells(v))!==was)log('vill',`${vn} backs away into the maze.`)}} /* Version 94 (Tyler): Labyrinth retreats before the walls go up */
      const L=live().slice().sort((a,b)=>dV(a,v)-dV(b,v));const made=[];
      for(let i=0;i<(c.lines||1)&&i<L.length;i++){const t=L[i],d=dirC(HC(t.x,t.y),vCtr(v)),mid=ax(step(t,d)),pd=AXD[(d+2)%6],half=Math.floor(c.len/2);
        for(let j=0;j<c.len;j++){const{x,y}=off(mid.q+pd[0]*(j-half),mid.r+pd[1]*(j-half)),k=x+','+y;
          if(inB(x,y)&&!blocked(x,y)&&!made.includes(k))made.push(k)}}
      await Promise.all(made.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),3)}));
      made.forEach(k=>sd.walls.push({k,ttl:c.ttl}));fxV('BUILD!','say');log('vill',`${c.n}: ${made.length} wall hexes rise from the floor.`);break}
    case 'hazard':{const ts=live().slice().sort((a,b)=>dV(a,v)-dV(b,v)).slice(0,c.cnt||1),ks=new Set();
      ts.forEach(t=>hexesWithin(t,c.r).forEach(({x,y})=>{const k=x+','+y;if(sd.obs.includes(k)||inV(v,x,y))return;ks.add(k)}));
      await Promise.all(ts.map(t=>A.ring(ctrU(t),COL.innate,c.r*2+1.4,{count:2})));
      const dm=dmgScale(c.dmg);ks.forEach(k=>{const e=sd.haz.find(h=>h.k===k);if(e){e.ttl=Math.max(e.ttl,c.ttl);e.dmg=Math.max(e.dmg,dm)}else sd.haz.push({k,ttl:c.ttl,dmg:dm})});
      ts.forEach(t=>fxU(t,'HOT!','vhit'));log('vill',`${c.n}: ${ks.size} hexes turn molten. Get off them before the villain acts again.`);break}
    case 'cage':{const t=pickTarget('nearest');if(!t)break;const made=[];for(const{x,y}of nbrs(t)){if(!blocked(x,y))made.push(x+','+y)}
      await Promise.all(made.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),2)}));made.forEach(k=>sd.walls.push({k,ttl:c.ttl}));
      fxU(t,'CAGED!','vhit');log('vill',`${c.n} boxes in ${heroOf(t).name}.`);break}
    case 'shrapnel':{const tiles=[...sd.walls.map(w=>w.k),...sd.obs].map(k=>{const[x,y]=k.split(',').map(Number);return {k,x,y}}).filter(p=>dV(p,v)<=c.r);
      if(!tiles.length){log('vill',`${c.n}: nothing nearby to blow up.`);fxV('TCH!','say');break}
      await Promise.all(tiles.map(p=>A.ring(HC(p.x,p.y),COL.innate,1.8)));
      const hit=live().filter(u=>tiles.some(p=>cheb(p,u)<=1));sd.walls=sd.walls.filter(w=>!tiles.some(p=>p.k===w.k));render();
      log('vill',`${c.n}: ${tiles.length} piles explode.`);for(const u of hit)await vHit(u,dmgScale(c.dmg),c.n,'none');break}
    case 'fortify':{const made=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(dV({x,y},v)!==1||blocked(x,y))continue;made.push(x+','+y)}
      await Promise.all(made.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),2)}));made.forEach(k=>sd.walls.push({k,ttl:c.ttl}));
      if(v.wounds.length){v.deck.push(v.wounds.pop());shuffle(v.deck)}fxV('FORTIFIED!','vhit');log('vill',`${vn} walls itself in and recovers a page.`);break}
    case 'beam':{const L=live();if(!L.length)break;const near=pickTarget('nearest');let lines=[];
      if(c.pat==='star'){faceTo(near);lines=[0,1,2,3,4,5].map(d=>({from:emitCell(v,d),d}))}
      else if(c.pat==='fan'){faceTo(near);const f=v.face;lines=[f,(f+1)%6,(f+5)%6].map(d=>({from:emitCell(v,d),d}))}
      else if(c.pat==='aim'){const ts=L.slice().sort((a,b)=>dV(a,v)-dV(b,v));lines=(c.tgt==='farthest'?ts.reverse():ts).slice(0,c.cnt||1).map(t=>aimLine(v,t));v.face=lines[0].d}
      else if(c.pat==='prism'){const ps=sd.hench.filter(m=>m.owner===sd.vkey);
        if(!ps.length){log('vill',`${c.n}: no ${VILLAINS[sd.vkey].hench.name.toLowerCase()}s left, so ${vn} fires himself.`);lines=[aimLine(v,near)];v.face=lines[0].d}
        else lines=ps.map(m=>aimLine(m,L.slice().sort((a,b)=>cheb(a,m)-cheb(b,m))[0]))}
      else if(c.pat==='sweep'){faceTo(near);const hit=new Set(),f=v.face;
        for(let i=0;i<(c.cnt||4)&&!sd.result;i++){const d=(f+i)%6;v.face=d;render();await sleep(FAST?0:160);await fireBeams([{from:emitCell(v,d),d}],dmgScale(c.dmg),c.n,{hit,ttl:c.ttl,daze:c.daze})}break}
      fxV('WHIRR!','say');render();await sleep(FAST?0:220);await fireBeams(lines,dmgScale(c.dmg),c.n,{ttl:c.ttl,daze:c.daze});break}
    case 'charge':{if(sd.mimic&&!v.charge){log('vill',`Without Nocturne charging beside it, the double's ${c.n} fizzles.`);break}
      if(sd.mimic&&v.charge){const t=pickTarget('nearest');if(!t)break;const add=hexesWithin(t,v.charge.tr??1).filter(p=>inB(p.x,p.y)&&!inV(v,p.x,p.y)).map(p=>p.x+','+p.y);
        v.charge.zone=[...new Set([...v.charge.zone,...add])];if(v.charge.track&&!v.charge.track.includes(t.hid))v.charge.track.push(t.hid);log('vill',`The double marks ${heroOf(t).name} for ${c.n} too.`);render();break}
      const z=chargeZone(c.zone,c);sd.v.charge={n:c.n,dmg:dmgScale(c.dmg),zone:z,w0:v.wounds.length,need:chargeNeed(v),...(c.daze?{daze:1}:{}),...(c.zone==='hero'?{tr:0}:c.zr?{tr:1+c.zr}:{})};
      if(c.follow)sd.v.charge.track=live().slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp).slice(0,c.zone==='hero'?1+(c.zr||0):2).map(u=>u.hid);render();
      await A.ring(ctrV(),COL.yel,4,{inward:true,count:3});fxV('CHARGING…','say');log('vill',`${vn} begins charging ${c.n}! ${z.length} hexes are marked. Tear ${chargeNeed(v)} pages or get clear before it fires.`);break}
    case 'reanimate':{await A.ring(ctrV(),COL.mag,3,{inward:true,count:2});let n=0;for(let i=0;i<(c.heal||1)&&v.wounds.length;i++){v.deck.push(v.wounds.pop());n++}if(n){shuffle(v.deck);fxV('ZZZAP!','vhit');log('vill',`${vn} recovers ${n} torn page${n>1?'s':''}.`)}else log('vill',`${vn} has nothing to recover.`);if(c.dupe&&!sd.mimic){const s=doubleSpot(v,5);if(s)leaveDupe(v,s.p)}break}
    case 'swallow':{const hn=VILLAINS[sd.vkey].hench.name.toLowerCase(),byC=(a,b)=>cheb(a,v)-cheb(b,v);let ate=0;
      /* Tyler (2026-10-30): prey in reach in this order: civilians, heroes, then the weakest regular henchmen. Nothing in reach: chase a civilian, else the nearest hero. */
      const prey=n=>{const R=(n?2:c.mv)+1,cv=sd.civs.filter(o=>cheb(o,v)<=R).sort(byC)[0];if(cv)return {o:cv,k:'c'};
        const hs=live().filter(u=>dV(u,v)<=R).sort((a,b)=>dV(a,v)-dV(b,v))[0];if(hs)return {o:hs,k:'h'};
        const m=sd.hench.filter(m=>(m.owner||sd.vkey)===sd.vkey&&!m.elite&&!m.shadow&&cheb(m,v)<=R).sort((a,b)=>a.hp-b.hp||byC(a,b))[0];if(m)return {o:m,k:'m'};
        const far=sd.civs.slice().sort(byC)[0];if(far)return {o:far,k:'c'};const t=pickTarget('nearest');return t?{o:t,k:'h'}:null};
      for(let n=0;n<(c.cnt||1)&&!sd.result;n++){const F=prey(n);if(!F)break;faceTo(F.o);await vMove(()=>vToward(F.o,n?2:c.mv,1),0,c.n);
        if(F.k==='h'){if(dV(F.o,v)<=1)await vHit(F.o,dmgScale(c.dmg),c.n,'slash');else{log('vill',`${vn} lunges at ${heroOf(F.o).name} but can't reach.`);fxV('HSSS!','say');break}continue}
        const what=F.k==='c'?'a civilian':`a ${hn}`;
        if(cheb(F.o,v)>1){log('vill',`${vn} slithers after ${what} but can't reach.`);fxP(F.o.x,F.o.y,'EEK!','miss');break}
        faceTo(F.o);const prot=F.k==='c'&&live().find(u=>cheb(u,F.o)<=1);
        if(prot){A.lunge('v'+sd.vi,ctrU(prot));log('hero',`${heroOf(prot).name} shoves the civilian clear and takes the bite for ${dmgScale(c.dmg)}.`);
          if(!await wardBlocks(prot)){await A.shield(ctrU(prot),COL.yel);fxU(prot,'CHOMP!','vhit');damageHero(prot,dmgScale(c.dmg))}render();break}
        A.lunge('v'+sd.vi,ctrU(F.o));await A.ring(ctrU(F.o),COL.mag,1.6,{inward:true,count:2});fxP(F.o.x,F.o.y,'GULP!','vhit');
        if(F.k==='c'){sd.civs=sd.civs.filter(o=>o!==F.o);sd.harmed++}else sd.hench=sd.hench.filter(o=>o!==F.o);
        ate++;v.ate=(v.ate||0)+1;const grew=serpGrow(v);render();
        log('vill',`${vn} swallows ${what} whole! ${grew?`It grows to ${vCells(v).length+(v.grow||0)} hexes long.`:'It is too long to grow any more, so it recovers a torn page instead.'}`)}
      break}
    case 'pull':{const t0=pickTarget('nearest');if(t0)faceTo(t0);await A.ring(ctrV(),COL.cyan,c.r*2+2,{inward:true,count:3});const ts=live().filter(u=>!u.anchor&&dV(u,v)<=c.r).sort((a,b)=>dV(a,v)-dV(b,v));let moved=0;
      for(const u of ts){let n=0;for(let i=0;i<c.mv;i++){const fr=p=>sideOf(p,v)==='front'?0:1,t=freeTiles((x,y)=>cheb({x,y},u)===1).sort((a,b)=>dV(a,v)-dV(b,v)||fr(a)-fr(b))[0];if(!t||dV(t,v)>=dV(u,v))break;u.x=t.x;u.y=t.y;n++}if(n){moved++;fxU(u,'CLANK!','vhit')}}
      render();await sleep(FAST?0:320);log('vill',`${c.n}: ${moved?`${moved} hero${moved>1?'es are':' is'} dragged toward ${vn}.`:'nobody is close enough to feel it.'}`);
      await sweep(1,dmgScale(c.dmg),c.n);break}
    case 'repel':{await A.ring(ctrV(),COL.cyan,c.r*2+2,{count:3});const ts=live().filter(u=>!u.anchor&&dV(u,v)<=c.r).sort((a,b)=>dV(b,v)-dV(a,v)),dm=dmgScale(c.dmg);
      if(!ts.length)log('vill',`${c.n}: nobody is close enough to throw.`);
      for(const u of ts){let n=0,slam=false;for(let i=0;i<c.mv;i++){const t=freeTiles((x,y)=>cheb({x,y},u)===1).sort((a,b)=>dV(b,v)-dV(a,v))[0];if(!t||dV(t,v)<=dV(u,v)){slam=true;break}u.x=t.x;u.y=t.y;n++}
        render();await sleep(FAST?0:180);const hn=heroOf(u).name;
        if(slam){if(await wardBlocks(u))continue;fxU(u,'SLAM!','vhit');damageHero(u,dm);log('vill',`${hn} is flung ${n} hex${n===1?'':'es'} and slams into something for ${dm}.`);if(c.daze)dazeU(u)}
        else{fxU(u,'WHOOSH!','miss');log('vill',`${hn} is flung ${n} hexes away.`)}}
      render();break}
    case 'fade':{const L=live(),from={x:v.x,y:v.y};let best=null,bs=-1e9;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!vFits(x,y,true))continue;const d=L.length?Math.min(...L.map(u=>cheb(u,{x,y}))):3,s=-Math.abs(d-3)+Math.random()*.9;if(s>bs){bs=s;best=[x,y]}}
      await A.smoke(ctrV(),9);if(best){v.x=best[0];v.y=best[1]}v.face=rnd(6)-1;v.hide=true;if(c.evaUp&&!sd.mimic){v.fadeEva=c.evaUp;log('vill',`${vn} is hard to pin down: +${c.evaUp} evasion until her next action.`)}noFlip.add('v'+sd.vi);render();await A.smoke(ctrV(),6);
      if(c.amt){L.forEach(u=>{const h=heroOf(u);h.comp=Math.max(0,h.comp-c.amt);fxU(u,'?!','vhit')});log('vill',`The lights die. Every hero loses ${c.amt} composure.`);shakenSting(c,L)}
      fxV('…','miss');log('vill',`${vn} fades into the dark and reappears somewhere else. Her facing is hidden.`);jumpDupe(v,from);if(c.twin&&!sd.mimic){const s2=doubleSpot(v,5);if(s2)leaveDupe(v,s2.p)}render();break}
    case 'converge':{const t=pickTarget('nearest');if(!t)break;if(!v.sw){await vMove(()=>vToward(t,c.mv,1));if(dV(t,v)<=1)await vHit(t,dmgScale(c.dmg),c.n,'slash');break}
      const os=JSON.stringify([v.x,v.y,v.sw]);swBodies(v).forEach(b=>swStep(v,b.i,t,c.mv,1,-1));faceTo(t);if(JSON.stringify([v.x,v.y,v.sw])!==os){render();await sleep(FAST?0:420)}
      const adj=swBodies(v).filter(b=>cheb(b,t)===1).length;
      if(!adj){log('vill',`${vn} swarms toward ${heroOf(t).name} but can't close in.`);fxV('BZZ!','say');break}
      await vHit(t,dmgScale(c.dmg)*adj,`${c.n} (${adj} bod${adj>1?'ies':'y'})`,'slash');break}
    case 'scatter':{const L=live().slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp);if(!L.length)break;if(!v.sw){const t=L[0];await vMove(()=>vToward(t,3,1));if(dV(t,v)<=1)await vHit(t,dmgScale(c.dmg),c.n,'slash');break}
      await A.smoke(ctrV(),9);const pairs=[];
      swBodies(v).forEach((b,j)=>{const t=L[j%L.length],sp=freeTiles((x,y)=>cheb({x,y},t)===1).sort((a,c2)=>Math.min(...swBodies(v).filter(o=>o.i!==b.i).map(o=>cheb(c2,o)))-Math.min(...swBodies(v).filter(o=>o.i!==b.i).map(o=>cheb(a,o))))[0];
        if(sp){swSet(v,b.i,sp.x,sp.y,dirC(HC(sp.x,sp.y),HC(t.x,t.y)));noFlip.add(`v${sd.vi}s${b.i}`);pairs.push([b.i,t])}});
      noFlip.add('v'+sd.vi);render();fxV('BZZZT!','say');log('vill',`${vn} bursts into ${pairs.length} pieces that land beside the heroes.`);
      for(const [i,t] of pairs){if(sd.result||t.ko)continue;const b=swBodies(v)[i];if(!b||cheb(b,t)>1)continue;await vHit(t,dmgScale(c.dmg),`${c.n} (${SWN[b.k]})`,'slash')}break}
    case 'puppet':{const L=live();if(!L.length)break;for(const u of L.sort((a,b)=>heroOf(a).comp-heroOf(b).comp).slice(0,c.tgts||1)){const h=heroOf(u);
      await Promise.all([A.bolt(ctrV(),ctrU(u),COL.magic,true),A.bolt(ctrV(),ctrU(u),COL.magic,true)]);h.comp=Math.max(0,h.comp-(c.amt||1));u.dazed=true;fxU(u,'?!','vhit');
      log('vill',`${h.name}'s limbs stop obeying. They can't move next round.`);
      if(c.pull){if(u.anchor)log('hero',`${h.name} is anchored and isn't dragged.`);else{let n=0;for(let i=0;i<c.pull;i++){const t=freeTiles((x,y)=>cheb({x,y},u)===1).sort((a,b)=>dV(a,v)-dV(b,v))[0];if(!t||dV(t,v)>=dV(u,v))break;u.x=t.x;u.y=t.y;n++}
        if(n){fxU(u,'DRAGGED!','vhit');log('vill',`${h.name} walks ${n} hex${n>1?'es':''} toward ${vn} against their will.`);render();await sleep(FAST?0:320)}}}}
      break}
    case 'leap':{let n=0;const done=[];
      for(let i=0;i<(c.cnt||1)&&!sd.result;i++){const L=live().filter(u=>!done.includes(u)&&dV(u,v)<=c.mv).sort((a,b)=>dV(a,v)-dV(b,v));let t=null,sp=null;
        for(const u of L){const s=leapSpot(u);if(s){t=u;sp=s;break}}
        if(!t)break;done.push(t);const lit=c.fuse&&dropBomb(t.x,t.y,c.fuse,dmgScale(c.dmg),c.radius||1,c.daze);await vLeap(t,sp);n++;
        if(lit)fxU(t,'TSSS!','vhit');log('vill',`${vn} vaults over ${heroOf(t).name}${lit?' and leaves a lit bomb at their feet':''}.`);render()}
      if(!n){const t=pickTarget('nearest');if(!t)break;log('vill',`Nobody close enough has open ground behind them, so ${vn} bounds toward ${heroOf(t).name}.`);await vMove(()=>vToward(t,c.mv,1));
        if(c.fuse&&dV(t,v)<=3){await A.throw(ctrV(),ctrU(t),'bomb');if(dropBomb(t.x,t.y,c.fuse,dmgScale(c.dmg),c.radius||1,c.daze)){fxU(t,'TSSS!','vhit');log('vill',`She tosses the bomb at ${heroOf(t).name} instead.`)}}else fxV('TCH!','say')}
      render();break}
    case 'bomb':{const inR=()=>{const L=live().filter(u=>dV(u,v)<=c.rng).sort((a,b)=>dV(a,v)-dV(b,v));return c.tgt==='farthest'?L.reverse():L};let ts=inR();
      if(!ts.length){const t=pickTarget('nearest');if(t)await vMove(()=>vToward(t,2,c.rng));ts=inR()}
      ts=ts.slice(0,c.cnt||1);if(!ts.length){log('vill',`${c.n}: nobody in range to throw at.`);fxV('TCH!','say');break}
      faceTo(ts[0]);render();const got=[];
      for(const t of ts){await A.throw(ctrV(),ctrU(t),'bomb');if(dropBomb(t.x,t.y,c.fuse,dmgScale(c.dmg),c.radius||1,c.daze)){got.push(t);fxU(t,'TSSS!','vhit')}render()}
      log('vill',got.length?`${c.n}: ${got.length>1?`${got.length} lit bombs land`:'a lit bomb lands'} at ${got.map(t=>heroOf(t).name).join(' and ')}'s feet. 1 villain turn to get clear. Blast covers ${1+3*(c.radius||1)*((c.radius||1)+1)} hexes.`:`${c.n}: she is out of bombs, ${BOMB_MAX} are already lit.`);break}
    case 'swapbomb':{
       // Switch with an allied henchman and leave a normal seven-hex bomb.
       const allies=sd.hench.filter(m=>m.owner===sd.vkey&&
         !blocked(m.x,m.y,{self:m,ignoreV:true})).sort((a,b)=>dV(a,v)-dV(b,v));
       const chosen=allies[0],from={x:v.x,y:v.y};
       if(!chosen){log('vill',`${vn} has no henchman available to swap with.`);fxV('CLICK…','miss');break}
       if(sd.bombs.length>=BOMB_MAX&&!sd.bombs.some(b=>b.k===from.x+','+from.y)){
         log('vill',`${vn} has no spare bomb to leave behind.`);fxV('CLICK…','miss');break}
       const to={x:chosen.x,y:chosen.y};
       await A.smoke(ctrV(),4);vPut(v,to.x,to.y);chosen.x=from.x;chosen.y=from.y;
       noFlip.add('v'+sd.vi);
       dropBomb(from.x,from.y,1,dmgScale(c.dmg),c.radius||1,c.daze);
       render();await A.smoke(ctrV(),4);fxV('SWITCH!','say');
       log('vill',`${vn} swaps places with ${hName(chosen)} and leaves a ${(c.radius||1)>1?'19':'seven'}-hex bomb at her old position. It detonates next villain turn.`);
       break}
     case 'airburst':{const m=N>>1,sp=hexesWithin({x:m,y:m},2).sort((a,b)=>cheb(a,{x:m,y:m})-cheb(b,{x:m,y:m})).find(p=>(p.x===v.x&&p.y===v.y)||vFits(p.x,p.y,true));
      if(sp&&(sp.x!==v.x||sp.y!==v.y)){fxV('BOING!','say');vPut(v,sp.x,sp.y);render();await sleep(FAST?0:RM?60:360)}
      {const t=pickTarget('nearest');if(t)faceTo(t)}const z=chargeZone(c.zone,c);sd.v.charge={n:c.n,dmg:dmgScale(c.dmg),zone:z,w0:v.wounds.length,need:chargeNeed(v),...(c.daze?{daze:1}:{})};render();
      await A.ring(ctrV(),COL.yel,4,{inward:true,count:3});fxV('CHARGING…','say');log('vill',`${vn} lands in the middle of the room and starts the countdown on ${c.n}. ${z.length} hexes are marked. Tear ${chargeNeed(v)} pages or get clear before it fires.`);break}
  }}
