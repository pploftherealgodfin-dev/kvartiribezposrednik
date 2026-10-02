import osmium,json,collections,argparse
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('source_dir',type=Path);args=parser.parse_args();root=args.source_dir
class Extract(osmium.SimpleHandler):
 def __init__(self):
  super().__init__();self.places=[];self.universities=[];self.boundaries=[]
 def node(self,o):
  t=dict(o.tags)
  if t.get('place') in ['city','town','suburb','quarter','neighbourhood']:
   self.places.append({'type':'node','id':o.id,'tags':t,'lat':o.location.lat,'lng':o.location.lon})
  if t.get('amenity')=='university':
   self.universities.append({'type':'node','id':o.id,'tags':t,'lat':o.location.lat,'lng':o.location.lon})
 def way(self,o):
  t=dict(o.tags)
  if t.get('place') in ['city','town','suburb','quarter','neighbourhood'] or t.get('amenity')=='university':
   pts=[(n.lon,n.lat) for n in o.nodes if n.location.valid()]
   if pts:
    e={'type':'way','id':o.id,'tags':t,'lng':sum(p[0] for p in pts)/len(pts),'lat':sum(p[1] for p in pts)/len(pts)}
    if t.get('place'):self.places.append(e)
    else:self.universities.append(e)
 def area(self,o):
  t=dict(o.tags)
  if t.get('boundary')=='administrative' and t.get('admin_level') in ['8','9','10']:
   try:
    geom=osmium.geom.WKBFactory().create_multipolygon(o)
    self.boundaries.append({'type':'way' if o.from_way() else 'relation','id':o.orig_id(),'tags':t,'wkb':geom})
   except Exception:pass
h=Extract();h.apply_file(str(root/'bulgaria.osm.pbf'),locations=True,idx='flex_mem')
for name,data in [('places',h.places),('osm_universities',h.universities),('boundaries',h.boundaries)]:
 (root/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2))
 print(name,len(data))
print('place types',collections.Counter(e['tags'].get('place') for e in h.places))
print('boundary levels',collections.Counter(e['tags'].get('admin_level') for e in h.boundaries))
print('examples',[(e['tags'],e['type'],e['id']) for e in h.boundaries[:8]])
