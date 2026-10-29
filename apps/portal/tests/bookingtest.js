// Booking with the operator (Morten, 29 Oct 2026): operator terms and insurance on every trip, the higher cancellation
// charge, the client's schedule before the operator wants money, the operator paid only from client money, the
// operator's contract signed only when covered, margin 9% unless the owner decides, the operator library. Example data
// only. Needs the test page on localhost:8765.
const {chromium}=require('playwright');
(async()=>{const {entryFrom}=await import('../api/oplib.mjs');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,400)));if(!c)fails++;};
const toasts=[];await p.exposeFunction('logT',t=>toasts.push(t));
const hook=()=>p.evaluate(()=>{const o=window.toast;if(o.__h)return;const n=m=>{logT(m);o(m);};n.__h=1;window.toast=n;});
const as=async who=>{await p.selectOption('select',{label:who});await p.waitForTimeout(2500);await hook();};
const sel=async(id,v)=>{await p.selectOption('#'+id,v);await p.waitForTimeout(350);};
const fill=async(id,v)=>{await p.fill('#'+id,v);await p.dispatchEvent('#'+id,'change');await p.waitForTimeout(350);};
const lastToast=()=>toasts[toasts.length-1]||'';
const trip=()=>p.evaluate(()=>{const t=tripById(S.sel);return {d:t.d,st:t.st||{},stage:t.stage};});
const dep=new Date(Date.now()+40*864e5).toISOString().slice(0,10), dep2=new Date(Date.now()+41*864e5).toISOString().slice(0,10);
const S_=process.env.SHOTS, shot=async(n,sel)=>{if(!S_)return;await p.setViewportSize({width:1300,height:2400});await p.waitForTimeout(400);const el=await p.$(sel);if(el)await el.screenshot({path:S_+'/'+n+'.png'});await p.setViewportSize({width:1300,height:1000});};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await as('Test Broker');
// a trip with a complete operator safety record (tier 1), quote and documents
await p.evaluate(()=>{S.view='trips';render();});await p.waitForTimeout(400);await p.click('[data-act="new"]');await p.waitForTimeout(800);
await p.fill('#e_cn','Anna Example');await p.fill('#e_em','anna@example.com');await p.fill('#e_ct','Singapore');
{const leg=p.locator('.leg').first();await leg.locator('[data-l="from"]').fill('WSSS');await leg.locator('[data-l="to"]').fill('VTBD');await leg.locator('[data-l="date"]').fill(dep);await leg.locator('[data-l="time"]').fill('10:00');await leg.locator('[data-l="pax"]').fill('4');}
await p.fill('#q_op','Example Charter Air Ltd');await p.selectOption('#q_oc','SG');await p.fill('#q_ac','Legacy 600');await p.fill('#q_tl','9V-XYZ');await p.fill('#q_pr','90000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(1800);
await p.evaluate(async([dep2])=>{const t=tripById(S.sel);const leg2={from:'VTBD',to:'WSSS',date:dep2,time:'10:00',pax:4};
  await deskWrite(t,{trip:{...t.d.trip,legs:[...t.d.trip.legs,leg2]},safety:{audit:'argus-plat',cls:'jet',twoPilots:'yes',ins:60000000,history:'clear',expiry:'2028-12-31',checkedAt:new Date().toISOString().slice(0,10),link:'https://example.com/registry'},
    docs:[{id:'x1',name:'quote.pdf',kind:'Operator quote',at:now()},{id:'x2',name:'aoc.pdf',kind:'AOC',at:now()},{id:'x3',name:'audit.png',kind:'Safety audit',at:now()}]},'test setup');},[dep2]);
await p.waitForTimeout(900);
let tx=await p.textContent('#main');
ok('the trip shows "Operator terms and insurance"',/Operator terms and insurance/.test(tx));
let t=await trip();
ok('sending is blocked until the operator terms are in',await p.evaluate(()=>{const n=sendNeeds(tripById(S.sel).d);return n.some(x=>/cancellation scale/.test(x))&&n.some(x=>/payment terms/.test(x))&&n.some(x=>/insurer/.test(x));}));
ok('the insurance and terms ticks are automatic (disabled)',await p.evaluate(()=>document.getElementById('ck_ins').disabled&&document.getElementById('ck_terms').disabled));
// cancellation: 15% from booking, 50% inside 30 days, 100% inside 7 days
for(let i=0;i<3;i++){await p.click('[data-otadd="cancel"]');await p.waitForTimeout(400);}
await p.selectOption('[data-otw="cancel|0"]','booking');await p.waitForTimeout(400);
await p.fill('[data-otp="cancel|0"]','15');await p.dispatchEvent('[data-otp="cancel|0"]','change');await p.waitForTimeout(400);
await p.fill('[data-otd="cancel|1"]','30');await p.dispatchEvent('[data-otd="cancel|1"]','change');await p.waitForTimeout(300);
await p.fill('[data-otp="cancel|1"]','50');await p.dispatchEvent('[data-otp="cancel|1"]','change');await p.waitForTimeout(300);
await p.fill('[data-otd="cancel|2"]','7');await p.dispatchEvent('[data-otd="cancel|2"]','change');await p.waitForTimeout(300);
await p.fill('[data-otp="cancel|2"]','100');await p.dispatchEvent('[data-otp="cancel|2"]','change');await p.waitForTimeout(400);
// payment: 50% when its contract is signed, 50% 10 days before
await p.click('[data-otadd="pay"]');await p.waitForTimeout(400);await p.click('[data-otadd="pay"]');await p.waitForTimeout(400);
await p.fill('[data-otp="pay|0"]','50');await p.dispatchEvent('[data-otp="pay|0"]','change');await p.waitForTimeout(300);
await p.fill('[data-otd="pay|1"]','10');await p.dispatchEvent('[data-otd="pay|1"]','change');await p.waitForTimeout(300);
await p.fill('[data-otp="pay|1"]','50');await p.dispatchEvent('[data-otp="pay|1"]','change');await p.waitForTimeout(400);
t=await trip();
ok('cancellation lines saved',JSON.stringify(t.d.opTerms.cancel.map(r=>[r.days,r.pct]))===JSON.stringify([['booking',15],[30,50],[7,100]]),t.d.opTerms.cancel);
ok('payment lines saved, 100%',t.d.opTerms.pay.map(r=>r.pct).join()==='50,50'&&t.d.opTerms.pay[0].days==='booking'&&t.d.opTerms.pay[1].days===10,t.d.opTerms.pay);
// insurance: a certificate that ends before the last flight is red
await fill('oi_ins','Example Aviation Insurance');await fill('oi_exp',dep);await sel('oi_reg','yes');await sel('oi_ter','yes');await fill('oi_how','Email from the insurer\'s broker');await fill('oi_at',new Date().toISOString().slice(0,10));
ok('insurance ending before the last flight is a red trip check',await p.evaluate(()=>tripChecks(tripById(S.sel).d,{}).some(c=>c.sev==='red'&&/insurance certificate ends/.test(c.text))));
await fill('oi_exp','2028-06-30');
ok('certificate must be attached',await p.evaluate(()=>opTermsNeeds(tripById(S.sel).d).some(x=>/certificate attached/.test(x))));
await p.evaluate(async()=>{const t=tripById(S.sel);await deskWrite(t,{docs:[...t.d.docs,{id:'x4',name:'ins.pdf',kind:'Insurance certificate',at:now()}]},'test');});await p.waitForTimeout(600);
await fill('oi_how','Email from the insurer\'s broker, Example Brokers');   // a save after the attachment sets the ticks
t=await trip();
ok('record complete: the two ticks are set by the portal',t.d.checks.ins===true&&t.d.checks.terms===true,t.d.checks);
ok('a ticked box cannot be unticked by hand',await p.evaluate(async()=>{const c=document.getElementById('ck_ins');c.disabled=false;c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,500));return tripById(S.sel).d.checks.ins===true;}));
// the preview: higher of ours and the operator's, and the schedule
const pl=await p.evaluate(()=>bookingPlan(tripById(S.sel)));
ok('client price at 9%',pl.f.P===Math.ceil(90000/0.91),pl.f);
const r30=pl.cancel.find(r=>/to under 30 days/.test(r.label)||/7 to/.test(r.label));
ok('cancellation inside 30 days: the operator\'s 50% plus our fee is charged, not our 25%',!!r30&&r30.amount===Math.ceil(45000+pl.f.P-90000)&&r30.operatorHigher,pl.cancel);
ok('more than 30 days: our 25% (higher than the operator\'s 15% plus fee)',pl.cancel[0].amount===Math.ceil(pl.f.P*0.25)||pl.cancel[0].amount===Math.ceil(13500+pl.f.P-90000),pl.cancel[0]);
ok('schedule: on signature at least what the operator wants at signing (50%)',pl.sched[0].due==='signature'&&pl.sched[0].cum>=45000,pl.sched);
ok('schedule: 90,000 before the operator\'s second payment, two days early',pl.sched.some(x=>x.cum>=90000&&x.due!=='signature'&&x.due<=new Date(Date.parse(dep)-12*864e5).toISOString().slice(0,10)),pl.sched);
ok('schedule ends at the full price',pl.sched[pl.sched.length-1].cum===pl.f.P,pl.sched);
if(process.env.SHOTS){await shot('1-broker-terms','#secOpTerms');await p.setViewportSize({width:390,height:900});await p.waitForTimeout(500);await p.locator('#secOpTerms').screenshot({path:process.env.SHOTS+'/ot390.png'});ok('phone: no sideways scrolling',await p.evaluate(()=>document.documentElement.scrollWidth<=391),await p.evaluate(()=>document.documentElement.scrollWidth));await p.setViewportSize({width:1300,height:1000});}
ok('the preview shows both tables',/If the client cancels/.test(await p.textContent('#secOpTerms'))&&/The client pays/.test(await p.textContent('#secOpTerms')));
// send to operations
await p.evaluate(()=>{const c=tripById(S.sel).d.checks||{};});
const sendMissing=await p.evaluate(()=>sendNeeds(tripById(S.sel).d));
ok('nothing from operator terms left before sending',!sendMissing.some(x=>/operator (terms|insurance)/.test(x)),sendMissing);
await p.evaluate(async()=>{const t=tripById(S.sel);const ck={};BROKER_CHECKS.forEach(([k])=>ck[k]=true);await deskWrite(t,{checks:{...ck,...t.d.checks},stage:'submitted',submittedAt:now()},'test: sent');});await p.waitForTimeout(800);
// operations
await as('Test Operations');await p.evaluate(did=>{S.view='trips';S.sel=did;render();},t.d.id||await p.evaluate(()=>S.sel)).catch(()=>{});
const did=await p.evaluate(()=>{const t=allTrips().find(x=>x.d.client&&x.d.client.name==='Anna Example');S.sel=t.did;S.view='trips';render();return t.did;});await p.waitForTimeout(800);
await p.fill('#o_op','90000');await p.fill('#o_pn','PR-EXAMPLE-1');await p.check('#o_kyc');await p.click('[data-act="opsSave"]');await p.waitForTimeout(800);
tx=await p.textContent('#main');
ok('operations sees "Booking with the operator"',/Booking with the operator/.test(tx));
ok('before issuing: Request to Book, hold, contract and check are listed',/Request to Book sent on Avinode/.test(await p.textContent('#secBook'))&&/operator's contract attached/.test(await p.textContent('#secBook')));
ok('issuing is blocked without them',await p.evaluate(()=>bookNeeds(tripById(S.sel)).length>=3));
const now16=new Date(Date.now()+60e3).toISOString().slice(0,16), hold=new Date(Date.now()+3*864e5).toISOString().slice(0,16);
await fill('bk_rtb',now16);await fill('bk_hold',hold);
await p.evaluate(async()=>{const t=tripById(S.sel);await deskWrite(t,{docs:[...t.d.docs,{id:'x5',name:'contract.pdf',kind:'Operator contract',at:now()}]},'test');});await p.waitForTimeout(600);
await p.check('#secBook [data-bkc]');await p.waitForTimeout(600);
ok('offer expiry later than the hold is refused',await p.evaluate(h=>bookNeeds(tripById(S.sel),new Date(Date.parse(h)+5*864e5).toISOString().slice(0,10)).some(x=>/offer expiry/.test(x)),hold));
ok('everything for issuing is in',await p.evaluate(h=>bookNeeds(tripById(S.sel),h.slice(0,10)).length===0,hold),await p.evaluate(()=>bookNeeds(tripById(S.sel))));
await shot('3-ops-before-issue','#secBook');
// the confirmation carries this booking's schedule and charges
const conf=await p.evaluate(()=>{const t=tripById(S.sel);const data=confData(t,confDraftFrom(t),null);const ev=CONF.evaluate(data);return {sched:ev.cc.sched,deposit:ev.cc.deposit,html:CONF.html(data,true),ckIns:data.ck.ins,ckTerms:data.ck.terms};});
ok('confirmation: schedule from the plan',Array.isArray(conf.sched)&&conf.sched[0].cum>=45000&&conf.deposit===conf.sched[0].amount,conf.sched);
ok('confirmation: A3 says the schedule applies when the operator wants money earlier',/payment schedule apply/.test(conf.html));
ok('confirmation: A9 table charges the operator\'s higher amount',conf.html.includes(r30.label)&&conf.html.includes('USD '+r30.amount.toLocaleString('en-US')));
ok('confirmation: insurance and terms ticks come from the record',conf.ckIns&&conf.ckTerms);
if(S_){await p.click('[data-act="openConf"]');await p.waitForTimeout(1500);await shot('4-confirmation','#confPages');await p.evaluate(()=>{S.view='trips';render();});await p.waitForTimeout(600);}
// issue (status written directly: the PDF needs the browser's PDF library) and the client signs
await p.evaluate(async()=>{const t=tripById(S.sel);await statusWrite(t,{state:'issued',ref:'AE-TEST-1',issuedAt:now(),confIssued:{rev:1,at:now(),data:{}}},'test: issued');});await p.waitForTimeout(800);
ok('no operator contract signature before the client signs',await p.evaluate(()=>{const b=document.querySelector('[data-bka="signed"]');return !!b&&b.disabled;}));
await p.evaluate(async()=>{const t=tripById(S.sel);await statusWrite(t,{signed:{at:now()}},'test: signed');});await p.waitForTimeout(800);
// client pays the deposit only: 25% is less than the operator wants at signing (50%)
await fill('bk_ra','25000');await fill('bk_rd',new Date().toISOString().slice(0,10));await p.click('[data-bka="receipt"]');await p.waitForTimeout(800);
t=await trip();ok('client money recorded with amount and date',(t.st.receipts||[]).length===1&&t.st.receipts[0].amount===25000,t.st.receipts);
ok('not covered: operator contract cannot be signed',await p.evaluate(()=>document.querySelector('[data-bka="signed"]').disabled));
ok('Today: client payment missing, with the date to cancel before',await p.evaluate(()=>moneyFlags().some(x=>/Client payment missing/.test(x))));
if(S_){await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(600);await shot('6-today-money','#moneyPanel');await p.evaluate(did=>{S.view='trips';S.sel=did;render();},did);await p.waitForTimeout(600);}
await fill('bk_ra','24000');await fill('bk_rd',new Date().toISOString().slice(0,10));await p.click('[data-bka="receipt"]');await p.waitForTimeout(800);
ok('covered now: the sign button is open',await p.evaluate(()=>!document.querySelector('[data-bka="signed"]').disabled));
ok('Today says sign the operator\'s contract',await p.evaluate(()=>moneyFlags().some(x=>/Sign the operator's contract/.test(x))));
await shot('5-client-money','#secBook');
await p.click('[data-bka="signed"]');await p.waitForTimeout(800);
t=await trip();ok('operator contract signed recorded',!!(t.st.book||{}).signedAt);
// pay the operator: never more than received
await fill('bk_pa','60000');await fill('bk_pd',new Date().toISOString().slice(0,10));await p.click('[data-bka="payout"]');await p.waitForTimeout(800);
t=await trip();ok('paying more than the client money received is refused',!(t.st.payouts||[]).length&&/never pays the operator before the client/.test(lastToast()),lastToast());
await fill('bk_pa','45000');await fill('bk_pd',new Date().toISOString().slice(0,10));await p.click('[data-bka="payout"]');await p.waitForTimeout(800);
t=await trip();ok('operator paid 45,000 from client money',(t.st.payouts||[]).length===1&&t.st.payouts[0].amount===45000,t.st.payouts);
ok('stage is still confirmed (not paid in full)',t.stage==='issued'&&!t.st.clientPaid,t.stage);
const rest=await p.evaluate(()=>{const pl=bookingPlan(tripById(S.sel));return pl.f.P+pl.f.F-49000;});
await fill('bk_ra',String(rest));await fill('bk_rd',new Date().toISOString().slice(0,10));await p.click('[data-bka="receipt"]');await p.waitForTimeout(800);
t=await trip();ok('paid in full: stage Client paid',t.stage==='clientPaid'&&t.st.clientPaid===true,t.stage);
await fill('bk_pa','45000');await fill('bk_pd',new Date().toISOString().slice(0,10));await p.click('[data-bka="payout"]');await p.waitForTimeout(800);
t=await trip();ok('operator paid in full, never above its price',t.st.operatorPaid===true&&t.st.payouts.reduce((a,x)=>a+x.amount,0)===90000,t.st.payouts);
await shot('7-paid','#secBook');
ok('nothing more can be paid',await p.evaluate(()=>!document.querySelector('[data-bka="payout"]')));
// the library
await p.evaluate(()=>oplibSave(tripById(S.sel),'issued'));await p.waitForTimeout(800);
const lib=await p.evaluate(async()=>{const g=await S.db.doc('intel/oplib').get();return g.exists?g.data():null;});
const k='example charter air';
ok('library: the operator, its terms and the trip figures are saved',!!lib&&lib.ops[k]&&lib.ops[k].last.terms.cancel.length===3&&lib.ops[k].trips[0].opPrice===90000&&lib.ops[k].trips[0].legs[0].from==='WSSS',lib&&lib.ops);
const ent=lib.ops[k].trips[0];
ok('library: no client name, email or phone',!/Anna|anna@example/.test(JSON.stringify(lib)));
const tt=await trip();const se=entryFrom(tt.d,tt.st,'issued',ent.at);
ok('library: the server builds the same entry as the portal',JSON.stringify({...se,ref:se.ref||ent.ref})===JSON.stringify(ent),{server:se,portal:ent});
if(S_){await p.evaluate(()=>{S.view='control';render();});await p.waitForTimeout(1200);await p.evaluate(()=>{const x=[...document.querySelectorAll('.panel')].find(e=>/Operator library/.test(e.querySelector('h2')?.textContent||''));if(x)x.id='libShot';});await shot('8-library','#libShot');await p.evaluate(did=>{S.view='trips';S.sel=did;render();},did);await p.waitForTimeout(600);}
// a new trip with the same operator is offered the terms on file
await as('Test Broker');await p.evaluate(()=>{S.view='trips';render();});await p.waitForTimeout(400);await p.click('[data-act="new"]');await p.waitForTimeout(800);
await p.fill('#e_cn','Ben Example');await p.fill('#e_em','ben@example.com');await p.fill('#e_ct','Singapore');
{const leg=p.locator('.leg').first();await leg.locator('[data-l="from"]').fill('WSSS');await leg.locator('[data-l="to"]').fill('VVTS');await leg.locator('[data-l="date"]').fill(dep);await leg.locator('[data-l="time"]').fill('09:00');await leg.locator('[data-l="pax"]').fill('2');}
await p.fill('#q_op','Example Charter Air Ltd');await p.selectOption('#q_oc','SG');await p.fill('#q_ac','Legacy 600');await p.fill('#q_tl','9V-XYZ');await p.fill('#q_pr','50000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(2000);
ok('the library offers the terms on file',!!await p.$('[data-otlib]'));
await p.click('[data-otlib]');await p.waitForTimeout(800);
t=await trip();ok('terms taken from the library; aircraft and route must be confirmed again',t.d.opTerms.cancel.length===3&&t.d.opTerms.ins.insurer==='Example Aviation Insurance'&&t.d.opTerms.ins.regOn===''&&t.d.opTerms.ins.territory==='',t.d.opTerms);
// margin: 9% floor in Settings, the owner's own margin on one trip
await as('Test Owner');
const floor=await p.evaluate(async()=>{S.view='settings';render();await new Promise(r=>setTimeout(r,500));const m=document.getElementById('t_m');if(!m)return 'no form';m.value='8';document.getElementById('termsForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,500));return S.terms.margin;});
ok('Settings refuses a margin below 9%',floor===0.09&&/cannot be below 9%/.test(lastToast()),[floor,lastToast()]);
await p.evaluate(()=>{const t=allTrips().find(x=>x.d.client&&x.d.client.name==='Anna Example');S.sel=t.did;S.view='trips';render();});await p.waitForTimeout(600);
const r2=await p.evaluate(async()=>{const t=tripById(S.sel);await statusWrite(t,{state:'review',confIssued:null},'test: back to review');await new Promise(r=>setTimeout(r,600));render();await new Promise(r=>setTimeout(r,400));return !!document.getElementById('bk_mp');});
ok('the owner can set another margin on the trip',r2);
await p.evaluate(()=>{document.querySelector('#secBook details').open=true;});await p.fill('#bk_mp','12');await p.fill('#bk_mr','Example: repeat client, director decision');await p.click('[data-bka="margin"]');await p.waitForTimeout(800);
t=await trip();ok('trip margin 12%: price recomputed, reason kept',t.st.marginEx&&Math.abs(t.st.marginEx.pct-0.12)<1e-9&&t.st.price===Math.ceil(90000/0.88),t.st);
await shot('9-owner-margin','#secBook');
ok('the approval card shows the owner\'s margin as decided',await p.evaluate(()=>apChecks(tripById(S.sel)).some(x=>x[0]&&/set by the owner/.test(x[1]))));
await as('Test Operations');await p.evaluate(did=>{S.sel=did;S.view='trips';render();},did);await p.waitForTimeout(600);
ok('operations cannot set a margin',!await p.$('#bk_mp'));
await p.fill('#o_op','90000');await p.click('[data-act="opsSave"]');await p.waitForTimeout(800);
t=await trip();ok('operations saving again keeps the owner\'s margin',t.st.price===Math.ceil(90000/0.88),t.st.price);
// the critical (AOG) alert: the deadline arithmetic, and the red bar on every page for everyone involved
await p.evaluate(async did=>{const t=tripById(did);await statusWrite(t,{state:'issued',confIssued:{rev:1,at:now(),data:{}},signed:{at:now()},book:{...(t.st.book||{}),signedAt:now()},receipts:[{date:new Date().toISOString().slice(0,10),amount:45000}],payouts:[{date:new Date().toISOString().slice(0,10),amount:45000}],clientPaid:false,operatorPaid:false},'test: re-issued, half paid');},did);await p.waitForTimeout(800);
const ag=await p.evaluate(did=>{const t=tripById(did);const leg=t.d.trip.legs[0];const dep=Date.parse(leg.date+'T'+leg.time+':00Z');const at10=dep-10*864e5;return {before:aogOf(t,at10-13*3600e3),in:aogOf(t,at10-11*3600e3),after:aogOf(t,at10+3600e3)};},did);
ok('AOG: nothing 13 hours before the operator deadline',ag.before===null,ag.before);
ok('AOG: 11 hours before, money missing: critical with the time to cancel by',ag.in&&ag.in.level==='aog'&&/cancel with the operator on Avinode before/.test(ag.in.text),ag.in);
ok('AOG: after the deadline: exposure shown',ag.after&&ag.after.level==='passed'&&/exposed USD 45,000/.test(ag.after.text),ag.after);
const bar=await p.evaluate(async()=>{const o=window.aogOf;window.aogOf=t=>t.d.client&&t.d.client.name==='Anna Example'?{level:'aog',text:'Client money missing USD 45,000: cancel with the operator on Avinode before 2026-11-28 10:00 UTC, or collect it.'}:null;S.view='prospects';render();await new Promise(r=>setTimeout(r,300));const x=!!document.getElementById('aogBar')&&/CRITICAL \(AOG\)/.test(document.getElementById('aogBar').textContent);window.__keepAog=o;return x;});
await shot('10-aog-bar','#aogBar');await p.evaluate(()=>{window.aogOf=window.__keepAog;render();});
ok('AOG: a red bar on every page',bar);
await as('Test Broker');
const bar2=await p.evaluate(async()=>{const o=window.aogOf;window.aogOf=t=>t.d.client&&t.d.client.name==='Anna Example'?{level:'aog',text:'x'}:null;S.view='today';render();await new Promise(r=>setTimeout(r,300));const x=!!document.getElementById('aogBar');window.aogOf=o;render();return x;});
ok('AOG: the trip\'s broker sees it too',bar2);
// lapsed offer
await as('Test Operations');await p.evaluate(did=>{S.view='trips';S.sel=did;render();},did);await p.waitForTimeout(600);
const lap=await p.evaluate(async did=>{const t=tripById(did);await deskWrite(t,{conf:{...(t.d.conf||{}),valid:{date:'2020-01-01'}}},'test: old offer');await statusWrite(t,{signed:null},'test: unsigned');await new Promise(r=>setTimeout(r,800));const t2=tripById(did);return {l:offerLapsed(t2),flag:moneyFlags().some(x=>/Offer lapsed unsigned/.test(x))};},did);
ok('an unsigned offer past its validity lapses by itself, shown on Today',lap.l&&lap.flag,lap);
await p.evaluate(async did=>{const t=tripById(did);await statusWrite(t,{signed:{at:now()}},'test: signed');},did);await p.waitForTimeout(600);
// one-click cancellation (test version: recorded, no email)
await p.evaluate(()=>{const d=document.querySelector('#secBook details:last-of-type');if(d)d.open=true;});
ok('the cancellation panel shows the notice to the client',/The notice to the client/.test(await p.textContent('#secBook'))&&/Cancellation charge under A9/.test(await p.inputValue('#cx_txt')));
await p.selectOption('#cx_reason','client');await p.waitForTimeout(500);await p.evaluate(()=>{const d=[...document.querySelectorAll('#secBook details')].pop();d.open=true;});
await p.fill('#cx_date',new Date().toISOString().slice(0,10));await p.dispatchEvent('#cx_date','change');await p.waitForTimeout(500);
await p.fill('#cx_op','45000');await p.dispatchEvent('#cx_op','change');await p.waitForTimeout(500);
ok('not before it is cancelled on Avinode',await p.evaluate(()=>document.querySelector('[data-bka="cancel"]').disabled));
await p.check('#cx_av');await p.waitForTimeout(500);
await p.evaluate(()=>{const d=[...document.querySelectorAll('#secBook details')].pop();d.id='cxShot';d.open=true;});await shot('11-cancel','#cxShot');
ok('the notice says the client\'s written cancellation was received',/received in writing on/.test(await p.inputValue('#cx_txt')));
await p.click('[data-bka="cancel"]');await p.waitForTimeout(1500);
t=await trip();ok('cancelled: the client pays the operator\'s actual charge plus our fee (higher than the table)',t.stage==='cancelled'&&t.st.cancelled&&t.st.cancelled.clientCharge===45000+(t.st.price-90000)&&t.st.cancelled.opCancelCharge===45000&&t.st.cancelled.reason==='client',t.st.cancelled);
await p.waitForTimeout(800);
const lib2=await p.evaluate(async()=>{const g=await S.db.doc('intel/oplib').get();return g.data();});
ok('the library records the outcome',lib2.ops['example charter air'].trips.some(x=>x.outcome==='cancelled'&&x.opCancelCharge===45000),lib2.ops['example charter air'].trips.map(x=>[x.ref,x.outcome,x.opCancelCharge]));
// Team > Alerts: reminders to clients only once the owner approves the wording
await as('Test Owner');await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(1000);
await shot('12-reminders','#remindPanel');
ok('Team > Alerts shows the reminder wording, off',!!await p.$('#remindPanel')&&/Off\./.test(await p.textContent('#remindPanel'))&&/is due by/.test(await p.inputValue('#rm_txt')));
await p.click('[data-rm="on"]');await p.waitForTimeout(800);
ok('the owner turns them on: version recorded',await p.evaluate(()=>!!(S.alerts.clientReminders||{}).on&&S.alerts.clientReminders.version===BP.REMIND_VERSION));
ok('no page errors',!errs.length,errs);
await b.close();console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0);})();
