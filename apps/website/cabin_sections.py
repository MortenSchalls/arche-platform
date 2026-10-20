#!/usr/bin/env python3
"""Draw the aircraft-finder pictures: a cabin cross-section of each type, to scale, with a 1.80 m person.

    python3 apps/website/cabin_sections.py        # writes apps/website/images/ac-<id>.webp

Replaces the unlicensed cabin photos (Morten, 20 Oct 2026). Every figure comes from the source named
in SOURCES and in docs/IMAGE-REGISTER.md. All types use the same scale, so they compare honestly.
The aircraft name and specs are already printed next to the picture, so the picture carries only the drawing,
the two measurements and a small source line.
"""
import base64, os, math

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "images")
FONTS = os.path.join(HERE, "tools", "fonts")

# id: (cabin height m, width m, height imperial, width imperial, source)
SOURCES = {
    "cj3":       (1.45, 1.47, "4 ft 9 in", "4 ft 10 in", "Cabin figures: GlobalAir.com, Citation CJ3 Gen2 specifications"),
    "phenom300": (1.50, 1.55, "4 ft 11 in", "5 ft 1 in", "Cabin figures: Embraer Phenom 300E brochure 2025"),
    "pc24":      (1.55, 1.69, "5 ft 1 in", "5 ft 7 in", "Cabin figures: Pilatus PC-24 “Just the facts”"),
    "xls":       (1.73, 1.68, "5 ft 8 in", "5 ft 6 in", "Cabin figures: GlobalAir.com, Citation XLS Gen2 specifications"),
    "cl350":     (1.83, 2.19, "6 ft 0 in", "7 ft 2 in", "Cabin figures: Bombardier Challenger 350 factsheet"),
    "cl650":     (1.83, 2.41, "6 ft 0 in", "7 ft 11 in", "Cabin figures: Bombardier Challenger 650 factsheet"),
    "f8x":       (1.88, 2.34, "6 ft 2 in", "7 ft 8 in", "Cabin figures: Dassault Aviation, Falcon 8X"),
    "g550":      (1.88, 2.24, "6 ft 2 in", "7 ft 4 in", "Cabin figures: GlobalAir.com, Gulfstream G550 specifications"),
    "g650":      (1.96, 2.59, "6 ft 5 in", "8 ft 6 in", "Cabin figures: GlobalSecurity.org, Gulfstream G650"),
    "g7500":     (1.88, 2.44, "6 ft 2 in", "8 ft 0 in", "Cabin figures: Bombardier Global 7500 factsheet"),
}

W, H = 2400, 1350
S = 240                 # pixels per metre, the same for every type
PERSON = 1.80
FLOOR = 800             # floor line; the page fades the outer 16% left/right, 14% top and 20% bottom
LINE, SOFT, ACCENT, INK, MUTED = "#dbe4ee", "#93a0b0", "#a9bdd4", "#f3f5f8", "#a3a9b1"

def font_face():
    css = ""
    for w in (400, 500, 600):
        b = base64.b64encode(open(os.path.join(FONTS, f"hanken-grotesk-latin-{w}-normal.woff2"), "rb").read()).decode()
        css += f"@font-face{{font-family:'HG';font-weight:{w};src:url(data:font/woff2;base64,{b}) format('woff2')}}"
    return css

def text(x, y, s, size, fill=INK, weight=500, anchor="middle", ls=0):
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}">{s}</text>'

def person(x, floor):
    """Simple standing figure, 1.80 m tall, feet on the floor line."""
    k = PERSON * S / 180.0          # 1 unit = 1 cm
    top = floor - 180 * k
    head = f'<circle cx="{x:.1f}" cy="{top + 11.5 * k:.1f}" r="{11 * k:.1f}"/>'
    p = [(-21, 27), (21, 27), (24, 30), (25, 104), (19, 104), (17, 64), (14, 64), (13, 180), (2, 180), (1, 108),
         (-1, 108), (-2, 180), (-13, 180), (-14, 64), (-17, 64), (-19, 104), (-25, 104), (-24, 30)]
    d = "M" + " L".join(f"{x + a * k:.1f},{top + b * k:.1f}" for a, b in p) + " Z"
    return head + f'<path d="{d}"/>'

