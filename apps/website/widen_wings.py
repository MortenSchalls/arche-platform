#!/usr/bin/env python3
"""Give the hero line drawing the true front-view proportions of the Bombardier Global 7500:
wingspan 31.7 m to overall height 8.2 m (Bombardier factsheet), i.e. span = 3.866 x height.
Only the outer wing sections are lengthened; fuselage, engines, tail, winglets and the fairings
under the wing keep their drawn shape. The tailplane tip pods, which the real aircraft does not
have, are removed. Writes site/assets/jet-line-watermark-wide.png."""
import numpy as np, sys
from PIL import Image

SRC = "design-source/assets/jet-line-watermark-white.png"
OUT = "site/assets/jet-line-watermark-wide.png"
ROOT_X = 760      # left wing root (fuselage side) in the source drawing
SAFE_X = 432      # stretch only left of this: the tailplane tip sits at x≈440
TIP_X = 110       # keep the winglet (x < 110) as drawn
SPAN_M, HEIGHT_M = 31.7, 8.2   # Global 7500, Bombardier factsheet

def widen_left(a):
    h, w, _ = a.shape
    alpha = a[:, :, 3]
    add = ADD
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


def square_tail_tips(a):
    """The real Global 7500 tailplane ends in plain tips: remove the drawn teardrop pods
    (x 440-457 and 1316-1333, rows 120-200) and close each end with a short straight edge."""
    a = a.copy()
    a[120:200, 430:458] = 0
    a[120:200, 1316:1345] = 0
    for x in (458, 1315):
        col = a[120:200, x, 3]
        ys = np.nonzero(col > 40)[0] + 120
        top, bot = ys.min(), ys.max()
        for xx in (x, x + (1 if x < 900 else -1)):
            a[top:bot + 1, xx, :3] = 255
            a[top:bot + 1, xx, 3] = np.maximum(a[top:bot + 1, xx, 3], 235 if xx == x else 120)
    return a

im = Image.open(SRC).convert("RGBA"); a = np.array(im)
a = square_tail_tips(a)
ys, xs = np.nonzero(a[:, :, 3] > 20)
span, height = xs.max() - xs.min(), ys.max() - ys.min()
ADD = int(round((height * SPAN_M / HEIGHT_M - span) / 2))   # pixels to add to each wing
mid = a.shape[1] // 2
left, addl = widen_left(a[:, :mid])
right, addr = widen_left(a[:, mid:][:, ::-1])
res = np.concatenate([left, right[:, ::-1]], axis=1)
Image.fromarray(res).save(OUT, optimize=True)
ys, xs = np.nonzero(res[:, :, 3] > 20)
print(OUT, res.shape[1], "x", res.shape[0], "added", addl, addr, "span/height", round((xs.max() - xs.min()) / (ys.max() - ys.min()), 3), "target", round(SPAN_M / HEIGHT_M, 3))
