# Rebuild of the 31 Oct 2026 budget with the 2 Nov fixes. Source: oct31.xlsx (untouched). Output: rebuild_formulas.xlsx
import openpyxl, copy, re
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles.differential import DifferentialStyle
from openpyxl.styles.numbers import NumberFormat
wb=openpyxl.load_workbook('oct31.xlsx')
I=wb['Inputs']; M=wb['Monthly']; D=wb['Demand']; S=wb['Summary']
# 1. Monthly labels: rows 3–57 sat one row above their figures
old={r:M.cell(r,1).value for r in range(3,58)}
new={3:None,4:'Year',5:'Month'}
for r in range(6,25): new[r]=old[r-1]
new.update({25:old[25],26:'Annual bonuses & tax paid (once a year)',27:'Net cash flow',
 28:'Cash balance before any dividends (cumulative, incl. starting capital)',
 47:"Cash before this month's dividend (incl. starting capital)",48:old[47],
 55:'Total staff (sellers, operations, 24/7 desk, team leads)',56:old[55],57:old[56]})
for r,v in new.items(): M.cell(r,1).value=v
M['A2']='Row 6 = new brokers hired that month; row 7 = brokers active. Every seller ramps 4 → 6 → 8 booking units from their own start month.'
# 2. Broker plan on Inputs rows 146–149, Demand row 23 from them
for r,a,b,c in [(146,'Broker plan (Morten, 31 Oct 2026)',None,None),
  (147,'Broker plan: brokers in month 1',5,'Used when Inputs B138 = 1. Demand row 23 follows rows 147–149.'),
  (148,'Broker plan: brokers added each month',5,'Morten 31 Oct 2026: +5 a month.'),
  (149,'Broker plan: maximum brokers',100,'Morten 31 Oct 2026: up to 100.')]:
  I.cell(r,1,a)
  if b is not None: I.cell(r,2,b)
  if c: I.cell(r,3,c)
  for col in (1,2,3): I.cell(r,col)._style=copy.copy((I.cell(140,col) if r==146 else I.cell(138,col))._style)
I['C138']='Uses the plan in rows 147–149 (5 brokers in month 1, +5 a month up to 100; Morten, 31 Oct 2026). Leavers are replaced to stay on plan. Bookings = what the brokers can sell (Inputs B77), not capped by market demand.'
D['A23']='Broker plan: brokers active (from Inputs rows 147–149; used when Inputs B138 = 1)'
for c in range(2,122): D.cell(23,c,f'=MIN(Inputs!$B$149,Inputs!$B$147+Inputs!$B$148*({L(c)}$4-1))')
# 3. Circular reference: hiring demand built from Inputs only
for c in range(2,122):
  x=L(c); t=f'MAX(0,{x}$4-Inputs!$B$11+1)'
  D.cell(22,c,f'=IF(Inputs!$B$131=1,{x}7,MAX(0,{x}7-IF({t}=0,0,IF({t}<=3,Inputs!$B$8,IF({t}<=6,Inputs!$B$9,Inputs!$B$10)))))')
D['A22']="Demand used for hiring (units). Inputs B131 = 1: director bookings ignored; otherwise the director's fixed-start ramp (Inputs B11) is deducted. Built from Inputs only, so the formulas never loop."
# 4. Summary row 13 was converted twice
for c in range(2,12): S.cell(13,c,f'={L(c)}10+{L(c)}12')
# 5. dropdowns
for cell,lst in (('B3','"1,2,3"'),('B138','"0,1"')):
  dv=DataValidation(type='list',formula1=lst,allow_blank=False); I.add_data_validation(dv); dv.add(cell)
wb.save('step5.xlsx')
print('saved step5')
