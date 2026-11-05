// Navoryx investor relations in the owner-only investor list: overview, stage and interest, request with its sanctions
// result, invitation written and shown before sending, access without email (two clicks), withdraw. /api/ir answered by a
// stand-in. Not shown to brokers. Example data only.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const errs=[];const open=async(as,w)=>{const p=await b.newPage({viewport:{width:w||1300,height:1000}});p.on('pageerror',e=>errs.push(e.message));p.bodies=[];
  await p.route('**/api/ir',async r=>{const body=JSON.parse(r.request().postData()||'{}');p.bodies.push(body);
    if(body.action==='draft')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({subject:'Navoryx Executive: a private invitation',text:'Dear Ann,\n\nYou are invited to read our private investor briefing.\n\nKind regards,\nInvestor Relations'})});
    return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,sent:'sent'})});});
  await p.goto('http://localhost:8765/test.html?as='+as);await p.waitForTimeout(3500);
  await p.evaluate(()=>{window.__sb={auth:{getSession:async()=>({data:{session:{access_token:'example-token'}}})}};});
  if(as==='owner'){await p.evaluate(async()=>{const T='2026-11-04T08:00:00.000Z';
    await S.db.doc('owner/i001').set({org:'Example Family Office Ltd',track:'Family office or UHNW office',for:'Navoryx aircraft notes',country:'Singapore',status:'new',log:[],contacts:[{name:'Ann Example',role:'Principal',email:'ann@example-fo.com',source:'Business card or meeting',added:T}]});
    await S.db.doc('owner/i002').set({org:'Bob Example (private investor)',track:'Family office or UHNW office',for:'Navoryx aircraft notes',status:'review',selfRequested:true,log:[],contacts:[{name:'Bob Example',email:'bob@example.com',sourceType:'Own request on the Navoryx investor page'}],
      ir:{stage:'requested',access:{'bob@example.com':{approved:false,requestedAt:T}},requests:[{at:T,name:'Bob Example',email:'bob@example.com',role:'A private investor',country:'Thailand',message:'Interested in time aboard.',screening:{result:'POSSIBLE SANCTIONS MATCH',hits:[{name:'Bob Example',listed:'Robert Example',list:'OFAC'}]}}],log:[{t:T,note:'Access requested'}]}});
    await S.db.doc('owner/i003').set({org:'Example Lender',status:'talks',log:[],ir:{stage:'conversation',interest:'income',interestAt:T,access:{'cy@example-lender.com':{approved:true,at:T,opens:[T,T],codes:[T]}}}});});
    await p.waitForTimeout(800);await p.evaluate(()=>{S.view='prospects';S.pSec='inv';render();});await p.waitForTimeout(500);}
  return p;};
