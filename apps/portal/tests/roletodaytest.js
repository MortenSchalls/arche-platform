// Today for brokers and operations: first page, tasks, flights today/tomorrow, waiting, payments, pool; collapsible. Example data.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const errs=[];
async function open(as,w){const p=await b.newPage({viewport:{width:w||1300,height:1000}});p.on('pageerror',e=>errs.push(as+': '+e.message));await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(3000);return p;}
const tomorrow=new Date(Date.now()+864e5).toLocaleDateString('en-CA'), in10=new Date(Date.now()+10*864e5).toLocaleDateString('en-CA');
// an example confirmed trip flying tomorrow (broker's), written into the example data
const seed=async p=>p.evaluate(async([d1,d2])=>{const B='00000000-0000-4000-8000-0000000000a3';
  await S.db.doc(`desk/${B}/deals/x1`).set({client:{name:'Anna Example',company:'Example Holdings'},trip:{legs:[{from:'WSSL',to:'VTSP',date:d1,time:'10:00',pax:4}]},quote:{operator:'Example Jets Pte Ltd',opPrice:30000,tail:'9V-EXA'},created:new Date().toISOString(),updated:new Date().toISOString()});
  await S.db.doc(`status/${B}/deals/x1`).set({state:'issued',issuedAt:new Date().toISOString(),price:33000,legStatus:[{s:'delay',at:'',note:'Slot at 10:40'}]});
  await S.db.doc(`desk/${B}/deals/x2`).set({client:{name:'Ben Example'},trip:{legs:[{from:'WSSS',to:'VHHH',date:d2,time:'09:00',pax:2}]},quote:{operator:'Example Air',opPrice:20000},created:new Date().toISOString(),updated:new Date().toISOString(),submittedAt:new Date().toISOString()});
  await S.db.doc(`status/${B}/deals/x2`).set({state:'review'});},[tomorrow,in10]);
const B=await open('broker');await seed(B);await B.waitForTimeout(1500);await B.reload();await B.waitForTimeout(3000);
ok('broker lands on Today',await B.evaluate(()=>S.view==='today'&&/^Today/.test(document.querySelector('#main h1').textContent)));
ok('Today is first in the broker menu, no separate Dashboard',await B.evaluate(()=>navItems()[0][0]==='today'&&!navItems().some(i=>i[0]==='home')));
ok('Today shows progress this month (formerly the Dashboard)',await B.evaluate(()=>/Progress this month[\s\S]*Standard bookings this month[\s\S]*Trips confirmed, last 6 months/i.test(document.querySelector('#main').innerText)));
ok('New enquiry button on Today',await B.evaluate(()=>!!document.querySelector('#main [data-act="new"]')));
ok('broker sees the flight tomorrow',await B.evaluate(()=>/Tomorrow 10:00[\s\S]*WSSL → VTSP[\s\S]*Example Holdings/.test(document.querySelector('#main').innerText)));
ok('broker sees the file waiting on operations',await B.evaluate(()=>/With operations: Ben Example/.test(document.querySelector('#main').innerText)));
ok('broker sees the enquiry pool section',await B.evaluate(()=>/Open enquiries in the pool/.test(document.querySelector('#main').innerText)));
ok('sections are collapsible',await B.evaluate(()=>document.querySelectorAll('#main div[data-clp]').length>=4&&!!document.querySelector('[data-clpall]')));
ok('flight row shows the status in red with the note and registration',await B.evaluate(()=>{const c=[...document.querySelectorAll('#main .chip.c-returned')].find(x=>x.textContent==='Delayed');return !!c&&/Slot at 10:40/.test(document.querySelector('#main').innerText)&&/9V-EXA/.test(document.querySelector('#main').innerText);}));
ok('Track link opens the aircraft by registration in a new tab',await B.evaluate(()=>{const a=document.querySelector('#main a[data-trk]');return !!a&&a.href==='https://www.flightradar24.com/data/aircraft/9v-exa'&&a.target==='_blank'&&/noopener/.test(a.rel);}));
await B.click('[data-clpall="1"]');await B.waitForTimeout(300);
await B.context().route('**/*flightradar24.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<title>tracker</title>example'}));
{const [pop]=await Promise.all([B.waitForEvent('popup',{timeout:5000}).catch(()=>null),B.click('#main a[data-trk]')]);
 ok('Track opens a small window, not a new full tab',!!pop&&/flightradar24\.com\/data\/aircraft\/9v-exa/.test(pop.url())&&await pop.evaluate(()=>innerWidth<=700),pop&&pop.url());
 ok('the portal stays on Today',await B.evaluate(()=>S.view==='today'));
 const [pop2]=await Promise.all([B.waitForEvent('popup',{timeout:3000}).catch(()=>null),B.evaluate(()=>document.querySelector('#main a[data-trk]').click())]);
 await B.waitForTimeout(500);ok('clicking Track again reuses the same window',!pop2&&!pop.isClosed());if(pop&&!pop.isClosed())await pop.close();}
