/* ---------- Books: Arche Aviation Pte. Ltd.'s own accounts, owners only (Morten, 10 Nov 2026) ----------
   "for me and my wife only ... our own accounting section in the portal ... password protected a second security layer".
   Everything is read and written through /api/books (api/_books): the database gives the browser no access to any books
   table. Opening Books needs the portal sign-in plus a passkey (Face ID, Touch ID) or an authenticator code; the books
   session lives only in this page's memory and locks after 15 minutes without use. Advice is advice: nothing here posts,
   pays or files by itself, and the AI review sees totals only. */
const BK = {role: null, entity: "", unlocked: false, sess: "", tab: "overview", d: {}, busy: false, last: 0, st: null, acc: [], lines: [{account: "", debit: "", credit: ""}, {account: "", debit: "", credit: ""}], rep: {type: "pl"}};
const bkMoney = n => (+n < 0 ? "-" : "") + "USD " + Math.abs(+n || 0).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const bkB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const bkUnB64 = s => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4)), c => c.charCodeAt(0));
async function bkApi(body){
  if (!window.__sb) throw new Error("Books need the live portal.");
  const sess = (await window.__sb.auth.getSession()).data.session;
  const r = await fetch("/api/books", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || ""), ...(BK.sess ? {"x-books-session": BK.sess} : {})}, body: JSON.stringify({...body, today: new Date().toISOString().slice(0, 10)})});
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && j.error === "locked") { bkLock(true); throw new Error("Books locked. Unlock again."); }
  if (!r.ok) throw new Error(j.error || "Could not reach Books.");
  BK.last = Date.now(); return j;
}
async function bkStatus(){
  try { const s = await bkApi({mode: "status"}); BK.role = s.role; BK.entity = s.entity; BK.st = s; if (!s.unlocked) { BK.unlocked = false; BK.sess = ""; } render(); } catch(e){ BK.role = null; }
}
function bkLock(silent){ if (BK.sess) fetch("/api/books", {method: "POST", headers: {"content-type": "application/json", "x-books-session": BK.sess}, body: JSON.stringify({mode: "lock"})}).catch(() => {});
  BK.sess = ""; BK.unlocked = false; BK.d = {}; if (!silent) toast("Books locked."); render(); }
setInterval(() => { if (BK.unlocked && Date.now() - BK.last > 15 * 60e3) bkLock(true); }, 30e3);
document.addEventListener("visibilitychange", () => { if (document.hidden && BK.unlocked && Date.now() - BK.last > 5 * 60e3) bkLock(true); });
setTimeout(() => { if (window.__sb) bkStatus(); }, 1500);
{ const _nav = navItems;
  navItems = function(){ const items = _nav(); if (BK.role && !S.preview && !items.some(x => x[0] === "books")) { const i = items.findIndex(x => x[0] === "team"); items.splice(i < 0 ? items.length : i, 0, ["books", "Books"]); } return items; }; }

async function bkLoad(tab){
  BK.busy = true; render();
  try {
    if (!BK.acc.length) BK.acc = (await bkApi({mode: "accounts"})).accounts;
    if (tab === "overview") BK.d.ov = await bkApi({mode: "overview"});
    if (tab === "tx") BK.d.tx = await bkApi({mode: "journal", from: BK.f || undefined, to: BK.t || undefined, q: BK.q || "", account: BK.fa || ""});
    if (tab === "entry") BK.d.drafts = (await bkApi({mode: "drafts"})).rows;
    if (tab === "bank") BK.d.bank = (await bkApi({mode: "bankLines", open: !BK.allBank})).rows;
    if (tab === "advice") BK.d.ov = await bkApi({mode: "overview"});
    if (tab === "settings") { BK.d.set = (await bkApi({mode: "settings"})).settings; BK.d.keys = await bkApi({mode: "passkeys"}); if (BK.role === "owner") { BK.d.mem = await bkApi({mode: "members"}); BK.d.log = (await bkApi({mode: "log"})).rows; } }
  } catch(e){ toast(e.message); }
  BK.busy = false; render();
}
function bkTab(t){ BK.tab = t; bkLoad(t); }

