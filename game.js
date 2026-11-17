'use strict';
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let rng=mulberry32(Date.now()%100000);
const ri=n=>Math.floor(rng()*n);
const rf=()=>rng();
const pick=a=>a[ri(a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const S1=['Ald','Ber','Cor','Dal','En','Far','Gor','Hal','Ist','Jor','Kel','Lor','Mar','Nor','Or','Par','Quel','Ros','Sal','Tor','Ulm','Ver','Wes','Yar','Zan','Bre','Cal','Dor','Fal','Gar'];
const S2=['heim','stadt','bourg','mont','vale','fort','grad','polis','haven','wick','dorf','cester','shire','gia','nia','mark','land','port','ane','elle'];
const provName=()=>pick(S1)+pick(S2);

const W=24,H=15,CELL=40;
const TERR={water:{move:99},plain:{move:1},forest:{move:2},hills:{move:2},mountain:{move:3}};
const TDEF={plain:1,forest:1.25,hills:1.35,mountain:1.5,water:1};

const UNITS={
infanterie:{n:'Infanterie',d:'land',atk:4,def:8,hp:10,mp:2,cost:{m:120,f:30},up:{m:4}},
inf_mot:{n:'Inf. motorisée',d:'land',atk:6,def:9,hp:12,mp:4,cost:{m:280,o:15},up:{m:8,o:2}},
para:{n:'Parachutistes',d:'land',atk:5,def:6,hp:10,mp:2,air:true,cost:{m:240,f:20,o:10},up:{m:6}},
genie:{n:'Génie',d:'land',atk:2,def:5,hp:10,mp:2,eng:true,cost:{m:220,k:20},up:{m:5}},
char_leger:{n:'Char léger',d:'land',atk:9,def:7,hp:14,mp:4,cost:{m:400,k:40,o:20},up:{m:12,o:3}},
char_lourd:{n:'Char lourd',d:'land',atk:14,def:16,hp:22,mp:3,cost:{m:800,k:90,o:45},up:{m:22,o:5}},
artillerie:{n:'Artillerie',d:'land',atk:11,def:3,hp:8,mp:2,cost:{m:360,k:50},up:{m:10,o:1}},
art_lourde:{n:'Art. lourde',d:'land',atk:19,def:4,hp:10,mp:1,cost:{m:720,k:100,o:15},up:{m:18,o:2}},
lance_roquettes:{n:'Lance-roquettes',d:'land',atk:15,def:3,hp:8,mp:3,cost:{m:540,k:70,o:20},up:{m:14,o:3}},
aa:{n:'Anti-aérien',d:'land',atk:2,def:7,hp:10,mp:2,aa:10,cost:{m:320,k:60},up:{m:8}},
chasseur:{n:'Chasseur',d:'air',atk:10,def:8,hp:10,mp:10,cost:{m:450,k:60,o:35},up:{m:14,o:6}},
rafale:{n:'Rafale',d:'air',atk:20,def:14,hp:14,mp:14,cost:{m:1200,k:140,o:90},up:{m:32,o:12}},
bombardier:{n:'Bombardier',d:'air',atk:23,def:6,hp:12,mp:9,cost:{m:950,k:110,o:75},up:{m:26,o:10}},
heli_attaque:{n:'Hélicoptère d\'attaque',d:'air',atk:12,def:7,hp:10,mp:6,heli:true,cost:{m:520,k:70,o:40},up:{m:16,o:6}},
heli_trans:{n:'Hélicoptère de transport',d:'air',atk:3,def:5,hp:10,mp:6,heli:true,cost:{m:420,k:50,o:30},up:{m:12,o:5}},
transport_aerien:{n:'Transport aérien',d:'air',atk:1,def:4,hp:12,mp:16,airlift:true,cost:{m:650,k:90,o:55},up:{m:18,o:8}},
torpilleur:{n:'Torpilleur',d:'sea',atk:8,def:5,hp:12,mp:5,cost:{m:320,k:70,o:25},up:{m:10,o:3}},
fregate_furtive:{n:'Frégate furtive',d:'sea',atk:15,def:13,hp:14,mp:6,stealth:true,cost:{m:900,k:120,o:55},up:{m:22,o:7}},
destroyer:{n:'Destroyer',d:'sea',atk:14,def:12,hp:18,mp:5,cost:{m:650,k:100,o:45},up:{m:18,o:6}},
sous_marin:{n:'Sous-marin',d:'sea',atk:17,def:8,hp:14,mp:5,stealth:true,cost:{m:700,k:90,o:50},up:{m:20,o:7}},
croiseur:{n:'Croiseur',d:'sea',atk:20,def:18,hp:30,mp:4,cost:{m:1150,k:160,o:75},up:{m:28,o:9}},
cuirasse:{n:'Cuirassé',d:'sea',atk:30,def:28,hp:50,mp:3,cost:{m:2000,k:260,o:120},up:{m:40,o:14}},
porte_avions:{n:'Porte-avions',d:'sea',atk:4,def:10,hp:30,mp:4,capAir:2,cost:{m:1700,k:220,o:110},up:{m:36,o:12}},
porte_helico:{n:'Porte-hélicoptères',d:'sea',atk:5,def:12,hp:28,mp:4,capHeli:3,cost:{m:1300,k:180,o:90},up:{m:30,o:10}},
transport_naval:{n:'Transport naval',d:'sea',atk:2,def:8,hp:20,mp:4,inv:2,cost:{m:480,k:80,o:35},up:{m:12,o:4}},
cargo:{n:'Cargo',d:'sea',atk:0,def:4,hp:14,mp:4,cargoBonus:2,cost:{m:300,k:50,o:20},up:{m:8,o:2}}
};
const BUILDINGS={
port:{n:'Port',m:400,k:80,coastal:true},
aeroport:{n:'Aéroport',m:500,k:100},
autoroute:{n:'Autoroute',m:350,k:60},
rail:{n:'Voie ferrée',m:300,k:50},
canal:{n:'Canal',m:600,k:120,coastal:true},
usine:{n:'Usine',m:450,k:0},
raffinerie:{n:'Raffinerie',m:500,k:60}
};
const TREATY_INFO={
peace:{n:'Non-agression / Paix',min:0},
move:{n:'Libre circulation des personnes',min:25,req:'peace'},
trade:{n:'Libre-échange',min:25,req:'peace'},
alliance:{n:'Alliance',min:55,req:'trade+move'},
bases:{n:'Partage de bases militaires',min:65,req:'alliance'},
union:{n:'Fusion des pays',min:85,req:'bases',special:true}
};
const CDEFS=[
{name:'Valoria',color:'#3b82f6',player:true},
{name:'Kraznavia',color:'#ef4444'},
{name:'Ostmark',color:'#eab308'},
{name:'Albion',color:'#10b981'},
{name:'Tarraconie',color:'#a855f7'},
{name:'Chandara',color:'#f97316'}
];

let countries=[],provinces=[],turn=1,nextId=1,treaties={},rel={},sel=null,moveMode=null,logs=[],offers=[],gameOver=false,tab='prov',selCountry=null,tick=0;
const player=()=>countries[0];
const P=id=>provinces[id];
const pairKey=(a,b)=>a<b?a+'-'+b:b+'-'+a;
function setRel(a,b,v){rel[a][b]=v;rel[b][a]=v;}
const atWar=(a,b)=>a!==b&&!treaties[pairKey(a,b)].peace;
const isAdj=(a,b)=>{const x1=a%W,y1=(a/W)|0,x2=b%W,y2=(b/W)|0;return Math.abs(x1-x2)+Math.abs(y1-y2)===1;};
const mdist=(a,b)=>Math.abs(a%W-b%W)+Math.abs(((a/W)|0)-((b/W)|0));
function neighbors(i){const x=i%W,y=(i/W)|0,r=[];if(x>0)r.push(i-1);if(x<W-1)r.push(i+1);if(y>0)r.push(i-W);if(y<H-1)r.push(i+W);return r;}
const isCoastal=p=>p.terrain!=='water'&&neighbors(p.id).some(n=>P(n).terrain==='water');
const isSeaPassable=p=>p.terrain==='water'||!!p.b.canal;

function log(msg,cls){logs.unshift({t:turn,msg,cls:cls||''});if(logs.length>200)logs.pop();}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.getElementById('toasts').appendChild(d);setTimeout(()=>d.remove(),4200);}

function genMap(){
let elev=[],moist=[];
for(let i=0;i<W*H;i++){elev.push(rf());moist.push(rf());}
for(let pass=0;pass<3;pass++){
const e2=elev.slice(),m2=moist.slice();
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
let se=0,sm=0,n=0;
for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
const nx=x+dx,ny=y+dy;
if(nx>=0&&nx<W&&ny>=0&&ny<H){se+=e2[ny*W+nx];sm+=m2[ny*W+nx];n++;}
}
elev[y*W+x]=e2[y*W+x]*0.45+se/n*0.55;
moist[y*W+x]=m2[y*W+x]*0.45+sm/n*0.55;
}
}
const sorted=elev.slice().sort((a,b)=>a-b);
const qt=sorted[Math.floor(W*H*0.34)];
provinces=[];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
const i=y*W+x,e=elev[i],mo=moist[i];
let t;
if(e<qt)t='water';else if(e>0.8)t='mountain';else if(e>0.68)t='hills';else if(mo>0.63)t='forest';else t='plain';
const p={id:i,x,y,terrain:t,owner:null,name:provName(),g:{},b:{},cap:false,oil:false,res:{money:6+ri(9),food:0,mat:0}};
if(t==='plain')p.res.food=4+ri(5);else if(t==='forest')p.res.food=2+ri(3);else p.res.mat=2+ri(4);
if(t==='hills'||t==='mountain')p.res.mat+=2+ri(4);
if(t!=='water'&&rf()<0.06){p.oil=true;p.res.oil=3+ri(4);}
provinces.push(p);
}
}

