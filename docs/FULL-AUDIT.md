# Full audit (Morten, 8 Nov 2026, locked)

"When i next time ask for a full audit, i expect you to do just that, a full audit and pick up on every non conformity
or mistake of any kind." Do every step. The report lists every finding, what was fixed, and anything not checked.

## 1. Rules against every place they reach
For each rule in `CLAUDE.md` (money, bookings, roles, the Director, the broker owns the trip, KYC/KYB, prospects and
data, writing, website, sanctions, design, releases), find every place that states or applies it and check that it
says the same thing, in facts and figures, not only words:
- Word manual (`apps/manual/manual38.js` = `body38.js`), Appendix H/I (`portal-guide.json`)
- both academies (internal and external; the external has nothing Archē-internal)
- portal: every screen, label, toast, Help, FAQ, test-version labels, API and email texts (`apps/portal/api`)
- broker agreement (`agreement-source.html`), commission offer (portal and Word), charter confirmation, website terms
- website content and built pages (`apps/website`), excluded places
- business plan, budget (text cells; numbers only on Morten's instruction), Director package
- scheduled tasks (their prompts) and jobs (`jobs/`, `.github/workflows`)
- `docs/ARCHE-HANDOVER.md` and its project copy
Search for every old wording and every contradicting figure (`git grep`), including code comments shown to users.

## 2. Facts and numbers
Margin 9% (÷ 0.91), deposit 25% / USD 2,500, balance 7 days, response times (15 minutes, 1 hour, 48 hours for research
leads, 24-hour follow-up), commission terms, insurance minimums, KYC refresh 12 months, contact deletion 12 months:
the same in every place. Worked examples recomputed. Dates and version numbers current and consistent.

## 3. Things that must not appear
Paynode; bank details; a Bangkok office, address or Thai phone number; sanctioned places on the website; Navoryx links
outside the Director-only investor area; operations desk or charter consultants; "owner" as a role; targets or bonus
for brokers; prices on the website; device voices in the academy; real client or broker data in the repository.

## 4. Behaviour
Run `python3 scripts/check_all_revised.py`, every portal test (README list and `checks.yml`), every `jobs` test, both
academy editions with `full.js`, `check_site.py` and the website tests, contrast and the 390 px layout audit. Look at
the main screens at 390 px and desktop in Day and Night.

## 5. Second reviewer
A separate reviewer (a new agent that has not seen the first pass) repeats steps 1 to 3 on its own and its findings
are added. Disagreements are checked against the source.

## 6. Report
Every finding with where it was, what it said, what it should say, the rule or source, and whether it is fixed.
What could not be checked, and why. Nothing is called audited until this list is complete.
