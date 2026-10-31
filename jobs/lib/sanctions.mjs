// Automatic sanctions pre-screen for operators (Morten, 20 Oct 2026).
// Downloads the official public lists on each run and compares organisation names (the operator and its owners).
// A possible match sends the operator to the owner for a decision; "no match" is recorded but a person still
// confirms the screen in the portal before the first booking. Lists that fail to download are reported, never guessed.
// Asian lists added 31 Oct 2026 (Morten: "ADD any possible Asian (especially Singapore) lists"): Australia DFAT, Japan MOF,
// Thailand AMLO; the MAS Investor Alert List (Singapore) as a fraud flag, not a sanctions hit; the EU Air Safety List for
// operators. Sources and formats checked from GitHub on 31 Oct 2026. Not automated, with the reason: Singapore TSOFA First
// Schedule (the statute site refuses automated reads; MAS and MHA lists otherwise repeat the UN list, which is loaded),
// Malaysia MOHA (site unreachable from the job), Hong Kong and Korea (no own list).
// kind: "sanctions" stops a trip until the owner checks it; "alert" is a warning to check; "aviation" is the EU ban list.
import { readXlsx } from "./xlsx.mjs";
export const LISTS = [
  { id: "OFAC SDN", urls: ["https://www.treasury.gov/ofac/downloads/sdn.csv"], parse: csvCol(1) },
  { id: "OFAC alias", urls: ["https://www.treasury.gov/ofac/downloads/alt.csv"], parse: csvCol(3) },
  { id: "UN", urls: ["https://scsanctions.un.org/resources/xml/en/consolidated.xml"], parse: xmlTags(["FIRST_NAME", "ALIAS_NAME"]) },
  { id: "EU", urls: ["https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"], parse: csvHeader("NameAlias_WholeName", ";") },
  { id: "UK", urls: ["https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv", "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv"], parse: ukNames },
  { id: "Australia DFAT", urls: ["https://www.dfat.gov.au/sites/default/files/Australian_Sanctions_Consolidated_List.xlsx"], bin: true, parse: xlsxCol("Name of Individual or Entity") },
  { id: "Japan MOF", page: "https://www.mof.go.jp/policy/international_policy/gaitame_kawase/gaitame/economic_sanctions/list.html", link: /[^"' ]*shisantouketsu\d+\.xlsx/i, bin: true, parse: mofNames },
  { id: "Thailand AMLO", urls: ["https://aps.amlo.go.th/aps/public/thailandlist/search?un_name=&un_registration_number=&passport_no=&un_id="], parse: amloNames },
  { id: "MAS Investor Alert", kind: "alert", urls: ["https://www.mas.gov.sg/api/v1/ialsearch?rows=5000&start=0"], parse: masNames },
  { id: "EU Air Safety List", kind: "aviation", page: "https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en", link: /\/document\/download\/[^"' ]*filename=air-safety-list\.xlsx/i, bin: true, parse: aslNames, extra: aslStates },
];
export const KIND = Object.fromEntries(LISTS.map(L => [L.id, L.kind || "sanctions"]));

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

function xlsxCol(name) {
  return buf => readXlsx(buf).flatMap(sh => { const hi = sh.rows.findIndex(r => r.includes(name)); if (hi < 0) return []; const i = sh.rows[hi].indexOf(name); return sh.rows.slice(hi + 1).map(r => r[i]); }).filter(Boolean);
}
// Japan MOF: one sheet per programme; the English name column is headed 英語表記; rows marked 削除 are delisted
function mofNames(buf) {
  return readXlsx(buf).flatMap(sh => { const out = []; let col = -1;
    for (const r of sh.rows) {
      const h = r.findIndex(c => /英語表記/.test(c)); if (h >= 0) { col = h; continue; }
      if (col < 0 || /削除/.test(r[0] || "")) continue;
      String(r[col] || "").split(/_x000D_|\r?\n|;/).map(x => x.trim()).filter(x => /^[\x20-\x7E\u00C0-\u024F]+$/.test(x) && /[A-Za-z]{2}/.test(x)).forEach(x => out.push(x));
    }
    return out; });
}
// Thailand AMLO: HTML table, English name in the third cell of each row
function amloNames(text) {
  return [...text.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => [...m[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())).filter(c => c.length >= 3 && /^\d+$/.test(c[0])).map(c => c[2]).filter(Boolean);
}
// MAS Investor Alert List: JSON; the name, alternative and former names
function masNames(text) {
  const j = JSON.parse(text); return ((j.response || {}).docs || []).flatMap(d => [d.unregulatedpersons_s, d.alternativename_s, d.formername_s].flatMap(x => String(x || "").split(/;|\n/))).map(x => x.trim()).filter(Boolean);
}
// EU Air Safety List: Annex A and B, first column is the carrier's legal name; "All air carriers certified by ..." rows ban a whole state
const aslRows = buf => readXlsx(buf).filter(sh => /annex/i.test(sh.name)).flatMap(sh => sh.rows);
function aslNames(buf) { return aslRows(buf).map(r => String(r[0] || "").trim()).filter(n => n && !/^(all air carriers|annex|list of|disclaimer|name of the legal)/i.test(n) && n.length < 120); }
function aslStates(buf) { return [...new Set(aslRows(buf).filter(r => /^all air carriers certified/i.test(String(r[0] || ""))).map(r => String(r[3] || "").trim()).filter(Boolean))]; }

export async function loadLists(fetchFn = fetch, log = () => {}) {
  const names = new Map(), loaded = [], failed = [], extra = {};
  const H = { headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)" } };
  for (const L of LISTS) {
    let ok = false;
    let urls = L.urls || [];
    if (L.page) {
      try { const pr = await fetchFn(L.page, H); const m = (await pr.text()).match(L.link); if (m) urls = [new URL(m[0].replace(/&amp;/g, "&"), L.page).href]; else log(`  sanctions list ${L.id}: file link not found on ${L.page}`); }
      catch (e) { log(`  sanctions list ${L.id}: ${L.page} failed: ${e.message}`); }
    }
    for (const url of urls) {
      try {
        const r = await fetchFn(url, H);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const body = L.bin ? Buffer.from(await r.arrayBuffer()) : await r.text();
        const list = L.parse(body).map(norm).filter(n => n.length >= 4);
        if (list.length < (L.min || 50)) throw new Error("only " + list.length + " names");
        list.forEach(n => { if (!names.has(n)) names.set(n, L.id); });
        if (L.extra) extra[L.id] = L.extra(body);
        loaded.push(`${L.id} (${list.length})`); ok = true; break;
      } catch (e) { log(`  sanctions list ${L.id}: ${url} failed: ${e.message}`); }
    }
    if (!ok) failed.push(L.id);
  }
  return { names, loaded, failed, extra };
}

export const GENERIC = new Set("air airlines airline airways aviation aero aerospace jet jets charter charters flight flights executive business global international group holding holdings services service transport logistics trading general express star sky centre center airport airports terminal handling fbo ground support base company enterprises industries solutions systems management partners worldwide".split(" "));
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
