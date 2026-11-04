# Depth of the chains Excel actually walks for the current inputs (IF branches not taken are skipped).
import openpyxl, sys, collections, re
from openpyxl.formula import Tokenizer
from openpyxl.utils import range_boundaries
wb=openpyxl.load_workbook(sys.argv[1]); ins=openpyxl.load_workbook(sys.argv[2],data_only=True)['Inputs']
over=dict(a.split('=') for a in sys.argv[3:])
def inval(ref):
  r=ref.replace('$','')
  return float(over[r]) if r in over else ins[r].value
def cond_value(tokens):
  s=''.join(t.value for t in tokens)
  m=re.fullmatch(r"Inputs!\$B\$(\d+)(=|>=|<=|<>|>|<)(-?[\d.]+|\"\w+\")",s)
  if not m: return None
  v=inval('B'+m.group(1)); rhs=m.group(3).strip('"')
  try: rhs=float(rhs)
  except: pass
  op=m.group(2)
  return {'=':v==rhs,'>=':v>=rhs,'<=':v<=rhs,'<>':v!=rhs,'>':v>rhs,'<':v<rhs}[op]
def refs(f,sheet):
  toks=Tokenizer(f).items; out=[]; i=0
  # walk tokens; for IF( cond , a , b ) with evaluable cond, skip the untaken branch
  def walk(i,stop_depth=None):
    depth=0
    while i<len(toks):
      t=toks[i]
      if t.type=='FUNC' and t.subtype=='OPEN' and t.value.upper()=='IF(':
        # collect condition tokens up to first separator at this level
        j=i+1; lvl=0; cond=[]
        while j<len(toks):
          u=toks[j]
          if u.subtype=='OPEN': lvl+=1
          if u.subtype=='CLOSE':
            if lvl==0: break
            lvl-=1
          if u.type=='SEP' and u.subtype=='ARG' and lvl==0: break
          cond.append(u); j+=1
        cv=cond_value(cond)
        # find arg boundaries
        args=[]; start=i+1; lvl=0; k=i+1
        while k<len(toks):
          u=toks[k]
          if u.subtype=='OPEN': lvl+=1
          if u.subtype=='CLOSE':
            if lvl==0: args.append((start,k)); break
            lvl-=1
          if u.type=='SEP' and u.subtype=='ARG' and lvl==0: args.append((start,k)); start=k+1
          k+=1
        if cv is None: sel=args
        else: sel=[args[1]] if cv else ([args[2]] if len(args)>2 else [])
        if cv is None: sel=args
        for a,b in sel:
          for u in toks[a:b]:
            if u.type=='OPERAND' and u.subtype=='RANGE': out.append(u.value)
        # nested IFs inside selected args are not pruned further (conservative)
        i=k+1; continue
      if t.type=='OPERAND' and t.subtype=='RANGE': out.append(t.value)
      i+=1
  walk(0)
  return out
G={}
for ws in wb:
  for row in ws.iter_rows():
    for c in row:
      v=c.value
      if isinstance(v,str) and v.startswith('='):
        deps=set()
        for s in refs(v,ws.title):
          sh,rg=(s.rsplit('!',1) if '!' in s else (ws.title,s)); sh=sh.strip("'")
          try: c1,r1,c2,r2=range_boundaries(rg.replace('$',''))
          except Exception: continue
          if c1 is None or r1 is None: continue
          for cc in range(c1,(c2 or c1)+1):
            for rr in range(r1,(r2 or r1)+1): deps.add((sh,cc,rr))
        G[(ws.title,c.column,c.row)]=deps
depth={};order=[];seen=set()
for s in G:
  if s in seen: continue
  st=[(s,0)]
  while st:
    v,i=st.pop()
    if i==0:
      if v in seen: continue
      seen.add(v)
    ds=[d for d in G.get(v,()) if d in G]
    if i<len(ds):
      st.append((v,i+1)); d=ds[i]
      if d not in seen: st.append((d,0))
    else: order.append(v)
nxt={}
for v in order:
  b=0;a=None
  for d in G[v]:
    if d in G and depth.get(d,0)+1>b: b=depth[d]+1;a=d
  depth[v]=b;nxt[v]=a
m=max(depth,key=depth.get); print('walked depth',depth[m],m)
v=m;path=[]
while v and len(path)<3000: path.append(v); v=nxt[v]
print(collections.Counter((p[0],p[2]) for p in path).most_common(8))
