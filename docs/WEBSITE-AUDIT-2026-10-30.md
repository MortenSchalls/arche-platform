# Website audit and GlobalJet comparison, 30 Oct 2026

Scope: the staging website after today's changes (separate menu pages, fixed top menu, type system). Checked on all 62 built pages with a script (titles, descriptions, headings, canonical and language links, structured data, broken links), Lighthouse on Home, Services and Aircraft (phone test profile), and phone width 390 px. GlobalJet: globaljet.aero/en and its charter, brokerage and contact pages, read 30 Oct 2026.

## 1. Verdict

The design, the writing and the depth of content are already ahead of GlobalJet. What holds us back is not the look. It is four things that stop us being found and trusted at launch:
1. Placeholders on the site.
2. Guide pages not yet approved.
3. Speed on phones.
4. Too few photos outside the home page.

All four can be fixed before launch.

| Check | Result |
|---|---|
| Broken links (62 pages) | 0 |
| Accessibility (Lighthouse) | 100 |
| Best practices | 96 |
| Search basics on the menu pages (title, description, canonical, 4 languages, structured data) | in place |
| Search score | 69, only because the site is closed to search engines before launch (intended) |
| Speed on a phone | 60 / 100; largest picture shown after 7.2 s on the slow-phone test |
| Sideways scrolling at 390 px | none |

## 2. Fixed today

- Every menu item is its own page in English, Thai, Chinese and Japanese, each with its own title, description and language links.
- The same fixed top menu is on every page, including the guides, terms and privacy pages.
- One type system: serif only for titles and the slogan; body text 17 px at regular weight; nothing under 14 px except spaced capitals.
- Pictures now load only when they are about to be seen (this saved about half the wasted picture download on the home page).
- One main title (h1) per page.
- The privacy page now has a description and a canonical link.

## 3. Search engines (SEO)

| Priority | Finding | Action | Who |
|---|---|---|---|
| Launch blocker | The 39 guide pages (regions, cities, countries, airports, guides) are drafts and marked "do not index". Our strongest content is invisible to Google. | Approve the guide pages. They go into the sitemap automatically once approved. | Morten |
| Launch blocker | Phone number shows as +65 0000 0000 on every page, and the company number (UEN) is missing. Google and clients both read these as signs of a business that is not real. | Give the real number and the UEN; one setting each in company.py. | Morten |
| Launch | The whole site is closed to search engines (pre-launch setting). | At launch: switch LAUNCHED, submit the sitemap in Google Search Console, and create a Google Business Profile for the Singapore office. | Morten, then Claude |
| High | Phone speed. The page template is assembled in the browser, so a phone must download about 170 KB of HTML and run about 100 KB of script before the page settles. Every menu page also carries the hidden sections of the other pages. | Build each page as finished HTML at build time instead of assembling it in the browser. This is the single biggest speed and search improvement left; it is about a day of work. | Claude |
| Medium | Same hero photo for every screen size. | Serve a phone-sized version and preload it. | Claude |
| Medium | The guides are English only; the menu pages are in four languages. | Translate the top guides (Singapore, Bangkok, Phuket, Hong Kong, Tokyo) once approved. | Claude, Morten approves |
| Medium | Structured data covers the company on Home only. | Add Service data on Services and breadcrumbs on the menu pages. | Claude |
| Ongoing | GlobalJet publishes news monthly; search engines reward fresh pages. | A short dated "Notes" page each month: new slot rules, curfews, event dates. Facts and sources only, which fits our rules. | Claude drafts, Morten approves |

## 4. Using the site

| Finding | Suggestion |
|---|---|
| The quote form is only in the home hero. "Request a quote" in the menu sends people back to Home. | Put a short quote form on Contact. Also add a "Check availability" step at the end of Aircraft that carries the chosen category into the form. |
| GlobalJet has a "Request quotes" button in its header at all times. | Add a "Request a quote" button to our fixed top menu, right of the links. It stays visible on every page. |
| The Menu and language drop-downs close only when clicked again (no script, by rule). | Acceptable. A three-line script would close them on any outside click, if you allow it. |
| On guide pages the language menu leads to the home page in that language, because the guides are English only. | Solved once the top guides are translated. |
| The home page description says "Replies within 15 minutes, 24/7". | Keep it only if the desk can always meet it; otherwise change it to "Replies at any hour". |

