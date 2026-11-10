// Books, part 2 (Morten, 10 Nov 2026: "even the worst in class accountant or my 11 year old daughter can do this without
// mistakes, and even if there should be mistakes, it will be caught and in worst case rolled back").
// The server side of the automation: every posting goes through post() and its checks; bank lines match themselves;
// repeating entries come up as drafts; Wise lines arrive by themselves; everything can be undone. db = {sb, all, rpc, log}.
import { createHash } from "node:crypto";
import * as C from "./core.mjs";

const hash = s => createHash("sha256").update(String(s)).digest("hex");
const ECB90 = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";
export const WISE_API = "https://api.wise.com";
export const WISE_ACCOUNTS = { USD: "1010", SGD: "1020" };

export class Refused extends Error { constructor(msg, extra = {}) { super(msg); this.status = 400; Object.assign(this, extra); } }

// everything the checks and the matching need, read once
export async function context(db) {
  const [accounts, journal, lines, rules, receipts, linked] = await Promise.all([
    db.all("/rest/v1/acct_accounts?select=*&order=code"),
    db.all("/rest/v1/acct_journal?select=id,jdate,memo,source,kind,reverses&order=id"),
    db.all("/rest/v1/acct_lines?select=journal_id,account,debit,credit,ref&order=id"),
    db.all("/rest/v1/acct_rules?active=eq.true&select=*"),
    db.all("/rest/v1/acct_receipts?status=eq.posted&select=id,status,data,journal_id"),
    db.all("/rest/v1/acct_bank_lines?select=journal_id,bank_account,description,amount,amount_usd,how,matched_ref&journal_id=not.is.null")]);
  const J = Object.fromEntries(journal.map(j => [j.id, j])), reversed = new Set(journal.filter(j => j.reverses).map(j => j.reverses));
  for (const l of lines) { l.jdate = (J[l.journal_id] || {}).jdate; l.debit = +l.debit; l.credit = +l.credit; }
  const byJ = {}; for (const l of lines) (byJ[l.journal_id] || (byJ[l.journal_id] = [])).push(l);
  const entries = journal.map(j => ({ ...j, lines: byJ[j.id] || [], reversed: reversed.has(j.id) }));
  const used = new Set(linked.map(x => `${x.journal_id}:${x.bank_account}`));
  // amounts on a bank account that no bank line has claimed yet (trip money, transfers, entries typed by hand)
  const open = [];
  for (const j of entries) { if (j.reversed || j.kind === "reversal") continue;
    for (const l of j.lines) if (C.BANKS.includes(l.account) && !used.has(`${j.id}:${l.account}`)) open.push({ journal_id: j.id, account: l.account, amount: C.r2(l.debit - l.credit), jdate: j.jdate, memo: j.memo }); }
  const history = linked.filter(x => (x.how === "person" || x.how === "rule") && x.matched_ref).map(x => ({ who: C.counterparty(x.description), out: +(x.amount_usd ?? x.amount) < 0, account: x.matched_ref }));
  return { accounts, journal, lines, entries, rules, receipts, open, history };
}

// the one way into the books from a person or a rule: clean, check, then post. Blocks stop it; warnings stop it unless a
// person confirmed them (confirm: true); an automatic posting (auto: true) never goes ahead with a warning.
export async function post(db, entry, { by, kind = "manual", source = null, role = "owner", confirm = false, auto = false, today, cfg = {}, ctx = null }) {
  ctx = ctx || await context(db);
  const e = C.cleanEntry(entry, ctx.accounts);
  const r = C.checks(e, { accounts: ctx.accounts, lines: ctx.lines, entries: ctx.entries, today, lockedUntil: cfg.lockedUntil || null, gstRegistered: !!cfg.gstRegistered, kind: auto ? "rule" : kind === "import" ? "rule" : kind, role });
  if (r.blocks.length) throw new Refused(r.blocks[0], { blocks: r.blocks, warns: r.warns });
  if (r.warns.length && (auto || !confirm)) return { posted: false, warns: r.warns };
  const id = await db.rpc("acct_post", { p_date: e.date, p_memo: e.memo, p_source: source, p_kind: kind, p_lines: e.lines, p_by: by || null, p_reverses: null });
  // later checks in the same run see this entry (no double posting inside one import)
  const ls = e.lines.map(l => ({ journal_id: id, account: l.account, debit: l.debit, credit: l.credit, ref: l.ref, jdate: e.date }));
  ctx.lines.push(...ls); ctx.entries.push({ id, jdate: e.date, memo: e.memo, kind, lines: ls, reversed: false });
  return { posted: true, id, warns: r.warns };
}

