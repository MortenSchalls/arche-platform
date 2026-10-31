import tls from "node:tls"; import https from "node:https"; import crypto from "node:crypto";
const note = (k, s) => console.log(`::notice title=${k}::` + String(s).replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
// MOHA: incomplete certificate chain -> fetch the intermediate named in the leaf certificate (AIA), then verify normally
function leaf(host) { return new Promise((res, rej) => { const s = tls.connect(443, host, {servername: host, rejectUnauthorized: false}, () => { const c = s.getPeerCertificate(true); s.end(); res(c); }); s.on("error", rej); }); }
function get(url, ca) { return new Promise((res, rej) => { https.get(url, {ca, headers: {"user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)"}}, r => { const b = []; r.on("data", d => b.push(d)); r.on("end", () => res({status: r.statusCode, headers: r.headers, body: Buffer.concat(b)})); }).on("error", rej); }); }
try {
  const c = await leaf("admin.moha.gov.my"); const aia = (c.infoAccess || {})["CA Issuers - URI"] || [];
  let s = "leaf " + c.subject.CN + " issuer " + c.issuer.CN + " aia " + aia.join(",") + "\n";
  const der = (await (await fetch(aia[0])).arrayBuffer()); const pem = new crypto.X509Certificate(Buffer.from(der)).toString();
  const ca = [...tls.rootCertificates, pem];
  const r = await get("https://admin.moha.gov.my/index.php/en/senarai-kementerian-dalam-negeri", ca);
  const t = r.body.toString(); s += `page ${r.status} ${t.length}\nlinks: ` + [...new Set([...t.matchAll(/href="([^"]*)"/g)].map(m => m[1]).filter(h => /pdf|xml|sekatan|senarai|html/i.test(h)))].slice(0, 30).join(" ; ");
  note("moha", s);
  const links = [...t.matchAll(/href="([^"]*\.(?:xml|pdf)[^"]*)"/gi)].map(m => new URL(m[1].replace(/&amp;/g, "&"), "https://admin.moha.gov.my/").href);
  for (const u of links.slice(0, 4)) { try { const x = await get(u, ca); note("moha-file", `${u}\n${x.status} ${x.headers["content-type"]} ${x.body.length}B ${x.headers["last-modified"] || ""}\n` + x.body.slice(0, 1200).toString().replace(/[^\x20-\x7e\n]/g, ".")); } catch (e) { note("moha-file", u + " ERR " + e.message); } }
} catch (e) { note("moha", "ERR " + e.message); }
// TSOFA: the statute site needs JavaScript; load it in a real browser
try {
  const pw = await import("playwright"); const b = await pw.chromium.launch(); const p = await b.newPage();
  await p.goto("https://sso.agc.gov.sg/Act/TSFA2002?ProvIds=Sc1-#Sc1-", {waitUntil: "networkidle", timeout: 60000}); await p.waitForTimeout(5000);
  const txt = await p.evaluate(() => document.body.innerText); const html = await p.content();
  note("tsofa", `title ${await p.title()} len ${txt.length}\n` + txt.slice(0, 1500));
  const i = txt.indexOf("FIRST SCHEDULE"); note("tsofa-sched", txt.slice(Math.max(0, i), i + 3000));
  note("tsofa-pdf", [...new Set([...html.matchAll(/href="([^"]*(?:Pdf|pdf)[^"]*)"/g)].map(m => m[1]))].slice(0, 10).join(" ; "));
  await b.close();
} catch (e) { note("tsofa", "ERR " + e.message); }
