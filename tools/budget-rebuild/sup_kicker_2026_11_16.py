"""Budget revision of 16 Nov 2026, second step (run after fee_2026_11_16.py, on its output):
  - Supervisor reward (Morten, 16 Nov 2026: "only each broker first 6 months, after that we need a way to control per
    event only"): Archē pays the named supervisor 3 points of the Archē fee from its own share on every booking of a
    broker in their first 6 months. Monthly USD row 70 = 3% x the Archē fee on broker bookings x the share of broker
    capacity that is in months 1-6 of tenure (rows 10-11 against rows 10-12). Counted on every first-6-month booking,
    also those the Director supervises (which stay with Archē), so the line is on the safe side. Bookings the Director
    later puts under supervision one by one are his decision and are not budgeted. V2 and V3 only; V1 stays locked.
    Into row 24 (with insurance, team leads and software) and Annual row 21.
  - Director kicker (Morten, 16 Nov 2026: "what if we do 1,5 % kicker for director" ... "yes"): 1.5% of operating
    EBITDA in V2 and V3 (was 3%); V1 keeps 3% as locked. Inputs B51 = CHOOSE(version, E51, F51, G51).
Usage: python3 sup_kicker_2026_11_16.py <workbook in> <workbook out>"""
import sys, copy, openpyxl
from openpyxl.utils import get_column_letter as L

src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src)
I = wb['Inputs']; MU = wb['Monthly USD']; MV = wb['Monthly']; AU = wb['Annual USD']; AV = wb['Annual']
V = wb['V1 vs V2 vs V3']; C = wb['Checks']

def style(dst, srccell):
    dst._style = copy.copy(srccell._style)

# 1. Director kicker per version
I['E51'] = 0.03; I['F51'] = 0.015; I['G51'] = 0.015
for c in 'EFG':
    style(I[f'{c}51'], I[f'{c}6']); I[f'{c}51'].number_format = '0.0%'
I['B51'] = '=CHOOSE(Inputs!$B$3,E51,F51,G51)'
I['C51'] = ('Director package. Paid annually from profit. V1: 3% (locked plan).  |  V2 and V3: 1.5% (Morten 16 Nov 2026: '
            '"what if we do 1,5 % kicker for director, is that not more in line with what we would be able to offer for a '
            'position like that?" ... "yes"). Versions in E51:G51.')

# 2. Supervisor reward inputs (rows 161-163)
rows = [
    (161, 'Supervisor reward (Morten, 16 Nov 2026)', None, None),
    (162, 'Supervisor reward (% of the Archē fee on a broker\'s bookings in their first 6 months)', 0.03,
     'Morten 16 Nov 2026: "only each broker first 6 months, after that we need a way to control per event only". Paid by '
     'Archē from its own share to the named supervisor, never taken from the broker\'s commission (agreement Schedule 1). '
     'Counted on every booking of a broker in tenure months 1-6 (Monthly rows 10-11); bookings the Director puts under '
     'supervision later are case by case and not budgeted. V2 and V3 only.'),
    (163, 'Supervised months per broker', 6, 'Months 1-6 of each broker\'s tenure (the budget uses tenure rows 10 and 11, months 1-3 and 4-6).'),
]
for r, a, b, c in rows:
    I[f'A{r}'] = a; style(I[f'A{r}'], I['A157'] if b is not None else I['A156'])
    if b is not None:
        I[f'B{r}'] = b; style(I[f'B{r}'], I['B157'])
        I[f'B{r}'].number_format = '0.0%' if isinstance(b, float) else '#,##0'
        I[f'C{r}'] = c; style(I[f'C{r}'], I['C157'])

# 3. Monthly USD row 70, into row 24; Annual row 21
MU['A70'] = 'Supervisor reward: 3% of the Archē fee on bookings of brokers in their first 6 months (paid by Archē); V2 and V3 only'
MV['A70'] = MU['A70'].value
style(MU['A70'], MU['A63']); style(MV['A70'], MV['A63'])
for col in range(2, 122):
    x = L(col)
    cap = f'({x}10*Inputs!$B$8+{x}11*Inputs!$B$9+{x}12*Inputs!$B$10)'
    new = f'({x}10*Inputs!$B$8+{x}11*Inputs!$B$9)'
    MU[f'{x}70'] = f'=IF(OR(Inputs!$B$3=1,{cap}=0),0,{x}19*Inputs!$B$162*{new}/{cap})'
    style(MU[f'{x}70'], MU[f'{x}63'])
    MV[f'{x}70'] = f"='Monthly USD'!{x}70*Inputs!$B$143"; style(MV[f'{x}70'], MV[f'{x}63'])
    f = MU[f'{x}24'].value
    assert f.endswith(f'+{x}63'), (x, f)
    MU[f'{x}24'] = f + f'+{x}70'
