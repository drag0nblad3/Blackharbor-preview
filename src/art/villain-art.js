/* art/villain-art.js: Lair looks, villain figures (VFIG), portraits and villain standees. */
/* Version 134 (Tyler): lair floors. The board takes the lair look of the fight's (first) villain; the tutorial patrol keeps the plain board.
   A wall is a band across its hex with one arm per neighbouring wall hex, so wall segments bend and run on in any direction. */
const LAIR_LOOK=['gallows','quarry','cantor','architect','helios','serpent','lode','noct','swarm','bomber','grid','mole'];
const lairCls=()=>{const sd=S.sd;return sd&&!sd.patrol&&LAIR_LOOK.includes(sd.vkey)?' lair L-'+sd.vkey:''};
function wallArms(x,y){const sd=S.sd,p=HC(x,y),ws=new Set((sd.walls||[]).map(w=>w.k));
  let a=nbrs({x,y}).filter(n=>inB(n.x,n.y)&&ws.has(n.x+','+n.y)).map(n=>{const q=HC(n.x,n.y);return Math.round(Math.atan2(q.cy-p.cy,q.cx-p.cx)*180/Math.PI)});
  if(!a.length)a=[0,180];else if(a.length===1)a.push(a[0]+180);
  const straight=a.length===2&&Math.abs(Math.abs(a[0]-a[1])-180)<2;
  return `<span class="wl">${straight?'':'<b></b>'}${a.map(d=>`<i style="--a:${d}deg"></i>`).join('')}</span>`}
/* Version 141 (Tyler): painted villain standees. VFIG[key](accent) draws a cel-shaded figure in the eyes-panel space
   (100 wide, feet on the bottom edge at y 104): base fills, a darker shade shape, a highlight, ink outlines and glowing
   accent parts. Swarm bodies use hive / sting / shell. A new villain needs a VFIG entry (it falls back to Mole Boy). */
