const {chromium}=require('playwright');const path=require('path');
const SCAN=()=>{const P=c=>{const m=c.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0];};const L=([r,g,b])=>{const f=x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
 const bgOf=e=>{for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(cs.backgroundImage&&cs.backgroundImage!=='none')return null;const c=P(cs.backgroundColor);if(c.length<4||c[3]>0.9)return c.slice(0,3);}return P(getComputedStyle(document.body).backgroundColor).slice(0,3);};
 const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;if(!e||e.closest('svg,script,style,option,[hidden],.sheet,.paper'))continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity<0.5)continue;
  const bg=bgOf(e);if(!bg)continue;const fg=P(cs.color);const a=L(fg.slice(0,3)),c=L(bg);const ratio=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);const big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.6&&+cs.fontWeight>=700);
  if(ratio<(big?3:4.5))out.push(`${ratio.toFixed(2)} ${e.tagName.toLowerCase()}.${(e.className||'').toString().split(' ')[0]} "${t.slice(0,30)}"`);}
 return [...new Set(out)];};
(async()=>{const b=await chromium.launch();
for(const f of ['t_full.html','t_ext.html'])for(const theme of ['light','dark'])for(const [vw,opt] of [['d',{viewport:{width:1400,height:900}}],['m',{viewport:{width:390,height:844},hasTouch:true,isMobile:true}]]){
 const ctx=await b.newContext(opt);await ctx.addInitScript(t=>{try{localStorage.setItem('arche.theme',t)}catch(e){}},theme);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.resolve(f));await p.waitForTimeout(1500);
 const bad=[];const shots=[];
 bad.push(...await p.evaluate(SCAN));await p.screenshot({path:`th_${f.slice(2,5)}_${theme}_${vw}_home.png`});
 // open first module lesson and the reference
 await p.evaluate(()=>{const b=[...document.querySelectorAll('nav.map button, nav.map a')].find(x=>/Module 1|1\.1|Introduction/i.test(x.textContent));if(b)b.click();});await p.waitForTimeout(600);
 bad.push(...await p.evaluate(SCAN));await p.screenshot({path:`th_${f.slice(2,5)}_${theme}_${vw}_mod.png`});
 console.log(f,theme,vw,'contrast fails:',[...new Set(bad)].slice(0,8),'errors',errs);await ctx.close();}
await b.close();})();
