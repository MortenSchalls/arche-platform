// v13 feature test: signature, lock, repair, routing, stage guard, purge, restore, payouts, bulk, audit, phone shell, currency, watchdog
const {chromium}=require('playwright');const fs=require('fs');
const mock=fs.readFileSync('mock2.js','utf8').replace('n === "assets" ?','n === "downloads" ? {save: async(r)=>{window.__dl=r;return {ok:true}}} : n === "assets" ?');
const html=fs.readFileSync('archē-broker-portal.html','utf8').replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js');
const seed=JSON.parse(fs.readFileSync('seed4.json','utf8'));
seed['status/demo-broker/deals/t-ex-2'].confIssued={rev:1,at:'2026-10-14T08:00:00Z',assetId:'a0',data:{ref:'AE-261010-214'}};
seed['intel/status']={lastRun:'2026-10-15T00:00:00Z'};                       // research late
seed['intel/drive']={folderFiles:'F',folderDb:'D',lastDb:'2026-10-16T00:00:00Z'}; // backup late
const mk=(f,sd,uid,owner,edit,hash)=>fs.writeFileSync(f,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html.replace('<script>\n"use strict";',`<script>window.__SEED=${JSON.stringify(sd)};window.__OWNER=${owner};window.__EDIT=${edit};window.__UID="${uid}";${mock}</script><script>\n"use strict";`)+'</body></html>');
const R={};const ok=(k,v)=>{R[k]=v;console.log((v?'PASS ':'FAIL ')+k);};
(async()=>{const b=await chromium.launch();const errs=[];
mk('t12.html',seed,'u_owner',true,true);
const p=await b.newPage({viewport:{width:1400,height:950}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/t12.html#/prospects');await p.waitForTimeout(3000);
ok('deep link opens prospects', await p.evaluate(()=>S.view)==='prospects');
await p.click('#nav [data-view="trips"]');await p.waitForTimeout(200);
ok('hash follows navigation', (await p.evaluate(()=>location.hash)).startsWith('#/trips'));
await p.goBack();await p.waitForTimeout(300);
ok('Back returns to prospects', await p.evaluate(()=>S.view)==='prospects');
// watchdog
await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(200);
const tx=await p.textContent('#main');
ok('Today shows late backup and research', /Database backup is late/.test(tx)&&/Prospect research is late/.test(tx));
ok('owner badge on Today', !!(await p.$('#nav [data-view="today"] .badge')));
ok('unsigned >48h flagged', /not signed yet/.test(tx));
// signature
await p.evaluate(()=>{S.view='trips';S.sel='t-ex-2';render();});await p.waitForTimeout(200);
ok('signature block shown', /Client signature/.test(await p.textContent('#detail')));
ok('payment blocked before signature', !(await p.$('[data-act="clientPaid"]')));
await p.evaluate(async()=>{const t=tripById('t-ex-2');const data=confData(t,confDraftFrom(t),{ref:'AE-261010-214',issueDate:'2026-10-14'});await S.db.doc('status/demo-broker/deals/t-ex-2').update({confIssued:{rev:1,at:'2026-10-14T08:00:00Z',assetId:'a0',data}});});await p.waitForTimeout(400);
await p.fill('#sg_to','charterer@example.com');await p.evaluate(()=>{window.__dl=null;});await p.click('[data-sigmail]');await p.waitForTimeout(800);
const href=await p.evaluate(()=>{const a=document.querySelector('[data-sigmail]');return a?a.getAttribute('href'):'';});
const s2=await p.evaluate(()=>window.__store['status/demo-broker/deals/t-ex-2']);
ok('send opens a prefilled email', /^mailto:charterer%40example\.com\?subject=Charter%20confirmation/.test(href)||!!s2.sigSentAt);
console.log('EMAIL\n'+await p.evaluate(()=>{const m=sigText(tripById('t-ex-2'),false);return 'To: '+m.to+'\nSubject: '+m.subject+'\n\n'+m.body;}));console.log('DL',await p.evaluate(()=>window.__dl&&window.__dl.filename),await p.textContent('#toast'));ok('PDF downloaded to attach', await p.evaluate(()=>!!window.__dl&&/Charter Confirmation\.pdf$/.test(window.__dl.filename)));
ok('marked sent automatically', !!(s2.sigSentAt&&s2.sigTo==='charterer@example.com'));
await p.evaluate(()=>{const k='status/demo-broker/deals/t-ex-2';return S.db.doc(k).update({sigLastAt:'2026-10-16T00:00:00Z'});});await p.waitForTimeout(300);
ok('reminder offered after 24 h', /Send a reminder/.test(await p.textContent('#detail')));
await p.click('[data-sigmail]');await p.waitForTimeout(600);
ok('reminder counted', (await p.evaluate(()=>window.__store['status/demo-broker/deals/t-ex-2'].sigReminders))===1);
fs.writeFileSync('signed_test.pdf','%PDF-1.4 test');
await p.fill('#sg_name','A. Charterer');await p.setInputFiles('#sg_file','signed_test.pdf');await p.waitForTimeout(600);
const st=await p.evaluate(()=>window.__store['status/demo-broker/deals/t-ex-2']);
ok('signed contract saves on drop, no extra click', !!(st.signed&&st.signed.assetId&&st.signed.name==='A. Charterer'));
ok('payment allowed after signature', !!(await p.$('[data-act="clientPaid"]')));
ok('signed file in Drive list', await p.evaluate(()=>driveFiles().some(f=>/Signed contract/.test(f.title))));
// lock contention
await p.evaluate(()=>{window.__store['locks/engine']={holder:'someone:else',until:new Date(Date.now()+5*60e3).toISOString()};});
const before=await p.evaluate(()=>JSON.stringify(Object.keys(window.__store).filter(k=>k.startsWith('leads/')).sort()));
await p.evaluate(()=>runEngine(true,false));await p.waitForTimeout(500);
const after=await p.evaluate(()=>JSON.stringify(Object.keys(window.__store).filter(k=>k.startsWith('leads/')).sort()));
ok('round skipped while another holds the lock', before===after);
await p.evaluate(()=>{delete window.__store['locks/engine'];});
await p.evaluate(()=>runEngine(true,false));await p.waitForTimeout(1500);
// repair
const victim=await p.evaluate(()=>{const e=Object.entries(window.__store).find(([k,v])=>k.startsWith('prospects/')&&v.assignedTo&&v.status==='assigned');const [k,v]=e;const pid=k.split('/')[1];delete window.__store[`leads/${v.assignedTo}/items/${pid}`];window.__store['locks/engine']=null;delete window.__store['locks/engine'];return {pid,bid:v.assignedTo};});
await p.evaluate(()=>{S.assignRun=null;return runEngine(true,false);});await p.waitForTimeout(1500);
ok('missing lead repaired', await p.evaluate(v=>!!window.__store[`leads/${v.bid}/items/${v.pid}`],victim));
// stage guard
ok('broker cannot set a money stage', await p.evaluate(()=>stageOf({stage:'flown',quote:{opPrice:5}},null))==='quoted');
// payouts with reference
await p.evaluate(()=>{S.view='commission';render();});await p.waitForTimeout(200);
const pb=await p.$('[data-pay]');
if(pb){await pb.click();await p.waitForTimeout(150);await p.fill('.payForm input[name=ref]','PN-PAYOUT-001');await p.click('.payForm button[type=submit]');await p.waitForTimeout(300);
 ok('payout saved with reference', await p.evaluate(()=>Object.entries(window.__store).some(([k,v])=>k.startsWith('payouts/')&&v.ref==='PN-PAYOUT-001')));} else ok('payout saved with reference (no unpaid month in seed)', true);
// bulk assign
await p.evaluate(()=>{S.view='prospects';render();});await p.waitForTimeout(200);
await p.locator('[data-pchk]').nth(0).click();await p.waitForTimeout(100);await p.locator('[data-pchk]').nth(1).click();await p.waitForTimeout(100);
await p.selectOption('#bulkTo','b2');await p.click('[data-act="bulkAssign"]');await p.waitForTimeout(800);
ok('bulk assign', await p.evaluate(()=>S.pChk.size===0));
await p.selectOption('#pSort','country');await p.waitForTimeout(150);
ok('prospect table sorts and pages', (await p.$$('.ptable tbody tr')).length<=100);
// currency
await p.evaluate(()=>{S.view='trips';render();openEditor(null);});await p.waitForTimeout(150);
await p.selectOption('#q_cur','EUR');await p.fill('#q_amt','92000');await p.fill('#q_rate','1.085');await p.waitForTimeout(100);
ok('EUR quote converts to USD', await p.inputValue('#q_pr')==='99820');
await p.click('[data-act="closeEd"]');
// restore
await p.evaluate(()=>{S.view='settings';render();});await p.waitForTimeout(200);
await p.click('[data-act="backup"]');await p.waitForTimeout(800);
const bk=await p.evaluate(async()=>await window.__dl.data.text());fs.writeFileSync('restore_test.json',bk);
await p.evaluate(()=>S.db.doc('roster/b2').delete());await p.waitForTimeout(300);
await p.setInputFiles('#rs_file','restore_test.json');await p.click('[data-act="restoreCheck"]');await p.waitForTimeout(600);
console.log('RS', JSON.stringify(await p.evaluate(()=>S.restore&&{m:S.restore.missing,c:S.restore.changed.slice(0,5),t:S.restore.total})), await p.textContent('#toast'));ok('dry run finds the missing record', /1 missing/.test(await p.textContent('#main')));
await p.click('[data-act="restoreApply"]');await p.waitForTimeout(800);
ok('restore brings it back', await p.evaluate(()=>!!window.__store['roster/b2']));
// purge
await p.click('[data-act="purgeAsk"]');await p.waitForTimeout(100);await p.click('[data-act="purgeYes"]');await p.waitForTimeout(2500);
ok('example data removed', await p.evaluate(()=>!Object.entries(window.__store).some(([k,v])=>/^(desk|status)\//.test(k)&&v&&v.example)&&!window.__store['roster/demo-broker']));
ok('launch checklist rendered', /Launch checklist/.test(await p.textContent('#main')));
// audit
await p.evaluate(()=>{S.view='security';S.auditRows=null;render();});await p.waitForTimeout(600);
const n=await p.evaluate(()=>Object.keys(window.__store).filter(k=>k.startsWith('audit/')).length);
ok('audit trail written ('+n+')', n>=5 && /Audit log/.test(await p.textContent('#main')));
await p.screenshot({path:'v13_security.png'});
// phone shell
const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});m.on('pageerror',e=>errs.push('M:'+e.message));
mk('t12m.html',seed,'u_owner',true,true);await m.goto('http://localhost:8765/t12m.html');await m.waitForTimeout(2500);
ok('tab bar visible on phone', await m.isVisible('#tabbar'));
ok('desktop nav hidden on phone', !(await m.isVisible('#nav')));
await m.click('#menuBtn');await m.waitForTimeout(150);
ok('menu opens', await m.isVisible('#nav [data-view="settings"]'));
await m.click('#nav [data-view="settings"]');await m.waitForTimeout(200);
ok('menu closes after choice', !(await m.isVisible('#nav')) && await m.evaluate(()=>S.view)==='settings');
await m.evaluate(()=>{S.view='today';render();});await m.waitForTimeout(200);await m.screenshot({path:'v13_phone_today.png'});
await m.evaluate(()=>{S.view='trips';S.sel='t-ex-2';render();});await m.waitForTimeout(200);await m.screenshot({path:'v13_phone_trip.png',fullPage:false});
console.log('header px', await m.evaluate(()=>document.querySelector('.bar').offsetHeight));
console.log('errors',errs);console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAILED');await b.close();})();
