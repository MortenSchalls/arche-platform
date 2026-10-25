const {chromium}=require('playwright');
const VERIFIED=new Set(`https://regulatorylibrary.caa.co.uk/air-operations-pre-30-october-2025/Content/Document%20Structure/04%20CAT/2%20Regs/07560_CATOPMPA250_Ice_and_other_contaminants_ground_procedures.htm https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.227 https://store.icao.int/en/manual-of-aircraft-ground-de-icing-anti-icing-operations-doc-9640 https://www.law.cornell.edu/cfr/text/14/135.267 https://saemobilus.sae.org/content/as6285 https://avinode.com/broker/ https://www.avinode.com/how-air-charter-payments-work/ https://help.avinodegroup.com/hc/en-us/articles/12043060610331-Getting-Started-with-Avinode-Marketplace https://skybrary.aero/ https://www.gulfstream.com/en/aircraft/ https://www.dassaultfalcon.com/ https://businessaircraft.bombardier.com/ https://www.universalweather.com/blog/planning-bizav-operations-to-thailand-part-1-permit-planning/ https://nbaa.org/wp-content/uploads/2024/07/NBAA-Best-Practices-for-Air-Charter-Brokering.pdf https://nbaa.org/flight-department-administration/aircraft-operating-ownership-options/aircraft-charter/aircraft-charter-consumer-guide/ https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-295 https://www.federalregister.gov/documents/2018/09/17/2018-18345/increasing-charter-air-transportation-options https://nata.aero/advocacy/initiatives-and-issues/public-charter-operations/public-charter-faqs/ https://www.easa.europa.eu/en/domains/air-operations/third-country-operators https://www.transportstyrelsen.se/en/aviation/air-operators/traffic-permits/charter-flights-non-scheduled-air-service/ https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en https://www.caa.co.uk/air-passengers/about-your-trip/charters-and-air-taxis-flights/ https://www.caa.co.uk/atol-protection/ https://www.caas.gov.sg/operations-safety/air-operations/foreign-air-operators https://aip.caat.or.th/ https://www.ebaa.org/app/uploads/2023/04/Impact-of-EU-Sanctions-against-Russia-and-Belarus-on-BizAv.pdf https://www.easa.europa.eu/en/domains/air-operations/czibs https://www.faa.gov/air_traffic/publications/us_restrictions https://safeairspace.net/ https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list https://sanctionssearch.ofac.treas.gov/ https://www.sanctionsmap.eu/ https://search-uk-sanctions-list.service.gov.uk https://www.mas.gov.sg/regulation/anti-money-laundering/targeted-financial-sanctions https://irs.gov/pub/irs-mssp/air_transportation.pdf https://www.gov.uk/guidance/rates-and-allowances-for-air-passenger-duty https://www.iata.org/en/publications/timatic/ https://help.avinodegroup.com/hc/en-us/articles/43773188664347-Know-Before-You-Receive-or-Collect-Payment-What-Our-Payments-Platform-Cannot-Support https://argus.aero/auditing-services https://www.wyvern.aero/ https://www.ibac.org/is-bao https://www.acsf.aero/ https://help.avinodegroup.com/hc/en-us/articles/16390512030491-Training-Videos https://help.avinodegroup.com/hc/en-us/articles/9957467128603-Creating-a-Professional-Quote https://help.avinodegroup.com/hc/en-us/articles/7937852877467-How-to-Create-a-Payment-Request https://help.avinodegroup.com/hc/en-us/articles/11978769793563-Payment-Guide-Overview-of-Sending-Payments https://help.avinodegroup.com/hc/en-us/articles/7937973595035-Overview-of-card-payments https://help.avinodegroup.com/hc/en-us/articles/19699527102235-Match-a-Wire-Transfer-to-your-Trip-using-a-Payment-Request https://avinode.com/white-paper-payment-security-for-air-charter/ https://www.theaircharterassociation.aero/training/ https://www.theaircharterassociation.aero/the-broker-qualification/ https://help.avinodegroup.com/hc/en-us/articles/7215260082075-Paynode-Member-Eligibility https://help.avinodegroup.com/hc/en-us/articles/31953555878043-Starter-Broker-Training-video-with-Paynode https://help.avinodegroup.com/hc/en-us/articles/31953529192987-Paynode-training-and-Online-Banking-Walkthrough-video https://help.avinodegroup.com/hc/en-us/articles/31913562254491-Trip-Manager-and-Online-Booking-training-video https://help.avinodegroup.com/hc/en-us/articles/23323694056859-Buying-trips-with-the-new-booking-flow https://help.avinodegroup.com/hc/en-us/articles/14371871276059-Timelines-cut-off-times-for-Payments-in-US-Time-EST https://help.avinodegroup.com/hc/en-us/articles/13144161608603-Send-Payments-Supported-Payment-Methods-and-Country-Restrictions https://www.iabi.aero/air-charter-broker-course https://help.avinodegroup.com/hc/en-us https://help.avinodegroup.com/hc/en-us/sections/23935448207131-Onboarding https://help.avinodegroup.com/hc/en-us/categories/7155823743259-Charter-Payments https://avinode.com/faq-air-charter-payments/ https://www.gov.uk/guidance/moving-to-a-single-list-for-uk-sanctions-designations-28-january-2026 https://www.globalair.com/articles/argus-wingx-release-aircraft-activity-reports-for-the-end-of-2025/11807 https://www.knightfrank.com/wealthreport https://www.icao.int/Pages/freedomsAir.aspx https://www.caat.or.th/wp-content/uploads/2024/11/Revision-of-Limits-of-Liability-under-the-Montreal-Convention-of-1999-Year-2024.pdf https://www.ecfr.gov/current/title-14/chapter-II/subchapter-F/part-399/subpart-G/section-399.84 https://aviationweather.gov/ https://www.theaircharterassociation.aero/the-air-charter-essentials-certificate/`.split(/\s+/));
const fails=[];Object.values(require('./img/meta.json')).forEach(m=>VERIFIED.add(m.page));const ok=(c,m)=>{if(!c)fails.push(m)};
(async()=>{
const b=await chromium.launch();
async function newPage(w=1280,h=900){const p=await b.newPage({viewport:{width:w,height:h}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.addInitScript(()=>{window.__said=[];window.SpeechSynthesisUtterance=function(t){this.text=t;};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{addEventListener(){},getVoices(){return [{name:'Microsoft Sonia Online (Natural)',lang:'en-GB',voiceURI:'s'}]},cancel(){},speak(u){window.__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),1);}}});});
 await p.goto('file://'+process.cwd()+'/'+(process.env.T||'t_full.html'));return p;}