## 5. GlobalJet against Archē, menu by menu

| Menu | GlobalJet | Archē today | Who wins |
|---|---|---|---|
| Home | "Luxury Private Aviation", 26 years, 600 staff, 10 offices, founder-led. Four service cards, offices, "Luxury Links", news. | Cabin-photo hero with the quote form on it, who we are, three services, why us, Discover tiles, dates ahead, slogan. | GlobalJet on scale and proof. Archē on getting to a quote fast. |
| Services | Four services, each with its own page. | Three services with their own page: in detail, on board, our operator standard. | Archē on clarity and the published safety standard. |
| Fleet / Aircraft | Their own managed fleet: photos, floor plans, registrations. | Aircraft finder: passengers and range give a category, with to-scale cabin drawings. We hold no fleet. | Even. They show assets, we help the client choose. |
| Offices | 11 offices with phones and 3D tours. Their Asia office uses the Geneva number. | One Singapore office. | GlobalJet, but weak in Asia, which is our ground. |
| Destinations | None. | Verified guides to regions, cities, airports and permits, every fact with a source and date. | Archē, clearly, once approved. |
| News | Monthly news and press. | Dates ahead only. | GlobalJet. Closed by a monthly Notes page. |
| Lifestyle | "Luxury Links": hotels, yachts, cars, watches. The page shows only category labels and repeated placeholder text, no real content. | On board: catering, cars, private terminal, pets, luggage, occasions; all things we arrange. | Archē. Theirs is empty, ours is real. |
| Contact | Office phones and emails; no form visible, no WhatsApp. | 24/7 desk, WhatsApp, email, call-back, empty-leg alerts. | Archē, once the real number is in. |
| Languages | EN, FR, ES, CN. | EN, Thai, Chinese, Japanese. | Archē for Asia. |

## 6. The knockout plan, in order

1. **Launch blockers**: real phone number, UEN, approve the guide pages, then open to search engines.
2. **Photos**: see section 7.
3. **A face behind the name.** GlobalJet sells "founder-led". Our "Who we are" says thirty years in the industry but shows no person. Add a short founder note with a portrait: Morten's 33 years in aviation, EASA Part-66 engineer, MRO owner. No competitor in Asia can show an engineer at the top. Wording to be agreed with Morten.
4. **"Request a quote" always visible** in the top menu, and a short form on Contact.
5. **Speed:** build finished pages at build time.
6. **Monthly Notes:** dated, sourced facts to keep the site fresh for Google.
7. **Proof over time.** Client ratings, quoted only with written consent (CLAUDE.md). Publish trips completed and operators checked once there are real numbers. No invented figures.

## 7. Photos: what to buy, and what not to show

Today only the home page, the menu pages and the service cards have photos. The guide pages are text only.

Rules:
- **Places:** show the place. A city skyline or an airport is a place, not a service.
- **Cars:** fine to show. We arrange cars to the aircraft ("How it works", step 4), and we already own a photo of a car at the aircraft (journey-4) that can go on the On board "Cars" tile.
- **Yachts, limousine fleets, hotels:** not shown as services, because we do not offer them (Morten's rule: no services we do not have). A marina can appear only as a picture of a place, for example Phuket.
- **Licences:** buy from iStock as before. Crop with place_photos.py and record each photo in docs/IMAGE-REGISTER.md.

Shopping list, about 30 iStock photos:
- **Regions (4):** Asia-Pacific, Europe, Middle East, North America. Aerial or skyline.
- **Cities (16):** Singapore, Bangkok, Phuket, Hong Kong, Tokyo, Seoul, Taipei, Kuala Lumpur, Sydney, Dubai, London, Paris, Nice, Geneva, New York, plus one spare.
- **Private terminals / airports (4):** a lounge, a ramp at dusk, a jet at a private terminal, arrival by car.
- **On board (4):** catering served, cabin details, a pet travelling, golf bags or skis being loaded.
- **Destinations page (2):** wide aerial shots for the header.

Once the photos are on your Mac, I add them to the city, region and airport pages and to a photo grid on Destinations. Each page gets a header photo like the menu pages.

Sources: globaljet.aero/en (read 30 Oct 2026); Lighthouse 12.2.1 on the staging build; Archē build checks.