function vBooks(){
  if (!BK.role) return `<div class="panel empty"><p><b>Books</b></p><p class="small">Checking your access…</p></div>`;
  const head = `<div class="head"><div><h1>Books</h1><p class="muted small">${esc(BK.entity || "Arche Aviation Pte. Ltd.")}, trading as Archē Executive · US dollars · ${esc({owner: "owner", accountant: "accountant (read and draft)", bookkeeper: "bookkeeper (read, draft, bank)"}[BK.role] || "")}</p></div>${BK.unlocked ? `<div class="row"><button class="btn small" type="button" data-bk="lock">Lock now</button></div>` : ""}</div>`;
  if (!BK.unlocked) return head + bkLocked();
  if (!BK.busy && !BK.d.ov && BK.tab === "overview") setTimeout(() => bkLoad("overview"), 0);
  const tabs = [["overview","Overview"],["tx","Transactions"],["entry","New entry"],["bank","Bank"],["reports","Reports"],["budget","Budget"],["advice","Advice"],["settings","Settings and access"]]
    .filter(([k]) => !(k === "budget" && BK.role !== "owner"));
  const bar = `<div class="row" role="tablist" style="flex-wrap:wrap;gap:6px;margin-bottom:12px">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${BK.tab === k}" class="btn small ${BK.tab === k ? "primary" : ""}" data-bk="tab" data-t="${k}">${l}</button>`).join("")}</div>`;
  const body = BK.busy ? `<div class="panel empty"><p class="small">Loading…</p></div>` : ({overview: bkOverview, tx: bkTx, entry: bkEntry, bank: bkBank, reports: bkReports, budget: bkBudget, advice: bkAdvice, settings: bkSettings}[BK.tab] || bkOverview)();
  return head + bar + body;
}
function bkLocked(){
  const s = BK.st || {};
  const first = !s.passkeys && !s.totp;
  return `<div class="panel" style="max-width:640px"><h2>Unlock Books</h2>
    <p class="small">Books are locked. Your portal sign-in is not enough: confirm it is you with ${first ? "a second step, set up once:" : "your passkey or your authenticator code."}</p>
    ${s.passkeys ? `<div class="row"><button class="btn primary" type="button" data-bk="unlockPk">Unlock with passkey (Face ID, Touch ID)</button></div>` : ""}
    ${s.totp ? `<label class="f" for="bk_code">Authenticator code<input id="bk_code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" style="max-width:140px"></label><div class="row"><button class="btn ${s.passkeys ? "" : "primary"}" type="button" data-bk="unlockTotp">Unlock with the code</button></div>` : ""}
    ${first ? `<div class="note small">First time: sign out and in again, then within 10 minutes set up a passkey on this device. Add an authenticator app afterwards as the back-up.</div>
      <div class="row"><button class="btn primary" type="button" data-bk="addPk">Set up a passkey on this device</button><button class="btn" type="button" data-bk="totpStart">Use an authenticator app instead</button></div>` : ""}
    <div id="bkTotp"></div>
    <p class="small muted">Books lock again after 15 minutes without use, and when you leave the page for a while. Eight failed attempts in an hour lock them for an hour.</p></div>`;
}
function bkKpi(l, v, sub){ return `<div class="kpi"><div class="l">${esc(l)}</div><div class="v">${v}</div>${sub ? `<div class="small muted">${sub}</div>` : ""}</div>`; }
function bkAdv(a){ return `<div class="flag"><span class="sev ${a.sev === "high" ? "high" : a.sev === "med" ? "med" : "low"}" aria-hidden="true"></span><div><p><b>${esc(a.area)}.</b> ${esc(a.text)}</p><p class="small muted">${esc(a.who)}${a.src ? ` · <a href="${esc(a.src)}" target="_blank" rel="noopener noreferrer">source</a>` : ""}</p></div></div>`; }
function bkOverview(){
  const o = BK.d.ov; if (!o) return `<div class="panel empty"><p class="small">No data yet.</p></div>`;
  const cash = o.cash.filter(c => c.code !== "1100").reduce((s, c) => s + c.amount, 0), client = (o.cash.find(c => c.code === "1100") || {}).amount || 0;
  const bud = o.bva ? `${bkMoney(o.bva.profitBudget)} budgeted` : "no budget loaded";
  return `${!o.chainOk ? `<div class="note warn"><b>The ledger's hash chain is broken.</b> An entry was changed outside the portal. Open Settings and access, then Check the ledger.</div>` : ""}
  ${o.errors.length ? `<div class="note warn">${o.errors.length} money step${o.errors.length > 1 ? "s" : ""} could not post by itself. See Advice.</div>` : ""}
  <div class="kpis">${bkKpi("Operating cash", bkMoney(cash))}${bkKpi("Client payment account", bkMoney(client), "client money, not Archē's")}${bkKpi("Revenue this year", bkMoney(o.pl.totalIncome), `from ${esc(o.fy.start)}`)}${bkKpi("Profit this year", bkMoney(o.pl.profit), bud)}</div>
  <div class="grid2"><div class="panel"><h2>What needs you</h2>${o.advice.slice(0, 6).map(bkAdv).join("") || `<p class="small">Nothing.</p>`}<div class="row"><button class="btn small" type="button" data-bk="tab" data-t="advice">All advice</button></div></div>
  <div class="panel tbl"><h2>Cash and bank</h2><table><tbody>${o.cash.map(c => `<tr><td>${esc(c.code)} ${esc(c.name)}</td><td class="n">${bkMoney(c.amount)}</td></tr>`).join("")}</tbody></table>
  <p class="small muted">${o.entries} entries · ledger ${o.chainOk ? "intact" : "BROKEN"} · ${o.unmatched} bank line${o.unmatched === 1 ? "" : "s"} to match</p></div></div>`;
}
function bkAccSel(id, val, filter){ return `<select id="${id}" aria-label="Account">${[`<option value="">Account</option>`, ...BK.acc.filter(a => a.active && (!filter || filter(a))).map(a => `<option value="${a.code}" ${a.code === val ? "selected" : ""}>${a.code} ${esc(a.name)}</option>`)].join("")}</select>`; }
function bkTx(){
  const t = BK.d.tx || {rows: []}, own = BK.role === "owner";
  return `<div class="panel"><div class="row" style="flex-wrap:wrap"><label class="f" for="bk_f">From<input type="date" id="bk_f" value="${esc(BK.f || t.from || "")}"></label><label class="f" for="bk_t">To<input type="date" id="bk_t" value="${esc(BK.t || t.to || "")}"></label>
    <label class="f" for="bk_q">Search<input id="bk_q" value="${esc(BK.q || "")}" placeholder="memo or trip"></label><label class="f" for="bk_fa">Account${bkAccSel("bk_fa", BK.fa || "")}</label><button class="btn small" type="button" data-bk="txFind">Show</button></div></div>
  <div class="panel tbl">${t.rows.length ? `<table><thead><tr><th scope=col>Date</th><th scope=col>Entry</th><th scope=col>What</th><th scope=col>Kind</th><th scope=col class="n">Amount</th>${own ? "<th scope=col></th>" : ""}</tr></thead><tbody>
    ${t.rows.map(j => { const amt = j.lines.reduce((s, l) => s + (+l.debit || 0), 0); return `<tr><td>${esc(j.jdate)}</td><td class="mono">${j.id}</td><td>${esc(j.memo)}${j.reverses ? ` <span class="chip">reverses ${j.reverses}</span>` : ""}${j.reversed ? ` <span class="chip c-cancel">reversed</span>` : ""}
      <div class="small muted">${j.lines.map(l => `${esc(l.account)} ${+l.debit ? "Dr " + bkMoney(l.debit) : "Cr " + bkMoney(l.credit)}`).join(" · ")}</div></td><td>${esc({auto: "From the portal", manual: "By hand", reversal: "Reversal", opening: "Opening", import: "Bank"}[j.kind] || j.kind)}</td><td class="n">${bkMoney(amt)}</td>
      ${own ? `<td>${!j.reversed && j.kind !== "reversal" ? (BK.revAsk === j.id ? `<button class="btn small danger" type="button" data-bk="revYes" data-id="${j.id}">Post reversal</button><button class="btn small" type="button" data-bk="revNo">Keep</button>` : `<button class="btn small" type="button" data-bk="rev" data-id="${j.id}">Reverse</button>`) : ""}</td>` : ""}</tr>`; }).join("")}</tbody></table>` : `<div class="empty"><p class="small">No entries in this period.</p></div>`}
  <p class="small muted">Posted entries never change. A mistake is corrected with a reversal, which stays on record.</p></div>`;
}
function bkEntry(){
  const own = BK.role === "owner", dr = BK.lines.reduce((s, l) => s + (+l.debit || 0), 0), cr = BK.lines.reduce((s, l) => s + (+l.credit || 0), 0), bal = Math.abs(dr - cr) < 0.005 && dr > 0;
  return `<div class="panel"><h2>New entry</h2><p class="small muted">Money from trips and commission posts by itself. Use this for everything else: costs, capital, loans, dividends, corrections.</p>
    <div class="row" style="flex-wrap:wrap"><label class="f" for="bk_ed">Date<input type="date" id="bk_ed" value="${esc(BK.ed || new Date().toISOString().slice(0, 10))}"></label><label class="f" for="bk_em" style="flex:1">What it is for<input id="bk_em" value="${esc(BK.em || "")}" maxlength="300"></label></div>
    <div class="tbl"><table><thead><tr><th scope=col>Account</th><th scope=col class="n">Debit</th><th scope=col class="n">Credit</th><th scope=col>Note</th><th scope=col></th></tr></thead><tbody>
      ${BK.lines.map((l, i) => `<tr><td>${bkAccSel("bk_la" + i, l.account)}</td><td class="n"><input id="bk_ld${i}" inputmode="decimal" value="${esc(l.debit)}" style="max-width:120px" aria-label="Debit"></td><td class="n"><input id="bk_lc${i}" inputmode="decimal" value="${esc(l.credit)}" style="max-width:120px" aria-label="Credit"></td><td><input id="bk_lm${i}" value="${esc(l.memo || "")}" aria-label="Note"></td><td>${BK.lines.length > 2 ? `<button class="btn small" type="button" data-bk="lineDel" data-i="${i}" aria-label="Remove line">×</button>` : ""}</td></tr>`).join("")}
      <tr><td><button class="btn small" type="button" data-bk="lineAdd">Add line</button></td><td class="n"><b>${bkMoney(dr)}</b></td><td class="n"><b>${bkMoney(cr)}</b></td><td colspan="2">${bal ? `<span class="chip c-flown">Balanced</span>` : `<span class="chip c-review">Debits and credits must be equal</span>`}</td></tr></tbody></table></div>
    <div class="row">${own ? `<button class="btn primary" type="button" data-bk="post" ${bal ? "" : "disabled"}>Post entry</button>` : ""}<button class="btn" type="button" data-bk="draft" ${bal ? "" : "disabled"}>${own ? "Save as draft" : "Save draft for the owners"}</button>
      <button class="btn small" type="button" data-bk="tmpl" data-k="capital">Share capital paid in</button><button class="btn small" type="button" data-bk="tmpl" data-k="cost">Cost paid from the bank</button><button class="btn small" type="button" data-bk="tmpl" data-k="dividend">Dividend declared</button></div></div>
  ${(BK.d.drafts || []).length ? `<div class="panel tbl"><h2>Drafts waiting for an owner</h2><table><tbody>${BK.d.drafts.map(d => `<tr><td>${esc(d.data.date)}</td><td>${esc(d.data.memo)}<div class="small muted">${d.data.lines.map(l => `${esc(l.account)} ${l.debit ? "Dr " + bkMoney(l.debit) : "Cr " + bkMoney(l.credit)}`).join(" · ")}</div></td><td>${own ? `<button class="btn small primary" type="button" data-bk="dPost" data-id="${d.id}">Post</button><button class="btn small" type="button" data-bk="dRej" data-id="${d.id}">Reject</button>` : `<span class="chip c-review">Waiting</span>`}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
}
function bkBank(){
  const rows = BK.d.bank || [], cash = a => ["1000","1010","1020","1030","1100"].includes(a.code);
  return `<div class="panel"><h2>Bank statements</h2><p class="small muted">Export the statement as CSV from Wise Business or Citi, choose the account and import it. Lines already imported are skipped. Nothing is read from the bank by itself yet.</p>
    <div class="row" style="flex-wrap:wrap"><label class="f" for="bk_ba">Account${bkAccSel("bk_ba", BK.ba || "1010", cash)}</label><label class="f" for="bk_bf">Statement (CSV)<input type="file" id="bk_bf" accept=".csv,text/csv"></label><button class="btn primary" type="button" data-bk="bankImp">Import</button>
    <label class="check" for="bk_all"><input type="checkbox" id="bk_all" ${BK.allBank ? "checked" : ""} data-bk="bankAll"><span>Show matched lines too</span></label></div></div>
  <div class="panel tbl">${rows.length ? `<table><thead><tr><th scope=col>Date</th><th scope=col>Account</th><th scope=col>Text</th><th scope=col class="n">Amount</th><th scope=col>Match</th></tr></thead><tbody>${rows.map(l => `<tr><td>${esc(l.bdate)}</td><td>${esc(l.bank_account)}</td><td>${esc(l.description)}</td><td class="n">${bkMoney(l.amount)}</td>
    <td>${l.journal_id ? `<span class="chip c-flown">Entry ${l.journal_id}</span>` : `<div class="row">${bkAccSel("bk_m" + l.id.slice(0, 12), "", a => !cash(a) || a.code !== l.bank_account)}<button class="btn small" type="button" data-bk="match" data-id="${esc(l.id)}">Post</button><input id="bk_me${l.id.slice(0, 12)}" placeholder="or entry no." style="max-width:110px" aria-label="Existing entry number"></div>`}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty"><p class="small">No bank lines to match.</p></div>`}<p class="small muted">Client payments and operator payments already post from the trips: link those bank lines to the entry number instead of posting them again.</p></div>`;
}
function bkReports(){
  const r = BK.rep, out = BK.d.rep;
  const types = [["pl","Profit and loss"],["bs","Balance sheet"],["tb","Trial balance"],["cash","Cash flow"],["bva","Actual against budget"],["gl","General ledger (one account)"],["tax","Corporate tax estimate"]];
  return `<div class="panel"><div class="row" style="flex-wrap:wrap"><label class="f" for="bk_rt">Report<select id="bk_rt">${types.map(([k, l]) => `<option value="${k}" ${r.type === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f" for="bk_rf">From<input type="date" id="bk_rf" value="${esc(r.from || "")}"></label><label class="f" for="bk_rto">To<input type="date" id="bk_rto" value="${esc(r.to || "")}"></label>${r.type === "gl" ? `<label class="f" for="bk_ra">Account${bkAccSel("bk_ra", r.account || "1000")}</label>` : ""}
    <button class="btn primary" type="button" data-bk="rep">Show</button>${BK.role !== "bookkeeper" ? `<button class="btn" type="button" data-bk="repCsv">Download CSV</button>` : ""}</div><p class="small muted">Empty dates mean this financial year to today.</p></div>
  ${out ? `<div class="panel tbl">${bkRepHtml(out.type, out.report)}</div>` : ""}`;
}
function bkRows(xs){ return xs.map(x => `<tr><td>${esc(x.code || "")} ${esc(x.name)}</td><td class="n">${bkMoney(x.amount)}</td></tr>`).join(""); }
function bkRepHtml(type, o){
  if (type === "pl") return `<h2>Profit and loss ${esc(o.from)} to ${esc(o.to)}</h2><table><tbody><tr><th scope=row colspan=2>Income</th></tr>${bkRows(o.income)}<tr><td><b>Total income</b></td><td class="n"><b>${bkMoney(o.totalIncome)}</b></td></tr>
    <tr><th scope=row colspan=2>Costs</th></tr>${bkRows(o.expenses)}<tr><td><b>Gross profit</b> (income less cost of sales)</td><td class="n">${bkMoney(o.grossProfit)}</td></tr><tr><td><b>Profit before tax</b></td><td class="n">${bkMoney(o.profitBeforeTax)}</td></tr><tr><td><b>Profit</b></td><td class="n"><b>${bkMoney(o.profit)}</b></td></tr></tbody></table>`;
  if (type === "bs") return `<h2>Balance sheet at ${esc(o.at)}</h2><table><tbody><tr><th scope=row colspan=2>Assets</th></tr>${bkRows(o.assets)}<tr><td><b>Total assets</b></td><td class="n"><b>${bkMoney(o.totalAssets)}</b></td></tr>
    <tr><th scope=row colspan=2>Liabilities</th></tr>${bkRows(o.liabilities)}<tr><td><b>Total liabilities</b></td><td class="n">${bkMoney(o.totalLiabilities)}</td></tr><tr><th scope=row colspan=2>Equity</th></tr>${bkRows(o.equity)}
    <tr><td>Profit of earlier years</td><td class="n">${bkMoney(o.earlierProfit)}</td></tr><tr><td>Profit this year</td><td class="n">${bkMoney(o.yearProfit)}</td></tr><tr><td><b>Total equity</b></td><td class="n"><b>${bkMoney(o.totalEquity)}</b></td></tr></tbody></table><p class="small ${o.balanced ? "muted" : ""}">${o.balanced ? "Assets equal liabilities plus equity." : "Does not balance: check Advice."}</p>`;
  if (type === "tb") return `<h2>Trial balance</h2><table><thead><tr><th scope=col>Account</th><th scope=col class="n">Debit</th><th scope=col class="n">Credit</th></tr></thead><tbody>${o.rows.map(x => `<tr><td>${esc(x.code)} ${esc(x.name)}</td><td class="n">${x.debit ? bkMoney(x.debit) : ""}</td><td class="n">${x.credit ? bkMoney(x.credit) : ""}</td></tr>`).join("")}<tr><td><b>Total</b></td><td class="n"><b>${bkMoney(o.debit)}</b></td><td class="n"><b>${bkMoney(o.credit)}</b></td></tr></tbody></table>`;
  if (type === "cash") return `<h2>Cash flow ${esc(o.from)} to ${esc(o.to)}</h2><table><tbody><tr><td>Opening cash</td><td class="n">${bkMoney(o.opening)}</td></tr>${o.groups.map(g => `<tr><td>${esc(g.name)}</td><td class="n">${bkMoney(g.amount)}</td></tr>`).join("")}<tr><td><b>Closing cash</b></td><td class="n"><b>${bkMoney(o.closing)}</b></td></tr></tbody></table><p class="small muted">Includes the client payment account.</p>`;
  if (type === "bva") return `<h2>Actual against budget ${esc(o.from)} to ${esc(o.to)}</h2><table><thead><tr><th scope=col>Account</th><th scope=col class="n">Actual</th><th scope=col class="n">Budget</th><th scope=col class="n">Difference</th></tr></thead><tbody>${o.rows.map(x => `<tr><td>${esc(x.code)} ${esc(x.name)}</td><td class="n">${bkMoney(x.actual)}</td><td class="n">${bkMoney(x.budget)}</td><td class="n">${bkMoney(x.diff)}${x.pct != null ? ` (${x.pct}%)` : ""}</td></tr>`).join("")}<tr><td><b>Profit</b></td><td class="n"><b>${bkMoney(o.profitActual)}</b></td><td class="n"><b>${bkMoney(o.profitBudget)}</b></td><td class="n">${bkMoney(o.profitActual - o.profitBudget)}</td></tr></tbody></table>`;
  if (type === "gl") return `<h2>General ledger: ${esc(o.account)}</h2><table><thead><tr><th scope=col>Date</th><th scope=col>Entry</th><th scope=col>What</th><th scope=col class="n">Debit</th><th scope=col class="n">Credit</th><th scope=col class="n">Balance</th></tr></thead><tbody><tr><td colspan=5>Opening</td><td class="n">${bkMoney(o.opening)}</td></tr>${o.rows.map(x => `<tr><td>${esc(x.date)}</td><td class="mono">${x.entry}</td><td>${esc(x.memo)}</td><td class="n">${x.debit ? bkMoney(x.debit) : ""}</td><td class="n">${x.credit ? bkMoney(x.credit) : ""}</td><td class="n">${bkMoney(x.balance)}</td></tr>`).join("")}</tbody></table>`;
  if (type === "tax") return `<h2>Corporate tax estimate, financial year ${esc(o.fy.start)} to ${esc(o.fy.end)}</h2>${o.estimate ? `<table><tbody><tr><td>Profit before tax</td><td class="n">${bkMoney(o.profitBeforeTaxUsd)}</td></tr><tr><td>In Singapore dollars at ${o.sgdPerUsd}</td><td class="n">S$${Math.round(o.estimate.chargeable).toLocaleString("en-US")}</td></tr><tr><td>Exempt (${esc(o.estimate.scheme)})</td><td class="n">S$${Math.round(o.estimate.exempt).toLocaleString("en-US")}</td></tr><tr><td>Tax at 17%</td><td class="n">S$${Math.round(o.estimate.grossTax).toLocaleString("en-US")}</td></tr><tr><td>Rebate</td><td class="n">S$${Math.round(o.estimate.rebate).toLocaleString("en-US")}</td></tr><tr><td><b>Estimated tax</b> (effective ${o.estimate.effectiveRate}%)</td><td class="n"><b>S$${Math.round(o.estimate.tax).toLocaleString("en-US")}</b></td></tr></tbody></table>` : `<p class="small">Set the SGD per USD rate in Settings first.</p>`}<p class="small muted">${esc(o.note)} Rules checked ${esc(o.tax.checked)}: ${o.tax.sources.map(s => `<a href="${esc(s)}" target="_blank" rel="noopener noreferrer">source</a>`).join(", ")}.</p>`;
  return "";
}
function bkBudget(){
  const s = (BK.d.ov || {}).settings || {};
  return `<div class="panel" style="max-width:760px"><h2>Budget</h2><p class="small">Load the locked budget so every report and the advice compare actual with plan. Use the budget file Claude made from the locked budget model (Monthly USD sheet). It replaces the budget loaded before.</p>
    ${s.budgetLoaded ? `<p class="small muted">Loaded ${esc(String(s.budgetLoaded).slice(0, 10))} from ${esc(s.budgetSource || "")}.</p>` : `<p class="small muted">No budget loaded yet.</p>`}
    <div class="row" style="flex-wrap:wrap"><label class="f" for="bk_bm1">Month 1 of the budget is<input type="month" id="bk_bm1" value="2026-12"></label><label class="f" for="bk_bj">Budget file (JSON)<input type="file" id="bk_bj" accept=".json,application/json"></label><button class="btn primary" type="button" data-bk="budImp">Load budget</button></div></div>`;
}
function bkAdvice(){
  const o = BK.d.ov || {advice: [], errors: []}, own = BK.role === "owner";
  return `<div class="panel"><h2>Advice</h2><p class="small muted">Suggestions only. Nothing here posts, pays, files or decides; each line says who decides. Tax and law: confirm with your accountant before acting.</p>${o.advice.map(bkAdv).join("") || `<p class="small">Nothing to suggest.</p>`}</div>
  ${o.errors.length ? `<div class="panel tbl"><h2>Money steps that did not post by themselves</h2><table><tbody>${o.errors.map(e => `<tr><td>${esc(String(e.at).slice(0, 16).replace("T", " "))}</td><td class="mono small">${esc(e.source)}</td><td>${esc(e.message)}</td><td>${own ? `<button class="btn small" type="button" data-bk="errOk" data-id="${e.id}">Done by hand</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : ""}
  ${own ? `<div class="panel"><h2>AI review</h2><p class="small">A second opinion on value and tax efficiency from the AI. It sees only the totals per account: no names, notes, trips or bank text. It cannot change anything. Each review costs a few cents and counts against the monthly Books AI budget in Settings.</p>
    <div class="row"><button class="btn" type="button" data-bk="ai">Ask for a review</button></div>${BK.d.ai ? `<div class="note"><p class="small muted">Spent this month: USD ${BK.d.ai.spentUsd} of ${BK.d.ai.capUsd}</p><div style="white-space:pre-wrap">${esc(BK.d.ai.text)}</div></div>` : ""}</div>` : ""}`;
}
function bkSettings(){
  const s = BK.d.set || {}, own = BK.role === "owner", k = BK.d.keys || {rows: []}, mem = BK.d.mem || {rows: []};
  return `<div class="grid2"><div class="stack">
    <div class="panel"><h2>Company</h2>${own ? `
      <label class="f" for="bk_fye">Financial year end (a date)<input type="date" id="bk_fye" value="${esc(s.fyEnd || "")}"></label>
      <label class="f" for="bk_uen">UEN<input id="bk_uen" value="${esc(s.uen || "")}" maxlength="12"></label>
      <div class="row"><label class="f" for="bk_fx">SGD per USD<input id="bk_fx" inputmode="decimal" value="${esc(s.sgdPerUsd || "")}" style="max-width:110px"></label><label class="f" for="bk_fxd">Rate date and source<input id="bk_fxd" value="${esc(s.sgdRateDate || "")}" placeholder="e.g. MAS, 2026-11-30"></label></div>
      <div class="row"><label class="f" for="bk_ya">Year of assessment<input id="bk_ya" inputmode="numeric" value="${esc(s.ya || "")}" style="max-width:90px"></label><label class="f" for="bk_yai">Which YA of the company (1 = first)<input id="bk_yai" inputmode="numeric" value="${esc(s.yaIndex || 1)}" style="max-width:70px"></label></div>
      <label class="check" for="bk_gst"><input type="checkbox" id="bk_gst" ${s.gstRegistered ? "checked" : ""}><span>Registered for GST</span></label>
      <label class="f" for="bk_aic">Books AI budget a month (USD)<input id="bk_aic" inputmode="decimal" value="${esc(s.aiCapUsd ?? 5)}" style="max-width:90px"></label>
      <div class="row"><button class="btn primary" type="button" data-bk="setSave">Save</button></div>` : `<p class="small">Year end ${esc(s.fyEnd || "not set")} · UEN ${esc(s.uen || "–")} · GST ${s.gstRegistered ? "registered" : "not registered"}</p>`}</div>
    <div class="panel"><h2>Your second step</h2><table><tbody>${k.rows.map(x => `<tr><td>${esc(x.name || "Passkey")}</td><td class="small muted">added ${esc(String(x.created_at).slice(0, 10))}${x.last_used ? ", used " + esc(String(x.last_used).slice(0, 10)) : ""}</td><td><button class="btn small" type="button" data-bk="pkDel" data-id="${esc(x.id)}">Remove</button></td></tr>`).join("")}
      <tr><td>Authenticator app</td><td class="small muted">${k.totp ? "set up" : "not set up"}</td><td>${k.totp ? "" : `<button class="btn small" type="button" data-bk="totpStart">Set up</button>`}</td></tr></tbody></table>
      <div class="row"><button class="btn small" type="button" data-bk="addPk">Add a passkey on this device</button></div><div id="bkTotp"></div>
      <p class="small muted">Keep at least two: a passkey on your phone and the authenticator app, so losing one device never locks you out.</p></div>
    <div class="panel"><h2>Ledger check</h2><p class="small">Every entry carries the fingerprint of the one before it. Checking recomputes them all.</p><div class="row"><button class="btn small" type="button" data-bk="verify">Check the ledger</button></div></div>
  </div><div class="stack">
    ${own ? `<div class="panel"><h2>People with access</h2><p class="small">Owners are set in Vercel (BOOKS_OWNERS), not here, so nobody can make themselves an owner from the portal. Share the books with your bookkeeper or accountant: they need a portal sign-in first, and their own passkey or authenticator code. Accountants read, export and draft; bookkeepers read, draft and import bank statements; only owners post.</p>
      <table><tbody>${mem.rows.map(m => `<tr><td>${esc(m.email)}</td><td>${esc(m.role)}</td><td>${m.active ? `<button class="btn small danger" type="button" data-bk="memEnd" data-id="${esc(m.user_id)}">End access</button>` : `<span class="small muted">ended ${esc(String(m.ended_at || "").slice(0, 10))}</span>`}</td></tr>`).join("") || `<tr><td class="small muted">Only the owners.</td></tr>`}</tbody></table>
      <div class="row" style="flex-wrap:wrap"><input id="bk_me" type="email" placeholder="their portal email" aria-label="Email"><select id="bk_mr" aria-label="Role"><option value="accountant">Accountant</option><option value="bookkeeper">Bookkeeper</option></select><button class="btn small" type="button" data-bk="memAdd">Give access</button></div></div>
    <div class="panel tbl"><h2>Books log</h2><table><tbody>${(BK.d.log || []).slice(0, 60).map(x => `<tr><td class="small">${esc(String(x.at).slice(0, 16).replace("T", " "))}</td><td>${esc(x.action)}</td><td class="small muted">${esc(x.user_id === S.uid ? "you" : String(x.user_id || "").slice(0, 8))}</td></tr>`).join("")}</tbody></table><p class="small muted">Every opening, report, export and change is logged and cannot be edited.</p></div>` : ""}
  </div></div>`;
}

// ---------- second step: passkey and authenticator app ----------
async function bkAddPasskey(){
  try {
    const o = await bkApi({mode: "regOptions"});
    const cred = await navigator.credentials.create({publicKey: {challenge: bkUnB64(o.challenge), rp: o.rp, user: {...o.user, id: bkUnB64(o.user.id)}, pubKeyCredParams: o.pubKeyCredParams,
      authenticatorSelection: o.authenticatorSelection, attestation: "none", timeout: o.timeout, excludeCredentials: (o.excludeCredentials || []).map(c => ({...c, id: bkUnB64(c.id)}))}});
    const r = cred.response; if (!r.getPublicKey || !r.getPublicKey()) { toast("This browser cannot set up passkeys for Books. Use the authenticator app."); return; }
    const name = /iPhone|iPad/.test(navigator.userAgent) ? "iPhone or iPad" : /Mac/.test(navigator.userAgent) ? "Mac" : /Android/.test(navigator.userAgent) ? "Android" : "This device";
    const v = await bkApi({mode: "regVerify", challenge: o.challenge, id: cred.id, clientDataJSON: bkB64(r.clientDataJSON), authenticatorData: bkB64(r.getAuthenticatorData()), publicKey: bkB64(r.getPublicKey()), alg: r.getPublicKeyAlgorithm(), name});
    if (v.session) { BK.sess = v.session; BK.unlocked = true; }
    toast("Passkey saved."); await bkStatus(); bkTab(BK.unlocked ? (BK.tab === "settings" ? "settings" : "overview") : BK.tab);
  } catch(e){ toast(e.name === "NotAllowedError" ? "Cancelled." : e.message); }
}
async function bkUnlockPasskey(){
  try {
    const o = await bkApi({mode: "unlockOptions"});
    const a = await navigator.credentials.get({publicKey: {challenge: bkUnB64(o.challenge), rpId: o.rpId, allowCredentials: o.allowCredentials.map(c => ({...c, id: bkUnB64(c.id)})), userVerification: "required", timeout: o.timeout}});
    const r = a.response, v = await bkApi({mode: "unlockPasskey", challenge: o.challenge, id: a.id, clientDataJSON: bkB64(r.clientDataJSON), authenticatorData: bkB64(r.authenticatorData), signature: bkB64(r.signature)});
    BK.sess = v.session; BK.unlocked = true; bkTab("overview");
  } catch(e){ toast(e.name === "NotAllowedError" ? "Cancelled." : e.message); }
}
async function bkUnlockTotp(){
  try {
    const code = (($("bk_code") || {}).value || "").trim(); if (!/^\d{6}$/.test(code)) { toast("Enter the 6-digit code."); return; }
    const f = await window.__sb.auth.mfa.listFactors(); const tf = ((f.data || {}).totp || []).find(x => x.status === "verified"); if (!tf) { toast("No authenticator app set up."); return; }
    const r = await window.__sb.auth.mfa.challengeAndVerify({factorId: tf.id, code}); if (r.error) { toast("That code was not accepted."); return; }
    const v = await bkApi({mode: "unlockTotp"}); BK.sess = v.session; BK.unlocked = true; bkTab("overview");
  } catch(e){ toast(e.message); }
}
async function bkTotpStart(){
  try {
    const e = await window.__sb.auth.mfa.enroll({factorType: "totp", friendlyName: "Archē Books " + new Date().toISOString().slice(0, 10)});
    if (e.error) { toast(e.error.message); return; }
    BK.totpId = e.data.id;
    const box = $("bkTotp"); if (box) box.innerHTML = `<div class="note"><p class="small">Scan this with Google Authenticator, Microsoft Authenticator or 1Password, then enter the code it shows.</p>
      <img src="${esc(e.data.totp.qr_code)}" alt="QR code for the authenticator app" width="180" height="180" style="background:#fff;padding:6px"><p class="small muted">Or type the key: <span class="mono">${esc(e.data.totp.secret)}</span></p>
      <label class="f" for="bk_tc">Code<input id="bk_tc" inputmode="numeric" maxlength="6" style="max-width:120px"></label><button class="btn small primary" type="button" data-bk="totpVerify">Confirm</button></div>`;
  } catch(e){ toast(e.message); }
}
async function bkTotpVerify(){
  try {
    const code = (($("bk_tc") || {}).value || "").trim(); const r = await window.__sb.auth.mfa.challengeAndVerify({factorId: BK.totpId, code});
    if (r.error) { toast("That code was not accepted."); return; }
    toast("Authenticator app set up."); const v = await bkApi({mode: "unlockTotp"}).catch(() => null); if (v && v.session) { BK.sess = v.session; BK.unlocked = true; }
    await bkStatus(); bkTab(BK.unlocked ? BK.tab : "overview");
  } catch(e){ toast(e.message); }
}

// ---------- actions ----------
function bkReadLines(){ BK.lines = BK.lines.map((l, i) => ({account: ($("bk_la" + i) || {}).value || l.account, debit: ($("bk_ld" + i) || {}).value ?? l.debit, credit: ($("bk_lc" + i) || {}).value ?? l.credit, memo: ($("bk_lm" + i) || {}).value ?? l.memo}));
  BK.ed = ($("bk_ed") || {}).value || BK.ed; BK.em = ($("bk_em") || {}).value ?? BK.em; }
function bkDownload(name, text){ const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type: "text/csv"})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
document.addEventListener("input", e => { if (e.target.id && /^bk_l[dc]\d+$/.test(e.target.id)) { bkReadLines(); clearTimeout(bkReadLines.h); bkReadLines.h = setTimeout(() => { const f = document.activeElement && document.activeElement.id; render(); if (f && $(f)) { $(f).focus(); const v = $(f).value; $(f).setSelectionRange && $(f).setSelectionRange(v.length, v.length); } }, 400); } });
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-bk]"); if (!b || S.view !== "books") return;
  const a = b.dataset.bk, entry = () => { bkReadLines(); return {date: BK.ed || new Date().toISOString().slice(0, 10), memo: BK.em, lines: BK.lines.map(l => ({account: l.account, debit: +l.debit || 0, credit: +l.credit || 0, memo: l.memo || ""}))}; };
  try {
    if (a === "tab") return bkTab(b.dataset.t);
    if (a === "lock") return bkLock();
    if (a === "addPk") return bkAddPasskey();
    if (a === "unlockPk") return bkUnlockPasskey();
    if (a === "unlockTotp") return bkUnlockTotp();
    if (a === "totpStart") return bkTotpStart();
    if (a === "totpVerify") return bkTotpVerify();
    if (a === "txFind") { BK.f = $("bk_f").value; BK.t = $("bk_t").value; BK.q = $("bk_q").value; BK.fa = $("bk_fa").value; return bkLoad("tx"); }
    if (a === "rev") { BK.revAsk = +b.dataset.id; return render(); }
    if (a === "revNo") { BK.revAsk = null; return render(); }
    if (a === "revYes") { await bkApi({mode: "reverse", id: +b.dataset.id}); BK.revAsk = null; toast("Reversal posted."); return bkLoad("tx"); }
    if (a === "lineAdd") { bkReadLines(); BK.lines.push({account: "", debit: "", credit: ""}); return render(); }
    if (a === "lineDel") { bkReadLines(); BK.lines.splice(+b.dataset.i, 1); return render(); }
    if (a === "tmpl") { const t = {capital: [["1000", "debit"], ["3000", "credit"], "Share capital paid in"], cost: [["5900", "debit"], ["1000", "credit"], "Cost paid from the bank"], dividend: [["3300", "debit"], ["2600", "credit"], "Dividend declared by directors' resolution"]}[b.dataset.k];
      BK.lines = [{account: t[0][0], debit: "", credit: ""}, {account: t[1][0], debit: "", credit: ""}]; BK.em = t[2]; return render(); }
    if (a === "post") { const r = await bkApi({mode: "post", entry: entry()}); toast("Entry " + r.id + " posted."); BK.lines = [{account: "", debit: "", credit: ""}, {account: "", debit: "", credit: ""}]; BK.em = ""; return bkLoad("entry"); }
    if (a === "draft") { await bkApi({mode: "draft", entry: entry()}); toast("Draft saved for an owner to post."); BK.lines = [{account: "", debit: "", credit: ""}, {account: "", debit: "", credit: ""}]; BK.em = ""; return bkLoad("entry"); }
    if (a === "dPost" || a === "dRej") { await bkApi({mode: "decideDraft", id: b.dataset.id, decision: a === "dPost" ? "post" : "reject"}); toast(a === "dPost" ? "Posted." : "Rejected."); return bkLoad("entry"); }
    if (a === "bankAll") { BK.allBank = b.checked; return bkLoad("bank"); }
    if (a === "bankImp") { const f = ($("bk_bf").files || [])[0]; if (!f) { toast("Choose the CSV file."); return; } BK.ba = $("bk_ba").value; if (!BK.ba) { toast("Choose the account."); return; }
      const r = await bkApi({mode: "bankImport", account: BK.ba, csv: await f.text()}); toast(r.lines + " lines read; any already imported were skipped."); return bkLoad("bank"); }
    if (a === "match") { const id = b.dataset.id, k = id.slice(0, 12), ent = +($("bk_me" + k) || {}).value || 0, counter = ($("bk_m" + k) || {}).value;
      if (!ent && !counter) { toast("Choose the account it is for, or give the entry number that already holds it."); return; }
      const r = await bkApi({mode: "bankMatch", id, entry: ent || undefined, counter}); toast("Matched to entry " + r.id + "."); return bkLoad("bank"); }
    if (a === "rep" || a === "repCsv") { BK.rep = {type: $("bk_rt").value, from: $("bk_rf").value, to: $("bk_rto").value, account: ($("bk_ra") || {}).value};
      const r = await bkApi({mode: "report", ...BK.rep, from: BK.rep.from || undefined, to: BK.rep.to || undefined, csv: a === "repCsv"}); if (a === "repCsv") { bkDownload(r.filename, r.csv); return; } BK.d.rep = r; return render(); }
    if (a === "budImp") { const f = ($("bk_bj").files || [])[0], m1 = $("bk_bm1").value; if (!f || !m1) { toast("Choose the budget file and month 1."); return; }
      const j = JSON.parse(await f.text()), start = new Date(m1 + "-01T00:00:00Z");
      const rows = (j.rows || []).map(r => { const d = new Date(start); d.setUTCMonth(d.getUTCMonth() + (+r.m - 1)); return {month: d.toISOString().slice(0, 10), account: r.account, amount: r.amount}; });
      const r = await bkApi({mode: "budgetImport", rows, version: j.version || "locked", source: (j.source || f.name) + ", month 1 = " + m1}); toast(r.lines + " budget lines loaded."); return bkLoad("overview").then(() => { BK.tab = "budget"; render(); }); }
    if (a === "errOk") { await bkApi({mode: "resolveError", id: +b.dataset.id}); return bkLoad("advice"); }
    if (a === "ai") { b.disabled = true; BK.d.ai = await bkApi({mode: "aiReview"}); return render(); }
    if (a === "setSave") { await bkApi({mode: "settings", set: {fyEnd: $("bk_fye").value, uen: $("bk_uen").value, sgdPerUsd: $("bk_fx").value, sgdRateDate: $("bk_fxd").value, ya: $("bk_ya").value, yaIndex: $("bk_yai").value, gstRegistered: $("bk_gst").checked, aiCapUsd: $("bk_aic").value}}); toast("Saved."); return bkLoad("settings"); }
    if (a === "pkDel") { await bkApi({mode: "passkeys", remove: b.dataset.id}); toast("Passkey removed."); return bkLoad("settings"); }
    if (a === "memAdd") { await bkApi({mode: "members", add: {email: $("bk_me").value, role: $("bk_mr").value}}); toast("Access given. They unlock with their own second step."); return bkLoad("settings"); }
    if (a === "memEnd") { await bkApi({mode: "members", end: b.dataset.id}); toast("Access ended."); return bkLoad("settings"); }
    if (a === "verify") { const r = await bkApi({mode: "verify"}); toast(r.ok ? "Ledger intact: every entry matches its fingerprint." : "Ledger changed outside the portal at entry " + ((r.bad || [])[0] || {}).bad_id + "."); return; }
  } catch(err){ toast(err.message); b.disabled = false; }
});
