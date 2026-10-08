"""Require bilingual coverage of actual tools and reject misleading navigation or formula drift."""
from pathlib import Path
import copy,json,sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'build'))
import user_guides as ug
data={l:ug.load(ROOT,l) for l in ug.LANGUAGES}
count=ug.validate(ROOT,data)
def rejects(label,mutate):
    global count
    d=copy.deepcopy(data);mutate(d)
    try:ug.validate(ROOT,d)
    except (AssertionError,KeyError):count+=1;return
    raise AssertionError('Gate did not reject '+label)
rejects('missing Spanish tool',lambda d:d['es']['guides'].pop())
rejects('duplicate tool',lambda d:d['en']['guides'].append(d['en']['guides'][0]))
rejects('wrong mode route',lambda d:next(g for g in d['en']['guides'] if g['id']=='simulator-neutrino').update(route='s=predict&predict.s=v%3A0'))
rejects('translation changes a formula',lambda d:next(g for g in d['es']['guides'] if g.get('formulas'))['formulas'][0].update(expression='1/R = 0'))
rejects('unresolvable related guide',lambda d:d['en']['guides'][0]['related'].append('missing-page'))
rejects('unresolvable video',lambda d:d['en']['guides'][0].update(video='missing-video'))
rejects('missing glossary entry',lambda d:d['es']['glossary'].pop('ceiling'))
rejects('wrong experiment focus',lambda d:next(g for g in d['en']['guides'] if g['id']=='flavour').update(route='s=predict&predict.s=v%3A1&help=thermal'))
grouped=' '.join(g[2] for g in ug.GROUPS).split()+['getting-started']
assert len(grouped)==len(set(grouped))==len(data['en']['guides'])
assert set(grouped)=={g['id'] for g in data['en']['guides']};count+=1
for lang,d in data.items():
    for key,v in d['glossary'].items():
        assert v['term'] and len(v['body'])>100,(lang,key)
        assert '<script' not in v['body'].lower() and 'javascript:' not in v['body'].lower();count+=1
print(f'{count} checks pass — guide coverage, source links, formula parity and negative controls')
