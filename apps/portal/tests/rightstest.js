// Supervisor rights: supervise, assess, approve; never own work; owner-only countersign. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2',O1='00000000-0000-0000-0000-0000000000c1',NEW='00000000-0000-0000-0000-0000000000d1';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const prof=(id,role,name,extra={})=>({id,role,active:true,contract_name:name,since:ago(60),...extra.cols,data:{roster:true,onboarding:{issuedAt:ago(60)},...extra.data}});
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},prof(B1,'broker','Example Junior',{cols:{supervised:true}}),prof(B2,'broker','Example Senior',{data:{rights:{supervise:true,assess:true}}}),prof(O1,'ops','Example Ops',{data:{rights:{approve:true}}}),{id:NEW,role:null,active:false,contract_name:'',data:{}}],
 config:[{key:'terms',value:{margin:0.09,ownerApproval:true}},{key:'intake',value:{ready:{company:1,bank:1,payments:1,avinode:1},countries:{exampleland:{at:'x'}}}},{key:'company',value:{name:'Example Company Pte. Ltd.',reg:'000000000X',address:'1 Example Street',email:'charter@example.com',privacy:'privacy@example.com',signName:'Example Director',signTitle:'Director',phone:'+65 0000 0000',web:'example.com'}}],intel:[],
 trips:[{owner_id:B1,id:'t1',data:{client:{name:'Example Client'},stage:'submitted',submittedAt:ago(1),created:ago(2),quote:{operator:'Example Air',opPrice:40000,direct:1000},trip:{legs:[{from:'VTBS',to:'WSSS',date:'2026-12-01'}]},checks:{}}}],
 trip_status:[{owner_id:B1,id:'t1',data:{state:'review',opPrice:40000,direct:1000,price:45055,kyc:true,paynodeRef:'PN-EX',contacts24:{op:'Example Ops +00 0',handler:'Example Handler +00 0'},history:[]}}],
 step_requests:[{owner_id:B1,id:'quote-t1-x',data:{key:'quote',ref:'t1',fp:'40000|1000',title:'Example Client: client price USD 45,055',status:'pending',at:ago(0.1),by:B1}},{owner_id:B2,id:'take-p9-x',data:{key:'take',ref:'p9',fp:'take',title:'Own request',status:'pending',at:ago(0.1),by:B2}}],
 join_requests:[{user_id:NEW,data:{contractName:'Example Candidate',role:'broker',base:'Exampleland',cert:'AE2.X',at:ago(1)}}],agreements:[],enquiry_pool:[],
 training_runs:[B1,B2,O1].map(u=>({owner_id:u,id:'onboarding',data:{ackAt:ago(50)}})),leads:[],prospects:[],optouts:[]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T,w=1400)=>{const f=`t_r_${n++}.html`;fs.writeFileSync(f,page(uid,T));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(uid.slice(-2)+': '+e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(5500);return p;};
 // senior broker with supervise + assess
 let p=await open(B2,T0);
 ok('supervisor has a Supervision menu item', await p.evaluate(()=>navItems().some(x=>x[0]==='supervise')));
 await p.evaluate(()=>{S.view='home';render();});ok('dashboard prompt for waiting decisions', (await p.textContent('#main')).includes('waiting for your decision as supervisor'));
 await p.evaluate(()=>{S.view='supervise';render();});await p.waitForTimeout(800);let tx=await p.textContent('#main');
 ok('sees the junior\'s request, not their own', tx.includes('Example Client: client price')&&!tx.includes('Own request'));
 await p.click('[data-gate=ok][data-id="quote-t1-x"]');await p.waitForTimeout(400);
 let T=await p.evaluate(()=>window.__T);
 ok('supervisor approval saved with their name', T.step_requests.find(r=>r.id==='quote-t1-x').data.status==='approved'&&T.step_requests.find(r=>r.id==='quote-t1-x').data.decidedBy===B2);
 await p.evaluate(()=>reqDecide(S.uid,'take-p9-x',true));await p.waitForTimeout(300);T=await p.evaluate(()=>window.__T);
 ok('cannot decide own request', T.step_requests.find(r=>r.id==='take-p9-x').data.status==='pending');
 tx=await p.textContent('#main');ok('assessor sees the candidate', tx.includes('Example Candidate'));
 await p.fill('#ob_note_'+NEW,'Academy complete, call passed');await p.click(`[data-agr="send|${NEW}"]`);await p.waitForTimeout(500);T=await p.evaluate(()=>window.__T);
 ok('assessor sends the agreement', (T.agreements||[]).some(r=>r.id===NEW&&r.data.status==='sent'&&r.data.assess.by===B2));
 // candidate signs (state edit), assessor cannot countersign
 T.agreements.find(r=>r.id===NEW).data.status='signed';T.agreements.find(r=>r.id===NEW).data.signedName='Example Candidate';T.agreements.find(r=>r.id===NEW).data.signedAt=ago(0);
 await p.close();p=await open(B2,T);await p.evaluate(()=>{S.view='supervise';render();});await p.waitForTimeout(800);
 ok('countersign stays with the owner', !(await p.$('[data-approve]')) && (await p.textContent('#main')).includes("Waiting for the director's countersignature"));
 await p.close();
 // ops approver
 p=await open(O1,T);await p.evaluate(()=>{S.view='supervise';render();});await p.waitForTimeout(800);
 ok('ops approver sees the booking to approve', !!(await p.$('[data-ap=ok]')));
 await p.click('[data-ap=ok]');await p.waitForTimeout(500);T=await p.evaluate(()=>window.__T);
 ok('booking approved by the ops supervisor', (T.trip_status.find(r=>r.id==='t1').data.approval||{}).by===O1);
 const blocked=await p.evaluate(async()=>{S.sel='t1';let msg='';const _t=toast;toast=m=>{msg=m};await issueConf(document.createElement('button'));toast=_t;return msg;});
 ok('approver cannot also issue (four eyes)', /someone else issues/.test(blocked));
 await p.close();
 // owner: rights ticks in Team
 const o=await open(OWN,T);await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(500);
 ok('Team shows rights ticks', !!(await o.$(`[data-right=supervise][data-uid="${B1}"]`)) && !(await o.$(`[data-right=approve][data-uid="${B1}"]`)) && !!(await o.$(`[data-right=approve][data-uid="${O1}"]`)));
 await o.check(`[data-right=assess][data-uid="${B1}"]`);await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('owner gives a right', !!(T.profiles.find(x=>x.id===B1).data.rights||{}).assess);
 await o.close();
 p=await open(B1,T);ok('junior without supervise right sees no requests of others', await p.evaluate(()=>reqForMe().length===0));await p.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_r_')))fs.unlinkSync(f);})();
