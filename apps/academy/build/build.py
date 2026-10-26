# Builds both editions from one source:
#   int = Arche internal academy (arche-broker-academy.html)
#   ext = Charter Broker Academy for external brokers (charter-broker-academy.html), Arche-specific parts removed
import base64, subprocess, re, os
SEAL = os.environ.get("ACADEMY_SEAL_KEY", "AX-7Q2-2026-10")  # set a new key in the environment before go-live
subprocess.run(["node","extract.js"],check=True,capture_output=True)
subprocess.run(["node","build_content.js"],check=True)
subprocess.run(["node","ext.js"],check=True)
import sys; sys.path.insert(0,".."); from rename import archē
for f in ["content.full.js","content.ext.full.js"]:
    _t=archē(open(f).read()); open(f,"w").write(_t)
subprocess.run(["node","seal.js",SEAL,"content.full.js","content.sealed.js"],check=True)
subprocess.run(["node","seal.js",SEAL,"content.ext.full.js","content.ext.sealed.js"],check=True)
logo='data:image/png;base64,'+base64.b64encode(open('../../../shared/brand/logo_small.png','rb').read()).decode()

EXT_TEXT = [
 ("<title>Arche Broker Academy</title>","<title>Charter Broker Academy</title>"),
 ("Your progress is saved to the Arche training records.","Your progress is saved to the course records."),
 ("Training records (director)","Training records (course owner)"),
 ('<p class="eyebrow">Arche Executive · Charter brokerage</p><h1>Broker Academy</h1>','<p class="eyebrow">by Arche Executive</p><h1>Charter Broker Academy</h1>'),
 ("The interactive version of the Master Training Manual. You learn the rules, practise them on real-world trips and on our booking form, and your results go to the director.","A complete, self-paced course for air charter brokers and charter consultants: the rules that apply worldwide, the skills of the job, real-world practice and a written exam. Successful trainees receive a certificate entered in Arche Executive's certificate register."),
 ("I will keep this training material confidential.","I will keep this licensed training material confidential."),
 ("Results are reported to the director.","Results are reported to the course provider."),
 ("reported to the director.","reported to the course provider and to my employer."),
 ("with the same checks as our charter confirmation form","with the checks every charter confirmation needs"),
 ("Confidential training material","Licensed training material"),
 ("Results are reported to the director.","Results are reported to the course provider."),
 ("escalate to the director","escalate to your manager"),
 ("recorded for the director","recorded for the course provider"),
 ("as the Arche charter confirmation form","as a professional charter confirmation form"),
 ("On live bookings you use the Arche charter confirmation form. It produces the client PDF with Part A and Part B. Your director will give you access.","At work you use your company's own charter confirmation and terms. The checks are the same."),
 ("Needs director approval.","Needs your manager's approval."),
 ("Arche Executive Broker Academy","Charter Broker Academy · by Arche Executive"),
 ("Your result is already in the Arche training records. Send the code as well if the director asks for it.","Your result is already in the course records. Keep the code: it is your certificate number."),
 ("Copy this code and email it to the director. The director checks it in the training records.","Copy this code and send it to Arche Executive with your name to have your certificate entered in the register. Employers can then verify it under Verify a certificate."),
 ("Next: Avinode and payment system training, shadowing, the practical exam with the director and supervised bookings. The director signs your training record when all stages are complete.","This certificate covers the knowledge stage: every module and the written exam. Your employer completes your practical training on live trips."),
 ("What applies to Arche","What applies to the broker"),
 ("Bank transfer to Arche's account","Bank transfer to the broker's account"),
 ("code to send to the director","code to send to the course provider"),
 ("completion code to the director","completion code to the course provider"),
 # figures
 ('box(200,40,170,64,"Arche Executive","the broker")','box(200,40,170,64,"Broker","your company")'),
 ("signs the contract with Arche, the broker. Arche requests","signs the contract with the broker. The broker requests"),
 ('<text x="20" y="40" class="t-h">Arche Executive</text><text x="20" y="62" class="t-s t-m">Charter brokerage training</text>','<text x="20" y="40" class="t-h">Charter Broker Academy</text><text x="20" y="62" class="t-s t-m">by Arche Executive</text>'),
 ('"stop, no payment, director"','"stop, no payment, manager"'),
 ("report to the director.","report to your manager."),
 ("needs the director's approval","needs your manager's approval"),
 ("escalate to the director","escalate to your manager"),
 ("Work alone on the booking ramp (Module 1)","Work alone on live bookings, building up to more complex trips"),
 ("Arche cost","Broker cost"),("an Arche cost","a broker cost"),("An Arche cost","A broker cost"),
 ('box(200,150,180,60,"Arche account","only the margin")}<text x="410" y="160" class="t-s t-m">Citi Singapore</text><text x="410" y="178" class="t-s t-m">(being set up)</text>','box(200,150,180,60,"Broker account","only the margin")}'),
 ("Operator money never passes through Arche's own account.","Operator money never passes through the broker's own account."),
 ("Only Arche's margin moves to Arche's own account at Citi Singapore.","Only the broker's margin moves to the broker's own account."),
]
import json
CAP = {"cat_tp":"Turboprop: Pilatus PC-12NG","cat_light":"Light jet: Embraer Phenom 300","cat_mid":"Midsize jet: Learjet 60","cat_smid":"Super-midsize jet: Bombardier Challenger 350","cat_heavy":"Heavy jet: Dassault Falcon 900LX","cat_ulr":"Ultra-long-range jet: Bombardier Global 7500","cat_vip":"VIP airliner: Boeing Business Jet","fam_g650":"Gulfstream G650ER","fam_f8x":"Dassault Falcon 8X","cabin_lt":"Light jet cabin: Embraer Phenom 300","cabin_lg":"Super-midsize cabin: Hawker 4000","cabin_ulr":"Ultra-long-range cabin: Bombardier Global 7500","deice":"De-icing a wing before departure"}
def photos_js():
    meta=json.load(open('img/meta.json')); out={}
    for k,m in meta.items():
        out[k]={"src":"data:image/jpeg;base64,"+base64.b64encode(open('img/%s.jpg'%k,'rb').read()).decode(),"cap":CAP[k],"artist":m["artist"],"lic":m["lic"],"page":m["page"]}
    return "const PHOTOS = "+json.dumps(out)+";"
