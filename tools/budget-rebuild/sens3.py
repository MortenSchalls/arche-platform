import openpyxl, json
cells=json.load(open('cells.json'))
ENG={'Annual':'Annual USD','Monthly':'Monthly USD','Demand':'Demand USD','Thai Hub':'Thai Hub USD','Intercompany':'Intercompany USD'}
def num(x): return isinstance(x,(int,float)) and not isinstance(x,bool)
bad=[]; n=0; effect=0
base=openpyxl.load_workbook('calc/out/v2usd.xlsx',data_only=True)
for k in cells:
  a=openpyxl.load_workbook(f'sens/a/out/{k}.xlsx',data_only=True); b=openpyxl.load_workbook(f'sens/b/out/{k}.xlsx',data_only=True)
  mism=0; changed=False
  for s,e in ENG.items():
    for row in a[s].iter_rows():
      for c in row:
        if c.column==1 or not num(c.value): continue
        y=b[e][c.coordinate].value
        if not (num(y) and abs(y-c.value)<=1e-7*max(1,abs(c.value))): mism+=1
        if not changed:
          z=base[e][c.coordinate].value
          if num(z) and abs(z-c.value)>1e-9*max(1,abs(z)): changed=True
  n+=1; effect+=changed
  if mism: bad.append((k,mism))
  er=sum(1 for ws in b for row in ws.iter_rows() for c in row if isinstance(c.value,str) and (c.value.startswith('#') or c.value.startswith('Err:')))
  if er: bad.append((k,'errors',er))
print('inputs tested',n,'that change the results',effect,'mismatches vs 31 Oct',bad[:20])
