"""New chapters drawn with the original film's whiteboard primitives and palette."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'full'))
from whiteboard_core import *
DATA=json.loads((HERE/'inputs.json').read_text())

def wrap(d,pos,s,width=490,size=28,color=INK,bold=False):
    x,y=pos;line=''
    for word in s.split():
        test=(line+' '+word).strip()
        if d.textlength(test,font=font(size,bold))>width and line:
            text(d,(x,y),line,size,color,bold);y+=size+10;line=word
        else:line=test
    if line:text(d,(x,y),line,size,color,bold)
    return y+size+10

def frame(scene,number,lang,p,elapsed,caps):
    es=lang=='es';T=lambda en,sp:sp if es else en
    im=base.copy();d=ImageDraw.Draw(im)
    text(d,(78,29),'GHU LAB / '+scene['section'].upper(),23,TEAL,True)
    title=scene['title'];size=44
    while d.textlength(title,font=font(size,True))>1510:size-=1
    text(d,(78,68),title,size,INK,True);text(d,(1660,80),f'{29+number} / 43 · '+lang.upper(),23,MUTED)
    d.rounded_rectangle((1215,182,1835,889),radius=24,fill='#fffef7',outline='#cdd6ce',width=2)
    def right(formulas,notes):
        y=224
        for i,s in enumerate(formulas):
            if es:
                for a,b in [('identity','identidad'),('numerical\\ error','error\\ numérico'),('physical\\ prediction','predicción\\ física')]:s=s.replace(a,b)
            if es:
                for a,b in [('hypotheses','hipótesis'),('conclusion','conclusión'),('dictionary','correspondencia'),('assumptions','hipótesis'),('proof','demostración'),('all\\ fields','todos\\ los\\ campos'),('interactions','interacciones'),('Lean\\ files','archivos\\ Lean'),('theorem\\ declarations','declaraciones\\ de\\ teoremas'),('model','modelo'),('likelihood','verosimilitud')]:s=s.replace(a,b)
            if p>=i*.13:eq(im,(1250,y),s,29,TEAL if i==len(formulas)-1 else INK,reveal=min(1,max(0,(p-i*.13)*12)))
            y+=112
        if p>.47:wrap(d,(1250,max(660,y+18)),notes,540,27,MUTED)
    def foot(s):wrap(d,(155,846),s,1015,25,MUTED)
    def box(x,y,w,h,label,color=TEAL):
        d.rounded_rectangle((x,y,x+w,y+h),radius=18,fill='#fffef7',outline=color,width=3)
        wrap(d,(x+23,y+20),label,w-46,29,color,True)
    sid=scene['id']
    if sid=='s2':
        for i,(label,val) in enumerate([(T('Hypothesis algebra declarations','Declaraciones de álgebra de hipótesis'),'10'),(T('New Lean declarations','Nuevas declaraciones Lean'),'23'),(T('Existing SU(7) declarations','Declaraciones SU(7) anteriores'),'26')]):
            y=222+i*188;box(160,y,925,145,label)
            text(d,(965,y+52),val,51,TEAL,True)
        right([r'10+23+26=59',r'\mathrm{hypotheses}\ \Longrightarrow\ \mathrm{conclusion}'],T('The physical identification is an additional step. Five Lean files; no claim of full model consistency.','La identificación física es un paso adicional. Cinco archivos Lean; no se afirma consistencia del modelo completo.'))
        foot(T('Different certificates answer different questions.','Certificados distintos responden a preguntas distintas.'))
    elif sid=='q1':
        rows=[(r'\mathcal{L}f=\lambda f',r'm^2=\lambda/L^2',T('Scale + kinetic normalization','Escala + normalización cinética')),(r'G_{ij}=\langle f_i,f_j\rangle',r'\mathrm{rank}(G)',T('Actual physical field domain','Dominio físico real de los campos')),(r'Q\in H^4(BH;\mathbb{Z})',r'e^{iS}',T('Group + bundles + normalized action','Grupo + fibrados + acción normalizada'))]
        for i,(a,b,label) in enumerate(rows):
            y=235+i*190;eq(im,(170,y),a,32);arrow(d,(580,y+28),(715,y+28),TEAL,4)
            if p>i*.18:eq(im,(765,y),b,32,BLUE)
            text(d,(170,y+77),label,28,MUTED)
        right([r'\mathrm{dictionary}',r'+\ \mathrm{assumptions}',r'+\ \mathrm{proof}'],T('A mathematical implication acquires physical meaning only after this identification.','Una implicación matemática adquiere significado físico después de esta identificación.'))
    elif sid=='q2':
        for cx,period,color,label in [(390,1,TEAL,T('Integer period','Período entero')),(875,.5,ORANGE,T('Half-integer period','Período semientero'))]:
            cy=495;r=168;d.ellipse((cx-r,cy-r,cx+r,cy+r),outline='#c7d2cd',width=3)
            theta=2*math.pi*period*min(1,p/.72);pt=(cx+r*math.cos(theta),cy-r*math.sin(theta))
            d.arc((cx-r,cy-r,cx+r,cy+r),-math.degrees(theta),0,fill=color,width=8)
            arrow(d,(cx,cy),pt,color,5);d.ellipse((pt[0]-9,pt[1]-9,pt[0]+9,pt[1]+9),fill=color)
            text(d,(cx-160,250),label,30,color,True);text(d,(cx+r+16,cy-16),'+1',27,MUTED)
            text(d,(cx-r-49,cy-16),'−1',27,MUTED)
            eq(im,(cx-78,731),r'\int Q='+('1' if period==1 else r'\frac{1}{2}'),32,color)
        right([r'S_{\mathrm{top}}=\theta\!\int Q',r'\theta\mapsto\theta+2\pi',r'e^{iS}\mapsto e^{iS}e^{2\pi i\int Q}'],T('Normalized axion example. The same phase requires integral periods on the allowed backgrounds.','Ejemplo normalizado del axión. La misma fase exige períodos enteros en los fondos permitidos.'))
        foot(T('Illustration of phase consistency; not an experimental measurement.','Ilustración de consistencia de fase; no es una medida experimental.'))
    elif sid=='q3':
        eq(im,(180,223),r'H=S(U(2)\times U(3))',38,TEAL)
        for i,(s,c) in enumerate([(r'\alpha(A-C/4)',BLUE),(r'\beta(B-C/3)',ORANGE),(r'+\ \gamma C',TEAL)]):
            eq(im,(210,344+i*110),s,36,c)
        arrow(d,(660,441),(851,441),INK,5)
        if p>.26:eq(im,(890,400),r'A+B',42,TEAL)
        eq(im,(210,733),r'\alpha=\beta=1,\quad\gamma=\frac{7}{12}',32)
        right([r'Q=\alpha A+\beta B+\delta C',r'\delta=\gamma-\alpha/4-\beta/3',r'\alpha,\beta,\delta\in\mathbb{Z}'],T('Universal criterion. Lean verifies the coefficient arithmetic; the topological dictionary is external.','Criterio universal. Lean verifica la aritmética; la correspondencia topológica es externa.'))
    elif sid=='q4':
        for i,(title,formula,color) in enumerate([(T('Universal test','Prueba universal'),r'\mathbb{CP}^{2}:\ \int Y^2=1',ORANGE),(T('Closed smooth spin 4-manifold','Variedad espín cerrada suave 4D'),r'S^2\times S^2:\ \int(a+b)^2=2',TEAL)]):
            y=240+i*285;box(165,y,955,225,title,color);eq(im,(202,y+78),formula,30,color)
            if p>.2+i*.2:eq(im,(202,y+154),r'\int Q='+ (r'\frac{1}{2}\notin\mathbb{Z}' if i==0 else r'1\in\mathbb{Z}'),29,color)
        right([r'Q=C/2,\quad C=Y^2',r'\int_X Y^2\in 2\mathbb{Z}\ (X\ \mathrm{spin})',r'\alpha,\beta,2\delta\in\mathbb{Z}'],T('Wu parity supplies the topological step. Admissible orbifold backgrounds need a separate argument.','La paridad de Wu aporta el paso topológico. Los fondos admisibles del orbifold requieren otro argumento.'))
        foot(T('The projective plane is not spin; the two tests use different domains.','El plano proyectivo no es espín; las dos pruebas usan dominios distintos.'))
    elif sid=='q5':
        eq(im,(195,224),r'(b_0,b_1)=(1,6),\quad(m,n)=(1,0)',33)
        for i in range(4):
            x=215+i*205;d.rounded_rectangle((x,350,x+190,550),radius=12,fill=BLUE if i==0 else TEAL)
            text(d,(x+62,422),'1/4',34,'white',True)
        text(d,(217,583),'b₀',31,BLUE,True);text(d,(625,583),'b₁',31,TEAL,True)
        if p>.35:eq(im,(205,698),r'\frac{1}{4}+\frac{3}{4}=1',43,TEAL)
        right([r'Q=\frac{b_0(m-n)^2}{4}+\frac{b_1(m+n)^2}{8}',r'b_0\in\mathbb{Z},\ b_1+2b_0\in8\mathbb{Z}',r'Q=m^2+mn+n^2'],T('Joint integrality. A complete anomaly-free supergravity spectrum is not constructed here.','Integralidad conjunta. Aquí no se construye un espectro completo de supergravedad libre de anomalías.'))
        foot(T('The fractions are contributions to the same characteristic class.','Las fracciones contribuyen a una misma clase característica.'))
    elif sid=='q6':
        origin=(590,630);d.polygon([(190,550),(620,275),(1100,560),(650,815)],fill='#d0e3da',outline=TEAL)
        arrow(d,origin,(345,490),BLUE,7);arrow(d,origin,(865,458),BLUE,7)
        eq(im,(195,402),r'(-2,0,1)',26,BLUE);eq(im,(855,361),r'(0,-2,1)',26,BLUE)
        text(d,(330,747),'ℓ = 0',36,TEAL,True)
        if p>.2:arrow(d,origin,(650,231),ORANGE,7);text(d,(684,249),'v',42,ORANGE,True)
        right([r'\ell(x,y,z)=x+y+2z',r'\ell(R_1)=\ell(R_2)=0',r'6\ell(v)=16-3p-3q-6r',r'6\ell(v)\equiv1\ (\mathrm{mod}\ 3)'],T('Conditional obstruction for this response family.','Obstrucción condicional para esta familia de respuestas.'))
        foot(T('Schematic linear map; integer p, q, r. Additional responses need a new test.','Mapa lineal esquemático; p, q, r enteros. Otras respuestas exigen otra prueba.'))
    elif sid=='q7':
        box(175,233,930,202,T('Clifford / group element','Clifford / elemento del grupo'),ORANGE)
        eq(im,(220,318),r't_a^2=(-1)^{18\cdot17/2}=-1',34,ORANGE)
        box(175,537,930,216,T('Operator on the representation','Operador en la representación'),TEAL)
        eq(im,(220,624),r'U_a=-it_a,\qquad U_a^2=+1',34,TEAL)
        arrow(d,(635,450),(635,521),INK,5)
        right([r'(-i)^2\,t_a^2=(-1)(-1)=1',r'\mathrm{all\ fields}+\mathrm{interactions}'],T('Including the bosonic Ω field. A twisted combined action must be specified. 3,290 exact checks; not a Lean proof.','Incluido el campo bosónico Ω. Hay que especificar una acción combinada torcida. 3.290 comprobaciones exactas; no es una prueba Lean.'))
    elif sid=='q8':
        labels=[T('Exact rational inputs','Entradas racionales exactas'),T('Criterion + witness','Criterio + testigo'),T('Lattice + cocharacter map','Retícula + mapa de cocaracteres')]
        for i,label in enumerate(labels):
            y=212+i*200;box(190,y,875,127,label,TEAL if i<2 else BLUE)
            if i<2:arrow(d,(630,y+138),(630,y+185),INK,4)
        # Exact displayed witness, not an interpolated or measured map.
        eq(im,(220,797),r'(b_0,b_1)=(1,6):\ Q(1,0)=1',32,TEAL)
        right([r'Q(m,n)\in\mathbb{Z}\ \forall m,n\in\mathbb{Z}',r'5\ \mathrm{Lean\ files}',r'59\ \mathrm{theorem\ declarations}'],T('Finite figures illustrate. Formal proofs establish scoped universal arithmetic. The download also includes the maintained data and replay scripts.','Las figuras finitas ilustran. Las pruebas formales establecen aritmética universal de alcance definido. La descarga incluye los datos mantenidos y los scripts de repetición.'))
    elif sid=='q9':
        for index,(key,col) in enumerate([('atlas',TEAL),('cms',BLUE)]):
            data=DATA[key];x0=215+index*500;y0=705;w=405;h=310
            masses=data['mass_TeV'] if key=='atlas' else [v/1000 for v in data['mass_GeV']]
            vals=data['observed_pb'] if key=='atlas' else data['observed_narrow_pb']
            lo,hi=(-2,1) if key=='atlas' else (-5,0);xmin,xmax=(0,5) if key=='atlas' else (1,9)
            X=lambda m:x0+w*(m-xmin)/(xmax-xmin);Y=lambda v:y0-h*(math.log10(v)-lo)/(hi-lo)
            text(d,(x0-35,222),'ATLAS tt̄' if key=='atlas' else 'CMS dijet',30,col,True)
            text(d,(x0-35,275),T('95% CL observed limit','Límite observado 95% CL'),25,MUTED)
            text(d,(x0-35,315),'Γ/M = 30%' if key=='atlas' else T('Narrow qq resonance','Resonancia qq estrecha'),25,MUTED)
            for tick in range(lo,hi+1):
                yy=Y(10**tick);d.line((x0,yy,x0+w,yy),fill='#d9ded6',width=1);text(d,(x0-66,yy-14),f'10^{tick}',20,MUTED)
            d.line((x0,y0-h,x0,y0,x0+w,y0),fill=INK,width=2)
            for m in ([1,3,5] if key=='atlas' else [2,5,8]):text(d,(X(m)-8,y0+13),str(m),23,MUTED)
            count=max(1,min(len(vals),math.ceil(len(vals)*min(1,p/.65))))
            pts=[(X(masses[i]),Y(vals[i])) for i in range(count)]
            if len(pts)>1:d.line(pts,fill=col,width=4)
            for x,y in pts:d.ellipse((x-3,y-3,x+3,y+3),fill=col)
            text(d,(x0+55,755),T('Mass [TeV]','Masa [TeV]'),25,MUTED)
            text(d,(x0-30,805),'σ × BR(tt̄) [pb]' if key=='atlas' else 'σ × B × A [pb]',26,col)
        right([r'\mathrm{model}\ \longrightarrow (m,g,\Gamma)',r'\longrightarrow\ \sigma\times B\ (\times A)',r'\longrightarrow\ \mathrm{likelihood}'],T('This physical map is still missing for the new quantization examples. Separate hypotheses and vertical scales. No new-particle signal claimed.','Esta conexión física sigue pendiente para los nuevos ejemplos de cuantización. Hipótesis y escalas verticales distintas. No se afirma señal de nueva partícula.'))
        text(d,(180,886),'ATLAS 2512.17856 · CMS 1911.03947 · 13 TeV',23,MUTED)
    elif sid=='h1':
        eq(im,(180,235),r'H=f_H(\theta-\theta_H)',40,TEAL)
        eq(im,(180,355),r'V=V_0+\frac{m_H^2}{2}H^2+\lambda_3H^3+\lambda_4H^4+\cdots',34)
        for i,(label,formula) in enumerate([(T('Curvature','Curvatura'),r'm_H^2=V^{\prime\prime}/f_H^2'),(T('Cubic response','Respuesta cúbica'),r'\lambda_3=V^{(3)}/(6f_H^3)'),(T('Quartic response','Respuesta cuártica'),r'\lambda_4=V^{(4)}/(24f_H^4)')]):
            y=500+i*105
            if p>i*.16:text(d,(180,y),label,29,BLUE,True);eq(im,(600,y-3),formula,31,TEAL)
        right([r'\lambda_n=\frac{V^{(n)}(\theta_H)}{n!f_H^n}',r'\mathrm{vertex}\ :\ n!\lambda_n'],T('Local expansion; constant nonzero fH and the stated coefficient convention. Lean algebra and symbolic calculus have distinct scopes.','Expansión local; fH constante no nulo y la convención de coeficientes indicada. Álgebra Lean y cálculo simbólico tienen alcances distintos.'))
        foot(T('Read the convention before comparing couplings from different papers.','Lee la convención antes de comparar acoplamientos de artículos distintos.'))
    elif sid=='h2':
        data=DATA['hypothesis'];curve=data['potential']['global'];xs=curve['theta'];ys=curve['delta']
        maximum=max(abs(y) for row in ys for y in row);exponent=math.floor(math.log10(maximum));factor=10**exponent
        bound=maximum*1.12;X=lambda x:210+860*x/math.pi;Y=lambda y:520-250*y/bound
        text(d,(210,205),T('Calculated potential differences','Diferencias de potencial calculadas'),31,TEAL,True)
        text(d,(210,254),'ΔV / (mH² fH²) · ×10^'+str(exponent),28,MUTED)
        for val in [-maximum,0,maximum]:
            yy=Y(val);d.line((210,yy,1070,yy),fill='#cfd9d1',width=2);text(d,(112,yy-12),f'{val/factor:.2f}',23,MUTED)
        d.line((210,280,210,795,1080,795),fill=INK,width=2)
        for val,label in [(0,'0'),(math.pi/2,'π/2'),(math.pi,'π')]:text(d,(X(val)-13,806),label,25,MUTED)
        count=max(2,math.ceil(len(xs)*min(1,p/.72)))
        for i,row in enumerate(ys):
            d.line([(X(x),Y(y)) for x,y in zip(xs[:count],row[:count])],fill=ORANGE if i==5 else '#9bb7ae',width=5 if i==5 else 2)
        text(d,(420,844),'θ [rad] · '+T('case 6 highlighted','caso 6 destacado'),26,MUTED)
        row=data['rows'][5];ref=data['rows'][0]
        right([r'\theta_H=0.1,\quad m_H=125.1\ \mathrm{GeV}',r'\Delta V=(V_i-V_{i,0})-(V_1-V_{1,0})'],T(f'Case 6: λ3 changes {100*(row["l3"]/ref["l3"]-1):.3f}%; λ4 changes {100*(row["l4"]/ref["l4"]-1):.3f}%. Recalibrated dominant towers; physical uncertainty unquantified.',f'Caso 6: λ3 cambia {100*(row["l3"]/ref["l3"]-1):.3f}%; λ4 cambia {100*(row["l4"]/ref["l4"]-1):.3f}%. Torres dominantes recalibradas; incertidumbre física sin cuantificar.'))
    elif sid=='h3':
        data=DATA['ttbar'];values=data['value'];sigma=[math.sqrt(data['covariance'][i][i]) for i in range(15)]
        lows=data['bin_low_GeV'];highs=data['bin_high_GeV'];lo=math.floor(math.log10(min(v-s for v,s in zip(values,sigma))));hi=math.ceil(math.log10(max(v+s for v,s in zip(values,sigma))))
        X=lambda x:235+830*(x-lows[0])/(highs[-1]-lows[0]);Y=lambda v:775-440*(math.log10(v)-lo)/(hi-lo)
        text(d,(210,211),'CMS TOP-20-001 · 13 TeV · 137 fb⁻¹',31,TEAL,True)
        text(d,(210,267),'dσ/dm [pb/GeV] · '+T('logarithmic','logarítmico'),27,MUTED)
        for k in range(lo,hi+1):
            yy=Y(10**k);d.line((235,yy,1065,yy),fill='#d9ded6',width=1);text(d,(144,yy-13),f'10^{k}',23,MUTED)
        d.line((235,330,235,775,1070,775),fill=INK,width=2)
        for v in [250,1000,2000,3500]:text(d,(X(v)-25,790),str(v),23,MUTED)
        for i in range(min(15,math.ceil(15*min(1,p/.7)))):
            xx=X((lows[i]+highs[i])/2);yy=Y(values[i]);d.line((X(lows[i]),yy,X(highs[i]),yy),fill=BLUE,width=3);d.line((xx,Y(values[i]-sigma[i]),xx,Y(values[i]+sigma[i])),fill=BLUE,width=3);d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=TEAL)
        text(d,(480,844),'m(tt̄) [GeV]',27,MUTED)
        right([r'\sigma_i=\sqrt{C_{ii}}',r'\sigma_{\mathrm{bin}}\simeq x_i\,\Delta m_i'],T('Published parton-level full-phase-space e/μ+jets spectrum. Bars are marginal errors; compare only compatible predictions.','Espectro publicado a nivel de partones y espacio de fases completo, e/μ+jets. Barras de errores marginales; comparar solo predicciones compatibles.'))
    elif sid=='h4':
        C=np.array(DATA['ttbar']['covariance']);sig=np.sqrt(np.diag(C));rho=C/np.outer(sig,sig)
        x0,y0,side=250,245,540;cell=side/15
        text(d,(230,190),T('Experimental correlation ρ(i,j)','Correlación experimental ρ(i,j)'),31,TEAL,True)
        for i in range(15):
            for j in range(15):
                val=float(rho[i,j]);col=np.array(ImageColor.getrgb(TEAL if val>=0 else ORANGE));color=tuple(np.rint(255+(col-255)*min(1,abs(val))).astype(int))
                if i*15+j<225*min(1,p/.68):d.rectangle((x0+j*cell,y0+i*cell,x0+(j+1)*cell,y0+(i+1)*cell),fill=color)
        for v in [1,5,10,15]:text(d,(x0+(v-.5)*cell-10,y0+side+10),str(v),23,MUTED);text(d,(x0-40,y0+(v-.5)*cell-13),str(v),23,MUTED)
        text(d,(475,845),T('Interval j','Intervalo j'),27,MUTED);text(d,(150,225),'i',27,MUTED)
        for i in range(101):
            val=-1+i/50;col=np.array(ImageColor.getrgb(TEAL if val>=0 else ORANGE));color=tuple(np.rint(255+(col-255)*abs(val)).astype(int));d.rectangle((860,310+i*3,895,314+i*3),fill=color)
        for yy,label in [(300,'−1'),(450,'0'),(600,'+1')]:text(d,(915,yy),label,27,MUTED)
        right([r'\rho_{ij}=C_{ij}/\sqrt{C_{ii}C_{jj}}',r'C=L\,\mathrm{diag}(d_i)L^T,\ d_i>0',r'y=x/(w^Tx),\quad C_yw=0'],T('Exact rounded covariance: 15 positive pivots. After unit-area normalization, the first-order covariance has a null direction.','Covarianza redondeada exacta: 15 pivotes positivos. Tras normalizar el área, la covarianza de primer orden tiene una dirección nula.'))
    elif sid=='h5':
        entries=[(T('Rational identities','Identidades racionales'),T('10 Lean statements','10 enunciados Lean'),TEAL),(T('Published covariance','Covarianza publicada'),T('15 exact positive pivots','15 pivotes positivos exactos'),TEAL),(T('Logarithm derivatives','Derivadas del logaritmo'),T('3 pointwise enclosures','3 cotas puntuales'),BLUE),(T('Full integral + observed fit','Integral completa + ajuste observado'),T('Pending','Pendiente'),ORANGE)]
        for i,(title,value,color) in enumerate(entries):
            y=210+i*157;box(180,y,900,130,title,color)
            if p>i*.15:text(d,(210,y+72),value,29,color,True)
        right([r'\mathrm{identity}',r'\mathrm{numerical\ error}',r'\mathrm{physical\ prediction}'],T('Three different questions. A 7.4% quartic fit/table discrepancy is unresolved. Download assumptions and replay evidence.','Tres preguntas distintas. Sigue abierta una discrepancia del 7,4% entre ajuste cuártico y tabla. Descarga supuestos y evidencias reproducibles.'))

    caption=next((s for a,b,s in caps if a<=elapsed<b),'')
    if caption:
        lines=textwrap.wrap(caption,width=102)
        for i,line in enumerate(lines):
            tw=d.textlength(line,font=font(32));text(d,((W-tw)/2,961+i*42),line,32,'#ffffff')
    return im
