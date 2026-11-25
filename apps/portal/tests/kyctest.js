// KYC record and the 12-month refresh (Morten, 16 Nov 2026: "yes build, but ensure we have all aligned with our privacy
// policy"). No ID numbers stored; reuse for 12 months unless the payer, country or name changes or screening finds a
// possible match. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1';
const ago=d=>new Date(Date.now()-d*864e5).toISOString();const day=d=>ago(d).slice(0,10);
const cl={name:'Jane Example',company:'Example Family Office Ltd',email:'jane@example.com',country:'Singapore',payer:''};
const trip=(id,extra)=>({owner_id:B1,id,data:{client:{...cl},stage:'quoted',created:ago(5),quote:{opPrice:40000,direct:950},trip:{legs:[{from:'WSSS',to:'VTBD',date:day(-20)}]},checks:{},...extra}});
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Broker',data:{roster:true,onboarding:{issuedAt:ago(40)}}}],
 config:[{key:'terms',value:{margin:0.09,unit:45000,threshold:8,rate1:0.27,rate2:0.35,ownerApproval:true}}],intel:[],
 trips:[trip('t1'),trip('t0',{stage:'flown',kycRec:{checkedAt:day(100),how:'id',ref:'KYC-EX-1',name:'example family office ltd',country:'Singapore',payer:'',by:B1}})],
 trip_status:[],step_requests:[],leads:[],prospects:[],optouts:[],join_requests:[],agreements:[],training_runs:[{owner_id:B1,id:'onboarding',data:{ackAt:ago(30)}}]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v,x)=>console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T)=>{const f=`t_k_${n++}.html`;fs.writeFileSync(f,page(uid,T));const p=await b.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/'+f+'?steps=all');await p.waitForTimeout(4500);return p;};
 const T1=JSON.parse(JSON.stringify(T0));T1.trips=[trip('t1')];
 let p=await open(B1,T1);
 ok('no record: authorisation is blocked', /no KYC record/.test(await p.evaluate(()=>kycBlockReason(tripById('t1')))));
 await p.evaluate(()=>{S.view='trips';S.sel='t1';render();});await p.waitForTimeout(300);
 ok('the trip asks for the KYC record', (await p.textContent('#main')).includes('Record the KYC check'));
 ok('no reference field to type in: the portal numbers the check', !(await p.$('#kyc_ref')));
 await p.click('[data-kyc="save"]');await p.waitForTimeout(400);
 let T=await p.evaluate(()=>window.__T);const r=T.trips[0].data.kycRec;
 ok('saved: date, how, our reference, name, country and payer only', r&&r.checkedAt===new Date().toISOString().slice(0,10)&&/^KYB-\d{4}-[0-9A-Z]{4}$/.test(r.ref||'')&&r.how==='id'&&r.name==='example family office ltd'&&!JSON.stringify({...r,by:0,at:0}).match(/passport|\d{6,}/i)&&T.trips[0].data.checks.kyc===true,r);
 ok('a current record passes', await p.evaluate(()=>kycBlockReason(tripById('t1'))===null));
 await p.close();
 // reuse from the client's earlier trip
 p=await open(B1,T0);await p.evaluate(()=>{S.view='trips';S.sel='t1';render();});await p.waitForTimeout(300);
 ok('the earlier check is offered', (await p.textContent('#main')).includes('Use that check'));
 await p.click('[data-kyc="reuse"]');await p.waitForTimeout(400);T=await p.evaluate(()=>window.__T);
 const ru=T.trips.find(x=>x.id==='t1').data.kycRec;ok('reused with the original date and where it came from', ru&&ru.checkedAt===T0.trips[1].data.kycRec.checkedAt&&ru.reusedFrom==='t0',ru);
 await p.close();
 // older than 12 months
 const T2=JSON.parse(JSON.stringify(T0));T2.trips[1].data.kycRec.checkedAt=day(400);T2.trips[0].data.kycRec={...T2.trips[1].data.kycRec};
 p=await open(B1,T2);ok('a check over 12 months old blocks', /more than 12 months old/.test(await p.evaluate(()=>kycBlockReason(tripById('t1')))));
 await p.evaluate(()=>{S.view='trips';S.sel='t1';render();});await p.waitForTimeout(300);
 ok('an old check is not offered for reuse', !(await p.textContent('#main')).includes('Use that check'));await p.close();
 // a new payer
 const T3=JSON.parse(JSON.stringify(T0));T3.trips[0].data.kycRec={...T3.trips[1].data.kycRec};T3.trips[0].data.client.payer='Example Holdings Ltd';
 p=await open(B1,T3);ok('a new payer means the check is done again', /new payer/.test(await p.evaluate(()=>kycBlockReason(tripById('t1')))));await p.close();
 // a possible sanctions match
 const T4=JSON.parse(JSON.stringify(T0));T4.trips[0].data.kycRec={...T4.trips[1].data.kycRec};T4.trip_status=[{owner_id:B1,id:'t1',data:{state:'review',kyc:true,screen:{outcome:'possible match'}}}];
 p=await open(OWN,T4);ok('a possible sanctions match means the check is done again', /possible sanctions match/.test(await p.evaluate(()=>kycBlockReason(tripById('t1')))));
 ok('the Director\'s approval list shows it', await p.evaluate(()=>apChecks(tripById('t1')).some(([v,l])=>!v&&/KYC must be done again/.test(l))));
 await p.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_k_')))fs.unlinkSync(f);})();
