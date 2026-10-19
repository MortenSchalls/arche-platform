# GoDaddy steps for go-live

Do this only at switch-over, after the new site works on its temporary Vercel address. Vercel shows the exact values to enter when each address is added to the project; use those if they differ from below.

1. Log in to GoDaddy → **My Products** → next to archeaviation.com click **DNS**.
2. Leave every existing record for email alone: **MX**, **autodiscover**, **TXT** records starting `v=spf1` or `MS=`, and any `_dmarc` or `selector` records. They run Microsoft 365.
3. Website (archeaviation.com): edit the **A** record with Name `@` and set the value Vercel gives (often `76.76.21.21`). Delete GoDaddy's "parked" A record if there is one.
4. www: **CNAME**, Name `www`, Value as given by Vercel (often `cname.vercel-dns.com`).
5. Portal: **CNAME**, Name `portal`, Value as given by Vercel.
6. Academy: **CNAME**, Name `academy`, Value as given by Vercel.
7. TTL 1 hour. Save. Vercel shows a green tick when each address works (usually within an hour) and adds the security certificate itself.

## Email safety (do once, before clients receive mail)
- SPF: GoDaddy normally adds it for Microsoft 365. Check one TXT record `v=spf1 include:secureserver.net -all` or the Microsoft variant exists, not two.
- DKIM: switch on in the Microsoft 365 Defender portal (Email authentication → DKIM) and add the two CNAME records it shows.
- DMARC: TXT record, Name `_dmarc`, Value `v=DMARC1; p=quarantine; rua=mailto:<your admin mailbox>`.
- If the portal later sends email itself (rating requests, reminders), the sending service adds its own SPF/DKIM records; add them the same way.
