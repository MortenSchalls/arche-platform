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
ok("progress: step 4 of 9, the academy, 2 of 18 modules and the next module", jp.done === 3 && jp.of === 9 && /^Step 4 of 9: Broker Academy \(2 of 18 modules passed · next: 2 Where we may/.test(jp.label));
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
