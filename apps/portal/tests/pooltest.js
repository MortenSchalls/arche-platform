// Enquiry pool: owner adds and releases, first broker to take it wins, contact opens for them, trip carries the enquiry, owner reassigns. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a', B1='00000000-0000-0000-0000-0000000000b1', B2='00000000-0000-0000-0000-0000000000b2';
let T={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Broker One',data:{roster:true}},{id:B2,role:'broker',active:true,contract_name:'Example Broker Two',data:{roster:true}}],
 config:[{key:'terms',value:{margin:0.09,unit:45000,threshold:8,rate1:0.27,rate2:0.35,cycleDays:5}}],join_requests:[],trips:[],trip_status:[],leads:[],prospects:[],optouts:[],enquiry_pool:[],enquiry_contacts:[],
 website_enquiries:[{id:'w1',at:'2026-10-24T01:00:00Z',handled:false,consent:true,data:{type:'quote',legs:[{from:'VTBD',to:'WSSS',date:'2026-11-02'}],pax:'4',name:'Example Client',reach:'client@example.com',reply:'email'}}]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8')
 .replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`)
 .replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];
 const open=async(uid,T,w,name)=>{fs.writeFileSync('t_p_'+name+'.html',page(uid,T));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(name+': '+e.message));await p.goto('http://localhost:8765/t_p_'+name+'.html');await p.waitForTimeout(2200);return p;};
 let o=await open(OWN,T,1400,'own');
 await o.evaluate(()=>{S.view='pool';render();});await o.waitForTimeout(500);
 ok('website enquiry waits for the owner', (await o.textContent('#main')).includes('VTBD'));
 await o.click('[data-pool="release|w:w1"]');await o.waitForTimeout(500);
 await o.click('[data-pool=add]');await o.waitForTimeout(200);
 await o.fill('#pf_from','VTSP');await o.fill('#pf_to','VHHH');await o.fill('#pf_pax','2');await o.fill('#pf_name','Example Email Client');await o.fill('#pf_mail','mail@example.com');
 await o.click('#poolForm button[type=submit]');await o.waitForTimeout(500);
 T=await o.evaluate(()=>window.__T);
 ok('released enquiry in the pool, website item handled', T.enquiry_pool.some(r=>r.data.status==='released'&&r.data.source==='website') && T.website_enquiries[0].handled);
 ok('manual enquiry saved as new, contact kept apart', T.enquiry_pool.some(r=>r.data.status==='new'&&r.data.legs[0].from==='VTSP') && T.enquiry_contacts.length===2 && !JSON.stringify(T.enquiry_pool).includes('mail@example.com'));
 const rel=T.enquiry_pool.find(r=>r.data.status==='released').id;
 let p1=await open(B1,T,390,'b1'), p2=await open(B2,T,390,'b2');
 for (const p of [p1,p2]) await p.evaluate(()=>{S.view='openenq';render();});
 await p1.waitForTimeout(400);
 ok('brokers see the open enquiry', (await p1.textContent('#main')).includes('VTBD') && (await p2.textContent('#main')).includes('VTBD'));
 ok('brokers do not see the unreleased one', !(await p1.textContent('#main')).includes('VTSP'));
 await p1.click(`[data-pool="take|${rel}"]`);await p1.waitForTimeout(500);
 T=await p1.evaluate(()=>window.__T);
 ok('first broker gets it', T.enquiry_pool.find(r=>r.id===rel).data.claimedBy===B1);
 await p2.evaluate(T=>{window.__T.enquiry_pool=T.enquiry_pool;},T);
 const second=await p2.evaluate(async id=>await window.__poolTake(id),rel);
 ok('second broker is refused', second===false && (await p2.evaluate(()=>window.__T.enquiry_pool)).find(r=>r.id===rel).data.claimedBy===B1);
 await p1.evaluate(()=>{render();});await p1.waitForTimeout(600);
 ok('taker sees the client details', (await p1.textContent('#main')).includes('client@example.com'));
 await p1.click(`[data-pool="trip|${rel}"]`);await p1.waitForTimeout(500);
 ok('trip form prefilled from the enquiry', await p1.evaluate(()=>document.getElementById('e_cn').value==='Example Client'));
 await p1.evaluate(()=>{document.getElementById('edForm').requestSubmit();});await p1.waitForTimeout(800);
 T=await p1.evaluate(()=>window.__T);
 ok('trip carries the enquiry and its start time', T.trips.some(r=>r.data.poolId===rel&&r.data.enquiryAt==='2026-10-24T01:00:00Z'));
 ok('trip shows the booking cycle day', (await p1.textContent('#main')).match(/Day \d+ of 5/));
 o=await open(OWN,T,1400,'own2');await o.evaluate(()=>{S.view='pool';render();});await o.waitForTimeout(600);
 await o.selectOption('#pa_'+rel,B2);await o.click(`[data-pool="assign|${rel}"]`);await o.waitForTimeout(500);
 T=await o.evaluate(()=>window.__T);
 ok('owner reassigns', T.enquiry_pool.find(r=>r.id===rel).data.claimedBy===B2 && T.enquiry_pool.find(r=>r.id===rel).data.how==='assigned');
 await o.evaluate(()=>{S.view='settings';render();});await o.waitForTimeout(300);
 await o.fill('#t_cy','7');await o.click('#termsForm button[type=submit]');await o.waitForTimeout(400);
 ok('owner sets the cycle target', (await o.evaluate(()=>window.__T.config.find(c=>c.key==='terms').value.cycleDays))===7);
 ok('no sideways scroll at 390 px', await p1.evaluate(()=>{S.view='openenq';render();return document.documentElement.scrollWidth<=innerWidth+1;}));
 console.log('ERRORS',JSON.stringify(errs));await b.close();
 for (const f of fs.readdirSync('.').filter(f=>f.startsWith('t_p_'))) fs.unlinkSync(f);})();
