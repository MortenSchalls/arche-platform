# Put calculated values into the formula cells of the native file, so every figure shows when opened;
# Excel still recalculates everything on opening (fullCalcOnLoad).
import zipfile, re, openpyxl, html
src='step12.xlsx'; vals=openpyxl.load_workbook('calc/out/v2usd.xlsx',data_only=True); out='rebuild.xlsx'
z=zipfile.ZipFile(src)
wbx=z.read('xl/workbook.xml').decode(); rels=z.read('xl/_rels/workbook.xml.rels').decode()
rid={m.group(2):m.group(1) for m in re.finditer(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"',rels)}
rid.update({m.group(1):m.group(2) for m in re.finditer(r'<Relationship[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"',rels)})
sheetfile={}
for m in re.finditer(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"',wbx):
  tgt=[k for k,v in rid.items() if v==m.group(2)] or [rid.get(m.group(2))]
  t=next((x for x in tgt if x and 'worksheets' in x),None)
  sheetfile['xl/'+t.lstrip('/').replace('xl/','')]=html.unescape(m.group(1))
zo=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED); filled=0
for it in z.infolist():
  b=z.read(it.filename)
  if it.filename in sheetfile:
    ws=vals[sheetfile[it.filename]]; s=b.decode()
    def rep(m):
      global filled
      attrs,f=m.group(1),m.group(2); ref=re.search(r'r="([A-Z]+\d+)"',attrs).group(1); v=ws[ref].value
      attrs=re.sub(r'\s+t="[^"]*"','',attrs)
      if isinstance(v,bool): filled+=1; return f'<c{attrs} t="b">{f}<v>{int(v)}</v></c>'
      if isinstance(v,(int,float)): filled+=1; return f'<c{attrs}>{f}<v>{repr(float(v)) if isinstance(v,float) else v}</v></c>'
      if isinstance(v,str): filled+=1; return f'<c{attrs} t="str">{f}<v>{html.escape(v,quote=False)}</v></c>'
      return f'<c{attrs}>{f}</c>'
    s=re.sub(r'<c((?:\s+[a-z]+="[^"]*")*)>(<f>.*?</f>)(?:<v>[^<]*</v>|<v/>)?</c>',rep,s,flags=re.S)
    b=s.encode()
  zo.writestr(it,b)
zo.close(); print('formula cells given values:',filled)
