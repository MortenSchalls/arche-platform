// Offline test of the weekly sanctions-programme watch (example data only).
import { run, READERS } from "./regimes.mjs";
let fails = 0; const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) fails++; };
const sdn = (progs) => progs.map((p, i) => `${i},"NAME ${i}","-0-","${p}","-0-"`).join("\n");
const un = (t) => t.map(x => `<INDIVIDUAL><UN_LIST_TYPE>${x}</UN_LIST_TYPE></INDIVIDUAL>`).join("");
const eu = (p) => "Entity_LogicalId;Programme;NameAlias_WholeName\n" + p.map((x, i) => `${i};${x};N${i}`).join("\n");
const uk = (r) => "Last Updated,01/01/2026\nName,Regime Name,Group ID\n" + r.map((x, i) => `N${i},${x},${i}`).join("\n");
let data = { sdn: sdn(["IRAN", "SDGT", "DPRK3", "RUSSIA-EO14024"]), un: un(["DPRK", "Iraq", "Libya"]), eu: eu(["RUS", "IRN", "PRK"]), uk: uk(["Russia", "Iran", "Syria"]) };
const fetchFn = async url => {
  const t = url.includes("sdn.csv") ? data.sdn : url.includes("alt.csv") ? "" : url.includes("scsanctions") ? data.un : url.includes("europa") ? data.eu : url.includes("fcdo") || url.includes("ofsi") ? data.uk : "";
  return { ok: !!t, status: t ? 200 : 404, text: async () => t };
};
const store = {}; const db = { get: async k => store[k] || null, set: async (k, v) => { store[k] = v; } };
ok("readers: OFAC programmes", JSON.stringify(READERS["OFAC SDN"](data.sdn)) === JSON.stringify(["DPRK3", "IRAN", "RUSSIA-EO14024", "SDGT"]));
await run(db, fetchFn, () => {});
let r = store["intel/sanctions-regimes"];
ok("first run stores a baseline, no review", r.baseline.UN.length === 3 && !r.review && r.open.length === 0);
await run(db, fetchFn, () => {}); r = store["intel/sanctions-regimes"];
ok("no change: still no review", !r.review);
data.uk = uk(["Russia", "Iran", "Syria", "Newland"]); data.eu = eu(["RUS", "IRN", "SYR"]);
await run(db, fetchFn, () => {}); r = store["intel/sanctions-regimes"];
const uks = r.open.find(c => c.list === "UK"), eus = r.open.find(c => c.list === "EU");
ok("a new UK regime asks for review", r.review && uks && uks.added[0] === "Newland");
ok("a removed EU programme is reported", eus && eus.removed[0] === "PRK");
data.un = ""; await run(db, fetchFn, () => {}); data.un = ""; await run(db, fetchFn, () => {}); r = store["intel/sanctions-regimes"];
ok("a list that cannot be read twice asks for review", r.failed.includes("UN") && r.failRuns >= 2 && r.review);
console.log(fails ? `${fails} FAILED` : "ALL PASS"); process.exit(fails ? 1 : 0);
