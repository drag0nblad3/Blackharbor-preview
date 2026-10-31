/* ui/render.js: render() and the screen switch (body/bodyMain), masthead, nav tabs and their glow, page heads, collapsible panels. Add a new screen in bodyMain. */
let lastPos={};const noFlip=new Set();
function render(){const loadoutFocus=loadoutCaptureFocus();bossObserve();tutTick();guideTick();visitTick();const app=document.getElementById('app');app.className='wrap v-'+(S.phase==='hq'&&!tutOn()?'hq-'+(S.view||'hq'):S.phase);app.innerHTML=mast()+nav()+body()+slotPickView();loadoutRestoreFocus(loadoutFocus);if(!FAST){fixDisabled(app);flip();tutPaint()}save()}
function flip(){const b=document.querySelector('.board');if(!b){lastPos={};return}const c=(b.getBoundingClientRect().width-5)/BW(),now={};
  b.querySelectorAll('[data-tid]').forEach(e=>{const id=e.dataset.tid,x=+e.dataset.cx,y=+e.dataset.cy;now[id]=[x,y];const p=lastPos[id];
    if(p&&(p[0]!==x||p[1]!==y)&&!noFlip.has(id)&&!RM){const d=Math.hypot(p[0]-x,p[1]-y);
      e.animate([{transform:`translate(${(p[0]-x)*c}px,${(p[1]-y)*c}px)`},{transform:`translate(${(p[0]-x)*c*.5}px,${(p[1]-y)*c*.5-c*.18}px)`,offset:.5},{transform:'none'}],{duration:Math.min(520,180+90*d),easing:'ease-in-out'})}});
  noFlip.clear();lastPos=now}
function mast(){return `<header class="mast"><div><small>A campaign of capes and consequences</small><h1>Blackharbor</h1></div>
  <div class="row mast-tools"><span class="issue" data-tip="kw:volume">Vol. ${S.vol} · Arc ${arcOf(Math.min(S.issue,MAX_ISSUE))} · #${Math.min(S.issue,MAX_ISSUE)}</span><button type="button" class="btn sm mast-save-btn" data-save-open aria-haspopup="dialog" aria-label="Open game menu: new campaign, difficulty, save and load">☰ Menu</button></div>
  <div class="res" style="flex-basis:100%">
    <span class="chip trust" data-tip="kw:trust" aria-label="Trust" title="Trust">${UI('trust')}${S.trust}</span><span class="chip" data-tip="kw:techres" aria-label="Tech" title="Tech">${UI('tech')}${S.tech}</span><span class="chip" data-tip="kw:intel" aria-label="Intel" title="Intel">${UI('intel')}${S.intel}</span>
    ${Object.keys(S.salvage).filter(k=>S.salvage[k]>0||S.villains.some(v=>v.key===k)).map(k=>`<span class="chip" data-tip="kw:salvage" aria-label="${RES_NAME[k]}" title="${RES_NAME[k]} (${VILLAINS[k]?VILLAINS[k].short:''} salvage)">${resIc(k)}${S.salvage[k]}</span>`).join('')}
  </div></header>`}
function nav(){const m=S.phase!=='hq'&&S.phase!=='over';const v=S.view;
  const pend=roster().some(h=>h.pendingUp>0);
  const g=m?{}:navGlow();
  return `<nav class="nav">${m?`<button class="btn ${v==='mission'?'on':''}" data-a="view:mission">${UI('target')}Mission</button>`:`<button class="btn ${v==='hq'||v==='create'?'on':''} ${g.hq?'glow':''}" data-a="view:hq">${UI('hq')}HQ</button>`}
  <button class="btn ${v==='roster'?'on':''} ${g.roster?'glow':''}" data-a="view:roster">${UI('roster')}Roster${pend?' ★':''}</button>${m?'':`<button class="btn ${v==='villains'?'on':''} ${g.villains?'glow':''}" data-a="view:villains">${UI('mask')}Villains</button>`}</nav>`}