const VFIG=(()=>{const K='#151821',ST=`stroke="${K}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const G=(c,s)=>`<g filter="url(#eyeglow)" fill="${c}">${s}</g>`;
const rays=(cx,cy,r0,r1,n,skip,f1,f2)=>Array.from({length:n},(_,i)=>{if(skip&&skip(i))return '';const a=(i*360/n-90)*Math.PI/180,w=Math.PI/n*.8,P=(r,t)=>`${(cx+Math.cos(t)*r).toFixed(1)} ${(cy+Math.sin(t)*r).toFixed(1)}`;
  return `<path d="M${P(r0,a-w)}L${P(r1,a)}L${P(r0,a+w)}Z" fill="${i%2?f2:f1}" ${ST}/>`}).join('');
const F={
 gallows:ac=>`
  <path d="M30 40L18 22L33 30L30 10L42 24L49 6L56 23L68 10L67 30L82 22L72 40Z" fill="#F4F5F2" ${ST}/>
  <path d="M56 23L68 10L67 30L82 22L72 40L62 36Z" fill="#C9CCD3"/>
  <path d="M8 104Q10 74 33 64L50 86L67 64Q90 74 92 104Z" fill="#E9EEE6" ${ST}/>
  <path d="M8 104Q10 74 33 64L38 72Q22 82 24 104Z" fill="#B9C4B3"/>
  <path d="M39 66L50 86L61 66L56 63H44Z" fill="#4E8F2A" ${ST}/>
  <path d="M45 72L50 78L55 72L50 75Z" fill="#2B5617" ${ST}/>
  <path d="M33 64L42 104M67 64L58 104" fill="none" ${ST}/>
  <circle cx="74" cy="84" r="3.4" fill="${ac}" opacity=".8"/><circle cx="26" cy="92" r="2.4" fill="${ac}" opacity=".7"/>
  <rect x="44" y="56" width="12" height="10" fill="#B9D18E" ${ST}/>
  <ellipse cx="50" cy="45" rx="17" ry="19" fill="#CFE3B0" ${ST}/>
  <path d="M56 28Q68 36 66 50Q64 60 54 64Q62 52 60 40Z" fill="#A9C487"/>
  <path d="M33 43H67" stroke="#3A3F2E" stroke-width="7"/>
  <circle cx="42" cy="43" r="7.6" fill="#3A3F2E" ${ST}/><circle cx="58" cy="43" r="7.6" fill="#3A3F2E" ${ST}/>
  ${G(ac,'<circle cx="42" cy="43" r="5"/><circle cx="58" cy="43" r="5"/>')}
  <circle cx="40" cy="41" r="1.6" fill="#fff"/><circle cx="56" cy="41" r="1.6" fill="#fff"/>
  <path d="M40 55Q50 63 60 55Q50 59 40 55Z" fill="#fff" ${ST}/><path d="M45 57V59.5M50 58V61M55 57V59.5" stroke="${K}" stroke-width="1.2"/>`,
 quarry:ac=>`
  <path d="M5 104L3 72L14 44L34 26L64 22L86 38L97 66L95 104Z" fill="#86684C" ${ST}/>
  <path d="M34 26L64 22L56 40L36 44Z" fill="#A88663"/><path d="M14 44L34 26L36 44L20 62Z" fill="#9C7C5B"/>
  <path d="M64 22L86 38L97 66L78 60L56 40Z" fill="#6E553E"/><path d="M78 60L97 66L95 104H70Z" fill="#5E4835"/>
  <path d="M3 72L20 62L26 104H5Z" fill="#6E553E"/>
  <path d="M34 26L36 44L56 40L64 22M14 44L20 62L36 44M56 40L78 60L97 66M20 62L26 104M78 60L70 104M36 44L40 70L60 72L56 40" fill="none" stroke="${K}" stroke-width="1.4" opacity=".55"/>
  <path d="M20 30Q26 24 32 28Q28 34 22 34Z" fill="#5C7A3A" ${ST}/><path d="M84 34Q90 32 92 40Q86 40 84 34Z" fill="#5C7A3A" ${ST}/>
  ${G(ac,`<path d="M30 50L45 56L31 59Z"/><path d="M70 50L55 56L69 59Z"/><path d="M38 76Q50 70 62 76L58 80Q50 76 42 80Z"/>
   <path d="M50 24L45 36L52 42L47 50" fill="none" stroke="${ac}" stroke-width="2.6"/><path d="M12 76L22 82L19 94" fill="none" stroke="${ac}" stroke-width="2.4"/><path d="M88 70L80 82L86 94" fill="none" stroke="${ac}" stroke-width="2.4"/>`)}`,
 architect:ac=>`
  <path d="M14 104L16 74L34 66H66L84 74L86 104Z" fill="#2F5D9E" ${ST}/>
  <path d="M14 104L16 74L34 66L38 104Z" fill="#244a80"/><path d="M62 66H66L84 74L86 82Q74 74 62 70Z" fill="#4A7BC0"/>
  <path d="M16 74L8 70L10 84L16 86ZM84 74L92 70L90 84L84 86Z" fill="#D9B44A" ${ST}/>
  <path d="M40 66L50 92L60 66Z" fill="#E9EEF5" ${ST}/><path d="M47 70L50 90L53 70Z" fill="#D9B44A" ${ST}/>
  <path d="M34 66L32 56L42 62ZM66 66L68 56L58 62Z" fill="#2F5D9E" ${ST}/>
  <path d="M50 4L41 32H46L50 16L54 32H59Z" fill="#D9B44A" ${ST}/><circle cx="50" cy="8" r="5" fill="#D9B44A" ${ST}/>
  <path d="M36 66L32 44L40 30H60L68 44L64 66Z" fill="#B8C6D8" ${ST}/>
  <path d="M60 30L68 44L64 66H54L58 44Z" fill="#8FA1B8"/><path d="M40 30H50L42 44L36 64L32 44Z" fill="#D6E0EC"/>
  <rect x="35" y="43" width="30" height="8" rx="3" fill="#13213A" ${ST}/>
  ${G(ac,'<rect x="38" y="45" width="24" height="4" rx="2"/>')}
  <path d="M42 58H58M44 62H56" stroke="${K}" stroke-width="1.4"/>`,
 helios:ac=>`
  <defs><radialGradient id="hlface" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#FFFDF0"/><stop offset=".55" stop-color="#FFE27A"/><stop offset="1" stop-color="#F6A623"/></radialGradient></defs>
  <circle cx="50" cy="42" r="40" fill="${ac}" opacity=".18" filter="url(#eyeglow)"/>
  ${rays(50,42,18,36,14,i=>i>=6&&i<=8,'#F6A623','#FFD45A')}
  <path d="M12 104Q14 74 34 68L50 72L66 68Q86 74 88 104Z" fill="#E08A12" ${ST}/>
  <path d="M12 104Q14 74 34 68L36 76Q24 84 26 104Z" fill="#B66C08"/><path d="M60 70L66 68Q80 72 85 86Q76 76 62 74Z" fill="#F6B54A"/>
  <path d="M36 70Q50 56 64 70L60 74Q50 66 40 74Z" fill="#B66C08" ${ST}/><rect x="43" y="58" width="14" height="12" fill="#F6A623" ${ST}/>
  <circle cx="50" cy="88" r="9" fill="#FFF3B0" ${ST}/>${rays(50,88,9,14,8,0,'#FFD45A','#FFD45A')}
  <circle cx="50" cy="42" r="19" fill="url(#hlface)" ${ST}/>
  <path d="M39 41Q43 37 47 41Q43 43 39 41ZM53 41Q57 37 61 41Q57 43 53 41Z" fill="${K}"/>
  <path d="M43 51Q50 55 57 51" fill="none" stroke="${K}" stroke-width="1.8"/>`,
 serpent:ac=>`
  <path d="M28 104Q24 80 32 64Q14 48 24 30Q36 16 50 16Q64 16 76 30Q86 48 68 64Q76 80 72 104Z" fill="#1E7F6C" ${ST}/>
  <path d="M28 104Q24 80 32 64Q14 48 24 30Q30 22 38 19Q26 40 40 62Q34 84 38 104Z" fill="#145E50"/>
  ${[[30,40],[70,40],[28,52],[72,52],[34,30],[66,30],[36,74],[64,74],[34,88],[66,88]].map(([x,y])=>`<path d="M${x-5} ${y}Q${x} ${y-6} ${x+5} ${y}Q${x} ${y+3} ${x-5} ${y}Z" fill="#2FA88E" opacity=".75"/>`).join('')}
  <path d="M40 104Q38 80 44 62H56Q62 80 60 104Z" fill="#E9DDB0" ${ST}/>
  <path d="M44 70H56M42 78H58M42 86H58M41 94H59" stroke="#B9A876" stroke-width="1.6"/>
  <path d="M36 44Q36 28 50 26Q64 28 64 44Q62 56 50 60Q38 56 36 44Z" fill="#279680" ${ST}/>
  <path d="M50 26Q64 28 64 44Q62 56 50 60Q58 48 56 30Z" fill="#1E7F6C"/>
  ${G(ac,'<ellipse cx="43" cy="40" rx="4.6" ry="2.6" transform="rotate(18 43 40)"/><ellipse cx="57" cy="40" rx="4.6" ry="2.6" transform="rotate(-18 57 40)"/>')}
  <path d="M43 37.6V42.4M57 37.6V42.4" stroke="${K}" stroke-width="1.4"/>
  <path d="M50 58V66L47 70M50 66L53 70" fill="none" stroke="#E23B3B" stroke-width="1.8"/>`,
 hive:ac=>`
  ${[[93,34,12,'#B07A0B'],[76,30,12,'#D9A03A'],[60,24,11,'#B07A0B'],[46,16,9,'#D9A03A'],[35,8,6,'#B07A0B']].map(([y,rx,ry,c])=>`<ellipse cx="50" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${ST}/><path d="M${50+rx*.4} ${y-ry*.8}Q${50+rx} ${y-ry*.2} ${50+rx*.7} ${y+ry*.6}" fill="none" stroke="#F3D27A" stroke-width="2" opacity=".7"/>`).join('')}
  <ellipse cx="50" cy="72" rx="8" ry="6" fill="#2a1a04" ${ST}/>${G(ac,'<circle cx="47" cy="71" r="1.8"/><circle cx="53" cy="71" r="1.8"/>')}
  <path d="M43 30L45.5 23L50 28L54.5 23L57 30Z" fill="#F1C02C" ${ST}/>
  ${[[16,42],[82,36],[88,60],[12,64],[28,24],[72,18]].map(([x,y])=>`<g transform="translate(${x} ${y})"><ellipse rx="4.4" ry="3" fill="#F1C02C" stroke="${K}" stroke-width="1.2"/><path d="M-1 -3V3M1.6 -2.8V2.8" stroke="${K}" stroke-width="1.2"/><ellipse cx="-1" cy="-4" rx="3" ry="2" fill="#fff" opacity=".7"/></g>`).join('')}`,
 sting:ac=>`
  <path d="M38 58Q8 30 4 52Q12 70 40 64Z" fill="#DDEBFF" opacity=".8" ${ST}/><path d="M62 58Q92 30 96 52Q88 70 60 64Z" fill="#DDEBFF" opacity=".8" ${ST}/>
  <ellipse cx="50" cy="72" rx="13" ry="16" fill="#B0306A" ${ST}/><path d="M38 68H62M38 78H62" stroke="${K}" stroke-width="4"/>
  <path d="M42 86Q50 108 58 86Z" fill="#7a1f49" ${ST}/>
  <ellipse cx="50" cy="48" rx="11" ry="9" fill="#B0306A" ${ST}/>${G(ac,'<circle cx="45" cy="47" r="3"/><circle cx="55" cy="47" r="3"/>')}
  <path d="M44 40L38 30M56 40L62 30" fill="none" ${ST}/>`,
 shell:ac=>`
  <path d="M26 56L10 48M26 72L8 72M26 88L10 98M74 56L90 48M74 72L92 72M74 88L90 98" stroke="${K}" stroke-width="5"/>
  <ellipse cx="50" cy="70" rx="26" ry="30" fill="#7A5AA8" ${ST}/><path d="M50 42V100" stroke="${K}" stroke-width="2"/>
  <path d="M34 52Q40 46 46 50Q40 60 34 64Z" fill="#B49AD8" opacity=".8"/>
  <ellipse cx="50" cy="38" rx="12" ry="9" fill="#4E3878" ${ST}/>${G(ac,'<circle cx="45" cy="37" r="3"/><circle cx="55" cy="37" r="3"/>')}`,
cantor:ac=>`
  <path d="M8 104Q10 72 34 64L50 90L66 64Q90 72 92 104Z" fill="#6A2C91" ${ST}/>
  <path d="M8 104Q10 72 34 64L40 74Q24 84 26 104Z" fill="#4E1F6C"/><path d="M60 66L66 64Q84 70 89 88Q78 74 62 70Z" fill="#8A45B5"/>
  <path d="M34 64L44 104M66 64L56 104" fill="none" ${ST}/>
  <path d="M40 66L50 90L60 66Z" fill="#F4EFE4" ${ST}/><path d="M44 70Q50 76 56 70L54 84Q50 88 46 84Z" fill="${ac}" ${ST}/>
  <path d="M22 66Q30 52 36 60L34 66ZM78 66Q70 52 64 60L66 66Z" fill="#3B1552" ${ST}/>
  <rect x="44" y="56" width="12" height="10" fill="#E6C3A0" ${ST}/>
  <ellipse cx="50" cy="46" rx="16" ry="18" fill="#EED2B4" ${ST}/>
  <path d="M57 30Q67 38 65 50Q62 60 54 63Q60 50 58 40Z" fill="#D9B48F"/>
  <path d="M42 55Q50 52 58 55Q54 58 50 56Q46 58 42 55Z" fill="#3B1552" ${ST}/>
  <path d="M26 34H74L70 30H30Z" fill="#3B1552" ${ST}/><path d="M34 30L36 4H64L66 30Z" fill="#4E1F6C" ${ST}/><path d="M35 24H65" stroke="${ac}" stroke-width="4"/>
  <path d="M38 40Q42 37 46 40M54 40Q58 37 62 40" fill="none" stroke="${K}" stroke-width="1.8"/>
  <circle cx="58" cy="45" r="6.4" fill="#2a0f3a" ${ST}/>
  ${G(ac,`<circle cx="42" cy="45" r="2.6"/><path d="M58 45m-4 0a4 4 0 1 0 4 -4a2.6 2.6 0 1 1 -2.6 2.6a1.3 1.3 0 1 0 1.3 1.3" fill="none" stroke="${ac}" stroke-width="1.5"/>`)}
  <path d="M64 48Q70 58 66 70" fill="none" stroke="${ac}" stroke-width="1.2"/>`,
 lode:ac=>`
  ${[[14,30,0],[86,26,30],[10,60,60],[90,58,15]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-5 -2H5V2H-5Z" fill="#9AA6B4" stroke="${K}" stroke-width="1.4"/><circle cx="-5" r="2.6" fill="#9AA6B4" stroke="${K}" stroke-width="1.4"/></g>`).join('')}
  <path d="M30 34Q30 4 50 4Q70 4 70 34H62Q62 14 50 14Q38 14 38 34Z" fill="${ac}" ${ST}/><path d="M30 34H38V26H30ZM62 34H70V26H62Z" fill="#D7DDE5" ${ST}/>
  <path d="M10 104L12 74L30 66H70L88 74L90 104Z" fill="#55606E" ${ST}/>
  <path d="M10 104L12 74L30 66L34 104Z" fill="#3F4853"/><path d="M66 66H70L88 74L89 84Q78 74 66 70Z" fill="#7A8696"/>
  <path d="M6 72Q8 58 30 60L32 74L10 80ZM94 72Q92 58 70 60L68 74L90 80Z" fill="#6B7787" ${ST}/>
  <circle cx="18" cy="70" r="2" fill="${K}"/><circle cx="82" cy="70" r="2" fill="${K}"/>
  <path d="M38 66L50 86L62 66Z" fill="#3F4853" ${ST}/>
  ${G(ac,'<path d="M44 74H56L50 82Z"/>')}
  <path d="M34 66L32 40Q32 28 50 28Q68 28 68 40L66 66Q58 72 50 72Q42 72 34 66Z" fill="#6B7787" ${ST}/>
  <path d="M56 29Q68 32 68 42L66 66Q60 70 56 71Q62 52 56 29Z" fill="#55606E"/>
  <path d="M36 44H64L62 52H38Z" fill="#1d2228" ${ST}/>
  ${G(ac,'<path d="M40 46H48L47 50H41ZM52 46H60L59 50H53Z"/>')}
  <path d="M42 58V66M46 58V67M50 58V68M54 58V67M58 58V66" stroke="${K}" stroke-width="1.4"/>`,
 noct:ac=>`
  <path d="M30 70L20 20M70 70L80 20" stroke="${K}" stroke-width="5"/><path d="M30 70L21 24M70 70L79 24" stroke="#C9D3E6" stroke-width="2.4"/>
  <path d="M6 104Q8 70 30 60Q26 40 34 22Q42 8 50 6Q58 8 66 22Q74 40 70 60Q92 70 94 104Z" fill="#2A2D52" ${ST}/>
  <path d="M6 104Q8 70 30 60Q26 40 34 22Q42 8 50 6Q40 30 40 60Q22 74 22 104Z" fill="#1E2040"/>
  <path d="M60 14Q70 30 68 58Q80 66 88 82Q76 70 64 66Q66 40 60 14Z" fill="#3D4175"/>
  <path d="M36 58Q34 34 50 26Q66 34 64 58Q58 64 50 64Q42 64 36 58Z" fill="#0b0c18" ${ST}/>
  <path d="M38 52Q50 46 62 52L60 62Q50 66 40 62Z" fill="#2A2D52" ${ST}/>
  <path d="M60 60Q72 70 70 86Q66 76 58 66Z" fill="#2A2D52" ${ST}/>
  ${G(ac,'<path d="M40 43L48 45L41 47Z"/><path d="M60 43L52 45L59 47Z"/>')}`,
 bomber:ac=>`
  <path d="M64 32Q84 34 84 56Q80 46 70 44Z" fill="#6B3A1E" ${ST}/>
  <path d="M10 104Q12 74 34 66L50 72L66 66Q88 74 90 104Z" fill="#C9402A" ${ST}/>
  <path d="M10 104Q12 74 34 66L38 74Q24 84 26 104Z" fill="#9A2E1C"/><path d="M60 68L66 66Q84 72 88 88Q76 76 62 72Z" fill="#E2664C"/>
  <path d="M34 66Q46 70 50 72Q54 70 66 66L64 74Q50 80 36 74Z" fill="#E9D7B8" ${ST}/>
  <path d="M22 74L78 100" stroke="#4A3018" stroke-width="7"/>
  ${[[34,80],[50,87],[66,94]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5.6" fill="#22252e" ${ST}/><path d="M${x+2} ${y-5}l2 -3" stroke="${K}" stroke-width="2"/>`).join('')}
  <rect x="44" y="56" width="12" height="10" fill="#D9A47E" ${ST}/>
  <ellipse cx="50" cy="46" rx="16" ry="18" fill="#EDBE96" ${ST}/>
  <path d="M57 30Q67 38 65 50Q62 60 54 63Q60 50 58 40Z" fill="#D9A47E"/>
  <path d="M32 46Q30 22 50 20Q70 22 68 46Q66 34 60 32H40Q34 34 32 46Z" fill="#7A4A26" ${ST}/>
  <path d="M30 44Q26 50 30 58L34 52ZM70 44Q74 50 70 58L66 52Z" fill="#7A4A26" ${ST}/>
  <path d="M34 34H66" stroke="#3A2A1a" stroke-width="5"/><circle cx="42" cy="32" r="6.4" fill="#3A2A1a" ${ST}/><circle cx="58" cy="32" r="6.4" fill="#3A2A1a" ${ST}/>
  <circle cx="42" cy="32" r="4" fill="#9FD3FF"/><circle cx="58" cy="32" r="4" fill="#9FD3FF"/><circle cx="40.6" cy="30.6" r="1.4" fill="#fff"/><circle cx="56.6" cy="30.6" r="1.4" fill="#fff"/>
  <circle cx="43" cy="46" r="2.2" fill="${K}"/><circle cx="57" cy="46" r="2.2" fill="${K}"/>
  <path d="M43 55Q50 59 58 53" fill="none" stroke="${K}" stroke-width="1.8"/>
  <path d="M84 70l4 -6" stroke="${K}" stroke-width="2"/><circle cx="80" cy="76" r="7" fill="#22252e" ${ST}/>
  ${G(ac,'<circle cx="89" cy="62" r="3.4"/>')}`,
 grid:ac=>`
  <path d="M28 66L22 18M72 66L78 18" stroke="${K}" stroke-width="5"/><path d="M28 66L22.6 22M72 66L77.4 22" stroke="#8FA1B8" stroke-width="2.4"/>
  ${G(ac,'<circle cx="22" cy="16" r="4"/><circle cx="78" cy="16" r="4"/>')}
  <path d="M10 104L12 76L32 66H68L88 76L90 104Z" fill="#1590B2" ${ST}/>
  <path d="M10 104L12 76L32 66L36 104Z" fill="#0E6D88"/><path d="M64 66H68L88 76L89 86Q78 76 64 70Z" fill="#3FB4D4"/>
  <path d="M42 68H58V104H42Z" fill="#222a33" ${ST}/>${G(ac,'<path d="M45 76H55M45 84H55M45 92H55" stroke="'+ac+'" stroke-width="1.8"/>')}
  <rect x="44" y="58" width="12" height="9" fill="#2a333a" ${ST}/>
  <rect x="32" y="26" width="36" height="34" rx="5" fill="#C7D1DB" ${ST}/>
  <path d="M58 26H63Q68 26 68 31V55Q68 60 63 60H58Z" fill="#9AA8B6"/>
  <rect x="36" y="34" width="28" height="18" rx="2" fill="#1a0a10" ${ST}/>
  ${G(ac,'<path d="M36 40H64M36 46H64M43 34V52M50 34V52M57 34V52" stroke="'+ac+'" stroke-width="1.3" fill="none"/><circle cx="43" cy="43" r="2.6"/><circle cx="57" cy="43" r="2.6"/>')}`,
 mole:ac=>`
  <path d="M14 104Q16 76 34 70L50 74L66 70Q84 76 86 104Z" fill="#4E79B8" ${ST}/>
  <path d="M14 104Q16 76 34 70L38 78Q26 86 28 104Z" fill="#3B5F94"/>
  <path d="M36 72V104M64 72V104" stroke="#7A4E2A" stroke-width="5"/><path d="M36 86H64V104H36Z" fill="#7A4E2A" ${ST}/>
  <circle cx="38" cy="88" r="2" fill="#F1C02C"/><circle cx="62" cy="88" r="2" fill="#F1C02C"/>
  <path d="M20 90Q24 86 28 92M70 96Q76 92 80 98" fill="none" stroke="#5a3a1c" stroke-width="2"/>
  <ellipse cx="50" cy="52" rx="18" ry="17" fill="#E9BF97" ${ST}/>
  <path d="M58 38Q70 46 66 58Q62 66 54 68Q62 56 60 46Z" fill="#D5A47A"/>
  <circle cx="38" cy="58" r="3" fill="#7A4E2A" opacity=".5"/><circle cx="64" cy="60" r="2.2" fill="#7A4E2A" opacity=".5"/>
  <path d="M28 44Q28 22 50 22Q72 22 72 44Z" fill="#F1C02C" ${ST}/><path d="M24 44H76" ${ST} fill="none"/><path d="M58 24Q70 28 71 44H62Q62 32 58 24Z" fill="#D9A60F"/>
  <rect x="43" y="26" width="14" height="11" rx="3" fill="#4A3018" ${ST}/>
  ${G(ac,'<circle cx="50" cy="31.5" r="4.4" fill="#FFF6C8"/>')}
  <circle cx="42" cy="51" r="6" fill="#fff" ${ST}/><circle cx="58" cy="51" r="6" fill="#fff" ${ST}/><circle cx="43" cy="52" r="2.6" fill="${K}"/><circle cx="57" cy="52" r="2.6" fill="${K}"/>
  <path d="M42 61Q50 67 58 61" fill="none" stroke="${K}" stroke-width="1.8"/><path d="M47 62.5H53V67H47Z" fill="#fff" stroke="${K}" stroke-width="1.2"/>`};
return F})();
/* Villain portrait plates, based on canonical painted VFIG villain art.
   Self-contained vector illustrations: no remote images, no extra load or save changes.
   ID scoping keeps gradients and glows independent across simultaneous dossiers. */
const VPR_SHEET={gallows:[0,0],quarry:[1,0],cantor:[2,0],architect:[3,0],
  helios:[0,1],serpent:[1,1],lode:[2,1],noct:[3,1],
  swarm:[0,2],bomber:[1,2],grid:[2,2],mole:[3,2]};
/* Comic-cover crops (VILLAIN_COVERS, villain-covers.js): face centre in 320x480 thumb space.
   Small plates crop tight on the face from the thumb; dossier and investigation
   plates take a wider upper-body crop from the full cover. */
const VPR_FACE={gallows:[149,128],quarry:[194,116],cantor:[135,160],architect:[140,155],
  helios:[160,128],serpent:[142,152],lode:[187,135],noct:[174,209],
  swarm:[175,122],bomber:[165,135],grid:[165,145],mole:[150,210]};
function vprCover(k,variant){
  const art=typeof VILLAIN_COVERS!=='undefined'&&VILLAIN_COVERS[k],f=VPR_FACE[k];
  if(!art||!f)return null;
  const big=variant==='card'||variant==='investigation',w=big?170:110,h=w*116/160,dy=big?12:0;
  const x=Math.min(Math.max(f[0]-w/2,0),320-w),y=Math.min(Math.max(f[1]+dy-h/2,0),480-h);
  return {src:big?art.cover:art.thumb,box:[x,y,w,h].map(n=>+n.toFixed(1)).join(' ')};
}
let VPR_SEQ=0;
function vPortrait(k,variant='card'){
  const d=VILLAINS[k];
  if(!d)return '';
  const key=vKey(k),colors=VART[k]||VART.mole,base=colors[0],accent=colors[1];
  const cover=vprCover(k,variant);
  const n=++VPR_SEQ,id='vpr'+n,gid=id+'g',bgid=id+'b',dotid=id+'d',faceid=id+'f';
  const pieces=(VFIG[key]||VFIG.mole)(accent)
    .replace(/url\(#eyeglow\)/g,'url(#'+gid+')')
    .replace(/id="hlface"/g,'id="'+faceid+'"')
    .replace(/url\(#hlface\)/g,'url(#'+faceid+')');
  const motif={
    gallows:'<path d="M10 99V45h7v54m130 0V24h-10v75" stroke="#b8ffd7" stroke-width="3" fill="none" opacity=".65"/><circle cx="20" cy="22" r="12" fill="none" stroke="#c3ff84" stroke-width="3"/><circle cx="139" cy="56" r="16" fill="none" stroke="#c3ff84" stroke-width="3"/>',
    quarry:'<path d="M0 94L24 64L36 83L57 42L75 76L102 45L140 84L160 66V120H0Z" fill="#a0784b" opacity=".55"/><path d="M0 99L24 64L36 83L57 42L75 76L102 45L140 84L160 66" fill="none" stroke="#e5b775" stroke-width="2"/>',
    cantor:'<path d="M10 20H150M19 11H141M5 96H155" fill="none" stroke="#ffe18b" stroke-width="3" opacity=".57"/><path d="M122 16Q151 42 122 69Q95 50 122 16Z" fill="none" stroke="#f5c948" stroke-width="2.5"/>',
    architect:'<path d="M0 34H160M0 68H160M27 0V116M92 0V116M132 0V116" stroke="#b5e7ff" stroke-width="1.6" opacity=".6"/><path d="M0 98L36 58L67 85L95 42L160 89" fill="none" stroke="#ffe18b" stroke-width="3"/>',
    helios:'<circle cx="80" cy="47" r="70" stroke="#ffe7aa" stroke-width="4" fill="none" opacity=".7"/><circle cx="80" cy="47" r="54" stroke="#ffe7aa" stroke-width="2" fill="none" opacity=".8"/>',
    serpent:'<path d="M15 108C-4 86 12 25 46 34C70 43 84 7 150 17" fill="none" stroke="#93f9d9" stroke-width="8" opacity=".38"/><path d="M18 106C5 77 47 64 67 79S128 113 160 61" fill="none" stroke="#031e25" stroke-width="8" opacity=".5"/>',
    lode:'<path d="M10 18H150M10 100H150" stroke="#d6f3ff" stroke-width="4" stroke-dasharray="9 5" opacity=".7"/><path d="M34 6Q8 58 30 112M126 6Q152 58 130 112" stroke="#a0d7e8" stroke-width="3" fill="none"/>',
    noct:'<path d="M0 115L43 20L52 115M108 115L118 12L160 115" stroke="#b0a4f9" stroke-width="4" opacity=".44" fill="none"/><path d="M0 66L160 26M0 88L160 48" stroke="#ffffff" stroke-width="2" opacity=".18"/>',
    swarm:'<g fill="#ffe580" opacity=".65"><circle cx="16" cy="22" r="7"/><circle cx="142" cy="35" r="5"/><circle cx="22" cy="93" r="8"/><circle cx="134" cy="87" r="9"/><circle cx="110" cy="11" r="4"/></g>',
    bomber:'<path d="M18 12L36 35M142 12L124 35M0 83L32 74M160 83L128 74" fill="none" stroke="#ffe28a" stroke-width="6"/><circle cx="134" cy="22" r="16" fill="#2b292e" stroke="#ffc24c" stroke-width="4"/>',
    grid:'<path d="M0 21H160M0 54H160M0 87H160M20 0V116M53 0V116M86 0V116M119 0V116M152 0V116" fill="none" stroke="#a6ffff" stroke-width="2" opacity=".5"/>',
    mole:'<path d="M0 99L22 80L41 95L65 76L84 94L117 69L160 91V120H0Z" fill="#5e4930" opacity=".8"/><path d="M0 98L22 80L41 95L65 76L84 94L117 69L160 91" stroke="#f5d18b" stroke-width="3" fill="none"/>'
  }[k]||'';
  return `<svg class="vportrait vportrait-${variant} vportrait-${k}" viewBox="0 0 160 116"
    role="img" aria-label="${d.name.replace(/"/g,'&quot;')} portrait" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${bgid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${base}" offset="0"/><stop stop-color="#172238" offset=".9"/></linearGradient>
      <pattern id="${dotid}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${accent}" opacity=".42"/></pattern>
      <filter id="${gid}" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6" result="halo"/><feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="160" height="116" fill="url(#${bgid})"/>
    <path d="M0 0H160V116H0Z" fill="url(#${dotid})" opacity=".88"/>
    <path d="M0 116V76L14 84V41H25V69H38V49H51V77H66V25H79V67H95V44H108V77H121V55H136V40H148V73L160 62V116Z" fill="#0e2335" opacity=".65"/>
    <path d="M0 0L95 0L10 116H0Z" fill="#fff5be" opacity=".12"/>
    ${motif}
    <svg x="22" y="-4" width="116" height="125" viewBox="0 0 100 104" overflow="hidden">${pieces}</svg>
    ${cover?`<svg class="vportrait-crop vportrait-cover" x="0" y="0" width="160" height="116"
      viewBox="${cover.box}" preserveAspectRatio="xMidYMid slice" overflow="hidden">
        <image href="${cover.src}" x="0" y="0" width="320" height="480"
          preserveAspectRatio="none" aria-hidden="true" decoding="async"/>
      </svg>`:VPR_SHEET[k]?`<svg class="vportrait-crop" x="0" y="0" width="160" height="116"
      viewBox="${VPR_SHEET[k][0]*176+3} ${VPR_SHEET[k][1]*148+3} 169 140"
      preserveAspectRatio="none" overflow="hidden">
        <image href="villain-portraits.avif" x="0" y="0" width="704" height="444"
          preserveAspectRatio="none" aria-hidden="true"/>
      </svg>`:''}
    <path d="M0 115H160" stroke="${accent}" stroke-width="5"/>
    <path d="M0 1H160V115H0Z" stroke="#111f30" stroke-width="3" fill="none"/>
  </svg>`;
}
const VHX=(cx,cy,k=1)=>Array.from({length:6},(_,i)=>{const a=(-90+60*i)*Math.PI/180;return (cx+Math.cos(a)*HS*k).toFixed(3)+','+(cy+Math.sin(a)*HS*k).toFixed(3)}).join(' ');
/* The standee SVG spans the footprint's bounding box in board units, placed relative to the anchor hex (ax,ay) that the
   .vtok box sits on. One-hex villains stand a little taller than their hex like hero standees; 4-hex villains are scaled
   to stay inside their hexes, and the 7-hex Quarry may rise slightly above its top row. Ouroboros's body is coils. */
function vStandee(k,cells,body,lvl,ax,ay,sw,hid){const [b,ac]=VART[k]||VART.mole,I='#151821',R=n=>+n.toFixed(3),A=HC(ax,ay);
  const all=body?cells.concat(body):cells,hs=all.map(c=>HC(c.x,c.y)),fs=cells.map(c=>HC(c.x,c.y)),mn=(a,f)=>Math.min(...a.map(f)),mx=(a,f)=>Math.max(...a.map(f));
  const x0=mn(hs,h=>h.cx)-.5,x1=mx(hs,h=>h.cx)+.5,y0=mn(hs,h=>h.cy)-HS,y1=mx(hs,h=>h.cy)+HS;
  const cx=fs.reduce((t,h)=>t+h.cx,0)/fs.length,cy=fs.reduce((t,h)=>t+h.cy,0)/fs.length,gw=mx(fs,h=>h.cx)-mn(fs,h=>h.cx)+1,gh=mx(fs,h=>h.cy)-mn(fs,h=>h.cy)+2*HS,gy0=mn(fs,h=>h.cy)-HS;
  const multi=cells.length>1;let s=fs.map(h=>`<polygon points="${VHX(h.cx,h.cy,.9)}" fill="rgba(0,0,0,.34)" stroke="${ac}" stroke-width=".035" stroke-dasharray=".08 .07"/>`).join('');
  if(body)s+='<g filter="url(#erim)">';if(body)body.map((c,j)=>({h:HC(c.x,c.y),j})).sort((p,q)=>p.h.cy-q.h.cy).forEach(({h,j})=>{const r=Math.max(.3,.5-j*.035);
    s+=`<g transform="translate(${R(h.cx)} ${R(h.cy+.12)})"><ellipse cy=".2" rx="${R(r*.95)}" ry=".14" fill="rgba(0,0,0,.45)"/><path d="M${R(-r)} .16A${R(r)} ${R(r*1.05)} 0 0 1 ${R(r)} .16Z" fill="${b}" stroke="${I}" stroke-width=".04"/><path d="M${R(-r*.75)} .1A${R(r*.75)} ${R(r*.7)} 0 0 1 ${R(r*.2)} ${R(-r*.62)}" fill="none" stroke="#2FA88E" stroke-width=".07"/><path d="M${R(-r*.5)} .16A${R(r*.5)} ${R(r*.3)} 0 0 1 ${R(r*.5)} .16" fill="${j>=4?'#F3CB4B':'#E9DDB0'}" stroke="${I}" stroke-width=".03"/></g>`});if(body)s+='</g>';
  const bw=multi?gw*.86:1.08,by=multi?cy+gh*.24:cy+HS*.6,ry=multi?.16+gh*.05:.14;
  let fw=multi?bw*.92:(sw?.98:1.14),fh=fw*1.04;
  if(multi){const top=gy0-(cells.length>4?.25:.04),mh=by+ry*.25-top;if(fh>mh){fh=mh;fw=fh/1.04}}
  s+=`<ellipse cx="${R(cx)}" cy="${R(by+.03)}" rx="${R(bw/2)}" ry="${R(ry)}" fill="rgba(0,0,0,.45)"/><g filter="url(#erim)"><ellipse cx="${R(cx)}" cy="${R(by)}" rx="${R(bw/2)}" ry="${R(ry)}" fill="${b}" stroke="${ac}" stroke-width=".1"/><ellipse cx="${R(cx)}" cy="${R(by)}" rx="${R(bw/2)}" ry="${R(ry)}" fill="none" stroke="${I}" stroke-width=".04"/><ellipse cx="${R(cx)}" cy="${R(by-ry*.22)}" rx="${R(bw*.4)}" ry="${R(ry*.55)}" fill="${eyeShade(b,.3)}" opacity=".5"/>`;
  s+=`<svg x="${R(cx-fw/2)}" y="${R(by+ry*.25-fh)}" width="${R(fw)}" height="${R(fh)}" viewBox="0 0 100 104" overflow="visible">${(VFIG[k]||VFIG.mole)(ac)}</svg></g>`;
  if(lvl){const lx=cx+bw/2*.55,ly=by+ry*.35,z=.17;s+=`<g transform="translate(${R(lx)} ${R(ly)})"><rect x="${-z*1.15}" y="${R(-z*.72)}" width="${R(z*2.3)}" height="${R(z*1.44)}" rx="${R(z*.72)}" fill="${I}" stroke="#fff" stroke-width=".03"/><text y="${R(z*.42)}" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size="${R(z*1.15)}" fill="#fff">L${lvl}</text></g>`}
  return `<svg class="vs${hid?' hid':''}" viewBox="${R(x0)} ${R(y0)} ${R(x1-x0)} ${R(y1-y0)}" style="left:${R((x0-A.cx+.5)*100)}%;top:${R((y0-A.cy+HS)*100/(2*HS))}%;width:${R((x1-x0)*100)}%;height:${R((y1-y0)*100/(2*HS))}%" aria-hidden="true">${s}</svg>`}
