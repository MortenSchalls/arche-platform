// Automatic sanctions pre-screen for operators (Morten, 20 Oct 2026).
// Downloads the official public lists on each run and compares organisation names (the operator and its owners).
// A possible match sends the operator to the owner for a decision; "no match" is recorded but a person still
// confirms the screen in the portal before the first booking. Lists that fail to download are reported, never guessed.
export const LISTS = [
  { id: "OFAC SDN", urls: ["https://www.treasury.gov/ofac/downloads/sdn.csv"], parse: csvCol(1) },
  { id: "OFAC alias", urls: ["https://www.treasury.gov/ofac/downloads/alt.csv"], parse: csvCol(3) },
  { id: "UN", urls: ["https://scsanctions.un.org/resources/xml/en/consolidated.xml"], parse: xmlTags(["FIRST_NAME", "ALIAS_NAME"]) },
  { id: "EU", urls: ["https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"], parse: csvHeader("NameAlias_WholeName", ";") },
  { id: "UK", urls: ["https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv", "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv"], parse: ukNames },
];

const SUFFIX = /\b(ltd|limited|pte|pvt|private|llc|l\.l\.c|inc|incorporated|co|corp|corporation|company|plc|sa|s\.a|ag|gmbh|bv|b\.v|nv|srl|s\.r\.l|spa|s\.p\.a|jsc|ojsc|pjsc|cjsc|oao|ooo|zao|fze|fzco|fzc|llp|lp|sdn|bhd|pt|tbk|kk|the|and|&)\b/g;
export const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9& ]+/g, " ").replace(SUFFIX, " ").replace(/\s+/g, " ").trim();

function splitCsvLine(line, sep = ",") {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === sep) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out;
}
function csvCol(i, sep = ",") { return text => text.split(/\r?\n/).map(l => splitCsvLine(l, sep)[i]).filter(Boolean); }
function csvHeader(name, sep = ",") {
  return text => { const lines = text.split(/\r?\n/); const h = splitCsvLine(lines[0] || "", sep); const i = h.indexOf(name); return i < 0 ? [] : lines.slice(1).map(l => splitCsvLine(l, sep)[i]).filter(Boolean); };
}
function xmlTags(tags) {
  return text => tags.flatMap(t => [...text.matchAll(new RegExp(`<${t}>([^<]+)</${t}>`, "g"))].map(m => m[1]));
}
function ukNames(text) {
  // both UK formats: find the header row, then take the name columns (Name 6 = whole name for entities; "Name" in the newer list)
  const lines = text.split(/\r?\n/); const hi = lines.findIndex(l => /name\s*6|^"?name"?,|,"?name"?,/i.test(l));
  if (hi < 0) return [];
  const h = splitCsvLine(lines[hi]).map(x => x.trim().toLowerCase());
  const cols = h.map((x, i) => (/^name\s*6$|^name$|^entity name$|^name non-latin script$/.test(x) ? i : -1)).filter(i => i >= 0);
  return lines.slice(hi + 1).flatMap(l => { const c = splitCsvLine(l); return cols.map(i => c[i]); }).filter(Boolean);
}

export async function loadLists(fetchFn = fetch, log = () => {}) {
  const names = new Map(), loaded = [], failed = [];
  for (const L of LISTS) {
    let ok = false;
    for (const url of L.urls) {
      try {
        const r = await fetchFn(url, { headers: { "user-agent": "ArcheExecutive-sanctions-screen/1.0" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const list = L.parse(await r.text()).map(norm).filter(n => n.length >= 4);
        if (list.length < 50) throw new Error("only " + list.length + " names");
        list.forEach(n => { if (!names.has(n)) names.set(n, L.id); });
        loaded.push(`${L.id} (${list.length})`); ok = true; break;
      } catch (e) { log(`  sanctions list ${L.id}: ${url} failed: ${e.message}`); }
    }
    if (!ok) failed.push(L.id);
  }
  return { names, loaded, failed };
}

const GENERIC = new Set("air airlines airline airways aviation aero aerospace jet jets charter charters flight flights executive business global international group holding holdings services service transport logistics trading general express star sky".split(" "));
// exact match after normalising, or every word of a listed name (two words or more) appears in our name
export function screen(orgNames, lists) {
  const hits = [];
  for (const raw of orgNames.filter(Boolean)) {
    const n = norm(raw); if (n.length < 3) continue;
    const words = new Set(n.split(" "));
    for (const [listed, list] of lists.names) {
      const lw = listed.split(" ");
      if (listed !== n && lw.every(w => GENERIC.has(w))) continue;   // "global aviation" alone is not a match
      if (listed === n || (lw.length >= 2 && lw.every(w => words.has(w)) && lw.join("").length >= 8)) { hits.push({ name: raw, listed, list }); if (hits.length >= 5) return hits; }
    }
  }
  return hits;
}
