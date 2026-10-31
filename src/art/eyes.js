/* art/eyes.js: Eyes panels and hero standees. */
/* Version 134 (Tyler): eyes panels. A short comic panel cropped to a hero's eyes sits beside their name in the battle hero line.
   The head is a silhouette lit from behind in the hero's glow colour; the headpiece tells heroes apart. Quick builds have their own,
   custom heroes get one from their discipline's pool, picked by hero id so it never changes. */
const EYE_INK='#151821';
const EYE_QB={bulwark:['helm',-6],volt:['goggles',8],wisp:['streak',14],cipher:['hud',-4],rivet:['welder',-10],lynx:['ears',18],goliath:['brute',0],sibyl:['thirdeye',-3],hexen:['hat',-8]};
const EYE_POOL={tech:['goggles','hud','welder','visor','gasmask','antennae'],innate:['helm','ears','brute','mohawk','skull','ponytail','bandana'],magic:['streak','thirdeye','hat','horns','halo','flame']};
const eyeHash=s=>{let n=7;for(const c of String(s))n=(n*31+c.charCodeAt(0))>>>0;return n};
function eyeLook(h){const q=EYE_QB[h.cls];if(q&&!h.base)return q;const b=BASE(h),pool=EYE_POOL[b.track]||EYE_POOL.innate,n=eyeHash(h.id||h.name);
  return [pool[n%pool.length],(n>>4)%23-10]}
