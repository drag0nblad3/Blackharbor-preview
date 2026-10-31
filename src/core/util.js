/* core/util.js: Dice and small helpers (rnd, d20, pick, shuffle, esc), FAST (headless) and RM (reduced motion), and the ACT button-action registry. */
const rnd=n=>1+Math.floor(Math.random()*n), d20=()=>{const q=typeof S!=='undefined'&&S&&S.tut&&S.tut.dq;return q&&q.length?q.shift():rnd(20)}; /* Version 133: scripted tutorial rolls come first */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* FAST: running headless (sims), RM: player asked for reduced motion. Both are read while the page loads, so they live here, not in battle.js. */
const FAST=typeof window==='undefined';
const RM=!FAST&&window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Button actions: a button with data-a="name:p1:p2:p3" runs ACT.name(p1,p2,p3,name,el,event) from src/ui/input.js, which then
   calls render(). A handler returns NO_RENDER when it rendered itself or must not re-render. Each area registers its own handlers. */
const ACT=Object.create(null),NO_RENDER=1;
