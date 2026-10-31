// Owner-requested admin actions that Claude can run at once (Morten, 28 Oct 2026: "when I ask for an immediate reset, I need
// you to be able to do so"). Runs only on GitHub Actions (workflow "Admin actions"), with the Supabase secret key stored as a
// repository secret; Claude starts it from the chat and never sees the key. Only the actions below exist. Every change is
// written to the portal's audit log. Logs show no email addresses.
//   ACTION=person-status  EMAIL=…   where the person is: login, last sign-in, joining step, team access
//   ACTION=reset-joining  EMAIL=…   back to step 1 (the offer): removes request, agreement, academy progress, team access;
//                                   keeps the login, leads, trips and training records (same as Team > Start joining again)
//   ACTION=reset-next-login EMAIL=… or NAME=…   the same reset, done the next time the person signs in (api/resetcheck.mjs)
//   ACTION=cancel-reset-next EMAIL=…  takes the person off that list again
//   ACTION=trim-leads EMAIL=… [KEEP=10]   starter pace (Morten, 29 Oct 2026, for Natalia): keep KEEP open leads (her base
//                                   country first, then Thailand, Singapore, the rest of Asia), the others back to the pool,
//                                   and the first-contact clock restarts on the ones kept
//   ACTION=people-status              read only: everyone with a login (masked email), last sign-in, joining step, team
//   ACTION=alerts-status              read only: what the alert sender has open, how often each was sent, the last run
//   ACTION=leads-status [EMAIL=…]     read only: counts of prospects by status, open leads per broker, the last rotation
//   ACTION=owner-to-joining EMAIL=… or NAME=…  (Morten, 31 Oct 2026, for his wife: "remove her as owner now and we add her
//                                   later as owner, for now she joins like any other") an owner becomes a person joining:
//                                   owner rights off, then the same reset as reset-joining (offer first). Refused if it would
//                                   leave no other active owner. Her login is kept; she is made owner again later in Supabase.
//   ACTION=set-name EMAIL=… NEW_NAME=…  corrects the name shown in the portal (not the name in a signed agreement)
//   ACTION=remove-test-trip NAME=<trip id>   removes a test trip and its status (Morten, 30 Oct 2026); refused once any
//                                   client money, payment or flight is recorded on it
//   ACTION=close-test-enquiries NAME=<YYYY-MM-DD>   marks website enquiries received before that date and still open as
//                                   handled, as test data (Morten, 30 Oct 2026); nothing is deleted
import { createClient } from "@supabase/supabase-js";

const mask = e => String(e || "").trim().toLowerCase().replace(/^(.).*?(@.*)$/, "$1***$2");
const ck = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

