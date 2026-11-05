/* Construction integration: navigation, saved facilities, costs, blueprints, and sprite coverage. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const g=require('../tools/bh').load({seed:108});
const run=s=>g.run(s),get=s=>JSON.parse(JSON.stringify(g.get(s)));
run("const savedItems=new Map();localStorage={getItem:k=>savedItems.get(k)||null,setItem:(k,v)=>savedItems.set(k,v)};newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.phase='hq';S.view='construction';S.ui={};S.tech=50;S.intel=50;S.facilities=['workshop'];render=()=>{};");
assert.match(get('nav()'),/data-a="view:construction"/);
run('storyShowing=()=>false');assert.match(get('bodyMain()'),/hq-construction/,'screen switch opens the new page');
assert.equal(get('Object.keys(HQ_FAC_ART).sort()').join(),get('Object.keys(FAC).sort()').join(),'every facility has art');
assert.match(get('hqConstructionView()'),/hq-grounds/);
assert.match(get('hqGrounds("skunk")'),/is-built[^]*facselect:workshop/);
assert.doesNotMatch(get('hqGrounds("skunk")'),/facselect:sanctum/,'unbuilt facilities stay off grounds');
const before=get('[S.tech,S.intel,S.facilities.length]');
run("ACT.facselect('medbay')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),before,'selecting artwork does not build');
assert.equal(get('S.ui.hqFacility'),'medbay');
assert.match(get('hqConstructionView()'),/hqbuild:medbay/);
run("ACT.build('medbay')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),[48,50,2]);
assert.match(get('hqConstructionView()'),/Operational on your grounds/);
assert.match(get('hqGrounds("skunk")'),/facselect:medbay/);
run("ACT.build('medbay')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),[48,50,2],'double build cannot spend or duplicate');
run("ACT.build('sanctum');ACT.build('missing');ACT.build('constructor')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),[48,50,2],'unknown and locked plans cannot build');
run("S.tech=0;ACT.build('skunk')");assert(!get('S.facilities.includes("skunk")'));
run("S.tech=50;S.phase='sd';ACT.build('skunk')");assert(!get('S.facilities.includes("skunk")'));
run("S.phase='hq';S.ui.hqFacility='invalid';hqConstructionView();S.ui.hqFacility='constructor';hqConstructionView();");
run("S.ui.hqFacility='medbay';save();S.facilities=[];load()");assert(get('S.facilities.includes("medbay")'),'existing save path persists built facilities');
assert.match(get('hqFacilityArt("medbay")'),/style="background-image:url\('assets\/headquarters\//,'sprite URLs resolve from the game document');
for(const k of get('Object.keys(HQ_FAC_ART)')){
 const a=get(`HQ_FAC_ART['${k}']`);assert(fs.existsSync(path.join(__dirname,'..','assets/headquarters',`facilities-${a[0]}.webp`)));
 assert.equal(get(`HQ_SITES['${k}'].length`),3,'every sprite has an individually placed site and size');
}
// Authored sites remain compact and every facility has a useful visible crop.
for(const k of get('Object.keys(HQ_FAC_ART)')){
 const [x,y,w]=get(`HQ_SITES['${k}']`),[top,height]=get(`HQ_CUTS['${k}']`);
 assert(x>0&&x<100&&y>0&&y<100&&w>0&&w<60,k+' has an authored site');
 assert(top>=0&&height>0&&top+height<=100,k+' uses a valid art crop');
}
run("S.facilities=['workshop']");
assert.equal(get('hqWorkshopComplex("medbay")'),'','starting Workshop stays standalone');
assert.match(get('hqWorkshopComplex("skunk")'),/hq-complex is-preview/);
run("S.facilities.push('skunk')");
assert.match(get('hqWorkshopComplex("medbay")'),/data-hq-complex="workshop:skunk"/);
assert.doesNotMatch(get('hqWorkshopComplex("medbay")'),/is-preview/);
run('S.facilities=Object.keys(FAC)');
assert(get('hqAllBuilt()'));
assert.match(get('hqGrounds("skunk")'),/harbor-complete.webp/,'completed campus uses the approved coordinated master');
run("S.facilities=['workshop']");
assert(!get('hqAllBuilt()'));
assert.match(get('hqGrounds("medbay")'),/harbor-ground.webp/,'unbuilt facilities are not baked into the construction background');
assert.doesNotMatch(get('hqGrounds("medbay")'),/facselect:sanctum/);
assert.match(get('hqConstructionView()'),/class="hq-fac-picker"/,'mobile has a full-width facility selector');
assert.equal((get('hqConstructionView()').match(/<option value=/g)||[]).length,20,'17 facility choices plus three lighting modes');
// The lighthouse stays dark during the local daytime, independently of optional animation.
for(const hour of [0,6,19,23])assert(get(`hqIsNight(${hour},'auto')`),'night at '+hour);
for(const hour of [7,12,18])assert(!get(`hqIsNight(${hour},'auto')`),'day at '+hour);
assert(!get("hqIsNight(23,'day')"));assert(get("hqIsNight(12,'night')"));
run("hqSetPref('lighting','night')");assert.equal(get('hqLighting()'),'night');
run("hqSetPref('lighting','invalid')");assert.equal(get('hqLighting()'),'auto');
run("hqSetPref('lighting','day')");assert.doesNotMatch(get('hqGrounds("medbay")'),/is-night/);
run("hqSetPref('lighting','night')");assert.match(get('hqGrounds("medbay")'),/is-night/);
run("hqSetPref('motion','off')");assert.equal(get('hqMotionLayer()'),'');assert(!get('hqMotionEnabled()'));
run("hqSetPref('motion','on');S.facilities=['workshop']");assert(get('hqMotionEnabled()'));
assert.match(get('hqMotionLayer()'),/data-hq-effect="workshop"/);
assert.doesNotMatch(get('hqMotionLayer()'),/data-hq-effect="reactor"/,'unbuilt facilities cannot animate');
run("S.facilities=['medbay']");
assert.match(get('hqMotionLayer()'),/data-hq-effect="medbay"[^]*hq-flicker-light/,'a built facility without custom animation gets a window flicker');
assert.doesNotMatch(get('hqMotionLayer()'),/data-hq-effect="skunk"/,'unbuilt windows stay absent');
run('S.facilities=Object.keys(FAC)');
const animatedKeys=[...get('hqMotionLayer()').matchAll(/data-hq-effect="([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(animatedKeys.sort(),get('Object.keys(FAC).sort()'),'every built facility gets exactly one custom or fallback effect');
for(const k of get('Object.keys(HQ_MOTION_DRAWINGS)'))assert(!get(`Object.hasOwn(HQ_LIGHT_FLICKERS,'${k}')`),k+' keeps its existing effect');
assert.match(get('hqMotionLayer()'),/data-hq-environment-effect="command-hq"/,'permanent HQ windows can flicker too');
run("matchMedia=()=>({matches:true})");assert(!get('hqMotionEnabled()'),'system reduced motion wins');
run('matchMedia=undefined');
assert(fs.existsSync(path.join(__dirname,'..','assets/headquarters/harbor-complete.webp')));
assert(fs.existsSync(path.join(__dirname,'..','assets/headquarters/harbor-ground.webp')));
assert.match(fs.readFileSync(path.join(__dirname,'..','css/headquarters.css'),'utf8'),/hq-beacon-light,#app \.hq-lantern-light\{display:none/,'base CSS hides daytime beacon');
// Removing the optional module leaves construction and steady lighting available.
run('const motionBackup=[hqMotionLayer,hqMotionControl,hqMotionMount];hqMotionLayer=undefined;hqMotionControl=undefined;hqMotionMount=undefined');
assert.match(get('hqConstructionView()'),/hq-lighthouse/);
assert.doesNotMatch(get('hqConstructionView()'),/hq-motion-toggle/);
run('[hqMotionLayer,hqMotionControl,hqMotionMount]=motionBackup');
// The shared renderer emits the illustrated masthead and HQ tab on every real-game entry page.
for(const name of fs.readdirSync(path.join(__dirname,'..')).filter(n=>n.endsWith('.html'))){
 const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 if(!html.includes('src/ui/render.js'))continue;
 assert(html.includes('css/headquarters.css'),name+' loads shared masthead sizing');
 assert(html.includes('src/hq/construction.js'),name+' loads its construction tab handler');
 if(html.includes('src/hq/harbor-motion.js'))assert(html.indexOf('src/hq/harbor-motion.js')>html.indexOf('src/hq/construction.js'),name+' loads optional animation after its dependencies');
}
console.log('Headquarters: navigation, previews, costs, unlocks, duplicate guards, persistence, and 17 sprite mappings pass.');
