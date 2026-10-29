// Live training for supervisors (Morten, 29 Oct 2026: "I need to have the supervisor to be able to do assessments and
// training, as well as sharing the screens during bookings"). Owners write the live session (config 'live') straight
// from the portal; anyone else with the "Train and share screen" right (profiles.data.rights.train) goes through here,
// because only owners may write config. The server always makes the caller the one who shares, checks that the
// watchers are active people, keeps the pages within what may be shared, and writes the syllabus results to the
// trainees' training records. One audit line per start and end. Environment as for /api/me.
// POST { action, ... } with the person's own sign-in token:
//   people   → the active people who can be chosen to watch
//   start    → { watchers, scope, hours, syl }  opens a session (refused while someone else's session is open)
//   syl      → { syl }  moves the syllabus of the caller's own open session
//   end      → ends the caller's own session (an owner can end anyone's)
//   lesson   → { course, lesson, title }  "lesson done" for each watcher of the caller's open session
//   done     → { course }  which lessons the watchers have done already
//   progress → everyone's training results, for the Team training table
const NEVER = new Set(["security", "settings"]);
const HOURS = new Set([1, 2, 4, 8]);
const COURSES = new Set(["fam", "full"]);
const SKIP_RUN = id => id === "course" || id === "onboarding" || id.startsWith("notice-");
const isId = s => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);
const open = l => !!(l && l.id && l.until && Date.parse(l.until) > Date.now());

export function cleanSyl(x = {}) {
  const course = COURSES.has(x.course) ? x.course : "fam", done = {};
  for (const [k, v] of Object.entries(x.done || {}).slice(0, 60)) if (/^[a-z0-9]{1,6}$/.test(k) && v === true) done[k] = true;
  return { on: !!x.on, course, idx: Math.max(0, Math.min(40, Math.floor(Number(x.idx) || 0))), done };
}
// the session as it is stored: the caller always shares; watchers only from the active people; pages never Security or Settings
export function buildLive(input, caller, people, { id, nowMs = Date.now() } = {}) {
  const x = input || {}, ids = new Set(people.map(p => p.id));
  const watchers = [...new Set((x.watchers || []).filter(w => isId(w) && w !== caller.id && ids.has(w)))].slice(0, 20);
  const scope = [...new Set((x.scope || []).filter(s => typeof s === "string" && /^[a-z]{2,20}$/.test(s) && !NEVER.has(s)))].slice(0, 20);
  if (!watchers.length) throw new Error("Tick who may watch.");
  if (!scope.length) throw new Error("Tick at least one page to share.");
  const hours = HOURS.has(Number(x.hours)) ? Number(x.hours) : 2;
  return { id, owner: caller.id, ownerName: caller.name || "", watchers, scope, at: new Date(nowMs).toISOString(), until: new Date(nowMs + hours * 3600e3).toISOString(), syl: cleanSyl(x.syl) };
}
export function mayTrain(prof) {
  if (!prof || prof.active === false || !prof.role) return false;
  return prof.role === "owner" || !!(((prof.data || {}).rights || {}).train);
}
export function mayEnd(cur, caller) { return !!cur && (cur.owner === caller.id || caller.role === "owner"); }

