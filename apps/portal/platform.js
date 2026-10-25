/* Archē platform adapter.
   The portal was written for claude.ai, where it asks for abilities with claude.use("db"), "user", "sample",
   "assets", "downloads" and "mcp". This file supplies the same functions on top of Supabase and our own
   server, so the portal code itself barely changes. Load it before the portal's main script. */
(function () {
  "use strict";
  const CFG = window.ARCHE_CONFIG || {};
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  window.__sb = sb;

  /* ---------- sign-in gate ---------- */
  let resolveReady; const ready = new Promise(r => (resolveReady = r));
  async function gate() {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      // everyone signs in with their own password (Morten 23 and 25 Oct 2026): a temporary password, or a first
      // sign-in by email link, leads straight to choosing one; Microsoft sign-in does not need it
      const u = data.session.user || {}, viaMs = ((u.app_metadata || {}).provider || "") === "azure";
      let pw = false; try { pw = localStorage.getItem("arche.pwlogin") === "1"; } catch (e) {}
      if (!viaMs && !(u.user_metadata || {}).pw_set) { showSetPassword(data.session, pw); return; }
      resolveReady(data.session); return;
    }
    showLogin();
    sb.auth.onAuthStateChange((ev, session) => { if (session && ev === "SIGNED_IN") location.reload(); });
  }
  function showLogin() {
    const box = document.createElement("div");
    box.id = "archeLogin";
    box.innerHTML = `<style>#archeLogin{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#34373d;color:#f3f5f8;font-family:'Hanken Grotesk',system-ui,sans-serif;padding:16px}
      #archeLogin .card{width:100%;max-width:380px;background:#3d4047;border:1px solid #676b71;padding:28px}
      #archeLogin h1{font-family:Cinzel,serif;letter-spacing:.2em;font-weight:600;margin:0 0 4px;font-size:26px;text-align:center}
      #archeLogin p{color:#c6cbd2;font-size:14px;line-height:1.5}
      #archeLogin button,#archeLogin input{width:100%;box-sizing:border-box;height:44px;font:inherit;margin-top:10px}
      #archeLogin button{background:linear-gradient(#fafbfc,#c6cbd2);color:#24262a;border:0;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:13px;cursor:pointer}
      #archeLogin button.alt{background:transparent;color:#f3f5f8;border:1px solid #93979d}
      #archeLogin input{background:#2c2e33;color:#f3f5f8;border:1px solid #676b71;padding:0 12px}
      #archeLogin .msg{min-height:20px;font-size:13px;color:#a9bdd4}</style>
      <div class="card" role="dialog" aria-labelledby="alh"><h1 id="alh">ARCHĒ</h1><p style="text-align:center;letter-spacing:.3em;font-size:11px;margin-top:0">EXECUTIVE · BROKER PORTAL</p>
      <button type="button" id="alMs">Sign in with Microsoft</button>
      <p style="margin:18px 0 0">Or get a sign-in link by email:</p>
      <input id="alEm" type="email" autocomplete="email" placeholder="you@archeaviation.com" aria-label="Email">
      <button type="button" class="alt" id="alSend">Email me a sign-in link</button>
      <input id="alPw" type="password" autocomplete="current-password" placeholder="Password, if you were given one" aria-label="Password">
      <button type="button" class="alt" id="alPwGo">Sign in with password</button>
      <p class="msg" id="alMsg" aria-live="polite"></p>
      <p style="font-size:12px;color:#a8adb3">Access is for approved Archē Executive staff and brokers. After your first sign-in, the owner approves you.</p></div>`;
    (document.body ? Promise.resolve() : new Promise(r => addEventListener("DOMContentLoaded", r))).then(() => document.body.appendChild(box));
    const msg = t => { const m = document.getElementById("alMsg"); if (m) m.textContent = t; };
    box.addEventListener("click", async e => {
      if (e.target.id === "alMs") {
        const { error } = await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "email", redirectTo: location.origin + location.pathname } });
        if (error) msg("Microsoft sign-in is not switched on yet. Use the email link.");
      }
      if (e.target.id === "alPwGo") {
        const em = document.getElementById("alEm").value.trim(), pw = document.getElementById("alPw").value;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) || !pw) { msg("Enter your email address and password."); return; }
        try { localStorage.setItem("arche.pwlogin", "1"); } catch (err) {}
        const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
        if (error) { msg(/invalid/i.test(error.message) ? "Email or password not recognised." : error.message); return; }
        location.reload(); return;
      }
      if (e.target.id === "alSend") {
        const em = document.getElementById("alEm").value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg("Enter your email address."); return; }
        const { error } = await sb.auth.signInWithOtp({ email: em, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
        if (error) { msg(/rate/i.test(error.message) ? "Too many emails just now. Wait a few minutes and try again." : error.message); return; }
        msg("Link sent. Open the email (check spam) and click the link on this device.");
      }
    });
  }
  function showSetPassword(session, temp) {
    const box = document.createElement("div");
    box.id = "archeSetPw";
    box.innerHTML = `<style>#archeSetPw{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#34373d;color:#f3f5f8;font-family:'Hanken Grotesk',system-ui,sans-serif;padding:16px}
      #archeSetPw .card{width:100%;max-width:380px;background:#3d4047;border:1px solid #676b71;padding:28px}#archeSetPw p{color:#c6cbd2;font-size:14px;line-height:1.5}
      #archeSetPw input,#archeSetPw button{width:100%;box-sizing:border-box;height:44px;font:inherit;margin-top:10px}
      #archeSetPw input{background:#2c2e33;color:#f3f5f8;border:1px solid #676b71;padding:0 12px}
      #archeSetPw button{background:linear-gradient(#fafbfc,#c6cbd2);color:#24262a;border:0;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:13px;cursor:pointer}
      #archeSetPw .msg{min-height:20px;font-size:13px;color:#a9bdd4}</style>
      <div class="card" role="dialog" aria-labelledby="spH"><h2 id="spH" style="margin:0 0 6px;font-weight:500">Choose your own password</h2>
      <p>${temp ? "You signed in with a temporary password. Choose" : "Set"} a password that only you know: at least 10 characters. From now on you sign in with your email and this password.</p>
      <input id="spA" type="password" autocomplete="new-password" placeholder="New password" aria-label="New password">
      <input id="spB" type="password" autocomplete="new-password" placeholder="New password again" aria-label="New password again">
      <button type="button" id="spGo">Save and continue</button><p class="msg" id="spMsg" aria-live="polite"></p></div>`;
    (document.body ? Promise.resolve() : new Promise(r => addEventListener("DOMContentLoaded", r))).then(() => document.body.appendChild(box));
    box.addEventListener("click", async e => {
      if (e.target.id !== "spGo") return;
      const a = document.getElementById("spA").value, b = document.getElementById("spB").value, m = document.getElementById("spMsg");
      if (a.length < 10) { m.textContent = "At least 10 characters."; return; }
      if (a !== b) { m.textContent = "The two passwords are different."; return; }
      const { error } = await sb.auth.updateUser({ password: a, data: { pw_set: true } });
      if (error) { m.textContent = error.message; return; }
      try { localStorage.removeItem("arche.pwlogin"); } catch (err) {}
      location.reload();
    });
  }
  gate();

  /* ---------- path → table mapping ---------- */
  const KV = { config: "config", intel: "intel", locks: "locks" };
  const OWNED = { desk: ["trips", "deals"], status: ["trip_status", "deals"], payouts: ["payouts", "months"], leads: ["leads", "items"], asks: ["questions", "items"], req: ["step_requests", "items"] };
  const TRAIN = { runs: "training_runs", rp: "roleplay_runs" };
  const PROFILE_COLS = { contractName: "contract_name", role: "role", active: "active", book: "book", supervised: "supervised", base: "base", cert: "cert", since: "since" };

  function route(path) {
    const p = path.split("/").filter(Boolean);
    if (KV[p[0]]) return { kind: "kv", table: KV[p[0]], id: p[1] };
    if (p[0] === "faq") return { kind: "row", table: "faq", key: "id", id: p[1] };
    if (p[0] === "prospects") return { kind: "row", table: "prospects", key: "id", id: p[1] };
    if (p[0] === "progress") return { kind: "row", table: "academy_progress", key: "id", id: p[1] };   // academy: own progress (database rule)
    if (p[0] === "records") return { kind: "row", table: "academy_records", key: "id", id: p[1] };    // academy: director's training records
    if (p[0] === "certs") return { kind: "row", table: "certificates", key: "id", id: p[1] };         // academy: certificate register
    if (p[0] === "scores") return { kind: "row", table: "member_scores", key: "id", id: p[1] };   // weekly trust/performance history: owner only (database rule, 0010)
    if (p[0] === "agr") return { kind: "row", table: "agreements", key: "id", id: p[1] };         // agreements signed in the portal (database rule, 0009)
    if (p[0] === "pool") return { kind: "row", table: "enquiry_pool", key: "id", id: p[1] };       // enquiry pool: owner releases, brokers take (database rule, 0008)
    if (p[0] === "poolc") return { kind: "row", table: "enquiry_contacts", key: "id", id: p[1] };  // client details: owner, operations and the broker who has it
    if (p[0] === "rfqs") return { kind: "row", table: "rfqs", key: "id", id: p[1] };   // supplier quotes: staff only (database rule)
    if (p[0] === "optouts") return { kind: "row", table: "optouts", key: "id", id: p[1] };   // hashes only
    if (p[0] === "owner") return { kind: "row", table: "owner_prospects", key: "id", id: p[1] };   // investors and partners: owner only (database rule)
    if (p[0] === "audit") return { kind: "audit", table: "audit_log", id: p[1] };
    if (p[0] === "roster") return { kind: "profile", table: "profiles", id: p[1] };
    if (p[0] === "join") return { kind: "join", table: "join_requests", id: p[1] };
    if (p[0] === "access") return { kind: "access", table: "access_log", id: p[1] };
    if (p[0] === "enquiries") return { kind: "enq", table: "website_enquiries", id: p[1] };
    if (OWNED[p[0]] && p[2] === OWNED[p[0]][1]) return { kind: "owned", table: OWNED[p[0]][0], owner: p[1], id: p[3] };
    if (p[0] === "train" && TRAIN[p[2]]) return { kind: "owned", table: TRAIN[p[2]], owner: p[1], id: p[3] };
    throw Object.assign(new Error("Unknown path " + path), { code: "unknown_path" });
  }
  const fail = e => Object.assign(new Error(e.message || String(e)), { code: e.code === "42501" ? "permission_denied" : (e.code || "error") });

  function toDoc(r, rt) {
    switch (rt.kind) {
      case "kv": return { id: r.key, data: r.value };
      case "row": return { id: r.id, data: r.data };
      case "audit": return { id: String(r.id), data: { t: r.t, by: r.by, action: r.action, detail: r.detail } };
      case "profile": { const d = { ...(r.data || {}) }; for (const [k, c] of Object.entries(PROFILE_COLS)) if (r[c] !== null && r[c] !== undefined) d[k] = r[c]; delete d.roster; return { id: r.id, data: d }; }
      case "join": return { id: r.user_id, data: r.data };
      case "access": return { id: r.owner_id, data: r.data };
      case "owned": return { id: r.id, data: r.data };
      case "enq": return { id: r.id, data: { ...r.data, at: r.at, consent: r.consent, handled: r.handled } };
    }
  }
  function where(q, rt, withId) {
    switch (rt.kind) {
      case "kv": return withId ? q.eq("key", rt.id) : q;
      case "row": return withId ? q.eq("id", rt.id) : q;
      case "audit": return withId ? q.eq("id", rt.id) : q.order("t", { ascending: false }).limit(5000);
      case "profile": q = q.eq("data->>roster", "true"); return withId ? q.eq("id", rt.id) : q;
      case "join": return withId ? q.eq("user_id", rt.id) : q;
      case "access": return withId ? q.eq("owner_id", rt.id).eq("id", "last") : q.eq("id", "last");
      case "owned": q = q.eq("owner_id", rt.owner); return withId ? q.eq("id", rt.id) : q;
      case "enq": return withId ? q.eq("id", rt.id) : q.order("at", { ascending: false }).limit(300);
    }
  }
  function toRow(rt, data) {
    switch (rt.kind) {
      case "kv": return { key: rt.id, value: data, updated_at: new Date().toISOString() };
      case "row": return { id: rt.id, data, updated_at: new Date().toISOString() };
      case "audit": return { t: data.t || new Date().toISOString(), by: data.by || null, action: data.action || "", detail: data.detail || "" };
      case "profile": { const row = { id: rt.id, data: { ...data, roster: true } }; for (const [k, c] of Object.entries(PROFILE_COLS)) if (k in data) { row[c] = data[k]; delete row.data[k]; } if (!("active" in data)) row.active = true; return row; }
      case "join": return { user_id: rt.id, data, at: new Date().toISOString() };
      case "access": return { owner_id: rt.id, id: "last", data, updated_at: new Date().toISOString() };
      case "owned": return { owner_id: rt.owner, id: rt.id, data, updated_at: new Date().toISOString() };
    }
  }
  const conflictKey = rt => ({ kv: "key", row: "id", profile: "id", join: "user_id", access: "owner_id,id", owned: "owner_id,id" })[rt.kind];

  /* ---------- live updates: one realtime channel per table, re-reading the query on any change ---------- */
  const listeners = {};
  function liveTable(table, fn) {
    if (!listeners[table]) {
      listeners[table] = new Set();
      sb.channel("t_" + table).on("postgres_changes", { event: "*", schema: "public", table }, () => { clearTimeout(listeners[table].timer); listeners[table].timer = setTimeout(() => listeners[table].forEach(f => f()), 120); }).subscribe();
    }
    listeners[table].add(fn); return () => listeners[table].delete(fn);
  }

  function docRef(path) {
    const rt = route(path);
    const ref = {
      id: rt.id,
      async get() {
        const { data, error } = await where(sb.from(rt.table).select("*"), rt, true).maybeSingle();
        if (error) throw fail(error);
        const d = data ? toDoc(data, rt) : null;
        return { id: rt.id, exists: !!d, data: () => (d ? structuredClone(d.data) : undefined) };
      },
      async set(data) {
        if (rt.kind === "audit") { const { error } = await sb.from(rt.table).insert(toRow(rt, data)); if (error) throw fail(error); return; }
        if (rt.kind === "profile") { const { error } = await sb.from(rt.table).update(toRow(rt, data)).eq("id", rt.id); if (error) throw fail(error); return; }
        if (rt.kind === "enq") { const { error } = await sb.from(rt.table).update({ handled: !!data.handled, data: Object.fromEntries(Object.entries(data).filter(([k]) => !["at","consent","handled"].includes(k))) }).eq("id", rt.id); if (error) throw fail(error); return; }
        const { error } = await sb.from(rt.table).upsert(toRow(rt, data), { onConflict: conflictKey(rt) });
        if (error) throw fail(error);
      },
      async update(patch) {
        const cur = await ref.get(); if (!cur.exists) throw Object.assign(new Error("Document does not exist"), { code: "not_found" });
        await ref.set({ ...cur.data(), ...patch });
      },
      async delete() {
        if (rt.kind === "profile") { const { error } = await sb.from(rt.table).update({ active: false, data: {} }).eq("id", rt.id); if (error) throw fail(error); return; }
        const { error } = await where(sb.from(rt.table).delete(), rt, true); if (error) throw fail(error);
      },
      onSnapshot(fn, onErr) {
        const run = () => ref.get().then(fn, e => onErr && onErr(e));
        run(); return liveTable(rt.table, run);
      }
    };
    return ref;
  }
  function colRef(path) {
    const rt = route(path + "/_");
    const ref = {
      doc(id) { return docRef(path + "/" + (id || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 20) : Date.now().toString(36)))); },
      async get() {
        const { data, error } = await where(sb.from(rt.table).select("*"), rt, false);
        if (error) throw fail(error);
        const docs = (data || []).map(r => { const d = toDoc(r, rt); return { id: d.id, exists: true, data: () => structuredClone(d.data) }; });
        return { docs, size: docs.length, empty: !docs.length };
      },
      onSnapshot(fn, onErr) { const run = () => ref.get().then(fn, e => onErr && onErr(e)); run(); return liveTable(rt.table, run); }
    };
    return ref;
  }
  const db = Object.freeze({ doc: docRef, collection: colRef });
  /* signing: the person can only turn their own agreement from "sent" into "signed" (database rule) */
  window.__agrSign = async function (patch) {
    const s = await ready, uid = s.user.id;
    const { data: row } = await sb.from("agreements").select("*").eq("id", uid).maybeSingle();
    if (!row || !row.data || row.data.status !== "sent") return false;
    const data = { ...row.data, ...patch, status: "signed" };
    const { error } = await sb.from("agreements").update({ data, updated_at: new Date().toISOString() }).eq("id", uid).eq("data->>status", "sent");
    if (error) throw fail(error);
    const { data: after } = await sb.from("agreements").select("*").eq("id", uid).maybeSingle();
    return !!(after && after.data && after.data.status === "signed");
  };
  /* first come, first served: the update only succeeds while the enquiry is still open, so the first broker wins */
  window.__poolTake = async function (id) {
    const s = await ready, uid = s.user.id;
    const { data: row } = await sb.from("enquiry_pool").select("*").eq("id", id).maybeSingle();
    if (!row || !row.data || row.data.status !== "released") return false;
    const data = { ...row.data, status: "claimed", claimedBy: uid, claimedAt: new Date().toISOString(), how: "taken" };
    const { error } = await sb.from("enquiry_pool").update({ data, updated_at: new Date().toISOString() }).eq("id", id).eq("data->>status", "released");
    if (error) throw fail(error);
    const { data: after } = await sb.from("enquiry_pool").select("*").eq("id", id).maybeSingle();
    return !!(after && after.data && after.data.claimedBy === uid);
  };

  /* ---------- user ---------- */
  let profile = null;
  async function myProfile(session) {
    if (profile) return profile;
    const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    profile = data || { role: null, active: false }; return profile;
  }
  const user = {
    async id() { const s = await ready; return s.user.id; },
    async isOwner() { const p = await myProfile(await ready); return !!p.active && p.role === "owner"; },
    async canEdit() { const p = await myProfile(await ready); return !!p.active && (p.role === "owner" || p.role === "ops" || !!p.book); },
    async can() { return null; },
    async me() { const s = await ready; const p = await myProfile(s); return { id: s.user.id, name: p.contract_name || s.user.user_metadata?.full_name || s.user.email || "" }; },
    async profiles(ids) {
      const out = {}; if (!ids || !ids.length) return out;
      const { data } = await sb.from("profiles").select("id,contract_name").in("id", ids);
      (data || []).forEach(r => (out[r.id] = { id: r.id, name: r.contract_name || "" }));
      ids.forEach(i => out[i] || (out[i] = { id: i, name: "" })); return out;
    },
    async signOut() { await sb.auth.signOut(); location.reload(); }
  };

  /* ---------- AI (our server keeps the Anthropic key) ---------- */
  async function aiCall(input, opts = {}) {
    const s = await ready;
    const r = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + s.access_token }, body: JSON.stringify({ input, tier: opts.modelTier || "default", json: !!opts.json }), signal: opts.signal });
    if (r.status === 429) throw Object.assign(new Error("busy"), { code: "rate_limited" });
    if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) {}
      const code = r.status === 401 || r.status === 403 ? "not_granted" : (j.error === "setup" || j.error === "credit" || j.error === "key") ? "ai_" + j.error : "error";
      throw Object.assign(new Error(j.detail || "AI error " + r.status), { code, detail: j.detail || "" }); }
    const j = await r.json();
    if (opts.onText) try { opts.onText({ text: j.text, delta: j.text }); } catch (e) {}
    return { text: j.text, truncated: !!j.truncated };
  }
  const sample = Object.assign((input, opts) => aiCall(input, opts), {
    async json(input, opts = {}) {
      const { text } = await aiCall(input, { ...opts, json: true });
      const m = text.match(/[\[{][\s\S]*[\]}]/); if (!m) throw Object.assign(new Error("No JSON in answer"), { code: "bad_json" });
      return JSON.parse(m[0]);
    },
    async limits() { return { images: false }; }
  });

  /* ---------- files ---------- */
  const BUCKET = "portal-files";
  const assets = {
    async upload(blob) {
      const s = await ready; const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)).replace(/-/g, "");
      const { error } = await sb.storage.from(BUCKET).upload(`${s.user.id}/${id}`, blob, { contentType: blob.type || "application/octet-stream" });
      if (error) throw fail(error);
      return { id: `${s.user.id}/${id}`, url: "/_blob/" + encodeURIComponent(`${s.user.id}/${id}`), sizeBytes: blob.size, contentType: blob.type };
    },
    async list() { return { assets: [], usage: {} }; },
    async delete(id) { await sb.storage.from(BUCKET).remove([id]); }
  };
  async function signed(id) { const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(decodeURIComponent(id), 300); if (error) throw fail(error); return data.signedUrl; }
  const _fetch = window.fetch.bind(window);
  window.fetch = async (u, o) => { if (typeof u === "string" && u.startsWith("/_blob/")) return _fetch(await signed(u.slice(7)), o); return _fetch(u, o); };
  document.addEventListener("click", async e => {
    const a = e.target.closest && e.target.closest('a[href^="/_blob/"]'); if (!a) return;
    e.preventDefault(); const w = window.open("", "_blank"); try { const url = await signed(a.getAttribute("href").slice(7)); if (w) w.location = url; else location.href = url; } catch (err) { if (w) w.close(); alert("Could not open the file."); }
  }, true);

  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]); const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: filename }); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000); return { saved: true };
    }
  };

  /* ---------- claude.use() replacement ---------- */
  const caps = { db, user, sample, assets, downloads, mcp: null };
  window.claude = Object.freeze({ use: async name => { await ready; return caps[name] ?? null; } });
})();
