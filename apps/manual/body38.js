
let NREF=0;const NREFS=[];
const NL=list=>{const ref='nl'+(NREF++);NREFS.push(ref);return list.map(t=>N(t,ref));};
const BL=list=>list.map(t=>B(t));
const C=[];
const push=(...x)=>C.push(...x.flat());

// ================= COVER
push(new Paragraph({spacing:{before:1500,after:500},alignment:AlignmentType.CENTER,children:[new ImageRun({type:'png',data:LOGO,transformation:{width:380,height:200}})]}));
push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:120},children:[new TextRun({text:'Air Charter Brokerage',font:'Times New Roman',size:44,color:BLACK})]}));
push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:500},children:[new TextRun({text:'Master Training and Self-Study Manual',font:'Times New Roman',size:36,color:ACC})]}));
push(new Paragraph({alignment:AlignmentType.CENTER,border:{top:{style:BorderStyle.SINGLE,size:6,color:ACC,space:8}},spacing:{after:60},children:[r('Document reference ARC-MST-TRN-2026-007',{size:19})]}));
push(new Paragraph({alignment:AlignmentType.CENTER,children:[r('Internal training and certification curriculum. Confidential. All amounts in USD.',{size:19,color:MUTED})]}));

// ================= DOCUMENT CONTROL
push(H1('Document control',true));
push(T([['Item',3000],['Detail',6640]],[
 ['Owner','Director, Arche Executive'],
 ['Applies to','All brokers, charter consultants and operations staff, in every office and every market'],
 ['Effective','October 2026'],
 ['Version','3.8, 29 October 2026: booking money and cancellation (Module 10): the client always pays the higher cancellation charge (ours or the operator\'s plus our fee), each confirmation prints its own payment schedule, the operator is paid only from cleared client money and its contract signed only when that money is held; deadline alerts, payment reminders and one-click cancellation (10.2); insurance is the operator\'s alone (8.5); margin 9% minimum, any other margin only by the director (10.5); the operator library. 3.8, 27 October 2026: operator safety standard (Module 8.2, 8.5): accepted audits, insurance and crew minimums, five-year history, suspension; Arche-approved operators, approved for twelve months by the director, and one safety line in every quote (8.3). 3.8, 25 October 2026: margin 9% of the client price (÷ 0.91); every worked example and question in Module 9 recomputed. 3.8, 19 October 2026: live negotiation lab and AI practice partner (14.4, 14.5), post-trip debrief (14.6), following every trip to the last leg with follow-up and client rating (11.5, A.4, B.10), ACA Essentials sponsorship (14.3) and Appendix J regional quick-reference cards. 3.7, 18 October 2026: Appendix H Portal guide (flow diagram, every feature with troubleshooting and tips) and Appendix I Portal FAQ. 3.6, 18 October 2026: client requests and operational extras, the operational rules behind them, the booking timeline, the portal, and prospect and lead rules'],
 ['Review','At least once a year, and at once after a change in law, an audit finding or a serious error'],
 ['Controlled copy','The current version is the copy in the Arche document folder. Printed or downloaded copies are for reference only.'],
 ['Questions','Raise with the director. Nobody may change a rule in this manual on their own.'],
 ['Links','Every link in Appendices D and G is checked at each review; broken or outdated links are replaced'],
]));
push(sp());
push(H2('Contents'));
['How to use this manual','Module 0  Aviation for brokers','Module 1  Arche Executive and the broker\'s role','Module 2  Where we may and may not sell: the legal map','Module 3  Compliance: KYC, sanctions, fraud, bribery and data protection','Module 4  Our clients','Module 5  Enquiry intake and qualification','Module 6  Flight feasibility and trip planning','Module 7  Aircraft knowledge: long-range and heavy jets','Module 8  Sourcing on Avinode and operator vetting','Module 9  Pricing and quoting','Module 10  Contract, payment and settlement','Module 11  Trip operations, disruption and the 24/7 desk','Module 12  Selling and the consultant desk','Module 13  Case studies','Module 14  Assessment, certification and external training','Appendix A  Checklists','Appendix B  Templates','Appendix C  Answer key','Appendix D  Self-study library','Appendix E  Glossary','Appendix F  สรุปกฎสำคัญ (Thai summary of the critical rules)','Appendix G  Watchlist (maintained by the director)','Appendix H  Portal guide','Appendix I  Portal FAQ','Appendix J  Regional quick-reference cards'].forEach(m=>push(P(m,{spacing:{after:30}})));

// ================= HOW TO USE
push(H1('How to use this manual',true));
push(P('This manual is the single standard for every Arche Executive broker and charter consultant. It is written for people who have never worked in aviation. Start at Module 0 even if some of it seems simple: brokers who skip the basics make the expensive mistakes.'));
push(H2('Two training paths'));
push(T([['Path',1900],['Modules',3600],['You may start',4140]],[
 ['Charter consultant','0, 1, 2, 3, 4, 5, 12 and the case studies in 13 for reading; Appendix B call scripts','Calling clients alone after the consultant exam and 2 weeks of supervised calls'],
 ['Broker','All modules 0 to 14','Quoting and contracting alone after full certification (below)'],
]));
push(sp());
push(H2('Stages and exit criteria'));
push(T([['Stage',1800],['What you do',4200],['To pass',3640]],[
 ['1. Self-study','Read the modules for your path; answer every module check','All module checks done; questions you got wrong reviewed with your mentor'],
 ['2. Written exam','Final exam from the question bank, set by the director','80% or more; every critical-rule question correct'],
 ['3. Systems','Avinode and payment system training (Module 14)','Avinode and payment system access live; one practice quote and one practice payment request completed'],
 ['4. Shadowing','Follow a senior broker on live trips from enquiry to closed file, including the follow-up after the flight; visit one FBO or handler and one operator; two live negotiation lab sessions with a senior broker (Module 14.4); practise with the AI practice partner (Module 14.5)','8 complete trips shadowed; both visits done; two lab sessions recorded'],
 ['5. Practical exam','Run a mock trip from enquiry to signed confirmation, with a role-played client and operator, and a scored live negotiation lab with the director (Module 14.4)','No critical error; no more than 3 minor errors; lab score 70 or more with no rule broken'],
 ['6. Supervised','Run your own bookings; the director or a senior broker checks every quote and contract before it is sent; a post-trip debrief after every booking (Module 14.6)','10 bookings with no critical error; 10 debriefs signed by trainee, mentor and operations'],
 ['7. Certified','Work alone on the booking ramp (Module 1)','Director signs the training record'],
],{size:17}));
push(sp());
push(box('Critical errors (any one stops certification and is reviewed by the director)',[
 '1. Contract issued without KYC or sanctions screening.',
 '2. Operator used without a checked AOC, insurance and safety standard (or director approval).',
 '3. Flight sold that we may not sell (Module 2.4), including any cabotage breach, or quoted without a trip risk screen (Module 2.9).',
 '4. Wrong price: margin below 9% without approval, a number we cannot source, or a hidden fee.',
 '5. Missing client disclosures (Module 2.2).',
 '6. Payment taken outside a payment request, or bank details sent by email or chat.',
 '7. Personal data sent outside Avinode, the CRM or the operator.']));
push(sp());
push(H2('Training records and refresher training'));
push(P('The director keeps a training record for each person: modules completed, exam scores, trips shadowed, practical exam result, supervised bookings and sign-off date. Records are kept for as long as the person works for Arche and for the period our record-keeping rule sets after they leave. Everyone repeats the written exam once a year, and attends a refresher when a rule in this manual changes.'));
push(H2('How long it takes'));
push(P('These are planning estimates for a full-time trainee with no aviation background. They depend on how many enquiries come in during shadowing and supervision, and are reviewed after the first trainees.'));
push(T([['Stage',5640],['Broker',2000],['Consultant',2000]],[
 ['Self-study and written exam','2 to 3 weeks','1 to 2 weeks'],
 ['Avinode and payment system training and practice','2 to 3 days','1 day'],
 ['Shadowing','2 to 3 weeks','1 week'],
 ['Practical exam','1 day','1 day'],
 ['Supervised work','4 to 8 weeks','2 weeks'],
 ['Total to work alone','about 10 to 14 weeks','about 4 to 6 weeks'],
 ['Independent on complex long-range and multi-country trips','about 6 months',''],
]));
push(sp());
push(box('Three rules that apply to every module',[
 '1. Never state a number, time or rule you cannot show a source for. If you do not know, say you will confirm, and confirm in writing.',
 '2. Nothing is promised to a client until the operator has confirmed it in writing.',
 '3. When in doubt, stop and escalate to the director. A lost booking costs less than a wrong one.']));

// ================= MODULE 0
push(H1('Module 0  Aviation for brokers',true));
push(P('This module explains, in plain words, everything a broker needs before talking to a client or an operator. Each term is also in the glossary (Appendix E).'));
push(H2('0.1 Who does what'));
push(T([['Party',2200],['Role in a charter',7440]],[
 ['Client (charterer)','The person or company who hires the whole aircraft and pays for the trip.'],
 ['Broker (Arche)','Finds the aircraft, checks the operator, prices, contracts and looks after the client. We do not fly or own aircraft.'],
 ['Operator','The airline company that flies the aircraft and is responsible for safety. It holds an Air Operator Certificate (AOC) from its national aviation authority.'],
 ['Aircraft owner','Often a private person or company that places its aircraft with an operator, which flies it commercially.'],
 ['Crew','Captain and first officer (the pilots) and, on larger jets, one or more cabin attendants. They work for the operator.'],
 ['Handler and FBO','At each airport, a handler arranges fuel, parking, catering and paperwork. An FBO (fixed-base operator) is the private terminal where passengers check in, often run by the handler.'],
 ['Trip support','A company or the operator\'s own team that obtains permits, slots and flight plans.'],
 ['Aviation authority','Each country\'s regulator (for example the FAA in the US, EASA and national authorities in Europe, the UK CAA, the GCAA in the UAE, CAAS in Singapore). It licenses operators and approves foreign flights.'],
 ['Avinode','The online marketplace where operators list aircraft and brokers request and compare quotes. Arche books every trip through it.'],
 ['Payment request','A secure payment link from our payment provider. Clients pay and operators are paid through our payment account.'],
]));
push(sp());
push(H2('0.2 Aircraft categories'));
push(P('Private jets are grouped by cabin size and range. Avinode shows each aircraft\'s category, seats and range; always use the figures for the actual aircraft, not a general rule.'));
push(T([['Category',2300],['In plain words',4100],['Typical use',3240]],[
 ['Turboprop','Propeller aircraft with jet engines driving the propellers; slower, can use short runways','Short regional trips, small airports'],
 ['Very light and light jet','Small cabin, usually no standing room','Short trips with few passengers'],
 ['Midsize and super-midsize jet','Standing or near-standing cabin, more seats and range','Medium trips, often across a region'],
 ['Heavy or large-cabin jet','Tall, long cabin, a lavatory and galley, often a cabin attendant and sleeping options','Long trips, larger groups, comfort'],
 ['Ultra-long-range jet','Large-cabin jets built to cross oceans and continents without a stop; crew rest area','Intercontinental trips (our focus)'],
 ['VIP airliner','Converted airliners such as the Boeing Business Jet and Airbus Corporate Jet','Large groups, heads of state, sports teams'],
]));
push(sp());
push(H2('0.3 Airports and their codes'));
push(P('Every airport has two codes. Airlines and clients use the three-letter IATA code; operators, pilots and Avinode often use the four-letter ICAO code. Use both in quotes to avoid errors, and always check: many cities have several airports, and business aviation often uses a different airport from the airlines.'));
push(T([['City',2400],['Airport',3640],['IATA',1800],['ICAO',1800]],[
 ['London','Luton','LTN','EGGW'],['New York','Teterboro','TEB','KTEB'],['Dubai','Dubai International','DXB','OMDB'],['Bangkok','Suvarnabhumi','BKK','VTBS'],['Singapore','Changi','SIN','WSSS'],['Geneva','Geneva','GVA','LSGG'],
]));
push(sp());
push(H2('0.4 Time'));
push(BL(['Aviation works in UTC (also called Zulu or Z), the same time everywhere. Clients think in local time.','Every quote and trip brief shows local times and states it clearly. Check arrival dates on long flights: crossing time zones or the date line can change the arrival date.','When a client says "tomorrow morning", confirm the date, the time and the time zone in writing.']));
push(H2('0.5 Flight time, block time and positioning'));
push(BL(['Flight time runs from take-off to landing. Block time runs from when the aircraft moves off its parking stand to when it stops at the destination. Operators may price on either; their quote says which.','A positioning leg (also called a ferry or empty leg) is a flight without passengers to bring the aircraft to the client, or back to its base. The client usually pays for it.','An empty leg is a positioning flight the operator sells cheaply. It can be cancelled or moved if the main trip changes.','A one-way trip can cost almost as much as a return if the aircraft must fly back empty.']));
push(H2('0.6 Permits, slots and border control'));
push(BL(['Permits: most countries require permission for a foreign commercial flight to land or fly over them.','Slots: busy airports allocate take-off and landing times. A permit may not be issued until a slot is confirmed.','PPR (prior permission required): some airports require advance approval for parking or for the flight.','Border control: passengers pass customs, immigration and health checks. Authorities may require passenger details in advance.','Lead times vary by country and by airport, and change. The operator and its trip support know the current rules; we ask them every time.']));
push(H2('0.7 Crew duty and why trips sometimes need an extra crew'));
push(P('Pilots and cabin crew may only work a limited number of hours in a duty period, set by their authority. A long flight, an early start after a late arrival, or several legs in one day can exceed those limits. The operator then adds a second crew, flies a fresh crew in, or plans a night stop. This changes the price and the schedule, so we ask early.'));
push(H2('0.8 Weather, air traffic and delays'));
push(P('Fog, storms, snow, strong winds and air-traffic restrictions can delay or divert a flight. Decisions about safety belong to the captain and the operator alone. Our job is to keep the client informed and to arrange what they need on the ground.'));
push(H2('0.9 Safety culture'));
push(P('Every person at Arche is expected to speak up about anything unsafe or illegal, and to report their own mistakes at once. Honest reports are never punished; hiding a mistake is. The director keeps a log of errors and near misses and reviews it with the team so everyone learns.'));
const LKM=(t,u)=>P([link(t,u)],{spacing:{after:60}});
push(H2('0.10 The market in numbers'));
push(P(`Figures change every year. Use these only with their source and date, and never as a promise to a client.`));
push(T([['Figure',5600],['Source',4040]],[
 [`Global business jet flights in 2025: up 5% on 2024, the busiest year on record`,`WINGX, full-year 2025 (January 2026)`],
 [`Share of global business jet flights in 2025: North America about 72%, Latin America about 6%, Asia about 3%, Middle East about 2%, Africa about 1%`,`WINGX, full-year 2025`],
 [`Growth in 2025: Africa about 15%, Latin America 11%, Middle East 7%, Asia 4%, Europe about 1%`,`WINGX, full-year 2025`],
 [`North American charter (Part 135) flights in December 2025: up 1.6% on December 2024; fractional up 8.4%`,`ARGUS TRAQPak, December 2025`],
 [`People worth USD 30 million or more (UHNWIs): 713,626 in 2026, up from 551,435 in 2021`,`Knight Frank, The Wealth Report 2026`],
 [`US charter demand seen on Avinode: up 27% over the past year`,`Avinode, reported by AIN, October 2026`],
]));
push(sp());
push(P(`What it means for us: most flights happen in North America, but the fastest growth is in Africa, Latin America, the Middle East and Asia, where many of our clients live. Wealth keeps growing, and clients compare charter with other ways to fly (0.11).`));
push(LKM('ARGUS and WINGX activity reports for the end of 2025 (GlobalAir)','https://www.globalair.com/articles/argus-wingx-release-aircraft-activity-reports-for-the-end-of-2025/11807'),
 LKM('Knight Frank: The Wealth Report 2026','https://www.knightfrank.com/wealthreport'));
push(H2('0.11 Ways to fly privately'));
push(P(`Clients often compare charter with other products they own or have been offered. Know them so you can speak about them fairly.`));
push(T([['Product',2300],['How it works',4300],['When a client chooses it',3040]],[
 [`On-demand charter`,`The client hires a whole aircraft for one trip at a price quoted for that trip`,`Flexible trips, no commitment; what Arche sells`],
 [`Empty leg`,`A positioning flight sold at a lower price; it can be cancelled or moved if the main trip changes`,`Flexible clients who accept the risk; Arche sells these too (Module 9.5)`],
 [`Jet card`,`The client pays in advance for hours or a fund with one provider, at agreed rates and service terms`,`Regular flyers who want fixed rates and guaranteed availability`],
 [`Membership`,`An annual fee for access to a provider's fleet or prices`,`Frequent flyers loyal to one provider`],
 [`Fractional ownership`,`The client buys a share of an aircraft and a set number of hours a year`,`Very frequent flyers who want ownership without running an aircraft`],
 [`Whole ownership`,`The client owns the aircraft, usually managed by an operator`,`The heaviest users`],
]));
push(sp());
push(P(`Never criticise another product. Compare on what matters to the client: flexibility, total trip cost, aircraft choice and how often they fly.`));
push(H2('0.12 The freedoms of the air'));
push(P(`International agreements describe what an airline of one country may do in another country's airspace. They explain why some legs are allowed and others are not.`));
push(T([['Freedom',1300],['What it allows',8340]],[
 ['1st','Fly over another country without landing'],
 ['2nd','Land in another country for a technical reason, such as fuel, without picking up or setting down passengers'],
 ['3rd','Carry passengers from your own country to another country'],
 ['4th','Carry passengers from another country back to your own country'],
 ['5th','Carry passengers between two foreign countries on a flight that starts or ends in your own country'],
 ['6th','Carry passengers between two foreign countries via your own country'],
 ['7th','Carry passengers between two foreign countries without touching your own country'],
 ['8th','Carry passengers between two points inside a foreign country on a flight that starts or ends in your own country (cabotage)'],
 ['9th','Carry passengers inside a foreign country on a stand-alone domestic flight (cabotage)'],
]));
push(sp());
push(P(`The 8th and 9th freedoms are cabotage, which most countries refuse to foreign operators (Module 2.4). Which freedoms an operator may use depends on agreements between countries and on the permits for each flight, so the operator always confirms.`));
push(LKM('ICAO: Freedoms of the Air','https://www.icao.int/Pages/freedomsAir.aspx'));
push(quiz(0,[
 ['A client asks for a flight "from New York tomorrow at 9". What must you confirm?',['Only the aircraft size','Which New York airport, the date, and the time zone','Only the price','Nothing, it is clear'],'b'],
 ['Who decides whether it is safe to take off in bad weather?',['The client','The broker','The captain and the operator','The FBO'],'c'],
 ['Why might a one-way trip cost almost as much as a return?',['Tax rules','The aircraft may have to fly back empty','Crew bonuses','It never does'],'b'],
 ['Which code is the ICAO code for London Luton?',['LTN','EGGW','LON','LUT'],'b'],
 ['A Swiss operator wants to carry passengers from Bangkok to Phuket only. Which freedom of the air would that be?',['3rd freedom','5th freedom','9th freedom (cabotage)','1st freedom'],'c'],
 ['A client already owns a jet card with another company. What do you do?',['Tell him jet cards are a bad deal','Compare fairly on flexibility, total trip cost and aircraft choice','Refuse to quote','Ask for his card number'],'b']
]));

