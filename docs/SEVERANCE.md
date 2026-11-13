# Severance: keeping the two businesses separable (Morten, 9 Nov 2026, rule)

"Important is that we have the option to sever the ties between each if needed ie. sale, exit or closing the business
without harming any data or flow, so prepare for this also and write it in as a rule."

This file is kept identical in arche-platform and navoryx-website. A change is made in both in the same piece of work.

## The rule
1. Nothing is shared live. Every shared item is a copy held in each repository; each website, portal and job builds,
   checks and runs from its own repository, accounts and database alone.
2. Each business owns its own data. Data held by one side for the other (the Navoryx investor-relations records in
   the portal) is kept so that it can be exported whole and handed over.
3. Every tie is listed below with its switch or its removal step. A new tie is added here in the same piece of work,
   or it is not made.
4. Severing is a switch and a short list of steps, never a rebuild; afterwards both sides pass all their own checks.

## The ties today
| Tie | What it is | Switch or step |
|---|---|---|
| Places | `docs/PLACES.json` (copy in each repository); both checks compare against it | `SHARED_SITE = False` in `apps/website/company.py` (Archē) and `config.py` (Navoryx): the places check stops; each keeps its last copy as its own list |
| Place facts | `docs/SHARED-FACTS.json`: checked public facts with official sources, exported by `scripts/export_shared_facts.py` (Archē) and copied into navoryx-website | Stop the export; the Navoryx copy stays and is Navoryx's own from then on (the sources are official, not Archē's) |
| Investor relations | The Navoryx investor page files access requests into the portal (`/api/ir`, `api/_nx/ir.mjs`, `docs/IR-PORTAL-CONTRACT.md`); the investor list and access records are in the portal database (Director only) | 1. Export the investor-relations records (investor list, access requests with screening results, code and opening log) to an encrypted file for the Navoryx Director. 2. Navoryx: clear `PORTAL_IR_URL` and `PORTAL_IR_KEY` in Vercel; the site then gives codes only to `IR_ALLOWLIST` addresses (built in). 3. Archē: remove `NAVORYX_IR_KEY` in Vercel; after the handover is confirmed, delete the investor records (keeping what the law requires). |
| Scheduled tasks | The daily Navoryx city task also updates `docs/PLACES.json` in arche-platform | Remove step 3b's arche-platform part from that task's prompt |
| Accounts | One GitHub owner and one Vercel account hold both (the Vercel daily deployment limit is shared) | Transfer the repository and the Vercel projects to the new owner's accounts; domains, mailboxes and keys are already separate per business |

## Never shared
Client, broker, operator, supplier and prospect records; bookings and payments; keys and passwords; backups. Archē is
never named on the Navoryx website or in its emails, and the Navoryx website does not link to Archē.

Not a tie: each site's journey map is built on its own, from its own data and public sources (Natural Earth
coastlines, published aircraft figures, public airport positions); no code or data is read from the other site (13 Nov 2026).

## After severing
Run every check and test on both sides (`check_site.py`, `check_all_revised.py` and the portal tests for Archē;
`check.py` and `npm test` for Navoryx), update this file in the remaining repository to say the tie is gone, and record
the date and the decision in each handover.
