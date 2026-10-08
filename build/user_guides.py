"""One maintained catalogue per language drives web guides and inline application help."""
import html,json,pathlib,re,shutil,sys
from urllib.parse import parse_qs

BASE='https://karlesmarin.github.io/ghu-explorer/'
LANGUAGES=('en','es')
LABELS={
 'en':dict(index='User guide',start='Getting started',search='Search guides',clear='Clear',none='No guides match. Try a shorter term or clear the search.',open='Open tool',video='Video chapter',manual='Download manual (PDF)',contents='On this page',purpose='What this tool is for',steps='First steps',controls='Controls and inputs',outputs='Reading the results',example='Worked example',formulas='Formulas and conventions',limits='Scope and limitations',troubleshooting='If something is unclear',terms='Terms used here',related='Continue with',references='Sources and attribution',meaning='Meaning',tryit='Try this',control='Control',result='Result',expect='What to expect',glossary='Glossary',all='All guides',language='Language',menu='Menu section',experiment='Embedded experiment',mode='Simulator mode',analysis='Integrated analysis',note='Control names are kept as they appear in the application. Start with a reference, change one input at a time, and retain the assumptions with your result.',footer='Current instrument guide. Archived editions retain their own scope.',count='guides',tasks='Choose a task',families='Browse by family',up='Back to top'),
 'es':dict(index='Guía de uso',start='Primeros pasos',search='Buscar en las guías',clear='Borrar búsqueda',none='No hay coincidencias. Prueba una palabra más corta o borra la búsqueda.',open='Abrir herramienta',video='Capítulo del vídeo',manual='Descargar manual (PDF)',contents='En esta página',purpose='Para qué sirve',steps='Primeros pasos',controls='Controles y parámetros',outputs='Cómo leer los resultados',example='Ejemplo guiado',formulas='Fórmulas y convenciones',limits='Alcance y limitaciones',troubleshooting='Si algo no queda claro',terms='Términos de esta guía',related='Continuar con',references='Fuentes y atribución',meaning='Significado',tryit='Prueba',control='Control',result='Resultado',expect='Qué esperar',glossary='Glosario',all='Todas las guías',language='Idioma',menu='Opción del menú',experiment='Experimento integrado',mode='Modo del Simulator',analysis='Análisis integrado',note='Los nombres de los controles se conservan tal como aparecen en la aplicación. Empieza con una referencia, cambia un parámetro cada vez y conserva las hipótesis junto al resultado.',footer='Guía del instrumento actual. Las ediciones archivadas conservan su propio alcance.',count='guías',tasks='Elige una tarea',families='Explora por familias',up='Volver arriba')}
GROUPS=[('SU(7) · Komori–Maru','SU(7) · Komori–Maru','hierarchy inverse census atlas7 samepot anomalies escape multiplets screen collider higgstools rsanomaly'),
 ('SU(4) · AHMN','SU(4) · AHMN','selection calculator eta'),
 ('Flat 5D models','Modelos planos en 5D','fived sun5d papers su6mn spectrum5d anomaly5d brane sweep5d dossier predict simulator-builder'),
 ('Neutrino ring','Anillo de neutrinos','simulator-neutrino flavour identifiability neutrino-decays'),
 ('Higgs and thermal diagnostics','Diagnósticos del Higgs y térmicos','simulator-higgsrate thermal thermalhistory'),
 ('Boundary conditions','Condiciones de contorno','bcclass orbifold relations cbclass'),
 ('Boundary terms, gravity and literature','Términos de frontera, gravedad y bibliografía','blkt rsrunning gravitygauge litcensus')]
TASKS=[('Build and inspect a model','Construir e inspeccionar un modelo','sun5d'),('Study the SU(7) hierarchy','Estudiar la jerarquía SU(7)','hierarchy'),('Compare with experimental references','Comparar con referencias experimentales','higgstools'),('Explore neutrino masses and decays','Explorar masas y desintegraciones de neutrinos','simulator-neutrino'),('Follow a thermal transition','Seguir una transición térmica','thermal'),('Classify boundary conditions','Clasificar condiciones de contorno','bcclass')]

