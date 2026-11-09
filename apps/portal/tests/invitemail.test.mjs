// Invitation email: intro agreed with Morten 28 Oct 2026 (options A and B), joining steps, link, no Bangkok details. Example data only.
import { inviteMail, inviteRequest, inviteState, joinProgress } from "../api/invite.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const m = inviteMail({ name: "Example Person", link: "https://example.com/one-time", from: "Example Owner" });
ok("greets by first name", m.text.startsWith("Dear Example,"));
ok("intro A: what Archē is", m.text.includes("private jet charter broker based in Singapore") && m.html.includes("from any operator, on any route"));
ok("intro B: the opportunity, matching the offer (up to 35% of the profit)", m.text.includes("keeping up to 35% of the profit on every trip they sell"));
ok("the four joining steps and the personal link", ["our offer to you", "Broker Academy", "request for assessment", "your agreement"].every(x => m.text.includes(x)) && m.text.includes("https://example.com/one-time") && m.html.includes('href="https://example.com/one-time"'));
ok("no Bangkok office or Thai phone number", !/bangkok|\+66/i.test(m.text + m.html));
const rq = inviteRequest({ from: "Archē Executive <welcome@example.com>", to: "new.person@example.com", owner: "owner@example.com", mail: m });
ok("the inviting owner gets a hidden copy (BCC) and the replies", JSON.stringify(rq.bcc) === '["owner@example.com"]' && JSON.stringify(rq.reply_to) === '["owner@example.com"]' && JSON.stringify(rq.to) === '["new.person@example.com"]');
ok("no copy when the owner invites their own address", inviteRequest({ from: "x", to: "owner@example.com", owner: "owner@example.com", mail: m }).bcc === undefined);
ok("not accepted: no login, or invited but never signed in", !inviteState(null).accepted && !inviteState({ id: "u" }).accepted && /not signed in/.test(inviteState({ id: "u" }).step));
const acc = inviteState({ id: "u", last_sign_in_at: "2026-10-28T12:00:00Z" }, { active: false, data: {} }, null, null);
ok("accepted: signed in, with the joining step", acc.accepted && acc.signedIn === "2026-10-28T12:00:00Z" && /offer, academy/.test(acc.step));
ok("later steps shown: assessment, agreement, team", /assessment/.test(inviteState({ last_sign_in_at: "x" }, null, { data: {} }, null).step) && /Agreement signed/.test(inviteState({ last_sign_in_at: "x" }, null, null, { data: { status: "signed" } }).step) && inviteState({ last_sign_in_at: "x" }, { active: true, data: { roster: true } }).step === "On the team");
ok("the permanent portal and academy addresses, for other devices", m.text.includes("https://portal.archeaviation.com\n") || m.text.includes("Your portal: https://portal.archeaviation.com"));
ok("academy address and forgot-password hint in text and html", m.text.includes("/academy.html") && m.html.includes("/academy.html") && /Forgot password/.test(m.text));
const ag = inviteMail({ name: "Example Person", link: "https://example.com/again", from: "Example Owner", again: true });
ok("send again: a new-link email, not the joining invitation", /new link/i.test(ag.subject) && ag.text.includes("https://example.com/again") && !/our offer to you/.test(ag.text) && /continue where you left off/.test(ag.text));

// exact joining progress and log (Morten, 2 Nov 2026)
const jp = joinProgress({ invite: { first: "2026-10-28T10:00:00Z", at: "2026-10-30T10:00:00Z", sends: [{ at: "2026-10-28T10:00:00Z", sent: true }, { at: "2026-10-30T10:00:00Z", sent: true }] },
  user: { email_confirmed_at: "2026-10-28T11:00:00Z", last_sign_in_at: "2026-11-01T09:00:00Z" },
  prog: { data: { mods: { m0: { passed: true, passedAt: "2026-10-29T10:00:00Z", best: 90, attempts: 1 }, m1: { passed: true, passedAt: "2026-10-30T12:00:00Z", best: 85, attempts: 2 }, m2: { at: "2026-10-31T10:00:00Z", best: 60, attempts: 1 } } } },
  offer: { data: { at: "2026-10-28T11:05:00Z" } } });
