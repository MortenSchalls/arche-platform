// Navoryx investor relations in the portal (api/_nx/ir.mjs). Example data only.
import { applyRequest, accessFor, recordEvent, giveAccess, irMail, matchRecord, sameKey, irHandler } from "../api/_nx/ir.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const T = "2026-11-05T01:00:00.000Z";
const rows = [{ id: "_status", data: {} }, { id: "i007", data: { org: "Example Family Office Ltd", contacts: [{ name: "Ann Example", email: "ann@example-fo.com" }], status: "talks", log: [] } }];
const req = { name: "Bob Example", organisation: "Example Capital", country: "Singapore", role: "An institution or fund", email: "Bob@Example-Capital.com", screening: { result: "no match", lists: ["OFAC", "UN"], hits: [] } };
let r = applyRequest(rows, req, T);
ok("new organisation: new record with the next id", r.isNew && r.id === "i008");
ok("track from role, for Navoryx notes, contact from the request", r.data.track === "Private equity or private credit" && r.data.for === "Navoryx aircraft notes" && r.data.contacts[0].email === "bob@example-capital.com" && /Own request/.test(r.data.contacts[0].sourceType));
ok("stage: asked for access, not approved", r.data.ir.stage === "requested" && r.data.ir.access["bob@example-capital.com"].approved === false);
ok("not approved automatically", !accessFor([...rows, r], "bob@example-capital.com").approved);
const r2 = applyRequest(rows, { ...req, name: "Ann Example", organisation: "", email: "ann@example-fo.com", screening: { result: "POSSIBLE SANCTIONS MATCH", hits: [{ name: "Ann Example", listed: "A. Example", list: "OFAC" }] } }, T);
ok("same email: joins the existing record", !r2.isNew && r2.id === "i007" && r2.data.contacts.length === 1);
ok("possible match: status Your decision", r2.data.status === "review");
const r3 = applyRequest(rows, { ...req, organisation: "", name: "Cy Example", email: "cy@mail.example" }, T);
ok("private investor without organisation: named as private investor", r3.data.org === "Cy Example (private investor)" && r3.data.selfRequested);
ok("organisation match ignores Ltd", matchRecord(rows, { email: "x@y.com", organisation: "Example Family Office" }).id === "i007");
let d = giveAccess(r.data, "bob@example-capital.com", T, "email");
const rows2 = [...rows, { id: r.id, data: d }];
ok("after the owner gives access: approved", accessFor(rows2, "BOB@example-capital.com").approved && d.ir.stage === "approved");
d = recordEvent(d, "bob@example-capital.com", "opened", T);
ok("briefing opened: logged and stage moves on", d.ir.stage === "opened" && d.ir.access["bob@example-capital.com"].opens.length === 1);
const inv = giveAccess(rows[1].data, "ann@example-fo.com", T, "invited");
ok("invitation without request: stage Invited", inv.ir.stage === "invited" && inv.ir.access["ann@example-fo.com"].invitedAt === T);
const dom = giveAccess({}, "@example-fo.com", T, "plain");
ok("whole domain approved", accessFor([{ id: "i1", data: dom }], "zed@example-fo.com").approved && !accessFor([{ id: "i1", data: dom }], "zed@other.com").approved);
const later = { ...inv, ir: { ...inv.ir, stage: "nda" } };
ok("an opening never moves a later stage back", recordEvent(later, "ann@example-fo.com", "opened", T).ir.stage === "nda");
const m = irMail("invite", { name: "Ann Example", site: "https://example.com" });
ok("invitation text: page link, code rule, no-offer line, no figures or layer names", m.text.includes("https://example.com/investor-relations/") && /one-time code/.test(m.text) && /Nothing in the briefing or in this email is an offer/.test(m.text) && !/\d\s?%|USD|Aurora|Aephelion|Rhodium|Arch|Nomad|XRS/.test(m.text));
ok("approval text differs", /access to our private investor briefing is ready/.test(irMail("approve", { name: "Bob" }).text));
ok("key check", sameKey("abc", "abc") && !sameKey("abc", "abd") && !sameKey("", ""));
// handler: a wrong key is refused before any data is read
process.env.NAVORYX_IR_KEY = "k-example-123";
const out = {}; const res = { status(c) { out.c = c; return this; }, json(j) { out.j = j; return this; } };
let reads = 0; const sb = async () => { reads++; return { ok: true, body: [] }; };
await irHandler({ method: "POST", headers: { "x-ir-key": "wrong" }, body: { action: "access", email: "a@b.com" } }, res, { sb, owner: async () => ({ code: 401, error: "x" }) });
ok("wrong key: 401, nothing read", out.c === 401 && reads === 0);
await irHandler({ method: "POST", headers: { "x-ir-key": "k-example-123" }, body: { action: "access", email: "a@b.com" } }, res, { sb, owner: async () => ({}) });
ok("right key: unknown address not approved", out.c === 200 && out.j.approved === false);
await irHandler({ method: "POST", headers: {}, body: { action: "approve", id: "i1", email: "a@b.com" } }, res, { sb, owner: async () => ({ code: 403, error: "The Director only" }) });
ok("owner actions need an owner", out.c === 403);
// 12-month clean-up: investor-relations activity keeps a contact; a removed person's access and requests go with them
const { sweep } = await import("../../../jobs/lib/contacts.mjs");
const old = "2025-01-01T00:00:00.000Z", recent = new Date(Date.now() - 30 * 864e5).toISOString();
const mk = (last) => ({ id: "i050", data: { org: "Example Office", log: [], contacts: [{ name: "Old Example", email: "old@example-office.com", added: old }],
  ir: { access: { "old@example-office.com": { approved: true, opens: [last] }, "@example-office.com": { approved: true } }, requests: [{ at: old, email: "old@example-office.com" }], log: [{ t: last, note: "Briefing opened" }] } } });
