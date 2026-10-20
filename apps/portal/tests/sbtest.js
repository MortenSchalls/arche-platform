// Loads the portal through platform.js with the in-memory Supabase stand-in and checks the main screens.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a', BRK='00000000-0000-0000-0000-00000000000b';
const T={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:BRK,role:'broker',active:true,contract_name:'Example Broker',book:false,data:{roster:true}}],
 config:[{key:'terms',value:{margin:0.07,unit:45000,threshold:8,rate1:0.27,rate2:0.35}}],
 trips:[{owner_id:BRK,id:'t1',data:{stage:'submitted',submittedAt:'2026-10-18T10:00:00Z',client:{name:'Example client',company:'Example Co',email:'c@example.com'},trip:{legs:[{from:'WSSS',to:'VTBS',date:'2026-12-01',time:'10:00',pax:'4'}],category:'Midsize jet'},quote:{operator:'Example Ops',aircraft:'Example jet',opPrice:20000,direct:0},checks:{}}}],
 trip_status:[], prospects:[{id:'p900',data:{org:'Example Aviation FO',kind:'client',status:'dnc',dncAt:'2026-10-20T06:00:00Z',segment:'Family office',region:'Asia-Pacific',country:'Hong Kong',why:'x',approach:'y',source:'https://example.org'}},{id:'p901',data:{org:'Example Air Operator',kind:'operator',segment:'Operator',status:'new',region:'Asia-Pacific',country:'Singapore',why:'x',approach:'y',source:'https://example.org/op',ops:{aoc:{authority:'CAAS',source:''},bases:['WSSL'],fleet:[{type:'Example Jet',count:2}],audits:[{name:'ARGUS',level:'Platinum',year:'2025',url:'https://example.org/argus'}],safety:[],tier:'A',flags:[],screen:{country:'clear',entity:''}}}}],
 website_enquiries:[{id:'e1',at:'2026-10-20T01:00:00Z',consent:true,handled:false,data:{type:'quote',legs:[{from:'Singapore',to:'Bangkok',date:'2026-11-02',time:'09:00'}],pax:3,name:'Example Visitor',reach:'+65 0000 0001',reply:'WhatsApp',lang:'en'}}]};
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
 await o.evaluate(()=>{S.view='today';render();});await o.waitForTimeout(400);
 ok('owner sees the website enquiry on Today', /Website enquiries \(1\)/.test(await o.textContent('#main')));
 await o.click('[data-enq="e1"]');await o.waitForTimeout(400);
 ok('enquiry marked handled', await o.evaluate(()=>window.__T.website_enquiries[0].handled===true));
 ok('broker does not see enquiries', !(await k.evaluate(()=>/Website enquiries/.test(document.body.innerText))));
 await o.evaluate(()=>{S.view='prospects';S.pSel='p900';render();});await o.waitForTimeout(400);
 await o.selectOption('#pKind','partner');await o.click('[data-act="pKind"]');await o.waitForTimeout(400);
 ok('owner changes type to partner', await o.evaluate(()=>window.__T.prospects[0].data.kind==='partner'));
 await o.click('[data-act="pUndoDnc"]');await o.waitForTimeout(400);
 ok('owner undoes Do not contact', await o.evaluate(()=>window.__T.prospects[0].data.status==='new'));
 ok('broker has no type control', !(await k.$('#pKind')));
 await o.evaluate(()=>{S.pSel=null;render();});await o.waitForTimeout(200);
 ok('client section hides operators', !(await o.textContent('#main')).includes('Example Air Operator'));
 await o.click('[data-act="pSec"][data-sec="ops"]');await o.waitForTimeout(300);
 ok('operators section lists the operator', /Operators \(1\)/.test(await o.textContent('#main')) && (await o.textContent('#main')).includes('Example Air Operator'));
 await o.evaluate(()=>{S.pSel='p901';render();});await o.waitForTimeout(300);
 const od=await o.textContent('#main');
 ok('operator detail shows tier, certificate and audit', /Tier A/.test(od) && od.includes('CAAS') && od.includes('ARGUS') && !(await o.$('#pAssign')));
 await o.click('[data-act="opScreen"][data-res="clear"]');await o.waitForTimeout(400);
 ok('owner records the sanctions screen', await o.evaluate(()=>window.__T.prospects[1].data.ops.screen.entity==='clear'));
 // investors and partners: owner only
 await o.evaluate(()=>{S.pSec='sales';S.pSel=null;render();});await o.waitForTimeout(200);
 ok('owner sees the owner-only tab', !!(await o.$('[data-sec="inv"]')));
 ok('broker has no investors tab and loads no investor data', !(await k.$('[data-sec="inv"]')) && await k.evaluate(()=>S.inv===undefined && !Object.keys(S.subs).includes('owner')));
 await o.evaluate(()=>{S.preview='ops';render();});await o.waitForTimeout(200);
 ok('owner previewing as operations does not see it', !(await o.$('[data-sec="inv"]')));
 await o.evaluate(()=>{S.preview='';render();});await o.waitForTimeout(200);
 await o.click('[data-sec="inv"]');await o.waitForTimeout(300);
 await o.click('[data-inv="new"]');await o.waitForTimeout(200);
 await o.fill('#iv_org','Example Capital Partners');await o.fill('#iv_src','https://example.org/capital');await o.click('#invForm button[type=submit]');await o.waitForTimeout(400);
 ok('owner adds an investor to the owner-only table', await o.evaluate(()=>(window.__T.owner_prospects||[]).some(r=>r.data.org==='Example Capital Partners')));
 await o.fill('#invNote','Introduced through an adviser');await o.click('[data-inv="note"]');await o.waitForTimeout(300);
 ok('note saved on the investor', await o.evaluate(()=>window.__T.owner_prospects.find(r=>r.data.org==='Example Capital Partners').data.log.some(l=>/adviser/.test(l.note))));
 const auditBefore = await o.evaluate(()=>(window.__T.audit_log||[]).length);
 ok('adding an investor writes nothing to the shared audit log', !/Example Capital/.test(await o.evaluate(()=>JSON.stringify(window.__T.audit_log||[]))));
 await o.evaluate(()=>{S.pSec='sales';S.pSel='p900';render();});await o.waitForTimeout(300);
 await o.click('[data-inv="moveFrom"]');await o.waitForTimeout(100);await o.click('[data-inv="moveFrom"]');await o.waitForTimeout(500);
 ok('prospect moved to the owner-only list and removed from the shared list', await o.evaluate(()=>!window.__T.prospects.some(r=>r.id==='p900') && window.__T.owner_prospects.some(r=>r.data.org==='Example Aviation FO' && r.data.movedFrom)));
 ok('moving writes nothing to the shared audit log', await o.evaluate(n=>(window.__T.audit_log||[]).length===n, auditBefore));
 await k.waitForTimeout(500);
 ok('broker still sees no trace of it', !/Example Capital|Example Aviation FO/.test(await k.evaluate(()=>document.body.innerText)));
 console.log('ERRORS', JSON.stringify(errs.slice(0,6)));await b.close();})();
