const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('file://'+process.cwd()+'/index.html');
    const early=await page.evaluate(async()=>{
      newCampaign();recruitQuick('volt');
      const code=await bhSaveEncode(S),decoded=await bhSaveDecode(code);
      return {villains:decoded.state.villains.length,pool:decoded.state.pool.length};
    });
    assert.equal(early.villains,0,'Early campaigns do not reveal bosses yet');
    assert.ok(early.pool>0,'Early campaigns retain a villain pool');
    console.log('PASS: early game saves work before villain reveal');
    const ready=await page.evaluate(()=>{
      newCampaign();S.tut=null;S.tutDone=true;S.guide=null;S.tipsOff=true;S.tips=[];
      recruitQuick('volt');recruitQuick('lynx');recruitQuick('wisp');recruitQuick('goliath');
      S.trust=17;S.heroes[0].name='Étoile 星 🔥';
      S.chronicle.push('First issue: 東京 saved.');
      render();
      return {key:KEY,hero:S.heroes[0].name};
    });
    assert.equal(ready.key,'blackharbor-preview-v4','Preview saves must be isolated from live saves');
    assert.equal(ready.hero,'Étoile 星 🔥');
    assert.equal(await page.locator('[data-save-open]').count(),1,'A Save/Load button is available in the masthead');
    await page.locator('[data-save-open]').click();
    await page.locator('#bh-save-dialog').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.querySelector('#bh-save-output')?.value.startsWith('BH1'));
    const code=await page.locator('#bh-save-output').inputValue();
    console.log('Export code length',code.length,'prefix',code.slice(0,5));
    assert.match(code,/^BH1[JG]\.[0-9a-f]{8}\.[A-Za-z0-9_-]+$/);
    const decoded=await page.evaluate(async c=>{
      const result=await bhSaveDecode(c);
      return {trust:result.state.trust,hero:result.state.heroes[0].name,chronicle:result.state.chronicle[0],summary:result.summary};
    },code);
    assert.equal(decoded.trust,17);
    assert.equal(decoded.hero,'Étoile 星 🔥');
    assert.equal(decoded.chronicle,'First issue: 東京 saved.');
    assert.match(decoded.summary,/Volume 1/);
    console.log('PASS: compressed/uncompressed export roundtrip with Unicode');
    const fallback=await page.evaluate(async()=>{
      const original=window.CompressionStream;
      window.CompressionStream=undefined;
      try{const c=await bhSaveEncode(S);const d=await bhSaveDecode(c);return {code:c.slice(0,5),name:d.state.heroes[0].name}}
      finally{window.CompressionStream=original}
    });
    assert.equal(fallback.code,'BH1J.');
    assert.equal(fallback.name,'Étoile 星 🔥');
    console.log('PASS: uncompressed fallback compatible');
    // Rendering the game must not erase the export box while the modal is open.
    await page.evaluate(()=>{S.trust=91;render()});
    assert.equal(await page.locator('#bh-save-output').inputValue(),code);
    await page.locator('[data-bh-select]').click();
    const selection=await page.evaluate(()=>document.querySelector('#bh-save-output').selectionEnd);
    assert.equal(selection,code.length,'Select text should select the full export code');
    await page.locator('[data-bh-tab="import"]').click();
    await page.locator('#bh-save-input').fill('this is not a code');
    await page.locator('[data-bh-check]').click();
    await page.waitForFunction(()=>document.querySelector('#bh-save-status').textContent.includes('Unrecognized'));
    assert.equal(await page.locator('[data-bh-import]').isVisible(),false,'Bad code never enables import');
    assert.equal(await page.evaluate(()=>S.trust),91);
    console.log('PASS: invalid import rejected without data loss');
    const corrupted=code.slice(0,-1)+(code.endsWith('A')?'B':'A');
    await page.locator('#bh-save-input').fill(corrupted);
    await page.locator('[data-bh-check]').click();
    await page.waitForFunction(()=>document.querySelector('#bh-save-status').textContent.length>1);
    assert.equal(await page.locator('[data-bh-import]').isVisible(),false,'Damaged code never enables import');
    assert.equal(await page.evaluate(()=>S.trust),91);
    console.log('PASS: damaged save rejected');
    await page.locator('#bh-save-input').fill(code);
    await page.locator('[data-bh-check]').click();
    await page.locator('[data-bh-import]').waitFor({state:'visible'});
    assert.match(await page.locator('#bh-save-preview').innerText(),/Volume 1/);
    assert.equal(await page.evaluate(()=>S.trust),91,'Checking save must not replace campaign');
    await page.locator('[data-bh-import]').click();
    await page.waitForFunction(()=>typeof S!=='undefined'&&S.trust===17&&S.heroes?.[0]?.name==='Étoile 星 🔥');
    assert.equal(await page.evaluate(()=>localStorage.getItem('blackharbor-v4')),null,'Live storage key is untouched');
    const backup=await page.evaluate(()=>JSON.parse(localStorage.getItem(KEY+'-before-import')));
    assert.equal(backup.trust,91,'Import backs up existing campaign');
    console.log('PASS: import requires explicit confirmation and reloads saved campaign');
    await page.locator('[data-save-open]').click();
    await page.locator('[data-bh-tab="import"]').click();
    await page.locator('[data-bh-restore]').click();
    await page.locator('[data-bh-import]').waitFor({state:'visible'});
    assert.match(await page.locator('#bh-save-preview').innerText(),/Restore previous autosave/);
    await page.locator('[data-bh-import]').click();
    await page.waitForFunction(()=>typeof S!=='undefined'&&S.trust===91);
    console.log('PASS: local recovery backup restores previous campaign');
    await page.locator('[data-save-open]').click();
    await page.keyboard.press('Escape');
    await page.locator('#bh-save-dialog').waitFor({state:'detached'});
    assert.equal(await page.locator('#bh-save-dialog').count(),0,'Escape closes modal');
    console.log('PASS: Escape closes save modal');
    // The same format must preserve a mid-combat position and unit actions.
    await page.evaluate(()=>{
      const key=S.villains.find(v=>v.status==='active')?.key||S.villains[0].key;
      S.inv={v:key,clues:2};
      startShowdown();S.sd.intro=false;S.sd.busy=false;S.sd.sel=0;
      S.sd.units[0].acted=true;
      render();
    });
    await page.locator('[data-save-open]').click();
    await page.waitForFunction(()=>document.querySelector('#bh-save-output')?.value.startsWith('BH1'));
    const battleCode=await page.locator('#bh-save-output').inputValue();
    const battle=await page.evaluate(async c=>(await bhSaveDecode(c)).state.sd,battleCode);
    assert.ok(battle.units?.length>0&&battle.units[0].acted);
    assert.ok(Array.isArray(battle.vl));
    console.log('PASS: active combat and acted state included in portable export');
    const mobileFit=await page.locator('#bh-save-dialog').evaluate(el=>{
      const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
    });
    assert.equal(mobileFit,true,'Save dialog stays inside mobile viewport');
    await page.locator('[data-bh-close]').click();
    await page.setViewportSize({width:1280,height:800});
    await page.locator('[data-save-open]').click();
    const desktopFit=await page.locator('#bh-save-dialog').evaluate(el=>{
      const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
    });
    assert.equal(desktopFit,true,'Save dialog stays inside desktop viewport');
    console.log('PASS: Save / Load is usable at mobile and desktop widths');
    await page.locator('[data-bh-tab="import"]').click();
    await page.locator('#bh-save-input').fill(battleCode);
    await page.locator('[data-bh-check]').click();
    await page.locator('[data-bh-import]').waitFor({state:'visible'});
    await page.locator('[data-bh-import]').click();
    await page.waitForFunction(()=>typeof S!=='undefined'&&S.phase==='sd'&&S.sd?.units?.[0]?.acted&&S.sd?.v===S.sd?.vl?.[S.sd.vi||0]?.v);
    assert.equal(await page.evaluate(()=>S.sd.busy),false,'Reloaded combat must be playable, not left busy');
    console.log('PASS: importing a mid-combat save restores the showdown and action state');
    assert.deepEqual(errors,[],'No browser JavaScript errors');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});