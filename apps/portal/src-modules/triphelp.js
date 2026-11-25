/* ---------- A ? with one plain sentence on every booking field and on our own words (Morten, 25 Nov 2026: "Some
   wording is still ours, not the user's ("A9 scale", "four-eyes", "positioning legs") and needs a ? help line everywhere,
   as in Books") ----------
   Every field of the enquiry, the quote, the intake checklist, the trip file and the charter confirmation gets a ? that
   opens one sentence in plain words, as in Books. Terms from our terms of business and the trade (A3, A7, A9, B13, AOC,
   KYC, cabotage, positioning, Request to Book ...) get the same ? where they first appear in a block. Nothing else on the
   page changes. */
const FIELD_HELP = {
  e_cn: "The person you deal with. For a company, the person who asked for the flight.",
  e_co: "The company or family office that charters, if any. It is checked against the sanctions lists.",
  e_em: "The client's email, for the quote and the confirmation.",
  e_ph: "The client's phone, with the country code.",
  e_ct: "Where the client lives. Needed for the sanctions check and the KYC.",
  e_py: "Fill in only when someone else pays (a company, a relative). A different payer needs its own checks.",
  e_cat: "The size of aircraft the client wants or the trip needs, for the Avinode search.",
  e_nt: "Anything the client asked for: catering, cars, pets, special luggage. For you and the trip; it does not go to operators.",
  e_iops: "What the operators need to know to quote, without names or health details. It goes into the Avinode request.",
  e_ilead: "The person who travels and leads the group. Printed on the confirmation and screened.",
  e_ibook: "An assistant or office that books for the client: name and how to reach them.",
  e_iflex: "How far the dates or times may move. Operators can often quote lower with some room.",
  e_ikids: "How many children and infants travel. Infants may need their own seat on some aircraft.",
  e_inat: "The countries of the passports, for entry rules and permits. Countries only, never a passport number.",
  e_ibags: "Golf bags, skis, bikes, oversize cases: they decide the aircraft size.",
  e_ipets: "Kind, size and whether it travels in the cabin. Many countries need papers before arrival.",
  e_ipurp: "Some permits ask why the flight is made (leisure, business, government).",
  e_ibudg: "Only if the client gave one. It helps choose the aircraft; never shown to operators.",
  e_ipay: "Card or bank transfer. Card adds the card fee to the price, and ticks it on the quote.",
  e_isrc: "How the enquiry reached you. It counts in your figures and the reports.",
  q_op: "The operator's legal name exactly as on its Air Operator Certificate (AOC), not its trading name.",
  q_oc: "The country that issued the operator's AOC. Used for the cabotage check (domestic flights by foreign operators).",
  q_ac: "The aircraft type in the operator's quote, e.g. Global 7500.",
  q_tl: "The aircraft's registration, e.g. 9H-ABC. Used for tracking and the safety and insurance checks.",
  q_aoc: "The number on the operator's Air Operator Certificate. Printed on the confirmation.",
  q_yom: "The year the aircraft was built, from the quote. Printed on the confirmation.",
  q_seats: "Passenger seats in this aircraft, from the quote. Checked against the passengers.",
  q_av: "The trip number in Avinode, so the quote can be found again.",
  q_cur: "The currency the operator quoted in. Converting adds 0.4% to the costs.",
  q_amt: "The operator's price in its own currency.",
  q_rate: "US dollars for one unit of that currency. The portal suggests the European Central Bank rate of the day.",
  q_pr: "What the operator charges, all in, in US dollars. The client price is worked out from it.",
  q_dc: "Costs Archē pays outside the operator's price (e.g. a supplier's catering). Charged like the price.",
  q_card: "Ticked when the client pays by card. The card fee (3.6%) goes into the price, never on top.",
  ck_payref: "The reference of the payment request made in our payment provider. Never a bank or card number.",
  kyc_at: "The day you checked who the client is (and, for a company, its owners).",
  kyc_how: "How you checked: e.g. passport seen on a video call, company register extract.",
  c24_op: "The operator's operations desk, reachable day and night during the trip.",
  c24_h: "The ground handler at the departure airport, reachable on the day.",
  rb_rtb: "When you sent Request to Book on Avinode: the step that asks the operator to hold the aircraft for you.",
  rb_hold: "Until when the operator keeps the aircraft for this client. The offer to the client must end before it.",
  docKind: "What the file is. The portal uses the type to tick checks (AOC, insurance, safety audit).",
  docFile: "Choose the file. It is stored with this trip and checked before the portal says Saved.",
  cf_address: "The charterer's address as on the company register or ID, printed on the confirmation.",
  cf_cName: "The person who signs the confirmation for the charterer.",
  cf_lead: "The lead passenger's name as on the passport.",
  cf_aoc: "From the quote. Change it there.",
  cf_yom: "From the quote. Change it there.",
  cf_seats: "From the quote. Change it there.",
  cf_audit: "From Operator safety. Change it there.",
  cf_kyc: "From the KYC record on the trip. Change it there.",
  cf_state: "The country of the operator's AOC, from the quote.",
  bk_rtb: "When Request to Book was sent on Avinode (asks the operator to hold the aircraft).",
  bk_hold: "Until when the operator holds the aircraft for this client.",
  o_op: "The operator's price as shown on Avinode. Change it only if it differs from the broker's quote.",
  o_dir: "Direct trip costs Archē pays outside the operator's price.",
  o_pn: "The payment request reference, from the broker's record.",
  o_cpd: "The day the client's money arrived in our account, not the day it was sent.",
  o_opd: "The day the operator was paid from the client money.",
  o_fl: "The day the last leg landed. Filled from the broker's Route flown when recorded."
};
const GLOSS = [
  [/\bA3\b/, "A3: the clause in our terms with this booking's payment dates."],
  [/\bA7\b/, "A7: the clause in our terms on costs beyond the price, such as extra catering, charged like the price."],
  [/\bA9\b/, "A9: the clause in our terms with the client's cancellation charges. The client pays the higher of ours and the operator's own plus our fee."],
  [/\bB13\b/, "B13: costs after the first departure from something nobody could foresee then (such as a diversion), charged at cost."],
  [/\bAOC\b/, "AOC: Air Operator Certificate, the licence that lets an operator fly paying passengers."],
  [/\bKYB\b/, "KYB: knowing who a company is: its register entry, owners of 25% or more and who controls it."],
  [/\bKYC\b/, "KYC: knowing who the client is, checked once and refreshed every 12 months or when something changes."],
  [/\bcabotage\b/i, "Cabotage: a flight inside one country by a foreign operator, which most countries do not allow."],
  [/\bpositioning\b/i, "Positioning: a flight without passengers, to bring the aircraft to the client or back to its base."],
  [/\bRequest to Book\b/, "Request to Book: the step on Avinode that asks the operator to hold the aircraft for this client."],
  [/\bfour[- ]eyes\b/i, "A second person checks: nobody prices, approves, issues or records money on their own trip."],
  [/\bon block\b|\boff block\b/i, "Off block: the aircraft moves off its parking place. On block: it parks at the destination."],
  [/\bArchē fee\b/, "Archē fee: a fixed 9% of what the client pays. Client price = (operator price + direct costs) ÷ 0.91."]
];
(function(){
  let busy = false;
  function addHelp(){
    const main = $("main"); if (!main || busy) return; busy = true;
    try {
      main.querySelectorAll("label.f[for], label.check[for]").forEach(l => {
        const id = l.getAttribute("for"), tip = FIELD_HELP[id]; if (!tip || l.dataset.fh) return; l.dataset.fh = "1";
        const b = document.createElement("button"); b.type = "button"; b.className = "bkq fh"; b.setAttribute("aria-label", "What is this?"); b.dataset.fhq = id; b.textContent = "?";
        const t = document.createElement("span"); t.className = "bkqt small"; t.hidden = true; t.id = "fh_" + id; t.textContent = tip;
        const first = l.querySelector("input,select,textarea"); if (first) { l.insertBefore(b, first); l.insertBefore(t, first); } else { l.appendChild(b); l.appendChild(t); }
      });
      // our own words: a ? after the first one in each block of text
      const blocks = [...main.querySelectorAll("#secTC p, #secTC li, #secSafety p, #secOpTerms p, #secBook p, #secAuth p, #secNext li, .ns-items li, #secChecks label.check > span, #secRtb p, #secAvinode p, .note, #confForm p, #routePanel p, #secAfter p")].filter(el => !el.closest(".bkqt, .fh") && !el.querySelector(".fh"));   // never on the help it added itself (review 25 Nov 2026: the page grew without end)
      let n = 0;
      blocks.forEach(el => {
        if (el.dataset.gl || n > 40) return; el.dataset.gl = "1";
        const txt = el.textContent || "", hit = GLOSS.find(([re]) => re.test(txt)); if (!hit) return;
        n++; const b = document.createElement("button"); b.type = "button"; b.className = "bkq fh"; b.setAttribute("aria-label", "What does this mean?"); b.textContent = "?";
        const t = document.createElement("span"); t.className = "bkqt small"; t.hidden = true; t.textContent = hit[1];
        el.appendChild(b); el.appendChild(t);
      });
    } finally { busy = false; }
  }
  let q = 0; const mo = new MutationObserver(() => kick());
  const kick = () => { if (q) return; q = requestAnimationFrame(() => { q = 0; mo.disconnect(); try { addHelp(); } finally { mo.takeRecords(); mo.observe(document.documentElement, {childList: true, subtree: true}); } }); };
  mo.observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("button.fh"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation(); const t = b.nextElementSibling; if (t && t.classList.contains("bkqt")) t.hidden = !t.hidden;
  }, true);
})();
