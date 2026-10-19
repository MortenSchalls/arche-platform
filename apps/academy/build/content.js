/* ===== Course content: from the Master Training Manual (ARC-MST-TRN-2026-007), October 2026 ===== */
const L = {
  avBroker:["Avinode for brokers","https://avinode.com/broker/"],
  avPay:["How air charter payments work (Paynode)","https://www.avinode.com/how-air-charter-payments-work/"],
  avStart:["Getting Started with Avinode Marketplace","https://help.avinodegroup.com/hc/en-us/articles/12043060610331-Getting-Started-with-Avinode-Marketplace"],
  sky:["SKYbrary: aviation terms explained","https://skybrary.aero/"],
  gulf:["Gulfstream aircraft","https://www.gulfstream.com/en/aircraft/"],
  dass:["Dassault Falcon","https://www.dassaultfalcon.com/"],
  bomb:["Bombardier aircraft","https://businessaircraft.bombardier.com/"],
  uwThai:["Thailand permit planning (Universal Weather)","https://www.universalweather.com/blog/planning-bizav-operations-to-thailand-part-1-permit-planning/"],
  nbaaBP:["NBAA Best Practices for Air Charter Brokering (2024)","https://nbaa.org/wp-content/uploads/2024/07/NBAA-Best-Practices-for-Air-Charter-Brokering.pdf"],
  nbaaCG:["NBAA Aircraft Charter Consumer Guide","https://nbaa.org/flight-department-administration/aircraft-operating-ownership-options/aircraft-charter/aircraft-charter-consumer-guide/"],
  p295:["14 CFR Part 295, air charter brokers","https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-295"],
  fr2018:["US final rule on charter brokers (2018)","https://www.federalregister.gov/documents/2018/09/17/2018-18345/increasing-charter-air-transportation-options"],
  nata:["Public charters and selling seats (NATA)","https://nata.aero/advocacy/initiatives-and-issues/public-charter-operations/public-charter-faqs/"],
  tco:["EASA third-country operators (TCO)","https://www.easa.europa.eu/en/domains/air-operations/third-country-operators"],
  stv:["Charter flights by non-EU operators (Swedish Transport Agency)","https://www.transportstyrelsen.se/en/aviation/air-operators/traffic-permits/charter-flights-non-scheduled-air-service/"],
  asl:["EU Air Safety List","https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en"],
  caa:["UK CAA: charters and air taxi flights","https://www.caa.co.uk/air-passengers/about-your-trip/charters-and-air-taxis-flights/"],
  atol:["UK CAA: ATOL protection","https://www.caa.co.uk/atol-protection/"],
  caas:["CAAS: foreign air operators","https://www.caas.gov.sg/operations-safety/air-operations/foreign-air-operators"],
  caat:["Thailand CAAT eAIP (open GEN 1.2)","https://aip.caat.or.th/"],
  ebaa:["EU sanctions and business aviation (EBAA)","https://www.ebaa.org/app/uploads/2023/04/Impact-of-EU-Sanctions-against-Russia-and-Belarus-on-BizAv.pdf"],
  czib:["EASA Conflict Zone Information Bulletins","https://www.easa.europa.eu/en/domains/air-operations/czibs"],
  faa:["FAA prohibitions, restrictions and notices","https://www.faa.gov/air_traffic/publications/us_restrictions"],
  safe:["Safe Airspace (OPSGROUP)","https://safeairspace.net/"],
  un:["UN Security Council consolidated list","https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list"],
  ofac:["US OFAC sanctions list search","https://sanctionssearch.ofac.treas.gov/"],
  eumap:["EU sanctions map","https://www.sanctionsmap.eu/"],
  uks:["UK Sanctions List search","https://search-uk-sanctions-list.service.gov.uk"],
  mas:["Singapore MAS targeted financial sanctions","https://www.mas.gov.sg/regulation/anti-money-laundering/targeted-financial-sanctions"],
  irs:["IRS guide: air transportation excise tax","https://irs.gov/pub/irs-mssp/air_transportation.pdf"],
  apd:["UK Air Passenger Duty rates","https://www.gov.uk/guidance/rates-and-allowances-for-air-passenger-duty"],
  tim:["IATA Timatic (travel documents)","https://www.iata.org/en/publications/timatic/"],
  payNo:["What Paynode cannot support","https://help.avinodegroup.com/hc/en-us/articles/43773188664347-Know-Before-You-Receive-or-Collect-Payment-What-Our-Payments-Platform-Cannot-Support"],
  argus:["ARGUS audits and ratings","https://argus.aero/auditing-services"],
};

