#!/usr/bin/env python3
"""Write site/terms.html from Part B of the charter confirmation (apps/charter-confirmation/charter-confirmation-v6.html).

The contract stays the master: change the terms there, then run build.py. The cancellation scale (A9) is shown too,
because Part B refers to it. The build stops if the terms ever mention payment by bank transfer (Paynode only).
"""
import os, re, json, subprocess, html

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "charter-confirmation", "charter-confirmation-v6.html")
OUT = os.path.join(HERE, "site", "terms.html")

def extract():
    s = open(SRC, encoding="utf-8").read()
    js = "\n".join(re.search(rf"const {name} = .*?;\n", s, re.S).group(0) for name in ("CANCEL", "PART_B_INTRO"))
    i = s.index("const PART_B = ["); j = s.index("\n];", i) + 3
    js += s[i:j] + "\nconsole.log(JSON.stringify({CANCEL, PART_B_INTRO, PART_B}));"
    return json.loads(subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout)

def page(d):
    e = html.escape
    rows = "".join(f"<tr><td>{e(a)}</td><td>{p}%</td></tr>" for a, p in d["CANCEL"])
    body = []
    for c in d["PART_B"]:
        items = list(c.get("items") or [])
        assert "bank transfer" not in json.dumps(c), c["n"] + ": clients pay only through a Paynode payment request"
        part = f'<h2 id="{c["n"].lower()}"><span>{c["n"]}</span> {e(c["t"].rstrip("."))}</h2>'
        if c.get("p"): part += f"<p>{e(c['p'])}</p>"
        if items: part += "<ol>" + "".join(f"<li>{e(x)}</li>" for x in items) + "</ol>"
        if c.get("after"): part += f"<p>{e(c['after'])}</p>"
        body.append(part)
    return f'''<!doctype html>
<!-- Built by make_terms.py from Part B of the charter confirmation. Do not edit by hand. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terms of business · Archē Executive</title>
<meta name="description" content="The general conditions that apply to every private jet charter Archē Executive arranges.">
<link rel="canonical" href="https://archeaviation.com/terms.html">
<link rel="icon" href="/assets/arche-executive-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Prata&family=Hanken+Grotesk:wght@300;400;600&display=swap" rel="stylesheet">
<style>
:root {{ --bg:#34373d; --text:#c6cbd2; --ink:#f3f5f8; --muted:#a3a9b1; --line:rgba(243,245,248,0.14); --accent:#a9bdd4; }}
body {{ margin:0; background:var(--bg); color:var(--text); font:300 16px/1.7 'Hanken Grotesk', system-ui, sans-serif; -webkit-font-smoothing:antialiased; }}
main {{ max-width:760px; margin:0 auto; padding:48px 16px 80px; }}
a {{ color:var(--accent); }}
.brand {{ display:block; text-align:center; text-decoration:none; color:var(--ink); font:600 30px/1 Cinzel, serif; letter-spacing:.22em; margin-bottom:40px; }}
h1 {{ font:400 clamp(30px,5vw,42px)/1.2 Prata, serif; color:var(--ink); margin:0 0 8px; }}
h2 {{ font:400 21px/1.3 Prata, serif; color:var(--ink); margin:36px 0 8px; padding-top:20px; border-top:1px solid var(--line); }}
h2 span {{ font:600 13px/1 'Hanken Grotesk', sans-serif; letter-spacing:.14em; color:var(--accent); margin-right:8px; vertical-align:middle; }}
ol {{ padding-left:22px; }} li {{ margin:6px 0; }}
.muted {{ color:var(--muted); font-size:14px; }}
table {{ border-collapse:collapse; width:100%; margin:12px 0; font-size:15px; }}
td {{ padding:10px 0; border-bottom:1px solid var(--line); }} td:last-child {{ text-align:right; color:var(--ink); }}
</style>
</head>
<body>
<main>
<a class="brand" href="/">ARCHĒ</a>
<h1>Terms of business</h1>
<p class="muted">Arche Executive Pte. Ltd., trading as Archē Executive · General conditions (Part B of the charter confirmation)</p>
<p>{e(d["PART_B_INTRO"])}</p>
<p>Each trip also has its own terms in Part A of your confirmation: price, payment dates, what is included and the cancellation scale. References below to A3, A7 and A9 point there.</p>
<h2 id="a9"><span>A9</span> Cancellation scale</h2>
<p>Charge as a share of the charter price, by time before the first departure:</p>
<table>{rows}</table>
{"".join(body)}
<p class="muted" style="margin-top:48px"><a href="/privacy.html">Privacy notice</a> · <a href="/">Back to Archē Executive</a></p>
</main>
</body>
</html>
'''

if __name__ == "__main__":
    open(OUT, "w", encoding="utf-8").write(page(extract()))
    print("  terms page:", OUT)
