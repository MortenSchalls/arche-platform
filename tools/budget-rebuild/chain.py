# Add a calculation order (calcChain) sorted so every cell comes after the cells it uses, so Excel never has to
# chase long chains of not-yet-calculated cells. Input: formula workbook + the file with values; output: final file.
import zipfile, re, sys, openpyxl, collections
from openpyxl.formula import Tokenizer
from openpyxl.utils import range_boundaries
src, out = sys.argv[1], sys.argv[2]
wb=openpyxl.load_workbook(src); names=wb.sheetnames; G={}
for ws in wb:
  for row in ws.iter_rows():
    for c in row:
      v=c.value
      if isinstance(v,str) and v.startswith('='):
        deps=set()
        for t in Tokenizer(v).items:
          if t.type=='OPERAND' and t.subtype=='RANGE':
            s=t.value; sh,rg=(s.rsplit('!',1) if '!' in s else (ws.title,s)); sh=sh.strip("'")
            try: c1,r1,c2,r2=range_boundaries(rg.replace('$',''))
            except Exception: continue
            if c1 is None or r1 is None: continue
            for cc in range(c1,(c2 or c1)+1):
              for rr in range(r1,(r2 or r1)+1): deps.add((sh,cc,rr))
        G[(ws.title,c.column,c.row)]={d for d in deps if d!=(ws.title,c.column,c.row)}
indeg={v:0 for v in G}; rev=collections.defaultdict(list)
for v,ds in G.items():
  for d in ds:
    if d in G: indeg[v]+=1; rev[d].append(v)
q=collections.deque(sorted([v for v in G if indeg[v]==0],key=lambda x:(names.index(x[0]),x[2],x[1]))); order=[]
while q:
  v=q.popleft(); order.append(v)
  for w in rev[v]:
    indeg[w]-=1
    if indeg[w]==0: q.append(w)
assert len(order)==len(G), 'loop'
from openpyxl.utils import get_column_letter as L
xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<calcChain xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+''.join(f'<c r="{L(c)}{r}" i="{names.index(s)+1}"/>' for s,c,r in order)+'</calcChain>'
z=zipfile.ZipFile(out+'.tmp') if False else None
zin=zipfile.ZipFile(sys.argv[3]); zo=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
# sheetIds must equal positions for i= to point at the right sheet
wbx=zin.read('xl/workbook.xml').decode()
ids=[int(x) for x in re.findall(r'<sheet [^>]*sheetId="(\d+)"',wbx)]
assert ids==list(range(1,len(names)+1)), ids
for it in zin.infolist():
  b=zin.read(it.filename)
  if it.filename=='[Content_Types].xml' and b'calcChain' not in b:
    b=b.replace(b'</Types>',b'<Override PartName="/xl/calcChain.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml"/></Types>')
  if it.filename=='xl/_rels/workbook.xml.rels' and b'calcChain' not in b:
    b=b.replace(b'</Relationships>',b'<Relationship Id="rIdCalcChain1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/calcChain" Target="calcChain.xml"/></Relationships>')
  if it.filename=='xl/calcChain.xml': continue
  zo.writestr(it,b)
zo.writestr('xl/calcChain.xml',xml); zo.close(); print('calc order written for',len(order),'formula cells')
