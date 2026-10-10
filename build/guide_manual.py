"""Generate the downloadable manuals from the same guide records as HTML and app help.

Requires pdfLaTeX with Babel, fontenc, lmodern, geometry, enumitem, amssymb and hyperref.
Spanish uses the Babel options used by the series; Babel typesets, it does not translate.
"""
import argparse,hashlib,html,json,os,pathlib,re,shutil,subprocess,tempfile
from user_guides import load,validate,LABELS,BASE,relpath
ROOT=pathlib.Path(__file__).resolve().parents[1]
GREEK=dict(zip('ΓΔΛΣαβγδηθκλμπστφχ',['Gamma','Delta','Lambda','Sigma','alpha','beta','gamma','delta','eta','theta','kappa','lambda','mu','pi','sigma','tau','phi','chi']))
MATH={'±':r'\pm','≈':r'\approx','≥':r'\geq','×':r'\times','½':r'\frac{1}{2}','ℏ':r'\hbar','ℓ':r'\ell','→':r'\rightarrow','∏':r'\prod','−':'-','√':r'\surd','≤':r'\leq','⋊':r'\rtimes','⌊':r'\lfloor','⌋':r'\rfloor','′':r'\prime'}
SUP=dict(zip('⁰¹²³⁴⁶⁻ʳᶜ','012346-rc'));SUB=dict(zip('₀₁₂₃₄₅₊₋ᵢ','012345+-i'))

def tex(s):
    s=html.unescape(re.sub('<[^>]+>','',str(s)))
    result=[];i=0
    while i<len(s):
        c=s[i]
        if i+1<len(s) and s[i+1]=='̄':result.append(r'\ensuremath{\overline{'+c+'}}');i+=2;continue
        if c in SUP or c in SUB:
            table=SUP if c in SUP else SUB;mark='^' if c in SUP else '_';digits=''
            while i<len(s) and s[i] in table:digits+=table[s[i]];i+=1
            result.append(r'\ensuremath{{}'+mark+'{'+digits+'}}');continue
        if c in GREEK:result.append('\\ensuremath{\\'+GREEK[c]+'}')
        elif c in MATH:result.append(r'\ensuremath{'+MATH[c]+'}')
        elif c in '\\&%$#_{}':result.append({'\\':r'\textbackslash{}'}.get(c,'\\'+c))
        elif c=='^':result.append(r'\textasciicircum{}')
        elif c=='~':result.append(r'\textasciitilde{}')
        elif c=='ł':result.append(r'\l{}')
        else:result.append({'–':'--','—':'---','’':"'",'“':'``','”':"''"}.get(c,c))
        i+=1
    return ''.join(result)

def listing(values,ordered=False):
    env='enumerate' if ordered else 'itemize'
    return '\\begin{'+env+'}\n'+''.join('\\item '+tex(x)+'\n' for x in values)+'\\end{'+env+'}\n'