// ================= MODULE 1
push(H1('Module 1  Arche Executive and the broker\'s role',false));
push(H2('1.1 Who we are'));
push(P('Arche Executive is a charter brokerage registered in Singapore. We sell private flights to clients worldwide, in every region, from our base in Asia. We do not own or operate aircraft. Our value is finding the right aircraft and operator, pricing fairly, contracting safely and looking after the client from the first call to the last invoice.'));
push(P('Our name, Arche, is said ar-KAY. It comes from the Greek word archē, meaning origin or first principle: the point where every trip begins. Always say ar-KAY on the phone and in meetings.'));
push(H2('1.2 What we sell'));
push(BL(['Whole-aircraft charters for one client, on third-party aircraft of every size, with a focus on long-range and heavy jets.','Empty legs, on the conditions in Module 9.','Nothing on the "never sell" list in Module 2.4.','We do not sell flight hours on aircraft owned by Navoryx Executive or its aircraft companies while the charter sales agreement for those aircraft is in force. Pass any such request to the director.']));
push(H2('1.3 How we earn'));
push(P('Our margin is 9% of the price the client pays (Module 9). The operator receives the rest from our payment account. Only our margin flows into Arche\'s own bank account.'));
push(H2('1.4 Roles'));
push(T([['Role',2200],['Does',7440]],[
 ['Charter consultant','Builds the client base by phone and follow-up, captures and qualifies enquiries, hands live trips to a broker'],
 ['Broker','Sources, vets, prices, contracts and runs trips; mentors consultants'],
 ['Operations desk','Runs trips on the day and out of hours (Module 11)'],
 ['Director','Approves exceptions, compliance decisions and disputes; owns this manual'],
]));
push(sp());
push(H2('1.5 The booking ramp'));
push(P('Targets are counted in booking units. One unit is USD 45,000 billed to the client; a USD 90,000 trip counts as two units. Every broker follows the ramp from their own start date: 4 units a month in months 1 to 3 (supervised bookings count), 6 in months 4 to 6 and 8 from month 7. Brokers who stay behind the ramp lose their bonus first; the director reviews by month 6 at the latest.'));
push(H2('1.6 Three ways a broker can work'));
push(T([['Model',2400],['What it means',4400],['Main duties',2840]],[
 [`Agent of the client`,`The broker acts for the client and contracts with the operator on the client's behalf`,`Written agency agreement; disclose any relationship with the operator`],
 [`Agent of the operator`,`The broker sells for one or more operators, usually for a commission`,`Use the operator's charter contract; cannot act for the client at the same time`],
 [`Principal (in the US an "indirect air carrier")`,`The broker buys the flight from the operator and resells it to the client in its own name`,`Takes on responsibility to the client; client terms at least as strict as the operator's terms`],
]));
push(sp());
push(P(`Arche's legal position is being settled with counsel (Module 2.3). Until then, never describe our role in your own words: use the wording in the approved Arche charter confirmation.`));
push(LKM('NBAA Best Practices for Air Charter Brokering (2024)','https://nbaa.org/wp-content/uploads/2024/07/NBAA-Best-Practices-for-Air-Charter-Brokering.pdf'));
push(H2('1.7 Professional standards'));
push(BL([`Never sell a flight before an operator has confirmed the aircraft, schedule and price in writing.`,`Tell the director about any personal or commercial relationship with an operator, handler or supplier.`,`Advertise honestly (Module 2.11).`,`Keep learning: repeat the written exam once a year and attend every refresher.`,`Help the people you train: senior brokers mentor new staff and model the standard.`]));
push(H2('1.8 The Arche portal: one place for everything'));
push(P(`Every enquiry, quote, document, booking, payment record and commission for Arche lives in the Arche broker portal. Nothing is quoted, sold or paid outside it, and work done outside it earns no commission. The portal opens on your dashboard: your progress this month, your place in the team and every outstanding task, most urgent first.`));
push(H3('Leads and prospects'));
push(BL([`The portal assigns organisations to brokers automatically and fairly: by country and region fit, follow-up record, conversions and fair share. Every active broker receives new leads every week.`,`Make first contact with every new lead within 48 hours and follow up at least every 14 days. Log every contact in the portal. A lead with no contact in time moves to the next broker with its full history. After three brokers it goes to the director.`,`"Not now" leads are offered again after 90 days, to a different broker with a fresh approach.`,`Add at least 10 new organisations a month, each with the public source where you found it. The first broker to add an organisation works it first. Duplicates are caught automatically.`,`Adding and updating prospects earns points on the monthly leaderboard and a bigger share of new leads. No separate fee is paid: commission rewards the booking.`,`Prospects are organisations and their business contacts only: no private individuals, no bought lists, no scraping, and an opt-out in every message. Anyone who opts out is "Do not contact" for everyone, for good.`]));
push(P(`These are the current settings. The director can change them in the portal; its Portal rules page always shows the ones in force.`));
push(H3('Booking rights and separate duties'));
push(BL([`Operations checks each trip, confirms the operator price on Avinode, completes KYC and sanctions screening, creates the payment request and issues the confirmation.`,`The director can give a broker booking rights, so the broker also works as operations. Nobody confirms, prices or records payment on their own booking: another operations member or the director does it.`]));
push(quiz(1,[
 ['A client asks to charter an aircraft owned by Navoryx Executive. What do you do?',['Quote it at 9%','Pass the request to the director','Ask the operator for a discount','Decline without comment'],'b'],
 ['A trip billed at USD 135,000 counts as how many booking units?',['1','2','3','4'],'c'],
 ['A client wants to buy four seats on someone else\'s flight. Which is right?',['We sell the seats','We sell whole-aircraft charters to one client only','We split the price four ways','We ask the operator to sell them'],'b'],
 ['A broker buys the flight from the operator and resells it in its own name. Which model is that?',['Agent of the client','Agent of the operator','Principal','None'],'c'],
 ['You have not contacted a new lead within 48 hours. What happens?',['Nothing','It moves to another broker with its history at the next assignment round','It is deleted','You lose commission on all trips'],'b'],
 ['A broker with booking rights sells a trip. Who issues its confirmation?',['The same broker','Another operations member or the director','The client','The operator'],'b']
]));

// ================= MODULE 2
push(H1('Module 2  Where we may and may not sell: the legal map',false));
push(P('Arche sells worldwide, so we meet many sets of rules. This module gives the principles that apply everywhere, the list of flights we never sell, and a map by region. The law changes: the operator, its trip support and the official sources in Appendix D confirm what applies to each flight. When anything is unclear, the director decides before a quote is sent.'));
push(H2('2.1 The broker\'s boundary'));
push(P('A broker arranges a flight; the operator performs it. Never describe Arche as the airline, never put our name forward as the carrier, and never let a client believe we fly or own the aircraft.'));
push(H2('2.2 What every client is told, worldwide'));
push(P('We apply the strictest common standard to every client. Before the contract is signed, the client receives in writing:'));
push(NL(['That Arche Executive acts as a charter broker and not as the operator.','The operator\'s full legal name as shown on its AOC, and any trading name it uses.','The aircraft type, registration and year of manufacture, or "type or similar" until the tail is fixed.','The total price, what it includes, and every item that may be charged after the flight and how (Module 9).','The passenger insurance the operator carries, as confirmed by the operator, and whether Arche itself holds liability insurance.']));
push(H2('2.3 Our contract position'));
push(P('All bookings run through Avinode, and all client and operator payments run through our payment account, so that only Arche\'s margin enters Arche\'s own account. The legal wording of our role towards the client is being settled with counsel and will be reflected in the Arche charter confirmation. Until then, use only the approved confirmation (Part A Key Booking Terms and Part B Standard Conditions), never your own wording, and never agree to change liability, cancellation or payment terms.'));
push(H2('2.4 Flights we never sell'));
push(T([['Never sell',3300],['Why',3600],['What to do',2740]],[
 ['A flight by an operator without a commercial AOC, or on an aircraft not listed on its AOC','Illegal charter: uninsured and unsafe','Reject; report to the director'],
 ['A domestic leg (two airports in the same country) on an aircraft from a foreign operator, unless the operator confirms in writing that the country allows it','Cabotage: most countries reserve domestic flights for their own carriers','Use a local operator for the domestic leg, or redesign the trip'],
 ['United States domestic flights (both airports in the US) on any non-US operator','US law allows only US-citizen carriers to fly passengers within the US','Never quote'],
 ['Any United States domestic flight, even on a US operator, until US counsel has confirmed Arche\'s position','Arche policy while our US position is confirmed','Pass to the director'],
 ['Flights between two EU countries, or inside one, on a non-EU operator, unless the operator confirms the permission','EU traffic is reserved for EU carriers; exceptions need specific permission','Use an EU operator'],
 ['Individual seats sold to different people on one flight','Selling seats needs public-charter or airline authority; we sell whole aircraft to one client','Never sell per seat'],
 ['Flights into, out of or over the EU for a client who is a Russian national (including dual nationals) or a company controlled by one, or on Russian-registered aircraft','EU sanctions deny landing, take-off and overflight to such aircraft, including private and chartered aircraft','Stop; report to the director'],
 ['Flights for sanctioned persons or companies, or to destinations under embargo without director clearance','Sanctions law (Module 3)','Stop; report to the director'],
 ['Operators on the EU Air Safety List (banned or restricted operators)','Safety and EU law','Never use'],
 ['Medical flights with patients needing care on board','Air ambulance needs specific approvals and equipment','Refer to an air-ambulance operator through the director'],
 ['Flights with accommodation or other travel sold as one package','Package-travel and travel-licence rules (for example ATOL in the UK)','Only with director approval'],
 ['Any flight where the client asks to hide passenger names from the operator or the authorities','Illegal and a sanctions and security risk','Refuse; report to the director'],
],{size:17}));
push(sp());
push(H2('2.5 The map by region'));
push(T([['Region',1600],['What applies to Arche',4000],['What applies to the flight',4040]],[
 ['United States','US rules for air charter brokers (14 CFR Part 295, in force since 14 February 2019) apply to anyone acting as an air charter broker: state clearly that we are a broker; name the operator; disclose our liability insurance or that we have none; give the full price with a good-faith estimate of known extra fees; never misrepresent aircraft, ratings, flight time or safety.','Only US-citizen carriers may fly passengers between US points. Foreign operators need US authority for international charters.'],
 ['Canada and Latin America','Consumer law of the client\'s country.','Domestic flights are generally reserved for local carriers; foreign operators need permits for each flight. Confirm with the operator.'],
 ['European Union, EEA and Switzerland','No broker licence; EU consumer and package-travel rules for consumer sales; EU sanctions (Module 3).','Non-EU operators need an EASA third-country operator (TCO) authorisation and each state\'s permits; the whole aircraft must be chartered; tickets may not be sold to the public. Traffic inside the EU is reserved for EU carriers.'],
 ['United Kingdom','The CAA treats flights for payment without an AOC as illegal (the Air Charter Association publishes guidance). Package sales to UK consumers can fall under ATOL.','Foreign operators need UK permission; UK domestic legs are reserved for UK carriers unless permitted.'],
 ['Middle East and Africa','No specific broker licence in most states.','Landing and overflight permits through the operator\'s handler; requirements, sponsor rules and lead times differ by state.'],
 ['Singapore (our home)','Singapore company, tax and data-protection law apply to Arche (Module 3).','Foreign operators need a CAAS Foreign Operator Operations Permit, an Air Transport Permit through flightSG for each non-scheduled flight, and a slot: Changi slot requests at least 72 hours before the flight; Seletar through its booking window.'],
 ['Thailand (our Asian hub)','Thai data-protection law for data handled in Thailand.','Overflight and landing permits from the Civil Aviation Authority of Thailand; slots and parking approval first at the main Bangkok airports and Phuket; full schedule, passenger and crew details and a specific purpose; cabotage closely enforced.'],
 ['Rest of Asia-Pacific (for example China, India, Japan, Australia)','Consumer and data law of the client\'s country.','Domestic flights are generally reserved for local carriers; permits and lead times vary widely. Confirm with the operator.'],
],{size:16}));
push(sp());
push(H2('2.6 Cabotage examples'));
push(T([['Trip',4400],['On a foreign-registered aircraft',5240]],[
 ['London – Paris – London','International legs; normally fine with permits and, for a non-EU operator, the EU and UK permissions'],
 ['Teterboro – Miami – Nassau','Teterboro – Miami is a US domestic leg: never on a non-US operator. Use a US operator for the whole trip, subject to the US policy in 2.4'],
 ['Dubai – Mumbai – Delhi – Dubai','Mumbai – Delhi is an Indian domestic leg: only if the operator confirms in writing that it is permitted'],
 ['Bangkok – Phuket – Singapore with the same passengers','Bangkok – Phuket is domestic: only as one continuous international journey declared on the permit, and only if the operator confirms'],
]));
push(sp());
push(H2('2.7 Spotting illegal charter'));
push(BL(['Get the operator\'s AOC and the operations specifications that list the aircraft, and check the aircraft is on them.','Get the insurance certificate and check it covers commercial passenger flights.','Watch for: privately registered aircraft offered for payment, "cost-sharing", dry leases sold as charter, prices far below the market, refusal to send documents.','Reject any aircraft offered without a commercial AOC and report it to the director the same day.']));
push(H2('2.8 Other rules that follow the trip'));
push(P('Beyond the never-sell list, these rules apply in many countries. None of them is a reason to refuse a trip by itself; each is a reason to check before quoting.'));
push(T([['Area',1900],['What to spot',3700],['Typical trigger',1900],['Action',2140]],[
 ['Conflict zones and closed airspace','Routes over or near conflict areas; EASA publishes Conflict Zone Information Bulletins and the FAA issues security notices and prohibitions for US operators; insurers may exclude war-risk areas','A route crossing a region in the news; Appendix G','Operator confirms routing and insurance in writing; director approves'],
 ['Sanctions and embargoes','Countries under broad sanctions, sector sanctions, and US export rules for US-made aircraft','Destination, nationality, aircraft make; Appendix G','Stop; director decides'],
 ['Hidden domestic legs','Islands and territories that belong to another country, so a leg between them is domestic','Two stops that look like two places but are one country; Appendix G','Cabotage check with the operator'],
 ['Taxes that follow the trip','US federal excise tax on charters touching the US; EU VAT; UK Air Passenger Duty (a higher rate for aircraft of 20 tonnes or more with fewer than 19 seats, which covers most large private jets); Singapore GST. A broker acting as principal can have to collect US excise tax','Any US, EU or UK leg','Operator states taxes in its quote; the director confirms our role with the accountant'],
 ['Packages and consumer rules','EU package-travel rules and UK ATOL when a flight is sold with a hotel or other travel','Client asks for hotel or event tickets','Director approval'],
 ['Politically exposed persons (PEPs)','Heads of state, ministers, senior officials, senior managers of state companies, and their families and close associates','Title, government email, state-owned payer','Enhanced KYC; director approval'],
 ['Bribery laws that reach abroad','The US Foreign Corrupt Practices Act and the UK Bribery Act can apply outside those countries','Officials or handlers asking for cash to "speed up"','Refuse; report (Module 3.6)'],
 ['Children and vulnerable passengers','A child travelling without both parents may need a consent letter; unusual passenger patterns can signal trafficking','Children with one adult or with no relative','Ask for consent documents; escalate any doubt'],
 ['Animals','Rabies-free countries have strict import routes and approved arrival airports','Any pet; Appendix G','Check the authority\'s rules before quoting'],
 ['Weapons, cash and valuables','Firearms, large cash sums and precious metals need permits or declarations','Hunting trips, security teams, cash','Operator and authorities decide; director informed'],
 ['Airport restrictions','Night curfews, slot-controlled airports, military airfields, temporary restrictions during major events','Late arrivals, big events','Operator confirms'],
 ['Strict permit regimes','Some countries have long lead times and strict rules for foreign operators','Appendix G','Ask the operator for lead time before quoting'],
],{size:16}));
push(sp());
push(H2('2.9 The trip risk screen'));
push(P('Every enquiry passes this screen before sourcing, and the result is recorded on the intake form. Each answer gives a colour: green means proceed; amber means the operator or its trip support must confirm in writing before we quote; red means stop and escalate to the director. The screen is only as good as the watchlist behind it (Appendix G), so always check the current watchlist, never your memory.'));
push(T([['Question',1500],['Check',4400],['Amber',1900],['Red',1840]],[
 ['1. Who flies and pays?','Nationalities, PEPs, sanctions, minors, third-party payer, payer\'s country','PEP; child with one adult; payer differs','Sanctions match; Russian national with an EU point; refuses KYC; payer or operator in a country we cannot take payments from or pay to (Appendix G.7)'],
 ['2. Where?','Country of every airport (including territories), domestic legs, conflict zones, embargoes, taxes','Domestic leg; conflict-zone routing; strict permit country','US domestic leg; embargoed destination'],
 ['3. What aircraft and operator?','AOC, banned lists, safety rating, where the aircraft was built','No rating; US-made aircraft to a sanctioned country','No AOC; banned operator'],
 ['4. What is carried?','Pets, weapons, cash, medical equipment, dangerous goods','Any of these','Patient needing care in flight'],
 ['5. How is it sold?','Whole aircraft to one client; hotel or package; seat sharing','Hotel or event added','Individual seats'],
 ['6. When?','Curfews, slots, major events, permit lead times, crew duty','Short notice into a strict permit country','Lead time impossible to meet'],
],{size:16}));
push(sp());
push(H2('2.10 Passenger liability: the Montreal Convention'));
push(P(`For international flights between countries that have joined it, the Montreal Convention of 1999 sets what the air carrier (the operator) owes passengers for death or injury, delay and baggage. The limits are in Special Drawing Rights (SDR), a currency unit of the International Monetary Fund, and are reviewed every five years.`));
push(T([['Claim',4800],['Limit from 28 December 2024',4840]],[
 ['Death or injury of a passenger','151,880 SDR per passenger without proof of fault; above that unless the carrier proves it was not at fault'],
 ['Delay','6,303 SDR per passenger'],
 ['Baggage','1,519 SDR per passenger, unless a higher value was declared'],
]));
push(sp());
push(BL([`Claims about the flight lie against the operator, not Arche.`,`Clients carrying valuable items should declare them to the operator or insure them.`,`If a client raises EU passenger-rights rules (Regulation 261/2004) or any other passenger-rights claim, pass it to the director.`]));
push(LKM('Revised Montreal Convention limits, 2024 (CAAT notice)','https://www.caat.or.th/wp-content/uploads/2024/11/Revision-of-Limits-of-Liability-under-the-Montreal-Convention-of-1999-Year-2024.pdf'));
push(H2('2.11 Advertising and marketing'));
push(BL([`Never write "our fleet", "our jets" or "our aircraft". A disclaimer does not cure it. We arrange flights on aircraft operated by certified operators.`,`In the United States, an advertised price must be the full price the customer pays (14 CFR 399.84).`,`Claim a safety rating only for the operator and date we have checked.`,`Use client names, photos or testimonials only with written consent.`,`Social media, websites and brochures are approved by the director before publication.`]));
push(LKM('US full-price advertising rule, 14 CFR 399.84','https://www.ecfr.gov/current/title-14/chapter-II/subchapter-F/part-399/subpart-G/section-399.84'));
push(quiz(2,[
 ['A client asks for Miami to San Juan, Puerto Rico, on a Canadian operator\'s jet. What is the issue?',['None, it is international','Puerto Rico is US territory, so this is a US domestic leg','Only a visa issue','Only a tax issue'],'b'],
 ['Your trip risk screen shows one amber and no red answers. What happens next?',['Quote at once','The operator or its trip support confirms the amber point in writing before we quote','The director must refuse','Ignore it'],'b'],
 ['A client wants Teterboro – Miami – Nassau on a European operator\'s jet. What is right?',['Fine, it ends abroad','The Teterboro – Miami leg cannot be flown by a non-US operator','Only Nassau needs a permit','Ask the client to sign a waiver'],'b'],
 ['A client with Russian nationality wants to fly Dubai – Nice on a chartered jet. What do you do?',['Quote normally','Stop and report to the director','Use a non-Russian aircraft','Fly to Geneva instead without telling anyone'],'b'],
 ['Which item is NOT part of the written disclosure to every client?',['Operator\'s legal name on the AOC','That we are a broker','The operator\'s purchase price for the aircraft','Total price and possible extra charges'],'c'],
 ['A non-EU operator flying into Europe needs which EASA approval?',['Part-NCC','TCO authorisation','ATOL','Part 295'],'b'],
 ['A passenger\'s bag is lost on a charter from Paris to Dubai. Who is the claim against?',['Arche','The operator, under the Montreal Convention','The FBO','Nobody'],'b'],
 ['Which advertising line is acceptable?',['"Fly on our fleet of Global jets"','"Arche Executive arranges flights on aircraft run by certified operators"','"Our jets, your schedule"','"Our aircraft are ARGUS Platinum"'],'b']
]));

