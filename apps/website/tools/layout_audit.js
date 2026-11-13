// Layout audit on the rendered Archē website, the same gate as the Navoryx site (Morten, 9 Nov 2026: "use the same
// audit philosophy across all builds"). Every page at six widths, after fonts load. Fails on:
//   overlap   - two pieces of visible text drawn on top of each other (measured per text line)
//   clipped   - text cut off by its own box or running past the screen edge (deliberate swipe rows, which
//               have scroll-snap, and screen-reader-only text are not counted)
//   sideways  - the page scrolls sideways
//   tiny      - visible text under 10 px on screen
//   contrast  - text on a solid background under 4.5:1 (3:1 for 24 px+, or 18.5 px+ at weight 700)
//   misaligned - cards side by side in one row (same top and height) whose texts (label, title, line ...) do not sit
//               on the same baseline in each card, e.g. titles jumping up and down over photos (Morten, 13 Nov 2026)
// Writes apps/website/audit/layout.json with the hash of the built pages; check_site.py fails if the stamp is
// missing, failed or older than the build.
// Run: NODE_PATH=$(npm root -g) node apps/website/tools/layout_audit.js      (serves site/ itself)
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'), SITE = path.join(ROOT, 'site');
const WIDTHS = [[1920,1080],[1440,900],[1280,800],[1024,768],[800,1000],[390,844]];

function pages(d, b='') { let o=[]; for (const f of fs.readdirSync(d).sort()) { const p=path.join(d,f);
  if (fs.statSync(p).isDirectory()) { if (!['fonts','images','assets','films','img','vendor','api','logo-export'].includes(f)) o=o.concat(pages(p,b+'/'+f)); }
  else if (f==='index.html') o.push(b+'/'); else if (b===''&&f.endsWith('.html')) o.push('/'+f); } return o; }
function siteHash() { const h=crypto.createHash('sha256'); const walk=d=>{ for (const f of fs.readdirSync(d).sort()) { const p=path.join(d,f);
  if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(html|css|js)$/.test(f)) { h.update(path.relative(SITE,p)); h.update(fs.readFileSync(p)); } } }; walk(SITE); return h.digest('hex'); }

