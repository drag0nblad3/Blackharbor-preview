// minimal DOM stand-ins so the game script loads headless (FAST mode: window is undefined)
const __H={};
const __mk=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?(()=>''):k==='then'?undefined:__mk(),apply:()=>__mk(),set:()=>true});
var document={addEventListener:(t,f)=>{(__H[t]=__H[t]||[]).push(f)},getElementById:()=>__mk(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>__mk(),body:__mk(),head:__mk()};
var localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
var scrollTo=()=>{};
const __st=globalThis.setTimeout.bind(globalThis);var setTimeout=(f,ms)=>__st(f,0);
