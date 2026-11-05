/* ui/icons.js: Icon helpers over the SVG sprite: IC, UI, pIc, vIc, mIc, VART villain colours, vSty. */
/* icon helpers (used by every screen; battle code lives in battle.js) */
const SWN={hive:'Queen',sting:'Stinger',shell:'Shell'};
const IC=(id,c='')=>`<svg class="ic${c?' '+c:''}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const VART={gallows:['#4E8F2A','#D7FF5C'],quarry:['#86684C','#FFB347'],cantor:['#6A2C91','#F1C02C'],architect:['#2F5D9E','#9FD3FF'],helios:['#E08A12','#FFF3B0'],serpent:['#1E7F6C','#F3CB4B'],lode:['#55606E','#E23B3B'],noct:['#2A2D52','#8CF0FF'],swarm:['#B07A0B','#FFE066'],bomber:['#C9402A','#FFD27A'],grid:['#1590B2','#FF2D55'],mole:['#7A4E2A','#F1C02C'],hive:['#B07A0B','#FFE066'],sting:['#B0306A','#FFE066'],shell:['#7A5AA8','#FFE066']};
const vArt=k=>VART[k]||['var(--magenta)','#F3CB4B'],vSty=k=>`--vc:${vArt(k)[0]};--ac:${vArt(k)[1]}`;
const UI=id=>IC('u-'+id,'u'),resIc=k=>k==='tech'||k==='intel'?UI(k):VART[k]?`<span class="vic" style="${vSty(k)}">${vIc(k)}</span>`:UI('salv');
const vKey=k=>k==='swarm'?'hive':k,vIc=k=>spritePortrait(k,(VILLAINS[k]||{}).name||SWN[k]||k)||IC('u-target'),mIc=k=>spritePortrait('m-'+k,'Henchman')||IC('u-target'),pIc=p=>IC(POWERS[p]?'p-'+p:'p-any'),vWm=k=>spritePortrait(k,(VILLAINS[k]||{}).name||k,'ic wm sprite-portrait',true);

/* Face crops use the exact battle atlases; coordinates are in original image pixels. */
const CHARACTER_PORTRAITS={
 bulwark:['heroes-superhero',1261,1247,190,0,240,240],volt:['heroes-superhero',1261,1247,825,0,240,240],
 wisp:['heroes-superhero',1261,1247,80,650,250,250],lynx:['heroes-superhero',1261,1247,755,650,250,250],
 cipher:['cast-1',1261,1247,120,0,195,195],rivet:['cast-1',1261,1247,510,0,195,195],goliath:['cast-1',1261,1247,930,0,195,195],
 sibyl:['cast-1',1261,1247,140,415,195,195],hexen:['cast-1',1261,1247,535,415,195,195],civilian:['cast-1',1261,1247,960,415,195,195],
 civilian2:['cast-1',1261,1247,130,830,195,195],sting:['cast-1',1261,1247,590,840,195,195],shell:['cast-1',1261,1247,1015,830,195,195],
 gallows:['cover-1',1261,1247,210,0,250,250],quarry:['cover-1',1261,1247,860,0,250,250],
 cantor:['cover-1',1261,1247,200,625,250,250],architect:['cover-1',1261,1247,845,620,250,250],
 helios:['cover-2',1261,1247,230,0,250,250],serpent:['cover-2',1261,1247,920,65,300,300],
 lode:['cover-2',1261,1247,230,620,250,250],noct:['cover-2',1261,1247,930,655,250,250],
 swarm:['cover-3',1226,1283,270,15,260,260],bomber:['cover-3',1226,1283,820,0,260,260],
 grid:['cover-3',1226,1283,240,635,250,250],mole:['cover-3',1226,1283,805,635,250,250],
 'm-gallows':['cast-2',1536,1024,270,30,180,180],'m-quarry':['cast-2',1536,1024,740,10,190,190],'m-cantor':['cast-2',1536,1024,1200,10,200,200],
 'm-architect':['cast-2',1536,1024,220,512,200,200],'m-helios':['cast-2',1536,1024,690,512,200,200],'m-serpent':['cast-2',1536,1024,1190,525,200,200],
 'm-lode':['cast-3',1536,1024,225,0,200,200],'m-noct':['cast-3',1536,1024,745,10,200,200],'m-swarm':['cast-3',1536,1024,1300,25,200,200],
 'm-bomber':['cast-3',1536,1024,200,512,200,200],'m-grid':['cast-3',1536,1024,690,512,200,200],'m-mole':['cast-3',1536,1024,1240,512,200,200]
};
function spritePortrait(key,label,classes='ic sprite-portrait',wide=false){
 key=key==='hive'?'swarm':key;const a=CHARACTER_PORTRAITS[key];if(!a)return '';
 const [sheet,W,H,x,y,w,h]=a,ratio=wide?160/116:1,cw=w*ratio,cx=Math.max(0,Math.min(W-cw,x+(w-cw)/2)),box=[cx,y,cw,h].map(n=>+n.toFixed(2)).join(' ');
 return `<svg class="${classes}" data-portrait="${esc(key)}" viewBox="0 0 ${wide?160:116} 116" role="img" aria-label="${esc(label)} portrait" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#302c29"/><svg class="vportrait-crop sprite-portrait-crop" width="100%" height="100%" viewBox="${box}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><image href="assets/isometric/${sheet}.webp" width="${W}" height="${H}" preserveAspectRatio="none"/></svg><rect x=".5" y=".5" width="${wide?159:115}" height="115" fill="none" stroke="#142638" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
}
function heroPortrait(h,variant='icon'){
 const key=CHARACTER_PORTRAITS[h.cls]?h.cls:({tech:'cipher',innate:'bulwark',magic:'wisp'}[BASE(h).track]||'bulwark');
 return spritePortrait(key,h.name||HERO_BASE[key].name,'ic sprite-portrait hero-portrait hero-portrait-'+variant,variant==='combat');
}
