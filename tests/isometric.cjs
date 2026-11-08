const assert=require('node:assert/strict');
const fs=require('node:fs');
const g=require('../tools/bh').load({seed:41});
g.run("newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=Object.keys(HERO_BASE).map(k=>newHero(k));S.party=S.heroes.slice(0,4).map(h=>h.id)");
assert.equal(g.get('ISO_KEYS.length'),36);
assert.equal(g.get('Object.keys(HERO_BASE).every(k=>ISO_KEYS.includes(k))'),true);
assert.equal(g.get('Object.keys(VILLAINS).every(k=>ISO_KEYS.includes(k))'),true);
assert.equal(g.get("isoSprite('hive','Queen')===isoSprite('swarm','Queen')"),true);
for(const k of g.get('Object.keys(VILLAINS)')){
 g.run(`S.villains=[makeVillain('${k}',${k==='mole'?1:2})];S.pool=[];S.inv={v:'${k}',clues:3};startShowdown();S.sd.intro=false`);
 const html=g.get('sdView()');
 assert.equal((html.match(/data-cell="/g)||[]).length,81,k+' retains all playable hexes');
 assert.match(html,/iso-board/,k+' uses the new renderer');
 assert.match(html,/iso-figure/,k+' has raster character art');
 assert.doesNotMatch(html,/NaN|undefined%/,k+' has finite geometry');
 assert.equal(g.get('(()=>{const before=JSON.stringify(S.sd);isoBoard(S.sd,{},new Set(),new Set());return before===JSON.stringify(S.sd)})()'),true,'render is pure');
}
g.run('isoEnabled=false');assert.doesNotMatch(g.get('sdView()'),/class="board iso-board"/,'classic comparison remains available');
for(const file of ['characters.webp','street.webp','digger.webp'])assert(fs.statSync('assets/isometric/'+file).size>10000);
console.log('PASS: all 12 villains, nine hero identities, swarm mapping, 81 projected cells, pure rendering, classic comparison and assets.');
assert.equal(g.get('ISO_COVER_GROUPS.flat().length'),12,'Every cover has a sprite mapping');
for(const key of g.get('Object.keys(VILLAINS)'))assert.match(g.get(`isoSprite('${key}','Boss')`),/(?:cover-[123]|architect-left|gridlock-left)\.webp/,'Cover art replaces '+key);
g.run("isoEnabled=true;S.villains=[makeVillain('serpent',2)];S.inv={v:'serpent',clues:3};startShowdown()");
const serpent=g.get('sdView()');
assert.match(serpent,/iso-serpent-body/,'Connected serpent body is drawn');
assert.match(serpent,/serpent-tail.webp/,'Dedicated tail is drawn');
assert.doesNotMatch(serpent,/class="iso-unit serpent-tail/,'Segments never duplicate a complete snake');
const count=g.get('S.sd.v.body.length');
assert.equal((serpent.match(/data-segment=/g)||[]).length,Math.max(0,count-1),'Every internal body joint has one segment');
for(const body of [[],[{x:4,y:3}],[{x:4,y:3},{x:5,y:3},{x:5,y:4}],Array.from({length:7},(_,i)=>({x:i+1,y:5}))]){
 g.run(`S.sd.v.x=4;S.sd.v.y=2;S.sd.v.body=${JSON.stringify(body)}`);
 const art=g.get('isoSerpent(S.sd.v,0)');assert.doesNotMatch(art,/NaN|undefined/,'Growth and turns have finite presentation');
}
console.log('PASS: cover-based identity mapping, connected serpent joints, tail, short bodies, growth and turns.');
for(const file of ['cover-1.webp','cover-2.webp','cover-3.webp','props.webp','serpent-parts.webp','serpent-scales.webp','serpent-tail.webp'])assert(fs.statSync('assets/isometric/'+file).size>1000,file+' is packaged');
g.run("S.sd.obs=['1,2'];S.sd.walls=[{k:'2,2'}];S.sd.haz=[{k:'3,3'}];S.sd.pits=['4,4']");
const floor=g.get('isoBoard(S.sd,{"1,1":1},new Set(["2,1"]),new Set())');
assert.match(floor,/iso-prop-wall/);assert.match(floor,/iso-prop-rubble/);assert.match(floor,/iso-lava-seam/);assert.match(floor,/iso-pit-depth/);
assert.equal((floor.match(/class="iso-overlay /g)||[]).length,81,'Every floor hex has an independent state overlay');
assert.match(floor,/iso-danger-stripes/,'Blast stripes are available');
const css=fs.readFileSync('css/isometric.css','utf8');assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.iso-overlay.danger,\.iso-lava-seam\{animation:none\}\}/);
console.log('PASS: packaged cover/terrain assets, floor overlays, obstacles, pit depth, lava and reduced motion.');
for(const key of g.get('Object.keys(HERO_BASE)')){
 const art=g.get(`isoSprite('${key}','Readable hero name')`);
 if(['bulwark','volt','wisp','lynx'].includes(key))assert.match(art,/heroes-superhero.webp/,'Redesigned superhero '+key+' uses the left-facing atlas');
 else assert.match(art,/cast-1.webp/,'Remaining hero '+key+' uses the left-facing cast atlas');
 assert.match(art,/<\/span><span class="iso-name">Readable hero name<\/span>/,'Hero name remains outside the transformed figure');
}
for(const key of ['gallows','m-mole','civilian'])assert.match(g.get(`isoSprite('${key}','Other')`),/--face:1;/,'Only heroes change facing');
assert.match(css,/transform:scale\(var\(--size\)\) scaleX\(var\(--face,1\)\)/,'Figure scale and facing compose without moving its anchor');
console.log('PASS: all nine hero facings, four superhero mappings and unmirrored labels/other characters.');
for(const angle of [-60,-45,-30,-15,0,15,30]){
 g.run(`isoAngle=${angle};isoFrameCache=null`);
 const geometry=g.get('(()=>{const f=isoFrame();let inside=true;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const h=HC(x,y);for(let i=0;i<6;i++){const a=(i*60-90)*Math.PI/180,p=isoPoint(h.cx+Math.cos(a)*HS,h.cy+Math.sin(a)*HS);if(p.x<0||p.y<0||p.x>f.W||p.y>f.H)inside=false}}return {inside,area:f.W*f.H}})()');
 assert(geometry.inside,'All playable tile corners fit camera at '+angle+' degrees');
 assert.match(g.get('isoBoard(S.sd,{},new Set(),new Set())'),new RegExp('data-iso-angle="'+angle+'"'),'Camera angle is rendered');
}
g.run('ACT.isoReset()');assert.equal(g.get('isoAngle'),-15);
assert(g.get('isoFrame().W*isoFrame().H')<14*8,'Default camera trims the old fixed empty frame');
g.run('ACT.isoRotate(999)');assert.equal(g.get('isoAngle'),30,'Camera cannot exceed supported upper angle');
g.run('ACT.isoRotate(-999)');assert.equal(g.get('isoAngle'),-60,'Camera cannot exceed supported lower angle');
g.run('ACT.isoReset()');
console.log('PASS: camera fitting at every supported rotation, complete board visibility, reset and bounds.');
assert.equal(g.get('ISO_CAST_GROUPS.flat().length'),21,'Remaining cast has exactly 21 new identities');
assert.equal(g.get('new Set([...ISO_HERO_SPRITES,...ISO_COVER_GROUPS.flat(),...ISO_CAST_GROUPS.flat()]).size'),37,'All 37 character identities have a new style mapping');
for(const key of g.get('[...ISO_KEYS,"m-mole"]'))assert.match(g.get(`isoSprite('${key}','Actor')`),/background-image:url\(assets\/isometric\/(?:cover-[123]|cast-[123]|heroes-superhero|architect-left|gridlock-left)\.webp\)/,key+' never falls back to the old atlas');
console.log('PASS: full 37-character style coverage with no legacy atlas fallback.');
for(const file of ['heroes-superhero.webp','cast-1.webp','cast-2.webp','cast-3.webp'])assert(fs.statSync('assets/isometric/'+file).size>10000,'New style sheet '+file+' is packaged');
assert.match(fs.readFileSync('isometric-sprites.html','utf8'),/galleryGroups/,'Full-cast review gallery is packaged');

for(const [key,asset] of [['architect','architect-left'],['grid','gridlock-left']]){
 const url='assets/isometric/'+asset+'.webp';
 assert(fs.statSync(url).size>1000,asset+' is packaged');
 for(const expr of [`isoSprite('${key}','Actor')`,`vPortrait('${key}')`,`vIc('${key}')`]){
  assert(g.get(expr).includes(url),key+' uses the approved pose in '+expr);
 }
}
