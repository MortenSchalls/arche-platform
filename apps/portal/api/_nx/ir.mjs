// Navoryx investor relations, run from the portal (Morten, 5 Nov 2026: "the portal as the engine to control investor
// relations and also the database for potential investors that we can invite to review Navoryx IR").
// Reached through /api/ir (vercel.json rewrite to /api/invite?nx=ir, so no extra Vercel function).
// Records live in owner_prospects (the owner-only investor list); each record's data.ir holds:
//   stage, interest, interestAt, access { email | "@domain": { approved, at, invitedAt, codes[], opens[] } }, requests[], log[]
// Two kinds of caller:
//   - the Navoryx website server, with header x-ir-key = NAVORYX_IR_KEY: apply (access request + screening result),
//     access (may this address get a code?), event (code requested, briefing opened)
//   - an owner of the portal, signed in: send (invitation or approval email, then access given), approve (no email),
//     revoke. Nothing goes out without the owner pressing Send; nothing is approved automatically.
// Environment (portal Vercel project): NAVORYX_IR_KEY (same value as PORTAL_IR_KEY on the Navoryx project),
//   NAVORYX_IR_FROM (sender, e.g. "Navoryx Executive <investors@navoryx-executive.com>"), NAVORYX_RESEND_KEY (optional;
//   falls back to RESEND_API_KEY: the sender's domain must be verified in that Resend account), NAVORYX_SITE (optional).
import crypto from "node:crypto";

export const IR_STAGES = { prospect: "Prospect", invited: "Invited", requested: "Asked for access", approved: "Access given",
  opened: "Briefing opened", conversation: "Conversation", nda: "NDA signed", documents: "Documents shared", committed: "Committed", notnow: "Not now" };
const ORDER = Object.keys(IR_STAGES);
export const IR_INTEREST = { undecided: "Undecided", income: "Income", time: "Income and time aboard", both: "Both" };
const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);
const norm = s => String(s || "").toLowerCase().replace(/\b(ltd|limited|group|pte|llc|inc|co|company|the)\b/g, "").replace(/[^a-z0-9]+/g, "");
const later = (cur, next) => ORDER.indexOf(next) > ORDER.indexOf(cur || "prospect") && !["notnow", "committed"].includes(cur);
const TRACK = { "A private investor": "Family office or UHNW office", "A family office": "Family office or UHNW office",
  "An institution or fund": "Private equity or private credit", "A lender": "Aviation lender or lessor", "An adviser to an investor": "Adviser or placement agent" };

export function sameKey(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
}
const emailsOf = d => [...(d.contacts || []).map(c => String(c.email || "").toLowerCase()), ...Object.keys((d.ir || {}).access || {})].filter(Boolean);

// which record an access request belongs to: same email, then same organisation; otherwise a new record
export function matchRecord(rows, { email, organisation }) {
  const e = email.toLowerCase();
  const byMail = rows.find(r => r.id !== "_status" && emailsOf(r.data || {}).includes(e));
  if (byMail) return byMail;
  const o = norm(organisation);
  return o ? rows.find(r => r.id !== "_status" && norm((r.data || {}).org) === o) || null : null;
}
export function nextId(rows) {
  const n = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  return "i" + String(n + 1).padStart(3, "0");
}

// an access request from the Navoryx investor page, with the sanctions result the website already worked out
export function applyRequest(rows, b, at) {
  const email = clean(b.email, 200).toLowerCase(), name = clean(b.name, 120), org = clean(b.organisation, 160);
  const screening = b.screening && typeof b.screening === "object" ? { result: clean(b.screening.result, 40), lists: (b.screening.lists || []).slice(0, 10).map(x => clean(x, 40)),
    hits: (b.screening.hits || []).slice(0, 10).map(h => ({ name: clean(h.name, 120), listed: clean(h.listed, 160), list: clean(h.list, 40) })) } : null;
  const req = { at, name, email, organisation: org, country: clean(b.country, 80), role: clean(b.role, 60), message: clean(b.message, 2000), screening };
  const hit = screening && /possible/i.test(screening.result);
  const found = matchRecord(rows, { email, organisation: org });
  const d = found ? JSON.parse(JSON.stringify(found.data || {})) : {
    org: org || `${name} (private investor)`, track: TRACK[req.role] || "Strategic partner", for: "Navoryx aircraft notes",
    country: req.country, status: "new", source: "", added: at, selfRequested: true, log: [] };
  d.contacts = d.contacts || [];
  if (!d.contacts.some(c => String(c.email || "").toLowerCase() === email))
    d.contacts.push({ name, role: org ? (req.role || "Investor") : "Private investor", email, sourceType: "Own request on the Navoryx investor page", source: "Navoryx investor page", added: at });
  if (hit) d.status = "review";
  const ir = d.ir = d.ir || {};
  ir.access = ir.access || {};
  ir.access[email] = { ...(ir.access[email] || { approved: false }), requestedAt: at };
  ir.requests = [...(ir.requests || []), req].slice(-20);
  if (!ir.stage || later(ir.stage, "requested") && !ir.access[email].approved) ir.stage = ir.access[email].approved ? ir.stage : "requested";
  ir.log = [...(ir.log || []), { t: at, note: `Access requested on the investor page by ${name}${screening ? ` · sanctions: ${screening.result}` : ""}` }].slice(-200);
  d.log = [...(d.log || []), { t: at, note: "Navoryx investor access requested" + (hit ? " · POSSIBLE SANCTIONS MATCH: your decision" : "") }].slice(-200);
  return { id: found ? found.id : nextId(rows), data: d, isNew: !found };
}

