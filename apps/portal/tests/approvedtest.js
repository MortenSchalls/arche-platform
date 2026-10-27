// Archē-approved operators (manual 8.3, Morten 27 Oct 2026): twelve-month approval, per-trip checks, safety line, withdraw,
// expiry before the last flight, suspension ends the approval. Example data only. Needs the test page on localhost:8765.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x)));if(!c)fails++;};
const toasts=[];await p.exposeFunction('logT',t=>toasts.push(t));
const hook=()=>p.evaluate(()=>{const o=window.toast;if(o.__h)return;const n=m=>{logT(m);o(m);};n.__h=1;window.toast=n;});
const as=async who=>{await p.selectOption('select',{label:who});await p.waitForTimeout(2500);await hook();};
const sel=async(id,v)=>{await p.selectOption('#'+id,v);await p.waitForTimeout(400);};
const fill=async(id,v)=>{await p.fill('#'+id,v);await p.dispatchEvent('#'+id,'change');await p.waitForTimeout(400);};
const needs=()=>p.evaluate(()=>{const t=tripById(S.sel);return safetyNeeds(t.d,t.st);});
const newTrip=async(date)=>{await p.evaluate(()=>{S.view='trips';render();});await p.waitForTimeout(400);await p.click('[data-act="new"]');await p.waitForTimeout(800);
 await p.fill('#e_cn','Anna Example');await p.fill('#e_em','anna@example.com');await p.fill('#e_ct','Singapore');
 const leg=p.locator('.leg').first();await leg.locator('[data-l="from"]').fill('WSSS');await leg.locator('[data-l="to"]').fill('VTBD');await leg.locator('[data-l="date"]').fill(date);await leg.locator('[data-l="time"]').fill('10:00');await leg.locator('[data-l="pax"]').fill('4');
 await p.fill('#q_op','Example Regional Air Ltd');await p.selectOption('#q_oc','SG');await p.fill('#q_ac','Legacy 600');await p.fill('#q_tl','9V-XYZ');await p.fill('#q_pr','30000');
 await p.click('#edForm button[type=submit]');await p.waitForTimeout(1800);
 await sel('sf_aud','isbao-1');await sel('sf_cls','jet');await sel('sf_2p','yes');await fill('sf_ins','60000000');await sel('sf_hist','clear');
 return p.evaluate(()=>S.sel);};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await as('Test Broker');