await B.evaluate(()=>{S.view='home';render();});await B.waitForTimeout(500);ok('an old Dashboard link lands on Today',await B.evaluate(()=>S.view==='today'));
const O=await open('ops');await seed(O);await O.evaluate(()=>{S.view='today';render();});await O.waitForTimeout(1500);
ok('operations lands on Today with its own sections',await O.evaluate(()=>navItems()[0][0]==='today'&&/Client payments outstanding/.test(document.querySelector('#main').innerText)));
ok('operations sees the payment with the balance date',await O.evaluate(()=>/Example Holdings: first flight/.test(document.querySelector('#main').innerText)));
ok('operations Today shows the operations figures and no Dashboard',await O.evaluate(()=>/Progress this month[\s\S]*Waiting for operations/i.test(document.querySelector('#main').innerText)&&!navItems().some(i=>i[0]==='home')));
ok('operations sees the file to check',await O.evaluate(()=>/Files to check/i.test(document.querySelector('#main').innerText)));
ok('flight following has tracking links (Flightradar24, FlightAware, ADS-B Exchange)',await O.evaluate(()=>{const t=allTrips().find(t=>t.did==='x1');const h=followBlock(t);return /data-track="9V-EXA"/.test(h)&&h.includes('flightaware.com/live/flight/9VEXA')&&h.includes('globe.adsbexchange.com/?reg=9V-EXA');}));
ok('no registration: the file asks for it',await O.evaluate(()=>{const t=allTrips().find(t=>t.did==='x1');return /Add the aircraft registration/.test(trackLinks({d:{quote:{}}}))&&/Add the aircraft registration/.test(trackLinks({d:{quote:{tail:'bad reg!!'}}}));}));
await O.evaluate(()=>{const t=allTrips().find(t=>t.did==='x1');S.view='queue';S.sel=t.did;render();});await O.waitForTimeout(800);
const hasF=await O.evaluate(()=>!!document.getElementById('lg_s0'));
if(hasF){await O.selectOption('#lg_s0','dep');await O.click('[data-ac="legSave"]');await O.waitForTimeout(1200);
  ok('saving a new status records when it changed (for the alert)',await O.evaluate(()=>{const t=allTrips().find(t=>t.did==='x1');const x=(t.st.legStatus||[])[0]||{};return x.s==='dep'&&!!x.set&&Date.now()-Date.parse(x.set)<60000;}));
  const set1=await O.evaluate(()=>allTrips().find(t=>t.did==='x1').st.legStatus[0].set);await O.waitForTimeout(300);await O.click('[data-ac="legSave"]');await O.waitForTimeout(1200);
  ok('saving again without a change keeps the time (no second alert)',await O.evaluate(s=>allTrips().find(t=>t.did==='x1').st.legStatus[0].set===s,set1));}
else ok('ops can edit flight following in the file',false,'no lg_s0');
const W=await open('owner');ok('owner Today unchanged',await W.evaluate(()=>{S.view='today';render();return /Your decisions/.test(document.querySelector('#main').innerText)&&!/Client payments outstanding/.test(document.querySelector('#main').innerText);}));
const P=await open('broker',390);ok('no sideways scroll at 390 px',await P.evaluate(()=>document.documentElement.scrollWidth<=390));
await B.evaluate(()=>{S.view='today';render();});await B.waitForTimeout(600);await B.screenshot({path:'/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/today-broker.png'});await O.screenshot({path:'/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/today-ops.png'});
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
