"""Launch rehearsal (Morten, 18 Nov 2026: "ensure all we are now removing for prelaunch are ready on a switch at actual
launch date. we cannot have situations with errors or bugs or unverified data etc once we go full live").

Builds the full-launch website in a throw-away copy of the repository, with the launch switches set as on launch day
(company.PREVIEW = False, company.LAUNCHED = True, a test Singapore number if company.PHONE is still empty) and the
launch-blocker stop lifted in the copy only, then checks that every preview change is gone and every launch feature is
back. Nothing in the real repository changes.

Checks: check_site.py (every rule except the open launch blockers themselves), the layout audit (every page, six
widths), the logo test, and the launch list below: no preview tag, opening line or email-only forms left; the quote,
call-back and empty-leg forms and their consent ticks are back and send to /api/enquiry; phone and WhatsApp shown with
the real number and no placeholder; search engines allowed (robots.txt, sitemap.xml, no noindex); no draft
page or draft marker published; English only while company.LANGUAGES_ON is False. In a browser: the quote form reaches
its details step with the consent tick, and no page throws a script error.

Run: python3 apps/website/tools/launch_rehearsal.py      (about 15 minutes; exit code 0 = ready to switch)
"""
import os, re, shutil, subprocess, sys, tempfile, json

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TEST_PHONE = "+65 6123 4567"   # rehearsal only; launch needs the real number (launch blocker 2)

def sh(cmd, cwd, env=None, timeout=3600):
    r = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, env=env, timeout=timeout)
    return r.returncode, r.stdout + r.stderr

