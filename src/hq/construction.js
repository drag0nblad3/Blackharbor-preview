/* Dedicated construction page. Art and plot locations are presentation only; FAC and S.facilities own the rules. */
const HQ_FAC_ART={
  skunk:[1,0],medbay:[1,1],workshop:[1,2],comms:[1,3],training:[1,4],press:[1,5],
  lab:[2,0],hangar:[2,1],reactor:[2,2],sanctum:[2,3],bunker:[2,4],antivenom:[2,5],
  magnet:[3,0],dojo:[3,1],bombsq:[3,2],optics:[3,3],jammer:[3,4]
};
/* Individually authored sites follow the curved waterfront paths; no row/column placement. [x, foot-y, width] */
const HQ_SITES={
  skunk:[33,58,13],medbay:[61,52,13],workshop:[16,64,19],comms:[92,28,8.5],training:[35,87,14],press:[52,85,8.5],
  lab:[46,37,11],hangar:[84,71,17],reactor:[73,54,8.5],sanctum:[65,30,10],bunker:[25,38,11],antivenom:[80,31,13],
  magnet:[14,83,14],dojo:[43,65,12],bombsq:[67,86,10.5],optics:[94,50,7],jammer:[64,71,13]
};
function hqFacilityArt(k,cls=''){
  const a=HQ_FAC_ART[k];if(!a)return '';
  return `<span class="hq-fac-art ${cls}" aria-hidden="true" style="background-image:url('assets/headquarters/facilities-${a[0]}.webp?v=drawn-1');--ax:${a[1]%3*50}%;--ay:${Math.floor(a[1]/3)*100}%"></span>`;
}
function hqGrounds(selected){
  const keys=Object.keys(HQ_FAC_ART);
  return `<section class="hq-grounds" aria-label="Harbor headquarters grounds">
    <div class="hq-grounds-title"><h2>Harbor compound</h2><span>${S.facilities.filter(k=>HQ_FAC_ART[k]).length} / ${keys.length} built</span></div>
    <div class="hq-grounds-scroll" tabindex="0" aria-label="Headquarters grounds; scroll horizontally on narrow screens">
      <div class="hq-grounds-stage">${keys.map((k,i)=>{
        const built=S.facilities.includes(k),active=k===selected,site=HQ_SITES[k],x=site[0],y=site[1];
        if(!built&&!active)return '';
        return `<button type="button" class="hq-plot ${built?'is-built':'is-preview'} ${active?'is-selected':''}" style="--px:${x}%;--py:${y}%;--pw:${site[2]}%;z-index:${Math.round(y)}" data-a="facselect:${k}" aria-label="${esc(FAC[k].name)} · ${built?'built':'proposed location'}" title="${esc(FAC[k].name)}${built?' · Built':' · Preview'}">${hqFacilityArt(k)}<span class="hq-plot-label">${esc(FAC[k].name)}</span></button>`;
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
      <div class="hq-fac-showcase">${hqFacilityArt(selected)}</div><p>${esc(f.txt)}</p>
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
