import openpyxl, os, shutil, json
base=openpyxl.load_workbook('oct31.xlsx'); inp=base['Inputs']; cells=[]
for row in inp.iter_rows(min_row=3):
  for c in row:
    if c.column>1 and isinstance(c.value,(int,float)) and not isinstance(c.value,bool): cells.append(c.coordinate)
shutil.rmtree('sens',ignore_errors=True); os.makedirs('sens/a'); os.makedirs('sens/b')
def nv(k,v):
  if k=='B3': return 1
  if k=='B68': return 1 if v!=1 else 2
  if v in (0,1): return 1-v
  return v*1.25 if v else 1
for k in cells:
  for src,d in (('oct31.xlsx','a'),('step12.xlsx','b')):
    wb=openpyxl.load_workbook(src); v=wb['Inputs'][k].value; wb['Inputs'][k]=nv(k,v); wb.save(f'sens/{d}/{k}.xlsx')
json.dump(cells,open('cells.json','w')); print(len(cells))
