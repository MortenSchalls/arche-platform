// Reports: charts render, exports are well formed, no contact details exported (31 Oct 2026). Example data only.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:1000},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(3000);
await p.selectOption('select',{label:'Test Owner'});await p.waitForTimeout(2500);
ok(await p.evaluate(()=>navItems().some(x=>x[0]==='reports')),'owner has Reports');
await p.evaluate(()=>{const b='ex-broker-1';S.desks[b]={...(S.desks[b]||{}),'t-rep-1':{created:'2026-09-01T00:00:00Z',client:{name:'Anna Example',company:'Example Holdings Pte Ltd',email:'anna@example.com',phone:'+65 0000 0000'},trip:{legs:[{from:'WSSL',to:'VTSP',date:'2026-10-05',pax:4}]},quote:{operator:'Example Jets Pte Ltd',aircraft:'Challenger 650',tail:'9V-ABC',opPrice:40000,direct:0},stage:'submitted'},
 't-rep-2':{created:'2026-10-20T00:00:00Z',client:{name:'Ben Example'},trip:{legs:[{from:'WSSL',to:'WMKK',date:'2026-11-12',pax:2}]},quote:{operator:'Example Air',opPrice:12000,direct:0},stage:'quoted'}};
 S.status[b]={...(S.status[b]||{}),'t-rep-1':{state:'flown',ref:'AE-EX-0001',price:43957,opPrice:40000,direct:0,clientPaid:true,clientPaidDate:'2026-09-20',operatorPaid:true,operatorPaidDate:'2026-09-21',flownDate:'2026-10-05',kyc:true}};
 S.view='reports';render();});await p.waitForTimeout(1200);
ok(await p.locator('#main svg').count()>=4,'charts drawn');
ok(await p.locator('#main svg title').count()>0,'bars have hover details');
const T=await p.evaluate(()=>reportTable('trips'));ok(T&&T[0][0]==='Reference'&&T.length>1,'trips report has rows ('+(T.length-1)+')');
ok(!T[0].some(h=>/email|phone/i.test(h)),'no email or phone columns');
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-rep="csv|trips"]')]);const csv=require('fs').readFileSync(await dl.path(),'utf8');
ok(csv.charCodeAt(0)===0xfeff&&/^.Reference,Trip id/.test(csv),'CSV with BOM and header');
ok(!/@example\.com/.test(csv),'no email addresses in the CSV');
const [dx]=await Promise.all([p.waitForEvent('download'),p.click('[data-rep="xlsx|all"]')]);const xb=require('fs').readFileSync(await dx.path());
ok(xb.readUInt32LE(0)===0x04034b50&&dx.suggestedFilename().endsWith('.xlsx'),'Excel file is a zip: '+dx.suggestedFilename());
require('fs').writeFileSync(require('os').tmpdir()+'/arche-test.xlsx',xb);
await p.screenshot({path:require('os').tmpdir()+'/reports.png',fullPage:true});
await p.setViewportSize({width:390,height:900});await p.waitForTimeout(400);ok(await p.evaluate(()=>document.documentElement.scrollWidth<=391),'no sideways scroll at 390 px');
await p.selectOption('select',{label:'Test Broker'});await p.waitForTimeout(2000);ok(!(await p.evaluate(()=>navItems().some(x=>x[0]==='reports'))),'brokers do not see Reports');
console.log('errs',errs);ok(!errs.length,'no page errors');console.log(fail?'FAILED '+fail:'ALL PASS');await b.close();process.exit(fail?1:0)})();
