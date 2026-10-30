// Admin actions with an in-memory stand-in for Supabase. Example data only. Run: node admin.test.mjs
import { main } from "./admin.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const ID = "00000000-0000-4000-8000-0000000000e1";
function fake() {
  const T = { profiles: [{ id: ID, role: "broker", active: true, contract_name: "Example Person", data: { roster: true } }, { id: "own", role: "owner", active: true, data: {} }],
    join_requests: [{ user_id: ID, data: { contractName: "Example Person" } }], agreements: [{ id: ID, data: { status: "active" } }], academy_progress: [{ id: ID, data: { completedAt: "2026-10-20" } }],
    access_log: [{ owner_id: ID, data: { lastSeen: "2026-10-28T09:00:00Z" } }], audit_log: [],
    trips: [{ owner_id: ID, id: "test1", data: { stage: "submitted" } }, { owner_id: ID, id: "paid1", data: { stage: "submitted" } }], trip_status: [{ owner_id: ID, id: "test1", data: { state: "review" } }, { owner_id: ID, id: "paid1", data: { state: "issued", receipts: [{ amount: 1 }] } }],
    website_enquiries: [{ id: "w1", at: "2026-10-26T02:00:00Z", data: { type: "quote" } }, { id: "w2", at: "2026-10-28T09:00:00Z", data: { type: "quote" } }, { id: "w3", at: "2026-10-30T09:00:00Z", data: { type: "quote" } }, { id: "w4", at: "2026-10-20T09:00:00Z", data: { handled: true } }], intel: [], config: [{ key: "assign", value: { firstTouchHours: 24 } }],
    leads: ["Japan", "Thailand", "Hong Kong", "Singapore", "Thailand"].map((c, i) => ({ owner_id: ID, id: "p" + i, data: { org: "Example Org " + i, country: c, status: "assigned", log: [] } })),
    prospects: [0, 1, 2, 3, 4].map(i => ({ id: "p" + i, data: { org: "Example Org " + i, status: "assigned", assignedTo: ID } })) };
  const users = [{ id: ID, email: "example.person@example.com", email_confirmed_at: "2026-10-01", created_at: "2026-10-01", last_sign_in_at: "2026-10-28T09:00:00Z" }];
  const q = (t) => { let rows = T[t], filt = [], op = "select", patch = null, ins = null;
    const api = { select() { return api; }, eq(c, v) { filt.push(r => r[c] === v); return api; }, lt(c, v) { filt.push(r => r[c] < v); return api; }, delete() { op = "delete"; return api; }, update(p) { op = "update"; patch = p; return api; },
      insert(r) { T[t].push(r); return Promise.resolve({ data: [r], error: null }); },
      upsert(r) { T[t] = T[t].filter(x => x.key !== r.key); T[t].push(r); return Promise.resolve({ data: [r], error: null }); },
      maybeSingle() { return Promise.resolve({ data: T[t].filter(r => filt.every(f => f(r)))[0] || null, error: null }); },
      then(res, rej) { const hit = T[t].filter(r => filt.every(f => f(r)));
        if (op === "delete") T[t] = T[t].filter(r => !hit.includes(r)); if (op === "update") hit.forEach(r => Object.assign(r, patch));
        return Promise.resolve({ data: hit, error: null }).then(res, rej); } };
    return api; };
  return { T, from: q, auth: { admin: { listUsers: async () => ({ data: { users }, error: null }), getUserById: async id => ({ data: { user: users.find(u => u.id === id) }, error: null }) } } };
}
const sb = fake();
let r = await main({ ACTION: "person-status", EMAIL: "Example.Person@example.com" }, sb);
ok("status finds the login, last sign-in and step", r.login && r.confirmed && r.step.startsWith("team member") && r.email === "e***@example.com");
r = await main({ ACTION: "reset-joining", EMAIL: "example.person@example.com" }, sb);
ok("reset removes request, agreement, academy progress and team access", JSON.stringify(r.removed) === JSON.stringify(["request", "agreement", "academy progress", "team access"]));
ok("after reset the person is back at the offer and academy", /joining steps/.test(r.now));
ok("login kept, profile not active, owner untouched", sb.T.profiles.find(p => p.id === ID).active === false && sb.T.profiles.find(p => p.id === "own").active === true);
ok("audit line written without the email", sb.T.audit_log.length === 1 && /Joining started again/.test(sb.T.audit_log[0].action) && !/@/.test(sb.T.audit_log[0].detail));
r = await main({ ACTION: "person-status", EMAIL: "nobody@example.com" }, sb);
ok("unknown email: says there is no login", r.login === false);
const sb2 = fake(); r = await main({ ACTION: "reset-next-login", NAME: "example per" }, sb2);
ok("reset at next sign-in: found by name, put on the list, nothing removed yet", r.queued && sb2.T.intel[0].value.list[0].id === ID && sb2.T.join_requests.length === 1 && /next sign-in/.test(sb2.T.audit_log[0].action));
r = await main({ ACTION: "cancel-reset-next", EMAIL: "example.person@example.com" }, sb2);
ok("reset at next sign-in can be cancelled", r.cancelled && sb2.T.intel[0].value.list.length === 0);
r = await main({ ACTION: "set-name", EMAIL: "example.person@example.com", NEW_NAME: "Example Persson" }, sb2);
ok("name corrected in the profile and logged", r.to === "Example Persson" && sb2.T.profiles.find(p => p.id === ID).contract_name === "Example Persson" && sb2.T.audit_log.some(a => a.action === "Name corrected"));
r = await main({ ACTION: "trim-leads", EMAIL: "example.person@example.com", KEEP: "3" }, sb2);
ok("starter pace: keeps 3 (Thailand first, then Singapore), clock restarted, the rest back to the pool", r.kept === 3 && r.returned === 2 && r.keptCountries.Thailand === 2 && r.keptCountries.Singapore === 1
  && sb2.T.leads.length === 3 && sb2.T.leads.every(l => l.data.firstTouchDue) && sb2.T.prospects.filter(p => p.data.status === "new" && !p.data.assignedTo).length === 2 && sb2.T.audit_log.some(a => a.action === "Starter pace applied"));
