# Brief: verified airport facts for a private-jet charter broker's website (Archē Executive, Singapore)

The owner's rule: "Only verified, correct facts, each with its source and the date it was checked. No guesses. Better fewer and correct than many and wrong."

## Sources you may use (official only)
- The country's Aeronautical Information Publication (AIP / eAIP), section AD 2 for the airport, latest effective version you can find. Also AD 1 / GEN pages for national rules (customs, slots, permits) if needed.
- The airport operator's own website (e.g. the airport company's business-aviation / general-aviation pages, curfew pages).
- The civil aviation authority or government (laws, regulations, official notices).
- Never use broker sites, trip-support blogs, Wikipedia, forums, FBO-directory sites or news as the source. They may point you to an official source; then open and quote the official source.
- If a source cannot be opened (blocked, login, PDF won't load), say so in "unreadable" with the URL, and do not fill the gap from memory.

## For each airport, record what the official source states (when it states it)
- name, icao, iata, city, country (ISO2), timezone (IANA), coordinates [lat, lon] (decimal, from the AIP ARP)
- operator: the airport operator's name
- location: distance and direction from the city as the AIP states it
- runway: longest runway designation, length × width in metres; longest_m number
- customs: customs/immigration hours (H24 or hours, local and/or UTC as stated)
- curfew: night restrictions / curfew / night quota, with times; give windows_local [["HH:MM","HH:MM"]] in local time if the source gives clear times (convert from UTC only if the source states UTC and you state the conversion and DST caveat in notes); "none": true only if the source explicitly says no curfew/operating 24h with no night restriction
- slots: whether slots or prior permission (PPR) are required for business/general aviation, and how far ahead, as stated
- max_aircraft: largest aircraft / stand limits / weight limits for business aviation if stated
- handling / business-aviation terminal (FBO): names of the business aviation terminals or handling agents AS LISTED BY THE AIP OR THE AIRPORT OPERATOR'S OWN SITE (no directories)
- hours: aerodrome operating hours
- anything notable for private flights (e.g. GA restrictions, noise rules, "business aviation not permitted", required handling)

## Output: write ONE JSON file (path given in your task) shaped like:
{
 "airports": [
  {"icao":"EGLF","iata":"FAB","name":"Farnborough Airport","city":"London","country":"GB","tz":"Europe/London",
   "geo":{"v":[51.2758,-0.7763],"src":"uk-aip-eglf","quote":"..."},
   "facts": {
     "operator": {"v":"short sentence fragment, plain English","src":"uk-aip-eglf","quote":"exact words copied from the source that prove it"},
     "location": {...}, "runway": {"v":"...", "longest_m":2440, ...}, "customs": {"v":"...", "h24":true|false, "hours_local":[["HH:MM","HH:MM"]] (optional), ...},
     "curfew": {"v":"...", "windows_local":[["23:00","07:00"]] or "none":true, ...}, "slots": {...}, "ppr": {...}, "max_aircraft": {...}, "handling": {...}, "hours": {...}, "noise": {...}, "notable": {...}
   },
   "missing": ["list of the fields above you could not verify"],
   "notes": "anything the owner should know, e.g. weekend hours differ, DST"
  }
 ],
 "sources": {
   "uk-aip-eglf": {"title":"UK AIP, AD 2 EGLF Farnborough (AIRAC effective DD Mon YYYY)","url":"https://...","publisher":"NATS on behalf of the UK CAA","effective":"YYYY-MM-DD or text"}
 },
 "unreadable": [{"url":"...","why":"..."}]
}

Rules for "v": short plain-English fragment that reads well inside a sentence (e.g. "open 24 hours", "one runway, 06/24, 2,440 m long and 45 m wide"). No marketing words. Use digits as the source does. Every fact MUST have "quote" with the exact words from the source (a short excerpt, under 40 words). If you are not sure, leave it out and list it in "missing".
Source ids: lowercase, short, like "uk-aip-eglf", "gva-curfew". The "title" must include the AIRAC/effective date or the page's date if shown.
Do not invent ICAO/IATA or coordinates: take them from the AIP.
Work efficiently: open the AIP AD 2 page for each airport directly where possible. When done, reply with a 5-line summary: airports done, fields missing, sources unreadable.

## Country facts (when the task asks for countries)
For each country, from the national AIP GEN 1.2 (entry, transit and departure of aircraft) or the civil aviation authority's official pages, record under "countries": [{"iso2":"MY","name":"Malaysia","facts":{...}}] with the same {v, src, quote} shape:
- authority: name of the civil aviation authority
- permit: what a foreign non-scheduled (charter / private) flight needs to land (permit/approval, from whom, how many days ahead)
- overflight: what is needed to overfly, if stated
- cabotage: any rule on domestic carriage by foreign aircraft, if stated in an official source
- customs_airports: that international flights must use designated customs airports (if stated)
- notable: anything else a private-jet client must know (e.g. documents, local handling agent required)
Use the same "sources" map. Only what the official source states, with quotes.
