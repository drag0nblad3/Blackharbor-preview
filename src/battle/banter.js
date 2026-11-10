/* battle/banter.js: speech-bubble lines during fights (data in src/data/banter.js). At most one line every few seconds, also written to the log. */
let quipAt=0;
function quipPick(a){return a&&a.length?a[Math.floor(Math.random()*a.length)]:null}
function quipHero(u,kind){if(!u)return;const h=heroOf(u),b=HBANTER[h.cls]||HBANTER[(BASE(h)||{}).track]||HBANTER.innate;const c=HC(u.x,u.y);quipSay(c,h.name,quipPick(b[kind]),'hero')}
function quipVillain(key,kind){const sd=S.sd,o=sd&&sd.vl.find(o=>o.key===key);if(!o||o.v.down&&kind!=='win')return;const c=vCtr(o.v);quipSay(c,VILLAINS[key].short,quipPick((VBANTER[key]||{})[kind]),'vill')}
function quipSay(c,name,t,who){if(FAST||!t||!S.sd||tutOn())return;const now=Date.now();if(now-quipAt<3500)return;quipAt=now;
  fx(c.cx,c.cy-1.5,t,'line',3400);log(who,`${name}: “${t}”`)}
