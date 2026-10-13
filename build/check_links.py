"""Check all shipped local links and anchors, plus reachability of current pages.

The canonical public hostname is resolved against this exact build, so links to
new material are checked before publication. HTTP services are audited separately.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote,parse_qs
import json,sys
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
BASE='https://karlesmarin.github.io/ghu-explorer/'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.ids=set();self.links=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='a' and 'name' in a:self.ids.add(a['name'])
  for attr in ('href','src','poster'):
   if a.get(attr):self.links.append(a[attr])
pages={p.relative_to(SITE).as_posix():Page(p.read_text(encoding='utf-8',errors='replace')) for p in SITE.rglob('*.html')}
edges={p:set() for p in pages};broken=[];external=set();checked=0
for source,page in pages.items():
 for link in page.links:
  if link.startswith(('data:','blob:','mailto:','javascript:','tel:')):continue
  url=urljoin(BASE+source,link);parts=urlsplit(url)
  if not url.startswith(BASE):
   if parts.scheme in ('http','https'):external.add(url.split('#')[0])
   continue
  relative=unquote(parts.path[len('/ghu-explorer/'):])
  target=SITE/relative
  if target.is_dir():target=target/'index.html';relative=target.relative_to(SITE).as_posix()
  if not target.is_file():broken.append(dict(source=source,link=link,reason='missing target',target=relative));continue
  checked+=1
  if relative in pages:edges[source].add(relative)
  anchor=unquote(parts.fragment)
  # App fragments are structured router input, not HTML element identifiers.
  if anchor and relative.endswith('app/index.html') and ('=' in anchor or anchor.startswith('s=')):continue
  # The video player resolves chapter IDs against its embedded chapter data.
  if anchor and relative.startswith('video/') and (relative=='video/index.html' or relative.endswith('.html')):
   content=target.read_text(encoding='utf-8')
   if '"id":"'+anchor+'"' in content or '"id": "'+anchor+'"' in content:continue
  if anchor and relative in pages and anchor not in pages[relative].ids:
   broken.append(dict(source=source,link=link,reason='missing anchor',target=relative+'#'+anchor))
visited=set();pending=['index.html']
while pending:
 p=pending.pop()
 if p in visited:continue
 visited.add(p);pending.extend(edges.get(p,())-visited)
current=[p for p in pages if p.startswith('guide/') or p in ['proof/index.html','video/index.html','video/quantization/index.html','video/quantization/index-es.html','app/index.html']]
orphans=sorted(set(current)-visited)
out=ROOT/'.tmp/link-audit';out.mkdir(parents=True,exist_ok=True)
report=dict(pages=len(pages),checkedLocalLinks=checked,broken=broken,unreachableCurrentPages=orphans,external=sorted(external))
(out/'local.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(pages)} pages; {checked} local links checked; {len(broken)} broken links; {len(orphans)} unreachable current pages; {len(external)} external destinations')
for b in broken[:45]:print(b['source'],b['link'],b['reason'])
for p in orphans:print('UNREACHABLE',p)
sys.exit(bool(broken or orphans))