const COURSE = [
 {id:"m0", n:"0", t:"Aviation for brokers", live:true},
 {id:"m1", n:"1", t:"Arche Executive and the broker's role"},
 {id:"m2", n:"2", t:"Where we may and may not sell", live:true},
 {id:"lab", n:"2L", t:"Lab: the trip risk screen", live:true, lab:true},
 {id:"m3", n:"3", t:"Compliance: KYC, sanctions, fraud"},
 {id:"m4", n:"4", t:"Our clients"},
 {id:"m5", n:"5", t:"Enquiry intake and qualification"},
 {id:"m6", n:"6", t:"Flight feasibility and trip planning"},
 {id:"m7", n:"7", t:"Aircraft knowledge: long-range jets"},
 {id:"m8", n:"8", t:"Sourcing on Avinode and operator vetting"},
 {id:"m9", n:"9", t:"Pricing and quoting"},
 {id:"m10", n:"10", t:"Contract, payment and settlement"},
 {id:"book", n:"10P", t:"Practical: the booking form", live:true, lab:true},
 {id:"m11", n:"11", t:"Trip operations and the 24/7 desk"},
 {id:"m12", n:"12", t:"Selling and the consultant desk"},
 {id:"m13", n:"13", t:"Case studies"},
 {id:"m14", n:"14", t:"Assessment and certification"},
];
const PILOT_REQ = ["m0","m2","lab","book"];

