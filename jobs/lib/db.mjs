// Database access for the scheduled jobs. Uses the Supabase SECRET key (server only, bypasses the
// access rules), so it must only ever run on GitHub Actions with the key stored as a repository secret.
// Paths are the portal's paths ("prospects/p001", "leads/<uid>/items/<id>", "config/assign"), mapped to
// the same tables as apps/portal/platform.js.
import { createClient } from "@supabase/supabase-js";

export function connect(client) {
  const sb = client || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  const KV = { config: "config", intel: "intel", locks: "locks" };
  const OWNED = { desk: ["trips", "deals"], status: ["trip_status", "deals"], payouts: ["payouts", "months"], leads: ["leads", "items"] };
  const route = path => {
    const p = path.split("/").filter(Boolean);
    if (KV[p[0]]) return { kind: "kv", table: KV[p[0]], id: p[1] };
    if (p[0] === "prospects") return { kind: "row", table: "prospects", id: p[1] };
    if (p[0] === "owner") return { kind: "row", table: "owner_prospects", id: p[1] };
    if (OWNED[p[0]] && p[2] === OWNED[p[0]][1]) return { kind: "owned", table: OWNED[p[0]][0], owner: p[1], id: p[3] };
    throw new Error("Unknown path " + path);
  };
  const ck = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };
  const now = () => new Date().toISOString();

  async function get(path) {
    const rt = route(path);
    let q = sb.from(rt.table).select("*");
    q = rt.kind === "kv" ? q.eq("key", rt.id) : rt.kind === "row" ? q.eq("id", rt.id) : q.eq("owner_id", rt.owner).eq("id", rt.id);
    const row = ck(await q.maybeSingle(), "get " + path);
    return row ? (rt.kind === "kv" ? row.value : row.data) : null;
  }
  async function set(path, data) {
    const rt = route(path);
    const row = rt.kind === "kv" ? { key: rt.id, value: data, updated_at: now() }
      : rt.kind === "row" ? { id: rt.id, data, updated_at: now() }
      : { owner_id: rt.owner, id: rt.id, data, updated_at: now() };
    ck(await sb.from(rt.table).upsert(row, { onConflict: rt.kind === "kv" ? "key" : rt.kind === "row" ? "id" : "owner_id,id" }), "set " + path);
  }
  async function update(path, patch) { const cur = await get(path); if (!cur) throw new Error("update of missing " + path); await set(path, { ...cur, ...patch }); }
  async function del(path) {
    const rt = route(path);
    let q = sb.from(rt.table).delete();
    q = rt.kind === "kv" ? q.eq("key", rt.id) : rt.kind === "row" ? q.eq("id", rt.id) : q.eq("owner_id", rt.owner).eq("id", rt.id);
    ck(await q, "delete " + path);
  }
  async function all(table, cols = "*") {
    const out = []; const size = 1000;
    for (let from = 0; ; from += size) {
      const rows = ck(await sb.from(table).select(cols).range(from, from + size - 1), "list " + table);
      out.push(...rows); if (rows.length < size) break;
    }
    return out;
  }
  // approved people as the portal's "roster": profiles marked roster, same field names as the portal
  async function roster() {
    const out = {};
    for (const r of await all("profiles")) {
      if (!r.data || !r.data.roster) continue;
      const d = { ...r.data }; delete d.roster;
      Object.assign(d, { contractName: r.contract_name, role: r.role, active: r.active, book: r.book, supervised: r.supervised, base: r.base, cert: r.cert, since: r.since });
      out[r.id] = d;
    }
    return out;
  }
  async function apply(w) {
    if (w.op === "set") return set(w.path, w.data);
    if (w.op === "update") return update(w.path, w.data);
    if (w.op === "delete") return del(w.path);
    throw new Error("Unknown op " + w.op);
  }
  async function lock(holder, minutes) {
    const cur = await get("locks/engine");
    if (cur && cur.holder && Date.parse(cur.until || 0) > Date.now()) return false;
    await set("locks/engine", { holder, by: holder, at: now(), until: new Date(Date.now() + minutes * 60000).toISOString() });
    return true;
  }
  async function unlock(holder) { await set("locks/engine", { holder: "", by: holder, until: now(), released: now() }); }
  return { sb, get, set, update, del, all, roster, apply, lock, unlock, now };
}
