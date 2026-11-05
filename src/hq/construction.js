/* Approved harbor art, real saved construction states, responsive facility picker and day/night lighting. */
const HQ_ART_VERSION='harbor-5';
const HQ_FAC_ART={skunk:[1,0],medbay:[1,1],workshop:[1,2],comms:[1,3],training:[1,4],press:[1,5],lab:[2,0],hangar:[2,1],reactor:[2,2],sanctum:[2,3],bunker:[2,4],antivenom:[2,5],magnet:[3,0],dojo:[3,1],bombsq:[3,2],optics:[3,3],jammer:[3,4]};
/* Foot anchors and art widths are authored against the approved 1896x830 master, not a square grid. */
const HQ_SITES={skunk:[65,77,26],medbay:[63,46,13],workshop:[40,78,36],comms:[53.4,24,14.5],training:[30,48,12],press:[36,38,11],lab:[71,44,12],hangar:[79.5,34,27],reactor:[89,56,13],sanctum:[26.5,38,17],bunker:[79,85,18],antivenom:[78,51,12],magnet:[16.5,77,15],dojo:[20,51,17],bombsq:[83.5,69,16],optics:[59,26,11],jammer:[86,76,14]};
/* Cell crop and silhouettes remove unused atlas margins at render time; no smoky rectangular backplates. */
const HQ_CUTS={
 skunk:[44,48,'3% 91%,3% 70%,21% 59%,21% 54%,37% 45%,58% 45%,68% 56%,82% 57%,84% 66%,98% 70%,98% 92%'],
 medbay:[44,48,'12% 91%,12% 81%,15% 80%,15% 60%,22% 53%,28% 47%,70% 47%,78% 53%,86% 61%,86% 81%,94% 84%,94% 92%'],
 workshop:[57,35,'2% 91%,2% 73%,10% 62%,20% 59%,49% 59%,58% 64%,74% 60%,91% 64%,98% 73%,98% 92%'],
 comms:[25,67,'31% 91%,31% 88%,39% 85%,44% 73%,44% 35%,47% 26%,53% 26%,56% 35%,62% 38%,62% 70%,56% 75%,62% 87%,69% 88%,69% 92%'],
 training:[44,48,'9% 91%,9% 86%,15% 83%,20% 80%,20% 62%,26% 55%,71% 55%,80% 62%,80% 80%,88% 84%,92% 88%,92% 92%'],
 press:[49,43,'3% 91%,3% 79%,9% 77%,9% 70%,20% 68%,20% 62%,40% 62%,40% 51%,63% 51%,63% 62%,80% 62%,80% 69%,92% 72%,97% 81%,97% 92%'],
 lab:[37,55,'5% 91%,5% 84%,10% 81%,10% 59%,23% 48%,23% 40%,49% 40%,54% 49%,67% 49%,75% 59%,86% 72%,94% 78%,94% 92%'],
 hangar:[45,47,'3% 91%,3% 83%,7% 80%,7% 67%,1% 62%,30% 48%,37% 46%,35% 53%,66% 53%,65% 47%,74% 48%,98% 62%,94% 67%,94% 82%,97% 86%,97% 92%'],
 reactor:[12,80,'8% 91%,8% 84%,13% 81%,13% 44%,27% 25%,39% 22%,40% 16%,49% 13%,57% 17%,58% 23%,75% 28%,87% 48%,87% 82%,94% 85%,94% 92%'],
 sanctum:[16,76,'3% 91%,3% 84%,8% 80%,11% 57%,20% 47%,29% 31%,39% 29%,45% 20%,51% 17%,57% 24%,58% 30%,68% 31%,79% 48%,88% 57%,94% 82%,98% 90%,98% 92%'],
 bunker:[39,53,'3% 91%,6% 79%,12% 74%,16% 58%,29% 45%,38% 42%,68% 42%,82% 54%,87% 76%,95% 82%,98% 92%'],
 antivenom:[39,53,'4% 91%,4% 84%,10% 80%,10% 64%,31% 43%,77% 43%,90% 65%,90% 82%,97% 88%,97% 92%'],
 magnet:[19,73,'6% 90%,6% 83%,12% 76%,14% 30%,18% 22%,78% 22%,84% 30%,87% 77%,94% 84%,94% 92%'],
 dojo:[34,58,'3% 91%,3% 82%,8% 78%,8% 63%,3% 59%,5% 52%,24% 47%,30% 40%,70% 40%,78% 48%,96% 52%,97% 60%,92% 63%,92% 81%,97% 86%,97% 92%'],
 bombsq:[29,63,'4% 91%,4% 65%,12% 48%,27% 39%,28% 31%,64% 31%,65% 39%,80% 49%,84% 67%,94% 71%,96% 90%'],
 optics:[16,76,'10% 91%,10% 83%,15% 80%,15% 60%,13% 55%,13% 37%,24% 24%,40% 18%,56% 20%,70% 31%,78% 45%,82% 64%,84% 82%,89% 86%,89% 92%'],
 jammer:[31,61,'8% 91%,8% 83%,14% 78%,18% 65%,29% 48%,38% 36%,47% 33%,48% 37%,43% 46%,58% 36%,66% 33%,67% 38%,61% 47%,78% 35%,84% 33%,84% 39%,73% 58%,72% 79%,90% 83%,90% 92%']
};
function hqPref(k,fallback){try{return localStorage.getItem('blackharbor-harbor-'+k)||fallback}catch(_){return fallback}}
function hqSetPref(k,v){try{localStorage.setItem('blackharbor-harbor-'+k,v)}catch(_){}}
function hqLighting(){const v=hqPref('lighting','auto');return ['auto','day','night'].includes(v)?v:'auto'}
function hqIsNight(hour=new Date().getHours(),mode=hqLighting()){return mode==='night'||mode==='auto'&&(hour<7||hour>=19)}
function hqAllBuilt(){return Object.keys(HQ_FAC_ART).every(k=>S.facilities.includes(k))}
function hqWorkshopJoined(selected){return S.facilities.includes('workshop')&&(S.facilities.includes('skunk')||selected==='skunk')}
function hqWorkshopComplex(selected){if(!hqWorkshopJoined(selected)||hqAllBuilt())return '';return `<img class="hq-complex ${S.facilities.includes('skunk')?'':'is-preview'}" data-hq-complex="workshop:skunk" src="assets/headquarters/workshop-complex.webp?v=${HQ_ART_VERSION}" alt="" aria-hidden="true" draggable="false">`}
function hqFacilityArt(k,cls=''){
 const a=HQ_FAC_ART[k],c=HQ_CUTS[k];if(!a)return '';
 return `<span class="hq-fac-art ${cls}" aria-hidden="true" style="--cut-top:${c[0]};--cut-h:${c[1]};--silhouette:polygon(${c[2]})"><span class="hq-art-cell" style="background-image:url('assets/headquarters/facilities-${a[0]}.webp?v=${HQ_ART_VERSION}');--ax:${a[1]%3*50}%;--ay:${Math.floor(a[1]/3)*100}%"></span></span>`;
}
function hqLighthouse(){return `<svg class="hq-lighthouse" viewBox="0 0 1896 830" aria-hidden="true"><defs><linearGradient id="hq-beam-gradient"><stop stop-color="#fff19b" stop-opacity=".75"/><stop offset="1" stop-color="#ffde48" stop-opacity=".04"/></linearGradient><clipPath id="hq-beam-sky"><path d="M265 75 L1896 10 L1896 140 L1240 140 L1190 70 L1100 40 L1050 90 L1000 90 L970 30 L920 15 L885 65 L850 45 L810 140 L620 140 L570 85 L470 85 L430 125 L265 110Z"/></clipPath></defs><g class="hq-beacon-light" clip-path="url(#hq-beam-sky)"><path class="hq-beam" d="M265 92 L1800 0 L1800 155 Z" fill="url(#hq-beam-gradient)"/></g><g class="hq-lantern-light"><path d="M221 78H251V111H221Z" fill="#ffe17b"/><path d="M226 78V111M237 78V111M247 78V111" stroke="#152a35" stroke-width="4"/></g></svg>`}
function hqGrounds(selected){
 const keys=Object.keys(HQ_FAC_ART),complete=hqAllBuilt();
 return `<section class="hq-grounds" aria-label="Harbor headquarters grounds"><div class="hq-grounds-title"><h2>Harbor compound</h2><span>${keys.filter(k=>S.facilities.includes(k)).length} / ${keys.length} built</span></div>
 <div class="hq-grounds-scroll"><div class="hq-grounds-stage ${complete?'is-complete':''} ${hqIsNight()?'is-night':''}" data-hq-harbor="true" aria-label="Headquarters island with permanent lighthouse" style="background-image:url('assets/headquarters/${complete?'harbor-complete':'harbor-ground'}.webp?v=${HQ_ART_VERSION}')">${hqLighthouse()}${hqWorkshopComplex(selected)}${keys.map(k=>{
 const built=S.facilities.includes(k),active=k===selected;if(!built&&!active)return '';const [x,y,w]=HQ_SITES[k];
 return `<button type="button" class="hq-plot ${built?'is-built':'is-preview'} ${active?'is-selected':''} ${complete||hqWorkshopJoined(selected)&&(k==='workshop'||k==='skunk')?'is-complex-part':''}" style="--px:${x}%;--py:${y}%;--pw:${w}%;z-index:${Math.round(y)}" data-a="facselect:${k}" aria-label="${esc(FAC[k].name)} · ${built?'built':'proposed location'}" title="${esc(FAC[k].name)}${built?' · Built':' · Preview'}">${hqFacilityArt(k)}<span class="hq-plot-label">${esc(FAC[k].name)}</span></button>`;
 }).join('')}${typeof hqMotionLayer==='function'?hqMotionLayer():''}</div></div>
 <div class="hq-scene-controls"><label>Lighting <select class="hq-light-picker" aria-label="Harbor lighting">${[['auto','Auto · local time'],['day','Day'],['night','Night']].map(([v,t])=>`<option value="${v}" ${hqLighting()===v?'selected':''}>${t}</option>`).join('')}</select></label><span class="hq-light-status">${hqIsNight()?'Night · beacon on':'Day · beacon off'}</span>${typeof hqMotionControl==='function'?hqMotionControl():''}</div></section>`;
}
function hqConstructionView(){
 const keys=Object.keys(FAC),ui=S.ui||{},selected=Object.hasOwn(FAC,ui.hqFacility)?ui.hqFacility:keys.find(k=>!S.facilities.includes(k)&&isUnlocked('fac:'+k))||keys[0];
 const f=FAC[selected],built=S.facilities.includes(selected),known=isUnlocked('fac:'+selected),open=facOpen(selected),ready=known&&open&&afford(f.cost);
 const state=k=>S.facilities.includes(k)?'Built':!isUnlocked('fac:'+k)?'No blueprint':!facOpen(k)?`Arc ${FAC[k].arc}`:afford(FAC[k].cost)?'Ready to build':'Need resources';
 return `${hqGrounds(selected)}${guideBar()}<section class="panel hq-construction" data-cid="hq-base"><div class="hq-construction-heading"><div><span class="eyebrow">Headquarters</span><h2>Base development</h2></div><button class="btn sm hq-operations-link" data-a="view:hq">Operations & workshop</button></div>
 <label class="hq-mobile-picker">Facility plan<select aria-label="Facility plan" class="hq-fac-picker">${keys.map(k=>`<option value="${k}" ${k===selected?'selected':''}>${esc(FAC[k].name)} — ${state(k)}</option>`).join('')}</select><small>${keys.length} facility plans</small></label>
 <div class="hq-build-layout"><div class="hq-build-list" role="group" aria-label="Facility plans">${keys.map(k=>`<button type="button" class="hq-fac-choice ${k===selected?'is-selected':''}" data-a="facselect:${k}" aria-pressed="${k===selected}">${hqFacilityArt(k)}<span><b>${esc(FAC[k].name)}</b><small class="${S.facilities.includes(k)?'hq-built-state':''}">${state(k)}</small></span></button>`).join('')}</div>
 <article class="hq-fac-detail" aria-labelledby="hq-fac-name"><div class="row between"><h3 id="hq-fac-name" tabindex="-1">${esc(f.name)}</h3>${built?'<span class="tag g">✓ Built</span>':''}</div><div class="hq-fac-showcase">${selected==='skunk'&&S.facilities.includes('workshop')?`<img class="hq-complex-preview" src="assets/headquarters/workshop-complex.webp?v=${HQ_ART_VERSION}" alt="Skunkworks wing built into the Workshop">`:hqFacilityArt(selected)}</div><p>${esc(f.txt)}</p>
 ${!known?`<p class="cap">Blueprint required. Unlocks from: ${unlockSources('fac:'+selected)}</p>`:!open?`<p class="cap">Opens in Arc ${f.arc}.</p>`:''}${built?'<p class="hq-built-notice">✓ Operational on your grounds</p>':`<div class="hq-build-footer"><span class="cost" aria-label="Construction cost">${costHtml(f.cost)}</span><button class="btn pri" data-a="hqbuild:${selected}" ${ready?'':'disabled'}>Build ${esc(f.name)}</button></div>${known&&open&&!ready?'<p class="small muted">Gather more Tech or Intel to build this facility.</p>':''}`}</article></div><button class="btn hq-mobile-operations" data-a="view:hq">Operations & workshop</button></section>`;
}
function hqRefreshConstruction(focus){const list=document.querySelector('.hq-build-list'),listTop=list?list.scrollTop:0;render();const next=document.querySelector('.hq-build-list');if(next)next.scrollTop=listTop;if(focus){const h=document.getElementById('hq-fac-name');if(h)h.focus({preventScroll:true})}return NO_RENDER}
ACT.facselect=k=>{if(S.phase!=='hq'||!Object.hasOwn(FAC,k))return;S.ui=S.ui||{};S.ui.hqFacility=k;return hqRefreshConstruction(true)};
ACT.hqbuild=k=>{ACT.build(k);return hqRefreshConstruction(true)};
let hqLightTimer=null;
function hqHarborMount(){
 if(typeof document==='undefined')return;if(hqLightTimer!==null)clearTimeout(hqLightTimer);hqLightTimer=null;
 const stage=document.querySelector('[data-hq-harbor]');if(stage){stage.classList.toggle('is-night',hqIsNight());const status=document.querySelector('.hq-light-status');if(status)status.textContent=hqIsNight()?'Night · beacon on':'Day · beacon off';if(hqLighting()==='auto')hqLightTimer=setTimeout(hqHarborMount,60000)}
 if(typeof hqMotionMount==='function')hqMotionMount();
}
if(typeof document!=='undefined'){
 document.addEventListener('change',e=>{if(S.phase!=='hq'||S.view!=='construction')return;if(e.target.matches('.hq-fac-picker'))ACT.facselect(e.target.value);if(e.target.matches('.hq-light-picker')){hqSetPref('lighting',e.target.value);hqRefreshConstruction(false)}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)hqHarborMount()});
}
