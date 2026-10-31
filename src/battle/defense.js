/* battle/defense.js: Hero damage, guard, avoid damage, cover, redirect, rally, wards. */
/* ---------- combat ---------- */

/* Combined Guard reduction per hit scales with total discipline level. */
const guardCap=h=>lvlOf(h)<=2?1:lvlOf(h)<=4?2:3;
function damageHero(u,n){const h=heroOf(u);if(S.sd.reactionContext&&u.reactionWard&&n>0){log('hero',`${h.name}\'s Reaction Ward prevents ${n} reaction damage.`);return}if(u.stasis&&n>0){fxU(u,'NO EFFECT','good');log('hero',`Time Stop: ${h.name} takes no damage.`);return}if(S.cheat&&S.cheat.god){log('sys',`${h.name} shrugs off ${n} damage (invincible).`);return}let guardSpent=0;const guard=(amt,label)=>{const cut=Math.min(Math.max(0,amt),Math.max(0,guardCap(h)-guardSpent),Math.max(0,n-1));if(cut){n-=cut;guardSpent+=cut;log('hero',label(cut))}};if(n>1&&setOn(h,'architect'))guard(1,()=>`Load-Bearing: ${h.name} takes 1 less.`);if(n>2&&auraOn(u,'brace'))guard(1,()=>`Shield Wall: ${h.name} takes 1 less.`);if(u.dr&&n>0)guard(u.dr,m=>`${h.name}'s guard soaks ${m} damage.`);if(u.absorb&&n>0){const m=Math.min(u.absorb,n);u.absorb-=m;n-=m;log('hero',`${h.name}'s shield absorbs ${m} damage${u.absorb?` (${u.absorb} left)`:' and fades'}.`)}h.hp-=n;u.hurtAt=Date.now();if(n>0&&!u.augRd&&u.res&&bridgeOn(h,'augment')){const g=Math.min(n,pwrMax(h)-(u.res.tech||0));if(g>0){u.augRd=true;u.res.tech+=g;log('hero',`Augmented: ${h.name} turns the hit into ${g} Power.`)}}if(n>0&&h.hp>0)painGain(u,h);if(h.hp<=0&&!u.lastSt&&rankMod(h,'innate','lastStand')){h.hp=1;u.lastSt=true;fxU(u,'STILL STANDING!','good');log('hero',`Innate capstone: ${h.name} refuses to fall and stays up with 1 health.`)}if(h.hp<=0&&!u.anti&&S.facilities.includes('antivenom')){h.hp=1;u.anti=true;fxU(u,'ANTIVENOM!','good');log('hero',`Antivenom Lab: ${h.name} stays on their feet with 1 health.`)}if(h.hp<=0){h.hp=0;u.ko=true;u.guard=false;log('vill',`${h.name} is down!`)}}

/* Avoid Damage uses one action. Nearby safe cover improves the defense, and
   a missed targeted attack can strike cover if it lies in the attack path. */
function avoidCover(u){
  const sd=S.sd,beam=litMap(),out=[];
  for(const p of nbrs(u)){
    if(!inB(p.x,p.y))continue;
    const k=p.x+','+p.y;
    if(sd.pits.includes(k)||sd.haz.some(h=>h.k===k)||(sd.bombs||[]).some(b=>b.k===k)||beam[k])continue;
    if(sd.walls.some(w=>w.k===k))out.push({...p,k,kind:'wall'});
    else if(sd.obs.includes(k))out.push({...p,k,kind:'rubble'});
    else if(sd.term&&sd.term.k===k)out.push({...p,k,kind:'terminal'});
    else {
      const ally=sd.units.find(o=>o!==u&&!o.ko&&o.x===p.x&&o.y===p.y);
      if(ally)out.push({...p,k,kind:'hero',unit:ally});
      else{const civ=sd.civs.find(o=>o.x===p.x&&o.y===p.y);if(civ)out.push({...p,k,kind:'civilian',unit:civ})}
    }
  }
  return out;
}
const avoidEva=u=>u.avoidDamage?(avoidCover(u).length?5:3):0;
function avoidDamage(){
  const sd=S.sd,u=sd&&sd.units[sd.sel];
  if(!u||u.acted||u.ko||u.avoidDamage||sd.busy||sd.result)return;
  return act(async()=>{
    u.acted=true;u.avoidDamage=true;
    await A.shield(ctrU(u),COL.cyan,true);
    const n=avoidEva(u);
    fxU(u,'AVOID +'+n,'good');
    log('hero',heroOf(u).name+' avoids damage: +'+n+' evasion until the next round'+(n===5?' with adjacent cover':'')+'.');
  });
}
async function avoidRedirect(u,source,dmg,label){
  if(!u.avoidDamage)return false;
  const covers=avoidCover(u);
  /* Ranged attacks must pass through the cover hex. An adjacent melee miss
     can strike a target beside both attacker and defender. */
  const origins=source.body||source.sw||source.shape?vCells(source):[source];
  const found=[];
  for(const from of origins){
    const dist=cheb(from,u),line=dist>1?hexLine(from,u):[];
    for(const cover of covers){
      const valid=dist<=1?cheb(from,cover)<=1:line.some(p=>p.x===cover.x&&p.y===cover.y);
      if(valid)found.push({cover,dist:cheb(from,cover)});
    }
  }
  if(!found.length)return false;
  const priority={wall:0,rubble:1,terminal:2,hero:3,civilian:4};
  found.sort((a,b)=>priority[a.cover.kind]-priority[b.cover.kind]||a.dist-b.dist);
  const c=found[0].cover,sd=S.sd,name=heroOf(u).name;
  const target=c.kind==='hero'?heroOf(c.unit).name:c.kind==='civilian'?'a civilian':c.kind==='wall'?'a wall':c.kind==='rubble'?'rubble':'the evidence terminal';
  log('hero',name+' ducks behind '+target+'; '+label+' strikes it instead.');
  if(c.kind==='hero'){
    if(!await wardBlocks(c.unit)){damageHero(c.unit,dmg);fxU(c.unit,'STRAY HIT!','vhit')}
  }else if(c.kind==='civilian'){
    harmCiv(c.unit,'a redirected '+label);
  }else if(c.kind==='terminal'){
    termHit(p=>p.x===c.x&&p.y===c.y,label);
  }else if(c.kind==='rubble'){
    sd.obs=sd.obs.filter(k=>k!==c.k);fxP(c.x,c.y,'SMASH!','vhit');
  }else{
    const wall=sd.walls.find(w=>w.k===c.k);
    if(wall&&!wall.perm){sd.walls=sd.walls.filter(w=>w!==wall);fxP(c.x,c.y,'CRACK!','vhit')}
    else fxP(c.x,c.y,'BLOCKED!','good');
  }
  render();
  return true;
}
function rallySpirit(){const sd=S.sd,u=sd&&sd.units[sd.sel];if(!u||u.ko||u.acted||sd.busy||sd.result)return;sd.mode=sd.mode==='rallySpirit'?null:'rallySpirit';render()}
async function wardBlocks(u){if(!u.ward)return false;u.ward=false;await A.shield(ctrU(u),COL.magic,true);fxU(u,'WARDED!','good');log('hero',`A ward turns the blow aside from ${heroOf(u).name}.`);render();return true}
