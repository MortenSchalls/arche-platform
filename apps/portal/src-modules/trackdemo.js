/* ---------- Tracking demo (Morten, 28 Oct 2026: "make a dummy booking with a real aircraft registration … until I delete the test") ----------
   Owner only. Opening the portal with ?demo=track&reg=9V-SNA&from=WSSS&to=EGLL&time=13:12&dep=2026-10-28T05:12Z asks the owner, then adds one
   TEST trip flying today on that real aircraft, confirmed and paid, with the first leg "Departed", so flight following, the Track window
   and the Today flights list can be shown. Marked Example: Team > "Remove example data" deletes it, or delete the two records by hand.
   Example client only, price 0 (no effect on figures); no confirmation number is used and nothing is sent to anyone outside. */
(function(){
  let done = false;
  async function make(q){
    const reg = String(q.get("reg") || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 10), ap = k => String(q.get(k) || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    const from = ap("from"), to = ap("to"), time = /^\d{2}:\d{2}$/.test(q.get("time") || "") ? q.get("time") : "", dep = Date.parse(String(q.get("dep") || "").replace(/Z?$/, "Z"));
    if (!reg || from.length < 3 || to.length < 3) { toast("Tracking demo: registration, from and to are needed."); return; }
    if (!confirm(`Add a TEST trip for the tracking demo?\n\n${from} → ${to} today on ${reg}, confirmed and paid, example client, price 0.\nIt is marked Example; remove it with Team > Remove example data.`)) return;
    const today = new Date().toLocaleDateString("en-CA"), did = ("test-track-" + today + "-" + reg).toLowerCase(), at = now();
    const leg = {from, to, date: today, time, pax: 1};
    await S.db.doc(`desk/${S.uid}/deals/${did}`).set({example: true, created: at, updated: at, client: {name: "TEST tracking demo", company: "TEST tracking demo", email: "test@example.com"},
      trip: {legs: [leg], category: "", notes: "TEST: tracking demo only, not a booking. Delete with Team > Remove example data."},
      quote: {operator: "TEST operator (demo only)", aircraft: "Demo aircraft", tail: reg, opPrice: 0, direct: 0, cur: "USD"}, stage: "quoted", checks: {}, docs: []});
    await S.db.doc(`status/${S.uid}/deals/${did}`).set({example: true, ref: "TEST-TRACK", state: "clientPaid", clientPaid: true, price: 0, issuedAt: at, updatedAt: at,
      legStatus: [{s: "dep", at: isNaN(dep) ? at : new Date(dep).toISOString(), note: "TEST: demo flight", set: at}],
      history: [{t: at, by: "ops", a: "TEST trip added for the tracking demo"}]});
    audit("TEST tracking demo trip added", `${reg} ${from}-${to} ${today}`);
    S.sel = did; S.view = "trips"; render(); toast("TEST trip added. Scroll to Flight following and click a Track link.");
    setTimeout(() => { const f = document.getElementById("followPanel"); if (f) f.scrollIntoView({behavior: "smooth", block: "start"}); }, 900);
  }
  const _rn = renderNow;
  renderNow = function(){ _rn();
    if (done || S.role !== "owner" || S.preview || !S.db) return;
    const q = new URLSearchParams(location.search); if (q.get("demo") !== "track") return;
    done = true; history.replaceState(null, "", location.pathname + location.hash);
    setTimeout(() => make(q).catch(e => toast("Tracking demo: could not add the trip (" + (e.message || e) + ").")), 300);
  };
})();
