"""Budget revision of 16 Nov 2026 (Morten, 16 Nov 2026):
  - "chenge to 9% fee of total booking value, lets not calculate margin" / "we do not calculate margin of 9%, but charge 9% fixed":
    one input, the Archē fee = 9% of total booking value (Inputs B96); the margin mix (rows 97-98) is gone. V1 keeps its 7%.
  - "check again, should be in as the fee is 118 usd per month, also the Office 365 fee should be in": a monthly software line,
    Avinode (USD 740 a month incl. one user + USD 118 per extra user; one user per broker and the Director) and Microsoft 365
    (one mailbox per person). Monthly USD row 63, inside "Insurance, team leads and software" (row 24) and Annual row 21.
  - corrections from the audit of 16 Nov 2026: the 10-year column of the V1/V2/V3 page adds its own years (was typed in);
    Summary column L adds the shown years (was converted to THB twice); commission rates read from Inputs (were typed into
    the formula); labels (Archē fee, net profit, dividends monthly, broker plan) and stale notes; more checks.
  - kept as Morten said: Years 1-3 other operating costs and the broker plan (demand is not known yet).
Usage: python3 fee_2026_11_16.py <budget in> <formula workbook out>
Then: values from LibreOffice on a separate copy (calc), vsheet values, inject.py-style values, chain.py calcChain."""
import sys, copy, re, openpyxl
from openpyxl.utils import get_column_letter as L

src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src)
I = wb['Inputs']; MU = wb['Monthly USD']; MV = wb['Monthly']; AU = wb['Annual USD']; AV = wb['Annual']
S = wb['Summary']; V = wb['V1 vs V2 vs V3']; C = wb['Checks']; CV = wb['Cover']

def style(dst, srccell):
    dst._style = copy.copy(srccell._style)

# 1. Archē fee: one input, fixed 9% of total booking value
I['A6'] = 'Archē fee (% of total booking value, fixed)'
I['C6'] = ('V1: 7.0% (locked plan of 8 Oct 2026).  |  V2 and V3: Archē charges a fixed fee of 9% of the total booking value '
           '(the price the client pays = operator price + direct trip costs ÷ 0.91), Inputs B96. Morten 16 Nov 2026: '
           '"we do not calculate margin of 9%, but charge 9% fixed".')
I['F6'] = '=B96'; I['G6'] = '=B96'
I['A95'] = 'Archē fee (Versions 2 and 3)'
I['A96'] = 'Archē fee (% of total booking value, fixed)'
I['B96'] = 0.09
I['C96'] = ('Morten 16 Nov 2026: a fixed 9% of the total booking value on every booking (client price = operator price + '
            'direct trip costs ÷ 0.91). A different rate on a trip only by Morten\'s decision with the reason recorded '
            '(rule of 29 Oct 2026); the budget uses 9% throughout.')
for r in (97, 98):
    for c in 'ABC': I[f'{c}{r}'] = None

# 2. Software per user (Inputs rows 151-158) and commission rates as inputs
rows = [
    (151, 'Software per user (Morten, 16 Nov 2026)', None, None),
    (152, 'Avinode subscription (USD per month, includes one user)', 740, 'Avinode offer of 26 Oct 2026: Starter Broker USD 740 a month (launch plan B1).'),
    (153, 'Avinode extra user (USD per month)', 118, 'Avinode offer of 26 Oct 2026: USD 118 per extra user a month. One user per broker and one for the Director (launch plan B4).'),
    (154, 'Microsoft 365 mailbox (USD per person per month)', 6, 'Assumption (Morten did not give the price): Microsoft 365 Email Essentials from GoDaddy, USD 1.99 a month in the first year (GoDaddy US, Oct 2026); the renewal price is not published, so USD 6 is used. One mailbox per broker, the Director and every staff member.'),
    (156, 'Broker commission (Versions 2 and 3)', None, None),
    (157, 'Commission on the first standard bookings each month (% of the Archē fee)', 0.27, 'Broker agreement Schedule 1 and the commission offer: 27% of the Archē fee on the first 8 standard bookings in the month.'),
    (158, 'Commission after that (% of the Archē fee)', 0.35, 'Broker agreement Schedule 1: 35% from the 9th standard booking in the month.'),
    (159, 'Standard bookings a month at the first rate', 8, 'Broker agreement Schedule 1: bookings 1 to 8 in the calendar month. The budget applies the rates to the average broker; brokers above 8 a month earn more.'),
]
for r, a, b, c in rows:
    I[f'A{r}'] = a; style(I[f'A{r}'], I['A147'] if b is not None else I['A146'])
    if b is not None:
        I[f'B{r}'] = b; style(I[f'B{r}'], I['B147'])
        if isinstance(b, float): I[f'B{r}'].number_format = '0.0%'
        else: I[f'B{r}'].number_format = '#,##0'
        I[f'C{r}'] = c; style(I[f'C{r}'], I['C147'])