export async function findUser(sb, email) {
  const want = String(email || "").trim().toLowerCase(); if (!want) throw new Error("No email given");
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 }); if (error) throw new Error("users: " + error.message);
    const u = (data.users || []).find(x => String(x.email || "").toLowerCase() === want); if (u) return u;
    if ((data.users || []).length < 200) return null;
  }
  return null;
}
export async function findByName(sb, name) {
  const n = String(name || "").trim().toLowerCase(); if (n.length < 3) throw new Error("Name too short");
  const hits = new Set();
  (ck(await sb.from("profiles").select("id,contract_name,role"), "profiles") || []).forEach(p => { if (p.role !== "owner" && String(p.contract_name || "").toLowerCase().includes(n)) hits.add(p.id); });
  (ck(await sb.from("join_requests").select("user_id,data"), "join_requests") || []).forEach(j => { if (String((j.data || {}).contractName || "").toLowerCase().includes(n)) hits.add(j.user_id); });
  (ck(await sb.from("agreements").select("id,data"), "agreements") || []).forEach(a => { if (String((a.data || {}).signedName || "").toLowerCase().includes(n)) hits.add(a.id); });
  if (hits.size !== 1) throw new Error(hits.size ? `${hits.size} people match this name: use the email instead` : "Nobody matches this name: use the email instead");
  const id = [...hits][0], { data, error } = await sb.auth.admin.getUserById(id); if (error) throw new Error("user: " + error.message); return data.user;
}
export async function resetNext(sb, u, name) {
  const pr = ck(await sb.from("profiles").select("role").eq("id", u.id).maybeSingle(), "profiles"); if (pr && pr.role === "owner") throw new Error("Owners are never reset");
  const row = ck(await sb.from("intel").select("value").eq("key", "resetnext").maybeSingle(), "intel"), list = ((row || {}).value || {}).list || [];
  const next = [{ id: u.id, at: new Date().toISOString(), name: name || "" }, ...list.filter(x => x.id !== u.id)];
  ck(await sb.from("intel").upsert({ key: "resetnext", value: { list: next }, updated_at: new Date().toISOString() }, { onConflict: "key" }), "intel");
  ck(await sb.from("audit_log").insert({ by: null, action: "Joining to start again at next sign-in", detail: `${name || "person " + u.id.slice(0, 8)} (on the owner's request)` }), "audit");
  return { queued: true, lastSignIn: u.last_sign_in_at || null };
}
export async function trimLeads(sb, u, keep = 10, now = Date.now()) {
  const prof = ck(await sb.from("profiles").select("role,base,contract_name").eq("id", u.id).maybeSingle(), "profiles") || {};
  if (prof.role === "owner") throw new Error("Not for owners");
  const cfg = ((ck(await sb.from("config").select("value").eq("key", "assign").maybeSingle(), "config") || {}).value) || {}, hours = Number(cfg.firstTouchHours) || 48;
  const mine = (ck(await sb.from("leads").select("owner_id,id,data").eq("owner_id", u.id), "leads") || []);
  const OPEN = l => !["notnow", "dnc", "duplicate", "enquiry"].includes((l.data || {}).status) && !(l.data || {}).own;
  const base = String(prof.base || "").toLowerCase(), rank = l => { const c = String((l.data || {}).country || "").toLowerCase(), r = String((l.data || {}).region || "");
    return c && c === base ? 0 : c === "thailand" ? 1 : c === "singapore" ? 2 : r === "Asia-Pacific" || c === "asia" ? 3 : 4; };
  const open = mine.filter(OPEN).sort((a, b) => rank(a) - rank(b) || String((a.data || {}).org || "").localeCompare(String((b.data || {}).org || "")));
  const kept = open.slice(0, keep), back = open.slice(keep), at = new Date(now).toISOString(), due = new Date(now + hours * 3600e3).toISOString();
  for (const l of kept) { const d = { ...l.data, firstTouchDue: due, updated: at, log: [...((l.data || {}).log || []), { t: at, system: true, channel: "Portal", outcome: "assigned", note: "Starter pace: first-contact clock restarted" }] };
    ck(await sb.from("leads").update({ data: d, updated_at: at }).eq("owner_id", u.id).eq("id", l.id).select(), "leads"); }
  let returned = 0;
  for (const l of back) {
    const p = ck(await sb.from("prospects").select("data").eq("id", l.id).maybeSingle(), "prospects");
    if (p) { const d = { ...p.data, status: "new", assignedTo: null, history: [...((p.data || {}).history || []), { t: at, restart: true, reason: "Starter pace: back to the pool (owner's decision)" }] };
      ck(await sb.from("prospects").update({ data: d, updated_at: at }).eq("id", l.id).select(), "prospects"); }
    ck(await sb.from("leads").delete().eq("owner_id", u.id).eq("id", l.id).select(), "leads"); returned++;
  }
  ck(await sb.from("audit_log").insert({ by: null, action: "Starter pace applied", detail: `${prof.contract_name || "broker"}: kept ${kept.length} leads (clock restarted), ${returned} back to the pool (on the owner's request)` }), "audit");
  const byCountry = kept.reduce((a, l) => { const k = (l.data || {}).country || "?"; a[k] = (a[k] || 0) + 1; return a; }, {});
  return { base: prof.base || "", kept: kept.length, keptCountries: byCountry, returned, firstContactDue: due };
}
export async function peopleStatus(sb) {
  const out = []; let page = 1;
  for (; page <= 20; page++) { const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 }); if (error) throw new Error("users: " + error.message);
    for (const u of data.users || []) { const st = await status(sb, u); out.push({ email: mask(u.email), name: st.name, created: String(u.created_at || "").slice(0, 16), lastSignIn: u.last_sign_in_at ? String(u.last_sign_in_at).slice(0, 16) : null, confirmed: st.confirmed, step: st.step, passwordSet: !!((u.user_metadata || {}).pw_set) || ((u.app_metadata || {}).provider === "azure") }); }
    if ((data.users || []).length < 200) break; }
  const inv = ck(await sb.from("intel").select("value").eq("key", "invites").maybeSingle(), "intel");
  return { people: out, invites: (((inv || {}).value || {}).list || []).map(x => ({ name: x.name, email: mask(x.email), at: x.at, sent: x.sent })) };
}
export async function alertsStatus(sb) {
  const rows = ck(await sb.from("alert_settings").select("id,data"), "alert_settings") || [];
  const st = (rows.find(r => r.id === "status") || {}).data || {}, cfg = (rows.find(r => r.id === "settings") || {}).data || {};
  const logs = rows.filter(r => r.id.startsWith("log:")).map(r => ({ key: r.id.slice(4).replace(/:[0-9a-f-]{20,}/g, ":…"), type: r.data.type, ref: r.data.ref, count: r.data.count, level: r.data.level, first: new Date(r.data.first).toISOString(), lastPush: r.data.lastPush ? new Date(r.data.lastPush).toISOString() : null }));
  return { status: st, settings: { repeatMin: cfg.repeatMin, escalateMin: cfg.escalateMin, recipients: (cfg.recipients || []).map(r => ({ active: r.active !== false, events: Object.keys(r.events || {}).filter(k => r.events[k]) })), away: Object.keys(cfg.away || {}).length }, open: logs };
}
export async function leadsStatus(sb, u) {
  const prospects = ck(await sb.from("prospects").select("id,data"), "prospects") || [], leads = ck(await sb.from("leads").select("owner_id,id,data"), "leads") || [];
  const profs = ck(await sb.from("profiles").select("id,role,active,contract_name,data"), "profiles") || [];
  const byStatus = {}; prospects.forEach(p => { const s = (p.data || {}).status || "new"; byStatus[s] = (byStatus[s] || 0) + 1; });
  const assignedTo = {}; prospects.forEach(p => { const a = (p.data || {}).assignedTo; if (a) assignedTo[a] = (assignedTo[a] || 0) + 1; });
  const brokers = profs.filter(p => p.active && (p.data || {}).roster && ["broker", "consultant"].includes(p.role)).map(p => {
    const mine = leads.filter(l => l.owner_id === p.id), open = mine.filter(l => !["notnow", "dnc", "duplicate", "enquiry"].includes((l.data || {}).status));
    const has = f => mine.filter(l => { const v = (l.data || {})[f]; return Array.isArray(v) ? v.length > 0 : !!String(v || "").trim(); }).length;
    const touched = mine.filter(l => ((l.data || {}).log || []).some(x => !x.system)).length, overdue = mine.filter(l => { const d = l.data || {}; return d.firstTouchDue && Date.parse(d.firstTouchDue) < Date.now() && !(d.log || []).some(x => !x.system); }).length;
    return { name: p.contract_name, role: p.role, supervised: !!(p.data || {}).supervised, leads: mine.length, open: open.length, assigned: assignedTo[p.id] || 0, lastAssigned: mine.map(l => (l.data || {}).assignedAt || "").sort().slice(-1)[0] || null,
      filled: { why: has("why"), approach: has("approach"), website: has("website"), contactRoutes: has("avenues"), namedContacts: has("contacts"), city: has("city") }, touched, firstTouchOverdue: overdue,
      segments: Object.entries(mine.reduce((a, l) => { const k = (l.data || {}).segment || "?"; a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8),
      countries: Object.entries(mine.reduce((a, l) => { const k = (l.data || {}).country || "?"; a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8),
      whyLen: Math.round(mine.reduce((a, l) => a + String((l.data || {}).why || "").length, 0) / Math.max(1, mine.length)), approachLen: Math.round(mine.reduce((a, l) => a + String((l.data || {}).approach || "").length, 0) / Math.max(1, mine.length)) };
  });
  const assign = ck(await sb.from("intel").select("value").eq("key", "assign").maybeSingle(), "intel"), cfg = ck(await sb.from("config").select("value").eq("key", "assign").maybeSingle(), "config");
  const a = (assign || {}).value || {};
  return { prospects: prospects.length, byStatus, brokers, rotation: { lastRun: a.lastRun || null, writes: a.writes, report: a.report ? { assigned: a.report.assigned, moved: a.report.moved, parked: a.report.parked, review: a.report.review, notes: (a.report.notes || []).slice(0, 6) } : null }, config: (cfg || {}).value || {} , person: u ? u.id.slice(0, 8) : null };
}
export async function cancelResetNext(sb, u) {
  const row = ck(await sb.from("intel").select("value").eq("key", "resetnext").maybeSingle(), "intel"), list = ((row || {}).value || {}).list || [];
  const was = list.some(x => x.id === u.id);
  ck(await sb.from("intel").upsert({ key: "resetnext", value: { list: list.filter(x => x.id !== u.id) }, updated_at: new Date().toISOString() }, { onConflict: "key" }), "intel");
  if (was) ck(await sb.from("audit_log").insert({ by: null, action: "Reset at next sign-in cancelled", detail: "on the owner's request" }), "audit");
  return { cancelled: was };
}
export async function setName(sb, u, name) {
  const n = String(name || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 80); if (n.split(/\s+/).length < 2) throw new Error("Give first and last name");
  const pr = ck(await sb.from("profiles").select("contract_name,role").eq("id", u.id).maybeSingle(), "profiles"); if (!pr) throw new Error("No profile");
  ck(await sb.from("profiles").update({ contract_name: n }).eq("id", u.id).select(), "profiles");
  ck(await sb.from("audit_log").insert({ by: null, action: "Name corrected", detail: `${pr.contract_name || "(none)"} → ${n} (on the owner's request)` }), "audit");
  return { from: pr.contract_name || "", to: n };
}
export async function status(sb, u) {
  const id = u.id, one = async (t, col, v, sel = "*") => ck(await sb.from(t).select(sel).eq(col, v).maybeSingle(), t);
  const [prof, join, agr, prog, acc] = await Promise.all([one("profiles", "id", id), one("join_requests", "user_id", id), one("agreements", "id", id),
    one("academy_progress", "id", id), sb.from("access_log").select("data,updated_at").eq("owner_id", id).then(r => (r.data || [])[0] || null)]);
  const onTeam = !!(prof && prof.active && prof.data && prof.data.roster);
  const step = onTeam ? "team member (" + prof.role + ")" : agr ? "agreement " + ((agr.data || {}).status || "?") : join ? "asked for assessment" : (prog && (prog.data || {}).completedAt) ? "academy done, not yet asked for assessment" : "joining steps (offer and academy)";
  return { login: true, confirmed: !!(u.email_confirmed_at || u.confirmed_at), created: u.created_at, lastSignIn: u.last_sign_in_at || null, lastOpened: acc ? (acc.data || {}).lastSeen || acc.updated_at : null,
    name: (prof && prof.contract_name) || (join && (join.data || {}).contractName) || "", step, onTeam };
}
export async function resetJoining(sb, u, why) {
  const id = u.id, done = [], before = await status(sb, u);
  const pr = ck(await sb.from("profiles").select("role").eq("id", id).maybeSingle(), "profiles"); if (pr && pr.role === "owner") throw new Error("Owners are never reset");
  const del = async (t, col, what) => { const r = await sb.from(t).delete().eq(col, id).select(); ck(r, t); if ((r.data || []).length) done.push(what); };
  await del("join_requests", "user_id", "request"); await del("agreements", "id", "agreement"); await del("academy_progress", "id", "academy progress");
  const p = ck(await sb.from("profiles").update({ active: false, book: false, supervised: false, contract_name: "", data: {} }).eq("id", id).select(), "profiles");
  if ((p || []).length && before.onTeam) done.push("team access");
  ck(await sb.from("audit_log").insert({ by: null, action: "Joining started again", detail: `${before.name || "person " + id.slice(0, 8)}: ${done.join(", ") || "nothing to remove"} (${why})` }), "audit");
  return { before: before.step, removed: done };
}
export async function ownerToJoining(sb, u, why) {
  const pr = ck(await sb.from("profiles").select("role,active,contract_name").eq("id", u.id).maybeSingle(), "profiles");
  if (!pr || pr.role !== "owner") throw new Error("This person is not an owner");
  const others = (ck(await sb.from("profiles").select("id,role,active").eq("role", "owner"), "profiles") || []).filter(p => p.id !== u.id && p.active);
  if (!others.length) throw new Error("Refused: no other active owner would be left");
  ck(await sb.from("profiles").update({ role: "broker", active: false, book: false, supervised: false }).eq("id", u.id).select(), "profiles");
  // off the alert recipients (owners receive alerts)
  try { const a = ck(await sb.from("alert_settings").select("id,data").eq("id", "settings").maybeSingle(), "alert_settings");
    if (a && ((a.data || {}).recipients || []).some(r => r.uid === u.id)) ck(await sb.from("alert_settings").update({ data: { ...a.data, recipients: a.data.recipients.filter(r => r.uid !== u.id) } }).eq("id", "settings").select(), "alert_settings"); } catch (e) {}
  ck(await sb.from("audit_log").insert({ by: null, action: "Owner rights removed: joining like any other", detail: `${pr.contract_name || "owner " + u.id.slice(0, 8)} (${why})` }), "audit");
  const r = await resetJoining(sb, u, why);
  return { was: "owner", removed: ["owner rights", ...r.removed] };
}
async function findOwner(sb, email, name) {
  if (email) return findUser(sb, email);
  const n = String(name || "").trim().toLowerCase(); if (n.length < 3) throw new Error("Give the email or the name");
  const hits = (ck(await sb.from("profiles").select("id,contract_name,role").eq("role", "owner"), "profiles") || []).filter(p => String(p.contract_name || "").toLowerCase().includes(n));
  if (hits.length !== 1) throw new Error(hits.length ? "More than one owner matches: use the email" : "No owner matches this name: use the email");
  const { data, error } = await sb.auth.admin.getUserById(hits[0].id); if (error) throw new Error("user: " + error.message); return data.user;
}
export async function removeTestTrip(sb, id, why) {
  if (!/^[\w-]{3,80}$/.test(id)) throw new Error("Give the trip id in NAME");
  const trips = ck(await sb.from("trips").select("owner_id,id,data").eq("id", id), "trips");
  if (!trips.length) return { trip: id, removed: false, note: "No trip with this id" };
  const out = [];
  for (const t of trips) {
    const st = (ck(await sb.from("trip_status").select("data").eq("owner_id", t.owner_id).eq("id", id), "status")[0] || {}).data || {};
    if ((st.receipts || []).length || (st.payouts || []).length || st.clientPaid || st.operatorPaid || st.state === "flown") throw new Error("Money or a flight is recorded on this trip: not removed");
    ck(await sb.from("trip_status").delete().eq("owner_id", t.owner_id).eq("id", id).select(), "status");
    ck(await sb.from("trips").delete().eq("owner_id", t.owner_id).eq("id", id).select(), "trips");
    out.push({ stage: (t.data || {}).stage || "", state: st.state || "" });
  }
  ck(await sb.from("audit_log").insert({ by: null, action: "Test trip removed", detail: `${id} (${why})` }), "audit");
  return { trip: id, removed: true, was: out };
}
export async function closeTestEnquiries(sb, before, why) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before)) throw new Error("Give the cut-off date in NAME, as YYYY-MM-DD");
  const rows = ck(await sb.from("website_enquiries").select("id,at,data").lt("at", before + "T00:00:00Z"), "enquiries").filter(r => !(r.data || {}).handled);
  for (const r of rows) ck(await sb.from("website_enquiries").update({ data: { ...(r.data || {}), handled: true, handledAt: new Date().toISOString(), handledNote: "test data, closed by the owner's request" } }).eq("id", r.id).select(), "enquiries");
  if (rows.length) ck(await sb.from("audit_log").insert({ by: null, action: "Test website enquiries closed", detail: `${rows.length} received before ${before} (${why})` }), "audit");
  return { before, closed: rows.length, received: rows.map(r => String(r.at || "").slice(0, 10)) };
}
// the result also goes into a job annotation, which Claude reads through the GitHub API (the plain log is not reachable from its workspace)
const note = o => { if (process.env.GITHUB_ACTIONS) console.log("::notice title=Admin result::" + JSON.stringify(o).replace(/%/g, "%25").replace(/\r?\n/g, " ")); };
export async function main(env = process.env, sb) {
  sb = sb || createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  const action = env.ACTION, email = env.EMAIL, name = env.NAME, why = `on the owner's request, GitHub run ${env.GITHUB_RUN_ID || "local"}`;
  if (action === "trim-leads") { const u0 = await findUser(sb, email); if (!u0) throw new Error("No login with this email"); const out = { email: mask(email), ...(await trimLeads(sb, u0, Math.max(1, Math.min(40, Number(env.KEEP) || 10)))) }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "remove-test-trip") { const out = await removeTestTrip(sb, String(name || "").trim(), why); console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "close-test-enquiries") { const out = await closeTestEnquiries(sb, String(name || "").trim(), why); console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "owner-to-joining") { const u0 = await findOwner(sb, email, name); if (!u0) throw new Error("No login found"); const r0 = await ownerToJoining(sb, u0, why), out = { email: mask(u0.email), ...r0, now: (await status(sb, u0)).step }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "people-status") { const out = await peopleStatus(sb); console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "alerts-status") { const out = await alertsStatus(sb); console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "leads-status") { const u0 = email ? await findUser(sb, email) : null, out = await leadsStatus(sb, u0); console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (!["person-status", "reset-joining", "reset-next-login", "cancel-reset-next", "set-name"].includes(action)) throw new Error("Unknown action " + action);
  const u = email ? await findUser(sb, email) : name ? await findByName(sb, name) : null;
  if (!email && !name) throw new Error("Give an email or a name");
  if (!u) { const out = { email: mask(email), login: false, note: "No login with this email: the person has never signed in or signed up. Create the login in Supabase > Authentication > Users > Add user." }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "cancel-reset-next") { const out = { email: mask(email || u.email), ...(await cancelResetNext(sb, u)) }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "set-name") { const out = { email: mask(email || u.email), ...(await setName(sb, u, env.NEW_NAME)) }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "reset-next-login") { const st = await status(sb, u), out = { email: mask(email || u.email), name: st.name, step: st.step, ...(await resetNext(sb, u, st.name)) }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  if (action === "person-status") { const out = { email: mask(email), ...(await status(sb, u)) }; console.log(JSON.stringify(out, null, 1)); note(out); return out; }
  const r = await resetJoining(sb, u, why), out = { email: mask(email), ...r, now: (await status(sb, u)).step };
  console.log(JSON.stringify(out, null, 1)); note(out); return out;
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error("FAILED: " + e.message); if (process.env.GITHUB_ACTIONS) console.log("::error title=Admin failed::" + String(e.message).slice(0, 300)); process.exit(1); });
