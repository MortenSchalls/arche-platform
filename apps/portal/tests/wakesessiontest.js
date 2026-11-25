// iOS Home Screen app logged out on waking (Morten, 24 Nov 2026): with a sign-in stored on the device, a first empty
// session read (token refresh failed while the network was still waking) is retried before the sign-in screen shows.
// Without a stored sign-in, the sign-in screen shows at once. Example data only.
const {chromium}=require('playwright');const fs=require('fs');
const T={profiles:[{id:'u1',role:'broker',active:true,contract_name:'Example Broker',data:{}}],config:[]};
const SB='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>';
const base=fs.readFileSync('tests/fake-supabase.js','utf8');
// the stand-in reads the session as empty until refreshSession has been called twice (a slow network on waking)
const waking=base.replace('auth: { getSession: async () => ({ data: { session } }),',
 'auth: { getSession: async () => ({ data: { session: (window.__refreshed||0) >= 2 ? session : null } }), refreshSession: async () => { window.__refreshed=(window.__refreshed||0)+1; return window.__refreshed>=2 ? {data:{session}} : {data:{session:null},error:{message:"Failed to fetch"}}; },');
if(waking===base) throw new Error('stand-in not patched');
const mk=(name,fake)=>fs.writeFileSync(name,'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('index.html','utf8').replace(SB,`<script>window.__UID="u1";window.__T=${JSON.stringify(T)};</script><script>${fake}</script>`).replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js','lib/node_modules/pdfmake/build/pdfmake.min.js')+'</body></html>');
mk('t_wake.html',waking);
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x)));if(!c)fails++;};
(async()=>{const b=await chromium.launch();
try{
 let p=await b.newPage({viewport:{width:390,height:844}});
 await p.addInitScript(()=>{try{localStorage.setItem('sb-example-auth-token','{"stored":true}')}catch(e){}});
 await p.goto('http://localhost:8765/t_wake.html');await p.waitForTimeout(6000);
 ok('a stored sign-in survives a slow wake: no sign-in screen',!(await p.$('#archeLogin')),await p.evaluate(()=>window.__refreshed));
 ok('the portal opened for the broker',await p.evaluate(()=>typeof S!=='undefined'&&!!S.uid&&!!S.role),await p.evaluate(()=>typeof S!=='undefined'?[S.uid,S.role,S.view]:'no S'));
 await p.close();
 p=await b.newPage({viewport:{width:390,height:844}});
 await p.goto('http://localhost:8765/t_wake.html');await p.waitForTimeout(2500);
 ok('no stored sign-in: the sign-in screen shows at once, no retries',!!(await p.$('#archeLogin'))&&!(await p.evaluate(()=>window.__refreshed||0)));
 await p.close();
}catch(e){ok('test ran',false,String(e));}
fs.unlinkSync('t_wake.html');console.log(fails?'FAILED '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