let p=await open('owner');
const txt=async s=>p.evaluate(s=>(document.querySelector(s)||{}).innerText||'',s);
ok('overview: waiting for you 1, access given 1, opened 1, waiting line 1',await p.evaluate(()=>{const v=k=>(document.querySelector(`[data-irf="${k}"] .v`)||{}).innerText;return v('wait')==='1'&&v('given')==='1'&&v('opened')==='1'&&v('line')==='1';}));
ok('waiting line per version',/Waiting line, in order of interest: Income 1 · Income and time aboard 0/.test(await txt('.panel')+(await p.evaluate(()=>document.body.innerText))));
await p.click('[data-irf="wait"]');await p.waitForTimeout(300);
ok('filter "waiting for you" shows only the request',await p.evaluate(()=>[...document.querySelectorAll('[data-invsel]')].map(r=>r.dataset.invsel).join()==='i002'));
await p.click('[data-invsel="i002"]');await p.waitForTimeout(300);
ok('request shows role, country, message and the sanctions result',/Requests from the investor page[\s\S]*Bob Example[\s\S]*A private investor[\s\S]*Thailand[\s\S]*POSSIBLE SANCTIONS MATCH[\s\S]*Robert Example on OFAC[\s\S]*Interested in time aboard/i.test(await txt('#irBox')));
ok('requested address offers the approval email and access without email',await p.evaluate(()=>!!document.querySelector('[data-ir="compose"][data-kind="approve"][data-em="bob@example.com"]')&&!!document.querySelector('[data-ir="plain"][data-em="bob@example.com"]')));
p.bodies=[];await p.click('[data-ir="plain"][data-em="bob@example.com"]');await p.waitForTimeout(300);
ok('access without email needs a second click',p.bodies.length===0);
await p.click('[data-ir="plain"][data-em="bob@example.com"]');await p.waitForTimeout(500);
ok('second click gives access (approve, no email)',p.bodies.length===1&&p.bodies[0].action==='approve'&&p.bodies[0].id==='i002'&&p.bodies[0].email==='bob@example.com',p.bodies);
await p.click('[data-irf="wait"]');await p.waitForTimeout(200);await p.click('[data-invsel="i001"]');await p.waitForTimeout(300);
ok('contact with work email can be invited',await p.evaluate(()=>!!document.querySelector('[data-ir="compose"][data-kind="invite"][data-em="ann@example-fo.com"]')));
p.bodies=[];await p.click('[data-ir="compose"][data-em="ann@example-fo.com"]');await p.waitForTimeout(600);
ok('invitation is shown to read and change; nothing sent yet',p.bodies.length===1&&p.bodies[0].action==='draft'&&await p.evaluate(()=>/Invitation to ann@example-fo.com/i.test(document.getElementById('irMailForm').innerText)&&/private investor briefing/.test(document.getElementById('irText').value)));
await p.fill('#irText','Dear Ann,\n\nA personal line from me. You are invited to read our private investor briefing.\n\nKind regards');await p.click('#irMailForm button[type=submit]');await p.waitForTimeout(600);
const s=p.bodies[p.bodies.length-1];ok('Send sends the edited text to that address',s.action==='send'&&s.email==='ann@example-fo.com'&&/A personal line from me/.test(s.text)&&s.subject==='Navoryx Executive: a private invitation',s);
await p.selectOption('#irStage','nda');await p.selectOption('#irInt','time');await p.click('[data-ir="save"]');await p.waitForTimeout(600);
ok('stage and interest saved, waiting line date set, logged',await p.evaluate(()=>{const ir=S.inv.i001.ir;return ir.stage==='nda'&&ir.interest==='time'&&!!ir.interestAt&&/Stage: NDA signed/.test(JSON.stringify(ir.log));}));
await p.click('[data-irf="line"]');await p.waitForTimeout(300);
ok('waiting line lists both, oldest interest first',await p.evaluate(()=>/Income 1 · Income and time aboard 1/.test(document.body.innerText)&&[...document.querySelectorAll('[data-invsel]')].length===2));
await p.click('[data-invsel="i003"]');await p.waitForTimeout(300);
ok('openings and codes counted per address',/cy@example-lender.com[\s\S]*1 code · 2 openings/.test(await txt('#irBox')));
p.bodies=[];await p.click('[data-ir="revoke"]');await p.click('[data-ir="revoke"]');await p.waitForTimeout(500);
ok('withdraw access (two clicks)',p.bodies.length===1&&p.bodies[0].action==='revoke'&&p.bodies[0].email==='cy@example-lender.com');
await p.click('[data-invsel="i001"]');await p.waitForTimeout(300);await p.evaluate(()=>{S.ctShown={'inv:i001':true};render();});await p.waitForTimeout(200);await p.click('[data-ct="opt"][data-id="i001"]');await p.click('[data-ct="opt"][data-id="i001"]');await p.waitForTimeout(600);
ok('opt-out deletes the contact and their investor access and requests',await p.evaluate(()=>{const r=S.inv.i001;return !(r.contacts||[]).length&&!((r.ir||{}).access||{})['ann@example-fo.com']&&/opted out/.test(JSON.stringify(r.ir.log));}));
await p.setViewportSize({width:390,height:900});await p.waitForTimeout(400);ok('no sideways scroll at 390 px',await p.evaluate(()=>document.documentElement.scrollWidth<=390));await p.close();
p=await open('broker');await p.evaluate(()=>{S.view='prospects';S.pSec='inv';render();});await p.waitForTimeout(400);
ok('brokers see no investor relations',await p.evaluate(()=>!document.getElementById('irBox')&&!document.querySelector('[data-irf]')));await p.close();
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
