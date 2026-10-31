// Asian and aviation list parsers and the free background checks (31 Oct 2026). Example data only (fixtures/).
import fs from "node:fs";
import { loadLists, LISTS, KIND, screen } from "./lib/sanctions.mjs";
import { readXlsx } from "./lib/xlsx.mjs";
import { faaTails, ecbRates, run } from "./screen.mjs";
let fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };
const fx = f => fs.readFileSync(new URL("./fixtures/" + f, import.meta.url));
const many = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const AMLO = "<table>" + many(60, i => `<tr> <td>${i + 1}</td> <td>ไทย</td> <td> EXAMPLE PERSON ${String.fromCharCode(65 + i % 26)}${i} </td> <td>XXXX</td></tr>`).join("") + "<tr><td>61</td><td>ไทย</td><td> SOMCHAI EXAMPLEDESIGNATED </td></tr></table>";
const MAS = JSON.stringify({ response: { docs: many(60, i => ({ unregulatedpersons_s: `Example Scam Platform ${i}`, alternativename_s: i === 0 ? "Quickrich Example Exchange" : "", formername_s: "" })) } });
const ECBX = `<Cube><Cube time='2026-10-30'><Cube currency='USD' rate='1.1172'/><Cube currency='SGD' rate='1.5000'/><Cube currency='THB' rate='36.00'/></Cube></Cube>`;
const PAGES = {
  "list.html": `<a href="./shisantouketsu20261030.xlsx">xlsx</a>`,
  "eu-air-safety-list_en": `<a href="/document/download/abc_en?filename=air-safety-list.xlsx">xlsx</a>`,
};
const fetchFn = async url => {
  const body = url.includes("shisantouketsu") ? fx("mof.xlsx") : url.includes("air-safety-list.xlsx") ? fx("asl.xlsx") : url.includes("Australian_Sanctions") ? fx("dfat.xlsx") : url.includes("part-135") ? fx("faa135.xlsx")
    : url.includes("thailandlist") ? AMLO : url.includes("ialsearch") ? MAS : url.includes("eurofxref") ? ECBX : Object.entries(PAGES).find(([k]) => url.includes(k))?.[1];
  if (body == null) return { ok: false, status: 404 };
  const b = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return { ok: true, status: 200, text: async () => b.toString("utf8"), arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) };
};

ok(readXlsx(fx("dfat.xlsx"))[0].rows[0][1] === "Name of Individual or Entity", "xlsx reader reads the header row");
const L = await loadLists(fetchFn);
for (const id of ["Australia DFAT", "Japan MOF", "Thailand AMLO", "MAS Investor Alert", "EU Air Safety List"]) ok(L.loaded.some(x => x.startsWith(id)), id + " loaded");
ok(!L.failed.includes("Japan MOF"), "Japan MOF file link found on the list page");
ok(L.names.get("example trading bandit") === "Australia DFAT", "DFAT entity name indexed (suffix removed)");
ok(L.names.has("example listed person5") && !L.names.has("example removed person"), "MOF: English names kept, delisted rows left out");
ok(L.names.get("somchai exampledesignated") === "Thailand AMLO", "AMLO English name indexed");
ok(L.names.get("quickrich example exchange") === "MAS Investor Alert" && KIND["MAS Investor Alert"] === "alert", "MAS alias indexed as an alert, not sanctions");
ok(L.names.get("example banned airways") === "EU Air Safety List" && KIND["EU Air Safety List"] === "aviation", "EU Air Safety List carrier indexed");
ok(!L.names.has("all air carriers certified by authorities with responsibility for regulatory oversight of exampleland"), "whole-state ban rows are not carrier names");
ok(JSON.stringify(L.extra["EU Air Safety List"]) === JSON.stringify(["Exampleland"]), "whole-state bans listed separately");
ok(screen(["Example Banned Airways Ltd"], L)[0]?.list === "EU Air Safety List", "operator on the EU Air Safety List is caught");
const tails = await faaTails(fetchFn);
ok(tails.N1000X && tails.N1000X[0] === "Example Jets LLC", "FAA Part 135: tail to certificate holder");
const r = await ecbRates(fetchFn);
ok(r.date === "2026-10-30" && Math.abs(r.usdPer.EUR - 1.1172) < 1e-6 && Math.abs(r.usdPer.SGD - 1.1172 / 1.5) < 1e-5 && Math.abs(r.usdPer.AED - 0.272294) < 1e-5, "ECB: USD per unit for EUR, SGD and the AED peg");
const docs = {}; const db = { all: async () => [], set: async (k, v) => { docs[k] = v; } }; const files = {}; let index = null;
await run(db, fetchFn, () => {}, "2026-10-31T00:00:00Z", async b => { index = JSON.parse(b); }, async (n, b) => { files[n] = JSON.parse(b); });
ok(index.kinds["EU Air Safety List"] === "aviation" && index.aslStates.includes("Exampleland"), "index carries list kinds and whole-state bans");
ok(files["faa135.json"] && files["faa135.json"].tails.N2099X, "FAA tail file stored");
ok(docs["config/fx"] && docs["config/fx"].date === "2026-10-30" && docs["intel/screen"].fxDate === "2026-10-30", "rates saved for the portal");
console.log(fail ? "FAILED " + fail : "ALL PASS"); process.exit(fail ? 1 : 0);