function eyeGear(hp,r,g){const I=EYE_INK,k=I,eyes=s=>`<g filter="url(#eyeglow)" fill="${g}">${s}</g>`;
  switch(hp){
    case 'helm':return {back:'',front:`<path d="M${-r*1.05} ${r*.2}Q${-r*1.1} ${-r*1.1} 0 ${-r*1.1}Q${r*1.1} ${-r*1.1} ${r*1.05} ${r*.2}L${r*.9} ${r*.7}H${-r*.9}Z" fill="${k}"/><path d="M${-r*.25} ${-r*1.1}L0 ${-r*1.7}L${r*.25} ${-r*1.1}Z" fill="${g}"/>`+eyes(`<path d="M${-r*.75} ${-r*.12}H${r*.75}V${r*.12}H${r*.13}V${r*.6}H${-r*.13}V${r*.12}H${-r*.75}Z"/>`)};
    case 'goggles':return {back:`<path d="M${-r*1.1} ${-r*.2}L${-r*1.3} ${-r}L${-r*.7} ${-r*.8}L${-r*.6} ${-r*1.6}L${-r*.1} ${-r}L${r*.3} ${-r*1.7}L${r*.6} ${-r*.95}L${r*1.3} ${-r*1.3}L${r*1.05} ${-r*.3}Z" fill="${I}"/>`,front:eyes(`<circle cx="${-r*.42}" cy="${-r*.3}" r="${r*.36}"/><circle cx="${r*.42}" cy="${-r*.3}" r="${r*.36}"/>`)+`<circle cx="${-r*.42}" cy="${-r*.3}" r="${r*.36}" fill="none" stroke="${I}" stroke-width="1.2"/><circle cx="${r*.42}" cy="${-r*.3}" r="${r*.36}" fill="none" stroke="${I}" stroke-width="1.2"/>`};
    case 'streak':return {back:`<path d="M${-r*.3} ${-r}Q${-r*2.6} ${-r*1.2} ${-r*3.6} ${-r*.2}Q${-r*2.4} ${-r*.5} ${-r*1.6} ${r*.2}Q${-r*2.8} ${r*.4} ${-r*3.4} ${r*1.1}Q${-r*1.8} ${r} ${-r*.8} ${r*.6}Z" fill="${I}"/>`,front:eyes(`<path d="M${-r*.65} ${-r*.08}L${-r*.1} ${-r*.18}L${-r*.15} ${r*.02}ZM${r*.65} ${-r*.08}L${r*.1} ${-r*.18}L${r*.15} ${r*.02}Z"/>`)};
    case 'hud':return {back:`<path d="M${r*.8} ${-r*.6}L${r*1.5} ${-r*2}" stroke="${I}" stroke-width="1.6"/><circle cx="${r*1.5}" cy="${-r*2}" r="${r*.25}" fill="${g}"/>`,front:eyes(`<circle cx="${r*.38}" cy="${-r*.12}" r="${r*.42}"/><circle cx="${-r*.42}" cy="${-r*.12}" r="${r*.14}"/>`)+`<circle cx="${r*.38}" cy="${-r*.12}" r="${r*.42}" fill="none" stroke="${I}" stroke-width="1.4"/>`};
    case 'welder':return {back:`<path d="M${-r*.9} ${-r*.2}L${-r*1.8} ${r*.1}L${-r*1.6} ${r*.6}L${-r*.95} ${r*.25}" fill="${I}"/>`,front:`<rect x="${-r*.9}" y="${-r*1.2}" width="${r*.75}" height="${r*.45}" rx="${r*.12}" fill="${g}" opacity=".55"/><rect x="${r*.15}" y="${-r*1.2}" width="${r*.75}" height="${r*.45}" rx="${r*.12}" fill="${g}" opacity=".55"/>`+eyes(`<circle cx="${-r*.4}" cy="${r*.05}" r="${r*.13}"/><circle cx="${r*.4}" cy="${r*.05}" r="${r*.13}"/>`)};
    case 'ears':return {back:'',front:`<path d="M${-r*.95} ${-r*.1}L${-r*1.05} ${-r*1.85}L${-r*.25} ${-r*.95}ZM${r*.95} ${-r*.1}L${r*1.05} ${-r*1.85}L${r*.25} ${-r*.95}Z" fill="${k}"/>`+eyes(`<path d="M${-r*.75} ${-r*.35}Q${-r*.4} ${-r*.6} ${-r*.12} ${-r*.2}Q${-r*.5} ${-r*.12} ${-r*.75} ${-r*.35}ZM${r*.75} ${-r*.35}Q${r*.4} ${-r*.6} ${r*.12} ${-r*.2}Q${r*.5} ${-r*.12} ${r*.75} ${-r*.35}Z"/>`)};
    case 'brute':return {back:'',front:eyes(`<path d="M${-r*.7} ${-r*.05}L${-r*.15} ${r*.05}L${-r*.65} ${r*.18}ZM${r*.7} ${-r*.05}L${r*.15} ${r*.05}L${r*.65} ${r*.18}Z"/>`)};
    case 'thirdeye':return {back:`<path d="M${-r*1.4} ${r*1.2}Q${-r*1.6} ${-r*1.4} 0 ${-r*1.9}Q${r*1.6} ${-r*1.4} ${r*1.4} ${r*1.2}Z" fill="${I}"/>`,front:eyes(`<path d="M${-r*.45} ${-r*.95}Q0 ${-r*1.35} ${r*.45} ${-r*.95}Q0 ${-r*.55} ${-r*.45} ${-r*.95}Z"/>`)+`<circle cx="0" cy="${-r*.95}" r="${r*.13}" fill="${I}"/><path d="M${-r*.7} ${-r*.05}q${r*.3} ${r*.25} ${r*.55} 0M${r*.15} ${-r*.05}q${r*.3} ${r*.25} ${r*.55} 0" fill="none" stroke="${g}" stroke-width="1.3" stroke-linecap="round"/>`};
    case 'hat':return {back:'',front:`<path d="M${-r*.8} ${-r*.7}L${r*.15} ${-r*3}Q${r*.9} ${-r*3.1} ${r*1.6} ${-r*2.4}Q${r*.8} ${-r*2.5} ${r*.7} ${-r*1.8}L${r*.85} ${-r*.7}Z" fill="${k}"/><path d="M${-r*.75} ${-r*1.05}H${r*.85}V${-r*.75}H${-r*.72}Z" fill="${g}"/><path d="M${-r*2} ${-r*.55}Q0 ${-r*1.2} ${r*2} ${-r*.55}Q0 ${-r*.2} ${-r*2} ${-r*.55}Z" fill="${k}"/>`+eyes(`<circle cx="${-r*.4}" cy="${r*.05}" r="${r*.15}"/><circle cx="${r*.4}" cy="${r*.05}" r="${r*.15}"/>`)};
    /* extra looks for custom heroes */
    case 'visor':return {back:'',front:eyes(`<path d="M${-r*1.08} ${-r*.4}Q0 ${-r*.65} ${r*1.08} ${-r*.4}L${r*1.04} ${r*.06}Q0 ${-r*.14} ${-r*1.04} ${r*.06}Z"/>`)+`<path d="M${-r*.9} ${-r*.2}Q0 ${-r*.4} ${r*.9} ${-r*.2}" stroke="#fff" stroke-width="1" opacity=".7" fill="none"/>`};
    case 'gasmask':return {back:'',front:`<circle cx="${-r*.85}" cy="${r*.75}" r="${r*.3}" fill="${I}"/><circle cx="${r*.85}" cy="${r*.75}" r="${r*.3}" fill="${I}"/>`+eyes(`<circle cx="${-r*.42}" cy="${-r*.2}" r="${r*.3}"/><circle cx="${r*.42}" cy="${-r*.2}" r="${r*.3}"/>`)+`<path d="M${-r*.7} ${-r*.2}h${r*.56}M${r*.14} ${-r*.2}h${r*.56}" stroke="${I}" stroke-width="1.2"/>`};
    case 'antennae':return {back:`<path d="M${-r*.4} ${-r*.9}Q${-r*.6} ${-r*1.8} ${-r*1.3} ${-r*2.1}M${r*.4} ${-r*.9}Q${r*.6} ${-r*1.8} ${r*1.3} ${-r*2.1}" fill="none" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${-r*1.3}" cy="${-r*2.1}" r="${r*.2}" fill="${g}"/><circle cx="${r*1.3}" cy="${-r*2.1}" r="${r*.2}" fill="${g}"/>`,front:eyes(`<ellipse cx="${-r*.45}" cy="${-r*.15}" rx="${r*.36}" ry="${r*.24}" transform="rotate(20 ${-r*.45} ${-r*.15})"/><ellipse cx="${r*.45}" cy="${-r*.15}" rx="${r*.36}" ry="${r*.24}" transform="rotate(-20 ${r*.45} ${-r*.15})"/>`)};
    case 'mohawk':return {back:`<path d="M${-r*.4} ${-r*.85}L${-r*.3} ${-r*1.6}L${-r*.05} ${-r*1.15}L${r*.1} ${-r*1.9}L${r*.3} ${-r*1.2}L${r*.55} ${-r*1.7}L${r*.55} ${-r*.8}Z" fill="${I}"/>`,front:eyes(`<path d="M${-r*.72} ${-r*.2}L${-r*.12} ${-r*.08}L${-r*.62} ${r*.06}ZM${r*.72} ${-r*.2}L${r*.12} ${-r*.08}L${r*.62} ${r*.06}Z"/>`)};
    case 'skull':return {back:'',front:`<g fill="none" stroke="${g}" stroke-width="1.6" filter="url(#eyeglow)"><circle cx="${-r*.42}" cy="${-r*.12}" r="${r*.3}"/><circle cx="${r*.42}" cy="${-r*.12}" r="${r*.3}"/><path d="M${-r*.35} ${r*.62}v${r*.25}M0 ${r*.62}v${r*.28}M${r*.35} ${r*.62}v${r*.25}"/></g>`+eyes(`<circle cx="${-r*.42}" cy="${-r*.12}" r="${r*.1}"/><circle cx="${r*.42}" cy="${-r*.12}" r="${r*.1}"/>`)};
    case 'ponytail':return {back:`<path d="M${r*.5} ${-r*.85}Q${r*1.9} ${-r*1.1} ${r*2.3} ${r*.3}Q${r*2.2} ${r*1.2} ${r*1.7} ${r*1.6}Q${r*1.8} ${r*.4} ${r*.9} ${-r*.2}Z" fill="${I}"/>`,front:eyes(`<path d="M${-r*.75} ${-r*.15}Q${-r*.4} ${-r*.45} ${-r*.1} ${-r*.12}Q${-r*.4} ${r*.05} ${-r*.75} ${-r*.15}ZM${r*.75} ${-r*.15}Q${r*.4} ${-r*.45} ${r*.1} ${-r*.12}Q${r*.4} ${r*.05} ${r*.75} ${-r*.15}Z"/>`)};
    case 'bandana':return {back:`<path d="M${r*.85} ${-r*.45}Q${r*1.8} ${-r*.8} ${r*2.5} ${-r*.3}Q${r*1.7} ${-r*.3} ${r*1.2} ${-r*.05}Q${r*1.9} ${r*.2} ${r*2.3} ${r*.75}Q${r*1.5} ${r*.4} ${r*.9} ${-r*.05}Z" fill="${I}"/>`,front:eyes(`<path d="M${-r*.75} ${-r*.18}H${-r*.12}V${-r*.02}H${-r*.72}ZM${r*.75} ${-r*.18}H${r*.12}V${-r*.02}H${r*.72}Z"/>`)};
    case 'horns':return {back:`<path d="M${-r*.55} ${-r*.8}Q${-r*1.5} ${-r*1.1} ${-r*1.35} ${-r*2.1}Q${-r*1} ${-r*1.4} ${-r*.2} ${-r*1}ZM${r*.55} ${-r*.8}Q${r*1.5} ${-r*1.1} ${r*1.35} ${-r*2.1}Q${r} ${-r*1.4} ${r*.2} ${-r}Z" fill="${I}"/>`,front:eyes(`<path d="M${-r*.75} ${-r*.3}L${-r*.12} ${-r*.05}L${-r*.6} ${r*.05}ZM${r*.75} ${-r*.3}L${r*.12} ${-r*.05}L${r*.6} ${r*.05}Z"/>`)};
    case 'halo':return {back:`<ellipse cx="0" cy="${-r*1.18}" rx="${r*.9}" ry="${r*.22}" fill="none" stroke="${g}" stroke-width="2.4" filter="url(#eyeglow)"/>`,front:eyes(`<circle cx="${-r*.4}" cy="${-r*.1}" r="${r*.17}"/><circle cx="${r*.4}" cy="${-r*.1}" r="${r*.17}"/>`)};
    case 'flame':return {back:`<g filter="url(#eyeglow)"><path d="M${-r*.95} ${-r*.3}Q${-r*1.4} ${-r*1.3} ${-r*.7} ${-r*2}Q${-r*.6} ${-r*1.4} ${-r*.2} ${-r*1.3}Q${-r*.1} ${-r*2.2} ${r*.5} ${-r*2.5}Q${r*.3} ${-r*1.7} ${r*.75} ${-r*1.4}Q${r*1.2} ${-r*1.8} ${r*1.3} ${-r*1.2}Q${r*1.4} ${-r*.6} ${r*.95} ${-r*.3}Z" fill="${g}"/></g>`,front:eyes(`<circle cx="${-r*.4}" cy="${-r*.08}" r="${r*.14}" fill="#fff"/><circle cx="${r*.4}" cy="${-r*.08}" r="${r*.14}" fill="#fff"/>`)};
  }
  return {back:'',front:eyes(`<circle cx="${-r*.4}" cy="0" r="${r*.15}"/><circle cx="${r*.4}" cy="0" r="${r*.15}"/>`)}}
