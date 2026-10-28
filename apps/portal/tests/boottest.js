// Opening never hangs: an error while opening, or no answer for 15 s, retries once and then shows "Try again".
// The sign-in screen is never interrupted. Example data only (test version with a slowed or broken stand-in database).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x)));if(!c)fails++;};
const page=async(init)=>{const p=await b.newPage();if(init)await p.addInitScript(init);let loads=0;p.on('framenavigated',f=>{if(f===p.mainFrame()&&!/#/.test(f.url()))loads++;});p.loads=()=>loads;await p.goto('http://localhost:8765/test.html?as=broker');return p;};
// 1. normal opening: no retry, no message
let p=await page();await p.waitForTimeout(4000);ok('normal opening shows the portal',await p.evaluate(()=>S.role==='broker'&&!document.getElementById('boot')));await p.close();
// 2. opening fails with an error: one automatic retry, then Try again
p=await page(()=>{let c;Object.defineProperty(window,'__arche',{configurable:true,get(){return c;},set(v){c={use:async n=>{if(n==='user')throw new Error('network down');return v.use(n);}};}});});
await p.waitForTimeout(6000);ok('error while opening: retried once, then "Try again" shown',p.loads()>=2&&await p.evaluate(()=>/could not open here/.test(document.body.innerText)&&!!document.querySelector('#main button')),p.loads());await p.close();
// 3. no answer at all: after 15 s retry, then Try again
p=await page(()=>{let c;Object.defineProperty(window,'__arche',{configurable:true,get(){return c;},set(v){c={use:()=>new Promise(()=>{})};}});});
await p.waitForTimeout(33000);ok('no answer: after 15 seconds a retry, then "Try again"',p.loads()>=2&&await p.evaluate(()=>/did not answer in time/.test(document.body.innerText)),p.loads());await p.close();
// 4. the sign-in screen is never reloaded
p=await page(()=>{let c;Object.defineProperty(window,'__arche',{configurable:true,get(){return c;},set(v){c={use:()=>new Promise(()=>{})};}});document.addEventListener('DOMContentLoaded',()=>{const d=document.createElement('div');d.id='archeLogin';document.body.appendChild(d);});});
await p.waitForTimeout(17000);ok('sign-in screen: no reload while someone is signing in',p.loads()===1,p.loads());await p.close();
console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
