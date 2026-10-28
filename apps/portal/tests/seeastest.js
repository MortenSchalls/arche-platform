// See as a person: the owner chooses a team member and sees their Today and leads, not the owner's own; read-only. Example data.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const errs=[];const p=await b.newPage({viewport:{width:1300,height:1000}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/test.html?as=owner');await p.waitForTimeout(3500);
const B=await p.evaluate(()=>Object.entries(S.roster).find(([,r])=>r.role==='broker'&&r.active!==false)[0]);
await p.evaluate(async B=>{await S.db.doc(`leads/${B}/items/exl1`).set({org:'Example Family Office',segment:'Family office',country:'Singapore',status:'assigned',assignedAt:new Date().toISOString(),why:'Example reason',log:[]});},B);
await p.waitForTimeout(800);await p.evaluate(()=>{S.view='today';render();});await p.waitForTimeout(400);
const opt=await p.evaluate(B=>!!document.querySelector(`#previewSel option[value="as:${B}"]`),B);ok('the preview menu lists team members',opt);
await p.selectOption('#previewSel','as:'+B);await p.waitForTimeout(1200);
ok('a bar says whose portal this is, read-only',await p.evaluate(()=>/seeing the portal as[\s\S]*Read-only/.test((document.getElementById('asBar')||{}).innerText||'')));
ok('shows their Today, as a broker',await p.evaluate(B=>S.uid===B&&acting()==='broker'&&S.view==='today',B));
await p.evaluate(()=>{S.view='leads';render();});await p.waitForTimeout(500);
ok('shows their leads (not the owner\'s)',await p.evaluate(()=>/Example Family Office/.test(document.querySelector('#main').innerText)));
const blocked=await p.evaluate(async B=>{try{await S.db.doc(`leads/${B}/items/exl1`).update({status:'contacted'});return false;}catch(e){return e.code==='preview_read_only';}},B);
ok('saving is refused while seeing as someone',blocked);
await p.click('[data-asexit]');await p.waitForTimeout(600);
ok('Exit returns to the owner with the owner\'s data',await p.evaluate(B=>S.uid!==B&&!S.asUser&&S.role==='owner'&&!S.preview,B));
const after=await p.evaluate(async B=>(await S.db.doc(`leads/${B}/items/exl1`).get()).data().status,B);ok('their data was not changed',after==='assigned');
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
