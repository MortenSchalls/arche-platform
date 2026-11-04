// Market reading on Training (Morten, 2 Nov 2026): AvBuyer free digital edition link with a sign-up note, for every role. Example data only.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,200)));if(!c)fails++;};const errs=[];
for(const as of ['broker','ops','owner']){const p=await b.newPage({viewport:{width:1300,height:1000}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(3500);await p.evaluate(()=>{S.view='training';render();});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const el=document.getElementById('readingPanel');if(!el)return null;const a=el.querySelector('a');return {t:el.innerText,href:a&&a.href,target:a&&a.target,rel:a&&a.rel};});
 ok(as+': AvBuyer panel on Training',!!r,r);
 ok(as+': link to the free digital edition, new tab, no referrer',r&&r.href==='https://www.avbuyer.com/magazines/avbuyer'&&r.target==='_blank'&&/noopener/.test(r.rel)&&/noreferrer/.test(r.rel),r);
 ok(as+': sign-up note with Archē email and the copyright rule',r&&/free digital edition/i.test(r.t)&&/Archē email/i.test(r.t)&&/do not download, copy or forward/i.test(r.t),r&&r.t);
 await p.setViewportSize({width:390,height:900});await p.waitForTimeout(300);ok(as+': no sideways scroll at 390 px',await p.evaluate(()=>document.documentElement.scrollWidth<=390));await p.close();}
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
