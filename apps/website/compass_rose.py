#!/usr/bin/env python3
"""Draw the hero compass rose as a fine-line SVG (site/assets/compass-rose.svg).
Rings, 2-degree ticks, longer ticks every 10 and 30 degrees, bearings every 30 degrees,
a 16-point star and cardinal letters, all in thin silver lines for a watermark."""
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "site", "assets", "compass-rose.svg")
C = 500  # centre in a 1000 x 1000 viewBox

def pt(r, deg):
    a = math.radians(deg - 90)          # 0 deg = north (up)
    return C + r * math.cos(a), C + r * math.sin(a)

def line(r1, r2, deg, w):
    x1, y1 = pt(r1, deg); x2, y2 = pt(r2, deg)
    return f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke-width="{w}"/>'

parts = []
for r, w in ((497, 0.9), (486, 0.5), (452, 0.5), (300, 0.4), (120, 0.4), (14, 0.6)):
    parts.append(f'<circle cx="{C}" cy="{C}" r="{r}" stroke-width="{w}"/>')
for d in range(0, 360, 2):
    if d % 30 == 0: parts.append(line(466, 497, d, 0.9))
    elif d % 10 == 0: parts.append(line(474, 497, d, 0.6))
    else: parts.append(line(486, 497, d, 0.4))

# 16-point star: long points on the cardinals, medium on the intercardinals, short on the rest
def star_point(deg, length, half_width):
    tip = pt(length, deg); l = pt(half_width, deg - 90); r = pt(half_width, deg + 90)
    return f'<path d="M{l[0]:.2f},{l[1]:.2f} L{tip[0]:.2f},{tip[1]:.2f} L{r[0]:.2f},{r[1]:.2f}" stroke-width="0.6"/>' + line(0, length, deg, 0.35)
for i in range(16):
    d = i * 22.5
    if i == 0: continue                  # no north point: it would run through the aircraft (Morten, 20 Oct 2026)
    if i % 4 == 0: parts.append(star_point(d, 440, 26))
    elif i % 2 == 0: parts.append(star_point(d, 330, 18))
    else: parts.append(star_point(d, 220, 11))

# bearings every 30 degrees (cardinals get letters instead), letters just inside the tick ring
text = []
for d in range(0, 360, 30):
    if d % 90 == 0: continue
    x, y = pt(458, d)
    text.append(f'<text x="{x:.1f}" y="{y:.1f}" transform="rotate({d} {x:.1f} {y:.1f})">{d:03d}</text>')
for d, ch in ((90, "E"), (180, "S"), (270, "W")):          # no N at the top: the aircraft's fin sits there
    x, y = pt(456, d)
    text.append(f'<text x="{x:.1f}" y="{y:.1f}" class="c" transform="rotate({d} {x:.1f} {y:.1f})">{ch}</text>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none" stroke="#dbe4ee" aria-hidden="true">
<style>text{{fill:#dbe4ee;stroke:none;font:500 9px 'Hanken Grotesk',system-ui,sans-serif;letter-spacing:1px;text-anchor:middle;dominant-baseline:central}} text.c{{font:600 14px Cinzel,serif;letter-spacing:0}}</style>
{''.join(parts)}
{''.join(text)}
</svg>'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(svg)
print(OUT, len(svg))
