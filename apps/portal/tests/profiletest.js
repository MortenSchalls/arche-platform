// My profile: every role has it; joining people reach it from their steps; contact details saved; password form checks. Example data.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const errs=[];const open=async(as,w)=>{const p=await b.newPage({viewport:{width:w||1300,height:1000}});p.on('pageerror',e=>errs.push(as+': '+e.message));await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(3500);return p;};
for(const as of ['owner','ops','broker']){const p=await open(as);ok(as+': My profile in the menu',await p.evaluate(()=>navItems().some(i=>i[0]==='profile')));await p.close();}
const p=await open('broker');await p.evaluate(()=>{S.view='profile';render();});await p.waitForTimeout(900);
ok('shows what Archē holds and the editable details',await p.evaluate(()=>/What Archē holds[\s\S]*Name on your agreement/i.test(document.querySelector('#main').innerText)&&!!document.getElementById('pr_mob')));
await p.fill('#pr_mob','+65 0000 0000');await p.selectOption('#pr_tz','Asia/Singapore');await p.click('#prForm button[type=submit]');await p.waitForTimeout(800);
ok('contact details saved to the person\'s own profile',await p.evaluate(async()=>{const d=(await S.db.doc('roster/'+S.uid).get()).data()||{};return (d.self||{}).mobile==='+65 0000 0000'&&(d.self||{}).timezone==='Asia/Singapore';}));
await p.fill('#pr_mob','not a phone');await p.click('#prForm button[type=submit]');await p.waitForTimeout(300);
await p.fill('#pr_p1','short');await p.fill('#pr_p2','short');await p.click('#prPw button[type=submit]');await p.waitForTimeout(300);
ok('password: too short is refused',await p.evaluate(()=>/At least 10/.test(document.getElementById('toast').textContent)));
await p.setViewportSize({width:390,height:900});await p.waitForTimeout(300);ok('no sideways scroll at 390 px',await p.evaluate(()=>document.documentElement.scrollWidth<=390));await p.close();
const c=await open('candidate');ok('joining: a "My profile and password" button',await c.evaluate(()=>!!document.querySelector('[data-pr="open"]')));
await c.click('[data-pr="open"]');await c.waitForTimeout(800);ok('joining: opens My profile, with a way back',await c.evaluate(()=>/My profile/.test(document.querySelector('#main h1').textContent)&&!!document.querySelector('[data-pr="back"]')));
await c.click('[data-pr="back"]');await c.waitForTimeout(500);ok('back to the joining steps',await c.evaluate(()=>/Join Archē/.test(document.querySelector('#main').innerText)));
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
