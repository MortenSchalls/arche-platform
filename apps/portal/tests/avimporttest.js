// Fill the quote from the operator's pasted quote (Morten, 25 Nov 2026, peer proposal P3). Example data only.
const {chromium}=require('playwright');
let fails=0;const ok=(k,v,x)=>{console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));if(!v)fails++;};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/test.html?steps=all&as=broker');await p.waitForTimeout(2500);
 const [a,c]=await p.evaluate(()=>[avParse("Operator: Example Aviation AG\nAircraft: Global 7500 (9H-ABC)\nTrip ID: AVN-12345\nTotal price: EUR 152.300,00"),avParse("Operated by Example Jets Ltd, N650EX Gulfstream G650ER total USD 154,300")]);
 ok('European number format and currency',a.cur==='EUR'&&a.amount===152300,a);
 ok('aircraft, registration, operator and trip ID',a.aircraft==='Global 7500'&&a.tail==='9H-ABC'&&a.operator==='Example Aviation AG'&&a.avinode==='AVN-12345',a);
 ok('US registration and USD price',c.tail==='N650EX'&&c.amount===154300&&c.cur==='USD',c);
 await p.evaluate(()=>openEditor(null,'quote'));await p.waitForTimeout(300);
 await p.evaluate(()=>{document.getElementById('avPasteBox').open=true;document.getElementById('avPaste').value="Operator: Example Aviation AG\nAircraft: Challenger 650 9H-XYZ\nYear of manufacture: 2014\nSeats: 13\nAOC no: CH.AOC.1042\nTotal USD 98,500";});
 await p.click('[data-act="avFill"]');await p.waitForTimeout(300);
 const v=await p.evaluate(()=>[q_op.value,q_ac.value,q_tl.value,q_pr.value,q_yom.value,q_seats.value,q_aoc.value]);ok('the form is filled for the broker to check, year, seats and AOC too',v.join('|')==='Example Aviation AG|Challenger 650|9H-XYZ|98500|2014|13|CH.AOC.1042',v);
 ok('no page errors',!errs.length,errs);console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
