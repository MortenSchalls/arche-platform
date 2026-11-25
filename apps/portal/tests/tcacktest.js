// Confirmed with the operator clears each amber trip check and the two top pre-issue ticks set themselves (bug found in the
const showQuote=async p=>{await p.evaluate(()=>{const b=document.querySelector('[data-act="edPart"][data-part="quote"]');if(b)b.click();});};
// candidate's test booking, 25 Nov 2026: the item key was cut at the first '|'). Test version, example data only.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1366,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/test.html?as=broker');await p.waitForTimeout(3000);
await p.evaluate(()=>{S.view='trips';render()});await p.click('[data-act="new"]');await p.waitForTimeout(400);
const d=new Date(Date.now()+20*864e5).toISOString().slice(0,10);
await p.fill('#e_cn','Example Walk Client');await p.fill('#e_em','walk@example.com');await p.fill('#e_ct','Singapore');
await p.fill('.leg [data-l="from"]','VTBS');await p.fill('.leg [data-l="to"]','VTSP');await p.fill('.leg [data-l="date"]',d);await p.fill('.leg [data-l="time"]','09:00');await p.fill('.leg [data-l="pax"]','6');
await showQuote(p);await p.fill('#q_op','Example Air AG');await showQuote(p);await p.selectOption('#q_oc','CH').catch(()=>{});await showQuote(p);await p.fill('#q_ac','Global 7500');await showQuote(p);await p.fill('#q_pr','40000');
await p.click('#edForm button[type=submit]');await p.waitForTimeout(2500);
const c=await p.$('#secChecks');const ctext=await c.innerText();
let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
ok('the locked ticks say what sets them and where to go',/Confirm the 2 amber items in Trip checks/.test(ctext)&&/Go there/i.test(ctext),ctext.slice(0,300));
for(let i=0;i<3;i++){const bt=await p.$('#secTC [data-tc^="ack|"]');if(!bt)break;await bt.click();await p.waitForTimeout(700);}
const r=await p.evaluate(()=>{const t=tripById(S.sel);return {checks:t.d.checks,acks:Object.keys(t.d.acks||{}),open:tripBlockers(t.d,t.st).amberOpen.length}});
ok('each confirmation is saved under its whole key',r.acks.includes('cab|1')&&r.acks.includes('size|1|VTSP'),r);ok('no amber item left open',r.open===0,r);ok('never-sell and risk ticks set by the portal',r.checks.never===true&&r.checks.risk===true,r);ok('no page errors',!errs.length,errs);console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
