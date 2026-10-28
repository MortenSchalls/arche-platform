// Invite from Team: owner enters name and email, the portal calls /api/invite (answered here by a stand-in), shows the
// result with the personal link to copy, and lists the invitation. Not shown to brokers. Example data only.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const errs=[];const open=async(as,mode)=>{const p=await b.newPage({viewport:{width:1300,height:1000}});p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/api/invite',async r=>{const body=JSON.parse(r.request().postData()||'{}');p.lastBody=body;await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mode==='fail'?{ok:true,sent:'not sent: refused by Resend (403)',link:'https://example.com/one-time-link'}:{ok:true,sent:'sent',link:'https://example.com/one-time-link'})});});
  await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(3500);await p.evaluate(()=>{S.view='team';render();});await p.waitForTimeout(600);return p;};
let p=await open('owner');
ok('owner sees "Invite someone to join" on Team',await p.evaluate(()=>!!document.getElementById('invPanel')));
await p.fill('#inv_name','Example Person');await p.fill('#inv_mail','example.person@example.com');await p.click('#joinInvForm button[type=submit]');await p.waitForTimeout(800);
ok('sends name and email to the invitation service',p.lastBody&&p.lastBody.name==='Example Person'&&p.lastBody.email==='example.person@example.com',p.lastBody);
ok('says the invitation was emailed and offers the link',await p.evaluate(()=>/Invitation emailed to example.person@example.com/.test(document.getElementById('invResult').innerText)&&!!document.querySelector('[data-inv="copy"]')));
await p.close();
p=await open('owner','fail');await p.fill('#inv_name','Example Person');await p.fill('#inv_mail','example.person@example.com');await p.click('#joinInvForm button[type=submit]');await p.waitForTimeout(800);
ok('email refused: login created, owner told to send the link',await p.evaluate(()=>/Login created[\s\S]*Send this personal link yourself/.test(document.getElementById('invResult').innerText)));await p.close();
p=await open('broker');ok('brokers do not see invitations',await p.evaluate(()=>!document.getElementById('invPanel')));await p.close();
p=await open('owner');await p.setViewportSize({width:390,height:900});await p.waitForTimeout(400);ok('no sideways scroll at 390 px',await p.evaluate(()=>document.documentElement.scrollWidth<=390));await p.close();
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
