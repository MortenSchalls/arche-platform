// Research agent panel (Morten, 7 Nov 2026: prospect research from the portal without Claude). Example data only.
// Owner sees the panel in Prospects, saves on/off, frequency, focus and limit to intel/agent, presses Run now;
// brokers never see it; no sideways scroll at 390 px.
const {chromium}=require('playwright');
(async()=>{let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const b=await chromium.launch();const errs=[];
for(const w of [390,1300]){
  const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(w+': '+e.message));
  await p.goto('http://localhost:8765/test.html?as=owner');await p.waitForTimeout(3500);
  await p.evaluate(()=>{S.view='prospects';S.pSec='sales';render();});await p.waitForTimeout(800);
  ok(w+': owner sees the Research agent in Prospects',!!(await p.$('#agentBox'))&&/Research agent · off/.test(await p.textContent('#agentBox summary')));
  await p.evaluate(()=>{document.getElementById('agentBox').open=true;});await p.waitForTimeout(200);
  await p.check('#ag_on');await p.selectOption('#ag_freq','weekdays');await p.fill('#ag_cap','250');await p.fill('#ag_focus','Family offices in Singapore\n\n Event organisers in Phuket ');
  await p.click('[data-act="agSave"]');await p.waitForTimeout(1200);
  const d=await p.evaluate(async()=>{const x=await S.db.doc('intel/agent').get();return x.exists?x.data():null;});
  ok(w+': settings saved (limit held at USD 100, blank lines dropped)',d&&d.on===true&&d.freq==='weekdays'&&d.cap===100&&JSON.stringify(d.focus)==='["Family offices in Singapore","Event organisers in Phuket"]'&&!d.runNow,d);
  ok(w+': panel stays open after saving and shows it is on',await p.evaluate(()=>document.getElementById('agentBox').open)&&/on, monday to friday/.test(await p.textContent('#agentBox summary')));
  await p.click('[data-act="agRun"]');await p.waitForTimeout(1200);
  const d2=await p.evaluate(async()=>{const x=await S.db.doc('intel/agent').get();return x.data();});
  ok(w+': Run now records the request',d2.runNow&&d2.runNow.at&&d2.on===true,d2);
  ok(w+': shows it starts within 3 hours and Run now is disabled',/starts within 3 hours/.test(await p.textContent('#agState'))&&await p.$eval('[data-act="agRun"]',e=>e.disabled));
  await p.evaluate(async()=>{const x=(await S.db.doc('intel/agent').get()).data();await S.db.doc('intel/agent').set({...x,state:'no-key'});});await p.waitForTimeout(1200);
  ok(w+': without the key it says where the key goes',/ANTHROPIC_API_KEY under GitHub.*starts once it is there/.test(await p.textContent('#agState')));
  await p.evaluate(async()=>{const x=(await S.db.doc('intel/agent').get()).data();await S.db.doc('intel/agent').set({...x,state:'done',lastStart:new Date(Date.now()+1000).toISOString(),last:{at:new Date().toISOString(),added:4,operators:2,rejected:1,note:'Added 4 for "Family offices in Singapore".'}});});await p.waitForTimeout(1200);
  ok(w+': shows the last run result',/4 organisations added, 2 operators, 1 rejected/.test(await p.textContent('#agState')));
  ok(w+': no sideways scroll',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await ctx.close();
  const c2=await b.newContext({viewport:{width:w,height:900}});const q=await c2.newPage();q.on('pageerror',e=>errs.push(w+' broker: '+e.message));
  await q.goto('http://localhost:8765/test.html?as=broker');await q.waitForTimeout(3500);await q.evaluate(()=>{S.view='prospects';render();});await q.waitForTimeout(600);
  ok(w+': brokers do not see the agent',!(await q.$('#agentBox')));await c2.close();
}
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
