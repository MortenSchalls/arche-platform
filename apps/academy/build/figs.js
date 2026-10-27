/* ---------- figures: drawn diagrams and charts (theme-aware, spoken by the audio) ---------- */
const FIGS = (() => {
  const W = 640;
  const box = (x,y,w,h,t,sub,cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="${cls||"f-panel s-line"}" stroke-width="1.2"/><text x="${x+w/2}" y="${y+h/2 - (sub?6:-5)}" text-anchor="middle" class="t-b">${t}</text>${sub ? `<text x="${x+w/2}" y="${y+h/2+13}" text-anchor="middle" class="t-s t-m">${sub}</text>` : ""}`;
  const arrow = (x1,y1,x2,y2,cls,dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls||"s-acc"}" stroke-width="2" ${dash?'stroke-dasharray="6 5"':""} marker-end="url(#ah)"/>`;
  const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="f-acc"/></marker></defs>`;
  const svg = (h, body, label) => `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;
  const jet = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="f-acc" d="M0,14 C6,6 20,4 44,4 L118,4 C128,4 136,8 140,12 L146,10 L152,0 L160,0 L156,14 C156,17 154,19 150,19 L20,20 C9,20 2,18 0,14 Z"/><path class="f-acc" opacity=".55" d="M58,15 L92,15 L104,30 L96,30 Z"/><circle cx="34" cy="9.5" r="1.8" class="f-panel"/><circle cx="42" cy="9.5" r="1.8" class="f-panel"/><circle cx="50" cy="9.5" r="1.8" class="f-panel"/><circle cx="58" cy="9.5" r="1.8" class="f-panel"/><circle cx="66" cy="9.5" r="1.8" class="f-panel"/><rect x="118" y="6" width="22" height="7" rx="3.5" class="f-soft"/></g>`;
  const F = {};

  F.hero = () => ({svg: svg(150, `<path d="M20,120 C200,70 420,60 620,30" class="s-line" stroke-width="1.2" fill="none" stroke-dasharray="3 7"/>${jet(380,20,1.45)}<text x="20" y="40" class="t-h">Arche Executive</text><text x="20" y="62" class="t-s t-m">Charter brokerage training</text>`, "A long-range business jet climbing"), say:""});

  F.who = () => ({svg: svg(250, `${box(10,40,140,64,"Client","the charterer")}${box(200,40,170,64,"Arche Executive","the broker")}${box(420,40,200,64,"Operator","holds the AOC, flies")}
    ${arrow(150,64,198,64)}${arrow(370,64,418,64)}
    <text x="174" y="32" text-anchor="middle" class="t-s t-m">enquiry, contract</text><text x="394" y="32" text-anchor="middle" class="t-s t-m">request, booking</text>
    ${box(200,150,170,54,"Avinode and our payment provider","quotes, bookings, payments","f-soft s-line")}
    ${arrow(285,104,285,148,"s-line",true)}
    ${box(420,150,200,54,"Crew and aircraft","work for the operator")}${arrow(520,104,520,148)}
    ${box(10,150,140,54,"FBO and handler","at each airport")}
    <text x="320" y="236" text-anchor="middle" class="t-s t-m">Safety and operational decisions belong to the operator and its crew.</text>`, "Who does what"),
    cap:"Who does what on a charter flight", say:"Diagram. The client sends the enquiry and signs the contract with Arche, the broker. Arche requests and books the flight with the operator, which holds the air operator certificate and flies the aircraft with its own crew. Quotes, bookings and payments run through Avinode and our payment provider. A handler and FBO look after the aircraft and passengers at each airport."});

  F.cats = () => {
    const c = [["Light jet",.55,"sit"],["Midsize",.7,"near standing"],["Super-midsize",.82,"standing"],["Heavy",1.0,"standing, galley"],["Ultra-long-range",1.2,"zones, crew rest"]];
    let y = 14, out = "";
    c.forEach((k,i) => { out += jet(150, y, k[1]) + `<text x="10" y="${y+14}" class="t-b">${k[0]}</text><text x="10" y="${y+31}" class="t-s t-m">${k[2]}</text>`; y += 30 + k[1]*26; });
    return {svg: svg(y+10, out, "Business jet categories by size"), cap:"Categories grow in cabin size and range. Always use the figures for the actual aircraft.", say:"Drawing of five business jets from small to large: light jet, midsize, super-midsize, heavy, and ultra-long-range with separate cabin zones and a crew rest area."};
  };

  const clock = (cx,cy,h,m,label,sub) => { const ah = ((h%12)+m/60)*30-90, am = m*6-90, r = 46; const p = (a,l) => `${cx+Math.cos(a*Math.PI/180)*l},${cy+Math.sin(a*Math.PI/180)*l}`;
    let ticks = ""; for (let i=0;i<12;i++) ticks += `<line x1="${p(i*30,r-6).split(",")[0]}" y1="${p(i*30,r-6).split(",")[1]}" x2="${p(i*30,r-1).split(",")[0]}" y2="${p(i*30,r-1).split(",")[1]}" class="s-ink" stroke-width="1.5"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" class="f-panel s-line" stroke-width="1.5"/>${ticks}<line x1="${cx}" y1="${cy}" x2="${p(ah,26).split(",")[0]}" y2="${p(ah,26).split(",")[1]}" class="s-ink" stroke-width="3.5" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${p(am,38).split(",")[0]}" y2="${p(am,38).split(",")[1]}" class="s-acc" stroke-width="2.5" stroke-linecap="round"/><text x="${cx}" y="${cy+72}" text-anchor="middle" class="t-b">${label}</text><text x="${cx}" y="${cy+90}" text-anchor="middle" class="t-s t-m">${sub}</text>`; };
  F.utc = () => ({svg: svg(190, `${clock(150,60,9,0,"09:00 in Bangkok","local time, UTC+7")}${clock(490,60,2,0,"02:00 Z","UTC, the same everywhere")}<text x="320" y="56" text-anchor="middle" class="t-h">=</text><text x="320" y="82" text-anchor="middle" class="t-s t-m">minus 7 hours</text>`, "Local time and UTC"),
    cap:"Quotes show local time; operators plan in UTC.", say:"Two clocks. 9 o'clock in the morning in Bangkok, local time, is 2 o'clock UTC, because Bangkok is 7 hours ahead of UTC."});

  F.pos = () => ({svg: svg(200, `<circle cx="40" cy="150" r="8" class="f-acc"/><text x="40" y="180" text-anchor="middle" class="t-s">Base</text>
    <circle cx="240" cy="60" r="8" class="f-acc"/><text x="240" y="40" text-anchor="middle" class="t-s">Client's airport</text>
    <circle cx="560" cy="80" r="8" class="f-acc"/><text x="560" y="60" text-anchor="middle" class="t-s">Destination</text>
    ${arrow(48,145,232,66,"s-acc",true)}${arrow(248,61,551,79)}${arrow(552,88,50,150,"s-acc",true)}
    <text x="110" y="92" class="t-s t-m">positioning</text><text x="380" y="58" class="t-s">passenger flight</text><text x="300" y="138" class="t-s t-m">positioning back to base</text>`, "Positioning legs"),
    cap:"Dashed lines are positioning legs without passengers; the client usually pays for them.", say:"Map. The aircraft flies empty from its base to the client's airport, flies the passengers to the destination, then flies empty back to base. The empty flights are positioning legs, usually paid by the client."});

  F.market = () => {
    const d = [["Africa",15],["Latin America",11],["Middle East",7],["Global",5],["Asia",4],["Europe",1]];
    let out = `<text x="10" y="22" class="t-b">Growth in business jet flights, 2025 versus 2024</text>`;
    d.forEach((r,i) => { const y = 40 + i*30, w = r[1]*18; out += `<text x="140" y="${y+15}" text-anchor="end" class="t-s">${r[0]}</text><rect x="150" y="${y}" width="${w}" height="20" rx="3" class="${r[0]==="Global"?"f-ink":"f-acc"}"/><text x="${156+w}" y="${y+15}" class="t-s t-b">${r[1]}%</text>`; });
    out += `<rect x="470" y="40" width="160" height="170" rx="10" class="f-soft"/><text x="550" y="70" text-anchor="middle" class="t-s t-m">People worth USD 30m+</text><text x="550" y="104" text-anchor="middle" class="t-h">713,626</text><text x="550" y="124" text-anchor="middle" class="t-s t-m">in 2026</text><text x="550" y="156" text-anchor="middle" class="t-s">up from 551,435</text><text x="550" y="174" text-anchor="middle" class="t-s">in 2021</text>`;
    return {svg: svg(230, out, "Market growth by region and number of very wealthy people"), cap:"North America has about 72% of all business jet flights; the fastest growth is elsewhere.", src:"Sources: WINGX full-year 2025; Knight Frank, The Wealth Report 2026", say:"Chart. In 2025, business jet flights grew 15 percent in Africa, 11 percent in Latin America, 7 percent in the Middle East, 4 percent in Asia and about 1 percent in Europe, and 5 percent worldwide. North America still has about 72 percent of all flights. The number of people worth 30 million US dollars or more reached 713,626 in 2026, up from 551,435 in 2021."};
  };

  F.freedoms = () => {
    const P = (x,y,n,t,lines) => { let g = `<rect x="${x}" y="${y}" width="200" height="104" rx="10" class="f-panel s-line"/><text x="${x+12}" y="${y+22}" class="t-b">${n}</text><text x="${x+46}" y="${y+22}" class="t-s t-m">${t}</text>`; lines.forEach(l => g += l); return g; };
    const dot = (x,y,l,cls) => `<circle cx="${x}" cy="${y}" r="9" class="${cls||"f-acc"}"/><text x="${x}" y="${y+4}" text-anchor="middle" class="t-x">${l}</text>`;
    const A = (x1,y1,x2,y2,c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c||"s-acc"}" stroke-width="2" marker-end="url(#ah)"/>`;
    let o = "";
    o += P(10,10,"3rd","home to abroad",[dot(50,70,"H"),dot(160,70,"A","f-ink"),A(60,70,149,70)]);
    o += P(220,10,"5th","on to a third country",[dot(250,70,"H"),dot(320,70,"A","f-ink"),dot(390,70,"B","f-ink"),A(260,70,309,70),A(330,70,379,70)]);
    o += P(430,10,"7th","abroad only",[dot(470,70,"A","f-ink"),dot(590,70,"B","f-ink"),A(480,70,579,70)]);
    o += P(10,124,"8th","through-flight cabotage",[dot(40,184,"H"),dot(110,184,"A","f-ink"),dot(180,184,"A","f-ink"),A(50,184,99,184),A(120,184,169,184,"s-red")]);
    o += P(220,124,"9th","stand-alone cabotage",[dot(270,184,"A","f-ink"),dot(380,184,"A","f-ink"),A(280,184,369,184,"s-red")]);
    o += `<rect x="430" y="124" width="200" height="104" rx="10" class="f-soft"/><text x="442" y="150" class="t-s"><tspan class="t-b">H</tspan> operator's home country</text><text x="442" y="172" class="t-s"><tspan class="t-b">A, B</tspan> other countries</text><text x="442" y="198" class="t-s">Red legs are domestic in a</text><text x="442" y="214" class="t-s">foreign country: cabotage</text>`;
    return {svg: svg(240, o, "Freedoms of the air"), cap:"The 8th and 9th freedoms are cabotage, which most countries refuse to foreign operators.", say:"Diagram of five freedoms of the air. Third: from the home country abroad. Fifth: onward from a foreign country to a third country. Seventh: between two foreign countries only. Eighth and ninth: flights between two airports inside the same foreign country. These are cabotage, which most countries refuse to foreign operators."};
  };

  F.never = () => {
    const items = ["Operator without a commercial AOC","Domestic leg on a foreign operator","US domestic flight on a non-US operator","Individual seats","Sanctioned people or embargoed places","Hidden passenger names"];
    let o = `<circle cx="80" cy="110" r="62" class="f-red"/><text x="80" y="104" text-anchor="middle" class="t-x2">NEVER</text><text x="80" y="128" text-anchor="middle" class="t-x2">SELL</text>`;
    items.forEach((t,i) => o += `<rect x="170" y="${14+i*34}" width="460" height="28" rx="6" class="f-panel s-line"/><text x="184" y="${33+i*34}" class="t-s">${t}</text>`);
    return {svg: svg(220, o, "Flights we never sell"), cap:"Six of the flights on the never-sell list. The full list is in the table.", say:"Stop sign: never sell. Six examples: an operator without a commercial air operator certificate; a domestic leg on a foreign operator; a US domestic flight on a non-US operator; individual seats; sanctioned people or embargoed places; and hidden passenger names."};
  };

  F.cabo = () => ({svg: svg(230, `<circle cx="80" cy="190" r="9" class="f-acc"/><text x="80" y="218" text-anchor="middle" class="t-s">Singapore</text>
    <circle cx="300" cy="50" r="9" class="f-acc"/><text x="300" y="30" text-anchor="middle" class="t-s">Bangkok</text>
    <circle cx="420" cy="170" r="9" class="f-acc"/><text x="420" y="200" text-anchor="middle" class="t-s">Phuket</text>
    <line x1="88" y1="183" x2="290" y2="56" class="s-ok" stroke-width="3" marker-end="url(#ah)"/><line x1="306" y1="59" x2="413" y2="160" class="s-amb" stroke-width="3" marker-end="url(#ah)"/><line x1="410" y1="172" x2="91" y2="190" class="s-ok" stroke-width="3" marker-end="url(#ah)"/>
    <rect x="460" y="30" width="170" height="110" rx="10" class="f-soft"/><text x="472" y="56" class="t-s t-b">Bangkok to Phuket</text><text x="472" y="76" class="t-s">is domestic. On a foreign</text><text x="472" y="94" class="t-s">aircraft only as one</text><text x="472" y="112" class="t-s">continuous journey,</text><text x="472" y="130" class="t-s">confirmed in writing.</text>`, "Cabotage example"),
    cap:"Green legs are international; the amber leg is domestic.", say:"Map. Singapore to Bangkok and Phuket to Singapore are international legs. Bangkok to Phuket is a domestic leg in Thailand. On a foreign aircraft it is only possible as one continuous international journey, confirmed by the operator in writing."});

  F.rag = () => {
    const L = [["Green","Proceed with sourcing","f-ok"],["Amber","Operator confirms in writing before we quote","f-amb"],["Red","Stop and escalate to the director","f-red"]];
    let o = `<rect x="40" y="10" width="90" height="210" rx="20" class="f-ink"/>`;
    L.forEach((l,i) => o += `<circle cx="85" cy="${50+i*65}" r="24" class="${l[2]}"/><text x="160" y="${46+i*65}" class="t-b">${l[0]}</text><text x="160" y="${66+i*65}" class="t-s">${l[1]}</text>`);
    return {svg: svg(230, o, "The trip risk screen"), cap:"Every enquiry gets a colour before sourcing.", say:"Traffic light. Green means proceed with sourcing. Amber means the operator confirms in writing before we quote. Red means stop and escalate to the director."};
  };

  F.screen = () => ({svg: svg(220, `${box(10,20,130,60,"List names","everyone involved")}${arrow(140,50,168,50)}${box(170,20,150,60,"Search lists","UN, MAS, OFAC, EU, UK")}${arrow(320,50,348,50)}${box(350,20,120,60,"Record","date, lists, result")}${arrow(470,50,498,50)}
    <polygon points="560,14 620,50 560,86 500,50" class="f-soft s-line"/><text x="560" y="55" text-anchor="middle" class="t-b">Match?</text>
    ${arrow(560,86,560,128)}${box(470,130,170,60,"Possible match","stop, no payment, director","f-red-soft s-red")}
    <text x="440" y="118" class="t-s t-m">no: continue</text>`, "Sanctions screening steps"),
    cap:"Screen every name, record the result, and stop at any possible match.", say:"Flow chart. List every name, search the UN, Singapore, US, EU and UK sanctions lists, and record the date, lists and result. If there is no match, continue. If there is a possible match, stop, take no payment and report to the director."});

  F.cycle = () => {
    const s = ["Enquiry","Qualify","Legal check","Feasibility","Sourcing","Quote","Contract and payment","Operations","Close"];
    let o = ""; s.forEach((t,i) => { const r = Math.floor(i/5), c = i%5, x = 10 + c*126, y = 14 + r*80; o += `<path d="M${x},${y} h104 l14,26 l-14,26 h-104 l12,-26 z" class="${i===2?"f-acc":"f-soft"}"/><text x="${x+62}" y="${y+24}" text-anchor="middle" class="t-x3 ${i===2?"t-inv":""}">${i+1}</text><text x="${x+62}" y="${y+42}" text-anchor="middle" class="t-s ${i===2?"t-inv":""}">${t.length>14?t.split(" ")[0]+" …":t}</text>`; });
    return {svg: svg(180, o + `<text x="10" y="172" class="t-s t-m">The legal check (step 3) comes before any sourcing.</text>`, "The booking life cycle"), cap:"Nine stages from enquiry to closed file.", say:"The booking life cycle in nine stages: enquiry, qualification, legal check, feasibility, sourcing, quote, contract and payment, operations, and close. The legal check comes before any sourcing."};
  };

  F.airport = () => {
    const t = [["Hours","opening and curfews"],["Customs","available, or on request"],["Fire cover","category suits the aircraft"],["Runway","length for the load"],["Slots, parking","approved in time"],["FBO, handler","service at arrival"]];
    let o = ""; t.forEach((k,i) => { const x = 10 + (i%3)*210, y = 10 + Math.floor(i/3)*86; o += `<rect x="${x}" y="${y}" width="196" height="74" rx="10" class="f-panel s-line"/><circle cx="${x+30}" cy="${y+37}" r="14" class="f-soft"/><text x="${x+30}" y="${y+42}" text-anchor="middle" class="t-b">${i+1}</text><text x="${x+54}" y="${y+33}" class="t-b">${k[0]}</text><text x="${x+54}" y="${y+52}" class="t-s t-m">${k[1]}</text>`; });
    return {svg: svg(190, o, "Airport checks"), cap:"Six checks before an airport goes in the quote. The operator confirms.", say:"Six airport checks: opening hours and curfews; customs available; fire cover category suits the aircraft; runway length for the load; slots and parking approved; and an FBO or handler for arrival. The operator confirms them."};
  };

  F.vet = () => {
    const s = ["All quotes received","AOC and aircraft on the operations specifications","Insurance covers commercial passengers","ARGUS Platinum, WYVERN Wingman or IS-BAO Stage 2–3","Not on any banned list; not sanctioned","Shortlist for the client"];
    let o = ""; s.forEach((t,i) => { const w = 620 - i*70, x = (640-w)/2, y = 8 + i*34; o += `<rect x="${x}" y="${y}" width="${w}" height="28" rx="6" class="${i===5?"f-acc":"f-soft"}"/><text x="320" y="${y+19}" text-anchor="middle" class="t-s ${i===5?"t-inv t-b":""}">${t}</text>`; });
    return {svg: svg(214, o, "Operator vetting funnel"), cap:"Each check narrows the field. Any other operator needs the director's approval and the client told in writing.", say:"Funnel. From all quotes received, keep operators whose aircraft is on their AOC operations specifications, whose insurance covers commercial passengers, with ARGUS Platinum or Platinum Elite, WYVERN Wingman or IS-BAO Stage 2 or 3, and who are not banned or sanctioned. What remains is the shortlist for the client."};
  };

  F.price = () => ({svg: svg(200, `<text x="10" y="20" class="t-b">Right: divide by 0.91</text>
    <rect x="10" y="30" width="560" height="40" rx="4" class="f-soft"/><rect x="570" y="30" width="55" height="40" rx="4" class="f-acc"/><text x="290" y="55" text-anchor="middle" class="t-s">Arche cost 100,000 = 91%</text><text x="597" y="55" text-anchor="middle" class="t-x">9%</text><text x="625" y="90" text-anchor="end" class="t-s">Client price 109,891 · margin 9,891 = 9.0%</text>
    <text x="10" y="128" class="t-b">Wrong: add 9%</text>
    <rect x="10" y="138" width="560" height="40" rx="4" class="f-soft"/><rect x="570" y="138" width="50" height="40" rx="4" class="f-red"/><text x="290" y="163" text-anchor="middle" class="t-s">Arche cost 100,000</text><text x="625" y="196" text-anchor="end" class="t-s">Client price 109,000 · margin 9,000 = only 8.26%</text>`, "The 9 percent price formula"),
    cap:"The margin is 9% of the client price, so divide the cost by 0.91 and round up.", say:"Two bars. Right: an Arche cost of 100,000 divided by 0.91 gives a client price of 109,891, and the margin of 9,891 is 9 percent of the price. Wrong: adding 9 percent gives 109,000, and the margin of 9,000 is only 8.26 percent of the price."});

  F.ex = () => {
    const r = [["A. One-way",100000,109891],["B. Multi-leg",180000,197803],["D. With supplier item",61200,67253]];
    let o = ""; r.forEach((k,i) => { const y = 14 + i*62, wc = k[1]/200000*470, wp = k[2]/200000*470; o += `<text x="10" y="${y+12}" class="t-s t-b">${k[0]}</text><rect x="150" y="${y}" width="${wc}" height="18" rx="3" class="f-soft"/><text x="${156+wc}" y="${y+14}" class="t-s t-m">cost ${k[1].toLocaleString("en-US")}</text><rect x="150" y="${y+22}" width="${wp}" height="18" rx="3" class="f-acc"/><text x="${156+wp}" y="${y+36}" class="t-s">price ${k[2].toLocaleString("en-US")}</text>`; });
    return {svg: svg(200, o, "Worked examples"), cap:"Cost and client price for three of the worked examples (USD).", say:"Bar chart of three worked examples. One-way: cost 100,000, price 109,891. Multi-leg: cost 180,000, price 197,803. With a supplier item: cost 61,200, price 67,253."};
  };

  F.money = () => ({svg: svg(220, `${box(10,30,130,60,"Client","pays the request")}${arrow(140,60,198,60)}${box(200,20,180,80,"Payment provider","holds client funds","f-soft s-line")}${arrow(380,60,448,60)}${box(450,30,180,60,"Operator","paid on its terms")}
    ${arrow(290,100,290,148)}${box(200,150,180,60,"Arche account","only the margin")}<text x="410" y="160" class="t-s t-m">Citi Singapore</text><text x="410" y="178" class="t-s t-m">(being set up)</text>`, "How money moves"),
    cap:"Operator money never passes through Arche's own account.", say:"Diagram. The client pays the payment request. The payment account holds the funds and the operator is paid on its terms. Only Arche's margin moves to Arche's own account at Citi Singapore."});

  F.day = () => {
    const s = [["Before","details to operator, permits and slots confirmed, trip brief sent"],["From 48 h","watch the forecast, warn early"],["Day of flight","track the flight, update the client first"],["Within 7 days","recharge at-cost items with receipts, close the file"]];
    let o = `<line x1="30" y1="40" x2="610" y2="40" class="s-line" stroke-width="3"/>`;
    s.forEach((k,i) => { const x = 30 + i*193; o += `<circle cx="${x}" cy="40" r="11" class="${i===2?"f-acc":"f-panel s-acc"}" stroke-width="2.5"/><text x="${x}" y="76" text-anchor="${i===3?"end":i===0?"start":"middle"}" class="t-b">${k[0]}</text>`;
      const words = k[1].split(" "); let line = "", ly = 96; words.forEach(w => { if ((line+w).length > 24) { o += `<text x="${x}" y="${ly}" text-anchor="${i===3?"end":i===0?"start":"middle"}" class="t-s t-m">${line.trim()}</text>`; ly += 17; line = ""; } line += w + " "; }); o += `<text x="${x}" y="${ly}" text-anchor="${i===3?"end":i===0?"start":"middle"}" class="t-s t-m">${line.trim()}</text>`; });
    return {svg: svg(170, o, "Trip timeline"), cap:"Keep the client informed before they need to ask.", say:"Timeline. Before the flight: passenger details to the operator, permits and slots confirmed, trip brief sent. From 48 hours: watch the forecast and warn early. Day of flight: track the flight and update the client first. Within 7 days: recharge at-cost items with receipts and close the file."};
  };

  F.funnel = () => {
    const s = [["New enquiry",620],["Qualified",520],["Quoted",420],["Won",300]];
    let o = ""; s.forEach((k,i) => { const x = (640-k[1])/2, y = 8 + i*40; o += `<rect x="${x}" y="${y}" width="${k[1]}" height="32" rx="6" class="${i===3?"f-acc":"f-soft"}"/><text x="320" y="${y+21}" text-anchor="middle" class="t-s ${i===3?"t-inv t-b":""}">${k[0]}</text>`; });
    o += `<text x="10" y="186" class="t-s t-m">Lost? Record the reason: price, aircraft, timing, no decision. It shows what to fix.</text>`;
    return {svg: svg(196, o, "Sales pipeline"), cap:"Every enquiry moves through the pipeline in the CRM.", say:"Funnel: new enquiry, qualified, quoted, won. For every lost enquiry, record the reason, such as price, aircraft, timing or no decision."};
  };

  F.montreal = () => {
    const t = [["151,880 SDR","death or injury, per passenger"],["6,303 SDR","delay, per passenger"],["1,519 SDR","baggage, per passenger"]];
    let o = ""; t.forEach((k,i) => { const x = 10 + i*210; o += `<rect x="${x}" y="10" width="196" height="96" rx="10" class="f-soft"/><text x="${x+98}" y="52" text-anchor="middle" class="t-h">${k[0]}</text><text x="${x+98}" y="80" text-anchor="middle" class="t-s t-m">${k[1]}</text>`; });
    return {svg: svg(118, o, "Montreal Convention limits"), cap:"Limits from 28 December 2024. Claims lie against the operator.", src:"Source: Civil Aviation Authority of Thailand notice of the 2024 revision", say:"Three limits under the Montreal Convention from December 2024: 151,880 special drawing rights for death or injury, 6,303 for delay and 1,519 for baggage, per passenger. Claims lie against the operator."};
  };

  const fn = id => { const f = F[id] && F[id](); if (!f) return ""; return `<figure class="fig" data-say="${esc(f.say)}"><div class="cv">${f.svg}</div>${f.cap ? `<figcaption>${esc(f.cap)}${f.src ? `<span class="src">${esc(f.src)}</span>` : ""}</figcaption>` : ""}</figure>`; };
  fn.hero = () => F.hero().svg;
  return fn;
})();
