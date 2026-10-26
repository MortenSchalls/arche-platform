// Owner to-do and trust / performance matrix on Today. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1',B2='00000000-0000-0000-0000-0000000000b2',B3='00000000-0000-0000-0000-0000000000b3';
const ago=d=>new Date(Date.now()-d*864e5).toISOString(), day=d=>ago(d).slice(0,10);
const trip=(o,id,enq,stage,extra={})=>({owner_id:o,id,data:{client:{name:'Example Client'},enquiryAt:ago(enq),created:ago(enq),quote:{opPrice:40000,direct:1000},trip:{legs:[{from:'VTBS',to:'WSSS',date:day(enq-3)}]},...extra.d}});
const st=(o,id,state,issued,extra={})=>({owner_id:o,id,data:{state,issuedAt:ago(issued),confIssued:{at:ago(issued)},signed:{at:ago(issued-1)},price:45000,opPrice:40000,direct:1000,history:[],...extra}});
const trips=[],sts=[];
// B1: strong, keeps the rules
for(let i=0;i<6;i++){trips.push(trip(B1,'a'+i,40-i*5,'',{d:{followUp:{at:ago(30-i*5),ch:'Call'},ratingReq:{at:ago(30-i*5)},rating:{overall:5,broker:5}}}));sts.push(st(B1,'a'+i,'flown',38-i*5,{flownDate:day(31-i*5),clientPaid:{at:ago(35)},operatorPaid:{at:ago(35)}}));}
// B2: books, breaks rules (no follow-up, returned files)
for(let i=0;i<5;i++){trips.push(trip(B2,'b'+i,50-i*6));sts.push(st(B2,'b'+i,'flown',40-i*6,{flownDate:day(35-i*6),history:[{t:ago(45),by:'ops',a:'Returned to broker'}]}));}
// B3: new, little data
trips.push(trip(B3,'c0',3));
const T={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},...[[B1,'Example Anna'],[B2,'Example Ben'],[B3,'Example Cleo']].map(([id,n])=>({id,role:'broker',active:true,contract_name:n,data:{roster:true,onboarding:{issuedAt:ago(60)}}}))],
 config:[{key:'terms',value:{margin:0.09,threshold:8}},{key:'company',value:{name:'Example Co'}}],intel:[],trips,trip_status:sts,leads:[],prospects:[],optouts:[],join_requests:[],agreements:[],enquiry_pool:[]};
const page=(T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${OWN}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];
 for (const w of [1400,390]) {
 fs.writeFileSync('t_mx.html',page(T));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/t_mx.html');await p.waitForTimeout(3000);await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(1200);
 const txt=await p.textContent('#main');
 if (w===1400) {
 ok('task prompt shows on Today', txt.includes('Your tasks:') && txt.includes('Fill in the company details'));
 await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(800);
 ok('SQL step ticked by itself when the table exists', await p.evaluate(()=>todoState(OWNER_TODO.find(x=>x.id==='sql-0008')).how==='checked by the portal') && !(await p.$('[data-todo=copy][data-id=sql-0008]')));
 await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(500);
 const txt2=await p.textContent('#main');
 ok('matrix shows all three members', (await p.$$('#trustMatrix svg circle')).length>=3 && txt2.includes('Example Anna') && txt2.includes('Example Ben') && txt2.includes('Example Cleo'));
 const sc=await p.evaluate(()=>['00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000b3'].map(id=>{const x=mxScore(id);return [x.trust,x.perf,mxQuad(x),x.early];}));
 console.log(JSON.stringify(sc));
 ok('rule keeper scores higher trust than rule breaker', sc[0][0]>sc[1][0]);
 ok('rule keeper is a trusted performer', sc[0][2]==='Trusted performer');
 ok('new member marked as little data', sc[2][3]===true);
 await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(500);await p.click('[data-todo=done][data-id=sandy]');await p.waitForTimeout(400);
 ok('manual step can be ticked and is saved', await p.evaluate(()=>!!(window.__T.config.find(c=>c.key==='setup')||{value:{done:{}}}).value.done.sandy));
 await p.waitForTimeout(18000);ok('weekly snapshot saved as its own row in member_scores', await p.evaluate(()=>(window.__T.member_scores||[]).length===1 && window.__T.member_scores[0].data.pts.length>=2));
 await p.screenshot({path:'/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/mx1400.png',fullPage:true});
 } else {
 ok('no sideways scroll at 390 px', await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await (await p.$('#trustMatrix')).screenshot({path:'/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/mx390.png'});
 }
 await p.close();}
 { const T2=JSON.parse(JSON.stringify(T)); T2.member_scores=undefined; delete T2.member_scores; T2.intel=[{key:'matrix',value:{weeks:[{at:day(40),pts:[{id:B1,p:50,t:50}]}]}}];
  const pg=page(T2).replace('<script>window.__UID','<script>window.__MISSING=["member_scores"];window.__UID');fs.writeFileSync('t_mx.html',pg);
  const p=await b.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/t_mx.html');await p.waitForTimeout(3000);await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(1500);
  await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(500);ok('missing table is not ticked (0010 stays open)', await p.evaluate(()=>!todoState(OWNER_TODO.find(x=>x.id==='sql-0010')).done));
 ok('before SQL 0010: step on the to-do list with Copy SQL', !!(await p.$('[data-todo=copy][data-id=sql-0010]')));
  await p.waitForTimeout(18000);ok('before SQL 0010: weeks kept in the holding record, none lost', await p.evaluate(()=>window.__T.intel.find(r=>r.key==='matrix').value.weeks.length===2));
  await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(500);ok('month-old position drawn as a trail', (await p.$$('#trustMatrix line[stroke-dasharray="3 3"]')).length>=1);
  const T3=await p.evaluate(()=>window.__T); await p.close(); delete T3.member_scores;
  fs.writeFileSync('t_mx.html',page(T3)); const q=await b.newPage({viewport:{width:1400,height:900}});q.on('pageerror',e=>errs.push(e.message));await q.goto('http://localhost:8765/t_mx.html');await q.waitForTimeout(3000);await q.evaluate(()=>{S.view='today';render();});await q.waitForTimeout(1500);
  ok('after SQL 0010: held weeks move into member_scores by themselves', await q.evaluate(()=>(window.__T.member_scores||[]).length===2 && window.__T.intel.find(r=>r.key==='matrix').value.weeks.length===0));
  await q.close(); }
 console.log('ERRORS',JSON.stringify(errs));fs.unlinkSync('t_mx.html');await b.close();})();
