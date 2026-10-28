/* ---------- See as a person (Morten, 28 Oct 2026, training findings 1 and 2: "consistency between what the brokers see
   and what I see when I switch", "Natalia should have prospects assigned but she cannot see them") ----------
   Owner only. The preview menu in the header lists every team member: choosing one shows the portal exactly as that
   person sees it (their Today, leads, trips, training), not a generic broker screen built on the owner's own data.
   Strictly read-only: while seeing as someone, every save, delete, upload and server action is refused, so nothing can
   be changed in their name. A bar at the top says whose portal it is, with Exit. */
(function(){
  const own = {leads: undefined, trRuns: undefined, myAsks: undefined}, as = {leads: {}, trRuns: {}, myAsks: {}};
  // these three follow the person being seen; the owner's own live updates keep landing in "own" meanwhile
  Object.keys(own).forEach(k => { own[k] = S[k]; Object.defineProperty(S, k, {configurable: true, get(){ return S.asUser ? as[k] : own[k]; }, set(v){ if (S.asUser && S.asSetting) as[k] = v; else own[k] = v; }}); });
  const WRITE = new Set(["set", "update", "delete", "add", "insert", "upsert", "upload", "remove", "rpc"]);
  const refuse = () => { toast("Read-only: you are seeing the portal as " + (S.asName || "this person") + ". Exit to make changes."); return Promise.reject(Object.assign(new Error("read-only preview"), {code: "preview_read_only"})); };
  // an empty stand-in target: the real objects can be frozen, which a proxy may not disguise
  function ro(obj){ return new Proxy({}, {has(_, k){ return k in obj; }, ownKeys(){ return Reflect.ownKeys(obj); }, getOwnPropertyDescriptor(_, k){ const d = Object.getOwnPropertyDescriptor(obj, k); return d ? {...d, configurable: true} : undefined; },
    get(_, k){ const t = obj, v = t[k]; if (typeof v !== "function") return (v && typeof v === "object" && (k === "storage" || k === "auth")) ? (k === "storage" ? ro(v) : v) : v;
    if (WRITE.has(k)) return refuse; return (...a) => { const r = v.apply(t, a); return r && typeof r === "object" && typeof r.then !== "function" ? ro(r) : r; }; }}); }
  let real = null;
  function enter(uid){
    const r = S.roster[uid]; if (!r || !S.isOwner) return;
    real = {uid: S.uid, db: S.db, sb: window.__sb, fetch: window.fetch, myRoster: S.myRoster, myName: S.myName, view: S.view, preview: S.preview, alsoBroker: S.alsoBroker};
    S.asUser = uid; S.asName = r.contractName || nm(uid); as.leads = {}; as.trRuns = {}; as.myAsks = {};
    S.db = ro(real.db); if (real.sb) window.__sb = ro(real.sb);
    window.fetch = (u, o) => (o && o.method && o.method !== "GET" && /\/api\//.test(String(u))) ? refuse() : real.fetch(u, o);
    S.uid = uid; S.myRoster = r; S.myName = S.asName; S.preview = r.role === "ops" ? "ops" : "broker"; S.alsoBroker = r.role === "ops" && !!r.book;
    const w = (path, k) => real.db.collection(path).onSnapshot(snap => { if (S.asUser !== uid) return; const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.asSetting = true; S[k] = o; S.asSetting = false; render(); });
    S.asSubs = [w(`leads/${uid}/items`, "leads"), w(`train/${uid}/runs`, "trRuns"), w(`asks/${uid}/items`, "myAsks")];
    S.view = "today"; S.sel = null; S.pSel = null; S.editing = false; render();
  }
  function exit(){
    if (!real) return; (S.asSubs || []).forEach(u => { try { typeof u === "function" ? u() : u && u.unsubscribe && u.unsubscribe(); } catch(e){} });
    S.asUser = null; S.asName = ""; S.db = real.db; if (real.sb) window.__sb = real.sb; window.fetch = real.fetch;
    S.uid = real.uid; S.myRoster = real.myRoster; S.myName = real.myName; S.preview = real.preview || null; S.alsoBroker = real.alsoBroker; S.view = "team"; S.sel = null; S.pSel = null; real = null; render();
  }
  const _rn = renderNow; renderNow = function(){ _rn();
    const sel = document.getElementById("previewSel");
    if (sel && S.isOwner && !sel.querySelector("optgroup")) {
      const people = Object.entries(S.roster || {}).filter(([, r]) => r.active !== false).sort((a, b) => (a[1].contractName || "").localeCompare(b[1].contractName || ""));
      if (people.length) { const g = document.createElement("optgroup"); g.label = "See as a person (read-only)";
        people.forEach(([id, r]) => { const o = document.createElement("option"); o.value = "as:" + id; o.textContent = (r.contractName || "Team member") + " (" + (r.role === "ops" ? "operations" : r.role) + ")"; if (S.asUser === id) o.selected = true; g.appendChild(o); });
        sel.appendChild(g); }
    }
    const main = document.getElementById("main");
    if (S.asUser && main && !document.getElementById("asBar")) { const b = document.createElement("div"); b.id = "asBar"; b.className = "note warn small"; b.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px";
      b.innerHTML = `<span>You are seeing the portal as <b>${esc(S.asName)}</b>, exactly as they see it. Read-only: nothing can be changed here.</span><button class="btn small" type="button" data-asexit="1">Exit</button>`; main.insertBefore(b, main.firstChild); }
  };
  document.addEventListener("change", e => { if (e.target.id !== "previewSel") return; const v = e.target.value;
    if (v.startsWith("as:")) { e.stopImmediatePropagation(); if (S.asUser) exit(); enter(v.slice(3)); return; }
    if (S.asUser) { e.stopImmediatePropagation(); exit(); if (v) { S.preview = v; S.view = v === "ops" ? "queue" : "trips"; render(); } } }, true);
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-asexit]")) { e.preventDefault(); exit(); } });
  window.__seeAs = {enter, exit};
})();
