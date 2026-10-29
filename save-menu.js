/* Blackharbor portable saves. A BH1G code uses gzip + UTF-8 + a checksum;
   BH1J is the uncompressed fallback on browsers without CompressionStream.
   Neither format needs an account or server. The checksum catches corruption,
   but is not a security signature: only import codes from sources you trust. */
const BH_SAVE_MAX_BYTES=4000000;
const BH_SAVE_MAX_TEXT=6000000;
const BH_SAVE_BACKUP_SUFFIX='-before-import';
let bhSavePending=null;
let bhSaveLastFocus=null;

function bhSaveError(message){throw new Error(message)}
function bhSaveHash(bytes){
  let hash=2166136261;
  for(const byte of bytes)hash=Math.imul(hash^byte,16777619)>>>0;
  return hash.toString(16).padStart(8,'0');
}
function bhSaveB64(bytes){
  const parts=[];
  for(let i=0;i<bytes.length;i+=0x8000)
    parts.push(String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000)));
  return btoa(parts.join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function bhSaveUnb64(text){
  if(!text||!/^[A-Za-z0-9_-]+$/.test(text)||text.length%4===1)
    bhSaveError('The save text contains invalid characters.');
  let decoded;
  try{decoded=atob(text.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-text.length%4)%4))}
  catch(_){bhSaveError('The save text is not valid Base64 data.')}
  const bytes=new Uint8Array(decoded.length);
  for(let i=0;i<bytes.length;i++)bytes[i]=decoded.charCodeAt(i);
  if(bhSaveB64(bytes)!==text)bhSaveError('Non-canonical Base64 data: the save text may have changed.');
  return bytes;
}
async function bhSaveZip(bytes){
  const stream=new CompressionStream('gzip');
  const writer=stream.writable.getWriter();
  const data=new Response(stream.readable).arrayBuffer();
  await writer.write(bytes);await writer.close();
  return new Uint8Array(await data);
}
async function bhSaveUnzipLimited(bytes){
  if(typeof DecompressionStream!=='function')bhSaveError('This browser cannot unpack compressed Blackharbor saves.');
  const source=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader=source.getReader(),chunks=[];
  let total=0;
  try{
    for(;;){
      const part=await reader.read();
      if(part.done)break;
      total+=part.value.length;
      if(total>BH_SAVE_MAX_BYTES)bhSaveError('This save is too large to import safely.');
      chunks.push(part.value);
    }
  }catch(e){try{await reader.cancel()}catch(_){}
    if(e.message&&e.message.includes('too large'))throw e;
    bhSaveError('This compressed save could not be decoded.')}
  const out=new Uint8Array(total);
  let p=0;for(const chunk of chunks){out.set(chunk,p);p+=chunk.length}
  return out;
}
async function bhSaveEncode(state){
  const bytes=new TextEncoder().encode(JSON.stringify(state));
  if(bytes.length>BH_SAVE_MAX_BYTES)bhSaveError('This campaign exceeds the 4 MB text-save limit.');
  let mode='J',payload=bytes;
  if(typeof CompressionStream==='function'){
    try{const zipped=await bhSaveZip(bytes);
      if(zipped.length<bytes.length){mode='G';payload=zipped}
    }catch(_){/* The uncompressed version is always portable. */}
  }
  return 'BH1'+mode+'.'+bhSaveHash(bytes)+'.'+bhSaveB64(payload);
}
function bhSaveIsObject(obj){return obj!==null&&typeof obj==='object'&&!Array.isArray(obj)}
function bhSaveValidate(state){
  if(!bhSaveIsObject(state))bhSaveError('The save must contain a campaign object.');
  if(!Number.isInteger(state.vol)||state.vol<1||state.vol>10000||
     !Number.isInteger(state.issue)||state.issue<1||state.issue>10000)
    bhSaveError('The save is missing a valid volume or issue number.');
  if(!['hq','inv','sd','after','over','tutend','arc'].includes(state.phase))
    bhSaveError('The save has an unknown game phase.');
  for(const key of ['heroes','villains','pool','armory','party','facilities']){
    if(!Array.isArray(state[key]))bhSaveError('The save is missing its '+key+' records.');
  }
  if(!bhSaveIsObject(state.salvage))bhSaveError('The save is missing its resources.');
  // New campaigns legitimately have zero revealed bosses until four recruits join.
  if(state.villains.length===0&&state.pool.length===0)
    bhSaveError('The save has no villains remaining to reveal.');
  if(state.heroes.length>50||state.villains.length>100||
     state.party.length>12||state.pool.length>100)
    bhSaveError('The save contains an invalid number of heroes or villains.');
  for(const h of state.heroes){
    if(!bhSaveIsObject(h)||typeof h.id!=='string'||typeof h.name!=='string'||
      !bhSaveIsObject(h.ranks)||!bhSaveIsObject(h.gear)||
      !(typeof h.cls==='string'&&(HERO_BASE[h.cls]||h.cls==='custom'&&bhSaveIsObject(h.base)))||
      !Number.isFinite(h.hp)||!Number.isFinite(h.comp))
      bhSaveError('The save contains an invalid hero.');
  }
  for(const v of state.villains){
    if(!bhSaveIsObject(v)||!VILLAINS[v.key]||!Array.isArray(v.deck))
      bhSaveError('The save contains an unknown or damaged villain.');
  }
  if(state.sd!=null){
    if(!bhSaveIsObject(state.sd)||!Array.isArray(state.sd.units)||
       (!Array.isArray(state.sd.vl)&&!bhSaveIsObject(state.sd.v))||
       typeof state.sd.vkey!=='string'||!VILLAINS[state.sd.vkey])
      bhSaveError('The save has damaged combat data.');
  }
  // Reject prototype pollution and pathological nesting in imported JSON.
  const seen=new Set(),stack=[{value:state,depth:0}];
  let count=0;
  while(stack.length){
    const cur=stack.pop();
    if(++count>150000||cur.depth>70)bhSaveError('This save contains excessive nested data.');
    const obj=cur.value;
    if(!obj||typeof obj!=='object')continue;
    if(seen.has(obj))continue;seen.add(obj);
    for(const key of Object.keys(obj)){
      if(key==='__proto__'||key==='prototype'||key==='constructor')
        bhSaveError('This save has an unsafe property.');
      const child=obj[key];if(child&&typeof child==='object')stack.push({value:child,depth:cur.depth+1});
    }
  }
  const heroCount=state.heroes.filter(h=>!h.retired).length;
  return {state:state,summary:'Volume '+state.vol+' · Issue '+state.issue+' · '+heroCount+
    ' active '+(heroCount===1?'hero':'heroes')+' · '+(state.phase==='sd'?'In combat':state.phase==='inv'?'Investigating':'Campaign '+state.phase)};
}
async function bhSaveDecode(code){
  if(typeof code!=='string'||!code.trim())bhSaveError('Paste a Blackharbor save string first.');
  const clean=code.trim().replace(/\s/g,'');
  if(clean.length>BH_SAVE_MAX_TEXT)bhSaveError('This save string is too long.');
  const match=/^BH1([JG])\.([0-9a-fA-F]{8})\.([A-Za-z0-9_-]+)$/.exec(clean);
  if(!match)bhSaveError('Unrecognized save format. The text should begin with BH1G. or BH1J.');
  const payload=bhSaveUnb64(match[3]);
  if(payload.length>BH_SAVE_MAX_BYTES)bhSaveError('This save exceeds the size limit.');
  const bytes=match[1]==='G'?await bhSaveUnzipLimited(payload):payload;
  if(bhSaveHash(bytes)!==match[2].toLowerCase())
    bhSaveError('Checksum mismatch: the save text may be missing or changed characters.');
  let state;
  try{state=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}
  catch(_){bhSaveError('This save does not contain valid UTF-8 JSON campaign data.')}
  return bhSaveValidate(state);
}
function bhSaveUIStatus(text,isError){
  const target=document.getElementById('bh-save-status');
  if(!target)return;
  target.textContent=text||'';
  target.classList.toggle('error',!!isError);
}
function bhSaveTab(tab){
  const dialog=document.getElementById('bh-save-dialog');if(!dialog)return;
  for(const name of ['export','import']){
    const panel=dialog.querySelector('[data-bh-panel="'+name+'"]');
    const button=dialog.querySelector('[data-bh-tab="'+name+'"]');
    panel.hidden=name!==tab;
    button.setAttribute('aria-selected',String(name===tab));
  }
  bhSaveUIStatus('',false);
}
function bhSaveOpen(){
  if(document.getElementById('bh-save-dialog'))return;
  bhSaveLastFocus=document.activeElement;
  bhSavePending=null;
  const dialog=document.createElement('dialog');
  dialog.id='bh-save-dialog';
  dialog.className='bh-save-dialog';
  dialog.setAttribute('aria-labelledby','bh-save-title');
  dialog.innerHTML=[
    '<div class="bh-save-heading"><div><div class="eyebrow">Campaign archive</div><h2 id="bh-save-title">Save / Load</h2></div>',
    '<button class="btn sm" type="button" data-bh-close aria-label="Close save menu">✕</button></div>',
    '<div class="small muted">The game autosaves in this browser. Use a text code to back up your campaign or transfer it to another device.</div>',
    '<div class="bh-save-tabs" role="tablist" aria-label="Save or load">',
    '<button class="btn sm on" data-bh-tab="export" role="tab" type="button" aria-selected="true">Export</button>',
    '<button class="btn sm" data-bh-tab="import" role="tab" type="button" aria-selected="false">Import</button>',
    '</div>',
    '<section data-bh-panel="export" role="tabpanel" class="bh-save-panel">',
    '<label class="eyebrow" for="bh-save-output">Your current campaign</label>',
    '<textarea id="bh-save-output" class="bh-save-code" readonly spellcheck="false" aria-label="Portable Blackharbor save code"></textarea>',
    '<div class="row"><button type="button" class="btn pri" data-bh-copy>Copy save string</button>',
    '<button type="button" class="btn sm" data-bh-select>Select text</button></div>',
    '<p class="small muted">This string contains your campaign data. Keep it somewhere private and safe.</p>',
    '</section>',
    '<section data-bh-panel="import" role="tabpanel" class="bh-save-panel" hidden>',
    '<label class="eyebrow" for="bh-save-input">Paste a campaign save</label>',
    '<textarea id="bh-save-input" class="bh-save-code" spellcheck="false" placeholder="BH1G. ... or BH1J. ..." aria-label="Paste Blackharbor save code"></textarea>',
    '<div class="row"><button type="button" class="btn sm" data-bh-check>Check save</button>',
    '<button type="button" class="btn sm" data-bh-restore>Restore previous import</button></div>',
    '<div id="bh-save-preview" class="cap" hidden></div>',
    '<button type="button" class="btn pri bh-save-confirm" data-bh-import hidden>Replace current campaign</button>',
    '<p class="small muted">Importing replaces your current campaign on this device. We preserve the previous autosave as a local backup.</p>',
    '</section>',
    '<p id="bh-save-status" class="bh-save-status small" role="status" aria-live="polite"></p>'
  ].join('');
  document.body.appendChild(dialog);
  dialog.addEventListener('close',()=>{
    dialog.remove();bhSavePending=null;
    if(bhSaveLastFocus&&bhSaveLastFocus.isConnected)bhSaveLastFocus.focus({preventScroll:true});
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.showModal();
  dialog.querySelector('[data-bh-tab="export"]').focus({preventScroll:true});
  const restore=dialog.querySelector('[data-bh-restore]');
  try{restore.disabled=!localStorage.getItem(KEY+BH_SAVE_BACKUP_SUFFIX)}
  catch(_){restore.disabled=true}
  // Capture a single consistent snapshot while any asynchronous compression runs.
  bhSaveEncode(S).then(code=>{
    const output=document.getElementById('bh-save-output');
    if(output)output.value=code;
  }).catch(e=>{bhSaveUIStatus('Export unavailable: '+e.message,true)});
}
async function bhSaveCopy(){
  const field=document.getElementById('bh-save-output');
  if(!field||!field.value){bhSaveUIStatus('Export is not ready yet.',true);return}
  try{
    if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(field.value);
    bhSaveUIStatus('Save string copied to clipboard.',false);
  }catch(_){
    field.focus();field.select();
    let copied=false;
    try{copied=!!document.execCommand('copy')}catch(_){}
    bhSaveUIStatus(copied?'Save string copied to clipboard.':'Save text selected. Use Copy from your browser or keyboard.',false);
  }
}
async function bhSaveInspect(text){
  bhSavePending=null;
  const preview=document.getElementById('bh-save-preview'),confirm=document.querySelector('[data-bh-import]');
  if(preview)preview.hidden=true;
  if(confirm)confirm.hidden=true;
  try{
    const result=await bhSaveDecode(text);
    const input=document.getElementById('bh-save-input');
    if(!input||input.value.trim()!==text.trim())return;
    bhSavePending={state:result.state,code:text.trim()};
    if(preview){preview.textContent='Ready to load: '+result.summary;preview.hidden=false}
    if(confirm)confirm.hidden=false;
    bhSaveUIStatus('Save verified. Review the details before replacing the current campaign.',false);
  }catch(e){bhSaveUIStatus(e.message||'Unable to read this save.',true)}
}
function bhSaveImport(){
  const input=document.getElementById('bh-save-input'),pending=bhSavePending;
  if(!pending||!input||input.value.trim()!==pending.code)return;
  if(S.sd&&S.sd.busy){bhSaveUIStatus('Finish the current combat animation before importing.',true);return}
  try{
    const raw=JSON.stringify(pending.state),before=localStorage.getItem(KEY);
    // Save a recovery copy before changing the active autosave.
    if(before!==null)localStorage.setItem(KEY+BH_SAVE_BACKUP_SUFFIX,before);
    localStorage.setItem(KEY,raw);
    window.location.reload();
  }catch(e){bhSaveUIStatus('Could not save imported campaign: '+e.message,true)}
}
function bhSaveRestore(){
  try{
    const raw=localStorage.getItem(KEY+BH_SAVE_BACKUP_SUFFIX);
    if(!raw){bhSaveUIStatus('No previous import backup is stored.',true);return}
    // Existing autosaves are ordinary JSON; wrap them in the same validation.
    const state=JSON.parse(raw),summary=bhSaveValidate(state).summary;
    const confirm=document.querySelector('[data-bh-import]'),preview=document.getElementById('bh-save-preview');
    bhSavePending={state:state,code:'BACKUP'};
    const input=document.getElementById('bh-save-input');
    if(input)input.value='BACKUP';
    if(preview){preview.textContent='Restore previous autosave: '+summary;preview.hidden=false}
    if(confirm)confirm.hidden=false;
    bhSaveUIStatus('Previous autosave is ready. Confirm to restore it.',false);
  }catch(e){bhSaveUIStatus('Previous backup is invalid: '+e.message,true)}
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-save-open],[data-bh-close],[data-bh-tab],[data-bh-copy],[data-bh-select],[data-bh-check],[data-bh-import],[data-bh-restore]');
  if(!b||b.disabled)return;
  if(b.hasAttribute('data-save-open')){bhSaveOpen();return}
  if(b.hasAttribute('data-bh-close')){const d=document.getElementById('bh-save-dialog');if(d)d.close();return}
  if(b.hasAttribute('data-bh-tab')){bhSaveTab(b.dataset.bhTab);return}
  if(b.hasAttribute('data-bh-copy')){bhSaveCopy();return}
  if(b.hasAttribute('data-bh-select')){const t=document.getElementById('bh-save-output');if(t){t.focus();t.select();bhSaveUIStatus('Save text selected.',false)}return}
  if(b.hasAttribute('data-bh-check')){const t=document.getElementById('bh-save-input');if(t)bhSaveInspect(t.value);return}
  if(b.hasAttribute('data-bh-import')){bhSaveImport();return}
  if(b.hasAttribute('data-bh-restore')){bhSaveRestore();return}
});
document.addEventListener('input',e=>{
  if(e.target.id!=='bh-save-input')return;
  bhSavePending=null;
  const preview=document.getElementById('bh-save-preview'),confirm=document.querySelector('[data-bh-import]');
  if(preview)preview.hidden=true;if(confirm)confirm.hidden=true;
  bhSaveUIStatus('',false);
});
document.addEventListener('keydown',e=>{
  const dialog=document.getElementById('bh-save-dialog');
  if(e.key==='Escape'&&dialog&&dialog.open){
    e.stopImmediatePropagation();e.preventDefault();dialog.close();
  }
},true);