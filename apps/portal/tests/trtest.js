const {chromium}=require('playwright');const fs=require('fs');
const mock=fs.readFileSync('mock2.js','utf8');
const html=fs.readFileSync('archē-broker-portal.html','utf8').replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js');
const seed=JSON.parse(fs.readFileSync('seed4.json','utf8'));
const mk=(f,uid,owner,edit,sd)=>fs.writeFileSync(f,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html.replace('<script>\n"use strict";',`<script>window.__SEED=${JSON.stringify(sd)};window.__OWNER=${owner};window.__EDIT=${edit};window.__UID="${uid}";${mock}</script><script>\n"use strict";`)+'</body></html>');
mk('ttr.html','demo-broker',false,false,seed);
const R={};const ok=(k,v)=>{R[k]=v;console.log((v?'PASS ':'FAIL ')+k);};
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1400,height:950}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/ttr.html');await p.waitForTimeout(2500);
await p.click('#nav [data-view="training"]');await p.waitForTimeout(300);
ok('training opens for a broker', /Training mode/.test(await p.textContent('#main')));
const before=await p.evaluate(()=>JSON.stringify(Object.keys(window.__store).filter(k=>!k.startsWith('train/')).sort()));
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
  await p.check(o.decline?'#tr_ddec':'#tr_dsend'); if(o.decline) await p.selectOption('#tr_why','paynode');
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
ok('Paynode answers graded correct', await p.evaluate(()=>{const n=trRun().pn;return n.depOk&&n.dateOk&&n.opOk;}));
await p.click('[data-tr="next"]');await p.waitForTimeout(300);await p.click('[data-tr="finish"]');await p.waitForTimeout(300);
const sc1=await p.evaluate(()=>trRun().score);ok('s1 perfect run scores 100 ('+sc1+')', sc1===100);
await p.screenshot({path:'tr_s1_score.png'});
// s4 cabotage trap
x=await run('s4',{from:'KOPF',to:'KTEB',pax:5,cat:'Super-midsize jet',pickTrap:true});
ok('cabotage trap returned', x.review.crit.some(c=>/cabotage/i.test(c)));
ok('return costs first-time bonus', await p.evaluate(()=>trRun().returns)===1);
await p.screenshot({path:'tr_s4_return.png'});
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
ok('red flag declined correctly', x.review.crit.length===0 && x.review.ok.some(t=>/Paynode/.test(t)));
await p.click('[data-tr="finish"]');await p.waitForTimeout(300);
ok('decline exercise scores ('+await p.evaluate(()=>trRun().score)+')', (await p.evaluate(()=>trRun().score))>=90);
// s6 wrongly sent
x=await run('s6',{from:'LTFM',to:'LFMN',pax:4,cat:'Midsize jet'});
ok('sending the red-flag trip is returned', x.review.crit.some(c=>/Russia/.test(c)));
// isolation
const after=await p.evaluate(()=>JSON.stringify(Object.keys(window.__store).filter(k=>!k.startsWith('train/')).sort()));
ok('nothing outside train/ was written', before===after);
ok('no real trip, commission or lead touched', await p.evaluate(()=>!Object.keys(window.__store).some(k=>/^(desk|status|payouts|leads|audit)\//.test(k)&&/TRN|r[0-9a-z]{6,}/.test(k))));
// owner sees team training
const st=await p.evaluate(()=>window.__store);mk('ttro.html','u_owner',true,true,st);
const q=await b.newPage({viewport:{width:1400,height:950}});q.on('pageerror',e=>errs.push('O:'+e.message));await q.goto('http://localhost:8765/ttro.html');await q.waitForTimeout(2500);
await q.evaluate(()=>{S.view='training';render();});await q.waitForTimeout(1200);
ok('owner sees team training table', /Team training/.test(await q.textContent('#main'))&&/Example Broker|Broker/.test(await q.textContent('#main')));
// phone
const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await m.goto('http://localhost:8765/ttr.html');await m.waitForTimeout(2000);
await m.evaluate(()=>{S.view='training';S.trSel=Object.keys(S.trRuns)[0];render();});await m.waitForTimeout(500);
ok('no sideways scroll on phone', await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
await m.screenshot({path:'tr_phone.png'});
console.log('errors',errs);console.log(Object.values(R).every(Boolean)?'ALL PASS':'SOME FAILED');await b.close();})();
