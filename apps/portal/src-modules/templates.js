/* ---------- Email templates (Morten, 25 Nov 2026, peer proposal P5: "All") ----------
   Ready-written emails at the moments brokers write most: the first message to a named business contact on a lead, the
   options for a client, and a friendly chase when a client has not answered. Each opens in the broker's own mailbox
   (Archē email) with everything filled in; the broker reads it, changes what they like and presses Send themselves.
   Nothing is sent by the portal (CLAUDE.md: any outbound message needs a person). The first message always says where
   we found the details and offers an opt-out (data rules). */
(function(){
  const meName = () => (S.roster[S.uid] || {}).contractName || S.myName || "";
  const sign = () => ["Kind regards,", meName(), "Archē Executive", (S.myRoster || {}).archeMail || (((S.roster[S.uid] || {}).onboarding) || {}).email || ""].filter(Boolean).join("\n");
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  const mail = (to, subject, body) => `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  function firstMessage(rec, c){
    const where = c.sourceType === "Licensed professional database" ? "a licensed professional database" : c.sourceType === "Business card or meeting" ? "the card you gave me" : host(c.source) ? `${host(c.source)}, ${rec.org || "your organisation"}'s own website` : "your organisation's website";
    const body = [`Dear ${c.name || "Sir or Madam"},`, "",
      `I am ${meName() || "a broker"} at Archē Executive, a private jet charter broker based in Singapore. We act for our clients as their agent: we source the right aircraft from audited operators worldwide, check every flight and look after the trip to the last landing.`, "",
      `I am writing to you as ${c.role || "the person responsible for travel"} at ${rec.org || "your organisation"}. Two quick questions, if I may:`,
      "1. When your team flies privately, which routes come up most often?", "2. Who arranges those flights today, and what would make it easier?", "",
      "If it helps, I can send a sample quote for a trip you have coming up, with no obligation.", "",
      `We found your details on ${where}. If you would rather not hear from us, reply "no thanks" and we will delete your details at once and not contact you again.`, "",
      sign()].join("\n");
    return mail(c.email, `Private jet charter for ${rec.org || "your team"}`, body);
  }
  function optionsMail(t){
    const c = (t.d || {}).client || {}, txt = typeof optionsText === "function" ? optionsText(t) : "";
    return mail(c.email, `Your aircraft options${((t.d.trip || {}).legs || [])[0] ? ", " + t.d.trip.legs[0].from + " to " + t.d.trip.legs[0].to : ""}`,
      [`Dear ${c.name || "Sir or Madam"},`, "", "Thank you for your request. Here are the aircraft held for your journey:", "", txt, "", "Every operator is checked by us before we offer it: its certificate, safety audit, insurance and crew.", "", sign()].join("\n"));
  }
  function chaseMail(t){
    const c = (t.d || {}).client || {}, l = ((t.d.trip || {}).legs || [])[0] || {};
    return mail(c.email, `Your journey${l.from ? " " + l.from + " to " + l.to : ""}`,
      [`Dear ${c.name || "Sir or Madam"},`, "", `I wanted to check you received the options for ${l.from ? l.from + " to " + l.to : "your journey"}${l.date ? " on " + fmtD(l.date) : ""}. Aircraft are held only for a short time, so let me know which you prefer, or if anything should change, and I will take care of it.`, "", sign()].join("\n"));
  }
  window.tplFirstMessage = firstMessage;
  /* the first message beside each named contact on a lead, before "Contacted today" */
  const _ct = contactsHtml;
  contactsHtml = function(rec, where, id){
    const h = _ct(rec, where, id); if (where !== "lead") return h;
    return h.replace(/<button class="btn small" type="button" data-ct="touch" data-where="lead" data-id="([^"]*)" data-i="(\d+)">Contacted today<\/button>/g, (m, rid, i) => {
      const c = (rec.contacts || [])[+i] || {}; return c.email ? `<a class="btn small" href="${esc(firstMessage(rec, c))}" title="Opens in your email with the first message written: where we found the details and the opt-out included. Read it, then press Send yourself.">Write first message</a>` + m : m; });
  };
  /* on the trip: the options and a chase, while the broker is quoting */
  const _tf = tripFile;
  tripFile = function(t){
    const h = _tf(t), c = (t.d || {}).client || {}, mine = t.bid === S.uid && acting() !== "owner" || (S.role === "owner" && t.bid === S.uid && !S.preview);
    if (!mine || !c.email || !["enquiry","quoted"].includes(t.stage) || !num((t.d.quote || {}).opPrice)) return h;
    const b = `<div class="row" id="tplRow" style="margin-top:8px"><a class="btn small" href="${esc(optionsMail(t))}">Email the options to the client</a><a class="btn small" href="${esc(chaseMail(t))}">Write a friendly chase</a><span class="small muted">Opens in your email, written; you press Send.</span></div>`;
    const k = h.indexOf(`<div><h3>Price at `); return k < 0 ? h + b : h.slice(0, k) + b + h.slice(k);
  };
})();
