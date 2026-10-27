# Airport rules: how they are researched

Morten, 27 Oct 2026: research 50 airports every morning. Start with all known business-aviation airports (tier 1 in `_queue.json`), then secondary airports (tier 2). The portal's trip checks and the website use these files. Read `CLAUDE.md` first; its rules apply.

## What a run does
1. Take the next airports from `_queue.json`: tier 1 in the order listed, then tier 2. Skip any airport that already has a file here. Take up to `perRun` (50).
2. When tier 1 has no airports left and `tier2` is empty, build tier 2 first:
   - 200 secondary business-aviation airports worldwide: resorts, regional hubs and the business-aviation fields near big cities.
   - None in a sanctioned place (`../excluded.json`).
   - Grouped by region, as for tier 1.
3. For each airport, research **official sources only**:
   - the country's Aeronautical Information Publication (AIP), section AD 2 for that airport
   - the airport operator's own website
   - the civil aviation authority's official pages

   Check that the AIP version is the latest you can find. If an amendment changes the airport, use the amended values.

   Trip-support blogs and broker sites may point you to a source, but never use them as the source.
4. Record only what the official source states.
   - Leave out anything you cannot verify, and list it under `missing`.
   - Never guess, and never fill a gap from memory.
   - If no official source can be read at all, write the file with `"status": "unavailable"`, no rules, and a note saying which source was tried.
5. Add each source to `../sources.json`: title with the effective date, URL, publisher, and `checked` set to today's date.
6. Run `python3 apps/website/content/check_airports.py` and `python3 apps/website/content/build_content.py`. Both must pass.
7. Commit the files under `apps/website/content/` and the regenerated `apps/portal/airport-rules.json` (written by `build_content.py`; the portal's trip checks read it) to `main` with the usual attribution lines and push.
8. Report:
   - how many airports were verified, partly verified or unavailable
   - which official sources could not be opened, so Morten can download them
   - anything notable, such as a curfew or a size limit that affects common trips

## File format (`<ICAO>.json`)
```json
{
 "icao": "WSSL", "iata": null, "name": "Seletar Airport", "city": "Singapore", "country": "SG", "tz": "Asia/Singapore",
 "tier": 1, "status": "verified", "checked": "2026-10-27",
 "rules": {
  "runway":       {"v": "One runway, 03/21, 1,836 m × 46 m", "longest_m": 1836, "src": "sg-aip-wssl"},
  "curfew":       {"v": "No flights 22:00–07:00 local, except medevac and emergency", "windows_local": [["22:00", "07:00"]], "src": "sg-aip-wssl"},
  "customs":      {"v": "Customs and immigration 24 hours", "h24": true, "src": "sg-aip-wssl"},
  "max_aircraft": {"v": "Largest stands take up to a Boeing 757-200", "src": "sg-aip-wssl"}
 },
 "missing": ["slots", "ppr"],
 "notes": "Slot rules are in AIP GEN 1.2, not read yet."
}
```

**Allowed rules:** `runway`, `curfew`, `customs`, `slots`, `ppr`, `max_aircraft`, `handling`, `noise`, `fuel`, `hours`, `permits`, `deicing`, `catering`.

**Structured fields the portal uses:**
- `runway.longest_m`
- `curfew.windows_local` (local times), or `curfew.none: true` when the source says there is no curfew
- `customs.h24`, or `customs.hours_local`

**Status values:**
- `verified`: the main rules are recorded.
- `partial`: some rules are recorded.
- `unavailable`: no official source could be read.

Times are local to the airport. Also write the UTC times in `v` when the source gives them.
