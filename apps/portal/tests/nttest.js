// Notices of new features: shown until confirmed, logged for the owner, counted in trust. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Broker',since:ago(30),data:{roster:true,onboarding:{issuedAt:ago(30)}}},{id:B2,role:'broker',active:true,contract_name:'Example Late',since:ago(30),data:{roster:true,onboarding:{issuedAt:ago(30)}}}],
 config:[{key:'terms',value:{margin:0.09}}],intel:[],trips:[],trip_status:[],step_requests:[],leads:[],prospects:[],optouts:[],join_requests:[],agreements:[],
 training_runs:[{owner_id:B1,id:'onboarding',data:{ackAt:ago(29)}},{owner_id:B2,id:'onboarding',data:{ackAt:ago(29)}}]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T,w=1400)=>{const f=`t_n_${n++}.html`;fs.writeFileSync(f,page(uid,T));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(4500);await p.evaluate(()=>{S.view=S.isOwner?'today':'home';render();});await p.waitForTimeout(300);return p;};
 let p=await open(B1,T0,390);
 ok('notice shown on the dashboard after sign-in', (await p.textContent('#main')).includes('please read and confirm') && (await p.$$('[data-notice]')).length>=2);
 ok('no sideways scroll at 390 px', await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 for (const x of await p.$$('[data-notice]')) { await p.click('[data-notice]'); await p.waitForTimeout(300); }
 let T=await p.evaluate(()=>window.__T);
 ok('confirmations saved with time', T.training_runs.filter(r=>r.owner_id===B1&&r.id.startsWith('notice-')&&r.data.readAt).length>=2);
 ok('notice gone after confirming', !(await p.textContent('#main')).includes('please read and confirm'));
 await p.close();
 p=await open(B1,T); ok('stays gone at the next sign-in', !(await p.textContent('#main')).includes('please read and confirm')); await p.close();
 const o=await open(OWN,T);
 const sc=await o.evaluate(([a,c])=>[noticeScore(a),noticeScore(c)],[B1,B2]);
 ok('trust: on-time reader scores 1', sc[0].v===1);
 ok('trust: notices not yet due are not counted against', sc[1].v===null);
 await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(300);const tx=await o.textContent('#main');
 ok('Team shows who has read each notice', tx.includes('Notices read') && tx.includes('Read') && tx.includes('Not yet'));
 ok('owner gets no notice', !(await o.$('#noticePanel')));
 await o.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_n_')))fs.unlinkSync(f);})();
