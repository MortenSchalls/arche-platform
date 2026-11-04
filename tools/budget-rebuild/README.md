# Budget rebuild, 2 Nov 2026 (locked)

Final file: Final versions / Archē_Executive_Budget_Model_V2_2026-11-02.xlsx (on Morten's Mac). Source: the 31 Oct 2026 budget.
Order: rebuild.py (labels, broker plan rows 147-149, loop removed, spouse total) → views.py (hidden USD engine sheets,
visible sheets follow B141) → vsheet.py (V1/V2/V3 snapshot) → checks.py (Checks tab) → flatten.py (short chains so
Excel on the Mac does not run out of resources) → widths.py → inject.py (cached values) → chain.py (calcChain in
dependency order). Never re-save the deliverable through LibreOffice; LibreOffice is used only on separate check copies.
Audit: cyc.py (loops), ddepth.py (chain depth per setup), audit2.py (9 setups vs 31 Oct and views), sens2/sens3
(all inputs perturbed vs 31 Oct), xl4.py (second engine, `formulas` package). Morten confirms in his own Excel.
