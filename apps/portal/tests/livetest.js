// Live training (test version): sharer and watcher in two browsers, the realtime channel replaced by a local relay.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x)));if(!c)fails++;};
const pages={};const sizes=[];
const stub=`window.__rtLib={createClient(){return{channel(name){const h={};const c={on(t,f,fn){(h[f.event]=h[f.event]||[]).push(fn);return c;},subscribe(cb){window.__deliver=(ev,p)=>(h[ev]||[]).forEach(fn=>fn({payload:p}));setTimeout(()=>cb('SUBSCRIBED'),50);return c;},send(m){window.__relay(window.__who,m.event,m.payload);}};return c;},removeChannel:async()=>{}};}};`;
async function mk(who,as,w){const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.exposeFunction('__relay',async(from,ev,payload)=>{if(ev==='dom')sizes.push(payload.z.length);for(const [k,o] of Object.entries(pages)) if(k!==from) await o.evaluate(([e,pl])=>window.__deliver&&window.__deliver(e,pl),[ev,payload]).catch(()=>{});});
 await p.addInitScript(`window.__who=${JSON.stringify(who)};`+stub);
 await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(2500);pages[who]=p;p.__errs=errs;return p;}
const M=await mk('morten','owner',1400), N=await mk('natalia','broker',390);
await M.click('#lvShare');await M.waitForTimeout(800);
const code=await M.evaluate(()=>window.__live.code);ok('sharer gets an 8-letter code',/^[A-Z2-9]{8}$/.test(code),code);
ok('sharer bar shows the code',(await M.textContent('#lvBox')).includes(code.slice(0,4)+'-'+code.slice(4)));
await N.fill('#lvCode',code);await N.click('#lvWatch');await N.waitForTimeout(2500);
ok('watcher sees the shared screen',await N.evaluate(()=>{const f=document.getElementById('lvFrame');return !!f&&f.contentDocument.body.innerText.length>200;}));
ok('watcher sees the owner\'s Today page',await N.evaluate(()=>/Today|Good (morning|afternoon|evening)/.test(document.getElementById('lvFrame').contentDocument.body.innerText)));
ok('shared screen is scaled to the phone',await N.evaluate(()=>{const f=document.getElementById('lvFrame');return /scale\(0\.2[0-9]/.test(f.style.transform)&&f.style.width==='1400px';}));
// sharer navigates and types
await M.evaluate(()=>{S.view='trips';render();});await M.waitForTimeout(1500);
ok('watcher follows the view change',await N.evaluate(()=>/All trips|My trips/.test(document.getElementById('lvFrame').contentDocument.body.innerText)));
await M.click('[data-act="new"]');await M.waitForTimeout(800);await M.fill('#e_cn','Anna Example');await M.waitForTimeout(1200);
ok('typed values appear for the watcher',await N.evaluate(()=>{const e=document.getElementById('lvFrame').contentDocument.getElementById('e_cn');return !!e&&e.getAttribute('value')==='Anna Example';}));
await M.mouse.move(300,300);await M.waitForTimeout(300);ok('pointer shown',await N.evaluate(()=>!document.getElementById('lvPtr').hidden));
ok('no scripts run in the shared frame',await N.evaluate(()=>document.getElementById('lvFrame').getAttribute('sandbox')==='allow-same-origin'));
ok('watcher cannot click into the shared screen',await N.evaluate(()=>{const d=document.getElementById('lvFrame').contentDocument;return getComputedStyle(d.querySelector('button')).pointerEvents==='none';}));
// hand over
await N.click('#lvTake');await N.waitForTimeout(2500);
ok('watcher takes over: now sharing',await N.evaluate(()=>window.__live.role==='lead'));
ok('sharer now watches the broker screen',await M.evaluate(()=>window.__live.role==='watch'&&/Test Broker/.test(document.getElementById('lvBox').innerText)));
await M.click('#lvStop');await M.waitForTimeout(500);ok('stop watching restores the own portal',await M.evaluate(()=>!document.getElementById('lvMirror')&&window.__live.role===''));
ok('compressed screen fits a realtime message (under 200 KB)',Math.max(...sizes)<200000,Math.max(...sizes));
console.log('largest message',Math.max(...sizes),'bytes');
ok('no page errors',!M.__errs.length&&!N.__errs.length,[M.__errs,N.__errs]);
console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
