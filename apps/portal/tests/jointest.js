// New person: sign in -> join form -> owner sees the request -> approve -> person becomes a broker. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a', NEW='00000000-0000-0000-0000-00000000000d';
const base={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:NEW,role:null,active:false,contract_name:'',data:{}}],config:[{key:'terms',value:{margin:0.07,unit:45000,threshold:8,rate1:0.27,rate2:0.35}}],join_requests:[],trips:[],trip_status:[],leads:[],prospects:[],optouts:[]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8')
 .replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`)
 .replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];
 fs.writeFileSync('t_j_new.html',page(NEW,base));
 const n=await b.newPage({viewport:{width:390,height:844}});n.on('pageerror',e=>errs.push('new: '+e.message));
 await n.goto('http://localhost:8765/t_j_new.html');await n.waitForTimeout(2500);
 ok('new person sees the join form', await n.evaluate(()=>S.role==='pending') && !!(await n.$('#joinForm')));
 await n.fill('#j_name','Example New Broker');await n.selectOption('#j_role','broker');await n.fill('#j_base','Remote');await n.check('#j_agree');
 await n.click('#joinForm button[type=submit]');await n.waitForTimeout(500);
 const T1=await n.evaluate(()=>window.__T);
 ok('join request saved', (T1.join_requests||[]).some(r=>r.user_id==='00000000-0000-0000-0000-00000000000d'&&r.data.contractName==='Example New Broker'));
 fs.writeFileSync('t_j_own.html',page(OWN,T1));
 const o=await b.newPage({viewport:{width:1400,height:900}});o.on('pageerror',e=>errs.push('owner: '+e.message));
 await o.goto('http://localhost:8765/t_j_own.html');await o.waitForTimeout(2500);
 await o.evaluate(()=>{S.view='team';render();});await o.waitForTimeout(300);
 ok('owner sees the request in Team', (await o.textContent('#main')).includes('Example New Broker'));
 await o.click('[data-approve]');await o.waitForTimeout(600);
 const T2=await o.evaluate(()=>window.__T);
 ok('approval activates the profile as broker', T2.profiles.some(p=>p.id==='00000000-0000-0000-0000-00000000000d'&&p.active&&p.role==='broker') && !T2.join_requests.length);
 fs.writeFileSync('t_j_new2.html',page(NEW,T2));
 await n.goto('http://localhost:8765/t_j_new2.html');await n.waitForTimeout(2500);
 ok('approved person opens the portal as broker', await n.evaluate(()=>S.role==='broker'));
 console.log('ERRORS',JSON.stringify(errs));await b.close();
 for (const f of ['t_j_new.html','t_j_own.html','t_j_new2.html']) fs.unlinkSync(f);})();
