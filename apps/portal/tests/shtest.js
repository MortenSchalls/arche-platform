// Supervision share: 3 points from a supervised broker's booking to the named supervisor; to Archē when an owner
// supervises; forfeit on a rule breach. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Junior',supervised:true,data:{roster:true,supervisor:B2,onboarding:{issuedAt:ago(40)}}},{id:B2,role:'broker',active:true,contract_name:'Example Senior',data:{roster:true,rights:{supervise:true},onboarding:{issuedAt:ago(400)}}}],
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
 let T=await o.evaluate(()=>window.__T);const sh=T.trip_status[0].data.supShare;
 ok('share recorded at approval: to the supervisor, 3 points', sh&&sh.uid===B2&&sh.rate===0.03&&!sh.toArche);
 // flown and paid
 T.trip_status[0].data={...T.trip_status[0].data,state:'flown',flownDate:'2026-11-05',clientPaid:true,operatorPaid:true};await o.close();
 o=await open(OWN,T);
 const c=await o.evaluate(([a,b2])=>[commissionFor(a)['2026-11'],commissionFor(b2)['2026-11']],[B1,B2]);
 ok('broker gets 24%: 4,050 x 24% = 972', Math.abs(c[0].comm-972)<0.01);
 ok('supervisor gets 3%: 121.50', c[1]&&Math.abs(c[1].comm-121.5)<0.01&&c[1].trips[0].sup);
 await o.evaluate(()=>{S.view='trips';S.sel='t1';render();});await o.waitForTimeout(300);
 ok('trip shows the supervision share', (await o.textContent('#main')).includes('Supervision share'));
 await o.fill('#sf_why','Approved a quote below the 9% margin');await o.click('[data-supfo="t1"]');await o.waitForTimeout(500);
 T=await o.evaluate(()=>window.__T);await o.close();o=await open(OWN,T);
 const c2=await o.evaluate(([a,b2])=>[commissionFor(a)['2026-11'],commissionFor(b2)['2026-11']],[B1,B2]);
 ok('forfeited: supervisor gets nothing, broker still 972', !c2[1]&&Math.abs(c2[0].comm-972)<0.01);
 // owner as supervisor
 const T2=JSON.parse(JSON.stringify(T0));T2.profiles[1].data.supervisor=OWN;await o.close();o=await open(OWN,T2);
 await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('owner supervises: 3 points stay with Archē', T.trip_status[0].data.supShare.toArche===true);
 T.trip_status[0].data={...T.trip_status[0].data,state:'flown',flownDate:'2026-11-05',clientPaid:true};await o.close();o=await open(OWN,T);
 const c3=await o.evaluate(([a,b2])=>[commissionFor(a)['2026-11'],commissionFor(b2)['2026-11']],[B1,B2]);
 ok('owner-supervised: broker 972, no member share', Math.abs(c3[0].comm-972)<0.01&&!c3[1]);
 // not supervised: full 27%
 const T3=JSON.parse(JSON.stringify(T0));T3.profiles[1].supervised=false;await o.close();o=await open(OWN,T3);
 await o.evaluate(async()=>{await apWrite(tripById('t1'),'approved','');});await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('released broker: no share recorded', !T.trip_status[0].data.supShare);
 await o.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_h_')))fs.unlinkSync(f);})();