def source(root,lang):
    d=load(root,lang);l=LABELS[lang]
    babel='spanish,es-noshorthands,es-nodecimaldot,es-tabla' if lang=='es' else 'english'
    out=r'''\documentclass[11pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage[margin=23mm]{geometry}
\usepackage{amssymb}
\usepackage{enumitem}
\usepackage['''+babel+r''']{babel}
\usepackage[unicode,hidelinks]{hyperref}
\setlength{\parindent}{0pt}
\setlength{\parskip}{5pt}
\setlength{\emergencystretch}{3em}
\setlist{itemsep=3pt,topsep=3pt}
\hypersetup{pdftitle={GHU Lab -- '''+tex(l['index'])+r'''},pdfauthor={Carles Marin},pdfsubject={Laboratory user guide}}
\begin{document}
\begin{titlepage}
{\Huge\bfseries GHU Lab\par}
\vspace{12mm}
{\LARGE '''+tex(l['index'])+r'''\par}
\vspace{7mm}
'''+('Castellano. Composición con Babel.' if lang=='es' else 'English edition.')+r'''\par
'''+('9 de octubre de 2026' if lang=='es' else '9 October 2026')+r'''\par
\vspace{8mm}
'''+tex(l['note'])+r'''\par
\vfill
Carles Marín\par
'''+('Fuentes y atribuciones científicas al final de cada guía. Este manual documenta el instrumento; no reclama novedad de las fórmulas.' if lang=='es' else 'Scientific sources and attribution accompany each guide. This manual documents the instrument; it does not claim novelty for the formulas.')+r'''\par
\href{'''+BASE+relpath('index',lang)+r'''}{'''+('Guía web actual' if lang=='es' else 'Current web guide')+r'''}
\end{titlepage}
\tableofcontents
\clearpage
'''
    guides=sorted(d['guides'],key=lambda g:(g['id']!='getting-started',next(i for i,x in enumerate(d['guides']) if x['id']==g['id'])))
    for g in guides:
        out+='\\section{'+tex(g['title'])+'}\n'+tex(g['what'])+'\n\n'
        out+='\\href{'+BASE+relpath(g['id'],lang)+'}{'+('Abrir guía web' if lang=='es' else 'Open web guide')+'}\n\n'
        out+=tex(g['purpose'])+'\n\\subsection*{'+tex(l['steps'])+'}\n'+listing(g['steps'],True)
        out+='\\subsection*{'+tex(l['controls'])+'}\n'
        for c in g['controls']:out+='\\textbf{'+tex(c['name'])+'}. '+tex(c['meaning'])+' '+tex(c['try'])+'\n\n'
        out+='\\subsection*{'+tex(l['outputs'])+'}\n'
        for c in g['outputs']:out+='\\textbf{'+tex(c['name'])+'}. '+tex(c['meaning'])+'\n\n'
        out+=tex(g['read'])+'\n\\subsection*{'+tex(l['example']+': '+g['example']['title'])+'}\n'+listing(g['example']['steps'],True)+tex(g['example']['expect'])+'\n'
        if g.get('formulas'):
            out+='\\subsection*{'+tex(l['formulas'])+'}\n'
            for f in g['formulas']:out+='\\begin{quote}'+tex(f['expression'])+'\\end{quote}\n'+tex(f['meaning'])+'\n\n'
        out+='\\subsection*{'+tex(l['limits'])+'}\n'+listing(g['limits'])
        out+='\\subsection*{'+tex(l['troubleshooting'])+'}\n'
        for t in g['troubleshooting']:out+='\\textbf{'+tex(t['symptom'])+'} '+tex(t['action'])+'\n\n'
        out+='\\subsection*{'+tex(l['references'])+'}\n\\begin{itemize}\n'
        for r in g['references']:out+='\\item \\href{'+r['url'].replace('%',r'\%')+'}{'+tex(r['label'])+'}\n'
        out+='\\end{itemize}\n'
    out+='\\section{'+tex(l['glossary'])+'}\n'
    for t in d['glossary'].values():out+='\\subsection*{'+tex(t['term'])+'}\n'+tex(t['body'])+'\n\n'
    return out+'\\end{document}\n'

def build(root=ROOT,compiler=None):
    validate(root);compiler=compiler or shutil.which('pdflatex')
    if not compiler:raise SystemExit('pdfLaTeX is required: set --compiler or put pdflatex on PATH.')
    target=root/'docs/manual';target.mkdir(parents=True,exist_ok=True)
    evidence={'generator':'build/guide_manual.py','languages':{},'babelSpanishOptions':'spanish,es-noshorthands,es-nodecimaldot,es-tabla','inputs':{}}
    digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    for rel in ['docs/user-guides.json','docs/user-guides.es.json','build/guide_manual.py']:evidence['inputs'][rel]=digest(root/rel)
    for lang in ['en','es']:
        stem='ghu-lab-guide-'+lang;code=source(root,lang);(target/(stem+'.tex')).write_text(code,encoding='utf-8',newline='\n')
        with tempfile.TemporaryDirectory(prefix='ghu-manual-') as folder:
            folder=pathlib.Path(folder);(folder/(stem+'.tex')).write_text(code,encoding='utf-8')
            for _ in range(3):
                r=subprocess.run([str(compiler),'--disable-installer','-interaction=nonstopmode','-halt-on-error',stem+'.tex'],cwd=folder,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=dict(os.environ,SOURCE_DATE_EPOCH='1791504000'),encoding='utf-8',errors='replace')
                if r.returncode:raise RuntimeError(r.stdout[-6000:])
            log=(folder/(stem+'.log')).read_text(encoding='utf-8',errors='replace')
            problems=[line for line in log.splitlines() if 'Missing character:' in line or 'Overfull \\hbox' in line or 'Overfull \\vbox' in line]
            if problems:raise RuntimeError('Manual typography: '+'\n'.join(problems))
            shutil.copyfile(folder/(stem+'.pdf'),target/(stem+'.pdf'))
            evidence['languages'][lang]={'pdfSHA256':digest(target/(stem+'.pdf')),'texSHA256':digest(target/(stem+'.tex')),'guides':len(load(root,lang)['guides']),'glossaryTerms':len(load(root,lang)['glossary']),'missingGlyphs':0,'overfullBoxes':0}
    (target/'manifest.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('Built both manuals with Babel; no missing glyphs or overfull boxes')

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--compiler');args=ap.parse_args();build(compiler=args.compiler)
