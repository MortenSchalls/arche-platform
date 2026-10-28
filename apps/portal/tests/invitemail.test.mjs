// Invitation email: intro agreed with Morten 28 Oct 2026 (options A and B), joining steps, link, no Bangkok details. Example data only.
import { inviteMail } from "../api/invite.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const m = inviteMail({ name: "Example Person", link: "https://example.com/one-time", from: "Example Owner" });
ok("greets by first name", m.text.startsWith("Dear Example,"));
ok("intro A: what Archē is", m.text.includes("private jet charter broker based in Singapore") && m.html.includes("from any operator, on any route"));
ok("intro B: the opportunity, matching the offer (up to 35% of the profit)", m.text.includes("keeping up to 35% of the profit on every trip they sell"));
ok("the four joining steps and the personal link", ["our offer to you", "Broker Academy", "request for assessment", "your agreement"].every(x => m.text.includes(x)) && m.text.includes("https://example.com/one-time") && m.html.includes('href="https://example.com/one-time"'));
ok("no Bangkok office or Thai phone number", !/bangkok|\+66/i.test(m.text + m.html));