// bank lines without an entry: match, post by rule, or leave a suggestion for one tap
// suggestOnly: after an undo nothing is redone by itself; the line waits for a person with the suggestion
export async function processLines(db, rows, { by, today, cfg, ctx = null, suggestOnly = false }) {
  ctx = ctx || await context(db); const out = { matched: 0, posted: 0, suggested: 0 };
  for (const line of rows) {
    if (line.journal_id) continue;
    const m = C.autoMatch({ line, entries: ctx.open, rules: ctx.rules, history: ctx.history, receipts: ctx.receipts });
    const patch = x => db.sb(`/rest/v1/acct_bank_lines?id=eq.${encodeURIComponent(line.id)}`, { method: "PATCH", body: JSON.stringify(x) });
    if (suggestOnly) { await patch({ status: "suggested", suggestion: { account: m.account || "", rule: m.rule || null, receipt: m.receipt || null, entry: m.entry || null, why: "Undone. " + (m.why || "") } }); out.suggested++; continue; }
    if (m.type === "entry") {
      await patch({ journal_id: m.entry, status: "matched", how: "entry", suggestion: null });
      ctx.open = ctx.open.filter(o => !(o.journal_id === m.entry && o.account === line.bank_account)); out.matched++; continue; }
    if (m.type === "receipt") {
      const rec = ctx.receipts.find(r => r.id === m.receipt), billUsd = C.r2(rec.data.usd);
      const e = C.billPaymentEntry({ billUsd, bankUsd: usdOf(line), bankAccount: line.bank_account, receiptId: rec.id, lineId: line.id, date: line.bdate, supplier: rec.data.supplier });
      const p = await post(db, e, { by, kind: "import", source: "bank:" + line.id, auto: true, today, cfg, ctx }).catch(err => ({ posted: false, warns: [err.message] }));
      if (p.posted) { await patch({ journal_id: p.id, status: "posted", how: "receipt", suggestion: null });
        await db.sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "paid", paid_journal_id: p.id }) });
        ctx.receipts = ctx.receipts.filter(r => r.id !== rec.id); out.posted++; continue; }
      await patch({ status: "suggested", suggestion: { receipt: rec.id, why: m.why, warns: p.warns } }); out.suggested++; continue; }
    if (m.type === "rule") {
      const rule = ctx.rules.find(r => r.id === m.rule);
      const p = await post(db, lineEntry(line, rule.account, `${rule.name || rule.match}: ${line.description || "bank line"}`), { by, kind: "import", source: "bank:" + line.id, auto: true, today, cfg, ctx })
        .catch(err => ({ posted: false, warns: [err.message] }));
      if (p.posted) { await patch({ journal_id: p.id, status: "posted", how: "rule", rule_id: rule.id, matched_ref: rule.account, suggestion: null });
        await db.sb(`/rest/v1/acct_rules?id=eq.${rule.id}`, { method: "PATCH", body: JSON.stringify({ hits: (rule.hits || 0) + 1, last_hit: line.bdate }) }); rule.hits = (rule.hits || 0) + 1; out.posted++; continue; }
      await patch({ status: "suggested", suggestion: { account: rule.account, rule: rule.id, why: m.why + ", but it needs a look", warns: p.warns } }); out.suggested++; continue; }
    await patch({ status: "suggested", suggestion: { account: m.account || "", rule: m.rule || null, why: m.why } }); out.suggested++;
  }
  return out;
}
export const usdOf = l => C.r2(l.amount_usd != null ? l.amount_usd : l.amount);
// one bank line as an entry against the account chosen (money in: bank debit; money out: bank credit)
export function lineEntry(line, account, memo) {
  const amt = Math.abs(usdOf(line)), ref = "bank:" + String(line.id).slice(0, 16);
  return { date: line.bdate, memo: String(memo || line.description || "Bank line").slice(0, 300),
    lines: usdOf(line) > 0 ? [{ account: line.bank_account, debit: amt, ref }, { account, credit: amt, ref }] : [{ account, debit: amt, ref }, { account: line.bank_account, credit: amt, ref }] };
}

// ECB reference rates for the last 90 days (official and free); null when the ECB cannot be reached
let rateCache = null;
export async function rates(fetchFn = fetch) {
  if (rateCache && Date.now() - rateCache.at < 6 * 3600e3) return rateCache.r;
  try { const r = await fetchFn(ECB90); if (!r.ok) return {}; const x = C.ecbRates(await r.text()); rateCache = { at: Date.now(), r: x }; return x; } catch (e) { return {}; }
}

