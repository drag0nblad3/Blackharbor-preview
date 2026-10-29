#!/usr/bin/env node
/* Integrity + real-browser coverage for the approved, uncropped comic covers. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/villain-covers/manifest.json')));
const entries=manifest.entries;
assert.equal(entries.length,12);
assert.equal(new Set(entries.map(e=>e.key)).size,12);
for(const e of entries){
  const cover=fs.readFileSync(path.join(root,e.cover_path));
  const thumb=fs.readFileSync(path.join(root,e.thumbnail_path));
  assert.equal(crypto.createHash('sha256').update(cover).digest('hex'),e.cover_sha256,e.key+' preserves approved artwork');
  assert.equal(cover.length,e.cover_bytes);
  assert.equal(thumb.length,e.thumbnail_bytes);
  for(const data of [cover,thumb]){
    assert.equal(data.toString('ascii',0,4),'RIFF');
    assert.equal(data.toString('ascii',8,12),'WEBP');
  }
}
if(process.argv.includes('--integrity-only')){
  console.log('PASS: all 12 original cover SHA-256 hashes, 24 WebP headers and packaged file sizes.');
  process.exit(0);
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const screenshots=path.join(root,'layout-shots');fs.mkdirSync(screenshots,{recursive:true});
  const errors=[];
  try{
    for(const size of [{name:'phone',width:390,height:844},{name:'desktop',width:1440,height:900},{name:'phone-landscape',width:844,height:390}]){
      const page=await browser.newPage({viewport:size,hasTouch:size.name!=='desktop'});
      const fullRequests=[];
      page.on('pageerror',e=>errors.push(size.name+': '+e.message));
      page.on('request',r=>{if(/villain-covers\/[a-z]+\.webp/.test(r.url()))fullRequests.push(r.url());});
      await page.goto('file://'+root+'/index.html');
      await page.evaluate(()=>{newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.ui=S.ui||{};S.villains=Object.keys(VILLAINS).map(k=>makeVillain(k,1));S.pool=[];});
      await page.addStyleTag({content:'#guide,#tutc{display:none!important}'});
      const initialState=await page.evaluate(()=>JSON.stringify(S));
      assert.deepEqual(await page.evaluate(()=>Object.keys(VILLAIN_COVERS).sort()),entries.map(e=>e.key).sort());
      assert.deepEqual(await page.evaluate(()=>Object.keys(VILLAIN_COVERS).filter(k=>!VILLAINS[k])),[]);
      // Every actual playbook opens on its matching thumbnail, retaining stats and unknown pages.
      for(const e of entries){
        await page.evaluate(k=>openPlaybook(k),e.key);
        const preview=page.locator('#comic .cover-preview img');
        await preview.evaluate(img=>img.decode());
        assert.equal(await preview.getAttribute('src'),e.thumbnail_path);
        assert.deepEqual(await preview.evaluate(img=>[img.naturalWidth,img.naturalHeight]),[320,480]);
        assert.equal(await preview.evaluate(img=>getComputedStyle(img).objectFit),'contain');
        await page.locator('#comic .cstats').waitFor();
        await page.evaluate(()=>closePlaybook());
      }
      assert.equal(fullRequests.length,0,'Browsing playbooks downloads only thumbnails');
      await page.evaluate(()=>openPlaybook('bomber'));
      await page.locator('[data-pb="gallery"]').click();
      assert.equal(await page.locator('#cover-browser .cover-card').count(),12);
      for(const image of await page.locator('#cover-browser .cover-card img').all()){
        await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode());
        assert.equal(await image.evaluate(img=>getComputedStyle(img).objectFit),'contain');
      }
      assert.equal(fullRequests.length,0,'Gallery loads thumbnails, not full-size covers');
      await page.locator('#cover-browser').evaluate(d=>d.scrollTop=0);
      await page.screenshot({path:path.join(screenshots,size.name+'-comic-gallery.png')});
      for(const e of entries){
        await page.locator(`[data-cover="view:${e.key}"]`).click();
        const image=page.locator('#cover-browser .cover-full');
        await image.evaluate(img=>img.decode());
        assert.equal(await image.getAttribute('src'),e.cover_path);
        assert.deepEqual(await image.evaluate(img=>[img.naturalWidth,img.naturalHeight]),e.dimensions);
        const box=await image.evaluate(img=>{
          const r=img.getBoundingClientRect(),d=img.closest('dialog'),s=getComputedStyle(img);
          return {x:r.x,y:r.y,width:r.width,height:r.height,fit:s.objectFit,clip:s.clipPath,dialogWidth:d.scrollWidth,clientWidth:d.clientWidth,viewport:innerWidth};
        });
        assert.equal(box.fit,'contain');assert.equal(box.clip,'none');
        assert(Math.abs(box.width/box.height-2/3)<0.01,'Entire 2:3 cover retains its aspect ratio');
        assert(box.width<=box.viewport && box.x>=0,'Cover fits viewport');
        assert(box.dialogWidth<=box.clientWidth+1,'Dialog does not overflow horizontally');
        const source=page.locator('.cover-original');
        assert.equal(await source.getAttribute('href'),e.cover_path);
        assert.equal(await source.getAttribute('target'),'_blank');
        if(e.key==='bomber')await page.screenshot({path:path.join(screenshots,size.name+'-payload-cover.png')});
        await page.locator('[data-cover="gallery"]').click();
      }
      // Browsing artworks must not reveal cards, alter rules, statistics or campaign saves.
      assert.equal(await page.evaluate(()=>JSON.stringify(S)),initialState);
      await page.locator('[data-cover="close"]').click();
      await page.locator('#cover-browser').waitFor({state:'detached'});
      assert.equal(await page.locator('#cover-browser').count(),0);
      assert.equal(await page.locator('[data-pb="gallery"]').evaluate(e=>e===document.activeElement),true);
      await page.locator('[data-pb="art"]').click();
      assert.equal(await page.locator('#cover-browser').getAttribute('data-key'),'bomber');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#cover-browser').getAttribute('data-key'),'grid');
      assert.equal(await page.evaluate(()=>PB.i),0,'Arrow keys do not turn underlying playbook');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#cover-browser').getAttribute('data-key'),'bomber');
      await page.keyboard.press('Tab');
      assert(await page.evaluate(()=>!!document.activeElement.closest('#cover-browser')),'Modal traps keyboard focus');
      await page.keyboard.press('Escape');
      await page.locator('#cover-browser').waitFor({state:'detached'});
      assert.equal(await page.locator('#cover-browser').count(),0);
      assert.equal(await page.locator('#comic').count(),1,'Escape returns to playbook');
      assert(await page.locator('[data-pb="art"]').evaluate(e=>e===document.activeElement),'Focus returns to cover button');
      const expected=await page.evaluate(()=>PB.pages.length);
      await page.locator('[data-pb="next"]').click();
      await page.waitForFunction(()=>PB.i===1);
      assert.equal(await page.evaluate(()=>PB.pages.length),expected);
      await page.locator('#comic .pg .tx').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#comic').count(),0);
      console.log(`PASS: ${size.name} ${size.width}x${size.height}: 12 playbook thumbnails, gallery, 12 complete native covers, focus, keyboard, original-image links and unchanged campaign state.`);
      await page.close();
    }
    assert.deepEqual(errors,[],'No browser JavaScript errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
