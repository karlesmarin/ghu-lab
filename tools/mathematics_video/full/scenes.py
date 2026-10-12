"""Visible reasoning for profiles, exact traces, and conditional congruences."""
from whiteboard_core import *
import itertools
plan=json.loads((ROOT/'storyboard.json').read_text())
capture=json.loads((ROOT/'lab/capture.json').read_text())['records']
@lru_cache(None)
def lab(name):return Image.open(ROOT/'lab'/(name+'.png')).convert('RGB')
@lru_cache(None)
def heatmap():
    xx=np.linspace(-2,2,250);z=np.outer(xx[::-1],xx)/4
    pale=np.array((246,243,233));pos=np.array((198,85,33));neg=np.array((28,135,143))
    target=np.where((z<0)[:,:,None],neg,pos);t=np.abs(z)[:,:,None]
    rgb=(pale*(1-t)+target*t).astype('uint8')
    return Image.fromarray(rgb).resize((780,550),Image.Resampling.BILINEAR)
def words(d,x,y,lines,size=29,color=INK,gap=45):
    for j,line in enumerate(lines):text(d,(x,y+j*gap),line,size,color)
def lineplot(d,box,curves,xlim=(0,1),ylim=(-.6,1.2),xlabel='position u',ylabel='amplitude'):
    x,y,w,h=box;X=lambda u:x+w*(u-xlim[0])/(xlim[1]-xlim[0]);Y=lambda v:y+h-h*(v-ylim[0])/(ylim[1]-ylim[0])
    arrow(d,(x,y+h),(x+w+20,y+h),INK,2);arrow(d,(x,y+h),(x,y-20),INK,2)
    if ylim[0]<0<ylim[1]:dash(d,(x,Y(0)),(x+w,Y(0)),'#b9c8c7',2)
    for t in np.linspace(xlim[0],xlim[1],3):text(d,(X(t)-14,y+h+15),f'{t:g}',23,MUTED)
    for t in [ylim[0],ylim[1]]:text(d,(x-66,Y(t)-13),f'{t:g}',23,MUTED)
    text(d,(x+15,y-58),ylabel,25,MUTED);text(d,(x+w*.4,y+h+54),xlabel,24,MUTED)
    for xx,yy,col in curves:
        if len(xx)>1:d.line([(X(u),Y(v)) for u,v in zip(xx,yy)],fill=col,width=6)
    return X,Y
def matrix(im,d,vals,progress,x=245,y=308,cell=190):
    count=max(0,min(9,int(progress*10)))
    d.line((x-25,y-20,x-45,y-20,x-45,y+3*cell,x-25,y+3*cell),fill=INK,width=4)
    d.line((x+3*cell-12,y-20,x+3*cell+8,y-20,x+3*cell+8,y+3*cell,x+3*cell-12,y+3*cell),fill=INK,width=4)
    for i in range(3):
        for j in range(3):
            if i*3+j<count:
                col=ORANGE if (i,j) in [(0,2),(2,0)] else TEAL
                d.rounded_rectangle((x+j*cell-8,y+i*cell-8,x+j*cell+150,y+i*cell+110),radius=12,fill='#fffdf7')
                eq(im,(x+j*cell+35,y+i*cell+18),vals[i][j],38,col)
def surface(im,d,M,phase=0):
    # First component of the middle profile: e^(M z), on a unit square.
    angle=.68+.13*ease(phase)
    def P(y,z,g):return (570+380*(y*np.cos(angle)-z*np.sin(angle)),680+150*(y*np.sin(angle)-z*np.cos(angle))-155*(g-1))
    grid=np.linspace(0,1,13)
    for j in range(11,-1,-1):
        for i in range(11,-1,-1):
            a,b=grid[i:i+2];c,e=grid[j:j+2]
            pts=[P(a,c,np.exp(M*c)),P(b,c,np.exp(M*c)),P(b,e,np.exp(M*e)),P(a,e,np.exp(M*e))]
            q=(np.exp(M*(c+e)/2)-1)/(np.e-1);col=(round(202-142*q),round(229-92*q),round(226-60*q))
            d.polygon(pts,fill=col,outline='#608d94')
    origin=P(0,0,1)
    arrow(d,origin,P(1.25,0,1),INK,3);arrow(d,origin,P(0,1.25,1),INK,3);arrow(d,origin,P(0,0,3),INK,3)
    for label,pos in [('y',P(1.32,0,1)),('z',P(0,1.36,1)),('amplitude',P(0,0,3.2))]:text(d,(pos[0]-10,pos[1]-15),label,27,MUTED)
    for value in [1,2]:
        px,py=P(0,0,value);d.line((px-8,py,px+8,py),fill=INK,width=2);text(d,(px-39,py-14),str(value),23,MUTED)
    text(d,(180,218),'First component of the middle profile',31,INK,True)
    eq(im,(180,282),rf'g(y,z)=e^{{Mz}},\quad M={M:.2f}',29,BLUE)
    text(d,(160,859),'Unit square: 0 ≤ y,z ≤ 1. Fixed amplitude scale.',25,MUTED)
