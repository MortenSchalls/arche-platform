// Phones must scroll when the finger starts on a picture (19 Nov 2026: iPhones froze on the home service photos).
// Swipes up from the middle of every picture slot on the main pages, on a touch phone, and checks the page moved.
// Serve site/ first: cd site && python3 -m http.server 8797   then: NODE_PATH=$(npm root -g) node tools/touch_scroll_test.js
const {chromium,devices}=require('playwright');const U='http://localhost:'+(process.env.PORT||8797);
(async()=>{const b=await chromium.launch();let fail=0,n=0;
for(const u of ['/','/services/','/aircraft/','/how-it-works/','/contact/']){const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();
 await p.goto(U+u,{waitUntil:'networkidle'});await p.waitForTimeout(600);const cdp=await ctx.newCDPSession(p);
 const ids=await p.evaluate(()=>[...document.querySelectorAll('image-slot')].filter(e=>{const r=e.getBoundingClientRect();return r.width>120&&r.height>120&&getComputedStyle(e).display!=='none'}).map((e,i)=>{e.setAttribute('data-ts',i);return i}));
 for(const i of ids){const box=await p.evaluate(i=>{const el=document.querySelector('[data-ts="'+i+'"]');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:Math.min(r.top+r.height/2,innerHeight-60)}},i);await p.waitForTimeout(250);
  const y0=await p.evaluate(()=>scrollY);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x,y:box.y}]});
  for(let k=1;k<=8;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x,y:box.y-k*20}]});await p.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400);
  const moved=Math.abs((await p.evaluate(()=>scrollY))-y0);n++;if(moved<40){fail++;console.log('FAIL',u,'picture',i,'moved',moved,'px')}}
 await ctx.close();}
console.log(fail?fail+' of '+n+' pictures block scrolling':'touch scroll: all '+n+' pictures let the page scroll');await b.close();process.exit(fail?1:0);})();
