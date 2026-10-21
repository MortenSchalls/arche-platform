#!/usr/bin/env python3
"""Crop the licensed iStock photos to each website slot and save them as apps/website/images/<slot>.webp.

    python3 apps/website/place_photos.py "<folder with the iStock originals>"

Originals stay on Morten's Mac (Arche Executive/Website/iStock photos 2026-10-20) and are NOT stored in the repository.
Licences: iStock standard licence, bought by Morten 20 Oct 2026 (see docs/IMAGE-REGISTER.md).
Each entry: slot -> (iStock ID, output size, focus point as fractions of width and height).
"""
import os, sys
from PIL import Image

PLACES = {
    "svc-charter":      ("117955689",  (1600, 2000), (0.50, 0.50)),   # jet nose-on
    "svc-advisory":     ("2294055415", (1600, 2000), (0.40, 0.50)),   # working in the cabin
    "svc-fleet":        ("1177037113", (1600, 2000), (0.33, 0.55)),   # jet on the apron, others behind
    "why-photo":        ("1145831489", (2400, 1030), (0.50, 0.50)),   # cabin
    "journey-1":        ("896761630",  (1600, 1200), (0.45, 0.50)),   # on the phone
    "journey-2":        ("2208749758", (1600, 1200), (0.50, 0.50)),   # engine close up: sourcing and vetting
    "journey-3":        ("1085767446", (1600, 1200), (0.50, 0.50)),   # the aircraft at sunset
    "journey-4":        ("2277753697", (1600, 1200), (0.50, 0.50)),   # car to aircraft, bags handled
    "journey-5":        ("888729764",  (1600, 1200), (0.50, 0.50)),   # boarding
    "office-singapore": ("495760087",  (1920, 1080), (0.50, 0.50)),
    "office-bangkok":   ("871569534",  (1920, 1080), (0.50, 0.45)),
}

# second batch (21 Oct 2026, originals in "iStock photos 2026-10-21"): photo breaks, the row of three, a new How-it-works step 1
PLACES_2 = {
    "break-1":          ("1052491134", (2560, 1100), (0.50, 0.42)),   # wing above clouds at sunrise
    "break-3":          ("2294478738", (2560, 1100), (0.50, 0.62)),   # business jet taxiing at sunset
    "trio-1":           ("79339787",   (1200, 1200), (0.66, 0.50)),   # pilot's walk-around under the wing
    "trio-2":           ("2282607115", (1200, 1200), (0.36, 0.55)),   # cabin table: laptop, glass, macarons
    "trio-3":           ("2266443854", (1200, 1200), (0.46, 0.50)),   # phone call at night, city lights behind
    "journey-1-new":    ("2269862643", (1600, 1200), (0.62, 0.45)),   # client calling to book, daytime office
}

def place(src_dir, out_dir, places=None):
    Image.MAX_IMAGE_PIXELS = None
    for slot, (sid, (w, h), (fx, fy)) in (places or PLACES).items():
        im = Image.open(os.path.join(src_dir, f"iStock-{sid}.jpg")).convert("RGB")
        W, H = im.size; target = w / h
        cw, ch = (round(H * target), H) if W / H > target else (W, round(W / target))
        x = min(max(round(fx * W - cw / 2), 0), W - cw); y = min(max(round(fy * H - ch / 2), 0), H - ch)
        im.crop((x, y, x + cw, y + ch)).resize((w, h), Image.LANCZOS).save(os.path.join(out_dir, slot + ".webp"), "WEBP", quality=82, method=6)
        print(f"  {slot:17} iStock {sid:11} crop {cw}x{ch} -> {w}x{h}")

if __name__ == "__main__":
    place(sys.argv[1], os.path.join(os.path.dirname(os.path.abspath(__file__)), "images"))
