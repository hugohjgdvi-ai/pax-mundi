#!/usr/bin/env python3
# Génération des régions PAX MUNDI (V7) : Natural Earth 10m admin-1 -> régions façon CoW.
# Entrées (dossier du script): wd.json (WORLDDATA) et natural-earth-vector/geojson/ne_10m_admin_1_states_provinces.geojson (clone sparse du dépôt nvkelso/natural-earth-vector).
# Sortie : regions_level1.json (par pays, index = ordre WORLDDATA.countries).
import json, math
from collections import defaultdict

wd=json.load(open('wd.json'))
countries=wd['countries']
name2id={c['n']:i for i,c in enumerate(countries)}
ALIAS={'S. Sudan':'South Sudan'}
SKIP={'Siachen Glacier','Coral Sea Islands','Spratly Is.','Ashmore and Cartier Islands','Baykonur Cosmodrome',
      'Akrotiri Sovereign Base Area','Dhekelia Sovereign Base Area','US Naval Base Guantanamo Bay',
      'Clipperton Island','Indian Ocean Territories'}

d=json.load(open('natural-earth-vector/geojson/ne_10m_admin_1_states_provinces.geojson'))

def ring_area_signed(pts):
    s=0
    n=len(pts)
    for i in range(n):
        x1,y1=pts[i]; x2,y2=pts[(i+1)%n]
        s+=x1*y2-x2*y1
    return s/2

def dp(pts,tol):
    if len(pts)<5: return pts
    keep=[False]*len(pts); keep[0]=keep[-1]=True
    st=[(0,len(pts)-1)]
    while st:
        a,b=st.pop()
        if b<=a+1: continue
        ax,ay=pts[a]; bx,by=pts[b]
        dx=bx-ax; dy=by-ay; L2=dx*dx+dy*dy
        mi=-1; md=-1
        for i in range(a+1,b):
            px,py=pts[i]
            if L2==0: dist=math.hypot(px-ax,py-ay)
            else:
                t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L2))
                dist=math.hypot(px-ax-t*dx,py-ay-t*dy)
            if dist>md: md=dist; mi=i
        if md>tol:
            keep[mi]=True; st.append((a,mi)); st.append((mi,b))
    return [p for p,k in zip(pts,keep) if k]

def unwrap(ring, cx):
    out=[]; prev=None
    for x,y in ring:
        if prev is not None:
            while x-prev>180: x-=360
            while x-prev<-180: x+=360
        out.append((x,y)); prev=x
    while out[0][0]-cx>180: out=[(x-360,y) for x,y in out]
    while out[0][0]-cx<-180: out=[(x+360,y) for x,y in out]
    return out

# 1. collect provinces per country (raw, unsimplified)
provs_by_c=defaultdict(list)
unmatched=set()
for f in d['features']:
    pr=f['properties']
    adm=pr['admin']; nm=pr.get('name') or ''
    cname=ALIAS.get(adm,adm)
    if adm=='France' and nm in ('Guyane','French Guiana'): cname='French Guiana'
    if cname in SKIP: continue
    if cname not in name2id:
        unmatched.add(adm); continue
    ci=name2id[cname]
    cx,cy=countries[ci]['cx'],countries[ci]['cy']
    g=f['geometry']
    polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    rings=[]
    tot_area=0
    for poly in polys:
        outer=[(float(x),float(y)) for x,y in poly[0]]
        a=abs(ring_area_signed(outer))
        if a<0.0008: continue
        tot_area+=a
        for ring in poly:
            pts=[(float(x),float(y)) for x,y in ring]
            if abs(ring_area_signed(pts))<0.0008: continue
            rings.append(unwrap(pts,cx))
    if rings:
        provs_by_c[ci].append({'n':nm,'rings':rings,'area':tot_area,
            'cx':sum(p[0] for r in rings for p in r[:len(r):1])/sum(len(r) for r in rings),
            'cy':sum(p[1] for r in rings for p in r)/sum(len(r) for r in rings)})

