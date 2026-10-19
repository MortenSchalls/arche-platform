const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('../../manual/body38.js','utf8');
const S={};
const run=x=>typeof x==='string'?{t:x}:x;
const runs=x=>(Array.isArray(x)?x:[x]).map(run);
const ctx={
 r:(t,o={})=>({t,b:!!o.bold}), bo:t=>({t,b:true}), link:(t,u)=>({link:[t,u]}),
 P:(x)=>({k:'p',runs:runs(x)}), B:(x)=>({k:'li',runs:runs(x)}), N:(x,ref)=>({k:'nli',ref,runs:runs(x)}),
 H1:t=>({k:'h1',t}), H2:t=>({k:'h2',t}), H3:t=>({k:'h3',t}), note:t=>({k:'note',t}),
 T:(cols,rows,o)=>({k:'table',cols:cols.map(c=>c[0]),rows}), box:(t,l)=>({k:'box',t,l}), sp:()=>null,
 Paragraph:function(){return null}, ImageRun:function(){return null}, TextRun:function(){return null},
 AlignmentType:{}, BorderStyle:{}, LOGO:null, QZ:[], BLACK:'',ACC:'',LINE:'',TINT:'',MUTED:'',WidthType:{},ShadingType:{},Table:function(){return null},TableRow:function(){return null},TableCell:function(){return null},PageBreak:function(){return null},ExternalHyperlink:function(){return null},
 quiz:(mod,items)=>({k:'quiz',mod,items}),
};
vm.createContext(ctx);
vm.runInContext(body.replace(/^let NREF/m,'var NREF')+';this.C=C;',ctx);
const C=ctx.C.filter(Boolean);
fs.writeFileSync('manual.json',JSON.stringify(C));
const kinds={};C.forEach(c=>kinds[c.k]=(kinds[c.k]||0)+1);console.log(kinds);
C.filter(c=>c.k==='h1').forEach(c=>console.log(c.t));
