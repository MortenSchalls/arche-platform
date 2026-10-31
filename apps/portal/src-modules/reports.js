/* ---------- Reports: charts for a quick overview, and exports (Morten, 31 Oct 2026: "Consider analytical stats rather than
   plain text and numbers where it makes sense to have quick overview ... pull report from the portal in CSV format and other
   related formats of all needed relevant informations").
   Owner and operations. Charts are inline SVG (no extra scripts); every bar has a hover tooltip and a value label, and each
   chart has the same numbers as a table in the export. Exports: CSV (opens in Excel, UTF-8), one Excel workbook with every
   report as a sheet, and a print view to save as PDF. Client email and phone, and prospect contact details, are never exported
   (data rules); client name and company appear on trip rows because the booking record needs them. ---------- */
(function(){
  const canSee = () => typeof isStaff === "function" && isStaff() && acting() !== "broker";
  const _nav = navItems;
  navItems = function(){ const items = _nav(); if (canSee() && !items.some(x => x[0] === "reports")) { const i = items.findIndex(x => x[0] === "commission"); items.splice(i < 0 ? items.length : i + 1, 0, ["reports", "Reports"]); } return items; };

  const gp = st => num(st.price) - num(st.opPrice) - num(st.direct) + num(st.xsClient) - num(st.xsCost);
  const firstLeg = t => (((t.d.trip || {}).legs || []).map(l => l.date).filter(Boolean).sort()[0]) || "";
  const valOf = t => (t.st && num(t.st.price)) || (typeof priceOf === "function" ? priceOf(t.d.quote && t.d.quote.opPrice, t.d.quote && t.d.quote.direct) : 0);
  const BOOKED = ["issued", "clientPaid", "flown"];
  const mkey = r => r.first || r.flown || r.issued || r.created || "";   // the month a booking counts in: its first flight
  const client = t => (t.d.client || {}).company || (t.d.client || {}).name || "";
  const months = n => { const out = [], d = new Date(); d.setUTCDate(1); for (let i = n - 1; i >= 0; i--) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); out.push(x.toISOString().slice(0, 7)); } return out; };
  const mLabel = m => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-GB", {month: "short", timeZone: "UTC"});
  const k = v => v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + "M" : v >= 1e3 ? Math.round(v / 1e3) + "k" : String(Math.round(v));

  /* ---- the data, once, for charts and exports ---- */
  function data(){
    const trips = allTrips();
    const blk = t => { try { return tripBlockers(t.d, t.st); } catch(e){ return {red: [], amberOpen: []}; } };
    const rows = trips.map(t => { const st = t.st || {}, q = t.d.quote || {}, b = blk(t), scr = t.d.screen || {};
      return {t, ref: st.ref || "", id: t.did, broker: nm(t.bid), stage: STAGES[t.stage] || t.stage, stageKey: t.stage, client: client(t), first: firstLeg(t),
        route: ((t.d.trip || {}).legs || []).map(l => (l.from || "?") + "-" + (l.to || "?")).join(", "), operator: q.operator || "", aircraft: q.aircraft || "", tail: q.tail || "",
        price: valOf(t), opPrice: num(st.opPrice ?? q.opPrice), direct: num(st.direct ?? q.direct), gp: st.price ? gp(st) : 0,
        clientPaid: st.clientPaid ? (st.clientPaidDate || "yes") : "", operatorPaid: st.operatorPaid ? (st.operatorPaidDate || "yes") : "", flown: st.flownDate || "", issued: String(st.issuedAt || "").slice(0, 10),
        kyc: st.kyc ? "done" : "", screened: scr.at ? String(scr.at).slice(0, 10) : "", screenResult: !scr.at ? "not screened" : (scr.results || []).some(r => r.result === "possible match") ? "possible match" : (scr.results || []).some(r => r.result === "alert") ? "alert list" : "clear",
        lists: (scr.lists || []).map(x => String(x).replace(/ \(\d+\)$/, "")).join("; "), red: b.red.length, amber: b.amberOpen.length,
        insVerified: ((t.d.opTerms || {}).ins || {}).verifiedAt || "", audit: (t.d.safety || {}).audit || "", created: String(t.d.created || "").slice(0, 10)}; });
    return {trips, rows};
  }

  /* ---- charts ---- */
  const tip = s => `<title>${esc(s)}</title>`;
  function hbars(items, fmt){   // [{label, v, note}] one series: magnitude, sorted by the caller
    if (!items.length) return `<p class="small muted">Nothing yet.</p>`;
    const max = Math.max(1, ...items.map(x => x.v)), W = 560, L = 150, R = 70, H = 26;
    return `<svg viewBox="0 0 ${W} ${items.length * H + 6}" width="100%" role="img" aria-label="${esc(items.map(x => x.label + " " + fmt(x.v)).join(", "))}" style="max-width:${W}px;display:block">
      ${items.map((x, i) => { const w = Math.max(x.v ? 3 : 0, (W - L - R) * x.v / max), y = i * H + 4;
        return `<g><rect x="0" y="${y - 2}" width="${W}" height="${H}" fill="transparent">${tip(x.label + ": " + fmt(x.v) + (x.note ? " · " + x.note : ""))}</rect>
          <text x="${L - 8}" y="${y + 13}" text-anchor="end" font-size="12" fill="var(--text)">${esc(x.label)}</text>
          <rect x="${L}" y="${y + 2}" width="${w}" height="16" rx="4" fill="var(--primary-bg)" pointer-events="none"/>
          <text x="${L + w + 6}" y="${y + 14}" font-size="12" fill="var(--muted)" pointer-events="none">${esc(fmt(x.v))}</text></g>`; }).join("")}</svg>`;
  }
  function vbars(items, fmt){   // [{label, v, note}] over time
    const max = Math.max(1, ...items.map(x => x.v)), W = 560, H = 170, B = 22, T = 16, bw = (W - 10) / items.length;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(items.map(x => x.label + " " + fmt(x.v)).join(", "))}" style="max-width:${W}px;display:block">
      <line x1="0" x2="${W}" y1="${H - B}" y2="${H - B}" stroke="var(--line)"/>
      ${items.map((x, i) => { const h = (H - B - T) * x.v / max, X = 5 + i * bw;
        return `<g><rect x="${X}" y="0" width="${bw}" height="${H}" fill="transparent">${tip(x.label + ": " + fmt(x.v) + (x.note ? " · " + x.note : ""))}</rect>
          ${x.v ? `<path d="M${X + bw * 0.18},${H - B} v${-(h - 4)} q0,-4 4,-4 h${bw * 0.64 - 8} q4,0 4,4 v${h - 4} z" fill="var(--primary-bg)" pointer-events="none"/>` : ""}
          ${x.v && (i === items.length - 1 || x.v === max) ? `<text x="${X + bw / 2}" y="${H - B - h - 4}" text-anchor="middle" font-size="11" fill="var(--muted)" pointer-events="none">${esc(fmt(x.v))}</text>` : ""}
          <text x="${X + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)" pointer-events="none">${esc(x.label)}</text></g>`; }).join("")}</svg>`;
  }
  function stack(parts){   // [{label, v, color}] status: one bar, labels and a legend (never colour alone)
    const tot = parts.reduce((a, x) => a + x.v, 0); if (!tot) return `<p class="small muted">No open trips.</p>`;
    let x = 0; const W = 560;
    return `<svg viewBox="0 0 ${W} 22" width="100%" role="img" aria-label="${esc(parts.map(p => p.label + " " + p.v).join(", "))}" style="max-width:${W}px;display:block">${parts.filter(p => p.v).map(p => { const w = W * p.v / tot, r = `<rect x="${x + 1}" y="0" width="${Math.max(2, w - 2)}" height="22" rx="4" fill="${p.color}">${tip(p.label + ": " + p.v)}</rect>`; x += w; return r; }).join("")}</svg>
      <p class="small" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px">${parts.map(p => `<span><span aria-hidden="true" style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${p.color};margin-right:5px;vertical-align:-1px"></span>${esc(p.label)} ${p.v}</span>`).join("")}</p>`;
  }

  function vReports(){
    if (S.oplibAll === undefined) loadOplib().then(() => { if (S.view === "reports") render(); });
    const {rows} = data(), ms = months(12);
    const booked = rows.filter(r => BOOKED.includes(r.stageKey));
    const byMonth = ms.map(m => { const rs = booked.filter(r => mkey(r).slice(0, 7) === m); return {label: mLabel(m), v: rs.reduce((a, r) => a + r.price, 0), note: `${rs.length} booking${rs.length === 1 ? "" : "s"} · gross profit ${usd(rs.reduce((a, r) => a + r.gp, 0))}`}; });
    const gpMonth = ms.map(m => { const rs = booked.filter(r => mkey(r).slice(0, 7) === m); return {label: mLabel(m), v: rs.reduce((a, r) => a + r.gp, 0), note: `${rs.length} booking${rs.length === 1 ? "" : "s"}`}; });
    const order = ["enquiry", "quoted", "review", "returned", "issued", "clientPaid", "flown"];
    const pipe = order.map(s => { const rs = rows.filter(r => r.stageKey === s); return {label: STAGES[s], v: rs.length, note: usd(rs.reduce((a, r) => a + r.price, 0))}; });
    const closed = rows.filter(r => ["flown", "cancelled", "clientPaid", "issued"].includes(r.stageKey) || r.stageKey === "cancelled"), won = closed.filter(r => r.stageKey !== "cancelled");
    const winPct = closed.length ? Math.round(won.length / closed.length * 100) : null;
    const open = rows.filter(r => !["flown", "cancelled"].includes(r.stageKey));
    const health = [{label: "Red: stopped", v: open.filter(r => r.red).length, color: "var(--bad)"}, {label: "Amber to confirm", v: open.filter(r => !r.red && r.amber).length, color: "var(--warn)"}, {label: "Clear", v: open.filter(r => !r.red && !r.amber).length, color: "var(--ok)"}];
    const year = new Date().toISOString().slice(0, 4), ytd = booked.filter(r => mkey(r).startsWith(year));
    const byBroker = Object.values(ytd.reduce((a, r) => { const x = a[r.broker] || (a[r.broker] = {label: r.broker, v: 0, n: 0}); x.v += r.gp; x.n++; return a; }, {})).sort((a, b) => b.v - a.v).slice(0, 10).map(x => ({...x, note: `${x.n} booking${x.n === 1 ? "" : "s"}`}));
    const unpaidOp = rows.filter(r => r.clientPaid && !r.operatorPaid).length, scrGap = open.filter(r => r.screenResult === "not screened").length;
    const kpi = (l, v, s) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div>${s ? `<div class="small muted">${s}</div>` : ""}</div>`;
    return `<div class="head"><div><h1>Reports</h1><p class="muted small">Charts for a quick overview; hover a bar for the details. Download any report below as CSV, as one Excel file, or print it to PDF.</p></div></div>
      <div class="kpis">${kpi("Booked this year", usd(ytd.reduce((a, r) => a + r.price, 0)), `${ytd.length} bookings`)}${kpi("Gross profit this year", usd(ytd.reduce((a, r) => a + r.gp, 0)), "")}${kpi("Won of closed", winPct === null ? "–" : winPct + "%", `${won.length} of ${closed.length}`)}${kpi("Open pipeline", usd(open.reduce((a, r) => a + r.price, 0)), `${open.length} trips`)}</div>
      <div class="grid2">
        <div class="panel"><h2>Booked value by month</h2><p class="small muted">Confirmed, paid and flown trips, by first flight date. Last 12 months.</p>${vbars(byMonth, v => "USD " + k(v))}</div>
        <div class="panel"><h2>Gross profit by month</h2><p class="small muted">Price less operator price and direct costs.</p>${vbars(gpMonth, v => "USD " + k(v))}</div>
        <div class="panel"><h2>Trips by stage</h2>${hbars(pipe, v => String(v))}</div>
        <div class="panel"><h2>Open trips: trip checks</h2>${stack(health)}
          <p class="small" style="margin-top:10px">${scrGap ? `${scrGap} open trip${scrGap === 1 ? "" : "s"} not screened yet. ` : ""}${unpaidOp ? `${unpaidOp} paid by the client, operator not paid yet.` : ""}</p>
          <h3 style="margin-top:14px">Gross profit by broker, this year</h3>${hbars(byBroker, v => usd(v))}</div>
      </div>
      <div class="panel stack" style="margin-top:16px"><h2>Download reports</h2>
        <p class="small muted">Excel: one file with every report as a sheet. CSV opens in Excel, Numbers or Google Sheets. PDF: opens a print view; choose "Save as PDF". Client email and phone, and prospect contacts, are not exported.</p>
        <div class="row"><button class="btn primary" type="button" data-rep="xlsx|all">Excel: all reports</button><button class="btn" type="button" data-rep="pdf|all">PDF: all reports</button></div>
        <table class="tbl"><thead><tr><th>Report</th><th>Rows</th><th>Download</th></tr></thead><tbody>
        ${REPORTS.map(R => `<tr><td><b>${esc(R.title)}</b><br><span class="small muted">${esc(R.about)}</span></td><td>${R.rows(rows).length}</td><td><div class="row" style="gap:6px"><button class="btn small" type="button" data-rep="csv|${R.id}">CSV</button><button class="btn small" type="button" data-rep="xlsx|${R.id}">Excel</button><button class="btn small" type="button" data-rep="pdf|${R.id}">PDF</button></div></td></tr>`).join("")}
        </tbody></table></div>`;
  }

  /* ---- report definitions: [header, value] columns ---- */
  const C = (h, f) => [h, f];
  const REPORTS = [
    {id: "trips", title: "Trips", about: "Every trip with stage, route, operator, price and gross profit.", rows: rs => rs,
      cols: [C("Reference", r => r.ref), C("Trip id", r => r.id), C("Stage", r => r.stage), C("Broker", r => r.broker), C("Client", r => r.client), C("First flight", r => r.first), C("Route", r => r.route), C("Operator", r => r.operator), C("Aircraft", r => r.aircraft), C("Registration", r => r.tail), C("Client price USD", r => r.price), C("Operator price USD", r => r.opPrice), C("Direct costs USD", r => r.direct), C("Gross profit USD", r => r.gp), C("Created", r => r.created)]},
    {id: "payments", title: "Payments", about: "Booked trips: client paid, operator paid, flown.", rows: rs => rs.filter(r => BOOKED.includes(r.stageKey)),
      cols: [C("Reference", r => r.ref), C("Client", r => r.client), C("First flight", r => r.first), C("Client price USD", r => r.price), C("Client paid", r => r.clientPaid), C("Operator price USD", r => r.opPrice), C("Operator paid", r => r.operatorPaid), C("Flown", r => r.flown), C("Gross profit USD", r => r.gp)]},
    {id: "commission", title: "Commission", about: "Per broker and month flown: standard bookings, gross profit and commission.", rows: () => commRows(),
      cols: [C("Broker", r => r.broker), C("Month", r => r.month), C("Bookings", r => r.trips), C("Standard bookings", r => Math.round(r.units * 100) / 100), C("Gross profit USD", r => Math.round(r.gp)), C("Commission USD", r => Math.round(r.comm * 100) / 100)]},
    {id: "compliance", title: "Compliance", about: "KYC, sanctions screening, trip checks, insurance and audit per trip.", rows: rs => rs.filter(r => r.stageKey !== "cancelled"),
      cols: [C("Reference", r => r.ref), C("Trip id", r => r.id), C("Stage", r => r.stage), C("Client", r => r.client), C("KYC", r => r.kyc), C("Screened", r => r.screened), C("Screening result", r => r.screenResult), C("Lists", r => r.lists), C("Red items", r => r.red), C("Amber open", r => r.amber), C("Insurance verified", r => r.insVerified), C("Safety audit", r => r.audit), C("Operator", r => r.operator)]},
    {id: "oplib", title: "Operator library", about: "Each operator's trips, terms and insurance on file (no client data).", rows: () => opRows(),
      cols: [C("Operator", r => r.name), C("Trips", r => r.trips), C("Flown", r => r.flown), C("Cancelled", r => r.cancelled), C("Average margin %", r => r.margin), C("Registrations", r => r.regs), C("Insurer", r => r.insurer), C("Insurance expiry", r => r.expiry), C("Last booking", r => r.last)]},
  ];
  function commRows(){
    const out = [], bids = Object.keys(S.status || {});
    for (const bid of bids) { let c = {}; try { c = commissionFor(bid); } catch(e){}
      for (const [m, mo] of Object.entries(c).sort()) out.push({broker: nm(bid), month: m, trips: mo.trips.length, units: mo.units, gp: mo.gp, comm: mo.comm}); }
    return out;
  }
  function opRows(){
    const ops = ((S.oplibAll || {}).ops) || {};
    return Object.values(ops).map(o => { const tr = o.trips || [], ms = tr.map(x => num(x.marginPct)).filter(Boolean);
      return {name: o.name, trips: tr.length, flown: tr.filter(x => x.outcome === "flown").length, cancelled: tr.filter(x => x.outcome === "cancelled").length, margin: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length * 10) / 10 : "",
        regs: (o.regs || []).join("; "), insurer: ((o.last || {}).ins || {}).insurer || "", expiry: ((o.last || {}).ins || {}).expiry || "", last: String((o.last || {}).at || "").slice(0, 10)}; }).sort((a, b) => b.trips - a.trips);
  }
  async function loadOplib(){ if (S.oplibAll !== undefined) return; S.oplibAll = null; try { const g = await S.db.doc("intel/oplib").get(); S.oplibAll = g.exists ? g.data() : {ops: {}}; } catch(e){ S.oplibAll = {ops: {}}; } }

  /* ---- writers ---- */
  const table = (R, rows) => [R.cols.map(c => c[0]), ...R.cols.length ? R.rows(rows).map(r => R.cols.map(c => { const v = c[1](r); return v == null ? "" : v; })) : []];
  const csvCell = v => { const s = String(v); return /[",\n\r;]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s; };   // no formula injection
  const toCsv = T => "﻿" + T.map(r => r.map(csvCell).join(",")).join("\r\n");
  function save(name, blob){ const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  // minimal .xlsx writer (stored zip, no compression): one sheet per report, numbers as numbers, header row bold
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files){
    const enc = new TextEncoder(), parts = [], dir = []; let off = 0;
    for (const [name, text] of files) {
      const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nb.length, true);
      parts.push(new Uint8Array(h.buffer), nb, data);
      const d = new DataView(new ArrayBuffer(46)); d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint32(16, crc, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, nb.length, true); d.setUint32(42, off, true);
      dir.push(new Uint8Array(d.buffer), nb); off += 30 + nb.length + data.length;
    }
    const size = dir.reduce((a, x) => a + x.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...dir, new Uint8Array(e.buffer)], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  }
  const xe = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  const col = i => { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  function sheetXml(T){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${T[0].map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(48, Math.max(10, String(h).length + 4))}" customWidth="1"/>`).join("")}</cols><sheetData>${T.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => { const ref = col(ci) + (ri + 1); return typeof v === "number" && isFinite(v) ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${xe(v)}</t></is></c>`; }).join("")}</row>`).join("")}</sheetData></worksheet>`;
  }
  function xlsx(sheets){   // [[name, table]]
    const ws = sheets.map(([n], i) => `<sheet name="${xe(n.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("");
    return zip([
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${ws}</sheets></workbook>`],
      ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>`],
      ...sheets.map(([, T], i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(T)])]);
  }
  function printView(list, rows){
    const w = window.open("", "_blank"); if (!w) { toast("Allow pop-ups for the portal to open the print view."); return; }
    const date = new Date().toISOString().slice(0, 10), charts = list.length > 1 ? (document.querySelector("#main .grid2") || {}).outerHTML || "" : "";
    const tbl = R => { const T = table(R, rows); return `<h2>${esc(R.title)}</h2><table><thead><tr>${T[0].map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${T.slice(1).map(r => `<tr>${r.map(v => `<td${typeof v === "number" ? ' class="n"' : ""}>${esc(typeof v === "number" ? v.toLocaleString("en-US") : v)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${T[0].length}">No rows.</td></tr>`}</tbody></table>`; };
    const css = getComputedStyle(document.documentElement), v = n => css.getPropertyValue(n) || "";
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Archē Executive report ${date}</title><style>:root{--primary-bg:${v("--primary-bg")};--text:#1d2329;--muted:#55606b;--line:#d5dade;--bad:${v("--bad")};--warn:${v("--warn")};--ok:${v("--ok")}}body{font:12px/1.4 "Hanken Grotesk",Arial,sans-serif;color:#1d2329;margin:24px}h1{font:22px Prata,Georgia,serif;margin:0 0 4px}h2{font:15px Prata,Georgia,serif;margin:18px 0 6px}table{border-collapse:collapse;width:100%;margin-bottom:8px}th,td{border-bottom:1px solid #d5dade;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f4f5}td.n{text-align:right}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{border:1px solid #d5dade;border-radius:8px;padding:10px;break-inside:avoid}.muted{color:#55606b}.small{font-size:11px}@page{size:A4 landscape;margin:12mm}</style></head><body><h1>Archē Executive report</h1><p class="muted">Arche Executive Pte. Ltd. · made ${date} from the portal · internal, confidential</p>${charts}${list.map(tbl).join("")}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
    w.document.close();
  }

  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-rep]"); if (!b || !canSee()) return; e.preventDefault();
    const [fmt, id] = b.dataset.rep.split("|"), date = new Date().toISOString().slice(0, 10);
    if (id === "all" || id === "oplib") await loadOplib();
    const {rows} = data(), list = id === "all" ? REPORTS : REPORTS.filter(R => R.id === id); if (!list.length) return;
    if (fmt === "csv") save(`arche-${list[0].id}-${date}.csv`, new Blob([toCsv(table(list[0], rows))], {type: "text/csv;charset=utf-8"}));
    else if (fmt === "xlsx") save(`arche-${id === "all" ? "reports" : list[0].id}-${date}.xlsx`, xlsx(list.map(R => [R.title, table(R, rows)])));
    else if (fmt === "pdf") printView(list, rows);
    if (typeof audit === "function") audit("Report downloaded", `${list.map(R => R.title).join(", ")} · ${fmt.toUpperCase()}`);
  });

  window.vReports = vReports; window.REPORTS = REPORTS; window.reportTable = (id) => { const R = REPORTS.find(x => x.id === id); return R ? table(R, data().rows) : null; }; window.reportXlsx = xlsx;
  const _rn = renderNow;
  renderNow = function(){ _rn(); if (S.view === "reports" && canSee() && !S.editing) { const m = $("main"); if (m) { m.innerHTML = vReports(); loadOplib(); } } };
})();
