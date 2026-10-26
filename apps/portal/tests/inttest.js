// Broker intake and leaving: ready-to-sign block, country check, supervision limit, one-tick leaving, deletion
// confirmation, unavailable switch, batch first-contact OK, 24-hour contacts. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2',C1='00000000-0000-0000-0000-0000000000d1';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const CO={name:'Example Company Pte. Ltd.',reg:'000000000X',address:'1 Example Street',email:'charter@example.com',privacy:'privacy@example.com',signName:'Example Director',signTitle:'Director',phone:'+65 0000 0000',web:'example.com'};
const prof=(id,name,extra={})=>({id,role:'broker',active:true,contract_name:name,since:ago(60),base:'Exampleland',...extra.cols,data:{roster:true,onboarding:{issuedAt:ago(60)},...extra.data}});
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},prof(B1,'Example Leaver',{cols:{supervised:true},data:{rights:{supervise:true}}}),prof(B2,'Example Junior',{cols:{supervised:true}}),{id:C1,role:null,active:false,contract_name:'',data:{}}],
 config:[{key:'terms',value:{margin:0.09,ownerApproval:true}},{key:'company',value:CO}],intel:[],
 trips:[{owner_id:B1,id:'t1',data:{client:{name:'Example Client'},stage:'submitted',created:ago(2),quote:{opPrice:40000,direct:1000},trip:{legs:[{from:'VTBS',to:'WSSS',date:'2026-12-01'}]},checks:{}}}],
 trip_status:[{owner_id:B1,id:'t1',data:{state:'review',opPrice:40000,direct:1000,price:45055,approval:{state:'approved',price:45055,opPrice:40000},history:[]}}],
 enquiry_pool:[{id:'p1',data:{status:'claimed',claimedBy:B1,legs:[]}}],enquiry_contacts:[],
 prospects:[{id:'x1',data:{org:'Example Prospect',assignedTo:B1,status:'assigned'}}],
 leads:[{owner_id:B1,id:'l1',data:{own:true,org:'Example Own Lead',status:'new',log:[]}},{owner_id:B2,id:'m1',data:{own:true,org:'Example New One',status:'new',log:[]}},{owner_id:B2,id:'m2',data:{own:true,org:'Example New Two',status:'new',log:[]}}],
 alert_settings:[{id:'settings',data:{recipients:[{id:'r1',uid:OWN,name:'Owner',email:'o@example.com',events:{approve:true}},{id:'r2',uid:B1,name:'Example Leaver',email:'l@example.com',events:{steps:true}}]}}],
 join_requests:[{user_id:C1,data:{contractName:'Example Candidate',role:'broker',base:'Newland',orgs:['A','B'],at:ago(1)}}],agreements:[],step_requests:[],optouts:[],
 training_runs:[B1,B2].map(u=>({owner_id:u,id:'onboarding',data:{ackAt:ago(50)}}))};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T,view,w=1400)=>{const f=`t_i_${n++}.html`;fs.writeFileSync(f,page(uid,T));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(uid.slice(-2)+': '+e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(4500);if(view){await p.evaluate(v=>{S.view=v;render();},view);await p.waitForTimeout(500);}return p;};
 const toastOf=async(p,fn)=>p.evaluate(async f=>{let m='';const _t=toast;toast=x=>{m=x};try{await eval(f)}finally{toast=_t}return m;},fn);
 let o=await open(OWN,T0,'team');
 ok('Team: ready-to-sign panel with four ticks', (await o.textContent('#main')).includes('Ready to sign brokers') && (await o.$$('[data-intake=ready]')).length===5);
 let msg=await toastOf(o,`intakeBlock('${C1}')`); ok('not ready: agreement held back', /Not ready to sign/.test(await o.evaluate(id=>intakeBlock(id),C1)));
 for(const k of ['company','bank','payments','avinode']){await o.click(`#ir_${k}`);await o.waitForTimeout(250);}
 ok('ticks saved', await o.evaluate(()=>intakeReady()));
 ok('new country: counsel check needed first', /new for Archē/.test(await o.evaluate(id=>intakeBlock(id),C1)) && (await o.textContent('#main')).includes('Counsel checked Newland'));
 await o.click('[data-intake=country]');await o.waitForTimeout(300);
 ok('limit reached (2 supervised, limit set to 2): waiting list', await o.evaluate(async id=>{S.intake={...S.intake,cap:2};return /Supervision is full/.test(intakeBlock(id));},C1));
 await o.evaluate(()=>{S.intake={...S.intake,cap:6};});
 ok('all clear: agreement can go', await o.evaluate(id=>intakeBlock(id)==='',C1));
 // leaving, one tick
 await o.click(`[data-offboard="${B1}"]`);await o.waitForTimeout(300);await o.selectOption('#off_mode','agreed');await o.fill('#off_why','Example reason for ending');await o.click('#offForm button[type=submit]');await o.waitForTimeout(1200);
 let T=await o.evaluate(()=>window.__T);const pb=T.profiles.find(x=>x.id===B1);
 ok('access off, rights and supervision removed', pb.active===false&&!Object.keys(pb.data.rights||{}).length&&!pb.supervised&&!!pb.data.offboard);
 ok('their enquiry back in the pool', T.enquiry_pool[0].data.status==='released'&&!T.enquiry_pool[0].data.claimedBy);
 ok('their prospect back in rotation', !T.prospects[0].data.assignedTo);
 ok('their own lead moved to the owner', T.leads.some(l=>l.owner_id===OWN&&l.data.org==='Example Own Lead'));
 ok('removed from the alert list', !T.alert_settings[0].data.recipients.some(r=>r.uid===B1));
 ok('open trip counted for the owner to finish', pb.data.offboard.openTrips===1);
 await o.close();
 let p=await open(B1,T);
 ok('the leaver sees only the deletion confirmation', (await p.textContent('#main')).includes('Your engagement has ended') && !(await p.$('[data-act=new]')));
 await p.check('#lv_ok');await p.click('[data-intake=leaveOk]');await p.waitForTimeout(400);T=await p.evaluate(()=>window.__T);
 ok('confirmation saved', T.join_requests.some(r=>r.user_id===B1&&r.data.kind==='leaving'&&r.data.confirmedAt));await p.close();
 o=await open(OWN,T,'team');await o.waitForTimeout(16000);T=await o.evaluate(()=>window.__T);
 ok('owner portal records the confirmation and clears it from requests', !!T.profiles.find(x=>x.id===B1).data.offboard.confirmedAt && !T.join_requests.some(r=>r.user_id===B1));
 ok('leaving row never treated as a request to join', await o.evaluate(id=>!(id in S.joins),'00000000-0000-0000-0000-0000000000b1'));
 for(const k of ['mailbox','whatsapp','avinode']){await o.check(`#ox_${k}_${B1}`);await o.waitForTimeout(250);}
 await o.click(`[data-intake=close][data-uid="${B1}"]`);await o.waitForTimeout(300);T=await o.evaluate(()=>window.__T);
 ok('file closed after the outside steps', !!T.profiles.find(x=>x.id===B1).data.offboard.closed);
 // notice mode
 await o.evaluate(()=>{S.offboardId=null;});await o.click(`[data-offboard="${B2}"]`);await o.waitForTimeout(300);await o.fill('#off_why','Example notice reason');await o.click('#offForm button[type=submit]');await o.waitForTimeout(800);T=await o.evaluate(()=>window.__T);
 const p2=T.profiles.find(x=>x.id===B2); ok('30 days notice: still active, end date set', p2.active!==false&&p2.data.offboard.mode==='notice'&&Date.parse(p2.data.offboard.endDate)>Date.now()+28*864e5);
 // away
 await o.evaluate(()=>{S.alerts.recipients.push({id:'r3',uid:'00000000-0000-0000-0000-0000000000e1',name:'Example Backup',events:{}});S.view='today';render();});await o.waitForTimeout(300);
 await o.click('[data-intake=awayForm]');await o.waitForTimeout(200);await o.fill('#aw_until',new Date(Date.now()+864e5).toISOString().slice(0,16));await o.click('[data-intake=awayOn]');await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('unavailable saved with backup', !!(T.alert_settings[0].data.away||{})[OWN]&&T.alert_settings[0].data.away[OWN].backup==='00000000-0000-0000-0000-0000000000e1');
 ok('Today shows unavailable banner', (await o.textContent('#main')).includes('You are unavailable until'));
 // 24h contacts
 await o.evaluate(()=>{S.view='trips';S.sel='t1';render();});await o.waitForTimeout(300);
 const blocked=await toastOf(o,"issueConf(document.createElement('button'))");ok('confirmation held back without 24-hour contacts', /24-hour contacts/.test(blocked));
 await o.fill('#c24_op','Example Ops +00 0');await o.fill('#c24_h','Example Handler +00 0');await o.click('[data-intake=c24]');await o.waitForTimeout(400);T=await o.evaluate(()=>window.__T);
 ok('24-hour contacts saved on the trip', !!T.trip_status[0].data.contacts24);
 await o.close();
 // batch first contact (B2 supervised)
 const Tb=JSON.parse(JSON.stringify(T0));p=await open(B2,Tb,'leads');
 ok('supervised broker offered one OK for all new leads', (await p.textContent('#main')).includes('Ask OK to contact all 2'));
 await p.click('[data-intake=batch]');await p.waitForTimeout(400);T=await p.evaluate(()=>window.__T);
 const rq=T.step_requests.find(r=>r.owner_id===B2&&r.data.key==='contact');ok('one request covering both leads', rq&&rq.data.refs.length===2);
 rq.data.status='approved';await p.close();p=await open(B2,T,'leads');
 ok('after the OK, both leads can be contacted', await p.evaluate(()=>gateReq(S.uid,'contact','m1').status==='approved'&&gateReq(S.uid,'contact','m2').status==='approved'));
 ok('no sideways scroll at 390 px (Team)', await (async()=>{const q=await open(OWN,T,'team',390);const r=await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);await q.close();return r;})());
 await p.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_i_')))fs.unlinkSync(f);})();