function setupCountries(){
const caps=[];let tries=0,minD=7;
while(caps.length<CDEFS.length&&tries<8000){tries++;
if(tries%1500===0)minD--;
const c=P(ri(W*H));
if(c.terrain==='water'||c.terrain==='mountain')continue;
if(caps.every(k=>mdist(k.id,c.id)>=minD))caps.push(c);
}
countries=CDEFS.map((d,i)=>({id:i,name:d.name,color:d.color,isPlayer:!!d.player,alive:true,money:2500,mat:600,oil:400,food:400,tax:30,tar:{},capital:caps[i].id}));
for(const a of countries){rel[a.id]={};for(const b of countries)if(b.id!==a.id)rel[a.id][b.id]=-10+ri(40);}
for(const a of countries)for(const b of countries)if(b.id>a.id)rel[a.id][b.id]=rel[b.id][a.id]=(-10+ri(40));
for(let a=0;a<countries.length;a++)for(let b=a+1;b<countries.length;b++)treaties[pairKey(a,b)]={peace:true,move:false,trade:false,alliance:false,bases:false};
const ownerOf=new Array(W*H).fill(-1);
const frontier=[];
caps.forEach((c,i)=>{ownerOf[c.id]=i;c.owner=i;c.cap=true;frontier.push(c.id);});
let guard=0;
while(frontier.length&&guard++<200000){
const idx=ri(frontier.length);const cur=frontier[idx];
const nbs=neighbors(cur).filter(n=>P(n).terrain!=='water'&&ownerOf[n]===-1);
if(!nbs.length){frontier.splice(idx,1);continue;}
const n=nbs[ri(nbs.length)];ownerOf[n]=ownerOf[cur];P(n).owner=ownerOf[cur];frontier.push(n);
}
for(const p of provinces)if(p.terrain!=='water'&&p.owner===null){p.owner=ri(countries.length);}
}

function gdp(cid){let g=0;for(const p of provinces)if(p.owner===cid)g+=p.res.money;return g;}
function power(cid){let s=0;for(const p of provinces)for(const oid in p.g)if(+oid===cid)for(const u of p.g[oid])s+=UNITS[u.t].atk+UNITS[u.t].def;return s;}

function economy(c){
let money=0,mat=0,oil=0,food=0,cargo=0;
for(const p of provinces)if(p.owner===c.id){
let mult=1;
if(p.b.autoroute)mult+=0.2;if(p.b.rail)mult+=0.1;if(p.b.port)mult+=0.15;if(p.b.canal)mult+=0.15;
money+=p.res.money*mult*(0.5+c.tax/100);
mat+=p.res.mat+(p.b.usine?6:0);
oil+=(p.res.oil||0)+(p.b.raffinerie?4:0);
food+=p.res.food;
}
for(const p of provinces)for(const oid in p.g)if(+oid===c.id)for(const u of p.g[oid])if(UNITS[u.t].cargoBonus)cargo+=UNITS[u.t].cargoBonus;
money+=cargo*2;
const trade=[];
for(const o of countries)if(o.alive&&o.id!==c.id&&treaties[pairKey(c.id,o.id)].peace){
const t=treaties[pairKey(c.id,o.id)];
const eff=Math.max(c.tar[o.id]||0,o.tar[c.id]||0);
let vol=(gdp(c.id)+gdp(o.id))*0.03*(t.trade?1.6:0.6)*(1-eff/100*1.2);
vol=Math.max(0,vol);
const inc=vol*0.4+vol*eff/100;
money+=inc;trade.push({o:o.id,vol:Math.round(vol),inc:Math.round(inc),eff});
}
let um=0,uo=0;
for(const p of provinces)for(const oid in p.g)if(+oid===c.id)for(const u of p.g[oid]){um+=UNITS[u.t].up.m||0;uo+=UNITS[u.t].up.o||0;}
return{money:Math.round(money),mat:Math.round(mat),oil:Math.round(oil),food:Math.round(food),um,uo,trade};
}

