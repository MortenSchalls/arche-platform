// Sign out (Morten, 14 Nov 2026: "cannot sign out as Steen, so crete a sign out button on the portal"): a Sign out button
// in the top bar on every screen (in Menu on a phone), on the "choose your password" screen and on the screen shown when the
// portal cannot open; it ends the sign-in on this device only and returns to the sign-in screen. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const T={profiles:[{id:'u1',role:'broker',active:true,contract_name:'Example Broker',data:{}}],config:[]};
const SB='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>';
const mk=(name,fake)=>fs.writeFileSync(name,'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace(SB,`<script>window.__UID="u1";window.__T=${JSON.stringify(T)};</script><script>${fake.replace('signOut: async () => {}','signOut: async (o) => { window.__out = (o && o.scope) || "global"; }')}</script>`)+'</body></html>');
const base=fs.readFileSync('tests/fake-supabase.js','utf8');
mk('t_so1.html',base);
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x)));if(!c)fails++;};
(async()=>{const b=await chromium.launch();
try{
// 1. top bar, computer width
let p=await b.newPage({viewport:{width:1280,height:800}});await p.goto('http://localhost:8765/t_so1.html');await p.waitForTimeout(3000);
const btn=await p.$('#who [data-act="signout"]');ok('Sign out in the top bar',!!btn&&await btn.isVisible());
ok('it says who is signed in',/Example Broker/.test(await btn.getAttribute('title')||''),await btn.getAttribute('title'));
await p.evaluate(()=>{localStorage.setItem('sb-x-auth-token','t');localStorage.setItem('arche.theme','dark');});
await Promise.all([p.waitForNavigation(),btn.click()]);await p.waitForTimeout(300);
const st=await p.evaluate(()=>({tok:localStorage.getItem('sb-x-auth-token'),th:localStorage.getItem('arche.theme'),hash:location.hash}));
ok('signing out clears the stored sign-in and keeps the theme',st.tok===null&&st.th==='dark',st);await p.close();
// 2. phone: in Menu
p=await b.newPage({viewport:{width:390,height:844}});await p.goto('http://localhost:8765/t_so1.html');await p.waitForTimeout(3000);
await p.click('#menuBtn');await p.waitForTimeout(300);
ok('phone: Sign out shown once Menu is open',await p.isVisible('#who [data-act="signout"]'));
ok('phone: no sideways scrolling',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.evaluate(()=>{window.__out=null;});await p.click('#who [data-act="signout"]').catch(()=>{});await p.waitForTimeout(800);await p.close();
// 3. "could not open" screen
p=await b.newPage();await p.goto('http://localhost:8765/t_so1.html');await p.waitForTimeout(2500);
await p.evaluate(()=>bootFail("x"));ok('"could not open" screen has Sign out',await p.isVisible('#main button[onclick="signOutNow()"]'));
await p.evaluate(()=>{window.__noNav=true;});const out=await p.evaluate(async()=>{const r=location.replace;let to=null;try{Object.defineProperty(location,'replace',{value:u=>{to=u;}});}catch(e){}await signOutNow();return {scope:window.__out,to};});
ok('signs out on this device only',out.scope==='local',out);await p.close();
// 4. choose-your-password screen (platform.js)
const plat=fs.readFileSync('platform.js','utf8');ok('choose-password screen offers "Not you? Sign out"',/id="spOut"/.test(plat)&&/Not you\?/.test(plat)&&/signOut\(\{ scope: "local" \}\)/.test(plat));
const pt=fs.readFileSync('platform.test.js','utf8');ok('test platform carries the same',/id="spOut"/.test(pt));
}finally{await b.close();['t_so1.html'].forEach(f=>{try{fs.unlinkSync(f);}catch(e){}});}
console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0)})();
