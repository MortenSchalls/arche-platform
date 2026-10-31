// Automatic sanctions pre-screen for operators (Morten, 20 Oct 2026).
// Downloads the official public lists on each run and compares organisation names (the operator and its owners).
// A possible match sends the operator to the owner for a decision; "no match" is recorded but a person still
// confirms the screen in the portal before the first booking. Lists that fail to download are reported, never guessed.
// Asian lists added 31 Oct 2026 (Morten: "ADD any possible Asian (especially Singapore) lists"): Australia DFAT, Japan MOF,
// Thailand AMLO; the MAS Investor Alert List (Singapore) as a fraud flag, not a sanctions hit; the EU Air Safety List for
// operators. Sources and formats checked from GitHub on 31 Oct 2026.
// Workarounds (Morten, 31 Oct 2026: "see if we can get updated pdf ... always latest version"):
// - Singapore TSOFA First Schedule: the statute site (sso.agc.gov.sg) refuses requests from servers. The job asks the
//   Internet Archive to take a fresh copy of the official PDF of the Act (Save Page Now) and reads that copy, so it is the
//   current version on the day; the copy's date is recorded with the list. If no fresh copy can be made, the latest copy
//   is used and its date shows; older than 14 days counts as failed.
// - Malaysia MOHA: the ministry's site sends an incomplete certificate chain; the job fetches the missing intermediate
//   certificate named in the site's own certificate (AIA) and then checks the connection normally. The XML version of the
//   list is read (link found on the list page each time).
// Hong Kong and Korea have no own list.
// kind: "sanctions" stops a trip until the owner checks it; "alert" is a warning to check; "aviation" is the EU ban list.
import { readXlsx } from "./xlsx.mjs";
import tls from "node:tls"; import https from "node:https"; import crypto from "node:crypto";
import { execFileSync } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
export const LISTS = [
  { id: "OFAC SDN", urls: ["https://www.treasury.gov/ofac/downloads/sdn.csv"], parse: csvCol(1) },
  { id: "OFAC alias", urls: ["https://www.treasury.gov/ofac/downloads/alt.csv"], parse: csvCol(3) },
  { id: "UN", urls: ["https://scsanctions.un.org/resources/xml/en/consolidated.xml"], parse: xmlTags(["FIRST_NAME", "ALIAS_NAME"]) },
  { id: "EU", urls: ["https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"], parse: csvHeader("NameAlias_WholeName", ";") },
  { id: "UK", urls: ["https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv", "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv"], parse: ukNames },
  { id: "Australia DFAT", urls: ["https://www.dfat.gov.au/sites/default/files/Australian_Sanctions_Consolidated_List.xlsx"], bin: true, parse: xlsxCol("Name of Individual or Entity") },
  { id: "Japan MOF", page: "https://www.mof.go.jp/policy/international_policy/gaitame_kawase/gaitame/economic_sanctions/list.html", link: /[^"' ]*shisantouketsu\d+\.xlsx/i, bin: true, parse: mofNames },
  { id: "Thailand AMLO", urls: ["https://aps.amlo.go.th/aps/public/thailandlist/search?un_name=&un_registration_number=&passport_no=&un_id="], parse: amloNames },
  { id: "Singapore TSOFA", archive: "https://sso.agc.gov.sg/Act/TSFA2002?ViewType=Pdf", bin: true, min: 15, parse: tsofaNames },
  { id: "Malaysia MOHA", aia: true, page: "https://www.moha.gov.my/utama/index.php/en/component/content/article/350-list-of-ministries-of-home-affairs", link: /[^"' ]*SENARAI_KDN[^"' ]*_BI\.xml/i, urls: ["https://www.moha.gov.my/utama/images/Bahagian%20Keselamatan%20dan%20Ketenteraman%20Awam/SENARAI_KEMENTERIAN_DALAM_NEGERI/SENARAI_KDN_2026_BI.xml"], min: 30, parse: mohaNames },
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
// Malaysia MOHA XML: <field name="(3) Name"> and "(8) Other Names"; identity numbers and addresses are not read
function mohaNames(text) {
  const out = [];
  for (const m of text.matchAll(/<field name="\(\d+\)(?:&#10;|\s)*([^"]*)">([^<]*)<\/field>/g)) {
    const col = m[1].toLowerCase(), v = m[2].replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").trim();
    if (!v || v === "-") continue;
    if (/^name$|^name of|other names|alias/.test(col)) v.split(/;|\n|\s\/\s|,\s*(?=[A-Z][a-z]+ )/).map(x => x.replace(/^\(?[a-z]\)\s*/i, "").trim()).filter(x => x.length >= 3 && x !== "-").forEach(x => out.push(x));
  }
  return out;
}
// Singapore TSOFA First Schedule from the PDF of the Act: entries "(x) Name (nationality) (Date of Birth ...)."
export function tsofaText(buf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsofa-")), f = path.join(dir, "act.pdf"); fs.writeFileSync(f, buf);
  try { return execFileSync("pdftotext", [f, "-"], { maxBuffer: 50e6 }).toString(); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
export function tsofaNames(buf) {
  const txt = Buffer.isBuffer(buf) && buf.slice(0, 4).toString() === "%PDF" ? tsofaText(buf) : String(buf);
  const all = [...txt.matchAll(/FIRST SCHEDULE/g)].map(m => m.index), end = txt.lastIndexOf("SECOND SCHEDULE");
  const a = all.find(i => /Terrorists? and terrorist entities/i.test(txt.slice(i, i + 200)) && i > txt.length * 0.3) ?? all[1] ?? all[0];
  if (a == null) return [];
  const body = txt.slice(a, end > a ? end : undefined).replace(/Informal Consolidation[^\n]*\n?|Terrorism \(Suppression of\s+Financing\) Act 2002|2020 Ed\.|^\s*\d+\s*$/gm, " ").replace(/\[[^\]]*\]/g, " ").replace(/FIRST SCHEDULE[^\n]*\n/g, " ").replace(/\s+/g, " ");
  const stop = body.search(/\b3\.\s+In this Schedule/); const list = stop > 0 ? body.slice(0, stop) : body;
  const out = [];
  for (const m of list.matchAll(/\(([a-z]{1,3})\)\s+([A-Z][^()]{2,120}?)\s*(?=\(|\.\s|;|$)/g)) {
    const n = m[2].replace(/\s*(also known as|a\.k\.a\.?|alias)\b.*$/i, "").replace(/[,.;:\s]+$/, "").trim();
    if (n.split(" ").length <= 12 && !/^(the|any|a|an|in|of|this|where)\b/i.test(n) && !/^Deleted\b/.test(n)) n.split(/\s+@\s+/).forEach(x => out.push(x.trim()));
    for (const k of m[0].matchAll(/(?:also known as|a\.k\.a\.?|alias)\s+([^().;]+)/gi)) out.push(k[1].trim());
  }
  return out;
}
// fetch from a site whose certificate chain is incomplete: get the intermediate from the address in its certificate
const aiaCa = {};
export async function fetchAia(url, headers = {}) {
  const host = new URL(url).hostname;
  if (!aiaCa[host]) {
    const c = await new Promise((res, rej) => { const s = tls.connect(443, host, { servername: host, rejectUnauthorized: false }, () => { const x = s.getPeerCertificate(true); s.end(); res(x); }); s.on("error", rej); });
    const aia = ((c.infoAccess || {})["CA Issuers - URI"] || [])[0]; if (!aia) throw new Error("no intermediate certificate address");
    const der = Buffer.from(await (await fetch(aia)).arrayBuffer());
    aiaCa[host] = [...tls.rootCertificates, new crypto.X509Certificate(der).toString()];
  }
  return new Promise((res, rej) => {
    https.get(url, { ca: aiaCa[host], headers }, r => { const b = []; r.on("data", d => b.push(d)); r.on("end", () => { const body = Buffer.concat(b);
      res({ ok: r.statusCode >= 200 && r.statusCode < 300, status: r.statusCode, text: async () => body.toString("utf8"), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.length) }); }); }).on("error", rej);
  });
}
// the official file as copied today by the Internet Archive (or its latest copy); returns {res, at}
export async function viaArchive(url, fetchFn = fetch, headers = {}) {
  let raw = "", at = "";
  try { const s = await fetchFn("https://web.archive.org/save/" + url, { headers, redirect: "manual" }); const loc = s.headers && s.headers.get ? s.headers.get("location") || "" : ""; if (/\/web\/\d{14}\//.test(loc)) raw = loc; } catch (e) {}
  if (!raw) { const a = await (await fetchFn("https://archive.org/wayback/available?url=" + encodeURIComponent(url), { headers })).json(); raw = (((a || {}).archived_snapshots || {}).closest || {}).url || ""; }
  const m = raw.match(/\/web\/(\d{14})\//); if (!m) throw new Error("no archived copy");
  at = `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`;
  if ((Date.now() - Date.parse(at)) / 864e5 > 14) throw new Error("latest archived copy is from " + at);
  const res = await fetchFn(raw.replace(/^http:/, "https:").replace(/\/web\/(\d{14})\//, "/web/$1id_/"), { headers });
  return { res, at };
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
    const F = L.aia && fetchFn === fetch ? (u, o) => fetchAia(u, (o || {}).headers) : fetchFn;
    if (L.archive) {
      try { const { res, at } = await viaArchive(L.archive, fetchFn, H.headers); if (!res.ok) throw new Error("HTTP " + res.status);
        const list = L.parse(Buffer.from(await res.arrayBuffer())).map(norm).filter(n => n.length >= 4);
        if (list.length < (L.min || 50)) throw new Error("only " + list.length + " names");
        list.forEach(n => { if (!names.has(n)) names.set(n, L.id); }); loaded.push(`${L.id} (${list.length}, official PDF of ${at})`);
      } catch (e) { log(`  sanctions list ${L.id}: ${e.message}`); failed.push(L.id); }
      continue;
    }
    if (L.page) {
      try { const pr = await F(L.page, H); const m = (await pr.text()).match(L.link); if (m) urls = [new URL(m[0].replace(/&amp;/g, "&"), L.page).href]; else log(`  sanctions list ${L.id}: file link not found on ${L.page}`); }
      catch (e) { log(`  sanctions list ${L.id}: ${L.page} failed: ${e.message}`); }
    }
    for (const url of urls) {
      try {
        const r = await F(url, H);
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