# 3. Notes and titles
I['A1'] = 'Archē Executive — Standalone 3rd-Party Brokerage Model: Inputs (V1 locked plan, V2 broker plan; switch in B3)'
I['A3'] = 'Budget version (1 = V1 locked plan 8 Oct 2026; 2 = V2 broker plan, commission-only brokers; 3 = V3 = V2 plus Bangkok consultants as in V1)'
I['A15'] = 'Broker commission + shared pool (V1, % of the Archē fee on broker bookings)'
I['C15'] = ('V1: 8% individual + 4% shared pool, paid on top of base (no draw). Director deals excluded.  |  V2 and V3: '
            'not used; brokers earn 27% of the Archē fee on their first 8 standard bookings (USD 45,000 billed) each month '
            'and 35% after that (Inputs rows 157-159). No shared pool.')
I['A29'] = 'Consultant commission (% of the Archē fee on own bookings)'
I['A30'] = 'Mentor broker override, consultant months 1–6 (% of the Archē fee)'
I['A93'] = 'Senior-broker override (% of the Archē fee on brokers\' bookings)'
I['C92'] = 'Team leads become senior brokers paid an override on their team\'s Archē fee, from Year 5 (same timing as the old team-lead layer).'
I['C35'] = 'Authorisers mandated by the Director: authorise bookings and record money stages (four-eyes). Brokers do every other step. First hire at 6 sellers (V1).'
I['C39'] = 'V1: desk starts month 9. Before that, brokers and an on-call rota cover out-of-hours.  |  V2: out-of-hours support starts when bookings reach the level in B135 (Inputs B131 = 1).'
I['C50'] = 'Allowance kept for a professional liability quote. Archē carries no liability insurance in its first months; aircraft, passenger and third-party insurance is the operator\'s (rule of 29 Oct 2026).'
I['C81'] = 'Plan equivalent: 6 sellers × 8 bookings. Authorisers scale with bookings, not headcount.'
I['A87'] = 'Not yet split: office costs sit inside other operating costs.'
I['C90'] = 'Morten 19 Oct 2026, 7 Nov 2026: brokers do every step of their own bookings; authorisers mandated by the Director do the four-eyes steps.'
c101 = I['C101'].value or ''
I['C101'] = c101.replace('(Inputs B53, Morten’s loan)', '(Inputs B53, paid-up capital)').replace("(Inputs B53, Morten's loan)", '(Inputs B53, paid-up capital)')
I['C131'] = ('Morten 24 Oct 2026: admin hires and start dates follow revenue, not the calendar; with commission-only brokers '
             'there is no Thai company (no hub recharge, surcharge, Thai tax or Thai director salary; no office seats). '
             'Admin are paid by Singapore (assumption).')
I['C138'] = (I['C138'].value or '') if 'Morten 16 Nov' in str(I['C138'].value) else (str(I['C138'].value or '') + ' Morten 16 Nov 2026: market demand is not known yet; at 100 brokers the plan is about 1% of world charter demand, to be seen.')

CV['B15'] = ('=CHOOSE(Inputs!$B$3,"Standalone third-party charter brokerage. Locked plan of 8 October 2026.",'
             '"Broker plan: commission-only brokers, 5 in month 1 and 5 more a month to 100; no consultants; Archē fee 9% of booking value.",'
             '"Broker plan plus Bangkok consultants as in the locked plan; Archē fee 9% of booking value.")')
