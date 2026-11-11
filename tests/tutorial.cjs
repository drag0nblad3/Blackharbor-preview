#!/usr/bin/env node
/* Plays the whole new-player tutorial by tapping only what each beat allows, and checks the
   captions still match what the game does: the planned Signature Move is shown, the scripted
   rolls land as the captions say, the numbers each caption quotes match the fight log and the live stats,
   and the keep-the-team ending lands in a working HQ. If a rule, stat or starting item changes, this fails
   until the caption in src/tutorial/script.js is brought up to date. */
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
      const opening=page.frameLocator('iframe[title="Blackharbor opening menu"]');
      await opening.locator('#new-button').click();
      await opening.getByRole('button',{name:'Start Game',exact:true}).click();
      const state=()=>page.evaluate(()=>({b:S.tut&&S.tut.b,id:S.tut&&TUT[S.tut.b]&&TUT[S.tut.b].id,busy:!!(S.sd&&S.sd.busy),
        log:S.sd?S.sd.log.map(l=>l.t).join('\n'):'',cap:(document.querySelector('#tutc p')||{}).textContent||'',plan:[...document.querySelectorAll('#app .cap b')].map(e=>e.textContent).join(' | ')}));
      const seen={},caps={};let last=-1,stuck=0,spent=0;
      for(let step=0;step<200;step++){
        await page.waitForTimeout(150);
        const s=await state();
        if(s.id==='free')break;
        if(s.cap)caps[s.id]=s.cap;
        if(s.b!==last){seen[s.id]=s;last=s.b;stuck=0}else if(++stuck>25){const dbg=await page.evaluate(()=>JSON.stringify({sel:S.sd.sel,mode:S.sd.mode,busy:S.sd.busy,round:S.sd.round,units:S.sd.units.map(u=>[u.x,u.y,u.moved,u.acted]),ov:[...document.querySelectorAll("#atk,#cards,#brk,#hpop,#comic,#guide,.tipbox,[role=dialog]")].map(e=>e.id+"."+e.className)}));assert.fail(`tutorial stuck on beat ${s.id} at ${size.width}px `+dbg)}
        if(s.id==='b-pages'&&!seen.book){seen.book=true;await page.click('[data-a="book:mole"]');await page.waitForSelector('#comic');
          seen.bookText=await page.textContent('#comic');await page.click('#comic [data-pb^="close"]');await page.waitForSelector('#comic',{state:'detached'});continue}
        const hpop=await page.$('#hpop [data-h="1"]');
        if(hpop){spent++;seen.hpopCap=(await state()).cap;await hpop.click().catch(()=>{});continue}
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
      assert.match(seen['b-free'].log,/Big Dig is torn from the playbook/,'the second wound tears Big Dig');
      assert.match(seen['b-lres'].log,/Wound roll 6 \+ 8 vs toughness 12\. Wound![\s\S]*Soft Belly[\s\S]*Big Dig is torn from the playbook/,'Lynx\'s Soft Belly wound, not Volt\'s, tears Big Dig (half level + 1 = 2 wounds)');
      assert.doesNotMatch(seen['b-lmove'].log,/Big Dig is torn/,'one wound is not enough to tear Big Dig');
      assert.match(seen['b-free'].log,/planned action was torn out/,'Mole Boy loses round 1, as the caption says');
      assert.match(seen['p-atk2'].log,/Digger attacks Lynx: 9\+2 vs 10\. Hit for 1\.[\s\S]*1\+2 vs 10\. Miss/,'patrol rolls match the captions');
      assert.match(seen['b-free'].log,/Wound roll 6 \+ 8 vs toughness 12\. Wound!/,'Stun Charge wound matches the caption');
      assert.match(seen['b-free'].log,/Clean Hit: Wound roll 4 \+ 2 vs toughness 8\. No wound\./,'Clean Hit miss matches the caption');
      assert.match(seen['b-plan'].plan,/Charging: Tunnel Ambush/,'round 2 shows Tunnel Ambush charging');
      assert.match(seen['b-free'].log,/Volt avoids damage: \+3 evasion/,'Volt uses Avoid Damage');
      /* Heroism: taught once on the last Digger, never asked during the other scripted rolls */
      assert.equal(spent,1,'exactly one Heroism pop-up, on the last Digger');
      assert.match(seen.hpopCap,/Heroism/,'the caption explains the pop-up while it is up');
      assert.match(seen['p-hero'].log,/Lynx spends 1 Heroism/,'Lynx spends Heroism to finish the Digger');
      /* the numbers in each caption must match the live game */
      const st=await page.evaluate(()=>{const s=k=>roster().find(h=>h.cls===k);return {lynxAcc:stat(s('lynx'),'acc'),lynxEva:stat(s('lynx'),'eva'),voltEva:stat(s('volt'),'eva'),voltStr:stat(s('volt'),'str'),stun:GEAR.baton.ab.c}});
      /* caption text straight from the beats (some beats pass too quickly to sample on screen) */
      Object.assign(caps,await page.evaluate(()=>Object.fromEntries(TUT.filter(b=>b.t).map(b=>[b.id,String(typeof b.t==='function'?b.t():b.t).replace(/<[^>]+>/g,'')]))));
      const has=(id,str,why)=>assert.ok((caps[id]||'').includes(str),`caption ${id} should say "${str}" (${why}); it says: ${caps[id]}`);
      has('p-roll',`14 + ${st.lynxAcc} = ${14+st.lynxAcc}`,'Lynx accuracy');has('p-roll',`2 + ${st.lynxAcc} = ${2+st.lynxAcc}`,'Lynx accuracy');
      has('p-enemy',`evasion of ${st.lynxEva}`,'Lynx evasion');
      has('b-vres',`6 + ${st.voltStr+3} = ${st.voltStr+9}`,'Volt Strength with Stun Charge');has('b-vres',`6 + ${st.voltStr} = ${st.voltStr+6}`,'Volt Strength');
      has('b-stun',`spends ${st.stun} Power`,'Stun Charge cost');
      has('b-vturn2',`evasion of ${st.voltEva}`,'Volt evasion');has('b-vturn2',`raised it to ${st.voltEva+3}`,'Avoid Damage +3');
      assert.ok(st.voltEva<=9,'Tunnel Ambush rolls 9, so the caption\'s "would hit" needs Volt\'s evasion at 9 or less');
      assert.match(seen['b-free'].log,new RegExp(`rolled 7\\+2 vs evasion ${st.voltEva+3}\\. Miss`),'Tunnel Ambush misses Volt as the caption says');
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
