// Today for brokers and operations: first page, tasks, flights today/tomorrow, waiting, payments, pool; collapsible. Example data.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const errs=[];
async function open(as,w){const p=await b.newPage({viewport:{width:w||1300,height:1000}});p.on('pageerror',e=>errs.push(as+': '+e.message));await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(3000);return p;}
const tomorrow=new Date(Date.now()+864e5).toLocaleDateString('en-CA'), in10=new Date(Date.now()+10*864e5).toLocaleDateString('en-CA');
// an example confirmed trip flying tomorrow (broker's), written into the example data
const seed=async p=>p.evaluate(async([d1,d2])=>{const B='00000000-0000-4000-8000-0000000000a3';
  await S.db.doc(`desk/${B}/deals/x1`).set({client:{name:'Anna Example',company:'Example Holdings'},trip:{legs:[{from:'WSSL',to:'VTSP',date:d1,time:'10:00',pax:4}]},quote:{operator:'Example Jets Pte Ltd',opPrice:30000},created:new Date().toISOString(),updated:new Date().toISOString()});
  await S.db.doc(`status/${B}/deals/x1`).set({state:'issued',issuedAt:new Date().toISOString(),price:33000});
  await S.db.doc(`desk/${B}/deals/x2`).set({client:{name:'Ben Example'},trip:{legs:[{from:'WSSS',to:'VHHH',date:d2,time:'09:00',pax:2}]},quote:{operator:'Example Air',opPrice:20000},created:new Date().toISOString(),updated:new Date().toISOString(),submittedAt:new Date().toISOString()});
  await S.db.doc(`status/${B}/deals/x2`).set({state:'review'});},[tomorrow,in10]);
const B=await open('broker');await seed(B);await B.waitForTimeout(1500);await B.reload();await B.waitForTimeout(3000);
ok('broker lands on Today',await B.evaluate(()=>S.view==='today'&&/^Today/.test(document.querySelector('#main h1').textContent)));
ok('Today is first in the broker menu, Dashboard still there',await B.evaluate(()=>navItems()[0][0]==='today'&&navItems().some(i=>i[0]==='home')));
ok('broker sees the flight tomorrow',await B.evaluate(()=>/Tomorrow 10:00[\s\S]*WSSL → VTSP[\s\S]*Example Holdings/.test(document.querySelector('#main').innerText)));
ok('broker sees the file waiting on operations',await B.evaluate(()=>/With operations: Ben Example/.test(document.querySelector('#main').innerText)));
ok('broker sees the enquiry pool section',await B.evaluate(()=>/Open enquiries in the pool/.test(document.querySelector('#main').innerText)));
ok('sections are collapsible',await B.evaluate(()=>document.querySelectorAll('#main div[data-clp]').length>=4&&!!document.querySelector('[data-clpall]')));
await B.click('[data-view="home"]');await B.waitForTimeout(800);ok('Dashboard button opens the Dashboard',await B.evaluate(()=>S.view==='home'));
const O=await open('ops');await seed(O);await O.evaluate(()=>{S.view='today';render();});await O.waitForTimeout(1500);
ok('operations lands on Today with its own sections',await O.evaluate(()=>navItems()[0][0]==='today'&&/Client payments outstanding/.test(document.querySelector('#main').innerText)));
ok('operations sees the payment with the balance date',await O.evaluate(()=>/Example Holdings: first flight/.test(document.querySelector('#main').innerText)));
ok('operations sees the file to check',await O.evaluate(()=>/Files to check/i.test(document.querySelector('#main').innerText)));
const W=await open('owner');ok('owner Today unchanged',await W.evaluate(()=>{S.view='today';render();return /Your decisions/.test(document.querySelector('#main').innerText)&&!/Client payments outstanding/.test(document.querySelector('#main').innerText);}));
const P=await open('broker',390);ok('no sideways scroll at 390 px',await P.evaluate(()=>document.documentElement.scrollWidth<=390));
await B.evaluate(()=>{S.view='today';render();});await B.waitForTimeout(600);await B.screenshot({path:'/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/today-broker.png'});await O.screenshot({path:'/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/today-ops.png'});
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
