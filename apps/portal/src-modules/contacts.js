/* ---------- Named business contacts on prospects (rule approved by Morten, 20 Oct 2026; see CLAUDE.md) ----------
   Business contacts only: a professional in a business role at an organisation, with work email or phone as published by
   the organisation itself or taken from a licensed professional database. Brokers see contacts only on their own leads.
   Opening the contacts on a shared prospect or lead is recorded in the access log. An opt-out deletes the person's details
   and stores only one-way codes (hashes), so they can never be added again by anyone. */
const CT_WEBMAIL = /@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|mac|aol|proton|protonmail|gmx|mail|yandex|qq|163|126|naver|hanmail)\./i;
const CT_SOURCES = ["Organisation's own website", "Licensed professional database", "Business card or meeting"];
const ctNorm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const ctOrg = s => ctNorm(s).replace(/\b(ltd|limited|pte|llc|inc|co|company|group|the)\b/g, "").replace(/\s+/g, " ").trim();
async function ctSha(s){ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function ctHashes(c, org){ const h = []; if (c.email) h.push(await ctSha("e:" + String(c.email).toLowerCase().trim())); if (c.name) h.push(await ctSha("n:" + ctNorm(c.name) + "|" + ctOrg(org))); return h; }
function ctPath(where, id){ return where === "inv" ? "owner/" + id : where === "lead" ? `leads/${S.uid}/items/${id}` : "prospects/" + id; }
function ctRec(where, id){ return where === "inv" ? (S.inv || {})[id] : where === "lead" ? S.leads[id] : S.prospects[id]; }
function contactsHtml(rec, where, id){
  const list = rec.contacts || [], key = where + ":" + id;
  S.ctShown = S.ctShown || {};
  const shown = where === "inv" || S.ctShown[key];
  const rules = `<p class="small muted">Business contacts only: work details as published by the organisation or from a licensed database. In the first message, say where you found them and offer an opt-out. If someone opts out, press <b>Opted out</b>: their details are deleted from every list.</p>`;
  if (!shown) return `<div><h3>Business contacts</h3><p class="small">${list.length ? `${list.length} named contact${list.length > 1 ? "s" : ""} on file.` : "No named contacts yet."} <button class="btn small" type="button" data-ct="show" data-where="${where}" data-id="${esc(id)}">Show${list.length ? "" : " and add"} · opening is recorded</button></p>${rec.optedOutNote ? `<p class="small muted">${esc(rec.optedOutNote)}</p>` : ""}</div>`;
  return `<div><h3>Business contacts</h3>${rules}
    ${list.length ? `<ul class="avs">${list.map((c, i) => `<li><span class="avt">${esc(c.role || "Contact")}</span> <b>${esc(c.name)}</b>${c.email ? ` · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}${c.phone ? ` · ${esc(c.phone)}` : ""}<br><span class="small muted">${c.source && /^https?:/.test(c.source) ? `<a href="${esc(c.source)}" target="_blank" rel="noopener">source</a>` : esc(c.source || "")}${c.sourceType ? " · " + esc(c.sourceType) : ""} · added ${fmtD(c.added)}${c.lastContact ? " · last contact " + fmtD(c.lastContact) : ""}</span>
      <span class="row" style="margin-top:4px"><button class="btn small" type="button" data-ct="touch" data-where="${where}" data-id="${esc(id)}" data-i="${i}">Contacted today</button><button class="btn small danger" type="button" data-ct="opt" data-where="${where}" data-id="${esc(id)}" data-i="${i}">Opted out</button></span></li>`).join("")}</ul>` : `<p class="small muted">No named contacts yet.</p>`}
    ${rec.optedOutNote ? `<p class="small muted">${esc(rec.optedOutNote)}</p>` : ""}
    <details class="small"><summary>Add a business contact</summary><form class="fgrid" data-ctform="${where}" data-id="${esc(id)}" style="margin-top:8px">
      <label class="f" for="ct_name">Name<input id="ct_name" required></label>
      <label class="f" for="ct_role">Role<input id="ct_role" required placeholder="Head of Travel"></label>
      <label class="f" for="ct_email">Work email<input id="ct_email" type="email" placeholder="name@company.com"></label>
      <label class="f" for="ct_phone">Work phone<input id="ct_phone"></label>
      <label class="f" for="ct_srct">Where it comes from<select id="ct_srct">${CT_SOURCES.map(s => `<option>${esc(s)}</option>`).join("")}</select></label>
      <label class="f" for="ct_src">Source (web page or database name)<input id="ct_src" required></label>
      <div class="row" style="align-self:end"><button class="btn primary" type="submit">Save contact</button></div></form></details></div>`;
}
async function ctSave(where, id, patch){
  const rec = ctRec(where, id); if (!rec) return;
  if (where === "inv") await S.db.doc(ctPath(where, id)).set({...rec, ...patch}); else await S.db.doc(ctPath(where, id)).update(patch);
}
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-ct]"); if (!el) return;
  const where = el.dataset.where, id = el.dataset.id, rec = ctRec(where, id); if (!rec) return;
  if (where === "inv" && !(S.isOwner && !S.preview)) return;
  if (el.dataset.ct === "show") { S.ctShown = S.ctShown || {}; S.ctShown[where + ":" + id] = true; if (where !== "inv") audit("Business contacts viewed", rec.org || id); render(); return; }
  const i = +el.dataset.i, c = (rec.contacts || [])[i]; if (!c) return;
  if (el.dataset.ct === "touch") { const list = rec.contacts.slice(); list[i] = {...c, lastContact: now()}; await ctSave(where, id, {contacts: list}); toast("Marked as contacted today."); return; }
  if (el.dataset.ct === "opt") {
    if (!el.dataset.armed) { el.dataset.armed = "1"; el.textContent = "Click again: delete their details"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Opted out"; } }, 6000); return; }
    try {
      for (const h of await ctHashes(c, rec.org)) await S.db.doc("optouts/" + h).set({at: now()});
      const list = rec.contacts.filter((_, j) => j !== i);
      await ctSave(where, id, {contacts: list, optedOutNote: `A contact opted out on ${fmtD(now())}. Their details were deleted.`});
      if (where !== "inv") audit("Business contact opted out", rec.org || id);
      toast("Deleted. They will not be added again, in any list.");
    } catch (err) { toast(err.code === "permission_denied" ? "Opt-outs are not set up yet (run 0005 in Supabase)." : "Could not save. Try again."); }
  }
});
document.addEventListener("submit", async e => {
  const f = e.target; if (!f.dataset || !f.dataset.ctform) return; e.preventDefault();
  const where = f.dataset.ctform, id = f.dataset.id, rec = ctRec(where, id); if (!rec) return;
  const c = {name: $("ct_name").value.trim(), role: $("ct_role").value.trim(), email: $("ct_email").value.trim().toLowerCase(), phone: $("ct_phone").value.trim(), sourceType: $("ct_srct").value, source: $("ct_src").value.trim(), added: now(), addedBy: S.uid};
  if (!c.name || !c.role || !c.source) { toast("Name, role and source are needed."); return; }
  if (/^(mr|mrs|ms|dr)\.?$/i.test(c.name)) { toast("Write the person's name."); return; }
  if (c.email && CT_WEBMAIL.test(c.email)) { toast("Work email only: personal addresses like Gmail are not allowed."); return; }
  if (!c.email && !c.phone) { toast("Add a work email or a work phone."); return; }
  const hs = await ctHashes(c, rec.org);
  if (hs.some(h => (S.optouts || {})[h])) { toast("This person has opted out. They cannot be added again."); return; }
  try { await ctSave(where, id, {contacts: [...(rec.contacts || []), c].slice(0, 10)}); toast("Contact saved."); render(); }
  catch (err) { toast("Could not save. Try again."); }
});