function applyEconomy(c){
const e=economy(c);
c.money+=e.money-e.um;c.mat+=e.mat;c.oil+=e.oil-e.uo;c.food+=e.food;
if(c.money<0){c.money=0;const u=allCountryUnits(c.id);if(u.length){removeUnit(pick(u));if(c.isPlayer)toast('Trésorerie épuisée : une unité a déserté !');}}
if(c.oil<0)c.oil=0;
for(const o of countries)if(o.alive&&o.id!==c.id){
const t=treaties[pairKey(c.id,o.id)];
if(t.trade){rel[c.id][o.id]=clamp(rel[c.id][o.id]+0.3,-100,100);rel[o.id][c.id]=rel[c.id][o.id];}
const eff=Math.max(c.tar[o.id]||0,o.tar[c.id]||0);
if(eff>0){rel[c.id][o.id]=clamp(rel[c.id][o.id]-eff*0.02,-100,100);rel[o.id][c.id]=rel[c.id][o.id];}
}
}
function allCountryUnits(cid){const r=[];for(const p of provinces)for(const oid in p.g)if(+oid===cid)for(const u of p.g[oid])r.push(u);return r;}

function newUnit(t,o){return{id:nextId++,t,o,hp:UNITS[t].hp,mp:UNITS[t].mp,cargoU:[]};}
function removeUnit(u){for(const p of provinces){const g=p.g[u.o];if(g){const i=g.indexOf(u);if(i>=0){g.splice(i,1);if(!g.length)delete p.g[u.o];return;}}}}
function moveUnit(u,from,to){const g=from.g[u.o];const i=g.indexOf(u);if(i>=0)g.splice(i,1);if(!g.length)delete from.g[u.o];(to.g[u.o]=to.g[u.o]||[]).push(u);}
function unitsAt(p){const r=[];for(const oid in p.g)for(const u of p.g[oid])r.push(u);return r;}
function enemiesAt(p,c){return unitsAt(p).filter(u=>atWar(c,u.o));}
function myUnitsAt(p,c){return(p.g[c]||[]).slice();}

function afford(c,cost){return c.money>=(cost.m||0)&&c.mat>=(cost.k||0)&&c.oil>=(cost.o||0)&&c.food>=(cost.f||0);}
function pay(c,cost){c.money-=cost.m||0;c.mat-=cost.k||0;c.oil-=cost.o||0;c.food-=cost.f||0;}
function costStr(cost){const p=[];if(cost.m)p.push(cost.m+' M');if(cost.k)p.push(cost.k+' mat.');if(cost.o)p.push(cost.o+' pét.');if(cost.f)p.push(cost.f+' nourr.');return p.join(', ');}

function build(c,p,key){
const B=BUILDINGS[key];
if(p.b[key])return false;
if(B.coastal&&!isCoastal(p))return false;
let cost={m:B.m,k:B.k};
const g=(p.g[c.id]||[]).some(u=>UNITS[u.t].eng);
if(g)cost.m=Math.round(cost.m*0.75);
if(!afford(c,cost))return false;
pay(c,cost);p.b[key]=true;
if(c.isPlayer)toast(B.n+' construit dans '+p.name);
return true;
}

function canRecruit(c,tid,p){
const U=UNITS[tid];
if(U.d==='sea'&&!p.b.port)return false;
if(U.d==='air'&&!p.b.aeroport)return false;
if(!afford(c,U.cost))return false;
if(U.d==='sea'){
const ok=neighbors(p.id).some(n=>isSeaPassable(P(n)));
if(!ok)return false;
}
return true;
}
function recruit(c,tid,p){
if(!canRecruit(c,tid,p))return false;
const U=UNITS[tid];
pay(c,U.cost);
const u=newUnit(tid,c.id);
if(U.d==='sea'){
const dest=pick(neighbors(p.id).map(n=>P(n)).filter(isSeaPassable));
(dest.g[c.id]=dest.g[c.id]||[]).push(u);
}else{
(p.g[c.id]=p.g[c.id]||[]).push(u);
}
if(c.isPlayer)toast(U.n+' recruté');
return true;
}

function kindOf(u){return UNITS[u.t].heli?'heli':'plane';}
function baseFriendly(c,other){return c===other||(treaties[pairKey(c,other)]&&treaties[pairKey(c,other)].bases);}
function carrierOK(c,p,u){
const k=kindOf(u);
let cap=0,used=0;
for(const oid in p.g){
const o=+oid;
if(!baseFriendly(c,o))continue;
for(const x of p.g[oid]){
const U=UNITS[x.t];
if(k==='plane'&&U.capAir)cap+=U.capAir;
if(k==='heli'&&U.capHeli)cap+=U.capHeli;
if(UNITS[x.t].d==='air'&&kindOf(x)===k&&baseFriendly(x.o,c))used++;
}
}
return used<cap;
}

