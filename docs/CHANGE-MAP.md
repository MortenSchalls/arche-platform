# Change map: all or none

Morten, 8 Nov 2026: "Each change we do, also change all related documents and manuals. We cannot have a situation where
only half is revised, all or none, and all means audited."

A change is finished only when every place below that it touches says the same thing, the rebuilt files are committed
with it, and the audit has passed. If one place cannot be changed yet (for example it needs Morten's decision), nothing
is changed: ask first.

## What depends on what (the master is first; change it first)

| Kind of change | Master | Also change, in this order | Built and checked by |
|---|---|---|---|
| A business rule (money, bookings, roles, data, writing) | `CLAUDE.md` (Morten's words, dated) | Word manual (`apps/manual/manual38.js` and the same text in `body38.js`) → both academies (rebuilt from the manual) → portal behaviour, wording and Help → agreements and client documents that state it (broker agreement, charter confirmation, website terms) → handover | `scripts/check_all_revised.py`, all Portal checks |
| A portal screen or step | Manual Appendix H and I: `apps/manual/portal-guide.json` | The portal code (`index.html` and the matching `src-modules/*.js`) → the portal's Help and FAQ (`apps/portal/guide.json`, written by `node apps/manual/manual38.js`) → the academy's Systems training (rebuilt) → its recordings (narration workflow) → the Help flow diagram (`flow.js`, same function in `index.html`) and the manual's `flow_portal.png` if the flow changes → tests | `scripts/check_all_revised.py`, portal tests |
| Academy text or a check question | The Word manual | Rebuild both academies (`extract.js`, `build.py`, copy to `dist/`, `make_academy.py`) → the joining plan and reminder emails if a step, title or length changes (`OB_ACAD` in `onboard.js` and `index.html`, `ACADEMY_*` in `api/invite.mjs`) → the recording list (`audio/screens.js`) | `full.js` on both editions, `acadplantest`, `acadaudiotest`, the narration workflow |
| The broker agreement | `apps/portal/agreement/agreement-source.html` | Raise `VERSION` in `make_agreement.py` (signed copies keep their own version) → `python3 make_agreement.py` → the same block in `index.html` → tests that name the version | `scripts/check_all_revised.py`, `handovertest` |
| The charter confirmation (client contract) | `apps/charter-confirmation/charter-confirmation-v6.html` | The portal's confirmation, the manual where it quotes the terms, the website terms of business (`apps/website/make_terms.py`) | Portal tests, `check_site.py` |
| Website content | `apps/website/content/` (facts with source and date) | Built pages; the excluded-places list is shared with the quote form and the portal | `check_site.py`, `site.test.mjs` |
| Places on the two public websites | `docs/PLACES.json` (Morten, 9 Nov 2026: a place added on one website is added on the other) | Archē city or country page (`apps/website/content/pages`) and the Navoryx city page, the same file in navoryx-website in the same piece of work | `check_site.py` and the Navoryx `check.py` |
| Shared place facts | `apps/website/content/` (facts, airport files, sources) | `docs/SHARED-FACTS.json` (`python3 scripts/export_shared_facts.py`), copied into navoryx-website | `check_site.py` fails when the export is older than the facts |
| Ties between Archē and Navoryx (severance) | `docs/SEVERANCE.md` (Morten, 9 Nov 2026), identical in both repositories | CLAUDE.md in both, the `SHARED_SITE` switches, the scheduled tasks that touch both | `check_site.py` and the Navoryx `check.py`, with the switch on and off |
| Navoryx investor relations | `docs/IR-PORTAL-CONTRACT.md` | The same file in navoryx-website, in the same piece of work, both test suites run | `irtest`, `irnx.test.mjs` and the website's own tests |
| Books (the owners' accounts) | `docs/BOOKS.md` and the Books rule in `CLAUDE.md` | The database (`supabase/migrations/0023_books.sql`) → the server (`apps/portal/api/_books/`) → the screen (`src-modules/books.js` and `index.html`) → Appendix H.43 (`portal-guide.json`, then `manual38.js`) → the backup job (`jobs/backup.mjs`, `jobs.yml`) | `books.test.mjs`, `test_books_sql.sh`, `bookstest`, `jobs/test.mjs` |
| Anything at all | — | `docs/ARCHE-HANDOVER.md` and the claude.ai project copy `arche/arche-handover.md` | — |

Notices to members are the one exception: a notice is a dated message, so old notices stay as they were sent; a new
notice needs Morten's wording first.

## "Audited" means

1. `python3 scripts/check_all_revised.py`: the manual body is the same in both files, the portal Help is Appendix H and
   I, every portal module is the same in `src-modules/` and `index.html`, and every generated file matches its master.
2. The tests for every part touched (see README), and for the academy the full run of both editions (`full.js`).
3. A search for the old wording across the whole repository (`git grep`), so nothing is left behind.
4. The Portal checks on GitHub pass before anything is released.

The report to Morten lists what was changed in each place and what was run.

A full audit, when Morten asks for one, is wider: `docs/FULL-AUDIT.md` (locked rule, 8 Nov 2026).
