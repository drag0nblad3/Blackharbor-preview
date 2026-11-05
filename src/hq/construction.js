/* Dedicated construction page. Art and plot locations are presentation only; FAC and S.facilities own the rules. */
const HQ_FAC_ART={
  skunk:[1,0],medbay:[1,1],workshop:[1,2],comms:[1,3],training:[1,4],press:[1,5],
  lab:[2,0],hangar:[2,1],reactor:[2,2],sanctum:[2,3],bunker:[2,4],antivenom:[2,5],
  magnet:[3,0],dojo:[3,1],bombsq:[3,2],optics:[3,3],jammer:[3,4]
};
/* Shared visual world scale. Reference pixels measure an upright feature in each 512px cell.
   Personnel doors use 2.1m; loading doors, equipment and the mast use their own plausible heights.
   Art is illustrative: these are scale anchors, not surveyed building dimensions. */
const HQ_WORLD_WIDTH_M=112;
const HQ_SCALE={
  skunk:[92,2.1,'personnel door'],medbay:[90,2.1,'personnel door'],workshop:[117,3.3,'loading door'],
  comms:[428,22,'mast'],training:[155,4,'courtyard eaves'],press:[82,2.1,'personnel door'],
  lab:[96,2.1,'personnel door'],hangar:[140,5,'hangar opening'],reactor:[79,2.2,'transformer cabinet'],
  sanctum:[82,2.4,'chapel door'],bunker:[104,2.2,'bunker hatch'],antivenom:[108,2.1,'greenhouse door'],
  magnet:[300,7,'gantry eaves'],dojo:[195,3.1,'veranda eaves'],bombsq:[181,4.2,'tall bay door'],
  optics:[100,2.1,'annex door'],jammer:[136,1.6,'equipment cabinet']
};
/* Large facilities sit on the rear terrace. One gentle distance curve scales every structure,
   rather than giving the rear buildings miniature doors in the artwork itself. */
function hqDistanceScale(y){return .72+Math.max(0,Math.min(44,y-40))*.28/44}
function hqScaledWidth(k,y=84){const a=HQ_SCALE[k];return 512*a[1]/a[0]/HQ_WORLD_WIDTH_M*100*hqDistanceScale(y)}
const HQ_SITE_POINTS={
  skunk:[31.6,70],medbay:[66,42],workshop:[20,70],comms:[88,75],training:[39,83],press:[24,41],
  lab:[55,44],hangar:[82,45],reactor:[93,48],sanctum:[36,43],bunker:[8,61],antivenom:[74,50],
  magnet:[12,82],dojo:[51,84],bombsq:[79,80],optics:[43,64],jammer:[65,81]
};
const HQ_SITES=Object.fromEntries(Object.entries(HQ_SITE_POINTS).map(([k,[x,y]])=>[k,[x,y,hqScaledWidth(k,y)]]));
/* The connected state is one complete drawing, including both buildings and their shared walls.
   The standalone Workshop remains the starting state; no connector is pasted onto its facade. */
