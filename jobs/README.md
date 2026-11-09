# Scheduled jobs

Run by GitHub Actions (`.github/workflows/jobs.yml`). Times in Bangkok.

| Job | When | What |
|---|---|---|
| `rotation.mjs` | every 3 hours (:11) | The portal's prospect engine: assigns leads to brokers, moves cold leads, updates the leaderboard. Skips if a round ran in the last 2 hours; uses the same lock as the portal. |
| `prospectagent.mjs` | on request of the Claude scheduled task "Daily Archē prospect research" (06:23 Bangkok) | No AI. `plan` (job agent-plan, input key): whether a run is due (Prospects > Research agent), the focus, known names, prospects without contact routes, the next supplier airports and, once a week, the investor focus; sealed with the task's key. `import` (job agent-import, input batch): adds only what passes every check: source page opens and names the organisation, organisations only, not known, no excluded or sanctioned place, no marketplace source, routes and contacts only from pages that open (contacts only on the organisation's own site, name and work email shown, no webmail, opt-outs respected), operators with an AOC and not on the EU Air Safety List, sanctions pre-screen (a possible match is held for the Director). Result in intel/agent and intel/status. Suppliers (services.mjs rules, the global airport list, five airports a run per set, 30-day refresh) and investors (investors.mjs rules, Director-only table, counts only in logs) are checked the same way. `dry=1` checks without writing. |
| `intel.mjs`, `investors.mjs`, `services.mjs` | not run | The former AI research (Anthropic API), retired on 8 Nov 2026 (Morten: no AI for research). Kept only for their rules (vetOrg, vetOperator, vetInvestor, vetProfile, fitScore, vetService, focus lists, airports), which prospectagent.mjs applies to the research agent's findings. No job in the workflow calls the AI. |
| `operators.mjs` | 07:29 daily | No AI. Operators from the ARGUS and WYVERN audit registries (registries/index.json) and official AOC lists (UK CAA, read from the authority's PDF with pdftotext): one record per operator with list, level, certificate number, base and country where given; jet operators to Operators, helicopter operators to the Helicopters section of service partners; sanctions screen, excluded places left out, "to confirm" flags; an operator that leaves a list is flagged, never deleted. `probe` reads an authority's list layout before a new reader is written. |
| `prospectagent.mjs fix` / `report` | on request | Sealed one-off clean-up of supplier records (merges, removals, recategorising, moves; every changed record archived in intel/cleanup-<date>) and a sealed read-only report of operators and service partners. |
| `agentcrypt.mjs` | used by prospectagent.mjs | Seals the plan and the findings (RSA-OAEP + AES-256-GCM) so investor names never appear in GitHub run inputs or logs; the job's key pair lives in the private storage bucket `agent`. |
| `screen.mjs` | 06:41 daily | Sanctions screen without AI: downloads the official UN, US (OFAC), EU and UK lists, screens every operator and service partner and their owners (a possible match sets them to review), and stores a name index in private storage for the portal's booking screens (api/screen.mjs). Runs while daily research is paused. |
| `audits.mjs` | Daily 06:53 | Reads the ARGUS operator registry and the WYVERN Wingman directory into private storage (registries/index.json) for the portal's Operator safety check (api/auditcheck.mjs), and watches the pages where ARGUS, WYVERN and IBAC describe their rating levels; a level added, renamed or dropped asks the owner to review the standard (Team → Audit watch). A registry that cannot be read is reported, never guessed. No AI. |
| `regimes.mjs` | Mondays 08:23 | Reads which sanctions programmes the official UN, US (OFAC), EU and UK lists contain. The first run stores them; any programme added or removed later, or a list that cannot be read twice in a row, asks the owner to review the website's excluded places, manual G.2 and KYC (Team → Sanctions watch). Changes nothing by itself. |
| `backup.mjs` | 02:17 daily | Every table (checked against the migrations) and every stored file (portal-files, registries, agent, sanctions), packed and encrypted with BACKUP_PASSPHRASE, kept 90 days as a GitHub Actions artifact. |

Run one now: GitHub → Actions → Portal jobs → Run workflow → choose the job.

Restore a backup (ask Claude to run it from GitHub Actions with the database key; never on a laptop): download the artifact (portal-backup-<run>), then
`openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in backup.tar.gz.enc -out backup.tar.gz -pass pass:<passphrase>` and
`tar -xzf backup.tar.gz`. `backup.json` holds every table: `node backup.mjs restore-tables backup.json` puts back every
missing row and never overwrites one (the portal's Settings > Check or restore a backup reads only the portal's own
download, not this file); `backup-files/` holds every stored file (uploaded documents, registries, the research agent's key, the sanctions
index): `node backup.mjs restore-files backup-files` puts back any file that is missing and never overwrites one. Backups
made before 8 Nov 2026 are `backup.json.enc` (tables only): the same openssl line with those names.
What the backup holds is tested: `node test.mjs` fails if a table made by the database migrations is not in it.

Tests (offline, example data): `cd jobs && npm install && node test.mjs && node regimes.test.mjs && node screen.test.mjs && node audits.test.mjs`.
