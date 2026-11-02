import openpyxl
wb=openpyxl.load_workbook('step6.xlsx'); v=wb['V1 vs V2 vs V3']
src={k:openpyxl.load_workbook(f'calc/out/{f}.xlsx',data_only=True)['Annual USD'] for k,f in (('V1','v1usd'),('V2','v2usd'),('V3','v3usd'))}
m={0:7,1:8,2:15,3:14,4:16,5:17,6:18,7:None,8:22,9:23,10:26,11:28,12:29,13:31,14:6,15:12}
val=lambda a,r,c: a.cell(r,c).value if isinstance(a.cell(r,c).value,(int,float)) else 0
FAC='Inputs!$B$143'
for k,top in {'V1':6,'V2':25,'V3':44}.items():
  a=src[k]
  for off,ar in m.items():
    for c in range(2,12):
      x=val(a,ar,c) if ar else val(a,22,c)-sum(val(a,r,c) for r in (14,16,17,18))
      v.cell(top+off,c, round(x,1) if off>=14 else f'={round(x)}*{FAC}')
from openpyxl.utils import get_column_letter as L
for top,(x,y) in {63:(25,6),82:(44,6)}.items():
  for off in range(16):
    for c in range(2,12): v.cell(top+off,c,f'={L(c)}{x+off}-{L(c)}{y+off}')
for r in range(1,v.max_row+1):
  if v.cell(r,1).value=='USD': v.cell(r,1).value='=Inputs!$B$144'
v['A2']="Snapshot of all three versions with the inputs of 2 Nov 2026 (broker plan 5 a month to 100, margin 9%, THB salaries at 33.74). One engine runs one version at a time, so this page is a picture; live figures for the version in Inputs B3 are on Summary, Annual and Monthly. Money follows the currency switch."
v['A99']='Lowest cash balance, 10 years (after dividends): V1 / V2 / V3'
for i,k in enumerate(('V1','V2','V3')): v.cell(99,2+i,f'={round(val(src[k],42,2))}*{FAC}')
wb.save('step7.xlsx'); print('ok')
