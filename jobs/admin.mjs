// Owner-requested admin actions that Claude can run at once (Morten, 28 Oct 2026: "when I ask for an immediate reset, I need
// you to be able to do so"). Runs only on GitHub Actions (workflow "Admin actions"), with the Supabase secret key stored as a
// repository secret; Claude starts it from the chat and never sees the key. Only the actions below exist. Every change is
// written to the portal's audit log. Logs show no email addresses.
//   ACTION=person-status  EMAIL=…   where the person is: login, last sign-in, joining step, team access
//   ACTION=reset-joining  EMAIL=…   back to step 1 (the offer): removes request, agreement, academy progress, team access;
//                                   keeps the login, leads, trips and training records (same as Team > Start joining again)
//   ACTION=reset-next-login EMAIL=… or NAME=…   the same reset, done the next time the person signs in (api/resetcheck.mjs)
//   ACTION=cancel-reset-next EMAIL=…  takes the person off that list again
//   ACTION=set-name EMAIL=… NEW_NAME=…  corrects the name shown in the portal (not the name in a signed agreement)
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
// the result also goes into a job annotation, which Claude reads through the GitHub API (the plain log is not reachable from its workspace)
const note = o => { if (process.env.GITHUB_ACTIONS) console.log("::notice title=Admin result::" + JSON.stringify(o).replace(/%/g, "%25").replace(/\r?\n/g, " ")); };
export async function main(env = process.env, sb) {
  sb = sb || createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  const action = env.ACTION, email = env.EMAIL, name = env.NAME, why = `on the owner's request, GitHub run ${env.GITHUB_RUN_ID || "local"}`;
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