# better centroid: bbox center of largest ring
for ci,plist in provs_by_c.items():
    for p in plist:
        big=max(p['rings'],key=lambda r:abs(ring_area_signed(r)))
        xs=[q[0] for q in big]; ys=[q[1] for q in big]
        p['cx']=sum(xs)/len(xs); p['cy']=sum(ys)/len(ys)

def kmeans(ptsw,k):
    # ptsw: [(x,y,w)] ; graines déterministes (point le plus lointain)
    pts=[(x,y) for x,y,w in ptsw]
    cent=[pts[max(range(len(pts)),key=lambda i:ptsw[i][2])]]
    while len(cent)<k:
        best=None;bd=-1
        for i,(x,y) in enumerate(pts):
            dd=min((x-cx_)**2+(y-cy_)**2 for cx_,cy_ in cent)
            if dd>bd: bd=dd;best=i
        cent.append(pts[best])
    assign=None
    for it in range(30):
        assign=[]
        for (x,y) in pts:
            bi=min(range(len(cent)),key=lambda s:(x-cent[s][0])**2+(y-cent[s][1])**2)
            assign.append(bi)
        for s in range(len(cent)):
            sx=sy=0;wsum=0
            for i,(x,y) in enumerate(pts):
                if assign[i]==s:
                    w=ptsw[i][2];sx+=x*w;sy+=y*w;wsum+=w
            if wsum>0: cent[s]=(sx/wsum,sy/wsum)
    return assign

def snap(v): return round(v,4)

def disjoint_union(plist, all_boundary_edges):
    """Construit les polylignes frontière du groupe : segments vus une seule fois.
    all_boundary_edges: dict key->[seg assurances] rempli par toutes les provinces du pays."""
    segs=[]
    for p in plist:
        for r in p['rings']:
            n=len(r)
            for i in range(n):
                x1,y1=r[i]; x2,y2=r[(i+1)%n]
                if x1==x2 and y1==y2: continue
                k=(snap(x1),snap(y1),snap(x2),snap(y2))
                if k[0]<k[2] or (k[0]==k[2] and k[1]<k[3]):
                    k=(k[2],k[3],k[0],k[1])
                # frontieres partagées entre DEUX provinces de pays differents ne doivent pas être annulées:
                c=all_boundary_edges.get(k)
                if c is None:
                    all_boundary_edges[k]=1
                    segs.append(((x1,y1),(x2,y2)))
                elif c==1:
                    all_boundary_edges[k]=2  # annulé
    return segs

def chain(segs):
    # chaînage robuste : quantification des extrémités à 1e-3 (~100 m)
    def K(p): return (round(p[0],3),round(p[1],3))
    G=defaultdict(list)
    for i,(a,b) in enumerate(segs):
        G[K(a)].append(i)
    used=[False]*len(segs)
    lines=[]
    for i,(a,b) in enumerate(segs):
        if used[i]: continue
        used[i]=True
        line=[a,b]
        cur=K(b)
        while True:
            cand=[j for j in G.get(cur,()) if not used[j]]
            if not cand: break
            j=cand[0]; used[j]=True
            e=segs[j][1]; line.append(e); cur=K(e)
            if len(line)>6000: break
        lines.append(line)
    return [l for l in lines if len(l)>=4]


