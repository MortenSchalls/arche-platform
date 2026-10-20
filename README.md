# Archē Executive platform

One project for everything Archē Executive runs online. Archē is said ar-KAY.

| Part | Folder | Address after the move | Status today |
|---|---|---|---|
| Public website | `apps/website` | archeaviation.com | Built from the Claude Design v7 file into `apps/website/site`; forms feed the portal |
| Broker portal | `apps/portal` | portal.archeaviation.com | Runs on Supabase + Vercel (arche-platform-sandy.vercel.app); claude.ai copy kept as fallback |
| Academies | `apps/academy` | academy.archeaviation.com | Internal and external editions, built from the manual |
| Charter confirmation | `apps/charter-confirmation` | inside the portal | Offline form v6; the portal has its own built-in version |
| Master Training Manual | `apps/manual` | (Word/PDF, not online) | v3.8; the Word file is the master, the academies are built from it |

Company: Arche Executive Pte. Ltd. (Singapore). Brand spelling: Archē. Domain and Microsoft 365 email: GoDaddy.

## Where it will run

- **GitHub**: this code, with its full history.
- **Vercel**: shows the website, portal and academy at the three addresses.
- **Supabase**: database, file storage and sign-in for the portal and academy.
- **Microsoft 365**: staff sign in with their @archeaviation.com account.
- **Anthropic API**: the AI features (assistant, roleplay lab, trip checks).
- **GoDaddy**: only the domain and email. Three DNS records point the addresses to Vercel (see `docs/DNS-GODADDY.md`).

## Read next

1. `CLAUDE.md`: the business rules every change must keep.
2. `docs/MIGRATION.md`: the plan for moving the portal and academy off claude.ai.
3. `docs/DNS-GODADDY.md`: the GoDaddy steps for go-live.

## Building what exists today

- Academies: `cd apps/academy/build && python3 build.py`, then copy `arche-broker-academy.html` and `charter-broker-academy.html` to `apps/academy/dist`. Checks: `node full.js` and `node acad_theme.js` (need Playwright).
- Manual: `cd apps/manual && node manual38.js` (needs the `docx` package), then convert to PDF with LibreOffice.
- Portal tests: serve `apps/portal` on port 8765 and run the scripts in `apps/portal/tests` (they use `mock2.js` and example data in `seed4.json`, never real data).

## Test version of the portal
`apps/portal/test.html` is the portal with an in-browser stand-in database and example data only: no sign-in, switch between Test Owner, Test Operations and Test Broker in the orange bar, data kept in that browser only, Reset wipes it. AI features do not work there (no real sign-in), so it costs nothing. Rebuild it after every change to `index.html`: `cd apps/portal && python3 build_test.py`.
