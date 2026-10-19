# Rules for working on this project

Read this before changing anything. These are business rules set by the owner, Morten. Do not change them without his written instruction.

## Money and pricing
- All figures in USD.
- Client price = (operator price + direct trip costs) ÷ 0.93, rounded up. Archē's margin is 7% of the price the client pays. A lower margin needs the director's approval. A 7%/9% split (high-usage vs bespoke clients) is under discussion; do not build it until Morten defines it.
- Deposit 25% of the charter price (at least USD 2,500) on signature; balance 7 days before the first departure; full payment if departure is under 7 days away. Fixed-price extras are added to the balance; items at cost are invoiced after the flight with receipts, without margin.
- Clients pay only through a Paynode payment request. Never print, store or send bank details anywhere.

## Bookings
- The owner approves every booking before a confirmation is issued (switch in Today; on by default). A price change after approval sends it back.
- Four-eyes rule: nobody prices, issues or records payment on their own trip (the owner is exempt).
- Brokers can set only enquiry, quoted, submitted or cancelled. Money stages come from operations.
- Every flight is followed to the last landing, the broker follows up within 24 hours, and the client gets a rating request. A score of 3 or less starts service recovery.
- Client ratings may be quoted publicly only with the client's written consent. Never write, buy or reward reviews.

## Prospects and data
- Organisations and roles only. No personal data about private individuals, no guessed emails or phone numbers, no bought lists, no LinkedIn log-in or scraping, no scraping of competitor or marketplace boards, no copying Avinode data out of Avinode. Every outreach has an opt-out.
- Real client and broker data never goes into this repository. Tests use example data only.
- Any outbound message or action that cannot be undone needs a person to confirm it. Do not connect an e-signature service unless Morten asks.

## Writing
- Plain, short English. Say "Archē Executive" in branded text; the legal name is Arche Executive Pte. Ltd.
- The Word manual is the master. Change the manual first, then rebuild the academies from it.
- The external academy must contain nothing Archē-internal; `apps/academy/build/ext.js` fails the build if it does.

## Design
- Day and Night themes; all text at least 4.5:1 contrast (portal `tests/colorscan.js`).
- Fonts: Prata or Cinzel for headings, Hanken Grotesk for text. Logo in `shared/brand`.
- Check every screen at 390 px phone width with no sideways scrolling (`tests/audit.js`).

## Before you finish a change
Run the tests for the part you changed (see README) and say what you ran.