const HQ_WORKSHOP_COMPLEX={x:25,y:70,width:24.5*hqDistanceScale(70)};
function hqWorkshopJoined(selected){return S.facilities.includes('workshop')&&(S.facilities.includes('skunk')||selected==='skunk')}
function hqWorkshopComplex(selected){
  if(!hqWorkshopJoined(selected))return '';
  const c=HQ_WORKSHOP_COMPLEX,preview=!S.facilities.includes('skunk');
  return `<img class="hq-complex ${preview?'is-preview':''}" data-hq-complex="workshop:skunk" src="assets/headquarters/workshop-complex.webp?v=parallel-depth-4" alt="" aria-hidden="true" draggable="false" style="--px:${c.x}%;--py:${c.y}%;--pw:${c.width}%;z-index:69">`;
}
function hqFacilityArt(k,cls=''){
  const a=HQ_FAC_ART[k];if(!a)return '';
  return `<span class="hq-fac-art ${cls}" aria-hidden="true" style="background-image:url('assets/headquarters/facilities-${a[0]}.webp?v=parallel-depth-4');--ax:${a[1]%3*50}%;--ay:${Math.floor(a[1]/3)*100}%"></span>`;
}
function hqGrounds(selected){
  const keys=Object.keys(HQ_FAC_ART);
  return `<section class="hq-grounds" aria-label="Harbor headquarters grounds">
    <div class="hq-grounds-title"><h2>Harbor compound</h2><span>${S.facilities.filter(k=>HQ_FAC_ART[k]).length} / ${keys.length} built</span></div>
    <div class="hq-grounds-scroll" tabindex="0" aria-label="Headquarters grounds; scroll horizontally on narrow screens">
      <div class="hq-grounds-stage">${hqWorkshopComplex(selected)}${keys.map((k,i)=>{
        const built=S.facilities.includes(k),active=k===selected,site=HQ_SITES[k],x=site[0],y=site[1];
        if(!built&&!active)return '';
        return `<button type="button" class="hq-plot ${built?'is-built':'is-preview'} ${active?'is-selected':''} ${hqWorkshopJoined(selected)&&(k==='workshop'||k==='skunk')?'is-complex-part':''}" style="--px:${x}%;--py:${y}%;--pw:${site[2]}%;z-index:${Math.round(y)}" data-a="facselect:${k}" aria-label="${esc(FAC[k].name)} · ${built?'built':'proposed location'}" title="${esc(FAC[k].name)}${built?' · Built':' · Preview'}">${hqFacilityArt(k)}<span class="hq-plot-label">${esc(FAC[k].name)}</span></button>`;
      }).join('')}</div>
    </div>
    <p class="hq-grounds-caption">Built facilities appear on the grounds. Amber marks your selection.<span class="hq-pan-hint"> Swipe to explore →</span></p>
  </section>`;
}
function hqConstructionView(){
  const keys=Object.keys(FAC),ui=S.ui||{},selected=Object.hasOwn(FAC,ui.hqFacility)?ui.hqFacility:keys.find(k=>!S.facilities.includes(k)&&isUnlocked('fac:'+k))||keys[0];
  const f=FAC[selected],built=S.facilities.includes(selected),known=isUnlocked('fac:'+selected),open=facOpen(selected),ready=known&&open&&afford(f.cost);
  const state=k=>S.facilities.includes(k)?'Built':!isUnlocked('fac:'+k)?'No blueprint':!facOpen(k)?`Arc ${FAC[k].arc}`:afford(FAC[k].cost)?'Ready to build':'Need resources';
  return `${hqGrounds(selected)}${guideBar()}<section class="panel hq-construction" data-cid="hq-base">
    <div class="hq-construction-heading"><div><span class="eyebrow">Headquarters</span><h2>Base development</h2></div><button class="btn sm" data-a="view:hq">Operations & workshop</button></div>
    <div class="hq-build-layout"><div class="hq-build-list" role="group" aria-label="Facility plans">${keys.map(k=>`<button type="button" class="hq-fac-choice ${k===selected?'is-selected':''}" data-a="facselect:${k}" aria-pressed="${k===selected}">${hqFacilityArt(k)}<span><b>${esc(FAC[k].name)}</b><small class="${S.facilities.includes(k)?'hq-built-state':''}">${state(k)}</small></span></button>`).join('')}</div>
    <article class="hq-fac-detail" aria-labelledby="hq-fac-name"><div class="row between"><h3 id="hq-fac-name" tabindex="-1">${esc(f.name)}</h3>${built?'<span class="tag g">Built</span>':''}</div>
      <div class="hq-fac-showcase">${selected==='skunk'&&S.facilities.includes('workshop')?'<img class="hq-complex-preview" src="assets/headquarters/workshop-complex.webp?v=parallel-depth-4" alt="Skunkworks wing built into the Workshop">':hqFacilityArt(selected)}</div>${selected==='skunk'&&S.facilities.includes('workshop')?'<p class="small muted">Adds an integrated Skunkworks wing to the Workshop.</p>':''}<p>${esc(f.txt)}</p>
      ${!known?`<p class="cap">Blueprint required. Unlocks from: ${unlockSources('fac:'+selected)}</p>`:!open?`<p class="cap">Opens in Arc ${f.arc}.</p>`:''}
      ${built?'<p class="hq-built-notice">✓ Operational on your grounds</p>':`<div class="hq-build-footer"><span class="cost" aria-label="Construction cost">${costHtml(f.cost)}</span><button class="btn pri" data-a="hqbuild:${selected}" ${ready?'':'disabled'}>Build ${esc(f.name)}</button></div>${known&&open&&!ready?'<p class="small muted">Gather more Tech or Intel to build this facility.</p>':''}`}
    </article></div></section>`;
}
function hqRefreshConstruction(focus){
  const scroller=document.querySelector('.hq-grounds-scroll'),left=scroller?scroller.scrollLeft:0,list=document.querySelector('.hq-build-list'),listTop=list?list.scrollTop:0;
  render();const next=document.querySelector('.hq-grounds-scroll');if(next)next.scrollLeft=left;const nextList=document.querySelector('.hq-build-list');if(nextList)nextList.scrollTop=listTop;
  if(focus&&next){const plot=next.querySelector('.hq-plot.is-selected');if(plot){const a=plot.getBoundingClientRect(),b=next.getBoundingClientRect();if(a.left<b.left||a.right>b.right)next.scrollLeft+=a.left-b.left-(next.clientWidth-a.width)/2}}
  if(focus){const heading=document.getElementById('hq-fac-name');if(heading)heading.focus({preventScroll:true})}
  return NO_RENDER;
}
ACT.facselect=k=>{if(S.phase!=='hq'||!Object.hasOwn(FAC,k))return;S.ui=S.ui||{};S.ui.hqFacility=k;return hqRefreshConstruction(true)};
ACT.hqbuild=k=>{ACT.build(k);return hqRefreshConstruction(true)};
