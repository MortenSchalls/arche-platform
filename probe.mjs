import fs from "node:fs"; import { execFileSync } from "node:child_process";
const note = (k, s) => console.log(`::notice title=${k}::` + String(s).replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3900));
const r = await fetch("https://web.archive.org/web/20261031043358id_/https://sso.agc.gov.sg/Act/TSFA2002?ViewType=Pdf"); fs.writeFileSync("t.pdf", Buffer.from(await r.arrayBuffer()));
const txt = execFileSync("pdftotext", ["t.pdf", "-"]).toString();
const idx = [...txt.matchAll(/FIRST SCHEDULE|SECOND SCHEDULE/g)].map(m => m[0][0] + m.index); note("idx", idx.join(" "));
const a = txt.search(/FIRST SCHEDULE\s*\n[^\n]*\n?[^\n]*Section 2/i) >= 0 ? txt.search(/FIRST SCHEDULE\s*\n[^\n]*\n?[^\n]*Section 2/i) : txt.indexOf("FIRST SCHEDULE", 5000);
const b = txt.indexOf("SECOND SCHEDULE", a + 100);
const body = txt.slice(a, b).replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n");
for (let i = 0; i < 9; i++) note("s" + i, body.slice(i * 3800, (i + 1) * 3800));
