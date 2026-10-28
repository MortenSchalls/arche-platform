"""Builds test.html: the portal with an in-browser stand-in database and example data only.

For trying the portal as owner, operations and broker without sign-in and without touching the real
database (Morten, 21 Oct 2026). Everything is kept in this browser only (localStorage) and can be reset.
Run after every change to index.html:  python3 build_test.py
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
OWN, OPS, BRK, BRK2, CAND = ("00000000-0000-4000-8000-0000000000a1", "00000000-0000-4000-8000-0000000000a2", "00000000-0000-4000-8000-0000000000a3", "00000000-0000-4000-8000-0000000000a4", "00000000-0000-4000-8000-0000000000a5")
SCREEN = {"auto": {"result": "no match", "at": "2026-10-20T05:00:00Z", "lists": ["OFAC", "UN", "EU", "UK"], "hits": []}}
SEED = {
    "profiles": [
        {"id": OWN, "role": "owner", "active": True, "contract_name": "Test Owner", "data": {}},
        {"id": OPS, "role": "ops", "active": True, "contract_name": "Test Operations", "base": "Bangkok", "data": {"roster": True, "example": True}},
        {"id": BRK, "role": "broker", "active": True, "contract_name": "Test Broker", "base": "Remote", "book": False, "data": {"roster": True, "example": True}},
        {"id": BRK2, "role": "broker", "active": True, "contract_name": "Test Broker 2", "base": "Remote", "book": False, "data": {"roster": True, "example": True}},
        {"id": CAND, "role": None, "active": False, "contract_name": "", "data": {}}],
    "config": [{"key": "terms", "value": {"margin": 0.09, "unit": 45000, "threshold": 8, "rate1": 0.27, "rate2": 0.35, "consultRate": 0.10}},
               {"key": "company", "value": {"name": "Example Company Pte. Ltd.", "reg": "000000000X", "address": "1 Example Street, Singapore 000000", "email": "charter@example.com", "phone": "+65 0000 0000", "web": "example.com", "signName": "Test Owner", "signTitle": "Director", "privacy": "privacy@example.com"}}],
    "agreements": [], "enquiry_pool": [], "enquiry_contacts": [], "trips": [], "trip_status": [], "leads": [], "optouts": [], "rfqs": [], "audit_log": [], "owner_prospects": [],
    "prospects": [
        {"id": "p001", "data": {"org": "Example Family Office", "kind": "client", "status": "new", "segment": "Family office", "region": "Asia-Pacific", "country": "Singapore",
                                "why": "Example prospect for testing.", "approach": "Example approach.", "source": "https://example.org/fo"}},
        {"id": "p002", "data": {"org": "Example Air Operator", "kind": "operator", "segment": "Operator", "status": "new", "region": "Asia-Pacific", "country": "Singapore",
                                "why": "Example operator for testing.", "approach": "Example.", "source": "https://example.org/op",
                                "ops": {"aoc": {"authority": "CAAS", "source": ""}, "bases": ["WSSL"], "fleet": [{"type": "Example Jet", "count": 2}],
                                        "audits": [{"name": "ARGUS", "level": "Platinum", "year": "2025", "url": "https://example.org/argus"}], "safety": [], "tier": "A", "flags": [], "screen": {"country": "clear", "entity": "", **SCREEN}}}},
        {"id": "p003", "data": {"org": "Example FBO One", "kind": "service", "segment": "Service partner", "category": "FBO and ground handling", "airports": ["WSSL", "VTBD"], "status": "new",
                                "region": "Asia-Pacific", "country": "Singapore", "source": "https://example.org/fbo-one", "website": "https://example.org", "why": "Example.", "approach": "Example.",
                                "isbah": {"level": "Stage 2", "year": "2025", "url": "https://example.org/isbah"}, "flags": [], "screen": SCREEN,
                                "avenues": [{"type": "email", "label": "Operations desk", "url": "mailto:ops@example.org"}]}},
        {"id": "p004", "data": {"org": "Example FBO Two", "kind": "service", "segment": "Service partner", "category": "FBO and ground handling", "airports": ["WSSL"], "status": "new",
                                "region": "Asia-Pacific", "country": "Singapore", "source": "https://example.net/fbo-two", "website": "https://example.net", "why": "Example.", "approach": "Example.",
                                "flags": ["No IS-BAH registration found: check handling standards before relying on them."], "screen": SCREEN}},
        {"id": "p005", "data": {"org": "Example Crew Hotel", "kind": "service", "segment": "Service partner", "category": "Crew hotels", "airports": ["WSSL"], "status": "new",
                                "region": "Asia-Pacific", "country": "Singapore", "source": "https://example.com/hotel", "website": "https://example.com", "why": "Example.", "approach": "Example.",
                                "hotel": {"type": "hotel", "minutes": 10, "minutesUrl": "https://example.com/hotel", "shuttle": "Own airport shuttle, 24/7", "shuttleUrl": "https://example.com/hotel"}, "flags": [], "screen": SCREEN}},
        {"id": "p006", "data": {"org": "Example Flight Kitchen", "kind": "service", "segment": "Service partner", "category": "In-flight catering", "airports": ["WSSL"], "status": "new",
                                "region": "Asia-Pacific", "country": "Singapore", "source": "https://example.org/kitchen", "why": "Example.", "approach": "Example.", "flags": [], "screen": SCREEN}}],
    "website_enquiries": [{"id": "w001", "at": "2026-10-25T01:30:00Z", "handled": False, "consent": True, "data": {"type": "quote", "legs": [{"from": "VTBD", "to": "WSSL", "date": "2026-11-06"}], "pax": "4", "name": "Example Website Client", "reach": "client@example.com", "reply": "email"}}],
}

HARNESS = """<script>
/* TEST VERSION: example data only, kept in this browser. Nothing reaches the real portal or database. */
(function(){
  var KEY = "arche.test.v3", ROLES = {owner: "%(own)s", ops: "%(ops)s", broker: "%(brk)s", broker2: "%(brk2)s", candidate: "%(cand)s"};
  var as = (new URLSearchParams(location.search).get("as") || "").toLowerCase();
  try { if (!ROLES[as]) as = localStorage.getItem(KEY + ".as") || "owner"; localStorage.setItem(KEY + ".as", as); } catch (e) { if (!ROLES[as]) as = "owner"; }
  window.__UID = ROLES[as]; window.__TEST_AS = as;
  var seed = %(seed)s, T = null;
  try { T = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  window.__T = T || seed;
  var last = "";
  setInterval(function(){ try { var s = JSON.stringify(window.__T); if (s !== last) { localStorage.setItem(KEY, s); last = s; } } catch (e) {} }, 800);
  window.__testSwitch = function(r){ try { localStorage.setItem(KEY, JSON.stringify(window.__T)); } catch (e) {} try { localStorage.setItem(KEY + ".as", r); } catch (e) {} if (/[?&]as=/.test(location.search)) location.search = "?as=" + r; else location.reload(); };
  window.__testReset = function(){ if (!window.__testArmed) { window.__testArmed = 1; var b = document.getElementById("tvReset"); if (b) b.textContent = "Click again to wipe all test data"; return; } try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
  document.addEventListener("DOMContentLoaded", function(){
    var bar = document.createElement("div"); bar.id = "testBar";
    bar.innerHTML = '<style>#testBar{background:#985a00;color:#fff;font:600 13px/1.4 "Hanken Grotesk",system-ui,sans-serif;padding:8px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}#testBar b{letter-spacing:.08em}#testBar select,#testBar button{font:inherit;font-size:12px;padding:3px 8px;border:1px solid #fff;background:transparent;color:#fff;border-radius:4px}#testBar option{color:#000}</style>'
      + '<b>TEST VERSION</b><span>Example data in this browser only. Nothing reaches the real portal.</span>'
      + '<label>Acting as <select id="tvAs" aria-label="Act as"><option value="owner">Test Owner</option><option value="ops">Test Operations</option><option value="broker">Test Broker</option><option value="broker2">Test Broker 2</option><option value="candidate">New candidate</option></select></label>'
      + '<button type="button" id="tvReset">Reset test data</button>';
    document.body.insertBefore(bar, document.body.firstChild);
    var sel = document.getElementById("tvAs"); sel.value = as; sel.onchange = function(){ window.__testSwitch(sel.value); };
    document.getElementById("tvReset").onclick = window.__testReset;
  });
})();
</script>"""


def build():
    src = (HERE / "index.html").read_text(encoding="utf-8")
    cdn = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>'
    assert src.count(cdn) == 1, "supabase script tag not found"
    fake = (HERE / "tests" / "fake-supabase.js").read_text(encoding="utf-8")
    harness = HARNESS % {"own": OWN, "ops": OPS, "brk": BRK, "brk2": BRK2, "cand": CAND, "seed": json.dumps(SEED)}
    live = (HERE / "tests" / "live-train.js").read_text(encoding="utf-8")   # live training: share or watch the test portal (28 Oct 2026)
    out = src.replace(cdn, harness + "\n<script>\n" + fake + "\n</script>\n<script>\n" + live + "\n</script>")
    out = out.replace("<title>", "<title>TEST · ", 1)
    out = '<meta charset="utf-8">\n' + out
    # inside a claude.ai artifact the viewer owns window.claude, so the test version uses its own name
    out = out.replace("window.claude", "window.__arche").replace("claude.use", "__arche.use").replace('<script src="platform.js"></script>', '<script src="platform.test.js"></script>')
    out = out.replace('href="academy.html" target="_blank" rel="noopener"', 'href="academy.test.html"')
    plat = (HERE / "platform.js").read_text(encoding="utf-8")
    use_old = 'window.claude = Object.freeze({ use: async name => { await ready; return caps[name] ?? null; } });'
    assert use_old in plat
    # AI and downloads go through the claude.ai viewer when the test version runs as an artifact
    plat = plat.replace(use_old, 'window.__arche = Object.freeze({ use: async name => { await ready; if ((name === "sample" || name === "downloads") && window.claude && typeof window.claude.use === "function") { try { const v = await window.claude.use(name); if (v) return v; } catch (e) {} } return caps[name] ?? null; } });')
    (HERE / "platform.test.js").write_text(plat, encoding="utf-8")
    # the academy, on the same example data
    ac = (HERE / "academy.html").read_text(encoding="utf-8")
    assert ac.count(cdn) == 1
    ac = ac.replace(cdn, harness + "\n<script>\n" + fake + "\n</script>").replace('<script src="platform.js"></script>', '<script src="platform.test.js"></script>')
    ac = ac.replace("window.claude", "window.__arche").replace('<a href="./" ', '<a href="test.html" ')
    (HERE / "academy.test.html").write_text('<!doctype html>\n<meta charset="utf-8">\n' + ac, encoding="utf-8")
    (HERE / "test.html").write_text(out, encoding="utf-8")
    print("test.html written", len(out), "bytes")


if __name__ == "__main__":
    build()
