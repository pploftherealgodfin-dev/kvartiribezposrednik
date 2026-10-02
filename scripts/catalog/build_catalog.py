import json,re,math,collections,argparse,hashlib
from pathlib import Path
from shapely import wkb
from shapely.geometry import Point
parser=argparse.ArgumentParser();parser.add_argument('source_dir',type=Path);parser.add_argument('--repo-root',type=Path,default=Path.cwd());args=parser.parse_args();r=args.source_dir;out=args.repo_root;towns=json.loads((r/'towns.json').read_text());places=json.loads((r/'places.json').read_text());bounds=json.loads((r/'boundaries.json').read_text());unames=json.loads((r/'university_names.json').read_text())
def name(e):return e['tags'].get('name:bg',e['tags'].get('name','')).strip()
trans=dict(zip('абвгдежзийклмнопрстуфхцчшщъьюя',['a','b','v','g','d','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','sht','a','','yu','ya']))
def slug(s):return re.sub(r'[^a-z0-9]+','-',''.join(trans.get(c,c) for c in s.lower())).strip('-')
def distance(a,b):
 lat=math.radians((a['lat']+b['lat'])/2);return math.hypot((a['lng']-b['lng'])*111.32*math.cos(lat),(a['lat']-b['lat'])*111.32)
cities=[];byek={};byn=collections.defaultdict(list)
for t in towns:
 s=slug(t['name_en'])
 if t['name']=='Свищов':s='svishov' # Preserve existing URLs and city IDs.
 if t['name']=='Бяла':s+='-'+('ruse' if t['oblast']=='RSE' else 'varna')
 c={'slug':s,'name':t['name'],'region':t['oblast_name'].removeprefix('обл. '),'ekatte':t['ekatte'],'isUniversityCity':False,'lat':None,'lng':None,'sourceUrl':'https://www.nsi.bg/nrnm/ekatte/index'}
 cities.append(c);byek[c['ekatte']]=c;byn[c['name']].append(c)
polys=[];ruralpolys=[]
for e in bounds:
 g=wkb.loads(e['wkb'],hex=True);city=byek.get(e['tags'].get('ekatte',''))
 if not city and len(byn[name(e)])==1:city=byn[name(e)][0]
 if city:polys.append((city,e,g))
 else:ruralpolys.append((e,g))
for e in places:
 if e['tags'].get('place') not in ('city','town'):continue
 options=byn[name(e)];c=byek.get(e['tags'].get('ekatte',''))
 if not c and len(options)==1:c=options[0]
 if not c and options:
  matches=[c for c,f,g in polys if c in options and g.covers(Point(e['lng'],e['lat']))]
  if len(matches)==1:c=matches[0]
 if c and (c['lat'] is None or e['type']=='node'):
  c['lat']=e['lat'];c['lng']=e['lng'];c['coordinateSource']=f"https://www.openstreetmap.org/{e['type']}/{e['id']}"
for c,e,g in polys:
 if c['lat'] is None:
  pt=g.representative_point();c['lat']=pt.y;c['lng']=pt.x;c['coordinateSource']=f"https://www.openstreetmap.org/{e['type']}/{e['id']}"
# Match all 51 accredited institutions to the seat stated in the NEAA registry.
uni=[]
seats=['Пловдив','Пловдив','София','Пловдив','Благоевград','Бургас','Бургас','Варна','Велико Търново','Долна Митрополия','Варна','София','София','Пловдив','Варна','София','София','Перник','Варна','София','Благоевград','София','Плевен','Пловдив','София','Варна','Ботевград','София','Велико Търново','София','София','София','София','София','Пловдив','Русе','София','Свищов','София','Варна','Габрово','София','Стара Загора','София','София','София','София','Пловдив','София','Шумен','Благоевград']
assert len(seats)==len(unames)==51
assert hashlib.sha256(json.dumps(unames,ensure_ascii=False).encode()).hexdigest()=='1e487f86358d577a671ae89d8ed899db4ea76db39204299ded636f401f350383', 'NEAA titles changed: manually review seat and branch mapping before updating.'
for i,n in enumerate(unames):
 matches=[c for c in cities if c['name']==seats[i]]
 if len(matches)!=1:raise ValueError((i,n,matches))
 c=matches[0];c['isUniversityCity']=True
 uni.append({'citySlug':c['slug'],'slug':slug(n),'name':n,'lat':None,'lng':None,'sourceUrl':'https://www.neaa.government.bg/akreditirani-institucii/visshi-uchilischa'})