def build(ed, content, out, test):
    s=open('page.html').read()
    a="  renderMap(); route();\n}\n\n/* ---------- helpers"
    assert s.count(a)==1
    s=s.replace(a,"  renderMap(); if (VIEW.id === \"home\" || VIEW.id === \"start\" || VIEW.id === \"records\") render();\n}\n\n/* ---------- helpers")
    s=s.replace('__LOGO__',logo).replace('__CONTENT__',open(content).read()+'\n/*__PHOTOS__*/').replace('"__ED__"','"%s"'%ed)
    assert s.count('/* ---------- map ---------- */')==1
    s=s.replace('/* ---------- map ---------- */', open('figs.js').read()+'\n/* ---------- map ---------- */')
    if ed=="ext":
        for a,b in EXT_TEXT:
            if a not in s: print("  (ext text not found:", a[:60], ")")
            s=s.replace(a,b)
        left=[m for m in re.findall(r'.{0,50}\bArche\b.{0,50}', s) if not re.search(r'by Arche Executive|alt="Arche Executive"|Arche Executive\.|ARCHE|Arche completion code|to Arche Executive|by Arche Executive|contact Arche Executive|issued by Arche Executive|Arche Executive\'s certificate', m)]
        left=[m for m in left if not m.strip().startswith('/*') and 'Layout:' not in m]
        print("ext: Arche mentions outside branding:", len(left)); [print("   ", x) for x in left[:20]]
        left2=re.findall(r'.{0,40}\bdirector\b(?!s).{0,40}', re.sub(r'/\*.*?\*/|//[^\n]*','',s))
        print("ext: 'director' mentions:", len(left2)); [print("   ", x) for x in left2[:20]]
    s=archē(s)
    s=s.replace('/*__PHOTOS__*/',photos_js(),1)
    open(out,'w').write(s)
    t=s.replace("/* ---------- helpers ---------- */","/* ---------- helpers ---------- */\nwindow.__T = () => ({MODS, LAB, COURSE, PATHS, REF, readCode, ST, ED, HIDDEN});",1)
    assert "  return {screen, focus, speakable};" in t
    t=t.replace("  return {screen, focus, speakable};","  window.__AUD = {speakable, collect}; return {screen, focus, speakable};")
    open(test,'w').write(t)
    print(ed,'release',len(s))
build("int","content.sealed.js","arche-broker-academy.html","t_full.html")
build("ext","content.ext.sealed.js","charter-broker-academy.html","t_ext.html")
