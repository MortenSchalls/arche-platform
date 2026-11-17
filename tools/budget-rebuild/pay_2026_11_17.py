"""Budget revision of 17 Nov 2026, third step (run after sup_kicker_2026_11_16.py, on its output):
Payment and conversion costs (Morten, 17 Nov 2026: "Should conversion and card fees be passed through as direct trip
costs? YES"; "Should I add a "Payment and conversion costs" line to the budget? YES and update budget and files").
  - Currency conversion for the operator and card fees are charged to the client inside the price (direct trip costs,
    cost / 0.91), so they cost Archē nothing and are not in this line.
  - What Archē pays itself: the bank transfers to the operator (Inputs B166 per trip: two payments, deposit and balance,
    at about USD 20 each by SWIFT) and converting pay sent abroad into the local currency (Inputs B167 x broker base
    salaries, broker commission, the Director's salary and the supervisor reward).
Monthly USD row 102, into row 24 (with insurance, software and the supervisor reward) and Annual row 21. V2 and V3
only; V1 stays locked. Checks row 18.
Usage: python3 pay_2026_11_17.py <workbook in> <workbook out>"""
import sys, copy, openpyxl
from openpyxl.utils import get_column_letter as L

src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src)
I = wb['Inputs']; MU = wb['Monthly USD']; MV = wb['Monthly']; AU = wb['Annual USD']; AV = wb['Annual']
V = wb['V1 vs V2 vs V3']; C = wb['Checks']

def style(dst, srccell):
    dst._style = copy.copy(srccell._style)

# 1. Inputs rows 165-167
assert I['A165'].value is None and I['A166'].value is None and I['A167'].value is None
rows = [
    (165, 'Payment and conversion costs (Morten, 17 Nov 2026)', None, None, None),
    (166, 'Bank transfers to the operator (USD per trip: deposit and balance)', 40, '#,##0',
     'Morten 17 Nov 2026: "YES and update budget and files". Two payments to the operator per trip (deposit and balance) '
     'at about USD 20 each by SWIFT. Currency conversion for the operator and card fees are not here: they are direct '
     'trip costs inside the client price (CLAUDE.md, manual 9.3). V2 and V3 only.'),
    (167, 'Conversion of pay sent abroad (% of broker pay, the Director\'s salary and the supervisor reward)', 0.004, '0.0%',
     'Pay to brokers and the Director outside Singapore is converted from USD into the local currency; 0.4% is the '
     'business-account rate for major currencies (Airwallex, 17 Nov 2026). Lower once the payment provider is agreed.'),
]
for r, a, b, fmt, c in rows:
    I[f'A{r}'] = a; style(I[f'A{r}'], I['A161'] if b is None else I['A162'])
    if b is not None:
        I[f'B{r}'] = b; style(I[f'B{r}'], I['B162']); I[f'B{r}'].number_format = fmt
        I[f'C{r}'] = c; style(I[f'C{r}'], I['C162'])

# 2. Monthly USD row 102 (Monthly row 102 in the shown currency), into row 24; Annual row 21
assert MU['A102'].value is None
MU['A102'] = 'Payment and conversion costs paid by Archē (bank transfers to operators, conversion of pay sent abroad); V2 and V3 only'
MV['A102'] = MU['A102'].value
style(MU['A102'], MU['A70']); style(MV['A102'], MV['A70'])
for col in range(2, 122):
    x = L(col)
    MU[f'{x}102'] = (f'=IF(Inputs!$B$3=1,0,({x}16+{x}37)*{x}57*Inputs!$B$166'
                     f'+({x}20+{x}21+{x}22+{x}70)*Inputs!$B$167)')
    style(MU[f'{x}102'], MU[f'{x}70'])
    MV[f'{x}102'] = f"='Monthly USD'!{x}102*Inputs!$B$143"; style(MV[f'{x}102'], MV[f'{x}70'])
    f = MU[f'{x}24'].value
    assert f.endswith(f'+{x}70'), (x, f)
    MU[f'{x}24'] = f + f'+{x}102'
MU['A24'] = 'Insurance, team leads, software, supervisor reward and payment costs'
MV['A24'] = MU['A24'].value
for yc in range(2, 12):
    a = L(yc); m1 = L(2 + (yc - 2) * 12); m2 = L(13 + (yc - 2) * 12)
    f = AU[f'{a}21'].value
    assert f.endswith(f"SUM('Monthly USD'!{m1}70:{m2}70)"), (a, f)
    AU[f'{a}21'] = f + f"+SUM('Monthly USD'!{m1}102:{m2}102)"
for ws in (AU, AV):
    ws['A21'] = 'Insurance allowance, software (Avinode, Microsoft 365), supervisor reward and payment costs'

# 3. Check row 18: none in V1; in V2 and V3 present whenever trips are booked, and only Archē's own costs
assert C['A18'].value is None and str(C['A19'].value).startswith('Each check'), (C['A18'].value, C['A19'].value)
C['A18'] = 'Payment and conversion costs: none in V1; in V2 and V3 at least the bank transfers for every trip booked'
C['B18'] = ('=IF(Inputs!$B$3=1,IF(SUM(\'Monthly USD\'!B102:DQ102)=0,"OK","CHECK"),'
            'IF(SUM(\'Monthly USD\'!B102:DQ102)+1>=Inputs!$B$166*SUMPRODUCT(\'Monthly USD\'!B16:DQ16+\'Monthly USD\'!B37:DQ37,\'Monthly USD\'!B57:DQ57),"OK","CHECK"))')
style(C['A18'], C['A17']); style(C['B18'], C['B17'])
C['A19'] = str(C['A19'].value) + ' Payment and conversion costs added 17 Nov 2026.'
V['A2'] = str(V['A2'].value or '').replace('supervisor reward,', 'supervisor reward, payment and conversion costs,').replace('inputs of 16 Nov 2026', 'inputs of 17 Nov 2026')
wb.save(out)
print('saved', out)
