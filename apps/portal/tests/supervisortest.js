// Supervisor role (Morten, 29 Oct 2026): one switch per person in Team (supervise + assess + train), the text to send,
// the pay as a setting, live training and screen sharing for holders of the train right (through /api/live, mocked
// here), and the team's training results for supervisors. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2',B3='00000000-0000-0000-0000-0000000000b3';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const prof=(id,role,name,extra={})=>({id,role,active:true,contract_name:name,since:ago(60),...extra.cols,data:{roster:true,onboarding:{issuedAt:ago(60)},...extra.data}});
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},prof(B1,'broker','Example Junior',{cols:{supervised:true}}),prof(B2,'broker','Example Senior',{data:{rights:{train:true}}}),prof(B3,'broker','Example Plain')],
 config:[{key:'terms',value:{margin:0.09,ownerApproval:true}},{key:'intake',value:{ready:{company:1,bank:1,payments:1,avinode:1},countries:{exampleland:{at:'x'}}}},{key:'company',value:{name:'Example Company Pte. Ltd.',reg:'000000000X',address:'1 Example Street',email:'charter@example.com',privacy:'privacy@example.com',signName:'Example Director',signTitle:'Director',phone:'+65 0000 0000',web:'example.com'}}],intel:[],
 trips:[],trip_status:[],step_requests:[],join_requests:[],agreements:[],assessments:[],enquiry_pool:[],
 training_runs:[B1,B2,B3].map(u=>({owner_id:u,id:'onboarding',data:{ackAt:ago(50)}})),leads:[],prospects:[],optouts:[]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!v)fails++;};
