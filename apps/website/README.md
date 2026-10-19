# Website (archeaviation.com)

- `design-source/`: the Claude Design project, the master for look and text (current: `Arche Executive v7.dc.html`).
- `build.py`: makes the live site in `site/` from the Design file. Run it after every Design change:
  `python3 apps/website/build.py`
- `site/`: what Vercel publishes (Root Directory `apps/website/site`). Includes React in `vendor/`, so the
  site does not depend on outside servers, and `api/enquiry.mjs`, which sends the quote and call-back
  forms to the portal (Today → Website enquiries).
- `site-fixes.css`: phone layout fixes on top of the Design layout. `privacy.html`: privacy notice (draft for legal review).

Vercel environment variables for this project: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.

## To fill in before go-live (placeholders in the Design file)
- Phone +65 0000 0000 and WhatsApp link; [Advisor name] and [Title]
- Email charter@archeexecutive.com (old domain) → an archeaviation.com mailbox
- [Office address] Singapore and Bangkok; [Legal entity, Pte. Ltd.]; registration number
- Certificates CERT. 01–04 "Pending confirmation"
- Jurisdictional notices (Singapore CAAS, Thailand CAAT wording)
- Services photo "Private Charter" still shows a stock-photo watermark: replace the image
- Privacy notice: [registration number], [registered address], [privacy contact email], [date], legal review
