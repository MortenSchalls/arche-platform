import json,base64,sys,re
for f in sys.argv[1:]:
    arr=json.load(open(f)); txt=arr[0]['text']
    s=txt[txt.index('{'):txt.rindex('}')+1]
    try: s2=json.loads(json.loads('"'+s.replace('"','\\"')+'"')) if False else None
    except: pass
    try: d=json.loads(s)
    except Exception:
        d=json.loads(json.loads(txt[txt.index('"'):txt.rindex('"')+1]))
    for k,v in d.items():
        b=base64.b64decode(v.split(',',1)[1]); open(k+'.jpg','wb').write(b); print(k,len(b))
