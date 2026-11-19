// Booking practice on the real database stack (Morten, 19 Nov 2026: "clicking on start does not start thye training on
// booking practice"). training_runs is not in Supabase's realtime publication, so the run saved by Start never came back
// to the screen; platform.js now re-reads a table's watchers after our own write. The fake database sends live updates
// only for the published tables, as Supabase does. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const T={profiles:[{id:'u1',role:'owner',active:true,contract_name:'Example Director',data:{}}],config:[]};
const SB='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>';
fs.writeFileSync('t_trlive.html','<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace(SB,`<script>window.__UID="u1";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>');
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x)));if(!c)fails++;};
(async()=>{const b=await chromium.launch();const errs=[];
try{
  const p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/t_trlive.html');await p.waitForTimeout(3000);
  for(const sc of ['s1','s7']){
    await p.evaluate(()=>{S.view='training';S.trTab='book';S.trSel=null;render();});await p.waitForTimeout(400);
    await p.click(`[data-tr="start"][data-sc="${sc}"]`);await p.waitForTimeout(800);
    ok(sc+': Start opens the exercise', await p.evaluate(()=>!!document.querySelector('.trpanel')&&!!trRun()));
    await p.click('[data-tr="next"]');await p.waitForTimeout(800);
    ok(sc+': Next moves to the enquiry step', await p.evaluate(()=>trRun().step===1&&!!document.querySelector('#tr_f0')));
  }
  ok('the runs are in training_runs, not live-published', await p.evaluate(()=>(window.__T.training_runs||[]).length===2));
  ok('no script errors', errs.length===0, errs);
}catch(e){console.log('FAIL exception '+e.message);fails++;}
await b.close();fs.unlinkSync('t_trlive.html');console.log(fails?`FAILED ${fails}`:'ALL PASS');process.exit(fails?1:0);})();
