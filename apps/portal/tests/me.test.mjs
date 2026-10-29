// My profile server check: only the allowed fields, cleaned; phone numbers checked. Example data only.
import { cleanSelf } from "../api/me.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const s = cleanSelf({ mobile: "+65 0000 0000", timezone: "Asia/Singapore", role: "owner", rights: { approve: true }, contract_name: "X", preferredName: "<b>Ex</b>" });
ok("only the allowed fields are kept (no role, rights or name on the agreement)", !("role" in s) && !("rights" in s) && !("contract_name" in s) && s.mobile === "+65 0000 0000");
ok("no markup kept", !/[<>]/.test(s.preferredName));
let bad = false; try { cleanSelf({ mobile: "call me" }); } catch (e) { bad = true; } ok("a phone number that is not a number is refused", bad);
