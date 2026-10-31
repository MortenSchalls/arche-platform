import tls from "node:tls"; import https from "node:https"; import crypto from "node:crypto"; import fs from "node:fs"; import { execFileSync } from "node:child_process";
const note = (k, s) => console.log(`::notice title=${k}::` + String(s).replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
const UA = {"user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)"};
let ca = null;
async function chain(host) { if (ca) return ca; const c = await new Promise((res, rej) => { const s = tls.connect(443, host, {servername: host, rejectUnauthorized: false}, () => { const c = s.getPeerCertificate(true); s.end(); res(c); }); s.on("error", rej); });
  const aia = ((c.infoAccess || {})["CA Issuers - URI"] || [])[0]; const der = Buffer.from(await (await fetch(aia)).arrayBuffer()); ca = [...tls.rootCertificates, new crypto.X509Certificate(der).toString()]; return ca; }
function get(url) { return new Promise(async (res, rej) => { https.get(url, {ca: await chain(new URL(url).hostname), headers: UA}, r => { const b = []; r.on("data", d => b.push(d)); r.on("end", () => res({status: r.statusCode, headers: r.headers, body: Buffer.concat(b)})); }).on("error", rej); }); }
try { const r = await get("https://www.moha.gov.my/utama/images/Bahagian%20Keselamatan%20dan%20Ketenteraman%20Awam/SENARAI_KEMENTERIAN_DALAM_NEGERI/SENARAI_KDN_2026_BI.xml"); const t = r.body.toString(); note("moha-xml", `${r.status} ${r.headers["content-type"]} ${t.length} lm=${r.headers["last-modified"]}\n` + t.slice(0, 2500)); note("moha-xml2", t.slice(2500, 5500)); } catch (e) { note("moha-xml", "ERR " + e.message); }
// TSOFA as PDF through the Internet Archive
for (const T of ["https://sso.agc.gov.sg/Act/TSFA2002?ViewType=Pdf", "https://sso.agc.gov.sg/Act/TSFA2002?ProvIds=Sc1-&ViewType=Pdf"]) {
  try { const s = await fetch("https://web.archive.org/save/" + T, {headers: UA, redirect: "manual"}); const loc = s.headers.get("location") || "";
    let raw = loc.replace(/\/web\/(\d+)\//, "/web/$1id_/"); if (!raw) { const a = await (await fetch("https://archive.org/wayback/available?url=" + encodeURIComponent(T))).json(); raw = ((a.archived_snapshots || {}).closest || {}).url?.replace(/\/web\/(\d+)\//, "/web/$1id_/") || ""; }
    let s2 = `spn ${s.status} ${loc}\nraw ${raw}\n`;
    if (raw) { const r = await fetch(raw, {headers: UA}); const b = Buffer.from(await r.arrayBuffer()); s2 += `${r.status} ${r.headers.get("content-type")} ${b.length} magic=${b.slice(0, 5).toString()}\n`;
      if (b.slice(0, 4).toString() === "%PDF") { fs.writeFileSync("t.pdf", b); const txt = execFileSync("pdftotext", ["-layout", "t.pdf", "-"]).toString(); const i = txt.lastIndexOf("FIRST SCHEDULE"); s2 += `pages text ${txt.length} sched at ${i}\n` + txt.slice(i, i + 2500); }
      else { const h = b.toString(); s2 += h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600); } }
    note("tsofa-pdf " + T.slice(-20), s2); } catch (e) { note("tsofa-pdf", "ERR " + e.message); } }
