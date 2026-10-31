/* ui/icons.js: Icon helpers over the SVG sprite: IC, UI, pIc, vIc, mIc, VART villain colours, vSty. */
/* icon helpers (used by every screen; battle code lives in battle.js) */
const SWN={hive:'Queen',sting:'Stinger',shell:'Shell'};
const IC=(id,c='')=>`<svg class="ic${c?' '+c:''}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const VART={gallows:['#4E8F2A','#D7FF5C'],quarry:['#86684C','#FFB347'],cantor:['#6A2C91','#F1C02C'],architect:['#2F5D9E','#9FD3FF'],helios:['#E08A12','#FFF3B0'],serpent:['#1E7F6C','#F3CB4B'],lode:['#55606E','#E23B3B'],noct:['#2A2D52','#8CF0FF'],swarm:['#B07A0B','#FFE066'],bomber:['#C9402A','#FFD27A'],grid:['#1590B2','#FF2D55'],mole:['#7A4E2A','#F1C02C'],hive:['#B07A0B','#FFE066'],sting:['#B0306A','#FFE066'],shell:['#7A5AA8','#FFE066']};
const vArt=k=>VART[k]||['var(--magenta)','#F3CB4B'],vSty=k=>`--vc:${vArt(k)[0]};--ac:${vArt(k)[1]}`;
const UI=id=>IC('u-'+id,'u'),resIc=k=>k==='tech'||k==='intel'?UI(k):VART[k]?`<span class="vic" style="${vSty(k)}">${vIc(k)}</span>`:UI('salv');
const vKey=k=>k==='swarm'?'hive':k,vIc=k=>IC(VART[k]?'v-'+vKey(k):'v-any'),mIc=k=>IC(VART[k]?'m-'+k:'m-any'),pIc=p=>IC(POWERS[p]?'p-'+p:'p-any'),vWm=k=>IC(VART[k]?'v-'+vKey(k):'v-any','wm');
