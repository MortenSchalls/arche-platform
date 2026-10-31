import fs from "fs"; fs.mkdirSync("out", {recursive: true});
const U = {
  tsofa: "https://sso.agc.gov.sg/Act/TSFA2002?ProvIds=Sc1-",
  tsofa2: "https://sso.agc.gov.sg/Act/TSFA2002",
  masial: "https://www.mas.gov.sg/api/v1/ialsearch?rows=1000&start=0",
  dfat: "https://www.dfat.gov.au/sites/default/files/Australian_Sanctions_Consolidated_List.xlsx",
  dfat_old: "https://www.dfat.gov.au/sites/default/files/regulation8_consolidated.xlsx",
  mofpage: "https://www.mof.go.jp/policy/international_policy/gaitame_kawase/gaitame/economic_sanctions/list.html",
  moha: "https://www.moha.gov.my/utama/index.php/en/component/content/article/350-list-of-ministries-of-home-affairs",
  amlo: "https://aps.amlo.go.th/aps/public/thailandlist/search?un_name=&un_registration_number=&passport_no=&un_id=",
  easapage: "https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en",
  easa: "https://transport.ec.europa.eu/document/download/67b75752-d144-4366-9f4a-c04157840211_en?filename=air-safety-list.xlsx",
  faa135: "https://www.faa.gov/about/officeorg/headquartersoffices/avs/faa-certificated-aircraft-operators-legal-part-135-holders.xlsx",
  faa135page: "https://www.faa.gov/headquartersoffices/avs/part-135-aircraft-listing-opspec-d085",
  ecb: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
  caauk: "https://www.caa.co.uk/data-and-analysis/approved-persons-and-organisations/approved-organisations/holders-of-air-operator-certificates/",
};
for (const [k, u] of Object.entries(U)) {
  try {
    const r = await fetch(u, {headers: {"user-agent": "Mozilla/5.0 ArcheExecutive-sanctions-screen/1.0", "accept": "*/*"}, redirect: "follow"});
    const b = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(`out/${k}.bin`, b);
    fs.appendFileSync("out/summary.txt", `${k}\t${r.status}\t${r.headers.get("content-type")}\t${b.length}\t${r.url}\n`);
  } catch (e) { fs.appendFileSync("out/summary.txt", `${k}\tERR\t${e.message}\n`); }
}
