import tls from "node:tls"; import https from "node:https"; import crypto from "node:crypto";
const note = (k, s) => console.log(`::notice title=${k}::` + String(s).replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
const UA = {"user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)"};
let ca = null;
async function chain(host) { if (ca) return ca; const c = await new Promise((res, rej) => { const s = tls.connect(443, host, {servername: host, rejectUnauthorized: false}, () => { const c = s.getPeerCertificate(true); s.end(); res(c); }); s.on("error", rej); });
  const aia = ((c.infoAccess || {})["CA Issuers - URI"] || [])[0]; const der = Buffer.from(await (await fetch(aia)).arrayBuffer()); ca = [...tls.rootCertificates, new crypto.X509Certificate(der).toString()]; return ca; }
function get(url) { return new Promise(async (res, rej) => { https.get(url, {ca: await chain(new URL(url).hostname), headers: UA}, r => { const b = []; r.on("data", d => b.push(d)); r.on("end", () => res({status: r.statusCode, headers: r.headers, body: Buffer.concat(b)})); }).on("error", rej); }); }
for (const u of ["https://www.moha.gov.my/index.php/en/senarai-kementerian-dalam-negeri", "https://moha.gov.my/index.php/en/senarai-kementerian-dalam-negeri", "https://www.moha.gov.my/utama/index.php/en/component/content/article/350-list-of-ministries-of-home-affairs"]) {
  try { const r = await get(u); const t = r.body.toString(); note("moha " + u.slice(8, 50), `${r.status} ${t.length} loc=${r.headers.location || ""}\n` + [...new Set([...t.matchAll(/href="([^"]*)"/g)].map(m => m[1]).filter(h => /pdf|xml|sekatan|senarai|\.htm/i.test(h)))].slice(0, 25).join(" ; ")); } catch (e) { note("moha " + u.slice(8, 50), "ERR " + e.message); } }
// TSOFA: CloudFront refuses GitHub's addresses. Ask the Internet Archive to take a fresh copy, then read its latest copy.
const T = "https://sso.agc.gov.sg/Act/TSFA2002?WholeDoc=1";
try { const r = await fetch("https://web.archive.org/save/" + T, {headers: UA, redirect: "manual"}); note("spn", `${r.status} loc=${r.headers.get("location") || ""} cl=${r.headers.get("content-location") || ""}`); } catch (e) { note("spn", "ERR " + e.message); }
try { const a = await (await fetch("https://archive.org/wayback/available?url=" + encodeURIComponent(T))).json(); const s = a.archived_snapshots.closest; note("wb-avail", JSON.stringify(a));
  if (s) { const raw = s.url.replace(/\/web\/(\d+)\//, "/web/$1id_/"); const r = await fetch(raw, {headers: UA}); const h = await r.text(); const txt = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "\n").replace(/\n\s*\n+/g, "\n");
    const i = txt.search(/FIRST SCHEDULE/i); note("wb-sched", `${r.status} ${h.length} at ${i}\n` + txt.slice(Math.max(0, i), i + 3000)); } } catch (e) { note("wb", "ERR " + e.message); }
try { const cdx = await (await fetch("https://web.archive.org/cdx/search/cdx?url=sso.agc.gov.sg/Act/TSFA2002*&output=json&limit=-15&fl=timestamp,original,statuscode")).text(); note("cdx", cdx.slice(0, 2000)); } catch (e) { note("cdx", "ERR " + e.message); }
