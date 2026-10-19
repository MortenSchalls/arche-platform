// Loads the portal through platform.js with the in-memory Supabase stand-in and checks the main screens.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a', BRK='00000000-0000-0000-0000-00000000000b';
const T={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:BRK,role:'broker',active:true,contract_name:'Example Broker',book:false,data:{roster:true}}],
 config:[{key:'terms',value:{margin:0.07,unit:45000,threshold:8,rate1:0.27,rate2:0.35}}],
 trips:[{owner_id:BRK,id:'t1',data:{stage:'submitted',submittedAt:'2026-10-18T10:00:00Z',client:{name:'Example client',company:'Example Co',email:'c@example.com'},trip:{legs:[{from:'WSSS',to:'VTBS',date:'2026-12-01',time:'10:00',pax:'4'}],category:'Midsize jet'},quote:{operator:'Example Ops',aircraft:'Example jet',opPrice:20000,direct:0},checks:{}}}],
 trip_status:[]};
const page=(uid)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8')
 .replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`)
 .replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
fs.writeFileSync('t_sb_owner.html',page(OWN));fs.writeFileSync('t_sb_broker.html',page(BRK));
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];
 const o=await b.newPage({viewport:{width:1400,height:950}});o.on('pageerror',e=>errs.push('owner: '+e.message));
 await o.goto('http://localhost:8765/t_sb_owner.html');await o.waitForTimeout(3000);
 ok('owner opens on Today', await o.evaluate(()=>S.role==='owner'&&S.view==='today'));
 ok('owner sees the broker in the roster', await o.evaluate(id=>!!S.roster[id],BRK));
 ok('owner sees the submitted trip waiting for approval', await o.evaluate(()=>allTrips().filter(apNeeds).length===1));
 await o.click('[data-ap="ok"]');await o.waitForTimeout(500);
 ok('approval saved to trip_status table', await o.evaluate(()=>(window.__T.trip_status[0]||{}).data?.approval?.state==='approved'));
 ok('audit row written', await o.evaluate(()=>(window.__T.audit_log||[]).some(r=>r.action==='Booking approved')));
 await o.evaluate(()=>S.db.doc('config/company').set({email:'bookings@example.com'}));await o.waitForTimeout(300);
 ok('config write and live update', await o.evaluate(()=>S.company.email==='bookings@example.com'));
 const k=await b.newPage({viewport:{width:390,height:844}});k.on('pageerror',e=>errs.push('broker: '+e.message));
 await k.goto('http://localhost:8765/t_sb_broker.html');await k.waitForTimeout(3000);
 ok('broker role decided from profile', await k.evaluate(()=>S.role==='broker'));
 ok('broker sees own trip', await k.evaluate(()=>allTrips().length===1));
 console.log('ERRORS', JSON.stringify(errs.slice(0,6)));await b.close();})();