# Confirmed Bulgarian teaching locations from each institution's official pages.
extras=[
 (35,'Силистра','филиал Силистра','https://www.uni-ruse.bg/university/branches'),
 (35,'Разград','филиал Разград','https://www.uni-ruse.bg/university/branches'),
 (35,'Видин','филиал Видин','https://www.uni-ruse.bg/university/branches'),
 (34,'Смолян','филиал Смолян','https://uni-plovdiv.bg/pages/index/45'),
 (34,'Кърджали','филиал Любен Каравелов — Кърджали','https://uni-plovdiv.bg/pages/index/46'),
 (41,'Пловдив','филиал Пловдив','https://tu-sofia.bg/bg/articles/zapochva-zapisvaneto-na-prietite-za-studenti-na-vtoro-klasirane-v-tehnicheskiya-universitet-sofiya'),
 (41,'Сливен','факултет и колеж Сливен','https://tu-sofia.bg/bg/articles/zapochva-zapisvaneto-na-prietite-za-studenti-na-vtoro-klasirane-v-tehnicheskiya-universitet-sofiya'),
 (25,'Сливен','филиал Сливен','https://www.mu-varna.bg/BG/AboutUs/pages/sliven.aspx'),
 (25,'Шумен','филиал Шумен','https://www.mu-varna.bg/BG/Pages/dni-na-otvoreni-vrati-za-kandidat-studenti-vav-filialite-v-shumen-veliko-tarnovo-i-sliven-kam-mu---varna.aspx'),
 (25,'Велико Търново','филиал Велико Търново','https://www.mu-varna.bg/BG/Pages/dni-na-otvoreni-vrati-za-kandidat-studenti-vav-filialite-v-shumen-veliko-tarnovo-i-sliven-kam-mu---varna.aspx'),
 (8,'Враца','филиал Враца','https://www.uni-vt.bg/bul/?zid=38'),
 (8,'Плевен','Педагогически колеж — Плевен','https://www.uni-vt.bg/bul/pages/?page=5&zid=1'),
 (24,'Враца','филиал Проф. д-р Иван Митев — Враца','https://filialvratsa.mu-sofia.bg/admission'),
 (42,'Хасково','филиал Хасково','https://trakia-uni.bg/bg/about-us/faculties/haskovo-branch/'),
 (42,'Ямбол','Факултет Техника и технологии — Ямбол','https://trakia-uni.bg/bg/contacts/'),
 (49,'Добрич','Колеж Добрич','https://www.shu.bg/faculties-dobrich/'),
 (39,'Добрич','Добруджански технологичен колеж — Добрич','https://www1.tu-varna.bg/tu-varna/index.php/za-nas/fakulteti-i-kolezhi/kolezhi/dobrudzhanski-tehnologichen-kolezh'),
 (7,'Смолян','филиал Смолян','https://www.vfu.bg/'),
 (14,'Добрич','кампус Добрич','https://vum.bg/bg/lokaciq/'),
 (32,'Бургас','филиал Бургас','https://www.nha.bg/bg/kategoriq/filial-burgas'),
 (36,'Бургас','филиал Бургас','https://bs.uni-sofia.bg/bg/')
]
for u in uni:u['kind']='institution'
for i,cn,branch,source in extras:
 c=byn[cn][0];c['isUniversityCity']=True;un=unames[i]+' — '+branch
 uni.append({'citySlug':c['slug'],'slug':slug(un),'name':un,'kind':'branch','lat':None,'lng':None,'sourceUrl':source,'parentInstitution':unames[i]})
