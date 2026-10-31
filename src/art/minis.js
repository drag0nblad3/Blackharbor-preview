/* art/minis.js: Painted minis, civilians, bombs and board pieces. */
/* Version 142 (Tyler): painted minis for henchmen and civilians, painted bombs, terminal and exit chevrons, all in the
   standee style. MINI_HF[owner](body,accent) draws a henchman, civArt(n) one of five bystanders (arms up when panicking).
   Drawings use the eyes-panel space (100 x 104, feet on the bottom edge). */
const MINI=(()=>{const K='#151821',ST=`stroke="${K}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`,R=n=>+n.toFixed(3);
const G=(c,s)=>`<g filter="url(#eyeglow)" fill="${c}">${s}</g>`,sh=(h,f)=>{const n=parseInt(h.slice(1),16),q=x=>Math.max(0,Math.min(255,Math.round(f>0?x+(255-x)*f:x*(1+f))));return '#'+[n>>16,n>>8&255,n&255].map(x=>q(x).toString(16).padStart(2,'0')).join('')};
const HF={
 gallows:(b,a)=>`<path d="M50 30V20M38 18H62" stroke="${K}" stroke-width="3"/><ellipse cx="50" cy="16" rx="16" ry="3.6" fill="#9AA6B4" ${ST}/>
  <circle cx="50" cy="56" r="28" fill="${b}" ${ST}/><path d="M66 36Q78 50 74 68Q68 80 54 84Q72 64 66 36Z" fill="${sh(b,-.3)}"/><path d="M30 46Q34 34 46 30" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
  <circle cx="50" cy="56" r="15" fill="#F4F5F2" ${ST}/>${G(a,'<circle cx="50" cy="56" r="7"/>')}<circle cx="50" cy="56" r="3" fill="${K}"/>
  <ellipse cx="50" cy="100" rx="16" ry="3" fill="rgba(0,0,0,.35)"/>`,
 quarry:(b,a)=>`<path d="M70 50L92 20M84 14Q96 22 98 32L88 26Z" fill="#9AA6B4" stroke="${K}" stroke-width="4"/>
  <path d="M16 104Q16 70 34 64H66Q84 70 84 104Z" fill="#C46A2B" ${ST}/><path d="M16 104Q16 70 34 64L38 74Q28 84 30 104Z" fill="#9A4F1C"/>
  <path d="M34 64L40 104M66 64L60 104" fill="none" stroke="#F3CB4B" stroke-width="4"/>
  <ellipse cx="50" cy="48" rx="17" ry="17" fill="#E2B48C" ${ST}/><path d="M36 54Q50 70 64 54Q60 66 50 68Q40 66 36 54Z" fill="#6B4A2E" ${ST}/>
  <path d="M30 40Q30 22 50 22Q70 22 70 40Z" fill="#F1C02C" ${ST}/><path d="M26 40H74" ${ST}/><rect x="45" y="25" width="10" height="8" rx="2" fill="#4A3018"/>${G(a,'<circle cx="50" cy="29" r="3"/>')}
  <circle cx="43" cy="47" r="2.2" fill="${K}"/><circle cx="57" cy="47" r="2.2" fill="${K}"/>`,
 architect:(b,a)=>`<path d="M50 10V22" stroke="${K}" stroke-width="3"/>${G(a,'<circle cx="50" cy="9" r="4"/>')}
  <rect x="28" y="22" width="44" height="30" rx="4" fill="#8FB4E0" ${ST}/><rect x="34" y="30" width="32" height="12" rx="3" fill="#13213A" ${ST}/>${G(a,'<rect x="37" y="33" width="26" height="6" rx="3"/>')}
  <rect x="22" y="56" width="56" height="34" rx="4" fill="${b}" ${ST}/><path d="M24 58H76V64H24Z" fill="${sh(b,.25)}"/><circle cx="50" cy="73" r="7" fill="#D9B44A" ${ST}/>
  <path d="M30 90V104M70 90V104" stroke="${K}" stroke-width="7"/><path d="M30 90V104M70 90V104" stroke="#8FB4E0" stroke-width="3.6"/>
  <path d="M22 62L10 80M78 62L90 80" stroke="${K}" stroke-width="7"/><path d="M22 62L10 80M78 62L90 80" stroke="#8FB4E0" stroke-width="3.6"/>`,
 helios:(b,a)=>`<path d="M50 6Q66 26 74 46Q82 70 66 90Q58 100 50 100Q42 100 34 90Q18 70 26 46Q30 36 36 30Q38 44 44 46Q40 26 50 6Z" fill="#F08A24" ${ST}/>
  <path d="M50 30Q62 48 64 64Q66 84 50 90Q34 84 38 64Q40 54 46 46Q48 56 52 56Q48 42 50 30Z" fill="#FFD45A"/>
  <path d="M50 58Q58 66 58 76Q56 86 50 86Q44 86 42 76Q42 66 50 58Z" fill="#FFF3B0"/>
  <ellipse cx="44" cy="68" rx="3" ry="4.6" fill="${K}"/><ellipse cx="56" cy="68" rx="3" ry="4.6" fill="${K}"/>`,
 serpent:(b,a)=>`<path d="M20 104Q18 66 30 44Q36 24 50 20Q64 24 70 44Q82 66 80 104Z" fill="${b}" ${ST}/>
  <path d="M20 104Q18 66 30 44Q36 24 50 20Q40 40 40 70Q38 90 40 104Z" fill="${sh(b,-.3)}"/>
  <path d="M36 52Q36 34 50 32Q64 34 64 52Q58 60 50 60Q42 60 36 52Z" fill="#081a16" ${ST}/>${G(a,'<ellipse cx="44" cy="47" rx="3" ry="2"/><ellipse cx="56" cy="47" rx="3" ry="2"/>')}
  <path d="M50 64V100" stroke="#F3CB4B" stroke-width="3"/><path d="M44 72Q50 78 56 72" fill="none" stroke="#F3CB4B" stroke-width="2.4"/>`,
 bomber:(b,a)=>`<path d="M18 104Q18 72 36 66H64Q82 72 82 104Z" fill="#5D6B4A" ${ST}/><path d="M18 104Q18 72 36 66L40 74Q30 86 32 104Z" fill="#46523A"/>
  ${[30,40,50,60,70].map(x=>`<rect x="${x-3}" y="74" width="6" height="16" rx="2" fill="#C9402A" stroke="${K}" stroke-width="1.6"/>`).join('')}<path d="M24 82H76" stroke="#3A2A1a" stroke-width="3"/>
  <ellipse cx="50" cy="48" rx="16" ry="17" fill="#D9A47E" ${ST}/><path d="M32 46Q32 26 50 26Q68 26 68 46Z" fill="#6B7A4A" ${ST}/><path d="M28 46H72" ${ST}/>
  <rect x="38" y="44" width="24" height="8" rx="3" fill="#2a2a2a" ${ST}/>${G(a,'<rect x="40" y="46" width="8" height="4" rx="2"/><rect x="52" y="46" width="8" height="4" rx="2"/>')}
  <path d="M44 60Q50 63 56 60" fill="none" stroke="${K}" stroke-width="2"/>`,
 swarm:(b,a)=>`<path d="M28 70L12 62M28 82L10 84M28 94L14 104M72 70L88 62M72 82L90 84M72 94L86 104" stroke="${K}" stroke-width="4"/>
  <ellipse cx="50" cy="78" rx="24" ry="22" fill="${b}" ${ST}/><path d="M50 58V100" stroke="${K}" stroke-width="2"/><path d="M34 66Q40 60 46 64Q40 74 34 78Z" fill="#F3D27A" opacity=".7"/>
  <ellipse cx="50" cy="52" rx="13" ry="10" fill="#4A3104" ${ST}/>${G(a,'<circle cx="45" cy="51" r="3"/><circle cx="55" cy="51" r="3"/>')}<path d="M44 44L36 32M56 44L64 32" fill="none" ${ST}/>`,
 cantor:(b,a)=>`<path d="M16 104Q16 72 34 66H66Q84 72 84 104Z" fill="#3B1552" ${ST}/><path d="M16 104Q16 72 34 66L38 74Q28 84 30 104Z" fill="#2a0f3a"/>
  <path d="M40 66L50 84L60 66Z" fill="#F4EFE4" ${ST}/><path d="M47 70L50 82L53 70Z" fill="${a}" ${ST}/>
  <ellipse cx="50" cy="50" rx="16" ry="17" fill="#D9A47E" ${ST}/><path d="M38 58Q50 68 62 58Q60 66 50 68Q40 66 38 58Z" fill="#5a4a40" opacity=".55"/>
  <rect x="35" y="44" width="30" height="8" rx="3" fill="${K}"/><path d="M26 40H74L68 34H32Z" fill="${b}" ${ST}/><path d="M34 34Q34 20 50 20Q66 20 66 34Z" fill="${b}" ${ST}/><path d="M34 31H66" stroke="${a}" stroke-width="3"/>
  <path d="M78 82H96V88H84V96H78Z" fill="#3a3f4a" ${ST}/>`,
 lode:(b,a)=>`<circle cx="50" cy="56" r="28" fill="#7A8696" ${ST}/>${[[30,40,'#9AA6B4'],[62,34,'#55606E'],[70,62,'#9AA6B4'],[36,70,'#55606E'],[50,52,'#6B7787']].map(([x,y,c])=>`<path d="M${x-9} ${y-6}L${x+8} ${y-8}L${x+10} ${y+6}L${x-6} ${y+8}Z" fill="${c}" stroke="${K}" stroke-width="1.6"/>`).join('')}
  <path d="M38 22Q38 8 50 8Q62 8 62 22H56Q56 14 50 14Q44 14 44 22Z" fill="${a}" ${ST}/><path d="M38 22H44V18H38ZM56 22H62V18H56Z" fill="#D7DDE5" stroke="${K}" stroke-width="1.6"/>
  <circle cx="50" cy="56" r="9" fill="#1d2228" ${ST}/>${G(a,'<circle cx="50" cy="56" r="4.6"/>')}<ellipse cx="50" cy="100" rx="16" ry="3" fill="rgba(0,0,0,.35)"/>`,
 noct:(b,a)=>`<path d="M22 104L28 92L34 102L40 90L46 102L52 90L58 102L64 90L70 102L76 92L80 104Q86 60 70 36Q60 20 50 20Q40 20 30 36Q14 60 22 104Z" fill="${b}" ${ST}/>
  <path d="M30 36Q40 20 50 20Q40 40 40 70L34 98L28 92L22 104Q14 60 30 36Z" fill="${sh(b,-.35)}"/>
  <path d="M36 52Q36 36 50 34Q64 36 64 52Q58 60 50 60Q42 60 36 52Z" fill="#05060d" ${ST}/>${G(a,'<path d="M40 47L48 49L41 51Z"/><path d="M60 47L52 49L59 51Z"/>')}`,
 grid:(b,a)=>`<path d="M50 6L74 40L50 92L26 40Z" fill="#7FD6EE" ${ST}/><path d="M50 6L74 40L50 92Z" fill="${b}"/><path d="M26 40H74M50 6V92" stroke="${K}" stroke-width="1.6"/><path d="M34 34L50 12" stroke="#fff" stroke-width="3" opacity=".7"/>
  ${G(a,'<circle cx="50" cy="40" r="5"/>')}<ellipse cx="50" cy="101" rx="14" ry="3" fill="rgba(0,0,0,.35)"/>`,
 mole:(b,a)=>`<path d="M18 104Q16 70 30 56Q40 46 50 46Q60 46 70 56Q84 70 82 104Z" fill="${b}" ${ST}/><path d="M18 104Q16 70 30 56L36 64Q26 80 30 104Z" fill="${sh(b,-.3)}"/>
  <ellipse cx="50" cy="84" rx="16" ry="14" fill="#C9A27A" opacity=".8"/>
  <path d="M20 86L8 80M20 92L8 94M80 86L92 80M80 92L92 94" stroke="${K}" stroke-width="4"/><path d="M14 84Q6 90 12 96M86 84Q94 90 88 96" fill="none" stroke="#E9E4D8" stroke-width="3"/>
  <ellipse cx="50" cy="66" rx="8" ry="6" fill="#E88A9A" ${ST}/><circle cx="41" cy="56" r="3" fill="${K}"/><circle cx="59" cy="56" r="3" fill="${K}"/>
  <path d="M30 50Q30 30 50 30Q70 30 70 50Z" fill="#F1C02C" ${ST}/><path d="M26 50H74" ${ST}/>${G(a,'<circle cx="50" cy="38" r="3.4"/>')}`
};
const CIV=[['#3D7BD9','#6B4A2E','#F0C8A0','short'],['#2F9E6B','#2a1f17','#C98E62','long'],['#D24B3E','#E8C25A','#F2D2B4','bun'],['#5D6472','#9a9aa0','#E0B48E','bald'],['#8C4FC9','#1d1d22','#8A5A3C','curly']];
function civArt(i,{panic=false}={}){const [shirt,hair,skin,st]=CIV[i%CIV.length];
  const arms=panic?`<path d="M28 74L14 40M72 74L86 40" stroke="${K}" stroke-width="11" stroke-linecap="round"/><path d="M28 74L14 40M72 74L86 40" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/><circle cx="14" cy="38" r="5" fill="${skin}" ${ST}/><circle cx="86" cy="38" r="5" fill="${skin}" ${ST}/>`:'';
  const hb=st==='long'?`<path d="M30 52Q28 28 50 26Q72 28 70 52L70 70Q60 64 62 50H38Q40 64 30 70Z" fill="${hair}" ${ST}/>`:'';
  const ht={short:`<path d="M32 46Q32 26 50 26Q68 26 68 46Q62 34 50 36Q40 34 32 46Z" fill="${hair}" ${ST}/>`,long:`<path d="M32 46Q34 28 50 28Q66 28 68 46Q60 36 50 38Q40 36 32 46Z" fill="${hair}" ${ST}/>`,
    bun:`<circle cx="50" cy="22" r="8" fill="${hair}" ${ST}/><path d="M32 46Q32 28 50 28Q68 28 68 46Q60 36 50 36Q40 36 32 46Z" fill="${hair}" ${ST}/>`,bald:`<path d="M32 50Q30 40 34 38M68 50Q70 40 66 38" fill="none" stroke="${hair}" stroke-width="4"/>`,
    curly:[[36,34],[44,28],[52,26],[60,30],[66,38],[34,42]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="${hair}" ${ST}/>`).join('')}[st];
  const mouth=panic?`<ellipse cx="50" cy="58" rx="4" ry="5" fill="${K}"/>`:`<path d="M44 57Q50 61 56 57" fill="none" stroke="${K}" stroke-width="2"/>`;
  return `${arms}${hb}<path d="M20 104Q20 74 36 70H64Q80 74 80 104Z" fill="${shirt}" ${ST}/><path d="M20 104Q20 74 36 70L40 78Q30 88 32 104Z" fill="${sh(shirt,-.3)}"/>
   <circle cx="50" cy="48" r="17" fill="${skin}" ${ST}/>${ht}<circle cx="44" cy="48" r="2.4" fill="${K}"/><circle cx="56" cy="48" r="2.4" fill="${K}"/>${mouth}${panic?`<path d="M70 34q4 6 0 9q-4-3 0-9Z" fill="#7cc8ff" stroke="${K}" stroke-width="1.4"/>`:''}`}

function bomb(cx,cy,fuse,hot){const id='bm'+Math.round(cx*100)+'_'+Math.round(cy*100);
  return `<ellipse cx="${R(cx)}" cy="${R(cy+.27)}" rx=".3" ry=".08" fill="rgba(0,0,0,.45)"/>${hot?`<circle cx="${R(cx)}" cy="${R(cy+.03)}" r=".4" fill="#E23B3B" opacity=".35" filter="url(#eyeglow)" class="emhot"/>`:''}
   <defs><radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#5a6070"/><stop offset=".5" stop-color="#262a35"/><stop offset="1" stop-color="#0d0f15"/></radialGradient></defs>
   <circle cx="${R(cx)}" cy="${R(cy+.04)}" r=".27" fill="url(#${id})" stroke="${K}" stroke-width=".035"/><ellipse cx="${R(cx-.09)}" cy="${R(cy-.07)}" rx=".07" ry=".045" fill="#fff" opacity=".55" transform="rotate(-30 ${R(cx-.09)} ${R(cy-.07)})"/>
   <rect x="${R(cx+.06)}" y="${R(cy-.27)}" width=".12" height=".09" rx=".02" fill="#9AA6B4" stroke="${K}" stroke-width=".025" transform="rotate(35 ${R(cx+.12)} ${R(cy-.22)})"/>
   <path d="M${R(cx+.17)} ${R(cy-.27)}q.08 -.1 .02 -.17" fill="none" stroke="#C9A36B" stroke-width=".03"/>
   <g filter="url(#eyeglow)"><circle cx="${R(cx+.19)}" cy="${R(cy-.45)}" r=".055" fill="#FFD27A"/><circle cx="${R(cx+.19)}" cy="${R(cy-.45)}" r=".025" fill="#fff"/></g>
   <g transform="translate(${R(cx-.24)} ${R(cy+.2)})"><rect x="-.13" y="-.1" width=".26" height=".2" rx=".04" fill="${hot?'#C92463':'#F3CB4B'}" stroke="${K}" stroke-width=".03"/><text y=".055" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size=".15" fill="${hot?'#fff':K}">${fuse}</text></g>`}
function terminal(cx,cy){return `<ellipse cx="${R(cx)}" cy="${R(cy+.3)}" rx=".38" ry=".09" fill="rgba(0,0,0,.45)"/>
   <path d="M${R(cx-.34)} ${R(cy+.28)}L${R(cx-.26)} ${R(cy+.08)}H${R(cx+.26)}L${R(cx+.34)} ${R(cy+.28)}Z" fill="#3a4250" stroke="${K}" stroke-width=".035"/>
   ${[0,1,2].map(r=>[0,1,2,3,4].map(c=>`<rect x="${R(cx-.22+c*.09+r*.015)}" y="${R(cy+.12+r*.05)}" width=".06" height=".03" fill="#8FA1B8"/>`).join('')).join('')}
   <rect x="${R(cx-.3)}" y="${R(cy-.36)}" width=".6" height=".42" rx=".04" fill="#22262f" stroke="${K}" stroke-width=".035"/>
   <rect x="${R(cx-.25)}" y="${R(cy-.31)}" width=".5" height=".32" rx=".02" fill="#0d2a35"/><g filter="url(#eyeglow)" stroke="#3DB6DD" fill="none" stroke-width=".025"><path d="M${R(cx-.2)} ${R(cy-.24)}h.22M${R(cx-.2)} ${R(cy-.18)}h.3M${R(cx-.2)} ${R(cy-.12)}h.16M${R(cx-.2)} ${R(cy-.06)}h.26"/><circle cx="${R(cx+.12)}" cy="${R(cy-.2)}" r=".06"/><path d="M${R(cx+.16)} ${R(cy-.16)}l.05 .05"/></g>
   <rect x="${R(cx-.25)}" y="${R(cy-.31)}" width=".5" height=".32" fill="#3DB6DD" opacity=".12"/>`}
function exitA(cx,cy,dir){/* stencil chevrons pointing off the board */return `<g transform="translate(${R(cx)} ${R(cy)}) rotate(${dir})" opacity=".95">${[0,1].map(i=>`<path d="M${R(-.12+i*.16)} -.2L${R(.04+i*.16)} 0L${R(-.12+i*.16)} .2" fill="none" stroke="#7CF0A8" stroke-width=".085" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>
   <text x="${R(cx)}" y="${R(cy+.36)}" text-anchor="middle" font-family="Bangers,Impact,sans-serif" font-size=".2" fill="#7CF0A8" stroke="${K}" stroke-width=".035" paint-order="stroke" letter-spacing=".02">EXIT</text>`}
return {HF,civArt,bomb,terminal,exitA,R}})();
/* a mini standee in board units around hex centre (cx,cy); s scales it against a hero standee. Enemies get the soft red #erim
   outline and civilians the soft blue #crim one, so both stand out from the lair floor. */
function miniStand(cx,cy,art,base,ring,s,badge,rim){const R=MINI.R,K='#151821',by=cy+.33*s,rx=.42*s,ry=.105*s,fw=.86*s,fh=fw*1.04;
  let o=`<ellipse cx="${R(cx)}" cy="${R(by+.025)}" rx="${R(rx)}" ry="${R(ry)}" fill="rgba(0,0,0,.45)"/><g${rim?` filter="url(#${rim})"`:''}><ellipse cx="${R(cx)}" cy="${R(by)}" rx="${R(rx)}" ry="${R(ry)}" fill="${base}" stroke="${ring||K}" stroke-width="${ring?.06:.035}"/>${ring?`<ellipse cx="${R(cx)}" cy="${R(by)}" rx="${R(rx)}" ry="${R(ry)}" fill="none" stroke="${K}" stroke-width=".025"/>`:''}`;
  o+=`<svg x="${R(cx-fw/2)}" y="${R(by+ry*.2-fh)}" width="${R(fw)}" height="${R(fh)}" viewBox="0 0 100 104" overflow="visible">${art}</svg></g>`;
  return o+(badge?badge(cx+rx*.72,by-.02):'')}
const miniNum=(n,z=.12)=>(x,y)=>`<g transform="translate(${MINI.R(x)} ${MINI.R(y)})"><circle r="${z}" fill="#151821" stroke="#fff" stroke-width=".028"/><text y="${MINI.R(z*.38)}" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size="${MINI.R(z*1.1)}" fill="#fff">${n}</text></g>`;
const miniBang=(x,y)=>`<g transform="translate(${MINI.R(x-.02)} ${MINI.R(y-.74)})"><circle r=".1" fill="#fff" stroke="#151821" stroke-width=".03"/><text y=".05" text-anchor="middle" font-family="Bangers,Impact,sans-serif" font-size=".16" fill="#C92463">!</text></g>`;
function miniSvg(x,y,inner){const h=HC(x,y);return `<svg class="mini" viewBox="${(h.cx-.5).toFixed(3)} ${(h.cy-HS).toFixed(3)} 1 ${(2*HS).toFixed(3)}" aria-hidden="true">${inner}</svg>`}