// may this address receive a code? (an approved address, or an approved whole domain "@family-office.com")
export function accessFor(rows, email) {
  const e = String(email || "").toLowerCase(), dom = "@" + e.split("@")[1];
  for (const r of rows) {
    const a = (((r.data || {}).ir || {}).access) || {};
    if ((a[e] && a[e].approved && !a[e].revoked) || (a[dom] && a[dom].approved && !a[dom].revoked)) return { approved: true, id: r.id, key: a[e] && a[e].approved ? e : dom };
  }
  return { approved: false };
}

export function recordEvent(data, key, kind, at) {
  const d = JSON.parse(JSON.stringify(data || {})), ir = d.ir = d.ir || {}, a = (ir.access = ir.access || {})[key] = ir.access[key] || {};
  if (kind === "opened") { a.opens = [...(a.opens || []), at].slice(-100); if (later(ir.stage, "opened")) ir.stage = "opened"; }
  else { a.codes = [...(a.codes || []), at].slice(-100); }
  ir.log = [...(ir.log || []), { t: at, note: kind === "opened" ? `Briefing opened (${key})` : `Code requested (${key})` }].slice(-200);
  return d;
}

export function giveAccess(data, key, at, how) {
  const d = JSON.parse(JSON.stringify(data || {})), ir = d.ir = d.ir || {}, a = (ir.access = ir.access || {})[key] = ir.access[key] || {};
  Object.assign(a, { approved: true, revoked: false, at, ...(how === "invited" ? { invitedAt: at } : {}) });
  const target = how === "invited" && !a.requestedAt ? "invited" : "approved";
  if (!ir.stage || later(ir.stage, target)) ir.stage = target;
  ir.log = [...(ir.log || []), { t: at, note: how === "invited" ? `Invitation sent to ${key}; access given` : how === "email" ? `Access given to ${key}; email sent` : `Access given to ${key} (no email sent)` }].slice(-200);
  return d;
}

// default wording; the owner reads and may change it in the portal before pressing Send
export function irMail(kind, { name, site }) {
  const first = (name || "").split(/\s+/)[0] || "", page = `${site || "https://navoryx-executive.com"}/investor-relations/`;
  const body = kind === "approve"
    ? ["Thank you for your interest in Navoryx Executive.", "",
       "Your access to our private investor briefing is ready. On the investor page, enter this email address under \"Already approved\" to receive a one-time code:", page, "",
       "The code is valid for ten minutes and opens the briefing for twelve hours. You may request a new code whenever you wish."]
    : ["Navoryx Executive flies its own Bombardier Global fleet, rooted in Asian culture, with the world as its destination. Some of what we are building is shared only in private, with a small circle of investors and lenders.", "",
       "You are invited to read our private investor briefing. On the investor page, enter this email address under \"Already approved\" to receive a one-time code:", page, "",
       "The code is valid for ten minutes and opens the briefing for twelve hours."];
  return { subject: kind === "approve" ? "Navoryx Executive: your access to the investor briefing" : "Navoryx Executive: a private invitation",
    text: [`Dear ${first || "Sir or Madam"},`, "", ...body, "",
      "Nothing in the briefing or in this email is an offer of securities or any other investment.", "",
      "Kind regards,", "Investor Relations", "Navoryx Executive"].join("\n") };
}
const htmlOf = text => `<div style="font:15px/1.7 Georgia,'Times New Roman',serif;color:#1E1F1F;max-width:560px">${text.split(/\n\n/).map(p =>
  `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/(https:\/\/\S+)/g, '<a href="$1" style="color:#936E3A">$1</a>').replace(/\n/g, "<br>")}</p>`).join("")}</div>`;

