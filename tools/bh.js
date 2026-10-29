/* Shared headless loader for the game at the repo root (index.html plus data.js, game.js, art.js...). Reads the files straight
   from disk (no copies, no build step). It also still loads an old single-file build (a .html with inline scripts).
   and runs it in a node vm context with the same DOM stand-ins as sim/stub.js.
   const bh=require('./bh');const g=bh.load({seed:1,patches:['SET_N=3']});g.get('GEAR.wings');g.run('code') */
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const DEF_HTML=path.join(__dirname,'..');
const STUB=fs.readFileSync(path.join(__dirname,'stub.js'),'utf8');

/* every <script> block in order (game, then the art block's drawing code, then boot), minus the boot lines and the
   clip-path style IIFE, as sim/build.sh stripped them */
const scriptLines=L=>{const out=[];let inS=false;L.forEach((l,i)=>{if(l==='</script>')inS=false;if(inS)out.push(i);if(l==='<script>')inS=true});return out};
const isDir=f=>fs.existsSync(f)&&fs.statSync(f).isDirectory();
/* the game's own scripts in page order, from the <script src> tags in index.html (sprite.js only draws the SVG sprite) */
function gameFiles(dir){const idx=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  return [...idx.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m=>m[1]).filter(f=>f!=='sprite.js')
    .map(f=>({name:f,lines:fs.readFileSync(path.join(dir,f),'utf8').split('\n')}))}
/* where a game lives, as [{name, lines, idx: script line indexes}]: one entry per file, or the one html for an old build */
function sources(file){if(isDir(file))return gameFiles(file).map(g=>({...g,idx:g.lines.map((_,i)=>i)}));
  const L=fs.readFileSync(file,'utf8').split('\n');return [{name:path.basename(file),lines:L,idx:scriptLines(L)}]}
function gameScript(html){const L=html.split('\n');return keepLines(scriptLines(L).map(i=>L[i]))}
function keepLines(lines){
  const out=[];let skip=false;
  for(const l of lines){
    if(!skip&&/^\(function\(\)\{const pts=\[\]/.test(l))skip=true;
    if(skip){if(/^  const st=document\.createElement/.test(l))skip=false;continue}
    if(l==='if(!load())newCampaign();'||l==='render();')continue;
    out.push(l)}
  return out.join('\n')+'\n'}

/* mulberry32: small seeded PRNG so runs repeat exactly */
function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const cache={};
function readGame(file){const S=sources(file),all=S.map(x=>x.lines.join('\n')).join('\n'),hash=crypto.createHash('md5').update(all).digest('hex').slice(0,10);
  if(!cache[hash])cache[hash]={hash,code:keepLines(S.flatMap(x=>x.idx.map(i=>x.lines[i])))};return cache[hash]}

/* opts: html (game folder, its index.html, or an old single-file .html; default: the repo root), seed (number; omit for Math.random), env (object seen as process.env), patches (code strings or .js paths run after the game),
   subs (['old text=>new text', ...] replaced in the game script before it runs; use for consts like SET_N that a patch cannot reassign) */
function load(opts={}){
  const file=path.basename(opts.html||'')==='index.html'?path.dirname(opts.html):opts.html||DEF_HTML,G=readGame(file);let code=G.code;
  for(const s of opts.subs||[]){const i=s.indexOf('=>');const from=s.slice(0,i),to=s.slice(i+2);if(i<1||!code.includes(from))throw new Error('--sub text not found: '+from);code=code.split(from).join(to)}
  const ctx=vm.createContext({console,setTimeout,clearTimeout,setInterval,clearInterval,setImmediate,clearImmediate,queueMicrotask,structuredClone,
    process:{env:{...(opts.env||{})},exit(){}}});
  if(opts.seed!=null)vm.runInContext('Math.random=__r;delete globalThis.__r',Object.assign(ctx,{__r:rng(opts.seed)}));
  vm.runInContext(STUB,ctx,{filename:'stub.js'});
  vm.runInContext(code,ctx,{filename:path.basename(file)});
  const run=(code,name)=>vm.runInContext(code,ctx,{filename:name||'patch.js'});
  for(const p of opts.patches||[])/\.js$/.test(p)&&fs.existsSync(p)?run(fs.readFileSync(p,'utf8'),p):run(p);
  return {ctx,hash:G.hash,file,run,get:expr=>run('('+expr+')','expr')}}

module.exports={load,gameScript,scriptLines,sources,gameFiles,rng,DEF_HTML};
