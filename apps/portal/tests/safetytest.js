// Operator safety standard (manual 8.2/8.3): blocks, red items, director approval, suspension. Example data only. Needs the test page on localhost:8765.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const toasts=[];await p.exposeFunction('logT',t=>toasts.push(t));
const hook=()=>p.evaluate(()=>{const o=window.toast;if(o.__h)return;const n=m=>{logT(m);o(m);};n.__h=1;window.toast=n;});
const as=async who=>{await p.selectOption('select',{label:who});await p.waitForTimeout(2500);await hook();};
const sel=async(id,v)=>{await p.selectOption('#'+id,v);await p.waitForTimeout(400);};
const fill=async(id,v)=>{await p.fill('#'+id,v);await p.dispatchEvent('#'+id,'change');await p.waitForTimeout(400);};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await as('Test Broker');
await p.evaluate(()=>{S.view='trips';render();});await p.waitForTimeout(400);
await p.click('[data-act="new"]');await p.waitForTimeout(800);
await p.fill('#e_cn','Anna Example');await p.fill('#e_em','anna@example.com');await p.fill('#e_ct','Singapore');
const leg=p.locator('.leg').first();await leg.locator('[data-l="from"]').fill('WSSL');await leg.locator('[data-l="to"]').fill('VTSP');await leg.locator('[data-l="date"]').fill('2026-11-20');await leg.locator('[data-l="time"]').fill('10:00');await leg.locator('[data-l="pax"]').fill('4');
await p.fill('#q_op','Example Jets Pte Ltd');await p.selectOption('#q_oc','SG');await p.fill('#q_ac','Challenger 650');await p.fill('#q_tl','9V-ABC');await p.fill('#q_pr','40000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(1800);const did=await p.evaluate(()=>S.sel);
console.log('A safety head:',await p.evaluate(()=>document.querySelector('#secSafety .note').innerText));
console.log('B audit tick set by the portal, not by hand:',await p.isDisabled('#ck_audit'),!(await p.isChecked('#ck_audit')));
await sel('sf_aud','isbao-1');await sel('sf_cls','jet');await sel('sf_2p','no');await fill('sf_ins','20000000');await sel('sf_hist','clear');
console.log('C red:',await p.evaluate(()=>document.querySelector('#secSafety .note').innerText));
await sel('sf_2p','yes');await fill('sf_ins','60000000');
for(const k of ['aocAuth','insInsurer','sms','noAdverse','refs']){await p.check('#sf83_'+k);await p.waitForTimeout(300);}
await fill('sf_cap','4000');await fill('sf_capt','300');await fill('sf_fo','1500');
console.log('D needs:',await p.evaluate(()=>document.querySelector('#secSafety .note').innerText));
await p.evaluate(async()=>{const t=tripById(S.sel);await deskWrite(t,{docs:[...(t.d.docs||[]),{id:"xa",name:"aoc.pdf",kind:"AOC",at:now()}]},"test: AOC");});await p.waitForTimeout(600);
for (const k of ["route"]) { await p.click('#ck_'+k); await p.waitForTimeout(250); }
// insurance and operator terms come from the Operator terms and insurance record (29 Oct 2026)
await p.evaluate(async()=>{const t=tripById(S.sel);const o={cancel:[{days:14,unit:"days",pct:50}],pay:[{days:"booking",pct:100}],ins:{insurer:"Example Insurer",expiry:"2030-12-31",regOn:"yes",territory:"yes",how:"Email from the insurer",verifiedAt:new Date().toISOString().slice(0,10)}};await deskWrite(t,{opTerms:o,docs:[...(t.d.docs||[]),{id:"xi",name:"ins.pdf",kind:"Insurance certificate",at:now()}],checks:{...(t.d.checks||{}),ins:true,terms:true}},"test: operator terms");});await p.waitForTimeout(600);
console.log('E audit ticked?',await p.isChecked('#ck_audit'),' submit disabled:',await p.evaluate(()=>document.querySelector('[data-act="submit"]').disabled));
await as('Test Owner');await p.evaluate(d=>{S.view='trips';S.filter='all';S.sel=d;render();},did);await p.waitForTimeout(800);
await p.fill('#sf_apn','IS-BAO Stage 1 renewed 2026, two broker references, crew hours confirmed');await p.click('[data-sfa="approve"]');await p.waitForTimeout(1000);
console.log('F owner:',toasts.slice(-1), await p.evaluate(()=>document.querySelector('#secSafety .note').innerText));
await as('Test Broker');await p.evaluate(d=>{S.view='trips';S.sel=d;render();},did);await p.waitForTimeout(800);
await p.waitForTimeout(800);
console.log('G audit ticked:',await p.isChecked('#ck_audit'),' submit disabled:',await p.evaluate(()=>document.querySelector('[data-act="submit"]').disabled), await p.evaluate(()=>(document.querySelector('#secSend + p')||{}).innerText));
await (await p.$('#secSafety')).screenshot({path:require('os').tmpdir()+'/SF_panel.png'});
// suspension
await as('Test Owner');await p.evaluate(d=>{S.view='trips';S.sel=d;render();},did);await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('#secSafety details').open=true);await p.fill('#sf_sn','Runway excursion 26 Oct, under review');await p.click('[data-sfa="suspend"]');await p.waitForTimeout(1200);
console.log('H suspended red:',await p.evaluate(()=>document.querySelector('#secSafety .note').innerText.slice(0,160)));
// registry check (api/auditcheck mocked): not listed -> director needed; listed at the level -> confirmed
await p.click('[data-sfa="unsuspend"]');await p.waitForTimeout(800);
let reg={at:'2026-10-27T00:00:00Z',sources:{ARGUS:{ok:true,count:550,url:'https://www.argus.aero/operatorregistry'},WYVERN:{ok:false,error:'list loads in the browser only'}},matches:[]};
await p.route('**/api/auditcheck',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(reg)}));
await as('Test Broker');await p.evaluate(d=>{S.regc={};S.view='trips';S.sel=d;render();},did);await p.waitForTimeout(800);
await sel('sf_aud','argus-plat');await p.waitForTimeout(800);
console.log('I not in registry:',await p.evaluate(()=>[...document.querySelectorAll('#secSafety .note')].map(n=>n.innerText).join(' || ').slice(0,300)));
reg.matches=[{prog:'ARGUS',level:'Platinum Elite',name:'Example Jets Pte Ltd'}];await p.evaluate(()=>{S.regc={};render();});await p.waitForTimeout(800);
console.log('J confirmed:',await p.evaluate(()=>[...document.querySelectorAll('#secSafety .note')].map(n=>n.innerText).join(' || ').slice(0,300)));
await p.click('[data-sfr="use"]');await p.waitForTimeout(800);console.log('K recorded:',toasts.slice(-1),await p.evaluate(()=>{const t=tripById(S.sel);return [t.d.safety.checkedAt,t.d.safety.link]}));
await sel('sf_aud','wyv-wingman');await p.waitForTimeout(800);console.log('L WYVERN unread:',await p.evaluate(()=>document.querySelector('#secSafety .note.info')?.innerText||''));
console.log('errs',errs);await b.close()})();
