// Every file is stored under its trip, recorded with type, size, who and when, read back and checked in storage before
const showQuote=async p=>{await p.evaluate(()=>{const b=document.querySelector('[data-act="edPart"][data-part="quote"]');if(b)b.click();});};
// the portal says Saved; the trip's Documents panel lists them all, and a file storage cannot find shows Not found
// (Morten, 25 Nov 2026). The KYC/KYB reference is numbered by the portal. Test version, example data only.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1366,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const toasts=[];await p.exposeFunction('__toast',m=>toasts.push(m));
fs.writeFileSync('/tmp/ex-aoc.pdf','%PDF-1.4 example AOC');fs.writeFileSync('/tmp/ex-ins.pdf','%PDF-1.4 example insurance');
await p.goto('http://localhost:8765/test.html?steps=all&as=broker');await p.waitForTimeout(3000);
await p.evaluate(()=>{localStorage.removeItem('__files');const _t=toast;toast=m=>{window.__toast(m);_t(m);};S.view='trips';render()});await p.click('[data-act="new"]');await p.waitForTimeout(400);
const d=new Date(Date.now()+20*864e5).toISOString().slice(0,10);
await p.fill('#e_cn','Example Docs Client');await p.fill('#e_em','docs@example.com');await p.fill('#e_ct','Singapore');
await p.fill('.leg [data-l="from"]','VTBS');await p.fill('.leg [data-l="to"]','VTSP');await p.fill('.leg [data-l="date"]',d);await p.fill('.leg [data-l="time"]','09:00');await p.fill('.leg [data-l="pax"]','6');
await showQuote(p);await p.fill('#q_op','Example Air AG');await showQuote(p);await p.fill('#q_ac','Global 7500');await showQuote(p);await p.fill('#q_pr','40000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(2500);
let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
const did=await p.evaluate(()=>S.sel);
// one tap from Still needed
{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-dq="AOC"]')]);await fc.setFiles('/tmp/ex-aoc.pdf');}await p.waitForTimeout(2500);
let rec=await p.evaluate(()=>(tripById(S.sel).d.docs||[]).find(x=>x.kind==='AOC'));
ok('stored under the trip it belongs to',rec&&rec.id.includes('/trips/'+(await p.evaluate(()=>tripById(S.sel).bid))+'/'+did+'/'),rec);
ok('recorded with name, size, who and when',rec&&rec.name==='ex-aoc.pdf'&&rec.size>0&&rec.by&&rec.at,rec);
ok('the portal says Saved only after reading it back',toasts.some(m=>/^Saved ✓ AOC: ex-aoc\.pdf/.test(m)),toasts);
let panel=await p.innerText('#secDocs');ok('the Documents panel lists it with Saved',/AOC/.test(panel)&&/ex-aoc\.pdf/.test(panel)&&/Saved ✓/i.test(panel)&&/You/.test(panel),panel);
// storage loses the file: the panel must not say Saved
await p.evaluate(()=>{window.__UPLOAD_LOST=true});
await p.selectOption('#docKind','Insurance certificate');await p.setInputFiles('#docFile','/tmp/ex-ins.pdf');await p.click('[data-act="upload"]');await p.waitForTimeout(2500);
ok('a file storage cannot confirm is not called saved',toasts.some(m=>/^Check this file: ex-ins\.pdf/.test(m))&&!toasts.some(m=>/^Saved ✓ Insurance/.test(m)),toasts);
panel=await p.innerText('#secDocs');ok('the panel shows it as not found',/ex-ins\.pdf/.test(panel)&&/Not found/i.test(panel),panel);
await p.evaluate(()=>{window.__UPLOAD_LOST=false;window.__UPLOAD_FAIL=true});
await p.selectOption('#docKind','Other');await p.setInputFiles('#docFile','/tmp/ex-ins.pdf');await p.click('[data-act="upload"]');await p.waitForTimeout(2000);
ok('a failed upload says Not saved and records nothing',toasts.some(m=>/^Not saved: ex-ins\.pdf did not upload/.test(m))&&!(await p.evaluate(()=>(tripById(S.sel).d.docs||[]).some(x=>x.kind==='Other'))),toasts.slice(-2));
await p.evaluate(()=>{window.__UPLOAD_FAIL=false});
// after a reload the documents are still there and checked again
await p.reload();await p.waitForTimeout(3000);await p.evaluate(id=>{S.view='trips';S.sel=id;render()},did);await p.waitForTimeout(1200);
panel=await p.innerText('#secDocs');ok('after a reload: both files listed, the stored one Saved',/ex-aoc\.pdf/.test(panel)&&/Saved ✓/i.test(panel)&&/2 files on this booking/.test(panel),panel);
// KYC reference numbered by the portal
ok('no field to type a KYC reference',!(await p.$('#kyc_ref')));
await p.click('[data-kyc="save"]').catch(()=>{});await p.waitForTimeout(800);
const kr=await p.evaluate(()=>(tripById(S.sel).d.kycRec||{}).ref||'');ok('KYC reference set by the portal',/^KY[CB]-\d{4}-[0-9A-Z]{4}$/.test(kr),kr);
ok('no page errors',!errs.length,errs);console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