def drawing(h, w, h_imp, w_imp, src):
    cx = 1260
    ch, cw = h * S, w * S
    # cabin: an ellipse cut by a flat floor that sits below its centre (as in real business-jet sections)
    # fuselages are near-round: the vertical semi-axis follows the width, and the floor sits low (a dropped
    # aisle on the small jets), so the floor-to-ceiling height matches the published figure
    a = cw / 2; b = max(a, ch / 1.85); d = ch - b     # semi-axes; floor d below the centre
    cy = FLOOR - d
    fx = a * math.sqrt(1 - (d / b) ** 2)             # half floor width
    cabin = f'M{cx - fx:.1f},{FLOOR} A{a:.1f},{b:.1f} 0 1 1 {cx + fx:.1f},{FLOOR} Z'
    skin = 0.17 * S                                  # wall, lining and structure, drawn for look only
    ox, oy = a + skin, b + skin
    under = 0.06 * S
    px = cx - ox - 0.62 * S                          # person stands beside the section, on the same floor line
    head_y = FLOOR - PERSON * S
    ceiling = FLOOR - ch
    hx = cx + ox + 0.42 * S                          # height dimension, right of the fuselage
    tick = 16
    fits = h >= PERSON
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
         f'<style>{font_face()} text{{font-family:HG,sans-serif}}</style>',
         '<defs><radialGradient id="bg" cx="52%" cy="52%" r="62%"><stop offset="0" stop-color="#40434a"/><stop offset="1" stop-color="#373a40"/></radialGradient>'
         f'<clipPath id="cab"><path d="{cabin}"/></clipPath></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#bg)"/>',
         # fuselage skin and cabin lining
         f'<g fill="none" stroke="{LINE}">',
         f'<ellipse cx="{cx}" cy="{cy:.1f}" rx="{ox:.1f}" ry="{oy:.1f}" stroke-width="3.2"/>',
         f'<ellipse cx="{cx}" cy="{cy:.1f}" rx="{ox - 9:.1f}" ry="{oy - 9:.1f}" stroke-width="1" stroke-opacity="0.45"/>',
         f'<path d="{cabin}" stroke-width="2.2" stroke-opacity="0.9" fill="#ffffff" fill-opacity="0.035"/>',
         f'<line x1="{cx - fx:.1f}" y1="{FLOOR + under:.1f}" x2="{cx + fx:.1f}" y2="{FLOOR + under:.1f}" stroke-width="1" stroke-opacity="0.4"/>',
         '</g>',
         # floor line carried out to the person
         f'<line x1="{px - 0.32 * S:.1f}" y1="{FLOOR}" x2="{cx - fx:.1f}" y2="{FLOOR}" stroke="{SOFT}" stroke-width="1.6" stroke-dasharray="3 9"/>',
         # 1.80 m reference line from the person's head across the cabin
         f'<line x1="{px - 0.25 * S:.1f}" y1="{head_y:.1f}" x2="{cx + ox:.1f}" y2="{head_y:.1f}" stroke="{ACCENT}" stroke-width="1.6" stroke-dasharray="10 9" stroke-opacity="0.8"/>',
         text(px - 0.30 * S, head_y - 18, "1.80 m", 34, ACCENT, 500, "start", 1),
         f'<g fill="{ACCENT}" fill-opacity="0.6">{person(px, FLOOR)}</g>',
         # height dimension
         f'<g stroke="{ACCENT}" stroke-width="2">',
         f'<line x1="{cx:.1f}" y1="{ceiling:.1f}" x2="{hx + tick:.1f}" y2="{ceiling:.1f}" stroke-width="1" stroke-dasharray="3 7" stroke-opacity="0.7"/>',
         f'<line x1="{cx + fx:.1f}" y1="{FLOOR}" x2="{hx + tick:.1f}" y2="{FLOOR}" stroke-width="1" stroke-dasharray="3 7" stroke-opacity="0.7"/>',
         f'<line x1="{hx:.1f}" y1="{ceiling:.1f}" x2="{hx:.1f}" y2="{FLOOR}"/>',
         f'<line x1="{hx - tick:.1f}" y1="{ceiling:.1f}" x2="{hx + tick:.1f}" y2="{ceiling:.1f}"/>',
         f'<line x1="{hx - tick:.1f}" y1="{FLOOR}" x2="{hx + tick:.1f}" y2="{FLOOR}"/>',
         '</g>',
         text(hx + 44, (ceiling + FLOOR) / 2 - 26, "CABIN HEIGHT", 26, MUTED, 600, "start", 4),
         text(hx + 44, (ceiling + FLOOR) / 2 + 34, f"{h:.2f} m", 66, INK, 500, "start"),
         text(hx + 44, (ceiling + FLOOR) / 2 + 80, h_imp, 32, MUTED, 400, "start"),
         # width dimension, inside the cabin at its widest point
         f'<g stroke="{ACCENT}" stroke-width="2">',
         f'<line x1="{cx - a:.1f}" y1="{cy:.1f}" x2="{cx + a:.1f}" y2="{cy:.1f}"/>',
         f'<line x1="{cx - a:.1f}" y1="{cy - tick:.1f}" x2="{cx - a:.1f}" y2="{cy + tick:.1f}"/>',
         f'<line x1="{cx + a:.1f}" y1="{cy - tick:.1f}" x2="{cx + a:.1f}" y2="{cy + tick:.1f}"/>',
         '</g>',
         text(cx, cy - 86, "CABIN WIDTH", 26, MUTED, 600, "middle", 4),
         text(cx, cy - 22, f"{w:.2f} m", 66, INK, 500),
         text(cx, cy + 50, w_imp, 32, MUTED, 400),
         # one quiet line: what the drawing shows, and where the figures come from
         text(1200, 1052, ("Stand-up cabin for a 1.80 m person" if fits else "Seated cabin: a 1.80 m person stoops to move about")
              + " · drawn to scale", 32, "#c6cbd2", 400, "middle", 1),
         text(1200, 1100, src, 26, "#8f959d", 400, "middle", 1),
         '</svg>']
    return "\n".join(o)

def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(HERE, "tools", ".render.png")
    with sync_playwright() as pw:
        br = pw.chromium.launch(); pg = br.new_page(viewport={"width": W, "height": H})
        for k, (h, w, hi, wi, src) in SOURCES.items():
            pg.set_content(f'<html><body style="margin:0">{drawing(h, w, hi, wi, src)}</body></html>')
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(150)
            pg.screenshot(path=tmp)
            Image.open(tmp).convert("RGB").save(os.path.join(OUT, f"ac-{k}.webp"), "WEBP", quality=86, method=6)
            print("  ac-" + k)
        br.close()
    os.remove(tmp)

if __name__ == "__main__":
    main()