def load(root,lang='en'):
    suffix='' if lang=='en' else '.'+lang
    return json.loads((root/f'docs/user-guides{suffix}.json').read_text(encoding='utf-8'))

def validate(root,catalogues=None):
    sys.path.insert(0,str(root/'tools'))
    from laboratory_inventory import collect
    inv=collect(root);data=catalogues or {l:load(root,l) for l in LANGUAGES};en=data['en']
    expected={s['id'] for s in inv['menuSections']}|{x['id'] for x in inv['experimentCards']}|{'simulator-'+m['id'] for m in inv['simulatorModes']}|{'getting-started','neutrino-decays'}
    chapters=json.loads((root/'media/video/current.json').read_text(encoding='utf-8'))['directory']
    video=json.loads((root/'media/video'/chapters/'chapters-en.json').read_text(encoding='utf-8'))
    videoids={c['id'] for c in (video if isinstance(video,list) else video['chapters'])}
    checks=0
    for lang,d in data.items():
        assert d['language']==lang
        guides=d['guides'];ids=[g['id'] for g in guides]
        assert len(ids)==len(set(ids)) and set(ids)==expected,('coverage',lang,set(ids)^expected)
        assert set(d['glossary'])==set(en['glossary']),('glossary coverage',lang)
        for g in guides:
            assert re.fullmatch('[a-z][a-z0-9-]*',g['id'])
            assert all(g.get(k) for k in ['title','what','read','purpose','steps','controls','outputs','example','limits','troubleshooting','references']),('thin guide',lang,g['id'])
            assert len(g['steps'])>=2 and len(g['what'])>=30 and len(g['read'])>=30
            assert all(x in expected for x in g.get('related',[])),('related',g['id'])
            assert all(x in d['glossary'] for x in g.get('terms',[])),('term',g['id'])
            assert g.get('video') in videoids,('video',g['id'],g.get('video'))
            if g.get('source'):assert (root/g['source']).is_file(),('source',g['id'])
            q=parse_qs(g['route']);assert q['s']==[g['host']],('route',g['id'])
            if g.get('mode'):assert q['predict.s']==['v:'+str({'builder':0,'neutrino':1,'higgsrate':2}[g['mode']])]
            if g['kind'] in ('experiment','analysis'):assert q.get('help')==[g['id']]
            assert all(r['url'].startswith('https://') and r['label'] for r in g['references'])
            original=next(x for x in en['guides'] if x['id']==g['id'])
            for k in ['kind','host','route','mode','video','source','related','terms']:
                assert g.get(k)==original.get(k),('locale metadata',lang,g['id'],k)
            assert [f['expression'] for f in g.get('formulas',[])]==[f['expression'] for f in original.get('formulas',[])],('formula parity',g['id'])
            checks+=1
    return checks

def js(value):return json.dumps(value,ensure_ascii=False).replace('</','<\\/')

def howto_source(root):
    data={l:load(root,l) for l in LANGUAGES}
    rows=[]
    for g in data['en']['guides']:
        if g['kind']=='section':rows.append('  '+g['id']+': {\n'+''.join('    '+k+': '+js(g[k])+',\n' for k in ['what','steps','read'])+'  },')
    es={g['id']:{k:g[k] for k in ['what','steps','read']} for g in data['es']['guides'] if g['kind']=='section'}
    targets={g['id']:('rx_'+g['id'] if g['kind']=='experiment' else 'ndCard' if g['id']=='neutrino-decays' else 'prModel' if g['kind']=='mode' else 'section') for g in data['en']['guides']}
    return 'const HOWTO = {\n'+'\n'.join(rows)+'\n};\nconst HOWTO_ES = '+js(es)+';\nconst GUIDE_TARGETS = '+js(targets)+';\n'

def glossary_source(root):
    en=load(root,'en')['glossary'];es=load(root,'es')['glossary']
    rows=['  '+js(k)+': {\n    term: '+js(v['term'])+',\n    body: '+js(v['body'])+',\n  },' for k,v in en.items()]
    return 'const HELP_TERMS = {\n'+'\n'.join(rows)+'\n};\nconst HELP_TERMS_ES = '+js(es)+';\n'

