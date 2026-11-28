// Progress on two devices (Sunisa, 28 Nov 2026): a page left open with an older state must not write over a newer record,
// and coming back to the page reads the record again.
const {chromium}=require('playwright');
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(x||'')));if(!c)fails++;};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/academy.test.html');await p.waitForTimeout(2500);
 const r=await p.evaluate(async()=>{const A=window.__acadSync(),ST=A.st(),P=A.P,save=A.save,isDone=A.isDone;
   // this device: modules up to m4 passed; the record (another device): m5 and m6 passed as well
   ST.name=ST.name||'Example Trainee';ST.mods={m0:{passed:true,best:100},m1:{passed:true,best:100},m4:{passed:true,best:90}};
   let stored={v:1,name:'Example Trainee',role:'broker',mods:{m0:{passed:true,best:100},m1:{passed:true,best:100},m4:{passed:true,best:90},m5:{passed:true,best:88},m6:{passed:true,best:92}}};
   let wrote=null;
   P.ref={get:async()=>({exists:true,data:()=>JSON.parse(JSON.stringify(stored))}),set:async d=>{wrote=d;stored=d;}};
   ST.mods.m7={attempts:1,best:40,passed:false};save();await P.chain;
   const kept=!!(wrote&&wrote.mods.m5&&wrote.mods.m5.passed&&wrote.mods.m6&&wrote.mods.m6.passed&&wrote.mods.m7);
   // back on the page: another device passed m7 meanwhile
   stored.mods.m7={passed:true,best:85};
   document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,300));
   return {kept,shown:isDone('m7'),here:isDone('m6')};
 });
 ok('a write keeps modules passed on another device', r.kept, r);
 ok('this device now shows them too', r.here, r);
 ok('coming back to the page reads the record again', r.shown, r);
 ok('no script errors', !errs.length, errs);
 await b.close();console.log(fails?'FAILED':'ALL PASS');process.exit(fails?1:0);})();
