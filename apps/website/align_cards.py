"""Cards side by side line up (Morten, 13 Nov 2026: "se how the text jumps up and down on the pictures, now i need you
to check all pages one more time"). When one card's title, date or label runs to an extra line, the texts below it (or,
on photo cards with the words at the bottom, the title itself) no longer start at the same height as in the cards
next to it. Each row of cards becomes a CSS subgrid, so the label, title and text lines are shared across the row:
every card in a row starts each text at the same height, whatever the language or screen width. One stylesheet rule
set, appended to /nav.css (loaded on every page) after nav.py writes it. The layout audit (tools/layout_audit.js,
"misaligned") fails any row of cards whose texts do not start at the same height.
Run by build.py after nav.run()."""
import os
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site")

# Rows are found by their section id and position (the page script renders the cards; the audit checks the result).
SUB = "display:grid!important;grid-template-rows:subgrid!important;align-content:start;align-items:baseline"
CSS = f"""
/* align_cards.py: cards in a row share their text lines */
#why>div:nth-child(3)>*{{{SUB};grid-row:span 3;row-gap:14px!important}}
#services-detail>div:nth-child(1)>div:nth-child(4)>*{{{SUB};grid-row:span 8;row-gap:0!important}}
#dates>div:nth-child(1)>div:nth-child(4)>*{{{SUB};grid-row:span 3;row-gap:0!important}}
#contact>div:nth-child(1)>div:nth-child(3)>*{{{SUB};grid-row:span 5;row-gap:12px!important}}
#fleet>div:nth-child(1)>div:nth-child(3)>div:nth-child(2)>div:nth-child(12)>*{{{SUB};grid-row:span 2;row-gap:8px!important}}
.hub .grid>a{{{SUB};grid-row:span 2;row-gap:0!important}}
.hub .grid>a.ph{{grid-row:span 3}}
/* the office tabs: the first column's tab label sits level with the labels beside it */
#contact>div:nth-child(1)>div:nth-child(4)>*:first-child>button:first-child{{padding-top:2px!important}}
/* photo cards with the words at the bottom: a picture row on top, then the shared text rows */
#discover .ae-tile{{{SUB};grid-row:span 4;row-gap:0!important;min-height:0!important}}
#discover .ae-tile::before{{content:"";grid-row:1;min-height:clamp(150px,19vw,300px)}}
#discover .ae-tile>span:last-child{{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;grid-row:2/span 3;{SUB};row-gap:0!important;padding:0 28px 26px}}
#services>div:nth-child(2)>*{{{SUB};grid-row:span 4;row-gap:0!important;aspect-ratio:auto!important}}
#services>div:nth-child(2)>*::before{{content:"";grid-row:1;min-height:max(260px,26vw)}}
#services>div:nth-child(2)>*>image-slot{{position:absolute!important;inset:0;width:100%;height:100%}}
#services>div:nth-child(2)>*>div:last-child{{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;grid-row:2/span 3;{SUB};row-gap:12px!important;padding:0 32px 32px}}
.ar-trio .ar-g>figure{{{SUB};grid-row:span 3;row-gap:0!important}}
.ar-trio .ar-g>figure>figcaption{{grid-row:2/span 2;{SUB};row-gap:0!important}}
/* phones: the swiped rows are grids too, so the cards beside each other still share their lines */
@media (max-width:760px){{
#services>div:nth-child(2){{display:grid!important;grid-auto-flow:column;grid-auto-columns:80%;grid-template-columns:none!important}}
.ar-trio .ar-g{{display:grid!important;grid-auto-flow:column;grid-auto-columns:76%;grid-template-columns:none!important}}
#discover .ae-tile::before{{min-height:96px}}
#discover .ae-tile>span:last-child{{padding:0 14px 14px}}
}}
"""

def run():
    p = os.path.join(SITE, "nav.css"); t = open(p, encoding="utf-8").read()
    i = t.find("\n/* align_cards.py"); t = t if i < 0 else t[:i]
    open(p, "w", encoding="utf-8").write(t + CSS)
    print("  cards: rows share their text lines (subgrid) on every page")

if __name__ == "__main__":
    run()
