// Supervision (Morten, 8 and 16 Nov 2026): the supervised broker always keeps the full commission; a supervisor reward of
// 3 points of the Archē fee is paid by Archē on the broker's trips in the first 6 months, after that only on a booking the
// Director names (per event); never to an owner; forfeit on a rule breach. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Junior',supervised:true,data:{roster:true,supervisor:B2,onboarding:{issuedAt:ago(200)}}},{id:B2,role:'broker',active:true,contract_name:'Example Senior',data:{roster:true,rights:{supervise:true},onboarding:{issuedAt:ago(400)}}}],
 config:[{key:'terms',value:{margin:0.09,unit:45000,threshold:8,rate1:0.27,rate2:0.35,ownerApproval:true}}],intel:[],
 trips:[{owner_id:B1,id:'t1',data:{client:{name:'Example Client'},stage:'submitted',created:ago(5),quote:{opPrice:40000,direct:950},trip:{legs:[{from:'VTBS',to:'WSSS',date:'2026-12-01'}]},checks:{}}}],
 trip_status:[{owner_id:B1,id:'t1',data:{state:'review',ref:'AE-EX-1',opPrice:40000,direct:950,price:45000,kyc:true,paynodeRef:'PN',history:[]}}],
 step_requests:[],leads:[],prospects:[],optouts:[],join_requests:[],agreements:[],training_runs:[B1,B2].map(u=>({owner_id:u,id:'onboarding',data:{ackAt:ago(30)}}))};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T)=>{const f=`t_h_${n++}.html`;fs.writeFileSync(f,page(uid,T));const p=await b.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(4500);return p;};
 let o=await open(OWN,T0);
 await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(300);
 ok('Team: supervisor named per supervised person', await o.evaluate(id=>document.querySelector(`[data-supby="${id}"]`).value,B1)===B2);
 await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);
 ok('after the first 6 months: nothing recorded at approval', !(await o.evaluate(()=>window.__T)).trip_status[0].data.supShare);
 {const Te=JSON.parse(JSON.stringify(T0));Te.trip_status[0].data.supEvent={uid:B2,reason:'New route type',at:ago(1),by:OWN};await o.close();o=await open(OWN,Te);
  await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);
  const se=(await o.evaluate(()=>window.__T)).trip_status[0].data.supShare;
  ok('after 6 months, a booking the Director names: 3 points to the named supervisor', se&&se.uid===B2&&se.rate===0.03&&se.event);}
 await o.close();T0.profiles[1].data.onboarding.issuedAt=ago(40);T0.trip_status[0].data.state='review';delete T0.trip_status[0].data.approval;o=await open(OWN,T0);
 await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);
 let T=await o.evaluate(()=>window.__T);const sh=T.trip_status[0].data.supShare;
 ok('first 6 months, 3 points by default: recorded at approval, to the supervisor', sh&&sh.uid===B2&&sh.rate===0.03&&!sh.toArche);
 // flown and paid
 T.trip_status[0].data={...T.trip_status[0].data,state:'flown',flownDate:'2026-11-05',clientPaid:true,operatorPaid:true};await o.close();
 o=await open(OWN,T);
 const c=await o.evaluate(([a,b2])=>[commissionFor(a)['2026-11'],commissionFor(b2)['2026-11']],[B1,B2]);
 ok('supervised broker keeps 27%: 4,050 x 27% = 1,093.50', Math.abs(c[0].comm-1093.5)<0.01);
 ok('supervisor reward paid by Archē: 121.50', c[1]&&Math.abs(c[1].comm-121.5)<0.01&&c[1].trips[0].sup);
 // costs beyond the price (Morten, 12 Nov 2026): cost ÷ 0.91 counts towards commission; a B13 cost at cost adds nothing
 {const Tx=JSON.parse(JSON.stringify(T));Tx.trip_status[0].data.extraCosts=[{text:'De-icing',cost:2850,client:3132,fm:false},{text:'Diversion handling',cost:1400,client:1400,fm:true}];await o.close();o=await open(OWN,Tx);
  const cx=await o.evaluate(a=>commissionFor(a)['2026-11'],B1);
  ok('after-flight Archē fee earns commission: (4,050 + 282) x 27% = 1,169.64', Math.abs(cx.comm-1169.64)<0.01&&Math.abs(cx.gp-4332)<0.01);
  await o.close();o=await open(OWN,T);}
 await o.evaluate(()=>{S.view='trips';S.sel='t1';render();});await o.waitForTimeout(300);
 ok('trip shows the supervisor reward', (await o.textContent('#main')).includes('Supervisor reward'));
 await o.fill('#sf_why','Approved a quote below the 9% fee');await o.click('[data-supfo="t1"]');await o.waitForTimeout(500);
 T=await o.evaluate(()=>window.__T);await o.close();o=await open(OWN,T);
 const c2=await o.evaluate(([a,b2])=>[commissionFor(a)['2026-11'],commissionFor(b2)['2026-11']],[B1,B2]);
 ok('forfeited: supervisor gets nothing, broker still 1,093.50', !c2[1]&&Math.abs(c2[0].comm-1093.5)<0.01);
 // agreement 4.2 / Schedule 1: complete only when the operator is paid too; counted in the month it became complete
 {const Tc=JSON.parse(JSON.stringify(T));Tc.trip_status[0].data.operatorPaid=false;await o.close();o=await open(OWN,Tc);
  ok('not complete before the operator is paid: no commission yet', !(await o.evaluate(a=>commissionFor(a)['2026-11'],B1)));
  Tc.trip_status[0].data={...Tc.trip_status[0].data,operatorPaid:true,clientPaidDate:'2026-11-03',operatorPaidDate:'2026-12-02'};await o.close();o=await open(OWN,Tc);
  const cc=await o.evaluate(a=>commissionFor(a),B1);
  ok('counted in the month it became complete (December)', !cc['2026-11']&&cc['2026-12']&&Math.abs(cc['2026-12'].comm-1093.5)<0.01);
  Tc.trip_status[0].data.extraCosts=[{text:'De-icing',cost:2850,client:3132,fm:false}];await o.close();o=await open(OWN,Tc);
  const cu=await o.evaluate(a=>commissionFor(a)['2026-12'],B1);
  ok('counted by Client Price incl. costs beyond the price: 48,132 / 45,000 units', Math.abs(cu.units-48132/45000)<1e-6);
  await o.close();o=await open(OWN,T);}
 // owner as supervisor
 const T2=JSON.parse(JSON.stringify(T0));T2.profiles[1].data.supervisor=OWN;await o.close();o=await open(OWN,T2);
 await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('owner supervises: no reward recorded', !T.trip_status[0].data.supShare);
 T.trip_status[0].data={...T.trip_status[0].data,state:'flown',flownDate:'2026-11-05',clientPaid:true,operatorPaid:true};await o.close();o=await open(OWN,T);
 const c3=await o.evaluate(([a,b2])=>[commissionFor(a)['2026-11'],commissionFor(b2)['2026-11']],[B1,B2]);
 ok('owner-supervised: broker 1,093.50, no member reward', Math.abs(c3[0].comm-1093.5)<0.01&&!c3[1]);
 // not supervised: full 27%
 const T3=JSON.parse(JSON.stringify(T0));T3.profiles[1].supervised=false;await o.close();o=await open(OWN,T3);
 await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('released broker: no share recorded', !T.trip_status[0].data.supShare);
 // per event, from the trip screen (Morten, 16 Nov 2026: "after that we need a way to control per event only")
 {const T4=JSON.parse(JSON.stringify(T0));T4.profiles[1].data.onboarding.issuedAt=ago(200);await o.close();o=await open(OWN,T4);
  await o.evaluate(()=>{S.view='trips';S.sel='t1';render();});await o.waitForTimeout(300);
  const m=await o.textContent('#main');ok('past 6 months: the Director can put the booking under supervision',m.includes('Put this booking under supervision'));
  await o.evaluate(()=>document.querySelector('#se_uid').closest('details').open=true);
  await o.selectOption('#se_uid',B2);await o.click('[data-supev="set"]');await o.waitForTimeout(400);
  ok('a reason is required',!(await o.evaluate(()=>window.__T)).trip_status[0].data.supEvent);
  await o.fill('#se_why','First Africa trip');await o.click('[data-supev="set"]');await o.waitForTimeout(400);
  let T5=await o.evaluate(()=>window.__T);const ev=T5.trip_status[0].data.supEvent;
  ok('saved on the booking: supervisor, reason, by the Director',ev&&ev.uid===B2&&ev.reason==='First Africa trip'&&ev.by===OWN);
  await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);
  T5=await o.evaluate(()=>window.__T);const s5=T5.trip_status[0].data.supShare;
  ok('approved: 3 points recorded for that booking only',s5&&s5.uid===B2&&s5.event&&s5.rate===0.03);
  const b=await open(B1,T5);ok('the broker cannot set it',!(await b.textContent('#main')).includes('Put this booking under supervision'));await b.close();}
 await o.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_h_')))fs.unlinkSync(f);})();
