const UA = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "accept-language": "en-GB,en;q=0.9"};
const note = (k, s) => console.log(`::notice title=${k}::` + s.replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
async function go(k, u, pats = []) { try { const r = await fetch(u, {headers: UA, redirect: "follow"}); const b = Buffer.from(await r.arrayBuffer()); const t = b.toString("utf8");
  let s = `${r.status} ${r.headers.get("content-type")} ${b.length}B ${r.url}\n`; for (const p of pats) s += `/${p}/: ` + [...new Set([...t.matchAll(new RegExp(p, "gi"))].map(m => m[0]))].slice(0, 12).join(" ; ") + "\n";
  s += "HEAD: " + t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 900); note(k, s); } catch (e) { note(k, "ERR " + e.message + " " + (e.cause && e.cause.code)); } }
await go("moha-admin", "https://admin.moha.gov.my/index.php/en/senarai-kementerian-dalam-negeri", ["href=\"[^\"]*\\.(pdf|xml|xlsx?|html?)[^\"]*\"", "href=\"[^\"]*[Ss]ekatan[^\"]*\""]);
await go("moha-www", "https://moha.gov.my/index.php/en/senarai-kementerian-dalam-negeri", ["href=\"[^\"]*\\.(pdf|xml|xlsx?)[^\"]*\""]);
await go("sso-whole", "https://sso.agc.gov.sg/Act/TSFA2002?WholeDoc=1");
await go("sso-pdf", "https://sso.agc.gov.sg/Act/TSFA2002/Pdf");
await go("egazette", "https://www.egazette.gov.sg/", ["[^\"' ]*Suppression[^\"' ]*"]);
await go("wayback-tsofa", "https://archive.org/wayback/available?url=sso.agc.gov.sg/Act/TSFA2002");
await go("mas-tfs", "https://www.mas.gov.sg/regulation/anti-money-laundering/targeted-financial-sanctions/lists-of-designated-individuals-and-entities", ["href=\"[^\"]*(pdf|TSFA|tsofa|Sc1)[^\"]*\""]);
