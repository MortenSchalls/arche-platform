// External edition only: Module 15, Building a charter brokerage. Replaces the Arche-specific material.
module.exports = (L) => ({
 id: "m15", n: "15", t: "Building a charter brokerage",
 mod: {
  intro: "For brokers who run, or plan to run, their own brokerage: what it takes to set up, stay legal, handle money safely, find clients and grow. The rules in Modules 2 and 3 apply to every brokerage, whatever its size.",
  obj: ["Judge the economics of broking realistically", "Set up a brokerage on a sound legal and financial footing", "Choose the tools and insurance a brokerage needs", "Find and keep clients within the advertising and data rules", "Work with partners and grow with measurable standards"],
  take: ["Income depends on volume, margin and repeat clients; nobody can guarantee it.", "Take local legal and tax advice before you trade, and have your terms drafted by aviation counsel.", "Keep client money apart from your own, and carry professional liability insurance.", "Pick a niche you understand and earn repeat business; advertise honestly.", "Put every partner relationship in writing and measure what matters."],
  secs: [
   {h:"15.1 Is broking for you?", b:[
    {p:"Brokers earn a margin or a commission on each charter. Income depends on how many trips you sell, your margin and how many clients come back. Some months bring several trips and some none."},
    {list:["Be wary of courses and schemes that promise a fixed income or quick riches: no one can guarantee bookings.","Expect to build a client base over time, mostly through service, reputation and referrals.","Working for an established brokerage first is the fastest way to learn the trade with support."]}]},
   {h:"15.2 Setting up the company", b:[
    {list:["Register a company, open a business bank account and register for the taxes that apply where you trade.","Check the licensing rules in every country where you sell. In the United States, brokers must follow 14 CFR Part 295, and some states also have seller-of-travel laws.","Selling flights with hotels or other travel as one package can need a travel licence, such as ATOL in the United Kingdom, and brings EU package-travel rules into play.","Have your client terms and conditions and your charter confirmation drafted or reviewed by aviation counsel. Your terms to clients must be back to back with the operators' terms to you (Module 10).","Decide which broker model you use: agent of the client, agent of the operator, or principal (Module 1.6)."]},
    {links:[L.p295, L.nbaaBP, L.atol]}]},
   {h:"15.3 Insurance", b:[
    {list:["Professional liability (errors and omissions) insurance protects you if a mistake of yours causes a client loss, such as wrong airport or document advice. NBAA recommends it for every broker.","In the United States you must tell clients whether you hold liability insurance (Part 295).","Ask operators to name the client, and your company, as additional insured where possible (Module 8.5).","An insurance broker who knows aviation can set the right cover for the flights you sell."]},
    {links:[L.nbaaBP]}]},
   {h:"15.4 Handling money safely", b:[
    {list:["Keep client money separate from your own: a dedicated client account, or a secure charter payment platform such as Avinode's Paynode, so that operator money never mixes with your operating funds.","Never send bank details by email or chat; use payment requests and verify any change of bank details by phone (Module 3.5).","Set up know-your-client and sanctions screening before your first booking (Module 3).","Understand card payments: card costs, and that a client can dispute a payment long after the flight.","Hold currency accounts if you buy and sell in different currencies, and state the quote currency."]},
    {links:[L.avPay, L.payNo]}]},
   {h:"15.5 Tools of the trade", b:[
    {table:{cols:["Tool","What it does"],rows:[
     ["Avinode membership","Search aircraft, request and compare quotes, book and pay operators"],
     ["CRM","Every client, enquiry, quote and booking in one place, with the pipeline (Module 12.5)"],
     ["Templates","Intake form, request for quote, quote email, charter confirmation, trip brief (Appendix B)"],
     ["Secure document storage","Passports, KYC files and contracts, with access control"],
     ["Phone and messaging with 24/7 cover","Clients and operators can reach you at any hour"],
     ["Flight tracking","Follow flights on the day and update clients first"]]}},
    {links:[L.avBroker, L.avStart]}]},
   {h:"15.6 Finding clients", b:[
    {list:["Choose a niche you understand: for example sports teams, event organisers, corporate travel managers, family offices, or a region you know well.","Build referral partners who meet wealthy travellers: concierge services, yacht and real-estate brokers, travel agencies, event organisers. Put referral terms in writing.","Your website and social media must follow the advertising rules: never claim a fleet, show full prices where required, and use testimonials only with consent (Module 2.11).","Respect do-not-call registers and every opt-out, and handle personal data under data-protection law (Module 3.7).","Repeat clients are the core of a brokerage: remember preferences, follow up after every trip, ask for feedback."]}]},
   {h:"15.7 Working with partners", b:[
    {list:["Sub-brokers and agents who bring you trips need a written agreement: who contracts with the client, commission, confidentiality and who carries out KYC.","Disclose to clients any relationship that could affect your advice, such as a commission from an operator.","Treat operators as long-term partners: complete trip details, fair negotiation and prompt payment win you better availability.","Never let a partner sell a flight in your name before an operator has confirmed it in writing."]}]},
   {h:"15.8 Growing the business", b:[
    {list:["Measure response time, quote-to-booking conversion, repeat clients, margin per booking and bookings without errors (Module 12.5).","Run the business on checklists, a written error log and regular reviews, so quality survives growth.","Train every new broker to this standard before they work alone, and repeat the exam each year.","Join the industry: associations such as the Air Charter Association, NBAA, EBAA or AsBAA offer guidance, events and networks."]},
    {links:[L.acaTr]}]}
  ],
  quiz: [
   {q:"A course promises a guaranteed monthly income from charter broking. How do you treat it?", o:["As a fact","As marketing: income depends on volume, margin and repeat clients","As a legal promise","As an industry standard"], a:1, why:"No one can guarantee bookings. Income depends on how many trips you sell, your margin and how many clients return."},
   {q:"Where should client money for a charter be held?", o:["In the broker's operating account","Separate from your own money, in a client account or a secure payment platform","In cash","With the client's assistant"], a:1, why:"Keeping client money apart protects clients and operators and is the basis of safe payments."},
   {q:"What does professional liability (errors and omissions) insurance cover?", o:["The aircraft hull","Losses caused by the broker's own mistakes","Crew salaries","Fuel price rises"], a:1, why:"It protects the brokerage when its own error, such as wrong document advice, causes a client loss."},
   {q:"You want to sell flights with hotels as one package to UK consumers. What do you check first?", o:["Nothing","Whether a travel licence such as ATOL and package-travel rules apply","Only the hotel price","The operator's paint scheme"], a:1, why:"Selling packages can require a travel licence and brings package-travel rules into play."},
   {q:"A new partner will send you trips for a commission. What comes first?", o:["Start at once","A written agreement covering who contracts, commission, confidentiality and KYC","A handshake","Pay them in advance"], a:1, why:"Every partner relationship belongs in writing, including who contracts with the client and who runs KYC."}
  ]
 }
});
