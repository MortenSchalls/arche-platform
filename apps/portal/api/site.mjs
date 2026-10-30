// The locked website, privately inside the portal (Morten, 30 Oct 2026). portal.archeaviation.com/website/... is
// rewritten here (vercel.json). Served only with a valid owner pass (cookie set by /api/website); everyone else goes
// to the portal. The forms are switched off in this copy, so nothing is sent from it. Files: api/_site/data.mjs.
import FILES from "./_site/data.mjs";
import { COOKIE, readCookie, validPass } from "./_site/gate.mjs";
const TYPES = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json",
  svg: "image/svg+xml", xml: "application/xml", txt: "text/plain; charset=utf-8", webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webmanifest: "application/manifest+json" };
export function resolve(p) {
  p = String(p || "").split("?")[0].replace(/^\/+/, "").replace(/\/{2,}/g, "/");
  if (p.split("/").some(s => s === ".." || s === ".")) return null;
  if (p === "" ) return "index.html";
  if (/^(th|zh|ja)$/.test(p)) return p + ".html";
  if (FILES[p]) return p;
  if (FILES[p.replace(/\/?$/, "/") + "index.html"]) return p.replace(/\/?$/, "/") + "index.html";
  return null;
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  const url = new URL(req.url, "https://portal.archeaviation.com");
  const p = url.searchParams.get("p") || "";
  if (!validPass(readCookie(req.headers.cookie), process.env.SUPABASE_SECRET_KEY)) { res.statusCode = 302; res.setHeader("Location", "/"); return res.end(); }
  if (/^api\//.test(p)) { res.statusCode = 403; res.setHeader("Content-Type", "application/json"); return res.end(JSON.stringify({ error: "Preview only: forms are switched off in the portal copy of the website. Nothing was sent." })); }
  const f = resolve(p);
  if (!f) { res.statusCode = 404; res.setHeader("Content-Type", "text/plain"); return res.end("Not found"); }
  const body = Buffer.from(FILES[f], "base64");
  res.statusCode = 200;
  res.setHeader("Content-Type", TYPES[f.split(".").pop()] || "application/octet-stream");
  res.setHeader("Content-Encoding", "gzip");
  res.setHeader("Vary", "Cookie");
  return res.end(body);
}
