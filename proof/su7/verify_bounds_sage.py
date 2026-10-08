"""Independent Arb replay of the lab's 21 conditional moment ceilings."""
import json
import sys
import hashlib
from fractions import Fraction
from pathlib import Path
from sage.all import QQ, RealBallField, RealIntervalField, var, diff, log
from sage.version import version

OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/results')
HERE=Path(__file__).resolve().parent
d=json.loads((HERE/'su7_km25.input.json').read_text())
input_path=OUT/'candidate_bounds.input.json'
cert=json.loads(input_path.read_text())
B=RealBallField(192);I=RealIntervalField(192)
checks=[]
def check(name,ok):
    checks.append({'name':name,'passed':bool(ok)})
    if not ok:raise AssertionError(name)
def coords(ts):
    a=k=u=v=QQ(0)
    for m,s,c in ts:
        m=QQ(str(Fraction(str(m))))
        k+=m*c*c*(8 if s==1 else -6)
        if s==1:
            a+=m*c**4
            if c==2:u+=16*m
            if c==3:v+=81*m
        else:u+=m*c**4
    return a,k,u,v
def G(t):
    a,k,u,v=t
    return B(a)*QQ(25)/12-B(u)*B(2).log()-B(v)*B(3).log()
gen=[coords(t) for r in d['reps'].values() for t in r.values()]
mw=B('80.4');g4=B('.63');z3=B(3).zeta()
mu0=4*B.pi()**2*123**2/(3*mw**2*g4**2)
mu1=4*B.pi()**2*127**2/(3*mw**2*g4**2)
rows=[]
for seed,group in cert['seeds'].items():
    base=coords(d['gauge_seeds'][seed]['gauge'])
    a0,k0,_,_=base
    check(seed+': positive denominator throughout mass window',(6*mu0+B(a0)).lower()>0)
    for row in group['rows']:
        lam,nu=map(QQ,row['dual'])
        for j,t in enumerate(gen):
            a,k,u,v=t
            exactzero=u==v==0 and a*QQ(25)/12-lam*a-nu*k==0
            check(f'{seed} {row["k8D"]}: dual generator {j}',exactzero or (G(t)-B(lam*a+nu*k)).lower()>=0)
        k=QQ(row['k8D']);a=QQ(row['firstExcludedA4']);cap=QQ(str(Fraction(str(row['A4cap']))))
        numerator=QQ(3)/2*k*z3;den=6*mu1+B(a)
        gap=B(a)*((numerator/den).log()/2+QQ(3)/4)+3*mu1-(G(base)+B(lam*(a-a0)+nu*(k-k0)))
        slope=(numerator/den).log()/2+QQ(3)/4-B(a)/(2*den)-B(lam)
        check(f'{seed} {k}: concave tail excluded',gap.upper()<0 and slope.upper()<0)
        check(f'{seed} {k}: lattice predecessor',a-cap==3 and (2*cap-k+3)%6==0)
        mass=2*B.pi()*mw*((6*mu1+B(cap))/numerator).sqrt()
        check(f'{seed} {k}: upper mass bound',mass.upper()<=B(str(row['upperGeV'])).lower())
        rows.append({'seed':seed,'k8D':int(k),'mass_interval':[str(I(mass).lower()),str(I(mass).upper())]})
a,mu,c,lam,nu=var('a mu c lam nu')
gap=a*(log(c/(6*mu+a))/2+QQ(3)/4)+3*mu-lam*a-nu
check('Exact second derivative proves concavity when mu>0 and 6mu+a>0',
      (diff(gap,a,2)+1/(2*(6*mu+a))+3*mu/(6*mu+a)**2).simplify_full()==0)
check('Exact mass-window monotonicity',
      (diff(gap,mu)-18*mu/(6*mu+a)).simplify_full()==0)
result={'sage':version,'passed':len(checks),'checks':checks,'certified_rungs':len(rows),'rows':rows,
        'inputSHA256':hashlib.sha256(input_path.read_bytes()).hexdigest(),
        'scope':'Conditional small-angle moment ceilings only; no promotion to a full-Fourier ceiling or attainment claim.'}
(OUT/'bounds_sage_verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':len(checks),'certified_rungs':len(rows)}),flush=True)
