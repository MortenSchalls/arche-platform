import formulas, openpyxl, re, sys
mode=sys.argv[1]
xl=formulas.ExcelModel().loads(f'calc/in/{mode}.xlsx').finish(); sol=xl.calculate()
w=openpyxl.load_workbook(f'calc/out/{mode}.xlsx',data_only=True)
idx={}
for k,v in sol.items():
  m=re.match(r"'\[.*?\](.+)'!([A-Z]+\d+)$",k)
  if m: idx[(m.group(1).upper(),m.group(2))]=v
n=mis=0;ex=[]
for ws in w:
  for row in ws.iter_rows():
    for c in row:
      if c.value is None: continue
      k=(ws.title.upper(),c.coordinate)
      if k not in idx: continue
      x=idx[k].value[0][0]; n+=1
      if isinstance(c.value,(int,float)) and not isinstance(c.value,bool):
        try: ok=abs(float(x)-c.value)<=1e-6*max(1,abs(c.value))
        except Exception: ok=False
      else: ok=str(x)==str(c.value)
      if not ok: mis+=1; ex.append((ws.title,c.coordinate,c.value,x))
print(mode,'cells compared',n,'differences',mis,ex[:5],flush=True)