function applyLoss(u,frac){
if(UNITS[u.t].stealth)frac*=0.5;
u.hp-=frac*UNITS[u.t].hp*(0.7+rf()*0.6);
if(u.hp<=1)removeUnit(u);
}
function resolveCombat(att,to){
const me=att[0].o;
const defs=enemiesAt(to,me);
if(!defs.length)return true;
const air=att.filter(u=>UNITS[u.t].d==='air');
const flak=defs.reduce((s,u)=>s+(UNITS[u.t].aa||0),0);
let atkPow=0,defPow=0;
for(const u of att)atkPow+=UNITS[u.t].atk*(u.hp/UNITS[u.t].hp);
for(const u of defs)defPow+=UNITS[u.t].def*(u.hp/UNITS[u.t].hp)*(TDEF[to.terrain]||1);
atkPow*=0.8+rf()*0.4;defPow*=0.8+rf()*0.4;
const ratio=(atkPow+defPow)>0?atkPow/(atkPow+defPow):0;
const defFrac=0.25+0.55*ratio,atkFrac=0.25+0.55*(1-ratio);
for(const u of defs.slice())applyLoss(u,defFrac);
for(const u of att.slice())if(u.hp>1)applyLoss(u,atkFrac);
if(flak>0)for(const u of air.slice())if(u.hp>1)applyLoss(u,flak*0.05);
return enemiesAt(to,me).length===0;
}
function captureIfClear(to,me){
if(to.terrain==='water')return;
const old=to.owner;
if(old!==null&&old!==me&&(to.owner===null||atWar(me,old))&&enemiesAt(to,me).length===0){
to.owner=me;to.cap=false;
checkDead(old);
}
}
function checkDead(cid){
const c=countries[cid];
if(!c||!c.alive)return;
if(!provinces.some(p=>p.owner===cid)){
c.alive=false;
for(const u of allCountryUnits(cid))removeUnit(u);
log('💀 '+c.name+' a cessé d\'exister.','war');
}
}

function attemptMove(from,to,units){
if(!units.length)return;
const me=units[0].o;
const domains=new Set(units.map(u=>UNITS[u.t].d));
if(domains.size>1){toast('Impossible : domaines mélangés (terre/mer/air).');return;}
const d=[...domains][0];
if(d==='land'){
if(!isAdj(from.id,to.id)||to.terrain==='water'){toast('Cible terrestre adjacente requise.');return;}
const hostile=(to.owner!==null&&to.owner!==me&&atWar(me,to.owner))||enemiesAt(to,me).length>0;
if(hostile){
units.forEach(u=>u.mp=0);
if(resolveCombat(units,to)){
captureIfClear(to,me);
if(to.owner===me)for(const u of units.slice())if(u.hp>1)moveUnit(u,from,to);
}
return;
}
if(to.owner!==me&&to.owner!==null&&!treaties[pairKey(me,to.owner)].move){toast('Libre circulation refusée par ce pays.');return;}
let cost=TERR[to.terrain].move;
if(from.b.rail||to.b.rail)cost=Math.max(1,cost-1);
if(to.b.autoroute)cost=Math.max(1,cost-1);
for(const u of units.slice())if(u.mp>=cost){moveUnit(u,from,to);u.mp-=cost;}
}else if(d==='air'){
const dist=mdist(from.id,to.id);
const hostile=(to.owner!==null&&to.owner!==me&&atWar(me,to.owner))||enemiesAt(to,me).length>0;
if(hostile){
for(const u of units.slice())if(u.mp>=dist)u.mp=0;
resolveCombat(units,to);
return;
}
for(const u of units.slice()){
if(u.mp<dist)continue;
if(to.terrain==='water'){
if(!carrierOK(me,to,u))continue;
}else if(to.owner!==null&&to.owner!==me&&!treaties[pairKey(me,to.owner)].peace)continue;
moveUnit(u,from,to);u.mp-=dist;
}
}else{
if(!isSeaPassable(to)||!isAdj(from.id,to.id)){toast('Case maritime adjacente requise.');return;}
if(enemiesAt(to,me).length>0){
units.forEach(u=>u.mp=0);
resolveCombat(units,to);
return;
}
for(const u of units.slice())if(u.mp>=1){moveUnit(u,from,to);u.mp-=1;}
}
}

function embarquer(p){
const me=p.owner;let loaded=0;
outer:
for(const nid of neighbors(p.id)){
const sp=P(nid);
if(!isSeaPassable(sp))continue;
for(const u of(sp.g[me]||[]).slice()){
const U=UNITS[u.t];
if(!U.inv)continue;
while(u.cargoU.length<U.inv){
const land=(p.g[me]||[]).find(x=>UNITS[x.t].d==='land');
if(!land)break outer;
removeUnit(land);u.cargoU.push(land.t);loaded++;
}
}
}
toast(loaded?('Embarqué '+loaded+' unité(s).'):'Aucun transport avec de la place à proximité.');
}
function debarquer(from,to,trans){
const me=trans.o;
const units=trans.cargoU.map(t=>newUnit(t,me));
trans.cargoU=[];
const hostile=(to.owner!==null&&to.owner!==me&&atWar(me,to.owner))||enemiesAt(to,me).length>0;
if(hostile){
if(resolveCombat(units,to)){
captureIfClear(to,me);
if(to.owner===me)for(const u of units)if(u.hp>1){u.mp=0;(to.g[me]=to.g[me]||[]).push(u);}
}
}else{
for(const u of units){u.mp=0;(to.g[me]=to.g[me]||[]).push(u);}
}
}

function applyTreaty(a,b,kind){
if(kind==='peace'){treaties[pairKey(a,b)].peace=true;return;}
if(kind==='union'){merge(countries[b],countries[a]);return;}
treaties[pairKey(a,b)][kind]=true;
}
function declareWar(a,b){
const t=treaties[pairKey(a,b)];
t.peace=false;t.move=false;t.trade=false;t.alliance=false;t.bases=false;
rel[a][b]=rel[b][a]=-60;
log('⚔️ Guerre : '+countries[a].name+' vs '+countries[b].name+' !','war');
}
function aiAccept(cid,kind){
const c=countries[cid],me=player();
const r=rel[cid][0]+ri(21)-10;
const ratio=power(cid)/Math.max(1,power(0));
if(kind==='union')return r>=85&&treaties[pairKey(cid,0)].bases&&ratio<0.55;
const inf=TREATY_INFO[kind];
if(inf.req){
if(inf.req.includes('alliance')&&!treaties[pairKey(cid,0)].alliance)return false;
if(inf.req.includes('trade')&&!treaties[pairKey(cid,0)].trade)return false;
if(inf.req.includes('move')&&!treaties[pairKey(cid,0)].move)return false;
if(inf.req==='alliance'&&(!treaties[pairKey(cid,0)].trade||!treaties[pairKey(cid,0)].move))return false;
if(inf.req==='bases'&&!treaties[pairKey(cid,0)].alliance)return false;
}
if(kind==='peace')return true;
return r>=inf.min;
}
function propose(cid,kind){
const c=countries[cid];
if(kind==='war'){declareWar(0,cid);render();return;}
if(!treaties[pairKey(0,cid)].peace&&kind!=='peace'){toast('Impossible en temps de guerre.');return;}
if(aiAccept(cid,kind)){
applyTreaty(0,cid,kind);
log('🤝 '+c.name+' accepte : '+TREATY_INFO[kind].n+'.','dip');
toast(c.name+' accepte : '+TREATY_INFO[kind].n+' !');
}else{
rel[cid][0]=rel[0][cid]=clamp(rel[cid][0]-3,-100,100);
log('❌ '+c.name+' refuse : '+TREATY_INFO[kind].n+'.','dip');
toast(c.name+' refuse votre proposition.');
}
render();
}
function merge(src,dst){
for(const p of provinces)if(p.owner===src.id)p.owner=dst.id;
for(const p of provinces){
const g=p.g[src.id];
if(g){for(const u of g)u.o=dst.id;(p.g[dst.id]=p.g[dst.id]||[]).push(...g);delete p.g[src.id];}
}
dst.money+=src.money;dst.mat+=src.mat;dst.oil+=src.oil;dst.food+=src.food;
src.alive=false;
for(const o of countries)if(o.alive&&o.id!==dst.id){rel[o.id][dst.id]=clamp(rel[o.id][dst.id]-15,-100,100);rel[dst.id][o.id]=rel[o.id][dst.id];}
log('🎊 FUSION : '+src.name+' rejoint '+dst.name+' ! Un seul pays désormais.','good');
toast('FUSION RÉUSSIE : '+src.name+' rejoint '+dst.name+' !');
}

