// The trip one step at a time (Morten, 25 Nov 2026): a step bar, only the chosen step's panels, the step due opened
// first, every section on request; phone width without sideways scroll. Test version, example data only.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
for(const vw of [{width:1366,height:900},{width:390,height:844}]){
const p=await b.newPage({viewport:vw});const errs=[];p.on('pageerror',e=>errs.push(e.message));const W=' @'+vw.width;
await p.goto('http://localhost:8765/test.html?as=broker');await p.waitForTimeout(3000);
await p.evaluate(()=>{S.view='trips';render()});await p.click('[data-act="new"]');await p.waitForTimeout(400);
const d=new Date(Date.now()+20*864e5).toISOString().slice(0,10);
await p.fill('#e_cn','Example Guided');await p.fill('#e_em','guided@example.com');await p.fill('#e_ct','Singapore');
await p.fill('.leg [data-l="from"]','WSSL');await p.fill('.leg [data-l="to"]','VTBD');await p.fill('.leg [data-l="date"]',d);await p.fill('.leg [data-l="time"]','14:00');await p.fill('.leg [data-l="pax"]','4');
ok('a ? with a plain sentence on enquiry fields'+W,await p.evaluate(()=>{const b=document.querySelector('label[for="e_ct"] button.fh');if(!b)return false;b.click();const t=document.getElementById('fh_e_ct');return !!t&&!t.hidden&&/sanctions/.test(t.textContent)}));
await p.click('#edForm button[type=submit]');await p.waitForTimeout(2000);
const vis=async id=>p.evaluate(id=>{const e=document.getElementById(id);return !!e&&!e.closest('[hidden]')&&e.offsetParent!==null},id);
ok('step bar with eight steps'+W,await p.evaluate(()=>document.querySelectorAll('#tripStepBar [data-tstep]').length===9));
ok('opens on the step due: Operator quote'+W,await p.evaluate(()=>(document.querySelector('#tripStepBar .on')||{}).dataset.tstep==='2'));
ok('step 2 shows the Avinode request, not the trip checks'+W,await vis('secAvinode')&&!(await vis('secTC'))&&!(await vis('secDocs')));
ok('action row stays on every step'+W,await vis('secSend'));
await p.click('#tripStepBar [data-tstep="3"]');await p.waitForTimeout(500);
ok('step 3 shows checks and documents only'+W,await vis('secTC')&&await vis('secDocs')&&!(await vis('secAvinode')),{tc:await vis('secTC'),docs:await vis('secDocs')});
ok('a way back to the step due'+W,await p.evaluate(()=>!!document.querySelector('#secNext [data-tstep="2"]')));
await p.click('#tripStepBar [data-tstep="all"]');await p.waitForTimeout(500);
ok('Show every section puts the whole file on one page'+W,await vis('secTC')&&await vis('secAvinode')&&await vis('secDocs'));
await p.click('#tripStepBar [data-tstep="guided"]');await p.waitForTimeout(500);
ok('back to one step at a time'+W,!(await vis('secTC'))||!(await vis('secAvinode')));
// quote, then Request to Book by the broker on step 4
await p.click('#secSend [data-act="editQuote"]');await p.waitForTimeout(400);await p.fill('#q_op','Example Air AG');await p.fill('#q_ac','Global 7500');await p.fill('#q_pr','40000');await p.click('#edForm button[type=submit]');await p.waitForTimeout(2000);
await p.click('#tripStepBar [data-tstep="4"]');await p.waitForTimeout(500);
ok('Request to Book is the broker\'s, on step 4'+W,await vis('secRtb'));
const now16=new Date(Date.now()-36e5).toISOString().slice(0,16),hold=new Date(Date.now()+864e5).toISOString().slice(0,16);
await p.fill('#rb_rtb',now16);await p.press('#rb_rtb','Tab');await p.waitForTimeout(900);await p.fill('#rb_hold',hold);await p.press('#rb_hold','Tab');await p.waitForTimeout(900);
const bk=await p.evaluate(()=>{const t=tripById(S.sel);return {b:t.d.book,need:bookNeeds(t)}});
ok('the broker\'s Request to Book and hold are saved and count for the Director'+W,!!(bk.b&&bk.b.rtbAt&&bk.b.holdUntil)&&!bk.need.some(x=>/Request to Book|holds/.test(x)),bk);
ok('a ? explains our own words'+W,await p.evaluate(()=>!!document.querySelector('#secRtb button.fh, #secNext button.fh, .note button.fh')));
const c1=await p.evaluate(()=>document.querySelectorAll('button.fh').length);await p.waitForTimeout(3000);const c2=await p.evaluate(()=>document.querySelectorAll('button.fh').length);
ok('the ? help does not keep growing'+W,c1>0&&c1===c2,{c1,c2});
const h=await p.evaluate(()=>document.querySelector('main').scrollHeight);
ok('no sideways scroll'+W,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
console.log('   page height'+W, h);
if(vw.width===390)await p.screenshot({path:'/tmp/guided_390.png',fullPage:true});else await p.screenshot({path:'/tmp/guided_1366.png',fullPage:false});
ok('no page errors'+W,!errs.length,errs);await p.close();}
console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