S['A1'] = '=CHOOSE(Inputs!$B$3,"Version 1 (locked plan)","Version 2 (broker plan, commission-only brokers)","Version 3 (V2 plus Bangkok consultants)")&" — live summary"'
for ws in (AV, AU):
    ws['A1'] = ('=CHOOSE(Inputs!$B$3,"Archē Executive — Version 1 (locked plan): Standalone 3rd-Party Brokerage P&L",'
                '"Archē Executive — Version 2 (broker plan, commission-only brokers, no consultants): Standalone 3rd-Party Brokerage P&L",'
                '"Archē Executive — Version 3 (V2 plus Bangkok consultants): Standalone 3rd-Party Brokerage P&L")')
    ws['A11'] = '=IF(Inputs!$B$3=1,"Broker commission (12% of the Archē fee on broker bookings, paid on top)","Broker commission (27% / 35% of the Archē fee on own bookings; no base)")'
    ws['A21'] = 'Insurance allowance and software (Avinode, Microsoft 365)'
    ws['A31'] = '=IF(Inputs!$B$101=1,"Dividends paid to owners (quarterly)","Dividends paid to owners (monthly safe draw)")'

# plain label replacements on every sheet (text cells only, not formulas)
REPL = [
    ('Consultant gross profit (included in gross profit above)', 'Archē fee on consultant bookings (included above)'),
    ('Gross profit per broker per year', 'Archē fee per broker per year'),
    ('Memo: broker commission as % of broker gross profit', 'Memo: broker commission as % of the Archē fee on broker bookings'),
    ('Safe draw as % of this month’s gross profit', 'Safe draw as % of this month’s Archē fee'),
    ('Consultant gross profit', 'Archē fee on consultant bookings'),
    ('Broker gross profit', 'Archē fee on broker bookings'),
    ('  of which consultant gross profit', '  of which Archē fee on consultant bookings'),
    ('EBITDA = gross profit − operating costs (10 years)', 'EBITDA = Archē fee − operating costs (10 years)'),
    ('10-year net retained earnings (shown currency)', '10-year net profit after tax (shown currency)'),
    ('Net retained earnings (Singapore)', 'Net profit after tax (Singapore)'),
    ('Net retained earnings', 'Net profit after tax'),
    ('Insurance + team leads', 'Insurance, team leads and software'),
    ('Gross profit', 'Archē fee (9% of booking value)'),
    ('Surcharge (Thai company gross margin)', 'Surcharge (Thai company income)'),
    ('Gross margin (= surcharge)', 'Thai company income (= surcharge)'),
    ('  Gross margin', '  Thai company income'),
]
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            v = c.value
            if isinstance(v, str) and not v.startswith('='):
                for a, b in REPL:
                    if v == a or v.strip() == a.strip():
                        c.value = b; break

# 4. Commission rates from Inputs (Monthly USD row 21)
for col in range(2, 122):
    x = L(col)
    f = MU[f'{x}21'].value
    f2 = f.replace(f'MIN({x}13/{x}7,8)*0.27', f'MIN({x}13/{x}7,Inputs!$B$159)*Inputs!$B$157').replace(
        f'MAX(0,{x}13/{x}7-8)*0.35', f'MAX(0,{x}13/{x}7-Inputs!$B$159)*Inputs!$B$158')
    assert f2 != f, (x, f)
    MU[f'{x}21'] = f2

# 5. Software line: Monthly USD row 63, into row 24; Annual row 21
MU['A63'] = 'Software: Avinode (one user per broker and the Director) and Microsoft 365 (one mailbox per person)'
MV['A63'] = MU['A63'].value
style(MU['A63'], MU['A61']); style(MV['A63'], MV['A61'])
for col in range(2, 122):
    x = L(col)
    MU[f'{x}63'] = (f'=IF(({x}7+IF({x}14>0,1,0))>0,Inputs!$B$152+Inputs!$B$153*MAX(0,{x}7+IF({x}14>0,1,0)-1),0)'
                    f'+({x}55+{x}60)*Inputs!$B$154')
    style(MU[f'{x}63'], MU[f'{x}61'])
    MV[f'{x}63'] = f"='Monthly USD'!{x}63*Inputs!$B$143"; style(MV[f'{x}63'], MV[f'{x}61'])
    yr = (col - 2) // 12; ac = L(yr + 2)
    MU[f'{x}24'] = f"=('Annual USD'!{ac}$18+Inputs!$B$50)/12+{x}63"
