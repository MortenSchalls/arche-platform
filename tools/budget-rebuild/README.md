# Budget rebuild, 2 Nov 2026 (locked)

Final file: Final versions / Archē_Executive_Budget_Model_V2_2026-11-02.xlsx (on Morten's Mac). Source: the 31 Oct 2026 budget.
Order: rebuild.py (labels, broker plan rows 147-149, loop removed, spouse total) → views.py (hidden USD engine sheets,
visible sheets follow B141) → vsheet.py (V1/V2/V3 snapshot) → checks.py (Checks tab) → flatten.py (short chains so
Excel on the Mac does not run out of resources) → widths.py → inject.py (cached values) → chain.py (calcChain in
dependency order). Never re-save the deliverable through LibreOffice; LibreOffice is used only on separate check copies.
Audit: cyc.py (loops), ddepth.py (chain depth per setup), audit2.py (9 setups vs 31 Oct and views), sens2/sens3
(all inputs perturbed vs 31 Oct), xl4.py (second engine, `formulas` package). Morten confirms in his own Excel.

## Revisions of 16 and 17 Nov 2026
Run in order on the previous final file: fee_2026_11_16.py (Archē fee 9%) → sup_kicker_2026_11_16.py (supervisor reward,
Director kicker 1.5%, no override, starting funds and dividend labels) → pay_2026_11_17.py (Payment and conversion costs:
Inputs rows 165-167, Monthly row 102, Annual row 21, Checks row 18) → snapshot of the three versions, recalculated
values (inject) and chain.py, as above. 17 Nov 2026 result: 10-year net USD 126,696,961, Year 1 3,362,665; rebuilt
independently in Python to the cent; every check OK in V1, V2, V3 and THB.
