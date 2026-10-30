// Pass for the private website copy: "<expiry ms>.<HMAC-SHA256>" in an HttpOnly cookie, signed with the portal's
// server key (never sent to the browser). Owner only, 30 days.
import crypto from "node:crypto";
export const COOKIE = "ae_site";
export const DAYS = 30;
const sig = (exp, key) => crypto.createHmac("sha256", "ae-site|" + key).update(String(exp)).digest("base64url");
export function makePass(key, now = Date.now()) { const exp = now + DAYS * 864e5; return `${exp}.${sig(exp, key)}`; }
export function validPass(v, key, now = Date.now()) {
  const m = /^(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(v || ""); if (!m || !key) return false;
  if (+m[1] < now || +m[1] > now + (DAYS + 1) * 864e5) return false;
  const a = Buffer.from(m[2]), b = Buffer.from(sig(+m[1], key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function readCookie(header, name = COOKIE) {
  for (const part of String(header || "").split(/;\s*/)) { const i = part.indexOf("="); if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1)); }
  return "";
}
