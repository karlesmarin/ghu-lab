"""Use the existing film palette, formula reveal and word-caption primitives."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'full'))
from whiteboard_core import *
DATA=json.loads((HERE/'inputs.json').read_text(encoding='utf-8'))

def wrap(d,pos,s,width=950,size=29,color=INK,bold=False):
    x,y=pos;line=''
    for word in s.split():
        test=(line+' '+word).strip()
        if d.textlength(test,font=font(size,bold))>width and line:
            text(d,(x,y),line,size,color,bold);y+=size+11;line=word
        else:line=test
    if line:text(d,(x,y),line,size,color,bold)
    return y+size+11

def frame(scene,number,lang,p,elapsed,caps):
    es=lang=='es';T=lambda en,sp:sp if es else en
    im=base.copy();d=ImageDraw.Draw(im)
    text(d,(78,29),'GHU LAB / '+scene['section'].upper(),23,TEAL,True)
    size=44
    while d.textlength(scene['title'],font=font(size,True))>1510:size-=1
    text(d,(78,68),scene['title'],size,INK,True)
    text(d,(1660,80),f'{44+number} / 46 · '+lang.upper(),23,MUTED)
    d.rounded_rectangle((1215,182,1835,889),radius=24,fill='#fffef7',outline='#cdd6ce',width=2)
    def right(formulas,note):
        y=225
        for i,s in enumerate(formulas):
            if p>=i*.12:eq(im,(1250,y),s,29,TEAL if i==len(formulas)-1 else INK,reveal=min(1,max(0,(p-i*.12)*12)))
            y+=110
        if p>.48:wrap(d,(1250,max(650,y+20)),note,535,27,MUTED)
    if scene['id']=='m1':
        text(d,(155,205),T('Fixed finite-width model','Modelo fijo de anchura finita'),34,TEAL,True)
        eq(im,(165,285),r'\Omega=(0,1)^2,\quad \varepsilon=1/8,\quad \alpha=1/20',31)
        eq(im,(165,380),r'c=38,\quad k_L=2,\quad k_T=8,\quad q=1',31)
        if p>.16:eq(im,(165,490),r'D(t)=\min_{q(u)=1}\{A(u)-tB(u)\},\quad F(t)=t/D(t)',31,reveal=min(1,(p-.16)*8))
        if p>.3:wrap(d,(165,620),T('Uniform and triangular stiffness profiles; the mass form B is identical.','Perfiles de rigidez uniforme y triangular; la forma de masa B es idéntica.'),960,31)
        if p>.5:wrap(d,(165,785),T('The physical dictionary requires the actual GHU action and field domain.','La correspondencia física requiere la acción GHU y el dominio real de campos.'),960,28,MUTED)
        right([r's=1/100,\quad R=1/2',r'Q=F(t)-F(s)-(t-s)F^\prime(s)',r'C(t)=-[(t-s)/R+Q]^{-1}'],T('Exact matching identity; no truncated Taylor series. The ZIP states A, B and every boundary condition.','Identidad exacta de matching; sin truncar Taylor. El ZIP define A, B y todas las condiciones de frontera.'))
    elif scene['id']=='m2':
        labels=[T('Admissible polynomial witness p','Testigo polinómico admisible p'),T('Exact interfaces + independent integrals','Interfaces exactas + integrales independientes'),T('Residual bound + positive coercivity','Cota residual + coercividad positiva'),T('Continuum enclosure → matched response','Cota del continuo → respuesta emparejada')]
        for i,label in enumerate(labels):
            if p<i*.13:continue
            y=210+i*155
            d.rounded_rectangle((160,y,1120,y+114),radius=16,fill='#fffef7',outline=TEAL,width=3)
            wrap(d,(185,y+35),label,900,31,TEAL,True)
            if i<3:arrow(d,(640,y+119),(640,y+148),TEAL,3)
        right([r'\theta=1-t/g>0',r'|H_t(p,v)|\leq\eta\sqrt{A(v)}',r'h_- -\eta^2/\theta\leq D(t)\leq h_+'],T('Written functional proof + independent Sage replay: 228 checks. No new Lean formalization.','Demostración funcional escrita + repetición Sage independiente: 228 comprobaciones. Sin nueva formalización Lean.'))
        if p>.65:wrap(d,(165,849),T('Witness optimality is unnecessary.','No se exige optimalidad del testigo.'),960,26,MUTED)
    else:
        text(d,(155,205),T('Certified ΔC = C uniform − C triangular','ΔC certificado = C uniforme − C triangular'),31,TEAL,True)
        X=lambda value:210+850*value/.0004
        d.line((X(0),310,X(0),730),fill=ORANGE,width=4)
        d.line((X(0),740,X(.0004),740),fill=INK,width=3)
        for value,label in [(0,'0'),(.0001,'0.0001'),(.0002,'0.0002'),(.0003,'0.0003'),(.0004,'0.0004')]:
            x=X(value);d.line((x,735,x,752),fill=INK,width=2);text(d,(x-34,765),label,23,MUTED)
        for i,r in enumerate(DATA['matchedProfiles']):
            lo,hi=map(float,r['comparison']['difference_a_minus_b']);y=380+220*i
            text(d,(165,y-82),'t = '+r['parameters']['t'],29,INK,True)
            if p>=i*.22:
                d.line((X(lo),y,X(lo+(hi-lo)*min(1,max(0,(p-i*.22)*5))),y),fill=TEAL,width=13)
                for v in [lo,hi]:d.line((X(v),y-19,X(v),y+19),fill=TEAL,width=3)
                text(d,(305,y+38),'['+', '.join(r['comparison']['difference_a_minus_b'])+']',27,TEAL)
        wrap(d,(165,840),T('Numerical enclosures, not experimental error bars.','Cotas numéricas; no son errores experimentales.'),980,26,MUTED)
        right([r'\Delta C(1/4)>0',r'\Delta C(1/2)>0',r'C_{\rm uniform}\ne C_{\rm triangular}'],T('Only the stated finite-width model and two probes. No thin-layer rate, full GHU construction or experimental fit.','Solo el modelo de anchura finita y dos sondas. Sin tasa de capa delgada, construcción GHU completa ni ajuste experimental.'))
    caption=next((s for a,b,s in caps if a<=elapsed<b),'')
    if caption:
        for i,line in enumerate(textwrap.wrap(caption,width=102)):
            tw=d.textlength(line,font=font(32));text(d,((W-tw)/2,961+i*42),line,32,'#ffffff')
    return im
