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

def place(src_dir, out_dir):
    Image.MAX_IMAGE_PIXELS = None
    for slot, (sid, (w, h), (fx, fy)) in PLACES.items():
        im = Image.open(os.path.join(src_dir, f"iStock-{sid}.jpg")).convert("RGB")
        W, H = im.size; target = w / h
        cw, ch = (round(H * target), H) if W / H > target else (W, round(W / target))
        x = min(max(round(fx * W - cw / 2), 0), W - cw); y = min(max(round(fy * H - ch / 2), 0), H - ch)
        im.crop((x, y, x + cw, y + ch)).resize((w, h), Image.LANCZOS).save(os.path.join(out_dir, slot + ".webp"), "WEBP", quality=82, method=6)
        print(f"  {slot:17} iStock {sid:11} crop {cw}x{ch} -> {w}x{h}")

if __name__ == "__main__":
    place(sys.argv[1], os.path.join(os.path.dirname(os.path.abspath(__file__)), "images"))