const TYPES={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4','.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon'};
function serve() { return new Promise(r => { const s=http.createServer((q,res)=>{ let u=decodeURIComponent(q.url.split('?')[0]); let p=path.join(SITE,u);
  if (u.endsWith('/')) p=path.join(p,'index.html'); fs.readFile(p,(e,b)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':TYPES[path.extname(p)]||'application/octet-stream'}); res.end(b); }); });
  s.listen(0,()=>r(s)); }); }

function inspect() {
  const out=[]; const W=innerWidth;
  const vis=el=>{ for (let e=el;e;e=e.parentElement){ const s=getComputedStyle(e);
      if (s.display==='none'||s.visibility==='hidden'||+s.opacity===0||e.hidden||e.getAttribute('aria-hidden')==='true') return false;
      if (s.position==='absolute'&&s.overflow==='hidden'&&e.offsetWidth<=1&&e.offsetHeight<=1) return false; } return true; };
  const skip=el=>el.closest('svg,script,style,noscript,.planner,.sr,.sr-only,.visually-hidden,[class*="skip"]')||(el.closest('details:not([open])')&&!el.closest('summary'));
  const scrollbox=el=>{ for(let e=el.parentElement;e&&e!==document.body;e=e.parentElement){ const o=getComputedStyle(e).overflowX; if(o==='auto'||o==='scroll') return e; } return null; };
  const fixed=el=>{ for(let e=el;e;e=e.parentElement){ const p=getComputedStyle(e).position; if(p==='fixed'||p==='sticky') return true; } return false; };
  const label=el=>(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,60);
  // collect visible text, line by line
  const lines=[]; const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const seen=new Set();
  while (tw.nextNode()) { const n=tw.currentNode; if (!n.textContent.trim()) continue; const el=n.parentElement;
    if (!el||skip(el)||!vis(el)) continue; const r=document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) { if (b.width<1||b.height<1) continue;
      lines.push({el,fx:fixed(el),t:label(el),x1:b.left,x2:b.right,y1:b.top+scrollY,y2:b.bottom+scrollY,h:b.height}); }
    if (!seen.has(el)) { seen.add(el); const s=getComputedStyle(el); const fs=parseFloat(s.fontSize);
      if (fs<10) out.push(['tiny',`${fs}px "${label(el)}"`]);
      // clipped by its own box
      for (let e=el;e&&e!==document.body;e=e.parentElement){ const cs=getComputedStyle(e);
        if (/hidden|clip/.test(cs.overflowX+cs.overflowY)&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)&&!e.matches('video,picture,figure,.film,.hero,.map,.mapwrap,[class*="map"]')&&cs.textOverflow!=='ellipsis'){
          const er=e.getBoundingClientRect(), tr=r.getBoundingClientRect();
          if (tr.right>er.right+2||tr.bottom>er.bottom+2||tr.left<er.left-2||tr.top<er.top-2) { out.push(['clipped',`"${label(el)}" cut by <${e.tagName.toLowerCase()} class="${e.className}">`]); }
          break; } }
      const sb=scrollbox(el), swipe=sb&&getComputedStyle(sb).scrollSnapType!=='none'; if (sb&&!swipe&&sb.scrollWidth>sb.clientWidth+1) out.push(['clipped',`"${label(el)}" in a box that scrolls sideways (${sb.scrollWidth}px in ${sb.clientWidth}px)`]);
      const tr=r.getBoundingClientRect(); if ((tr.right>W+1||tr.left<-1)&&!swipe) out.push(['clipped',`"${label(el)}" runs past the screen edge (${Math.round(tr.left)}-${Math.round(tr.right)} of ${W})`]);
      // contrast on a solid background
      const rgb=c=>{const m=c.match(/[\d.]+/g);return m?m.map(Number):null}; const fg=rgb(s.color);
      let bg=null, img=false; for (let e=el;e;e=e.parentElement){ const cs=getComputedStyle(e); if (cs.backgroundImage!=='none'||e.querySelector(':scope>video,:scope>picture,:scope>img')) {img=true;break;} const c=rgb(cs.backgroundColor); if (c&&(c[3]===undefined||c[3]>=.99)) {bg=c;break;} }
      if (!img&&!bg) bg=rgb(getComputedStyle(document.body).backgroundColor)||[58,60,60];
      if (!img&&fg&&bg&&!el.closest('.hero,header,.ring,video')) {
        const a=fg[3]===undefined?1:fg[3]*(+s.opacity||1); let o=1; for(let e=el;e;e=e.parentElement) o*=+getComputedStyle(e).opacity;
        const mix=fg.slice(0,3).map((v,i)=>v*a*o+bg[i]*(1-a*o));
        const L=c=>{const f=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*f[0]+.7152*f[1]+.0722*f[2]};
        const l1=L(mix),l2=L(bg.slice(0,3)); const cr=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
        const big=fs>=24||(fs>=18.5&&+s.fontWeight>=700); if (cr<(big?3:4.5)) out.push(['contrast',`${cr.toFixed(2)}:1 "${label(el)}"`]); } } }
  // overlap: lines of different elements that intersect (fixed bars only against each other)
  lines.sort((a,b)=>a.y1-b.y1);
  for (let i=0;i<lines.length;i++) for (let j=i+1;j<lines.length&&lines[j].y1<lines[i].y2;j++) { const a=lines[i],b=lines[j];
    if (a.el===b.el||a.fx!==b.fx||a.el.contains(b.el)||b.el.contains(a.el)) continue;
    const ox=Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1), oy=Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1);
    if (ox>2&&oy>Math.min(a.h,b.h)*0.25) out.push(['overlap',`"${a.t}" / "${b.t}"`]); }
  // misaligned: cards of the same kind side by side in one row (same top and height) whose texts (first line of the
  // 1st, 2nd, 3rd ... text element, e.g. label, title, line) do not start at the same height in each card
  const textTops=card=>{ const o=[], seenEl=new Set(); const w=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const n=w.currentNode, el=n.parentElement; if (!n.textContent.trim()||!el||skip(el)||!vis(el)||seenEl.has(el)) continue; seenEl.add(el);
      const r=document.createRange(); r.selectNodeContents(n); const b=[...r.getClientRects()].find(b=>b.width>=1&&b.height>=1); if (!b) continue;
      // where the first line actually sits: its baseline (a zero-size marker at the start of the text), so a Latin
      // line and a Thai, Chinese or Japanese line on the same baseline count as level
      const mk=document.createElement('span'); mk.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline;padding:0;margin:0;border:0';
      const wrap=document.createElement('span'); n.parentNode.insertBefore(wrap,n); wrap.appendChild(n); wrap.insertBefore(mk,n);   // inside an inline wrapper, so a flex label still puts the marker on the text line
      const top=mk.getBoundingClientRect().top; mk.remove(); wrap.parentNode.insertBefore(n,wrap); wrap.remove();
      o.push({top, fs:getComputedStyle(el).fontSize+(el.closest('button,[type=submit]')?'btn':'')}); }
    return o; };
  document.querySelectorAll('body *').forEach(p=>{ if (skip(p)||!vis(p)) return; const kids=[...p.children].filter(k=>vis(k)&&!skip(k)); if (kids.length<2) return;
    const rows=new Map(); for (const k of kids) { const b=k.getBoundingClientRect(); if (b.width<120||b.height<80) continue;
      const key=Math.round(b.top)+'|'+Math.round(b.height); if (!rows.has(key)) rows.set(key,[]); rows.get(key).push([k,b]); }
    for (const row of rows.values()) { if (row.length<2) continue;
      const groups={}; for (const [k,b] of row) { const t=textTops(k); if (!t.length) continue; const key=k.tagName+'|'+k.className+'|'+t[0].fs; (groups[key]=groups[key]||[]).push({b,t}); }
      for (const g of Object.values(groups)) { if (g.length<2) continue; const n=Math.min(...g.map(x=>x.t.length));
        for (let q=0;q<n;q++) { if (new Set(g.map(x=>x.t[q].fs)).size>1) break; const offs=g.map(x=>x.t[q].top-x.b.top);
          if (Math.max(...offs)-Math.min(...offs)>2) { out.push(['misaligned',`text ${q+1} starts at ${offs.map(v=>Math.round(v)).join('/')} px in a row of ${g.length} cards: "${label(g[0].b===undefined?p:row[0][0])}"`]); break; } } } } });
  if (document.documentElement.scrollWidth>W+1) out.push(['sideways',`page ${document.documentElement.scrollWidth}px wide`]);
  return [...new Map(out.map(x=>[x.join('|'),x])).values()];
}

