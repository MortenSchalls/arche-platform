import openpyxl
F=33.7388; form=openpyxl.load_workbook('step12.xlsx')
def num(x): return isinstance(x,(int,float)) and not isinstance(x,bool)
def close(a,b,t=1e-7): return abs(a-b)<=t*max(1,abs(b))
ENG={'Annual':'Annual USD','Monthly':'Monthly USD','Demand':'Demand USD','Thai Hub':'Thai Hub USD','Intercompany':'Intercompany USD'}
base={'v2usd':'v2usd','v2thb':'v2usd','v1usd':'v1usd','v1thb':'v1usd','v3usd':'v3usd','v3thb':'v3usd','demand':'demand','demand131':'demand131','demandthb':'demand'}
for mode in base:
  w=openpyxl.load_workbook(f'calc/out/{mode}.xlsx',data_only=True); f=F if 'thb' in mode else 1
  err=[(ws.title,c.coordinate) for ws in w for row in ws.iter_rows() for c in row if isinstance(c.value,str) and (c.value.startswith('#') or c.value.startswith('Err:'))]
  vm=vn=0
  for name,eng in ENG.items():
    for row in form[name].iter_rows():
      for c in row:
        if isinstance(c.value,str) and c.value.startswith("='"):
          a=w[name][c.coordinate].value; b=w[eng][c.coordinate].value
          if num(b):
            vn+=1; exp=b*(f if '$B$143' in c.value else 1)
            if not (num(a) and close(a,exp)): vm+=1
  o=openpyxl.load_workbook(f'calc31/out/{base[mode]}.xlsx',data_only=True); em=en=0; ex=[]
  for name,eng in ENG.items():
    for row in o[name].iter_rows():
      for c in row:
        if c.column==1 or not num(c.value): continue
        en+=1; b=w[eng][c.coordinate].value
        if not (num(b) and close(b,c.value)): em+=1; ex.append((name,c.coordinate,c.value,b))
  chk=[w['Checks'].cell(r,2).value for r in range(4,11)]
  print(mode,'errors',len(err),'views',vn,vm,'vs31Oct',en,em,ex[:4],'checks',set(chk),'net10',round(sum(w['Annual USD'].cell(29,c).value for c in range(2,12))))
