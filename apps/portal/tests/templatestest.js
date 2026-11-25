// Email templates (Morten, 25 Nov 2026, peer proposal P5): the first message to a named contact on a lead says where we
// found the details and offers an opt-out; the options and a chase open written in the broker's own email. Nothing is sent
// by the portal. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const B1='00000000-0000-0000-0000-0000000000b1';
const T={profiles:[{id:B1,role:'broker',active:true,contract_name:'Example Broker',data:{roster:true}}],config:[{key:'terms',value:{margin:0.09,unit:45000,threshold:8,rate1:0.27,rate2:0.35}}],
 trips:[{owner_id:B1,id:'t1',data:{client:{name:'Example Client',email:'client@example.com'},stage:'quoted',created:new Date().toISOString(),quote:{operator:'Example Air',aircraft:'Example Jet One',opPrice:40000,direct:1000},trip:{legs:[{from:'WSSL',to:'RJTT',date:'2026-12-14',pax:'7'}]},checks:{}}}],
 leads:[{owner_id:B1,id:'p1',data:{org:'Example Holdings',status:'assigned',country:'Singapore',contacts:[{name:'Example Contact',role:'Head of Travel',email:'travel@example-holdings.example',sourceType:"Organisation's own website",source:'https://www.example-holdings.example/team',added:new Date().toISOString()}]}}],
 trip_status:[],prospects:[],optouts:[],intel:[]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
(async()=>{const b=await chromium.launch();const errs=[];const f='t_tpl.html';fs.writeFileSync(f,page(B1,T));
 const p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(3500);
 await p.evaluate(()=>{S.view='trips';S.sel='t1';render();});await p.waitForTimeout(400);
 const hrefs=await p.$$eval('#tplRow a',as=>as.map(a=>decodeURIComponent(a.getAttribute('href'))));
 ok('trip: options and chase open in email, addressed to the client',hrefs.length===2&&hrefs.every(h=>h.startsWith('mailto:client@example.com')),hrefs);
 ok('the options email carries the client price',/45,055/.test(hrefs[0]||''));
 const fm=await p.evaluate(()=>decodeURIComponent(tplFirstMessage(S.leads.p1||{org:'Example Holdings'},{name:'Example Contact',role:'Head of Travel',email:'travel@example-holdings.example',sourceType:"Organisation's own website",source:'https://www.example-holdings.example/team'})));
 ok('first message says where we found the details',/We found your details on example-holdings\.example, Example Holdings's own website/.test(fm),fm.slice(0,400));
 ok('first message offers an opt-out',/reply "no thanks" and we will delete your details/.test(fm));
 ok('first message is addressed to the work email only',fm.startsWith('mailto:travel@example-holdings.example?'));
 ok('the portal sends nothing: no send button in the templates',!(await p.$('#tplRow button')));
 ok('no page errors',!errs.length,errs);fs.unlinkSync(f);console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
