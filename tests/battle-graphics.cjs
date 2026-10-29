#!/usr/bin/env node
/* Real battle renderer graphics regression. Run against the actual HTML,
   actual SVG assets and actual game state at mobile + desktop widths.
   The art lab is a save-isolated view, not a separate fake battle board. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const out=path.resolve('layout-shots');fs.mkdirSync(out,{recursive:true});
 try{
  const names=['arena-concrete.svg','arena-steel.svg','arena-wood.svg','arena-circuit.svg','arena-move.svg','arena-danger.svg'];
  const miniatures=['bulwark','volt','wisp','lynx'].map(k=>'miniature-'+k+'.svg');
  const mapping={gallows:'arena-steel.svg',quarry:'arena-concrete.svg',cantor:'arena-wood.svg',
   architect:'arena-steel.svg',helios:'arena-steel.svg',serpent:'arena-circuit.svg',
   lode:'arena-steel.svg',noct:'arena-wood.svg',swarm:'arena-concrete.svg',
   bomber:'arena-concrete.svg',grid:'arena-circuit.svg'};
  for(const file of [...names,...miniatures]){
    const text=fs.readFileSync(path.resolve(file),'utf8');
    assert(text.startsWith('<svg '),file+' is an actual vector image');
    assert.match(text,/viewBox="/,file+' has scalable coordinates');
  }
  const index=fs.readFileSync(path.resolve('index.html'),'utf8');
  assert.match(index,/href="battle-graphics.css"/,'Main game loads illustrated battle art');
  for(const width of [390,1440]){
    const size=width===390?'phone':'desktop';
    const page=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
    const failures=[];
    page.on('pageerror',e=>failures.push(e.message));
    await page.goto('file://'+process.cwd()+'/combat-art-lab.html');
    await page.locator('.board.lair.L-cantor .cell').first().waitFor();
    const assetStatuses=await page.evaluate(async files=>{
      return Promise.all(files.map(async file=>{
        const i=new Image();i.src=file;
        await i.decode();
        return {name:file,w:i.naturalWidth,h:i.naturalHeight};
      }));
    },names);
    assert.equal(assetStatuses.length,6,'Six original SVG sprites load in real Chromium');
    for(const a of assetStatuses){assert(a.w>0&&a.h>0,a.name+' is rendered by Chromium');}
    assert.equal(await page.locator('#lab-villain option').count(),11,'All campaign bosses supported');
    const newArt=await page.evaluate(async files=>{
      return Promise.all(files.map(async file=>{
        const img=new Image();img.src=file;await img.decode();
        return {file,width:img.naturalWidth,height:img.naturalHeight};
      }));
    },miniatures);
    assert(newArt.every(a=>a.width===128&&a.height===176),'New character miniatures are individual 128x176 illustrated SVGs');
    assert.equal(await page.locator('#lab-miniatures').getAttribute('aria-pressed'),'true','New heroes enabled on lab entry');
    assert(await page.locator('.board .tok.hst[data-hero="bulwark"]').count()>0,'Real battle tokens retain hero identity');
    const newHeroStyle=async()=>page.locator('.board .tok.hst[data-hero="bulwark"] .st').first()
      .evaluate(node=>({art:getComputedStyle(node,'::after').backgroundImage,
        original:getComputedStyle(node.querySelector('.hs')).opacity,
        pointer:getComputedStyle(node,'::after').pointerEvents}));
    const miniOn=await newHeroStyle();
    assert(miniOn.art.includes('miniature-bulwark.svg'),'Original illustrated hero miniature replaces legacy art');
    assert.equal(miniOn.original,'0','Hidden legacy hero standee remains available for comparison');
    assert.equal(miniOn.pointer,'none','Miniature art is noninteractive and cannot block cell input');
    await page.screenshot({path:path.join(out,size+'-experimental-new-miniatures.png'),animations:'disabled'});
    await page.locator('#lab-miniatures').click();
    assert.equal(await page.locator('#lab-miniatures').getAttribute('aria-pressed'),'false');
    assert(!(await newHeroStyle()).art.includes('miniature-bulwark.svg'),'Original standees return when new sprites are disabled');
    await page.locator('#lab-miniatures').click();
    assert((await newHeroStyle()).art.includes('miniature-bulwark.svg'),'New character art can be restored');

    assert(await page.locator('.board .cell').count()>25,'Real hex cells are present');
    assert(await page.locator('.board .tok.hst').count()>0,'Actual hero standees render');
    assert(await page.locator('.board .vtok').count()>0,'Actual boss standee renders');
    assert.equal(await page.locator('.board .cell[data-cell]').count(),await page.locator('.board .cell').count(),'All playable hex buttons retain inputs');
    const floor=async()=>page.locator('.board .cell:not(.wall):not(.pit):not(.haz):not(.obs)').first()
      .evaluate(node=>getComputedStyle(node,'::before').backgroundImage);
    assert((await floor()).includes('arena-wood.svg'),'Cantor wood surface applied to interactive hexes');
    assert.equal(await page.locator('#lab-compare').getAttribute('aria-pressed'),'true');
    await page.screenshot({path:path.join(out,size+'-battle-art-cantor.png'),animations:'disabled'});
    await page.locator('#lab-compare').click();
    assert.equal(await page.locator('#lab-compare').getAttribute('aria-pressed'),'false');
    assert(!(await floor()).includes('arena-wood.svg'),'Toggle restores real classic board surface');
    await page.screenshot({path:path.join(out,size+'-battle-classic-cantor.png'),animations:'disabled'});
    await page.locator('#lab-compare').click();
    await page.waitForFunction(()=>{
      const node=document.querySelector('.board .cell:not(.wall):not(.pit):not(.haz):not(.obs)');
      return node&&getComputedStyle(node,'::before').backgroundImage.includes('arena-wood.svg');
    },undefined,{timeout:8000}); // Re-enabling a previously disabled <link> can be asynchronous.
    assert((await floor()).includes('arena-wood.svg'),'Illustrated materials can be re-enabled');
    for(const [key,asset] of Object.entries(mapping)){
      await page.selectOption('#lab-villain',key);
      await page.locator('.board.lair.L-'+key).waitFor();
      const mat=await floor();
      assert(mat.includes(asset),key+' uses '+asset);
      assert(await page.locator('.board .vtok').count()>0,key+' real boss is on field');
      if(['gallows','quarry','grid'].includes(key)){
        await page.screenshot({path:path.join(out,size+'-battle-art-'+key+'.png'),animations:'disabled'});
      }
    }
    const graphics=await page.evaluate(()=>{
      const selected=document.querySelector('.board .tok.hst.sel');
      const chassis=document.querySelector('.boardwrap');
      return {chassis:getComputedStyle(chassis,'::after').pointerEvents,
        tile:getComputedStyle(document.querySelector('.board .cell'),'::before').pointerEvents,
        hero:selected?getComputedStyle(selected.querySelector('.st')).filter:null,
        overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.equal(graphics.chassis,'none','Board bezel never blocks tactical clicks');
    assert.equal(graphics.tile,'none','SVG tile overlays are noninteractive');
    assert(graphics.overflow<=24,size+' board fits viewport');
    assert.deepEqual(failures,[],size+' game/battle art script errors');
    await page.goto('file://'+process.cwd()+'/miniature-gallery.html');
    assert.equal(await page.locator('.gallery figure img').count(),4,'Full-size art gallery contains four independent assets');
    assert((await page.locator('.gallery img').first().evaluate(el=>el.naturalWidth))===128,'Gallery displays actual reusable SVG art');
    await page.screenshot({path:path.join(out,size+'-original-miniatures-gallery.png'),animations:'disabled'});
    await page.close();
  }
  console.log('PASS: four new standalone illustrated hero sprites, six floor/marker assets, art comparison toggles, 11 boss floors, and live battlefield geometry at phone/desktop sizes.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
