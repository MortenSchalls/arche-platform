// Private website link (owner only): the server checks the sign-in and the owner role and never answers without both.
// Example data only; Supabase is mocked.
import handler, { bypassUrl } from "../api/website.mjs";
const ok = (k, v, x) => { console.log((v ? "PASS " : "FAIL ") + k + (v || x === undefined ? "" : "  -> " + JSON.stringify(x))); if (!v) process.exitCode = 1; };
const u = new URL(bypassUrl("example-secret"));
ok("address is archeaviation.com with the bypass and the cookie switch", u.host === "archeaviation.com" && u.searchParams.get("x-vercel-protection-bypass") === "example-secret" && u.searchParams.get("x-vercel-set-bypass-cookie") === "true");
const run = async (role, { token = "t", secret = "example-secret", userOk = true, method = "POST" } = {}) => {
  process.env.SUPABASE_URL = "https://example.supabase.co"; process.env.SUPABASE_SECRET_KEY = "example-key";
  if (secret) process.env.WEBSITE_BYPASS_SECRET = secret; else delete process.env.WEBSITE_BYPASS_SECRET;
  globalThis.fetch = async (url) => /auth\/v1\/user/.test(url)
    ? { ok: userOk, json: async () => ({ id: "00000000-0000-0000-0000-00000000000a" }) }
    : { ok: true, json: async () => (role ? [{ role, active: true }] : []) };
  let code = 0, body = null; const res = { setHeader() {}, status(c) { code = c; return this; }, json(b) { body = b; return this; } };
  await handler({ method, headers: { authorization: "Bearer " + token } }, res); return { code, body };
};
let r = await run("owner"); ok("owner gets the address", r.code === 200 && /x-vercel-protection-bypass=example-secret/.test(r.body.url), r);
r = await run("broker"); ok("a broker is refused", r.code === 403 && !r.body.url, r);
r = await run("ops"); ok("operations is refused", r.code === 403, r);
r = await run(null); ok("no profile is refused", r.code === 403, r);
r = await run("owner", { userOk: false }); ok("not signed in is refused", r.code === 401 && !r.body.url, r);
r = await run("owner", { secret: null }); ok("without the key set up it says so and gives no address", r.code === 503 && !r.body.url, r);
r = await run("owner", { method: "GET" }); ok("only POST", r.code === 405, r);