for (const [label, last, kept] of [["recent briefing opening keeps the contact", recent, true], ["no activity for 12 months: contact, access and requests removed; domain access stays", old, false]]) {
  let saved = null; const row = mk(last);
  const db = { all: async t => t === "owner_prospects" ? [row] : [], set: async (p, d) => { saved = d; } };
  await sweep(db, () => {});
  ok(label, kept ? saved === null : saved && saved.contacts.length === 0 && !saved.ir.access["old@example-office.com"] && !!saved.ir.access["@example-office.com"] && saved.ir.requests.length === 0);
}
const mi = irMail("invite", { name: "Ann Example", site: "https://example.com", sourceType: "Business card or meeting" });
ok("invitation says where we have the details and offers removal; link opens at Already approved", /We have your details from our meeting\. If you would rather not hear from us again/.test(mi.text) && mi.text.includes("https://example.com/investor-relations/#approved"));
ok("unknown source leaves a placeholder that blocks sending", /\[say where we have your details from\]/.test(irMail("invite", { name: "X" }).text));
ok("approval (they asked) has no removal line", !/We have your details/.test(irMail("approve", { name: "Bob" }).text));
{ process.env.NAVORYX_IR_FROM = "Example <ir@example.com>"; process.env.NAVORYX_RESEND_KEY = "k"; const out2 = {}; const res2 = { status(c) { out2.c = c; return this; }, json(j) { out2.j = j; return this; } };
  const sb2 = async () => ({ ok: true, body: [{ id: "i1", data: { contacts: [{ name: "A", email: "a@b.com" }] } }] });
  await irHandler({ method: "POST", headers: {}, body: { action: "send", id: "i1", email: "a@b.com", subject: "S", text: "Dear A,\n\nWe have your details [say where we have your details from]. More text here to pass the length." } }, res2, { sb: sb2, owner: async () => ({ me: { id: "u" } }) });
  ok("a [placeholder] left in the text is refused before sending", out2.c === 400 && /placeholder/.test(out2.j.error)); }
{ process.env.NAVORYX_IR_KEY = "k-example-123"; const out3 = {}; const res3 = { status(c) { out3.c = c; return this; }, json(j) { out3.j = j; return this; } };
  const crypto = await import("node:crypto"); let audited = "";
  await irHandler({ method: "POST", headers: {}, body: { action: "preview" } }, res3, { sb: async (path, init) => { if (path.includes("audit_log")) audited = init.body; return { ok: true, body: [] }; }, owner: async () => ({ me: { id: "u" } }) });
  const m = String((out3.j || {}).url).match(/a=preview&t=(\d{13})\.([\w-]+)$/);
  ok("owner preview: a 5-minute link signed with the shared key, audited without names", out3.c === 200 && m && Number(m[1]) - Date.now() <= 5 * 60000 && Number(m[1]) > Date.now()
    && m[2] === crypto.createHmac("sha256", "k-example-123").update(`preview|${m[1]}`).digest("base64url") && /Briefing preview opened/.test(audited));
  await irHandler({ method: "POST", headers: {}, body: { action: "preview" } }, res3, { sb: async () => ({ ok: true, body: [] }), owner: async () => ({ code: 403, error: "The Director only" }) });
  ok("preview needs an owner", out3.c === 403); }
