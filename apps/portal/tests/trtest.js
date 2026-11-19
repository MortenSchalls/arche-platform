// Booking practice (Training): whole training bookings with traps, grading and isolation from real data. Runs on the
// test version (example data). Needs the test page on localhost:8765.
const {chromium}=require('playwright');
const R={};const ok=(k,v)=>{R[k]=v;console.log((v?'PASS ':'FAIL ')+k);};
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1400,height:950}});p.on('pageerror',e=>errs.push(e.message));
const as=async(pg,who)=>{await pg.selectOption('select',{label:who});await pg.waitForTimeout(2500);};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);await as(p,'Test Broker');
await p.evaluate(()=>{S.view='training';S.trTab='book';render();});await p.waitForTimeout(400);
ok('training opens for a broker', /Training mode/.test(await p.textContent('#main')));
const snap=()=>p.evaluate(()=>JSON.stringify({trips:allTrips().map(t=>t.did).sort(),leads:Object.keys(S.leads||{}).sort()}));
const before=await snap();
async function run(sc, o){
  await p.click(`[data-tr="start"][data-sc="${sc}"]`);await p.waitForTimeout(300);
  await p.click('[data-tr="next"]');await p.waitForTimeout(250);
  const exp=await p.evaluate(()=>{const r=trRun();return {date:r.expDate,time:r.expTime};});
  await p.fill('#tr_f0',o.from);await p.fill('#tr_t0',o.to);await p.fill('#tr_d0',exp.date);await p.fill('#tr_h0',exp.time);await p.fill('#tr_p0',String(o.pax));await p.selectOption('#tr_cat',o.cat);
  await p.click('[data-tr="saveEnq"]');await p.waitForTimeout(500);
  const offers=await p.evaluate(()=>trRun().offers.map(x=>({op:x.op,trap:x.trap||'',price:x.price})));
  let idx=o.pickTrap?offers.findIndex(x=>x.trap):offers.map((x,i)=>[x,i]).filter(([x])=>!x.trap).sort((a,b2)=>a[0].price-b2[0].price)[0][1];
  await p.check('#tr_o'+idx);await p.click('[data-tr="pick"]');await p.waitForTimeout(300);
  for(const n of (o.add||[])){await p.click(`[data-tr="xadd"][data-x="${n.sec}"]`);await p.waitForTimeout(250);const i=await p.evaluate(s=>trRun()[s].length-1,n.sec);
    await p.selectOption(`[data-trx="${n.sec}|${i}|cat"]`,n.cat);await p.fill(`[data-trx="${n.sec}|${i}|text"]`,n.text);await p.selectOption(`[data-trx="${n.sec}|${i}|basis"]`,n.basis||'included');}
  await p.click('[data-tr="saveX"]');await p.waitForTimeout(300);
  const right=await p.evaluate(()=>{const r=trRun(),o=r.offers[r.pick];return priceOf(o.price,num(r.direct));});
  await p.fill('#tr_price',String(o.wrongPrice?right-500:right));await p.click('[data-tr="savePrice"]');await p.waitForTimeout(300);
  for(const k of ['never','risk','aoc','ins','audit','route','terms']) await p.check('#trc_'+k);
  await p.check(o.decline?'#tr_ddec':'#tr_dsend'); if(o.decline) await p.selectOption('#tr_why','payment');
  await p.click('[data-tr="submit"]');await p.waitForTimeout(400);
  const review=await p.evaluate(()=>trRun().review);
  return {offers,review};
}
// s1 correct path all the way
let x=await run('s1',{from:'EGLL',to:'LFMN',pax:5,cat:'Light jet',add:[{sec:'requests',cat:'Catering',text:'Light lunch for 5'}]});
ok('s1 approved by training operations', x.review.crit.length===0);
await p.click('[data-tr="next"]');await p.waitForTimeout(800);
ok('training confirmation shown with TRN reference and training remark', /TRN-/.test(await p.textContent('.trconf'))&&/TRAINING EXERCISE/.test(await p.textContent('.trconf')));
await p.click('[data-tr="signed"]');await p.waitForTimeout(300);
const cc=await p.evaluate(()=>trDeadline(trRun()));const op=await p.evaluate(()=>{const r=trRun();return r.offers[r.pick].price;});
await p.fill('#tr_dep',String(cc.deposit));await p.fill('#tr_bal',cc.balanceDue);await p.fill('#tr_op',String(op));await p.click('[data-tr="pnCheck"]');await p.waitForTimeout(300);
ok('payment request answers graded correct', await p.evaluate(()=>{const n=trRun().pn;return n.depOk&&n.dateOk&&n.opOk;}));
await p.click('[data-tr="next"]');await p.waitForTimeout(300);await p.click('[data-tr="finish"]');await p.waitForTimeout(300);
const sc1=await p.evaluate(()=>trRun().score);ok('s1 perfect run scores 100 ('+sc1+')', sc1===100);
// s4 cabotage trap
x=await run('s4',{from:'KOPF',to:'KTEB',pax:5,cat:'Super-midsize jet',pickTrap:true});
ok('cabotage trap returned', x.review.crit.some(c=>/cabotage/i.test(c)));
ok('return costs first-time bonus', await p.evaluate(()=>trRun().returns)===1);
// fix: back to Avinode, choose clean, resubmit
await p.click('[data-tr="goto"][data-to="2"]');await p.waitForTimeout(300);
const cleanIdx=await p.evaluate(()=>trRun().offers.findIndex(o=>!o.trap));await p.check('#tr_o'+cleanIdx);await p.click('[data-tr="pick"]');await p.waitForTimeout(300);
await p.click('[data-tr="saveX"]');await p.waitForTimeout(300);await p.click('[data-tr="savePrice"]');await p.waitForTimeout(300);await p.click('[data-tr="submit"]');await p.waitForTimeout(300);
ok('fixed run approved', await p.evaluate(()=>trRun().review.crit.length===0));
// s5 short notice: full payment
x=await run('s5',{from:'OMDB',to:'OERK',pax:6,cat:'Midsize jet'});
await p.click('[data-tr="next"]');await p.waitForTimeout(500);await p.click('[data-tr="signed"]');await p.waitForTimeout(300);
const c5=await p.evaluate(()=>trDeadline(trRun()));ok('short notice means full payment on signature', c5.full===true&&c5.deposit===c5.total);
// s6 decline
x=await run('s6',{from:'LTFM',to:'LFMN',pax:4,cat:'Midsize jet',decline:true});
ok('red flag declined correctly', x.review.crit.length===0 && x.review.ok.some(t=>/cannot take payments/.test(t)));
await p.click('[data-tr="finish"]');await p.waitForTimeout(300);
ok('decline exercise scores ('+await p.evaluate(()=>trRun().score)+')', (await p.evaluate(()=>trRun().score))>=90);
// s6 wrongly sent
x=await run('s6',{from:'LTFM',to:'LFMN',pax:4,cat:'Midsize jet'});
ok('sending the red-flag trip is returned', x.review.crit.some(c=>/Russia/.test(c)));
// s7 full trial booking: every step after Avinode, perfect answers
x=await run('s7',{from:'WSSS',to:'RJTT',pax:7,cat:'Super-midsize jet',add:[{sec:'requests',cat:'Catering',text:'Japanese breakfast for 7'}]});
ok('s7 approved by training operations', x.review.crit.length===0);
ok('s7 authorisation leads to the Request to Book', /Next: Request to Book/.test(await p.textContent('.trpanel')));
await p.click('[data-tr="next"]');await p.waitForTimeout(400);
const f7=await p.evaluate(()=>{const f=tbFigs(trRun());return {hold:f.hold,dep:f.deposit,op:f.opSign,issue:f.issue,O:f.O,P:f.P,sched:f.sched};});
ok('s7 schedule: more than 25% on signature because the operator wants 30% ('+f7.dep+')', f7.dep>=f7.op && f7.dep>Math.ceil(f7.P*0.25) && f7.sched.length>=3);
ok('s7 stepper has 14 steps', await p.evaluate(()=>document.querySelectorAll('.trsteps li').length)===14);
for(const k of ['tail','legs','opp','req']) await p.check('#tb_r_'+k);
await p.fill('#tb_hold',f7.hold);await p.click('[data-tbs="rtb"]');await p.waitForTimeout(300);
ok('Request to Book graded', await p.evaluate(()=>trRun().rtb.pts)===10);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
for(const [k,v] of [['ac','ok'],['legs','ok'],['price','bad'],['pay','ok'],['cancel','ok'],['ins','bad']]) await p.check(`input[name="tb_oc_${k}"][value="${v}"]`);
await p.check('#tb_ocd_fix');await p.click('[data-tbs="oc"]');await p.waitForTimeout(300);
ok('operator contract graded (price and insurance found, not signed yet)', await p.evaluate(()=>trRun().oc.pts)===15);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
ok('confirmation not shown before the answers', !(await p.$('.trconf')));
await p.fill('#tb_dep',String(f7.dep));await p.fill('#tb_valid',f7.hold);await p.check('#tb_cfw_op');
for(const k of ['op','ac','legs','one','sched','canc']) await p.check('#tb_c_'+k);
await p.click('[data-tbs="cf"]');await p.waitForTimeout(600);
ok('charter confirmation graded', await p.evaluate(()=>trRun().cf.pts)===15);
const conf7=await p.textContent('.trconf');
ok('confirmation carries the operator, the schedule and the training remark', conf7.includes('Lion City Jets')||conf7.includes('Peninsula Air'));
ok('confirmation prints this booking\'s deposit', conf7.replace(/[^0-9]/g,' ').split(/\s+/).includes(String(f7.dep))||conf7.includes(f7.dep.toLocaleString('en-US')));
ok('confirmation states the operator insurance', /USD 50,000,000/.test(conf7));
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.check('#tb_cph_pr');await p.check('#tb_cpr_clear');await p.check('#tb_cpp_chk');await p.click('[data-tbs="cp"]');await p.waitForTimeout(300);
ok('client payment graded', await p.evaluate(()=>trRun().cp.pts)===10);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.check('#tb_oss_yes');await p.fill('#tb_osp',String(f7.op));await p.check('#tb_osl_chase');await p.click('[data-tbs="os"]');await p.waitForTimeout(300);
ok('operator signed and paid only from cleared money', await p.evaluate(()=>trRun().os.pts)===15);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.fill('#tb_off','00:40');await p.fill('#tb_on','07:45');await p.fill('#tb_route','Singapore, Manila, Taipei, Fukuoka FIRs');await p.selectOption('#tb_stop','None');await p.click('[data-tbs="ff"]');await p.waitForTimeout(300);
ok('flight following graded (UTC block times)', await p.evaluate(()=>trRun().ff.pts)===10);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.check('#tb_fuw_24');await p.check('#tb_ful_rec');await p.check('#tb_fuq_consent');await p.click('[data-tbs="fu"]');await p.waitForTimeout(300);
ok('follow-up and rating graded, commission shown', await p.evaluate(()=>trRun().fu.pts)===10 && /Your commission/.test(await p.textContent('.trpanel')));
await p.click('[data-tr="finish"]');await p.waitForTimeout(400);
const s7=await p.evaluate(()=>trRun().score);ok('s7 perfect full run scores 100 ('+s7+')', s7===100);
ok('s7 score page lists the steps after Avinode', /Operator signed and paid/.test(await p.textContent('.trpanel')));
const s7id=await p.evaluate(()=>S.trSel);
// s7 wrong answers lose points and stay graded
x=await run('s7',{from:'WSSS',to:'RJTT',pax:7,cat:'Heavy jet',add:[{sec:'requests',cat:'Catering',text:'Japanese breakfast'}]});
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
for(const k of ['tail','legs','opp','req','cp','pp']) await p.check('#tb_r_'+k);
await p.fill('#tb_hold','2030-01-01');await p.click('[data-tbs="rtb"]');await p.waitForTimeout(300);
ok('wrong Request to Book scores 0 and says why', await p.evaluate(()=>trRun().rtb.pts)===0 && /never sees our client price/.test(await p.textContent('.trpanel')));
ok('graded step cannot be answered again', !(await p.$('[data-tbs="rtb"]')));
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
for(const k of ['ac','legs','price','pay','cancel','ins']) await p.check(`input[name="tb_oc_${k}"][value="ok"]`);
await p.check('#tb_ocd_sign');await p.click('[data-tbs="oc"]');await p.waitForTimeout(300);
ok('signing the operator contract before the client pays is marked wrong', await p.evaluate(()=>trRun().oc.pts)===8 && /signed only after the client/.test(await p.textContent('.trpanel')));
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
const f8=await p.evaluate(()=>{const f=tbFigs(trRun());return {P:f.P,hold:f.hold};});
await p.fill('#tb_dep',String(Math.ceil(f8.P*0.25)));await p.fill('#tb_valid','2030-01-01');await p.check('#tb_cfw_new');await p.check('#tb_c_card');await p.click('[data-tbs="cf"]');await p.waitForTimeout(500);
ok('25% deposit, offer past the hold and a card fee on top are all marked wrong', await p.evaluate(()=>trRun().cf.pts)===0);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.check('#tb_cph_bank');await p.check('#tb_cpr_told');await p.check('#tb_cpp_copy');await p.click('[data-tbs="cp"]');await p.waitForTimeout(300);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.check('#tb_oss_yes');await p.fill('#tb_osp',String(f8.P));await p.check('#tb_osl_advance');await p.click('[data-tbs="os"]');await p.waitForTimeout(300);
ok('paying the client price or pre-funding the operator is marked wrong', await p.evaluate(()=>trRun().os.pts)===5);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.fill('#tb_off','08:40');await p.fill('#tb_on','16:45');await p.selectOption('#tb_stop','None');await p.click('[data-tbs="ff"]');await p.waitForTimeout(300);
ok('local block times instead of UTC are marked wrong', await p.evaluate(()=>trRun().ff.pts)===0);
await p.click('[data-tr="next"]');await p.waitForTimeout(300);
await p.check('#tb_fuw_week');await p.check('#tb_ful_none');await p.check('#tb_fuq_yes');await p.click('[data-tbs="fu"]');await p.waitForTimeout(300);
await p.click('[data-tr="finish"]');await p.waitForTimeout(300);
const s8=await p.evaluate(()=>trRun().score);ok('weak full run scores under 80 ('+s8+')', s8<80);
// isolation
const after=await snap();
ok('no real trip or lead was created or changed', before===after);
// owner sees team training
await as(p,'Test Director');await p.evaluate(()=>{S.trAll=null;S.view='training';S.trTab='book';render();});await p.waitForTimeout(1500);
ok('owner sees team training table', /Team training/.test(await p.textContent('#main'))&&/Test Broker/.test(await p.textContent('#main')));
// phone
const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await m.goto('http://localhost:8765/test.html');await m.waitForTimeout(3000);await as(m,'Test Broker');
await m.evaluate(()=>{S.view='training';S.trTab='book';S.trSel=Object.keys(S.trRuns||{})[0]||null;render();});await m.waitForTimeout(500);
ok('no sideways scroll on phone', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
const s7r=await m.evaluate(()=>Object.entries(S.trRuns||{}).filter(([,r])=>r.sc==='s7').map(([id])=>id)[0]||null);
for(const st of [8,9,11,12,99]){await m.evaluate(([id,st])=>{S.trSel=id;S.view='training';S.trTab='book';if(st===99){render();return;}S.trRuns[id]={...S.trRuns[id],done:false,step:st};render();},[s7r,st]);await m.waitForTimeout(300);
  ok('full trial step '+st+': no sideways scroll on phone', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));}
ok('no page errors',!errs.length);if(errs.length)console.log(errs.slice(0,5));const all=Object.values(R).every(Boolean);console.log(all?'ALL PASS':'SOME FAILED');await b.close();process.exit(all?0:1);})();