hoods=[];quarantine=[];dedup={}
for e in places:
 if e['tags'].get('place') not in ('suburb','quarter','neighbourhood'):continue
 n=name(e)
 if not n:continue
 pt=Point(e['lng'],e['lat']);city=None;method=None
 tagged=e['tags'].get('addr:city','');opts=byn[tagged]
 if len(opts)==1:city=opts[0];method='osm_city_tag'
 if not city:
  inside=[(c,f,g) for c,f,g in polys if g.covers(pt)]
  if inside:
   # A settlement polygon is a geographic association, not a legal neighborhood register.
   city,f,g=min(inside,key=lambda v:v[2].area);method='osm_settlement_boundary'
 if not city:
  # Rural hamlets must not be silently attributed to a nearby town.
  rural=next((f for f,g in ruralpolys if g.covers(pt)),None)
  if rural:quarantine.append({'name':n,'source':f"{e['type']}/{e['id']}",'reason':'outside_town_boundary','settlement':name(rural)});continue
  candidates=sorted([(distance(e,c),c) for c in cities if c['lat'] is not None],key=lambda v:v[0])
  d,c=candidates[0];limit=10 if c['name'] in ['София','Пловдив','Варна','Бургас','Стара Загора','Перник','Габрово','Смолян'] else 6
  if d>limit or len(candidates)>1 and candidates[1][0]-d<1:
   quarantine.append({'name':n,'source':f"{e['type']}/{e['id']}",'reason':'ambiguous_or_distant','nearestTown':c['name'],'distanceKm':round(d,2)});continue
  city=c;method='nearest_town_approximate'
 # Prefixes vary across duplicate node and area records; keep one selectable name per city.
 n=re.sub(r'^(?:ж\.?\s*к\.?|кв\.?)\s*','',n,flags=re.I).strip()
 ns=slug(n)
 if not ns:continue
 row={'citySlug':city['slug'],'slug':ns,'name':n,'lat':e['lat'],'lng':e['lng'],'sourceRef':f"{e['type']}/{e['id']}",'sourceUrl':f"https://www.openstreetmap.org/{e['type']}/{e['id']}",'associationMethod':method}
 key=(city['slug'],ns)
 prior=dedup.get(key)
 if prior:
  priority={'osm_city_tag':0,'osm_settlement_boundary':1,'nearest_town_approximate':2}
  if priority[method]<priority[prior['associationMethod']]:dedup[key]=row
 else:dedup[key]=row
hoods=sorted(dedup.values(),key=lambda e:(e['citySlug'],e['name']))
# Each entry is factual reference data. No listings, people or guessed contacts.
meta={'snapshot':'2026-10-02','citiesSource':'https://www.nsi.bg/nrnm/ekatte/zip/download?files_type=json','universitiesSource':'https://www.neaa.government.bg/akreditirani-institucii/visshi-uchilischa','neighborhoodsSource':'https://download.geofabrik.de/europe/bulgaria.html','neighborhoodsAttribution':'© OpenStreetMap contributors','neighborhoodsLicense':'https://opendatacommons.org/licenses/odbl/1-0/','coverageNote':'ЕКАТТЕ includes all 257 towns. OSM neighborhoods are not an exhaustive official register; unmatched rural/ambiguous records are excluded. University records cover the 51 main institutions in the NEAA directory and 21 verified Bulgarian teaching locations; future branches require source review. Proximity is declared by listing owners.'}
(out/'public/data').mkdir(parents=True,exist_ok=True)
for fn,data in [('national-catalog.json',{'metadata':meta,'cities':cities,'universities':uni,'neighborhoods':hoods}),('neighborhoods-review.json',quarantine)]:
 (out/'public/data'/fn).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(out/'src/lib/locationCatalog.ts').write_text('// Generated from official EKATTE and NEAA; see public/data/national-catalog.json for provenance.\nexport const nationalCities = '+json.dumps([{k:c[k] for k in ['slug','name','region','ekatte','isUniversityCity']} for c in cities],ensure_ascii=False,indent=2)+' as const;\n')
(r/'catalog_normalized.json').write_text(json.dumps({'cities':cities,'universities':uni,'neighborhoods':hoods},ensure_ascii=False))
print('counts',len(cities),len(uni),len(hoods),'universityCities',sum(c['isUniversityCity'] for c in cities),'quarantine',len(quarantine),'unlocatedCities',[c['name'] for c in cities if c['lat'] is None]);print('methods',collections.Counter(h['associationMethod'] for h in hoods));print('university neighborhood coverage',[(c['name'],sum(h['citySlug']==c['slug'] for h in hoods)) for c in cities if c['isUniversityCity']]);print('slugs first12',[(c['name'],c['slug']) for c in cities if c['name'] in ['София','Свищов','Велико Търново','Стара Загора']])
