/* ---------- Prospects get the same care as trips (Morten, 25 Nov 2026: "Need to update all prospects, operators,
   service partners and also the investors, not only clients!!!"; "prospects, thats the place we have daily searches for
   our database") ----------
   On every record in Prospects (organisations, operators, service partners) and on every investor record:
   - Checks and documents: the KYB check (KYC for a person) recorded with its date and how, and a reference the portal
     numbers itself (KYB-2026-XXXX), never typed; documents (AOC, insurance, audit report, agreement, register extract)
     stored under the record, recorded with type, size, who and when, and shown Saved only after storage confirms them.
   - Adding a prospect: the region follows the country, the source is the website when no other page is given, and a
     name or website already in the list is shown at once, so nothing is entered twice.
   Investor records stay Director-only (owner/<id>); prospect records are the shared list (prospects/<id>). */
const REC_KINDS = {operator: ["AOC", "Insurance certificate", "Safety audit report", "Operator agreement", "Company register extract", "Other"],
  service: ["Agreement", "Insurance certificate", "Company register extract", "Price list", "Other"],
  partner: ["Introducer agreement", "Company register extract", "Other"], client: ["Company register extract", "Other"],
  investor: ["NDA", "Company register extract", "Correspondence", "Other"]};
function recRefNew(isCompany, at){
  const pre = (isCompany ? "KYB" : "KYC") + "-" + String(at || now()).slice(0, 4) + "-";
  const used = new Set([...Object.values(S.prospects || {}), ...Object.values(S.inv || {})].map(x => ((x || {}).kyb || {}).ref).filter(Boolean));
  for (let i = 0; i < 40; i++) { const r = pre + Math.floor(Math.random() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0"); if (!used.has(r)) return r; }
  return pre + Date.now().toString(36).toUpperCase().slice(-4);
}
function recPanel(p, where, rid){
  p = {...p, id: rid || p.id};
  const kinds = REC_KINDS[where === "inv" ? "investor" : (p.kind || "client")] || REC_KINDS.client, k = p.kyb || {}, docs = (p.docs || []).filter(x => x && x.id);
  if (docs.length) setTimeout(() => typeof docVerify === "function" && docVerify(docs.map(x => x.id)), 0);
  const can = where === "inv" ? invOwner() : (S.isOwner || isStaff()) && !S.preview;
  return `<div class="panel" id="recPanel" style="padding:14px 16px;margin:8px 0"><h3 style="margin-top:0">Checks and documents</h3>
    <p class="small" style="margin:0 0 6px">${k.ref ? `<b>${esc(k.ref)}</b> · checked ${esc(fmtD(k.checkedAt))}${k.how ? ", " + esc(k.how) : ""} by ${esc(nm(k.by))}${String(k.checkedAt || "") < new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10) ? ' · <span class="chip c-returned">Over 12 months: check again</span>' : ""}` : `<span class="muted">No ${where === "inv" || p.kind !== "client" ? "KYB" : "KYC"} check recorded yet.</span>`}</p>
    ${can ? `<div class="fgrid"><label class="f" for="rc_at">Date of the check<input type="date" id="rc_at" max="${now().slice(0, 10)}" value="${esc(now().slice(0, 10))}"></label><label class="f" for="rc_how">How it was checked<input id="rc_how" placeholder="e.g. company register extract, owners and controllers, AOC with the authority"></label></div>
      <div class="row"><button class="btn small" type="button" data-rc="kyb|${esc(where)}|${esc(p.id)}">Record the check</button><span class="small muted">The portal sets the reference. Never an ID, passport or bank number.</span></div>` : ""}
    ${docs.length ? `<div style="overflow-x:auto;min-width:0"><table class="small" style="margin-top:8px"><thead><tr><th>Type</th><th>File</th><th>Added</th><th>By</th><th>Stored</th></tr></thead><tbody>${docs.map(x => `<tr><td>${esc(x.kind)}</td><td><a href="/_blob/${encodeURIComponent(x.id)}" target="_blank" rel="noopener">${esc(x.name)}</a></td><td class="nowrap">${esc(fmtT(x.at))}</td><td>${esc(nm(x.by))}</td><td>${typeof docChip === "function" ? docChip(x.id) : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="small muted" style="margin:6px 0">No documents on this record yet.</p>`}
    ${can ? `<div class="row" style="margin-top:6px"><select id="rc_kind" style="width:auto" aria-label="Document type">${kinds.map(x => `<option>${esc(x)}</option>`).join("")}</select><input type="file" id="rc_file" style="width:auto" aria-label="Document file"><button class="btn small" type="button" data-rc="doc|${esc(where)}|${esc(p.id)}">Attach</button></div>` : ""}</div>`;
}
async function recWrite(where, id, patch){
  if (where === "inv") { const p = (S.inv || {})[id]; await invSet(id, {...p, ...patch}); }
  else await S.db.doc("prospects/" + id).update(patch);
}
(function(){
  const _vp = vProspects;
  vProspects = function(){ const h = _vp(); const p = S.pSel && (S.prospects || {})[S.pSel]; return p && !S.pNew ? h.replace(`<div><h3>Source</h3>`, recPanel(p, "pro", S.pSel) + `<div><h3>Source</h3>`) : h; };
  const _id = invDetail;
  invDetail = function(p){ const h = _id(p); return p ? h.replace(/<\/div>\s*$/, recPanel(p, "inv", p.id || S.invSel) + "</div>") : h; };
  document.addEventListener("click", async ev => {
    const b = ev.target.closest && ev.target.closest("[data-rc]"); if (!b) return; ev.preventDefault();
    const [a, where, id] = b.dataset.rc.split("|"), p = where === "inv" ? (S.inv || {})[id] : (S.prospects || {})[id]; if (!p) return;
    if (a === "kyb") {
      const at = ($("rc_at") || {}).value || "", how = (($("rc_how") || {}).value || "").trim().slice(0, 200);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(at) || at > now().slice(0, 10)) { toast("Enter the date of the check (not in the future)."); return; }
      if (/\b[A-Z]\d{7}[A-Z]\b|\b[A-Z]{1,2}\d{7,9}\b|\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b|\d{10,}/i.test(how.replace(/[\s-]/g, " "))) { toast("That looks like an ID, passport or account number. Describe how it was checked without it."); return; }   // a company number or a date is fine (review 25 Nov 2026)
      const person = where !== "inv" && p.kind === "client" && !p.segment, kyb = {ref: recRefNew(!person, at), checkedAt: at, how, by: S.uid, at: now()};
      try { await recWrite(where, id, {kyb, kybLog: [...(p.kybLog || []), kyb]}); /* no investor names in the shared audit log */ audit("Record check saved", where === "inv" ? `investor record ${id} · ${kyb.ref}` : `${p.org} · ${kyb.ref}`); toast(`Check recorded: ${kyb.ref}.`); render(); } catch(e){ toast("Could not save. Try again."); }
      return;
    }
    if (a === "doc") {
      const f = ($("rc_file") || {}).files && $("rc_file").files[0]; if (!f) { toast("Choose a file first."); return; }
      const kind = ($("rc_kind") || {}).value || "Other", assets = await claude.use("assets"); if (!assets) { toast("Document upload is not available for your access level."); return; }
      toast(`Uploading ${f.name}…`); b.disabled = true;
      try {
        const r = await assets.upload(f, {folder: (where === "inv" ? "investors/" : "records/") + id}), rec = {id: r.id, name: f.name, kind, size: f.size, by: S.uid, at: now()};
        await recWrite(where, id, {docs: [...(p.docs || []), rec]});
        let stored = false; try { stored = !!(assets.check && (await assets.check(rec.id)).exists); } catch(e){}
        S.docChk = S.docChk || {}; S.docChk[rec.id] = stored ? "ok" : "missing";
        audit("Record document saved", where === "inv" ? `investor record ${id} · ${kind}` : `${p.org} · ${kind} · ${f.name}`);
        toast(stored ? `Saved ✓ ${kind}: ${f.name} is stored with ${p.org}.` : `Check this file: ${f.name} could not be confirmed in storage. Upload it again.`); render();
      } catch(e){ toast(`Not saved: ${f.name} did not upload. Try again.`); }
      finally { b.disabled = false; }
    }
  });
  // adding a prospect: region from the country, source from the website, and what is already in the list
  const regionOf = c => { const n = {}; Object.values(S.prospects || {}).forEach(p => { if (p && p.country && p.region && p.country.toLowerCase() === String(c).toLowerCase()) n[p.region] = (n[p.region] || 0) + 1; }); return Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || ""; };
  const host = u => { try { return new URL(/^https?:/.test(u) ? u : "https://" + u).hostname.replace(/^www\./, ""); } catch(e){ return ""; } };
  const dupe = (org, web) => { const o = String(org || "").trim().toLowerCase(), h = host(web); if (o.length < 3 && !h) return null;
    return [...Object.values(S.prospects || {}), ...Object.values(S.leads || {})].find(p => p && ((o.length >= 3 && String(p.org || "").trim().toLowerCase() === o) || (h && host(p.website || p.source || "") === h))) || null; };
  document.addEventListener("input", ev => {
    const id = ev.target && ev.target.id; if (!["pf_org", "pf_web", "my_org", "my_web"].includes(id)) return;
    const pre = id.slice(0, 3), d = dupe(($(pre + "org") || {}).value, ($(pre + "web") || {}).value), box = $(pre + "org").closest("label");
    let n = $(pre + "dupe"); if (!n) { box.insertAdjacentHTML("beforeend", `<span class="small" id="${pre}dupe" role="status"></span>`); n = $(pre + "dupe"); }
    n.innerHTML = d ? `<b style="color:var(--warn)">Already in the list:</b> ${esc(d.org)}${d.city ? ", " + esc(d.city) : ""}` : "";
  });
  document.addEventListener("change", ev => {
    const id = ev.target && ev.target.id;
    if (id === "pf_cty") { const r = regionOf(ev.target.value), sel = $("pf_reg"); if (r && sel) { sel.value = r; sel.classList.add("filled"); } }
  });
  document.addEventListener("click", ev => {   // before the browser checks required fields
    const btn = ev.target.closest && ev.target.closest('button[type="submit"]'), f = btn && btn.form; if (!f || !["pForm", "myForm"].includes(f.id)) return;
    const pre = f.id === "pForm" ? "pf_" : "my_", src = $(pre + "src"), web = $(pre + "web");
    if (src && web && !src.value.trim() && web.value.trim()) src.value = web.value.trim();   // the website is the source when no other page is given
  }, true);
})();
Object.assign(FIELD_HELP, {
  pf_org: "The organisation's full name as on its own website. A name already in the list shows at once.",
  pf_seg: "The kind of organisation, for the reports and the rotation.", pf_kind2: "A client who may charter, a partner who may refer clients, or an operator.",
  pf_reg: "Set from the country when other records give it; change it if needed.", pf_cty: "The country of the organisation's office.",
  pf_prov: "Province or state, where it helps to find the office.", pf_city: "The city of the office.",
  pf_web: "The organisation's own home page. Used as the source when you give no other page.",
  pf_src: "The public page where you found it. Empty: the website is used.", pf_why: "One sentence on why they would charter or refer clients.",
  pf_app: "How to approach them, by role, never a private person.",
  my_org: "The organisation's full name as on its own website. A name already in the list shows at once.",
  my_web: "The organisation's own home page. Used as the source when you give no other page.", my_src: "The public page where you found it. Empty: the website is used.",
  my_avt: "An official business route: website form, company email, business phone or company page.", my_avu: "The link or the business number of that route.",
  rc_at: "The day the check was done.", rc_how: "What was checked and where: e.g. company register, owners of 25% or more, AOC with the authority. No ID numbers.",
  rc_kind: "What the file is: AOC, insurance certificate, agreement, register extract.", rc_file: "Choose the file. It is stored with this record and checked before the portal says Saved."
});
