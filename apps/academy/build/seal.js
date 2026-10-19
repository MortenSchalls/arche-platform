// Build step: removes plain answer keys from the course content; the page checks answers against hashes.
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(process.argv[3]||'content.full.js','utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(src+';this.L=L;this.COURSE=COURSE;this.PILOT_REQ=PILOT_REQ;this.PATHS=PATHS;this.REF=REF;this.MODS=MODS;this.ISSUES=ISSUES;this.LAB=LAB;this.BOOK=BOOK;',ctx);
const K=process.argv[2];
const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');};
const sealQ=q=>{q.h=fnv(K+q.q+'|'+q.a);delete q.a;return q;};
for(const m of Object.values(ctx.MODS)){m.quiz.forEach(sealQ);m.secs.forEach(s=>s.b.forEach(b=>{if(b.tryq)sealQ(b.tryq);}));}
const shuffle=(a,seed)=>{a=a.slice();let s=seed;for(let i=a.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=Math.floor(s/233280*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
ctx.LAB=ctx.LAB.map((x,k)=>({t:x.t,o:shuffle([x.i,...x.d],k+3),hc:fnv(K+x.t+'|c|'+x.c),hi:fnv(K+x.t+'|i|'+x.i),why:x.why}));
const J=JSON.stringify;
fs.writeFileSync((process.argv[4]||'content.sealed.js'),['L','COURSE','PATHS','PILOT_REQ','MODS','REF','ISSUES','LAB','BOOK'].map(n=>`const ${n} = ${J(ctx[n])};`).join('\n'));
console.log('sealed',fs.statSync((process.argv[4]||'content.sealed.js')).size);
