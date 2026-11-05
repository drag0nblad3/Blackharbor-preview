/* Optional harbor motion. Remove this script and headquarters-motion.css to remove all animation. */
function hqReducedMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches}
function hqMotionEnabled(){return hqPref('motion','on')!=='off'&&!hqReducedMotion()}
function hqMotionControl(){return `<button class="hq-motion-toggle" data-a="hqmotion" aria-pressed="${hqMotionEnabled()}" ${hqReducedMotion()?'disabled title="Your device requests reduced motion"':''}>Animations: ${hqReducedMotion()?'Off · system':hqMotionEnabled()?'On':'Off'}</button>`}
/* All effect coordinates use the approved 1896x830 scene. Non-scaling strokes stay visible on phones. */
const HQ_MOTION_DRAWINGS={
 reactor:'<g transform="translate(1690 373)"><ellipse class="hq-reactor-pulse" rx="48" ry="18"/><g transform="scale(1 .36)"><g class="hq-reactor-orbit"><ellipse cx="47" cy="0" rx="8" ry="18" class="hq-energy-spark"/></g></g></g>',
 sanctum:'<g transform="translate(522 241)"><g class="hq-rune-spin"><ellipse rx="38" ry="52"/><path d="M0 -52v9M38 0h-8M0 52v-9M-38 0h8"/></g></g>',
 training:'<path class="hq-training-arc" d="M535 364l16 -17 17 22 16 -25 18 24 14 -11"/>',
 comms:'<circle class="hq-status-beacon" cx="1007" cy="28" r="8"/>',
 hangar:'<g class="hq-hangar-lights" transform="translate(1378 208)"><path d="M0 0h32"/><path d="M60 0h32"/><path d="M120 0h32"/><path d="M180 0h32"/></g>',
 workshop:'<g clip-path="url(#hq-robot-window)"><path class="hq-workshop-scan" d="M785 537v66"/></g>',
 magnet:'<ellipse class="hq-magnet-pulse" cx="331" cy="548" rx="29" ry="8"/>'
};
function hqMotionLayer(){
 if(!hqMotionEnabled())return '';
 return `<svg class="hq-motion-layer" viewBox="0 0 1896 830" aria-hidden="true" focusable="false"><defs><clipPath id="hq-robot-window"><path d="M780 533H1090V603H780Z"/></clipPath></defs>${Object.entries(HQ_MOTION_DRAWINGS).filter(([k])=>S.facilities.includes(k)).map(([k,art])=>`<g data-hq-effect="${k}">${art}</g>`).join('')}<g class="hq-water-ripples"><path d="M330 746h60m12 0h26m140 12h90"/><path d="M790 777h70m20 0h35m170 -10h86"/><path d="M1310 750h65m14 0h28m88 -8h84"/></g></svg>`;
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
