// Layout audit: every view and state, desktop and phone. Measures alignment, control heights, overflow, drifting buttons.
const {chromium}=require('playwright');const fs=require('fs');
const mock=fs.readFileSync('mock2.js','utf8').replace('n === "assets" ?','n === "downloads" ? {save: async(r)=>({ok:true})} : n === "assets" ?');
const html=fs.readFileSync('archē-broker-portal.html','utf8').replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js');
const seed=JSON.parse(fs.readFileSync('seed4.json','utf8'));
const G=JSON.parse(fs.readFileSync('guide.json','utf8'));G.faq.forEach(([q,a],i)=>seed['faq/f'+i]={q,a,order:i});
seed['status/demo-broker/deals/t-ex-2'].confIssued={rev:1,at:'2026-10-14T08:00:00Z',assetId:'a0',data:{ref:'AE-261010-214'}};
seed['config/company']={name:'Archē Executive Pte. Ltd.',reg:'202612345A',address:'1 Raffles Place, Singapore',email:'bookings@example.com',phone:'+65 0000 0000',signName:'Morten S. Jørgensen',signTitle:'Director'};
const mk=(f,uid,owner,edit)=>fs.writeFileSync(f,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html.replace('<script>\n"use strict";',`<script>window.__SEED=${JSON.stringify(seed)};window.__OWNER=${owner};window.__EDIT=${edit};window.__UID="${uid}";${mock}</script><script>\n"use strict";`)+'</body></html>');
mk('au_owner.html','u_owner',true,true);mk('au_broker.html','demo-broker',false,false);
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
(async()=>{const b=await chromium.launch();const all={};let n=0;
 const S1=async(p,label,fn)=>{if(fn)await p.evaluate(`(${fn})()`).catch(e=>console.log('ERR',label,e.message));await p.waitForTimeout(350);const r=await p.evaluate(CHECK);all[label]=r;n++;await p.screenshot({path:`au/${label}.png`,fullPage:true});};
 fs.mkdirSync('au',{recursive:true});
 for(const [vw,opt] of [['d',{viewport:{width:1400,height:900}}],['m',{viewport:{width:390,height:844},hasTouch:true,isMobile:true}]]){
  const p=await b.newPage(opt);p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.goto('http://localhost:8765/au_owner.html');await p.waitForTimeout(2600);
  for(const v of ['today','queue','commission','control','assistant','team','security','settings','help']) await S1(p,`o_${vw}_${v}`,`()=>{S.view='${v}';S.sel=null;render();}`);
  await S1(p,`o_${vw}_trips_issued`,"()=>{S.view='trips';S.sel='t-ex-2';render();}");
  await S1(p,`o_${vw}_trips_review`,"()=>{S.view='queue';S.sel='t-ex-3';render();}");
  await S1(p,`o_${vw}_editor_new`,"()=>{S.view='trips';render();openEditor(null);}");
  await S1(p,`o_${vw}_editor_edit`,"()=>{S.view='trips';S.sel='t-ex-4';render();openEditor(tripById('t-ex-4'));}");
  await p.evaluate(()=>{S.editing=false;});
  await S1(p,`o_${vw}_conf`,"()=>{S.sel='t-ex-4';S.view='conf';S.confDraft=null;render();}");
  await S1(p,`o_${vw}_prospects`,"()=>{S.view='prospects';S.pSel=Object.keys(S.prospects)[0];S.pChk=new Set(Object.keys(S.prospects).slice(0,2));render();}");
  await S1(p,`o_${vw}_prospect_new`,"()=>{S.view='prospects';S.pNew=true;S.pChk=new Set();render();}");
  await S1(p,`o_${vw}_payform`,"()=>{S.pNew=false;S.view='commission';const r=document.querySelector('[data-pay]');S.payAsk=r?r.dataset.pay:null;render();}");
  // training: one run walked through every step
  await p.evaluate(async()=>{S.view='training';render();await trAct('start',{dataset:{sc:'s2'}});});await p.waitForTimeout(500);
  await S1(p,`o_${vw}_train_0`,null);
  await S1(p,`o_${vw}_train_list`,"()=>{S.trSel=null;render();}");
  await p.evaluate(async()=>{S.trSel=Object.keys(S.trRuns)[0];await loadAirports();const r=trRun();const enq={legs:[{from:'LSGG',to:'LEPA',date:r.expDate,time:'09:30',pax:'6'}],cat:'Midsize jet'};await trSave(r,{enq,offers:trMakeOffers({...r,enq}),step:1});});await p.waitForTimeout(400);
  for(let st=1;st<=10;st++){await p.evaluate(async st=>{const r=trRun();const patch={step:st};if(st>=3)patch.pick=0;if(st===3)patch.requests=[{id:'a',cat:'Pets',text:'Spaniel 9 kg in cabin',basis:'included',amount:''}],patch.extras=[{id:'b',cat:'Ground handling',text:'VIP terminal Palma',basis:'fixed',amount:'800'}];if(st>=6){patch.review=trReview({...r,...patch,checks:{},decision:'send'});patch.ref='TRN-261018-123';patch.myPrice=1;}if(st===8)patch.pn={dep:1,bal:'',op:1,checked:true,depOk:false,dateOk:true,opOk:true};if(st===10){patch.done=true;patch.score=74;patch.scores=trScore({...r,...patch});}await trSave(r,patch);},st);await p.waitForTimeout(300);await S1(p,`o_${vw}_train_${st}`,null);}
  await p.close();
  const q=await b.newPage(opt);q.on('pageerror',e=>console.log('PAGEERR',e.message));
  await q.goto('http://localhost:8765/au_broker.html');await q.waitForTimeout(2000);
  for(const v of ['home','trips','commission','assistant','help','rules']) await S1(q,`b_${vw}_${v}`,`()=>{S.view='${v}';S.sel=${v==='trips'?"'t-ex-4'":'null'};render();}`);
  await S1(q,`b_${vw}_leads`,"()=>{S.view='leads';S.pSel=Object.keys(S.leads)[0]||null;render();}");
  await S1(q,`b_${vw}_leads_new`,"()=>{S.view='leads';S.myNew=true;render();}");
  await S1(q,`b_${vw}_editor`,"()=>{S.view='trips';S.myNew=false;render();openEditor(tripById('t-ex-4'));}");
  await q.close();
 }
 fs.writeFileSync('au/report.json',JSON.stringify(all,null,1));
 const tally={};Object.entries(all).forEach(([k,v])=>v.forEach(x=>{tally[x[0]]=(tally[x[0]]||0)+1;}));
 console.log('states',n,'issues',tally);
 Object.entries(all).forEach(([k,v])=>{if(v.length)console.log('\n##',k);v.slice(0,12).forEach(x=>console.log('  ',x.join(' :: ')));});
 await b.close();})();
