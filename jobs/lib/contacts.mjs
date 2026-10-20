// Named BUSINESS contacts on prospects (rule approved by Morten, 20 Oct 2026; see CLAUDE.md).
// A contact is a professional in a business role at an organisation: name, role, WORK email/phone, and where it came from.
// Never private individuals as such, never personal email or phone, never guessed, never from bought lists or LinkedIn.
// Opt-outs are kept only as one-way codes (SHA-256) of the email and of name + organisation.
import { createHash } from "crypto";

export const RETENTION_DAYS = 365;
const WEBMAIL = /@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|mac|aol|proton|protonmail|gmx|mail|yandex|qq|163|126|naver|hanmail)\./i;
const normName = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const normOrg = s => normName(s).replace(/\b(ltd|limited|pte|llc|inc|co|company|group|the)\b/g, "").replace(/\s+/g, " ").trim();
const host = u => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const normUrl = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).toLowerCase(); } catch { return ""; } };
const clean = (v, n = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export const sha = s => createHash("sha256").update(s).digest("hex");
export function hashes(c, org) {
  const out = [];
  if (c.email) out.push(sha("e:" + String(c.email).toLowerCase().trim()));
  if (c.name) out.push(sha("n:" + normName(c.name) + "|" + normOrg(org)));
  return out;
}
export const optedOut = (c, org, set) => hashes(c, org).some(h => set.has(h));

// contacts found by research: only from the organisation's own website (a page seen in this run), work email on its domain
export function vetContacts(list, seen, website, org, optSet = new Set()) {
  const site = host(website); if (!site) return [];
  return (Array.isArray(list) ? list : []).map(c => ({ name: clean(c && c.name, 80), role: clean(c && c.role, 80), email: clean(c && c.email, 120).toLowerCase(),
      phone: clean(c && c.phone, 40), source: clean(c && c.url, 400) }))
    .filter(c => c.name && c.role && c.source && seen.has(normUrl(c.source)) && host(c.source).endsWith(site))
    .filter(c => !c.email || (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(c.email) && !WEBMAIL.test(c.email) && c.email.split("@")[1].endsWith(site)))
    .filter(c => !/^(mr|mrs|ms|dr)\.?$/i.test(c.name))
    .filter(c => !optedOut(c, org, optSet))
    .slice(0, 3)
    .map(c => ({ ...c, sourceType: "Organisation's own website", added: new Date().toISOString(), addedBy: "research" }));
}

// keep a contact while it is younger than the retention period or was contacted within it
export function keep(c, lastActivity, now = Date.now()) {
  const t = Math.max(Date.parse(c.added || 0) || 0, Date.parse(c.lastContact || 0) || 0, Date.parse(lastActivity || 0) || 0);
  return now - t < RETENTION_DAYS * 864e5;
}
const lastLog = r => (r.log || []).reduce((m, x) => (x.t > m ? x.t : m), "");

// every few hours: apply opt-outs and the 12-month limit to every list, and copy brokers' contacts to the shared prospect
export async function sweep(db, log = () => {}, now = Date.now()) {
  const opt = new Set((await db.all("optouts")).map(r => r.id));
  const tidy = (contacts, org, last) => {
    const kept = (contacts || []).filter(c => !optedOut(c, org, opt) && keep(c, last, now));
    return { kept, removed: (contacts || []).length - kept.length };
  };
  let removed = 0, merged = 0;
  const leadRows = await db.all("leads");
  const byPid = {};
  for (const r of leadRows) {
    const d = r.data || {}; if (!(d.contacts || []).length) continue;
    const t = tidy(d.contacts, d.org, lastLog(d));
    if (t.removed) { await db.set(`leads/${r.owner_id}/items/${r.id}`, { ...d, contacts: t.kept }); removed += t.removed; }
    (byPid[r.id] = byPid[r.id] || []).push(...t.kept);
  }
  for (const r of await db.all("prospects")) {
    const d = r.data || {}; const t = tidy(d.contacts, d.org, lastLog(d));
    const have = new Set(t.kept.map(c => (c.email || c.name).toLowerCase()));
    const extra = (byPid[r.id] || []).filter(c => !have.has((c.email || c.name).toLowerCase()) && have.add((c.email || c.name).toLowerCase()));
    if (t.removed || extra.length) { await db.set("prospects/" + r.id, { ...d, contacts: [...t.kept, ...extra] }); removed += t.removed; merged += extra.length; }
  }
  for (const r of await db.all("owner_prospects")) {
    if (r.id === "_status") continue;
    const d = r.data || {}; if (!(d.contacts || []).length) continue;
    const t = tidy(d.contacts, d.org, lastLog(d));
    if (t.removed) { await db.set("owner/" + r.id, { ...d, contacts: t.kept }); removed += t.removed; }
  }
  return { removed, merged };
}
