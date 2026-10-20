#!/usr/bin/env python3
"""Interim on-brand picture for a card: our own refined Global 7500 line drawing on charcoal.
No third-party rights. Used for svc-charter until a licensed photo is chosen."""
from PIL import Image
import numpy as np, sys
W, H = 1600, 2000
y, x = np.mgrid[0:H, 0:W]
d = np.sqrt(((x - W / 2) / (W * 0.75)) ** 2 + ((y - H * 0.38) / (H * 0.6)) ** 2)
t = np.clip(d, 0, 1)[..., None]
img = np.clip(np.array([70, 74, 82]) * (1 - t) + np.array([40, 43, 48]) * t, 0, 255).astype("uint8")
bg = Image.fromarray(img, "RGB").convert("RGBA")
jet = Image.open("site/assets/jet-line-watermark-wide.png").convert("RGBA")
jw = int(W * 0.96); jet = jet.resize((jw, int(jet.size[1] * jw / jet.size[0])), Image.LANCZOS)
a = np.array(jet); a[..., 3] = (a[..., 3] * 0.6).astype("uint8")
bg.alpha_composite(Image.fromarray(a), ((W - jw) // 2, int(H * 0.24)))
m = np.clip((np.linspace(0, 1, H)[:, None] - 0.55) / 0.45, 0, 1) ** 1.3
dark = np.zeros((H, W, 4), dtype="uint8"); dark[..., 3] = np.repeat((m * 170).astype("uint8"), W, axis=1)
bg.alpha_composite(Image.fromarray(dark, "RGBA"))
out = sys.argv[1] if len(sys.argv) > 1 else "images/svc-charter.webp"
bg.convert("RGB").save(out, quality=82)
print(out)
