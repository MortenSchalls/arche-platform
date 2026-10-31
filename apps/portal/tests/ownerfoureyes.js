// Four-eyes for owners on their own trips (Morten, 31 Oct 2026). Example data only.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const toasts=[];await p.exposeFunction('logT',t=>toasts.push(t));
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await p.selectOption('select',{label:'Test Owner'});await p.waitForTimeout(2500);
await p.evaluate(()=>{const o=window.toast;window.toast=m=>{logT(m);o(m);};});
await p.evaluate(async()=>{const n=new Date().toISOString();await S.db.doc(`desk/${S.uid}/deals/ow1`).set({client:{name:'Owner Client Example'},trip:{legs:[{from:'WSSS',to:'VHHH',date:'2026-12-01',pax:2}]},quote:{operator:'Example Air',opPrice:20000},created:n,updated:n,stage:'submitted',submittedAt:n});
  await S.db.doc(`desk/00000000-0000-4000-8000-0000000000a3/deals/ob1`).set({client:{name:'Broker Client Example'},trip:{legs:[{from:'WSSS',to:'VHHH',date:'2026-12-02',pax:2}]},quote:{operator:'Example Air',opPrice:20000},created:n,updated:n,stage:'submitted',submittedAt:n});});
await p.waitForTimeout(1200);
ok(await p.evaluate(()=>ownTrip(allTrips().find(t=>t.did==='ow1'))),'an owner\'s own trip counts as own trip');
ok(await p.evaluate(()=>!ownTrip(allTrips().find(t=>t.did==='ob1'))),'a broker\'s trip is not the owner\'s own');
await p.evaluate(()=>{S.view='queue';S.sel='ow1';render();});await p.waitForTimeout(800);
ok(/Your own trip/.test(await p.innerText('#main')),'the operations panel on the owner\'s own trip says another person handles it');
ok(await p.evaluate(()=>allTrips().filter(t=>t.stage==='review'&&!ownTrip(t)).every(t=>t.did!=='ow1')),'the owner\'s own trip is not in their operations queue count');
console.log('errs',errs);ok(!errs.length,'no page errors');console.log(fail?'FAILED '+fail:'ALL PASS');await b.close();process.exit(fail?1:0)})();
