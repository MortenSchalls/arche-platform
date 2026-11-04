import openpyxl, re, copy
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles.differential import DifferentialStyle
from openpyxl.styles.numbers import NumberFormat
wb=openpyxl.load_workbook('step5.xlsx')
REN={'Annual':'Annual USD','Monthly':'Monthly USD','Demand':'Demand USD','Thai Hub':'Thai Hub USD','Intercompany':'Intercompany USD'}
pat=re.compile(r"(?<![A-Za-z0-9_])('?)(Annual|Monthly|Demand|Thai Hub|Intercompany)\1!")
for ws in wb:
  for row in ws.iter_rows():
    for c in row:
      if isinstance(c.value,str) and c.value.startswith('='): c.value=pat.sub(lambda m:"'"+REN[m.group(2)]+"'!",c.value)
for o,n in REN.items(): wb[o].title=n
av=wb['Annual (view)']
ann_money={r for r in range(1,av.max_row+1) if '$B$143' in str(av.cell(r,2).value)}
del wb['Annual (view)']
NONMONEY={'Monthly':set(range(3,17))|set(range(29,38))|{44,51,52,53,54,55,57,60,62,63,65,66,70,73,80,81,91,92,93,94,95,96},
 'Demand':set(range(1,40))-{6},'Thai Hub':{1,2,3,4,5,16,26,30,32,37},'Intercompany':{1,2,3,4,5,7,22,32,34,40}}
FAC='Inputs!$B$143'
def build(name,money_rows=None):
  src=wb[REN[name]]; v=wb.create_sheet(name)
  for col,dim in src.column_dimensions.items(): v.column_dimensions[col].width=dim.width
  for r,dim in src.row_dimensions.items(): v.row_dimensions[r].height=dim.height
  v.freeze_panes=src.freeze_panes; v.sheet_view.showGridLines=src.sheet_view.showGridLines
  for m in src.merged_cells.ranges: v.merge_cells(str(m))
  for row in src.iter_rows():
    for c in row:
      t=v.cell(c.row,c.column); t._style=copy.copy(c._style); val=c.value
      if val is None: continue
      if c.column==1:
        if isinstance(val,str) and not val.startswith('='):
          if val.strip()=='USD': t.value='=Inputs!$B$144'
          elif ('(USD' in val or 'USD)' in val) and 'USD 45' not in val: t.value='="'+val.replace('"','""').replace('USD','"&Inputs!$B$144&"')+'"'
          else: t.value=val
        else: t.value=val
        continue
      if isinstance(val,str) and not val.startswith('='): t.value='=Inputs!$B$144' if val.strip()=='USD' else val; continue
      money=(c.row in money_rows) if money_rows is not None else (c.row not in NONMONEY[name])
      ref=f"'{REN[name]}'!{c.coordinate}"
      t.value=f"={ref}*{FAC}" if money else f"={ref}"
  a2=v['A2'].value
  if isinstance(a2,str) and not a2.startswith('='):
    a2=a2[:180]
    v['A2'].value='="'+a2.replace('"','""')+'"&" Money in "&Inputs!$B$144&" (switch: Inputs B141)."'
  src.sheet_state='hidden'
build('Annual',ann_money)
for n in ('Monthly','Demand','Thai Hub','Intercompany'): build(n)
order=['Cover','Inputs','Summary','Annual','Monthly','Demand','Thai Hub','Intercompany','V1 vs V2 vs V3']+[REN[k] for k in ('Annual','Monthly','Demand','Thai Hub','Intercompany')]
wb._sheets=[wb[n] for n in order]; wb.active=0
# currency marks in number formats follow the switch
n=0
for ws in wb:
  if ws.sheet_state!='visible' or ws.title=='Inputs': continue
  groups={}
  for row in ws.iter_rows():
    for c in row:
      if c.value is not None and '$' in c.number_format: groups.setdefault(c.number_format,[]).append(c.coordinate)
  for fmt,cells in groups.items():
    thb=fmt.replace('\\$','"THB "').replace('"$"','"THB "')
    rule=FormulaRule(formula=['Inputs!$B$141="THB"']); rule.dxf=DifferentialStyle(numFmt=NumberFormat(numFmtId=200+n,formatCode=thb))
    ws.conditional_formatting.add(' '.join(cells),rule); n+=1
# texts
I=wb['Inputs']
I['C141']='Switch: choose USD or THB. Every sheet except Inputs shows money in the chosen currency (counts, months and percentages are not converted). The calculation itself runs in USD on hidden sheets, so the switch changes only how results are shown. Inputs stay in USD.'
cv=wb['Cover']
for row in cv.iter_rows():
  for c in row:
    if isinstance(c.value,str): c.value=c.value.replace('on Summary and Annual (view)','on every sheet except Inputs')
cv['C19']='10-year P&L, headcount, cash and dividends, in the currency chosen in Inputs B141'
cv['C21']='120 months of volume, cost, cash and dividends, in the currency chosen in Inputs B141'
wb['Summary']['A2']='="Follows the version switch in Inputs B3. Money in "&Inputs!$B$144&". Dividends follow Inputs row 101; split per Inputs B104. Director salary per Inputs rows 115–119."'
wb.calculation.fullCalcOnLoad=True; wb.calculation.calcMode='auto'
wb.save('step6.xlsx'); print(wb.sheetnames, 'cf groups',n)