// ================= MODULE 3
push(H1('Module 3  Compliance: KYC, sanctions, fraud, bribery and data protection',false));
push(P('Private aviation moves wealthy people and large sums across borders. Banks, payment providers and regulators expect us to know who we deal with. Every booking passes this module before a quote becomes a contract.'));
push(H2('3.1 Know your client (KYC)'));
push(T([['Client type',2400],['What we collect',4400],['Check',2840]],[
 ['Private individual','Full name, date of birth, nationality, passport copy, residential address, contact details','Name matches passport; address plausible'],
 ['Company','Registered name and number, country, registered address, directors, ultimate beneficial owners (25% or more, or control), authorised signatory and their ID','Company exists on its official register; signatory authorised'],
 ['Agent, assistant or family office booking for a principal','Agent\'s identity and authority; principal\'s identity as above','Who pays and who flies are known'],
 ['Payer different from client','Payer identity and the reason','Director approval before acceptance'],
]));
push(sp());
push(P('Record the KYC reference on the Arche charter confirmation. Repeat clients: refresh KYC at least once a year or when details change.'));
push(H2('3.2 Sanctions screening, step by step'));
push(NL(['List every name to screen: client, payer, ultimate beneficial owners, every passenger, the operator and the aircraft owner if known.','Check who owns and controls each company you screen (client, payer, operator). Under US rules, a company owned 50% or more in total by one or more blocked persons is itself blocked, even when its own name is on no list (OFAC FAQs 401 and 402). EU guidance treats owning 50% or more, or control such as the power to appoint most of the board, the same way (EU Council Best Practices, 3 July 2024). A company owned or controlled by a listed person counts as a match.','Search each name on the official lists in Appendix D: United Nations consolidated list; Singapore (Monetary Authority of Singapore); United States (OFAC sanctions list search); European Union consolidated list; United Kingdom (UK Sanctions List, the single UK list since 28 January 2026).','Search with full name and date of birth; also try common alternative spellings.','Check nationality and the route against Module 2.4 (for example the EU rules on Russian nationals and aircraft) and against countries under embargo.','Record the result: in the portal, operations enters every name in the Sanctions screening box on the trip and presses Screen names now, which checks the official UN, US, EU and UK lists, then saves the record (date, person, lists, outcome). A confirmation cannot be issued without it. Without the portal, use the official search pages and the sanctions screening record (Appendix B).','Screen again if any name, passenger or the route changes.']));
push(box('A possible match',['Stop. Do not tell the client why. Do not take payment. Report to the director the same day, with the screening record. Only the director decides whether to proceed.']));
push(sp());
push(H2('3.3 Export controls'));
push(P('Many business jets are made in the US or contain US parts. Flights with such aircraft to some countries need US export authorisation or are prohibited, whoever owns the aircraft. Any flight to a country under sanctions or embargo goes to the director before any quote; the operator confirms its own authorisation in writing.'));
push(H2('3.4 Money-laundering warning signs'));
push(BL(['Payment from a third party or a country unrelated to the client','Pressure to accept cash, crypto-assets or split payments','Overpayment followed by a refund request to a different account','Urgency together with reluctance to give identity documents','Routings or passenger lists that make no business or personal sense','Requests to keep passenger names from the operator']));
push(P('Any of these: pause and escalate. Never accept cash.'));
push(H2('3.5 Payment fraud'));
push(BL(['Clients pay only through a payment request from our payment provider. We never send bank details by email or messaging apps.','If anyone, including an operator, asks to pay into or change to a new bank account, confirm it by telephone on a number you already hold, never one in the request.','Every Arche confirmation carries the bank-detail fraud warning. Never remove it.']));
push(H2('3.6 Gifts and bribery'));
push(P('Never offer, give or accept anything of value to win or keep business improperly. Bribery is a crime in Singapore and in most countries where our clients and operators are. Gifts and hospitality beyond small courtesies, from or to clients, operators, handlers or officials, need the director\'s approval and are recorded. Never pay anyone to speed up a permit or a border check.'));
push(H2('3.7 Data protection'));
push(P('Passport copies, passenger lists and travel plans are personal data. Singapore\'s Personal Data Protection Act applies to Arche; local laws such as Thailand\'s Personal Data Protection Act, the EU and UK General Data Protection Regulation and US state laws can apply to clients and staff in those places. We follow the strictest common standard:'));
push(BL(['Collect only what the flight and the law need, and tell the client why.','Store client and passenger data only in Avinode and the Arche CRM. No personal phones, private email or messaging groups.','Share passenger data only with the operator and its handlers for the flight.','Delete or anonymise data when it is no longer needed under our retention rule.','Report any loss or wrong sending of data to the director at once.','Outbound calls and messages: respect national do-not-call rules (for example Singapore\'s Do Not Call Registry) and every opt-out (Module 12).']));
push(quiz(3,[
 ['A new client asks to pay through his cousin\'s company in another country. What do you do?',['Accept','Get the payer\'s identity and reason, and the director\'s approval','Ask for cash instead','Send our bank details by email'],'b'],
 ['A passenger\'s name is a close match on the OFAC list. First step?',['Tell the client','Stop, take no payment, report to the director with the record','Ask the operator','Change the spelling'],'b'],
 ['A handler offers to "speed up" a permit for a cash payment. You:',['Pay it','Refuse and report to the director','Add it to the price','Ask the client to pay it'],'b'],
 ['Where may passport copies be stored?',['WhatsApp group','Avinode and the Arche CRM','Personal email','Any cloud drive'],'b'],
]));

// ================= MODULE 4
push(H1('Module 4  Our clients',false));
push(H2('4.1 Who they are'));
push(P('Our clients are mainly very wealthy individuals and their families, company leaders, and the assistants and family offices who book for them. They expect discretion, accuracy and speed, and they notice small mistakes.'));
push(H2('4.2 Working with assistants and family offices'));
push(BL(['Confirm in writing who may book, who may change a booking and who pays.','Send confirmations to the agreed people only.','Never contact the principal directly unless the assistant agrees.']));
push(H2('4.3 Discretion'));
push(BL(['Never mention a client\'s name, trip or habits to anyone outside the booking, including other clients and operators on other trips.','Never post or share photographs, names or flight details on social media.','Use the client\'s preferred name and form of address.']));
push(H2('4.4 Working across cultures'));
push(P('Our clients come from every region. Good practice that works everywhere: be formal until invited otherwise; confirm names and titles; respect religious holidays, prayer times and dietary rules when planning schedules and catering; ask rather than assume; keep the same standard of courtesy for clients, assistants, crew and handlers.'));
push(H2('4.5 Saying no'));
push(P('Sometimes the answer is no: the law, safety or our rules do not allow a request. Say so early, plainly and politely, give the reason in general terms, and offer an alternative where one exists ("That leg must be flown by a local operator; I can arrange that for you"). Never invent a reason and never blame the operator.'));
push(quiz(4,[
 ['An assistant asks you to send the final itinerary also to the principal\'s private email, which you found online. You:',['Send it','Send only to the people agreed in writing','Post it to the client\'s social media','Ask the operator'],'b'],
 ['How do you refuse a domestic leg the law does not allow?',['Blame the operator','Explain early and offer a legal alternative','Ignore the request','Book it anyway'],'b'],
]));

// ================= MODULE 5
push(H1('Module 5  Enquiry intake and qualification',false));
push(H2('5.1 The booking life cycle'));
push(T([['Stage',2300],['What happens',5040],['Output',2300]],[
 ['1. Enquiry','Capture the mission (5.2) on the intake form','Enquiry in CRM'],
 ['2. Qualification','Confirm the client is real, able to pay and serious; KYC started','Qualified or closed'],
 ['3. Legal check','Check the trip against Module 2.4','Allowed, redesigned or refused'],
 ['4. Feasibility','Airports, permits, cabotage, crew duty, documents (Module 6)','Route feasible'],
 ['5. Sourcing','Request quotes on Avinode; vet operators (Module 8)','Shortlist'],
 ['6. Quote','Price at 9%; send through Avinode (Module 9)','Quote with expiry'],
 ['7. Contract and payment','KYC and sanctions done; confirmation signed; payment request (Module 10)','Confirmed booking'],
 ['8. Operations','Passenger details, permits, catering, ground transport, monitoring (Module 11)','Flight operated'],
 ['9. Close','Extras reconciled with receipts; feedback; file closed (Module 11)','Booking closed'],
]));
push(sp());
push(H2('5.2 What to capture'));
push(P('Use the intake form in Appendix B. It covers: lead passenger, booker and payer; dates, local times and flexibility; airports (city and preferred airport, with codes); passengers including children and infants; nationalities; luggage and special items; pets; purpose where a permit needs it; catering, ground transport and special requests; budget and payment method; and how the client heard of us.'));
push(H2('5.3 Qualification'));
push(P('Ask early, politely and directly: who will fly, who will pay, and when the decision will be made. We do not hold aircraft or run long searches for enquiries that are not qualified. A qualified client has a real trip, a decision-maker we can reach, and no obstacle to KYC.'));
push(H2('5.4 Mission types'));
push(T([['Mission',2400],['What is different',4300],['Watch for',2940]],[
 [`Executive and family trips`,`One client, one to a few legs, privacy matters most`,`Exact local times, documents, catering preferences`],
 [`Groups: sports teams, music tours, roadshows`,`Many legs in a few days, fixed event times, large baggage or equipment`,`Crew duty limits, slots, baggage weight and volume, back-up aircraft`],
 [`Corporate shuttles`,`Repeated flights on a schedule for one company`,`A framework contract approved by the director; changes and cancellations`],
 [`Evacuation and repatriation`,`Urgent flights out of a crisis area`,`Director approval, security, war-risk insurance, permits, sanctions`],
 [`Medical flights`,`Patients needing care on board`,`Not a normal charter: refer through the director`],
]));
push(sp());
push(H2('5.5 Client requests and operational needs'));
push(P(`Capture two separate lists at intake. They are handled and charged differently, and both can change the aircraft, the airport, the schedule or the price.`));
push(T([['List',1900],['What belongs in it',2900],['Examples',4840]],[
 ['Client requests','What the client asks for','Special or dietary catering; a car or helicopter transfer; flowers or a celebration; child seats; pets; sports equipment or oversized luggage; a language on board; help for a passenger with reduced mobility'],
 ['Operational needs','What the trip needs in order to operate, often charged to the client','Extra ground handling; de-icing; opening an airport outside its hours; crew hotel and allowances; aircraft parking or hangarage; a private terminal and customs; permits and slots; a technical stop or extra crew; Wi-Fi use'],
]));
push(sp());
push(P(`Ask about both on the first call. Confirm every item with the operator or the supplier in writing, with how it is charged (Module 9.8). Medical care on board is never a request: it is a medical flight (Module 5.4).`));
push(quiz(5,[
 ['At which stage do you check the trip against the "never sell" list?',['After payment','Before sourcing','After the flight','Never'],'b'],
 ['When does a booking become confirmed?',['When the client says yes','When KYC and sanctions are done, the confirmation is signed and payment is received as agreed','When the operator quotes','At take-off'],'b'],
 ['A music tour needs six cities in five days with heavy equipment. What do you check first with the operator?',['Paint colour','Crew duty limits, slots and baggage weight and volume','Only the price','Nothing'],'b'],
 ['A client asks for halal catering and a car at arrival. Where do they go?',['Operational needs','Client requests, each confirmed with its supplier and how it is charged','Nowhere: the crew handles it','Only in the trip notes'],'b']
]));

// ================= MODULE 6
push(H1('Module 6  Flight feasibility and trip planning',false));
push(P('The operator is responsible for the safe and legal conduct of the flight. Our job is to ask the right questions early. Every answer comes from the operator or its trip support in writing.'));
push(H2('6.1 What can stop or change a trip'));
push(T([['Topic',2000],['What can stop or change a trip',4140],['How we handle it',3500]],[
 ['Range and fuel stops','Range on paper falls with more passengers and luggage, headwinds and long runways at hot or high airports','Operator confirms in writing whether the trip is non-stop or needs a fuel stop, for that load and season'],
 ['Runway and airport','Long-range jets need longer runways when heavy; some airports have limited hours, fire cover or parking','Operator confirms the airport suits the aircraft and the time'],
 ['Crew duty','Long or multi-leg days can exceed crew limits','Operator confirms the crew plan; extra crew or night-stop costs are in the quote'],
 ['Permits and slots','Approvals and lead times differ by country and airport','Operator or trip support obtains them; we give complete details early; never promise an approval'],
 ['Cabotage','Domestic legs on foreign aircraft (Module 2)','Operator confirms in writing before quoting'],
 ['Passenger documents','Passports, visas, health entry rules; advance passenger information','Each passenger is responsible for their own documents; we say so in writing; the handler confirms requirements using official sources such as IATA Timatic'],
 ['Pets','Entry rules differ by country; some require permits and approved arrival airports','Check the destination authority\'s rules and the operator\'s acceptance before quoting'],
 ['Dangerous goods','Spare lithium batteries, weapons, ammunition, oxygen and some medicines are restricted','Ask the client; the operator decides'],
 ['Medical needs','Passengers needing care in flight','Not a normal charter: refer through the director'],
 ['Catering, ground and security','Special catering, cars, helicopters, security teams','Ordered through the operator or confirmed suppliers; cost confirmed in writing before it is included'],
],{size:17}));
push(sp());
push(H2('6.2 Choosing the airport'));
push(BL([`Many cities have a business-aviation airport closer to the destination than the airline hub; ask where the client is actually going.`,`Opening hours and night curfews.`,`Customs and immigration: international flights must use an airport where they are available, sometimes only on request.`,`Rescue and firefighting cover: each airport has a fire category, and larger aircraft need a higher one. The operator confirms the airport suits the aircraft.`,`Runway length for the aircraft and its load, especially at hot or high airports.`,`Slots, parking and an FBO or handler.`]));
push(H2('6.3 Long flights over water or remote areas'));
push(P(`Twin-engine aircraft flying far from diversion airports, for example across oceans, can need specific approval (known as ETOPS or EDTO). It can lengthen the route or require a stop. The operator plans it and confirms the routing in writing.`));
push(H2('6.4 Weather basics for brokers'));
push(BL([`Pilots use a METAR (the current weather at an airport) and a TAF (the forecast). The crew and operator decide; we only watch for what may affect the client.`,`Fog and low cloud can delay or divert flights, often in the early morning.`,`Snow and ice mean de-icing, charged at cost after the flight.`,`Thunderstorms, strong winds and tropical storm seasons can delay or reroute flights.`,`From 48 hours before departure, check the forecast and warn the client early if delays are likely.`]));
push(LKM('Aviation Weather Center (METAR and TAF)','https://aviationweather.gov/'));
push(H2('6.5 Operational requirements and the rules behind them'));
push(P(`The operator and the captain decide how each of these is handled. The rules below explain why they exist, so you ask the right questions early and tell the client what may be charged.`));
push(T([['Requirement',1700],['The rule behind it',3200],['When it applies',1900],['What we do',2840]],[
 ['De-icing and anti-icing',`No take-off with frost, ice or snow on the wings, control surfaces, engines or sensors: EU CAT.OP.MPA.250 and US 14 CFR 135.227. Ground procedures follow ICAO Doc 9640 and SAE AS6285.`,`Cold, wet weather: northern winter (about November to March), southern winter (about June to September), and high or cold airports at any time`,`List it as an operational need, charged at cost after the flight with the receipt. Allow extra time; never promise a departure time in icing conditions.`],
 ['Airport hours and night restrictions',`Each airport publishes its hours and restrictions in its country's aeronautical information publication (AIP) and in NOTAMs. Many have night curfews or noise rules.`,`Late-night and early-morning departures or arrivals`,`Ask the operator whether the airport is open at that time. An out-of-hours opening may be possible at extra cost, or not at all: then change the time or the airport.`],
 ['Slots and prior permission (PPR)',`Busy airports are slot-coordinated (in the EU under Regulation (EEC) No 95/93, elsewhere under national rules and the worldwide airport slot guidelines). Business aviation needs a slot there too. Some airports require prior permission for the flight or for parking.`,`Major hubs, big events and peak seasons`,`The operator or its trip support requests slots and PPR as soon as the trip is booked. Never promise a time before the slot is confirmed.`],
 ['Customs, immigration and private terminals',`An international flight must land first at an airport with customs and immigration (Chicago Convention, Article 10). Authorities require passenger information in advance, for example eAPIS for the United States.`,`Every international arrival and departure`,`Check that customs is available at the planned time. A private terminal (FBO or VIP terminal) can cost extra. Passenger details reach the operator by its deadline.`],
 ['Crew duty and rest',`Limits come from the operator's authority. Example: on US unscheduled Part 135 flights a two-pilot crew may fly up to 10 hours in 24 hours, within a duty period of up to 14 hours, with at least 10 hours of rest (14 CFR 135.267). In Europe, EU flight-time rules (ORO.FTL) apply to commercial operations, and national rules still apply to some business-jet air-taxi work.`,`Long sectors, several legs in a day, an early start after a late arrival`,`Ask the operator for the crew plan in writing: extra crew, a fresh crew or a night stop. The cost is in the quote or listed as an operational need.`],
 ['Crew hotel and allowances',`Crew take their rest away from the aircraft.`,`The aircraft waits with the client overnight or for several days`,`Agree with the operator whether hotel and allowances are in the price or charged at cost.`],
 ['Parking and hangarage',`Airports limit parking space, and some require prior permission to park. A hangar protects the aircraft from snow and ice.`,`Night stops and waiting days, especially at busy or winter airports`,`Confirm parking, or repositioning to another airport, before booking. A hangar in winter can avoid de-icing but costs extra.`],
 ['Technical stops and long sectors',`Range falls with load, headwinds and hot or high airports. Long flights over water can need ETOPS or EDTO approval (Module 6.3).`,`Very long sectors and full cabins`,`Only the operator confirms non-stop for that load and season. A technical stop adds time, fees and sometimes permits.`],
 ['Permits',`Non-scheduled flights need permission to land in, and often to fly over, other countries (Chicago Convention, Article 5, and national rules). Domestic legs on foreign aircraft are cabotage (Module 2).`,`Every international trip; strictest in the countries in Appendix G.5`,`Give the operator the full routing and passenger details at booking. Later changes need new permits and may be refused.`],
 ['Pets',`Entry rules for animals differ by country (in the EU, Regulation (EU) No 576/2013). Some countries accept pets only on approved routes and at approved airports.`,`Any animal on board`,`Check the destination's rules and the operator's written acceptance before quoting. See Appendix G.4.`],
 ['Dangerous goods and weapons',`Governed by ICAO Annex 18 and the ICAO Technical Instructions. Spare lithium batteries, oxygen, some medicines, firearms and ammunition are restricted.`,`Any unusual item in the luggage`,`Ask the client; the operator decides. Firearms and armed security need permits in every country involved: refer to the director.`],
 ['Children and passengers needing help',`Infants count as passengers on the manifest. Child seats must be acceptable to the operator. A passenger who needs medical care in flight needs an air ambulance.`,`Families, elderly passengers, reduced mobility`,`List child seats and assistance as client requests. Medical care on board is never a normal charter: refer through the director.`],
 ['Catering and allergies',`The caterer and the operator are responsible for food safety; they need allergies in writing.`,`Every flight: always ask about allergies`,`Write dietary needs and allergies on the order and get them confirmed back.`],
],{size:16}));
push(sp());
push(P(`Anything that depends on the day (de-icing, extra parking, out-of-hours fees, crew nights after a change) is charged at cost after the flight, with receipts. Anything a supplier quotes in writing before booking can be a fixed price. Module 9.8 explains how each is priced.`));
push(P(`In the Arche portal the trip file suggests operational needs from the trip itself: de-icing for winter dates at airports north of 35° N (November to March) or south of 35° S (June to September); out-of-hours handling for departures between 22:00 and 06:00; crew hotel and parking when the aircraft waits between legs; a private terminal and customs on international arrivals; a possible technical stop on sectors over 6,500 km; and client requests from words in the trip notes. A suggestion is a prompt to ask the operator, never a fact.`));
push(quiz(6,[
 ['Avinode shows a range that covers the route. Can you promise non-stop?',['Yes','Only after the operator confirms for that load and season','Only in winter','Only for heavy jets'],'b'],
 ['Who decides whether a passenger may carry a spare lithium battery?',['The broker','The client','The operator','The FBO'],'c'],
 ['A client needs a nurse and stretcher on board. What do you do?',['Book a normal jet','Refer to an air-ambulance operator through the director','Ask the client to bring equipment','Decline'],'b'],
 ['A TAF at the destination forecasts fog at arrival time. Who decides whether to fly?',['The broker','The client','The crew and operator','The FBO'],'c'],
 ['A client flies Geneva to London in January at 07:00 and snow is forecast. How is de-icing handled?',['Included free','Listed as an operational need, charged at cost after the flight with the receipt','Fixed at USD 2,000 in the quote','Jets never need it'],'b'],
 ['A client wants to leave at 01:00 from an airport that closes at 23:00. What do you do?',['Promise the time','Ask the operator whether an out-of-hours opening is possible and at what cost; otherwise change the time or the airport','Ignore it','Tell the client to call the airport'],'b'],
 ['Who sets a crew\'s duty and rest limits?',['The broker','The client','The operator\'s authority, applied by the operator','The FBO'],'c']
]));

// ================= MODULE 7
push(H1('Module 7  Aircraft knowledge: long-range and heavy jets',false));
push(H2('7.1 Families to know'));
push(P('Clients choose by cabin, comfort and whether the jet can fly the trip without a stop. Learn the main families below from the manufacturers\' own pages (Appendix D) and from each aircraft\'s listing on Avinode. Never quote a range, speed or seat number from memory: always use the specific aircraft\'s data and the operator\'s confirmation.'));
push(T([['Manufacturer',2200],['Long-range and large-cabin families to know',7440]],[
 ['Bombardier (Canada)','Global Express, Global XRS, Global 5000, 5500, 6000, 6500, 7500 and 8000; Challenger 650 (large cabin, shorter range)'],
 ['Gulfstream (United States)','G450, G550, G500, G600, G650 and G650ER, G700, G800'],
 ['Dassault (France)','Falcon 900 series, 7X, 8X, 6X'],
 ['Embraer (Brazil)','Lineage 1000 (converted airliner); Praetor 600 (super-midsize, long range for its class)'],
 ['Boeing and Airbus','Boeing Business Jet and Airbus Corporate Jet: VIP-converted airliners'],
]));
push(sp());
push(H2('7.2 How to compare aircraft for a client'));
push(T([['Point',2400],['What to look at',7240]],[
 ['Cabin','Height (can people stand), width, length, number of zones'],
 ['Seats and beds','Number of seats, how many can be made into beds on a night flight'],
 ['Range for this trip','Operator\'s confirmation for the actual load, not the brochure figure'],
 ['Age and refurbishment','Year of manufacture and date of last cabin refurbishment'],
 ['Connectivity','Type of Wi-Fi and whether it works on the route; any usage charge'],
 ['Crew','Number of cabin attendants; crew rest area on long flights'],
 ['Baggage','Hold size and whether it is reachable in flight; skis, golf bags'],
 ['Lavatory and galley','Number of lavatories; galley for hot meals'],
]));
push(sp());
push(quiz(7,[
 ['A client asks the range of a Global 6000. Where do you get the answer?',['Memory','The aircraft\'s Avinode listing, the manufacturer\'s page and the operator\'s confirmation for the trip','A competitor\'s website','The client'],'b'],
 ['For a 13-hour night flight, which points matter most?',['Paint colour','Beds, crew rest and confirmed non-stop range for the load','Aircraft name','Number of windows'],'b'],
]));

