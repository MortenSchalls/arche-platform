// Books screens (10 Nov 2026): locked until the second step; every tab renders; nothing shown before unlock; phone width.
// The server is faked here (example data only); the real server is tested in tests/books.test.mjs and the SQL in supabase/tests/books.sql.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:1000},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const A=[['1000','Bank: operating account','asset','Cash and bank'],['1100','Client payment account (client money)','asset','Cash and bank'],['2100','Client money held for trips','liability','Client money'],['3000','Share capital','equity','Equity'],['4000','Charter brokerage margin','income','Revenue'],['5000','Broker commission','expense','Cost of sales'],['5900','Office and other operating costs','expense','Operating costs']].map(([code,name,kind,grp])=>({code,name,kind,grp,active:true}));
let unlocked=false, posted=null, seen=[];
await p.route('**/api/books',async r=>{const body=JSON.parse(r.request().postData()||'{}');seen.push(body.mode);const h=r.request().headers();const j=x=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});
  if(body.mode==='unlockTotp'){unlocked=true;return j({session:'S'.repeat(43)});}
  if(body.mode==='status')return j({role:'owner',entity:'Arche Aviation Pte. Ltd.',unlocked,passkeys:0,totp:true,owners:2});
  if(!h['x-books-session'])return r.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'locked'})});
  if(body.mode==='accounts')return j({accounts:A});
  if(body.mode==='overview')return j({entity:'Arche Aviation Pte. Ltd.',fy:{start:'2026-11-01',end:'2027-10-31'},pl:{totalIncome:9000,profit:6570},bs:{},bva:null,advice:[{sev:'high',area:'Books',text:'Example advice <b>not markup</b>',who:'You decide',src:''},{sev:'low',area:'Tax',text:'Set aside tax.',who:'Your accountant confirms',src:'https://www.iras.gov.sg/'}],errors:[],unmatched:1,chainOk:true,entries:5,settings:{},cash:[{code:'1000',name:'Bank: operating account',amount:25770},{code:'1100',name:'Client payment account (client money)',amount:9000}]});
  if(body.mode==='journal')return j({rows:[{id:4,jdate:'2026-12-10',memo:'Margin earned, trip flown: AE-EX-1',kind:'auto',lines:[{account:'2100',debit:9000,credit:0},{account:'4000',debit:0,credit:9000}]}],from:'2026-11-01',to:'2026-12-31'});
  if(body.mode==='drafts')return j({rows:[]});
  if(body.mode==='post'){posted=body.entry;return j({ok:true,id:7});}
  if(body.mode==='bankLines')return j({rows:[{id:'abcdef1234567890abcdef',bank_account:'1010',bdate:'2026-12-02',amount:100000,description:'Received money from Example Client',journal_id:null}]});
  if(body.mode==='report')return j({type:'pl',report:{from:'2026-11-01',to:'2026-12-31',income:[{code:'4000',name:'Charter brokerage margin',amount:9000}],expenses:[{code:'5000',name:'Broker commission',amount:2430}],totalIncome:9000,grossProfit:6570,profitBeforeTax:6570,profit:6570}});
  if(body.mode==='settings')return j({settings:{fyEnd:'2027-10-31'}});
  if(body.mode==='passkeys')return j({rows:[],totp:true});
  if(body.mode==='members')return j({owners:2,rows:[]});
  if(body.mode==='log')return j({rows:[{at:'2026-12-10T10:00:00Z',action:'unlock',user_id:'x'}]});
  return j({ok:true});});
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);
await p.selectOption('select',{label:'Test Director'});await p.waitForTimeout(1500);
// the test version has no sign-in service: give Books one, as the live portal has
await p.evaluate(()=>{window.__sb={auth:{getSession:async()=>({data:{session:{access_token:'t'}}}),mfa:{listFactors:async()=>({data:{totp:[{id:'f1',status:'verified'}]}}),challengeAndVerify:async()=>({data:{}})}}};});
await p.evaluate(()=>bkStatus());await p.waitForTimeout(600);
ok(await p.evaluate(()=>navItems().some(x=>x[0]==='books')),'Books in the menu for the owner');
await p.evaluate(()=>{S.view='books';render();});await p.waitForTimeout(400);
const lockedTxt=await p.locator('#main').innerText();
ok(/Unlock Books/.test(lockedTxt)&&!/USD/.test(lockedTxt),'locked: no figures shown before the second step');
ok(await p.locator('#bk_code').count()===1,'authenticator code field offered');
await p.fill('#bk_code','123456');
await p.click('[data-bk="unlockTotp"]');await p.waitForTimeout(1200);
ok(await p.evaluate(()=>BK.unlocked&&BK.sess.length===43),'unlocked with the authenticator code');
const ov=await p.locator('#main').innerText();
ok(/Operating cash/i.test(ov)&&/USD 25,770.00/.test(ov),'overview shows cash');if(!/USD 25,770/.test(ov))console.log(ov.slice(0,600));
ok(!(await p.locator('#main b:text("not markup")').count()),'advice text is shown as text, never as markup');
for(const t of ['tx','entry','bank','reports','budget','advice','settings']){await p.click(`[data-bk="tab"][data-t="${t}"]`);await p.waitForTimeout(500);ok((await p.locator('#main').innerText()).length>80,'tab renders: '+t);}
await p.click('[data-bk="tab"][data-t="entry"]');await p.waitForTimeout(400);
ok(await p.locator('[data-bk="post"]').isDisabled(),'post is disabled until debits equal credits');
await p.fill('#bk_em','Example cost');await p.selectOption('#bk_la0','5900');await p.selectOption('#bk_la1','1000');await p.fill('#bk_ld0','120');await p.fill('#bk_lc1','120');await p.waitForTimeout(700);
ok(!(await p.locator('[data-bk="post"]').isDisabled()),'balanced entry can be posted');
await p.click('[data-bk="post"]');await p.waitForTimeout(600);
ok(posted&&posted.lines.length===2&&posted.lines[0].debit===120&&posted.memo==='Example cost','entry sent to the server as typed');
await p.click('[data-bk="tab"][data-t="reports"]');await p.waitForTimeout(300);await p.click('[data-bk="rep"]');await p.waitForTimeout(600);
ok(/Profit and loss/.test(await p.locator('#main').innerText()),'report shown');
await p.setViewportSize({width:390,height:900});for(const t of ['overview','tx','entry','bank','reports','settings']){await p.click(`[data-bk="tab"][data-t="${t}"]`);await p.waitForTimeout(400);ok(await p.evaluate(()=>document.documentElement.scrollWidth<=391),'no sideways scroll at 390 px: '+t);}
await p.setViewportSize({width:1300,height:1000});
await p.evaluate(()=>{BK.last=Date.now()-16*60e3;});await p.waitForTimeout(31000);
ok(await p.evaluate(()=>!BK.unlocked&&!BK.sess),'locks itself after 15 minutes without use');
await p.selectOption('select',{label:'Test Broker'});await p.waitForTimeout(1500);
await p.unrouteAll();await p.route('**/api/books',r=>r.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'No access to Books.'})}));
await p.evaluate(()=>{BK.role=null;bkStatus();});await p.waitForTimeout(600);
ok(!(await p.evaluate(()=>navItems().some(x=>x[0]==='books'))),'brokers do not see Books');
console.log('errs',errs);ok(!errs.length,'no page errors');console.log(fail?'FAILED '+fail:'ALL PASS');await b.close();process.exit(fail?1:0)})();
