// every visible text node: measure contrast against its painted background, both themes
const {chromium}=require('playwright');
const views=['today','trips','queue','prospects','commission','control','team','security','settings','help','training'];
(async()=>{const b=await chromium.launch();
for(const theme of ['light','dark']){const ctx=await b.newContext({viewport:{width:1400,height:900}});await ctx.addInitScript(t=>{try{localStorage.setItem('arche.theme',t)}catch(e){}},theme);
 const p=await ctx.newPage();await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await p.selectOption('select',{label:'Test Owner'});await p.waitForTimeout(2500);const bad={};
 for(const v of views){await p.evaluate(v=>{S.view=v;S.sel=v==='trips'?'t-ex-2':null;S.pSel=v==='prospects'?Object.keys(S.prospects)[0]:null;render();},v);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const P=c=>{const m=c.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0];};const L=([r,g,b])=>{const f=x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
   const bgOf=e=>{for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(cs.backgroundImage&&cs.backgroundImage!=='none')return null;const c=P(cs.backgroundColor);if(c.length<4||c[3]>0.9)return c.slice(0,3);}return P(getComputedStyle(document.body).backgroundColor).slice(0,3);};
   const out=[];const w=document.createTreeWalker(document.querySelector('#main'),NodeFilter.SHOW_TEXT);let n;
   while(n=w.nextNode()){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;if(e.closest('.paper,svg,.wm,option'))continue;const r=e.getBoundingClientRect();if(!r.width)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity<0.5)continue;
    const bg=bgOf(e);if(!bg)continue;const fg=P(cs.color);const a=L(fg.slice(0,3)),c=L(bg);const ratio=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);const big=parseFloat(cs.fontSize)>=24;
    if(ratio<(big?3:4.5))out.push(`${ratio.toFixed(2)} ${e.tagName.toLowerCase()}.${(e.className||'').toString().split(' ')[0]} "${t.slice(0,30)}"`);}
   return [...new Set(out)];});
  if(r.length)bad[v]=r;}
 console.log('==',theme,Object.keys(bad).length?bad:'all text >= 4.5:1');await ctx.close();}
await b.close();})();
