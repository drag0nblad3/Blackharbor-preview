/* Equipment presentation only. Ownership, requirements and swaps use the game's rules. */
const LOADOUT_ORDER=['head','body','arms','arms2','belt','legs','acc','acc2'];
const loadoutLabel=s=>s==='acc'?'Accessory 1':s==='acc2'?'Accessory 2':SLOTS[s];
function loadoutWorn(h,s){
  const linked=s==='arms2'&&h.gear.arms&&GEAR[h.gear.arms].two;
  return {key:linked?h.gear.arms:h.gear[s],linked:!!linked,slot:linked?'arms':s};
}
function heroLoadout(h,editable){
  const filled=Object.keys(SLOTS).filter(s=>loadoutWorn(h,s).key).length;
  return `<section class="hero-loadout" aria-label="${esc(h.name)} equipment">
    <header class="loadout-heading"><div><span class="eyebrow">Blackharbor / Field equipment</span><h4>Hero loadout</h4></div><span class="loadout-count">${filled} / 8 slots</span></header>
    <p class="loadout-help">${editable?'Select a slot to inspect, replace or remove gear.':'Field loadout · equipment changes at HQ or during prepared investigations.'}</p>
    <div class="loadout-doll"><div class="loadout-figure" aria-hidden="true"><img src="assets/hero-loadout/mannequin.webp" alt="" width="512" height="768" loading="lazy"><span>FIELD DOSSIER</span></div>
    ${LOADOUT_ORDER.map((s,i)=>{const {key,linked}=loadoutWorn(h,s),g=GEAR[key],n=editable?slotFits(h,s).filter(k=>wearOK(h,k)).length:0;
      const tag=editable?'button':'div';
      return `<${tag} ${editable?`type="button" data-a="slotpick:${h.id}:${s}" aria-haspopup="dialog"`:''} data-slot="${s}" class="loadout-slot ${g?'is-equipped':'is-empty'} ${linked?'is-linked':''}" style="grid-row:${Math.floor(i/2)+1};grid-column:${i%2?3:1}" ${!editable&&g?`data-tip="gear:${key}"`:''}>
      <span class="loadout-slot-label">${loadoutLabel(s)}</span>${g?equipmentIcon(key,56):'<span class="loadout-empty" aria-hidden="true">＋</span>'}
      <span class="loadout-item-name">${g?esc(g.name):'Empty'}</span><span class="loadout-slot-note">${linked?'Uses both hands':g?esc(reqTxt(g)):editable?`${n} available`:'—'}</span>${g?`<span class="loadout-bonuses">${esc(modsTxt(g.mods)||'No passive bonus')}</span>${g.ab?`<span class="loadout-ability">${esc(g.ab.n)} · ${esc(abCost(g))}</span>`:''}`:''}</${tag}>`;
    }).join('')}</div>
  </section>`;
}
/* Keep keyboard focus inside the dossier and restore the originating slot on close. */
let loadoutReturnAction=null;
function loadoutCaptureFocus(){
  if(FAST)return null;
  const modal=document.getElementById('slotpick');
  if(slotPick&&!modal)loadoutReturnAction=`slotpick:${slotPick.h}:${slotPick.s}`;
  return {modal:!!modal,action:document.activeElement&&document.activeElement.dataset.a};
}
function loadoutRestoreFocus(before){
  if(!before)return;
  const modal=document.getElementById('slotpick');
  if(modal){
    const target=Array.from(modal.querySelectorAll('[data-a]')).find(el=>el.dataset.a===before.action);
    (target||modal.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
  }else if(before.modal&&loadoutReturnAction){
    Array.from(document.querySelectorAll('[data-a]')).find(el=>el.dataset.a===loadoutReturnAction)?.focus({preventScroll:true});
    loadoutReturnAction=null;
  }
}
if(!FAST)document.addEventListener('keydown',e=>{
  const modal=document.getElementById('slotpick');if(!modal||e.key!=='Tab')return;
  const buttons=Array.from(modal.querySelectorAll('button:not(:disabled),[href],input,select,textarea,[tabindex="0"]'));
  const first=buttons[0],last=buttons[buttons.length-1];if(!first)return;
  if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus()}
});
function loadoutPicker(h,s){
  const worn=loadoutWorn(h,s),ks=slotFits(h,s),selected=ks.includes(slotPick.g)?slotPick.g:null;
  const current=worn.key,chosen=selected||current,g=GEAR[chosen],plan=selected?eqPlan(h,selected,s):null;
  return `<div id="slotpick" class="loadout-modal" role="dialog" aria-modal="true" aria-label="${esc(h.name)} · ${loadoutLabel(s)}"><div class="gbox">
    <header class="loadout-heading"><div><span class="eyebrow">${esc(h.name)} / ${loadoutLabel(s)}</span><h3>Equipment dossier</h3></div><button type="button" class="btn sm" data-a="slotpick:close" aria-label="Close equipment dossier">Close</button></header>
    <div class="loadout-picker-grid"><section class="loadout-detail" aria-label="Item details" aria-live="polite">
    <span class="eyebrow">${selected?'Selected from armory':current?'Currently equipped':'Empty slot'}</span>
    ${g?`${equipmentIcon(chosen,160)}${gearInfo(chosen)}`:'<p>Select an item from the armory to see its bonuses, abilities and requirements.</p>'}
    ${selected?`<p class="loadout-swap">${plan.out.length?`Returns to armory: ${plan.out.map(k=>esc(GEAR[k].name)).join(', ')}.`:'No equipped items will be replaced.'}${g.two?' Occupies both hands.':''}</p><button type="button" class="btn pri" data-a="equip:${h.id}:${selected}:${s}" ${wearOK(h,selected)?'':'disabled'}>${wearOK(h,selected)?'Equip '+esc(g.name):'Requires '+esc(reqTxt(g))}</button>`:''}
    ${current?`<div class="loadout-current"><span>Equipped: ${esc(GEAR[current].name)}${worn.linked?' · uses both hands':''}</span><button type="button" class="btn sm" data-a="unequip:${h.id}:${worn.slot}">Remove equipped item</button></div>`:''}
    </section><section class="loadout-armory" aria-label="Compatible armory items"><h4>Armory <span class="loadout-count">${ks.length} choices</span></h4><p class="small muted">Select to inspect, then press Equip.</p>
    ${ks.length?ks.map(k=>{const G=GEAR[k],ok=wearOK(h,k),n=S.armory.filter(x=>x===k).length;return `<button type="button" class="loadout-choice ${selected===k?'selected':''}" data-a="gearinspect:${k}" aria-pressed="${selected===k}">${equipmentIcon(k,48)}<span><b>${esc(G.name)}${n>1?' ×'+n:''}</b><small>${ok?esc(modsTxt(G.mods)||'Ability equipment'):'Requires '+esc(reqTxt(G))}</small></span></button>`}).join(''):'<p class="cap">No matching items in the armory. Craft equipment in the HQ Workshop.</p>'}
    </section></div></div></div>`;
}