function shownTexts() {
  const vis=el=>{ for (let e=el;e;e=e.parentElement){ const s=getComputedStyle(e);
      if (s.display==='none'||s.visibility==='hidden'||+s.opacity===0||e.hidden) return false; } return true; };
  const out=new Set(); const roots=[document.querySelector('.site-head'),...[...document.querySelectorAll('main')]];
  for (const r of roots) { if(!r) continue; r.querySelectorAll('h1,h2,h3,h4,p,li,a,th,td,dt,dd,figcaption,summary,label,button').forEach(e=>{
    if (!vis(e)||e.closest('svg,script,.planner,.pl-out,form .closed,.sr,details:not([open])>*:not(summary)')) return;
    const t=(e.innerText||'').replace(/\s+/g,' ').trim(); if (t&&t.length<200) out.add(t.toLowerCase()); }); }
  return [...out];
}

(async () => {
  const srv=await serve(), port=srv.address().port, list=pages(SITE), hash=siteHash();
  const b=await chromium.launch(); const found=[];
  for (const [w,h] of WIDTHS) {
    const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:'reduce'}); const queue=[...list];
    await Promise.all([0,1,2].map(async()=>{ const p=await ctx.newPage(); let u;
      while ((u=queue.shift())!==undefined) { await p.goto(`http://localhost:${port}${u}`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
        await p.waitForTimeout(150); for (const [k,m] of await p.evaluate(inspect)) found.push({page:u,width:w,kind:k,what:m}); } }));
    await ctx.close(); process.stderr.write(`${w}px done (${found.length} so far)\n`);
  }
  await b.close(); srv.close();
  fs.mkdirSync(path.join(ROOT,'audit'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit','layout.json'),JSON.stringify({site_hash:hash,checked:new Date().toISOString(),pages:list.length,widths:WIDTHS.map(x=>x[0]),findings:found},null,1)+'\n');
  const by={}; for (const f of found) by[f.kind]=(by[f.kind]||0)+1;
  for (const f of found.slice(0,400)) console.log(`${f.kind.toUpperCase()} ${f.width}px ${f.page} ${f.what}`);
  console.log(`layout audit: ${list.length} pages x ${WIDTHS.length} widths, ${found.length} findings`, JSON.stringify(by));
  process.exit(found.length?1:0);
})();