function aiTurn(c){
applyEconomy(c);
const own=provinces.filter(p=>p.owner===c.id);
if(!own.length){checkDead(c.id);return;}
if(rf()<0.35){
const p=pick(own);
const keys=Object.keys(BUILDINGS).filter(k=>!p.b[k]&&(!BUILDINGS[k].coastal||isCoastal(p))&&afford(c,{m:BUILDINGS[k].m,k:BUILDINGS[k].k}));
if(keys.length)build(c,p,pick(keys));
}
const pool=['infanterie','infanterie','inf_mot','char_leger','artillerie','char_lourd','art_lourde','lance_roquettes','aa','chasseur','rafale','bombardier','heli_attaque','torpilleur','destroyer','fregate_furtive','sous_marin','croiseur','cuirasse','porte_avions','porte_helico','transport_naval','cargo'];
for(let i=0;i<3;i++){
const tid=pick(pool);
const spots=own.filter(p=>canRecruit(c,tid,p));
if(spots.length&&recruit(c,tid,pick(spots)))break;
}
const enemies=countries.filter(o=>o.alive&&atWar(c.id,o.id));
if(enemies.length){
const targets=[];
for(const p of own){
if(!myUnitsAt(p,c.id).length)continue;
for(const n of neighbors(p.id)){
const np=P(n);
if(np.owner!==null&&enemies.some(e=>e.id===np.owner))targets.push({from:p,to:np});
else if(enemiesAt(np,c.id).length)targets.push({from:p,to:np});
}
}
for(const t of targets){
const units=myUnitsAt(t.from,c.id).filter(u=>u.mp>0);
if(units.length)attemptMove(t.from,t.to,units);
}
}
if(turn%4===0){
const r=rel[c.id][0];
if(r>=55&&!treaties[pairKey(c.id,0)].alliance&&treaties[pairKey(c.id,0)].peace)offers.push({from:c.id,kind:'alliance'});
else if(r>=25&&!treaties[pairKey(c.id,0)].trade&&treaties[pairKey(c.id,0)].peace)offers.push({from:c.id,kind:'trade'});
else if(r>=25&&!treaties[pairKey(c.id,0)].move&&treaties[pairKey(c.id,0)].peace)offers.push({from:c.id,kind:'move'});
else if(!treaties[pairKey(c.id,0)].peace&&r>=-10)offers.push({from:c.id,kind:'peace'});
else if(r>=65&&treaties[pairKey(c.id,0)].alliance&&!treaties[pairKey(c.id,0)].bases)offers.push({from:c.id,kind:'bases'});
}
}

function endTurn(){
if(gameOver)return;
moveMode=null;
applyEconomy(player());
for(const c of countries)if(!c.isPlayer&&c.alive)aiTurn(c);
for(const p of provinces)for(const oid in p.g)for(const u of p.g[oid])u.mp=UNITS[u.t].mp;
turn++;
offers=offers.filter(o=>countries[o.from].alive);
checkVictory();
render();
}
function checkVictory(){
const land=provinces.filter(p=>p.terrain!=='water').length;
const mine=provinces.filter(p=>p.owner===0).length;
if(mine===0){gameOver=true;showEnd('DÉFAITE','Toutes vos provinces ont été conquises. L\'histoire retiendra votre chute.');}
else if(mine>=land*0.55){gameOver=true;showEnd('VICTOIRE','Vous contrôlez plus de 55% du monde connu. Votre union domine la planète !');}
}
function showEnd(title,txt){
const box=document.getElementById('introbox');
box.innerHTML='<h2>'+title+'</h2><p>'+txt+'</p><button class="big" onclick="location.reload()">Rejouer</button>';
document.getElementById('overlay').style.display='flex';
}

function fmt(cid){
const c=countries[cid];const e=economy(c);
const net=e.money-e.um;
return '<span>💰 <b>'+Math.round(c.money)+'</b> <small>('+ (net>=0?'+':'')+net+')/t</small></span>'+
'<span>🧱 <b>'+Math.round(c.mat)+'</b> <small>(+'+e.mat+')</small></span>'+
'<span>🛢 <b>'+Math.round(c.oil)+'</b> <small>('+(e.oil-e.uo>=0?'+':'')+(e.oil-e.uo)+')</small></span>'+
'<span>🌾 <b>'+Math.round(c.food)+'</b></span>';
}

