// Options for the client (Morten, 25 Nov 2026, peer proposal P2): up to two more aircraft beside the main quote, each priced
// like the main one (÷ 0.91), copied for the client, and one made main when the client chooses it. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const B1='00000000-0000-0000-0000-0000000000b1';
const T={profiles:[{id:B1,role:'broker',active:true,contract_name:'Example Broker',data:{roster:true}}],config:[{key:'terms',value:{margin:0.09,unit:45000,threshold:8,rate1:0.27,rate2:0.35}}],
 trips:[{owner_id:B1,id:'t1',data:{client:{name:'Example Client'},stage:'quoted',created:new Date().toISOString(),quote:{operator:'Example Air',opCountry:'Switzerland',aircraft:'Example Jet One',opPrice:40000,direct:1000,directOwn:1000},trip:{legs:[{from:'WSSL',to:'RJTT',date:'2026-12-14',pax:'7'}]},checks:{}}}],trip_status:[],leads:[],prospects:[],optouts:[],intel:[]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
(async()=>{const b=await chromium.launch();const errs=[];const f='t_opt.html';fs.writeFileSync(f,page(B1,T));
 const p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>{errs.push(e.message);console.log('STACK',e.stack.slice(0,500))});await p.goto('http://localhost:8765/'+f+'?steps=all');await p.waitForTimeout(3500);
 await p.evaluate(()=>{S.view='trips';S.sel='t1';render();});await p.waitForTimeout(500);
 ok('the trip shows Options for the client with the main quote',(await p.textContent('#secOptions')).includes('Example Jet One'));
 await p.click('[data-alt="add|0"]');await p.waitForTimeout(200);
 await p.fill('#al_op','Example Air Two');await p.fill('#al_ac','Example Jet Two');await p.fill('#al_au','ARGUS Platinum');await p.fill('#al_pr','50000');await p.fill('#al_dc','1000');
 await p.click('#altForm button[type=submit]');await p.waitForTimeout(600);
 const alts=await p.evaluate(()=>tripById('t1').d.alts);ok('option saved on the trip',alts&&alts.length===1&&alts[0].aircraft==='Example Jet Two',alts);
 ok('its client price is (50,000 + 1,000) ÷ 0.91 = 56,044',(await p.textContent('#secOptions')).includes('56,044'));
 const txt=await p.evaluate(()=>optionsText(tripById('t1')));ok('copy text lists both options with client prices',/1\. Example Jet One.*45,055/.test(txt)&&/2\. Example Jet Two.*56,044/.test(txt),txt);
 await p.evaluate(async()=>{const t=tripById('t1');await deskWrite(t,{safety:{audit:'argus-plat',aircraft:t.d.quote.aircraft},opTerms:{scale:[{pct:10}]}},'example safety');});await p.waitForTimeout(400);
 await p.evaluate(async()=>{const t=tripById('t1');await deskWrite(t,{docs:[...(t.d.docs||[]),{id:'u/trips/x/t1/aoc',kind:'AOC',name:'aoc.pdf',at:now(),by:S.uid}]},'example AOC');});await p.waitForTimeout(400);
 await p.click('[data-alt="main|0"]');await p.waitForTimeout(600);
 ok('the old operator\'s AOC does not count for the new main operator',await p.evaluate(()=>{const d=tripById('t1').d;return (d.docs||[]).some(x=>x.kind==='AOC'&&x.op&&x.op!==d.quote.operator)&&!(d.docs||[]).some(x=>x.kind==='AOC'&&(!x.op||x.op===d.quote.operator))}));
 const d=await p.evaluate(()=>tripById('t1').d);ok('making it main swaps the quote and keeps the old one as an option',d.quote.aircraft==='Example Jet Two'&&d.quote.opPrice===50000&&d.alts[0].aircraft==='Example Jet One'&&d.alts[0].opPrice===40000,{q:d.quote,a:d.alts});
 ok('the old operator\'s safety record and terms go with its option',!!(d.alts[0].safety&&d.alts[0].safety.audit==='argus-plat'&&d.alts[0].opTerms),d.alts[0]);
 await p.click('[data-alt="main|0"]');await p.waitForTimeout(600);
 const d2=await p.evaluate(()=>tripById('t1').d);ok('making it main again brings its safety record and terms back',d2.quote.aircraft==='Example Jet One'&&d2.safety&&d2.safety.audit==='argus-plat'&&!!d2.opTerms,{s:d2.safety,q:d2.quote.aircraft});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);ok('no sideways scroll at 390 px',await p.evaluate(()=>document.documentElement.scrollWidth<=391));
 ok('no page errors',!errs.length,errs);fs.unlinkSync(f);console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