const eyeShade=(h,f)=>{const n=parseInt(h.slice(1),16),m=x=>Math.max(0,Math.min(255,Math.round(x+(255-x)*f)));return '#'+[n>>16,n>>8&255,n&255].map(x=>m(x).toString(16).padStart(2,'0')).join('')};
/* Tyler: panel colours come from the hero's disciplines and follow their ranks, so they change as a hero picks up new ones.
   One discipline sits on its primary (Tech blue, Innate orange, Magic purple). Two disciplines use that pair's own range
   (Tech+Innate green, Tech+Magic indigo, Innate+Magic magenta), slid toward whichever rank is higher. All three is a silver tint
   of the strongest one. Heroes in the same party with the same mix get small hue and lightness nudges apart; a hero with no
   look-alike keeps the plain colour. */
const EYE_PRI={tech:200,innate:22,magic:272},EYE_ORD=['tech','innate','magic'];
const EYE_MIX={'tech+innate':[162,88],'tech+magic':[214,258],'innate+magic':[348,298]};
const hslHex=(H,S,L)=>{H=(H%360+360)%360;const f=n=>{const k=(n+H/30)%12,a=S*Math.min(L,1-L);return Math.round(255*(L-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')};return '#'+f(0)+f(8)+f(4)};
function eyeMix(h){const r=h.ranks||{},ds=EYE_ORD.filter(d=>(r[d]||0)>0);if(!ds.length)ds.push(BASE(h).track||'innate');
  const key=ds.join('+');let H,S=.78,L=.42;
  if(ds.length===1)H=EYE_PRI[ds[0]];
  else if(ds.length===2){const[a,b]=EYE_MIX[key],t=(r[ds[1]]||0)/((r[ds[0]]||0)+(r[ds[1]]||0));H=a+(b-a)*t;L=.5-.12*t}
  else{const top=ds.reduce((x,y)=>(r[y]||0)>(r[x]||0)?y:x);H=EYE_PRI[top];S=.22;L=.5}
  return {key,H,S,L}}
const EYE_SPREAD=[[0,0],[-9,-.04],[9,.05],[-17,.08],[17,-.08],[-24,0]];
function eyeCols(h){const m=eyeMix(h),sd=S.sd,team=(sd&&sd.units?sd.units.map(heroOf):party()).filter(Boolean);
  const same=team.filter(x=>eyeMix(x).key===m.key).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  let dh=0,dl=0;if(same.length>1){const i=Math.max(0,same.indexOf(h)),n=same.length,sp=n===2?[[-8,-.04],[8,.05]]:EYE_SPREAD.slice(1,n+1).sort((a,b)=>a[0]-b[0]);[dh,dl]=sp[i]||[0,0]}
  const L=Math.max(.28,Math.min(.6,m.L+dl));
  return [hslHex(m.H+dh,m.S,L),hslHex(m.H+dh,Math.min(1,m.S+.2),m.S<.5?.82:.74)]}
function eyesArt(h,look){const b=BASE(h),[k,g]=eyeCols(h),[hp,tilt]=look||eyeLook(h),I=EYE_INK,r=20,cy=54,w=hp==='brute'?1.3:1;
  const sh=f=>`<path d="M${50-34*w} 104Q${50-32*w} 70 ${50-12*w} 66L50 70L${50+12*w} 66Q${50+32*w} 70 ${50+34*w} 104Z" fill="${f}"/>`,head=f=>`<ellipse rx="${r*(hp==='brute'?1.2:1)}" ry="${r*1.12}" fill="${f}"/>`,gear=eyeGear(hp,r,g);
  let s=`<rect width="100" height="100" fill="${I}"/><path d="M0 100L0 ${58-tilt}L100 ${30-tilt}L100 100Z" fill="${k}"/>`;
  for(let i=0;i<7;i++)s+=`<path d="M${-10+i*18} 100L${8+i*18} 0" stroke="${eyeShade(k,.25)}" stroke-width="${1+i%3}" opacity=".5"/>`;
  s+=`<rect width="100" height="100" fill="url(#eyedots)"/>`;
  return `<span class="eyes" aria-hidden="true"><svg viewBox="0 24 100 42" preserveAspectRatio="xMidYMid slice">${s+eyeFig(h,look,g)}</svg></span>`}
/* Version 137 (Tyler): the figure alone (glow outline + ink silhouette) in the eyes panel's 100x100 space, shared by the
   eyes panel and the standee board token. */
function eyeFig(h,look,g){const [hp,tilt]=look||eyeLook(h),I=EYE_INK,r=20,cy=54,w=hp==='brute'?1.3:1;
  const sh=f=>`<path d="M${50-34*w} 104Q${50-32*w} 70 ${50-12*w} 66L50 70L${50+12*w} 66Q${50+32*w} 70 ${50+34*w} 104Z" fill="${f}"/>`,head=f=>`<ellipse rx="${r*(hp==='brute'?1.2:1)}" ry="${r*1.12}" fill="${f}"/>`,gear=eyeGear(hp,r,g);
  let s=`<g transform="translate(-2.6 -1.6)">${sh(g)}<g transform="translate(50 ${cy}) rotate(${tilt})">${(gear.back+gear.front).replace(/#151821/g,g)}${head(g)}</g></g>`;
  s+=sh(I)+`<g transform="translate(50 ${cy}) rotate(${tilt})">${gear.back}${head(I)}${gear.front}</g>`;
  return s}
/* Version 137 (Tyler): hero board tokens are standees: the eyes-panel figure standing on a flat disc in the hero's colour,
   with health and composure bars on the disc. The box matches the hex's bounding box (1 : 2/sqrt3). */
function standee(h,o){const ko=o.ko,[k,g]=ko?['#596173','#9AA1B2']:eyeCols(h),f=x=>Math.max(0,Math.min(1,x));
  const hpF=f(h.hp/stat(h,'maxHp')),cpF=f(h.comp/Math.max(1,stat(h,'maxComp')));
  return `<svg class="hs" viewBox="0 0 100 115" aria-hidden="true"><ellipse cx="50" cy="92" rx="44" ry="11" fill="${k}" stroke="#151821" stroke-width="4"/><ellipse cx="50" cy="89.5" rx="35" ry="6" fill="${eyeShade(k,.3)}" opacity=".5"/><svg x="6" y="-12" width="88" height="104" viewBox="6 0 88 104">${eyeFig(h,null,g)}</svg><g stroke="#151821" stroke-width="1.6"><rect x="22" y="73.5" width="56" height="5.6" fill="#EDF0F4"/><rect x="22" y="73.5" width="${56*hpF}" height="5.6" fill="#2F8A4E"/><rect x="22" y="79.1" width="56" height="4" fill="#EDF0F4"/><rect x="22" y="79.1" width="${56*cpF}" height="4" fill="#3DB6DD"/></g></svg>`}