for yc in range(2, 12):
    a = L(yc); m1 = L(2 + (yc - 2) * 12); m2 = L(13 + (yc - 2) * 12)
    AU[f'{a}21'] = f"=Inputs!$B$50+SUM('Monthly USD'!{m1}63:{m2}63)"

# 6. Summary column L: add the shown years (they are already converted)
for r in range(5, 15):
    if isinstance(S[f'L{r}'].value, str) and S[f'L{r}'].value.startswith('=(SUM('):
        S[f'L{r}'] = f'=SUM(B{r}:K{r})'

# 7. V1/V2/V3 page: column L adds its years; rows 100-101 removed (row 99 gives the lowest cash)
for blk in (6, 25, 44, 63, 82):
    for off in range(14):
        r = blk + off
        if V[f'B{r}'].value is not None:
            V[f'L{r}'] = f'=SUM(B{r}:K{r})'
for r in (100, 101):
    for c in 'ABCDEFGHIJKL': V[f'{c}{r}'] = None
V['A1'] = 'Archē Executive — V1 locked plan vs V2 broker plan vs V3 (V2 plus consultants): snapshot'
V['A23'] = 'V2 broker plan (no consultants)'
V['A2'] = ('Snapshot of all three versions with the inputs of 16 Nov 2026 (broker plan 5 a month to 100, Archē fee 9% of '
           'booking value, software per user, THB salaries at 33.74). One engine runs one version at a time, so this page is '
           'a picture; live figures for the version in Inputs B3 are on Summary, Annual and Monthly; Checks compares the '
           'picture with the live version. Money follows the currency switch.')

# 8. Checks
new = [
    ('Summary 10-year net profit = sum of its years = Annual', '=IF(AND(ABS(Summary!L8-SUM(Summary!B8:K8))<1,ABS(Summary!L8-Annual!L29)<1),"OK","CHECK")', None),
    ('V1/V2/V3 page: each 10-year total = sum of its years', '=IF(AND(ABS(\'V1 vs V2 vs V3\'!L18-SUM(\'V1 vs V2 vs V3\'!B18:K18))<1,ABS(\'V1 vs V2 vs V3\'!L37-SUM(\'V1 vs V2 vs V3\'!B37:K37))<1,ABS(\'V1 vs V2 vs V3\'!L56-SUM(\'V1 vs V2 vs V3\'!B56:K56))<1),"OK","CHECK")', None),
    ('V1/V2/V3 page = live figures for the version in Inputs B3 (10-year net)', '=IF(ABS(CHOOSE(Inputs!$B$3,\'V1 vs V2 vs V3\'!L18,\'V1 vs V2 vs V3\'!L37,\'V1 vs V2 vs V3\'!L56)-Annual!L29)<Inputs!$B$143*2,"OK","CHECK (snapshot older than the inputs)")', None),
    ('Cash ties to profit: dividends + year-10 cash = net profit + paid-up capital (USD)', '=IF(ABS(SUM(\'Annual USD\'!B31:K31)+\'Annual USD\'!K30-SUM(\'Annual USD\'!B29:K29)-Inputs!$B$53)<5,"OK","CHECK")', None),
    ('Software line present when brokers are active (Year 1)', '=IF(AND(\'Annual USD\'!B6>0,\'Annual USD\'!B21>Inputs!$B$50),"OK","CHECK")', None),
]
C['A12'] = None; C['B12'] = None
base = 12
for i, (a, f, fmt) in enumerate(new):
    r = base + i
    C[f'A{r}'] = a; C[f'B{r}'] = f
    style(C[f'A{r}'], C['A10']); style(C[f'B{r}'], C['B10'])
note_row = base + len(new) + 1
for r in range(base + len(new), base + len(new) + 3):
    if C[f'A{r}'].value and str(C[f'A{r}'].value).startswith('Each check'):
        C[f'A{r}'] = None
C[f'A{note_row}'] = ('Each check is calculated by Excel itself. If the status bar shows "Calculate", press Cmd + = (Mac) or F9 (Windows). '
                     'Revised 16 Nov 2026: Archē fee 9% of booking value, software per user, corrected totals.')
wb.save(out)
print('saved', out)
