"""Validate indexable current pages, language switches, guide links and manual provenance."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,posixpath,sys,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent;SITE=ROOT/'site';sys.path.insert(0,str(ROOT/'build'))
import user_guides as ug
from search_index import BASE,current_page,canonical
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.links=[];self.anchors=[];self.ids=set();self.metas=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.add(a['id'])
        if tag=='link':self.links.append(a)
        if tag=='a':self.anchors.append(a)
        if tag=='meta':self.metas.append(a)
def audit(pages,locations):
    errors=[];expected={canonical(rel) for rel in pages if current_page(rel)}
    if set(locations)!=expected or len(locations)!=len(set(locations)):errors.append('sitemap coverage')
    for rel,text in pages.items():
        if not current_page(rel):continue
        p=Page(text);can=[x.get('href') for x in p.links if x.get('rel')=='canonical']
        if can!=[canonical(rel)]:errors.append('canonical '+rel)
        if any(x.get('name')=='robots' and 'noindex' in x.get('content','').lower() for x in p.metas):errors.append('noindex '+rel)
        if not rel.startswith('guide/'):continue
        lang='es' if rel.startswith('guide/es/') else 'en';rest=rel[len('guide/es/') if lang=='es' else len('guide/'):];id=rest.split('/')[0] if '/' in rest else 'index'
        for alternate in ['en','es','x-default']:
            target=BASE+ug.relpath(id,'en' if alternate=='x-default' else alternate)
            if not any(x.get('rel')=='alternate' and x.get('hreflang')==alternate and x.get('href')==target for x in p.links):errors.append('hreflang '+rel)
        for alternate in ['en','es']:
            target=ug.relpath(id,alternate)
            if not any(x.get('lang')==alternate and posixpath.normpath(posixpath.join(posixpath.dirname(rel),x.get('href','')))==target for x in p.anchors):errors.append('language switch '+rel)
        for a in p.anchors:
            u=urlsplit(a.get('href',''));target=None
            if not u.scheme:target=posixpath.normpath(posixpath.join(posixpath.dirname(rel),unquote(u.path))) if u.path else rel
            elif a['href'].startswith(BASE):target=unquote(u.path[len(urlsplit(BASE).path):]) or 'index.html'
            if target:
                if not (SITE/target).is_file():errors.append('link '+rel+' -> '+target)
                elif u.fragment and target in pages and target!='app/index.html' and not target.startswith('video/') and unquote(u.fragment) not in Page(pages[target]).ids:errors.append('fragment '+rel+' -> '+a['href'])
    return errors
pages={p.relative_to(SITE).as_posix():p.read_text(encoding='utf-8') for p in SITE.rglob('*.html')}
tree=ET.fromstring((SITE/'sitemap.xml').read_text(encoding='utf-8'));locations=[x.text for x in tree.findall('{*}url/{*}loc')]
errors=audit(pages,locations);assert not errors,errors[:20];count=sum(current_page(p) for p in pages)
for name,broken,loc in [('missing URL',pages,locations[:-1]),('wrong canonical',{**pages,'guide/index.html':pages['guide/index.html'].replace('rel="canonical"','rel="not-canonical"')},locations),('wrong language switch',{**pages,'guide/es/index.html':pages['guide/es/index.html'].replace('lang="en"','lang="fr"')},locations)]:
    assert audit(broken,loc),name;count+=1
manifest=json.loads((ROOT/'docs/manual/manifest.json').read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for rel,digest in manifest['inputs'].items():assert sha(ROOT/rel)==digest,('stale manual',rel);count+=1
for lang,entry in manifest['languages'].items():
    for ext,key in [('pdf','pdfSHA256'),('tex','texSHA256')]:
        p=f'ghu-lab-guide-{lang}.{ext}';assert sha(ROOT/'docs/manual'/p)==entry[key]==sha(SITE/'guide/manual'/p);count+=1
    assert entry['guides']==len(ug.load(ROOT,lang)['guides']);count+=1
print(f'{count} checks pass — {len(locations)} canonical sitemap URLs, reciprocal languages, links and current manuals')
