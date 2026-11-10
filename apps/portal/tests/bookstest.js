// Books screens (10 Nov 2026): locked until the second step; To do first, one tap per item, warnings held for "post anyway";
// every tab renders; nothing shown before unlock; phone width.
// The server is faked here (example data only); the real server is tested in tests/books.test.mjs and the SQL in supabase/tests/books.sql.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:1000},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const A=[['1000','Bank: operating account','asset','Cash and bank'],['1100','Client payment account (client money)','asset','Cash and bank'],['2100','Client money held for trips','liability','Client money'],['3000','Share capital','equity','Equity'],['4000','Charter brokerage margin','income','Revenue'],['5000','Broker commission','expense','Cost of sales'],['5900','Office and other operating costs','expense','Operating costs']].map(([code,name,kind,grp])=>({code,name,kind,grp,active:true}));
let unlocked=false, posted=null, seen=[], matchCalls=[], recPost=null, postAll=null;
await p.route('**/api/books',async r=>{const body=JSON.parse(r.request().postData()||'{}');seen.push(body.mode);const h=r.request().headers();const j=x=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});
  if(body.mode==='unlockTotp'){unlocked=true;return j({session:'S'.repeat(43)});}
  if(body.mode==='status')return j({role:'owner',entity:'Arche Aviation Pte. Ltd.',unlocked,passkeys:0,totp:true,owners:2});
  if(!h['x-books-session'])return r.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'locked'})});
  if(body.mode==='accounts')return j({accounts:A});
  if(body.mode==='overview')return j({entity:'Arche Aviation Pte. Ltd.',fy:{start:'2026-11-01',end:'2027-10-31'},pl:{totalIncome:9000,profit:6570},bs:{},bva:null,advice:[{sev:'high',area:'Books',text:'Example advice <b>not markup</b>',who:'You decide',src:''},{sev:'low',area:'Tax',text:'Set aside tax.',who:'Your accountant confirms',src:'https://www.iras.gov.sg/'}],errors:[],unmatched:1,chainOk:true,entries:5,settings:{},cash:[{code:'1000',name:'Bank: operating account',amount:25770},{code:'1100',name:'Client payment account (client money)',amount:9000}]});
  if(body.mode==='journal')return j({rows:[{id:4,jdate:'2026-12-10',memo:'Margin earned, trip flown: AE-EX-1',kind:'auto',lines:[{account:'2100',debit:9000,credit:0},{account:'4000',debit:0,credit:9000}]}],from:'2026-11-01',to:'2026-12-31'});
  if(body.mode==='drafts')return j({rows:[]});
  if(body.mode==='todo')return j({count:5,bank:[{id:'abcdef1234567890abcdef',bank_account:'1010',bdate:'2026-12-10',amount:-20,amount_usd:-20,currency:'USD',description:'Card transaction of 20.00 USD issued by Example Software Inc',journal_id:null,status:'suggested',suggestion:{account:'5900',why:'Last time "example software" went to this account'}},
      {id:'0123456789abcdef0123',bank_account:'1020',bdate:'2026-12-09',amount:-135,amount_usd:-100,currency:'SGD',fx_source:'ECB reference rate 2026-12-09',description:'Sent money to Example Supplier',journal_id:null,status:'suggested',suggestion:{receipt:'rc-1',why:'Pays the bill from Example Supplier of 2026-12-01'}}],
    receipts:[{id:'rc-2-aaaaaaaa',status:'read',ready:false,data:{supplier:'Example Cafe',date:'2026-12-08',total:12.5,currency:'SGD',account:'5900',read_by:'ai',confidence:'low'}},
      {id:'rc-3-bbbbbbbb',status:'read',ready:true,data:{supplier:'Example Taxi',date:'2026-12-07',total:30,currency:'SGD',account:'5900',read_by:'ai',confidence:'high'}},
      {id:'rc-4-cccccccc',status:'read',ready:true,data:{supplier:'Example Print',date:'2026-12-06',total:80,currency:'USD',account:'5900',read_by:'ai',confidence:'high'}}],drafts:[],errors:[]});
  if(body.mode==='receiptPostAll'){postAll=body;return j({ok:true,posted:body.ids.length,held:[]});}
  if(body.mode==='bankMatch'){matchCalls.push(body);if(body.counter&&!body.confirm)return r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Check before posting',warns:['This looks like entry 7 of 2026-12-09 (Example). Post it again only if it really happened twice.']})});return j({ok:true,id:9,rule:body.always?'r1':null});}
  if(body.mode==='receiptPost'){recPost=body;return j({ok:true,id:10});}
  if(body.mode==='receipts')return j({rows:[{id:'rc-2-aaaaaaaa',status:'read',data:{supplier:'Example Cafe',total:12.5,currency:'SGD'},created_at:'2026-12-10T00:00:00Z'}]});
  if(body.mode==='rules')return j({rows:[{id:'r1',match:'example software',direction:'out',account:'5900',max_usd:60,active:true,hits:3}]});
  if(body.mode==='recurring')return j({rows:[{id:'rp1',memo:'Office rent',active:true,next_date:'2027-01-01',every_months:1}]});
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
const td=await p.locator('#main').innerText();
if(!/5 things/.test(td))console.log('TD:',td.slice(0,800));ok(/5 things need you/.test(td)&&/Receipts to check/.test(td)&&/Bank lines/.test(td),'To do opens first with what needs a person');
ok(await p.locator('#bk_mabcdef123456').inputValue()==='5900','the suggested account is already chosen');
ok(/SGD 135.00/.test(td)&&/USD 100.00/.test(td)&&/ECB/.test(td),'a Singapore dollar line shows both amounts and the rate source');
await p.click('[data-bk="match"][data-id="abcdef1234567890abcdef"]:not([data-link])');await p.waitForTimeout(700);
ok(/Check before it goes in the books/.test(await p.locator('#main').innerText())&&matchCalls.length===1&&matchCalls[0].always===true,'a possible double is held with the reason, nothing posted');
await p.click('[data-bk="confirm"]');await p.waitForTimeout(800);
ok(matchCalls.length===2&&matchCalls[1].confirm===true&&matchCalls[1].counter==='5900','after "post anyway" it is sent again, confirmed');
await p.click('[data-bk="payBill"]');await p.waitForTimeout(600);
ok(matchCalls.at(-1).receipt==='rc-1'&&!matchCalls.at(-1).counter,'one tap pays the bill the line belongs to');
await p.fill('#bk_rtrc-2-aaa','12.50');await p.click('[data-bk="recPost"]');await p.waitForTimeout(600);
ok(recPost&&recPost.fields.supplier==='Example Cafe'&&recPost.fields.total===12.5&&recPost.fields.currency==='SGD'&&recPost.fields.account==='5900'&&recPost.fields.paidPersonally===false,'the checked receipt is sent as shown');
ok(/Clear receipts: 2/.test(await p.locator('#main').innerText()),'clear receipts listed together for one press');
await p.uncheck('.bk_pa[value="rc-4-cccccccc"]');await p.click('[data-bk="recPostAll"]');await p.waitForTimeout(700);
ok(postAll&&postAll.ids.join()==='rc-3-bbbbbbbb','only the ticked receipts are posted together');
// a ? beside every field: each label in Books has one, and a tap shows the help without losing what was typed
const labels=await p.locator('#main label.f').count(), qs=await p.locator('#main label.f .bkq').count();
ok(labels>0&&labels===qs,'every field in To do has a ? ('+qs+'/'+labels+')');
await p.waitForFunction(()=>!BK.busy);await p.waitForTimeout(500);await p.fill('#bk_rsrc-2-aaa','Typed by hand');const q1=p.locator('#main label.f .bkq').first();await q1.click();await p.waitForTimeout(400);
ok(await q1.getAttribute('aria-expanded')==='true'&&await p.locator('#main .bkqt:visible').count()===1&&await p.inputValue('#bk_rsrc-2-aaa')==='Typed by hand','the ? opens its help in place and keeps what was typed');
await q1.click();await p.waitForTimeout(300);ok(await p.locator('#main .bkqt:not([hidden])').count()===0&&await p.locator('#main .bkqt:visible').count()===0,'a second tap closes it');
await p.click('[data-bk="tab"][data-t="overview"]');await p.waitForTimeout(500);
const ov=await p.locator('#main').innerText();
ok(/Operating cash/i.test(ov)&&/USD 25,770.00/.test(ov),'overview shows cash');if(!/USD 25,770/.test(ov))console.log(ov.slice(0,600));
ok(!(await p.locator('#main b:text("not markup")').count()),'advice text is shown as text, never as markup');
for(const t of ['receipts','tx','entry','bank','reports','budget','advice','settings']){await p.click(`[data-bk="tab"][data-t="${t}"]`);await p.waitForTimeout(500);
  {const L=await p.locator('#main label.f').count(),Q=await p.locator('#main label.f .bkq').count();ok(L===Q,'every field has a ? on '+t+' ('+Q+'/'+L+')');}ok((await p.locator('#main').innerText()).length>80,'tab renders: '+t);}
await p.click('[data-bk="tab"][data-t="entry"]');await p.waitForTimeout(400);
ok(await p.locator('[data-bk="post"]').isDisabled(),'post is disabled until debits equal credits');
await p.fill('#bk_em','Example cost');await p.selectOption('#bk_la0','5900');await p.selectOption('#bk_la1','1000');await p.fill('#bk_ld0','120');await p.fill('#bk_lc1','120');await p.waitForTimeout(700);
ok(!(await p.locator('[data-bk="post"]').isDisabled()),'balanced entry can be posted');
await p.click('[data-bk="post"]');await p.waitForTimeout(600);
ok(posted&&posted.lines.length===2&&posted.lines[0].debit===120&&posted.memo==='Example cost','entry sent to the server as typed');
await p.click('[data-bk="tab"][data-t="reports"]');await p.waitForTimeout(300);await p.click('[data-bk="rep"]');await p.waitForTimeout(600);
ok(/Profit and loss/.test(await p.locator('#main').innerText()),'report shown');
await p.setViewportSize({width:390,height:900});for(const t of ['todo','overview','receipts','tx','entry','bank','reports','settings']){await p.click(`[data-bk="tab"][data-t="${t}"]`);await p.waitForTimeout(400);ok(await p.evaluate(()=>document.documentElement.scrollWidth<=391),'no sideways scroll at 390 px: '+t);}
await p.setViewportSize({width:1300,height:1000});
await p.evaluate(()=>{BK.last=Date.now()-16*60e3;});await p.waitForTimeout(31000);
ok(await p.evaluate(()=>!BK.unlocked&&!BK.sess),'locks itself after 15 minutes without use');
await p.selectOption('select',{label:'Test Broker'});await p.waitForTimeout(1500);
await p.unrouteAll();await p.route('**/api/books',r=>r.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'No access to Books.'})}));
await p.evaluate(()=>{BK.role=null;bkStatus();});await p.waitForTimeout(600);
ok(!(await p.evaluate(()=>navItems().some(x=>x[0]==='books'))),'brokers do not see Books');
console.log('errs',errs);ok(!errs.length,'no page errors');console.log(fail?'FAILED '+fail:'ALL PASS');await b.close();process.exit(fail?1:0)})();
