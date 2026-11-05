/* Optional harbor motion. Remove this script and headquarters-motion.css to remove all animation. */
function hqReducedMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches}
function hqMotionEnabled(){return hqPref('motion','on')!=='off'&&!hqReducedMotion()}
function hqMotionControl(){return `<button class="hq-motion-toggle" data-a="hqmotion" aria-pressed="${hqMotionEnabled()}" ${hqReducedMotion()?'disabled title="Your device requests reduced motion"':''}>Animations: ${hqReducedMotion()?'Off · system':hqMotionEnabled()?'On':'Off'}</button>`}
const HQ_MOTION_POINTS={reactor:[89,47,6,10,'gold'],sanctum:[27,29,5,11,'rune'],training:[30,44,6,5,'cyan'],comms:[53.2,4,1,1,'beacon'],hangar:[79,29,7,.6,'status'],workshop:[49,68,13,1,'scan'],magnet:[17.5,66,3,1.5,'cyan']};
function hqMotionLayer(){
 if(!hqMotionEnabled())return '';
 return `<div class="hq-motion-layer" aria-hidden="true">${Object.entries(HQ_MOTION_POINTS).filter(([k])=>S.facilities.includes(k)).map(([k,[x,y,w,h,kind]])=>`<i class="hq-ambient hq-ambient-${kind}" data-hq-effect="${k}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></i>`).join('')}<i class="hq-water-highlight"></i></div>`;
}
ACT.hqmotion=()=>{if(S.phase!=='hq'||S.view!=='construction')return;hqSetPref('motion',hqPref('motion','on')==='off'?'on':'off');return hqRefreshConstruction(false)};
let hqMotionObserver=null;
function hqMotionMount(){
 if(hqMotionObserver)hqMotionObserver.disconnect();hqMotionObserver=null;
 const stage=document.querySelector('[data-hq-harbor]');if(!stage)return;
 stage.classList.toggle('hq-motion-on',hqMotionEnabled());stage.classList.toggle('hq-motion-paused',!!document.hidden);
 if(typeof IntersectionObserver==='function'){hqMotionObserver=new IntersectionObserver(entries=>{for(const e of entries)e.target.classList.toggle('hq-motion-offscreen',!e.isIntersecting)});hqMotionObserver.observe(stage)}
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{const s=document.querySelector('[data-hq-harbor]');if(s)s.classList.toggle('hq-motion-paused',document.hidden)});
if(typeof matchMedia==='function'){const mq=matchMedia('(prefers-reduced-motion: reduce)');if(mq.addEventListener)mq.addEventListener('change',()=>{if(typeof S!=='undefined'&&S.phase==='hq'&&S.view==='construction')render()})}
