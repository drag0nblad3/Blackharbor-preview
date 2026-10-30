#!/usr/bin/env node
/* Ask the build at the repo root questions without reading the game files. All data is read AFTER every patch block runs.
   node tools/q.js 'GEAR.wings'            any JS expression, printed as compact JSON (--max N chars, default 4000)
   node tools/q.js gear [regex] [--txt]    one line per item; regex filters the line (e.g. 'magic', 'set grid', 'arms.*main')
   node tools/q.js villain [key]           villain stats + card list; no key = one line each
   node tools/q.js sets | fac | heroes | powers
   node tools/q.js outline [regex]         top-level declarations and Version comments in the game scripts, as file:line
   node tools/q.js where <word> [--w N]    script lines mentioning word, cut to N chars (default 160)
   node tools/q.js dump [file]             full post-patch data as JSON (default tools/cache/data.json)
   add --html <game folder or old .html> to point at another build, --patch 'code' / --sub 'old=>new' to apply a change first */
const fs=require('fs'),path=require('path'),bh=require('./bh');
const a=process.argv.slice(2),flag=(k,d)=>{const i=a.indexOf(k);if(i<0)return d;const v=a[i+1];a.splice(i,2);return v},has=k=>{const i=a.indexOf(k);if(i<0)return false;a.splice(i,1);return true};
const subs=[];let sb;while((sb=flag('--sub')))subs.push(sb);const html=flag('--html'),max=+flag('--max',4000),w=+flag('--w',160),txt=has('--txt'),patches=[];let p;while((p=flag('--patch')))patches.push(p);
const [cmd,arg]=a;
const file=html?path.resolve(html):bh.DEF_HTML;
const strip=s=>String(s).replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const kv=o=>o?Object.entries(o).map(([k,v])=>k+(typeof v==='object'?JSON.stringify(v):v)).join(' '):'';
const out=s=>console.log(s.length>max?s.slice(0,max)+` …(+${s.length-max} chars, raise --max)`:s);

if(cmd==='outline'||cmd==='where'){
  const re=cmd==='where'?new RegExp('\\b'+arg+'\\b'):arg?new RegExp(arg,'i'):null;
  for(const S of bh.sources(path.basename(file)==='index.html'?path.dirname(file):file))for(const i of S.idx){const l=S.lines[i],at=S.name+':'+(i+1);
    if(cmd==='where'){if(re.test(l)){const j=Math.max(0,l.search(re)-40);console.log(at+': '+(j?'…':'')+l.slice(j,j+w))}continue}
    const m=l.match(/^(?:async )?function (\w+)|^(?:const|let|var) (\w+)|^\/\* *(Version \d+[^*]{0,90})/);
    if(m){const s=at+' '+(m[1]?'fn '+m[1]:m[2]?'= '+m[2]:'# '+m[3]);if(!re||re.test(s))console.log(s)}}
  return}

const g=bh.load({html:file,patches,subs});
if(!cmd){console.log(fs.readFileSync(__filename,'utf8').split('\n').slice(1,11).join('\n'));return}
const D=g.get(`(()=>{const U={};const put=(l,t)=>(l||[]).forEach(i=>(U[i]=U[i]||[]).push(t));
  put(START_UNLOCK,'start');for(const n in ARC_UNLOCK)put(ARC_UNLOCK[n],'arc'+n);if(typeof MID_UNLOCK!=='undefined')put(MID_UNLOCK,'mid2');
  for(const v in DEFEAT_UNLOCK)put(DEFEAT_UNLOCK[v],'beat:'+v);
  return {GEAR,SETS,VILLAINS,FAC,POWERS,HERO_BASE,U,SET_N:typeof SET_N!=='undefined'?SET_N:null}})()`);