const d1=await newTrip('2026-11-20');
let n=await needs();ok('unapproved operator: five checks, crew hours and the director needed',n.some(x=>/five checks/.test(x))&&n.some(x=>/crew hours/.test(x))&&n.some(x=>/director's approval/.test(x)),n);
ok('no client disclosure email asked any more',!n.some(x=>/disclosure|told in writing/i.test(x)),n);
ok('no safety line before approval',await p.evaluate(()=>{const t=tripById(S.sel);return safetyLine(t.d,t.st)===''}));
await as('Test Owner');await p.evaluate(d=>{S.view='trips';S.filter='all';S.sel=d;render();},d1);await p.waitForTimeout(800);
await p.fill('#sf_apn','IS-BAO Stage 1, documents reviewed, two broker references');await p.click('[data-sfa="approve12"]');await p.waitForTimeout(800);
ok('twelve-month approval refused without all seven checks',/seven checks/.test(toasts.slice(-1)[0]||''),toasts.slice(-1));
await as('Test Broker');await p.evaluate(d=>{S.view='trips';S.sel=d;render();},d1);await p.waitForTimeout(800);
for(const k of ['aocAuth','insInsurer','sms','noAdverse','refs','docs','crew']){await p.check('#sf83_'+k);await p.waitForTimeout(300);}
await fill('sf_cap','4000');await fill('sf_capt','300');await fill('sf_fo','1500');
await as('Test Owner');await p.evaluate(d=>{S.view='trips';S.filter='all';S.sel=d;render();},d1);await p.waitForTimeout(800);
await p.fill('#sf_apn','IS-BAO Stage 1, documents reviewed, two broker references');await p.click('[data-sfa="approve12"]');await p.waitForTimeout(1200);
const entry=await p.evaluate(()=>((S.opAppr||{}).list||[])[0]||null);
ok('operator on the approved list for twelve months',!!entry&&entry.name==='Example Regional Air Ltd'&&entry.until>new Date(Date.now()+360*864e5).toISOString().slice(0,10),entry);
n=await needs();ok('first trip complete after the approval',n.length===0,n);
const line=await p.evaluate(()=>{const t=tripById(S.sel);return safetyLine(t.d,t.st);});
ok('safety line names the approval and the audit held',/^Archē-approved operator, approval valid to \d+ \w+ \d{4} \(our own review; the operator holds IS-BAO Stage 1, below our audit standard\)$/.test(line),line);
ok('panel shows the line with a copy button',await p.evaluate(()=>!!document.querySelector('[data-sfcopy]')&&/Archē-approved/.test(document.querySelector('#sfLine').textContent)));
ok('confirmation prints the line',await p.evaluate(()=>{const t=tripById(S.sel);return confData(t,{},{}).ac.audit;})===line);
// a second trip with the same operator: only the per-trip basics
await as('Test Broker');const d2=await newTrip('2027-02-10');n=await needs();
ok('second trip with the approved operator needs nothing more',n.length===0,n);
ok('panel says approved operator',await p.evaluate(()=>/Archē-approved operator/.test(document.querySelector('#secSafety').innerText)));
await fill('sf_ins','20000000');ok('insurance below the minimum is still red',await p.evaluate(()=>{const t=tripById(S.sel);return safetyBreaches(t.d).some(x=>/insurance/i.test(x));}));await fill('sf_ins','60000000');
// approval ending before the last flight
await p.evaluate(async()=>{const l=S.opAppr.list.map(x=>({...x,until:'2026-12-31'}));S.opAppr={list:l};render();});await p.waitForTimeout(400);
n=await needs();ok('approval ending before the last flight: renew or approve the trip',n.some(x=>/ends .* before the last flight/.test(x))&&n.some(x=>/director's approval/.test(x)),n);
await p.evaluate(async()=>{const l=S.opAppr.list.map(x=>({...x,until:'2027-10-27'}));S.opAppr={list:l};render();});await p.waitForTimeout(400);
// Team list and withdraw
await as('Test Owner');await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(800);
ok('Team lists the approved operator',await p.evaluate(()=>/Archē-approved operators[\s\S]*Example Regional Air Ltd/.test(document.querySelector('#main').innerText)));
p.once('dialog',dl=>dl.accept());await p.click('[data-apw="Example Regional Air Ltd"]');await p.waitForTimeout(1000);
ok('withdrawn approval: the trip needs the director again',await p.evaluate(d2=>{const t=allTrips().find(x=>x.did===d2);return safetyNeeds(t.d,t.st).some(x=>/director's approval/.test(x));},d2));
// approve without a trip from Team, then suspension ends it
await p.evaluate(()=>document.getElementById('ap_name').closest('details').open=true);await p.fill('#ap_name','Example Regional Air Ltd');await p.selectOption('#ap_aud','isbao-1');await p.fill('#ap_note','Renewed after a document review and references');
for(const k of ['aocAuth','insInsurer','sms','noAdverse','refs','docs','crew'])await p.check('#ap_'+k);
await p.click('[data-apadd]');await p.waitForTimeout(1000);ok('approved from Team without a trip',await p.evaluate(()=>(S.opAppr.list||[]).length===1));
await p.evaluate(d=>{S.view='trips';S.filter='all';S.sel=d;render();},d2);await p.waitForTimeout(800);
await p.evaluate(()=>{const x=[...document.querySelectorAll('#secSafety details')].pop();x.open=true;});await p.fill('#sf_sn','Serious incident 26 Oct, under review');await p.click('[data-sfa="suspend"]');await p.waitForTimeout(1200);
ok('suspension ends the approval',await p.evaluate(()=>(S.opAppr.list||[]).length===0));
ok('suspended operator is red',await p.evaluate(()=>{const t=tripById(S.sel);return safetyBreaches(t.d).some(x=>/suspended/.test(x));}));
ok('no page errors',errs.length===0,errs);
console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
