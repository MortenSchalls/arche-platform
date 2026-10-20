# Pre-launch priorities and checklist

Work top to bottom. Nothing goes live on archeaviation.com until every P1 line is ticked.

## P1: must be done before go-live (legal, trust, safety)
- [ ] **Image rights.** Replace or license all 21 website images; record source, licence and date for each in `docs/IMAGE-REGISTER.md`.
  - Remove now: Private Charter photo (Dreamstime watermark, unlicensed preview).
  - Aircraft finder: 11 cabin photos labelled as specific types, source unknown. Licensed photos, operator photos with written permission, or generic class illustrations labelled "Illustration".
  - Journey 2, 4, 5: replace (text baked into the image).
  - Check AI-made images (advisor, journey 1 and 3, advisory, fleet, office) against the terms of the tool that made them.
- [ ] **Placeholders filled:** phone and WhatsApp, advisor name and title, office addresses (Singapore, Bangkok), legal entity and registration number, contact email on archeaviation.com (site still shows charter@archeexecutive.com).
- [x] **Certificates CERT 01–04:** strip hidden on the live site (20 Oct); kept in the Design file. Set SHOW_ACCREDITATIONS = True in apps/website/build.py when there are real accreditations.
- [ ] **Legal wording:** jurisdiction notices (CAAS, CAAT), broker disclosure, privacy notice and terms of business reviewed by counsel.
- [ ] **Sign-in for staff:** Microsoft 365 sign-in on; sign-in and system emails sent from archeaviation.com (custom SMTP), not Supabase's test mail.
- [ ] **Full run-through** on desktop and phone: every section, link, language, form; quote and call-back reach Today.

## P2: go-live
- [ ] GoDaddy records: archeaviation.com and www → website; portal → portal (see `DNS-GODADDY.md`).
- [ ] Broker login link switched to portal.archeaviation.com (`apps/website/build.py`, PORTAL).
- [ ] Email safety records: SPF, DKIM, DMARC.
- [ ] Supabase Auth URL configuration updated to the new addresses.

## P3: right after go-live
- [ ] Academy on the same sign-in at academy.archeaviation.com; seal key as an environment variable.
- [ ] Website enquiry alert to the 24/7 desk (email or WhatsApp) so a request is never missed.
- [ ] Image sizes: use originals at the sizes the layout expects (1,600–2,400 px wide).
- [ ] Retire the claude.ai portal after two weeks of parallel running.

## P4: improvements
- [ ] Website wording and layout adjustments (Morten's list).
- [ ] Rotation of website enquiries to the broker on duty (if wanted).
- [ ] Remaining portal items: card proposals from the daily research, 7%/9% margin split once defined.

## Done (20 Oct 2026)
- Portal on Supabase + Vercel, Morten owner, 133 prospects, settings and FAQ moved.
- Website on Vercel from Design v7: phone layout, forms to the portal, privacy notice draft, Broker login.
- Hero drawing: Global 7500 basis (span 31.7 m : height 8.2 m, Bombardier factsheet), then per Morten: plain tailplane tips, fin 10% shorter, wingspan 20% shorter; wingtips about 2 cm from the screen edge.
- Portal Day theme: neutral light grey instead of warm off-white.
