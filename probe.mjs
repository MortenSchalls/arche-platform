import { readXlsx } from "./xlsx.mjs";
const UA = {"user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)", accept: "*/*"};
const get = async u => { const r = await fetch(u, {headers: UA, redirect: "follow"}); return {r, b: Buffer.from(await r.arrayBuffer())}; };
const note = (k, s) => console.log(`::notice title=${k}::` + s.replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
const strip = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
async function xl(k, u) { try { const {r, b} = await get(u); let s = `${r.status} ${r.headers.get("content-type")} ${b.length}B ${r.url}\n`;
  if (r.ok) { try { const sh = readXlsx(b); for (const x of sh) s += `[${x.name}] rows ${x.rows.length}\n` + x.rows.slice(0, 6).map(rw => rw.slice(0, 14).join(" | ").slice(0, 300)).join("\n") + "\n"; } catch (e) { s += "xlsx err " + e.message + " head " + b.slice(0, 200).toString(); } }
  note(k, s); } catch (e) { note(k, "ERR " + e.message); } }
async function html(k, u, pats) { try { const {r, b} = await get(u); const t = b.toString("utf8"); let s = `${r.status} ${r.headers.get("content-type")} ${b.length}B ${r.url}\n`;
  for (const p of pats) s += `/${p}/: ` + [...new Set([...t.matchAll(new RegExp(p, "gi"))].map(m => m[0]))].slice(0, 8).join(" ; ") + "\n";
  s += "TEXT: " + strip(t).slice(0, 1500); note(k, s); } catch (e) { note(k, "ERR " + e.message); } }
await xl("dfat", "https://www.dfat.gov.au/sites/default/files/Australian_Sanctions_Consolidated_List.xlsx");
await html("mof", "https://www.mof.go.jp/policy/international_policy/gaitame_kawase/gaitame/economic_sanctions/list.html", ["[^\"' ]*shisantouketsu[^\"' ]*\\.(csv|xlsx)"]);
await html("easapage", "https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en", ["[^\"' ]*air-safety-list[^\"' ]*\\.xlsx[^\"' ]*", "/document/download/[^\"' ]*"]);
await xl("easa", "https://transport.ec.europa.eu/document/download/67b75752-d144-4366-9f4a-c04157840211_en?filename=air-safety-list.xlsx");
await xl("faa135", "https://www.faa.gov/about/officeorg/headquartersoffices/avs/faa-certificated-aircraft-operators-legal-part-135-holders.xlsx");
await html("tsofa", "https://sso.agc.gov.sg/Act/TSFA2002?ProvIds=Sc1-", ["<td[^>]*>[^<]{3,80}</td>", "class=\"[^\"]*\""]);
try { const {r, b} = await get("https://www.mas.gov.sg/api/v1/ialsearch?rows=1000&start=0"); note("masial", `${r.status} ${r.headers.get("content-type")} ${b.length}B\n` + b.slice(0, 1500).toString()); } catch (e) { note("masial", "ERR " + e.message); }
await html("moha", "https://www.moha.gov.my/utama/index.php/en/component/content/article/350-list-of-ministries-of-home-affairs", ["[^\"' ]*\\.(pdf|xlsx|xls|csv|xml)"]);
await html("amlo", "https://aps.amlo.go.th/aps/public/thailandlist/search?un_name=&un_registration_number=&passport_no=&un_id=", ["<td[^>]*>[^<]{3,80}</td>"]);
try { const {r, b} = await get("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"); note("ecb", `${r.status} ${b.length}B ` + b.slice(0, 600).toString()); } catch (e) { note("ecb", "ERR " + e.message); }
