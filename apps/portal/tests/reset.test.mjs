// Forgot password: email text, limits (one per 5 minutes, 5 a day). Example data only.
import { resetMail, allowed } from "../api/reset.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const m = resetMail("https://example.com/one-time");
ok("email: link, works once, ignore if not you, portal address", m.text.includes("https://example.com/one-time") && /works once/.test(m.text) && /ignore this email/.test(m.text) && m.text.includes("portal.archeaviation.com") && m.html.includes('href="https://example.com/one-time"'));
const t0 = Date.parse("2026-11-01T02:00:00Z"); let a = allowed({}, "k", t0);
ok("first request allowed", a.ok);
ok("again within 5 minutes: not sent", !allowed(a.log, "k", t0 + 60e3).ok);
let log = a.log; for (let i = 1; i < 5; i++) log = allowed(log, "k", t0 + i * 10 * 60e3).log;
ok("sixth in a day: not sent", !allowed(log, "k", t0 + 60 * 60e3).ok);
ok("next day: allowed again", allowed(log, "k", t0 + 25 * 3600e3).ok);
