/* In-memory stand-in for supabase-js, for testing platform.js without a network. Example data only. */
window.supabase = { createClient() {
  const T = window.__T = window.__T || {}; const subs = [];
  const get = (r, k) => k.includes("->>") ? String(((r[k.split("->>")[0]] || {})[k.split("->>")[1]]) ?? "") : r[k];
  function q(table) {
    let rows = () => (T[table] = T[table] || []), filt = [], op = "select", payload = null, single = false, conflict = null, ord = null;
    const api = {
      select() { return api; }, eq(k, v) { filt.push(r => String(get(r, k)) === String(v)); return api; }, in(k, vs) { filt.push(r => vs.includes(r[k])); return api; }, neq(k, v) { filt.push(r => String(get(r, k)) !== String(v)); return api; }, gte(k, v) { filt.push(r => String(get(r, k)) >= String(v)); return api; },
      order(k, o) { ord = [k, o && o.ascending === false ? -1 : 1]; return api; }, limit() { return api; }, maybeSingle() { single = true; return api; },
      upsert(row, o) { op = "upsert"; payload = row; conflict = (o && o.onConflict || "id").split(","); return api; },
      insert(row) { op = "insert"; payload = row; return api; }, update(row) { op = "update"; payload = row; return api; }, delete() { op = "delete"; return api; },
      then(ok, bad) { try { ok(run()); } catch (e) { (bad || ok)({ error: e }); } }
    };
    function run() {
      if ((window.__MISSING || []).includes(table)) return { data: null, status: 404, error: { code: "PGRST205", message: `Could not find the table 'public.${table}' in the schema cache` } };
      const m = r => filt.every(f => f(r));
      if (op === "select") { let out = rows().filter(m).map(r => JSON.parse(JSON.stringify(r))); if (ord) out.sort((a, b) => (a[ord[0]] > b[ord[0]] ? 1 : -1) * ord[1]); return { data: single ? out[0] || null : out, error: null, status: 200 }; }
      if (op === "insert") { rows().push({ id: rows().length + 1, ...payload }); }
      if (op === "upsert") { const i = rows().findIndex(r => conflict.every(c => r[c] === payload[c])); if (i >= 0) rows()[i] = { ...rows()[i], ...payload }; else rows().push(payload); }
      if (op === "update") rows().forEach((r, i) => { if (m(r)) rows()[i] = { ...r, ...payload, data: payload.data ? { ...payload.data } : r.data }; });
      if (op === "delete") T[table] = rows().filter(r => !m(r));
      subs.filter(s => s.table === table).forEach(s => setTimeout(s.fn, 0));
      return { data: null, error: null };
    }
    return api;
  }
  const session = { user: { id: window.__UID, email: "test@example.com", user_metadata: { pw_set: true } }, access_token: "x" };
  return {
    from: q,
    rpc: async (fn) => (window.__MISSING_FN || []).includes(fn) ? { data: null, error: { code: "PGRST202", message: "Could not find the function public." + fn } } : { data: false, error: null },
    auth: { getSession: async () => ({ data: { session } }), onAuthStateChange() {}, signOut: async () => {} },
    channel() { const c = { on(_e, f, fn) { subs.push({ table: f.table, fn }); return c; }, subscribe() { return c; } }; return c; },
    storage: { from() { return { upload: async () => ({ error: null }), createSignedUrl: async id => ({ data: { signedUrl: "data:text/plain,file" } }), remove: async () => ({}) }; } }
  };
} };
