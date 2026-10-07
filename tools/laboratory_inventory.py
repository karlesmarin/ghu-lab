"""Rebuild the documentation inventory from section, experiment and Simulator registrations."""
from pathlib import Path
import json,re
def collect(root):
    def read(name):return (root/name).read_text(encoding='utf-8')
    registry=read('src/sections/registry.js')
    names=re.findall(r'\{\s*\.\.\.(\w+_SECTION),\s*group:',registry)
    sources={p.relative_to(root).as_posix():p.read_text(encoding='utf-8') for p in (root/'src/sections').glob('*.js')}
    sections=[]
    for name in names:
        pattern=r'\bconst\s+'+name+r'\s*=\s*\{'
        matches=[(p,s) for p,s in sources.items() if re.search(pattern,s)]
        assert len(matches)==1,(name,len(matches));path,s=matches[0];block=s[re.search(pattern,s).end():]
        field=lambda key:re.search(r'\b'+key+r':\s*[\"\x27]([^\"\x27]+)',block).group(1)
        ready=re.search(r'\bready:\s*(true|false)',block)
        if not ready or ready.group(1)!='true':continue
        sections.append(dict(number=len(sections)+1,id=field('id'),label=field('label'),source=path,constant=name))
    hosts={s.pop('constant'):s['id'] for s in sections}
    rx=read('src/sections/research_extensions.js');experiments=[]
    for host,panel in re.findall(r'^rxAttach\((\w+),(\w+)\);',rx,re.M):
        block=rx[re.search(r'const\s+'+panel+r'\s*=\s*\{',rx).end():]
        field=lambda key:re.search(r'\b'+key+r':\s*[\"\x27]([^\"\x27]+)',block).group(1)
        experiments.append(dict(id=field('id'),title=field('title'),host=hosts[host]))
    select=re.search(r'<select[^>]*id="prModel"[^>]*>(.*?)</select>',read('src/sections/predict_section.js'),re.S)
    assert select,'Simulator selector not found'
    modes=[dict(id=k,label=v) for k,v in re.findall(r'<option value="([^"]+)">([^<]+)</option>',select.group(1))]
    return dict(menuSections=sections,experimentCards=experiments,simulatorModes=modes,
      integratedAnalyses=['Hierarchy robustness','CMS HNL comparison','Neutrino decays with computed Majoron channels','Conditional rung bounds and full-potential witnesses'],
      batchStudies=['Higgs coupling/width assumptions','Thermal wall/efficiency/background scenarios','Candidate enumeration and selected full-potential checks','Fixed-light-input neutrino identifiability paths'],
      countingRule='Menu sections, embedded cards, model modes and batch studies are overlapping levels of organization, not quantities to add into a panel total.')
if __name__=='__main__':
    root=Path(__file__).resolve().parents[1];record=collect(root)
    (root/'docs/laboratory-inventory.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
    print(len(record['menuSections']),'menu sections;',len(record['experimentCards']),'embedded experiment cards;',len(record['simulatorModes']),'Simulator modes')
