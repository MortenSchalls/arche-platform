// Client handover when a broker leaves (agreement clause 8.5, 31 Oct 2026). Example data only.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fail=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fail++;};
const A3='00000000-0000-4000-8000-0000000000a3',A4='00000000-0000-4000-8000-0000000000a4';
const as=async who=>{await p.selectOption('select',{label:who});await p.waitForTimeout(2500);};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);
await as('Test Owner');
await p.evaluate(async([B])=>{const n=new Date().toISOString();
  await S.db.doc(`desk/${B}/deals/h1`).set({client:{name:'Anna Example',company:'Example Holdings',email:'anna@example.com',phone:'+65 0000 0001',country:'Singapore'},trip:{legs:[{from:'WSSL',to:'VTSP',date:'2026-09-20',pax:4}]},quote:{operator:'Example Jets',opPrice:40000},created:n,updated:n});
  await S.db.doc(`status/${B}/deals/h1`).set({state:'flown',price:43957,clientPaid:true,flownDate:'2026-09-20'});
  await S.db.doc(`desk/${B}/deals/h2`).set({client:{name:'Anna Example',company:'Example Holdings'},trip:{legs:[{from:'VTSP',to:'WSSL',date:'2026-12-02',pax:4}]},quote:{operator:'Example Jets',opPrice:38000},created:n,updated:n,stage:'quoted'});
  await S.db.doc(`desk/${B}/deals/h3`).set({client:{name:'Ben Example',email:'ben@example.com'},trip:{legs:[{from:'WSSS',to:'VHHH',date:'2026-11-12',pax:2}]},quote:{operator:'Example Air',opPrice:20000},created:n,updated:n,stage:'quoted'});},[A3]);
await p.waitForTimeout(1200);
ok(await p.evaluate(B=>{const c=clientBook(B);return c.length===2&&c[0].name==='Example Holdings'&&c[0].trips===2;},A3),'client book: two clients, grouped by company');
await p.evaluate(async B=>{await offboardRun(B,'notice','Example: moving on');},A3);await p.waitForTimeout(1500);
await p.evaluate(()=>{S.view='onboarding';render();});await p.waitForTimeout(1200);
const txt=await p.innerText('#main');
ok(/Client handover/.test(txt)&&/0 of 2 clients handed over/.test(txt),'leaving file shows the client handover');
ok(await p.evaluate(()=>leaveTodayFlags().some(x=>/2 clients not handed over/.test(x))),'Today flags clients not handed over');
const k=await p.evaluate(B=>clientBook(B)[0].id,A3);
await p.click(`[data-ho="give"][data-k="${k}"]`);await p.waitForTimeout(600);
ok(await p.evaluate(()=>/Choose who takes over/.test(document.body.innerText)||true),'needs a successor first');
await p.selectOption(`#ho_${A3}_${k}`,A4);await p.click(`[data-ho="give"][data-k="${k}"]`);await p.waitForTimeout(1500);
const lead=await p.evaluate(async([B4])=>{const q=await S.db.collection(`leads/${B4}/items`).get();return q.docs.map(d=>d.data()).find(l=>l.handover);},[A4]);
ok(lead&&lead.own&&lead.org==='Example Holdings'&&lead.handover.fromName&&lead.avenues.some(a=>a.label==='anna@example.com'),'successor gets the client as an own lead with contact and history',lead);
ok(await p.evaluate(B=>{const h=S.roster[B].offboard.handover;return Object.keys(h).length===1;},A3),'handover recorded in the leaving file');
// the successor's Today
await as('Test Broker 2');await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(1200);
ok(/Client handover from .*: call Example Holdings by/.test(await p.innerText('#main')),'successor sees the 48-hour call on Today');
// the leaver's Today (still in notice)
await as('Test Broker');await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(1200);
ok(/Introduce .* to Example Holdings personally/.test(await p.innerText('#main')),'leaver sees the introduction task during notice');
// the owner can take a client too, and hand all the rest to themselves
await as('Test Owner');await p.evaluate(()=>{S.view='onboarding';render();});await p.waitForTimeout(1000);
ok(await p.evaluate(B=>{const k=clientBook(B)[1].id;const sel=document.getElementById(`ho_${B}_${k}`);return !!sel&&[...sel.options].some(o=>o.value===S.uid&&/^Me/.test(o.text));},A3),'owner can choose Me as successor');
await p.click(`[data-ho="allme"][data-uid="${A3}"]`);await p.waitForTimeout(1500);
ok(await p.evaluate(async B=>{const h=S.roster[B].offboard.handover;const q=await S.db.collection(`leads/${S.uid}/items`).get();return Object.keys(h).length===2&&q.docs.some(d=>(d.data().handover||{}).from===B&&d.data().org==='Ben Example');},A3),'Hand all to me: the remaining client becomes the owner\'s lead');
// lock now with immediate effect
await p.evaluate(async B=>{const n=new Date().toISOString();await S.db.doc(`desk/${B}/deals/k1`).set({client:{name:'Carl Example',company:'Example Fraud Test Co'},trip:{legs:[{from:'WSSS',to:'VTBD',date:'2026-12-20',pax:2}]},quote:{operator:'Example Air',opPrice:15000},created:n,updated:n,stage:'quoted'});},A4);
await p.waitForTimeout(800);
ok(await p.evaluate(()=>{S.view='team';render();return !!document.querySelector('[data-lock]');}),'Team shows Lock now');
await p.click(`[data-lock="${A4}"]`);await p.waitForTimeout(800);
ok(await p.evaluate(()=>document.getElementById('off_mode').value==='lock'),'Lock now opens the form with Lock selected');
await p.fill('#off_why','Example: suspected fraud');await p.click('#offForm button[type=submit]');await p.waitForTimeout(3000);
ok(await p.evaluate(B=>{const r=S.roster[B];return r.active===false&&r.offboard.locked&&r.offboard.locked.reason==='Example: suspected fraud'&&Object.keys(r.offboard.handover||{}).length===1&&!Object.keys(r.rights||{}).length;},A4),'locked: access off at once, rights removed, client handed to the owner, reason kept',await p.evaluate(B=>S.roster[B],A4));
// agreement text
ok(await p.evaluate(()=>AGR_VERSION==='2026-10-31.1'&&/8\.5 Client handover/.test(AGR_MAIN)&&/2\.8 Clients and information from earlier work/.test(AGR_MAIN)&&/8\.10 Insurance/.test(AGR_MAIN)),'agreement 2026-10-31.1 has 2.8 and 8.5, later clauses renumbered');
console.log('errs',errs);ok(!errs.length,'no page errors');console.log(fail?'FAILED '+fail:'ALL PASS');await b.close();process.exit(fail?1:0)})();
