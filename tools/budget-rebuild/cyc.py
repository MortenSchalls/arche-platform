import openpyxl, sys
from openpyxl.formula import Tokenizer
from openpyxl.utils import range_boundaries
wb=openpyxl.load_workbook(sys.argv[1]); G={}
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
            if c1 is None or r1 is None: print('WHOLE COL/ROW REF',ws.title,c.coordinate,s); continue
            for cc in range(c1,(c2 or c1)+1):
              for rr in range(r1,(r2 or r1)+1): deps.add((sh,cc,rr))
        G[(ws.title,c.column,c.row)]=deps
index={};low={};st=[];on=set();sccs=[];i=0
for v0 in G:
  if v0 in index: continue
  stack=[(v0,iter(G[v0]))]; index[v0]=low[v0]=i;i+=1;st.append(v0);on.add(v0)
  while stack:
    v,it=stack[-1]
    for w in it:
      if w not in G: continue
      if w not in index:
        index[w]=low[w]=i;i+=1;st.append(w);on.add(w);stack.append((w,iter(G[w])));break
      elif w in on: low[v]=min(low[v],index[w])
    else:
      stack.pop()
      if stack: low[stack[-1][0]]=min(low[stack[-1][0]],low[v])
      if low[v]==index[v]:
        comp=[]
        while True:
          w=st.pop();on.discard(w);comp.append(w)
          if w==v: break
        if len(comp)>1 or v in G[v]: sccs.append(comp)
print('formula loops:',len(sccs), [len(c) for c in sccs])