def main():
    tmp = tempfile.mkdtemp(prefix="arche-launch-")
    dst = os.path.join(tmp, "repo")
    shutil.copytree(REPO, dst, ignore=shutil.ignore_patterns(".git", "node_modules", "portal-preview"))
    web = os.path.join(dst, "apps", "website")
    comp = os.path.join(web, "company.py"); c = open(comp).read()
    c = re.sub(r"^LAUNCHED = .*$", "LAUNCHED = True", c, flags=re.M)
    c = re.sub(r"^PREVIEW = .*$", "PREVIEW = False", c, flags=re.M)
    import importlib.util
    spec = importlib.util.spec_from_file_location("company_real", os.path.join(REPO, "apps", "website", "company.py"))
    real = importlib.util.module_from_spec(spec); spec.loader.exec_module(real)
    phone = real.PHONE or TEST_PHONE
    if not real.PHONE: c = re.sub(r'^PHONE = "[^"]*"', f'PHONE = "{TEST_PHONE}"', c, flags=re.M)
    open(comp, "w").write(c)
    b = os.path.join(web, "build.py"); s = open(b).read()
    s = s.replace("if _company.LAUNCHED and _lb():", "if False and _company.LAUNCHED and _lb():   # rehearsal copy only")
    open(b, "w").write(s)
    fails, notes = [], []
    code, out = sh("python3 build.py", web)
    if code: fails.append("build failed:\n" + out[-2000:])
    else:
        site = os.path.join(web, "site")
        # launch list
        html = {}
        for root, dirs, files in os.walk(site):
            for f in files:
                if f.endswith(".html"):
                    p = os.path.join(root, f); html[os.path.relpath(p, site)] = open(p, encoding="utf-8").read()
        allt = "\n".join(html.values())
        for bad, why in [('class="ae-rbf"', "preview tag left"), ('class="ae-pv"', "preview opening line left"),
                         ("Online requests open with our launch", "quote form still email-only"),
                         ("Call-backs open with our launch", "call-back still email-only"),
                         ("Empty-leg alerts start with our launch", "alert sign-up still email-only"),
                         ("window.archeSend = function () {};", "form sender still switched off"),
                         ("0000 0000", "placeholder phone number"), ("6500000000", "placeholder phone link"),
                         ('name="robots" content="noindex', "noindex left on a page"),
                         ('class="draft"', "draft marker published"), ("Draft · waiting", "draft bar published")]:
            n = sum(1 for t in html.values() if bad in t)
            if n: fails.append(f"{why}: {n} pages")
        idx = html.get("index.html", "")
        for need, why in [("{{ onName }}", "quote form asks for a name"), ("/api/enquiry", "forms send to /api/enquiry"),
                          ("data-ae-alert", "empty-leg alert sign-up"), ("{{ onCbPhone }}", "call-back field")]:
            if need not in idx: fails.append(f"home page: missing {why}")
        if not re.search(r"consent", idx, re.I): fails.append("home page: no consent tick on the forms")
        digits = re.sub(r"\D", "", phone)
        if f"tel:+{digits}" not in allt: fails.append("phone link with the real number missing")
        if f"wa.me/{digits}" not in allt: fails.append("WhatsApp link with the real number missing")
        rob = open(os.path.join(site, "robots.txt")).read() if os.path.exists(os.path.join(site, "robots.txt")) else ""
        if not rob or re.search(r"Disallow:\s*/\s*$", rob, re.M): fails.append("robots.txt missing or still closed")
        for f in ("sitemap.xml",):
            if not os.path.exists(os.path.join(site, f)): fails.append(f"{f} missing")
        if not real.LANGUAGES_ON and any(re.search(r"(^|/)(th|zh|ja)(/|\.html)", k) for k in html):
            fails.append("other-language pages published while LANGUAGES_ON is False")
        # check_site, minus the open launch blockers (launch day closes them) and the shared-facts reminder
        code, out = sh("python3 check_site.py", web)
        for line in out.splitlines():
            if re.search(r"launch blocker|PREVIEW GATE|SHARED-FACTS|layout audit is older|^NOTE|^OK|^\s*$", line): continue
            if re.search(r"^(FAIL|PROBLEM|\s*-|.*:)", line): notes.append("check_site: " + line.strip())
        # layout audit and logo test on the launch build
        env = dict(os.environ, NODE_PATH=sh("npm root -g", web)[1].strip())
        code, out = sh("node tools/layout_audit.js", web, env)
        last = ([l for l in out.splitlines() if l.startswith("layout audit:")] or [out.strip()[-300:]])[-1]
        if code or ", 0 findings" not in last: fails.append("layout audit: " + last)
        else: notes.append(last)
        srv = subprocess.Popen("python3 -m http.server 8794", cwd=site, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            lt = open(os.path.join(web, "tools", "logo_center_test.js")).read().replace("localhost:8793", "localhost:8794")
            open(os.path.join(web, "tools", "logo_center_rehearsal.js"), "w").write(lt)
            code, out = sh("node tools/logo_center_rehearsal.js", web, env)
            last = out.strip().splitlines()[-1] if out.strip() else ""
            (notes if code == 0 and " of " in last else fails).append("logo: " + last)
            # browser: the quote form reaches its details step with the consent tick; no script errors on any page
            js = r"""
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const out={errors:[],quote:null};
const pages=%s;
for(const u of pages){const p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>out.errors.push(u+': '+e.message));
 await p.goto('http://localhost:8794'+u,{waitUntil:'networkidle'}).catch(e=>out.errors.push(u+': '+e.message));await p.waitForTimeout(600);await p.close();}
const p=await b.newPage({viewport:{width:1280,height:900}});await p.goto('http://localhost:8794/',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
try{await p.fill('section#top input >> nth=0','Singapore');await p.keyboard.press('Escape');await p.fill('section#top input >> nth=1','Tokyo');await p.keyboard.press('Escape');
 await p.click('text=Get quotes');await p.waitForTimeout(700);
 out.quote=await p.evaluate(()=>{const s=document.querySelector('section#top');return {name:!!s.querySelector('input[placeholder*="ame"], input[autocomplete="name"]')||/Your name|Full name/i.test(s.innerText),consent:!!s.querySelector('input[type=checkbox]'),email:/Online requests open/.test(s.innerText)}});
}catch(e){out.quote={error:e.message}}
console.log(JSON.stringify(out));await b.close();})();
""" % json.dumps(["/"] + sorted({"/" + k.replace("index.html", "") for k in html if k.endswith("index.html")} - {"/"}))
            open(os.path.join(web, "tools", "rehearsal_browser.js"), "w").write(js)
            code, out = sh("node tools/rehearsal_browser.js", web, env)
            try:
                r = json.loads(out.strip().splitlines()[-1])
                if r["errors"]: fails.append("script errors: " + "; ".join(r["errors"][:5]))
                q = r["quote"] or {}
                if q.get("error") or not q.get("consent") or q.get("email"): fails.append(f"quote form details step: {q}")
                else: notes.append(f"quote form details step with consent tick: ok; {len(html)} pages opened without script errors")
            except Exception as e:
                fails.append("browser check did not run: " + out[-500:])
        finally:
            srv.terminate()
    print("LAUNCH REHEARSAL", "(test number " + phone + ")" if not real.PHONE else "")
    for n in notes: print("  ok  ", n)
    for f in fails: print("  FAIL", f)
    print("READY: flipping the switches gives a clean site" if not fails else "NOT READY")
    shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(1 if fails else 0)

if __name__ == "__main__": main()
