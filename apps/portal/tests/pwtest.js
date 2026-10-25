const {chromium}=require('playwright');const fs=require('fs');
const T={profiles:[{id:'u1',role:'owner',active:true,contract_name:'Owner',data:{}}],config:[]};
const fake=fs.readFileSync('tests/fake-supabase.js','utf8').replace('user_metadata: { pw_set: true }','user_metadata: {}');
fs.writeFileSync('t_pw.html','<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>',`<script>window.__UID="u1";window.__T=${JSON.stringify(T)};</script><script>${fake}</script>`)+'</body></html>');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8765/t_pw.html');await p.waitForTimeout(2000);
console.log((await p.$('#archeSetPw'))?'PASS email-link user must set a password':'FAIL no password prompt', JSON.stringify((await p.textContent('#archeSetPw p')||'').slice(0,80)));
await b.close();fs.unlinkSync('t_pw.html');})();