// ================= MODULE 8
push(H1('Module 8  Sourcing on Avinode and operator vetting',false));
push(H2('8.1 Sourcing on Avinode'));
push(NL(['Search the route and dates; filter by category, seats, year of manufacture and the features the client needs.','Send requests for quotes to several suitable operators at once, with the full trip details (RFQ text in Appendix B).','Compare quotes on the same basis: all-in price, inclusions and exclusions, positioning, aircraft age and cabin, operator safety credentials, quote expiry.','Choose; confirm availability and the final price with the operator in writing.','Quote the client from Avinode (Module 9); book and pay the operator through Avinode and our payment provider (Module 10).']));
push(P('Direct contact with operators is good for relationships and off-market aircraft, but every booking is recorded and paid through Avinode and our payment provider.'));
push(H2('8.2 Operator vetting standard'));
push(T([['Check',2600],['Standard',4140],['Evidence on file',2900]],[
 ['AOC','Valid commercial AOC; aircraft listed in the operations specifications','AOC and operations specifications'],
 ['Insurance','Current certificate covering commercial passenger flights, with passenger liability of at least USD 50 million for jets and USD 25 million for turboprops','Insurance certificate; the amount recorded in the portal'],
 ['Safety audit','ARGUS Platinum or Platinum Elite, WYVERN Wingman or Wingman PRO, or IS-BAO Stage 2 or 3: current on the date of the last flight and held by the AOC that flies the trip. Every other case (ARGUS Gold or Gold Certified, IS-BAO Stage 1, WYVERN Registered, another audit or none) only as an Arche-approved operator or with the director\'s approval for one trip (8.3)','The auditor\'s own registry entry or certificate, checked at the source for each booking no more than 14 days before it goes to operations, saved on the trip with the expiry date. For an Arche-approved operator: the entry on the approved-operator list, valid on the date of the last flight'],
 ['Crew','Two pilots on every jet flight; crew type-rated and current on the aircraft','Operator\'s written confirmation'],
 ['Banned lists','Operator not on the EU Air Safety List or any similar national ban','Search result with date'],
 ['Foreign permissions','The authorisations needed for the route (for example EASA TCO, US authority, CAAS operations permit)','Operator\'s written confirmation'],
 ['History','No fatal accident, serious incident or regulatory sanction in the last five years. Anything in that time only with the director\'s approval after a written explanation','Public accident databases and operator statement'],
 ['Suspension','An operator is suspended after any accident or serious incident until the director has reviewed it','The portal\'s suspension list'],
 ['Sanctions','Operator and owner not sanctioned (Module 3)','Screening record'],
 ['Terms','Operator terms can be matched back to back by our client terms','Operator contract'],
],{size:17}));
push(sp());
push(H2('8.3 Arche-approved operators'));
push(P('Many good operators, above all in Asia-Pacific and the Middle East, hold none of the audits in 8.2. The director can approve such an operator once, for twelve months, after the checks below. Approved operators are on the approved-operator list in the portal, with the date the approval ends, and brokers can quote them like an audited operator. The approval belongs to the AOC that flies the trip, not to a brand or a group.'));
push(P('Before the director approves an operator, all of these are in place and saved in the portal:'));
push(BL(['AOC and aircraft confirmed with the issuing authority or its public register where one exists','Insurance confirmed by the insurer or the operator\'s insurance broker, not only by a copy, with the amounts in 8.2','IS-BAO registration, or a completed Arche operator questionnaire on safety management, crew training and maintenance','A review of the operator\'s safety documents (safety management manual, training and maintenance records), with a visit to the operator where practical','No adverse history in public accident databases in the last five years','Two references from brokers or clients who have flown with the operator','The operator\'s written commitment that every crew flying our trips meets the crew minimums: captain at least 3,000 hours in total and 250 hours on the type; first officer at least 1,000 hours in total']));
push(P('For every trip with an approved operator, the per-trip checks in 8.2 still apply: the aircraft on the AOC, insurance current, two pilots on jets, history clear, not suspended, and the approval valid on the date of the last flight.'));
push(P('An approval ends at once, before the twelve months are up, if the operator has an accident or serious incident (it is suspended, 8.2), its insurance lapses or falls below the minimum, its AOC changes or is suspended, or it fails sanctions screening. The director can withdraw an approval at any time. A renewal needs the checks again.'));
push(P('An operator that is neither audited (8.2) nor approved can be used only with the director\'s approval for that one trip, after the same checks. If we expect to use it again, approve it for twelve months instead.'));
push(P('Every quote and charter confirmation states the operator\'s safety status in one line, so the client always knows: the audit and its expiry date (for example "ARGUS Platinum, valid to 30 June 2027"), "Arche-approved operator, approval valid to …", or "Approved by the director for this trip". The portal writes this line from the Operator safety record.'));
push(P('ARGUS Gold Plus no longer exists. ARGUS Gold Certified is described by ARGUS as a remote, one-day audit, so it does not replace the on-site audit that Gold Plus required (ARGUS, 30 April 2026). The standard in 8.2 keeps an independent audit of the operator: on site for ARGUS Platinum and WYVERN Wingman, by a third-party auditor for IS-BAO. An Arche approval is our own review and is described to clients as exactly that.'));
push(H2('8.4 Red flags'));
push(BL(['Price far below every other quote for the same trip','Aircraft registered privately, or not on the AOC','Reluctance to send AOC, insurance or contract','Payment requested to a personal account or a country unrelated to the operator','Last-minute change of operator or aircraft without explanation']));
push(H2('8.5 Crew and insurance'));
push(BL([`Ask the operator to confirm in writing two pilots on every jet flight, and that the crew are type-rated and current on the aircraft; on long-range trips, ask about their experience on the type and route. A single-pilot jet flight stops the trip.`,`Insurance must cover commercial passenger flights, with passenger liability of at least USD 50 million for jets and USD 25 million for turboprops. In the United States, cover of USD 50 to 100 million is typical for turbojets (NBAA, 2024). Record the amount in the portal; a lower amount stops the trip.`,`Arche carries no liability insurance of its own in its first months: all aircraft, passenger and third-party cover is the operator\'s. So on every trip check the certificate: the amount, valid on every flight date, the aircraft registration on it, the route inside its territorial cover, and confirmed with the insurer or the operator\'s insurance broker (once per certificate; the operator library keeps it for the next trip). A gap stops the trip.`,`Where possible, ask the operator to add the client, and Arche, as additional insured on its policy.`,`Check the regulator's public records for enforcement action against the operator where they exist.`]));
push(quiz(8,[
 ['Which audit is accepted without director approval?',['ARGUS Gold Certified','WYVERN Wingman','IS-BAO Stage 1','No rating'],'b'],
 ['An operator holds no audit and is not on the approved-operator list. What must happen before it flies a trip?',['Nothing','The director approves it for that trip after the checks in 8.3, or approves the operator for twelve months','The client gets a discount','Only the operator\'s word'],'b'],
 ['How long does an Arche operator approval last?',['One trip','Twelve months, unless it ends earlier (accident, insurance, AOC, sanctions)','For ever','Until the client complains'],'b'],
 ['Before using an operator for a flight into Europe, which list do you check?',['The OFAC list only','The EU Air Safety List','The ATOL list','None'],'b'],
 ['What should you ask the operator about its insurance?',['Nothing','What liability cover it carries, and whether the client and Arche can be added as additional insured','Only the premium','Who the insurer\'s director is'],'b']
]));

// ================= MODULE 9
push(H1('Module 9  Pricing and quoting',false));
push(H2('9.1 How we get the price'));
push(P('Every price comes from a written operator quote. We do not estimate operator costs and never quote an item we cannot show a source for.'));
push(NL(['Request an all-in quote through Avinode with the full trip details.','Ask the operator for its inclusions and exclusions in writing: positioning legs, crew overnight costs, landing, handling and parking, navigation fees, standard catering, fuel and any fuel surcharge, taxes, de-icing, Wi-Fi use, permits.','Note the quote currency and its expiry.','For items outside the operator quote that the client wants (special catering, ground transport, security), get a written quote from the supplier before including it.']));
push(H2('9.2 Costs that cannot be fixed before the flight'));
push(P('Some costs depend on the day: de-icing, extra parking or hangar time, extra crew nights after a schedule change, late catering, Wi-Fi data use, changing airport or passenger taxes, and permit fees for late changes. Treat them the same way every time:'));
push(BL(['Never put a number on them unless the operator or supplier has given it in writing.','List them in the quote and in Part A of the confirmation as "at cost, invoiced after the flight with receipts".','If the client asks how much, ask the operator for its best estimate in writing and pass it on as the operator\'s estimate, never as a fixed price.','After the flight, recharge only what the operator invoices, with receipts, with no margin unless the confirmation says otherwise.']));
push(H2('9.3 The Arche price formula'));
push(P('Our margin is 9% of the price the client pays. Because it is a share of the selling price, divide the cost by 0.91; do not add 9% to the cost.'));
push(box('Price formula',['Arche cost = operator all-in price (including positioning legs) + supplier items Arche buys for the client, confirmed in writing',
 'Client price = Arche cost ÷ 0.91     Arche margin = client price − Arche cost = 9% of the client price',
 'Not included: items "at cost, after the flight" (9.2), and card payment costs, charged as set out in the confirmation']));
push(sp());
push(H2('9.4 Worked examples'));
push(T([['Example',5640],['USD',4000]],[
 ['A. One-way: operator all-in 100,000','Client price 100,000 ÷ 0.91 = 109,890.11, rounded up to 109,891; margin 9,891'],
 ['Wrong method: 100,000 + 9% = 109,000','Margin 9,000 = only 8.26% of the price'],
 ['B. Multi-leg: three legs quoted by one operator, all-in 180,000 including positioning','Price on the total: 197,803; margin 17,803. Never price legs separately if the operator quotes the trip as one'],
 ['C. Shared positioning: operator lowers its price from 100,000 to 92,000 because the empty return is sold','New client price 101,099 if the client is not yet contracted; if already contracted, the confirmation decides who benefits'],
 ['D. Supplier item: ground transport quoted 1,200 in writing; operator all-in 60,000','Arche cost 61,200; client price 67,253; margin 6,053'],
 ['E. Currency: operator quotes in EUR, client pays in USD','Convert the operator price with the payment provider exchange rate on the day of the quote; state the quote currency and that it is fixed only after payment'],
 ['F. Post-flight: de-icing invoiced by the operator at 2,850 with receipt','Recharge 2,850 through a payment request within 7 days of the flight, with the receipt; no margin'],
]));
push(sp());
push(P('Margins below 9% need the director\'s approval before the quote is sent. Round client prices up, never down.'));
push(H2('9.5 Empty legs'));
push(P('Empty legs are priced with the same formula on the operator\'s empty-leg conditions, which usually allow the operator to cancel or change the flight if the main charter changes. The client receives those conditions in writing; the Arche confirmation prints them when the booking type is "empty leg".'));
push(H2('9.6 Presenting the quote'));
push(BL(['Send the quote from Avinode, using the quote email template in Appendix B: aircraft type and year, seats, operator, schedule in local time, price, inclusions, "at cost" items and the expiry.','Say "tail to be confirmed" if the aircraft is not yet fixed, and confirm it before the contract.','Never show the operator\'s price or our margin to the client.','Quotes expire with the operator quote; re-confirm price and availability before sending the contract.']));
push(H2('9.7 Negotiating with operators'));
push(BL([`Ask for an all-in price and compare like for like (Module 8.1).`,`Use the client's flexibility: a different day, time or airport can save positioning or match an empty leg.`,`Ask how the operator prices waiting days, one-way versus return and shared positioning.`,`Never invent a competing quote, misstate the client's needs or press for savings on safety, crew or maintenance.`,`Good operators remember fair brokers: agree terms in writing and pay on time.`]));
push(H2('9.8 Pricing client requests and operational extras'));
push(P(`Every client request and operational extra is charged in one of three ways. Agree which with the operator or the supplier in writing before the confirmation is issued.`));
push(T([['How it is charged',2200],['When to use it',3300],['Price and payment',4140]],[
 ['Included in the charter price','The operator includes it in its all-in quote, for example standard catering or handling','Nothing extra: it is part of the operator price'],
 ['Fixed price','A supplier or the operator quotes it in writing before booking, for example a car, flowers or a private terminal fee','Like any supplier item Arche buys, it carries the 9% margin: supplier price ÷ 0.91, rounded up. It is its own line on the confirmation and is paid with the balance, or with the full price when departure is less than 7 days away'],
 ['At cost after the flight','The amount depends on the day: de-icing, extra parking or hangarage, out-of-hours fees, crew nights after a change, Wi-Fi use','No number before the flight (Module 9.2). Invoiced within 7 days of the flight with the receipts, through a payment request; payable within 10 calendar days of the invoice (Part A, A7). No margin'],
]));
push(sp());
push(P(`Worked example: an operator all-in price of USD 100,000 gives a charter price of 109,891. The client adds a car at arrival, quoted in writing at 1,200: the fixed line is 1,200 ÷ 0.91 = 1,318.68, rounded up to 1,319. Total payable: 111,210. The deposit stays at 25% of the charter price: 27,473. The balance of 83,737 is due 7 days before departure. Winter de-icing is listed at cost and invoiced after the flight.`));
push(quiz(9,[
 ['The operator all-in price is USD 60,000. What is the client price at 9%?',['65,400','65,935','65,934','66,000'],'b'],
 ['A client asks the de-icing cost before booking. You:',['Guess 2,000','Ask the operator for a written estimate and pass it on as its estimate','Add it to the fixed price','Refuse to answer'],'b'],
 ['Which items carry the 9% margin?',['Everything including post-flight extras','The operator price and confirmed supplier items Arche buys','Only the operator price','Only extras'],'b'],
 ['Operator all-in 140,000 plus a written catering quote of 2,500 bought by Arche. Client price?',['156,594','155,325','150,000','156,000'],'a'],
 ['Which negotiation step is acceptable?',['Telling the operator you have a cheaper quote you do not have','Asking whether a different departure day saves positioning','Asking the crew to skip rest','Hiding the passenger count'],'b'],
 ['A car at arrival is quoted in writing at USD 1,200 before booking. What does the client pay for it?',['1,200','1,308','1,319','1,330'],'c'],
 ['How is de-icing charged?',['As a fixed price with margin','At cost after the flight with the receipt, without margin','Always included','Never'],'b']
]));

// ================= MODULE 10
push(H1('Module 10  Contract, payment and settlement',false));
push(H2('10.1 The contract'));
push(P('The client signs the Arche charter confirmation: booking details, Part A Key Booking Terms and Part B Standard Conditions. It is issued only when the pre-issue checklist (Appendix A) is complete.'));
push(BL(['Back to back, every time: if the client cancels, the client pays the higher of our scale (Part A, A9) and the operator\'s own cancellation charge plus our fee. Enter the operator\'s scale from its terms in the portal; the confirmation prints the charges for each period of this booking.','Payment follows Part A, A3 and the payment schedule printed in the confirmation. If the operator wants money earlier, or its cancellation charges rise earlier, the client pays earlier: the portal sets the dates.','Learn Part A; never vary it.','No flight departs until the client has paid in full as agreed.']));
push(H2('10.2 How money moves'));
push(T([['Step',600],['What happens',6040],['Where',3000]],[
 ['1','Request to Book sent on Avinode; the operator holds the aircraft until a stated time; its contract is received and checked against the terms in the portal','Avinode, portal'],
 ['2','Charter confirmation issued, with this booking\'s payment schedule and cancellation charges; the offer ends before the operator\'s hold does','Portal'],
 ['3','Client signs and pays through a payment request from our payment provider (bank transfer, card or instant payment); the money is recorded when it has cleared','Payment provider, portal'],
 ['4','Operator contract signed, only once the client money held covers what the operator wants at signing and its cancellation charge from then on','Avinode'],
 ['5','Operator paid from the payment account, only from cleared client money, never more than has been received and never more than the operator price','Payment provider, portal'],
 ['6','Arche\'s margin is transferred to Arche\'s operating account at Citi Singapore (account being set up)','Citi Singapore'],
]));
push(sp());
push(P('Only our margin enters Arche\'s own bank account. Operator money never passes through it.'));
push(P('The rule behind the order: Arche never pre-funds. At every moment the client money held covers what Arche would owe the operator if the trip were cancelled then. If a client payment is missing on its due date, operations cancels with the operator before the operator\'s next charge starts; the portal shows that date on Today.'));
push(H3('Deadlines the portal watches'));
push(BL([`Payment reminders: when the director has switched them on, the client gets an email 3 days and 1 day before each payment in the schedule, until the money has cleared.`,`Client payment overdue: an urgent alert to operations at once; the next person is added if nobody acts.`,`Unsigned offer past its validity: it lapses by itself. Confirm the operator\'s hold before accepting a signature or money, or close it.`,`Critical: operator deadline, the highest alert: from 12 hours before the operator\'s charge or payment rises on a booking whose operator contract is signed, while the client money does not cover it or the operator is not paid, everyone involved (operations, the director, the trip\'s broker) gets a phone alert every 10 minutes day and night, an email every hour and a red bar on every page, until the money clears, the operator is paid or the booking is cancelled. Arche is liable from that moment.`,`Cancelling is one click by operations or the director, never automatic: cancel on Avinode first and get the operator\'s written charge, enter it, then send. The portal sends the client the notice with the A9 charge and records the cancellation.`]));
push(H2('10.3 Refunds, changes and disputes'));
push(BL(['Refunds go back the same way they came, to the same payer, from the payment account.','Schedule changes: get the operator\'s new price in writing; issue an amended confirmation; collect any difference before the flight.','Card chargebacks or disputes: escalate to the director the same day with the file.']));
push(H2('10.4 The booking file'));
push(P('Every booking keeps, in Avinode and the CRM: enquiry, KYC and sanctions records, operator quotes, AOC, operations specifications, insurance and audit evidence, the signed confirmation, payment records, the passenger list and post-flight invoices.'));
push(H2('10.5 Financial controls'));
push(BL([`No credit: every flight is paid in full as agreed before departure.`,`Check the payment account every day: payments received, payments to operators and refunds match the bookings.`,`Currency: the quote states its currency; a price in another currency is fixed only once paid.`,`Card payments can be disputed later: keep the signed confirmation and proof of the flight in the file.`,`Keep the booking file for the period set by Arche's record-keeping rule.`,`Separate duties: the person who sold a trip never issues its confirmation or records its payments; a second person does.`,`Margin: 9% of the client price is the minimum. A different margin on a trip, higher or lower, is only for special circumstances and only by the director\'s decision, with the reason recorded in the portal.`]));
push(H2('10.6 When to book: the booking timeline'));
push(T([['When',2300],['What must happen',4840],['Where it is set',2500]],[
 ['When quoting','The quote and the confirmation state the offer expiry date, time and time zone. Once it has passed, re-confirm the aircraft and price with the operator before signing.','Module 9.6; the confirmation'],
 ['On signature','Deposit of 25% of the charter price, at least USD 2,500, or more if this booking\'s payment schedule says so. If departure is less than 7 days away, the full price on signature. The booking is held only once cleared funds arrive.','Part A, A3; the confirmation\'s schedule'],
 ['Within 24 hours of the deposit','Names and passport copies for everyone travelling (with the signature if paid in full). Permit authorities may set an earlier date, which must be met.','Part A, A4'],
 ['As soon as booked','The operator or its trip support requests permits, slots and prior permission, and orders the confirmed requests and extras. Never promise an approval.','Modules 0.6 and 6.5'],
 ['Dates in the schedule','Further payments where the operator wants money earlier, or its cancellation charges rise, before the usual balance date. The operator\'s contract is signed and the operator is paid only from money already received.','Part A, A3; the confirmation\'s schedule'],
 ['7 days before the first departure','Balance due, including fixed-price requests and extras, unless the schedule sets an earlier date. Positioning legs are part of the trip.','Part A, A3'],
 ['48 hours before','Check the weather (de-icing, delays), the crew plan, airport hours and the trip brief.','Modules 6.4 and 11.1'],
 ['Day of flight','Passengers ready at the departure terminal 45 minutes before the scheduled time.','Part A, A6'],
 ['After the flight','Items at cost invoiced within 7 days with receipts; the client pays within 10 calendar days of the invoice.','Module 9.8; Part A, A7'],
 ['If the client cancels','Written notice; the client pays the higher of the scale in Part A, A9 and the operator\'s charge plus our fee. The confirmation shows the amount for each period.','Part A, A9'],
]));
push(sp());
push(P(`Book as early as the client allows. Every day closer to departure means fewer aircraft to choose from, permits and slots that are harder to get, and payment due at once.`));
push(H2('10.7 How to book in the Arche portal, step by step'));
push(NL([`Open the enquiry: from a lead with "Open an enquiry", or with New enquiry. For each airport, type a city, airport name or code and pick from the list; the portal stores the ICAO code.`,`Add the client requests and operational extras, each with how it is charged (Module 9.8). Use the suggestions as prompts and confirm every item with the operator or supplier.`,`Enter the operator quote from Avinode: operator legal name as on its AOC, aircraft type, registration, Avinode trip ID, the operator all-in price and any direct trip costs. The portal sets the client price at 9%.`,`Enter the operator's terms from its quote or contract on Avinode: its cancellation scale, its payment terms, and its insurance (insurer, amount, expiry, aircraft on the certificate, route inside the cover, how it was confirmed with the insurer). If the operator is in the operator library, press "Use the terms on file" and check them against this quote.`,`Attach the operator quote, AOC, insurance certificate, safety audit evidence and the client's KYC documents. Documents stay in the portal: never email passports or contracts.`,`Tick the pre-issue checks (insurance and operator terms are ticked by the portal from what you entered) and send the trip to operations.`,`Operations confirms the operator price on Avinode, sends Request to Book, records until when the operator holds the aircraft, attaches the operator's contract and confirms it matches the terms in the portal (the tick "Operator contract matches" in the portal), completes KYC and sanctions screening, creates the payment request and issues the charter confirmation. The offer cannot run past the operator's hold. The PDF is saved to the trip; any change after issue becomes a numbered revision.`,`Operations records each client payment as it clears, signs the operator's contract on Avinode when the portal shows the client money covers it, records each operator payment (never more than received) and the flight. Your commission then appears on your dashboard.`]));
push(quiz(10,[
 ['The operator\'s cancellation terms are stricter than Part A. What happens?',['Issue anyway with our scale','The client pays the higher charge, and the confirmation prints it for each period','Change Part A yourself','Ask the client'],'b'],
 ['The client\'s deposit has arrived. The operator wants 50% when its contract is signed, more than the deposit. What do you do?',['Sign and pay; Arche covers the gap','Collect the payment the schedule shows first; sign the operator\'s contract only once that money is held','Ask the operator to wait and tell nobody','Skip the operator\'s contract'],'b'],
 ['Which money enters Arche\'s Citi account?',['Full client payment','Only Arche\'s margin','Operator payment','Nothing'],'b'],
 ['A trip departs in 5 days. What does the client pay on signature?',['25% of the price','The full price','USD 2,500','Nothing until the flight'],'b'],
 ['When is the balance, including fixed-price extras, due?',['On the day of flight','7 days before the first scheduled departure','After the flight','30 days after signature'],'b']
]));

