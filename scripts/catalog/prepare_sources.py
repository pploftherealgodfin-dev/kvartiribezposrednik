import json,re,html,sys
from pathlib import Path
p=Path(sys.argv[1])
cities=[v for v in json.loads((p/'ek_atte.json').read_text()) if v.get('t_v_m')=='гр.']
assert len(cities)==257, 'Review changes to the official city register'
(p/'towns.json').write_text(json.dumps(cities,ensure_ascii=False,indent=2))
names=[html.unescape(re.sub('<[^>]*>','',v)).strip() for v in re.findall(r'<div class="title">(.*?)</div>',(p/'neaa.html').read_text(),re.S)]
assert len(names)==51, 'Review changes to the NEAA register'
(p/'university_names.json').write_text(json.dumps(names,ensure_ascii=False,indent=2))
