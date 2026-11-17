// Payment and conversion costs are direct trip costs inside the price (Morten, 17 Nov 2026: "YES").
// Conversion 0.4% of the operator price when the operator quotes in another currency; card fee 3.6% of the client price.
const {chromium}=require('playwright');const fs=require('fs');
const OWN='00000000-0000-0000-0000-00000000000a';
const T={profiles:[{id:OWN,role:'owner',active:true,contract_name:'Owner',data:{}}],config:[{key:'terms',value:{margin:0.09,unit:45000,threshold:8,rate1:0.27,rate2:0.35,ownerApproval:true}}],intel:[],trips:[],trip_status:[],step_requests:[],leads:[],prospects:[],optouts:[],join_requests:[],agreements:[],training_runs:[]};
const page=(uid,T)=>'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="${uid}";window.__T=${JSON.stringify(T)};</script><script src="tests/fake-supabase.js"></script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>';
const ok=(k,v,x)=>console.log((v?'PASS ':'FAIL ')+k+(v||x===undefined?'':' '+JSON.stringify(x)));
(async()=>{const b=await chromium.launch();const errs=[];const f='t_pc.html';fs.writeFileSync(f,page(OWN,T));
 const p=await b.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/'+f);await p.waitForTimeout(4000);
 const r=await p.evaluate(()=>({usd:payCostOf(100000,0,'USD',false),eur:payCostOf(54000,0,'EUR',false),card:payCostOf(100000,0,'USD',true),
   pEur:priceOf(54000,216),pCard:priceOf(100000,4119)}));
 ok('USD operator, bank transfer: no payment cost',r.usd.total===0,r.usd);
 ok('EUR operator: conversion 0.4% of the operator price (54,000 -> 216)',r.eur.fx===216&&r.eur.card===0,r.eur);
 ok('client price with conversion 59,579 (manual 9.4 E)',r.pEur===59579,r.pEur);
 ok('card: fee 4,119, which is 3.6% of the client price 114,417 (manual 9.4 H)',r.card.card===4119&&r.pCard===114417&&Math.abs(4119/114417-0.036)<0.0001,[r.card,r.pCard]);
 ok('Archē fee stays 9% of the card price',Math.abs((114417-104119)/114417-0.09)<0.0005);
 console.log('ERRORS',JSON.stringify(errs));await b.close();fs.unlinkSync(f);})();
