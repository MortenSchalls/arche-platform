const {chromium}=require('playwright');const fs=require('fs');
const mock=fs.readFileSync('mock2.js','utf8').replace('json: async () => ({})','json: async () => (window.__SJ||{})');
const html=fs.readFileSync('archē-broker-portal.html','utf8').replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js');
const seed=JSON.parse(fs.readFileSync('seed4.json','utf8'));
// make t-ex-1 flown with legs not yet landed status; and t-ex-2 issued for following
seed['roster/demo-broker'].supervised=true;seed['config/company']=Object.assign(seed['config/company']||{},{email:'bookings@example.com'});
const mk=(f,uid,owner,edit,sd)=>fs.writeFileSync(f,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html.replace('<script>\n"use strict";',`<script>window.__SEED=${JSON.stringify(sd)};window.__OWNER=${owner};window.__EDIT=${edit};window.__UID="${uid}";${mock}</script><script>\n"use strict";`)+'</body></html>');
mk('tac_o.html','u_owner',true,true,seed); mk('tac_b.html','demo-broker',false,false,seed);
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];
const p=await b.newPage({viewport:{width:1400,height:950}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8765/tac_o.html');await p.waitForTimeout(2500);
await p.click('#nav [data-view="today"]');await p.waitForTimeout(300);
ok('today shows aftercare panel', /Aftercare/.test(await p.textContent('#main')));
await p.evaluate(()=>{S.view='trips';S.sel='t-ex-1';render();});await p.waitForTimeout(400);
let t=await p.textContent('#main');
ok('trip file shows aftercare', /Aftercare/.test(t)); ok('trip file shows debrief for supervised', /Post-trip debrief/.test(t));
ok('trip file shows flight following', /Flight following/.test(t));
// owner records follow-up
const hasFu=await p.$('[data-ac="fuSave"]'); if(hasFu){await p.fill('#ac_nt','Client happy');await p.click('[data-ac="fuSave"]');await p.waitForTimeout(400);}
ok('follow-up stored', await p.evaluate(()=>!!window.__store['desk/demo-broker/deals/t-ex-1'].followUp));
const href=await p.getAttribute('[data-ac="rateSent"]','href'); ok('rating mailto has 1-5 links', /Rating%25205/.test(href)&&!/mailto%3A%3Fsubject/.test(href)&&/mailto:/.test(href));
await p.evaluate(()=>{document.querySelector('[data-ac="rateSent"]').removeAttribute('href')});await p.click('[data-ac="rateSent"]');await p.waitForTimeout(500);
ok('rating request recorded', await p.evaluate(()=>!!window.__store['desk/demo-broker/deals/t-ex-1'].ratingReq));
await p.selectOption('#rt_o','2');await p.selectOption('#rt_a','3');await p.fill('#rt_m','Late car');await p.click('[data-ac="rateSave"]');await p.waitForTimeout(500);
t=await p.textContent('#main'); ok('low rating triggers service recovery', /Service recovery/.test(t));
await p.fill('#rc_n','Called client, credit on next trip agreed');await p.click('[data-ac="recSave"]');await p.waitForTimeout(400);
ok('recovery stored', await p.evaluate(()=>!!window.__store['desk/demo-broker/deals/t-ex-1'].recovery));
// mentor + ops debrief by owner
for(const k of ['m','o']){ if(await p.$(`[data-part="${k}"]`)){ for(const m of ['m1','m2','m3']) await p.selectOption(`#db_${k}_${m}`,'4'); await p.fill(`#db_${k}_action`,'Check FBO hours, broker, next trip'); await p.click(`[data-part="${k}"]`); await p.waitForTimeout(400);} }
ok('mentor and ops debrief stored', await p.evaluate(()=>{const d=(window.__store['status/demo-broker/deals/t-ex-1']||{}).debrief||{};return !!(d.mentor&&d.ops);}));
await p.evaluate(()=>{S.view='control';render();});await p.waitForTimeout(300);
ok('control shows operator scorecard with rating', /Operator scorecard/.test(await p.textContent('#main')) && /Example Jet Operator/.test(await p.textContent('#main')));
await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(300);
ok('team shows supervised panel', /Supervised bookings/.test(await p.textContent('#main')));
await p.evaluate(()=>{S.view='training';S.trTab='cards';render();});await p.waitForTimeout(400);
t=await p.textContent('#main'); ok('cards tab renders', /Asia-Pacific/.test(t)&&/Last verified/.test(t));
await p.click('[data-card="verify"]');await p.waitForTimeout(400); ok('card verify writes intel/cards', await p.evaluate(()=>!!window.__store['intel/cards']));
await p.evaluate(()=>{S.trTab='rp';render();});await p.waitForTimeout(400);
ok('roleplay tab renders', /Roleplay lab/.test(await p.textContent('#main')));
await p.click('[data-rp="start"]');await p.waitForTimeout(800);
ok('AI opens the call', await p.evaluate(()=>S.rp&&S.rp.msgs.length===1&&S.rp.msgs[0].role==='assistant'));
await p.fill('#rp_in','I understand. I will get the operator replacement options in writing and call you back within 30 minutes.');await p.click('[data-rp="send"]');await p.waitForTimeout(800);
await p.evaluate(()=>{window.__SJ={calm:18,rule:25,options:15,promise:false,escalation:12,followup:14,ruleBroken:false,total:99,pass:true,summary:'Good.',moments:[],model:'Model.'}});
await p.click('[data-rp="end"]');await p.waitForTimeout(800);
const sc=await p.evaluate(()=>S.rp.score); ok('score recomputed total 84 and pass', sc&&sc.total===84&&sc.pass===true);
ok('roleplay saved', await p.evaluate(()=>Object.keys(window.__store).some(k=>k.startsWith('train/u_owner/rp/'))));
await p.evaluate(()=>{S.trTab='book';render();});await p.waitForTimeout(300); ok('booking practice still renders with tabs', /Training mode/.test(await p.textContent('#main'))&&/Roleplay lab/.test(await p.textContent('#main')));
await p.screenshot({path:'ac_owner.png'});
// broker
const q=await b.newPage({viewport:{width:390,height:844}});q.on('pageerror',e=>errs.push('B:'+e.message));
await q.goto('http://localhost:8765/tac_b.html');await q.waitForTimeout(2500);
await q.evaluate(()=>{S.view='trips';S.sel='t-ex-1';render();});await q.waitForTimeout(400);
ok('broker sees aftercare and trainee debrief', /Aftercare/.test(await q.textContent('#main')) && !!(await q.$('[data-part="t"]')));
ok('broker cannot edit legs', !(await q.$('#lg_s0')));
await q.evaluate(()=>{document.getElementById('acPanel')&&document.getElementById('acPanel').scrollIntoView()});await q.screenshot({path:'ac_broker_m.png'});
await q.evaluate(()=>{S.view='training';S.trTab='rp';render();});await q.waitForTimeout(300);await q.screenshot({path:'rp_broker_m.png',fullPage:false});
console.log('ERRORS',JSON.stringify(errs.slice(0,8)));await b.close();})();
