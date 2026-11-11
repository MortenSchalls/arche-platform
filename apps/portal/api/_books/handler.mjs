// Books API (POST /api/books, served through api/me.mjs: the Hobby plan allows 12 functions).
// Every call: (1) a valid portal sign-in; (2) a books right: owner (email listed in BOOKS_OWNERS in Vercel, never in the
// database) or a member the owners added (accountant, bookkeeper); (3) for everything but status and the unlock steps,
// a books session opened within the last 15 minutes with a passkey or an authenticator code (8 hours at most).
// The database refuses browser access to every books table; only this server reaches them, with the secret key.
// Environment: SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, BOOKS_OWNERS, BOOKS_ORIGIN (optional),
// ANTHROPIC_API_KEY (optional, for the AI review only).
import { createHash, randomBytes } from "node:crypto";
import * as C from "./core.mjs";
import * as W from "./webauthn.mjs";
import * as A from "./auto.mjs";

const IDLE = 15 * 60e3, MAX = 8 * 3600e3, ENTITY = "Arche Aviation Pte. Ltd.", TRADING = "Archē Executive";
const SBU = () => (process.env.SUPABASE_URL || "").replace(/\/$/, ""), KEY = () => process.env.SUPABASE_SECRET_KEY;
const hash = s => createHash("sha256").update(String(s)).digest("hex");
const owners = () => String(process.env.BOOKS_OWNERS || "").toLowerCase().split(/[,; ]+/).filter(Boolean);
const RIGHTS = {
  owner: ["read", "export", "post", "draft", "approve", "reverse", "bank", "receipts", "budget", "members", "settings", "ai"],
  accountant: ["read", "export", "draft"],
  bookkeeper: ["read", "draft", "bank", "receipts"],
};

