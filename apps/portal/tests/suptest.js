// Supervised steps: requests to the owner, approval on Today, release in Team. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',O1='00000000-0000-0000-0000-0000000000c1';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const base={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Broker',supervised:true,data:{roster:true,onboarding:{issuedAt:ago(5)}}},{id:O1,role:'ops',active:true,contract_name:'Example Ops',supervised:true,data:{roster:true,onboarding:{issuedAt:ago(5)}}}],
 config:[{key:'terms',value:{margin:0.09,threshold:8,ownerApproval:true}},{key:'company',value:{name:'Example Co'}}],intel:[],
 trips:[{owner_id:B1,id:'t1',data:{client:{name:'Example Client'},created:ago(1),enquiryAt:ago(1),stage:'quoted',quote:{operator:'Example Air',aircraft:'Example jet',opPrice:40000,direct:1000},trip:{legs:[{from:'VTBS',to:'WSSS',date:'2026-12-01'}]},checks:{}}}],
 trip_status:[{owner_id:B1,id:'t2',data:{state:'issued',ref:'AE-EX-1',price:45000,opPrice:40000,signed:{at:ago(1)},confIssued:{at:ago(2)},history:[]}}],
 enquiry_pool:[{id:'p1',data:{status:'released',legs:[{from:'VTBD',to:'VHHH',date:'2026-12-05'}],summary:'Example enquiry'}}],enquiry_contacts:[],
 step_requests:[],training_runs:[{owner_id:B1,id:'onboarding',data:{ackAt:ago(4)}},{owner_id:O1,id:'onboarding',data:{ackAt:ago(4)}}],leads:[],prospects:[],optouts:[],join_requests:[],agreements:[]};
const page=(uid,T,missing)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>${missing?'window.__MISSING=["step_requests"];':''}window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T,w=1400,missing)=>{const f=`t_s_${n++}.html`;fs.writeFileSync(f,page(uid,T,missing));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(uid.slice(-2)+': '+e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(4500);return p;};
 const reqs=T=>(T.step_requests||[]);
 // broker sends to operations: held for the owner
 let p=await open(B1,base);
 ok('broker sees the supervised steps panel', await p.evaluate(()=>{S.view='home';render();return document.querySelector('#main').textContent.includes('Supervised steps');}));
 await p.evaluate(async()=>{S.sel='t1';await act('submit');});await p.waitForTimeout(400);
 let T=await p.evaluate(()=>window.__T);
 ok('send to operations held: request created, trip not submitted', reqs(T).length===1&&reqs(T)[0].data.key==='quote'&&reqs(T)[0].data.status==='pending'&&T.trips[0].data.stage==='quoted');
 // broker takes pool enquiry: held
 await p.evaluate(()=>{const x=document.createElement('button');x.dataset.pool='take|p1';document.body.appendChild(x);x.click();});await p.waitForTimeout(600);
 T=await p.evaluate(()=>window.__T);
 ok('taking an enquiry held for the owner', reqs(T).some(r=>r.data.key==='take')&&T.enquiry_pool[0].data.status==='released');
 await p.close();
 // ops records client payment: held
 p=await open(O1,T);
 await p.evaluate(async()=>{S.view='queue';S.sel='t2';render();});await p.waitForTimeout(300);
 const hasField=await p.$('#o_cpd');
 if(hasField){await p.fill('#o_cpd','2026-10-20');await p.evaluate(async()=>{await act('clientPaid');});await p.waitForTimeout(400);}
 T=await p.evaluate(()=>window.__T);
 ok('operations payment record held for the owner', !!hasField && (reqs(T).some(r=>r.data.key==='pay')&&!T.trip_status[0].data.clientPaid));
 await p.close();
 // owner: Today shows requests and task prompt; Team has full task list and supervision
 let o=await open(OWN,T);await o.evaluate(()=>{S.view='today';render();});await o.waitForTimeout(500);
 let txt=await o.textContent('#main');
 ok('Today: requests waiting for your OK', txt.includes('Requests waiting for your OK (3)')||txt.includes('Requests waiting for your OK ('+reqs(T).length+')'));
 ok('Today: task prompt only, full list in Team', txt.includes('Your tasks:') && !txt.includes('To do for you'));
 const ch=await o.$(`[data-gate=changes][data-id="${reqs(T).find(r=>r.data.key==='quote').id}"]`); await ch.click();await o.waitForTimeout(300);
 T=await o.evaluate(()=>window.__T);
 ok('asking for changes needs a note', reqs(T).find(r=>r.data.key==='quote').data.status==='pending');
 const qid=reqs(T).find(r=>r.data.key==='quote').id; await o.fill('#rq_n_'+qid,'Use the cheaper aircraft option');await o.click(`[data-gate=changes][data-id="${qid}"]`);await o.waitForTimeout(400);
 const tid=reqs(T).find(r=>r.data.key==='take').id; await o.click(`[data-gate=ok][data-id="${tid}"]`);await o.waitForTimeout(500);
 T=await o.evaluate(()=>window.__T);
 ok('changes sent back with the note', reqs(T).find(r=>r.id===qid).data.status==='changes');
 ok('approving a take assigns the enquiry to the broker', T.enquiry_pool[0].data.status==='claimed'&&T.enquiry_pool[0].data.claimedBy===B1);
 await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(500);txt=await o.textContent('#main');
 ok('Team: full task list and supervision table', txt.includes('To do for you')&&txt.includes('Supervision')&&!!(await o.$(`[data-gate=release][data-uid="${B1}"][data-key=quote]`)));
 await o.click(`[data-gate=release][data-uid="${B1}"][data-key=quote]`);await o.waitForTimeout(400);
 T=await o.evaluate(()=>window.__T);
 ok('release saved on the member', !!(T.profiles.find(x=>x.id===B1).data.released||{}).quote);
 await o.close();
 // broker after release: submit goes straight through
 p=await open(B1,T);await p.evaluate(()=>{S.view='home';render();});
 ok('broker sees the changes note', (await p.textContent('#main')).includes('Use the cheaper aircraft option'));
 await p.evaluate(async()=>{S.sel='t1';await act('submit');});await p.waitForTimeout(400);T=await p.evaluate(()=>window.__T);
 ok('released step: send to operations goes through', T.trips[0].data.stage==='submitted');
 await p.close();
 // without SQL 0011 nothing is held back
 const T0=JSON.parse(JSON.stringify(base));delete T0.step_requests;p=await open(B1,T0,1400,true);
 await p.evaluate(async()=>{S.sel='t1';await act('submit');});await p.waitForTimeout(400);T=await p.evaluate(()=>window.__T);
 ok('before SQL 0011: nothing held back', T.trips[0].data.stage==='submitted');await p.close();
 o=await open(OWN,T0,1400,true);await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(1500);
 ok('before SQL 0011: 0011 open with Copy SQL, 0012 says run 0011 first', !!(await o.$('[data-todo=copy][data-id=sql-0011]')) && !(await o.$('[data-todo=copy][data-id=sql-0012]')) && (await o.textContent('#main')).includes('first.'));await o.close();
 o=await open(OWN,base,390);await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(400);
 ok('Team at 390 px: no sideways scroll', await o.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await o.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_s_')))fs.unlinkSync(f);})();