export async function irHandler(req, res, { sb, owner }) {
  const b = req.body || {}, at = new Date().toISOString();
  const all = async () => { const r = await sb("/rest/v1/owner_prospects?select=id,data"); return Array.isArray(r.body) ? r.body : []; };
  const save = (id, data) => sb("/rest/v1/owner_prospects?on_conflict=id", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id, data, updated_at: at }) });
  if (req.method !== "POST") return res.status(405).json({ error: "POST" });

  const key = req.headers["x-ir-key"];
  if (key !== undefined) {   // the Navoryx website server
    if (!process.env.NAVORYX_IR_KEY || !sameKey(key, process.env.NAVORYX_IR_KEY)) return res.status(401).json({ error: "key" });
    const email = clean(b.email, 200).toLowerCase(); if (!EMAIL_RX.test(email)) return res.status(400).json({ error: "email" });
    const rows = await all();
    if (b.action === "apply") { const r = applyRequest(rows, b, at); const s = await save(r.id, r.data); return res.status(s.ok ? 200 : 502).json({ ok: s.ok, id: r.id }); }
    if (b.action === "access") return res.status(200).json({ approved: accessFor(rows, email).approved });
    if (b.action === "event") {
      const f = accessFor(rows, email); if (!f.approved) return res.status(200).json({ ok: false });
      const row = rows.find(r => r.id === f.id), s = await save(f.id, recordEvent(row.data, f.key, b.kind === "opened" ? "opened" : "code", at));
      return res.status(200).json({ ok: s.ok });
    }
    return res.status(400).json({ error: "action" });
  }

  const o = await owner(req); if (o.error) return res.status(o.code).json({ error: o.error });
  const rows = await all(), row = rows.find(r => r.id === clean(b.id, 20)); if (!row) return res.status(404).json({ error: "Record not found." });
  const target = clean(b.email, 200).toLowerCase();
  if (!EMAIL_RX.test(target) && !/^@[^@\s]+\.[a-z]{2,}$/i.test(target)) return res.status(400).json({ error: "Enter a valid email address or @domain." });
  const audit = detail => sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: o.me.id, action: "Investor relations", detail }) });
  // the shared log gets no names or addresses: the investor list is owner-only
  if (b.action === "revoke") {
    const d = JSON.parse(JSON.stringify(row.data)), a = ((d.ir = d.ir || {}).access = d.ir.access || {})[target] = d.ir.access[target] || {};
    Object.assign(a, { approved: false, revoked: true, revokedAt: at });
    d.ir.log = [...(d.ir.log || []), { t: at, note: `Access withdrawn (${target})` }].slice(-200);
    await save(row.id, d); await audit("Access withdrawn"); return res.status(200).json({ ok: true });
  }
  if (b.action === "draft") {
    const c = ((row.data || {}).contacts || []).find(x => String(x.email || "").toLowerCase() === target) || {};
    return res.status(200).json(irMail(b.kind === "approve" ? "approve" : "invite", { name: c.name || "", site: process.env.NAVORYX_SITE }));
  }
  if (b.action === "approve") { await save(row.id, giveAccess(row.data, target, at, "plain")); await audit("Access given, no email"); return res.status(200).json({ ok: true, sent: "not sent (as chosen)" }); }
  if (b.action !== "send") return res.status(400).json({ error: "action" });
  if (!EMAIL_RX.test(target)) return res.status(400).json({ error: "An email needs one address, not a domain." });
  const FROM = process.env.NAVORYX_IR_FROM, KEY = process.env.NAVORYX_RESEND_KEY || process.env.RESEND_API_KEY;
  if (!FROM || !KEY) return res.status(503).json({ error: "Not sent: NAVORYX_IR_FROM and a Resend key are needed in the portal's Vercel settings. Use \"Give access without email\" meanwhile." });
  const subject = clean(b.subject, 160), text = String(b.text || "").replace(/\r/g, "").slice(0, 6000);
  if (!subject || text.length < 40) return res.status(400).json({ error: "The email needs a subject and a text." });
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [target], reply_to: process.env.NAVORYX_IR_REPLY || undefined, subject, text, html: htmlOf(text) }) });
  if (!r.ok) { let m = ""; try { m = (await r.json()).message || ""; } catch (e) {} return res.status(502).json({ error: `Not sent: refused by Resend (${r.status}${m ? ": " + m.slice(0, 120) : ""}). Access not given.` }); }
  const kind = b.kind === "approve" ? "email" : "invited";
  await save(row.id, giveAccess(row.data, target, at, kind)); await audit(kind === "invited" ? "Invitation sent" : "Access given, email sent");
  return res.status(200).json({ ok: true, sent: "sent" });
}
