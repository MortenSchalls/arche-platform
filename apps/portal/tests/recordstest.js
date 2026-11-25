// Prospects and investors: checks and documents on every record, a portal-numbered KYB reference, documents stored and
// confirmed; adding a prospect fills the region and source and shows a name already listed (Morten, 25 Nov 2026).
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
const p=await b.newPage({viewport:{width:1366,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
fs.writeFileSync('/tmp/ex-reg.pdf','%PDF-1.4 example register');
await p.goto('http://localhost:8765/test.html?as=owner');await p.waitForTimeout(3500);
const pid=await p.evaluate(()=>{const e=Object.entries(S.prospects||{}).find(([k,v])=>v&&v.org);return e&&e[0]});
ok('example prospects exist',!!pid,pid);
await p.evaluate(id=>{localStorage.removeItem('__files');S.view='prospects';S.pSel=id;render()},pid);await p.waitForTimeout(800);
ok('a record shows Checks and documents',await p.isVisible('#recPanel'));
await p.fill('#rc_how','company register extract and owners');await p.click('[data-rc^="kyb|"]');await p.waitForTimeout(900);
const k=await p.evaluate(id=>S.prospects[id].kyb,pid);ok('the check gets a portal reference',!!k&&/^KY[BC]-\d{4}-[0-9A-Z]{4}$/.test(k.ref),k);
await p.setInputFiles('#rc_file','/tmp/ex-reg.pdf');await p.click('[data-rc^="doc|"]');await p.waitForTimeout(1800);
const d=await p.evaluate(id=>(S.prospects[id].docs||[])[0],pid);ok('a document is stored under the record and recorded',!!d&&d.id.includes('/records/'+pid+'/')&&d.by&&d.size>0,d);
ok('the record shows it as Saved',/Saved ✓/i.test(await p.innerText('#recPanel')));
// adding a prospect
const known=await p.evaluate(id=>S.prospects[id],pid);
await p.click('[data-act="pNew"]');await p.waitForTimeout(400);
await p.fill('#pf_org',known.org);await p.waitForTimeout(200);
ok('a name already in the list shows at once',/Already in the list/.test(await p.innerText('#pForm')));
if(known.country){await p.fill('#pf_cty',known.country);await p.dispatchEvent('#pf_cty','change');await p.waitForTimeout(200);ok('region follows the country',(await p.inputValue('#pf_reg'))===known.region,{r:await p.inputValue('#pf_reg'),want:known.region});}
await p.fill('#pf_org','Example New Org Pte Ltd');await p.fill('#pf_web','https://example.org');await p.click('#pForm button[type=submit]');await p.waitForTimeout(1200);
ok('the website is used as the source when none is given',await p.evaluate(()=>Object.values(S.prospects).some(x=>x.org==='Example New Org Pte Ltd'&&/example\.org/.test(x.source||''))));
ok('a ? on the prospect fields',await p.evaluate(()=>!!document.querySelector('label[for="rc_how"] button.fh')));
// investor record (Director only)
const iid=await p.evaluate(async()=>{let k=Object.keys(S.inv||{})[0];if(!k){k='i901';await invSet(k,{org:'Example Capital Pte Ltd',status:'new',track:'Strategic partner',for:'Whole platform'});await new Promise(r=>setTimeout(r,600));}return k});
if(iid){await p.evaluate(id=>{S.view='prospects';S.pSec='inv';S.invSel=id;render()},iid);await p.waitForTimeout(800);ok('an investor record has Checks and documents',await p.isVisible('#recPanel'));
await p.fill('#rc_how','company register extract');await p.click('[data-rc^="kyb|inv"]');await p.waitForTimeout(900);
ok('investor check gets a portal reference',await p.evaluate(id=>/^KYB-\d{4}-/.test(((S.inv[id]||{}).kyb||{}).ref||''),iid));}
else console.log('   no example investor to check');
ok('no page errors',!errs.length,errs);console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
