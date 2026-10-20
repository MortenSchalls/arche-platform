#!/usr/bin/env python3
"""Make the hero line drawing's wings 50% longer on each side, keeping fuselage, engines, tail,
winglets and the fairings under the wing unchanged. Writes assets/jet-line-watermark-wide.png."""
import numpy as np, sys
from PIL import Image

SRC = "design-source/assets/jet-line-watermark-white.png"
OUT = "site/assets/jet-line-watermark-wide.png"
ROOT_X = 760      # left wing root (fuselage side) in the source drawing
SAFE_X = 432      # stretch only left of this: the tailplane tip sits at x≈440
TIP_X = 110       # keep the winglet (x < 110) as drawn
GROW = 0.5        # wings 50% longer

def widen_left(a):
    h, w, _ = a.shape
    alpha = a[:, :, 3]
    add = int(round((ROOT_X - 27) * GROW))
    # find fairings: columns whose lowest drawn pixel hangs below the wing's lower edge line
    xs = np.arange(TIP_X, SAFE_X)
    low = np.array([np.max(np.nonzero(alpha[380:800, x] > 20)[0]) + 380 if (alpha[380:800, x] > 20).any() else 0 for x in xs])
    fit = np.polyfit(xs, low, 1); base = np.polyval(fit, xs)
    bump = (low - base) > 6
    bump = np.convolve(bump, np.ones(9), "same") > 0           # small margin round each fairing
    bare = [x for x, b in zip(xs, bump) if not b]
    k = 1 + add / len(bare)                                     # each bare column becomes k columns
    cols, acc = [], 0.0
    for x in range(w):
        if x in set(bare):
            acc += k; n = int(acc); acc -= n
            cols.extend([x] * n)
        else:
            cols.append(x)
    # resample: within stretched runs use linear interpolation for smooth lines
    out = np.zeros((h, len(cols), 4), dtype=np.float32)
    src = a.astype(np.float32)
    i = 0
    while i < len(cols):
        x = cols[i]; j = i
        while j < len(cols) and cols[j] == x: j += 1
        run = j - i
        if run == 1:
            out[:, i] = src[:, x]
        else:
            nxt = min(x + 1, w - 1)
            for r in range(run):
                t = r / run
                out[:, i + r] = src[:, x] * (1 - t) + src[:, nxt] * t
        i = j
    return out.clip(0, 255).astype(np.uint8), add

im = Image.open(SRC).convert("RGBA"); a = np.array(im)
mid = a.shape[1] // 2
left, addl = widen_left(a[:, :mid])
right, addr = widen_left(a[:, mid:][:, ::-1])
res = np.concatenate([left, right[:, ::-1]], axis=1)
Image.fromarray(res).save(OUT, optimize=True)
print(OUT, res.shape[1], "x", res.shape[0], "added", addl, addr)
