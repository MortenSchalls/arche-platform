# Navoryx investor relations ↔ portal: the shared contract

The same file lives in both repositories:
- `MortenSchalls/navoryx-website` → `docs/IR-PORTAL-CONTRACT.md`
- `MortenSchalls/arche-platform` → `docs/IR-PORTAL-CONTRACT.md`

Rule (Morten, 5 Nov 2026): both sides stay aligned so that nothing on one side breaks the other, and a session working on either repository can find and fix a problem. **Any change to this contract is made in both repositories in the same piece of work, with both test suites run.** If only one repository is open, change nothing in the contract; write down what is needed and do it once both are available.

## Who does what

| Side | Repository | Role |
|---|---|---|
| Navoryx website | navoryx-website, `api/ir.mjs` | Front door. Public IR page, access requests, sanctions screening at request time, one-time codes, private briefing. Never names the portal or Archē. |
| Portal | arche-platform, `apps/portal/api/_nx/ir.mjs` (reached at `/api/ir`, a rewrite to `api/invite.mjs?nx=ir`), screen `src-modules/irelations.js` | Engine and database. Stores requests and decisions on the owner-only investor list (`owner_prospects.data.ir`); only the owner gives or withdraws access; invitations and approval emails are sent only when the owner presses Send. |

## Calls from the website to the portal

`POST https://portal.archeaviation.com/api/ir`, header `x-ir-key: <PORTAL_IR_KEY>`, JSON body:

| action | body | answer | when |
|---|---|---|---|
| `apply` | `name, organisation, country, role, email, message, screening {result, lists[], hits[{name, listed, list}]}` | `{ok, id}` (record id, e.g. `i042`) | an access request on the IR page, after screening |
| `access` | `email` | `{approved: true/false}` (address or its `@domain` approved, not withdrawn) | before every code, every code check and every briefing page |
| `event` | `email, kind: "code" or "opened"` | `{ok}` | a code sent; the briefing opened |

- Wrong or missing key: 401 and nothing is read.
- The website waits at most 6 seconds. No answer or an error means **not approved**: only IR_ALLOWLIST addresses get codes (fails closed). Requests are still emailed to IR_NOTIFY.
- `role` is one of the website's ROLES (`A private investor`, `A family office`, `An institution or fund`, `A lender`, `An adviser to an investor`, `Other`); the portal maps it to an investor-list track.

## Owner calls inside the portal (signed in as owner)

`draft` (returns the email wording), `send` (sends one email, then gives access), `approve` (access without email), `revoke` (withdraw access). The text sent is the owner's edited text; a `[placeholder]` left in it is refused.

## Data on each investor record (`data.ir`)

`stage` (prospect, invited, requested, approved, opened, conversation, nda, documents, committed, notnow) · `interest` (undecided, income, time, both) + `interestAt` · `access { "<email>" or "@domain": {approved, revoked, at, requestedAt, invitedAt, codes[], opens[]} }` · `requests[]` · `log[]`.

An opt-out, or 12 months without contact (`jobs/lib/contacts.mjs`), deletes the person's contact, access and requests.

## Settings (entered by Morten in Vercel, never in a repository or chat)

| Portal project | Navoryx project |
|---|---|
| `NAVORYX_IR_KEY` (shared key) | `PORTAL_IR_KEY` (the same value) |
| `NAVORYX_IR_FROM`, `NAVORYX_RESEND_KEY`, `NAVORYX_IR_REPLY`, `NAVORYX_SITE` | `PORTAL_IR_URL`, `IR_SECRET`, `RESEND_API_KEY`, `IR_FROM`, `IR_NOTIFY`, `IR_ALLOWLIST` (optional) |

## Tests that guard the contract

- Website: `npm test` (`tests/ir.test.mjs`, "portal engine" test: apply filed, approval opens a code, events logged, withdrawal ends access, portal down fails closed).
- Portal: `node apps/portal/tests/irnx.test.mjs` (server) and `node apps/portal/tests/irtest.js` (screens). Both run in the portal's GitHub "Portal checks".

## Wording rules shared by both

No figures, returns or note names on any public page or in any email before the NDA. Archē is never named on the Navoryx website or in its emails. Invitation emails say where we have the person's details and how to be removed. British English.