/* tab glow: HQ while something there can be used, Roster while there is new armory gear or a pending choice, Villains once HQ and Roster have both been opened this issue */
function visitTick(){if(S.phase!=='hq')return;if(!S.visit||S.visit.issue!==S.issue)S.visit={issue:S.issue};const v=S.view==='create'?'hq':S.view;
  if(v==='hq'||v==='roster'||v==='villains')S.visit[v]=true;if(v==='roster')S.armSeen=S.armory.slice()}
function newArmory(){const seen=(S.armSeen||[]).slice();return S.armory.some(g=>{const i=seen.indexOf(g);if(i<0)return true;seen.splice(i,1);return false})}
function hqUse(){const R=roster(),full=R.length>=ROSTER_MAX;
  if(!full&&(party().length<4||xoverOpen()))return true;
  if(Object.keys(FAC).some(k=>isUnlocked('fac:'+k)&&!S.facilities.includes(k)&&facOpen(k)&&afford(FAC[k].cost)))return true;
  if(S.facilities.includes('skunk')&&!(S.rd&&S.rd.issue===S.issue&&S.rd.free)&&Object.keys(GEAR).some(k=>!isUnlocked('gear:'+k)))return true;
  const ws=S.facilities.includes('workshop'),own=new Set([...S.armory,...R.flatMap(h=>Object.values(h.gear))]);
  return Object.keys(GEAR).some(k=>{const g=GEAR[k];if(!isUnlocked('gear:'+k)||!(ws||g.cons)||!afford(g.cost))return false;
    return g.cons?R.some(h=>wearOK(h,k)):(!own.has(k)||(g.pair&&[...S.armory,...R.flatMap(h=>Object.values(h.gear))].filter(x=>x===k).length<2))&&R.some(h=>wearOK(h,k))})}
function navGlow(){if(S.phase!=='hq'||S.view==='create')return {};const vi=S.visit&&S.visit.issue===S.issue?S.visit:{};
  return {hq:S.view!=='hq'&&hqUse(),roster:S.view!=='roster'&&(newArmory()||roster().some(h=>h.pendingUp>0)),villains:S.view!=='villains'&&!!vi.hq&&!!vi.roster&&!vi.villains}}
function body(){return bodyMain()+fsplashView()+cheatPanel()+guideModal()+tipModal()+tutModal()}
function bodyMain(){if(S.phase==='tutend')return tutEndView();if(S.over&&S.phase!=='after')return overView();if(S.view==='create'&&S.cre&&S.phase==='hq')return createView();if(S.view==='roster')return rosterView();if(S.phase==='event')return eventView();if(S.phase==='arc')return arcView();
  if(S.phase==='hq')return hqView(S.view==='villains'?'villains':null);if(S.phase==='inv')return invView();if(S.phase==='sd')return sdView();if(S.phase==='after')return afterView();return ''}

/* Shared screen framing for the preview comic-noir UI. Values come from current state. */
function bhPagehead(kicker,title,description,stats){
  return `<header class="bh-pagehead"><div class="bh-pagehead-copy"><span class="bh-page-kicker">${esc(kicker)}</span><h2>${esc(title)}</h2><p>${esc(description)}</p></div>
    <div class="bh-page-stats">${stats.map(([n,v])=>`<div class="bh-page-stat"><b>${esc(String(v))}</b><span>${esc(n)}</span></div>`).join('')}</div></header>`;
}
/* disabled buttons swallow pointer events, so buttons with details use aria-disabled instead */
function fixDisabled(root){root.querySelectorAll('button[disabled][data-tip]').forEach(b=>{b.removeAttribute('disabled');b.setAttribute('aria-disabled','true')})}

const uiOpen=(id,def)=>S.ui&&id in S.ui?S.ui[id]:def;
function coll(id,head,inner,def=true,cls=''){return `<details class="coll ${cls}" data-cid="${id}" ${uiOpen(id,def)?'open':''}><summary>${head}</summary><div class="cbody">${inner}</div></details>`}
if(!FAST)document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.cid){S.ui=S.ui||{};S.ui[d.dataset.cid]=d.open;save()}},true);
