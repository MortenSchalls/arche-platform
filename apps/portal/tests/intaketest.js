// Enquiry first, operator quote later; intake checklist (Template B.1) asked once and used later; the Avinode request
// written from the trip with no client details (Sandro Steger's practice booking, 25 Nov 2026). Example data only.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
for(const vw of [{width:1366,height:900},{width:390,height:844}]){
const p=await b.newPage({viewport:vw});const errs=[];p.on('pageerror',e=>errs.push(e.message));const W=' @'+vw.width;
await p.goto('http://localhost:8765/test.html?as=broker');await p.waitForTimeout(3000);
await p.evaluate(()=>{S.view='trips';render()});await p.click('[data-act="new"]');await p.waitForTimeout(400);
ok('new enquiry: client, trip and intake shown'+W,await p.isVisible('#e_cn')&&await p.isVisible('#e_iflex')&&await p.isVisible('#e_ipay'));
ok('new enquiry: operator quote not shown yet'+W,!(await p.isVisible('#q_op')));
const d=new Date(Date.now()+20*864e5).toISOString().slice(0,10);
await p.fill('#e_cn','Example Intake');await p.fill('#e_em','intake@example.com');await p.fill('#e_ct','Singapore');
await p.fill('.leg [data-l="from"]','WSSL');await p.fill('.leg [data-l="to"]','VTBD');await p.fill('.leg [data-l="date"]',d);await p.fill('.leg [data-l="time"]','14:00');await p.fill('.leg [data-l="pax"]','4');
await p.fill('#e_ilead','Example Lead');await p.fill('#e_iflex','±1 day');await p.fill('#e_ibags','2 golf bags');await p.fill('#e_ipets','none');await p.fill('#e_ipurp','leisure');await p.fill('#e_inat','Singapore S1234567D');
await p.selectOption('#e_ipay','Card');await p.selectOption('#e_isrc','Phone call');
ok('no sideways scroll'+W,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await p.click('#edForm button[type=submit]');await p.waitForTimeout(2000);
const t=await p.evaluate(()=>{const t=tripById(S.sel);return {i:t.d.intake,stage:t.stage,q:t.d.quote}});
ok('intake saved once with the trip'+W,t.i&&t.i.lead==='Example Lead'&&t.i.bags==='2 golf bags'&&t.i.pay==='Card'&&t.i.source==='Phone call',t.i);
ok('a nationality with a number in it is not stored'+W,t.i&&t.i.nat==='',t.i&&t.i.nat);
ok('saved as an enquiry, no price yet'+W,t.stage==='enquiry',t.stage);
const req=await p.innerText('#avReqText');
ok('Avinode request written from the trip'+W,/Please quote an all-in price/.test(req)&&/WSSL/.test(req)&&/VTBD/.test(req)&&/4 passengers/.test(req)&&/2 golf bags/.test(req)&&/±1 day/.test(req),req);
ok('no client name or contact in the request'+W,!/Example Intake|intake@example|Example Lead|Singapore S/.test(req),req);
await p.click('[data-act="avCopy"]');await p.waitForTimeout(800);
ok('copying the request is recorded'+W,await p.evaluate(()=>!!tripById(S.sel).d.avReqAt));
await p.click('[data-act="editQuote"]');await p.waitForTimeout(400);
ok('Enter the operator quote: only the quote part'+W,await p.isVisible('#q_op')&&!(await p.isVisible('#e_cn'))&&!(await p.isVisible('#e_iflex')));
ok('payment method Card ticks "pays by card"'+W,await p.isChecked('#q_card'));
await p.fill('#q_op','Example Air AG');await p.fill('#q_ac','Global 7500');await p.fill('#q_pr','40000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(2000);
const t2=await p.evaluate(()=>{const t=tripById(S.sel);return {c:t.d.client.name,i:t.d.intake.lead,legs:t.d.trip.legs.length,op:t.d.quote.opPrice,card:t.d.quote.card,stage:t.stage}});
ok('saving the quote keeps the client, trip and intake'+W,t2.c==='Example Intake'&&t2.i==='Example Lead'&&t2.legs===1&&t2.op===40000&&t2.card===true&&t2.stage==='quoted',t2);
const lead=await p.evaluate(()=>confDraftFrom(tripById(S.sel)).lead);ok('lead passenger reaches the confirmation'+W,lead==='Example Lead',lead);
const names=await p.evaluate(()=>{const b=document.querySelector('[id^="scr_names_"]');return b?b.value:''});
await p.click('[data-act="openConf"]');await p.waitForTimeout(1200);
ok('confirmation: a trip leg has no Remove and a locked positioning box'+W,await p.evaluate(()=>!document.querySelector('[data-act="confDelLeg"][data-i="0"]')&&!!(document.getElementById('cl_0_pos')||{}).disabled));
await p.click('[data-act="confAddLeg"]',{timeout:5000});await p.waitForTimeout(600);
const al=await p.evaluate(()=>({pos:S.confDraft.legs[S.confDraft.legs.length-1].pos,row:!!document.getElementById('cl_1_pos'),locked:!!(document.getElementById('cl_1_from')||{}).readOnly}));
ok('confirmation: Add leg gives an editable positioning leg'+W,al.pos===true&&al.row&&!al.locked,al);
await p.click('[data-act="confBack"]');await p.waitForTimeout(800);
await p.click('[data-act="edit"]');await p.waitForTimeout(400);
ok('Edit client and trip: no quote fields shown'+W,await p.isVisible('#e_cn')&&!(await p.isVisible('#q_op')));
ok('no page errors'+W,!errs.length,errs);await p.close();}
console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
