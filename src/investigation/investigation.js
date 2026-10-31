/* investigation/investigation.js: Investigation rules: rolls, event picking, quality, clues and intel, prep gear. */
/* Version 93: the last investigation roll is kept so the result can show the die, the bonus and the target */
let lastInvRoll=null;
/* Version 95 (Tyler): Keen Senses gives +2, down from +4 */
function invRoll(){const d=d20(),b=(partyHas('senses')?2:0)+2*fieldCount('roll');lastInvRoll={d,b,t:d+b};return d+b}
function evOf(id){return EVENTS.find(e=>e.id===id)||Object.values(VEVENTS).flat().find(e=>e.id===id)}
function invQuality(c){const amb=S.ethos.b==='public'?2:1;return c<=amb?'ambush':c>=4?'prepared':'normal'}
const QUAL={ambush:{n:'Ambush',txt:'The villain acts first, with an extra henchman, and your heroes start scattered.'},
  normal:{n:'Standoff',txt:'Your heroes enter from the south edge. You act first.'},
  prepared:{n:'Prepared',txt:'You catch them by surprise: change gear before going in, you act first, and the villain starts with 1 wound. +1 salvage on a win.'}};
function invEvents(k){const g=shuffle(EVENTS.filter(e=>!e.cond||e.cond()).map(e=>e.id)),own=VEVENTS[k];return own?g.slice(0,2).concat(pick(own).id):g.slice(0,3)}
/* Version 82 (Tyler): clues at the start come from the Comms Array, one clue gear in the party (extra copies don't stack) and a hero field */
/* Version 87 (Tyler): each starting-clue source only comes through 70% of the time */
const START_CLUE_P=.7;
function startInv(k){selectEncounterDeck(vState(k));const notes=[];let c0=0;
  if(S.facilities.includes('comms')){if(Math.random()<START_CLUE_P){c0++;notes.push('Comms Array: +1 clue')}else notes.push('Comms Array: nothing')}
  {const fg=fieldGear('clue')[0];if(fg){if(Math.random()<START_CLUE_P){c0++;notes.push(`${GEAR[fg.g].name}: +1 clue`)}else notes.push(`${GEAR[fg.g].name}: nothing`)}}
  if(partyHas('senses'))notes.push('Keen Senses: +2 to rolls');fieldGear('roll').forEach(({g})=>notes.push(`${GEAR[g].name}: +2 to rolls`));
  S.inv={v:k,step:0,notes,clues:c0,events:invEvents(k),res:null,intro:true,peak:0,found:[],fresh:0};S.phase='inv';S.view='mission';intelSync();
  /* Version 84 (Tyler): Signal Intercept reveals a page instead of giving a clue */
  if(partyHas('intercept')){const pg=intelPool(k).filter(f=>f.kind==='page');if(pg.length){const f=pick(pg);markSeen(k,f.id);S.inv.found.push(f);S.inv.notes.push(`${party().find(h=>BASE(h).field&&BASE(h).field.id==='intercept').name}: 1 page revealed`)}}}
/* every new clue (peak count, so lost clues are not re-earned) opens one unseen playbook page or hit reaction */
function intelPool(k){const vs=vState(k),seen=(S.seen&&S.seen[k])||[],sr=(S.seenR&&S.seenR[k])||[];
  return [...[...new Set(vs.deck.map(e=>e.id))].filter(id=>!seen.includes(id)).map(id=>({kind:'page',id})),...VINTEL[k].react.filter(r=>!sr.includes(r.id)).map(r=>({kind:'rx',id:r.id}))]}
/* Version 79 (Tyler): overflow clues are the ones past the 4 needed for Prepared; each gives +1 intel (by peak, so lost clues are not re-earned) */
const PREP_CLUES=4;
function intelSync(){const i=S.inv;if(!i)return 0;let n=0;i.ovfFresh=0;
  while(i.clues>i.peak){i.peak++;if(i.peak>PREP_CLUES){S.intel++;i.ovf=(i.ovf||0)+1;i.ovfFresh++}const pool=intelPool(i.v);if(!pool.length)continue;const f=pick(pool);if(f.kind==='page')markSeen(i.v,f.id);else markSeenR(i.v,f.id);i.found.push(f);n++}
  i.fresh=n;return n}
function markSeenR(k,id){S.seenR=S.seenR||{};const a=S.seenR[k]=S.seenR[k]||[];if(!a.includes(id))a.push(id)}
function pageOf(k,id){const vs=vState(k),e=vs.deck.filter(x=>x.id===id).sort((a,b)=>b.mk-a.mk)[0]||{id,mk:0};return buildCard(k,e,vs.level)}
function intelTile(k,f,isNew){if(f.kind==='page'){const c=pageOf(k,f.id);return `<button type="button" class="intel pg-i ${c.sig?'sigi':''} ${isNew?'new':''}" data-a="book:${k}" data-tip="vpage:${k}:${f.id}"><span class="isfx">${esc(TYPE_SFX[c.t]||'!')}</span><span><small>${c.sig?'Signature Move':'Playbook page'}</small><b>${esc(c.n)}</b></span></button>`}
  const r=rxOf(k,f.id);return `<button type="button" class="intel rx-i ${isNew?'new':''}" data-a="book:${k}" data-tip="vrx:${k}:${f.id}"><span class="isfx">${esc(r.sfx)}</span><span><small>Hit reaction</small><b>${esc(r.n)}</b></span></button>`}
const prepGear=()=>S.phase==='inv'&&S.inv&&S.inv.step>=3&&invQuality(S.inv.clues)==='prepared';
