import { readXlsx } from "./xlsx.mjs";
const UA = {"user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)", accept: "*/*"};
const get = async u => { const r = await fetch(u, {headers: UA}); return {r, b: Buffer.from(await r.arrayBuffer())}; };
const note = (k, s) => console.log(`::notice title=${k}::` + s.replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
{ const {r, b} = await get("https://www.mof.go.jp/policy/international_policy/gaitame_kawase/gaitame/economic_sanctions/shisantouketsu20261030.xlsx");
  const sh = readXlsx(b); let s = `${r.status} ${b.length}\n`; for (const x of sh) { s += `[${x.name}] ${x.rows.length}\n`; const hi = x.rows.findIndex(rw => rw.length > 4); s += x.rows.slice(0, 3).concat(x.rows.slice(hi, hi + 4)).map(rw => rw.slice(0, 12).map(c => String(c).slice(0, 40)).join(" | ")).join("\n") + "\n"; }
  note("mof", s.slice(0, 3700)); }
{ const {b} = await get("https://aps.amlo.go.th/aps/public/thailandlist/search?un_name=&un_registration_number=&passport_no=&un_id=");
  const t = b.toString(); const trs = [...t.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => m[0]); note("amlo", `trs ${trs.length}\n` + trs.slice(0, 3).map(x => x.replace(/\s+/g, " ").slice(0, 900)).join("\n---\n") + "\npaging: " + [...new Set([...t.matchAll(/[?&]page=\d+|pagination[^>]{0,80}|ทั้งหมด[^<]{0,60}/g)].map(m => m[0]))].slice(0, 6).join(" ; ")); }
{ const {b} = await get("https://transport.ec.europa.eu/document/download/67b75752-d144-4366-9f4a-c04157840211_en?filename=air-safety-list.xlsx");
  const a = readXlsx(b)[0]; note("easaA", a.rows.slice(6, 40).map(rw => rw.slice(0, 5).map(c => String(c).slice(0, 50)).join(" | ")).join("\n")); }
