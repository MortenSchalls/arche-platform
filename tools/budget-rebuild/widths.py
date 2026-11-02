# Column widths fitted to the widest value shown (checked in both USD and THB, all versions).
import openpyxl, math, re, sys
from openpyxl.utils import get_column_letter as L
wb=openpyxl.load_workbook(sys.argv[1]); out=sys.argv[2]
vals=[openpyxl.load_workbook(f'calc/out/{m}.xlsx',data_only=True) for m in ('v2thb','v3thb','v1thb','v2usd')]
def shown(v,fmt):
  if v is None: return ''
  if isinstance(v,bool): return str(v)
  if isinstance(v,(int,float)):
    pct='%' in fmt; dec=0
    m=re.search(r'0\.(0+)',fmt); dec=len(m.group(1)) if m else 0
    x=v*100 if pct else v
    s=f'{x:,.{dec}f}'+('%' if pct else '')
    if '$' in fmt or 'THB' in fmt: s='THB '+s
    if x<0 and '(' in fmt: s='('+s.strip('-')+')'
    return s
  return str(v)
for ws in wb:
  if ws.sheet_state!='visible': continue
  widths={}
  for row in ws.iter_rows():
    for c in row:
      if c.value is None: continue
      merged=any(c.coordinate in r for r in ws.merged_cells.ranges)
      if merged: continue
      best=0
      for w in vals:
        v=w[ws.title][c.coordinate].value
        s=shown(v,c.number_format or '')
        best=max(best,len(s))
      if c.column==1 and best>70: best=70     # long notes in column A wrap instead
      widths[c.column]=max(widths.get(c.column,0),best)
  for col,wd in widths.items():
    ws.column_dimensions[L(col)].width=max(8,min(wd*1.1+2,80))
  # long text in column A wraps
  for row in ws.iter_rows(min_col=1,max_col=1):
    c=row[0]
    if isinstance(c.value,str):
      v=vals[0][ws.title][c.coordinate].value
      if isinstance(v,str) and len(v)>70:
        from copy import copy; al=copy(c.alignment); al.wrap_text=True; c.alignment=al
wb.save(out); print('widths set')