// statement lines (CSV or Wise) into acct_bank_lines, in dollars, never twice; then matched
export async function addLines(db, account, list, { by, today, cfg, batch, idOf, fetchFn = fetch }) {
  const need = list.some(l => (l.currency || "USD") !== "USD"), R = need ? await rates(fetchFn) : {}, skipped = [];
  const rows = [];
  for (const l of list) { const cur = (l.currency || "USD").toUpperCase(), fx = C.toUsd(l.amount, cur, l.date, R, cfg);
    if (!fx) { skipped.push(l.date); continue; }
    rows.push({ id: idOf ? idOf(l) : hash([account, l.date, l.amount, l.description, l.balance].join("|")), bank_account: account, bdate: l.date, amount: C.r2(l.amount), currency: cur,
      amount_usd: fx.usd, fx_rate: fx.rate, fx_source: fx.source, description: l.description || "", balance: l.balance ?? null, bank_ref: l.ref || "", batch, imported_by: by || null, status: "new" }); }
  if (!rows.length) return { added: 0, skipped: skipped.length };
  const known = new Set();
  for (let i = 0; i < rows.length; i += 100) for (const x of await db.all(`/rest/v1/acct_bank_lines?select=id&id=in.(${rows.slice(i, i + 100).map(r => encodeURIComponent(r.id)).join(",")})`)) known.add(x.id);
  const fresh = rows.filter(r => !known.has(r.id));
  if (fresh.length) await db.sb("/rest/v1/acct_bank_lines?on_conflict=id", { method: "POST", headers: { prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(fresh) });
  const res = await processLines(db, fresh.map(r => ({ ...r, journal_id: null })), { by, today, cfg });
  return { added: fresh.length, already: rows.length - fresh.length, skipped: skipped.length, ...res };
}

// Wise Business, read-only personal token (WISE_TOKEN in Vercel): USD and SGD balances since the last sync
export async function wiseSync(db, token, { by, today, cfg, fetchFn = fetch }) {
  const get = async p => { const r = await fetchFn(WISE_API + p, { headers: { authorization: "Bearer " + token } }); if (!r.ok) throw new Error("Wise answered " + r.status + (r.status === 401 ? ": the token is wrong or expired" : r.status === 403 ? ": the token may not read statements" : "")); return r.json(); };
  const state = (await db.sb("/rest/v1/acct_settings?key=eq.wise&select=value"))[0]?.value || {};
  const profiles = await get("/v2/profiles"), prof = profiles.find(p => String(p.type).toUpperCase() === "BUSINESS");
  if (!prof) throw new Error("No Wise Business profile found for this token.");
  const balances = await get(`/v4/profiles/${prof.id}/balances?types=STANDARD`), out = { accounts: [], skipped: [] }, now = new Date().toISOString();
  for (const b of balances) { const cur = b.currency || (b.amount || {}).currency, acct = WISE_ACCOUNTS[cur];
    if (!acct) { out.skipped.push(cur); continue; }
    const start = state[b.id] || new Date(Date.now() - 90 * 864e5).toISOString();
    const st = await get(`/v1/profiles/${prof.id}/balance-statements/${b.id}/statement.json?currency=${cur}&intervalStart=${encodeURIComponent(start)}&intervalEnd=${encodeURIComponent(now)}&type=COMPACT`);
    const list = (st.transactions || []).map(t => ({ date: String(t.date || "").slice(0, 10), amount: C.r2((t.amount || {}).value), currency: cur, description: String((t.details || {}).description || "").replace(/[\u0000-\u001f<>]/g, " ").slice(0, 200),
      balance: (t.runningBalance || {}).value ?? null, ref: String(t.referenceNumber || "").slice(0, 60) })).filter(t => t.date && t.amount);
    const r = await addLines(db, acct, list, { by, today, cfg, batch: "wise:" + now, idOf: l => hash(["wise", acct, l.ref || [l.date, l.amount, l.description].join("|")].join("|")), fetchFn });
    state[b.id] = now; out.accounts.push({ account: acct, currency: cur, ...r, statementBalance: (st.endOfStatementBalance || {}).value ?? null }); }
  await db.sb("/rest/v1/acct_settings", { method: "POST", headers: { prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key: "wise", value: { ...state, lastSync: now }, updated_at: now }) });
  return out;
}

// repeating entries due by today become drafts (one per month, never twice)
export async function recurringRun(db, today) {
  const recs = await db.all(`/rest/v1/acct_recurring?active=eq.true&next_date=lte.${today}&select=*`); let made = 0;
  for (const r of recs) { const { dates, next } = C.recurringDue(r, today);
    for (const d of dates) { await db.sb("/rest/v1/acct_drafts?on_conflict=source", { method: "POST", headers: { prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ created_by: r.created_by, source: `rec:${r.id}:${d}`, data: { date: d, memo: r.memo, lines: r.lines, repeat: r.id } }) }); made++; }
    await db.sb(`/rest/v1/acct_recurring?id=eq.${r.id}`, { method: "PATCH", body: JSON.stringify({ next_date: next, active: !(r.end_date && next > r.end_date) }) }); }
  return made;
}

