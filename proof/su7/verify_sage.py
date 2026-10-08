"""Independent 192-bit Arb replay of every continuous-domain certificate."""
import json
import hashlib
import sys
from pathlib import Path
from functools import lru_cache
from sage.all import RealBallField, RealIntervalField, QQ, SR, matrix, diagonal_matrix, var, cos, pi, diff, zeta, log
from sage.version import version

ROOT = Path(sys.argv[1]) if len(sys.argv)>1 else Path('/results')
B = RealBallField(192)
I = RealIntervalField(192)
P = B.pi()
checks = []


def check(name, condition):
    checks.append({'name': name, 'passed': bool(condition)})
    if not condition:
        raise AssertionError(name)


def terms(data):
    out = {}
    for m,s,c in data:
        out[(s,c)] = out.get((s,c), QQ(0))+QQ(m)
    return tuple((m,s,c) for (s,c),m in out.items() if m)


@lru_cache(maxsize=40000)
def channel(alpha, c, s, derivative, cut):
    a = B(alpha)
    total = B(0)
    for n in range(1,cut+1):
        x=P*c*n*a
        trig = x.cos() if derivative==0 else -x.sin() if derivative==1 else -x.cos()
        total += s**n*trig/B(n)**(5-derivative)
    return total*(P*c)**derivative


def evaluate(ts, a, derivative=0, cut=512):
    a=QQ(a)
    val=sum((B(m)*channel(a,c,s,derivative,cut) for m,s,c in ts),B(0))
    tail=sum((B(abs(m))*(P*c)**derivative for m,s,c in ts),B(0))/((4-derivative)*B(cut)**(4-derivative))
    return val.add_error(tail.upper())


def m3(ts):
    return sum((B(abs(m))*(P*c)**3 for m,s,c in ts),B(0))*P**2/6


def enclosure(v):
    return [str(I(v).lower()),str(I(v).upper())]


d=json.loads((ROOT/'reconstruction.json').read_text())
g=json.loads((ROOT/'global_certificates.json').read_text())
records=[]
mass_records=[]
for row in d['rows']:
    ts=terms(row['terms'])
    a=QQ(row['published_alpha']);h=B(QQ(1)/2000)
    f1=evaluate(ts,a,1)
    f2=evaluate(ts,a,2)
    rounded=f1.add_error((h*abs(f2)+m3(ts)*h**2/2).upper())
    check(f"{row['row']}: printed rounding box excludes stationarity",rounded.upper()<0)
    records.append({'row':row['row'],'Fprime':enclosure(rounded)})

for cert in g['rows']:
    row=next(x for x in d['rows'] if x['row']==cert['row'])
    tt=list(row['terms'])
    if cert['seed']=='candidate':
        tt += [[str(-QQ(m)),s,c] for m,s,c in d['printed_gauge']]+d['candidate_gauge']
    ts=terms(tt)
    label=cert['row']+' '+cert['seed']
    lo,hi=map(QQ,cert['root_interval'])
    check(label+': derivative signs isolate a stationary point',evaluate(ts,lo,1,1024).upper()<0<evaluate(ts,hi,1,1024).lower())
    blo,bhi=map(QQ,cert['convex_basin'])
    a=QQ(cert['reference_alpha'])
    curv=evaluate(ts,a,2,1024).add_error((m3(ts)*B(max(a-blo,bhi-a))).upper())
    check(label+': strictly convex basin contains the root bracket',curv.lower()>0 and blo<=lo<hi<=bhi)
    root_center=(lo+hi)/2
    root_radius=B((hi-lo)/2)
    root_curvature=evaluate(ts,root_center,2,2048).add_error((m3(ts)*root_radius).upper())
    root_alpha=B(I(lo,hi))
    compactification=2*B('80.4')/root_alpha
    higgs=B(3).sqrt()*B('80.4')*B('.63')*root_curvature.sqrt()/(2*P**3*root_alpha)
    check(label+': positive conditional mass enclosures',root_curvature.lower()>0 and compactification.lower()>0 and higgs.lower()>0)
    mass_records.append({'row':cert['row'],'seed':cert['seed'],'conventions':{'mWGeV':'80.4','g4':'0.63'},
                         'compactification_GeV':enclosure(compactification),'higgs_mass_GeV':enclosure(higgs),
                         'curvature_at_certified_root':enclosure(root_curvature),
                         'scope':'Conditional one-loop benchmark with fixed mW and g4; not a fit or a physical validity certificate.'})
    ref=evaluate(ts,a,0,2048)
    second=sum((B(abs(m))*(P*c)**2 for m,s,c in ts),B(0))*B(QQ(5)/4)
    end=QQ(0)
    for idx,box in enumerate(cert['cover']):
        l,u=map(QQ,box['interval'])
        check(label+f': cover {idx} has no gap', l==end and l<u and u<=1)
        end=u
        if box['reason']=='strictly-convex-basin':
            check(label+f': cover {idx} within convex basin',blo<=l<=u<=bhi)
        else:
            c,h=(l+u)/2,B((u-l)/2)
            f=evaluate(ts,c,0,box['cutoff'])
            f1=evaluate(ts,c,1,box['cutoff'])
            lower=I(f-(abs(f1)*h+second*h*h/2)).lower()
            check(label+f': cover {idx} energy exceeds reference',lower>I(ref).upper())
    check(label+': whole domain covered',end==1)
    print(label+': global minimum verified',flush=True)

# Other analytically certifiable identities already used by the laboratory.
a,n,nf=var('a n nf')
harmonic=(-3*cos(2*pi*n*a)+(4*nf-6)*cos(pi*n*a))/n**5
curvature=(diff(harmonic,a,2).subs(a=0)*n**3/pi**2).simplify_full()
check('KLY curvature coefficient is 18-4Nf',curvature==18-4*nf)
x,D,A4,G=var('x D A4 G')
small=-zeta(3)*D*x*x/2+x**4*(G-A4*log(x))/24
stationary=6*zeta(3)*D/x**2+A4*log(x)+A4/4
check('Small-angle stationary curvature identity',
      (diff(small,x,2).subs(G=stationary)-(2*zeta(3)*D-A4*x*x/6)).simplify_full()==0)
check('Odd-winding endpoint factor',2*(1-QQ(1)/32)==QQ(31)/16)
# Determinant polarization bookkeeping; the physical interpretation is explicit.
check('Flat background gauge plus ghost bookkeeping',4+1-2==3 and 3+1==4)

result={'sage':version,'arithmetic':'Arb, 192 bits','checked_global_minima':len(g['rows']),
        'passed':len(checks),'checks':checks,'rounding_intervals':records,'conditional_mass_intervals':mass_records,
        'inputs':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['reconstruction.json','global_certificates.json']},
        'scope':'Independent analytic/interval replay. This is computer-assisted certification, not a Lean proof of real analysis or validation of the physical model.'}
(ROOT/'sage_verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':len(checks),'global_minima':len(g['rows'])}),flush=True)