async function sb(path, opt = {}) {
  const r = await fetch(SBU() + path, { ...opt, headers: { apikey: KEY(), authorization: `Bearer ${KEY()}`, "content-type": "application/json", ...(opt.headers || {}) } });
  const body = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((body && (body.message || body.error)) || ("database " + r.status)); e.status = r.status; throw e; }
  return body;
}
async function all(path) {   // past PostgREST's 1,000-row pages
  const out = []; for (let off = 0; ; off += 1000) { const r = await fetch(SBU() + path, { headers: { apikey: KEY(), authorization: `Bearer ${KEY()}`, range: `${off}-${off + 999}`, "range-unit": "items" } });
    if (!r.ok) throw new Error("database " + r.status); const b = await r.json(); out.push(...b); if (b.length < 1000) return out; }
}
const rpc = (fn, args) => sb(`/rest/v1/rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
const insert = (t, row, extra = "") => sb(`/rest/v1/${t}${extra}`, { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(row) });
const log = (user_id, action, detail = {}) => insert("acct_log", { user_id, action, detail }).catch(() => {});
async function setting(key) { const r = await sb(`/rest/v1/acct_settings?key=eq.${encodeURIComponent(key)}&select=value`); return (r[0] || {}).value || null; }
const setSetting = (key, value) => sb("/rest/v1/acct_settings", { method: "POST", headers: { prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) });

function jwtPayload(t) { try { return JSON.parse(Buffer.from(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); } catch (e) { return {}; } }
function site(req) {
  const allowed = String(process.env.BOOKS_ORIGIN || "").split(/[ ,]+/).filter(Boolean), o = String(req.headers.origin || "");
  const origin = allowed.length ? (allowed.includes(o) ? o : allowed[0]) : `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
  return { origin, rpId: new URL(origin).hostname };
}
async function who(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const r = await fetch(SBU() + "/auth/v1/user", { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY || KEY(), authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json(), email = String(u.email || "").toLowerCase(), p = jwtPayload(token);
  let role = owners().includes(email) && (u.email_confirmed_at || u.confirmed_at) ? "owner" : null;
  if (!role) { const m = await sb(`/rest/v1/acct_members?user_id=eq.${u.id}&active=eq.true&select=role`).catch(() => []); role = (m[0] || {}).role || null; }
  const totp = (u.factors || []).some(f => f.factor_type === "totp" && f.status === "verified");
  return { id: u.id, email, role, jwt: p, totp };
}
async function session(req, me, uid) {
  // one round trip (Morten, 11 Nov 2026: "devestatingly slow"): mark it used only if it is still live, and get it back
  const t = String(req.headers["x-books-session"] || ""); if (!/^[A-Za-z0-9_-]{40,}$/.test(t)) return null;
  const now = new Date(), idleFrom = new Date(now.getTime() - IDLE).toISOString();
  const r = (await sb(`/rest/v1/acct_sessions?token_hash=eq.${hash(t)}&user_id=eq.${uid || (me && me.id)}&expires_at=gt.${now.toISOString()}&last_seen=gt.${idleFrom}`,
    { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify({ last_seen: now.toISOString() }) }))[0];
  return r || null;
}
async function openSession(me, factor) {
  const t = W.b64u(randomBytes(32));
  await insert("acct_sessions", { token_hash: hash(t), user_id: me.id, factor, expires_at: new Date(Date.now() + MAX).toISOString() });
  await sb(`/rest/v1/acct_sessions?expires_at=lt.${new Date().toISOString()}`, { method: "DELETE" }).catch(() => {});
  await log(me.id, "unlock", { factor });
  return t;
}
async function tooManyFails(me) {
  const since = new Date(Date.now() - 3600e3).toISOString();
  const r = await sb(`/rest/v1/acct_log?user_id=eq.${me.id}&action=eq.unlock-failed&at=gt.${since}&select=id`);
  return r.length >= 8;
}
const recentAuth = (p, methods, secs) => (p.amr || []).some(a => methods.includes(a.method) && Date.now() / 1000 - a.timestamp < secs);

// everything the reports need, read once per call
async function books() {
  const [accounts, journal, lines] = await Promise.all([
    all("/rest/v1/acct_accounts?select=*&order=code"),
    all("/rest/v1/acct_journal?select=id,jdate,memo,source,kind,reverses,created_by,created_at&order=id"),
    all("/rest/v1/acct_lines?select=id,journal_id,account,debit,credit,memo,ref&order=id")]);
  const J = Object.fromEntries(journal.map(j => [j.id, j]));
  for (const l of lines) { l.jdate = (J[l.journal_id] || {}).jdate; l.debit = +l.debit; l.credit = +l.credit; }
  return { accounts, journal, lines };
}
async function settings() { return (await setting("company")) || {}; }
function fixStart(fyEnd) { if (!fyEnd) return null; const t = new Date(fyEnd + "T00:00:00Z"); t.setUTCFullYear(t.getUTCFullYear() - 1); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); }
// the financial year that holds today, from the year end in Settings
function currentFy(s, today) {
  if (!s.fyEnd) return { start: today.slice(0, 4) + "-01-01", end: today.slice(0, 4) + "-12-31" };
  let end = s.fyEnd; while (end < today) end = C.addMonths(end, 12);
  while (C.addMonths(end, -12) >= today) end = C.addMonths(end, -12);
  return { start: fixStart(end), end };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SBU() || !KEY()) return res.status(503).json({ error: "Books are not set up yet." });
  const b = req.body || {}, mode = String(b.mode || "");
  try {
    // all that needs only the user id starts at once, in parallel with checking the sign-in (one wait instead of five)
    const uid = String(jwtPayload(String(req.headers.authorization || "").replace(/^Bearer\s+/i, "")).sub || "");
    const okId = /^[0-9a-f-]{36}$/.test(uid), soft = p => p.catch(e => ({ __err: e }));
    const keysP = okId ? soft(sb(`/rest/v1/acct_passkeys?user_id=eq.${uid}&select=id,name,created_at,last_used,alg,public_key,sign_count`)) : null;
    const sessP = okId ? soft(session(req, null, uid)) : Promise.resolve(null), cfgP = soft(settings());
    const me = await who(req);
    if (!me) return res.status(401).json({ error: "Sign in again." });
    if (me.id !== uid) return res.status(401).json({ error: "Sign in again." });
    if (!me.role) return res.status(403).json({ error: "No access to Books." });
    const can = r => RIGHTS[me.role].includes(r);
    const { origin, rpId } = site(req);
    // before SQL 0023/0024 is run the owners still see Books, with what is missing (Morten, 10 Nov 2026: "still not there")
    let keys; try { keys = await keysP; if (keys && keys.__err) throw keys.__err; }
    catch (e) { if (mode === "status") return res.json({ role: me.role, entity: ENTITY, trading: TRADING, unlocked: false, setup: "Books needs its database: in Supabase, SQL Editor, run supabase/migrations/0023_books.sql, then 0024_books_auto.sql. Then reload." }); throw e; }

    // ---------- before unlocking ----------
    if (mode === "status") {
      const s0 = await sessP, s = s0 && !s0.__err ? s0 : null;
      return res.json({ role: me.role, entity: ENTITY, trading: TRADING, unlocked: !!s, passkeys: keys.length, totp: me.totp, owners: owners().length });
    }
    if (mode === "regOptions" || mode === "regVerify") {
      // a new passkey: with an open books session, or as the very first factor within 10 minutes of a fresh sign-in
      const s0 = await sessP, s = s0 && !s0.__err ? s0 : null, first = !keys.length && !me.totp && recentAuth(me.jwt, ["password", "otp", "magiclink"], 600);
      const viaTotp = me.jwt.aal === "aal2" && recentAuth(me.jwt, ["totp"], 300);
      if (!s && !first && !viaTotp) return res.status(403).json({ error: keys.length || me.totp ? "Unlock Books first, then add the passkey." : "Sign out and in again, then set up the passkey within 10 minutes." });
      if (mode === "regOptions") {
        const challenge = W.newChallenge();
        await insert("acct_challenges", { user_id: me.id, challenge, purpose: "register", expires_at: new Date(Date.now() + 5 * 60e3).toISOString() });
        return res.json({ challenge, rp: { id: rpId, name: TRADING + " Books" }, user: { id: W.b64u(Buffer.from(me.id)), name: me.email, displayName: me.email },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -8 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { residentKey: "preferred", userVerification: "required" }, attestation: "none", timeout: 120000,
          excludeCredentials: keys.map(k => ({ type: "public-key", id: k.id })) });
      }
      const ch = await useChallenge(me, "register", b.challenge);
      const k = W.verifyRegistration(b, { challenge: ch, origin, rpId });
      await insert("acct_passkeys", { id: k.id, user_id: me.id, public_key: k.publicKey, alg: k.alg, name: String(b.name || "Passkey").replace(/[<>\u0000-\u001f]/g, "").slice(0, 60) });
      await log(me.id, "passkey-added", { name: b.name || "" });
      return res.json({ ok: true, session: s ? undefined : await openSession(me, "passkey") });
    }
    if (mode === "unlockOptions") {
      if (!keys.length) return res.status(400).json({ error: "No passkey yet." });
      if (await tooManyFails(me)) return res.status(429).json({ error: "Too many failed attempts. Try again in an hour." });
      const challenge = W.newChallenge();
      await insert("acct_challenges", { user_id: me.id, challenge, purpose: "unlock", expires_at: new Date(Date.now() + 2 * 60e3).toISOString() });
      return res.json({ challenge, rpId, allowCredentials: keys.map(k => ({ type: "public-key", id: k.id })), userVerification: "required", timeout: 60000 });
    }
    if (mode === "unlockPasskey") {
      if (await tooManyFails(me)) return res.status(429).json({ error: "Too many failed attempts. Try again in an hour." });
      const k = keys.find(x => x.id === b.id);
      try {
        if (!k) throw new Error("passkey: not one of yours");
        const ch = await useChallenge(me, "unlock", b.challenge);
        const { signCount } = W.verifyAssertion(b, k, { challenge: ch, origin, rpId });
        await sb(`/rest/v1/acct_passkeys?id=eq.${encodeURIComponent(k.id)}`, { method: "PATCH", body: JSON.stringify({ sign_count: signCount || 0, last_used: new Date().toISOString() }) });
      } catch (e) { await log(me.id, "unlock-failed", { why: String(e.message).slice(0, 120) }); return res.status(401).json({ error: "The passkey was not accepted." }); }
      return res.json({ session: await openSession(me, "passkey") });
    }
    if (mode === "unlockTotp") {
      // the browser has just passed the sign-in service's authenticator-code check (the token now says aal2)
      if (await tooManyFails(me)) return res.status(429).json({ error: "Too many failed attempts. Try again in an hour." });
      if (!(me.jwt.aal === "aal2" && recentAuth(me.jwt, ["totp"], 300))) { await log(me.id, "unlock-failed", { why: "no fresh code" }); return res.status(401).json({ error: "Enter a fresh authenticator code." }); }
      return res.json({ session: await openSession(me, "totp") });
    }
    if (mode === "lock") { const t = String(req.headers["x-books-session"] || ""); if (t) await sb(`/rest/v1/acct_sessions?token_hash=eq.${hash(t)}`, { method: "DELETE" }).catch(() => {}); return res.json({ ok: true }); }

    // ---------- everything else needs an open books session ----------
    const s0 = await sessP, s = s0 && !s0.__err ? s0 : null;
    if (!s) return res.status(401).json({ error: "locked" });
    if (!can("read")) return res.status(403).json({ error: "No access." });
    const today = String(b.today || new Date().toISOString()).slice(0, 10);
    const cfg0 = await cfgP, cfg = cfg0 && !cfg0.__err ? cfg0 : {}, fy = currentFy(cfg, today), from = String(b.from || fy.start).slice(0, 10), to = String(b.to || today).slice(0, 10);
    const need = r => { if (!can(r)) { const e = new Error("Your role cannot do this."); e.status = 403; throw e; } };
    const db = { sb, all, rpc, log }, po = { by: me.id, today, cfg, role: me.role };
    // a posting that needs a person's confirmation answers 409 with the reasons; the screen shows them and "Post anyway"
    const posted = (r, extra = {}) => r.posted ? res.json({ ok: true, id: r.id, ...extra }) : res.status(409).json({ error: "Check before posting", warns: r.warns });

    if (mode === "overview") {
      // independent reads at the same time (Morten, 11 Nov 2026: "devestatingly slow")
      await A.recurringRun(db, today).catch(() => 0);
      const wst = (await setting("wise").catch(() => null)) || {};
      const syncP = process.env.WISE_TOKEN && can("bank") && (!wst.lastSync || Date.now() - Date.parse(wst.lastSync) > 6 * 3600e3)
        ? Promise.race([A.wiseSync(db, process.env.WISE_TOKEN, po).catch(e => ({ error: e.message })), new Promise(r => setTimeout(() => r({ later: true }), 8000))]) : Promise.resolve(null);
      const [bk, budget, errors, openLines, chain, bankAll, td, sync] = await Promise.all([books(), all("/rest/v1/acct_budget?select=month,account,amount&version=eq." + encodeURIComponent(cfg.budgetVersion || "locked")),
        sb("/rest/v1/acct_errors?resolved=eq.false&select=id,at,source,message&order=id.desc&limit=50"), sb("/rest/v1/acct_bank_lines?journal_id=is.null&select=id"),
        rpc("acct_verify", {}), all("/rest/v1/acct_bank_lines?select=bank_account,bdate,currency,balance,journal_id"), A.todo(db), syncP]);
      const unmatched = openLines.length;
      const pl = C.profitAndLoss(bk.accounts, bk.lines, fy.start, today), bs = C.balanceSheet(bk.accounts, bk.lines, today, fy.start);
      const bva = budget.length ? C.budgetVsActual(bk.accounts, bk.lines, budget, fy.start, today) : null;
      const cancelled = await cancelledWithMoney(bk);
      const adv = C.advice({ today, fyStart: fy.start, fyEnd: fy.end, sgdPerUsd: +cfg.sgdPerUsd || 0, gstRegistered: !!cfg.gstRegistered, ya: cfg.ya ? +cfg.ya : null, yaIndex: +cfg.yaIndex || 1,
        accounts: bk.accounts, lines: bk.lines, budget, errors, bankUnmatched: unmatched, chainOk: !chain.length, cancelledWithMoney: cancelled, grossBooked: grossBooked(bk) });
      const checksNow = A.health({ accounts: bk.accounts, lines: bk.lines, chainOk: !chain.length, bankLines: bankAll, today });
      await log(me.id, "view", { what: "overview" });
      return res.json({ entity: ENTITY, trading: TRADING, role: me.role, fy, pl, bs, bva, advice: adv, errors, unmatched, chainOk: !chain.length, entries: bk.journal.length, settings: cfg,
        health: checksNow, todoCount: td.count, sync, wise: !!process.env.WISE_TOKEN, ai: !!process.env.ANTHROPIC_API_KEY,
        cash: bk.accounts.filter(a => a.grp === "Cash and bank").map(a => ({ code: a.code, name: a.name, amount: C.r2(C.balances(bk.lines, "0000-01-01", today)[a.code] || 0) })) });
    }
    if (mode === "accounts") return res.json({ accounts: await all("/rest/v1/acct_accounts?select=*&order=code") });
    if (mode === "journal") {
      const bk = await books(), q = String(b.q || "").toLowerCase(), acc = String(b.account || "");
      const byJ = {}; for (const l of bk.lines) (byJ[l.journal_id] || (byJ[l.journal_id] = [])).push(l);
      let rows = bk.journal.filter(j => j.jdate >= from && j.jdate <= to).map(j => ({ ...j, lines: byJ[j.id] || [] }));
      if (acc) rows = rows.filter(j => j.lines.some(l => l.account === acc));
      if (q) rows = rows.filter(j => (j.memo + " " + j.lines.map(l => l.memo + " " + l.ref).join(" ")).toLowerCase().includes(q));
      const reversed = new Set(bk.journal.filter(j => j.reverses).map(j => j.reverses));
      rows = rows.reverse().slice(0, 500).map(j => ({ ...j, reversed: reversed.has(j.id) }));
      await log(me.id, "view", { what: "journal" });
      return res.json({ rows, from, to });
    }
    if (mode === "report") {
      const bk = await books(), type = String(b.type || "pl");
      let out;
      if (type === "pl") out = C.profitAndLoss(bk.accounts, bk.lines, from, to);
      else if (type === "bs") out = C.balanceSheet(bk.accounts, bk.lines, to, fy.start);
      else if (type === "tb") out = C.trialBalance(bk.accounts, bk.lines, to);
      else if (type === "cash") out = C.cashFlow(bk.accounts, bk.journal, bk.lines, from, to);
      else if (type === "bva") out = C.budgetVsActual(bk.accounts, bk.lines, await all("/rest/v1/acct_budget?select=month,account,amount&version=eq." + encodeURIComponent(cfg.budgetVersion || "locked")), from, to);
      else if (type === "gl") { const a = String(b.account || "1000"); let run = 0; const J = Object.fromEntries(bk.journal.map(j => [j.id, j]));
        const open = C.r2(bk.lines.filter(l => l.account === a && l.jdate < from).reduce((s, l) => s + l.debit - l.credit, 0)); run = open;
        out = { account: a, from, to, opening: open, rows: bk.lines.filter(l => l.account === a && l.jdate >= from && l.jdate <= to).map(l => { run = C.r2(run + l.debit - l.credit); return { date: l.jdate, entry: l.journal_id, memo: (J[l.journal_id] || {}).memo || "", ref: l.ref, debit: l.debit, credit: l.credit, balance: run }; }) }; }
      else if (type === "tax") { const pl = C.profitAndLoss(bk.accounts, bk.lines, fy.start, to); const rate = +cfg.sgdPerUsd || 0;
        out = { fy, profitBeforeTaxUsd: pl.profitBeforeTax, sgdPerUsd: rate || null, estimate: rate ? C.taxEstimate(Math.max(0, pl.profitBeforeTax) * rate, { ya: cfg.ya ? +cfg.ya : null, yaIndex: +cfg.yaIndex || 1 }) : null, tax: C.TAX,
                note: "A planning estimate on accounting profit. Chargeable income differs (non-deductible costs, capital allowances, exempt income). The accountant prepares the ECI and Form C-S or C." }; }
      else return res.status(400).json({ error: "Unknown report." });
      await log(me.id, "report", { type, from, to });
      if (b.csv) { need("export"); await log(me.id, "export", { type }); return res.json({ csv: reportCsv(type, out), filename: `Arche-Aviation-${type}-${from}-to-${to}.csv` }); }
      return res.json({ type, entity: ENTITY, report: out });
    }
    if (mode === "post") {
      need("post"); const r = await A.post(db, b.entry, { ...po, kind: b.opening ? "opening" : "manual", confirm: !!b.confirm });
      if (r.posted) await log(me.id, "post", { entry: r.id, confirmed: r.warns.length ? r.warns.length : undefined }); return posted(r);
    }
    if (mode === "draft") {
      need("draft"); const acc = await all("/rest/v1/acct_accounts?select=code,active");
      const e = C.cleanEntry(b.entry, acc); const r = await insert("acct_drafts", { created_by: me.id, data: e });
      await log(me.id, "draft", { draft: r[0].id }); return res.json({ ok: true, id: r[0].id });
    }
    if (mode === "drafts") return res.json({ rows: await sb("/rest/v1/acct_drafts?status=eq.draft&select=*&order=created_at.desc&limit=200") });
    if (mode === "decideDraft") {
      need("approve"); const d = (await sb(`/rest/v1/acct_drafts?id=eq.${encodeURIComponent(b.id)}&status=eq.draft&select=*`))[0];
      if (!d) return res.status(404).json({ error: "Draft not found or already decided." });
      if (b.decision === "reject") { await sb(`/rest/v1/acct_drafts?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", decided_by: me.id, decided_at: new Date().toISOString() }) }); await log(me.id, "draft-rejected", { draft: d.id }); return res.json({ ok: true }); }
      const pr = await A.post(db, d.data, { ...po, source: "draft:" + d.id, confirm: !!b.confirm }); if (!pr.posted) return posted(pr); const id = pr.id;
      await sb(`/rest/v1/acct_drafts?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ status: "posted", decided_by: me.id, decided_at: new Date().toISOString(), journal_id: id }) });
      await log(me.id, "draft-posted", { draft: d.id, entry: id }); return res.json({ ok: true, id });
    }
    if (mode === "reverse") {
      need("reverse"); const rd = String(b.date || today).slice(0, 10);
      if (cfg.lockedUntil && rd <= cfg.lockedUntil) return res.status(400).json({ error: `The books are closed up to ${cfg.lockedUntil}. Date the undo after that.` });
      const id = await rpc("acct_reverse", { p_id: +b.id, p_date: rd, p_memo: String(b.memo || "").replace(/[<>\u0000-\u001f]/g, " ").slice(0, 300), p_by: me.id });
      const reopened = await A.afterReverse(db, +b.id, po);
      await log(me.id, "reverse", { entry: +b.id, reversal: id, reopened }); return res.json({ ok: true, id, reopened });
    }
    if (mode === "errors") return res.json({ rows: await sb("/rest/v1/acct_errors?select=*&order=id.desc&limit=200") });
    if (mode === "resolveError") { need("post"); await sb(`/rest/v1/acct_errors?id=eq.${+b.id}`, { method: "PATCH", body: JSON.stringify({ resolved: true }) }); await log(me.id, "error-resolved", { id: +b.id }); return res.json({ ok: true }); }
    if (mode === "bankImport") {
      need("bank"); const acct = String(b.account || ""); if (!["1000", "1010", "1020", "1030", "1100"].includes(acct)) return res.status(400).json({ error: "Choose the bank account." });
      const cur = /^[A-Z]{3}$/.test(b.currency || "") ? b.currency : (acct === "1020" || acct === "1030") ? "SGD" : "USD";
      const ls = C.bankLines(b.csv).map(l => ({ ...l, currency: l.currency || cur })), batch = new Date().toISOString();
      const r = await A.addLines(db, acct, ls, { ...po, batch });
      await log(me.id, "bank-import", { account: acct, lines: ls.length, added: r.added, posted: r.posted, matched: r.matched }); return res.json({ ok: true, lines: ls.length, ...r });
    }
    if (mode === "bankSync") {
      need("bank"); if (!process.env.WISE_TOKEN) return res.status(503).json({ error: "The Wise feed needs WISE_TOKEN (a read-only Wise API token) in Vercel. Until then, import the statement file." });
      const r = await A.wiseSync(db, process.env.WISE_TOKEN, po); await log(me.id, "bank-sync", { accounts: r.accounts.map(a => ({ account: a.account, added: a.added })) }); return res.json({ ok: true, ...r });
    }
    if (mode === "todo") { const t = await A.todo(db); return res.json(t); }
    if (mode === "bankLines") return res.json({ rows: await sb(`/rest/v1/acct_bank_lines?select=*&order=bdate.desc&limit=500${b.open ? "&journal_id=is.null" : ""}`) });
    if (mode === "bankMatch") {
      // one tap: link to an entry already in the books, pay an open bill, or post against the account chosen (and, if asked,
      // remember the choice as a rule so the next line from the same payee posts by itself)
      need("bank"); const l = (await sb(`/rest/v1/acct_bank_lines?id=eq.${encodeURIComponent(b.id)}&select=*`))[0]; if (!l) return res.status(404).json({ error: "Line not found." });
      if (l.journal_id) return res.status(400).json({ error: "Already done." });
      const patch = x => sb(`/rest/v1/acct_bank_lines?id=eq.${encodeURIComponent(l.id)}`, { method: "PATCH", body: JSON.stringify(x) });
      if (+b.entry) { const used = await sb(`/rest/v1/acct_bank_lines?journal_id=eq.${+b.entry}&bank_account=eq.${l.bank_account}&select=id`);
        if (used.length) return res.status(400).json({ error: "That entry is already matched to another bank line." });
        await patch({ journal_id: +b.entry, status: "matched", how: "entry", suggestion: null }); await log(me.id, "bank-match", { line: l.id.slice(0, 16), entry: +b.entry }); return res.json({ ok: true, id: +b.entry }); }
      need("post");
      if (b.receipt) { const rec = (await sb(`/rest/v1/acct_receipts?id=eq.${encodeURIComponent(b.receipt)}&status=eq.posted&select=*`))[0]; if (!rec) return res.status(404).json({ error: "That bill is not open." });
        const r = await A.post(db, C.billPaymentEntry({ billUsd: C.r2(rec.data.usd), bankUsd: A.usdOf(l), bankAccount: l.bank_account, receiptId: rec.id, lineId: l.id, date: l.bdate, supplier: rec.data.supplier }), { ...po, kind: "import", source: "bank:" + l.id, confirm: !!b.confirm });
        if (!r.posted) return posted(r);
        await patch({ journal_id: r.id, status: "posted", how: "receipt", suggestion: null }); await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "paid", paid_journal_id: r.id }) });
        await log(me.id, "bank-match", { line: l.id.slice(0, 16), entry: r.id, bill: rec.id }); return posted(r); }
      const acc = String(b.counter || ""); if (!acc) return res.status(400).json({ error: "Choose where the money goes." });
      if (C.BANKS.includes(acc) && acc === l.bank_account) return res.status(400).json({ error: "Choose another account than the bank itself." });
      const r = await A.post(db, A.lineEntry(l, acc, String(b.memo || l.description || "Bank line").slice(0, 300)), { ...po, kind: "import", source: "bank:" + l.id, confirm: !!b.confirm });
      if (!r.posted) return posted(r);
      await patch({ journal_id: r.id, status: "posted", how: "person", matched_ref: acc, suggestion: null });
      let rule = null;
      if (b.always && !C.BANKS.includes(acc) && acc !== "2100") { const words = String(b.match || C.ruleWords(l.description)).toLowerCase().replace(/[^a-z0-9& .-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
        if (words.length >= 3) { rule = (await insert("acct_rules", { name: String(b.ruleName || words).slice(0, 60), match: words, direction: A.usdOf(l) < 0 ? "out" : "in", bank_account: null, account: acc,
          max_usd: C.r2(Math.max(500, Math.abs(A.usdOf(l)) * 3)), created_by: me.id }))[0]; await log(me.id, "rule-added", { rule: rule.id, match: words, account: acc });
          const open = await all("/rest/v1/acct_bank_lines?journal_id=is.null&select=*"); await A.processLines(db, open, po); } }
      await log(me.id, "bank-match", { line: l.id.slice(0, 16), entry: r.id }); return posted(r, { rule: rule && rule.id });
    }
    if (mode === "rules") {
      if (b.save || b.end || b.undo) need("post");
      if (b.save) { const x = b.save, words = String(x.match || "").toLowerCase().replace(/[^a-z0-9& .-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
        const acc = new Set((await all("/rest/v1/acct_accounts?select=code,active")).filter(a => a.active).map(a => a.code));
        if (words.length < 3) return res.status(400).json({ error: "The words to look for need at least 3 letters." });
        if (!acc.has(String(x.account)) || C.BANKS.includes(String(x.account)) || x.account === "2100") return res.status(400).json({ error: "Choose a cost, income or other account." });
        const row = { name: String(x.name || words).replace(/[<>\u0000-\u001f]/g, " ").slice(0, 60), match: words, direction: x.direction === "in" ? "in" : "out", account: String(x.account), max_usd: +x.max_usd > 0 ? C.r2(x.max_usd) : null };
        if (x.id) await sb(`/rest/v1/acct_rules?id=eq.${encodeURIComponent(x.id)}`, { method: "PATCH", body: JSON.stringify(row) }); else await insert("acct_rules", { ...row, created_by: me.id });
        await log(me.id, "rule-saved", { match: words, account: row.account }); return res.json({ ok: true }); }
      if (b.end) { await sb(`/rest/v1/acct_rules?id=eq.${encodeURIComponent(b.end)}`, { method: "PATCH", body: JSON.stringify({ active: false, ended_at: new Date().toISOString() }) }); await log(me.id, "rule-stopped", { rule: b.end }); return res.json({ ok: true }); }
      if (b.undo) { const n = await A.undoRule(db, String(b.undo), po); await log(me.id, "rule-undone", { rule: b.undo, reversed: n }); return res.json({ ok: true, reversed: n }); }
      return res.json({ rows: await sb("/rest/v1/acct_rules?select=*&order=active.desc,created_at.desc&limit=300") });
    }
    if (mode === "receiptUpload") {
      need("receipts"); const type = String(b.type || ""), ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[type];
      if (!ext) return res.status(400).json({ error: "Send a photo (JPEG, PNG) or a PDF." });
      const buf = Buffer.from(String(b.data || ""), "base64"); if (!buf.length || buf.length > 3.2e6) return res.status(400).json({ error: "The file must be under 3 MB. A photo is made smaller by the screen before it is sent." });
      if (ext === "pdf" ? buf.slice(0, 4).toString() !== "%PDF" : !(buf[0] === 0xff || buf[0] === 0x89 || buf.slice(0, 4).toString() === "RIFF")) return res.status(400).json({ error: "That file is not what it says it is." });
      const fh = hash(buf), dup = (await sb(`/rest/v1/acct_receipts?file_hash=eq.${fh}&select=id,status,data`))[0];
      if (dup) return res.status(409).json({ error: `This receipt is already in Books (${dup.status === "paid" || dup.status === "posted" ? "posted" : "waiting in To do"}).`, id: dup.id });
      const path = `receipts/${today.slice(0, 7)}/${fh.slice(0, 32)}.${ext}`;
      const up = await fetch(SBU() + "/storage/v1/object/books/" + path, { method: "POST", headers: { apikey: KEY(), authorization: `Bearer ${KEY()}`, "content-type": type, "x-upsert": "false" }, body: buf });
      if (!up.ok && up.status !== 409) return res.status(502).json({ error: "The file could not be stored (" + up.status + ")." });
      const rec = (await insert("acct_receipts", { file_hash: fh, file_path: path, file_type: type, status: "new", data: {}, created_by: me.id }))[0];
      await log(me.id, "receipt-added", { receipt: rec.id });
      const read = await readReceipt(rec, buf, type).catch(e => ({ error: e.message }));
      return res.json({ ok: true, id: rec.id, read });
    }
    if (mode === "receiptRead") { need("receipts"); const rec = (await sb(`/rest/v1/acct_receipts?id=eq.${encodeURIComponent(b.id)}&select=*`))[0]; if (!rec) return res.status(404).json({ error: "Not found." });
      const f = await fetch(SBU() + "/storage/v1/object/books/" + rec.file_path, { headers: { apikey: KEY(), authorization: `Bearer ${KEY()}` } }); if (!f.ok) return res.status(502).json({ error: "The file could not be read." });
      return res.json(await readReceipt(rec, Buffer.from(await f.arrayBuffer()), rec.file_type)); }
    if (mode === "receiptFile") { need("read"); const rec = (await sb(`/rest/v1/acct_receipts?id=eq.${encodeURIComponent(b.id)}&select=file_path`))[0]; if (!rec) return res.status(404).json({ error: "Not found." });
      const r = await sb("/storage/v1/object/sign/books/" + rec.file_path, { method: "POST", body: JSON.stringify({ expiresIn: 120 }) }); await log(me.id, "receipt-opened", { receipt: b.id });
      return res.json({ url: SBU() + "/storage/v1" + (r.signedURL || r.signedUrl) }); }
    if (mode === "receipts") { need("read"); return res.json({ rows: await sb(`/rest/v1/acct_receipts?select=id,status,data,created_at,file_type,journal_id,paid_journal_id&order=created_at.desc&limit=300${b.open ? "&status=in.(new,read)" : ""}`) }); }
    // one receipt into the books: the fields as checked (or as read, for "Post all"); the same checks as everything else
    const postReceipt = async (rec, fields, { confirm = false, auto = false } = {}) => {
      const acc = await all("/rest/v1/acct_accounts?select=code,name,kind,active"), x = C.cleanReceipt({ ...rec.data, ...(fields || {}), confidence: "high" }, acc);
      const miss = !x.supplier ? "Who is the supplier?" : !x.date ? "Give the date on the receipt." : !x.total ? "Give the total paid." : !x.account ? "Choose what it was for." : "";
      if (miss) throw new A.Refused(miss);
      const R = x.currency === "USD" ? {} : await A.rates(), fx = C.toUsd(x.total, x.currency, x.date, R, cfg), gfx = x.gst ? C.toUsd(x.gst, x.currency, x.date, R, cfg) : { usd: 0 };
      if (!fx) throw new A.Refused(`No exchange rate for ${x.currency} on ${x.date}. Add the dollar amount by hand as a New entry.`);
      const paidPersonally = !!(fields || {}).paidPersonally;
      const r = await A.post(db, C.receiptEntry(x, { id: rec.id, usd: fx.usd, gstUsd: gfx.usd, gstRegistered: !!cfg.gstRegistered, paidPersonally }), { ...po, source: "receipt:" + rec.id, confirm, auto });
      if (!r.posted) return r;
      await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: paidPersonally ? "paid" : "posted", journal_id: r.id, decided_by: me.id, decided_at: new Date().toISOString(),
        data: { ...x, usd: fx.usd, fx: fx.rate, fxSource: fx.source, paidPersonally } }) });
      await log(me.id, "receipt-posted", { receipt: rec.id, entry: r.id, batch: auto || undefined });
      return r;
    };
    const rematch = async () => { const open = await all("/rest/v1/acct_bank_lines?journal_id=is.null&select=*"); if (open.length) await A.processLines(db, open, po); };
    if (mode === "receiptPost" || mode === "receiptReject") {
      const rec = (await sb(`/rest/v1/acct_receipts?id=eq.${encodeURIComponent(b.id)}&status=in.(new,read)&select=*`))[0]; if (!rec) return res.status(404).json({ error: "That receipt is not waiting." });
      if (mode === "receiptReject") { need("receipts"); await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", decided_by: me.id, decided_at: new Date().toISOString() }) }); await log(me.id, "receipt-rejected", { receipt: rec.id }); return res.json({ ok: true }); }
      need("post"); const r = await postReceipt(rec, b.fields || {}, { confirm: !!b.confirm });
      if (r.posted && !(b.fields || {}).paidPersonally) await rematch();
      return posted(r);
    }
    // "Post all": the person ticked the clear receipts on the list and pressed once; each still goes through every check,
    // and any with a warning is held back with its reason (Morten, 10 Nov 2026: batch upload, one tap, no AI decisions)
    if (mode === "receiptPostAll") {
      need("post"); const ids = [...new Set((Array.isArray(b.ids) ? b.ids : []).map(String))].slice(0, 100); if (!ids.length) return res.status(400).json({ error: "Tick the receipts to post." });
      const recs = await sb(`/rest/v1/acct_receipts?id=in.(${ids.map(encodeURIComponent).join(",")})&status=eq.read&select=*`), out = { posted: 0, held: [] };
      for (const rec of recs) {
        if (!C.receiptReady(rec.data)) { out.held.push({ id: rec.id, why: "Not fully read: check it on its own." }); continue; }
        try { const r = await postReceipt(rec, {}, { auto: true });
          if (r.posted) out.posted++; else { out.held.push({ id: rec.id, why: r.warns[0] }); await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ data: { ...rec.data, held: r.warns } }) }); } }
        catch (e) { out.held.push({ id: rec.id, why: e.message }); } }
      if (out.posted) await rematch();
      await log(me.id, "receipts-posted-together", { posted: out.posted, held: out.held.length }); return res.json({ ok: true, ...out });
    }
    if (mode === "recurring") {
      if (b.save || b.end) need("post");
      if (b.save) { const x = b.save, acc = await all("/rest/v1/acct_accounts?select=code,active"), start = /^\d{4}-\d{2}-\d{2}$/.test(x.start || "") ? x.start : today;
        const e = C.cleanEntry({ date: start, memo: x.memo, lines: x.lines }, acc), day = Math.min(28, Math.max(1, +x.day || +start.slice(8, 10) || 1));
        const next = start.slice(0, 8) + String(day).padStart(2, "0"), row = { memo: e.memo, lines: e.lines, day, every_months: Math.min(12, Math.max(1, +x.every || 1)), next_date: next < start ? C.addMonths(next, 1) : next,
          end_date: /^\d{4}-\d{2}-\d{2}$/.test(x.end || "") ? x.end : null, created_by: me.id };
        await insert("acct_recurring", row); await log(me.id, "repeat-added", { memo: e.memo }); return res.json({ ok: true }); }
      if (b.end) { await sb(`/rest/v1/acct_recurring?id=eq.${encodeURIComponent(b.end)}`, { method: "PATCH", body: JSON.stringify({ active: false }) }); await log(me.id, "repeat-stopped", { id: b.end }); return res.json({ ok: true }); }
      return res.json({ rows: await sb("/rest/v1/acct_recurring?select=*&order=active.desc,next_date.asc&limit=200") });
    }
    if (mode === "lockPeriod") {
      need("settings"); const until = b.until ? String(b.until).slice(0, 10) : null; if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return res.status(400).json({ error: "Give a date." });
      if (until && until >= today) return res.status(400).json({ error: "Close only periods that have ended." });
      await setSetting("company", { ...cfg, lockedUntil: until }); await log(me.id, until ? "period-closed" : "period-reopened", { until, was: cfg.lockedUntil || null }); return res.json({ ok: true, lockedUntil: until });
    }
    if (mode === "budgetImport") {
      need("budget"); const rows = (b.rows || []).slice(0, 20000), acc = new Set((await all("/rest/v1/acct_accounts?select=code")).map(a => a.code)), version = String(b.version || "locked").replace(/[^\w.-]/g, "").slice(0, 40) || "locked";
      const clean = rows.filter(r => /^\d{4}-\d{2}-01$/.test(r.month) && acc.has(r.account) && isFinite(+r.amount)).map(r => ({ version, month: r.month, account: r.account, amount: C.r2(r.amount) }));
      if (!clean.length) return res.status(400).json({ error: "No budget lines in the file." });
      await sb(`/rest/v1/acct_budget?version=eq.${version}`, { method: "DELETE" });
      for (let i = 0; i < clean.length; i += 1000) await sb("/rest/v1/acct_budget", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(clean.slice(i, i + 1000)) });
      await setSetting("company", { ...(await setting("company") || {}), budgetVersion: version, budgetSource: String(b.source || "").slice(0, 200), budgetLoaded: new Date().toISOString() });
      await log(me.id, "budget-import", { version, lines: clean.length, source: String(b.source || "").slice(0, 120) }); return res.json({ ok: true, lines: clean.length });
    }
    if (mode === "settings") {
      if (b.set) { need("settings"); const x = b.set, cur = (await setting("company")) || {};
        const v = { ...cur, fyEnd: /^\d{4}-\d{2}-\d{2}$/.test(x.fyEnd || "") ? x.fyEnd : cur.fyEnd || null, sgdPerUsd: +x.sgdPerUsd > 0 && +x.sgdPerUsd < 10 ? +x.sgdPerUsd : cur.sgdPerUsd || null,
          sgdRateDate: String(x.sgdRateDate || cur.sgdRateDate || "").slice(0, 10), gstRegistered: !!x.gstRegistered, uen: String(x.uen || cur.uen || "").replace(/[^A-Z0-9]/gi, "").slice(0, 12),
          ya: +x.ya || cur.ya || null, yaIndex: Math.min(9, Math.max(1, +x.yaIndex || cur.yaIndex || 1)), aiCapUsd: +x.aiCapUsd >= 0 ? Math.min(100, +x.aiCapUsd) : (cur.aiCapUsd ?? 5) };
        await setSetting("company", v); await log(me.id, "settings", { keys: Object.keys(x) }); return res.json({ ok: true, settings: v }); }
      return res.json({ settings: cfg, entity: ENTITY });
    }
    if (mode === "members") {
      if (b.add || b.end) need("members");
      if (b.add) { const email = String(b.add.email || "").trim().toLowerCase(), role = b.add.role === "bookkeeper" ? "bookkeeper" : "accountant";
        if (owners().includes(email)) return res.status(400).json({ error: "That person is already an owner." });
        const u = await findUser(email); if (!u) return res.status(404).json({ error: "No portal sign-in with that email yet. Invite them first; Books access is added here afterwards." });
        await sb("/rest/v1/acct_members", { method: "POST", headers: { prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ user_id: u.id, email, role, active: true, granted_by: me.id, granted_at: new Date().toISOString(), ended_at: null }) });
        await log(me.id, "member-added", { role }); return res.json({ ok: true }); }
      if (b.end) { await sb(`/rest/v1/acct_members?user_id=eq.${encodeURIComponent(b.end)}`, { method: "PATCH", body: JSON.stringify({ active: false, ended_at: new Date().toISOString() }) });
        await sb(`/rest/v1/acct_sessions?user_id=eq.${encodeURIComponent(b.end)}`, { method: "DELETE" }).catch(() => {});
        await log(me.id, "member-ended", {}); return res.json({ ok: true }); }
      return res.json({ owners: owners().length, rows: me.role === "owner" ? await sb("/rest/v1/acct_members?select=user_id,email,role,active,granted_at,ended_at&order=granted_at.desc") : [] });
    }
    if (mode === "passkeys") {
      if (b.remove) { if (keys.length < 2 && !me.totp) return res.status(400).json({ error: "Add another passkey or an authenticator app before removing the last one." });
        await sb(`/rest/v1/acct_passkeys?id=eq.${encodeURIComponent(b.remove)}&user_id=eq.${me.id}`, { method: "DELETE" }); await log(me.id, "passkey-removed", {}); return res.json({ ok: true }); }
      return res.json({ rows: keys.map(k => ({ id: k.id, name: k.name, created_at: k.created_at, last_used: k.last_used })), totp: me.totp });
    }
    if (mode === "log") { need("members"); return res.json({ rows: await sb("/rest/v1/acct_log?select=at,user_id,action,detail&order=id.desc&limit=300") }); }
    if (mode === "aiReview") {
      need("ai"); if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "The AI review needs ANTHROPIC_API_KEY in Vercel. The rule-based advice works without it." });
      const month = today.slice(0, 7), sp = (await setting("aispend")) || {}, spent = sp.month === month ? +sp.usd || 0 : 0, cap = cfg.aiCapUsd ?? 5;
      if (spent >= cap) return res.status(402).json({ error: `This month's Books AI budget of USD ${cap} is used up. Raise it in Settings if the reviews are worth it.` });
      const bk = await books(), budget = await all("/rest/v1/acct_budget?select=month,account,amount&version=eq." + encodeURIComponent(cfg.budgetVersion || "locked"));
      const facts = C.aiFacts({ ...bk, budget, today, fyStart: fy.start, sgdPerUsd: +cfg.sgdPerUsd || 0, gstRegistered: !!cfg.gstRegistered, yaIndex: +cfg.yaIndex || 1 });
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1500, system: C.AI_SYSTEM, messages: [{ role: "user", content: "Figures (JSON, numbers only):\n" + JSON.stringify(facts) }] }) });
      if (!r.ok) return res.status(502).json({ error: "The AI review is not available just now (" + r.status + ")." });
      const out = await r.json(), u = out.usage || {}, cost = ((u.input_tokens || 0) * 3 + (u.output_tokens || 0) * 15) / 1e6;
      await setSetting("aispend", { month, usd: spent + cost, calls: (sp.month === month ? sp.calls || 0 : 0) + 1 });
      await log(me.id, "ai-review", { usd: Math.round(cost * 1000) / 1000 });
      return res.json({ text: C.cleanAiText((out.content || []).filter(c => c.type === "text").map(c => c.text).join("")), spentUsd: Math.round((spent + cost) * 100) / 100, capUsd: cap });
    }
    if (mode === "verify") { const r = await rpc("acct_verify", {}); await log(me.id, "verify", { ok: !r.length }); return res.json({ ok: !r.length, bad: r }); }
    return res.status(400).json({ error: "Unknown request." });
  } catch (e) {
    return res.status(e.status && e.status < 500 ? e.status : 400).json({ error: String(e.message || e).replace(/^Books: /, "").slice(0, 200) });
  }
}