const MODS = {
m0:{ intro:"Everything a broker needs before talking to a client or an operator, in plain words. Start here even if some of it seems simple: brokers who skip the basics make the expensive mistakes.",
 secs:[
 {h:"0.1 Who does what", b:[
  {table:{cols:["Party","Role in a charter"],rows:[
   ["Client (charterer)","The person or company who hires the whole aircraft and pays for the trip."],
   ["Broker (Arche)","Finds the aircraft, checks the operator, prices, contracts and looks after the client. We do not fly or own aircraft."],
   ["Operator","The airline company that flies the aircraft and is responsible for safety. It holds an Air Operator Certificate (AOC) from its national aviation authority."],
   ["Aircraft owner","Often a private person or company that places its aircraft with an operator, which flies it commercially."],
   ["Crew","Captain and first officer (the pilots) and, on larger jets, one or more cabin attendants. They work for the operator."],
   ["Handler and FBO","At each airport, a handler arranges fuel, parking, catering and paperwork. An FBO (fixed-base operator) is the private terminal where passengers check in."],
   ["Trip support","A company or the operator's own team that obtains permits, slots and flight plans."],
   ["Aviation authority","Each country's regulator, for example the FAA (US), EASA and national authorities (Europe), the UK CAA, the GCAA (UAE), CAAS (Singapore). It licenses operators and approves foreign flights."],
   ["Avinode","The online marketplace where operators list aircraft and brokers request and compare quotes. Arche books every trip through it."],
   ["Paynode","Avinode's payment service. Clients pay and operators are paid through it."]]}},
  {links:[L.avBroker,L.avPay]}]},
 {h:"0.2 Aircraft categories", b:[
  {p:"Private jets are grouped by cabin size and range. Avinode shows each aircraft's category, seats and range: always use the figures for the actual aircraft, not a general rule."},
  {table:{cols:["Category","In plain words","Typical use"],rows:[
   ["Turboprop","Propeller aircraft with jet engines driving the propellers; slower, can use short runways","Short regional trips, small airports"],
   ["Very light and light jet","Small cabin, usually no standing room","Short trips with few passengers"],
   ["Midsize and super-midsize jet","Standing or near-standing cabin, more seats and range","Medium trips, often across a region"],
   ["Heavy or large-cabin jet","Tall, long cabin, lavatory and galley, often a cabin attendant and sleeping options","Long trips, larger groups, comfort"],
   ["Ultra-long-range jet","Large-cabin jets built to cross oceans and continents without a stop; crew rest area","Intercontinental trips (our focus)"],
   ["VIP airliner","Converted airliners such as the Boeing Business Jet and Airbus Corporate Jet","Large groups, heads of state, sports teams"]]}},
  {links:[L.gulf,L.bomb,L.dass]}]},
 {h:"0.3 Airports and their codes", b:[
  {p:"Every airport has two codes. Airlines and clients use the three-letter IATA code; operators, pilots and Avinode often use the four-letter ICAO code. Use both in quotes, and always check: many cities have several airports, and business aviation often uses a different airport from the airlines."},
  {table:{cols:["City","Airport","IATA","ICAO"],rows:[["London","Luton","LTN","EGGW"],["New York","Teterboro","TEB","KTEB"],["Dubai","Dubai International","DXB","OMDB"],["Bangkok","Suvarnabhumi","BKK","VTBS"],["Singapore","Changi","SIN","WSSS"],["Geneva","Geneva","GVA","LSGG"]]},mono:[2,3]},
  {tryq:{q:"A client asks for a jet \"from New York\". What do you do?",o:["Book JFK, it is the main airport","Ask which airport; Teterboro (TEB / KTEB) is a common business-aviation airport","Use Newark, it is always cheaper","Nothing, the operator will choose"],a:1,why:"Many cities have several airports and business aviation often uses a different one from the airlines. Confirm the airport in writing."}}]},
 {h:"0.4 Time", b:[
  {list:["Aviation works in UTC (also called Zulu or Z), the same time everywhere. Clients think in local time.","Every quote and trip brief shows local times and says so. Check arrival dates on long flights: crossing time zones or the date line can change the arrival date.","When a client says \"tomorrow morning\", confirm the date, the time and the time zone in writing."]},
  {tryq:{q:"A client in Bangkok wants to leave at 09:00 local. The operator's schedule shows 02:00Z. Do they match?",o:["Yes. Bangkok is UTC+7, so 09:00 local is 02:00 UTC","No, they are 7 hours apart","No, Z means the operator's home time","It cannot be known"],a:0,why:"Thailand is UTC+7 all year. Local time minus 7 hours gives UTC (Z)."}}]},
 {h:"0.5 Flight time, block time and positioning", b:[
  {list:["Flight time runs from take-off to landing. Block time runs from when the aircraft moves off its stand to when it stops at the destination. Operators price on either; their quote says which.","A positioning leg (also called a ferry) is a flight without passengers to bring the aircraft to the client, or back to base. The client usually pays for it.","An empty leg is a positioning flight the operator sells cheaply. It can be cancelled or moved if the main trip changes.","A one-way trip can cost almost as much as a return if the aircraft must fly back empty."]},
  {tryq:{q:"A client books an empty leg Geneva to London. The operator's main charter is cancelled. What can happen?",o:["Nothing, the empty leg is a confirmed charter","The operator can cancel or move the empty leg","Arche must find a replacement at its own cost","The client is charged the full charter price"],a:1,why:"An empty leg depends on the main trip. The client must accept this risk in writing (Module 9)."}}]},
 {h:"0.6 Permits, slots and border control", b:[
  {list:["Permits: most countries require permission for a foreign commercial flight to land or fly over them.","Slots: busy airports allocate take-off and landing times. A permit may not be issued until a slot is confirmed.","PPR (prior permission required): some airports require advance approval for parking or for the flight.","Border control: passengers pass customs, immigration and health checks. Authorities may require passenger details in advance.","Lead times vary by country and airport, and change. The operator and its trip support know the current rules: we ask them every time."]},
  {links:[L.uwThai,L.tim]}]},
 {h:"0.7 Crew duty", b:[
  {p:"Pilots and cabin crew may only work a limited number of hours in a duty period, set by their authority. A long flight, an early start after a late arrival, or several legs in one day can exceed those limits. The operator then adds a second crew, flies a fresh crew in, or plans a night stop. This changes the price and the schedule, so we ask early."},
  {links:[L.sky]}]},
 {h:"0.8 Weather, air traffic and safety culture", b:[
  {p:"Fog, storms, snow, strong winds and air-traffic restrictions can delay or divert a flight. Decisions about safety belong to the captain and the operator alone. Our job is to keep the client informed and arrange what they need on the ground."},
  {box:{t:"Safety culture at Arche",l:["Speak up about anything unsafe or illegal.","Report your own mistakes at once. Honest reports are never punished; hiding a mistake is.","The director keeps a log of errors and near misses and reviews it with the team."]}}]}
 ],
 quiz:[
  {q:"A client asks for a flight \"from New York tomorrow at 9\". What must you confirm?",o:["Only the aircraft size","Which New York airport, the date and the time zone","Only the price","Nothing, it is clear"],a:1,why:"Several airports serve New York, and \"tomorrow at 9\" needs a date and a time zone. Confirm all three in writing."},
  {q:"Who decides whether it is safe to take off in bad weather?",o:["The client","The broker","The captain and the operator","The FBO"],a:2,why:"Safety decisions belong to the captain and the operator alone."},
  {q:"Why might a one-way trip cost almost as much as a return?",o:["Tax rules","The aircraft may have to fly back empty","Crew bonuses","It never does"],a:1,why:"The client usually pays for positioning, including the empty flight back to base."},
  {q:"What is the ICAO code for London Luton?",o:["LTN","EGGW","LON","LUT"],a:1,why:"LTN is the IATA code. ICAO codes have four letters; UK airports start with EG."},
  {q:"Who holds the Air Operator Certificate (AOC) for a charter flight?",o:["Arche Executive","The aircraft owner","The operator","The handler"],a:2,why:"The operator holds the AOC and is responsible for the flight. Arche is the broker."},
  {q:"An operator says a long trip needs a second crew. What is the effect?",o:["None for the client","Price and schedule may change, so ask early","The flight becomes illegal","The broker must supply the crew"],a:1,why:"Crew duty limits drive extra crews, fresh crews or night stops, which change price and schedule."}
 ]},

m2:{ intro:"Arche sells worldwide, so we meet many sets of rules. This module gives the principles that apply everywhere, the flights we never sell, a map by region and the trip risk screen. The law changes: the operator, its trip support and the official sources linked here confirm what applies to each flight. When anything is unclear, the director decides before a quote is sent.",
 secs:[
 {h:"2.1 The broker's boundary", b:[
  {p:"A broker arranges a flight; the operator performs it. Never describe Arche as the airline, never put our name forward as the carrier, and never let a client believe we fly or own the aircraft."},
  {links:[L.nbaaBP]}]},
 {h:"2.2 What every client is told, worldwide", b:[
  {p:"We apply the strictest common standard to every client. Before the contract is signed, the client receives in writing:"},
  {olist:["That Arche Executive acts as a charter broker and not as the operator.","The operator's full legal name as shown on its AOC, and any trading name it uses.","The aircraft type, registration and year of manufacture, or \"type or similar\" until the tail is fixed.","The total price, what it includes, and every item that may be charged after the flight and how.","The passenger insurance the operator carries, as confirmed by the operator, and whether Arche itself holds liability insurance."]},
  {links:[L.p295,L.nbaaCG]}]},
 {h:"2.3 Our contract position", b:[
  {p:"All bookings run through Avinode, and all client and operator payments run through Paynode, so that only Arche's margin enters Arche's own account. Use only the approved Arche charter confirmation (Part A Key Booking Terms and Part B Standard Conditions), never your own wording, and never agree to change liability, cancellation or payment terms."}]},
 {h:"2.4 Flights we never sell", b:[
  {table:{cols:["Never sell","Why","What to do"],rows:[
   ["A flight by an operator without a commercial AOC, or on an aircraft not listed on its AOC","Illegal charter: uninsured and unsafe","Reject; report to the director"],
   ["A domestic leg (two airports in one country) on a foreign operator's aircraft, unless the operator confirms in writing that the country allows it","Cabotage: most countries reserve domestic flights for their own carriers","Use a local operator, or redesign the trip"],
   ["US domestic flights (both airports in the US) on any non-US operator","US law allows only US-citizen carriers to fly passengers within the US","Never quote"],
   ["Any US domestic flight, even on a US operator, until US counsel has confirmed Arche's position","Arche policy","Pass to the director"],
   ["Flights between two EU countries, or inside one, on a non-EU operator, unless the operator confirms the permission","EU traffic is reserved for EU carriers","Use an EU operator"],
   ["Individual seats sold to different people on one flight","Selling seats needs public-charter or airline authority","Never sell per seat"],
   ["Flights into, out of or over the EU for a Russian national (including dual nationals) or a company controlled by one, or on Russian-registered aircraft","EU sanctions deny landing, take-off and overflight to such aircraft, including chartered aircraft","Stop; report to the director"],
   ["Flights for sanctioned persons or companies, or to embargoed destinations without director clearance","Sanctions law (Module 3)","Stop; report to the director"],
   ["Operators on the EU Air Safety List","Safety and EU law","Never use"],
   ["Medical flights with patients needing care on board","Air ambulance needs specific approvals and equipment","Refer through the director"],
   ["Flights with accommodation or other travel sold as one package","Package-travel and travel-licence rules (for example ATOL in the UK)","Only with director approval"],
   ["Any flight where the client asks to hide passenger names from the operator or the authorities","Illegal and a sanctions and security risk","Refuse; report to the director"]]}},
  {links:[L.caa,L.p295,L.asl,L.ebaa,L.nata,L.atol]}]},
 {h:"2.5 The map by region", b:[
  {regions:[
   ["United States","Part 295 applies to anyone acting as an air charter broker: say we are a broker, name the operator, disclose our liability insurance or that we have none, give the full price with a good-faith estimate of known extra fees, never misrepresent aircraft, ratings or safety.","Only US-citizen carriers may fly passengers between US points. Foreign operators need US authority for international charters.",[L.p295,L.fr2018]],
   ["Canada and Latin America","Consumer law of the client's country.","Domestic flights are generally reserved for local carriers; foreign operators need permits per flight. Confirm with the operator.",[]],
   ["EU, EEA and Switzerland","No broker licence; EU consumer and package-travel rules for consumer sales; EU sanctions.","Non-EU operators need an EASA TCO authorisation and each state's permits; whole aircraft only; no tickets to the public. Traffic inside the EU is reserved for EU carriers.",[L.tco,L.stv]],
   ["United Kingdom","The CAA treats flights for payment without an AOC as illegal. Package sales to UK consumers can fall under ATOL.","Foreign operators need UK permission; UK domestic legs are reserved for UK carriers unless permitted.",[L.caa,L.atol]],
   ["Middle East and Africa","No specific broker licence in most states.","Landing and overflight permits through the operator's handler; sponsor rules and lead times differ by state.",[]],
   ["Singapore (our home)","Singapore company, tax and data-protection law apply to Arche.","Foreign operators need a CAAS Foreign Operator Operations Permit, an Air Transport Permit through flightSG for each non-scheduled flight, and a slot: Changi slot requests at least 72 hours before the flight.",[L.caas]],
   ["Thailand (our Asian hub)","Thai data-protection law for data handled in Thailand.","Overflight and landing permits from CAAT; slots and parking approval first at the main Bangkok airports and Phuket; full schedule, passenger and crew details; cabotage closely enforced.",[L.caat,L.uwThai]],
   ["Rest of Asia-Pacific","Consumer and data law of the client's country.","Domestic flights generally reserved for local carriers; permits and lead times vary widely. Confirm with the operator.",[]]]}]},
 {h:"2.6 Cabotage: try it", b:[
  {p:"Cabotage means a domestic flight inside one country. Decide each trip below before you read the answer. All are on a foreign-registered aircraft."},
  {tryq:{q:"London – Paris – London",o:["International legs: normally fine with permits (and EU and UK permission for a non-EU operator)","Domestic leg: needs operator confirmation","Never on a non-US operator"],a:0,why:"Each leg crosses a border. Permits still apply."}},
  {tryq:{q:"Teterboro – Miami – Nassau, on a European operator",o:["Fine, the trip ends abroad","Teterboro – Miami is US domestic: never on a non-US operator","Only Nassau needs a permit"],a:1,why:"Both airports are in the US. Use a US operator for the whole trip, subject to Arche's US policy."}},
  {tryq:{q:"Dubai – Mumbai – Delhi – Dubai",o:["International legs only","Mumbai – Delhi is Indian domestic: only if the operator confirms in writing that it is permitted","Never possible"],a:1,why:"Two Indian airports in a row make a domestic leg."}},
  {tryq:{q:"Bangkok – Phuket – Singapore with the same passengers",o:["Fine without checks","Bangkok – Phuket is domestic: only as one continuous international journey declared on the permit, confirmed by the operator","Never possible"],a:1,why:"Thailand enforces cabotage closely. The whole routing and manifest go on the permit."}}]},
 {h:"2.7 Spotting illegal charter", b:[
  {list:["Get the operator's AOC and the operations specifications that list the aircraft, and check the aircraft is on them.","Get the insurance certificate and check it covers commercial passenger flights.","Watch for privately registered aircraft offered for payment, \"cost-sharing\", dry leases sold as charter, prices far below the market, and refusal to send documents.","Reject any aircraft offered without a commercial AOC and report it to the director the same day."]},
  {links:[L.caa,L.nbaaCG,L.argus]}]},
 {h:"2.8 Other rules that follow the trip", b:[
  {p:"None of these is a reason to refuse a trip by itself; each is a reason to check before quoting. The director's watchlist (Appendix G) lists current places and topics."},
  {table:{cols:["Area","What to spot","Action"],rows:[
   ["Conflict zones and closed airspace","Routes over or near conflict areas; EASA bulletins and FAA notices; insurers may exclude war-risk areas","Operator confirms routing and insurance in writing; director approves"],
   ["Sanctions and embargoes","Broad sanctions, sector sanctions, US export rules for US-made aircraft","Stop; director decides"],
   ["Hidden domestic legs","Islands and territories that belong to another country (Hawaii, Puerto Rico, Canary Islands, Corsica)","Cabotage check with the operator"],
   ["Taxes that follow the trip","US federal excise tax; EU VAT; UK Air Passenger Duty (higher rate for aircraft of 20 tonnes or more with fewer than 19 seats); Singapore GST","Operator states taxes in its quote; director confirms our role with the accountant"],
   ["Packages","EU package-travel rules and UK ATOL when sold with a hotel or other travel","Director approval"],
   ["Politically exposed persons","Heads of state, ministers, senior officials, state-company managers, their families and close associates","Enhanced KYC; director approval"],
   ["Bribery laws that reach abroad","US FCPA and UK Bribery Act; officials or handlers asking for cash to \"speed up\"","Refuse; report"],
   ["Children","A child travelling without both parents may need a consent letter","Ask for consent documents; escalate any doubt"],
   ["Animals","Rabies-free countries have strict import routes and approved arrival airports","Check the authority's rules before quoting"],
   ["Weapons, cash, valuables","Firearms, large cash sums and precious metals need permits or declarations","Operator and authorities decide; director informed"],
   ["Airport restrictions","Night curfews, slot-controlled airports, temporary restrictions during major events","Operator confirms"],
   ["Paynode limits","Paynode cannot pay to or from some countries","A payer or operator there is red: stop and tell the director"]]}},
  {links:[L.czib,L.faa,L.safe,L.un,L.ofac,L.eumap,L.uks,L.mas,L.irs,L.apd,L.tim,L.payNo]}]},
 {h:"2.9 The trip risk screen", b:[
  {p:"Every enquiry passes this screen before sourcing, and the result goes on the intake form. Green means proceed. Amber means the operator or its trip support confirms in writing before we quote. Red means stop and escalate to the director. Always check the current watchlist, never your memory."},
  {table:{cols:["Question","Amber","Red"],rows:[
   ["1. Who flies and pays?","PEP; child with one adult; payer differs from the client","Sanctions match; Russian national with an EU point; refuses KYC; payer or operator in a country Paynode cannot serve"],
   ["2. Where?","Domestic leg; conflict-zone routing; strict permit country","US domestic leg; embargoed destination"],
   ["3. What aircraft and operator?","No safety rating; US-made aircraft to a sanctioned country","No AOC; banned operator"],
   ["4. What is carried?","Pets, weapons, cash, medical equipment, dangerous goods","Patient needing care in flight"],
   ["5. How is it sold?","Hotel or event added","Individual seats"],
   ["6. When?","Short notice into a strict permit country","Lead time impossible to meet"]]},rag:true},
  {links:[L.payNo]},
  {box:{t:"Practise it",l:["After the module check, the trip risk screen lab gives you 12 real-world trips to screen."]}}]}
 ],
 quiz:[
  {q:"A client asks for Miami to San Juan, Puerto Rico, on a Canadian operator's jet. What is the issue?",o:["None, it is international","Puerto Rico is US territory, so this is a US domestic leg","Only a visa issue","Only a tax issue"],a:1,why:"Puerto Rico is a US territory. Only US-citizen carriers may fly passengers between US points."},
  {q:"Your trip risk screen shows one amber and no red. What happens next?",o:["Quote at once","The operator or its trip support confirms the amber point in writing before we quote","The director must refuse","Ignore it"],a:1,why:"Amber means confirm in writing first, then quote."},
  {q:"A client wants Teterboro – Miami – Nassau on a European operator's jet. What is right?",o:["Fine, it ends abroad","The Teterboro – Miami leg cannot be flown by a non-US operator","Only Nassau needs a permit","Ask the client to sign a waiver"],a:1,why:"Teterboro – Miami is US domestic."},
  {q:"A client with Russian nationality wants Dubai – Nice on a chartered jet. What do you do?",o:["Quote normally","Stop and report to the director","Use a non-Russian aircraft","Fly to Geneva instead without telling anyone"],a:1,why:"EU sanctions deny landing to aircraft chartered by Russian nationals, including dual nationals."},
  {q:"Which item is NOT part of the written disclosure to every client?",o:["Operator's legal name on the AOC","That we are a broker","The operator's purchase price for the aircraft","Total price and possible extra charges"],a:2,why:"The disclosures are: broker status, operator legal name, aircraft details, full price and extras, insurance."},
  {q:"A non-EU operator flying into Europe needs which EASA approval?",o:["Part-NCC","TCO authorisation","ATOL","Part 295"],a:1,why:"Third-country operators need an EASA TCO authorisation."},
  {q:"An operator offers a jet that is not listed on its AOC operations specifications. What do you do?",o:["Use it if the price is good","Reject it and report to the director","Ask the client to decide","Book it as a private flight"],a:1,why:"An aircraft not on the AOC cannot fly commercially: that is illegal charter."},
  {q:"A client asks you to leave one passenger's name off the manifest sent to the operator. What do you do?",o:["Agree, privacy matters","Refuse and report to the director","Use initials only","Send the name after the flight"],a:1,why:"Hiding passenger names is illegal and a sanctions and security risk."}
 ]}
};

