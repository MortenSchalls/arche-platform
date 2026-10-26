/* ---------- Website statistics and organisation links (Morten, 26 Oct 2026) ----------
   "Ensure that all traffic is monitored and used for internal analytical improvements and sales push (prospects)."
   The website (track.js → /api/collect → submit_visit) records visits without cookies or browser storage; the IP
   address is never stored. Supabase migration 0017_site_traffic.sql.
   - Owner: Website page (visits, sources, campaigns, countries, sections reached, what was used, enquiries sent,
     suggestions to improve the site, and which organisation links were opened).
   - Brokers: a website link per lead (archeaviation.com/?r=CODE). When the organisation opens it, Today shows it so
     the broker can follow up while the interest is warm. Brokers see only their own links (database rule).
   - Website enquiries on Today show where the visitor came from. */
(function(){
  if (!window.__sb) return;                                   // live platform only
  const sb = () => window.__sb;
  const SITE = "https://archeaviation.com";
  const KIND = {call:"Call", whatsapp:"WhatsApp", email:"Email", quote_start:"Quote form started", quote_sent:"Quote sent", callback_start:"Call-back started", callback_sent:"Call-back sent", finder:"Aircraft finder", language:"Language", portal:"Portal link", section:"Section"};
  const SEC = {services:"Services", why:"Why Archē", fleet:"Aircraft", journey:"How it works", contact:"Contact"};
  const CTRY = c => { try { return new Intl.DisplayNames(["en"], {type: "region"}).of(c) || c; } catch(e){ return c || "?"; } };
  const pct = (a, b) => b ? Math.round(100 * a / b) + "%" : "–";
  S.web = S.web || {days: 30, stats: null, loading: false, err: "", links: null, opens: null, byCode: {}};

  /* ---- owner page ---- */
  async function loadStats(){
    if (S.web.loading) return; S.web.loading = true; S.web.err = "";
    try { const r = await sb().rpc("site_stats", {days: S.web.days}); if (r.error) throw r.error; S.web.stats = r.data || {}; }
    catch(e){ S.web.err = /site_stats|function|PGRST20/.test(String((e && (e.message || e.code)) || e)) ? "missing" : String(e.message || e); }
    S.web.loading = false; S.web.at = Date.now(); render();
  }
  const tbl = (rows, head, fmt) => rows && rows.length ? `<div style="overflow-x:auto;max-width:100%"><table class="small"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(fmt).join("")}</tbody></table></div>` : `<p class="small muted">Nothing yet.</p>`;
  function ideas(s){
    const a = s.actions || {}, v = s.visits || 0, out = [];
    if (v < 30) return [`Too few visits (${v}) for firm conclusions. Suggestions appear from 30 visits.`];
    const secN = k => ((s.sections || []).find(x => x.k === k) || {}).n || 0;
    if ((a.quote_start || 0) >= 5 && (a.quote_sent || 0) / a.quote_start < 0.4) out.push(`${pct(a.quote_sent || 0, a.quote_start)} of visitors who start the quote form send it. Make it shorter, or offer WhatsApp beside it.`);
    if (secN("contact") / v < 0.3) out.push(`Only ${pct(secN("contact"), v)} of visitors reach Contact. Put a call or WhatsApp button higher on the page.`);
    if (secN("fleet") / v > 0.5 && !(s.finder || []).length) out.push("Many see the aircraft section but few use the finder. Make the passenger and distance controls more obvious.");
    const phone = ((s.devices || []).find(x => x.k === "phone") || {}).n || 0;
    if (phone / v > 0.6) out.push(`${pct(phone, v)} of visits are on phones. Check every change at phone width first; WhatsApp is the likely first contact.`);
    (s.campaigns || []).filter(c => c.n >= 20 && !c.sent).forEach(c => out.push(`Campaign "${c.k}" brought ${c.n} visits and no enquiry. Change the message or the landing page.`));
    const th = ((s.countries || []).find(x => x.k === "TH") || {}).n || 0, thPage = ((s.pages || []).find(x => x.k === "/th") || {}).n || 0;
    if (th >= 10 && thPage < th / 3) out.push("Most visitors from Thailand read the English page. Use archeaviation.com/th in Thai messages and posts.");
    if ((s.avgSecs || 0) && s.avgSecs < 25) out.push(`Visitors stay ${s.avgSecs} seconds on average. The first screen must say what we do and how to reach us at once.`);
    return out.length ? out : ["No problems found in this period."];
  }
  window.vWebsite = function(){
    if (!S.web.stats && !S.web.loading && !S.web.err) loadStats();
    const s = S.web.stats || {}, a = s.actions || {}, v = s.visits || 0, max = Math.max(1, ...(s.byDay || []).map(x => x.n));
    const per = [7, 30, 90, 365].map(d => `<button class="btn small${S.web.days === d ? " primary" : ""}" type="button" data-web="days|${d}">${d === 365 ? "12 months" : d + " days"}</button>`).join("");
    const head = `<div class="head"><div><h1>Website</h1><p class="muted small">Visits to archeaviation.com, counted without cookies and without storing anyone's IP address. Use it to improve the site and to follow up organisations that opened their link. Kept 13 months.</p></div><div class="row">${per}<button class="btn small" type="button" data-web="reload">Refresh</button></div></div>`;
    if (S.web.err === "missing") return head + `<div class="note warn">Run the database step "Website statistics" (0017) from the task list in Team first.</div>`;
    if (S.web.err) return head + `<div class="note bad small">Could not load: ${esc(S.web.err)}</div>`;
    if (!S.web.stats) return head + `<div class="panel"><p class="small muted">Loading…</p></div>`;
    const sent = (a.quote_sent || 0) + (a.callback_sent || 0);
    const kpis = `<div class="kpis"><div class="kpi"><div class="l">Visits</div><div class="v">${v}</div></div><div class="kpi"><div class="l">Enquiries sent</div><div class="v">${sent}</div><div class="small muted">${pct(sent, v)} of visits</div></div><div class="kpi"><div class="l">Calls, WhatsApp, email</div><div class="v">${(a.call || 0) + (a.whatsapp || 0) + (a.email || 0)}</div></div><div class="kpi"><div class="l">Average time</div><div class="v">${s.avgSecs ? Math.floor(s.avgSecs / 60) + ":" + String(s.avgSecs % 60).padStart(2, "0") : "–"}</div></div></div>`;
    const days = (s.byDay || []).length ? `<div class="panel"><h2>Visits per day</h2><div style="display:flex;align-items:flex-end;gap:2px;height:120px" role="img" aria-label="Visits per day">${s.byDay.map(x => `<div title="${esc(fmtD(x.d))}: ${x.n}" style="flex:1;min-width:2px;background:var(--accent,#4e6584);height:${Math.max(2, Math.round(100 * x.n / max))}%"></div>`).join("")}</div></div>` : "";
    const funnel = `<div class="panel"><h2>How far visitors get</h2>${tbl(Object.keys(SEC).map(k => ({k, n: ((s.sections || []).find(x => x.k === k) || {}).n || 0})), ["Section", "Visits", "Share"], x => `<tr><td>${SEC[x.k]}</td><td>${x.n}</td><td>${pct(x.n, v)}</td></tr>`)}
      <h3>What they used</h3>${tbl(["quote_start","quote_sent","callback_start","callback_sent","call","whatsapp","email","finder","language","portal"].map(k => ({k, n: a[k] || 0})), ["Action", "Visits"], x => `<tr><td>${KIND[x.k]}</td><td>${x.n}</td></tr>`)}</div>`;
    const src = `<div class="panel"><h2>Where they came from</h2>${tbl(s.sources, ["Source", "Visits"], x => `<tr><td>${esc(x.k === "direct" ? "Typed the address or a saved link" : x.k)}</td><td>${x.n}</td></tr>`)}
      <h3>Campaigns</h3><p class="small muted">Add ?utm_source=linkedin&amp;utm_campaign=name to links you post, so each post or mailing shows here.</p>${tbl(s.campaigns, ["Campaign", "Visits", "Enquiries"], x => `<tr><td>${esc(x.k)}</td><td>${x.n}</td><td>${x.sent || 0}</td></tr>`)}</div>`;
    const geo = `<div class="panel"><h2>Countries and cities</h2>${tbl(s.countries, ["Country", "Visits"], x => `<tr><td>${esc(CTRY(x.k))}</td><td>${x.n}</td></tr>`)}<h3>Cities</h3>${tbl(s.cities, ["City", "Visits"], x => `<tr><td>${esc(x.k)}</td><td>${x.n}</td></tr>`)}
      <h3>Pages and devices</h3>${tbl(s.pages, ["Page", "Visits"], x => `<tr><td>${esc(x.k)}</td><td>${x.n}</td></tr>`)}${tbl(s.devices, ["Device", "Visits"], x => `<tr><td>${esc(x.k)}</td><td>${x.n}</td></tr>`)}</div>`;
    const links = `<div class="panel"><h2>Organisation links opened</h2><p class="small muted">Brokers make a link for each lead in My leads. Here you see which organisations opened theirs and what they did.</p>${tbl(s.links, ["Organisation", "Broker", "Visits", "Last", "Did"], x => `<tr><td>${esc(x.org)}</td><td>${esc(nm(x.by))}</td><td>${x.visits}</td><td>${esc(fmtT(x.last))}</td><td>${esc((x.acts || []).map(k => KIND[k] || k).join(", ") || "Read")}</td></tr>`)}</div>`;
    const tips = `<div class="panel"><h2>Suggestions</h2>${ideas(s).map(t => `<div class="flag"><span class="sev low" aria-hidden="true"></span><div><p>${esc(t)}</p></div></div>`).join("")}</div>`;
    return head + kpis + `<div class="grid2"><div class="stack">${tips}${days}${funnel}</div><div class="stack">${src}${geo}${links}</div></div>`;
  };
  const _nav = navItems;
  navItems = function(){ const items = _nav(); if (S.isOwner && acting() === "owner" && !items.some(x => x[0] === "website")) { const i = items.findIndex(x => x[0] === "prospects"); items.splice(i < 0 ? items.length : i + 1, 0, ["website", "Website"]); } return items; };

  /* ---- links per lead ---- */
  function newCode(){ const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", a = new Uint8Array(8); crypto.getRandomValues(a); return [...a].map(x => c[x % c.length]).join(""); }
  async function makeLink(id){
    const l = S.leads[id]; if (!l || l.linkCode) return;
    for (let i = 0; i < 3; i++) {
      const code = newCode(), r = await sb().from("site_links").insert({code, lead_id: id, org: (l.org || "").slice(0, 120)});
      if (!r.error) { try { await S.db.doc(`leads/${S.uid}/items/${id}`).update({linkCode: code}); audit("Website link made", l.org || id); toast("Link ready. Use it in your first message."); } catch(e){ toast("Could not save the link on the lead."); } return; }
      if (!/duplicate|23505/.test(r.error.message || r.error.code || "")) { toast(/site_links|PGRST20/.test(r.error.message || r.error.code || "") ? "The owner must first run the database step for website statistics." : "Could not make the link."); return; }
    }
  }
  async function loadCode(code){
    if (S.web.byCode[code] && Date.now() - S.web.byCode[code].at < 60000) return;
    S.web.byCode[code] = {at: Date.now(), rows: (S.web.byCode[code] || {}).rows || null};
    const r = await sb().from("site_events").select("at,visit,kind,detail,path,country,city").eq("code", code).order("at", {ascending: false}).limit(200);
    S.web.byCode[code] = {at: Date.now(), rows: r.error ? [] : r.data}; render();
  }
  function linkBlock(l, id){
    if (l.status === "dnc" || l.status === "duplicate") return "";
    if (!l.linkCode) return `<div><h3>Website link</h3><p class="small muted">A link to archeaviation.com for this organisation only. When someone there opens it, Today tells you, so you can follow up while they are interested. It shows the organisation, never who the person is.</p><button class="btn small" type="button" data-web="mk|${esc(id)}">Make a website link</button></div>`;
    loadCode(l.linkCode);
    const rows = (S.web.byCode[l.linkCode] || {}).rows, visits = rows ? [...new Set(rows.filter(r => r.kind === "view").map(r => r.visit))] : [];
    const did = rows ? [...new Set(rows.filter(r => !["view","leave","section"].includes(r.kind)).map(r => KIND[r.kind] || r.kind))] : [];
    const secs = rows ? [...new Set(rows.filter(r => r.kind === "section").map(r => SEC[r.detail] || r.detail))] : [];
    const url = `${SITE}/?r=${l.linkCode}`, th = `${SITE}/th?r=${l.linkCode}`;
    return `<div><h3>Website link</h3><p class="small"><span class="mono">${esc(url)}</span> <button class="btn small" type="button" data-web="copy|${esc(url)}">Copy</button> <button class="btn small" type="button" data-web="copy|${esc(th)}">Copy Thai page</button></p>
      <p class="small muted">${rows === null ? "Checking…" : visits.length ? `Opened ${visits.length} time${visits.length > 1 ? "s" : ""}, last ${esc(fmtT(rows[0].at))}${rows[0].city ? " from " + esc(rows[0].city) : ""}. ${secs.length ? "Read: " + esc(secs.join(", ")) + ". " : ""}${did.length ? "Used: " + esc(did.join(", ")) + "." : ""}` : "Not opened yet."}</p></div>`;
  }
  const _vLeads = vLeads;
  vLeads = function(){
    const h = _vLeads(), id = S.pSel, l = id && S.leads[id]; if (!l) return h;
    const at = h.indexOf("<div><h3>Contact routes</h3>"); return at < 0 ? h : h.slice(0, at) + linkBlock(l, id) + h.slice(at);
  };

  /* ---- Today: organisations that opened their link (last 48 hours) ---- */
  async function loadOpens(){
    if (S.web.opensAt && Date.now() - S.web.opensAt < 120000) return; S.web.opensAt = Date.now();
    const since = new Date(Date.now() - 48 * 3600e3).toISOString();
    let ev, lk;
    try { [ev, lk] = await Promise.all([
      sb().from("site_events").select("code,at,kind,city").neq("code", "").gte("at", since).order("at", {ascending: false}).limit(500),
      sb().from("site_links").select("code,lead_id,org,owner_id").limit(2000)]); } catch(e){ S.web.opens = []; return; }
    if (!ev || !lk || ev.error || lk.error) { S.web.opens = []; return; }
    const links = Object.fromEntries((lk.data || []).map(x => [x.code, x])), by = {};
    (ev.data || []).forEach(e => { const L = links[e.code]; if (!L) return; const o = by[e.code] = by[e.code] || {L, last: e.at, city: e.city, acts: new Set()}; if (!["view","leave","section"].includes(e.kind)) o.acts.add(KIND[e.kind] || e.kind); });
    S.web.opens = Object.values(by).sort((a, b) => b.last.localeCompare(a.last)); render();
  }
  function opensPanel(){
    if (!["owner","broker","ops"].includes(acting())) return "";
    loadOpens(); const rows = S.web.opens || []; if (!rows.length) return "";
    return `<div class="panel" style="margin-bottom:16px"><h2>Opened their website link (48 hours)</h2><p class="small muted">Follow up today while they are interested. Say nothing about what they looked at.</p>${rows.slice(0, 12).map(o => `<div class="flag"><span class="sev ${o.acts.size ? "high" : "med"}" aria-hidden="true"></span><div><p>${o.L.owner_id === S.uid ? `<a href="#" data-view="leads" data-lead="${esc(o.L.lead_id)}">${esc(o.L.org)}</a>` : `${esc(o.L.org)} · ${esc(nm(o.L.owner_id))}`}</p><p class="small muted">${esc(fmtT(o.last))}${o.city ? " · " + esc(o.city) : ""}${o.acts.size ? " · " + esc([...o.acts].join(", ")) : ""}</p></div></div>`).join("")}</div>`;
  }
  const _vT = vToday; vToday = function(){ return afterHead(_vT(), opensPanel()); };

  /* ---- where a website enquiry came from (owner) ---- */
  window.enqSourceTag = function(e){
    if (!S.isOwner || !e || !e.visit) return "";
    const c = S.web.enqSrc = S.web.enqSrc || {};
    if (!(e.visit in c)) { c[e.visit] = null; sb().from("site_events").select("ref,utm,country,city,path,code").eq("visit", e.visit).eq("kind", "view").limit(1).then(r => { const x = r.data && r.data[0]; c[e.visit] = x ? [x.utm && x.utm.source ? x.utm.source + (x.utm.campaign ? " / " + x.utm.campaign : "") : x.ref || "direct", x.city || CTRY(x.country), x.path].filter(Boolean).join(" · ") : ""; render(); }); }
    return c[e.visit] ? ` <span class="tag">${esc(c[e.visit])}</span>` : "";
  };

  document.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-web]"); if (!b) return; ev.preventDefault();
    const [k, v] = b.dataset.web.split(/\|(.*)/s);
    if (k === "days") { S.web.days = +v; S.web.stats = null; loadStats(); }
    else if (k === "reload") { S.web.stats = null; loadStats(); }
    else if (k === "mk") { b.disabled = true; await makeLink(v); render(); }
    else if (k === "copy") { try { await navigator.clipboard.writeText(v); toast("Copied."); } catch(e){ toast(v); } }
  });
})();
