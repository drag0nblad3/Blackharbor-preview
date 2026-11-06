/* battle/heroism.js: Heroism (replaced Composure, Tyler 2026-11-06). Pool size, gains, and the spend pop-up on close rolls.
   Internal names stay: h.comp is the pool and stat 'maxComp' is the starting bonus from gear, upgrades and perks, so saves and data tables keep working.
   A fight starts at 2 + level + bonuses (+3 after Rally the team). No cap. At 0 the hero is Shaken.
   On an attack, strength or evasion roll that falls short, the hero may spend up to their level in Heroism to add that much, but only enough to reach a success.
   Natural 1s still fail and natural 20s still succeed. The tutorial's scripted fights skip the pop-up. */
const heroStart=h=>Math.max(0,2+lvlOf(h)+stat(h,'maxComp'));
function gainHero(h,n){h.comp=Math.max(0,(h.comp||0)+n)}
/* the most a hero can spend on one roll right now */
const heroCap=h=>Math.max(0,Math.min(lvlOf(h),h.comp||0));
const HERO_KIND={acc:'Attack roll',str:'Strength roll',eva:'Evasion'};
/* per hero and roll type (h.hpref): 0 never spend, 1 ask, 2 spend if it leaves the hero not Shaken, 3 always spend. Default: ask. */
const HERO_PREF=['Never','Ask','If not Shaken','Always'];
const heroPref=(h,k)=>{const v=h.hpref&&h.hpref[k];return v>=0&&v<=3?v:1};
/* need = how much the roll falls short. o: {kind:'acc'|'str'|'eva', line (what was rolled), win (what the spend achieves), card (revealed page or reaction name)}.
   Returns the Heroism spent (0 when the hero can't or won't pay). */
async function heroSpend(u,need,o){const h=heroOf(u);
  if(!u||u.ko||need<1||(S.tut&&S.tut.b!=null)||need>heroCap(h))return 0; /* the scripted tutorial (S.tut.b) never asks */
  const m=heroPref(h,o.kind),safe=h.comp-need>0;
  if(m===0||(m===2&&!safe))return 0;
  if(m===1&&(FAST?!safe:!await heroPopup(h,need,o)))return 0; /* headless sims treat Ask as "spend unless it leaves the hero Shaken" */
  h.comp-=need;fxU(u,'HEROIC!','good');
  log('hero',`${h.name} spends ${need} Heroism: ${o.win}`);render();return need}
function heroPopup(h,need,o){
  return new Promise(res=>{const L=document.createElement('div');L.id='hpop';L.className='hpop-wrap';L.setAttribute('role','dialog');L.setAttribute('aria-label',`${h.name}: spend ${need} Heroism?`);
    L.innerHTML=`<div class="hpp"><div class="ah"><b>Heroism!</b><small>${esc(HERO_KIND[o.kind])}</small></div>
      ${o.card?`<div class="hcard">${esc(o.card)}</div>`:''}
      <p>${o.line}</p>
      <p><b>${esc(h.name)}</b> can spend <b>${need}</b> of ${h.comp} Heroism (up to ${lvlOf(h)} per roll). ${esc(o.win)}</p>
      ${h.comp-need<=0?'<p class="small warn">That empties the pool: the hero becomes <b>Shaken</b>.</p>':''}
      <div class="row"><button class="btn pri" type="button" data-h="1">Spend ${need} Heroism</button><button class="btn" type="button" data-h="0">Keep it</button></div></div>`;
    document.body.appendChild(L);const yes=L.querySelector('[data-h="1"]');setTimeout(()=>yes.focus({preventScroll:true}),RM?0:200);
    L.addEventListener('click',e=>{const b=e.target.closest('[data-h]');e.stopPropagation();if(!b)return;L.classList.add('leaving');setTimeout(()=>{L.remove();res(b.dataset.h==='1')},RM?0:150)})})}
/* evasion: a villain or henchman roll r + acc that reaches eva. Returns true if Heroism turned it into a miss. */
async function heroDodge(u,r,acc,eva,who){if(r===20||r===1)return false;const h=heroOf(u),need=r+acc-eva+1;
  return !!await heroSpend(u,need,{kind:'eva',line:`${esc(who)} rolled <b>${r}</b> ${acc<0?'−':'+'} ${Math.abs(acc)} = ${r+acc} vs ${esc(h.name)}'s evasion ${eva}.`,win:`Evasion becomes ${eva+need} and the attack misses.`})}
/* the per-hero settings menu: one slider per roll type */
function openHeroPref(id){const h=S.heroes.find(x=>x.id===id);if(!h)return;document.getElementById('hpref')?.remove();
  const L=document.createElement('div');L.id='hpref';L.className='hpop-wrap';L.setAttribute('role','dialog');L.setAttribute('aria-label',`${h.name}: Heroism spending`);
  const row=k=>`<label class="hpr"><span><b>${HERO_KIND[k]}</b> <output>${HERO_PREF[heroPref(h,k)]}</output></span>
    <input type="range" min="0" max="3" step="1" value="${heroPref(h,k)}" data-k="${k}" aria-label="${HERO_KIND[k]}">
    <span class="ticks">${HERO_PREF.map(t=>`<i>${t}</i>`).join('')}</span></label>`;
  L.innerHTML=`<div class="hpp"><div class="ah"><b>Heroism</b><small>${esc(h.name)}</small></div>
    <p class="small">When a roll falls just short and ${esc(h.name)} can pay, what should happen?</p>
    ${['acc','str','eva'].map(row).join('')}
    <div class="row"><button class="btn pri" type="button" data-close="1">Done</button></div></div>`;
  document.body.appendChild(L);
  L.addEventListener('input',e=>{const t=e.target;if(!t.dataset||!t.dataset.k)return;h.hpref={...(h.hpref||{}),[t.dataset.k]:+t.value};t.closest('.hpr').querySelector('output').textContent=HERO_PREF[+t.value];save()});
  L.addEventListener('click',e=>{e.stopPropagation();if(e.target===L||e.target.closest('[data-close]'))L.remove()})}
ACT.heroPref=p1=>{openHeroPref(p1);return NO_RENDER};
