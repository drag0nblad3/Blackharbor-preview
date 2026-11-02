/* campaign/story.js: Campaign storyline (Tyler, 2026-11-02): story pages queued at key moments, the reserved mastermind,
   villain teases and Mole Boy evidence after lair fights, and the finale reveals. Text lives in src/data/story.js.
   S.story={q:[{id,lines?,then?}],seen:{},kept}, S.mastermind (villain key held out of the pool), S.storyOff (menu toggle). */
function storyOn(){return !!(S&&!S.storyOff&&S.story)}
function storyQ(id,extra){if(!S.story)return;S.story.q.push({id,...(extra||{})})}
function storyShowing(){return storyOn()&&S.story.q.length>0&&!S.tut&&!['sd','tutend','inv','create'].includes(S.phase)&&S.view!=='create'}
function mmName(){const k=S.mastermind||(S.event&&S.event.keys[0]);return k&&VILLAINS[k]?VILLAINS[k].name:'The mastermind'}
function storyFill(t){const k=S.mastermind||(S.event&&S.event.keys[0]),m=(k&&STORY_MM[k])||{};
  return t.replace(/\{mm\}/g,mmName()).replace(/\{clue\}/g,m.clue||'money that leaves no trail at all.').replace(/\{reveal\}/g,m.reveal||'')}
/* the mastermind: of the bosses still in the pool, the one whose loot fits this team worst, held back for the finale */
function pickMastermind(){if(S.mastermind||!S.pool||!S.pool.length)return;
  const k=bossSelectionScores().sort((a,b)=>a.score-b.score)[0].key;S.pool.splice(S.pool.indexOf(k),1);S.mastermind=k}
/* villain teases for one arc: lines for the given villains not yet teased this arc */
function storyTeases(arc,keys){const t=S.story.teased=S.story.teased||{},L=[];
  for(const k of keys){const id=k+':'+arc,line=STORY_TEASE[k]&&STORY_TEASE[k][arc-2];if(line&&!t[id]){t[id]=1;L.push(line)}}return L}
function storyArc(arc){if(!storyOn()||arc<2||S.story.seen['arc'+arc])return;S.story.seen['arc'+arc]=1;
  storyQ('arc'+arc,{lines:storyTeases(arc,S.villains.filter(v=>v.status==='active'&&!VILLAINS[v.key].intro).map(v=>v.key))})}
function storyRumors(){if(!storyOn()||S.story.seen.rumors)return;S.story.seen.rumors=1;
  storyQ('rumors',{lines:S.villains.map(v=>STORY_RUMORS[v.key]).filter(Boolean)})}
/* after a lair fight: Mole Boy evidence (first fight of Arc 1, first fight from issue TIER3_ISSUE) and this villain's tease */
function storyAfter(L,vkey){if(!storyOn()||!vkey||!VILLAINS[vkey]||VILLAINS[vkey].intro)return;const s=S.story.seen,arc=arcOf(S.issue),nm=VILLAINS[vkey].name;
  if(!s.tunnel&&arc===1){s.tunnel=1;L.push(STORY_EVIDENCE.tunnel.replace(/\{v\}/g,nm))}
  if(!s.grit&&S.issue>=TIER3_ISSUE){s.grit=1;L.push(STORY_EVIDENCE.grit.replace(/\{v\}/g,nm))}
  if(arc>=2)L.push(...storyTeases(arc,[vkey]))}
/* finale preparation: with story on, the reveal pages play first and the fight starts after the last one */
function storyFinale(p){S.event.prep=p;if(!storyOn()){startFinale(p);return}
  S.story.q=[];storyQ('revealMole');storyQ('revealMaster',{then:'finale'})}
function storyEpilogue(){if(!storyOn()||!S.event||!S.over||S.story.seen.epilogue)return;S.story.seen.epilogue=1;storyQ(S.over.win?'epilogueWin':'epilogueLoss')}
/* older saves: an empty story, and a mastermind reserved if the villains are out and the finale has not started */
function storyLoad(){if(!S||!S.villains)return;if(!S.story)S.story={q:[],seen:{rumors:S.villains.length?1:0}};
  if(!S.mastermind&&S.villains.length&&!S.event&&S.issue<=MAX_ISSUE&&S.pool&&S.pool.length&&!S.finalePending)try{pickMastermind()}catch(e){}}

function storyView(){const it=S.story.q[0],id=it.id==='assemble'&&S.story.kept?'assembleKept':it.id,P=STORY_PAGES[id];
  if(!P){S.story.q.shift();return ''}
  const artK=P.art==='mole'?'mole':P.art==='mm'?(S.mastermind||(S.event&&S.event.keys[0])):null;
  const art=artK?`<div class="story-art villain-dossier-art">${vPortrait(artK,'card')}</div>`:'';
  const rum=it.lines&&it.lines.length?`<ul class="story-lines">${it.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:'';
  const last=S.story.q.length===1;
  return `<section class="panel eventsplash story-page"><div class="eyebrow">Volume ${S.vol} · ${esc(P.kicker)}</div><div><span class="sfxhead">${esc(P.title)}</span>${P.sfx?` <span class="story-sfx">${esc(P.sfx)}</span>`:''}</div>
    <div class="story-body">${art}<div class="story-caps">${P.caps.map((c,i)=>`<div class="cap ${i%2?'':'tilt'}">${esc(storyFill(c))}</div>`).join('')}${rum}${P.after?`<div class="cap">${esc(P.after)}</div>`:''}</div></div>
    <button class="btn pri" data-a="storynext">${it.then==='finale'?'Fight!':last?'Continue':'Next page'}</button></section>`}

ACT.storynext=()=>{const it=S.story.q.shift();if(it&&it.then==='finale'&&S.phase==='event'&&S.event)startFinale(S.event.prep);scrollTo(0,0)};
