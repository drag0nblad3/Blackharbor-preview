/* battle/fight-screen.js: fitting the board to the screen. Phone zoom with sideways scroll that follows the selected hero,
   and on a new fight the page scrolls so the board sits fully in view. */
let isoZoomPref=null,fightSeen=null,fightSel=null,boardScroll=null;
const fightNarrow=()=>typeof innerWidth==='number'&&innerWidth<=700;
function isoZoom(){return fightNarrow()?(isoZoomPref||1.5):1}
function isoZoomBtn(){const z=isoZoom()>1;return `<button class="btn sm iso-zoom" data-a="isoZoom" aria-pressed="${z}" aria-label="${z?'Zoom out to the whole board':'Zoom in on the board'}">${z?'Zoom out':'Zoom in'}</button>`}
ACT.isoZoom=()=>{isoZoomPref=isoZoom()>1?1:1.5;boardScroll=null;fightSel=null;lastPos={}};
if(typeof document!=='undefined')document.addEventListener('scroll',e=>{const w=e.target;if(w&&w.classList&&w.classList.contains('boardwrap'))boardScroll=w.scrollLeft},true);
function fightScreenAfter(){const sd=S.sd;if(S.phase!=='sd'||!sd){fightSeen=null;return}
  const wrap=document.querySelector('#app .bcol .boardwrap');
  if(fightSeen!==sd){fightSeen=sd;fightSel=null;boardScroll=null;
    const top=document.querySelector('#app .bh-combat-brief');if(top&&!tutOn())requestAnimationFrame(()=>top.scrollIntoView({block:'start'}))}
  if(!wrap||wrap.scrollWidth<=wrap.clientWidth+2)return;
  const u=sd.sel!=null?sd.units[sd.sel]:null,key=u?u.hid:'none';
  if(key!==fightSel){fightSel=key;const el=u&&wrap.querySelector(`[data-tid="h${CSS.escape(String(u.hid))}"]`);
    if(el){const w=wrap.getBoundingClientRect(),r=el.getBoundingClientRect();boardScroll=wrap.scrollLeft+(r.left+r.width/2)-(w.left+w.width/2)}
    else if(boardScroll==null)boardScroll=(wrap.scrollWidth-wrap.clientWidth)/2;
    wrap.scrollTo({left:boardScroll,behavior:RM||!el?'auto':'smooth'});return}
  if(boardScroll!=null)wrap.scrollLeft=boardScroll}
