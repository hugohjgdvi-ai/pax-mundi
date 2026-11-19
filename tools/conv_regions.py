import json, math
rg=json.load(open('/tmp/regions.json'))
out=[]
tot=0; dropped=0; empty=0
def P(l):
    xs=[p[0] for p in l]; ys=[p[1] for p in l]
    return round(min(xs),2),round(min(ys),2),round(max(xs),2),round(max(ys),2)
for ci,c in enumerate(rg):
    pc=[]
    for r in c:
        if isinstance(r,dict):
            loops=[]
            xs=[];ys=[]
            for l in r['loops']:
                if len(l)<3: dropped+=1; continue
                flat=[]
                for x,y in l:
                    x=round(x,2);y=round(y,2);flat.append(x);flat.append(y)
                    xs.append(x);ys.append(y)
                loops.append(flat)
            if not loops:
                empty+=1
                # rectangle englobant garanti valide
                b=P(r['loops'])
                loops.append([b[0],b[1],b[2],b[1],b[2],b[3],b[0],b[3]])
            cx=r.get('cx'); cy=r.get('cy')
            if cx is None:
                cx=round(sum(xs)/len(xs),2); cy=round(sum(ys)/len(ys),2)
            pc.append([r['name'],bb,cx,cy,loops])
        else:
            name,bb,cx,cy,loops=r[0],[float(v) for v in r[1]],float(r[2]),float(r[3]),r[4]
            loops_orig=loops
            flat_loops=[]; xs=[];ys=[]
            for l in loops:
                if len(l)<3: dropped+=1; continue
                flat=[]
                for x,y in l:
                    flat.append(x);flat.append(y); xs.append(x);ys.append(y)
                flat_loops.append(flat)
            if not flat_loops:
                empty+=1
                xs=[];ys=[]
                for l in loops_orig:
                    for x,y in l: xs.append(x);ys.append(y)
                b=[min(xs),min(ys),max(xs),max(ys)]
                flat_loops.append([b[0],b[1],b[2],b[1],b[2],b[3],b[0],b[3]])
            pc.append([name,bb,round(cx,2),round(cy,2),flat_loops])
    out.append(pc)
    tot+=len(pc)
j=json.dumps(out,separators=(',',':'),ensure_ascii=False)
open('/tmp/prov_flat.json','w').write(j)
print('pays:',len(out),'régions:',tot,'boucles dégénérées éliminées:',dropped,'régions sans boucle (fallback):',empty,'taille:',len(j)//1024,'Ko')
for i,c in enumerate(out):
    for r in c:
        assert len(r)==5 and len(r[1])==4 and isinstance(r[4],list) and r[4]
        for f in r[4]:
            assert len(f)>=6 and len(f)%2==0, ('bad',i,r[0],len(f))
print('shapes OK')
wd=json.load(open('/tmp/wd.json'))
names=[c['n'] for c in wd['countries']]
for want,n in [('France','France'),('Spain','Espagne'),('United States of America','États-Unis'),('Germany','Allemagne')]:
    ci=names.index(want); regs=[r[0] for r in out[ci]]
    print(n, len(regs), regs[:5])
