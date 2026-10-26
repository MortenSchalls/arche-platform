// Alerts: owner adds recipients (Thai number normalised), sender, owner-only. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a',B1='00000000-0000-0000-0000-0000000000b1';
const T0={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Example Owner',data:{}},{id:B1,role:'broker',active:true,contract_name:'Example Broker',data:{roster:true,onboarding:{issuedAt:'2026-10-01T00:00:00Z'}}}],
 config:[{key:'terms',value:{margin:0.09}}],intel:[],trips:[],trip_status:[],alert_settings:[],leads:[],prospects:[],optouts:[],join_requests:[],agreements:[],training_runs:[{owner_id:B1,id:'onboarding',data:{ackAt:'2026-10-02T00:00:00Z'}}]};
const page=(uid,T,missing)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>${missing?'window.__MISSING=["alert_settings"];':''}window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v)=>console.log((v?'PASS ':'FAIL ')+k);
(async()=>{const b=await chromium.launch();const errs=[];let n=0;
 const open=async(uid,T,w=1400,missing)=>{const f=`t_a_${n++}.html`;fs.writeFileSync(f,page(uid,T,missing));const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(4000);await p.evaluate(()=>{S.view=S.isOwner?'team':'home';render();});await p.waitForTimeout(500);return p;};
 let o=await open(OWN,T0,390);
 ok('Alerts panel in Team, nothing sent without the official number', (await o.textContent('#main')).includes('Alerts') && (await o.textContent('#main')).includes('not set up yet'));
 await o.click('[data-al=add]');await o.waitForTimeout(200);
 await o.selectOption('#al_who',OWN);await o.fill('#al_name','Example Owner');await o.fill('#al_phone','0800000000');
 await o.click('#alForm button[type=submit]');await o.waitForTimeout(400);
 let T=await o.evaluate(()=>window.__T);const rec=(T.alert_settings[0]||{data:{}}).data.recipients||[];
 ok('Thai local number saved as +66, all alerts on', rec.length===1&&rec[0].phone==='+66800000000'&&Object.values(rec[0].events).every(Boolean));
 ok('shown in readable form', (await o.textContent('#main')).includes('+66 80 000 0000'));
 ok('no sideways scroll at 390 px', await o.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await o.click('[data-al=add]');await o.fill('#al_name','Bad');await o.fill('#al_phone','12');await o.click('#alForm button[type=submit]');await o.waitForTimeout(300);
 T=await o.evaluate(()=>window.__T);ok('bad number refused', T.alert_settings[0].data.recipients.length===1);
 await o.click('[data-al=cancel]');await o.fill('#al_snd','+65 0000 0000');await o.click('[data-al=sender]');await o.waitForTimeout(300);
 T=await o.evaluate(()=>window.__T);ok('official number saved, not verified yet', T.alert_settings[0].data.sender.number==='+6500000000'&&!T.alert_settings[0].data.sender.verified);
 await o.close();
 const p=await open(B1,T);ok('members never see the alerts panel', !(await p.$('#alertsPanel')) && await p.evaluate(()=>!S.alerts));await p.close();
 const m=await open(OWN,T0,1400,true);ok('before SQL 0013: clear note', (await m.textContent('#main')).includes('alerts (0013)'));await m.close();
 console.log('ERRORS',JSON.stringify(errs));await b.close();for(const f of fs.readdirSync('.').filter(f=>f.startsWith('t_a_')))fs.unlinkSync(f);})();
