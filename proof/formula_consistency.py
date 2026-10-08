"""Independent Sage checks; mount /lab read-only and only the new /audit writable."""
import json
import hashlib
from fractions import Fraction
from pathlib import Path
from sage.all import (SR, QQ, ZZ, matrix, identity_matrix, diagonal_matrix,
                      var, cos, pi, log, zeta, diff, RealBallField, RealIntervalField)
from sage.version import version

ROOT = Path(__file__).resolve().parents[1]
out = {'sage': version, 'precision_bits': 192, 'checks': [], 'su7': []}
def check(name, condition, detail=None):
    ok=bool(condition)
    out['checks'].append({'name':name,'passed':ok,'detail':detail})
    if not ok:
        raise AssertionError(name)

# KLY eq. (33), differentiated independently, BEFORE any conversion to GeV.
a,n,Nf=var('a n Nf')
harmonic=(-3*cos(2*pi*n*a)+(4*Nf-6)*cos(pi*n*a))/n**5
c0=(diff(harmonic,a,2).subs(a=0)*n**3/pi**2).simplify_full()
check('KLY curvature at zero has coefficient 18-4Nf',c0==18-4*Nf,str(c0))
check('KLY printed 18-2Nf differs when Nf=1',c0.subs(Nf=1)==14 and 18-2!=14)

# Small-angle identity: exact algebra WITHIN the truncated expansion only.
x,D,A4,G=var('x D A4 G')
f=-zeta(3)*D*x**2/2+x**4*(G-A4*log(x))/24
g_stationary=6*zeta(3)*D/x**2+A4*log(x)+A4/4
fpp=diff(f,x,2).subs(G=g_stationary).simplify_full()
check('Small-angle curvature after stationarity',
      (fpp-(2*zeta(3)*D-A4*x**2/6)).simplify_full()==0,str(fpp))

# Fixed matrices at alpha=0 and alpha=1. Complexification of the su(3)
# Lie algebra has the same dimension as the real compact algebra.
p0=diagonal_matrix(QQ,[1,-1,-1])
p1_end=diagonal_matrix(QQ,[-1,1,-1])
base=[]
for i in range(3):
    for j in range(3):
        if i!=j:
            e=matrix(QQ,3,3);e[i,j]=1;base.append(e)
for i in [0,1]:
    e=matrix(QQ,3,3);e[i,i]=1;e[2,2]=-1;base.append(e)
def invariants(p1):
    cols=[(p0*b-b*p0).list()+(p1*b-b*p1).list() for b in base]
    M=matrix(QQ,cols).transpose()
    ker=M.right_kernel()
    mats=[sum((q*b for q,b in zip(v,base)),matrix(QQ,3,3)) for v in ker.basis()]
    return ker.dimension(),mats
d0,b0=invariants(p0);d1,b1=invariants(p1_end)
check('Endpoint alpha=1 reduces SU(3) model massless vectors from 4 to 2',d0==4 and d1==2,{'at_zero':int(d0),'at_one':int(d1)})
check('The two surviving generators commute: U(1)^2',all(u*v==v*u for u in b1 for v in b1))

# Coefficient transcription is taken from the lab data, so the interval
# result certifies THIS potential, not the correctness of its field content.
data=json.loads((ROOT/'data/su7_km25.json').read_text())
B=RealBallField(192);I=RealIntervalField(192);bp=B.pi();cut=512
def interval_string(v):
    q=I(v)
    return [str(q.lower()),str(q.upper())]
def atomize(terms):
    q={}
    for m,s,c in terms:
        k=(int(s),int(c));q[k]=q.get(k,QQ(0))+QQ(str(Fraction(str(m))))
    return [(m,s,c) for (s,c),m in q.items() if m]
def derivative(terms,alpha,k):
    total=B(0)
    for m,s,c in atomize(terms):
        sub=B(0)
        for nn in range(1,cut+1):
            arg=bp*c*nn*alpha
            trig=-arg.sin() if k==1 else -arg.cos()
            sub+=(-1 if s<0 and nn%2 else 1)*trig/B(nn)**(5-k)
        total+=B(m)*(bp*c)**k*sub
    rem=sum(B(abs(m))*(bp*c)**k for m,s,c in atomize(terms))/((4-k)*B(cut)**(4-k))
    return total,rem
def residual_interval(terms,center,halfwidth):
    center=B(str(center));h=B(str(halfwidth))
    f1,e1=derivative(terms,center,1);f2,e2=derivative(terms,center,2)
    m3=sum(B(abs(m))*(bp*c)**3 for m,s,c in atomize(terms))*bp**2/6
    radius=e1+h*(abs(f2)+e2)+m3*h**2/2
    # Endpoints of the interval include the Arb error in both center and radius.
    lo=I(f1-radius).lower();hi=I(f1+radius).upper()
    return I(lo,hi),{'finite_derivative':interval_string(f1),'fourier_tail_bound':interval_string(e1)}
for row in data['published_rows']:
    terms=list(data['gauge'])
    for f in row['bulk']:
        key='('+','.join('+' if p>0 else '-' for p in f['parities'])+')'
        terms.extend([[m*f['multiplicity'],s,c] for m,s,c in data['reps'][f['rep']][key]])
    r,details=residual_interval(terms,row['published']['alpha_min'],'0.0005')
    check('SU7 row '+row['label']+': no stationary point within rounding interval',0 not in r,str(r))
    out['su7'].append({'row':row['label'],'alpha_center':row['published']['alpha_min'],
      'alpha_halfwidth':'0.0005','Fprime_enclosure':[str(r.lower()),str(r.upper())],**details})

nad=5;k3=3;A=4*nad-3
mn=[[2*A+48,1,1],[6*A+48,-1,1],[A,1,2],[4*k3,-1,2]]
r,details=residual_interval(mn,'0.0305824','0.00000005')
check('Maru-Nago k3=3,Nad=5: printed alpha is not stationary for infinite sum',0 not in r,str(r))
out['maru']={'Fprime_enclosure':[str(r.lower()),str(r.upper())],**details}

# Relate the two live energy numbers to exact factors of zeta(5).
numeric=json.loads((ROOT/'data/formula_consistency_probe.json').read_text())
z5=B(5).zeta()
check('Direct HY-normalized KLY Nf=1 energy equals -5 zeta(5)/2',
      abs(B(numeric['normalization']['direct_V_over_C'])+5*z5/2)<B('1e-10'))
check('Corrected minimizer energy equals -5 zeta(5)/2',
      abs(B(numeric['normalization']['grid_reported'])+5*z5/2)<B('1e-10'))
out['scope']='Exact algebra and Lie algebra; Arb arithmetic plus analytic infinite Fourier remainder and Taylor bound. This does not certify global minima, all models, or field-content transcription.'
out['fourier_cutoff']=cut
out['passed']=len(out['checks'])
out['inputSHA256'] = hashlib.sha256((ROOT/'data/su7_km25.json').read_text().replace('\r\n','\n').encode()).hexdigest()
out['sources'] = ['https://arxiv.org/pdf/hep-ph/0401185','https://arxiv.org/pdf/hep-ph/0111327','https://arxiv.org/pdf/2405.07463','https://arxiv.org/html/2503.04090v1']
(ROOT/'data/formula_consistency_reference.json').write_text(json.dumps(out,indent=2)+'\n')
(ROOT/'src/modules/formula_consistency_reference.mjs').write_text('/* Generated by proof/formula_consistency.py; do not edit. */\nexport const FORMULA_CONSISTENCY = '+json.dumps(out,indent=2)+';\n')
print(json.dumps(out,indent=2),flush=True)