// the AI reads a receipt and proposes the fields; a person checks them and presses Post. Nothing is posted here.
async function readReceipt(rec, buf, type) {
  const accounts = await all("/rest/v1/acct_accounts?select=code,name,kind,active"), cfg = (await setting("company")) || {};
  const past = await sb("/rest/v1/acct_receipts?status=in.(posted,paid)&select=data&order=created_at.desc&limit=300");
  const fromHistory = sup => { const t = String(sup || "").toLowerCase().slice(0, 12); const hit = t && past.find(p => String(p.data.supplier || "").toLowerCase().startsWith(t)); return hit ? hit.data.account : ""; };
  if (!process.env.ANTHROPIC_API_KEY) { await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "read", data: { read_by: "person" } }) }); return { ok: true, ai: false }; }
  const month = new Date().toISOString().slice(0, 7), sp = (await setting("aispend")) || {}, spent = sp.month === month ? +sp.usd || 0 : 0, cap = cfg.aiCapUsd ?? 5;
  if (spent >= cap) { await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "read", data: { read_by: "person", note: "AI budget for the month used up" } }) }); return { ok: true, ai: false, capped: true }; }
  const list = accounts.filter(a => a.active && (a.kind === "expense" || a.code === "1500" || a.code === "1300") && a.code !== "7000").map(a => `${a.code} ${a.name}`).join("; ");
  const part = type === "application/pdf" ? { type: "document", source: { type: "base64", media_type: type, data: buf.toString("base64") } } : { type: "image", source: { type: "base64", media_type: type, data: buf.toString("base64") } };
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 500, system: C.RECEIPT_SYSTEM, messages: [{ role: "user", content: [part, { type: "text", text: "Accounts: " + list }] }] }) });
  if (!r.ok) { await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "read", data: { read_by: "person" } }) }); return { ok: true, ai: false, error: "AI " + r.status }; }
  const out = await r.json(), u = out.usage || {}, cost = ((u.input_tokens || 0) * 3 + (u.output_tokens || 0) * 15) / 1e6;
  await setSetting("aispend", { month, usd: spent + cost, calls: (sp.month === month ? sp.calls || 0 : 0) + 1 });
  let j = {}; try { const t = (out.content || []).filter(c => c.type === "text").map(c => c.text).join(""); j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch (e) { j = {}; }
  const x = C.cleanReceipt(j, accounts); if (!x.account) x.account = fromHistory(x.supplier) || ""; else { const h = fromHistory(x.supplier); if (h) x.account = h; }
  await sb(`/rest/v1/acct_receipts?id=eq.${rec.id}`, { method: "PATCH", body: JSON.stringify({ status: "read", data: { ...x, read_by: "ai" } }) });
  return { ok: true, ai: true, data: x };
}
async function useChallenge(me, purpose, challenge) {
  const r = (await sb(`/rest/v1/acct_challenges?user_id=eq.${me.id}&purpose=eq.${purpose}&challenge=eq.${encodeURIComponent(String(challenge || ""))}&used=eq.false&select=id,challenge,expires_at`))[0];
  if (!r || Date.parse(r.expires_at) < Date.now()) throw new Error("passkey: the request expired, try again");
  await sb(`/rest/v1/acct_challenges?id=eq.${r.id}`, { method: "PATCH", body: JSON.stringify({ used: true }) });
  await sb(`/rest/v1/acct_challenges?expires_at=lt.${new Date(Date.now() - 3600e3).toISOString()}`, { method: "DELETE" }).catch(() => {});
  return r.challenge;
}
async function findUser(email) {
  for (let page = 1; page <= 20; page++) {
    const r = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`); const users = r.users || r || [];
    const u = users.find(x => String(x.email || "").toLowerCase() === email); if (u) return u; if (users.length < 200) return null;
  }
  return null;
}
async function cancelledWithMoney(bk) {
  const refs = {}; for (const l of bk.lines) if (l.account === "2100" && l.ref) refs[l.ref] = C.r2((refs[l.ref] || 0) + l.credit - l.debit);
  const held = Object.entries(refs).filter(([, v]) => v > 0.005); if (!held.length) return [];
  const st = await all("/rest/v1/trip_status?select=owner_id,id,state:data->>state,ref:data->>ref");
  const S = Object.fromEntries(st.map(x => ["trip:" + x.owner_id + ":" + x.id, x]));
  return held.filter(([k]) => S[k] && S[k].state === "cancelled").map(([k, v]) => ({ ref: S[k].ref || k.split(":").pop(), amount: v }));
}
function grossBooked(bk) { return bk.lines.filter(l => l.account === "1100" && l.debit > 0 && String(l.ref).startsWith("trip:")).reduce((s, l) => s + l.debit, 0); }
function reportCsv(type, o) {
  if (type === "pl") return C.toCsv([...o.income.map(x => ({ ...x, sec: "Income" })), ...o.expenses.map(x => ({ ...x, sec: "Expenses" })), { sec: "", name: "Profit", amount: o.profit }], [["sec", "Section"], ["code", "Account"], ["name", "Name"], ["amount", "USD"]]);
  if (type === "bs") return C.toCsv([...o.assets.map(x => ({ ...x, sec: "Assets" })), ...o.liabilities.map(x => ({ ...x, sec: "Liabilities" })), ...o.equity.map(x => ({ ...x, sec: "Equity" })), { sec: "Equity", name: "Profit to date", amount: C.r2(o.earlierProfit + o.yearProfit) }], [["sec", "Section"], ["code", "Account"], ["name", "Name"], ["amount", "USD"]]);
  if (type === "tb") return C.toCsv(o.rows, [["code", "Account"], ["name", "Name"], ["debit", "Debit USD"], ["credit", "Credit USD"]]);
  if (type === "gl") return C.toCsv(o.rows, [["date", "Date"], ["entry", "Entry"], ["memo", "Memo"], ["ref", "Ref"], ["debit", "Debit USD"], ["credit", "Credit USD"], ["balance", "Balance USD"]]);
  if (type === "bva") return C.toCsv(o.rows, [["code", "Account"], ["name", "Name"], ["actual", "Actual USD"], ["budget", "Budget USD"], ["diff", "Difference USD"], ["pct", "%"]]);
  if (type === "cash") return C.toCsv([{ name: "Opening", amount: o.opening }, ...o.groups, { name: "Closing", amount: o.closing }], [["name", "Line"], ["amount", "USD"]]);
  return C.toCsv([{ k: "estimate", v: JSON.stringify(o.estimate) }], [["k", "Item"], ["v", "Value"]]);
}