// after an entry is reversed: whatever pointed at it is open again (bank line back to To do, bill back to unpaid)
export async function afterReverse(db, id, { by, today, cfg }) {
  const lines = await db.sb(`/rest/v1/acct_bank_lines?journal_id=eq.${id}&select=*`);
  for (const l of lines) await db.sb(`/rest/v1/acct_bank_lines?id=eq.${encodeURIComponent(l.id)}`, { method: "PATCH", body: JSON.stringify({ journal_id: null, status: "new", how: "", rule_id: null, matched_ref: "", suggestion: null }) });
  await db.sb(`/rest/v1/acct_receipts?journal_id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "read", journal_id: null }) });
  await db.sb(`/rest/v1/acct_receipts?paid_journal_id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "posted", paid_journal_id: null }) });
  if (lines.length) { const ctx = await context(db); ctx.rules = ctx.rules.filter(r => !lines.some(l => l.rule_id === r.id)); await processLines(db, lines.map(l => ({ ...l, journal_id: null })), { by, today, cfg, ctx, suggestOnly: true }); }
  return lines.length;
}

// undo a rule: every entry it made is reversed, its lines go back to To do, and the rule stops
export async function undoRule(db, ruleId, { by, today, cfg }) {
  await db.sb(`/rest/v1/acct_rules?id=eq.${encodeURIComponent(ruleId)}`, { method: "PATCH", body: JSON.stringify({ active: false, ended_at: new Date().toISOString() }) });
  const lines = await db.sb(`/rest/v1/acct_bank_lines?rule_id=eq.${encodeURIComponent(ruleId)}&journal_id=not.is.null&select=*`); let n = 0;
  for (const l of lines) { await db.rpc("acct_reverse", { p_id: l.journal_id, p_date: today, p_memo: "Undo: rule stopped", p_by: by }); await afterReverse(db, l.journal_id, { by, today, cfg }); n++; }
  return n;
}

// what needs a person, in one list, with the reason for each
export async function todo(db) {
  const [bank, receipts, drafts, errors] = await Promise.all([
    db.sb("/rest/v1/acct_bank_lines?journal_id=is.null&select=*&order=bdate.desc&limit=200"),
    db.sb("/rest/v1/acct_receipts?status=in.(new,read)&select=id,status,data,created_at,file_type&order=created_at.desc&limit=100"),
    db.sb("/rest/v1/acct_drafts?status=eq.draft&select=*&order=created_at.desc&limit=100"),
    db.sb("/rest/v1/acct_errors?resolved=eq.false&select=id,at,source,message&order=id.desc&limit=50")]);
  for (const r of receipts) r.ready = C.receiptReady(r.data);
  return { bank, receipts, drafts, errors, count: bank.length + receipts.length + drafts.length + errors.length };
}

// the checks that run every time Books opens: the ledger balances, the chain holds, each dollar bank account agrees
// with its last statement balance, nothing waits too long
export function health({ accounts, lines, chainOk, bankLines, today }) {
  const out = [], tb = C.trialBalance(accounts, lines, today);
  if (!tb.balanced) out.push({ sev: "high", text: `The books do not balance (debits ${tb.debit}, credits ${tb.credit}). Tell your accountant.` });
  if (!chainOk) out.push({ sev: "high", text: "An entry was changed outside the portal (the chain check failed). Open Settings and access, Check the ledger." });
  for (const acct of C.BANKS) { const ls = bankLines.filter(l => l.bank_account === acct && l.currency === "USD" && l.balance != null).sort((a, b) => a.bdate < b.bdate ? 1 : -1);
    if (!ls.length) continue; const last = ls[0], open = bankLines.some(l => l.bank_account === acct && !l.journal_id && l.bdate <= last.bdate);
    if (open) continue;
    const book = C.r2(lines.filter(l => l.account === acct && l.jdate <= last.bdate).reduce((s, l) => s + l.debit - l.credit, 0));
    if (Math.abs(book - +last.balance) > 0.005) out.push({ sev: "high", text: `Bank ${acct}: the books say USD ${book.toLocaleString("en-US")} on ${last.bdate}, the bank says USD ${(+last.balance).toLocaleString("en-US")}. An opening balance or a line is missing.` }); }
  const old = bankLines.filter(l => !l.journal_id && C.addDays(l.bdate, 14) < today).length;
  if (old) out.push({ sev: "med", text: `${old} bank line${old > 1 ? "s" : ""} older than two weeks still wait in To do.` });
  return out;
}