function render(){
const cv=document.getElementById('map'),ctx=cv.getContext('2d');
ctx.clearRect(0,0,cv.width,cv.height);
for(const p of provinces){
let base='#123a5c';
if(p.terrain!=='water'){
const c=p.owner!==null?countries[p.owner]:null;
base=c?c.color:'#555';
}
ctx.fillStyle=base;
ctx.fillRect(p.x*CELL,p.y*CELL,CELL,CELL);
if(p.terrain!=='water'){
ctx.fillStyle='rgba(0,0,0,0.35)';
ctx.fillRect(p.x*CELL,p.y*CELL,CELL,CELL);
ctx.globalAlpha=0.5;ctx.fillStyle=base;
ctx.fillRect(p.x*CELL+1,p.y*CELL+1,CELL-2,CELL-2);
ctx.globalAlpha=1;
if(p.terrain==='mountain'){ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fillText('▲',p.x*CELL+14,p.y*CELL+22);}
else if(p.terrain==='forest'){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillText('♣',p.x*CELL+13,p.y*CELL+23);}
else if(p.terrain==='hills'){ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillText('〰',p.x*CELL+12,p.y*CELL+23);}
if(p.oil){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(p.x*CELL+CELL-9,p.y*CELL+9,4,0,7);ctx.fill();}
}
if(p.b.rail){ctx.strokeStyle='#111';ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(p.x*CELL,p.y*CELL+CELL/2);ctx.lineTo(p.x*CELL+CELL,p.y*CELL+CELL/2);ctx.stroke();ctx.setLineDash([]);}
if(p.b.autoroute){ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x*CELL,p.y*CELL+CELL-8);ctx.lineTo(p.x*CELL+CELL,p.y*CELL+CELL-8);ctx.stroke();ctx.lineWidth=1;}
if(p.b.canal){ctx.strokeStyle='#38bdf8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x*CELL+CELL/2,p.y*CELL);ctx.lineTo(p.x*CELL+CELL/2,p.y*CELL+CELL);ctx.stroke();ctx.lineWidth=1;}
if(p.b.port){ctx.fillStyle='#fff';ctx.fillText('⚓',p.x*CELL+2,p.y*CELL+11);}
if(p.b.aeroport){ctx.fillStyle='#fff';ctx.fillText('✈',p.x*CELL+CELL-14,p.y*CELL+26);}
if(p.cap){ctx.fillStyle='#fde047';ctx.fillText('★',p.x*CELL+2,p.y*CELL+CELL-3);}
const us=unitsAt(p);
if(us.length){
const byMe=us.filter(u=>u.o===0).length;
const other=us.length-byMe;
if(byMe){ctx.fillStyle='#fff';ctx.fillRect(p.x*CELL+CELL-16,p.y*CELL+CELL-15,15,13);ctx.fillStyle='#0b1220';ctx.fillText(byMe,p.x*CELL+CELL-13,p.y*CELL+CELL-4);}
if(other){ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(p.x*CELL+9,p.y*CELL+CELL-8,5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(other,p.x*CELL+6,p.y*CELL+CELL-4);}
}
ctx.strokeStyle='rgba(0,0,0,0.25)';
ctx.strokeRect(p.x*CELL,p.y*CELL,CELL,CELL);
}
for(const p of provinces){
if(p.terrain==='water')continue;
const right=P(Math.min(W-1,p.x+1)+p.y*W);
const down=P(p.x+Math.min(H-1,p.y+1)*W);
ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2;
if(right&&right.terrain!=='water'&&right.owner!==p.owner){ctx.beginPath();ctx.moveTo(p.x*CELL+CELL,p.y*CELL);ctx.lineTo(p.x*CELL+CELL,p.y*CELL+CELL);ctx.stroke();}
if(down&&down.terrain!=='water'&&down.owner!==p.owner){ctx.beginPath();ctx.moveTo(p.x*CELL,p.y*CELL+CELL);ctx.lineTo(p.x*CELL+CELL,p.y*CELL+CELL);ctx.stroke();}
ctx.lineWidth=1;
}
if(sel){
ctx.strokeStyle=moveMode?'#f59e0b':'#fff';ctx.lineWidth=3;
ctx.strokeRect(sel.x*CELL+1,sel.y*CELL+1,CELL-2,CELL-2);ctx.lineWidth=1;
}
document.getElementById('turnlab').textContent='Tour '+turn;
document.getElementById('resbar').innerHTML=fmt(0);
renderPanel();
}

function unitLine(u){
const U=UNITS[u.t];
return '<div class="unitrow"><label><input type="checkbox" data-uid="'+u.id+'" class="usel" checked> '+U.n+'</label><small>'+Math.max(0,Math.round(u.hp))+'/'+U.hp+' hp · '+u.mp+' pm'+(u.cargoU.length?' · 📦'+u.cargoU.length:'')+'</small></div>';
}

function renderPanel(){
const el=document.getElementById('panel');
if(tab==='prov'){
if(!sel){el.innerHTML='<div class="card"><h3>Aucune sélection</h3><small>Cliquez sur une province. Sélectionnez vos unités puis « Déplacer / Attaquer » et cliquez la destination.</small></div>';return;}
const p=sel;
let h='<div class="card"><h3>'+p.name+(p.cap?' ★':'')+'</h3><small>';
h+='Terrain : '+p.terrain+' · ';
h+='Propriétaire : '+(p.owner!==null?countries[p.owner].name:'Eau / international')+'</small>';
if(p.terrain!=='water'){
h+='<br><small>💰'+p.res.money+' 🌾'+p.res.food+' 🧱'+p.res.mat+(p.oil?' 🛢'+p.res.oil:'')+'</small>';
h+='<div>'+Object.keys(p.b).map(k=>'<span class="tag on">'+BUILDINGS[k].n+'</span>').join('')+'</div>';
}
h+='</div>';
const mine=myUnitsAt(p,0);
if(mine.length){
h+='<div class="card"><h4>Vos unités ('+mine.length+')</h4>'+mine.map(unitLine).join('');
const domains=new Set(mine.map(u=>UNITS[u.t].d));
h+='<div style="margin-top:6px">';
h+='<button id="mvbtn">Déplacer / Attaquer</button>';
if(p.terrain!=='water'&&p.owner===0&&domains.has('land')&&neighbors(p.id).some(n=>isSeaPassable(P(n))&&(P(n).g[0]||[]).some(u=>UNITS[u.t].inv&&u.cargoU.length<UNITS[u.t].inv)))h+='<button id="embbtn">Embarquer 🚢</button>';
if((p.g[0]||[]).some(u=>UNITS[u.t].airlift))h+='<button id="airbtn">Aéroportage ✈</button>';
if((p.g[0]||[]).some(u=>u.cargoU.length))h+='<small style="display:block;margin-top:4px">Sélectionnez une case côtière adjacente après « Déplacer » pour débarquer un transport sélectionné.</small>';
h+='</div></div>';
}
const others=unitsAt(p).filter(u=>u.o!==0);
if(others.length){
h+='<div class="card"><h4>Présence étrangère</h4>';
const byC={};
for(const u of others)(byC[u.o]=byC[u.o]||[]).push(u);
for(const oid in byC)h+='<h4 style="color:'+countries[oid].color+'">'+countries[oid].name+'</h4>'+byC[oid].map(unitLine).join('');
h+='</div>';
}
if(p.terrain!=='water'&&p.owner===0&&!gameOver){
h+='<div class="card"><h4>Construire</h4>';
for(const k in BUILDINGS){
const B=BUILDINGS[k];
if(p.b[k])continue;
if(B.coastal&&!isCoastal(p))continue;
let cost={m:B.m,k:B.k};
const eng=(p.g[0]||[]).some(u=>UNITS[u.t].eng);
if(eng)cost.m=Math.round(cost.m*0.75);
h+='<button data-build="'+k+'" '+(afford(player(),cost)?'':'disabled')+'>'+B.n+' <small>('+costStr(cost)+(eng?' -25% 🛠':'')+')</small></button>';
}
h+='</div>';
if(p.owner===0){
h+='<div class="card"><h4>Recruter</h4><select id="recsel">';
for(const tid in UNITS)h+='<option value="'+tid+'">'+UNITS[tid].n+' — '+costStr(UNITS[tid].cost)+'</option>';
h+='</select><button id="recbtn">Recruter ici</button>';
if(UNITS[document.getElementById('recsel')?document.getElementById('recsel').value:'infanterie']&&UNITS[(document.getElementById('recsel')||{}).value]&&UNITS[(document.getElementById('recsel')||{}).value].d==='sea')h+='<small>Les navires apparaissent en mer adjacente (port requis).</small>';
h+='</div>';
}
}
el.innerHTML=h;
const mv=document.getElementById('mvbtn');
if(mv)mv.onclick=()=>{
const units=[...document.querySelectorAll('.usel:checked')].map(c=>findUnit(+c.dataset.uid)).filter(Boolean);
if(!units.length){toast('Aucune unité sélectionnée.');return;}
moveMode={units};toast('Cliquez la case de destination…');render();
};
const emb=document.getElementById('embbtn');
if(emb)emb.onclick=()=>{embarquer(p);render();};
const air=document.getElementById('airbtn');
if(air)air.onclick=()=>{
const trans=(p.g[0]||[]).find(u=>UNITS[u.t].airlift);
const units=[...document.querySelectorAll('.usel:checked')].map(c=>findUnit(+c.dataset.uid)).filter(u=>u&&UNITS[u.t].d==='land').slice(0,2);
if(!trans){toast('Aucun transport aérien ici.');return;}
if(!units.length){toast('Sélectionnez 1-2 unités terrestres (infanterie/para).');return;}
moveMode={units,airlift:trans};
toast('Cliquez une province alliée/amie à portée ('+UNITS[trans.t].mp+' de distance).');
};
const rb=document.getElementById('recbtn');
if(rb)rb.onclick=()=>{
const tid=document.getElementById('recsel').value;
recruit(player(),tid,p);render();
};
document.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{
build(player(),p,b.dataset.build);render();
});
}else if(tab==='eco'){
const c=player();const e=economy(c);
let h='<div class="card"><h3>Économie de '+c.name+'</h3>';
h+='<div class="unitrow"><span>Revenus provinces + commerce</span><b>+'+e.money+'</b></div>';
h+='<div class="unitrow"><span>Entretien des troupes</span><b style="color:var(--bad)">-'+e.um+'</b></div>';
h+='<div class="unitrow"><span>Pétrole (prod - conso)</span><b>'+(e.oil-e.uo>=0?'+':'')+(e.oil-e.uo)+'</b></div>';
h+='<div class="unitrow"><span>Matériaux</span><b>+'+e.mat+'</b></div>';
h+='<div class="unitrow"><span>Nourriture</span><b>+'+e.food+'</b></div></div>';
h+='<div class="card"><h4>Impôts nationaux : '+c.tax+'%</h4><input type="range" min="0" max="100" value="'+c.tax+'" id="taxr" style="width:100%"><small>Plus d\'impôts = plus d\'argent immédiat.</small></div>';
h+='<div class="card"><h4>Commerce extérieur</h4>';
if(!e.trade.length)h+='<small>Aucun commerce (guerres en cours). Signez des traités de libre-échange !</small>';
for(const t of e.trade)h+='<div class="unitrow"><span>'+countries[t.o].name+(t.eff>0?' <small>(tarif '+t.eff+'%)</small>':'')+'</span><b>+'+t.inc+'</b></div>';
h+='</div>';
h+='<div class="card"><h4>Puissance</h4><div class="unitrow"><span>Votre puissance militaire</span><b>'+power(0)+'</b></div>';
for(const o of countries)if(o.alive&&o.id!==0)h+='<div class="unitrow"><span>'+o.name+'</span><b>'+power(o.id)+'</b></div>';
h+='</div>';
el.innerHTML=h;
document.getElementById('taxr').oninput=ev=>{player().tax=+ev.target.value;render();};
}else if(tab==='dip'){
let h='';
if(offers.length){
h+='<div class="card"><h3>Propositions reçues</h3>';
for(let i=0;i<offers.length;i++){
const o=offers[i];
h+='<div class="unitrow"><span>'+countries[o.from].name+' propose : '+TREATY_INFO[o.kind].n+'</span><span><button data-acc="'+i+'" class="ok">✔</button> <button data-rej="'+i+'" class="danger">✘</button></span></div>';
}
h+='</div>';
}
h+='<div class="card"><h3>Pays du monde</h3>';
for(const c of countries){
if(!c.alive||c.id===0)continue;
const t=treaties[pairKey(0,c.id)];
const r=Math.round(rel[0][c.id]);
h+='<div class="card"><h4 style="color:'+c.color+'">'+c.name+' <small>(puissance '+power(c.id)+')</small></h4>';
h+='<div class="relbar"><i style="left:'+(r+100)/2+'%;width:50%;background:'+(r>=0?'var(--ok)':'var(--bad)')+'"></i><i style="left:50%;width:2px;background:#fff"></i></div>';
h+='<small>Relations : '+r+' · Tarif douanier que VOUS appliquez : '+(player().tar[c.id]||0)+'%</small><br>';
h+=Object.keys(TREATY_INFO).map(k=>{
if(k==='union')return t.bases?'<span class="tag '+(t.bases?'on':'')+'">Fusion possible</span>':'';
return '<span class="tag '+(t[k]?'on':'')+'">'+TREATY_INFO[k].n.split(' ')[0]+'</span>';
}).join('');
h+='<br><select id="dipsel-'+c.id+'">';
for(const k in TREATY_INFO)h+='<option value="'+k+'">'+TREATY_INFO[k].n+'</option>';
h+='<option value="war">⚔ Déclarer la guerre</option>';
h+='</select><button data-prop="'+c.id+'">Proposer</button>';
h+='<input type="range" min="0" max="50" value="'+(player().tar[c.id]||0)+'" data-tar="'+c.id+'" style="width:100%"><small>Taxe douanière sur leurs marchandises (rabote le commerce, gêne les relations)</small>';
h+='</div>';
}
h+='</div>';
el.innerHTML=h;
document.querySelectorAll('[data-prop]').forEach(b=>b.onclick=()=>{
const cid=+b.dataset.prop;
const kind=document.getElementById('dipsel-'+cid).value;
propose(cid,kind);
});
document.querySelectorAll('[data-tar]').forEach(s=>s.oninput=ev=>{
player().tar[+ev.target.dataset.tar]=+ev.target.value;
});
document.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>{
const o=offers[+b.dataset.acc];
applyTreaty(0,o.from,o.kind);
log('🤝 Vous acceptez : '+TREATY_INFO[o.kind].n+' avec '+countries[o.from].name+'.','dip');
offers.splice(+b.dataset.acc,1);render();
});
document.querySelectorAll('[data-rej]').forEach(b=>b.onclick=()=>{
const o=offers[+b.dataset.rej];
rel[o.from][0]=rel[0][o.from]=clamp(rel[o.from][0]-3,-100,100);
offers.splice(+b.dataset.rej,1);render();
});
}else{
let h='<div class="card"><h3>Journal du monde</h3>';
if(!logs.length)h+='<small>Rien à signaler.</small>';
for(const l of logs)h+='<div class="logentry '+l.cls+'"><span class="t">T'+l.t+'</span>'+l.msg+'</div>';
h+='</div>';
el.innerHTML=h;
}
}
function findUnit(uid){
for(const p of provinces)for(const oid in p.g)for(const u of p.g[oid])if(u.id===uid)return u;
return null;
}

