# Search (SEO) plan

## Done (20 Oct 2026, `apps/website/seo.py`)
- Title, description and canonical address (archeaviation.com); `lang="en"`.
- Link previews for WhatsApp, LinkedIn, iMessage, X (og-image.jpg, 1200 × 630, own artwork).
- Business description for Google (schema.org Organization, Service, WebSite). Address, phone and opening hours are left out until real ones exist; wrong ones hurt.
- robots.txt and sitemap.xml. The test address (*.vercel.app) answers "noindex" so only archeaviation.com is indexed.
- Speed: pictures load one by one instead of as one 1.1 MB file; six unused font families removed; browsers cache images for 30 days.

## Done (26 Oct 2026, `apps/website/seo_security.py`, run on every build)
- Shorter English description (155 characters, Google's limit); link-preview language versions.
- Business details for Google: registered office, email, languages, 24/7 contact point; phone and UEN are added by themselves once set in `company.py`.
- Sitemap with dates and the language versions of each page; small icons (32 and 180 px) and theme colour.
- Speed: the hidden Bangkok office photo no longer downloads (360 KB); the largest photos re-encoded once. Home page about 2.2 MB instead of 2.7 MB.
- Security headers on the website (Content-Security-Policy, HSTS, no framing, no sniffing, strict referrer, no camera/microphone/location) and on the portal (same, with the portal's content policy in report-only mode first; switch it to enforced after a check on the live portal).
- Form and statistics endpoints accept requests only from archeaviation.com.

## Statistics (26 Oct 2026)
- Own first-party statistics: `site/track.js` → `site/api/collect.mjs` → Supabase `submit_visit` (migration 0017). No cookies, no browser storage, no outside service; IP address never stored; Do Not Track / Global Privacy Control respected; kept 13 months. So no consent banner is needed. The privacy notice has a "Website statistics" section.
- Portal → Website (owner): visits, sources, campaigns, countries and cities, sections reached, what was used, enquiries sent, suggestions, organisation links opened.
- Brokers: a website link per lead (archeaviation.com/?r=CODE); Today shows organisations that opened their link in the last 48 hours. Website enquiries on Today show where the visitor came from (owner).
- Google Search Console (task in Team) covers what happens before the click: searches, impressions, position.
- Held back on purpose (each needs a consent banner and loads outside code): Google Analytics, ad pixels, chat widget, company identification from IP. Add only when paid ads start or Morten decides to pay for company identification.

## Needs Morten (after go-live)
1. **Google Search Console:** verify archeaviation.com (a TXT record in GoDaddy), submit the sitemap. Shows what people search and any errors.
2. **Google Business Profile:** Singapore office (and Bangkok when it opens). Needs a real address and phone; the strongest signal for "private jet charter Singapore" style searches.
3. **Bing Webmaster Tools:** same as Search Console; also feeds ChatGPT and Copilot search.
4. **Real details on the site:** phone, address, advisor name. Search engines and clients both look for them (trust).
5. **Listings and links:** ACA membership page, Avinode partner listings if offered, Singapore and Thai business directories, LinkedIn company page pointing to the site.

## Next build steps (proposed, in order)
1. **Route and city pages:** for example "Private jet charter Singapore", "… Bangkok", "Singapore to Bangkok", "Bangkok to Hong Kong", "Phuket", "Bali". One page each with real, useful content: flight time, suitable aircraft from the aircraft finder, airports (Seletar, Changi, Don Mueang, U-Tapao), what affects the price. These pages are what ranks for searches with buying intent.
2. **Thai, Chinese and Japanese pages on their own addresses** (/th/, /zh/, /ja/): today the language switch changes text in the browser only, so Google sees English. Separate pages let the site rank in those languages. Needs the translations reviewed by native speakers first.
3. **Pre-rendered HTML:** the page is drawn by JavaScript. Google handles that, but other search engines and AI assistants read static HTML better. Build-time rendering would give every visitor and crawler the full text immediately.
4. **Guides:** a few honest articles (empty legs explained, what an AOC is, charter vs fractional, travelling with pets) that answer what clients actually search.
5. ~~Measurement~~: done 26 Oct 2026 (own statistics, see above).
