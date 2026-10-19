const {chromium}=require('playwright');const fs=require('fs');
const mock=fs.readFileSync('mock2.js','utf8');
const html=fs.readFileSync('archē-broker-portal.html','utf8').replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js');
const seed=JSON.parse(fs.readFileSync('seed4.json','utf8'));
const mk=(f,uid,owner,edit,sd)=>fs.writeFileSync(f,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html.replace('<script>\n"use strict";',`<script>window.__SEED=${JSON.stringify(sd)};window.__OWNER=${owner};window.__EDIT=${edit};window.__UID="${uid}";${mock}</script><script>\n"use strict";`)+'</body></html>');
mk('tap_o.html','u_owner',true,true,seed);mk('tap_ops.html','u_ops',false,true,Object.assign({},seed,{'roster/u_ops':{contractName:'Ops One',role:'ops',active:true}}));
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vp,nmx] of [[{width:1400,height:950},'d'],[{width:390,height:844},'m']]){
const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/tap_o.html');await p.waitForTimeout(2500);
await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(300);
const n=await p.evaluate(()=>allTrips().filter(apNeeds).length);
ok(nmx+' trips needing approval '+n, n>=1);
const t=await p.textContent('#main'); ok(nmx+' today shows approve cards', /Bookings to approve/.test(t)&&/Approve booking/.test(t)&&/Archē margin/.test(t));
await p.evaluate(()=>document.getElementById('apList').scrollIntoView());await p.waitForTimeout(200);await p.screenshot({path:`ap_${nmx}.png`});
if(nmx==='d'){
 const first=await p.getAttribute('[data-ap="ok"]','data-id');
 await p.click('[data-ap="no"]');await p.waitForTimeout(200); ok('changes needs note', await p.evaluate(id=>!(window.__store['status/'+id.split('|')[0]+'/deals/'+id.split('|')[1]]||{}).approval,first));
 await p.click('[data-ap="ok"]');await p.waitForTimeout(500);
 ok('approval stored', await p.evaluate(id=>{const [b,d]=id.split('|');return ((window.__store[`status/${b}/deals/${d}`]||{}).approval||{}).state==='approved'},first));
 ok('approved trip leaves list', await p.evaluate(id=>!allTrips().filter(apNeeds).some(t=>t.bid+'|'+t.did===id),first));
}
await p.close();}
// ops cannot issue unapproved
const q=await b.newPage({viewport:{width:1400,height:950}});q.on('pageerror',e=>errs.push('ops:'+e.message));
await q.goto('http://localhost:8765/tap_ops.html');await q.waitForTimeout(2500);
const id=await q.evaluate(()=>{const t=allTrips().find(apNeeds);return t&&t.did});
if(id){await q.evaluate(d=>{S.view='queue';S.sel=d;render();},id);await q.waitForTimeout(400);
 ok('ops sees waiting for approval', /Waiting for the owner's approval/.test(await q.textContent('#main')));
 const before=await q.evaluate(d=>JSON.stringify(Object.entries(window.__store).filter(([k])=>k.endsWith(d))),id);
 const has=await q.$('[data-act="issue"]'); if(has){await q.click('[data-act="issue"]');await q.waitForTimeout(300);}
 ok('ops issue blocked', before===await q.evaluate(d=>JSON.stringify(Object.entries(window.__store).filter(([k])=>k.endsWith(d))),id));
} else ok('ops test trip found', false);
console.log('ERRORS',JSON.stringify(errs.slice(0,5)));await b.close();})();