/* ===== Lab: trip risk screen (Module 13.7 exercises) ===== */
const ISSUES = {
 usdom:"US domestic leg on a non-US operator",
 spdom:"Domestic leg inside Spain on a non-EU operator",
 pep:"Politically exposed person",
 child:"Child travelling without parents",
 seats:"Individual seat sales",
 pkg:"Package sale (hotel and tickets)",
 guns:"Firearms on board",
 embargo:"Embargoed destination and US-made aircraft",
 pet:"Pet into a rabies-free country",
 curfew:"Night curfew at arrival airport",
 bribe:"Cash payment to an official or handler",
 hkcn:"Hong Kong and mainland China regime",
};
const LAB = [
 {t:"Los Angeles – Honolulu – Tokyo for a family of five on a Japanese-registered jet.",c:"red",i:"usdom",d:["spdom","curfew","pet"],why:"Hawaii is a US state, so Los Angeles – Honolulu is a US domestic leg: never on a non-US operator."},
 {t:"Madrid – Tenerife – Madrid on a Swiss operator.",c:"amber",i:"spdom",d:["usdom","pkg","embargo"],why:"Tenerife is in Spain (Canary Islands). Domestic Spanish legs on a non-EU operator need permission: the operator confirms, or use an EU operator."},
 {t:"A minister's office books Geneva – Riyadh; the ministry pays.",c:"amber",i:"pep",d:["embargo","bribe","seats"],why:"A minister is a politically exposed person: enhanced KYC and director approval."},
 {t:"A 14-year-old flies London – New York with an aunt.",c:"amber",i:"child",d:["usdom","pep","pkg"],why:"A child without parents: ask for parental consent documents and escalate any doubt."},
 {t:"Four friends each want to pay for one seat on a Paris – Ibiza flight with other strangers.",c:"red",i:"seats",d:["pkg","spdom","curfew"],why:"We sell whole aircraft to one client. Never sell per seat."},
 {t:"The client adds a hotel and Formula 1 tickets to the flight and wants one price.",c:"amber",i:"pkg",d:["seats","bribe","pep"],why:"A package sale: director approval under package-travel and ATOL rules."},
 {t:"A hunting party flies Johannesburg – Windhoek with rifles.",c:"amber",i:"guns",d:["embargo","pet","child"],why:"Firearms: the operator and both authorities must approve; permits needed; director informed."},
 {t:"Dubai – Tehran on a Gulfstream for a business meeting.",c:"red",i:"embargo",d:["pep","curfew","hkcn"],why:"Iran is under embargo, and a US-made aircraft adds US export rules. Stop and escalate."},
 {t:"A dog travels Bangkok – London in the cabin.",c:"amber",i:"pet",d:["child","guns","curfew"],why:"The UK has strict pet import rules and approved arrival routes. Check the authority's rules and the operator's acceptance before quoting."},
 {t:"Arrival at a curfewed European airport planned for 01:30 local.",c:"amber",i:"curfew",d:["spdom","bribe","pet"],why:"Night curfew: the operator confirms or the schedule changes."},
 {t:"A handler asks for USD 500 in cash to \"speed up\" a landing permit.",c:"red",i:"bribe",d:["pep","pkg","curfew"],why:"Bribery risk under laws such as the US FCPA and UK Bribery Act: refuse and report."},
 {t:"Hong Kong – Shanghai – Hong Kong on a Hong Kong-registered jet.",c:"amber",i:"hkcn",d:["usdom","spdom","embargo"],why:"Hong Kong and mainland China are treated separately: the operator confirms the permission and regime before quoting."},
];