if(cmd==='gear'){const re=arg?new RegExp(arg,'i'):null;
  for(const[k,x]of Object.entries(D.GEAR)){
    const ab=x.ab?`[${x.ab.n}${x.ab.c!=null?' c'+x.ab.c:''}${x.ab.min!=null?' min'+x.ab.min:''}${x.ab.mode?' '+x.ab.mode:''}${x.ab.r!=null?' r'+x.ab.r:''} ${kv(x.ab.fx)}]`:'';
    const extra=['two','riposte','relent','rescue','jumps','auraFx','aura','pair','field'].filter(f=>x[f]).map(f=>x[f]===true?f:f+':'+JSON.stringify(x[f])).join(' ');
    let s=`${k} | ${x.name} | ${x.cons?'cons':x.slot}${x.hand?'/'+x.hand:''} | ${kv(x.reqs)||x.type+x.req} | cost ${kv(x.cost)} | ${kv(x.mods)} ${ab} ${extra}${x.set?' | set '+x.set:''} | ${(D.U['gear:'+k]||['-']).join(',')}`.replace(/ +/g,' ');
    if(txt&&x.ab)s+=' | '+strip(g.get(`abTxt(GEAR[${JSON.stringify(k)}].ab,null)`));
    if(!re||re.test(s))console.log(s)}}
else if(cmd==='villain'){const sc=v=>Object.entries(v).filter(([,x])=>typeof x!=='object').map(([k,x])=>k+'='+x).join(' ');
  if(!arg)for(const[k,v]of Object.entries(D.VILLAINS))console.log(`${k} | ${sc(v)} | ${Object.keys(v.cards||{}).length} cards`);
  else{const v=D.VILLAINS[arg];if(!v){console.log('no villain '+arg+'; keys: '+Object.keys(D.VILLAINS).join(' '));return}
    console.log(sc(v));for(const k of ['hench','elite'])if(v[k])console.log(k+': '+JSON.stringify(v[k]));
    for(const k of ['base','adv'])if(v[k])console.log(k+': '+v[k].join(' '));
    for(const[id,c]of Object.entries(v.cards||{}))console.log(`  ${id}: `+Object.entries(c).filter(([f])=>!['shout','brk'].includes(f)).map(([f,x])=>f+'='+(typeof x==='object'?JSON.stringify(x):x)).join(' '))}}
else if(cmd==='sets'){console.log('pieces to activate: '+D.SET_N);for(const[k,s]of Object.entries(D.SETS)){const pcs=Object.keys(D.GEAR).filter(i=>D.GEAR[i].set===k);console.log(`${k} | ${s.n||s.name} | ${kv(s.mods)} | ${strip(s.txt||'')} | ${pcs.join(' ')}`)}}
else if(cmd==='fac')for(const[k,f]of Object.entries(D.FAC))console.log(`${k} | ${f.name} | cost ${kv(f.cost)} | ${(D.U['fac:'+k]||['-']).join(',')} | ${strip(f.txt||'')}`);
else if(cmd==='heroes')for(const[k,h]of Object.entries(D.HERO_BASE))console.log(`${k} | ${h.name} | ${h.role} | ${h.track} | `+['maxHp','move','speed','acc','str','eva','range','maxComp'].map(s=>s+' '+h[s]).join(' ')+` | power ${h.power}`);
else if(cmd==='powers')for(const[k,x]of Object.entries(D.POWERS))console.log(`${k} | ${x.name} | `+Object.entries(x).filter(([f])=>!['name','txt'].includes(f)).map(([f,v])=>f+'='+JSON.stringify(v)).join(' ')+' | '+strip(x.txt||''));
else if(cmd==='dump'){const f=arg||path.join(__dirname,'cache','data.json');fs.mkdirSync(path.dirname(f),{recursive:true});
  fs.writeFileSync(f,JSON.stringify({build:g.hash,...D,UNLOCK:D.U,U:undefined}));console.log('wrote '+f+' ('+(fs.statSync(f).size/1024).toFixed(0)+' KB, build '+g.hash+')')}
else{let v=g.get(a.join(' '));if(typeof v==='function')v=v.toString();out(typeof v==='string'?v:JSON.stringify(v))}
