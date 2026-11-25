/* ---------- Documents on every trip (Morten, 25 Nov 2026: "I need to ensure all documents uploaded are saved per
   individual flight in the database, so all documents are easy to trace back ... there need to be a better confirmation")
   ----------
   Every file is stored under the trip it belongs to (uploader/trips/<trip>/<file>) and recorded on the trip with its type,
   name, size, who added it and when. After an upload the portal reads the trip back and asks storage whether the file is
   there; only then does it say "Saved". The trip's Documents panel lists every file of the booking in one place: the
   broker's uploads, each issued charter confirmation and the signed contract, each with Open and a stored check (Saved,
   Checking, Not found). Nothing is deleted from a trip: a wrong file is replaced by uploading the right one. */
const OP_DOC_KINDS = ["Operator quote", "AOC", "Insurance certificate", "Operator contract", "Safety audit"];
const DOC_KINDS = ["Operator quote", "AOC", "Insurance certificate", "Operator contract", "Safety audit", "Passport", "Trip risk screen", "Client safety disclosure", "Other"];
function tripDocList(t){
  const d = t.d || {}, st = t.st || {}, ref = st.ref || "", out = [];
  (d.docs || []).forEach(x => x && x.id && out.push({...x, src: "trip"}));
  (st.confRevs || (st.confIssued ? [st.confIssued] : [])).forEach(r => r && r.assetId && out.push({id: r.assetId, kind: "Charter confirmation", name: `${ref}${(r.rev || 1) > 1 ? " Rev " + r.rev : ""} Charter Confirmation.pdf`, at: r.at, by: r.by, src: "conf"}));
  [...(st.signedRevs || []), ...(st.signed ? [st.signed] : [])].forEach(g => g && g.assetId && !out.some(o => o.id === g.assetId) && out.push({id: g.assetId, kind: "Signed contract", name: g.file || "Signed contract.pdf", at: g.at, by: g.by, src: "signed", signer: g.name || ""}));
  return out.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}
const docSize = n => !n ? "" : n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(1) + " MB";
const DOC_STATE = {ok: ["ok", "Saved ✓"], missing: ["bad", "Not found: upload it again"], error: ["warn", "Could not check"], checking: ["", "Checking…"]};
function docChip(id){ const s = (S.docChk || {})[id] || "checking", [c, l] = DOC_STATE[s] || DOC_STATE.checking; return `<span class="chip ${c === "ok" ? "c-flown" : c === "bad" ? "c-cancelled" : c === "warn" ? "c-review" : ""}" data-dchk="${esc(id)}">${l}</span>`; }
async function docVerify(ids){
  S.docChk = S.docChk || {}; const todo = ids.filter(id => !S.docChk[id] || S.docChk[id] === "error"); if (!todo.length) return;
  let assets = null; try { assets = await claude.use("assets"); } catch(e){}
  for (const id of todo) {
    S.docChk[id] = "checking";
    if (!assets || typeof assets.check !== "function") { S.docChk[id] = "error"; }
    else { try { const r = await assets.check(id); S.docChk[id] = r && r.exists ? "ok" : "missing"; } catch(e){ S.docChk[id] = "error"; } }
    document.querySelectorAll(`[data-dchk="${CSS.escape(id)}"]`).forEach(el => { el.outerHTML = docChip(id); });
  }
}
function tripDocsPanel(t, canEdit){
  const list = tripDocList(t);
  if (list.length) setTimeout(() => docVerify(list.map(x => x.id)), 0);
  const rows = list.map(x => `<tr><td>${esc(x.kind || "Other")}${x.op ? `<br><span class="muted">${esc(x.op)}</span>` : ""}</td><td><a href="/_blob/${encodeURIComponent(x.id)}" target="_blank" rel="noopener">${esc(x.name || "file")}</a>${x.signer ? ` <span class="muted">· signed by ${esc(x.signer)}</span>` : ""}</td><td class="nowrap">${x.at ? esc(fmtT(x.at)) : ""}</td><td>${x.by ? esc(nm(x.by)) : ""}</td><td class="nowrap muted">${docSize(x.size)}</td><td>${docChip(x.id)}</td></tr>`).join("");
  return `<div id="secDocs"><h3>Documents</h3>
    ${list.length ? `<div style="overflow-x:auto;min-width:0"><table class="small" id="docTable"><thead><tr><th>Type</th><th>File</th><th>Added</th><th>By</th><th>Size</th><th>Stored</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="small muted" style="margin:4px 0 8px">${list.length} file${list.length === 1 ? "" : "s"} on this booking${(t.st || {}).ref ? ` (${esc(t.st.ref)})` : ""}. Every file is kept with the trip; a wrong file is replaced by uploading the right one.</p>` : `<p class="small muted">No documents on this booking yet.</p>`}
    ${canEdit ? `<div class="row"><select id="docKind" style="width:auto" aria-label="Document type">${DOC_KINDS.map(k => `<option>${esc(k)}</option>`).join("")}</select><input type="file" id="docFile" style="width:auto"><button class="btn small" type="button" data-act="upload">Attach</button></div><p class="small muted">Documents stay in the portal. Never send passports or contracts by email or chat.</p>` : ""}</div>`;
}
/* one way in for every file of a trip: stored under the trip, recorded, read back and checked */
async function saveTripDoc(t, file, kind){
  const assets = await claude.use("assets"); if (!assets) { toast("Document upload is not available for your access level."); return null; }
  toast(`Uploading ${file.name}…`);
  let r; try { r = await assets.upload(file, {folder: "trips/" + t.bid + "/" + t.did}); }
  catch(e){ toast(`Not saved: ${file.name} did not upload (${e && e.message ? e.message : "connection"}). Try again.`); return null; }
  const rec = {id: r.id, name: file.name, kind, at: now(), by: S.uid, size: file.size || r.sizeBytes || 0, type: file.type || r.contentType || ""};
  if (OP_DOC_KINDS.includes(kind) && ((freshTrip(t).d || {}).quote || {}).operator) rec.op = freshTrip(t).d.quote.operator;   // whose document it is
  try { await deskWrite(t, {docs: [...((freshTrip(t).d || t.d).docs || []).filter(x => x.id !== rec.id), rec]}, `Document attached: ${kind} (${file.name})`); }
  catch(e){ toast(`Not saved: ${file.name} uploaded but could not be recorded on the trip. Try again.`); return null; }
  let back = false; for (let i = 0; i < 20 && !back; i++) { back = ((freshTrip(t).d || {}).docs || []).some(x => x.id === rec.id); if (!back) await new Promise(r => setTimeout(r, 250)); }
  S.docChk = S.docChk || {}; delete S.docChk[rec.id];
  let stored = false; try { stored = !!(assets.check && (await assets.check(rec.id)).exists); } catch(e){}
  S.docChk[rec.id] = stored ? "ok" : "missing";
  if (back && stored) { audit("Document saved", `${(t.st || {}).ref || t.did} · ${kind} · ${file.name}`); toast(`Saved ✓ ${kind}: ${file.name} is stored with this trip.`); }
  else toast(`Check this file: ${file.name} ${back ? "is recorded but storage could not confirm it" : "could not be confirmed on the trip"}. Upload it again.`);
  if (typeof render === "function") render();
  return back && stored ? rec : null;
}
uploadDoc = async function(t){
  const f = ($("docFile") || {}).files && $("docFile").files[0]; if (!f) { toast("Choose a file first."); return; }
  await saveTripDoc(t, f, ($("docKind") || {}).value || "Other");
};