REGMAP={
'France':{
'Île-de-France':['Paris','Essonne','Hauts-de-Seine','Seine-Saint-Denis','Val-de-Marne',"Val-d'Oise",'Yvelines','Seien-et-Marne','Seine-et-Marne'],
'Auvergne-Rhône-Alpes':['Ain','Allier','Ardèche','Cantal','Drôme','Isère','Loire','Haute-Loire','Puy-de-Dôme','Rhône','Savoie','Haute-Savoie'],
'Bourgogne-Franche-Comté':["Côte-d'Or",'Doubs','Jura','Nièvre','Saône-et-Loire','Haute-Saône','Yonne','Territoire de Belfort'],
'Bretagne':["Côtes-d'Armor",'Finistère','Ille-et-Vilaine','Morbihan'],
'Centre-Val de Loire':['Cher','Eure-et-Loir','Indre','Indre-et-Loire','Loir-et-Cher','Loiret'],
'Corse':['Corse-du-Sud','Haute-Corse'],
'Grand Est':['Ardennes','Aube','Marne','Haute-Marne','Meurthe-et-Moselle','Meuse','Moselle','Bas-Rhin','Haute-Rhin','Haut-Rhin','Vosges'],
'Hauts-de-France':['Aisne','Nord','Oise','Pas-de-Calais','Somme'],
'Normandie':['Calvados','Eure','Manche','Orne','Seine-Maritime'],
'Nouvelle-Aquitaine':['Charente','Charente-Maritime','Corrèze','Creuse','Dordogne','Gironde','Landes','Lot-et-Garonne','Pyrénées-Atlantiques','Deux-Sèvres','Vienne','Haute-Vienne'],
'Occitanie':['Ariège','Aude','Aveyron','Gard','Haute-Garonne','Gers','Hérault','Lot','Lozère','Hautes-Pyrénées','Pyrénées-Orientales','Tarn','Tarn-et-Garonne'],
'Pays de la Loire':['Loire-Atlantique','Maine-et-Loire','Mayenne','Sarthe','Vendée'],
"Provence-Alpes-Côte d'Azur":['Alpes-de-Haute-Provence','Hautes-Alpes','Alpes-Maritimes','Bouches-du-Rhône','Var','Vaucluse'],
'DOM-Guyane':['Guyane française'],'DOM-Guadeloupe':['Guadeloupe'],'DOM-Martinique':['Martinique'],'DOM-Réunion':['La Réunion'],'DOM-Mayotte':['Mayotte']
},
'Spain':{
'Andalucía':['Almería','Cádiz','Córdoba','Granada','Huelva','Jaén','Málaga','Sevilla'],
'Aragón':['Huesca','Teruel','Zaragoza'],
'Asturias':['Asturias'],'Cantabria':['Cantabria'],
'Castilla-La Mancha':['Albacete','Ciudad Real','Cuenca','Guadalajara','Toledo'],
'Castilla y León':['Ávila','Burgos','León','Palencia','Salamanca','Segovia','Soria','Valladolid','Zamora'],
'Cataluña':['Barcelona','Gerona','Lérida','Tarragona'],
'Comunidad Valenciana':['Alicante','Castellón','Valencia'],
'Extremadura':['Badajoz','Cáceres'],
'Galicia':['La Coruña','Lugo','Orense','Pontevedra'],
'Islas Baleares':['Baleares'],'Islas Canarias':['Las Palmas','Santa Cruz de Tenerife'],
'La Rioja':['La Rioja'],'Madrid':['Madrid'],'Murcia':['Murcia'],'Navarra':['Navarra'],
'País Vasco':['Álava','Gipuzkoa','Bizkaia'],
'Ceuta':['Ceuta'],'Melilla':['Melilla']
}
}

