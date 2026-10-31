// Presentation only. Paths and native dimensions from assets/villain-covers/manifest.json.
const VILLAIN_COVERS = {
  "gallows": {
    "cover": "assets/villain-covers/gallows.webp",
    "thumb": "assets/villain-covers/thumbs/gallows.webp",
    "width": 1024,
    "height": 1536
  },
  "quarry": {
    "cover": "assets/villain-covers/quarry.webp",
    "thumb": "assets/villain-covers/thumbs/quarry.webp",
    "width": 1024,
    "height": 1536
  },
  "cantor": {
    "cover": "assets/villain-covers/cantor.webp",
    "thumb": "assets/villain-covers/thumbs/cantor.webp",
    "width": 1024,
    "height": 1536
  },
  "architect": {
    "cover": "assets/villain-covers/architect.webp",
    "thumb": "assets/villain-covers/thumbs/architect.webp",
    "width": 724,
    "height": 1086
  },
  "helios": {
    "cover": "assets/villain-covers/helios.webp",
    "thumb": "assets/villain-covers/thumbs/helios.webp",
    "width": 1024,
    "height": 1536
  },
  "serpent": {
    "cover": "assets/villain-covers/serpent.webp",
    "thumb": "assets/villain-covers/thumbs/serpent.webp",
    "width": 1024,
    "height": 1536
  },
  "lode": {
    "cover": "assets/villain-covers/lode.webp",
    "thumb": "assets/villain-covers/thumbs/lode.webp",
    "width": 1024,
    "height": 1536
  },
  "noct": {
    "cover": "assets/villain-covers/noct.webp",
    "thumb": "assets/villain-covers/thumbs/noct.webp",
    "width": 1024,
    "height": 1536
  },
  "swarm": {
    "cover": "assets/villain-covers/swarm.webp",
    "thumb": "assets/villain-covers/thumbs/swarm.webp",
    "width": 1024,
    "height": 1536
  },
  "bomber": {
    "cover": "assets/villain-covers/bomber.webp",
    "thumb": "assets/villain-covers/thumbs/bomber.webp",
    "width": 1024,
    "height": 1536
  },
  "grid": {
    "cover": "assets/villain-covers/grid.webp",
    "thumb": "assets/villain-covers/thumbs/grid.webp",
    "width": 1024,
    "height": 1536
  },
  "mole": {
    "cover": "assets/villain-covers/mole.webp",
    "thumb": "assets/villain-covers/thumbs/mole.webp",
    "width": 1024,
    "height": 1536
  }
};

function villainCoverPreview(key){
  const art=VILLAIN_COVERS[key];
  if(!art)return '';
  return `<button type="button" class="cover-preview" data-pb="art" aria-label="Open ${esc(VILLAINS[key].name)} comic cover at full size"><img src="${art.thumb}" alt="${esc(VILLAINS[key].name)} BLACKHARBOR comic cover" width="320" height="480" decoding="async"><span>Tap or click for full cover</span></button>`;
}

/* Native modal supplies focus trapping, Escape and focus restoration without touching campaign state. */
let coverReturnFocus=null;
function coverBrowser(){
  let dialog=document.getElementById('cover-browser');
  if(dialog)return dialog;
  coverReturnFocus=document.activeElement;
  dialog=document.createElement('dialog');
  dialog.id='cover-browser';dialog.setAttribute('aria-labelledby','cover-title');
  dialog.addEventListener('close',()=>{
    dialog.remove();
    if(coverReturnFocus&&coverReturnFocus.isConnected)coverReturnFocus.focus({preventScroll:true});
    coverReturnFocus=null;
  });
  dialog.addEventListener('click',e=>{
    const button=e.target.closest('[data-cover]');if(!button)return;
    const [action,key]=button.dataset.cover.split(':');
    if(action==='close')dialog.close();
    if(action==='gallery')openCoverGallery();
    if(action==='view')openVillainCover(key);
    if(action==='step')turnVillainCover(+key);
  });
  dialog.addEventListener('keydown',e=>{
    // Arrow keys browse artwork only, never turn the playbook behind this modal.
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();e.stopPropagation();
      if(dialog.dataset.key)turnVillainCover(e.key==='ArrowRight'?1:-1);
    }
  });
  document.body.appendChild(dialog);
  return dialog;
}
function presentCoverBrowser(dialog,focus){
  if(!dialog.open)dialog.showModal();
  dialog.scrollTop=0;
  dialog.querySelector(focus).focus({preventScroll:true});
}
function openCoverGallery(){
  const dialog=coverBrowser();delete dialog.dataset.key;
  dialog.innerHTML=`<div class="cover-bar"><h2 id="cover-title">BLACKHARBOR comic covers</h2><button type="button" class="btn sm" data-cover="close">Close covers</button></div>
    <p class="cover-help">All 12 approved covers. Select one to view the complete artwork.</p>
    <div class="cover-grid">${Object.entries(VILLAIN_COVERS).map(([key,art])=>`<button type="button" class="cover-card" data-cover="view:${key}" aria-label="View ${esc(VILLAINS[key].name)} comic cover"><img src="${art.thumb}" alt="${esc(VILLAINS[key].name)} BLACKHARBOR comic cover" width="320" height="480" loading="lazy" decoding="async"><span>${esc(VILLAINS[key].name)}</span></button>`).join('')}</div>`;
  presentCoverBrowser(dialog,'[data-cover="close"]');
}
function openVillainCover(key){
  const art=VILLAIN_COVERS[key];if(!art)return;
  const dialog=coverBrowser(),keys=Object.keys(VILLAIN_COVERS),name=VILLAINS[key].name;
  dialog.dataset.key=key;
  dialog.innerHTML=`<div class="cover-bar"><h2 id="cover-title">${esc(name)} · Comic cover</h2><button type="button" class="btn sm" data-cover="gallery">All 12 covers</button><button type="button" class="btn sm" data-cover="close">Close cover</button></div>
    <img class="cover-full" src="${art.cover}" alt="${esc(name)} — complete approved BLACKHARBOR comic cover" width="${art.width}" height="${art.height}" decoding="async">
    <div class="cover-controls"><button type="button" class="btn sm" data-cover="step:-1">Previous cover</button><span aria-live="polite">${keys.indexOf(key)+1} / ${keys.length}</span><button type="button" class="btn sm" data-cover="step:1">Next cover</button><a class="cover-original" href="${art.cover}" target="_blank" rel="noopener">Open full-size image ↗</a></div>
    <p class="cover-help">Use Previous / Next or the arrow keys. Open the full-size image to zoom.</p>`;
  presentCoverBrowser(dialog,'[data-cover="close"]');
}
function turnVillainCover(direction){
  const dialog=document.getElementById('cover-browser');if(!dialog||!dialog.dataset.key)return;
  const keys=Object.keys(VILLAIN_COVERS),index=keys.indexOf(dialog.dataset.key);
  openVillainCover(keys[(index+direction+keys.length)%keys.length]);
  dialog.querySelector(`[data-cover="step:${direction}"]`).focus({preventScroll:true});
}
