// Reset at next sign-in (Morten, 28 Oct 2026, about Natalia: "wait for her next log in … so next time she logs in, it
// should be reset"). The owner, or Claude on the owner's request (Admin actions: reset-next-login), puts a person on the
// list intel/resetnext. When that person opens the portal after signing in again, the portal calls this function with
// their own sign-in token; if they signed in after being put on the list, their joining starts again from step 1 (the
// offer): request, agreement, academy progress and team access removed; login, leads and trips kept. Then they come off
// the list. Owners are never reset. Written to the audit log.
const SB = () => process.env.SUPABASE_URL, KEY = () => process.env.SUPABASE_SECRET_KEY;
async function q(path, opt = {}) {
  const r = await fetch(`${SB()}${path}`, { ...opt, headers: { apikey: KEY(), authorization: `Bearer ${KEY()}`, "content-type": "application/json", ...(opt.headers || {}) } });
  if (!r.ok) throw new Error(path.split("?")[0] + " " + r.status); return r.status === 204 ? null : r.json().catch(() => null);
}
export async function resetIfDue(user, db = q, now = Date.now()) {
  const row = ((await db("/rest/v1/intel?select=value&key=eq.resetnext")) || [])[0], list = ((row || {}).value || {}).list || [];
  const m = list.find(x => x.id === user.id); if (!m) return { reset: false };
  if (!(Date.parse(user.last_sign_in_at || 0) > Date.parse(m.at))) return { reset: false, waiting: true };
  const prof = ((await db(`/rest/v1/profiles?select=role,contract_name&id=eq.${user.id}`)) || [])[0] || {};
  const keep = list.filter(x => x.id !== user.id), save = () => db("/rest/v1/intel?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "resetnext", value: { list: keep }, updated_at: new Date(now).toISOString() }) });
  if (prof.role === "owner") { await save(); return { reset: false }; }
  const id = encodeURIComponent(user.id), del = t => db(`/rest/v1/${t}`, { method: "DELETE", headers: { prefer: "return=minimal" } });
  await del(`join_requests?user_id=eq.${id}`); await del(`agreements?id=eq.${id}`); await del(`academy_progress?id=eq.${id}`);
  await db(`/rest/v1/profiles?id=eq.${id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ active: false, book: false, supervised: false, contract_name: "", data: {} }) });
  await db("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: null, action: "Joining started again", detail: `${prof.contract_name || m.name || "person " + user.id.slice(0, 8)}: at next sign-in, as requested ${String(m.at).slice(0, 10)}` }) });
  await save();
  return { reset: true };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SB() || !KEY()) return res.status(200).json({ reset: false });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || KEY();
    const who = await fetch(`${SB()}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(200).json({ reset: false });
    return res.status(200).json(await resetIfDue(await who.json()));
  } catch (e) { return res.status(200).json({ reset: false, error: String(e.message || e).slice(0, 120) }); }
}
