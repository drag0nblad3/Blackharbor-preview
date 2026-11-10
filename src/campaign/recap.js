/* campaign/recap.js: the volume recap ("collected edition") on the end screen. recapFight records each lair fight and the finale,
   recapHit the most pages one attack tore; S.recap is saved with the campaign and reset by newCampaign. */
function recapNew(from){return {from:from||1,fights:[],torn:{},names:{},best:null}}
function recapFight(sd){if(!sd||sd.patrol||sd.recapped||tutOn())return;sd.recapped=true;const R=S.recap=S.recap||recapNew(S.issue);
  let hp=0,max=0;sd.units.forEach(u=>{const h=heroOf(u);hp+=Math.max(0,h.hp);max+=stat(h,'maxHp');R.torn[h.id]=(R.torn[h.id]||0)+(sd.woundsBy[h.id]||0);R.names[h.id]=h.name});
  R.fights.push({i:S.issue,v:sd.vl.map(o=>o.key),r:sd.result||'loss',rd:Math.max(1,sd.round||1),ko:sd.units.filter(u=>u.ko).length,hp:max?Math.round(100*hp/max):0,fin:!!sd.finale})}
function recapHit(u,n,key){const R=S.recap;if(!R||tutOn()||!u)return;const h=heroOf(u);if(!R.best||n>R.best.n)R.best={n,hid:h.id,name:h.name,v:key,i:S.issue}}
function recapView(){const R=S.recap;if(!R||!R.fights.length)return '';const F=R.fights,won=F.filter(f=>f.r==='win');
  const torn=Object.values(R.torn).reduce((a,b)=>a+b,0),mvpId=Object.keys(R.torn).sort((a,b)=>R.torn[b]-R.torn[a])[0],mvp=mvpId&&R.torn[mvpId]?S.heroes.find(h=>String(h.id)===mvpId):null;
  const close=won.slice().sort((a,b)=>b.ko-a.ko||a.hp-b.hp)[0],vn=k=>VILLAINS[k]?VILLAINS[k].name:k,vs=f=>f.v.map(vn).join(' and ');
  const seen=[];F.forEach(f=>f.v.forEach(k=>{if(!seen.includes(k)&&VILLAINS[k])seen.push(k)}));
  const beat=k=>F.some(f=>f.r==='win'&&f.v.includes(k));
  const tile=(n,l)=>`<div class="recap-tile"><b>${n}</b><span>${esc(l)}</span></div>`;
  const best=R.best&&R.best.n>=2?`<li><b>Biggest hit:</b> ${esc(R.best.name)} tore ${R.best.n} pages from ${esc(vn(R.best.v))} in one attack (Issue #${R.best.i}).</li>`:'';
  const cl=close&&(close.ko||close.hp<60)?`<li><b>Closest call:</b> Issue #${close.i} against ${esc(vs(close))}: won${close.ko?` with ${close.ko} hero${close.ko>1?'es':''} down and`:' with'} ${close.hp}% of the team's health left.</li>`:'';
  const lng=F.slice().sort((a,b)=>b.rd-a.rd)[0];
  return `<div class="recap"><div class="eyebrow">Volume ${S.vol} · Collected edition</div>
    <div class="recap-tiles">${tile(F.length,'Fights')}${tile(won.length,'Won')}${tile(seen.filter(beat).length+'/'+seen.length,'Villains beaten')}${tile(torn,'Pages torn')}</div>
    ${mvp?`<div class="recap-mvp">${eyesArt(mvp)}<div><div class="eyebrow">Most valuable hero</div><h3>${esc(mvp.name)}</h3><p class="small" style="margin:0">${R.torn[mvpId]} of the team's ${torn} torn pages.</p></div></div>`:''}
    <ul class="lines small">${best}${cl}${lng?`<li><b>Longest fight:</b> ${lng.rd} rounds against ${esc(vs(lng))} (Issue #${lng.i}).</li>`:''}</ul>
    <div class="recap-covers">${seen.map(k=>`<figure class="recap-cover ${beat(k)?'won':'lost'}">${vPortrait(k,'combat')}<figcaption>${esc(VILLAINS[k].name)}<small>${beat(k)?'Beaten':'Got away'}</small></figcaption></figure>`).join('')}</div>
    ${R.from>1?`<p class="small muted" style="margin:0">Tracked from Issue #${R.from}, when this save first got the recap.</p>`:''}</div>`}
