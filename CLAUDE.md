# Rules for working on this project

Read this before changing anything. These are business rules set by the owner, Morten. Do not change them without his written instruction.

## Money and pricing
- All figures in USD.
- Client price = (operator price + direct trip costs) ÷ 0.91, rounded up. Archē's margin is 9% of the price the client pays, as a rule (Morten, 25 Oct 2026; was 7%). 9% is the minimum; a different margin on a trip, higher or lower, only in special circumstances and only by Morten's decision, with the reason recorded (Morten, 29 Oct 2026).
- Deposit 25% of the charter price (at least USD 2,500) on signature; balance 7 days before the first departure; full payment if departure is under 7 days away. Fixed-price extras are added to the balance; items at cost are invoiced after the flight with receipts, without margin. If the operator wants money earlier, or its cancellation charges rise earlier, the client pays earlier: each confirmation prints its own payment schedule (A3) (Morten, 29 Oct 2026).
- Archē never pre-funds: the operator is paid only from cleared client money, never more than has been received, and never more than the operator price; Archē keeps its margin. The operator's contract is signed only once the client has signed and paid what the operator wants at that point. At every moment the client money held covers what Archē would owe the operator if the trip were cancelled then (Morten, 29 Oct 2026).
- Cancellation: the client always pays the higher of Archē's scale (A9) and the operator's own charge plus Archē's fee; each confirmation prints the charges for that booking (Morten, 29 Oct 2026).
- Insurance: Archē carries no liability insurance for its first months; all aircraft, passenger and third-party insurance is the operator's. Every trip needs the operator's certificate, at least USD 50M (jet) or 25M (turboprop), valid on every flight date, the aircraft on it, the route inside its cover, confirmed with the insurer or its broker (Morten, 29 Oct 2026).
- Operator library: each operator's terms, insurance and trip figures (no client personal data, no bulk copy of Avinode data) are saved for Archē's own know-how and offered to prefill the next trip (Morten, 29 Oct 2026).
- Clients pay only through a secure payment request from Archē's payment provider (provider still to be agreed). Paynode is removed everywhere and is not named in any text, page, course or document until Morten agrees otherwise (Morten, 26 Oct 2026). Never print, store or send bank details anywhere.

## Bookings
- Simplicity first (Morten, 29 Oct 2026): "We need simplicity and fast flexible bookings, we cannot lose to complex portals." Every step is asked once, by the person who has the information; no double tasks or overlapping procedures; the portal fills in and checks what it can.
- The owner approves every booking before a confirmation is issued (switch in Today; on by default). A price change after approval sends it back.
- Four-eyes rule: nobody prices, issues or records payment on their own trip (the owner is exempt).
- Brokers can set only enquiry, quoted, submitted or cancelled. Money stages come from operations.
- Every flight is followed to the last landing, the broker follows up within 24 hours, and the client gets a rating request. A score of 3 or less starts service recovery.
- Client ratings may be quoted publicly only with the client's written consent. Never write, buy or reward reviews.

## Prospects and data
- Organisations first. Named people may be stored in any prospect list only as business contacts: a professional acting in a business role at an organisation, with name, role and work email or phone, only as published by the organisation itself or taken from a licensed professional database (approved by Morten, 20 Oct 2026). Never private individuals as such: no home addresses, personal phones or personal emails, no wealth or family details. No guessed emails or phone numbers, no bought consumer or wealth lists, no LinkedIn log-in or scraping, no scraping of competitor or marketplace boards, no copying Avinode data out of Avinode.
- Every first message to a named contact says where we found their details and offers an opt-out. An opt-out deletes the person's details at once in every list (only a one-way code is kept so they are never added again). Contacts not reached within 12 months are deleted. Brokers see contacts only on their own leads; opening contacts is logged; no export of contact details. Contacts in the investor list stay owner-only.
- Real client and broker data never goes into this repository. Tests use example data only.
- Any outbound message or action that cannot be undone needs a person to confirm it. Do not connect an e-signature service unless Morten asks.

## Writing
- Plain, short English. Say "Archē Executive" in branded text; the legal name is Arche Executive Pte. Ltd.
- Archē is a Singapore company and stays Singaporean until the Bangkok office opens: no Bangkok office, Bangkok address or Thai phone number on the website, in signatures, offers, agreements or client documents (Morten, 26 Oct 2026). Thai routes and airports are fine. The website switch is `BANGKOK_OFFICE` in `apps/website/build.py`.
- The Word manual is the master. Change the manual first, then rebuild the academies from it.
- The external academy must contain nothing Archē-internal; `apps/academy/build/ext.js` fails the build if it does.
- Notices to members (`apps/portal/src-modules/notices.js`): ask Morten first whether a change needs a notice at all, and agree the wording, before adding one. A notice in the code is only a draft; nothing reaches members until Morten publishes it in Team (Morten, 26 Oct 2026).

## Website content (Morten, 27 Oct 2026)
- We are a broker, not an airline: pages are about places, airports and needs, never "routes we fly". Every page ends with "any aircraft, any route, upon availability".
- Only verified, correct facts, each with its source and the date it was checked. No guesses. Better fewer pages and correct than many and wrong. The build refuses a fact without a source or date.
- No prices until Archē has its own quote data; then only ranges with the basis and date.
- Sanctions (Morten, 27 Oct 2026): sanctioned countries, territories, companies and people are avoided in KYC (manual Module 3.2, including ownership and control) and are never listed, named, offered or promoted on the website; this includes Russia, Iran, Iraq, Syria and Venezuela. The list of places is `apps/website/content/excluded.json`; the content build, `check_site.py` and the quote form's airport list all use it. Sanctions are covered only in general words in the terms of business (charter confirmation Part B, clause B6), which name the regimes (UN, Singapore, US, EU, UK) but list no countries. The website names no companies or people other than authorities, airport operators and the sources it cites.
- Keep the site's layout, design and watermarks on every new page; speed and structure come first (static pages, no extra scripts).
- A saved copy of the site before this work: branch `saved/website-2026-10-27` (and the zip in Final versions).

## Design
- Day and Night themes; all text at least 4.5:1 contrast (portal `tests/colorscan.js`).
- Fonts: Prata or Cinzel for headings, Hanken Grotesk for text. Logo in `shared/brand`.
- Check every screen at 390 px phone width with no sideways scrolling (`tests/audit.js`).

## Releases (Morten, 28 Oct 2026)
- Changes go to the `staging` branch first (Vercel builds a preview there) and must pass the "Portal checks" on GitHub. The live portal (main) changes only when Morten says "release".
- Work order for the training findings of 28 Oct 2026: 2 (prospects for new brokers), 1 (owner, broker and operations views the same), 3 (help for every field), 4 (operator agreement from Avinode linked to ours), 6 (full booking walkthrough in the academy, manual first), 5 (automated emails from Leads). Phone layout added the same day.

## Before you finish a change
Run the tests for the part you changed (see README) and say what you ran.
Update `docs/ARCHE-HANDOVER.md` (the file a new chat starts from) and the copy in the claude.ai project at `arche/arche-handover.md` at the end of each working session.
