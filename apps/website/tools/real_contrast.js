// Readability on the rendered page: every visible text against the real pixels behind it (photos, veils, watermark).
// Usage: PORT=8797 NODE_PATH=$(npm root -g) node tools/real_contrast.js "/,/contact/" "390,1440"  (serve site/ on PORT first)
// contrast of every visible text element against the real pixels behind it (photos, watermark, veils included)
const {chromium}=require('playwright');const {PNG}=require(require('path').join(process.env.NODE_PATH,'pngjs'));
const L=(r,g,b)=>{const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const CR=(a,b)=>{const x=Math.max(a,b),y=Math.min(a,b);return (x+.05)/(y+.05)};
(async()=>{const b=await chromium.launch();const pages=process.argv[2].split(',');const widths=process.argv[3].split(',').map(Number);const out=[];
for(const w of widths)for(const u of pages){const p=await b.newPage({viewport:{width:w,height:w<500?844:900}});
 await p.goto('http://localhost:'+(process.env.PORT||8797)+''+u,{waitUntil:'networkidle'});await p.addStyleTag({content:'*{animation:none!important;transition:none!important}'});await p.waitForTimeout(1200);
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);
 for(let y=0;y<H;y+=(w<500?800:850)){await p.evaluate(y=>window.scrollTo(0,y),y);await p.waitForTimeout(250);
  const els=await p.evaluate(()=>{const r=[];const vh=innerHeight;let i=0;
   for(const el of document.querySelectorAll('body *')){if(el.closest('script,style,svg,noscript'))continue;
    const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);if(!own)continue;
    const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0||cs.display==='none')continue;
    const b=el.getBoundingClientRect();if(b.width<4||b.height<4||b.bottom<0||b.top>vh||b.right<0||b.left>innerWidth)continue;
    let o=1,e=el;while(e){o*=+getComputedStyle(e).opacity;e=e.parentElement}if(o<0.05)continue;
    const cx=Math.min(innerWidth-1,Math.max(0,b.left+b.width/2)),cy=Math.min(vh-1,Math.max(0,b.top+Math.min(b.height,40)/2));const top=document.elementFromPoint(cx,cy);if(!top||!(top===el||el.contains(top)||top.contains(el)))continue;
    const m=cs.color.match(/[\d.]+/g).map(Number);if(m.length>3&&m[3]===0)continue;
    el.setAttribute('data-rc',i);r.push({i,x:Math.max(0,b.left),y:Math.max(0,b.top),w:Math.min(b.width,innerWidth-Math.max(0,b.left)),h:Math.min(b.height,vh-Math.max(0,b.top)),c:m,a:(m[3]??1)*o,fs:parseFloat(cs.fontSize),fw:+cs.fontWeight,t:el.textContent.trim().slice(0,50)});i++}return r});
  if(!els.length)continue;
  const withText=PNG.sync.read(await p.screenshot());
  await p.addStyleTag({content:'[data-rc]{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}'});await p.waitForTimeout(80);
  const bg=PNG.sync.read(await p.screenshot());
  await p.evaluate(()=>{document.querySelectorAll('style').forEach(s=>{if(s.textContent.includes('[data-rc]'))s.remove()});document.querySelectorAll('[data-rc]').forEach(e=>e.removeAttribute('data-rc'))});
  for(const e of els){const lum=[];const tl=[];for(let yy=Math.floor(e.y+e.h*.15);yy<Math.min(bg.height,e.y+e.h*.85);yy+=2)for(let xx=Math.floor(e.x+e.w*.05);xx<Math.min(bg.width,e.x+e.w*.95);xx+=2){const k=(yy*bg.width+xx)*4;lum.push(L(bg.data[k],bg.data[k+1],bg.data[k+2]));}
   if(!lum.length)continue;lum.sort((a,b)=>a-b);
   // effective text colour = colour blended over the median background
   const med=lum[Math.floor(lum.length/2)];const tc=L(...e.c.slice(0,3));const txt=e.a>=1?tc:tc*e.a+med*(1-e.a);
   const light=tc>med;const worstBg=light?lum[Math.floor(lum.length*.9)]:lum[Math.floor(lum.length*.1)];
   const crW=CR(txt,worstBg),crM=CR(txt,med);const large=e.fs>=24||(e.fs>=18.66&&e.fw>=700);const need=large?3:4.5;
   if(crM<need||crW<need*0.8)out.push({u,w,y,t:e.t,fs:e.fs,cr_med:+crM.toFixed(2),cr_worst:+crW.toFixed(2),need});}
 }await p.close();}
const seen=new Set();for(const o of out){const k=o.u+o.w+o.t;if(seen.has(k))continue;seen.add(k);console.log(JSON.stringify(o))}console.log('TOTAL',seen.size);await b.close();})();