// ================= MODULE 11
push(H1('Module 11  Trip operations, disruption and the 24/7 desk',false));
push(H2('11.1 Before the flight'));
push(BL(['Send passenger details to the operator as early as possible and by its deadline.','Confirm permits and slots are approved (operator or trip-support confirmation).','Confirm catering, ground transport and special requests in writing.','Confirm every client request and operational extra with the operator or supplier in writing, with how it is charged.','From 48 hours before: check the forecast for de-icing and delays, the airport\'s hours for the planned times, and the crew plan for long or late days.','Send the client the trip brief (Appendix B): aircraft, operator, FBO address, arrival time, document reminder and our 24-hour contact.']));
push(H2('11.2 Day of flight'));
push(P('Track the flight from departure to arrival. Keep the client informed before they need to ask.'));
push(H2('11.3 Disruption'));
push(T([['Event',2200],['First actions',7440]],[
 ['Aircraft unserviceable (AOG)','Ask the operator at once for a replacement of equal or higher category under its contract; if none, search Avinode and direct operators; extra cost needs the director\'s approval before it is committed; tell the client what is happening and when you will update them.'],
 ['Weather or air-traffic delay','Get the new time from the operator; confirm crew duty limits still allow the flight or what the alternative is; arrange lounge or hotel through the handler if needed.'],
 ['Permit refused or late','Operator and trip support lead; explain the cause; offer an alternative routing if the operator confirms one.'],
 ['Passenger refused at the border','Follow the authority\'s decision; documents are the passenger\'s responsibility; inform the director.'],
 ['Any safety concern','Never press an operator to fly; safety decisions belong to the crew and operator.'],
],{size:17}));
push(sp());
push(H2('11.4 The 24/7 desk'));
push(BL(['Months 1 to 8: brokers share an on-call rota set by the director; the on-call broker answers the client line and operator calls out of office hours.','From month 9: the four-person operations desk covers 24 hours in shifts.','Every shift ends with a written handover in the desk log (Appendix B): live trips, open issues, promised call-backs.','Any disruption that needs extra cost or a change of operator is escalated to the director at any hour.']));
push(H2('11.5 After the flight'));
push(P(`A trip is not finished when the aircraft takes off. The broker who sold it follows it to the last landing and then follows up with the client. A file is closed only when every step below is done.`));
push(H3('Follow the trip to the last leg'));
push(BL([`Watch every leg in the portal under Flight following: departed, landed, delayed, diverted or cancelled, with the local time. The operator or its trip support gives the times; the 24/7 desk covers the hours you are off duty.`,`Tell the client at once about any delay, diversion or change, with what happens next (Module 11.3).`,`The trip counts as flown only when the last leg has landed and the passengers have left the aircraft. Operations then records the flight.`]));
push(H3('Follow up with the client'));
push(BL([`Within 24 hours of the last landing, the broker calls or messages the client or the assistant personally: was everything as promised, and is anything still open. Log it in the portal (Aftercare).`,`At the same time, send the client the rating request from the portal (template B.10). It asks for a score from 1 to 5 for the trip overall, the aircraft, the crew and the broker, and for any comment. The client answers with one click from the email; nothing is required.`,`Record the answer in the portal when it arrives. A score of 3 or less, or any complaint, starts service recovery: the broker calls the client within 1 working day, the director is told the same day, and anything about the operator is recorded for the operator scorecard.`,`Ratings feed the broker's service score and the operator scorecard in Control, so we book the operators our clients rate highest. Never publish a client's rating or words without the client's written consent, and never write, offer a reward for or edit a review.`]));
push(H3('Settle and close'));
push(BL([`Collect the operator's final invoice and receipts for items charged at cost.`,`Recharge the client within 7 days of the flight, with copies, through a payment request.`,`Close the file only when all payments are settled, the follow-up is logged and the rating request has been sent.`]));
push(H2('11.6 Meeting the client at the FBO'));
push(BL([`For first-time or very important clients, the director may ask a broker or a local representative to meet the client at the FBO.`,`Arrive early; check with the handler that the crew, aircraft, catering and cars are ready.`,`Greet the client, introduce the crew, and stay in the background.`,`Never board the aircraft or interfere with the crew's work.`]));
push(H2('11.7 Sustainability questions'));
push(BL([`Clients may ask about emissions, sustainable aviation fuel (SAF) or carbon offsets.`,`Pass on only what the operator or a certified provider states in writing.`,`Never call a flight "green" or "carbon neutral" without a certificate for that flight.`]));
push(quiz(11,[
 ['When may you close a trip file?',['When the aircraft takes off','When the client has paid','When all payments are settled, the follow-up is logged and the rating request has been sent','After 30 days'],'c'],
 ['A client rates the trip 2 out of 5. What happens?',['Nothing, it is optional','Service recovery: the broker calls within 1 working day and the director is told the same day','The rating is deleted','The client is offered a discount on the next trip at once'],'b'],
 ['How soon after the last landing does the broker follow up personally?',['Within 24 hours','Within 7 days','Only if the client complains','Never; the operator does it'],'a'],
 ['An AOG means the replacement costs more. Who approves the extra cost?',['The broker','The director','The client\'s assistant','The operator'],'b'],
 ['The captain says the weather makes departure unsafe. You:',['Ask him to try anyway','Accept the decision and look after the client','Find another crew','Cancel without telling the client'],'b'],
 ['What must every desk shift end with?',['A phone call to the director','A written handover in the desk log','Nothing','An email to clients'],'b'],
]));

// ================= MODULE 12
push(H1('Module 12  Selling and the consultant desk',false));
push(H2('12.1 The Arche standard'));
push(BL(['Answer every enquiry the same business day; urgent same-day trips at once.','Say what you will do and by when, then do it.','Write as you speak: short, clear, no jargon, no exaggeration.','Never criticise competitors or operators to a client.','Confirm everything important in writing.']));
push(H2('12.2 Inbound calls'));
push(P('Use the inbound call script (Appendix B): listen first, capture the mission, qualify, agree the next step and when the client will hear from you. Do not quote prices on the first call unless you have a current written operator quote for the same trip.'));
push(H2('12.3 Common objections'));
push(T([['Client says',3400],['Answer along these lines',6240]],[
 ['"Another broker is cheaper."','Compare the same aircraft, age, operator rating and inclusions; if like for like, ask the director whether we can match.'],
 ['"Why can\'t you fix the price for everything?"','Some costs depend on the day; we list them and charge only what the operator invoices, with receipts.'],
 ['"Can we pay later?"','No flight departs until paid in full; our secure payment link makes paying quick.'],
 ['"Just add two friends on the domestic leg."','Only if the operator confirms in writing that the law allows it.'],
 ['"Why do you need my passport?"','The law and the operator require it for every passenger; it is stored securely and used only for the flight.'],
]));
push(sp());
push(H2('12.4 Charter consultants (outbound)'));
push(BL(['Call only lists approved by the director; never buy or scrape lists.','Check numbers against the national do-not-call register where one exists (for example Singapore\'s Do Not Call Registry) and record every opt-out at once.','Say who you are and why you call in the first sentence; use the outbound script (Appendix B).','Hand every live trip to a broker for sourcing and pricing until certified as a broker.','Log every call and outcome in the CRM.']));
push(H2('12.5 Account management and growth'));
push(BL([`Every enquiry moves through the CRM pipeline: new, qualified, quoted, won or lost, with the reason for a loss.`,`Follow up every quote before it expires.`,`For repeat clients, keep their preferences (catering, seating, cars) with their consent, and use them on the next trip.`,`Ask for feedback after every trip and act on it.`,`Ask satisfied clients for introductions; never pay for referrals without the director's approval.`]));
push(T([['What the director tracks',4800],['Why',4840]],[
 ['Response time to new enquiries','Clients book with whoever answers well and first'],
 ['Quote-to-booking conversion','Shows quality of qualification and quotes'],
 ['Repeat clients','The best measure of service'],
 ['Bookings without errors','The Arche standard'],
]));
push(sp());
push(H2('12.6 Negotiating with clients'));
push(BL([`Sell value, not discounts: aircraft, operator safety, service and certainty.`,`Offer two or three options at different prices rather than cutting the margin.`,`Below 9% needs the director's approval (Module 9).`]));
push(quiz(12,[
 ['Before calling a number from a new list, you must:',['Call at once','Check the national do-not-call register and record opt-outs','Send a message first','Ask the operator'],'b'],
 ['A client says another broker is cheaper. First step?',['Cut our margin','Compare like for like','Criticise the other broker','End the call'],'b'],
 ['A client says the price is too high. What is the best first answer?',['Cut the margin at once','Offer two or three aircraft options at different prices','Criticise the operator','End the call'],'b']
]));

// ================= MODULE 13 CASE STUDIES
push(H1('Module 13  Case studies',false));
push(P('Work each case yourself first, then compare with the model answer.'));
const CASE=(t,sc,steps)=>{push(H2(t));push(P([bo('Situation. '),r(sc)]));push(P([bo('Model answer')],{spacing:{after:40}}));push(NL(steps));};
CASE('Case 1  A simple one-way in Europe','An assistant asks for 6 passengers from London to Nice next Friday morning, returning on a separate trip later.',[
 'Confirm: which London airport, departure time in local time, names and nationalities, luggage, payer. Start KYC.','Check Module 2.4: international flight, nothing restricted. Screen all names.','Avinode: request quotes for midsize and super-midsize jets from operators allowed to fly in the EU and UK; ask inclusions and exclusions.','Compare and vet (Module 8). Choose; confirm with the operator in writing.','Price: operator all-in ÷ 0.91. Quote from Avinode with expiry and "at cost" items.','Confirmation signed; payment request; operator paid from the payment account.','Trip brief to the assistant; flight tracked; post-flight extras recharged with receipts.']);
CASE('Case 2  A US trip that touches a domestic leg','A client in Hong Kong wants New York (Teterboro) – Miami – Nassau for 8 people on a European-registered jet she flew before.',[
 'Teterboro – Miami is a US domestic leg: no foreign operator may carry it (Module 2.4).','Arche policy: no US domestic flights until US counsel has confirmed our position. Pass to the director.','Explain to the client early and plainly; offer the alternative the director approves (for example a trip that starts in Miami for the international leg, or referral).','Never quote the European jet for the domestic leg.']);
CASE('Case 3  Long range, Asia to Europe','A family of 10 wants Singapore to London overnight, non-stop, with plenty of luggage.',[
 'Shortlist ultra-long-range jets on Avinode; request quotes with the full passenger and luggage load.','Ask each operator in writing whether the flight is non-stop for that load and season, or needs a fuel stop; and how the crew will be planned (extra crew for duty limits).','Check slots and permits for both ends through the operator; Singapore requires a permit and slot (Module 2.5).','Compare beds, crew rest, Wi-Fi and age (Module 7). Present two options, each with the operator\'s confirmed routing.','Price, contract and payment as usual; trip brief states local times at both ends and the arrival date.']);
CASE('Case 4  An empty leg','An operator lists Geneva – Dubai empty in three days. A client wants it.',[
 'Screen client and passengers; check nationality against the EU rules on Russian nationals and aircraft (Module 2.4).','Get the operator\'s empty-leg conditions in writing: it can cancel or change if the main charter changes.','Price with the formula on the empty-leg price; quote as "empty leg" with those conditions.','Confirmation prints the empty-leg conditions; the client confirms he accepts the risk; payment through a payment request.']);
CASE('Case 5  Aircraft grounded on the day','Nice – New York booked. Three hours before departure the operator reports a technical fault (AOG).',[
 'Ask the operator for a replacement aircraft of equal or higher category under its contract.','If none: search Avinode and direct operators at once; vet the replacement (Module 8).','Any extra cost: director approval before commitment.','Tell the client what happened, what you are doing and when you will update; keep updating.','Record everything in the file and the desk log; agree any refund or credit under the confirmation.']);
CASE('Case 6  A compliance stop','A new client company asks for Dubai – Paris. The payer is a different company in a third country; one passenger shares a name with a listed person.',[
 'Payer different from client: get the payer\'s identity and reason; director approval needed (Module 3.1).','Possible sanctions match: stop; no payment; no explanation to the client; report to the director with the screening record.','Do not continue sourcing until the director decides.']);

CASE('Case 7  A winter night departure with a long stay','A family of eight wants Zurich to Bangkok on 22 January, leaving at 23:30, staying five nights, then flying home. They ask for halal catering, a car at arrival and a child seat for a two-year-old.',[
 'Client requests: halal catering, a car at arrival and a child seat. Get the car as a written supplier quote (fixed price ÷ 0.91) or list it at cost; confirm the catering and the seat with the operator (Modules 5.5 and 9.8).',
 'Operational needs: de-icing at Zurich in January (at cost after the flight); the airport\'s hours and night restrictions for 23:30 (ask the operator, change the time if needed); a private terminal and customs at Bangkok (Module 6.5).',
 'The sector is about 9,000 km: ask the operator in writing whether it is non-stop for eight passengers and their luggage in January, or needs a technical stop, and how the crew is planned.',
 'The aircraft waits five nights: agree crew hotel and allowances and parking at Bangkok, or positioning home and back, whichever the operator prices lower.',
 'Thailand: permits and slot or parking approval at the Bangkok airport; no domestic legs on a foreign aircraft (Module 2).',
 'Timeline: deposit on signature, names and passports within 24 hours, balance including fixed extras 7 days before departure; de-icing invoiced after the flight (Module 10.6).']);

push(H2('13.7 Spot the problem'));
push(P('Each short trip hides one problem. Name it and the action, then check Appendix C.'));
const SPOT=[
 ['Los Angeles – Honolulu – Tokyo for a family of five on a Japanese-registered jet.','Los Angeles – Honolulu is a US domestic leg (Hawaii is a US state): never on a non-US operator.'],
 ['Madrid – Tenerife – Madrid on a Swiss operator.','Tenerife is in Spain (Canary Islands): domestic Spanish legs on a non-EU operator need permission; check with the operator or use an EU operator.'],
 ['A minister\'s office books Geneva – Riyadh; the ministry pays.','Politically exposed person: enhanced KYC and director approval.'],
 ['A 14-year-old flies London – New York with an aunt.','Child without parents: ask for parental consent documents; escalate any doubt.'],
 ['Four friends each want to pay for one seat on a Paris – Ibiza flight with other strangers.','Individual seat sales: never sell per seat.'],
 ['Client adds a hotel and Formula 1 tickets to the flight and wants one price.','Package sale: director approval (package-travel and ATOL rules).'],
 ['A hunting party flies Johannesburg – Windhoek with rifles.','Firearms: operator and both authorities must approve; permits needed; director informed.'],
 ['Dubai – Tehran on a Gulfstream for a business meeting.','Embargoed destination and US-made aircraft: red; stop and escalate.'],
 ['A dog travels Bangkok – London in the cabin.','UK strict pet import rules and approved arrival routes: check the authority\'s rules and the operator\'s acceptance before quoting.'],
 ['Arrival at a curfewed European airport planned for 01:30 local.','Night curfew: operator confirms or the schedule changes.'],
 ['A handler asks for USD 500 in cash to "speed up" a landing permit.','Bribery risk: refuse and report.'],
 ['Hong Kong – Shanghai – Hong Kong on a Hong Kong-registered jet.','Hong Kong and mainland China are treated separately: the operator must confirm the permission and the regime for these flights before quoting.'],
];
SPOT.forEach((x,i)=>push(P([bo(`S${i+1}  `),r(x[0])],{spacing:{after:50}})));

// ================= MODULE 14
push(H1('Module 14  Assessment, certification and external training',true));
push(H2('14.1 Assessment'));
push(BL(['Module checks after each module; review every wrong answer with your mentor.','Written exam: questions drawn from the module checks and new scenarios; pass mark 80%, with every critical-rule question correct.','Practical exam: a mock trip from enquiry to signed confirmation; no critical error and no more than 3 minor errors (critical errors are listed in "How to use this manual").','Live negotiation lab: scored by the director at stage 5; 70 or more out of 100 with no critical point broken (14.4).','Post-trip debrief: required after every supervised booking (14.6).']));
push(H2('14.2 Avinode and payment system training'));
push(P('Avinode publishes free onboarding videos and guides in its Help Center. They can be watched without logging in, so trainees can start before Arche\'s account is live. Complete the starter course below in order during stage 3, then take the live sessions with Avinode\'s onboarding team.'));
const LK2=(t,u,why)=>P([link(t,u),r('  '+why,{size:18,color:MUTED})],{spacing:{after:60}});
push(H3('Step 1  Before you start'));
push(LK2('Getting Started with Avinode Marketplace','https://help.avinodegroup.com/hc/en-us/articles/12043060610331-Getting-Started-with-Avinode-Marketplace','Short videos for brokers: quick tools, aircraft search, trips buying, Trip Board, empty-leg search, response statistics'));
push(H3('Step 2  Starter broker training'));
push(P('Watch Avinode\'s starter broker videos in the Onboarding section of the Help Center (Appendix D.1).'));
push(H3('Step 3  Quoting and booking'));
push(LK2('Trip Manager and Online Booking training video','https://help.avinodegroup.com/hc/en-us/articles/31913562254491-Trip-Manager-and-Online-Booking-training-video','From request to client quote, contract and payment in one flow'),
 LK2('Trip Manager training videos','https://help.avinodegroup.com/hc/en-us/articles/16390512030491-Training-Videos','Six short videos: request and quote detail, quote PDF to client, trip sheet, invoice, default notes and documents'),
 LK2('Creating a Professional Quote','https://help.avinodegroup.com/hc/en-us/articles/9957467128603-Creating-a-Professional-Quote','Quote layout in Trip Manager'),
 LK2('Buying trips with the new booking flow','https://help.avinodegroup.com/hc/en-us/articles/23323694056859-Buying-trips-with-the-new-booking-flow','How a broker accepts an operator\'s quote, signs and pays'));