/* ===== Practical: booking scenario (fictional; for training only) ===== */
const BOOK = {
 brief:[
  ["Client enquiry","Meridian Family Office Pte Ltd (Singapore) asks for a heavy jet for 6 passengers: Singapore Changi 12 November, 10:00 to Bangkok (Don Mueang); 14 November, 11:00 Bangkok to Phuket; 17 November, 16:00 Phuket to Singapore Changi. Lead passenger: Daniel Tan."],
  ["KYC file","KYC reference KYC-2026-0147, completed 15 October. All six passengers and the payer screened against the UN, OFAC, EU, UK and MAS lists: no match. The payer is the client itself. No PEPs, no minors, no pets."],
  ["Operator quote (from Avinode)","Alpine Jet Services AG, trading as AlpineJets. AOC CH.AOC.1042 issued by Switzerland. Bombardier Global 6000, registration HB-JXA, built 2014, 13 seats, cabin attendant included. ARGUS Platinum. All-in price USD 171,000 including positioning from and back to Geneva, crew, fuel, landing, handling and permits. Quote valid until 20 October, 18:00 Bangkok time."],
  ["Operator email","\"We confirm Bangkok – Phuket is flown as part of one continuous international journey with the same 6 passengers, declared on the CAAT permit.\" AOC, operations specifications listing HB-JXA, and insurance certificate (commercial passenger liability) attached."],
  ["Client's assistant","\"Please just send your bank details by WhatsApp and we will wire the money today.\""]
 ],
 note:"All names and figures in this scenario are fictional and for training only.",
};
