// Layout audit: every page and a trip file, for owner, operations and broker, desktop and phone (390 px). Measures
// alignment, control heights, overflow, drifting buttons and sideways scrolling. Runs on the test version (example data).
// Needs the test page on localhost:8765. Fails only on sideways scrolling at phone width (CLAUDE.md); the rest is a report.
const {chromium}=require('playwright');const fs=require('fs');
const CHECK=()=>{const out=[];const R=e=>e.getBoundingClientRect();const vis=e=>{const r=R(e);return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
 const name=e=>{let s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(e.className&&typeof e.className==='string')s+='.'+e.className.trim().split(/\s+/).slice(0,2).join('.');const t=(e.getAttribute('aria-label')||e.textContent||e.value||'').trim().replace(/\s+/g,' ').slice(0,28);return s+(t?` "${t}"`:'');};
 const ctl='input:not([type=checkbox]):not([type=radio]):not([type=file]),select,textarea,.btn';
 // A: controls placed side by side in a row/grid must share bottom edge and (for .row) height
 document.querySelectorAll('#main .fgrid, #main .filters, #main .leg, #main .row, #main form.row').forEach(c=>{if(!vis(c))return;
   const items=[...c.children].filter(vis).map(ch=>{const el=ch.matches(ctl)?ch:ch.querySelector(':scope > '+ctl.split(',').join(', :scope > ')+', :scope > label > input, :scope > label > select');return el&&vis(el)?{ch,el,r:R(el)}:null;}).filter(Boolean);
   const rows=[];items.forEach(it=>{const row=rows.find(rw=>Math.abs(rw[0].r.top-it.r.top)<40||Math.abs(rw[0].r.bottom-it.r.bottom)<40);row?row.push(it):rows.push([it]);});
   rows.forEach(rw=>{if(rw.length<2)return;const bots=rw.map(x=>Math.round(x.r.bottom)),hs=rw.map(x=>Math.round(x.r.height));
     if(Math.max(...bots)-Math.min(...bots)>2)out.push(['misaligned',name(c),rw.map(x=>name(x.el)+'@'+Math.round(x.r.bottom)).join(' | ')]);
     else if(c.classList.contains('row')&&!rw.some(x=>x.el.tagName==='TEXTAREA')&&Math.max(...hs)-Math.min(...hs)>2)out.push(['height',name(c),rw.map(x=>name(x.el)+' h'+Math.round(x.r.height)).join(' | ')]);});});
 // B: same-kind buttons in sibling list items should sit at the same x
 document.querySelectorAll('#main .list').forEach(l=>{const xs={};[...l.children].forEach(it=>it.querySelectorAll('.btn').forEach(b=>{if(!vis(b))return;const k=b.textContent.trim();(xs[k]=xs[k]||[]).push(Math.round(R(b).left));}));
   Object.entries(xs).forEach(([k,a])=>{if(a.length>1&&Math.max(...a)-Math.min(...a)>2)out.push(['drift',name(l),`"${k}" x=${[...new Set(a)].join(',')}`]);});});
 // C: content wider than its box (not a scroll area)
 document.querySelectorAll('#main *').forEach(e=>{if(!vis(e))return;const cs=getComputedStyle(e);if(/auto|scroll|hidden/.test(cs.overflowX)||e.tagName==='svg'||e.closest('svg,.paper,.trconf,.tbl,.flowscroll'))return;if(e.scrollWidth>e.clientWidth+2&&e.clientWidth>0&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName))out.push(['overflow',name(e),e.scrollWidth+'>'+e.clientWidth]);});
 // D: anything sticking out of the viewport
 if(document.documentElement.scrollWidth>innerWidth+1)out.push(['page-scroll','html',document.documentElement.scrollWidth+'>'+innerWidth]);
 // E: buttons in one .row with different heights (small vs normal mixed is a design choice, so only same-size class)
 document.querySelectorAll('#main .row').forEach(rw=>{const bs=[...rw.children].filter(b=>b.matches('.btn')&&vis(b));const g={};bs.forEach(b=>{const k=b.classList.contains('small')?'s':'n';(g[k]=g[k]||[]).push(Math.round(R(b).height));});Object.values(g).forEach(a=>{if(a.length>1&&Math.max(...a)-Math.min(...a)>2)out.push(['btn-height',name(rw),a.join(',')]);});});
 return out;};
(async()=>{const b=await chromium.launch();const all={};let n=0;const errs=[];
 const S1=async(p,label,fn)=>{if(fn)await p.evaluate(`(${fn})()`).catch(e=>console.log('ERR',label,e.message));await p.waitForTimeout(350);all[label]=await p.evaluate(CHECK);n++;if(process.env.SHOTS)await p.screenshot({path:process.env.SHOTS+`/${label}.png`,fullPage:true});};
 for(const [vw,opt] of [['d',{viewport:{width:1400,height:900}}],['m',{viewport:{width:390,height:844},hasTouch:true,isMobile:true}]]){
  const p=await b.newPage(opt);p.on('pageerror',e=>errs.push(vw+': '+e.message));
  await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);
  for(const [who,tag] of [['Test Owner','o'],['Test Operations','ops'],['Test Broker','b']]){
   await p.selectOption('select',{label:who});await p.waitForTimeout(2500);
   const views=await p.evaluate(()=>navItems().map(x=>x[0]));
   for(const v of views) await S1(p,`${tag}_${vw}_${v}`,`()=>{S.view='${v}';S.sel=null;render();}`);
   const did=await p.evaluate(()=>{const t=allTrips()[0];return t?t.did:null;});
   if(did) await S1(p,`${tag}_${vw}_trip`,`()=>{S.view='trips';S.sel='${did}';render();}`);
  }
  await p.close();
 }
 const tally={};Object.entries(all).forEach(([k,v])=>v.forEach(x=>{tally[x[0]]=(tally[x[0]]||0)+1;}));
 console.log('states',n,'issues',tally);
 Object.entries(all).forEach(([k,v])=>{if(v.length)console.log('\n##',k);v.slice(0,8).forEach(x=>console.log('  ',x.join(' :: ')));});
 const side=Object.entries(all).filter(([k,v])=>/_m_/.test(k)&&v.some(x=>x[0]==='page-scroll')).map(([k])=>k);
 console.log(side.length?`FAIL sideways scrolling at 390 px: ${side.join(', ')}`:'PASS no sideways scrolling at 390 px');
 console.log(errs.length?'FAIL page errors '+JSON.stringify(errs.slice(0,5)):'PASS no page errors');
 await b.close();process.exit(side.length||errs.length?1:0);})();