push(H3('Step 4  Taking and making payments'));
push(P('Our payment provider is still being chosen. Training on payment requests, card and bank payments, operator payouts and refunds is added here once it is agreed. Until then the rules in Module 10 apply: clients pay only through a payment request, and we never send or accept bank details by email or chat.'));
push(H3('Step 5  What our payment provider cannot do'));
push(P('Every payment provider refuses some countries and activities. Appendix G.7 lists the countries we cannot take payments from or pay to; check it before you quote.'));
push(H3('Step 6  Live sessions and practice'));
push(BL(['When Arche joins Avinode, ask the onboarding team for a live broker session for every broker and consultant, using our own account and settings.','Ask our payment provider for a training session: payment requests, card and bank payments, currency accounts, operator payouts, refunds, user rights and fraud controls.','Ask whether Avinode offers a practice or test environment for trainees.','Exit check for stage 3: one practice quote and one practice payment request completed, reviewed by the director.']));
push(P('The Help Center has more articles under Getting Started and Scheduling and Quoting. Settings articles (logo, notification lists, trip statuses, user permissions) are for the director, who sets up the account.'));
push(H2('14.3 External courses'));
push(P(`The Air Charter Association's Air Charter Essentials Certificate is a one-day introduction for new staff with limited or no aviation background: air charter roles, the commercial process, aviation geography, flight routing, time zones, airport operations and aircraft knowledge, with an assessment and a certificate for those who pass. It is open to non-members. As at October 2026 it runs in person at London Gatwick (next date 3 February 2027) and an online version is announced for January 2027. Published fees: USD 680 (GBP 495) for non-members; USD 405 (GBP 295) for staff of member companies and for people aged 18 to 25.`));
push(H3('Arche sponsorship (proposed)'));
push(BL([`Who: brokers and consultants who have passed the written exam (stage 2) and completed 3 supervised bookings, or earlier for a trainee the director nominates.`,`What: Arche pays the course fee directly to the ACA. Book the online course when it opens (January 2027); the in-person course only when a trainee is in the UK anyway.`,`Repayment: if the broker's agreement ends within 12 months of the course, the broker repays 100% within 6 months and 50% between 6 and 12 months. This must be written into the broker agreement first; confirm the wording with counsel.`,`Record: the certificate goes into the training record. It is an external credential only: Arche's own rules, pricing and procedures stay in this manual and are not shared with outside courses.`,`Next step: when Arche joins the ACA, high-potential brokers can add the Broker Qualification Level 1, and member rates apply to Essentials.`]));
push(LK2('ACA: Air Charter Essentials Certificate','https://www.theaircharterassociation.aero/the-air-charter-essentials-certificate/','Dates, fees and booking'));
push(P('The UK Air Charter Association runs a three-level Broker Qualification (Level 1 foundation knowledge, Level 2 operations and flight management, Level 3 advanced broker skills; Level 1 also online). It is open only to staff of member companies, so Arche must join first. Published prices per level range from about USD 610 to USD 745, with member rates lower; check the current price before booking.'));
push(T([['ACA level',2600],['Arche modules that prepare for it',7040]],[
 ['Level 1: foundation','Modules 0, 1, 2, 3, 4, 5'],
 ['Level 2: operations and flight management','Modules 6, 7, 8, 11'],
 ['Level 3: advanced broker skills','Modules 9, 10, 12, 13'],
]));
push(sp());
push(note('The mapping is Arche\'s own guide to preparation; the ACA sets its own syllabus.'));

push(H2('14.4 Live negotiation and objection lab'));
push(P(`Knowing the rules is not enough: UHNW clients and their assistants test a broker's calm and judgement under pressure. The lab practises this out loud. A senior broker or the director plays the client, the assistant or the operator; the trainee does not see the script. Each session takes about 30 minutes and covers two or three scenarios.`));
push(BL([`Stage 4 (shadowing): two practice sessions, recorded on the scoring sheet but not graded.`,`Stage 5 (practical exam): one scored session with the director. Pass: 70 or more out of 100, and neither critical point broken.`,`Annual refresher: one session for every certified broker.`]));
push(H3('Scenario bank'));
push(T([['Scenario',4300],['What a good answer does',5340]],[
 [`AOG: the booked aircraft is unserviceable 6 hours before departure`,`Calm, facts first; the operator's written replacement options; extra cost approved by the director, never promised on the call (Module 11.3)`],
 [`The assistant refuses the 25% deposit and wants to pay after the flight`,`Explain the booking terms (Module 10.6) and why the operator must be secured; offer card or bank payment options; no exceptions without the director`],
 [`The principal insists on a domestic leg on a foreign-registered aircraft`,`Explain cabotage in plain words; offer a local operator for that leg or a new routing; never sell it (Module 2.4)`],
 [`"Another broker quoted 15% less"`,`Compare like for like (aircraft, year, operator, rating, inclusions); offer two or three options; margin below 9% only with director approval (Module 12.6)`],
 [`A passenger is added on the day`,`Names to the operator at once; permits, insurance and seats confirmed in writing before you agree`],
 [`The client wants to bring a dog to a strict-entry country`,`Destination rules and the operator's written acceptance first; offer a route and airport that work (Appendix G.4)`],
 [`De-icing delays departure and the client is angry about the charge`,`Safety is the crew's decision; the charge is at cost with the receipt, as the confirmation says (Module 9.2)`],
 [`The client asks to pay into a personal account or sends new bank details by chat`,`Stop: payment request only; treat as fraud until proven otherwise (Module 3.5)`],
 [`The client asks to leave a passenger's name off the manifest`,`Refuse politely; tell the director (Module 2.4)`],
 [`Screening shows a possible sanctions match on the payer`,`Pause without accusing; say you need a short internal check; tell the director (Module 3.2)`],
 [`The client demands a guaranteed departure time in winter`,`Promise only what the operator confirms in writing; explain de-icing and slots (Module 6.4)`],
 [`Complaint after the flight about catering and a late car`,`Listen, apologise for the experience, agree what happens and by when, record it; service recovery steps in Module 11.5`],
],{size:16}));
push(sp());
push(H3('Scoring sheet'));
push(T([['Criterion',5000],['Points',1700],['Critical',2940]],[
 [`Calm and courteous under pressure`,`20`,``],
 [`Correct rule, explained in plain words`,`30`,`Yes: a wrong rule fails the lab`],
 [`Options offered instead of a flat no`,`20`,``],
 [`No promise the operator has not confirmed in writing`,`pass / fail`,`Yes: any such promise fails the lab`],
 [`Escalates when the rules say so`,`15`,``],
 [`Written follow-up within 1 hour`,`15`,``],
]));
push(sp());
push(note(`Template B.11 is the printable scoring sheet. The director may add new scenarios at any time; they go into the bank and into the AI practice partner.`));
push(H2('14.5 AI practice partner in the portal'));
push(P(`Under Training, Roleplay lab, the portal's AI plays any client, assistant, family-office manager or operator, at an easy, normal or hard level, for any scenario in the bank or one you describe yourself. You speak (where the browser supports it) or type. When you end the session, the AI scores it against the same sheet, quotes the moments that cost points and shows a model answer.`));
push(BL([`Use it as often as you like before stages 4 and 5; at least five sessions are recommended before the practical exam.`,`It is a practice partner, not an examiner: the AI can misjudge. Certification is decided only by the director's scored lab, the practical exam and the supervised bookings.`,`Sessions are saved to your training record; the director sees the number of sessions and the average score.`,`Never enter real client names or details: invent them, as in all training.`]));
push(H2('14.6 Post-trip debrief'));
push(P(`Every supervised booking (stage 6) ends with a short debrief between the trainee, the mentor and operations, within 3 working days of the last landing. It is recorded in the portal (template B.9). A supervised booking counts towards sign-off only when all three have completed their part.`));
push(T([['Measure',3400],['Scored 1 to 5 on',6240]],[
 [`Pre-issue checks`,`How completely and how quickly the pre-issue checklist (Appendix A.1) was done, with evidence on file`],
 [`Extras and changes`,`How clearly operational extras (de-icing, FBO and handling fees, parking) and any changes were explained to the client before and after the flight`],
 [`Client satisfaction`,`The client's rating and comments from the follow-up (Module 11.5)`],
]));
push(sp());
push(BL([`Errors: list any critical or minor error found (critical errors are defined in How to use this manual).`,`What went well, what to do differently, and one action with an owner and a date.`,`The mentor and operations sign; the trainee confirms they have read the result.`]));
push(quiz(14,[
 ['What does a trainee need to pass the live negotiation lab at stage 5?',['Any score','70 or more out of 100 with no critical point broken','A perfect score','The AI practice partner\'s approval'],'b'],
 ['Who decides certification?',['The AI practice partner','The director, through the scored lab, the practical exam and the supervised bookings','The client','The operator'],'b'],
 ['When does a supervised booking count towards sign-off?',['When it is quoted','When the client pays','When the trainee, mentor and operations have completed the post-trip debrief','After 30 days'],'c'],
]));

// ================= APPENDIX A
push(H1('Appendix A  Checklists',true));
push(H2('A.1 Pre-issue checklist'));
push(BL(['KYC complete and reference recorded','Sanctions screening record complete and clear','Trip checked against Module 2.4 (never-sell list, cabotage, US and EU rules)','Trip risk screen recorded; every amber point confirmed in writing; no red open','Operator AOC and operations specifications on file; aircraft listed','Operator insurance: certificate on file, at least the minimum, valid on every flight date, aircraft on it, route inside its cover, confirmed with the insurer or its broker','Safety audit standard met, or operator on the Arche-approved list (valid on the last flight date), or director approval for this trip; operator not on a banned list','Route feasible: range, runway, crew duty, permits, slots, cabotage confirmed by the operator','Operator cancellation scale and payment terms entered from its contract; contract attached and checked; the confirmation prints this booking\'s payment schedule and cancellation charges','Request to Book sent; the operator holds the aircraft until after the offer expiry','Price at 9% (any other margin only by the director\'s decision, reason recorded); "at cost" items listed','Client requests and operational extras listed, each with how it is charged; fixed prices from a written supplier quote','Airport hours, de-icing, crew plan, parking and customs checked with the operator for the planned times','Disclosures in Module 2.2 included','Payment set up as a payment request'].map(t=>'☐  '+t)));
push(H2('A.2 Operator vetting checklist'));
push(BL(['AOC','Operations specifications','Insurance','Audit evidence from the auditor\'s registry (Module 8.2), or the operator\'s Arche approval or the director\'s approval for this trip (8.3)','EU Air Safety List and national bans','Foreign permissions for the route','Accident and enforcement history','Sanctions screening','Contract terms'].map(t=>'☐  '+t)));
push(H2('A.3 Pre-flight checklist'));
push(BL(['Passenger details sent to the operator','Permits and slots confirmed','Catering and ground transport confirmed','Every client request and operational extra confirmed in writing','De-icing, airport hours and crew plan rechecked against the forecast and final times','Trip brief sent to the client','24-hour contact on duty; desk log updated'].map(t=>'☐  '+t)));
push(H2('A.4 After-flight checklist'));
push(BL([`Every leg followed to landing in the portal; changes told to the client at once`,`Follow-up call or message within 24 hours of the last landing, logged`,`Rating request sent (B.10); answer recorded when it arrives`,`Score of 3 or less or a complaint: service recovery started, director told`,`Operator invoice and receipts collected; items at cost recharged within 7 days through a payment request`,`Supervised booking: debrief (B.9) completed by trainee, mentor and operations`,`All payments settled; file closed`].map(t=>'☐  '+t)));

// ================= APPENDIX B TEMPLATES
push(H1('Appendix B  Templates',true));
push(H2('B.1 Intake form'));
push(T([['Field',3600],['Entry',6040]],[
 ['Booker / lead passenger / payer (names, contacts)',''],['Dates and local times; flexibility',''],['From (city, airport, IATA / ICAO)',''],['To (city, airport, IATA / ICAO)',''],['Further legs',''],['Passengers (adults / children / infants)',''],['Nationalities',''],['Luggage and special items',''],['Pets',''],['Purpose of travel (if a permit needs it)',''],['Catering, ground transport, special requests',''],['Budget and payment method',''],['Source of enquiry',''],['KYC started (yes / no, reference)',''],['Trip risk screen (Module 2.9): colour for each of the six questions; director decision if red',''],
]));
push(sp());
push(H2('B.2 Request for quote to operators (Avinode message)'));
push(box('Text',['Please quote an all-in price for the trip below. Please list what is included and excluded (positioning, crew overnights, landing, handling and parking, navigation, catering, fuel and surcharges, taxes, de-icing, Wi-Fi, permits), the aircraft registration and year, your safety audit status, and the quote expiry. Please also confirm whether the trip is non-stop for this load and season, and any crew-duty or permit constraints.','[Route, dates and local times, passengers, luggage, special items]']));
push(sp());
push(H2('B.3 Quote email to the client'));
push(box('Text',['Dear [name], thank you for your request. We are pleased to propose:','Aircraft: [type, year], [seats]; operated by [operator legal name as on its AOC].','Schedule (local times): [legs].','Price: USD [amount], including [inclusions]. The following are charged at cost after the flight, with receipts: [list].','This proposal is valid until [date and time]. Arche Executive acts as charter broker; the flight is operated by [operator].','To confirm, we will send our charter confirmation and a secure payment request. We never send bank details by email.']));
push(sp());
push(H2('B.4 Trip brief'));
push(box('Contents',['Trip reference; aircraft and registration; operator; departure and arrival in local time with dates; FBO name and address; arrival time at the FBO; passenger list; document reminder; catering; ground transport; Arche 24-hour contact.']));
push(sp());
push(H2('B.5 KYC record and B.6 Sanctions screening record'));
push(T([['Record',2400],['Fields',7240]],[
 ['KYC','Client type; names; identity documents seen; company details and owners; payer; date; staff member; reference'],
 ['Sanctions screening','Names screened; lists searched (UN, Singapore, US OFAC, EU, UK Sanctions List); date and time; result; match handling; staff member; director decision if any'],
]));
push(sp());
push(H2('B.7 Call scripts'));
push(box('Inbound',['"Arche Executive, [name] speaking. How can I help?" – listen – "May I take a few details so I can find the right aircraft?" – capture with the intake form – "Who will be travelling and who will look after payment?" – "I will come back to you with options by [time]."']));
push(sp());
push(box('Outbound (consultants)',['"Good morning, this is [name] from Arche Executive, a private jet charter broker. I am calling because [reason]. Is this a convenient moment?" – if no, ask when – if not interested, thank them and record the opt-out at once.']));
push(sp());
push(H2('B.8 Desk handover log'));
push(T([['Field',3600],['Entry',6040]],[['Shift and staff',''],['Live trips and status',''],['Open issues and owners',''],['Promised call-backs (who, when)',''],['Escalations to the director','']]));

// ================= APPENDIX C ANSWERS
push(H2('B.9 Post-trip debrief form'));
push(box('Debrief (supervised bookings)',[`Trip reference: [ref]   Last landing: [date]   Trainee: [name]   Mentor: [name]   Operations: [name]`,`1. Pre-issue checks (A.1): score 1–5 [ ]  Evidence on file: yes / no  Comment: [ ]`,`2. Extras and changes explained to the client: score 1–5 [ ]  Comment: [ ]`,`3. Client satisfaction: client rating [ ] / 5  Comment from the follow-up: [ ]`,`Errors found: critical [list or none]  minor [list or none]`,`What went well: [ ]   What to do differently: [ ]`,`Action: [what] by [who] by [date]`,`Signed: mentor [ ]  operations [ ]  trainee has read [ ]`]));
push(H2('B.10 Follow-up message and rating request'));
push(box('Text',[`Subject: Your flight [route], [date] – how did we do?`,`Dear [name], welcome back. Thank you for flying with Arche Executive. I hope everything was as you expected.`,`If anything was not right, please reply to this email or call me on [number]; I will deal with it personally.`,`Would you rate your trip? One click is enough: 5 Excellent · 4 Good · 3 Fair · 2 Poor · 1 Very poor. You may add a comment for the aircraft, the crew or me.`,`We use ratings only to improve our service and choose our operators. We never publish your rating or words without your written permission.`,`Kind regards, [broker name], Arche Executive`]));
push(H2('B.11 Live negotiation lab scoring sheet'));
push(box('Scoring',[`Trainee: [ ]   Assessor: [ ]   Date: [ ]   Scenarios: [ ]`,`Calm and courteous under pressure: [ ] / 20`,`Correct rule, explained in plain words: [ ] / 30   (wrong rule = fail)`,`Options offered instead of a flat no: [ ] / 20`,`No unconfirmed promise: pass / fail   (any = fail)`,`Escalates when the rules say so: [ ] / 15`,`Written follow-up within 1 hour: [ ] / 15`,`Total: [ ] / 100   Result: pass (70+, no critical) / not yet`,`Best moment: [ ]   To practise: [ ]`]));
push(H1('Appendix C  Answer key',false));
const rows=QZ.map(([m,i,a])=>[`${m}.${i}`,a]);
const half=Math.ceil(rows.length/2);const tr=[];
for(let i=0;i<half;i++){const a=rows[i],b=rows[i+half]||['',''];tr.push([a[0],a[1],b[0],b[1]]);}
push(T([['Question',2400],['Answer',2420],['Question',2400],['Answer',2420]],tr));
push(H2('Spot the problem: model answers'));
push(T([['Trip',900],['Problem and action',8740]],SPOT.map((x,i)=>[`S${i+1}`,x[1]]),{size:17}));

// ================= APPENDIX D LIBRARY
push(H1('Appendix D  Self-study library',false));
const LK=(t,u,why)=>P(why?[link(t,u),r('  '+why,{size:18,color:MUTED})]:[link(t,u)],{spacing:{after:60}});
push(P('Every link below was checked in October 2026 and is chosen for air charter brokers (people who sell flights), not aircraft sales brokers (people who sell aircraft). Links are checked again at every review of this manual; report a broken link to the director.'));
push(H2('D.1 Avinode and our payment provider'));
push(LK('Avinode for brokers','https://avinode.com/broker/','Search, TripManager quotes and contracts, empty legs; links to the Help Center'),
 LK('Avinode Help Center','https://help.avinodegroup.com/hc/en-us','Knowledge hub; free starter training videos (Module 14.2)'),
 LK('Avinode Help Center: Onboarding','https://help.avinodegroup.com/hc/en-us/sections/23935448207131-Onboarding','Starter broker videos, Trip Manager walkthroughs'));
push(H2('D.2 Charter broker training and best practice'));
push(LK('Air Charter Association: training','https://www.theaircharterassociation.aero/training/','Air Charter Essentials Certificate (one day, open to non-members) and Broker Qualification'),
 LK('Air Charter Association: Broker Qualification','https://www.theaircharterassociation.aero/the-broker-qualification/','Levels 1 to 3; member companies only'),
 LK('NBAA Best Practices for Air Charter Brokering (July 2024)','https://nbaa.org/wp-content/uploads/2024/07/NBAA-Best-Practices-for-Air-Charter-Brokering.pdf','Recommended broker practices and the US rules'),
 LK('NBAA Aircraft Charter Consumer Guide','https://nbaa.org/flight-department-administration/aircraft-operating-ownership-options/aircraft-charter/aircraft-charter-consumer-guide/','What informed clients are told to check'),
 LK('IABI Aircraft Charter Broker Course','https://www.iabi.aero/air-charter-broker-course','Commercial self-paced online course; optional, not an Arche requirement'));
push(H2('D.3 Aviation basics'));
push(LK('SKYbrary','https://skybrary.aero/','Plain explanations of aviation terms and safety topics'));
push(H2('D.4 Rules for brokers and charter flights'));
push(LK('US: 14 CFR Part 295, air charter brokers (eCFR)','https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-295'),
 LK('US: Increasing Charter Air Transportation Options, final rule (2018)','https://www.federalregister.gov/documents/2018/09/17/2018-18345/increasing-charter-air-transportation-options'),
 LK('US: public charters and selling seats (NATA)','https://nata.aero/advocacy/initiatives-and-issues/public-charter-operations/public-charter-faqs/'),
 LK('EU: EASA third-country operators (TCO)','https://www.easa.europa.eu/en/domains/air-operations/third-country-operators','Official site blocks automated checks; open in a browser'),
 LK('EU: charter flights by operators from outside the EU (Swedish Transport Agency)','https://www.transportstyrelsen.se/en/aviation/air-operators/traffic-permits/charter-flights-non-scheduled-air-service/'),
 LK('EU: Air Safety List (banned operators)','https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en'),
 LK('UK CAA: charters and air taxi flights','https://www.caa.co.uk/air-passengers/about-your-trip/charters-and-air-taxis-flights/','How to tell a legal charter'),
 LK('UK CAA: ATOL protection','https://www.caa.co.uk/atol-protection/','When packages need ATOL'),
 LK('Singapore: CAAS requirements for foreign air operators','https://www.caas.gov.sg/operations-safety/air-operations/foreign-air-operators'),
 LK('Thailand: CAAT eAIP (current edition)','https://aip.caat.or.th/','Open GEN 1.2 for entry, transit and departure'),
 LK('Thailand: permit planning (Universal Weather)','https://www.universalweather.com/blog/planning-bizav-operations-to-thailand-part-1-permit-planning/'),
 LK('EU sanctions and business aviation: Russia and Belarus (EBAA, 2023)','https://www.ebaa.org/app/uploads/2023/04/Impact-of-EU-Sanctions-against-Russia-and-Belarus-on-BizAv.pdf'));