def view_source(root,name,source):
    if name=='howto.js':return source.replace('/*__HOWTO__*/',howto_source(root))
    if name=='help.js':return source.replace('/*__GLOSSARY__*/',glossary_source(root))
    return source

def relpath(id,lang):return 'guide/'+('es/' if lang=='es' else '')+('' if id=='index' else id+'/')+'index.html'
def esc(s):return html.escape(str(s),quote=True)
def link(url,label,**attrs):return '<a href="'+esc(url)+'"'+''.join(' '+k.replace('_','-')+'="'+esc(v)+'"' for k,v in attrs.items())+'>'+esc(label)+'</a>'
def items(rows,ordered=False):
    tag='ol' if ordered else 'ul';return '<'+tag+'>'+''.join('<li>'+esc(x)+'</li>' for x in rows)+'</'+tag+'>'

CSS='''
.guide-hero{padding:1rem 0}.guide-actions,.guide-switch,.guide-toc,.guide-tasks{display:flex;flex-wrap:wrap;gap:.7rem;margin:1rem 0}.guide-actions a,.guide-tasks a{padding:.6rem .8rem;border:1px solid var(--line,#56616e);border-radius:.5rem}.guide-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem}.guide-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;list-style:none;padding:0}.guide-list li{border:1px solid var(--line,#56616e);border-radius:.6rem;padding:1rem}.guide-list h3{margin:.2rem 0}.guide-list p{margin:.5rem 0}.guide-kind{font-size:.85rem;opacity:.8}.guide-content section{scroll-margin-top:7rem;margin:2.5rem 0}.guide-content td{vertical-align:top;min-width:10rem}.guide-formula{overflow-wrap:anywhere;white-space:pre-wrap;font-family:serif;font-size:1.15rem}.guide-search{max-width:100%;width:34rem;padding:.75rem;font:inherit;border:1px solid #718096;border-radius:.4rem}.guide-example{border-left:4px solid #5fb6d4;padding:.1rem 1.2rem;background:rgba(95,182,212,.07)}.guide-content a{overflow-wrap:anywhere}.guide-content :focus-visible{outline:3px solid #5fb6d4;outline-offset:4px}.guide-content [hidden]{display:none!important}.guide-clear{font:inherit;padding:.6rem;cursor:pointer}.guide-content .guide-toc{padding:0;list-style:none}.guide-content h1{overflow-wrap:anywhere}@media(max-width:600px){.guide-content table{font-size:.94rem}.guide-list{grid-template-columns:1fr}.guide-actions a{flex:1 1 140px}.guide-content h1{font-size:1.9rem}}
'''
SEARCH='''<script>
(()=>{const field=document.getElementById('guide-search'),cards=[...document.querySelectorAll('[data-guide-search]')],groups=[...document.querySelectorAll('[data-guide-group]')],status=document.getElementById('guide-status');const norm=s=>s.toLocaleLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');function apply(){const terms=norm(field.value).trim().split(/\\s+/).filter(Boolean);let n=0;for(const c of cards){c.hidden=!terms.every(t=>norm(c.dataset.guideSearch).includes(t));if(!c.hidden)n++;}for(const g of groups)g.hidden=![...g.querySelectorAll('[data-guide-search]')].some(c=>!c.hidden);status.textContent=n?`${n} ${status.dataset.count}`:status.dataset.none;}field.addEventListener('input',apply);document.getElementById('guide-clear').addEventListener('click',()=>{field.value='';apply();field.focus();});apply();})();
</script>'''

