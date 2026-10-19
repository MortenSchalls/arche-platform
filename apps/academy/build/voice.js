const {chromium}=require('playwright');
const SETS={
 mac:[['Samantha','en-US'],['Alex','en-US'],['Daniel','en-GB'],['Fred','en-US'],['Albert','en-US'],['Bad News','en-US'],['Zarvox','en-US'],['Karen','en-AU'],['Moira','en-IE'],['Ava (Premium)','en-US'],['Zoe (Premium)','en-US'],['Evan (Enhanced)','en-US'],['Nathan (Enhanced)','en-US'],['Serena (Premium)','en-GB'],['Aaron','en-US'],['Nicky','en-US'],['Kanya','th-TH'],['Thomas','fr-FR'],['Eddy (English (US))','en-US'],['Grandma (English (US))','en-US']],
 win:[['Microsoft David - English (United States)','en-US'],['Microsoft Zira - English (United States)','en-US'],['Microsoft Mark - English (United States)','en-US'],['Microsoft Hazel - English (United Kingdom)','en-GB'],['Microsoft Sonia Online (Natural) - English (United Kingdom)','en-GB'],['Microsoft Ryan Online (Natural) - English (United Kingdom)','en-GB'],['Microsoft Libby Online (Natural) - English (United Kingdom)','en-GB'],['Microsoft Jenny Online (Natural) - English (United States)','en-US'],['Microsoft Guy Online (Natural) - English (United States)','en-US'],['Microsoft Aria Online (Natural) - English (United States)','en-US'],['Microsoft Andrew Online (Natural) - English (United States)','en-US'],['Microsoft Natasha Online (Natural) - English (Australia)','en-AU'],['Microsoft William Online (Natural) - English (Australia)','en-AU'],['Microsoft Premwadee Online (Natural) - Thai (Thailand)','th-TH']],
 chrome:[['Google US English','en-US'],['Google UK English Female','en-GB'],['Google UK English Male','en-GB'],['Microsoft David - English (United States)','en-US'],['Microsoft Zira - English (United States)','en-US']],
 android:[['English United States','en-US'],['English United Kingdom','en-GB']],
};
(async()=>{const b=await chromium.launch();
for(const [k,list] of Object.entries(SETS)){const p=await b.newPage();
await p.addInitScript(l=>{window.SpeechSynthesisUtterance=function(t){this.text=t;};const vs=l.map(([n,lang])=>({name:n,lang,voiceURI:n}));Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{addEventListener(){},getVoices(){return vs},cancel(){},speak(u){}}});},list);
await p.goto('file://'+process.cwd()+'/t_full.html');await p.fill('#nm','Voice Test');await p.check('#nda');await p.click('#begin');await p.click('#audioBtn');
const o=await p.evaluate(()=>({opts:[...document.querySelectorAll('#aVoice option')].map(o=>o.textContent),tip:!document.querySelector('#aTip').hidden}));
console.log(k.padEnd(8),o.opts.length,'|',o.opts.join(' · '),'| tip:',o.tip);await p.close();}
await b.close();})();