out_regions=[]
total_regions=0
merged_countries=0
for ci,c in enumerate(countries):
    plist=provs_by_c[ci]
    if not plist:
        # fallback : outline du pays entier
        xs=[];ys=[]
        rings=[[tuple(q) for q in r] for r in c['r']]
        for r in rings:
            xs.extend([q[0] for q in r]); ys.extend([q[1] for q in r])
        loops=[list(r) for r in rings]
        sm=[dp(l,0.05) for l in loops]
        pts=[q for l in sm for q in l]
        if not pts:
            sm=[list(r) for r in rings]; pts=[q for l in sm for q in l]
        cx=sum(q[0] for q in pts)/len(pts); cy=sum(q[1] for q in pts)/len(pts)
        out_regions.append([[c['n'],[round(min(xs),2),round(min(ys),2),round(max(xs),2),round(max(ys),2)],
                             round(cx,2),round(cy,2),sm]]); total_regions+=1
        continue
    carea=sum(p['area'] for p in plist)
    cnt=len(plist)
    avg=carea/cnt
    rmap=REGMAP.get(c['n'])
    if rmap:
        byname={p['n']:p for p in plist}
        used=set();groups=[]
        for rn,members in rmap.items():
            m=[byname[n] for n in members if n in byname]
            for n in members:
                if n in byname: used.add(n)
            if m: groups.append((rn,m))
        for p in plist:  # restes non mappés
            if p['n'] not in used: groups.append((p['n'] or c['n'],[p]))
    elif cnt<=40 or avg>1.2:
        # admin-1 déjà au niveau région (états US, Länder…) -> garder tel quel
        groups=[(p['n'] or c['n'],[p]) for p in plist]
    else:
        merged_countries+=1
        k=max(2,min(30,round(carea/0.35)))
        # k-means pondéré par l'aire
        ptsw=[(p['cx'],p['cy'],p['area']) for p in plist]
        assign=kmeans(ptsw,k)
        clusters=defaultdict(list)
        for i,p in enumerate(plist): clusters[assign[i]].append(p)
        groups=[]
        for s,members in clusters.items():
            if not members: continue
            big=max(members,key=lambda p:p['area'])
            groups.append((big['n'] or c['n'],members))
    # découpe par région : l'outline d'une région = arêtes non partagées avec une autre province de la même région
    edge2prov=defaultdict(list)   # arête normalisée -> [(pi, i, ring)]
    for pi,p in enumerate(plist):
        p['pi']=pi
        for r in p['rings']:
            n=len(r)
            for i in range(n):
                x1,y1=r[i]; x2,y2=r[(i+1)%n]
                if x1==x2 and y1==y2: continue
                key=(snap(x1),snap(y1),snap(x2),snap(y2))
                if key[0]<key[2] or (key[0]==key[2] and key[1]<key[3]):
                    key=(key[2],key[3],key[0],key[1])
                edge2prov[key].append((pi,i,r))
    edge_borders={}
    for key,lst in edge2prov.items():
        pset=set(t[0] for t in lst)
        if len(pset)>=2: edge_borders[key]=pset   # frontière interne du pays : connaître les 2 provinces
    packed=[]
    for rname,members in groups:
        mids=set()
        for p in members:
            mids.add(p['pi'])
        segs=[]
        for p in members:
            pi=p['pi']
            for r in p['rings']:
                n=len(r)
                for i in range(n):
                    x1,y1=r[i]; x2,y2=r[(i+1)%n]
                    if x1==x2 and y1==y2: continue
                    key=(snap(x1),snap(y1),snap(x2),snap(y2))
                    if key[0]<key[2] or (key[0]==key[2] and key[1]<key[3]):
                        key=(key[2],key[3],key[0],key[1])
                    lst=edge2prov.get(key,[])
                    pset=set(t[0] for t in lst)
                    # arête de l'outline si l'autre province n'est pas dans cette région
                    if len(lst)<=1 or pset-mids:
                        segs.append(((x1,y1),(x2,y2)))
        loops=chain(segs)
        if not loops:
            for p in members:
                big=max(p['rings'],key=lambda r:abs(ring_area_signed(r)))
                loops.append([rr for rr in big])
        # simplification adaptative
        sm=[]
        for l in loops:
            wl=abs(l[-1][0]-l[0][0])+abs(l[-1][1]-l[0][1])
            tol=0.08
            s2=dp(l,tol)
            if len(s2)<400: sm.append(s2); continue
            s2=dp(l,0.16)
            sm.append(s2)
        pts=[q for l in sm for q in l]
        xs=[q[0] for q in pts]; ys=[q[1] for q in pts]
        cx=sum(xs)/len(xs);cy=sum(ys)/len(ys)
        packed.append([rname,[round(bb,2) for bb in (min(xs),min(ys),max(xs),max(ys))],round(cx,2),round(cy,2),
                       [[[round(x,2),round(y,2)] for x,y in l] for l in sm]])
    out_regions.append(packed)
    total_regions+=len(packed)

j=json.dumps(out_regions,separators=(',',':'),ensure_ascii=False)
print('pays:',len(out_regions),'régions totales:',total_countries_total_regions if False else total_regions,'pays fusionnés (k-means):',merged_countries)
print('taille JSON:',len(j)//1024,'Ko')
open('regions.json','w').write(j)