def clock(d,cx,cy,r,mod,N,label):
    d.ellipse((cx-r,cy-r,cx+r,cy+r),outline='#c4d1cb',width=4)
    for k in range(mod):
        t=-np.pi/2+2*np.pi*k/mod;x=cx+r*np.cos(t);y=cy+r*np.sin(t);active=k==N%mod
        d.ellipse((x-18,y-18,x+18,y+18),fill=TEAL if active else '#fffdf7',outline=TEAL if active else MUTED,width=2)
        xx=cx+(r+48)*np.cos(t);yy=cy+(r+48)*np.sin(t);text(d,(xx-13,yy-18),str(k),27,TEAL if active else MUTED,active)
    t=-np.pi/2+2*np.pi*(N%mod)/mod;arrow(d,(cx,cy),(cx+(r-28)*np.cos(t),cy+(r-28)*np.sin(t)),TEAL,6)
    text(d,(cx-100,cy+r+86),label,28,INK,True)
def frame(si,p,elapsed,caps):
    scene=plan['scenes'][si];sid=scene['id'];im=base.copy();d=ImageDraw.Draw(im)
    text(d,(78,29),'GHU LAB  /  '+scene['section'].upper(),22,TEAL,True)
    fs=46
    while d.textlength(scene['title'],font=font(fs,True))>1420:fs-=1
    group=[s for s in plan['scenes'] if s['section']==scene['section']]
    text(d,(78,67),scene['title'],fs,INK,True);text(d,(1660,74),f'{group.index(scene)+1} / {len(group)} · EN',22,MUTED)
    d.rounded_rectangle((1215,182,1835,889),radius=22,fill='#fffdf7',outline='#d4dcd5',width=2)
    u=np.linspace(0,1,201);growth=ease(p/.78)
    if sid=='p1':
        n=max(2,round(201*ease(p/.7)))
        lineplot(d,(160,300,900,175),[(u[:n],np.ones(n),TEAL),(u[:n],u[:n],ORANGE)],ylim=(0,1.2),ylabel='upper component')
        lineplot(d,(160,660,900,155),[(u[:n],np.ones(n),BLUE)],ylim=(0,1.2),ylabel='lower component')
        for j,(formula,color) in enumerate([(r'f_1(u)=(1,0)',TEAL),(r'f_2(u)=(0,1)',BLUE),(r'f_3(u)=(u,0)',ORANGE)]):
            if p>j*.15:eq(im,(1260,240+j*145),formula,32,color,reveal=ease((p-j*.15)/.12))
        words(d,1250,735,['Two components at a point.','Three functions on an interval.'],27)
    elif sid in ('p2','p4'):
        y=u-.5
        if sid=='p2':
            X,Y=lineplot(d,(160,330,900,390),[(u,y,ORANGE)],ylim=(-.6,.6),ylabel='residual: upper component')
            pos=.5 if p<.25 else .5+.43*np.sin(ease((p-.25)/.65)*2*np.pi)
            dash(d,(X(pos),Y(0)),(X(pos),Y(pos-.5)),RED,4);d.ellipse((X(pos)-11,Y(pos-.5)-11,X(pos)+11,Y(pos-.5)+11),fill=RED)
            eq(im,(1250,234),r'f_3-\frac12 f_1=(u-\frac12,0)',27,ORANGE)
            text(d,(1250,386),f'u = {pos:.3f}',34,INK,True);text(d,(1250,450),f'residual = {pos-.5:+.3f}',33,RED if abs(pos-.5)>.01 else TEAL,True)
            if p>.42:words(d,1250,612,['A fixed combination must vanish','at EVERY position.'],27)
        else:
            X,Y=lineplot(d,(160,320,900,420),[],ylim=(0,.3),ylabel='squared amplitude')
            v=ease(p/.67);xx=u[u<=v];yy=(xx-.5)**2
            if len(xx)>1:d.polygon([(X(0),Y(0))]+[(X(a),Y(b)) for a,b in zip(xx,yy)]+[(X(v),Y(0))],fill='#bbded6');d.line([(X(a),Y(b)) for a,b in zip(xx,yy)],fill=TEAL,width=6)
            eq(im,(1250,235),r'c=(-\frac12,0,1)',31,ORANGE)
            if p>.18:eq(im,(1250,370),r'c^*Gc=\int_0^1(u-\frac12)^2du',27,TEAL)
            if p>.55:eq(im,(1250,497),r'=\frac1{12}>0',40,TEAL,reveal=ease((p-.55)/.14))
            if p>.7:words(d,1250,663,['Zero norm ⇔ zero function.','ker G = dependence relations.','rank G = dimension of the span.'],25)
    elif sid=='p3':
        eq(im,(165,211),r'G_{ij}=\int_0^1 f_i(u)^* f_j(u)\,du',32,INK)
        matrix(im,d,[['1','0',r'\frac12'],['0','1','0'],[r'\frac12','0',r'\frac13']],growth)
        eq(im,(1250,246),r'G_{13}=\int_0^1u\,du=\frac12',29,ORANGE)
        if p>.34:words(d,1250,430,['Overlap is allowed.','Dependence would make G singular.'],26)
        if p>.68:eq(im,(1250,606),r'\det G=\frac1{12}>0',33,TEAL,reveal=ease((p-.68)/.12))
        if p>.8:text(d,(1250,780),'Three independent functions.',28,TEAL,True)
    elif sid in ('p5','p6'):
        M=ease((p-.2)/.6) if sid=='p5' else (1 if p<.78 else 1-ease((p-.78)/.12));surface(im,d,M,p)
        if sid=='p5':
            for j,(s,col) in enumerate([(r'f_0=(1,1)e^{My}',TEAL),(r'f_{\pi/2}=(1,i)e^{Mz}',BLUE),(r'f_{\pi}=(1,-1)e^{-My}',ORANGE)]):eq(im,(1250,242+j*145),s,29,col)
            if p>.6:words(d,1250,737,['For M > 0, the middle profile','changes in the z direction.'],27,BLUE)
        else:
            eq(im,(1250,232),r'af_0+bf_{\pi/2}+cf_\pi=0',26,INK)
            if p>.14:eq(im,(1250,366),r'\partial_z:\quad bM(1,i)e^{Mz}=0',25,BLUE)
            if .35<p<.78:
                eq(im,(1250,511),r'M\ne0\quad\Rightarrow\quad b=0',28,TEAL)
                eq(im,(1250,630),r'(1,1),(1,-1)\quad\Rightarrow\quad a=c=0',24,TEAL)
            if p>.78:words(d,1250,558,['At M = 0 the derivative vanishes.','The three constant profiles','span only two directions.'],28,ORANGE)
    elif sid=='p7':
        idx=min(20,round(20*ease((p-.1)/.7)));rec=next(r for r in capture if r['kind']=='gram' and r['frame']==idx)
        fit(im,lab('gram-'+str(idx)),(95,255,1080,495));text(d,(108,206),'ACTUAL GRAM EIGENVALUES',27,TEAL,True)
        fit(im,lab('mass-'+str(idx)),(1245,235,550,130));d.rounded_rectangle((1240,225,1805,380),radius=12,outline=ORANGE,width=4)
        text(d,(1250,425),f'M = {idx/20:.2f}',34,ORANGE,True)
        eq(im,(1250,505),rf'\lambda_{{\min}}\approx{max(0,rec["result"]["values"][0]):.6f}',30,BLUE)
        if p>.7:words(d,1250,654,['At M = 1: an exact interval proof','also gives λmin > 0.1105.'],26,TEAL)
        words(d,145,784,['Raw eigenvalues depend on profile normalization.','Numerical rank also depends on a tolerance.'],26,MUTED)
    elif sid=='p8':
        xx=np.linspace(0,1,160);rates=[-2,-1,1,2];colors=[BLUE,TEAL,ORANGE,RED];curves=[]
        for j,r in enumerate(rates):
            n=max(2,round(len(xx)*ease((p-j*.12)/.35)));curves.append((xx[:n],np.exp(r*xx[:n]),colors[j]))
        lineplot(d,(155,300,900,450),curves,ylim=(0,8),xlabel='line parameter t',ylabel='exp(r t), distinct rates r')
        eq(im,(1250,240),r'\det V=\prod_{i<j}(r_j-r_i)',30,INK)
        if p>.3:words(d,1250,370,['Rates: −2, −1, 1, 2'],29)
        if p>.5:eq(im,(1250,452),r'\det V=72\ne0',35,TEAL)
        if p>.68:words(d,1250,621,['Arbitrarily large finite sets','are possible in this ansatz.','','Physical multiplicity requires','the actual operator domain.'],26)
    elif sid=='t1':
        count=min(512,int(512*growth));weights=[s for s in itertools.product([-1,1],repeat=10) if math.prod(s)==1]
        for i in range(512):
            x=140+(i%32)*29;y=335+(i//32)*29;d.ellipse((x,y,x+14,y+14),fill=TEAL if i<count else '#dbe1da')
        text(d,(150,235),f'{count} / 512 allowed weights',36,TEAL,True)
        sign=weights[max(0,count-1)]
        for j,s in enumerate(sign):
            x=1250+j*53;d.rounded_rectangle((x,265,x+45,320),radius=7,fill='#f9e2b9' if j==9 else '#dcece4');text(d,(x+8,273),'+' if s>0 else '−',32,INK,True)
        words(d,1250,371,['Nine free signs.','The last sign fixes positive parity.'],26)
        eq(im,(1250,529),r'w=\frac12(s_1,\ldots,s_{10})',28,BLUE)
        if p>.58:eq(im,(1250,651),r'\prod_i s_i=1,\quad 2^9=512',30,TEAL)
    elif sid=='t2':
        count=round(128*growth);q=[-1.5,-.5,.5,1.5];lam=[1,-1,-1,1]
        text(d,(160,224),'h = (1, 2, 0, …, 0)',34,INK,True);dash(d,(140,620),(1110,620),MUTED,3)
        for j in range(4):
            x=205+j*230;value=count*lam[j]*q[j]**2;h=abs(value)*.8
            d.rectangle((x,620-h if value>=0 else 620,x+110,620 if value>=0 else 620+h),fill=TEAL if value>=0 else ORANGE)
            text(d,(x-22,704),f'q = {q[j]:g}',28,INK);text(d,(x-22,752),f'λ = {lam[j]:+}',27,MUTED);text(d,(x-22,805),f'{value:+g}',30,TEAL if value>=0 else ORANGE,True)
        eq(im,(1250,242),r'q=w\cdot h,\quad\lambda=s_1s_2',29,BLUE)
        text(d,(1250,366),f'{count} weights in each group',28,MUTED)
        eq(im,(1250,455),r'T_2=\sum_w\lambda(w)q(w)^2',29,INK)
        eq(im,(1250,590),rf'S_{{\mathrm{{partial}}}}={count*4}' if count<128 else r'T_2=512',36,TEAL)
        if p>.75:words(d,1250,733,['128 × (9/4 − 1/4 − 1/4 + 9/4)','= 512, exactly.'],26)
    elif sid=='t3':
        text(d,(180,210),'Coefficients of hi hj  (i ≤ j)',31,INK,True);limit=round(55*growth);n=0
        for i in range(10):
            text(d,(137,306+i*50),str(i+1),23,MUTED);text(d,(198+i*84,262),str(i+1),23,MUTED)
            for j in range(i,10):
                x=180+j*84;y=303+i*50;active=n<limit;special=i==0 and j==1
                d.rounded_rectangle((x,y,x+77,y+43),radius=5,fill=('#f9d398' if special else '#dbece5') if active else '#e6e6dc',outline='#bdcec8')
                if active:text(d,(x+7,y+6),'256' if special else '0',25,ORANGE if special else TEAL,special)
                n+=1
        text(d,(175,847),f'{limit} / 55 coefficients checked',28,TEAL,True)
        eq(im,(1250,233),r'T_2=\frac14\sum_s s_1s_2\left(\sum_i s_i h_i\right)^2',24,INK)
        if p>.33:words(d,1250,406,['Diagonal terms cancel.','All other cross terms cancel.'],26)
        if p>.63:eq(im,(1250,570),r'T_2(h)=256h_1h_2',33,ORANGE,reveal=ease((p-.63)/.13))
        if p>.82:words(d,1250,744,['Exact rational coefficients.','An identity for every probe h.'],26,TEAL)
    elif sid=='t4':
        im.paste(heatmap(),(215,278))
        X=lambda u:215+(u+2)/4*780;Y=lambda v:278+(2-v)/4*550
        dash(d,(X(0),278),(X(0),828),INK,2);dash(d,(215,Y(0)),(995,Y(0)),INK,2)
        for v in [-2,0,2]:text(d,(X(v)-10,837),str(v),24,MUTED);text(d,(165,Y(v)-12),str(v),24,MUTED)
        text(d,(565,881),'h1',25,INK);text(d,(150,234),'h2',25,INK);text(d,(310,207),'T2 = 256 h1 h2',34,INK,True)
        u=ease((p-.3)/.4);v=2;d.ellipse((X(u)-13,Y(v)-13,X(u)+13,Y(v)+13),fill=BG,outline=INK,width=4)
        words(d,1250,245,['Fixed colour range:','−1024  →  0  →  +1024'],26,MUTED)
        eq(im,(1250,410),rf'h=({u:.2f},2)',34,INK);eq(im,(1250,510),rf'T_2={512*u:.1f}',39,ORANGE)
        if p>.6:words(d,1250,680,['A zero at one point','is not the zero polynomial.'],29,RED)
    elif sid=='t5':
        mask=3 if p<.6 else (31 if p<.8 else 991)
        fit(im,lab('trace-'+str(mask)),(95,305,1080,425));text(d,(115,219),'ACTUAL EXACT TRACE TABLE',29,TEAL,True)
        fit(im,lab('insertion-'+str(mask)),(1250,236,540,170));d.rounded_rectangle((1240,224,1805,420),radius=12,outline=ORANGE,width=4)
        words(d,145,793,['Fixed lab probe: (1, 2, 1, 0, −1, 1, 0, 1, −1, 2).'],25,MUTED)
        eq(im,(1250,489),r'T_2=512' if mask==3 else r'T_2=0',40,TEAL)
        words(d,1250,651,['Insertion changes the sum.','','Physical anomaly coefficients','need further ingredients.'],27)
    elif sid=='t6':
        rows=[('Representation weights','specified'),('Inserted trace polynomial','computed exactly'),('Normalized local anomaly','further input needed'),('Complete quantum consistency','open')]
        for j,(label,status) in enumerate(rows):
            y=210+j*161;d.rounded_rectangle((180,y,1080,y+114),radius=16,fill='#dcece4' if j<2 else '#ece8dc',outline=TEAL if j<2 else MUTED,width=2)
            text(d,(220,y+18),label,32,INK,True);text(d,(220,y+67),status,24,TEAL if j<2 else MUTED)
            if j<3:arrow(d,(630,y+117),(630,y+152),ORANGE,4)
        y=252+161*ease(p/.38);d.ellipse((1130,y-16,1162,y+16),fill=ORANGE)
        words(d,1250,237,['The certificate reaches','the stated finite polynomial.'],29,TEAL)
        if p>.3:words(d,1250,426,['Still required:', '• projectors and normalization','• descent and other sectors','• global charge data','• anomaly inflow'],27,gap=65)
    elif sid in ('c1','c2','c3'):
        if sid=='c1':n=min(3,int(p*4));N=2*n;label='N = 2 × number of families'
        elif sid=='c2':n=min(9,1+int(p*9));N=4*n;label='same lepton chirality: N = 4n'
        else:n=1 if p<.45 else 2;N=2 if n==1 else 6;label='mixed assignments: 2 + 4 = 6'
        clock(d,630,525,238,6,N,label);text(d,(430,167),f'N = {N}     residue = {N%6}',32,TEAL if N%6==0 else ORANGE,True)
        if sid=='c1':
            eq(im,(1250,236),r'N\equiv0\ (\mathrm{mod}\ 6)',31,INK)
            if p>.18:eq(im,(1250,392),r'3+(-1)=2',37,ORANGE)
            words(d,1250,539,[f'{n} identical families',f'N = {N}',f'Residue = {N%6}'],32,TEAL if N%6==0 else RED,gap=66)
            text(d,(160,902),'Restricted standalone 6D SU(2) tensor condition.',24,MUTED)
        elif sid=='c2':
            eq(im,(1250,236),r'N=n(3+1)=4n',32,INK)
            words(d,1250,382,[f'n = {n}  →  residue {N%6}'],31,TEAL if N%6==0 else RED)
            for j,num in enumerate([3,6,9]):
                d.rounded_rectangle((1260+j*175,509,1408+j*175,596),radius=12,fill='#cbe4d8');text(d,(1300+j*175,521),str(num),43,TEAL,True)
            words(d,1250,692,['These are all allowed by this test.','Exactly three is not selected.'],26)
        else:
            words(d,1250,237,['Family A: opposite chirality','contributes 3 − 1 = 2'],28)
            if p>.35:words(d,1250,408,['Family B: same chirality','contributes 3 + 1 = 4'],28,ORANGE)
            if p>.47:eq(im,(1250,596),r'2+4=6\equiv0\ (\mathrm{mod}\ 6)',29,TEAL)
            if p>.69:words(d,1250,750,['A counterexample to the inference.','Not a complete physical model.'],25,MUTED)
    elif sid=='c4':
        N=[0,2,4,6][min(3,int(p*4))]
        clock(d,355,510,160,6,N,'complex units');clock(d,925,510,160,12,2*N,'half-doublet units')
        text(d,(225,231),f'N = {N}',37,TEAL,True);text(d,(785,231),f'2N = {2*N}',37,TEAL,True)
        eq(im,(1250,240),r'N\equiv0\ (\mathrm{mod}\ 6)',29,INK)
        eq(im,(1250,365),r'\Longleftrightarrow',36,TEAL)
        eq(im,(1250,468),r'2N\equiv0\ (\mathrm{mod}\ 12)',29,INK)
        if p>.53:words(d,1250,664,['Tensor quantization adds','integral global information.','Polynomial factorization alone','is not the entire argument.'],26)
        text(d,(170,840),'The count and its modulus scale together.',28,TEAL,True)
    elif sid=='c5':
        n=min(6,1+int(p*6));N=2*n
        text(d,(115,222),'ACTUAL LABORATORY RESULT',29,TEAL,True);fit(im,lab('family-'+str(n)),(100,335,1080,360))
        fit(im,lab('number-'+str(n)),(1250,235,540,160));d.rounded_rectangle((1240,226,1805,409),radius=12,outline=ORANGE,width=4)
        words(d,1250,470,[f'N = 2 × {n} = {N}',f'Residue modulo 6 = {N%6}'],29)
        text(d,(1250,650),'PASSES THIS TEST' if N%6==0 else 'FAILS THIS TEST',29,TEAL if N%6==0 else RED,True)
        words(d,140,784,['Identical family assignments. Opposite lepton chirality.','No verdict on the full higher-dimensional theory.'],26,MUTED)
    elif sid=='s1':
        rows=[('Boundary operator','Allowed normal modes'),('Gram matrix','Independent profiles'),('Inserted trace','An exact polynomial'),('Residue condition','Restricted assignments')]
        for j,(a,b) in enumerate(rows):
            if p>j*.18:
                y=245+j*145;text(d,(150,y),a,34,TEAL,True);arrow(d,(500,y+27),(630,y+27),ORANGE);text(d,(680,y),b,31,INK)
        if p>.38:words(d,1250,242,['These are separate diagnostics.','','Further physical questions:','• compatible domains','• complete anomaly cancellation','• Higgs vacuum and flavour','• neutrino masses'],26,gap=63)
    elif sid=='s2':
        rows=[('1','Run GHU Lab','Change inputs. Inspect the result.'),('2','Read the ordinary proofs','Follow the analytic assumptions.'),('3','Run the certificate checker','Recompute 113 stated checks.'),('4','Read the primary papers','Check scope and conventions.')]
        for j,(n,a,b) in enumerate(rows):
            if p>j*.17:
                y=230+j*147;d.ellipse((125,y,179,y+54),fill=TEAL);text(d,(142,y+6),n,28,'white',True);text(d,(210,y),a,32,INK,True);text(d,(210,y+53),b,25,MUTED)
        words(d,1250,245,['Primary literature','Fujimoto et al. · 1609.01413','Asaka et al. · hep-ph/0209144','Dobrescu–Poppitz · hep-ph/0102010','Lee–Tachikawa · 2012.11622'],24,gap=75)
        if p>.63:words(d,1250,690,['Ordinary proofs + executable checks.','No proof-assistant formalization.'],25,TEAL)
        text(d,(140,858),'karlesmarin.github.io/ghu-explorer/video/mathematics/index.html',25,TEAL,True)
    caption=next((s for a,b,s in caps if a<=elapsed<b),'')
    for j,line in enumerate(textwrap.wrap(caption,88)[:2]):
        width=d.textlength(line,font=font(32));text(d,((W-width)/2,961+j*43),line,32,'#ffffff')
    return im
