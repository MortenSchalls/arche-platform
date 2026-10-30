// Aftercare after a flight: follow-up, rating request, rating, service recovery for a low score, flight following,
// operator scorecard, regional cards. Runs on the test version (example data). Needs the test page on localhost:8765.
// (Replaces the old actest.js, which ran on the retired claude.ai copy of the portal.)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!v)fails++;};
const p=await b.newPage({viewport:{width:1400,height:950}});p.on('pageerror',e=>errs.push(e.message));
const as=async who=>{await p.selectOption('select',{label:who});await p.waitForTimeout(2500);};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await as('Test Broker');
const day=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
await p.evaluate(()=>{S.view='trips';render();});await p.waitForTimeout(400);await p.click('[data-act="new"]');await p.waitForTimeout(800);
await p.fill('#e_cn','Carla Example');await p.fill('#e_em','carla@example.com');await p.fill('#e_ct','Singapore');
{const leg=p.locator('.leg').first();await leg.locator('[data-l="from"]').fill('WSSS');await leg.locator('[data-l="to"]').fill('VTBD');await leg.locator('[data-l="date"]').fill(day(-2));await leg.locator('[data-l="time"]').fill('10:00');await leg.locator('[data-l="pax"]').fill('3');}
await p.fill('#q_op','Example Jet Operator Ltd');await p.selectOption('#q_oc','SG');await p.fill('#q_ac','Legacy 600');await p.fill('#q_tl','9V-ABC');await p.fill('#q_pr','40000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(1800);
const did=await p.evaluate(()=>S.sel);
await p.evaluate(async([d])=>{const t=tripById(S.sel);await deskWrite(t,{stage:'submitted',submittedAt:now()},'test: sent');await statusWrite(t,{state:'flown',ref:'AE-TEST-AC',price:43957,opPrice:40000,direct:0,issuedAt:now(),clientPaid:true,clientPaidDate:d,operatorPaid:true,operatorPaidDate:d,flownDate:d,legStatus:[{s:'land',set:now()}]},'test: flown');},[day(-2)]);
await p.waitForTimeout(800);
await as('Test Owner');await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(500);
ok('Today shows the aftercare panel',/Aftercare/.test(await p.textContent('#main')));
await p.evaluate(d=>{S.view='trips';S.sel=d;render();},did);await p.waitForTimeout(500);
let t=await p.textContent('#main');
ok('trip file shows aftercare and flight following',/Aftercare/.test(t)&&/Flight following/.test(t));
if(await p.$('[data-ac="fuSave"]')){await p.fill('#ac_nt','Client happy');await p.click('[data-ac="fuSave"]');await p.waitForTimeout(500);}
ok('follow-up recorded',await p.evaluate(d=>!!tripById(d).d.followUp,did));
const href=await p.getAttribute('[data-ac="rateSent"]','href');
ok('rating request opens an email with 1 to 5 links',/mailto:/.test(href||'')&&/Rating%25205/.test(href||''),href);
await p.evaluate(()=>{document.querySelector('[data-ac="rateSent"]').removeAttribute('href');});await p.click('[data-ac="rateSent"]');await p.waitForTimeout(500);
ok('rating request recorded',await p.evaluate(d=>!!tripById(d).d.ratingReq,did));
await p.selectOption('#rt_o','2');await p.selectOption('#rt_a','3');await p.fill('#rt_m','Late car');await p.click('[data-ac="rateSave"]');await p.waitForTimeout(600);
ok('a score of 3 or less starts service recovery',/Service recovery/.test(await p.textContent('#main')));
await p.fill('#rc_n','Called the client, credit on the next trip agreed');await p.click('[data-ac="recSave"]');await p.waitForTimeout(500);
ok('service recovery recorded',await p.evaluate(d=>!!tripById(d).d.recovery,did));
await p.evaluate(()=>{S.view='control';render();});await p.waitForTimeout(500);
ok('Control shows the operator scorecard',/Operator scorecard/.test(await p.textContent('#main'))&&/Example Jet Operator/.test(await p.textContent('#main')));
await p.evaluate(()=>{S.view='training';S.trTab='cards';render();});await p.waitForTimeout(500);
ok('regional cards render',/Asia-Pacific/.test(await p.textContent('#main')));
// broker on a phone
const q=p;await q.setViewportSize({width:390,height:844});await as('Test Broker');
await q.evaluate(d=>{S.view='trips';S.sel=d;render();},did);await q.waitForTimeout(500);
ok('the broker sees the aftercare on the trip',/Aftercare/.test(await q.textContent('#main')));
ok('no sideways scrolling on the phone',await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
ok('no page errors',!errs.length,errs);
await b.close();console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0);})();
