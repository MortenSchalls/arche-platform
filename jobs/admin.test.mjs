// Admin actions with an in-memory stand-in for Supabase. Example data only. Run: node admin.test.mjs
import { main } from "./admin.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const ID = "00000000-0000-4000-8000-0000000000e1";
function fake() {
  const T = { profiles: [{ id: ID, role: "broker", active: true, contract_name: "Example Person", data: { roster: true } }, { id: "own", role: "owner", active: true, data: {} }],
    join_requests: [{ user_id: ID, data: { contractName: "Example Person" } }], agreements: [{ id: ID, data: { status: "active" } }], academy_progress: [{ id: ID, data: { completedAt: "2026-10-20" } }],
    access_log: [{ owner_id: ID, data: { lastSeen: "2026-10-28T09:00:00Z" } }], audit_log: [] };
  const users = [{ id: ID, email: "example.person@example.com", email_confirmed_at: "2026-10-01", created_at: "2026-10-01", last_sign_in_at: "2026-10-28T09:00:00Z" }];
  const q = (t) => { let rows = T[t], filt = [], op = "select", patch = null, ins = null;
    const api = { select() { return api; }, eq(c, v) { filt.push([c, v]); return api; }, delete() { op = "delete"; return api; }, update(p) { op = "update"; patch = p; return api; },
      insert(r) { T[t].push(r); return Promise.resolve({ data: [r], error: null }); },
      maybeSingle() { return Promise.resolve({ data: T[t].filter(r => filt.every(([c, v]) => r[c] === v))[0] || null, error: null }); },
      then(res, rej) { const hit = T[t].filter(r => filt.every(([c, v]) => r[c] === v));
        if (op === "delete") T[t] = T[t].filter(r => !hit.includes(r)); if (op === "update") hit.forEach(r => Object.assign(r, patch));
        return Promise.resolve({ data: hit, error: null }).then(res, rej); } };
    return api; };
  return { T, from: q, auth: { admin: { listUsers: async () => ({ data: { users }, error: null }) } } };
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
let own = false; sb.auth.admin.listUsers = async () => ({ data: { users: [{ id: "own", email: "owner@example.com" }] }, error: null }); try { await main({ ACTION: "reset-joining", EMAIL: "owner@example.com" }, sb); } catch (e) { own = /never reset/.test(e.message); }
ok("an owner is never reset", own);
let threw = false; try { await main({ ACTION: "delete-everything", EMAIL: "x@example.com" }, sb); } catch (e) { threw = true; }
ok("only the listed actions run", threw);