async function sb(path, opt = {}) {
  const KEY = process.env.SUPABASE_SECRET_KEY;
  const r = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opt, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(opt.headers || {}) } });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
}
const audit = (by, action, detail) => sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by, action, detail }) });
const setLive = value => sb("/rest/v1/config?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "live", value, updated_at: new Date().toISOString() }) });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: "not set up" });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const who = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(401).json({ error: "Sign in again." });
    const me = await who.json();
    const pr = await sb(`/rest/v1/profiles?select=id,role,active,contract_name,data&id=eq.${me.id}`), prof = (pr.body || [])[0];
    const b = req.body || {}, action = String(b.action || "");
    const assess = !!(prof && prof.active !== false && ((prof.data || {}).rights || {}).assess);
    if (action === "progress" ? !(mayTrain(prof) || assess || (prof && prof.role === "ops")) : !mayTrain(prof)) return res.status(403).json({ error: "You do not have the training right. Ask the director." });
    const caller = { id: me.id, role: prof.role, name: (((prof.data || {}).self || {}).preferredName) || prof.contract_name || "" };
    const ppl = await sb("/rest/v1/profiles?select=id,role,contract_name&active=eq.true&role=not.is.null");
    const people = (ppl.body || []).filter(p => p.role && p.id !== me.id).map(p => ({ id: p.id, name: p.contract_name || "", role: p.role }));
    const cr = await sb("/rest/v1/config?select=value&key=eq.live"), cur = ((cr.body || [])[0] || {}).value || null;

    if (action === "people") return res.status(200).json({ people });
    if (action === "start") {
      if (open(cur) && cur.owner !== me.id && prof.role !== "owner") return res.status(409).json({ error: `${cur.ownerName || "Someone"} is running a live session until ${cur.until.slice(11, 16)} UTC. Try again after it ends.` });
      const a = new Uint8Array(12); crypto.getRandomValues(a);
      const l = buildLive({ ...(b.live || {}), syl: b.live && b.live.syl }, caller, people, { id: Array.from(a, x => x.toString(16).padStart(2, "0")).join("") });
      const w = await setLive(l); if (!w.ok) return res.status(500).json({ error: "Could not start. Try again." });
      const names = l.watchers.map(id => (people.find(p => p.id === id) || {}).name || "someone").join(", ");
      await audit(me.id, "Live training started", `${names} · ${l.scope.join(", ")} · ${(Date.parse(l.until) - Date.parse(l.at)) / 3600e3} h`);
      return res.status(200).json({ live: l });
    }
    if (action === "syl") {
      if (!open(cur) || cur.owner !== me.id) return res.status(409).json({ error: "This is not your session." });
      const l = { ...cur, syl: cleanSyl(b.syl) }; const w = await setLive(l);
      return w.ok ? res.status(200).json({ live: l }) : res.status(500).json({ error: "Could not save." });
    }
    if (action === "end") {
      if (!mayEnd(cur, caller)) return res.status(409).json({ error: "This is not your session." });
      const w = await setLive({ ended: new Date().toISOString(), by: me.id }); if (w.ok) await audit(me.id, "Live training ended", "");
      return w.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: "Could not end. Try again." });
    }
    if (action === "lesson" || action === "done") {
      if (!open(cur) || cur.owner !== me.id) return res.status(409).json({ error: "This is not your session." });
      const course = COURSES.has(b.course) ? b.course : "fam", watchers = (cur.watchers || []).filter(isId);
      if (action === "done") {
        const out = {};
        for (const w of watchers) { const q = await sb(`/rest/v1/training_runs?select=id&owner_id=eq.${w}&id=like.syl-${course}-*`); (q.body || []).forEach(r => { out[r.id.slice(5 + course.length)] = true; }); }
        return res.status(200).json({ done: out });
      }
      const lesson = String(b.lesson || ""); if (!/^[a-z0-9]{1,6}$/.test(lesson)) return res.status(400).json({ error: "Unknown lesson." });
      const title = String(b.title || "").replace(/[\u0000-\u001f<>]/g, " ").slice(0, 160), at = new Date().toISOString();
      const rows = watchers.map(w => ({ owner_id: w, id: `syl-${course}-${lesson}`, data: { kind: "syllabus", course, lesson, title, at, by: me.id }, updated_at: at }));
      const w = await sb("/rest/v1/training_runs?on_conflict=owner_id,id", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
      if (!w.ok) return res.status(500).json({ error: "Could not save." });
      await audit(me.id, "Training lesson done", `${watchers.map(id => (people.find(p => p.id === id) || {}).name || "someone").join(", ")} · ${title}`);
      return res.status(200).json({ ok: true });
    }
    if (action === "progress") {
      const q = await sb("/rest/v1/training_runs?select=owner_id,id,data&limit=5000"), ids = new Set(people.map(p => p.id).concat(me.id)), runs = {};
      (q.body || []).forEach(r => { if (!ids.has(r.owner_id) || SKIP_RUN(r.id)) return; (runs[r.owner_id] = runs[r.owner_id] || {})[r.id] = r.data; });
      return res.status(200).json({ runs, people });
    }
    return res.status(400).json({ error: "Unknown action." });
  } catch (e) { return res.status(400).json({ error: String(e.message || e).slice(0, 160) }); }
}
