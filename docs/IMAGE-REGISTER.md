# Website image register

Every picture on archeaviation.com, where it came from and on what terms. Nothing goes live without a line here showing a source and a licence (P1 in `PRELAUNCH.md`).

**How to replace a picture:** save the new file as `apps/website/images/<slot>.webp` (or `.jpg` / `.png`) at the size below, run `python3 apps/website/build.py`, and fill in its line here. The original from the Design file is used for any slot without a file in that folder.

**Status key:** ❌ must replace · ⚠️ check terms · 🟡 interim (ours, replace when ready) · ✅ cleared

| Slot | Where on the page | Size wanted | Current picture | Status | Source / licence / date |
|---|---|---|---|---|---|
| svc-charter | Services: Private Charter | 1600 × 2000 (4:5) | Our line drawing on charcoal (`make_interim.py`) | 🟡 | Archē's own artwork, 20 Oct 2026. Dreamstime preview removed the same day (watermarked, unlicensed). |
| svc-advisory | Services: Aviation Advisory | 1600 × 2000 (4:5) | Jet in flight over hills | ⚠️ | Unknown. Looks AI-made: check the terms of the tool that made it. |
| svc-fleet | Services: Fleet Coordination | 1600 × 2000 (4:5) | Jet on apron at sunset | ⚠️ | Unknown. Looks AI-made. |
| why-photo | Why Archē, wide cabin photo | 2400 × 1030 (21:9) | Cabin with glass and window | ⚠️ | Unknown. |
| ac-cj3 | Aircraft finder: Citation CJ3 | 2400 × 1350 (16:9) | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-phenom300 | Aircraft finder: Phenom 300 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-pc24 | Aircraft finder: PC-24 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-xls | Aircraft finder: Citation XLS | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-cl350 | Aircraft finder: Challenger 350 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-cl650 | Aircraft finder: Challenger 650 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-f8x | Aircraft finder: Falcon 8X | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-g550 | Aircraft finder: G550 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-g650 | Aircraft finder: G650 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| ac-g7500 | Aircraft finder: Global 7500 | 2400 × 1350 | Cabin | ❌ | Unknown; shown as a specific type. |
| journey-1 | How it works, step 1: Tell us the trip | 1600 × 1200 (4:3) | Man on phone, city at dusk | ⚠️ | Unknown. Looks AI-made. |
| journey-2 | Step 2: We source and vet | 1600 × 1200 | Image with "02 Within the hour" text in it | ❌ | Unknown; text baked into the image. |
| journey-3 | Step 3: You confirm | 1600 × 1200 | Man with tablet | ⚠️ | Unknown. Looks AI-made. |
| journey-4 | Step 4: We handle the details | 1600 × 1200 | Image with "04 Before departure" text in it | ❌ | Unknown; text baked into the image. |
| journey-5 | Step 5: You fly | 1600 × 1200 | Image with "05 Day of travel" text in it | ❌ | Unknown; text baked into the image. |
| advisor-portrait | Contact: your private client advisor | 1200 × 1500 (4:5) | Man on phone at desk | ❌ | Must be the real advisor, or no photo. A stock or AI face presented as "your advisor" misleads clients. |
| office-singapore | Contact: Singapore office | 1600 × 1000 | Marina Bay at dusk | ⚠️ | Unknown. |
| office-bangkok | Contact: Bangkok office | 1600 × 1000 | (empty) | ❌ | Needed if the Bangkok tab stays. |

## Acceptable sources
1. **Licensed stock** with a commercial licence (Adobe Stock, Getty, Shutterstock): keep the receipt; note licence type and number here.
2. **Operator photos** with written permission for website use: keep the email or letter.
3. **Manufacturer media:** often press use only, so get written permission for marketing.
4. **AI-made by Archē:** allowed under the tool's terms. Never presented as a specific aircraft type, a real person or a real office. Mark generic cabin images "Illustration".
5. **Archē's own photos and artwork.**