ok("progress: step 4 of 9, the academy, 2 of 19 modules and the next module", jp.done === 3 && jp.of === 9 && /^Step 4 of 9: Broker Academy \(2 of 19 modules passed · next: 2 Where we may/.test(jp.label));
ok("progress: percent counts part of the academy", jp.pct > 33 && jp.pct < 45);
ok("log: newest first, with resend, offer, passes and a failed try", jp.log[0].t === "Last signed in" && jp.log.some(l => l.t === "Invitation sent again") && jp.log.some(l => /Opened the offer/.test(l.t)) && jp.log.some(l => /passed 1 Archē Executive.*2 attempts/.test(l.t)) && jp.log.some(l => /tried 2 Where.*not passed yet \(best 60%\)/.test(l.t)));
const jd = joinProgress({ invite: { at: "2026-10-01T00:00:00Z" }, user: { last_sign_in_at: "x" }, agr: { data: { status: "active", sentAt: "a", signedAt: "b", counterAt: "c" } }, prof: { active: true, data: { roster: { onboarding: { issuedAt: "c" } } } }, ack: { data: { ackAt: "d" } } });
ok("done: all nine steps, earlier steps without a date counted as done", jd.done === 9 && jd.pct === 100 && jd.label === "Done: on the desk" && jd.steps.find(x => x.k === "academy").note === "done (no date recorded)");
const jn = joinProgress({ invite: { at: "2026-11-01T00:00:00Z", sent: true }, user: { email_confirmed_at: "2026-10-01T00:00:00Z", last_sign_in_at: null } });
ok("not signed in: step 2, and an older confirmation is not taken as accepting this invitation", /^Step 2 of 9: Accepted and signed in/.test(jn.label) && !jn.log.some(l => /Opened the invitation/.test(l.t)));
const jx = joinProgress({ invite: { at: "2026-10-31T00:00:00Z", first: "2026-10-31T00:00:00Z", sends: [] }, user: { last_sign_in_at: "2026-10-31T01:00:00Z" } });
ok("joining without a Team invitation: first step reads Login created", jx.steps[0].t === "Login created" && /not invited from Team/.test(jx.steps[0].note));
// history (Morten, 2 Nov 2026): earlier invitations from the audit log, sign-in history from Supabase (SQL 0021)
const jh = joinProgress({ invite: { at: "2026-10-30T10:00:00Z", sent: true }, user: { last_sign_in_at: "2026-11-01T09:00:00Z" },
  audits: [{ t: "2026-10-30T10:00:20Z", action: "Invitation to join", detail: "Example Person · e***@example.com · email sent" }, { t: "2026-10-27T08:00:00Z", action: "Invitation to join", detail: "Example Person · e***@example.com · email not sent" }, { t: "2026-10-31T08:00:00Z", action: "Joining started again", detail: "Example Person: request" }],
  authEvents: [{ at: "2026-11-01T09:00:00Z", action: "login" }, { at: "2026-11-01T07:00:00Z", action: "login" }, { at: "2026-10-30T11:00:00Z", action: "login" }, { at: "2026-10-30T10:58:00Z", action: "user_updated_password" }, { at: "2026-10-27T08:00:01Z", action: "user_signedup" }],
  prog: { created_at: "2026-10-30T11:10:00Z", data: { mods: {} } },
  runs: [{ id: "syl-broker-l1", data: { kind: "syllabus", title: "Example lesson", at: "2026-10-31T12:00:00Z" } }] });
const has = re => jh.log.some(l => re.test(l.t));
ok("history: an earlier invitation from the audit log, the same one not counted twice", jh.log.filter(l => /^Invit/.test(l.t)).length === 2 && has(/^Invited; email not sent/) && has(/^Invitation sent again$/));
ok("history: sign-ins grouped by day, password and account created", has(/^Signed in 2 times that day \(first 07:00 UTC\)$/) && has(/^Signed in$/) && has(/Set or changed the password/) && has(/Login created/));
ok("history: academy started, live training lesson, other Team actions", has(/Started the academy/) && has(/Live training lesson: Example lesson/) && has(/Joining started again/));
ok("history: full when the sign-in records are readable, partial without", jh.history === "full" && joinProgress({ invite: {} }).history === "partial");

// reminder after 3 quiet days (Morten, 4 Nov 2026): owner presses Send; next step named; reply to stop. Example data only.
import { remindMail, academyNext } from "../api/invite.mjs";
const rm = remindMail({ name: "Example Person", link: "https://example.com/r1", from: "Example Owner", next: { title: "Module 1 · Archē Executive and the broker's role", min: 13 }, pwSet: true, started: true });
ok("reminder: subject, next step with its length, the link and a way to say no", /next step/i.test(rm.subject) && rm.text.includes("Module 1 · Archē Executive and the broker's role (about 13 minutes)") && rm.text.includes("https://example.com/r1") && rm.html.includes('href="https://example.com/r1"') && /reply to this email and we will not send further reminders/.test(rm.text));
ok("reminder: no password yet tells them to choose one", /choose your password/.test(remindMail({ name: "A B", link: "x", next: null, pwSet: false }).text));
ok("reminder: the December launch, with no date (Morten, 9 Nov 2026)", rm.text.includes("Archē Executive launches in December") && rm.html.includes("launches in December") && !/\b\d{1,2}(st|nd|rd|th)? December|December \d/.test(rm.text));
ok("reminder: no Bangkok details", !/bangkok|\+66/i.test(rm.text + rm.html));
ok("next step: first module, then the lab, by the academy's own order", academyNext(null).id === "m0" && academyNext({ mods: { m0: { passed: true }, m1: { passed: true }, m2: { passed: true } } }).title === "Lab: the trip risk screen" && academyNext({ role: "consultant", mods: { m0: {passed:true}, m1: {passed:true}, m2: {passed:true}, lab: {passed:true}, m3: {passed:true}, m4: {passed:true}, m5: {passed:true} } }).id === "m6");   // brokers only: old "consultant" progress follows the broker path
const quietP = joinProgress({ invite: { name: "Example Person", first: "2026-10-28T10:00:00Z", sends: [{ at: "2026-10-28T10:00:00Z", sent: true }] }, user: { last_sign_in_at: "2026-11-01T11:53:00Z", email_confirmed_at: "2026-11-01T11:53:00Z", user_metadata: {} }, runs: [{ id: "academy", data: { first: "2026-11-01T12:00:00Z", last: "2026-11-01T12:00:00Z", count: 1, fails: 2 } }], now: new Date("2026-11-04T13:00:00Z") });
ok("quiet 3 days: reminder ready with the next step and a preview", quietP.remind && quietP.remind.due && quietP.remind.quiet === 3 && quietP.remind.next.id === "m0" && /\[personal sign-in link\]/.test(quietP.remind.preview));
ok("signed in without a password: flagged for a new password link", quietP.pwSet === false && /never set a password/.test(quietP.alert));
ok("academy page visits and failed sign-ins in the log", quietP.log.some(l => /Opened the academy for the first time/.test(l.t)) && quietP.log.some(l => /2 failed password sign-ins on the academy page/.test(l.t)));
const freshP = joinProgress({ invite: { first: "2026-11-03T10:00:00Z", reminders: [] }, user: { last_sign_in_at: "2026-11-03T11:00:00Z", user_metadata: { pw_set: true } }, now: new Date("2026-11-04T13:00:00Z") });
ok("active in the last 3 days: no reminder; password set: no flag", freshP.remind && !freshP.remind.due && freshP.pwSet === true && !freshP.alert);
const remP = joinProgress({ invite: { first: "2026-10-20T10:00:00Z", reminders: [{ at: "2026-11-03T09:00:00Z", sent: true }] }, user: { last_sign_in_at: "2026-10-21T11:00:00Z", user_metadata: { pw_set: true } }, now: new Date("2026-11-04T13:00:00Z") });
ok("reminded yesterday: not due again yet, and the reminder is in the log", !remP.remind.due && remP.remind.lastSent === "2026-11-03T09:00:00Z" && remP.log.some(l => l.t === "Reminder sent"));
ok("asked for assessment: no reminder", joinProgress({ invite: { first: "2026-10-01T00:00:00Z" }, user: { last_sign_in_at: "2026-10-02T00:00:00Z", user_metadata: { pw_set: true } }, join: { data: { at: "2026-10-03T00:00:00Z" } }, now: new Date("2026-11-04T13:00:00Z") }).remind === null);

// delete an invitee and everything kept about them, one step (Morten, 7 Nov 2026). Fake database, example data only.
import { deleteInvitee } from "../api/invite.mjs";
function fakeDb(o = {}) {
  const U = "u-ex-1", calls = [];
  const rows = { profiles: [{ id: U, role: "broker", active: false, data: o.roster ? { roster: true } : {} }], agreements: o.agr ? [{ id: U, data: { status: o.agr } }] : [], trips: o.trips ? [{ id: "t1" }] : [], trip_status: [], payouts: [], screen_log: [],
    audit_log: [{ id: 1, by: U, detail: "own" }, { id: 2, by: "owner", detail: "Invitation · Example Person · e***@example.com · email sent" }, { id: 3, by: "owner", detail: "Something else" }] };
  const api = async (path, opt = {}) => {
    const m = (opt.method || "GET").toUpperCase(); calls.push([m, path, opt.body || ""]);
    if (path.startsWith("/rest/v1/intel?select")) return { ok: true, body: [{ value: { list: [{ email: "e.person@example.com", name: "Example Person" }, { email: "other@example.com", name: "Other Person" }] } }] };
    if (path.startsWith("/auth/v1/admin/users?")) return { ok: true, body: { users: [{ id: U, email: "e.person@example.com", user_metadata: {} }, { id: "owner", email: "owner@example.com" }] } };
    if (path.startsWith("/auth/v1/admin/users/")) return { ok: true, body: {} };
    if (path.startsWith("/storage/v1/object/list/")) return { ok: true, body: [{ name: "f1.pdf" }] };
    const t = (path.match(/^\/rest\/v1\/(\w+)/) || [])[1];
    if (m === "GET") { if (t === "audit_log") return { ok: true, body: rows.audit_log.filter(r => /Example Person/.test(r.detail)) }; return { ok: true, body: rows[t] || [] }; }
    if (m === "DELETE" && t === "audit_log") return { ok: true, body: rows.audit_log.filter(r => r.by === U) };
    return { ok: true, body: m === "DELETE" ? [{}] : null };
  };
  return { api, calls, U };
}
{
  const f = fakeDb(); const r = await deleteInvitee({ email: "e.person@example.com", me: { id: "owner" }, api: f.api });
  const has = (m, rx) => f.calls.some(c => c[0] === m && rx.test(c[1]));
  ok("delete: one call removes login, profile, joining, academy, training, files and the invitation", r.ok && has("DELETE", /auth\/v1\/admin\/users\/u-ex-1$/) && has("DELETE", /profiles\?id=eq\.u-ex-1/) && has("DELETE", /join_requests\?user_id=eq\.u-ex-1/) && has("DELETE", /academy_progress\?id=eq\.u-ex-1/) && has("DELETE", /training_runs\?owner_id=eq\.u-ex-1/) && has("DELETE", /assessments\?id=eq\.u-ex-1/) && f.calls.some(c => c[0] === "DELETE" && /storage\/v1\/object\/portal-files/.test(c[1]) && /u-ex-1\/f1\.pdf/.test(c[2])), r);
  const inv = f.calls.find(c => c[0] === "POST" && /intel\?on_conflict/.test(c[1]));
  ok("delete: invitation list keeps the others, drops this person", inv && !/e\.person@example\.com/.test(inv[2]) && /other@example\.com/.test(inv[2]));
  const patch = f.calls.find(c => c[0] === "PATCH" && /audit_log\?id=eq\.2/.test(c[1]));
  ok("delete: their own audit entries go; others lose the name and masked email", f.calls.some(c => c[0] === "DELETE" && /audit_log\?by=eq\.u-ex-1/.test(c[1])) && patch && !/Example Person|e\*\*\*@/.test(patch[2]) && /\[deleted person\]/.test(patch[2]));
  const last = f.calls.filter(c => c[0] === "POST" && /\/rest\/v1\/audit_log$/.test(c[1])).pop();
  ok("delete: a record that a deletion happened, with no name or email", last && /Invitee deleted/.test(last[2]) && !/Example|example\.com/.test(last[2]));
  ok("delete: data goes before the login (so a retry can finish)", f.calls.findIndex(c => /auth\/v1\/admin\/users\/u-ex-1/.test(c[1])) > f.calls.findIndex(c => /profiles\?id=eq/.test(c[1]) && c[0] === "DELETE"));
}
for (const [label, o] of [["signed agreement", { agr: "signed" }], ["trips", { trips: true }], ["on the team", { roster: true }]]) {
  const f = fakeDb(o); const r = await deleteInvitee({ email: "e.person@example.com", me: { id: "owner" }, api: f.api });
  ok(`delete refused (${label}): nothing removed, points to End engagement`, r.code === 409 && /End engagement/.test(r.error) && !f.calls.some(c => c[0] === "DELETE"), r);
}
{ const f = fakeDb(); const r = await deleteInvitee({ email: "nobody@example.com", me: { id: "owner" }, api: f.api }); ok("delete: unknown email refused", r.code === 404 && !f.calls.some(c => c[0] === "DELETE")); }
