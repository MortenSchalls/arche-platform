# Search (SEO) plan

## Done (20 Oct 2026, `apps/website/seo.py`)
- Title, description and canonical address (archeaviation.com); `lang="en"`.
- Link previews for WhatsApp, LinkedIn, iMessage, X (og-image.jpg, 1200 × 630, own artwork).
- Business description for Google (schema.org Organization, Service, WebSite). Address, phone and opening hours are left out until real ones exist; wrong ones hurt.
- robots.txt and sitemap.xml. The test address (*.vercel.app) answers "noindex" so only archeaviation.com is indexed.
- Speed: pictures load one by one instead of as one 1.1 MB file; six unused font families removed; browsers cache images for 30 days.

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
5. **Measurement:** privacy-friendly analytics without cookies (for example Plausible or Vercel Analytics) to see which pages bring enquiries.
