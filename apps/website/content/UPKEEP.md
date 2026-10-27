# Weekly website upkeep: events, fact re-checks, new places

Morten, 27 Oct 2026: "we need to have this automated as we do with the sanctions list as well and also for events and airports, countries etc." Read `CLAUDE.md` first; its rules apply ("Website content", "Prospects and data", sanctions). Airports have their own daily run (`airports/README.md`).

## What a run does
1. **Events** (`events.json`):
   - For every city that has events, look for events newly announced with official dates in the next 14 months: the organiser's own site, or the government or tourism authority.
   - Add each one with a fact `ev.<key>` in `facts.json` (value = the date range, `src`, `quote` = the exact words showing the dates) and its source in `sources.json`.
   - Use names without sponsors. No event in a place listed in `excluded.json`.
   - If an organiser changes the dates of an event already listed, update it.
   - Past events drop off by themselves at every build. The home page's "Dates ahead" strip shows the next three and its "Destinations" strip lists the region and city pages; both are rebuilt from these files (`home_extras.py`).
2. **Fact re-checks:**
   - Find sources in `sources.json` checked more than 300 days ago (the build stops at 365).
   - Open each one and check that the quotes of the facts using it are still true.
   - If they are, set `checked` to today. If the source changed, update the facts (and `airports/<ICAO>.json` rules) from the new text. If it can no longer be read, leave it and report it.
3. **New places:** take the next 3 entries from `_pages_queue.json`.
   - Research each one from official sources only, as in `airports/README.md`, into a JSON file in the shape `RESEARCH-BRIEF.md` sets out (airports and, for a country, the "Country facts").
   - Import it with `python3 apps/website/content/importer.py <file>.json`: facts, sources and airport files, each fact with its quote. Then write a page in `pages/` with `"draft": true`.
   - Pages never use handling-agent or other company facts (only authorities, airport operators and cited sources may be named).
   - Copy the structure of the existing city, airport or country pages.
   - Never publish: Morten approves drafts.
   - Remove the entries done from the queue.
4. Run `python3 apps/website/content/check_airports.py`, then `python3 apps/website/build.py`, then `python3 apps/website/check_site.py`. They must pass, apart from the known phone and UEN placeholders.
5. Commit only the content files, the built pages and `apps/portal/airport-rules.json` to `main`, with the usual attribution lines, and push.
   - Before committing, restore `apps/website/site/index.html`, `th.html`, `zh.html` and `ja.html` with `git checkout` if the only change is attribute order.
6. Report:
   - events added or changed;
   - sources re-checked, changed or unreadable;
   - draft pages added;
   - anything Morten should decide.
