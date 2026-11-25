/* ---------- Fill the quote from the operator's quote (Morten, 25 Nov 2026, peer proposal P3: "All") ----------
   Leon and FL3XX bring Avinode quotes straight into the trip through Avinode's API, which Archē's Starter plan does not
   include. Until then, the broker pastes the text of the operator's quote (from Avinode's quote page, its email or the
   PDF) and the portal fills what it can recognise: price and currency, aircraft type, registration, operator and the
   Avinode trip ID. The broker checks every field before saving; nothing is copied out of Avinode in bulk (data rules). */
(function(){
  const CUR = {"USD":"USD","US$":"USD","$":"USD","EUR":"EUR","€":"EUR","GBP":"GBP","£":"GBP","CHF":"CHF","SGD":"SGD","HKD":"HKD","AED":"AED","JPY":"JPY","THB":"THB","AUD":"AUD"};
  const TYPES = /\b(Global\s?(?:7500|6500|6000|5500|5000|Express(?: XRS)?)|Challenger\s?\d{3}|Gulfstream\s?G?\d{3}(?:ER)?|G\d{3}(?:ER)?|Falcon\s?\d{1,4}[A-Z]{0,2}|Legacy\s?\d{3}|Praetor\s?\d{3}|Phenom\s?\d{3}E?|Citation\s?[A-Za-z0-9 ]{2,12}?(?=\b)|Learjet\s?\d{2}|Hawker\s?\d{3,4}[A-Z]{0,2}|King\s?Air\s?\d{3}|PC-?(?:12|24)|ACJ\s?\d{3}|BBJ\s?\d?|Embraer\s?Lineage\s?\d{4})\b/i;
  const TAIL = /\b((?:[A-Z]{1,2}|\d[A-Z]|[A-Z]\d)-[A-Z0-9]{3,5}|N\d{1,5}[A-Z]{0,2})\b/g;
  function parse(txt){
    const s = String(txt || "").replace(/ /g, " "), out = {};
    const pm = s.match(/(?:total|price|quote|amount|charter)[^\n\d]{0,40}?(USD|US\$|EUR|GBP|CHF|SGD|HKD|AED|JPY|THB|AUD|\$|€|£)\s?([\d.,' ]{3,})/i) || s.match(/(USD|US\$|EUR|GBP|CHF|SGD|HKD|AED|JPY|THB|AUD|€|£)\s?([\d][\d.,' ]{2,})/);
    if (pm) { out.cur = CUR[pm[1].toUpperCase()] || CUR[pm[1]] || "USD"; const raw = pm[2].trim().replace(/[' ]/g, ""); const n = /,\d{2}$/.test(raw) && raw.includes(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, ""); out.amount = Math.round(parseFloat(n)) || 0; }
    const ty = s.match(TYPES); if (ty) out.aircraft = ty[1].replace(/\s+/g, " ").trim();
    const op = s.match(/(?:operator|operated by|aoc holder)\s*[:\-]?\s*([A-Z][^\n,;]{2,60})/i); if (op) out.operator = op[1].trim();
    const av = s.match(/(?:trip\s*(?:id|no\.?|number)|avinode[^\n\d]{0,20})\s*[:#]?\s*([A-Z0-9-]{5,20})/i); if (av) out.avinode = av[1];
    const tails = [...s.matchAll(TAIL)].map(m => m[1]).filter(x => x !== out.avinode && !/^(AVN|USD|EUR|GBP|ID)/.test(x)); if (tails.length) out.tail = tails[0];
    // asked once (duplicates, 25 Nov 2026): year built, seats and the AOC number go to the quote and from there to the confirmation
    const yr = s.match(/(?:year(?: of manufacture| built)?|yom|built|manufactured)\s*[:\-]?\s*((?:19|20)\d{2})\b/i); if (yr) out.yom = yr[1];
    const se = s.match(/(?:seats|passenger seats|max(?:imum)? (?:pax|passengers)|pax capacity|capacity)\s*[:\-]?\s*(\d{1,2})\b/i) || s.match(/\b(\d{1,2})\s*(?:seats|seater)\b/i); if (se) out.seats = se[1];
    const ao = s.match(/\bAOC\s*(?:no\.?|number|nr\.?|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9.\/-]{2,24})/i); if (ao && !/^holder$/i.test(ao[1])) out.aoc = ao[1].replace(/[.,]$/, "");
    return out;
  }
  function fill(p){
    const set = (id, v) => { const el = $(id); if (el && v !== undefined && v !== "" && !el.value) { el.value = v; el.classList.add("filled"); } };
    set("q_op", p.operator); set("q_ac", p.aircraft); set("q_tl", p.tail); set("q_av", p.avinode); set("q_yom", p.yom); set("q_seats", p.seats); set("q_aoc", p.aoc);
    if (p.amount) { if (p.cur && p.cur !== "USD" && $("q_cur")) { $("q_cur").value = p.cur; if (typeof curSync === "function") curSync(); set("q_amt", p.amount); } else set("q_pr", p.amount); }
    if (typeof updatePreview === "function") try { updatePreview(); } catch (e) {}
    return ["operator", "aircraft", "tail", "avinode", "amount", "yom", "seats", "aoc"].filter(k => p[k]).length;
  }
  const _open = openEditor;
  openEditor = function(t){
    _open(t);
    const h = [...document.querySelectorAll("#edForm h3")].find(x => x.textContent.trim() === "Operator quote"); if (!h || $("avPaste")) return;
    h.insertAdjacentHTML("afterend", `<details class="small" id="avPasteBox" style="margin:4px 0 10px"><summary>Paste the operator's quote to fill the fields</summary>
      <p class="small muted">Copy the text of the quote from Avinode, the operator's email or its PDF and paste it here. The portal fills the price and currency, aircraft type, registration, operator and Avinode trip ID it can find; check each field before saving.</p>
      <textarea id="avPaste" rows="5" style="width:100%" aria-label="The operator's quote text"></textarea><div class="row" style="margin-top:6px"><button class="btn small" type="button" data-act="avFill">Fill the fields</button></div></details>`);
  };
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest('[data-act="avFill"]'); if (!b) return; ev.preventDefault(); ev.stopImmediatePropagation();
    const n = fill(parse(($("avPaste") || {}).value)); toast(n ? `Filled ${n} field${n > 1 ? "s" : ""}. Check each one before saving.` : "Nothing recognised. Fill the fields by hand.");
  }, true);
  window.avParse = parse;
})();