const rt=`(function(){const t=setInterval(()=>{const s=window.__sb;if(!s)return;clearInterval(t);s.realtime={setAuth(){}};s.channel=()=>{const c={on(){return c;},subscribe(cb){return c;},send(){}};return c;};s.removeChannel=async()=>{};},50);})();`;
(async()=>{const b=await chromium.launch();const errs=[];let n=0;const files=[];
 const open=async(uid,T,w=1400,route)=>{const f=`t_sv_${n++}.html`;files.push(f);fs.writeFileSync(f,page(uid,T));const ctx=await b.newContext({viewport:{width:w,height:900}});if(route)await ctx.route('**/api/live',route);const p=await ctx.newPage();await p.addInitScript(rt);p.on('pageerror',e=>errs.push(uid.slice(-2)+': '+e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(5500);return p;};
 // ---------- owner: the switch, the text, the pay ----------
 let p=await open(OWN,T0);
 await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(600);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Expand all/i.test(x.textContent));if(b)b.click();});await p.waitForTimeout(300);
 ok('a Supervisor switch for each person',await p.evaluate(ids=>ids.every(id=>!!document.querySelector(`[data-supmake="${id}"]`)),[B1,B2,B3]));
 ok('the right "Train and share screen" can be given on its own',await p.evaluate(id=>!!document.querySelector(`[data-right="train"][data-uid="${id}"]`),B3));
 await p.check(`[data-supmake="${B3}"]`);await p.waitForTimeout(500);
 let T=await p.evaluate(()=>window.__T);let r3=T.profiles.find(x=>x.id===B3).data.rights||{};
 ok('the switch gives supervise, assess and train',r3.supervise&&r3.assess&&r3.train&&!r3.approve,r3);
 ok('the change is in the audit log',await p.evaluate(()=>(window.__T.audit_log||window.__T.audit||[]).some(a=>/Made supervisor/.test(JSON.stringify(a)))));
 await p.click(`[data-suptext="${B3}"]`);await p.waitForTimeout(400);
 let tx=await p.inputValue('#supTextBox');
 ok('the text to send names the person and the three rights',/^Hi Example,/.test(tx)&&/Supervise steps/.test(tx)&&/Assess new people/.test(tx)&&/Live training/.test(tx)&&!/Approve bookings/.test(tx),tx.slice(0,200));
 ok('the text says the agreed pay (3 points)',/3 points of the gross profit/.test(tx)&&/as in the agreement/.test(tx));
 ok('no email address or phone number in the text',!/@|\+\d/.test(tx.replace(/https?:\/\/\S+/,'')));
 await p.fill('#supRateIn','2.5');await p.click('[data-suprate="save"]');await p.waitForTimeout(400);
 T=await p.evaluate(()=>window.__T);ok('pay saved as a setting',T.config.find(c=>c.key==='terms').value.supRate===0.025);
 tx=await p.inputValue('#supTextBox');ok('the text follows the new pay',/2\.5 points/.test(tx)&&!/as in the agreement/.test(tx));
 await p.fill('#supRateIn','0');await p.click('[data-suprate="save"]');await p.waitForTimeout(400);
 tx=await p.inputValue('#supTextBox');ok('0 points: pay to be agreed, no share recorded',/to be agreed/.test(tx)&&await p.evaluate(id=>{S.roster[id].supervisor=S.roster[id].supervisor||'x';return true;},B1));
 ok('no share is recorded at 0 points',await p.evaluate(id=>{const r=S.roster[id];const was=r.supervisor;r.supervisor='00000000-0000-0000-0000-0000000000b3';const x=supShareFor(id);r.supervisor=was;return x===null;},B1));
 await p.click('[data-suprate="reset"]');await p.waitForTimeout(400);
 T=await p.evaluate(()=>window.__T);ok('back to the agreement',!('supRate' in T.config.find(c=>c.key==='terms').value)&&await p.evaluate(()=>supRate()===0.03));
 await p.uncheck(`[data-supmake="${B3}"]`);await p.waitForTimeout(400);T=await p.evaluate(()=>window.__T);r3=T.profiles.find(x=>x.id===B3).data.rights||{};
 ok('switching off takes the three rights back',!r3.supervise&&!r3.assess&&!r3.train,r3);
 await p.context().close();
 // ---------- a member with the train right: live training through /api/live ----------
 const calls=[];const LIVE={id:'abc123',owner:B2,ownerName:'Example Senior',watchers:[B1],scope:['trips'],at:new Date().toISOString(),until:new Date(Date.now()+2*3600e3).toISOString(),syl:{on:false,course:'fam',idx:0,done:{}}};
 const route=async rq=>{const body=JSON.parse(rq.request().postData()||'{}');calls.push(body);
   const out=body.action==='people'?{people:[{id:B1,name:'Example Junior',role:'broker'},{id:OWN,name:'Owner',role:'owner'}]}:body.action==='start'?{live:{...LIVE,watchers:body.live.watchers,scope:body.live.scope}}:body.action==='progress'?{runs:{[B1]:{r1:{sc:'s1',done:true,score:84,updated:ago(1)}}},people:[{id:B1,name:'Example Junior',role:'broker'}]}:body.action==='done'?{done:{}}:body.action==='syl'?{live:{...LIVE,syl:body.syl}}:{ok:true};
   await rq.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});};
 p=await open(B2,T0,1400,route);
 ok('Supervision menu for the train right',await p.evaluate(()=>navItems().some(x=>x[0]==='supervise')));
 await p.evaluate(()=>{S.view='supervise';render();});await p.waitForTimeout(400);
 ok('Supervision page explains live training',/Training → Live training/.test(await p.textContent('#main')));
 await p.evaluate(()=>{S.view='training';S.trTab='live';render();});await p.waitForTimeout(1200);
 ok('Training has the Live training tab',await p.evaluate(()=>!!document.querySelector('[data-trtab="live"]')));
 ok('the people to choose come from the server',await p.evaluate(id=>!!document.querySelector(`[data-lvw="${id}"]`),B1)&&calls.some(c=>c.action==='people'));
 ok('Security and Settings cannot be chosen',await p.evaluate(()=>!document.querySelector('[data-lvs="security"],[data-lvs="settings"]')));
 await p.check(`[data-lvw="${B1}"]`);await p.evaluate(()=>{const x=document.querySelector('[data-lvs]');x.click();});await p.click('[data-lv="start"]');await p.waitForTimeout(800);
 const st=calls.find(c=>c.action==='start');
 ok('start goes through the server, with the chosen watcher',!!st&&st.live.watchers.join()===B1,st);
 ok('the session names the member as the one who shares',await p.evaluate(id=>S.live&&S.live.owner===id&&S.live.ownerName==='Example Senior',B2));
 ok('the member does not write config directly',await p.evaluate(()=>{const c=(window.__T.config||[]).find(x=>x.key==='live');return !c;}));
 ok('the sharing bar shows',await p.evaluate(()=>!!document.getElementById('lvOwnerBar')));
 await p.click('#lvOwnerBar [data-syl="toggle"]').catch(()=>{});await p.waitForTimeout(600);
 ok('syllabus changes go through the server',calls.some(c=>c.action==='syl'));
 await p.evaluate(()=>{S.view='training';S.trTab='live';render();});await p.waitForTimeout(400);
 await p.click('[data-lv="stop"]');await p.waitForTimeout(600);
 ok('ending goes through the server',calls.some(c=>c.action==='end'));
 await p.evaluate(()=>{S.live=null;S.view='training';S.trTab='book';render();});await p.waitForTimeout(1500);
 tx=await p.textContent('#main');
 ok('the team training results show for the supervisor',/Team training/.test(tx)&&/Example Junior/.test(tx)&&calls.some(c=>c.action==='progress'),tx.slice(-300));
 await p.context().close();
 // ---------- a member without the right ----------
 p=await open(B3,T0);
 await p.evaluate(()=>{S.view='training';S.trTab='live';render();});await p.waitForTimeout(600);
 ok('no Live training for a member without the right',await p.evaluate(()=>!document.querySelector('[data-trtab="live"]')&&!document.getElementById('lvPanel')));
 ok('no Team training for a member without the right',await p.evaluate(()=>{S.trTab='book';render();return !/Team training/.test(document.getElementById('main').textContent);}));
 // a watcher sees the member's name, not "the director"
 await p.evaluate(l=>{S.live=l;},{...LIVE,watchers:[B3]});await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(500);
 ok('the watcher sees who shares',/Example Senior is sharing their screen with you/.test(await p.textContent('body')));
 await p.context().close();
 ok('no page errors',!errs.length,errs);
 files.forEach(f=>{try{fs.unlinkSync(f);}catch(e){}});
 await b.close();console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0);
})();
