// Reset at next sign-in: only after a new sign-in, only listed people, never owners. Example data only.
import { resetIfDue } from "../api/resetcheck.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
function mem(list, role = "broker") { const calls = []; let L = list;
  const db = async (path, opt = {}) => { calls.push([opt.method || "GET", path]);
    if (path.startsWith("/rest/v1/intel?select")) return [{ value: { list: L } }];
    if (path.startsWith("/rest/v1/intel?on_conflict")) { L = JSON.parse(opt.body).value.list; return null; }
    if (path.startsWith("/rest/v1/profiles?select")) return [{ role, contract_name: "Example Broker" }];
    return null; };
  return { db, calls, list: () => L }; }
const at = "2026-10-28T10:50:00Z";
let m = mem([{ id: "u1", at }]);
let r = await resetIfDue({ id: "u1", last_sign_in_at: "2026-10-28T09:00:00Z" }, m.db);
ok("still in the session from before the request: nothing happens", !r.reset && r.waiting && m.calls.every(c => c[0] === "GET"));
r = await resetIfDue({ id: "u1", last_sign_in_at: "2026-10-28T12:00:00Z" }, m.db);
ok("next sign-in: request, agreement, academy progress removed, team access ended", r.reset && ["join_requests", "agreements", "academy_progress"].every(t => m.calls.some(c => c[0] === "DELETE" && c[1].includes(t))) && m.calls.some(c => c[0] === "PATCH" && c[1].includes("profiles")));
ok("written to the audit log and taken off the list", m.calls.some(c => c[1].includes("audit_log")) && m.list().length === 0);
m = mem([{ id: "u1", at }]); r = await resetIfDue({ id: "u2", last_sign_in_at: "2026-10-28T12:00:00Z" }, m.db);
ok("someone not on the list: nothing happens", !r.reset && m.calls.length === 1);
m = mem([{ id: "o1", at }], "owner"); r = await resetIfDue({ id: "o1", last_sign_in_at: "2026-10-28T12:00:00Z" }, m.db);
ok("an owner is never reset", !r.reset && !m.calls.some(c => c[0] === "DELETE"));
