/* ui/input.js: Document click dispatch (runs ACT handlers, then render) and other page-wide listeners. */
document.addEventListener('click',e=>{
  {const c0=e.target.closest('[data-cell]'),e0=e.target.closest('[data-a]');if(tutBlock(c0&&S.phase==='sd'?'cell:'+c0.dataset.cell:e0&&!e0.disabled?e0.dataset.a:null))return}
  const cell=e.target.closest('[data-cell]');if(cell&&S.phase==='sd'){onCell(...cell.dataset.cell.split(',').map(Number));return}
  const el=e.target.closest('[data-a]');if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;const[a,p1,p2,p3]=el.dataset.a.split(':');
  const f=ACT[a];if(f&&f(p1,p2,p3,a,el,e)===NO_RENDER)return;
  render()});
document.addEventListener('input',e=>{if(e.target.id==='oname'&&S.cre){const v=oClean(e.target.value);if(v!==e.target.value)e.target.value=v;S.cre.name=v;save()}});

(function(){const pts=[];for(let i=0;i<28;i++){const a=Math.PI*2*i/28,r=i%2?32+((i*7)%5):50-((i*3)%4);pts.push(`${(50+r*Math.cos(a)).toFixed(1)}% ${(50+r*Math.sin(a)).toFixed(1)}%`)}
  const st=document.createElement('style');st.textContent=`.fx:not(.k-say) .b::before,.fx:not(.k-say) .b::after,#brk .burst::before,#brk .burst::after{clip-path:polygon(${pts.join(',')})}`;document.head.appendChild(st)})();

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.view=(p1)=>{S.view=p1};