MU['A24'] = 'Insurance, team leads, software and supervisor reward'
MV['A24'] = MU['A24'].value
for yc in range(2, 12):
    a = L(yc); m1 = L(2 + (yc - 2) * 12); m2 = L(13 + (yc - 2) * 12)
    AU[f'{a}21'] = f"=Inputs!$B$50+SUM('Monthly USD'!{m1}63:{m2}63)+SUM('Monthly USD'!{m1}70:{m2}70)"
for ws in (AU, AV):
    ws['A21'] = 'Insurance allowance, software (Avinode, Microsoft 365) and supervisor reward'

# 4. Check: supervisor reward is 3% of the Archē fee on first-6-month broker bookings at most, and none in V1
r = 17  # checks are rows 12-16 (fee_2026_11_16.py), its note in row 18
assert C['A17'].value is None and str(C['A18'].value).startswith('Each check'), (C['A17'].value, C['A18'].value)
note = C['A18'].value; C['A18'] = None
C[f'A{r}'] = 'Supervisor reward: none in V1; never above the set % of the Archē fee on broker bookings'
C[f'B{r}'] = ('=IF(Inputs!$B$3=1,IF(SUM(\'Monthly USD\'!B70:DQ70)=0,"OK","CHECK"),'
              'IF(SUM(\'Monthly USD\'!B70:DQ70)<=Inputs!$B$162*SUM(\'Monthly USD\'!B19:DQ19)+1,"OK","CHECK"))')
style(C[f'A{r}'], C['A12']); style(C[f'B{r}'], C['B12'])
C[f'A{r+2}'] = (note or '') + ' Supervisor reward and Director kicker 1.5% (V2, V3) added 16 Nov 2026.'
style(C[f'A{r+2}'], C['A10'])
V['A2'] = (str(V['A2'].value or '').replace('software per user,', 'software per user, supervisor reward, Director kicker 1.5% in V2 and V3,'))
# 5. Starting funds and the dividend split (Morten, 16 Nov 2026: "the 19K is full cost of all aspects, from incorporation
#    to Avinode. i am 100% shareholder, but will split my dividend personally with my wife, keep her on the budget for me
#    to see the dividend split"). Labels and notes only; no figure changes.
I['A53'] = 'Starting funds (Morten\u2019s own money for every set-up cost)'
I['C53'] = ('Morten 16 Nov 2026: USD 19,000 covers every set-up cost, from incorporation to Avinode. The company was '
            'registered on 16 Nov 2026 (Arche Aviation Pte. Ltd., UEN 202652508N) with paid-up share capital of SGD 100; '
            'how the rest is put in (more share capital or a loan from Morten) is for the accountant to record.')
I['C101'] = str(I['C101'].value).replace('(Inputs B53, paid-up capital)', '(Inputs B53, starting funds)')
I['A104'] = 'Wife\u2019s share of Morten\u2019s dividend (his personal split)'
I['C104'] = ('Morten 16 Nov 2026: Morten is the only shareholder (100 shares). The company pays the whole dividend to him; '
             'he shares it with his wife personally. Her 50% is shown so he can see the split; it is not a company payment.')
C['A15'] = 'Cash ties to profit: dividends + year-10 cash = net profit + starting funds (USD)'
S = wb['Summary']
for ws in (AU, AV):
    ws['A31'] = ('=IF(Inputs!$B$101=1,"Dividends paid to the shareholder, Morten (quarterly)",'
                 '"Dividends paid to the shareholder, Morten (monthly safe draw)")')
    ws['A59'] = 'Morten\u2019s part of his dividend (his personal split)'
    ws['A60'] = 'His wife\u2019s part of Morten\u2019s dividend (his personal split)'
S['A10'] = '  Morten\u2019s part (personal split)'; S['A11'] = '  His wife\u2019s part (personal split)'
S['A27'] = '  Morten\u2019s part'; S['A28'] = '  his wife\u2019s part'
MU['A68'] = 'Morten\u2019s part of his dividend (USD)'; MU['A69'] = 'His wife\u2019s part of Morten\u2019s dividend (USD)'
MV['A68'] = '="Morten\u2019s part of his dividend ("&Inputs!$B$144&")"'
MV['A69'] = '="His wife\u2019s part of Morten\u2019s dividend ("&Inputs!$B$144&")"'
wb.save(out)
print('saved', out)
