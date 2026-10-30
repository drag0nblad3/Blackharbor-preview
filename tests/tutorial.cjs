#!/usr/bin/env node
/* Plays the whole new-player tutorial by tapping only what each beat allows, and checks the
   captions still match what the game does: the planned Signature Move is shown, the scripted
   rolls land as the captions say, and the keep-the-team ending lands in a working HQ. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[];
  try{
    for(const size of [{width:390,height:844},{width:1440,height:900}]){
      const page=await browser.newPage({viewport:size,reducedMotion:'reduce'});
      page.on('pageerror',e=>errors.push(size.width+': '+e.message));
      await page.goto('file://'+process.cwd()+'/index.html');
      await page.evaluate(()=>localStorage.clear());await page.reload();
      await page.click('[data-a="tut:start"]');
      const state=()=>page.evaluate(()=>({b:S.tut&&S.tut.b,id:S.tut&&TUT[S.tut.b]&&TUT[S.tut.b].id,busy:!!(S.sd&&S.sd.busy),
        log:S.sd?S.sd.log.map(l=>l.t).join('\n'):'',plan:[...document.querySelectorAll('#app .cap b')].map(e=>e.textContent).join(' | ')}));
      const seen={};let last=-1,stuck=0;
      for(let step=0;step<200;step++){
        await page.waitForTimeout(150);
        const s=await state();
        if(s.id==='free')break;
        if(s.b!==last){seen[s.id]=s;last=s.b;stuck=0}else if(++stuck>25)assert.fail(`tutorial stuck on beat ${s.id} at ${size.width}px`);
        if(s.id==='b-pages'&&!seen.book){seen.book=true;await page.click('[data-a="book:mole"]');await page.waitForSelector('#comic');
          seen.bookText=await page.textContent('#comic');await page.click('#comic [data-pb^="close"]');await page.waitForSelector('#comic',{state:'detached'});continue}
        const overlay=await page.$('#atk button, #cards button, #brk');
        if(overlay){await overlay.click().catch(()=>{});continue}
        if(s.busy)continue;
        const act=await page.evaluate(()=>{const B=TUT[S.tut.b];
          if(B.id==='p-lp'){const d=tutDig('tB');if(S.tut.lp!==`${d.x},${d.y}`){S.tut.lp=`${d.x},${d.y}`;render()}}
          if(B.next)return B.wait&&!B.wait()?null:'tut:next';
          const o=B.only?(typeof B.only==='function'?B.only():B.only):[];
          /* menu steps go by game state, not by what happens to be visible, so a slow render never closes the menu again */
          if(['b-stun','b-avoid'].includes(B.id)){const sd=S.sd;return sd.combatPick?o[2]:sd.combatMenuOpen===o[0].split(':')[1]?o[1]:o[0]}
          for(const a of o){const e=document.querySelector(`[data-a="${a}"]`);if(e&&e.offsetParent)return a}return o[0]||null});
        if(!act)continue;
        const el=await page.$(act.startsWith('cell:')?`.board [data-cell="${act.slice(5)}"]`:`[data-a="${act}"]`);
        if(el){await el.waitForElementState('visible',{timeout:3000}).catch(()=>{});await el.click({force:true}).catch(()=>{});await page.waitForFunction(()=>!S.sd||!S.sd.busy||document.querySelector('#atk,#cards,#brk'),null,{timeout:5000}).catch(()=>{})}
      }
      assert.match(seen['b-sig'].plan,/Charging: Big Dig/,'the caption names Big Dig, so the charging card must show it');
      assert.match(seen['b-free'].log,/Big Dig is torn from the playbook/,'Volt\'s wound tears Big Dig');
      assert.match(seen['b-free'].log,/planned action was torn out/,'Mole Boy loses round 1, as the caption says');
      assert.match(seen['p-atk2'].log,/Digger attacks Lynx: 9\+2 vs 10\. Hit for 1\.[\s\S]*1\+2 vs 10\. Miss/,'patrol rolls match the captions');
      assert.match(seen['b-free'].log,/Wound roll 6 \+ 8 vs toughness 12\. Wound!/,'Stun Charge wound matches the caption');
      assert.match(seen['b-free'].log,/Clean Hit: Wound roll 4 \+ 2 vs toughness 8\. No wound\./,'Clean Hit miss matches the caption');
      assert.match(seen['b-plan'].plan,/Charging: Tunnel Ambush/,'round 2 shows Tunnel Ambush charging');
      assert.match(seen['b-free'].log,/Volt avoids damage: \+3 evasion/,'Volt uses Avoid Damage');
      assert.match(seen['b-free'].log,/bursts up next to Volt[\s\S]*rolled 7\+2 vs evasion 11\. Miss/,'Tunnel Ambush misses Volt as the caption says');
      assert.match(seen.bookText,/Mole Boy/,'Read playbook opens and closes during the tutorial');
      const end=await page.evaluate(()=>{S.sd.result='win';tutFinish();render();
        const keep=document.querySelector('[data-a="tut:keep"]');keep.click();
        return {phase:S.phase,tut:S.tut,done:S.tutDone,roster:roster().map(h=>h.cls),baton:roster().some(h=>h.gear.arms==='baton'),pool:S.pool.length,mole:S.villains.some(v=>v.key==='mole')||S.pool.includes('mole')}});
      assert.deepEqual(end,{phase:'hq',tut:null,done:true,roster:['lynx','volt'],baton:true,pool:11,mole:false},'keeping the team lands in the campaign');
      console.log(`ok tutorial at ${size.width}px: ${Object.keys(seen).length-2} beats`);
      await page.close();
    }
    assert.deepEqual(errors,[],'no page errors');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
