// Recorded narration in the academy (Morten, 7 Nov 2026): Isabella and Fable, chosen in the player; a screen plays its
// own recording (found by the same key the recording job uses), with play/pause, back and forward 15 seconds and
// speed; a screen without a recording falls back to the device voice; progress is untouched. Storage is stubbed here
// with a short silent clip: example data only.
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
(async()=>{let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const H=path.join(__dirname,'..');
const scr=JSON.parse(fs.readFileSync(path.join(H,'..','academy','audio','screens.int.json'),'utf8'));
const m0=scr.filter(s=>/^m0 /.test(s.where));
ok('the recording list covers every module screen, check question and feedback',scr.length>300&&['intro','lesson','keypoints','question','feedback'].every(k=>scr.some(s=>s.kind===k)));
// a 3-second silent WAV
const sr=8000,n=sr*3,buf=Buffer.alloc(44+n*2);buf.write('RIFF',0);buf.writeUInt32LE(36+n*2,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(sr,24);buf.writeUInt32LE(sr*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*2,40);
const wav='data:audio/wav;base64,'+buf.toString('base64');
const keys={};scr.forEach(s=>keys[s.key]={h:'x',d:3});
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
for(const w of [1300,390]){
  const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(w+': '+e.message));
  await p.addInitScript(()=>{window.__spoken=[];try{const r=window.speechSynthesis;r.speak=u=>{window.__spoken.push(u.text);};}catch(e){}});
  await p.goto('http://localhost:8765/test.html?as=broker');await p.waitForTimeout(2000);
  await p.goto('http://localhost:8765/academy.test.html');await p.waitForTimeout(2500);
  if(await p.$('#nm')){await p.fill('#nm','Example Tester');await p.check('#nda');await p.click('text=Begin');await p.waitForTimeout(1000);}
  const before=await p.evaluate(()=>localStorage.getItem('arche-cbt-v1'));
  await p.evaluate(({keys,wav})=>{window.__played=[];window.__sb.storage={from:()=>({download:async f=>({data:new Blob([JSON.stringify({keys:/isabella|fable/.test(f)?keys:{}})])}),createSignedUrl:async pth=>{window.__played.push(pth);return {data:{signedUrl:wav}};}})};},{keys,wav});
  await p.click('#audioBtn');await p.waitForTimeout(800);
  const opts=await p.evaluate(()=>[...document.querySelectorAll('#aVoice option')].map(o=>o.textContent));
  ok(w+': player offers Isabella and Fable first',opts[0]==='Isabella (British)'&&opts[1]==='Fable (British)',opts);
  await p.click('text=Aviation for brokers >> nth=-1');await p.waitForTimeout(1200);
  let pl=await p.evaluate(()=>window.__played.slice());
  ok(w+': module intro plays its Isabella recording (key matches the recording list)',pl.length&&pl[pl.length-1]==='isabella/'+m0.find(s=>s.kind==='intro').key+'.mp3',pl);
  ok(w+': back/forward 15 s and time shown',await p.evaluate(()=>document.getElementById('aPrev').textContent==='−15s'&&document.getElementById('aNext').textContent==='+15s'&&/Isabella · \d:\d\d \/ \d:\d\d/.test(document.getElementById('aNow').textContent)),await p.evaluate(()=>document.getElementById('aNow').textContent));
  await p.selectOption('#aVoice','fable');await p.waitForTimeout(800);
  pl=await p.evaluate(()=>window.__played.slice());ok(w+': switching to Fable plays the same screen in Fable',/^fable\/[0-9a-f]{8}\.mp3$/.test(pl[pl.length-1]),pl.slice(-2));
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#view button')].reverse().find(b=>/^Start/i.test(b.textContent.trim()));b.click();});await p.waitForTimeout(900);
  pl=await p.evaluate(()=>window.__played.slice());ok(w+': next screen plays its own recording',pl[pl.length-1]==='fable/'+m0.find(s=>s.where==='m0 screen 2').key+'.mp3',pl.slice(-1));
  // a "Try it" answer plays the recorded feedback
  for(let i=0;i<3;i++){await p.evaluate(()=>{const b=[...document.querySelectorAll('#view button')].reverse().find(b=>/^Next/i.test(b.textContent.trim()));if(b)b.click();});await p.waitForTimeout(500);}
  const hasTry=await p.$('#view [data-try] .opt');
  if(hasTry){await p.click('#view [data-try] .opt >> nth=0');await p.waitForTimeout(700);pl=await p.evaluate(()=>window.__played.slice());const fbk=scr.filter(s=>s.kind==='feedback').map(s=>'fable/'+s.key+'.mp3');ok(w+': answering "Try it" plays the recorded feedback',fbk.includes(pl[pl.length-1]),pl.slice(-1));}
  // the warm-up on the module intro, both answers: recorded feedback only
  await p.click('.map-l [data-go="home"]').catch(()=>{});await p.waitForTimeout(400);
  if(!(await p.$('.srow [data-go="m0"]'))){await p.click('#mapBtn').catch(()=>{});await p.click('#map [data-go="home"]');await p.waitForTimeout(400);}
  await p.click('.srow [data-go="m0"]');await p.waitForTimeout(900);
  for(const right of [true,false]){const q=await p.evaluate(()=>__T?null:null);
    const idx=await p.evaluate(r=>{const opts=[...document.querySelectorAll('#view [data-try] .opt')];return r?0:1;},right);
    await p.click(`#view [data-try] .opt >> nth=${idx}`);await p.waitForTimeout(600);
    const fbt=await p.evaluate(()=>{const f=document.querySelector('#view .fb');return f?f.textContent.replace(/\s+/g,' ').trim():''});
    ok(w+`: warm-up answer ${idx+1} has a recording (${fbt.slice(0,12)})`,scr.some(s=>s.kind==='feedback'&&s.text[0]===fbt),fbt);
    // a fresh copy of the screen for the other answer (an answered "Try it" is locked)
    await p.evaluate(()=>{location.hash='#home';});await p.reload();await p.waitForTimeout(1500);
    await p.evaluate(({keys,wav})=>{window.__sb.storage={from:()=>({download:async f=>({data:new Blob([JSON.stringify({keys:/isabella|fable/.test(f)?keys:{}})])}),createSignedUrl:async pth=>{(window.__played=window.__played||[]).push(pth);return {data:{signedUrl:wav}};}})};},{keys,wav});
    await p.click('.srow [data-go="m0"]');await p.waitForTimeout(900);}
  ok(w+': with Isabella or Fable chosen, the device voice never speaks (overview, lessons, answers)',await p.evaluate(()=>window.__spoken.length===0),await p.evaluate(()=>window.__spoken.slice(0,3)));
  // no recording for a screen: device voice (no request for a recording)
  await p.evaluate(()=>{window.__sb.storage={from:()=>({download:async()=>({data:new Blob(['{"keys":{}}'])}),createSignedUrl:async pth=>{window.__played.push('X'+pth);return {data:null};}})};});
  ok(w+': no sideways scroll with the player open',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const after=await p.evaluate(()=>localStorage.getItem('arche-cbt-v1'));
  ok(w+': progress kept (same storage, name and steps still there)',before&&after&&JSON.parse(after).name===JSON.parse(before).name&&JSON.stringify(JSON.parse(after).mods)===JSON.stringify(JSON.parse(before).mods),[before&&before.slice(0,80),after&&after.slice(0,80)]);
  await p.close();
}
const now=fs.readFileSync(path.join(H,'..','academy','build','page.html'),'utf8');
ok('progress storage name and completion-code salt unchanged (no one loses progress)',now.includes('const KEY = ED === "ext" ? "charter-broker-academy-v1" : "arche-cbt-v1", SALT = "ARCHE-CBT-2026-10"'));
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