// 1. integrity
let p=await newPage();
const I=await p.evaluate(()=>{const T=__T();const bad=[];let n=0;Object.entries(T.MODS).forEach(([k,m])=>{m.quiz.forEach((q,i)=>{n++;if(!(q.a>=0&&q.a<q.o.length))bad.push(k+'.q'+i)});m.secs.forEach(s=>s.b.forEach(b=>{if(b.tryq&&!(b.tryq.a>=0))bad.push(k+' try')}))});T.LAB.forEach((x,i)=>{if(!x.c||!x.i)bad.push('lab'+i)});
 const urls=new Set();const walk=o=>{if(Array.isArray(o)){if(o.length>=2&&typeof o[1]==='string'&&/^https?:/.test(o[1]))urls.add(o[1]);o.forEach(walk)}else if(o&&typeof o==='object')Object.values(o).forEach(walk)};walk(T.MODS);walk(T.REF);return {bad,n,urls:[...urls]}});
ok(I.bad.length===0,'unresolved answers '+I.bad);
const unver=I.urls.filter(u=>!VERIFIED.has(u));ok(unver.length===0,'unverified links '+unver.join(' '));
console.log('questions',I.n,'links',I.urls.length,'unverified',unver.length);
const src=require('fs').readFileSync(process.env.SRC||'arche-broker-academy.html','utf8');ok(!/"a":\d/.test(src)&&!/"c":"(green|amber|red)"/.test(src),'answer keys visible in source');
// helper to run a path
async function runPath(p,role,name){
 await p.fill('#nm',name);await p.selectOption('#rl',role);
 await p.click('#begin');ok((await p.textContent('#nmMsg')).includes('confidential'),'NDA not enforced');
 await p.check('#nda');await p.click('#begin');
 const path=await p.evaluate(r=>__T().PATHS[r],role);let screens=0;
 for(const id of path){
  await p.click('.map-l [data-go="home"]');await p.click(`.tile[data-go="${id}"]`);
  if(id.startsWith('m')){
   const info=await p.evaluate(id=>{const M=__T().MODS[id];return {n:M.secs.length,a:M.quiz.map(q=>q.a)}},id);
   for(let s=0;s<info.n+2;s++){screens++;const rv=await p.$$('details.reveal summary');for(const r of rv)await r.click();await p.click('#next');}
   if(info.a.length){for(const a of info.a){await p.click(`.opt[data-j="${a}"]`);await p.click('#qnext');}
    ok((await p.textContent('#qz h2'))==='Module passed',id+' not passed');}
  } else if(id==='lab'){
   const L=await p.evaluate(()=>__T().LAB.map(x=>[x.c,x.i]));
   for(let k=0;k<L.length;k++){const c=`[data-k="${k}"]`;await p.click(`${c} [data-c="${L[k][0]}"]`);await p.click(`${c} [data-i="${L[k][1]}"]`);await p.click(`${c} [data-check]`);}
   ok((await p.textContent('#view')).includes('Lab passed'),'lab not passed');
  } else if(id==='book'){
   const f={b_risk:'amber',b_cName:'Meridian Family Office Pte Ltd',b_kyc:'KYC-2026-0147',b_lead:'Daniel Tan',b_opName:'Alpine Jet Services AG',b_aoc:'CH.AOC.1042',b_aocState:'Switzerland',b_acType:'Bombardier Global 6000',b_reg:'HB-JXA',b_yom:'2014',b_seats:'13',b_audit:'ARGUS Platinum',b_opNet:'171000',b_price:'187913',b_vd:'2026-10-20',b_vt:'18:00',b_pay:'paynode'};
   for(const [k,v] of Object.entries(f)){ if(k==='b_risk'||k==='b_pay') await p.selectOption('#'+k,v); else await p.fill('#'+k,v);}
   const Lg=[['2026-11-12','10:00','WSSS','VTBD'],['2026-11-14','11:00','VTBD','VTSP'],['2026-11-17','16:00','VTSP','WSSS']];
   for(let i=0;i<3;i++){await p.fill(`#l${i}d`,Lg[i][0]);await p.fill(`#l${i}t`,Lg[i][1]);await p.fill(`#l${i}f`,Lg[i][2]);await p.fill(`#l${i}o`,Lg[i][3]);await p.fill(`#l${i}p`,'6');}
   for(const c of ['kyc','aoc','ins','audit','route','terms','disc']) await p.check('#ck_'+c);
   await p.click('button[type=submit]');ok((await p.textContent('#bresc h2'))==='Practical passed','book not passed');
  } else if(id==='exam'){
   await p.click('#exStart');let q=0;
   while(await p.$('#qnext')){const t=await p.textContent('.tq');const a=await p.evaluate(t=>{for(const m of Object.values(__T().MODS))for(const q of m.quiz)if(q.q===t)return q.a;return -1},t);await p.click(`.opt[data-j="${a}"]`);await p.click('#qnext');q++;}
   ok((await p.textContent('#qz h2'))==='Exam passed',role+' exam not passed');console.log(role,'exam questions',q);
  }
 }
 const st=await p.evaluate(()=>__T().ST);ok(!!st.completedAt,role+' not completed');ok(!!st.ndaAt,'nda not recorded');
 await p.click('.map-l [data-go="home"]');await p.click('[data-go="cert"]');const code=await p.textContent('#code');
 const dec=await p.evaluate(c=>__T().readCode(c),code);ok(dec.ok&&dec.items.length===path.length,'code decode '+JSON.stringify(dec).slice(0,80));
 console.log(role,'steps',path.length,'section screens',screens);
}
await runPath(p,'broker','Broker Tester');ok(p.errs.length===0,'broker errors '+p.errs);
// exam critical fail
await p.click('.map-l [data-go="home"]');await p.click('.tile[data-go="exam"]');await p.click('#exStart');let first=true;
while(await p.$('#qnext')){const t=await p.textContent('.tq');const r=await p.evaluate(t=>{for(const m of Object.values(__T().MODS))for(const q of m.quiz)if(q.q===t)return [q.a,!!q.crit];return [-1,false]},t);let a=r[0];if(r[1]&&first){a=(a+1)%2;first=false;}await p.click(`.opt[data-j="${a}"]`);await p.click('#qnext');}
ok((await p.textContent('#qz h2'))==='Not passed yet','exam passed despite critical miss');
// 2. consultant
let p2=await newPage();await runPath(p2,'consultant','Consultant Tester');ok(p2.errs.length===0,'consultant errors '+p2.errs);
// 3. audio across screens: mobile + dark
let p3=await newPage(400,850);await p3.emulateMedia({colorScheme:'dark'});
await p3.fill('#nm','Audio Check');await p3.check('#nda');await p3.click('#begin');await p3.click('#audioBtn');
await p3.evaluate(()=>{__T().ST.mods={};});
const ids=['m0','m1','m2','m3','m6','m9','m13','m14'];
await p3.evaluate(()=>{const s=__T().ST;['m0','m1','m2','lab','m3','m4','m5','m6','m7','m8','m9','m10','book','m11','m12','m13','m14','exam'].forEach(k=>s.mods[k]={passed:true,best:100,total:2})});
let over=[];
for(const id of ids.concat(['rglo','rwat','rlib','rtpl','rchk','rhow','rthai'])){await p3.evaluate(id=>{location.hash=id},id);await p3.evaluate(()=>{});if(!(await p3.$(`#map [data-go="${id}"]`)))continue;await p3.click('#mapBtn');await p3.click(`#map [data-go="${id}"]`);await p3.waitForTimeout(150);
 if(await p3.$('#next')){for(let i=0;i<10&&await p3.$('#next')&&!(await p3.textContent('#next')).match(/check|complete/);i++){if(await p3.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))over.push(id);await p3.click('#next');await p3.waitForTimeout(60);}}
 if(await p3.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))over.push(id);}
ok(over.length===0,'horizontal overflow on '+[...new Set(over)]);
const said=await p3.evaluate(()=>__said);const badSay=said.filter(x=>/[·\/()%;"“”↗–—]|\bUSD\b|\d\.\d+ [A-Z]/.test(x));
console.log('spoken lines',said.length,'with symbols',badSay.length);badSay.slice(0,8).forEach(x=>console.log('  >',x));
await p3.screenshot({path:'chk_mobile_dark.png'});
ok(p3.errs.length===0,'audio errors '+p3.errs);
const sp=await p3.evaluate(()=>['See Module 2.4 and Appendix G.7.','Margin 9% (USD 16,913).','Check 14 CFR Part 295 and 1.5% interest.'].map(__AUD.speakable));console.log(sp.join('\n'));
await b.close();
console.log(fails.length?'FAILS:\n'+fails.join('\n'):'ALL CHECKS PASSED');})();
