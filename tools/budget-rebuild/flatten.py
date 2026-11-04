# Shorten the formula chains so Excel can calculate the model (Excel on the Mac ran out of resources on 1,300-deep chains).
import openpyxl, copy
from openpyxl.utils import get_column_letter as L
wb=openpyxl.load_workbook('step8.xlsx')
D=wb['Demand USD']; M=wb['Monthly USD']; IC=wb['Intercompany USD']; MV=wb['Monthly']
K='(1-(1-Inputs!$B$78)^(1/12))'
for c in range(3,122):
  x=L(c); p=L(c-1)
  D[f'{x}21']=f'={K}*SUM($B13:{p}13)'
  D[f'{x}13']=f'=IF(Inputs!$B$138=1,{x}23,SUM($B12:{x}12)-SUM($B11:{x}11))'
  D[f'{x}12']=D[f'{x}12'].value.replace(f'MAX(0,{x}23-({p}13-{x}11))',f'MAX(0,{x}23-({p}23-{x}11))')
  M[f'{x}28']=f'=Inputs!$B$53+SUM($B27:{x}27)'
  M[f'{x}31']=f'=SUM($B30:{x}30)'
  M[f'{x}67']=f'=SUM($B64:{x}64)'
  M[f'{x}95']=f'=SUM($B94:{x}94)'
  IC[f'{x}30']=f'=SUM($B29:{x}29)'
for c in range(2,122):
  x=L(c)
  M[f'{x}93']=f'=IF(COUNTIF($B92:{x}92,">="&Inputs!$B$135)>0,1,0)'
  M[f'{x}94']=f'=IF(Inputs!$B$131=1,IF(COUNTIF($B97:{x}97,">="&Inputs!$B$136)>0,1,0),IF(COUNTIF($B92:{x}92,">="&Inputs!$B$136)>0,1,0))'
  M[f'{x}99']=f"=IF(Inputs!$B$3=1,{x}10*Inputs!$B$8+{x}11*Inputs!$B$9+{x}12*Inputs!$B$10,'Demand USD'!{x}17)"
  M[f'{x}98']=f'=MIN(Inputs!$B$134,IF({x}5>=Inputs!$B$132,1,0)+INT({x}92/Inputs!$B$133))'
  M[f'{x}96']=f'=MAX(0,MAX($B98:{x}98))'
  # row 97: trailing 3-month average of broker booking units (row 13), same window as row 92
  f92=M[f'{x}92'].value
  M[f'{x}97']=f92.replace('16','99') if f92!='=0' else '=0'
  for r in (97,98,99):
    M[f'{x}{r}']._style=copy.copy(M[f'{x}96']._style)
    MV[f'{x}{r}']=f"='Monthly USD'!{x}{r}"; MV[f'{x}{r}']._style=copy.copy(MV[f'{x}96']._style)
M['A97']='Trailing 3-month average of row 99 (director trigger when Inputs B131 = 1; before the director starts it equals row 92)'
M['A99']='Broker booking units for the director trigger (V1: row 13; V2/V3: broker bookings, Demand row 17)'
M['A98']='Accounting & marketing people this month before the running maximum (row 96 takes the highest so far)'
for r in (97,98,99): MV[f'A{r}']=M[f'A{r}'].value; MV[f'A{r}']._style=copy.copy(MV['A96']._style); M[f'A{r}']._style=copy.copy(M['A96']._style)
# cash after the monthly safe draw in closed form (Inputs B101 = 2), so it no longer chains month to month
for c in range(2,122):
  x=L(c)
  M[f'{x}100']=f'={x}45+MAX({x}46,Inputs!$B$53)-({x}28-Inputs!$B$53)'
  M[f'{x}101']=f'=({x}28-Inputs!$B$53)+MIN(Inputs!$B$53,MIN($B100:{x}100))'
  M[f'{x}49']=f'=IF(Inputs!$B$101=2,{x}101,{x}47-{x}48)'
  for r in (100,101):
    M[f'{x}{r}']._style=copy.copy(M[f'{x}49']._style)
    MV[f'{x}{r}']=f"='Monthly USD'!{x}{r}*Inputs!$B$143"; MV[f'{x}{r}']._style=copy.copy(MV[f'{x}49']._style)
M['A100']='Helper: cash floor for the safe draw less cumulative net cash flow (used by row 101)'
M['A101']='Cash after the monthly safe draw, calculated directly (Inputs B101 = 2); equals row 47 less row 48'
for r in (100,101): MV[f'A{r}']=M[f'A{r}'].value; MV[f'A{r}']._style=copy.copy(MV['A96']._style); M[f'A{r}']._style=copy.copy(M['A96']._style)
wb.save('step9.xlsx'); print('ok', M['C97'].value, M['O97'].value)
