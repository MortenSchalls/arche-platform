// Speed check (Morten, 11 Nov 2026: "find out why Portal generally is slower and loads slower"): where the database and
// the portal's server functions run, and how long each round trip takes. Prints no keys and no data.
import { lookup } from "node:dns/promises";
const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SECRET_KEY, PORTAL = "https://portal.archeaviation.com";
const t = async (label, url, opt = {}) => { const s = performance.now(); try { const r = await fetch(url, opt); const b = await r.arrayBuffer();
  console.log(`${label}: ${r.status} in ${Math.round(performance.now() - s)} ms, ${b.byteLength} bytes, encoding ${r.headers.get("content-encoding") || "none"}, cache ${r.headers.get("cache-control") || "-"}, x-vercel-id ${r.headers.get("x-vercel-id") || "-"}, x-vercel-cache ${r.headers.get("x-vercel-cache") || "-"}`); return r; }
  catch (e) { console.log(`${label}: failed ${e.message}`); } };
const host = new URL(SB).hostname, ip = (await lookup(host)).address;
const geo = await (await fetch(`https://ipinfo.io/${ip}/json`)).json().catch(() => ({}));
console.log(`Database host resolves to ${geo.city || "?"}, ${geo.region || "?"}, ${geo.country || "?"} (${geo.org || "?"}) — note: Supabase sits behind a CDN, so this may be the nearest edge, not the database`);
// the database's own host (not behind the CDN) tells where the database really is
for (const fam of [4, 6]) { try { const a = (await lookup("db." + host, { family: fam })).address; const g = await (await fetch(`https://ipinfo.io/${a}/json`)).json().catch(() => ({}));
  console.log(`Database server (IPv${fam}) is in ${g.city || "?"}, ${g.region || "?"}, ${g.country || "?"} (${g.org || "?"})`); } catch (e) { console.log(`Database server IPv${fam}: ${e.code || e.message}`); } }
const h = { apikey: KEY, authorization: `Bearer ${KEY}` };
for (let i = 1; i <= 5; i++) await t(`database round trip ${i} (runner in the US)`, `${SB}/rest/v1/acct_accounts?select=code&limit=1`, { headers: h });
await t("database settings (region hint)", `${SB}/rest/v1/`, { headers: h });
for (let i = 1; i <= 3; i++) await t(`portal page ${i}`, PORTAL + "/", { headers: { "accept-encoding": "gzip, br" } });
for (let i = 1; i <= 3; i++) await t(`portal function ${i} (Books, unsigned, 401 expected)`, PORTAL + "/api/books", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "status" }) });
