// Live training in the real portal (src-modules/livetrain.js) on the test page with a local relay instead of Realtime:
// owner chooses watchers and pages; other pages pause; investor list, Security, Settings never shared; contacts masked.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const pages={};const BRK="00000000-0000-4000-8000-0000000000a3";
const stub=`window.__LIVE_TEST=1;addEventListener('DOMContentLoaded',()=>{const sb=window.__sb;if(!sb)return;sb.realtime={setAuth(){}};const orig=sb.channel.bind(sb);sb.channel=(name,o)=>{if(!/^train:/.test(name))return orig(name,o);const h={};const c={on(t,f,fn){(h[f.event]=h[f.event]||[]).push(fn);return c;},subscribe(cb){window.__deliver=(ev,p)=>(h[ev]||[]).forEach(fn=>fn({payload:p}));window.__topic=name;setTimeout(()=>cb('SUBSCRIBED'),50);return c;},send(m){window.__relay(window.__who,m.event,m.payload);}};return c;};sb.removeChannel=async()=>{};});`;
async function mk(who,as){const ctx=await b.newContext({viewport:{width:1300,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.exposeFunction('__relay',async(from,ev,payload)=>{for(const [k,o] of Object.entries(pages)) if(k!==from) await o.evaluate(([e,pl])=>window.__deliver&&window.__deliver(e,pl),[ev,payload]).catch(()=>{});});
 await p.addInitScript(`window.__who=${JSON.stringify(who)};`+stub);await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(2500);pages[who]=p;p.__errs=errs;return p;}
const M=await mk('owner','owner');
// an example trip with a client email and phone, so masking can be checked
await M.evaluate(()=>{S.view='training';S.trTab='live';render();});await M.waitForTimeout(800);
ok('Training → Live training shows the panel',await M.evaluate(()=>!!document.getElementById('lvPanel')));
ok('Team no longer has the panel',await M.evaluate(async()=>{S.view='team';render();await new Promise(r=>setTimeout(r,500));const x=!document.getElementById('lvPanel');S.view='training';S.trTab='live';render();await new Promise(r=>setTimeout(r,500));return x;}));
ok('every active member with a role can be chosen (operations, both brokers)',await M.evaluate(()=>document.querySelectorAll('[data-lvw]').length===3));
ok('Security and Settings cannot be chosen',await M.evaluate(()=>!document.querySelector('[data-lvs="security"]')&&!document.querySelector('[data-lvs="settings"]')));
ok('nothing is pre-selected',await M.evaluate(()=>!document.querySelector('[data-lvs]:checked,[data-lvw]:checked')));
await M.click('[data-lv="start"]');await M.waitForTimeout(300);ok('start refused without a watcher',await M.evaluate(()=>!(S.live&&S.live.id)));
await M.check(`[data-lvw="${BRK}"]`);await M.check('[data-lvs="trips"]');await M.check('[data-lvs="prospects"]');await M.selectOption('#lvHours','2');
await M.click('[data-lv="start"]');await M.waitForTimeout(1000);
const live=await M.evaluate(()=>S.live);ok('session stored with watcher, pages and end time',!!live&&live.watchers.length===1&&live.watchers[0]===BRK&&live.scope.join()==='trips,prospects'&&live.until>new Date().toISOString(),live);
// watcher: same session in her own (separate) example database
const N=await mk('natalia','broker');
await N.evaluate(async l=>{await S.db.doc('config/live').set(l);},live);await N.waitForTimeout(1200);
ok('watcher sees a Watch banner',await N.evaluate(()=>!!document.querySelector('[data-lv="watch"]')));
await N.click('[data-lv="watch"]');await N.waitForTimeout(1500);
ok('on Team (not shared) the watcher sees a pause',await N.evaluate(()=>/did not share/.test(document.getElementById('lvMsg').textContent)));
ok('the pause message is visible, not covered by the frame',await N.evaluate(()=>{const m=document.getElementById('lvMsg'),f=document.getElementById('lvFrame');return getComputedStyle(m).display!=='none'&&(getComputedStyle(f).visibility==='hidden'||!f.style.width);}));
ok('owner bar says this page is not shared',await M.evaluate(()=>/Not shared/.test(document.getElementById('lvOwnerBar').textContent)));
await M.evaluate(()=>{S.view='trips';render();});await M.waitForTimeout(600);
await M.evaluate(()=>{const d=document.createElement('div');d.innerHTML='<p>Client Anna Example, anna@example.com, +65 6123 4567</p><input id="e_em" value="anna@example.com">';document.body.appendChild(d);});await M.waitForTimeout(1500);
const txt=await N.evaluate(()=>document.getElementById('lvFrame').contentDocument.body.innerHTML);
ok('watcher sees the shared Trips page',/Anna Example/.test(txt));
ok('client email is masked',!/anna@example\.com/.test(txt)&&/•••/.test(txt));
ok('phone masked and typed contact field masked',!/6123 4567/.test(txt)&&/id="e_em" value="•••"/.test(txt));
await M.evaluate(()=>{S.view='prospects';S.pSec='inv';render();});await M.waitForTimeout(1500);
ok('investor list never shared, even on a shared page',await N.evaluate(()=>/investor and partner list/.test(document.getElementById('lvMsg').textContent)));
await M.evaluate(()=>{S.view='settings';render();});await M.waitForTimeout(1200);
ok('Settings never shared',await N.evaluate(()=>/never shared/.test(document.getElementById('lvMsg').textContent)));
ok('mask: phone numbers',await M.evaluate(()=>{const d=document.createElement('div');d.innerHTML='<p>Call +65 6123 4567 or 0045 12 34 56 78</p><a href="tel:+6561234567">x</a><input id="e_ph" value="+66 81 234 5678">';liveMask(d);return !/\d{4}/.test(d.innerHTML.replace(/2026|\d{4}-\d{2}/g,''));}));
ok('mask keeps dates and prices',await M.evaluate(()=>{const d=document.createElement('div');d.innerHTML='<p>2026-11-20 · USD 40,000 · 4 pax</p>';liveMask(d);return /2026-11-20/.test(d.innerHTML)&&/40,000/.test(d.innerHTML);}));
// syllabus (familiarisation chosen at the start)
const sync=async()=>{const l=await M.evaluate(()=>S.live);await N.evaluate(async l=>{await S.db.doc('config/live').set(l);},l);await N.waitForTimeout(800);};
await M.evaluate(()=>{S.view='trips';render();});await M.waitForTimeout(1000);await sync();
ok('syllabus starts with the familiarisation course',await M.evaluate(()=>S.live.syl.on&&S.live.syl.course==='fam'&&S.live.syl.idx===0));
ok('owner sees the lesson card (not sent to the watcher)',await M.evaluate(()=>/Welcome: what Archē Executive is/.test(document.getElementById('lvSylOwner').textContent)));
ok('watcher sees the syllabus beside the screen with her task',await N.evaluate(()=>{const w=document.getElementById('lvSylWatch');return !!w&&/Your task/.test(w.textContent)&&/Welcome/.test(w.textContent);}));
ok('the lesson card never appears inside the shared screen',await N.evaluate(()=>!/Task for the trainee/.test(document.getElementById('lvFrame').contentDocument.body.textContent)));
await M.click('#lvSylOwner [data-syl="done"]');await M.waitForTimeout(1200);await sync();
ok('lesson done: moves to lesson 2',await M.evaluate(()=>S.live.syl.idx===1&&S.live.syl.done.f1===true));
ok('lesson done kept in the trainee training record',await M.evaluate(()=>!!(window.__T.training_runs||[]).find(r=>r.id==='syl-fam-f1')));
ok('watcher follows to lesson 2',await N.evaluate(()=>/Finding your way in the portal/.test(document.getElementById('lvSylWatch').textContent)));
await M.click('#lvSylOwner [data-syl="go"]');await M.waitForTimeout(800);ok('Open it goes to the lesson page',await M.evaluate(()=>S.view==='help'));
await M.click('#lvOwnerBar [data-syl="toggle"]');await M.waitForTimeout(1200);await sync();
ok('syllabus off: plain screen sharing',await M.evaluate(()=>!document.getElementById('lvSylOwner')&&S.live.syl.on===false)&&await N.evaluate(()=>!document.getElementById('lvSylWatch')));
await M.click('#lvOwnerBar [data-syl="toggle"]');await M.waitForTimeout(1200);
ok('syllabus back on, progress kept',await M.evaluate(()=>S.live.syl.on&&S.live.syl.done.f1===true&&S.live.syl.idx===1));
await M.selectOption('#lvSylOwner select','full');await M.waitForTimeout(1200);
ok('switch to the full syllabus',await M.evaluate(()=>S.live.syl.course==='full'&&/Module 0/.test(document.getElementById('lvSylOwner').textContent)));
await M.evaluate(()=>{S.view='team';render();});await M.waitForTimeout(800);await M.click('#lvOwnerBar [data-lv="stop"]');await M.waitForTimeout(1000);
ok('stop ends the session',await M.evaluate(()=>!(S.live&&S.live.id)&&!document.getElementById('lvOwnerBar')));
ok('no page errors',!M.__errs.length&&!N.__errs.length,[M.__errs,N.__errs]);
console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