let amb = false; sb2.T.profiles.push({ id: "x2", role: "broker", contract_name: "Example Personal", data: {} }); try { await main({ ACTION: "reset-next-login", NAME: "example person" }, sb2); } catch (e) { amb = /2 people match/.test(e.message); }
ok("two people match the name: refused, asks for the email", amb);
let own = false; sb.auth.admin.listUsers = async () => ({ data: { users: [{ id: "own", email: "owner@example.com" }] }, error: null }); try { await main({ ACTION: "reset-joining", EMAIL: "owner@example.com" }, sb); } catch (e) { own = /never reset/.test(e.message); }
ok("an owner is never reset", own);
let threw = false; try { await main({ ACTION: "delete-everything", EMAIL: "x@example.com" }, sb); } catch (e) { threw = true; }
ok("only the listed actions run", threw);

{ const sb2 = fake();
  const r1 = await main({ ACTION: "remove-test-trip", NAME: "test1" }, sb2);
  ok("test trip removed with its status, logged", r1.removed && !sb2.T.trips.some(x => x.id === "test1") && !sb2.T.trip_status.some(x => x.id === "test1") && sb2.T.audit_log.some(a => a.action === "Test trip removed"));
  let refused = false; try { await main({ ACTION: "remove-test-trip", NAME: "paid1" }, sb2); } catch (e) { refused = /Money or a flight/.test(e.message); }
  ok("a trip with client money recorded is never removed", refused && sb2.T.trips.some(x => x.id === "paid1"));
  const r2 = await main({ ACTION: "close-test-enquiries", NAME: "2026-10-29" }, sb2);
  ok("open website enquiries before the date closed as handled, later ones untouched, nothing deleted", r2.closed === 2 && sb2.T.website_enquiries.length === 4 && sb2.T.website_enquiries.find(x => x.id === "w1").data.handled && !sb2.T.website_enquiries.find(x => x.id === "w3").data.handled);
}