def render_all(root,out,write,page,shell,css,build):
    validate(root);data={l:load(root,l) for l in LANGUAGES}
    for lang,d in data.items():
        labels=LABELS[lang];guides={g['id']:g for g in d['guides']}
        for id in ['index','glossary',*guides]:
            path=relpath(id,lang);depth=len(pathlib.PurePosixPath(path).parts)-1;prefix='../'*depth
            href=lambda target:prefix+relpath(target,lang)
            title=labels['index'] if id=='index' else labels['glossary'] if id=='glossary' else guides[id]['title']
            desc=guides[id]['what'] if id in guides else (('Search the GHU Lab guides by task or model family: controls, worked examples, assumptions and source attribution.' if lang=='en' else 'Busca las guías de GHU Lab por tarea o familia: controles, ejemplos guiados, hipótesis y atribución de fuentes.') if id=='index' else ('Definitions of the GHU Lab terms, with model conventions, mathematical scope and interpretation cautions.' if lang=='en' else 'Definiciones de los términos de GHU Lab con convenciones de modelos, alcance matemático y límites de interpretación.'))
            body='<article class="guide-content" id="top"><nav aria-label="'+('Migas de pan' if lang=='es' else 'Breadcrumb')+'">'+link(prefix+'index.html','GHU Lab')+' / '+link(href('index'),labels['index'])+'</nav>'
            body+='<div class="guide-switch" aria-label="'+labels['language']+'">'+''.join(link(prefix+relpath(id,l),'English' if l=='en' else 'Español',lang=l,hreflang=l,**({'aria_current':'page'} if l==lang else {})) for l in LANGUAGES)+'</div>'
            body+='<header class="guide-hero"><h1>'+esc(title)+'</h1><p>'+esc(desc)+'</p></header>'
            body+='<div class="guide-actions">'+link(href('getting-started'),labels['start'])+link(href('index'),labels['all'])+link(href('glossary'),labels['glossary'])+link(prefix+f'guide/manual/ghu-lab-guide-{lang}.pdf',labels['manual'])+'</div>'
            if id=='index':
                body+='<h2>'+labels['tasks']+'</h2><div class="guide-tasks">'+''.join(link(href(t[2]),t[lang=='es']) for t in TASKS)+'</div>'
                body+='<label for="guide-search">'+labels['search']+'</label><p><input type="search" id="guide-search" class="guide-search" autocomplete="off"><button class="guide-clear" id="guide-clear">'+labels['clear']+'</button></p><p id="guide-status" role="status" data-count="'+labels['count']+'" data-none="'+labels['none']+'"></p>'
                body+='<h2>'+labels['families']+'</h2>'
                for enname,esname,ids in [('Start here','Empieza aquí','getting-started'),*GROUPS]:
                    body+='<section data-guide-group><h3>'+esc(esname if lang=='es' else enname)+'</h3><ul class="guide-list">'
                    for gid in ids.split():
                        g=guides[gid];search=' '.join([g['id'],g['title'],g['what'],g['purpose'],*[c['name'] for c in g['controls']]])
                        body+='<li data-guide-search="'+esc(search)+'"><span class="guide-kind">'+esc(labels.get('menu' if g['kind']=='section' else g['kind'],labels['start']))+'</span><h3>'+link(href(gid),g['title'])+'</h3><p>'+esc(g['what'])+'</p></li>'
                    body+='</ul></section>'
                body+=SEARCH
            elif id=='glossary':
                for key,t in d['glossary'].items():
                    body+='<section id="'+esc(key)+'"><h2>'+esc(t['term'])+'</h2><p>'+t['body']+'</p>'+link('#top',labels['up'])+'</section>'
            else:
                g=guides[id]
                body+='<div class="guide-actions">'+link(prefix+'app/index.html#'+g['route'],labels['open'])+link(prefix+'video/index.html?lang='+lang+'#'+g['video'],labels['video'])+'</div><p class="note">'+labels['note']+'</p>'
                keys=['purpose','steps','controls','outputs','example']+(['formulas'] if g.get('formulas') else [])+['limits','troubleshooting','terms','related','references']
                body+='<nav aria-label="'+labels['contents']+'"><ul class="guide-toc">'+''.join('<li>'+link('#'+k,labels[k])+'</li>' for k in keys if g.get(k))+'</ul></nav>'
                for k in keys:
                    if not g.get(k):continue
                    body+='<section id="'+k+'"><h2>'+labels[k]+'</h2>'
                    if k=='purpose':body+='<p>'+esc(g[k])+'</p>'
                    elif k=='steps':body+=items(g[k],True)
                    elif k in ('controls','outputs'):
                        heads=[labels['control'] if k=='controls' else labels['result'],labels['meaning']]+([labels['tryit']] if k=='controls' else [])
                        body+='<table><thead><tr>'+''.join('<th scope="col">'+x+'</th>' for x in heads)+'</tr></thead><tbody>'
                        body+=''.join('<tr><th scope="row">'+esc(c['name'])+'</th><td>'+esc(c['meaning'])+'</td>'+('<td>'+esc(c['try'])+'</td>' if k=='controls' else '')+'</tr>' for c in g[k])+'</tbody></table>'
                        if k=='outputs':body+='<p>'+esc(g['read'])+'</p>'
                    elif k=='example':body+='<div class="guide-example"><h3>'+esc(g[k]['title'])+'</h3>'+items(g[k]['steps'],True)+'<p><b>'+labels['expect']+':</b> '+esc(g[k]['expect'])+'</p></div>'
                    elif k=='formulas':body+=''.join('<p class="guide-formula">'+esc(f['expression'])+'</p><p>'+esc(f['meaning'])+'</p>' for f in g[k])
                    elif k=='limits':body+=items(g[k])
                    elif k=='troubleshooting':body+=''.join('<h3>'+esc(t['symptom'])+'</h3><p>'+esc(t['action'])+'</p>' for t in g[k])
                    elif k=='terms':body+='<ul>'+''.join('<li>'+link(href('glossary')+'#'+t,d['glossary'][t]['term'])+'</li>' for t in g[k])+'</ul>'
                    elif k=='related':body+='<ul>'+''.join('<li>'+link(href(t),guides[t]['title'])+'</li>' for t in g[k])+'</ul>'
                    elif k=='references':body+='<ul>'+''.join('<li>'+link(r['url'],r['label'])+'</li>' for r in g[k])+'</ul>'
                    body+='</section>'
            body+='<p class="note">'+labels['footer']+'</p>'+link('#top',labels['up'])+'</article>'
            result=page(shell,css+CSS,title=title+' — GHU Lab',desc=desc,body=body,depth=depth,here='GUIDE',build=build)
            result=result.replace('<html lang="en">','<html lang="'+lang+'">')
            alternates='<link rel="canonical" href="'+BASE+path+'">\n'+''.join('<link rel="alternate" hreflang="'+l+'" href="'+BASE+relpath(id,l)+'">\n' for l in LANGUAGES)+'<link rel="alternate" hreflang="x-default" href="'+BASE+relpath(id,'en')+'">\n'
            result=result.replace('</head>',alternates+'</head>')
            if lang=='es':
                for a,b in [('>the instrument<','>instrumento<'),('>🎬 video guide<','>🎬 vídeo<'),('>the series<','>papers<'),('>changes<','>cambios<'),('>docs<','>documentación<'),('>editions<','>ediciones<'),('>user guide<','>guía de uso<')]:result=result.replace(a,b)
                result=result.replace('href="'+prefix+'guide/index.html" aria-current="page">guía de uso', 'href="'+prefix+'guide/es/index.html" aria-current="page">guía de uso')
                result=result.replace('independent researcher','investigador independiente').replace('built with Claude (Anthropic) as assistant.','creado con Claude (Anthropic) como asistente.').replace('The papers are archived on Zenodo under CC&nbsp;BY&nbsp;4.0; the code is Apache&nbsp;2.0.','Los papers están archivados en Zenodo bajo CC&nbsp;BY&nbsp;4.0; el código usa Apache&nbsp;2.0.').replace('This page was generated on '+build+' and reaches nothing outside itself.','Página generada el '+build+'; se muestra sin cargar recursos externos.').replace('XML sitemap','Mapa XML del sitio')
            write(path,result)
    dest=out/'guide/manual';dest.mkdir(parents=True,exist_ok=True)
    for p in (root/'docs/manual').glob('*'):
        if p.suffix in ('.pdf','.tex','.json'):shutil.copyfile(p,dest/p.name)