document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{
document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('on'));
b.classList.add('on');tab=b.dataset.tab;render();
});
document.getElementById('endbtn').onclick=endTurn;
document.getElementById('helpbtn').onclick=showHelp;
const cv=document.getElementById('map');
cv.addEventListener('click',ev=>{
if(gameOver)return;
const rect=cv.getBoundingClientRect();
const x=Math.floor((ev.clientX-rect.left)/CELL),y=Math.floor((ev.clientY-rect.top)/CELL);
if(x<0||x>=W||y<0||y>=H)return;
const p=P(y*W+x);
if(moveMode){
const from=provinces.find(q=>(q.g[moveMode.units[0].o]||[]).includes(moveMode.units[0]))||provinces.find(q=>unitsAt(q).includes(moveMode.units[0]));
if(moveMode.airlift){
const trans=moveMode.airlift;
const fromP=provinces.find(q=>(q.g[0]||[]).includes(trans));
if(mdist(fromP.id,p.id)>UNITS[trans.t].mp){toast('Hors de portée du transport aérien.');return;}
if(p.terrain==='water'){toast('Cible terrestre requise.');return;}
if(p.owner!==0&&!(p.owner!==null&&treaties[pairKey(0,p.owner)].move)){toast('Cible : vos provinces ou alliés (libre circulation).');return;}
for(const u of moveMode.units){removeUnit(u);u.mp=0;(p.g[0]=p.g[0]||[]).push(u);}
toast('Unités aéroportées vers '+p.name+'.');
moveMode=null;render();return;
}
if(!from){moveMode=null;render();return;}
debarqCheck(from,p,moveMode.units);
moveMode=null;render();return;
}
sel=p;render();
});
function debarqCheck(from,to,units){
const trans=units.find(u=>UNITS[u.t].inv&&u.cargoU.length);
if(trans&&isAdj(from.id,to.id)&&to.terrain!=='water'){
debarquer(from,to,trans);
return;
}
attemptMove(from,to,units);
}
function showHelp(){
const box=document.getElementById('introbox');
box.innerHTML='<h2>PAX MUNDI — Aide</h2>'+
'<h3>But du jeu</h3><p>Contrôlez 55% du monde par la conquête ou la <b>diplomatie</b> (fusions de pays). Perdez toutes vos provinces : défaite.</p>'+
'<h3>Unités (26 types)</h3><ul>'+
'<li><b>Terre :</b> infanterie, inf. motorisée, parachutistes, génie (-25% coût des bâtiments), chars légers/lourds, artillerie, art. lourde, lance-roquettes, anti-aérien.</li>'+
'<li><b>Air :</b> chasseur, <b>Rafale</b> (supériorité, opère depuis porte-avions), bombardier, hélicoptères d\'attaque/transport, transport aérien (aéroportage de 2 unités).</li>'+
'<li><b>Mer :</b> torpilleur, <b>frégate furtive</b> et sous-marin (50% de dégâts subis en moins), destroyer, croiseur, cuirassé, <b>porte-avions</b> (2 avions), <b>porte-hélicoptères</b> (3 hélicos), transport naval (débarquement), cargo (+commerce).</li></ul>'+
'<h3>Économie</h3><p>Chaque province produit argent, matériaux, pétrole, nourriture. Réglez vos <b>impôts</b>, construisez usines et raffineries. Le <b>commerce</b> rapporte selon les traités ; vos <b>taxes douanières</b> (0-50%) taxent les marchandises voisines mais rabotent le volume et les relations.</p>'+
'<h3>Infrastructures</h3><p><b>Port</b> (navires), <b>aéroport</b> (avions), <b>autoroute</b> (+revenus, déplacement), <b>voie ferrée</b> (+revenus, déplacement), <b>canal</b> (laisse passer les navires à travers la terre + revenus).</p>'+
'<h3>Diplomatie</h3><p>Proposez : <b>paix/non-agression</b>, <b>libre circulation</b> (traverser le territoire allié), <b>libre-échange</b>, <b>alliance</b>, <b>partage de bases</b> (vos Rafale appontent sur les porte-avions alliés, hélicos sur leurs porte-hélicoptères) et <b>FUSION</b> (absorbe le pays si relations ≥ 85, puissance inférieure, tous traités signés).</p>'+
'<h3>Combat</h3><p>Sélectionnez vos unités → « Déplacer / Attaquer » → cliquez la cible adjacente (terre/mer) ou à distance (air). Montagnes et forêts défendent. L\'anti-aérien fauche les avions.</p>'+
'<button class="big" onclick="document.getElementById(\'overlay\').style.display=\'none\'">Fermer</button>';
document.getElementById('overlay').style.display='flex';
}

function init(){
genMap();
setupCountries();
showHelp();
logs=[];
log('🌍 Le monde entre dans une nouvelle ère. Six puissances, un destin.','good');
render();
setInterval(render,400);
}
init();
