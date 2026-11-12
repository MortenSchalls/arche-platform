/* ---------- figures (redrawn 7 Nov 2026, Morten: "still cartoonish"): editorial diagrams in the website's language,
   built from text and hairlines so they never overflow on a phone. The words, figures and spoken text are the same as
   before; only the drawing changed. Maps (positioning, cabotage) stay as clean line drawings. ---------- */
const FIGS = (() => {
  const W = 640;
  const arrow = (x1,y1,x2,y2,cls,dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls||"s-acc"}" stroke-width="1.6" ${dash?'stroke-dasharray="5 5"':""} marker-end="url(#ah)"/>`;
  const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="f-acc"/></marker></defs>`;
  const svg = (h, body, label) => `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;
  const e = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const node = (t, sub, cls) => `<div class="fg-node ${cls||""}"><b>${e(t)}</b>${sub ? `<span>${e(sub)}</span>` : ""}</div>`;
  const to = lab => `<div class="fg-to" aria-hidden="true">${lab ? `<i>${e(lab)}</i>` : ""}</div>`;
  const F = {};

  F.hero = () => ({svg: svg(150, `<text x="20" y="40" class="t-h">Arche Executive</text><text x="20" y="62" class="t-s t-m">Charter brokerage training</text>`, "Arche Executive"), say:""});

  F.who = () => ({html: `<div class="fg-flow">${node("Client","the charterer")}${to("enquiry, contract")}${node("Arche Executive","the broker","key")}${to("request, booking")}${node("Operator","holds the AOC, flies")}</div>
    <div class="fg-grid3">${node("FBO and handler","at each airport")}${node("Avinode and our payment provider","quotes, bookings, payments","soft")}${node("Crew and aircraft","work for the operator")}</div>
    <p class="fg-note">Safety and operational decisions belong to the operator and its crew.</p>`,
    cap:"Who does what on a charter flight", say:"Diagram. The client sends the enquiry and signs the contract with Arche, the broker. Arche requests and books the flight with the operator, which holds the air operator certificate and flies the aircraft with its own crew. Quotes, bookings and payments run through Avinode and our payment provider. A handler and FBO look after the aircraft and passengers at each airport."});

  F.cats = () => {
    const c = [["Light jet","sit","cat_light"],["Midsize","near standing","cat_mid"],["Super-midsize","standing","cat_smid"],["Heavy","standing, galley","cat_heavy"],["Ultra-long-range","zones, crew rest","cat_ulr"]];
    const P = typeof PHOTOS !== "undefined" ? PHOTOS : {};
    return {html: `<div class="fg-cats">${c.map((k,i) => { const p = P[k[2]]; return `<div class="fg-cat">${p ? `<img src="${p.src}" alt="${e(p.cap)}" loading="lazy" decoding="async">` : ""}<span class="n">${i+1}</span><b>${e(k[0])}</b><span class="d">Cabin: ${e(k[1])}</span>${p ? `<span class="cr">${e(p.cap.split(": ")[1] || p.cap)} · ${e(p.artist)}, ${e(p.lic)}</span>` : ""}</div>`; }).join("")}</div>`,
      cap:"Categories grow in cabin size and range. Always use the figures for the actual aircraft.", say:"Photographs of five business jets from small to large: light jet, midsize, super-midsize, heavy, and ultra-long-range with separate cabin zones and a crew rest area."};
  };

  F.utc = () => ({html: `<div class="fg-time"><div><span class="big">09:00</span><b>in Bangkok</b><span>local time, UTC+7</span></div><div class="mid"><span>minus 7 hours</span></div><div><span class="big">02:00 Z</span><b>UTC</b><span>the same everywhere</span></div></div>`,
    cap:"Quotes show local time; operators plan in UTC.", say:"9 o'clock in the morning in Bangkok, local time, is 2 o'clock UTC, because Bangkok is 7 hours ahead of UTC."});

  F.pos = () => ({svg: svg(200, `<circle cx="40" cy="150" r="5" class="f-acc"/><text x="40" y="178" text-anchor="middle" class="t-s">Base</text>
    <circle cx="240" cy="60" r="5" class="f-acc"/><text x="240" y="42" text-anchor="middle" class="t-s">Client's airport</text>
    <circle cx="560" cy="80" r="5" class="f-acc"/><text x="560" y="62" text-anchor="middle" class="t-s">Destination</text>
    ${arrow(46,146,234,64,"s-acc",true)}${arrow(246,61,553,79,"s-ink")}${arrow(553,86,47,149,"s-acc",true)}
    <text x="110" y="92" class="t-s t-m">positioning</text><text x="380" y="60" class="t-s">passenger flight</text><text x="300" y="140" class="t-s t-m">positioning back to base</text>`, "Positioning legs"),
    cap:"Dashed lines are positioning legs without passengers; the client usually pays for them.", say:"Map. The aircraft flies empty from its base to the client's airport, flies the passengers to the destination, then flies empty back to base. The empty flights are positioning legs, usually paid by the client."});

  F.market = () => {
    const d = [["Africa",15],["Latin America",11],["Middle East",7],["Global",5],["Asia",4],["Europe",1]];
    return {html: `<div class="fg-two"><div><p class="fg-h">Growth in business jet flights, 2025 versus 2024</p><div class="fg-bars">${d.map(r => `<div class="r ${r[0]==="Global"?"key":""}"><span class="l">${r[0]}</span><span class="b"><i style="width:${r[1]/15*100}%"></i></span><span class="v">${r[1]}%</span></div>`).join("")}</div></div>
      <div class="fg-stat"><span class="k">People worth USD 30m+</span><span class="big">713,626</span><span>in 2026</span><span class="m">up from 551,435 in 2021</span></div></div>`,
      cap:"North America has about 72% of all business jet flights; the fastest growth is elsewhere.", src:"Sources: WINGX full-year 2025; Knight Frank, The Wealth Report 2026", say:"Chart. In 2025, business jet flights grew 15 percent in Africa, 11 percent in Latin America, 7 percent in the Middle East, 4 percent in Asia and about 1 percent in Europe, and 5 percent worldwide. North America still has about 72 percent of all flights. The number of people worth 30 million US dollars or more reached 713,626 in 2026, up from 551,435 in 2021."};
  };

  F.freedoms = () => {
    const leg = (a, b, red) => `<span class="pt ${a==="H"?"h":""}">${a}</span><span class="ln ${red?"red":""}"></span><span class="pt">${b}</span>`;
    const P = (n, t, legs) => `<div class="fg-fr"><p><b>${n}</b> ${e(t)}</p><div class="rt">${legs}</div></div>`;
    return {html: `<div class="fg-grid3">${P("3rd","home to abroad",leg("H","A"))}${P("5th","on to a third country",leg("H","A") + `<span class="ln"></span><span class="pt">B</span>`)}${P("7th","abroad only",leg("A","B"))}
      ${P("8th","through-flight cabotage",leg("H","A") + `<span class="ln red"></span><span class="pt">A</span>`)}${P("9th","stand-alone cabotage",leg("A","A",true))}
      <div class="fg-fr key"><p><b>H</b> operator's home country</p><p><b>A, B</b> other countries</p><p>Red legs are domestic in a foreign country: cabotage</p></div></div>`,
      cap:"The 8th and 9th freedoms are cabotage, which most countries refuse to foreign operators.", say:"Diagram of five freedoms of the air. Third: from the home country abroad. Fifth: onward from a foreign country to a third country. Seventh: between two foreign countries only. Eighth and ninth: flights between two airports inside the same foreign country. These are cabotage, which most countries refuse to foreign operators."};
  };

  F.never = () => {
    const items = ["Operator without a commercial AOC","Domestic leg on a foreign operator","US domestic flight on a non-US operator","Individual seats","Sanctioned people or embargoed places","Hidden passenger names"];
    return {html: `<div class="fg-never"><p class="fg-h">Never sell</p><ol>${items.map(t => `<li>${e(t)}</li>`).join("")}</ol></div>`,
      cap:"Six of the flights on the never-sell list. The full list is in the table.", say:"Never sell. Six examples: an operator without a commercial air operator certificate; a domestic leg on a foreign operator; a US domestic flight on a non-US operator; individual seats; sanctioned people or embargoed places; and hidden passenger names."};
  };

  F.cabo = () => ({svg: svg(230, `<circle cx="80" cy="190" r="5" class="f-acc"/><text x="80" y="216" text-anchor="middle" class="t-s">Singapore</text>
    <circle cx="300" cy="50" r="5" class="f-acc"/><text x="300" y="32" text-anchor="middle" class="t-s">Bangkok</text>
    <circle cx="420" cy="170" r="5" class="f-acc"/><text x="420" y="198" text-anchor="middle" class="t-s">Phuket</text>
    <line x1="86" y1="186" x2="293" y2="55" class="s-ok" stroke-width="2" marker-end="url(#ah)"/><line x1="305" y1="56" x2="415" y2="163" class="s-amb" stroke-width="2" marker-end="url(#ah)"/><line x1="413" y1="171" x2="88" y2="190" class="s-ok" stroke-width="2" marker-end="url(#ah)"/>
    <line x1="470" y1="34" x2="470" y2="136" class="s-amb" stroke-width="2"/><text x="482" y="52" class="t-s t-b">Bangkok to Phuket</text><text x="482" y="72" class="t-s">is domestic. On a foreign</text><text x="482" y="90" class="t-s">aircraft only as one</text><text x="482" y="108" class="t-s">continuous journey,</text><text x="482" y="126" class="t-s">confirmed in writing.</text>`, "Cabotage example"),
    cap:"Green legs are international; the amber leg is domestic.", say:"Map. Singapore to Bangkok and Phuket to Singapore are international legs. Bangkok to Phuket is a domestic leg in Thailand. On a foreign aircraft it is only possible as one continuous international journey, confirmed by the operator in writing."});

  F.rag = () => {
    const L = [["Green","Proceed with sourcing","g"],["Amber","Operator confirms in writing before we quote","a"],["Red","Stop and escalate to the Director","r"]];
    return {html: `<div class="fg-rag">${L.map(l => `<div class="${l[2]}"><b>${l[0]}</b><span>${e(l[1])}</span></div>`).join("")}</div>`,
      cap:"Every enquiry gets a colour before sourcing.", say:"Green means proceed with sourcing. Amber means the operator confirms in writing before we quote. Red means stop and escalate to the Director."};
  };

  F.screen = () => ({html: `<div class="fg-flow">${node("List names","everyone involved")}${to()}${node("Search lists","UN, MAS, OFAC, EU, UK")}${to()}${node("Record","date, lists, result")}${to()}${node("Match?","","q")}</div>
    <div class="fg-fork"><div class="ok"><b>No</b><span>continue</span></div><div class="stop"><b>Possible match</b><span>stop, no payment, director</span></div></div>`,
    cap:"Screen every name, record the result, and stop at any possible match.", say:"Flow chart. List every name, search the UN, Singapore, US, EU and UK sanctions lists, and record the date, lists and result. If there is no match, continue. If there is a possible match, stop, take no payment and report to the Director."});

  F.cycle = () => {
    const s = ["Enquiry","Qualify","Legal check","Feasibility","Sourcing","Quote","Contract and payment","Operations","Close"];
    return {html: `<ol class="fg-steps">${s.map((t,i) => `<li class="${i===2?"key":""}"><span class="n">${i+1}</span>${e(t)}</li>`).join("")}</ol><p class="fg-note">The legal check (step 3) comes before any sourcing.</p>`,
      cap:"Nine stages from enquiry to closed file.", say:"The booking life cycle in nine stages: enquiry, qualification, legal check, feasibility, sourcing, quote, contract and payment, operations, and close. The legal check comes before any sourcing."};
  };

  F.airport = () => {
    const t = [["Hours","opening and curfews"],["Customs","available, or on request"],["Fire cover","category suits the aircraft"],["Runway","length for the load"],["Slots, parking","approved in time"],["FBO, handler","service at arrival"]];
    return {html: `<ol class="fg-checks">${t.map(k => `<li><b>${e(k[0])}</b><span>${e(k[1])}</span></li>`).join("")}</ol>`,
      cap:"Six checks before an airport goes in the quote. The operator confirms.", say:"Six airport checks: opening hours and curfews; customs available; fire cover category suits the aircraft; runway length for the load; slots and parking approved; and an FBO or handler for arrival. The operator confirms them."};
  };

  F.vet = () => {
    const s = ["All quotes received","AOC and aircraft on the operations specifications","Insurance covers commercial passengers","ARGUS Platinum, WYVERN Wingman or IS-BAO Stage 2–3","Not on any banned list; not sanctioned","Shortlist for the client"];
    return {html: `<ol class="fg-narrow">${s.map((t,i) => `<li class="${i===5?"key":""}" style="--i:${i}">${e(t)}</li>`).join("")}</ol>`,
      cap:"Each check narrows the field. Any other operator only if the Director has approved it after the checks in 8.3.", say:"Funnel. From all quotes received, keep operators whose aircraft is on their AOC operations specifications, whose insurance covers commercial passengers, with ARGUS Platinum or Platinum Elite, WYVERN Wingman or IS-BAO Stage 2 or 3, and who are not banned or sanctioned. What remains is the shortlist for the client."};
  };

  F.price = () => ({html: `<div class="fg-price"><p class="fg-h">Right: divide by 0.91</p><div class="pbar"><span class="c" style="flex:91">Arche cost 100,000 = 91%</span><span class="m" style="flex:9">9%</span></div><p class="res">Client price 109,891 · margin 9,891 = 9.0%</p>
    <p class="fg-h">Wrong: add 9%</p><div class="pbar"><span class="c" style="flex:91">Arche cost 100,000</span><span class="m bad" style="flex:8.26"></span></div><p class="res">Client price 109,000 · margin 9,000 = only 8.26%</p></div>`,
    cap:"The margin is 9% of the client price, so divide the cost by 0.91 and round up.", say:"Two bars. Right: an Arche cost of 100,000 divided by 0.91 gives a client price of 109,891, and the margin of 9,891 is 9 percent of the price. Wrong: adding 9 percent gives 109,000, and the margin of 9,000 is only 8.26 percent of the price."});

  F.ex = () => {
    const r = [["A. One-way",100000,109891],["B. Multi-leg",180000,197803],["D. With supplier item",61200,67253]], f = n => n.toLocaleString("en-US");
    return {html: `<div class="fg-ex">${r.map(k => `<div class="r"><b>${k[0]}</b><div class="b"><span class="c" style="width:${k[1]/200000*68}%"></span><em>cost ${f(k[1])}</em></div><div class="b"><span class="p" style="width:${k[2]/200000*68}%"></span><em>price ${f(k[2])}</em></div></div>`).join("")}</div>`,
      cap:"Cost and client price for three of the worked examples (USD).", say:"Bar chart of three worked examples. One-way: cost 100,000, price 109,891. Multi-leg: cost 180,000, price 197,803. With a supplier item: cost 61,200, price 67,253."};
  };

  F.money = () => ({html: `<div class="fg-flow">${node("Client","pays the request")}${to()}${node("Payment provider","holds client funds","key")}${to()}${node("Operator","paid on its terms")}</div>
    <div class="fg-down"><div class="fg-to v" aria-hidden="true"></div>${node("Arche account","only the margin")}<span class="fg-aside">Citi Singapore (being set up)</span></div>`,
    cap:"Operator money never passes through Arche's own account.", say:"Diagram. The client pays the payment request. The payment account holds the funds and the operator is paid on its terms. Only Arche's margin moves to Arche's own account at Citi Singapore."});

  F.day = () => {
    const s = [["Before","details to operator, permits and slots confirmed, trip brief sent"],["From 48 h","watch the forecast, warn early"],["Day of flight","track the flight, update the client first"],["Within 72 hours","charge every cost beyond the price, close the file"]];
    return {html: `<ol class="fg-line">${s.map((k,i) => `<li class="${i===2?"key":""}"><b>${e(k[0])}</b><span>${e(k[1])}</span></li>`).join("")}</ol>`,
      cap:"Keep the client informed before they need to ask.", say:"Timeline. Before the flight: passenger details to the operator, permits and slots confirmed, trip brief sent. From 48 hours: watch the forecast and warn early. Day of flight: track the flight and update the client first. Within 72 hours: charge every cost beyond the price and close the file."};
  };

  F.funnel = () => {
    const s = ["New enquiry","Qualified","Quoted","Won"];
    return {html: `<ol class="fg-narrow four">${s.map((t,i) => `<li class="${i===3?"key":""}" style="--i:${i*1.5}">${e(t)}</li>`).join("")}</ol><p class="fg-note">Lost? Record the reason: price, aircraft, timing, no decision. It shows what to fix.</p>`,
      cap:"Every enquiry moves through the pipeline in the CRM.", say:"Funnel: new enquiry, qualified, quoted, won. For every lost enquiry, record the reason, such as price, aircraft, timing or no decision."};
  };

  F.montreal = () => {
    const t = [["151,880 SDR","death or injury, per passenger"],["6,303 SDR","delay, per passenger"],["1,519 SDR","baggage, per passenger"]];
    return {html: `<div class="fg-stats">${t.map(k => `<div><span class="big">${k[0]}</span><span>${e(k[1])}</span></div>`).join("")}</div>`,
      cap:"Limits from 28 December 2024. Claims lie against the operator.", src:"Source: Civil Aviation Authority of Thailand notice of the 2024 revision", say:"Three limits under the Montreal Convention from December 2024: 151,880 special drawing rights for death or injury, 6,303 for delay and 1,519 for baggage, per passenger. Claims lie against the operator."};
  };

  const fn = id => { const f = F[id] && F[id](); if (!f) return ""; return `<figure class="fig ${f.html ? "fg" : ""}" data-say="${esc(f.say)}"><div class="cv">${f.html || f.svg}</div>${f.cap ? `<figcaption>${esc(f.cap)}${f.src ? `<span class="src">${esc(f.src)}</span>` : ""}</figcaption>` : ""}</figure>`; };
  fn.hero = () => F.hero().svg;
  return fn;
})();
