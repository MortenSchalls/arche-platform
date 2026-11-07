// The AI rule beside every AI box (Morten, 7 Nov 2026; manual 3.7, H.16): outside provider; no passport, ID or bank
// numbers, passenger names or private contact details. Example data only.
const {chromium}=require('playwright');
(async()=>{let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/test.html?as=broker');await p.waitForTimeout(3000);
const rule=()=>p.evaluate(()=>[...document.querySelectorAll('.ai-rule')].map(e=>e.innerText).join(' | '));
await p.evaluate(()=>{const el=document.querySelector('[data-view="assistant"]');if(el)el.click();});await p.waitForTimeout(800);
const a=await rule();ok('Assistant shows the AI rule',/outside provider/.test(a)&&/passport, ID or bank numbers/.test(a),a);
await p.evaluate(()=>{const el=document.querySelector('[data-view="training"]');if(el)el.click();});await p.waitForTimeout(800);
await p.evaluate(()=>{const el=[...document.querySelectorAll('button,a')].find(x=>/Roleplay lab/i.test(x.textContent));if(el)el.click();});await p.waitForTimeout(800);
const r=await rule();ok('Roleplay lab shows the AI rule',/outside provider/.test(r),r);
const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
ok('co-pilot no longer says client names are never sent; it says trip facts only',!/Client names and contact details are not sent to the co-pilot/.test(src)&&/sent the trip facts only: no passenger names or contact details/.test(src));
ok('the trip sent to the AI names no payment provider',!/paynodeRequest/.test(src.slice(src.indexOf('function tripForAI'),src.indexOf('function tripForAI')+1500)));
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