push(H2('D.5 Operator safety and airspace'));
push(LK('ARGUS auditing services and ratings','https://argus.aero/auditing-services'),
 LK('WYVERN','https://www.wyvernltd.com/','Wingman standard and the public Wingman directory'),
 LK('IBAC IS-BAO','https://ibac.org/is-bao','IS-BAO stages and registration'),
 LK('IS-BAO (International Business Aviation Council)','https://www.ibac.org/is-bao'),
 LK('Air Charter Safety Foundation','https://www.acsf.aero/','Industry Audit Standard'),
 LK('EASA Conflict Zone Information Bulletins','https://www.easa.europa.eu/en/domains/air-operations/czibs'),
 LK('FAA prohibitions, restrictions and notices','https://www.faa.gov/air_traffic/publications/us_restrictions'),
 LK('Safe Airspace conflict-zone database (OPSGROUP)','https://safeairspace.net/'));
push(H2('D.6 Sanctions lists'));
push(LK('United Nations Security Council consolidated list','https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list'),
 LK('US OFAC sanctions list search','https://sanctionssearch.ofac.treas.gov/'),
 LK('EU sanctions map','https://www.sanctionsmap.eu/'),
 LK('UK Sanctions List search','https://search-uk-sanctions-list.service.gov.uk'),
 LK('UK: moving to a single sanctions list (28 January 2026)','https://www.gov.uk/guidance/moving-to-a-single-list-for-uk-sanctions-designations-28-january-2026'),
 LK('Singapore: MAS targeted financial sanctions','https://www.mas.gov.sg/regulation/anti-money-laundering/targeted-financial-sanctions'));
push(H2('D.7 Passengers and taxes'));
push(LK('IATA Timatic','https://www.iata.org/en/publications/timatic/','The travel-document database handlers and operators use'),
 LK('IRS audit guide: air transportation excise tax','https://irs.gov/pub/irs-mssp/air_transportation.pdf'),
 LK('UK Air Passenger Duty rates','https://www.gov.uk/guidance/rates-and-allowances-for-air-passenger-duty'));
push(H2('D.8 Aircraft manufacturers'));
push(LK('Bombardier aircraft','https://businessaircraft.bombardier.com/','Site blocks automated checks; open in a browser'),
 LK('Gulfstream aircraft','https://www.gulfstream.com/en/aircraft/'),
 LK('Dassault Falcon','https://www.dassaultfalcon.com/'));

push(H2('D.9 Operational rules'));
push(LK('EU CAT.OP.MPA.250: ice and other contaminants, ground procedures (UK CAA regulatory library)','https://regulatorylibrary.caa.co.uk/air-operations-pre-30-october-2025/Content/Document%20Structure/04%20CAT/2%20Regs/07560_CATOPMPA250_Ice_and_other_contaminants_ground_procedures.htm'),
 LK('US 14 CFR 135.227: icing conditions, operating limitations','https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.227'),
 LK('US 14 CFR 135.267: flight time limits and rest, unscheduled one- and two-pilot crews','https://www.law.cornell.edu/cfr/text/14/135.267'),
 LK('ICAO Doc 9640: Manual of Aircraft Ground De-icing/Anti-icing Operations','https://store.icao.int/en/manual-of-aircraft-ground-de-icing-anti-icing-operations-doc-9640'),
 LK('SAE AS6285: aircraft ground deicing/anti-icing processes','https://saemobilus.sae.org/content/as6285'));

// ================= APPENDIX E GLOSSARY
push(H1('Appendix E  Glossary',false));
push(T([['Term',2400],['Meaning',7240]],[
 ['AOC','Air Operator Certificate: an authority\'s approval for an operator to fly commercially'],
 ['AOG','Aircraft on ground: the aircraft cannot fly because of a technical fault'],
 ['ARGUS / WYVERN / IS-BAO','Independent safety audits of charter operators; see Module 8.2 for the levels Arche accepts'],
 ['Avinode','The marketplace Arche uses to source, quote and book flights'],
 ['Back to back','Our terms to the client mirror the operator\'s terms to us'],
 ['Block time','From moving off the parking stand to stopping at the destination'],
 ['Cabotage','Flights between two points in one country, reserved for that country\'s carriers'],
 ['Empty leg','A flight without passengers, sold cheaply on special conditions'],
 ['FBO','Fixed-base operator: the private terminal and handling service at an airport'],
 ['Flight time','From take-off to landing'],
 ['Handler','The company at an airport that arranges fuel, parking, catering and paperwork'],
 ['IATA / ICAO code','Three-letter and four-letter airport codes'],
 ['IS-BAO','International Standard for Business Aircraft Operations, a safety management standard'],
 ['KYC','Know your client: confirming who the client and payer are'],
 ['Operations specifications','The document with an AOC listing the aircraft and operations approved'],
 ['Payment request','A secure payment link from our payment provider'],
 ['Permit','A country\'s permission for a foreign flight to land or overfly'],
 ['Positioning leg','A flight without passengers to bring the aircraft to the start or back to base'],
 ['PPR','Prior permission required, for example for parking at a busy airport'],
 ['PEP','Politically exposed person: a senior public official, or a family member or close associate'],
 ['NOTAM','Notice to air missions: official notice of airspace or airport restrictions'],
 ['CZIB','EASA Conflict Zone Information Bulletin'],
 ['FET','US federal excise tax on air transportation'],
 ['RFQ','Request for quote sent to operators'],
 ['Slot','An approved take-off or landing time at a busy airport'],
 ['TCO','EASA third-country operator authorisation for non-EU operators flying into the EU'],
 ['UTC (Zulu)','The single world time used in aviation'],
]));

// ================= APPENDIX F THAI
push(H1('Appendix F  สรุปกฎสำคัญ (Thai summary of the critical rules)',true));
push(P('ฉบับภาษาไทยนี้เป็นสรุปเพื่อช่วยความเข้าใจเท่านั้น หากมีข้อความใดไม่ตรงกัน ให้ยึดฉบับภาษาอังกฤษเป็นหลัก'));
push(NL(['อาร์เช่ เอ็กเซ็กคิวทีฟ เป็นนายหน้าเช่าเหมาลำ ไม่ใช่สายการบิน ต้องแจ้งลูกค้าเป็นลายลักษณ์อักษรทุกครั้ง พร้อมชื่อผู้ให้บริการการบินตามใบรับรองผู้ดำเนินการเดินอากาศ (AOC)',
 'ขายเฉพาะการเช่าเหมาลำทั้งลำให้ลูกค้ารายเดียว ห้ามขายเป็นรายที่นั่ง',
 'ห้ามขายเที่ยวบินภายในประเทศด้วยเครื่องบินของผู้ให้บริการต่างชาติ (คาโบทาจ) เว้นแต่ผู้ให้บริการยืนยันเป็นลายลักษณ์อักษรว่ากฎหมายอนุญาต และห้ามขายเที่ยวบินภายในสหรัฐอเมริกาทั้งหมดจนกว่าผู้อำนวยการจะอนุมัติ',
 'ต้องทำ KYC และตรวจสอบรายชื่อผู้ถูกคว่ำบาตรของลูกค้า ผู้ชำระเงิน และผู้โดยสารทุกคน ก่อนออกเอกสารยืนยันการจอง หากพบชื่อที่อาจตรงกัน ให้หยุดและรายงานผู้อำนวยการทันที',
 'ใช้เฉพาะผู้ให้บริการที่มี AOC ประกันภัย และมาตรฐานความปลอดภัยตามคู่มือ หรือได้รับอนุมัติจากผู้อำนวยการ',
 'ราคาต่อลูกค้า = ต้นทุน ÷ 0.91 (กำไร 9% ของราคาขาย) ห้ามใส่ตัวเลขที่ไม่มีแหล่งที่มา ค่าใช้จ่ายที่กำหนดล่วงหน้าไม่ได้ให้เรียกเก็บตามจริงหลังเที่ยวบินพร้อมใบเสร็จ',
 'การจองทั้งหมดผ่าน Avinode และการชำระเงินทั้งหมดผ่านคำขอชำระเงิน ห้ามส่งรายละเอียดบัญชีธนาคารทางอีเมลหรือแอปแชต',
 'ข้อมูลส่วนบุคคลเก็บไว้ใน Avinode และ CRM ของอาร์เช่เท่านั้น',
 'ความปลอดภัยเป็นการตัดสินใจของกัปตันและผู้ให้บริการการบินเท่านั้น ห้ามกดดันให้บิน',
 'ทุกคำขอต้องผ่านการคัดกรองความเสี่ยงของเที่ยวบิน 6 ข้อ (Trip risk screen) และตรวจรายการเฝ้าระวัง (Watchlist) ฉบับปัจจุบันก่อนหาเครื่องบิน','เมื่อไม่แน่ใจ ให้หยุดและสอบถามผู้อำนวยการ'],
 'ติดตามทุกเที่ยวบินจนถึงขาสุดท้าย โทรหรือส่งข้อความติดตามลูกค้าภายใน 24 ชั่วโมงหลังลงจอด และส่งแบบประเมินความพึงพอใจ ปิดงานได้เมื่อทำครบทุกขั้นตอนแล้วเท่านั้น'));

// ================= APPENDIX G WATCHLIST
push(H1('Appendix G  Watchlist (maintained by the director)',true));
push(P('This page lists places and topics that need extra checks. The director updates it at least monthly from the official sources below and whenever a source changes. Always use the current version in the Arche document folder. A place on this list is not automatically refused: it tells you which check to run. A place not on the list is not automatically safe: the trip risk screen still applies.'));
push(T([['Item',2200],['Detail',7440]],[['Watchlist reviewed','October 2026, by the director'],['Next review','November 2026']]));
push(sp());
push(H2('G.1 Territories where a leg may be domestic'));
push(T([['Country',2200],['Territories and islands to watch',7440]],[
 ['United States','Alaska, Hawaii, Puerto Rico, US Virgin Islands, Guam, Northern Mariana Islands, American Samoa'],
 ['Spain','Canary Islands, Balearic Islands, Ceuta, Melilla'],
 ['Portugal','Madeira, Azores'],
 ['France','Corsica; overseas departments Guadeloupe, Martinique, French Guiana, Réunion, Mayotte'],
 ['Italy','Sicily, Sardinia'],
 ['China','Hong Kong and Macau are treated separately from mainland China; the operator confirms the regime for every flight between them'],
]));
push(sp());
push(H2('G.2 Sanctions and embargoes'));
push(P('Always screen against the official lists in Appendix D; the summary below only tells you where to look harder.'));
push(BL(['Broad embargoes in force under one or more of the UN, US, EU or UK regimes include Iran and North Korea; the US also keeps a broad embargo on Cuba, which can affect flights with US-made aircraft.','Russia and Belarus: wide-ranging measures, including the EU ban on aircraft chartered or controlled by Russian nationals (Module 2.4); the Russian-occupied regions of Ukraine (Crimea, Donetsk, Luhansk) are under near-total restrictions.','Syria: sanctions programmes have changed; check the current status on each list before any quote.','Any other country with UN, US, EU, UK or Singapore measures: director decision.']));
push(H2('G.3 Conflict zones and airspace notices'));
push(P('EASA publishes Conflict Zone Information Bulletins for European operators, and the FAA publishes prohibitions and security notices for US operators. As at October 2026 the FAA lists international security notices for: Afghanistan, Belarus, Central America, Colombia, Ecuador, Haiti, Iran, Iraq, North Korea, Libya, Mali, Mexico, the Pacific Ocean, Panama, the Persian Gulf and Gulf of Oman, the Russian Federation, Saudi Arabia, Somalia, Syria, Ukraine and Yemen. A notice can range from a full ban to advice for part of the airspace; it applies to the operator, not to the whole country. Any route touching these areas: amber at least; the operator confirms routing and insurance in writing.'));
push(H2('G.4 Pets'));
push(P('Rabies-free countries with strict import routes and approved arrival airports, for example the United Kingdom, Ireland, Australia, New Zealand, Japan, Singapore and the US state of Hawaii: check the official authority\'s rules before quoting any pet travel.'));
push(H2('G.5 Strict permit regimes for foreign operators'));
push(P('Examples where lead times and rules for foreign operators are known to be demanding: China, India and Russian airspace. Ask the operator for the lead time before quoting.'));
push(H2('G.6 Taxes'));
push(BL(['United States: federal excise tax on air transportation; generally collected by the person who receives payment, and a broker acting as principal can be required to collect it.','European Union: VAT rules differ by country and by type of trip.','United Kingdom: Air Passenger Duty, with a higher rate for aircraft of 20 tonnes or more equipped for fewer than 19 passengers.','Singapore: GST, as advised by our accountant.']));
push(H2('G.7 Countries we cannot take payments from or pay to'));
push(P('We do not take payments from or make payments to these jurisdictions (sanctions and payment-provider rules, checked October 2026; the list can change): Belarus; Crimea, Donetsk, Kherson, Luhansk and Zaporizhzhia regions of Ukraine; Cuba; Iran; Kazakhstan; Libya; Myanmar; North Korea; Russia; South Sudan; Sudan; Syria; Venezuela. Payment providers also refuse some activities, including cryptocurrency services and weapons and military items. Because every Arche payment runs through our payment account, a payer or operator in one of these places is a red answer on the trip risk screen: stop and tell the director. Several are not under a broad sanctions embargo; the reason we stop is that we cannot take or make the payment.'));
push(H2('G.8 Sources the director checks'));
push(LK('EASA Conflict Zone Information Bulletins','https://www.easa.europa.eu/en/domains/air-operations/czibs'),
 LK('FAA prohibitions, restrictions and notices','https://www.faa.gov/air_traffic/publications/us_restrictions'),
 LK('EU Air Safety List','https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en'),
 LK('UN Security Council consolidated list','https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list'),
 LK('US OFAC sanctions list search','https://sanctionssearch.ofac.treas.gov/'),
 LK('EU sanctions map','https://www.sanctionsmap.eu/'),
 LK('UK Sanctions List search','https://search-uk-sanctions-list.service.gov.uk'),
 LK('Singapore: MAS targeted financial sanctions','https://www.mas.gov.sg/regulation/anti-money-laundering/targeted-financial-sanctions'),
 LK('IRS audit guide: air transportation excise tax','https://irs.gov/pub/irs-mssp/air_transportation.pdf'));

