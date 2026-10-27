# Scheduled jobs

Run by GitHub Actions (`.github/workflows/jobs.yml`). Times in Bangkok.

| Job | When | What |
|---|---|---|
| `rotation.mjs` | every 3 hours (:11) | The portal's prospect engine: assigns leads to brokers, moves cold leads, updates the leaderboard. Skips if a round ran in the last 2 hours; uses the same lock as the portal. |
| `intel.mjs` | 05:58 daily | Researches up to 15 new organisations for the day's focus region with web search and adds contact routes to up to 8 existing prospects. Rules enforced in code: organisations only, every source must have appeared in that run's search results, no personal emails or personal LinkedIn profiles, never changes status, assignment or history. |
| `regimes.mjs` | Mondays 08:23 | Reads which sanctions programmes the official UN, US (OFAC), EU and UK lists contain. The first run stores them; any programme added or removed later, or a list that cannot be read twice in a row, asks the owner to review the website's excluded places, manual G.2 and KYC (Team → Sanctions watch). Changes nothing by itself. |
| `backup.mjs` | 02:17 daily | All tables to one file, encrypted with BACKUP_PASSPHRASE, kept 90 days as a GitHub Actions artifact. |

Run one now: GitHub → Actions → Portal jobs → Run workflow → choose the job.

Restore a backup: download the artifact, then
`openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in backup.json.enc -out backup.json -pass pass:<passphrase>`.

Tests (offline, example data): `cd jobs && npm install && node test.mjs && node regimes.test.mjs`.