// ================= APPENDIX H PORTAL GUIDE (generated from portal/guide.json)
push(H1('Appendix H  Portal guide',true));
push(P("How every part of the Archē broker portal works, what to do when something goes wrong, and how to get the most out of it. Guide version 1.0, 18 October 2026. The same guide is in the portal under Help."));
push(H2('H.0 How a trip moves through the portal'));
push(typeof FLOWPNG!=='undefined'?new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:120},children:[new ImageRun({type:'png',data:FLOWPNG,transformation:{width:640,height:240}})]}):null);
push(P("Read the diagram left to right. The AI researches organisations every day and the rotation assigns them to brokers. The broker turns a lead into an enquiry, adds requests and extras and the operator quote, completes the checks and sends the trip to operations. Operations checks it on Avinode, completes KYC and the payment request and issues the confirmation. The client signs and pays through the payment request, the trip flies, operations records payments and the flight, and commission follows. Dashed arrows loop back: a lead with no contact in time returns to the rotation, and a trip with a problem returns to the broker."));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.1 Joining, roles and access"));
push(P([bo('Who uses it: '),r("Everyone")]));
push(P("Only approved people can use the portal, and each person sees only what their role needs."));
push(H3('How it works'));
push(NL(["Open the portal link while signed in to claude.ai.", "First time: fill in Join with your full legal name as on your contract, your role, the country you work from and your academy completion code, and tick the portal agreement.", "Wait for approval. The director approves every broker before the first enquiry.", "Your role decides what you see: brokers and consultants see their own trips, leads and commission; operations sees every trip and the operations queue; the owner sees everything."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["The portal says it could not open", "Open it from claude.ai while signed in, using the link you were given. A copied link opened in another browser profile will not sign you in."], ["I am stuck on Request sent", "The director has not approved you yet. Ask the director; approval needs your contract and academy code."], ["I see Access ended", "Your access was ended. Contact Archē operations if you think this is a mistake."], ["I cannot see a trip or lead a colleague mentions", "Brokers see only their own trips and leads. Ask operations."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Use the same claude.ai account every time: your trips and leads are tied to it.", "Bookmark the portal link on your phone; every page works on a small screen."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.2 Dashboard"));
push(P([bo('Who uses it: '),r("Brokers, consultants and operations")]));
push(P("Your opening page: progress this month, your place in the team and every outstanding task, most urgent first."));
push(H3('How it works'));
push(NL(["Read the progress tiles: standard bookings against the monthly target, commission earned this month, quote-to-confirmation rate, rank and prospects added against the minimum.", "Work the Outstanding list from the top. Red dots are urgent: an overdue lead or a trip returned by operations.", "Tap a task to open the lead or trip it refers to.", "Compare yourself with the team by points, confirmed trips, enquiries, prospects added or follow-up score."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["My rank shows a dash", "The leaderboard updates at each assignment round, every 3 hours. It appears after the first round of the month."], ["Commission shows USD 0 although I have flown trips", "Commission counts only trips that have flown and whose client payment has cleared. Ask operations to record the payment."], ["A task stays on the list after I did it", "Tasks clear when the portal sees the change: log the contact, update the trip or send it to operations."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Start every day on the dashboard and clear the red items first.", "Overdue leads move to another broker at the next round: a two-minute logged contact keeps the lead yours.", "Use the team comparison to see where you lose points; follow-up score is usually the quickest win."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.3 Today (owner)"));
push(P([bo('Who uses it: '),r("Owner")]));
push(P("Everything that needs the owner, on one page, from any device."));
push(H3('How it works'));
push(NL(["Read Your decisions: trips waiting for operations, late payments and other red flags, prospects that went cold with three brokers, and join requests.", "Restart a cold prospect's rotation, mark it Do not contact, or open it to assign it yourself.", "Check Prospect rotation: last round, what moved and the figures per broker. Use Preview to see the next round, Run now to run it.", "Check Running in the background: prospect research and Google Drive backup.", "Use the analytics: gross profit from trips flown over six months, this month's funnel and confirmed trips by broker."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["A background job shows not run yet or an old date", "Scheduled jobs stop when the claude.ai usage limit is reached. Check Settings > Usage in claude.ai; the job runs again at its next time."], ["Run now does nothing", "Another round may be running. Wait a minute and reload."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Open Today once a day: it also triggers the automatic Drive copy of new documents and, when due, the database.", "A prospect that went cold three times is often a wrong-fit organisation: consider Do not contact rather than another rotation."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.4 New enquiry and airport search"));
push(P([bo('Who uses it: '),r("Brokers, consultants with booking rights, operations with booking rights")]));
push(P("Capture the trip once, correctly, with the right airports."));
push(H3('How it works'));
push(NL(["Choose New enquiry, or Open an enquiry from a lead.", "Enter the client: name, company, email, phone, country of residence and the payer if different.", "For each leg type a city, airport name or code (for example London) and pick the airport from the list. The portal stores the ICAO code and shows the airport name.", "Add date, local time and passengers per leg, the aircraft category and any notes.", "Save. The trip appears under My trips as Enquiry."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Save says choose the airport from the list", "The text typed is not a known airport. Type a city or code and pick one of the suggestions."], ["The airport I need is not offered", "The list holds 7,009 airports suitable for jets. Type the four-letter ICAO code; if it is still missing, ask operations, as the runway may be too short for jets."], ["Times look wrong", "Times are local at the departure airport. Confirm the time zone with the client in writing."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Type the city, not the airport: the list shows every suitable airport nearby, including business-aviation fields such as Biggin Hill or Le Bourget.", "Write special requests in the notes: the portal turns many of them into suggested requests and extras.", "Open enquiries from leads with Open an enquiry, so the trip is linked to the prospect and counts on the leaderboard."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.5 Client requests and operational extras"));
push(P([bo('Who uses it: '),r("Brokers until the trip goes to operations; operations until the confirmation is issued")]));
push(P("List every request and every operational need, with how it is charged, so the confirmation is complete and nothing is invoiced by surprise."));
push(H3('How it works'));
push(NL(["Open the trip. Under Client requests and Operational extras charged to the client, read the suggestions.", "Tap a suggestion to add it, or Add request / Add extra for your own.", "For each line choose the category, describe it, and choose how it is charged: included in the charter price, at cost after the flight, or fixed price.", "For a fixed price enter the supplier's written price. The client pays that price divided by 0.91, rounded up; the portal shows it.", "Use AI: suggest more for anything the rules or route may need."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["I cannot edit the lines", "The trip is with operations or confirmed. Ask operations to change it."], ["The confirmation says a fixed price is missing", "A line set to fixed price has no supplier price. Enter it, or change the line to at cost."], ["A suggestion does not apply", "Ignore it; suggestions are prompts to ask the operator, never facts."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Ask about catering, cars, pets, children, luggage and allergies on the first call: changes later cost time and money.", "Winter, night departures, waiting days and international arrivals almost always bring operational extras: confirm them before quoting.", "Use fixed price only with a written supplier quote; anything that depends on the day is at cost."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.6 Operator quote and price"));
push(P([bo('Who uses it: '),r("Brokers")]));
push(P("Record the operator's all-in quote so the portal sets the client price at 9%."));
push(H3('How it works'));
push(NL(["From Avinode, enter the operator's legal name as on its AOC, aircraft type, registration and Avinode trip ID.", "Enter the operator all-in price and any direct trip costs not in it (supplier items Archē buys).", "Read the price preview: client price = (operator price + direct costs) ÷ 0.91, rounded up.", "Save. The trip moves to Quoted."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["The price looks too high or low", "Check you entered the all-in operator price, including positioning, and no extras twice."], ["Operations changed my operator price", "Operations confirms the price on Avinode; the confirmed figure is used and the difference is flagged."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Never round down and never quote below 9% without the director's approval.", "Re-confirm availability and price with the operator before the offer expires."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.7 Documents"));
push(P([bo('Who uses it: '),r("Brokers until the trip goes to operations")]));
push(P("Keep every document for the trip in one place, never in email."));
push(H3('How it works'));
push(NL(["Open the trip, choose the document type and the file, and select Attach.", "Attach the operator quote, AOC, insurance certificate, safety audit evidence and the client's KYC documents.", "Open any document from the trip file."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Attach does nothing", "Choose a file first. Large files take a few seconds."], ["I cannot attach after sending to operations", "Documents are locked with the trip. Send them to operations through the portal; they attach them."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Never send passports or contracts by email or chat apps.", "Name scanned files clearly before uploading."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.8 Pre-issue checks and sending to operations"));
push(P([bo('Who uses it: '),r("Brokers")]));
push(P("Hand operations a complete, compliant trip."));
push(H3('How it works'));
push(NL(["Tick the seven broker checks only when each is done and recorded: never-sell list, trip risk screen, AOC, insurance, safety audit, routing and permits, operator terms.", "Fill in Operator safety on the trip: the audit the operator holds, the aircraft type, two pilots, the insurance amount and the five-year history. For an accepted audit, add its expiry date, the date you checked it in the auditor's registry and the link, and attach the evidence as \"Safety audit\". For an Arche-approved operator, choose it from the approved-operator list: the portal checks the approval is valid on the last flight date. For any other operator, the director approves the trip after the checks in 8.3. Your quote and the confirmation show the operator's safety status in one line. The safety-audit tick follows this record.", "Send to operations. The button opens only when the trip is complete: the panel Steps to book this trip lists what is still missing and takes you to each field."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Send to operations is greyed out", "One of the required items is missing; the note under the button lists them."], ["The trip came back as Returned", "Read the operations note at the top of the trip, fix it and send again."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Run the AI check before sending; it catches cabotage, permits and missing information.", "A trip returned twice costs the client's confidence: complete it the first time."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.9 Operations queue"));
push(P([bo('Who uses it: '),r("Operations, owner, brokers with booking rights")]));
push(P("Check, confirm and record every trip that brokers send."));
push(H3('How it works'));
push(NL(["Open Operations; take the oldest trip in Waiting for operations.", "Confirm the operator price on Avinode and enter direct trip costs.", "Complete KYC and sanctions screening and tick the record.", "Create the payment request in our payment provider and enter its reference.", "Save, then Prepare and issue confirmation, or Return to broker with a note."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["I see a note instead of the operations panel", "It is your own trip. Another operations member or the director handles it."], ["The broker's operator price differs from Avinode", "Use the Avinode figure; the difference is flagged in Control."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Work the queue oldest first; check it at least twice a day.", "Never take payment details by email; every client pays through the payment request."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.10 Charter confirmation"));
push(P([bo('Who uses it: '),r("Brokers prepare; operations and the owner issue")]));
push(P("Produce the signed contract: booking details, requests and extras, Part A and Part B."));
push(H3('How it works'));
push(NL(["Open Charter confirmation from the trip. Fill in charterer address, KYC reference, lead passenger, aircraft year and seats, operator AOC and authority, signatory.", "Read the live checks on the right: fix every red item and every missing field.", "Use AI check for a second look.", "Operations issues it: the portal assigns the reference, saves the PDF to the trip and locks it.", "A change after issue: Prepare revision, then Issue revision n."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Issue is greyed out", "A required field or check is missing; the list shows which."], ["Company details are missing", "The owner must fill in Settings > Company details once."], ["The PDF did not save", "Download it from the confirmation screen and attach it to the trip."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Fill the confirmation while the broker still has the details fresh; drafts save automatically.", "The deposit is 25% of the charter price (at least USD 2,500); fixed extras are paid with the balance 7 days before departure."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.11 Payments, flight and commission"));
push(P([bo('Who uses it: '),r("Operations records; everyone sees their own commission")]));
push(P("Record money and flights so commission is right and on time."));
push(H3('How it works'));
push(NL(["Operations records the date the client payment cleared in the payment account.", "Operations records the operator payment.", "After the last leg, operations records the flight date.", "Commission appears in the month the trip flew, paid by the 15th of the next month; the owner marks it paid."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["My trip flew but no commission", "The client payment has not been recorded, or the flight date has not. Ask operations."], ["Commission seems low", "Commission is a share of gross profit, including the margin on fixed-price extras; at-cost items carry no margin."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Chase unpaid confirmations after 5 days: the Control page flags them.", "Record flights the day they happen, so the dashboard stays true."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.12 My leads and adding prospects"));
push(P([bo('Who uses it: '),r("Brokers and consultants")]));
push(P("Work the organisations assigned to you and add the ones you know."));
push(H3('How it works'));
push(NL(["Open My leads. Leads are sorted by when contact is due.", "Open a lead, read why them and how to approach, use a contact route, then log the contact with channel, outcome and a note.", "Add a prospect: organisation, segment, country, public source link, contact route and why they charter.", "Add or correct a contact route on any lead to keep the database current.", "Open an enquiry from a lead when the organisation has a trip."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["My new prospect says Being checked", "It is checked for duplicates at the next round, within 3 hours."], ["It says Already known", "Another broker added it first; it stays with them. Keep adding new ones."], ["A lead disappeared", "It went cold and moved to another broker, or it was marked Do not contact."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Contact new leads the same day: the 48-hour clock starts at assignment.", "Every organisation you add earns points and a bigger share of new leads; ten a month is the minimum, not the target.", "Anyone who opts out is Do not contact at once, for everyone."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.13 Prospects database"));
push(P([bo('Who uses it: '),r("Owner and operations")]));
push(P("The global list of organisations, with sources, contact routes and status."));
push(H3('How it works'));
push(NL(["Filter by region, country, province, segment, type and status, or search.", "Open a prospect to see why, how to approach, contact routes, source, assignment history and the contact log.", "Assign it to a broker, or mark Do not contact.", "Add a prospect with its public source."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["A prospect has no contact routes", "The daily AI review adds them over time; brokers can add them too."], ["Status shows Your decision", "It went cold with three brokers. Restart the rotation or mark Do not contact."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Use the region tiles to see where coverage is thin, then add prospects there.", "Never store private individuals' details; organisations and roles only."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.14 Prospect rotation"));
push(P([bo('Who uses it: '),r("Runs automatically; owner and operations can run it")]));
push(P("Give every broker a fair, steady flow of leads and never let a prospect go cold."));
push(H3('How it works'));
push(NL(["Every 3 hours, and when the owner or operations opens the portal, the round imports prospects brokers added, catches duplicates, merges contact updates and assigns free prospects.", "Each broker is scored on country and region fit, follow-up record, conversions and fair share; brokers who add prospects get a bigger share.", "No first contact within 48 hours, or no follow-up for 14 days, and the lead moves to the next broker with its history. After three brokers it goes to the owner.", "Not now leads come back after 90 days to a different broker."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["A broker gets no new leads", "They may be at the open-lead limit, have leads going cold, or be below the monthly minimum late in the month."], ["Rules need changing", "The owner changes them in Settings > Prospect assignment and incentives."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Use Preview on Today before changing the rules, to see their effect.", "Keep the number of open leads per broker realistic: fewer, worked leads beat many cold ones."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.15 Points and leaderboard"));
push(P([bo('Who uses it: '),r("Brokers and consultants")]));
push(P("Make good habits visible and reward them."));
push(H3('How it works'));
push(NL(["Points this month: 3 per organisation added, 1 per lead contacted per day, 1 per contact route added or corrected (up to 20), 10 per enquiry from a lead, 25 per trip flown, minus 3 when a lead goes cold.", "See your rank on the dashboard and in My leads."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Points did not change after I logged a contact", "Points update at each round, every 3 hours."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Flown trips are worth the most; but daily contacts and added prospects keep you ahead early in the month."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.16 AI assistant and co-pilot"));
push(P([bo('Who uses it: '),r("Everyone")]));
push(P("A second pair of eyes on every trip, and answers to questions about the rules."));
push(H3('How it works'));
push(NL(["On a trip, use the co-pilot: check the trip, draft an email or suggest the next step.", "On a lead, use Suggest approach for a first message with an opt-out line.", "In Assistant, ask any question about the rules, a trip or an operator.", "The owner and operations can write the daily briefing in Control."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["The co-pilot asks for permission", "Allow Claude when asked, or in the artifact's Permissions menu."], ["Too many requests", "Wait a minute and try again."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["The AI never sees client names or contact details; describe the trip, not the person.", "Treat AI output as a draft: you are responsible for what you send."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.17 Control"));
push(P([bo('Who uses it: '),r("Owner and operations")]));
push(P("See signs that business is leaving the portal or that money is late."));
push(H3('How it works'));
push(NL(["Read the flags: unpaid confirmations, old quotes and enquiries, price differences, the same client with two brokers, low quote-to-booking rates.", "Open the trip behind a flag and act.", "Write today's AI briefing for the outlook, risks and coaching."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["A flag will not clear", "Fix the cause: record the payment, update or withdraw the trip."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["A broker with many quotes and few confirmations may be booking outside the portal: talk to them early."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.18 Team and booking rights"));
push(P([bo('Who uses it: '),r("Owner")]));
push(P("Approve people, end access and give booking rights."));
push(H3('How it works'));
push(NL(["Approve or decline requests to join.", "Give a broker booking rights with Can book, and Editor access in the claude.ai Share menu.", "End access when someone leaves, and remove them from the Share menu the same day."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["A broker with booking rights still sees only their own trips", "They also need Editor access in the Share menu."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Editors can read the whole portal, including other brokers' trips and commission: give booking rights only to trusted people."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.19 Settings"));
push(P([bo('Who uses it: '),r("Owner")]));
push(P("Commercial terms, company details, assignment rules and backup."));
push(H3('How it works'));
push(NL(["Terms: margin, standard booking value, commission rates.", "Company details: printed on every confirmation; needed before the first issue.", "Prospect assignment and incentives: contact times, limits, minimum adds, extra lead share, leaderboard visibility.", "Backup: download a full copy, or back up to Google Drive now."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Brokers do not see a rule change", "Rules apply from the next round; ask brokers to reload the portal."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Change commercial terms only at the start of a month, so commission stays easy to check."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.20 Security and access log"));
push(P([bo('Who uses it: '),r("Owner")]));
push(P("Keep the portal ringfenced."));
push(H3('How it works'));
push(NL(["Review who opened the portal and when.", "Keep the Share menu to named people: brokers Contributor, operations Editor; never a public link."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Someone unknown appears in the access log", "End their access and remove them from the Share menu at once."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Every screen carries a watermark with the viewer's name: screenshots are traceable."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.21 Backups"));
push(P([bo('Who uses it: '),r("Owner")]));
push(P("An independent copy of everything in the portal."));
push(H3('How it works'));
push(NL(["Every day at 02:17 Bangkok time the database is copied to Google Drive, checked file by file.", "When the owner opens the portal, new documents and issued PDFs are copied to Google Drive byte for byte.", "Settings > Backup: download a full copy at any time."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["Google Drive asks for permission", "Allow the portal to use Google Drive once."], ["Backup shows an old date", "The scheduled job may have hit the usage limit; use Back up to Google Drive now."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Download a full copy before any big change to settings or the team."]));
push(new Paragraph({children:[new PageBreak()]}));
push(H2("H.22 Help and FAQ"));
push(P([bo('Who uses it: '),r("Everyone")]));
push(P("Answers in seconds, and a FAQ that grows from real questions."));
push(H3('How it works'));
push(NL(["Open Help. Search the FAQ and the feature guides.", "Ask a question: the AI answers at once from the manual and this guide, and your question is saved.", "Questions asked often are added to the FAQ automatically, without names or client details. The owner can edit or remove any FAQ entry."]));
push(H3('Troubleshooting'));
push(T([['If you see',3300],['Do this',6340]],[["The AI answer seems wrong", "Mark it Not helpful; the owner sees it and corrects the answer."]]));
push(sp());
push(H3('Tips and tricks'));
push(BL(["Search before asking: most answers are already there.", "Never put client names or passport details in a question."]));

// ================= APPENDIX I PORTAL FAQ
push(H1('Appendix I  Portal FAQ',true));
push(P("The first 15 questions below were written before launch. From then on the FAQ grows from real questions: everyone can ask in the portal under Help, the AI answers at once, and questions asked often are added to the FAQ without names or client details. The owner reviews every entry. The live FAQ in the portal is always the current one."));
push(H3("1. How is the client price calculated?"));
push(P("Operator all-in price plus direct trip costs, divided by 0.91 and rounded up. Archē's margin is 9% of the price the client pays. A lower margin needs the director's approval."));
push(H3("2. When does the client pay?"));
push(P("25% of the charter price on signature, at least USD 2,500; the balance, including fixed-price extras, 7 calendar days before the first departure. If departure is less than 7 days away, the full price on signature. Items at cost are invoiced after the flight and paid within 10 calendar days."));
push(H3("3. What is the difference between a fixed-price extra and an extra at cost?"));
push(P("Fixed price: a supplier quoted it in writing before booking; the client pays the supplier price ÷ 0.91, rounded up, with the balance. At cost: the amount depends on the day (de-icing, extra parking, out-of-hours fees); it is invoiced after the flight with the receipt, without margin."));
push(H3("4. Why did my lead move to another broker?"));
push(P("No first contact was logged within 48 hours of assignment, or no follow-up within 14 days. The lead moves with its full history. Log every contact in the portal to keep your leads."));
push(H3("5. How many prospects must I add?"));
push(P("At least 10 organisations a month, each with the public source where you found it. Adding more earns points and a bigger share of new leads."));
push(H3("6. Do I get a fee for prospects I add?"));
push(P("No. Commission rewards the booking. Adding prospects earns points, a place on the leaderboard and a bigger share of new leads, and you work your own finds first."));
push(H3("7. Who issues the charter confirmation?"));
push(P("Operations or the owner, after the operator price, KYC, sanctions screening and the payment request are done. Nobody issues, prices or records payment on their own booking."));
push(H3("8. The airport I want is not in the list. What do I do?"));
push(P("Type the four-letter ICAO code. The list holds airports suitable for jets; if it is still missing, ask operations, because the runway may be too short."));
push(H3("9. Can a client pay by bank transfer to us directly?"));
push(P("No. Clients pay only through the payment request. Never send or accept bank details by email, chat or messaging apps."));
push(H3("10. Can I quote a domestic flight on a foreign aircraft?"));
push(P("No. Domestic legs on foreign-registered aircraft are cabotage and are refused in most countries. Use a local operator for the domestic leg or redesign the trip."));
push(H3("11. What does de-icing cost?"));
push(P("It depends on the day, the aircraft and the airport. Never give a figure: list it as an operational extra at cost, and pass on the operator's written estimate only as its estimate if the client asks."));
push(H3("12. Can a passenger bring a dog?"));
push(P("Only with the destination's entry rules met and the operator's written acceptance. Some countries accept pets only on approved routes and airports. Ask before quoting."));
push(H3("13. The client wants to change the trip after confirmation. What happens?"));
push(P("Operations gets the operator's new price in writing and issues a numbered revision. Changes to routing or passengers need new permits and may be refused; any difference is paid before the flight."));
push(H3("14. When is commission paid?"));
push(P("For trips that have flown and whose client payment has cleared, in the month of the flight, by the 15th of the next month."));
push(H3("15. Who sees my leads and trips?"));
push(P("You, operations and the director. Other brokers cannot see them. Client details stay in the portal; copying them is blocked."));

push(H1('Appendix J  Regional quick-reference cards',true));
push(P(`One card per region, for live enquiries: green means proceed, amber means the operator or its trip support confirms in writing before we quote, red means stop and tell the director. The cards summarise Module 2, the trip risk screen (Module 2.9) and the watchlist (Appendix G); they never replace them, and the trip risk screen is still recorded for every enquiry.`));
push(T([['Item',2600],['Detail',7040]],[
 [`Cards version`,`1.0, October 2026`],
 [`Last verified`,`October 2026, by the director, against the official sources in Appendix G.8 and D.4`],
 [`How the cards stay current`,`The portal's intelligence run checks the official sources and proposes changes; the AI never changes a card. The director checks each proposal against the official source and approves it; only then does the card change, with the new date. In the portal, every card shows its sources and the date it was last verified.`],
]));
push(sp());
push(H2(`J.1 Europe: EU, EEA, Switzerland and the United Kingdom`));
push(T([['Colour',1300],['Triggers',8340]],[
 [`Green`,`Whole aircraft from an EU/EEA/UK operator with a checked AOC; international or same-carrier-country flights; clean screening`],
 [`Amber`,`Non-EU operator into or within Europe (needs an EASA third-country operator authorisation and each state's permits, confirmed in writing); any leg that may be domestic, including territories (G.1); package with hotel or event (ATOL in the UK); de-icing season`],
 [`Red`,`Leg inside the EU on a non-EU operator without written permission; Russian national (including dual) or company controlled by one with any EU point, or a Russian-registered aircraft; operator on the EU Air Safety List; seats sold individually; payer or operator in a G.7 country`],
],{size:16}));
push(note(`Source sections: Modules 2.4, 2.5, 2.9; Appendix G.1, G.2, G.7.`));
push(H2(`J.2 Middle East and Africa`));
push(T([['Colour',1300],['Triggers',8340]],[
 [`Green`,`Experienced operator with permits handled through its trip support; whole aircraft; clean screening`],
 [`Amber`,`Landing and overflight permits, sponsor rules and lead times vary by state: operator confirms in writing; routes near FAA or EASA conflict-zone notices (G.3); PEP clients; third-party payers`],
 [`Red`,`Embargoed destination or sanctions match; payer or operator in a G.7 country (for example Libya, South Sudan, Sudan, Syria); lead time impossible to meet`],
],{size:16}));
push(note(`Source sections: Modules 2.5, 2.9, 3.2; Appendix G.2, G.3, G.7.`));
push(H2(`J.3 Asia-Pacific: Singapore, Thailand and the region`));
push(T([['Colour',1300],['Triggers',8340]],[
 [`Green`,`International flight on an operator with the needed permits; Singapore slot and Air Transport Permit planned (Changi slot at least 72 hours ahead); clean screening`],
 [`Amber`,`Thailand: CAAT permits, slots and parking approval at the main Bangkok airports and Phuket, full passenger and crew details; China, India and Russian airspace (strict permit regimes, G.5); Hong Kong and Macau regime with mainland China (G.1); pets into Singapore, Japan, Australia or New Zealand (G.4)`],
 [`Red`,`Domestic leg on a foreign-registered aircraft (cabotage is closely enforced in Thailand); North Korea; payer or operator in a G.7 country (for example Myanmar, Kazakhstan); lead time impossible to meet`],
],{size:16}));
push(note(`Source sections: Modules 2.5, 2.6, 2.9; Appendix G.1, G.4, G.5, G.7.`));
push(H2(`J.4 Americas: United States, Canada and Latin America`));
push(T([['Colour',1300],['Triggers',8340]],[
 [`Green`,`International flight on a US or foreign operator holding the needed authority; whole aircraft; clean screening; US broker disclosures made (14 CFR Part 295)`],
 [`Amber`,`Foreign operator to or from the US (needs US authority); US federal excise tax when acting as principal (G.6); Canada and Latin America domestic legs reserved for local carriers; FAA security notices (for example Haiti, Central America, Colombia, Ecuador, Mexico, Panama)`],
 [`Red`,`Any US domestic leg (both airports in the US, including Alaska, Hawaii and territories): never on a non-US operator, and on any operator only after US counsel confirms Arche's position; Cuba with a US-made aircraft; Venezuela (no payments possible)`],
],{size:16}));
push(note(`Source sections: Modules 2.4, 2.5, 2.9; Appendix G.1, G.3, G.6, G.7.`));
